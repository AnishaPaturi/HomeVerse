import argparse
import json
import math
import os
import sys
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from transformers import ViTModel, ViTConfig
from scipy.optimize import linear_sum_assignment

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

from floorplan_dataset import (
    FloorplanDataset,
    collate_fn,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    ID2LABEL,
    LABEL2ID,
)
from segmentation_head import (
    compute_mask_loss,
    extract_room_geometry_from_mask,
)
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
    box_xyxy_to_cxcywh,
    box_iou,
    generalized_box_iou,
)
from run_experiment_f1_fpn import (
    ViTFeaturePyramidNetwork,
    classify_topology,
)
from run_experiment_f2 import (
    select_balanced_split,
    InMemoryDataset,
    collate_fn_with_meta,
    safe_torch_save,
)


def inverse_sigmoid(x, eps=1e-5):
    """Numerically stable inverse sigmoid function."""
    x = x.clamp(min=eps, max=1.0 - eps)
    return torch.log(x / (1.0 - x))


def build_box_head(hidden_dim=768, mlp_dim=256):
    """3-layer MLP predicting 4D raw coordinate deltas / logits."""
    return nn.Sequential(
        nn.Linear(hidden_dim, mlp_dim),
        nn.ReLU(),
        nn.Linear(mlp_dim, mlp_dim),
        nn.ReLU(),
        nn.Linear(mlp_dim, 4),
    )


# =====================================================================
# Model Architecture: MultiTaskViT384FPNRefine (G3-C)
# =====================================================================

class MultiTaskViT384FPNRefine(nn.Module):
    """
    Experiment G3-C: Multi-Scale ViT-FPN with Two-Scale Query Pathway
    and Iterative Bounding-Box Refinement:
      - 20 Global Queries: Attending to ViT Block 12 patch representations (stride 16, 24x24)
      - 20 High-Resolution Queries: Attending to FPN P8 feature map (stride 8, 48x48)
      - Decoder Layer 0: Produces initial bounding boxes b^(0) = sigmoid(bbox_head_0(hs_0))
      - Decoder Layer 1: Predicts delta corrections Delta b^(1) = bbox_head_1(hs_1)
        and updates coordinates via inverse-sigmoid:
        b^(1) = sigmoid(logit(b^(0).detach()) + Delta b^(1))
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-384",
                 img_size=384, num_queries_global=20, num_queries_highres=20,
                 num_classes=NUM_ROOM_CLASSES, decoder_layers=2):
        super().__init__()
        self.img_size = img_size
        self.num_queries_global = num_queries_global
        self.num_queries_highres = num_queries_highres
        self.total_queries = num_queries_global + num_queries_highres
        self.num_classes = num_classes
        self.patch_size = 16
        self.grid_size = (img_size // self.patch_size, img_size // self.patch_size)

        # ViT-384 Encoder
        try:
            self.encoder = ViTModel.from_pretrained(pretrained_model_name)
        except Exception:
            config = ViTConfig(image_size=img_size, patch_size=16, hidden_size=768)
            self.encoder = ViTModel(config)

        hidden_dim = self.encoder.config.hidden_size  # 768

        # 1. Log-Scale Head (CLS token -> log(px/m))
        self.scale_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )
        nn.init.constant_(self.scale_head[-1].bias, 4.0)

        # 2. Multi-Scale Feature Pyramid Network
        self.fpn = ViTFeaturePyramidNetwork(in_dim=hidden_dim, fpn_dim=128)

        # 3. High-Resolution Feature Projection (P8 stride 8: 128 -> hidden_dim 768)
        self.p8_proj = nn.Sequential(
            nn.Conv2d(128, hidden_dim, kernel_size=1),
            nn.GroupNorm(8, hidden_dim),
            nn.GELU(),
        )

        # 4. Pathway A: 20 Global Queries & Decoder
        self.query_embed_global = nn.Embedding(num_queries_global, hidden_dim)
        dec_layer_global = nn.TransformerDecoderLayer(
            d_model=hidden_dim, nhead=8, dim_feedforward=2048, dropout=0.1,
            activation="relu", batch_first=True
        )
        self.decoder_global = nn.TransformerDecoder(dec_layer_global, num_layers=decoder_layers)

        # 5. Pathway B: 20 High-Resolution Queries & Decoder
        self.query_embed_highres = nn.Embedding(num_queries_highres, hidden_dim)
        dec_layer_highres = nn.TransformerDecoderLayer(
            d_model=hidden_dim, nhead=8, dim_feedforward=2048, dropout=0.1,
            activation="relu", batch_first=True
        )
        self.decoder_highres = nn.TransformerDecoder(dec_layer_highres, num_layers=decoder_layers)

        # 6. Iterative BBox Regression Heads: Layer 0 and Layer 1
        self.bbox_head_0 = build_box_head(hidden_dim, 256)
        self.bbox_head_1 = build_box_head(hidden_dim, 256)

        # 7. Classification and Mask Heads (Final Layer Supervision)
        self.class_head = nn.Linear(hidden_dim, num_classes + 1)
        self.query_mask_proj = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 64),
        )
        self.semantic_head = nn.Sequential(
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, num_classes + 1, kernel_size=1),
        )

    def forward_with_features(self, cls_token, f6, f9, f12):
        bs = cls_token.size(0)

        # 1. Log-Scale prediction
        pred_log_scale = self.scale_head(cls_token).squeeze(-1)
        pred_scale = torch.exp(pred_log_scale)

        # 2. Multi-Scale FPN features
        pixel_feat, pyramid = self.fpn(f6, f9, f12, grid_size=self.grid_size)
        p8 = pyramid["p8"]  # [B, 128, 48, 48]

        # 3. High-Resolution Memory map (stride 8, 48x48 = 2304 locations)
        mem_highres = self.p8_proj(p8).flatten(2).permute(0, 2, 1)  # [B, 2304, 768]

        # 4. Decoder Layer 0 (Global + High-Res)
        queries_g = self.query_embed_global.weight.unsqueeze(0).expand(bs, -1, -1)
        queries_hr = self.query_embed_highres.weight.unsqueeze(0).expand(bs, -1, -1)

        hs_global_0 = self.decoder_global.layers[0](tgt=queries_g, memory=f12)
        hs_highres_0 = self.decoder_highres.layers[0](tgt=queries_hr, memory=mem_highres)
        hs_0 = torch.cat([hs_global_0, hs_highres_0], dim=1)  # [B, 40, 768]

        # Layer 0 Initial Box Prediction
        logits_box_0 = self.bbox_head_0(hs_0)
        pred_boxes_0 = torch.sigmoid(logits_box_0)  # [B, 40, 4]

        # 5. Decoder Layer 1 (Iterative Refinement)
        hs_global_1 = self.decoder_global.layers[1](tgt=hs_global_0, memory=f12)
        hs_highres_1 = self.decoder_highres.layers[1](tgt=hs_highres_0, memory=mem_highres)
        hs_1 = torch.cat([hs_global_1, hs_highres_1], dim=1)  # [B, 40, 768]

        # Layer 1 Delta Prediction
        delta_boxes_1 = self.bbox_head_1(hs_1)  # [B, 40, 4]

        # Inverse-Sigmoid Refinement with Detached Reference Box
        ref_boxes_0 = pred_boxes_0.detach()
        inv_ref = inverse_sigmoid(ref_boxes_0)
        pred_boxes_1 = torch.sigmoid(inv_ref + delta_boxes_1)  # [B, 40, 4]

        # 6. Classification, Dynamic Mask, and Semantic Supervision
        pred_logits = self.class_head(hs_1)  # [B, 40, 23]
        q_masks = self.query_mask_proj(hs_1) # [B, 40, 64]

        pred_masks = torch.einsum("bqc,bchw->bqhw", q_masks, pixel_feat)  # [B, 40, 96, 96]
        pred_semantic = self.semantic_head(pixel_feat)

        return {
            "pred_logits": pred_logits,
            "pred_boxes": pred_boxes_1,              # Final refined boxes
            "pred_boxes_0": pred_boxes_0,            # Initial Layer 0 boxes
            "pred_boxes_1": pred_boxes_1,            # Layer 1 refined boxes
            "delta_boxes_1": delta_boxes_1,          # Predicted deltas
            "pred_masks": pred_masks,
            "pred_semantic": pred_semantic,
            "pred_log_scale": pred_log_scale,
            "pred_scale": pred_scale,
            "pixel_feat": pixel_feat,
            "hs_0": hs_0,
            "hs_1": hs_1,
            "hs_global_1": hs_global_1,
            "hs_highres_1": hs_highres_1,
        }

    def forward(self, images):
        outputs = self.encoder(pixel_values=images, output_hidden_states=True)
        cls_token = outputs.last_hidden_state[:, 0, :]
        f6 = outputs.hidden_states[6][:, 1:, :]
        f9 = outputs.hidden_states[9][:, 1:, :]
        f12 = outputs.hidden_states[12][:, 1:, :]
        return self.forward_with_features(cls_token, f6, f9, f12)


def load_g3c_from_g3b(model, g3b_ckpt_path, device="cpu"):
    """Load weights from G3-B checkpoint with zero-initialized delta head for exact initial continuity."""
    g3b_weights = torch.load(g3b_ckpt_path, map_location=device)
    model_state = model.state_dict()

    matched_keys = []

    for k, v in g3b_weights.items():
        if k in model_state and model_state[k].shape == v.shape:
            model_state[k].copy_(v)
            matched_keys.append(k)

    # Initialize bbox_head_0 from G3-B bbox_head
    for i in [0, 2, 4]:
        w_key = f"bbox_head.{i}.weight"
        b_key = f"bbox_head.{i}.bias"
        if w_key in g3b_weights:
            model_state[f"bbox_head_0.{i}.weight"].copy_(g3b_weights[w_key])
            model_state[f"bbox_head_0.{i}.bias"].copy_(g3b_weights[b_key])
            matched_keys.extend([f"bbox_head_0.{i}.weight", f"bbox_head_0.{i}.bias"])

    # Initialize bbox_head_1 hidden layers from G3-B bbox_head, but ZERO the final linear projection
    for i in [0, 2]:
        w_key = f"bbox_head.{i}.weight"
        b_key = f"bbox_head.{i}.bias"
        if w_key in g3b_weights:
            model_state[f"bbox_head_1.{i}.weight"].copy_(g3b_weights[w_key])
            model_state[f"bbox_head_1.{i}.bias"].copy_(g3b_weights[b_key])
            matched_keys.extend([f"bbox_head_1.{i}.weight", f"bbox_head_1.{i}.bias"])

    # Zero-initialize the final delta projection so Delta b^(1) == 0 at initialization!
    model_state["bbox_head_1.4.weight"].zero_()
    model_state["bbox_head_1.4.bias"].zero_()
    matched_keys.extend(["bbox_head_1.4.weight", "bbox_head_1.4.bias"])

    model.load_state_dict(model_state)
    uninitialized = [k for k in model_state if k not in matched_keys]
    return len(matched_keys), uninitialized


# =====================================================================
# MultiTaskCriterion with Iterative Refinement Auxiliary Loss
# =====================================================================

class MultiTaskCriterionG3C(nn.Module):
    """
    Preserves exact G3-B loss weights:
      - CE: 1.0, BBox: 5.0, GIoU: 2.0, Mask: 2.5, Scale: 0.1, EOS: 0.1
    Applies auxiliary BBox regression loss to intermediate Layer 0 boxes.
    """
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES,
                 weight_class=1.0, weight_bbox=5.0, weight_giou=2.0,
                 weight_mask=2.5, weight_scale=0.1, eos_coef=0.1,
                 aux_loss_coef=0.5):
        super().__init__()
        self.matcher = matcher
        self.num_classes = num_classes
        self.weight_class = weight_class
        self.weight_bbox = weight_bbox
        self.weight_giou = weight_giou
        self.weight_mask = weight_mask
        self.weight_scale = weight_scale
        self.aux_loss_coef = aux_loss_coef
        empty_weight = torch.ones(num_classes + 1)
        empty_weight[num_classes] = eos_coef
        self.register_buffer("empty_weight", empty_weight)

    def forward(self, outputs, targets):
        pred_logits = outputs["pred_logits"]
        pred_boxes_1 = outputs["pred_boxes_1"]
        pred_boxes_0 = outputs["pred_boxes_0"]
        pred_masks = outputs["pred_masks"]
        pred_log_scale = outputs["pred_log_scale"]

        indices = self.matcher(pred_logits, pred_boxes_1, targets)

        # 1. Classification Loss (Flat standard CE with EOS=0.1)
        bs, num_queries = pred_logits.shape[:2]
        target_classes = torch.full(
            (bs, num_queries), self.num_classes,
            dtype=torch.int64, device=pred_logits.device
        )
        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                target_classes[b, src_idx] = targets[b]["labels"][tgt_idx].to(pred_logits.device)

        loss_ce = F.cross_entropy(
            pred_logits.flatten(0, 1),
            target_classes.flatten(),
            weight=self.empty_weight.to(pred_logits.device)
        )

        # 2. BBox Losses (Final Layer 1 + Auxiliary Layer 0)
        total_boxes = sum(len(t["labels"]) for t in targets)
        num_boxes = max(total_boxes, 1)

        src_boxes_1_list = []
        src_boxes_0_list = []
        target_boxes_list = []
        src_masks_list = []
        target_masks_list = []

        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                src_boxes_1_list.append(pred_boxes_1[b, src_idx])
                src_boxes_0_list.append(pred_boxes_0[b, src_idx])
                target_boxes_list.append(targets[b]["boxes"][tgt_idx].to(pred_logits.device))
                if "masks" in targets[b] and targets[b]["masks"] is not None:
                    src_masks_list.append(pred_masks[b, src_idx])
                    target_masks_list.append(targets[b]["masks"][tgt_idx].to(pred_logits.device))

        if src_boxes_1_list:
            src_boxes_1 = torch.cat(src_boxes_1_list, dim=0)
            src_boxes_0 = torch.cat(src_boxes_0_list, dim=0)
            target_boxes = torch.cat(target_boxes_list, dim=0)

            # Final Layer 1 box losses
            loss_bbox_1 = F.l1_loss(src_boxes_1, target_boxes, reduction="sum") / num_boxes
            loss_giou_1 = (1.0 - torch.diag(generalized_box_iou(
                box_cxcywh_to_xyxy(src_boxes_1),
                box_cxcywh_to_xyxy(target_boxes)
            ))).sum() / num_boxes

            # Auxiliary Layer 0 box losses
            loss_bbox_0 = F.l1_loss(src_boxes_0, target_boxes, reduction="sum") / num_boxes
            loss_giou_0 = (1.0 - torch.diag(generalized_box_iou(
                box_cxcywh_to_xyxy(src_boxes_0),
                box_cxcywh_to_xyxy(target_boxes)
            ))).sum() / num_boxes
        else:
            loss_bbox_1 = torch.tensor(0.0, device=pred_logits.device)
            loss_giou_1 = torch.tensor(0.0, device=pred_logits.device)
            loss_bbox_0 = torch.tensor(0.0, device=pred_logits.device)
            loss_giou_0 = torch.tensor(0.0, device=pred_logits.device)

        # 3. Mask Loss
        if src_masks_list and target_masks_list:
            all_src_masks = torch.cat(src_masks_list, dim=0)
            all_target_masks = torch.cat(target_masks_list, dim=0)
            if all_src_masks.shape[-2:] != all_target_masks.shape[-2:]:
                all_target_masks = F.interpolate(
                    all_target_masks.unsqueeze(1),
                    size=all_src_masks.shape[-2:],
                    mode="nearest"
                ).squeeze(1)
            loss_mask, _, _ = compute_mask_loss(all_src_masks, all_target_masks)
        else:
            loss_mask = torch.tensor(0.0, device=pred_logits.device)

        # 4. Scale Loss
        gt_scales = torch.stack([t["scale_px_per_m"] for t in targets]).to(pred_logits.device)
        has_scale = torch.stack([t["has_scale"] for t in targets]).to(pred_logits.device)
        gt_log_scale = torch.log(gt_scales.clamp(min=1.0))
        raw_scale_loss = F.smooth_l1_loss(pred_log_scale, gt_log_scale, reduction="none")
        scale_denom = max(1.0, has_scale.sum().item())
        loss_scale = (raw_scale_loss * has_scale).sum() / scale_denom

        # Main Loss + Auxiliary Box Loss
        main_bbox_loss = self.weight_bbox * loss_bbox_1 + self.weight_giou * loss_giou_1
        aux_bbox_loss = self.aux_loss_coef * (self.weight_bbox * loss_bbox_0 + self.weight_giou * loss_giou_0)

        total_loss = (self.weight_class * loss_ce +
                      main_bbox_loss +
                      aux_bbox_loss +
                      self.weight_mask * loss_mask +
                      self.weight_scale * loss_scale)

        return {
            "loss": total_loss,
            "loss_ce": loss_ce,
            "loss_bbox_1": loss_bbox_1,
            "loss_giou_1": loss_giou_1,
            "loss_bbox_0": loss_bbox_0,
            "loss_giou_0": loss_giou_0,
            "loss_mask": loss_mask,
            "loss_scale": loss_scale,
        }


# =====================================================================
# Comprehensive Evaluator for G3-C
# =====================================================================

def evaluate_g3c(model, dataloader, device, conf_thresh=0.25, detailed=False):
    model.eval()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    iou_thresholds = [0.25, 0.35, 0.50, 0.75]
    curve_stats = {
        th: {"det_tp": 0, "det_fp": 0, "det_fn": 0, "sem_tp": 0, "sem_fp": 0, "sem_fn": 0}
        for th in iou_thresholds
    }

    # Tracking Layer 0 vs Layer 1 box improvements
    hungarian_ious_1 = []
    hungarian_ious_0 = []
    hungarian_dices = []
    scale_errors_pct = []

    # Query group stats
    query_group_stats = {
        "global": {"predictions": 0, "tp_25": 0, "tp_50": 0, "fp_50": 0, "small_room_tp_25": 0, "small_room_tp_50": 0},
        "highres": {"predictions": 0, "tp_25": 0, "tp_50": 0, "fp_50": 0, "small_room_tp_25": 0, "small_room_tp_50": 0},
    }

    # Hit-rate style tracking (to reconcile with previous note)
    hitrate_matched_all = {th: 0 for th in iou_thresholds}
    hitrate_matched_small = {th: 0 for th in iou_thresholds}
    hitrate_matched_layer0_all = {th: 0 for th in iou_thresholds}
    hitrate_matched_layer0_small = {th: 0 for th in iou_thresholds}
    total_gt_rooms = 0
    total_small_gt_rooms = 0

    # Layer refinement movement stats
    refinement_movements = {
        "improved_count": 0,
        "worsened_count": 0,
        "unchanged_count": 0,
        "mean_iou_gain": [],
        "small_room_gains": [],
        "large_room_gains": [],
    }

    total_queries_eval = 0
    total_fg_predictions = 0

    pred_class_counts = {c: 0 for c in ROOM_CLASSES}
    pred_class_counts["Background"] = 0

    class_stats = {c: {"tp": 0, "fp": 0, "fn": 0, "support": 0, "ious": []} for c in ROOM_CLASSES}
    size_stats = {
        "Small (<6m²)": {"tp_25": 0, "tp_50": 0, "fn_50": 0, "support": 0},
        "Medium (6-18m²)": {"tp_25": 0, "tp_50": 0, "fn_50": 0, "support": 0},
        "Large (>18m²)": {"tp_25": 0, "tp_50": 0, "fn_50": 0, "support": 0},
        "Irregular (Non-rect)": {"tp_25": 0, "tp_50": 0, "fn_50": 0, "support": 0},
    }
    confusion_mat = np.zeros((NUM_ROOM_CLASSES + 1, NUM_ROOM_CLASSES + 1), dtype=np.int64)

    with torch.no_grad():
        for images, targets in dataloader:
            images = images.to(device)
            outputs = model(images)
            pred_logits = outputs["pred_logits"]
            pred_boxes_1 = outputs["pred_boxes_1"]
            pred_boxes_0 = outputs["pred_boxes_0"]
            pred_masks = outputs["pred_masks"]
            pred_scales = outputs["pred_scale"]
            probs = pred_logits.softmax(-1)

            indices = matcher(pred_logits, pred_boxes_1, targets)
            bs = images.size(0)

            for b in range(bs):
                # Scale error
                if targets[b]["has_scale"].item() > 0 and targets[b]["scale_px_per_m"].item() > 0:
                    p_s = pred_scales[b].item()
                    gt_s = targets[b]["scale_px_per_m"].item()
                    scale_errors_pct.append((abs(p_s - gt_s) / max(1.0, gt_s)) * 100.0)

                # Hungarian matching metrics (oracle)
                s_idx, t_idx = indices[b]
                tgt_labels = targets[b]["labels"].to(device)
                tgt_boxes = targets[b]["boxes"].to(device)
                tgt_masks = targets[b]["masks"].to(device) if "masks" in targets[b] else None

                if len(t_idx) > 0:
                    p_xyxy_1 = box_cxcywh_to_xyxy(pred_boxes_1[b, s_idx])
                    p_xyxy_0 = box_cxcywh_to_xyxy(pred_boxes_0[b, s_idx])
                    t_xyxy = box_cxcywh_to_xyxy(tgt_boxes[t_idx])

                    ious_1, _ = box_iou(p_xyxy_1, t_xyxy)
                    ious_0, _ = box_iou(p_xyxy_0, t_xyxy)
                    diag_1 = torch.diag(ious_1).cpu().tolist()
                    diag_0 = torch.diag(ious_0).cpu().tolist()
                    hungarian_ious_1.extend(diag_1)
                    hungarian_ious_0.extend(diag_0)

                    # Movement analysis for matched rooms
                    meta = targets[b].get("sample_meta", {})
                    gt_rooms = meta.get("rooms", [])
                    for m_i, (i0, i1) in enumerate(zip(diag_0, diag_1)):
                        gain = i1 - i0
                        refinement_movements["mean_iou_gain"].append(gain)
                        if gain > 0.005:
                            refinement_movements["improved_count"] += 1
                        elif gain < -0.005:
                            refinement_movements["worsened_count"] += 1
                        else:
                            refinement_movements["unchanged_count"] += 1

                        gt_pos = t_idx[m_i].item()
                        if gt_pos < len(gt_rooms):
                            area = gt_rooms[gt_pos].get("area_m2", gt_rooms[gt_pos].get("dimensions", {}).get("area_m2", 10.0))
                            if area < 6.0:
                                refinement_movements["small_room_gains"].append(gain)
                            elif area > 18.0:
                                refinement_movements["large_room_gains"].append(gain)

                    if tgt_masks is not None and tgt_masks.numel() > 0:
                        p_m = pred_masks[b, s_idx].sigmoid().flatten(1)
                        t_m = tgt_masks[t_idx].flatten(1)
                        d = ((2.0 * (p_m * t_m).sum(-1) + 1e-5) / (p_m.sum(-1) + t_m.sum(-1) + 1e-5)).cpu().tolist()
                        hungarian_dices.extend(d)

                # Query predicted class distribution
                top_scores_all, top_classes_all = probs[b].max(dim=-1)
                num_q = len(top_classes_all)
                total_queries_eval += num_q

                for q in range(num_q):
                    cls_id = top_classes_all[q].item()
                    if cls_id == NO_ROOM_ID:
                        pred_class_counts["Background"] += 1
                    elif cls_id < len(ROOM_CLASSES):
                        pred_class_counts[ROOM_CLASSES[cls_id]] += 1

                meta = targets[b].get("sample_meta", {})
                gt_rooms = meta.get("rooms", [])
                num_gt = len(tgt_labels)
                total_gt_rooms += num_gt

                # Count ground truth supports
                for g_idx in range(num_gt):
                    c_id = tgt_labels[g_idx].item()
                    if c_id < len(ROOM_CLASSES):
                        class_stats[ROOM_CLASSES[c_id]]["support"] += 1
                    if g_idx < len(gt_rooms):
                        r = gt_rooms[g_idx]
                        area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                        shape = r.get("shape", "rectangle")
                        if area < 6.0:
                            total_small_gt_rooms += 1
                        if shape != "rectangle" or (r.get("polygon") and len(r.get("polygon")) > 4):
                            size_stats["Irregular (Non-rect)"]["support"] += 1
                        elif area < 6.0:
                            size_stats["Small (<6m²)"]["support"] += 1
                        elif area <= 18.0:
                            size_stats["Medium (6-18m²)"]["support"] += 1
                        else:
                            size_stats["Large (>18m²)"]["support"] += 1

                # Filter foreground queries
                keep = (top_classes_all != NO_ROOM_ID) & (top_scores_all >= conf_thresh)
                keep_indices = torch.where(keep)[0]
                num_pred = len(keep_indices)
                total_fg_predictions += num_pred

                if num_pred == 0:
                    for th in iou_thresholds:
                        curve_stats[th]["det_fn"] += num_gt
                        curve_stats[th]["sem_fn"] += num_gt
                    if detailed:
                        for g_idx in range(num_gt):
                            c_id = tgt_labels[g_idx].item()
                            if c_id < len(ROOM_CLASSES):
                                class_stats[ROOM_CLASSES[c_id]]["fn"] += 1
                                confusion_mat[c_id, NO_ROOM_ID] += 1
                            if g_idx < len(gt_rooms):
                                r = gt_rooms[g_idx]
                                area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                                shape = r.get("shape", "rectangle")
                                if shape != "rectangle" or (r.get("polygon") and len(r.get("polygon")) > 4):
                                    size_stats["Irregular (Non-rect)"]["fn_50"] += 1
                                elif area < 6.0:
                                    size_stats["Small (<6m²)"]["fn_50"] += 1
                                elif area <= 18.0:
                                    size_stats["Medium (6-18m²)"]["fn_50"] += 1
                                else:
                                    size_stats["Large (>18m²)"]["fn_50"] += 1
                    continue

                p_boxes_1 = pred_boxes_1[b, keep_indices]
                p_boxes_0 = pred_boxes_0[b, keep_indices]
                p_classes = top_classes_all[keep_indices]
                p_scores = top_scores_all[keep_indices]
                orig_query_indices = keep_indices

                # Sort by confidence descending
                order = p_scores.argsort(descending=True)
                p_boxes_1 = p_boxes_1[order]
                p_boxes_0 = p_boxes_0[order]
                p_classes = p_classes[order]
                p_scores = p_scores[order]
                orig_query_indices = orig_query_indices[order]

                if num_gt == 0:
                    for th in iou_thresholds:
                        curve_stats[th]["det_fp"] += num_pred
                        curve_stats[th]["sem_fp"] += num_pred
                    continue

                p_xyxy_1 = box_cxcywh_to_xyxy(p_boxes_1)
                p_xyxy_0 = box_cxcywh_to_xyxy(p_boxes_0)
                t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
                b_ious_1, _ = box_iou(p_xyxy_1, t_xyxy)
                b_ious_0, _ = box_iou(p_xyxy_0, t_xyxy)

                # Track query group predictions
                for q_i in orig_query_indices:
                    grp = "global" if q_i.item() < 20 else "highres"
                    query_group_stats[grp]["predictions"] += 1

                # Hit-rate style tracking (class-agnostic any-hit)
                for r_idx in range(num_gt):
                    r = gt_rooms[r_idx] if r_idx < len(gt_rooms) else {}
                    area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                    is_small = (area < 6.0)
                    gt_max_iou_1 = b_ious_1[:, r_idx].max().item()
                    gt_max_iou_0 = b_ious_0[:, r_idx].max().item()
                    for th in iou_thresholds:
                        if gt_max_iou_1 >= th:
                            hitrate_matched_all[th] += 1
                            if is_small:
                                hitrate_matched_small[th] += 1
                        if gt_max_iou_0 >= th:
                            hitrate_matched_layer0_all[th] += 1
                            if is_small:
                                hitrate_matched_layer0_small[th] += 1

                # Multi-threshold IoU tracking (DETR 1-to-1 greedy matching)
                for th in iou_thresholds:
                    matched_det_gt = set()
                    matched_sem_gt = set()

                    for p_idx in range(num_pred):
                        best_iou, best_gt = b_ious_1[p_idx].max(dim=-1)
                        biou = best_iou.item()
                        bgt = best_gt.item()
                        p_cls = p_classes[p_idx].item()
                        t_cls = tgt_labels[bgt].item()
                        q_orig = orig_query_indices[p_idx].item()
                        grp = "global" if q_orig < 20 else "highres"

                        # Class-agnostic detection
                        if biou >= th and bgt not in matched_det_gt:
                            curve_stats[th]["det_tp"] += 1
                            matched_det_gt.add(bgt)
                            if th == 0.25:
                                query_group_stats[grp]["tp_25"] += 1
                                if bgt < len(gt_rooms):
                                    area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                    if area < 6.0:
                                        query_group_stats[grp]["small_room_tp_25"] += 1
                            if th == 0.50:
                                query_group_stats[grp]["tp_50"] += 1
                                if bgt < len(gt_rooms):
                                    area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                    if area < 6.0:
                                        query_group_stats[grp]["small_room_tp_50"] += 1
                        else:
                            curve_stats[th]["det_fp"] += 1
                            if th == 0.50:
                                query_group_stats[grp]["fp_50"] += 1

                        # Semantic detection
                        if biou >= th and bgt not in matched_sem_gt:
                            if p_cls == t_cls:
                                curve_stats[th]["sem_tp"] += 1
                                matched_sem_gt.add(bgt)
                                if th == 0.25 and bgt < len(gt_rooms):
                                    area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                    if area < 6.0:
                                        size_stats["Small (<6m²)"]["tp_25"] += 1
                                    elif area <= 18.0:
                                        size_stats["Medium (6-18m²)"]["tp_25"] += 1
                                    else:
                                        size_stats["Large (>18m²)"]["tp_25"] += 1
                            else:
                                curve_stats[th]["sem_fp"] += 1
                        else:
                            curve_stats[th]["sem_fp"] += 1

                    curve_stats[th]["det_fn"] += (num_gt - len(matched_det_gt))
                    curve_stats[th]["sem_fn"] += (num_gt - len(matched_sem_gt))

                # Detailed stats at IoU >= 0.50
                if detailed:
                    matched_sem_gt_50 = set()
                    for p_idx in range(num_pred):
                        best_iou, best_gt = b_ious_1[p_idx].max(dim=-1)
                        biou = best_iou.item()
                        bgt = best_gt.item()
                        p_cls = p_classes[p_idx].item()
                        t_cls = tgt_labels[bgt].item()
                        p_cname = ROOM_CLASSES[p_cls] if p_cls < len(ROOM_CLASSES) else "Unknown"

                        if biou >= 0.50 and bgt not in matched_sem_gt_50:
                            confusion_mat[t_cls, p_cls] += 1
                            if p_cls == t_cls:
                                matched_sem_gt_50.add(bgt)
                                if p_cname in class_stats:
                                    class_stats[p_cname]["tp"] += 1
                                    class_stats[p_cname]["ious"].append(biou)
                                if bgt < len(gt_rooms):
                                    r = gt_rooms[bgt]
                                    area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                                    shape = r.get("shape", "rectangle")
                                    if shape != "rectangle" or (r.get("polygon") and len(r.get("polygon")) > 4):
                                        size_stats["Irregular (Non-rect)"]["tp_50"] += 1
                                    elif area < 6.0:
                                        size_stats["Small (<6m²)"]["tp_50"] += 1
                                    elif area <= 18.0:
                                        size_stats["Medium (6-18m²)"]["tp_50"] += 1
                                    else:
                                        size_stats["Large (>18m²)"]["tp_50"] += 1
                            else:
                                if p_cname in class_stats:
                                    class_stats[p_cname]["fp"] += 1
                        else:
                            confusion_mat[NO_ROOM_ID, p_cls] += 1
                            if p_cname in class_stats:
                                class_stats[p_cname]["fp"] += 1

                    for g_idx in range(num_gt):
                        if g_idx not in matched_sem_gt_50:
                            t_cls = tgt_labels[g_idx].item()
                            if t_cls < len(ROOM_CLASSES):
                                confusion_mat[t_cls, NO_ROOM_ID] += 1
                            t_cname = ROOM_CLASSES[t_cls] if t_cls < len(ROOM_CLASSES) else "Unknown"
                            if t_cname in class_stats:
                                class_stats[t_cname]["fn"] += 1
                            if g_idx < len(gt_rooms):
                                r = gt_rooms[g_idx]
                                area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                                shape = r.get("shape", "rectangle")
                                if shape != "rectangle" or (r.get("polygon") and len(r.get("polygon")) > 4):
                                    size_stats["Irregular (Non-rect)"]["fn_50"] += 1
                                elif area < 6.0:
                                    size_stats["Small (<6m²)"]["fn_50"] += 1
                                elif area <= 18.0:
                                    size_stats["Medium (6-18m²)"]["fn_50"] += 1
                                else:
                                    size_stats["Large (>18m²)"]["fn_50"] += 1

    # Compute F1 Curve
    curve_results = {}
    for th in iou_thresholds:
        st = curve_stats[th]
        dp = st["det_tp"] / max(1, st["det_tp"] + st["det_fp"])
        dr = st["det_tp"] / max(1, st["det_tp"] + st["det_fn"])
        df1 = 2 * dp * dr / max(1e-6, dp + dr)

        sp = st["sem_tp"] / max(1, st["sem_tp"] + st["sem_fp"])
        sr = st["sem_tp"] / max(1, st["sem_tp"] + st["sem_fn"])
        sf1 = 2 * sp * sr / max(1e-6, sp + sr)

        curve_results[f"iou_{int(th*100)}"] = {
            "det_p": round(dp, 4), "det_r": round(dr, 4), "det_f1": round(df1, 4),
            "sem_p": round(sp, 4), "sem_r": round(sr, 4), "sem_f1": round(sf1, 4),
            "det_tp": st["det_tp"], "det_fp": st["det_fp"], "det_fn": st["det_fn"],
            "sem_tp": st["sem_tp"], "sem_fp": st["sem_fp"], "sem_fn": st["sem_fn"],
        }

    # Hit-rate summary
    hitrate_summary = {
        "overall_recall": {
            f"iou_{int(th*100)}": {
                "layer1": round(hitrate_matched_all[th] / max(1, total_gt_rooms), 4),
                "layer0": round(hitrate_matched_layer0_all[th] / max(1, total_gt_rooms), 4),
            }
            for th in iou_thresholds
        },
        "small_room_recall": {
            f"iou_{int(th*100)}": {
                "layer1": round(hitrate_matched_small[th] / max(1, total_small_gt_rooms), 4),
                "layer0": round(hitrate_matched_layer0_small[th] / max(1, total_small_gt_rooms), 4),
                "matched_count_layer1": hitrate_matched_small[th],
                "matched_count_layer0": hitrate_matched_layer0_small[th],
                "total_small_gt": total_small_gt_rooms,
            }
            for th in iou_thresholds
        }
    }

    results = {
        "curve": curve_results,
        "hitrate": hitrate_summary,
        "hungarian_mask_dice": round(float(np.mean(hungarian_dices)), 4) if hungarian_dices else 0.0,
        "hungarian_bbox_iou_layer1": round(float(np.mean(hungarian_ious_1)), 4) if hungarian_ious_1 else 0.0,
        "hungarian_bbox_iou_layer0": round(float(np.mean(hungarian_ious_0)), 4) if hungarian_ious_0 else 0.0,
        "scale_error_pct": round(float(np.mean(scale_errors_pct)), 2) if scale_errors_pct else 0.0,
        "total_queries": total_queries_eval,
        "fg_predictions": total_fg_predictions,
        "bg_rejected": total_queries_eval - total_fg_predictions,
        "query_group_stats": query_group_stats,
        "pred_class_distribution": pred_class_counts,
        "refinement_movements": {
            "improved_count": refinement_movements["improved_count"],
            "worsened_count": refinement_movements["worsened_count"],
            "unchanged_count": refinement_movements["unchanged_count"],
            "mean_gain": round(float(np.mean(refinement_movements["mean_iou_gain"])), 4) if refinement_movements["mean_iou_gain"] else 0.0,
            "small_room_mean_gain": round(float(np.mean(refinement_movements["small_room_gains"])), 4) if refinement_movements["small_room_gains"] else 0.0,
            "large_room_mean_gain": round(float(np.mean(refinement_movements["large_room_gains"])), 4) if refinement_movements["large_room_gains"] else 0.0,
        }
    }

    if detailed:
        per_class_summary = {}
        for cname, st in class_stats.items():
            tp, fp, fn = st["tp"], st["fp"], st["fn"]
            p = tp / max(1, tp + fp)
            r = tp / max(1, tp + fn)
            f1 = 2 * p * r / max(1e-6, p + r)
            per_class_summary[cname] = {
                "tp": tp, "fp": fp, "fn": fn, "support": st["support"],
                "precision": round(p, 4), "recall": round(r, 4), "f1": round(f1, 4),
                "bbox_iou": round(float(np.mean(st["ious"])), 4) if st["ious"] else 0.0,
            }

        per_size_summary = {}
        for sname, st in size_stats.items():
            tp50, fn50 = st["tp_50"], st["fn_50"]
            tp25 = st["tp_25"]
            r50 = tp50 / max(1, st["support"])
            r25 = tp25 / max(1, st["support"])
            per_size_summary[sname] = {
                "tp_50": tp50, "fn_50": fn50, "support": st["support"],
                "recall_iou_50": round(r50, 4),
                "recall_iou_25": round(r25, 4),
            }

        results["per_class"] = per_class_summary
        results["per_size"] = per_size_summary
        results["confusion_matrix"] = confusion_mat.tolist()

    return results


# =====================================================================
# Multi-Layer Visual Diagnostic Generator
# =====================================================================

def visualize_g3c_diagnostics(model, test_ds, device, out_dir, sample_indices=[0, 3, 7, 12, 25], conf_thresh=0.20):
    """
    Generates rich visual diagnostics for G3-C:
      - Ground-truth boxes
      - G3-C Layer 0 predictions (before refinement)
      - G3-C Layer 1 refined predictions (after refinement)
      - Visual vector arrows showing boundary movement
      - Small-room boundary zoom
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    model.eval()

    for s_idx in sample_indices:
        if s_idx >= len(test_ds.items):
            continue
        sample_entry = test_ds.items[s_idx]
        sample = sample_entry.get("sample_meta", sample_entry)
        orig_img_path = Path("HomeVerse-Dataset") / sample["image_path"]
        if not orig_img_path.exists():
            continue

        orig_img = Image.open(orig_img_path).convert("RGB")
        orig_w, orig_h = orig_img.size

        item = test_ds[s_idx]
        img_tensor = item["image"].unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(img_tensor)
            pred_logits = outputs["pred_logits"][0]
            pred_boxes_0 = outputs["pred_boxes_0"][0]
            pred_boxes_1 = outputs["pred_boxes_1"][0]
            delta_boxes_1 = outputs["delta_boxes_1"][0]
            probs = pred_logits.softmax(-1)

        top_scores, top_classes = probs.max(dim=-1)
        keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)
        keep_indices = torch.where(keep)[0]

        # 4-panel visual comparison:
        # Panel 1: Ground Truth
        # Panel 2: Layer 0 Initial Prediction
        # Panel 3: Layer 1 Refined Prediction (Color-coded: Global vs High-Res)
        # Panel 4: Refinement Delta Overlay (Layer 0 in Cyan Dashed, Layer 1 in Solid Orange/Green)
        panel_w = orig_w
        panel_h = orig_h
        canvas = Image.new("RGB", (panel_w * 4, panel_h + 40), (255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        gt_rooms = sample.get("rooms", [])

        # Panel 1: Ground Truth
        canvas.paste(orig_img, (0, 40))
        draw.text((15, 10), f"SAMPLE #{s_idx} - GROUND TRUTH (GT)", fill=(0, 0, 0))
        for r in gt_rooms:
            b = r.get("bbox", [0, 0, 0, 0])
            area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
            is_small = (area < 6.0)
            c_name = r.get("type", "Room")
            col = (255, 69, 0) if is_small else (34, 139, 34)
            x0 = int(b[0] * panel_w)
            y0 = int(b[1] * panel_h) + 40
            w_px = int(b[2] * panel_w)
            h_px = int(b[3] * panel_h)
            draw.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=3 if is_small else 2)
            lbl = f"{c_name} ({area:.1f}m²)"
            draw.rectangle([x0, max(40, y0 - 18), x0 + len(lbl) * 7, y0], fill=col)
            draw.text((x0 + 2, max(40, y0 - 16)), lbl, fill=(255, 255, 255))

        # Panel 2: Layer 0 Initial Prediction
        canvas.paste(orig_img, (panel_w, 40))
        draw.text((panel_w + 15, 10), "LAYER 0 INITIAL PREDICTIONS (Before Refinement)", fill=(0, 0, 180))
        for idx in keep_indices:
            q_i = idx.item()
            score = top_scores[q_i].item()
            c_id = top_classes[q_i].item()
            c_name = ROOM_CLASSES[c_id] if c_id < len(ROOM_CLASSES) else "Room"
            cx, cy, bw, bh = pred_boxes_0[q_i].tolist()
            x0 = int((cx - bw / 2.0) * panel_w) + panel_w
            y0 = int((cy - bh / 2.0) * panel_h) + 40
            w_px = int(bw * panel_w)
            h_px = int(bh * panel_h)
            col = (0, 150, 255)
            draw.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=2)
            lbl = f"L0 {c_name} ({score:.2f})"
            draw.rectangle([x0, max(40, y0 - 18), x0 + len(lbl) * 7, y0], fill=col)
            draw.text((x0 + 2, max(40, y0 - 16)), lbl, fill=(255, 255, 255))

        # Panel 3: Layer 1 Refined Prediction
        canvas.paste(orig_img, (panel_w * 2, 40))
        draw.text((panel_w * 2 + 15, 10), "LAYER 1 REFINED PREDICTIONS [Blue=Global, Orange=High-Res]", fill=(180, 0, 0))
        for idx in keep_indices:
            q_i = idx.item()
            grp = "[G]" if q_i < 20 else "[HR]"
            score = top_scores[q_i].item()
            c_id = top_classes[q_i].item()
            c_name = ROOM_CLASSES[c_id] if c_id < len(ROOM_CLASSES) else "Room"
            col = (30, 144, 255) if q_i < 20 else (255, 140, 0)
            cx, cy, bw, bh = pred_boxes_1[q_i].tolist()
            x0 = int((cx - bw / 2.0) * panel_w) + panel_w * 2
            y0 = int((cy - bh / 2.0) * panel_h) + 40
            w_px = int(bw * panel_w)
            h_px = int(bh * panel_h)
            draw.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=3)
            lbl = f"{grp} {c_name} ({score:.2f})"
            draw.rectangle([x0, max(40, y0 - 18), x0 + len(lbl) * 7, y0], fill=col)
            draw.text((x0 + 2, max(40, y0 - 16)), lbl, fill=(255, 255, 255))

        # Panel 4: Refinement Overlay & Coordinate Shift Vectors
        canvas.paste(orig_img, (panel_w * 3, 40))
        draw.text((panel_w * 3 + 15, 10), "BOUNDARY REFINEMENT SHIFT [Cyan=L0, Green=L1 Refined]", fill=(0, 100, 0))
        for idx in keep_indices:
            q_i = idx.item()
            cx0, cy0, bw0, bh0 = pred_boxes_0[q_i].tolist()
            cx1, cy1, bw1, bh1 = pred_boxes_1[q_i].tolist()
            x0_l0 = int((cx0 - bw0 / 2.0) * panel_w) + panel_w * 3
            y0_l0 = int((cy0 - bh0 / 2.0) * panel_h) + 40
            w0_l0 = int(bw0 * panel_w)
            h0_l0 = int(bh0 * panel_h)

            x0_l1 = int((cx1 - bw1 / 2.0) * panel_w) + panel_w * 3
            y0_l1 = int((cy1 - bh1 / 2.0) * panel_h) + 40
            w0_l1 = int(bw1 * panel_w)
            h0_l1 = int(bh1 * panel_h)

            # L0 in Cyan
            draw.rectangle([x0_l0, y0_l0, x0_l0 + w0_l0, y0_l0 + h0_l0], outline=(0, 200, 220), width=1)
            # L1 in Green
            draw.rectangle([x0_l1, y0_l1, x0_l1 + w0_l1, y0_l1 + h0_l1], outline=(0, 200, 0), width=2)
            # Draw center shift line
            c_x0 = int(cx0 * panel_w) + panel_w * 3
            c_y0 = int(cy0 * panel_h) + 40
            c_x1 = int(cx1 * panel_w) + panel_w * 3
            c_y1 = int(cy1 * panel_h) + 40
            draw.line([c_x0, c_y0, c_x1, c_y1], fill=(255, 0, 255), width=2)

        out_img_path = out_dir / f"g3c_refinement_sample_{s_idx}.png"
        canvas.save(out_img_path)
        print(f"Saved diagnostic visual to {out_img_path}.", flush=True)


# =====================================================================
# Main G3-C Execution Pipeline
# =====================================================================

def run_experiment_g3c(epochs=5, batch_size=7, img_size=384, eval_only=False):
    os.environ["OMP_NUM_THREADS"] = "8"
    os.environ["MKL_NUM_THREADS"] = "8"
    torch.set_num_threads(8)
    device = torch.device("cpu")

    print("=" * 80, flush=True)
    print("EXPERIMENT G3-C: ITERATIVE BOUNDING-BOX REFINEMENT", flush=True)
    print(f"Device: {device} | Threads: 8 | Epochs: {epochs} | Batch Size: {batch_size}", flush=True)
    print("Architecture: MultiTaskViT384FPNRefine (40 Queries, 2-Layer Refinement)", flush=True)
    print("Base Checkpoint: checkpoints/multitask/experiment_g3b_best.pt", flush=True)
    print("Refinement: b^(l) = sigmoid(logit(b^(l-1)) + Delta b^(l))", flush=True)
    print("=" * 80, flush=True)

    # 1. Dataset Partitioning (Identical 500-layout partition)
    print("\nSelecting identical class-balanced 500-layout partition...", flush=True)
    t_lids, train_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/train.json", 350)
    v_lids, val_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/validation.json", 75)
    te_lids, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)

    print(f"Train split:      {len(train_samples)} images ({len(t_lids)} layouts)")
    print(f"Validation split: {len(val_samples)} images ({len(v_lids)} layouts)")
    print(f"Test split:       {len(test_samples)} images ({len(te_lids)} layouts)")

    # 2. Pre-cache dataset in RAM
    def cache_dataset(samples):
        ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=img_size, mask_size=(96, 96))
        ds.samples = samples
        items = []
        for i in range(len(ds)):
            item = ds[i]
            item["sample_meta"] = samples[i]
            items.append(item)
        return InMemoryDataset(items)

    print("\nPre-caching datasets in RAM...", flush=True)
    t_c0 = time.time()
    train_ds = cache_dataset(train_samples)
    val_ds = cache_dataset(val_samples)
    test_ds = cache_dataset(test_samples)
    print(f"Pre-caching complete in {time.time() - t_c0:.1f}s.", flush=True)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, collate_fn=collate_fn_with_meta)
    val_loader = DataLoader(val_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)
    test_loader = DataLoader(test_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

    # 3. Model Initialization & Warm-Start from G3-B
    print("\nInitializing G3-C Iterative Refinement Model...", flush=True)
    model = MultiTaskViT384FPNRefine(pretrained_model_name="google/vit-base-patch16-384", img_size=img_size).to(device)

    g3b_ckpt_path = Path("checkpoints/multitask/experiment_g3b_best.pt")
    g3c_ckpt_path = Path("checkpoints/multitask/experiment_g3c_best.pt")
    interrupted_ckpt_path = Path("checkpoints/multitask/experiment_g3c_interrupted.pt")

    if eval_only:
        eval_ckpt = g3c_ckpt_path if g3c_ckpt_path.exists() else (interrupted_ckpt_path if interrupted_ckpt_path.exists() else g3b_ckpt_path)
        print(f"Loading checkpoint for evaluation: {eval_ckpt}...", flush=True)
        if eval_ckpt == g3b_ckpt_path:
            load_g3c_from_g3b(model, g3b_ckpt_path, device=device)
        else:
            model.load_state_dict(torch.load(eval_ckpt, map_location=device), strict=False)
    else:
        print(f"Warm-starting from G3-B checkpoint: {g3b_ckpt_path}...", flush=True)
        if not g3b_ckpt_path.exists():
            raise FileNotFoundError(f"Missing base G3-B checkpoint: {g3b_ckpt_path}")
        n_matched, uninit = load_g3c_from_g3b(model, g3b_ckpt_path, device=device)
        print(f"Successfully loaded {n_matched} matching keys from G3-B checkpoint.", flush=True)
        print(f"Delta Head (bbox_head_1.4) initialized to ZERO for exact identity continuity.", flush=True)
        print(f"Uninitialized keys: {uninit}", flush=True)

    # 4. ViT Frozen Backbone & Differential Optimizers
    for p in model.encoder.parameters():
        p.requires_grad = False

    delta_head_params = list(model.bbox_head_1.parameters())
    init_box_params = list(model.bbox_head_0.parameters())
    decoder_params = (
        list(model.decoder_global.parameters()) +
        list(model.decoder_highres.parameters()) +
        list(model.query_embed_global.parameters()) +
        list(model.query_embed_highres.parameters()) +
        list(model.p8_proj.parameters())
    )
    head_params = (
        list(model.class_head.parameters()) +
        list(model.query_mask_proj.parameters()) +
        list(model.semantic_head.parameters())
    )
    fpn_scale_params = (
        list(model.fpn.parameters()) +
        list(model.scale_head.parameters())
    )

    print(f"\nTrainable parameter groups:", flush=True)
    print(f"  - BBox Delta Refinement Head (bbox_head_1): {sum(p.numel() for p in delta_head_params):,} params (LR: 1.5e-4)", flush=True)
    print(f"  - Initial BBox Head (bbox_head_0):          {sum(p.numel() for p in init_box_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - Decoders & Query Pathways:                 {sum(p.numel() for p in decoder_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - Classification & Mask Heads:               {sum(p.numel() for p in head_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - FPN & Scale Head:                          {sum(p.numel() for p in fpn_scale_params):,} params (LR: 1.0e-5)", flush=True)
    total_trainable = sum(p.numel() for p in delta_head_params + init_box_params + decoder_params + head_params + fpn_scale_params)
    print(f"Total trainable parameters: {total_trainable:,}", flush=True)

    optimizer = torch.optim.AdamW([
        {"params": delta_head_params, "lr": 1.5e-4, "weight_decay": 1e-4},
        {"params": init_box_params, "lr": 3.0e-5, "weight_decay": 1e-4},
        {"params": decoder_params, "lr": 3.0e-5, "weight_decay": 1e-4},
        {"params": head_params, "lr": 3.0e-5, "weight_decay": 1e-5},
        {"params": fpn_scale_params, "lr": 1.0e-5, "weight_decay": 1e-4},
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    # 5. Loss Configuration (Preserve G3-B parameters + Auxiliary Box Loss)
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterionG3C(
        matcher=matcher,
        num_classes=NUM_ROOM_CLASSES,
        weight_class=1.0,
        weight_bbox=5.0,
        weight_giou=2.0,
        weight_mask=2.5,
        weight_scale=0.1,
        eos_coef=0.1,
        aux_loss_coef=0.5,
    )

    if not eval_only:
        print("\nPre-extracting ViT encoder representations for 350 train layouts (1,050 images)...", flush=True)
        t_fe0 = time.time()
        train_features = []
        with torch.no_grad():
            for b_idx, (images, targets) in enumerate(train_loader):
                enc = model.encoder(pixel_values=images.to(device), output_hidden_states=True)
                cls_tok = enc.last_hidden_state[:, 0, :].cpu()
                f6 = enc.hidden_states[6][:, 1:, :].cpu()
                f9 = enc.hidden_states[9][:, 1:, :].cpu()
                f12 = enc.hidden_states[12][:, 1:, :].cpu()
                train_features.append((cls_tok, f6, f9, f12, targets))
        print(f"Pre-extracted ViT features for 150 batches in {time.time() - t_fe0:.1f}s. Fast training enabled!", flush=True)

        print("\nEvaluating baseline validation performance before starting training...", flush=True)
        base_val_m = evaluate_g3c(model, val_loader, device, conf_thresh=0.25, detailed=False)
        best_val_score = base_val_m["curve"]["iou_50"]["det_f1"] + base_val_m["hungarian_mask_dice"] + base_val_m["hungarian_bbox_iou_layer1"]
        print(f"Baseline Val Det F1 (IoU 0.50): {base_val_m['curve']['iou_50']['det_f1']:.4f} | Hungarian IoU: {base_val_m['hungarian_bbox_iou_layer1']:.4f} | Mask Dice: {base_val_m['hungarian_mask_dice']:.4f}", flush=True)

        print("\nStarting G3-C iterative refinement training...", flush=True)
        best_epoch = 0

        try:
            for epoch in range(1, epochs + 1):
                t_ep0 = time.time()
                model.train()
                train_loss_total = 0.0
                train_loss_ce = 0.0
                train_loss_bbox1 = 0.0
                train_loss_bbox0 = 0.0
                train_loss_mask = 0.0

                for b_idx, (cls_tok, f6, f9, f12, targets) in enumerate(train_features):
                    cls_tok = cls_tok.to(device)
                    f6 = f6.to(device)
                    f9 = f9.to(device)
                    f12 = f12.to(device)
                    optimizer.zero_grad()
                    outputs = model.forward_with_features(cls_tok, f6, f9, f12)
                    loss_dict = criterion(outputs, targets)
                    loss = loss_dict["loss"]
                    loss.backward()
                    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                    optimizer.step()

                    train_loss_total += loss.item()
                    train_loss_ce += loss_dict["loss_ce"].item()
                    train_loss_bbox1 += loss_dict["loss_bbox_1"].item()
                    train_loss_bbox0 += loss_dict["loss_bbox_0"].item()
                    train_loss_mask += loss_dict["loss_mask"].item()

                scheduler.step()

                avg_loss = train_loss_total / len(train_features)
                avg_ce = train_loss_ce / len(train_features)
                avg_bbox1 = train_loss_bbox1 / len(train_features)
                avg_bbox0 = train_loss_bbox0 / len(train_features)
                avg_mask = train_loss_mask / len(train_features)

                # Validation
                val_res = evaluate_g3c(model, val_loader, device, conf_thresh=0.25, detailed=False)
                val_dice = val_res["hungarian_mask_dice"]
                val_det_f1 = val_res["curve"]["iou_50"]["det_f1"]
                val_sem_f1 = val_res["curve"]["iou_50"]["sem_f1"]
                val_h_iou = val_res["hungarian_bbox_iou_layer1"]
                val_score = val_det_f1 + val_dice + val_h_iou

                ep_time = time.time() - t_ep0
                print(f"Epoch {epoch:02d}/{epochs:02d} [{ep_time:.1f}s] | Loss: {avg_loss:.4f} [CE: {avg_ce:.3f}, BBox1: {avg_bbox1:.3f}, BBox0: {avg_bbox0:.3f}, Mask: {avg_mask:.3f}] | Val Dice: {val_dice:.4f} | Hungarian IoU: {val_h_iou:.4f} | Val Det F1: {val_det_f1:.4f}", flush=True)

                if val_score > best_val_score and val_dice >= 0.82:
                    best_val_score = val_score
                    best_epoch = epoch
                    print(f"  --> New Best G3-C Model (Epoch {epoch})! Saving to {g3c_ckpt_path}...", flush=True)
                    safe_torch_save(model.state_dict(), g3c_ckpt_path)

            print(f"\nG3-C Training completed. Best checkpoint from Epoch {best_epoch}.", flush=True)
        except KeyboardInterrupt:
            print("\n[SESSION INTERRUPT] Training stopped! Saving in-progress model weights...", flush=True)
            safe_torch_save(model.state_dict(), interrupted_ckpt_path)
            if not g3c_ckpt_path.exists():
                safe_torch_save(model.state_dict(), g3c_ckpt_path)
            print(f"[SESSION INTERRUPT] In-progress checkpoint safely saved to {interrupted_ckpt_path}.", flush=True)

    # 6. Final Benchmark on Completely Unseen Test Split
    print("\nLoading best G3-C checkpoint for final test benchmark...", flush=True)
    if g3c_ckpt_path.exists():
        model.load_state_dict(torch.load(g3c_ckpt_path, map_location=device), strict=False)

    print("Running comprehensive evaluation on 75 Unseen Test Layouts (225 images)...", flush=True)
    conf_thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50]
    sweep_results = {}

    for cth in conf_thresholds:
        is_detailed = (cth in [0.10, 0.20, 0.25, 0.50])
        eval_res = evaluate_g3c(model, test_loader, device, conf_thresh=cth, detailed=is_detailed)
        key_name = f"conf_{int(cth * 100):02d}"
        sweep_results[key_name] = eval_res
        print(f"  Confidence {cth:.2f} | Det F1 (0.50): {eval_res['curve']['iou_50']['det_f1']:.4f} | Sem F1 (0.25): {eval_res['curve']['iou_25']['sem_f1']:.4f} | Small Room Hitrate @ 0.25: {eval_res['hitrate']['small_room_recall']['iou_25']['layer1']*100:.2f}% | Small Room Hitrate @ 0.50: {eval_res['hitrate']['small_room_recall']['iou_50']['layer1']*100:.2f}%", flush=True)

    final_payload = {
        "sweep": sweep_results,
        "conf_25": sweep_results["conf_25"],
        "conf_20": sweep_results["conf_20"],
        "conf_10": sweep_results["conf_10"],
        "hungarian_mask_dice": sweep_results["conf_20"]["hungarian_mask_dice"],
        "hungarian_bbox_iou_layer1": sweep_results["conf_20"]["hungarian_bbox_iou_layer1"],
        "hungarian_bbox_iou_layer0": sweep_results["conf_20"]["hungarian_bbox_iou_layer0"],
        "scale_error_pct": sweep_results["conf_20"]["scale_error_pct"],
        "query_groups": sweep_results["conf_20"]["query_group_stats"],
        "hitrate_summary": sweep_results["conf_20"]["hitrate"],
        "refinement_movements": sweep_results["conf_20"]["refinement_movements"],
    }

    out_json = Path("evaluation_results/experiment_g3c_results.json")
    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w") as f:
        json.dump(final_payload, f, indent=2)
    print(f"\nFinal G3-C evaluation results written to {out_json}.", flush=True)

    # 7. Generate Visual Diagnostics
    print("\nGenerating visual diagnostic panels...", flush=True)
    visualize_g3c_diagnostics(
        model=model,
        test_ds=test_ds,
        device=device,
        out_dir="evaluation_results/g3c_diagnostics",
        sample_indices=[0, 3, 7, 12, 25, 42, 60],
        conf_thresh=0.20,
    )
    print("\nG3-C Pipeline Execution Finished Successfully!", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Experiment G3-C: Iterative Bounding-Box Refinement")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs (default: 5)")
    parser.add_argument("--batch-size", type=int, default=7, help="Training batch size (default: 7)")
    parser.add_argument("--eval-only", action="store_true", help="Run evaluation only")
    args = parser.parse_args()

    run_experiment_g3c(epochs=args.epochs, batch_size=args.batch_size, eval_only=args.eval_only)
