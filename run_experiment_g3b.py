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


# =====================================================================
# Model Architecture: MultiTaskViT384FPNTwoScale (G3-B)
# =====================================================================

class MultiTaskViT384FPNTwoScale(nn.Module):
    """
    Experiment G3-B: Multi-Scale ViT-FPN with Two-Scale Query Pathway
      - 20 Global Queries: Attending to ViT Block 12 patch representations (stride 16, 24x24)
      - 20 High-Resolution Queries: Attending to FPN P8 feature map (stride 8, 48x48)
      - Total: 40 Queries, with shared Class Head, BBox Head, and Query Mask Proj
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

        # 6. Shared Prediction Heads
        self.class_head = nn.Linear(hidden_dim, num_classes + 1)
        self.bbox_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, 4),
            nn.Sigmoid(),
        )
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

        # 4. Pathway A: Global Queries (20 queries attending to f12 stride 16)
        queries_g = self.query_embed_global.weight.unsqueeze(0).expand(bs, -1, -1)
        hs_global = self.decoder_global(tgt=queries_g, memory=f12)  # [B, 20, 768]

        # 5. Pathway B: High-Res Queries (20 queries attending to mem_highres stride 8)
        queries_hr = self.query_embed_highres.weight.unsqueeze(0).expand(bs, -1, -1)
        hs_highres = self.decoder_highres(tgt=queries_hr, memory=mem_highres)  # [B, 20, 768]

        # 6. Concatenate 40 queries: [0:20] = Global, [20:40] = High-Res
        hs = torch.cat([hs_global, hs_highres], dim=1)  # [B, 40, 768]

        # 7. Shared Heads
        pred_logits = self.class_head(hs)  # [B, 40, 23]
        pred_boxes = self.bbox_head(hs)    # [B, 40, 4]
        q_masks = self.query_mask_proj(hs) # [B, 40, 64]

        # Dynamic mask prediction
        pred_masks = torch.einsum("bqc,bchw->bqhw", q_masks, pixel_feat)  # [B, 40, 96, 96]
        pred_semantic = self.semantic_head(pixel_feat)

        return {
            "pred_logits": pred_logits,
            "pred_boxes": pred_boxes,
            "pred_masks": pred_masks,
            "pred_semantic": pred_semantic,
            "pred_log_scale": pred_log_scale,
            "pred_scale": pred_scale,
            "pixel_feat": pixel_feat,
            "hs": hs,
            "hs_global": hs_global,
            "hs_highres": hs_highres,
        }

    def forward(self, images):
        outputs = self.encoder(pixel_values=images, output_hidden_states=True)
        cls_token = outputs.last_hidden_state[:, 0, :]
        f6 = outputs.hidden_states[6][:, 1:, :]
        f9 = outputs.hidden_states[9][:, 1:, :]
        f12 = outputs.hidden_states[12][:, 1:, :]
        return self.forward_with_features(cls_token, f6, f9, f12)


def load_g3b_from_f2a(model, f2a_ckpt_path, device="cpu"):
    """Load weights from F2-A checkpoint with precise mapping for two-scale pathway."""
    f2a_weights = torch.load(f2a_ckpt_path, map_location=device)
    model_state = model.state_dict()

    matched_keys = []
    custom_loaded = []

    # 1. Map identical keys (encoder, fpn, scale_head, bbox_head, class_head, query_mask_proj, semantic_head)
    for k, v in f2a_weights.items():
        if k in model_state and model_state[k].shape == v.shape:
            model_state[k].copy_(v)
            matched_keys.append(k)

    # 2. Map query_embed: F2-A has [25, 768] -> load first 20 into query_embed_global
    if "query_embed.weight" in f2a_weights:
        model.query_embed_global.weight.data.copy_(f2a_weights["query_embed.weight"][:20])
        # Initialize query_embed_highres with F2-A queries + minor perturbation for diversity
        model.query_embed_highres.weight.data.copy_(f2a_weights["query_embed.weight"][:20] + 0.01 * torch.randn(20, 768))
        custom_loaded.append("query_embed_global (first 20 queries of F2-A)")
        custom_loaded.append("query_embed_highres (initialized from F2-A queries + small noise)")

    # 3. Map decoder: F2-A has decoder.layers.* -> load into decoder_global and decoder_highres
    for k, v in f2a_weights.items():
        if k.startswith("decoder."):
            suffix = k[len("decoder."):]
            k_g = f"decoder_global.{suffix}"
            k_hr = f"decoder_highres.{suffix}"
            if k_g in model_state and model_state[k_g].shape == v.shape:
                model_state[k_g].copy_(v)
                custom_loaded.append(k_g)
            if k_hr in model_state and model_state[k_hr].shape == v.shape:
                model_state[k_hr].copy_(v)
                custom_loaded.append(k_hr)

    # 4. Initialize p8_proj with gentle scaling to preserve initial stability
    nn.init.kaiming_normal_(model.p8_proj[0].weight, mode="fan_out", nonlinearity="relu")
    model.p8_proj[0].weight.data *= 0.1
    nn.init.constant_(model.p8_proj[0].bias, 0.0)

    model.load_state_dict(model_state)
    uninitialized = [k for k in model_state if k not in matched_keys and not any(k.startswith(p) for p in ["decoder_global", "decoder_highres", "query_embed_global", "query_embed_highres"])]
    return len(matched_keys), len(custom_loaded), uninitialized


# =====================================================================
# MultiTaskCriterion (Exact F2-A Loss Configuration)
# =====================================================================

class MultiTaskCriterionF2A(nn.Module):
    """Exact F2-A loss configuration: CE=1.0, BBox=5.0, GIoU=2.0, Mask=2.5, Scale=0.1, EOS=0.1"""
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES,
                 weight_class=1.0, weight_bbox=5.0, weight_giou=2.0,
                 weight_mask=2.5, weight_scale=0.1, eos_coef=0.1):
        super().__init__()
        self.matcher = matcher
        self.num_classes = num_classes
        self.weight_class = weight_class
        self.weight_bbox = weight_bbox
        self.weight_giou = weight_giou
        self.weight_mask = weight_mask
        self.weight_scale = weight_scale
        empty_weight = torch.ones(num_classes + 1)
        empty_weight[num_classes] = eos_coef
        self.register_buffer("empty_weight", empty_weight)

    def forward(self, outputs, targets):
        pred_logits = outputs["pred_logits"]
        pred_boxes = outputs["pred_boxes"]
        pred_masks = outputs["pred_masks"]
        pred_log_scale = outputs["pred_log_scale"]

        indices = self.matcher(pred_logits, pred_boxes, targets)

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

        # 2. BBox Losses
        total_boxes = sum(len(t["labels"]) for t in targets)
        num_boxes = max(total_boxes, 1)

        src_boxes_list = []
        target_boxes_list = []
        src_masks_list = []
        target_masks_list = []

        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                src_boxes_list.append(pred_boxes[b, src_idx])
                target_boxes_list.append(targets[b]["boxes"][tgt_idx].to(pred_logits.device))
                if "masks" in targets[b] and targets[b]["masks"] is not None:
                    src_masks_list.append(pred_masks[b, src_idx])
                    target_masks_list.append(targets[b]["masks"][tgt_idx].to(pred_logits.device))

        if src_boxes_list:
            src_boxes = torch.cat(src_boxes_list, dim=0)
            target_boxes = torch.cat(target_boxes_list, dim=0)
            loss_bbox = F.l1_loss(src_boxes, target_boxes, reduction="sum") / num_boxes
            loss_giou = (1.0 - torch.diag(generalized_box_iou(
                box_cxcywh_to_xyxy(src_boxes),
                box_cxcywh_to_xyxy(target_boxes)
            ))).sum() / num_boxes
        else:
            loss_bbox = torch.tensor(0.0, device=pred_logits.device)
            loss_giou = torch.tensor(0.0, device=pred_logits.device)

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

        total_loss = (self.weight_class * loss_ce +
                      self.weight_bbox * loss_bbox +
                      self.weight_giou * loss_giou +
                      self.weight_mask * loss_mask +
                      self.weight_scale * loss_scale)

        return {
            "loss": total_loss,
            "loss_ce": loss_ce,
            "loss_bbox": loss_bbox,
            "loss_giou": loss_giou,
            "loss_mask": loss_mask,
            "loss_scale": loss_scale,
        }


# =====================================================================
# Comprehensive Evaluator with Query Group Tracking
# =====================================================================

def evaluate_g3b(model, dataloader, device, conf_thresh=0.25, detailed=False):
    model.eval()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    iou_thresholds = [0.25, 0.35, 0.50, 0.75]
    curve_stats = {
        th: {"det_tp": 0, "det_fp": 0, "det_fn": 0, "sem_tp": 0, "sem_fp": 0, "sem_fn": 0}
        for th in iou_thresholds
    }

    hungarian_ious = []
    hungarian_dices = []
    scale_errors_pct = []

    # Query Group Tracking: Global (<20) vs High-Res (>=20)
    query_group_stats = {
        "global": {"tp": 0, "fp": 0, "predictions": 0, "small_room_tp": 0},
        "highres": {"tp": 0, "fp": 0, "predictions": 0, "small_room_tp": 0},
    }

    # Predicted class distribution across all 40 queries
    pred_class_counts = {c: 0 for c in ROOM_CLASSES}
    pred_class_counts["Background"] = 0

    class_stats = {c: {"tp": 0, "fp": 0, "fn": 0, "support": 0, "ious": []} for c in ROOM_CLASSES}
    size_stats = {
        "Small (<6m²)": {"tp": 0, "fp": 0, "fn": 0, "support": 0},
        "Medium (6-18m²)": {"tp": 0, "fp": 0, "fn": 0, "support": 0},
        "Large (>18m²)": {"tp": 0, "fp": 0, "fn": 0, "support": 0},
        "Irregular (Non-rect)": {"tp": 0, "fp": 0, "fn": 0, "support": 0},
    }

    confusion_mat = np.zeros((NUM_ROOM_CLASSES + 1, NUM_ROOM_CLASSES + 1), dtype=np.int32)
    total_fg_predictions = 0
    total_queries_eval = 0

    with torch.no_grad():
        for images, targets in dataloader:
            images = images.to(device)
            outputs = model(images)
            pred_logits = outputs["pred_logits"]
            pred_boxes = outputs["pred_boxes"]
            pred_masks = outputs["pred_masks"]
            pred_scales = outputs["pred_scale"]
            probs = pred_logits.softmax(-1)

            indices = matcher(pred_logits, pred_boxes, targets)
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
                    p_xyxy = box_cxcywh_to_xyxy(pred_boxes[b, s_idx])
                    t_xyxy = box_cxcywh_to_xyxy(tgt_boxes[t_idx])
                    ious, _ = box_iou(p_xyxy, t_xyxy)
                    hungarian_ious.extend(torch.diag(ious).cpu().tolist())

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

                # Count ground truth supports
                if detailed:
                    for g_idx in range(num_gt):
                        c_id = tgt_labels[g_idx].item()
                        if c_id < len(ROOM_CLASSES):
                            class_stats[ROOM_CLASSES[c_id]]["support"] += 1
                        if g_idx < len(gt_rooms):
                            r = gt_rooms[g_idx]
                            area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                            shape = r.get("shape", "rectangle")
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
                                    size_stats["Irregular (Non-rect)"]["fn"] += 1
                                elif area < 6.0:
                                    size_stats["Small (<6m²)"]["fn"] += 1
                                elif area <= 18.0:
                                    size_stats["Medium (6-18m²)"]["fn"] += 1
                                else:
                                    size_stats["Large (>18m²)"]["fn"] += 1
                    continue

                p_boxes = pred_boxes[b, keep_indices]
                p_classes = top_classes_all[keep_indices]
                p_scores = top_scores_all[keep_indices]
                orig_query_indices = keep_indices

                # Sort by confidence descending
                order = p_scores.argsort(descending=True)
                p_boxes = p_boxes[order]
                p_classes = p_classes[order]
                p_scores = p_scores[order]
                orig_query_indices = orig_query_indices[order]

                if num_gt == 0:
                    for th in iou_thresholds:
                        curve_stats[th]["det_fp"] += num_pred
                        curve_stats[th]["sem_fp"] += num_pred
                    continue

                p_xyxy = box_cxcywh_to_xyxy(p_boxes)
                t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
                b_ious, _ = box_iou(p_xyxy, t_xyxy)

                # Track query group predictions
                for q_i in orig_query_indices:
                    grp = "global" if q_i.item() < 20 else "highres"
                    query_group_stats[grp]["predictions"] += 1

                # Multi-threshold IoU tracking
                for th in iou_thresholds:
                    matched_det_gt = set()
                    matched_sem_gt = set()

                    for p_idx in range(num_pred):
                        best_iou, best_gt = b_ious[p_idx].max(dim=-1)
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
                        else:
                            curve_stats[th]["det_fp"] += 1

                        # Semantic detection
                        if biou >= th and bgt not in matched_sem_gt:
                            if p_cls == t_cls:
                                curve_stats[th]["sem_tp"] += 1
                                matched_sem_gt.add(bgt)
                                if th == 0.50:
                                    query_group_stats[grp]["tp"] += 1
                                    if bgt < len(gt_rooms):
                                        r = gt_rooms[bgt]
                                        area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                                        if area < 6.0:
                                            query_group_stats[grp]["small_room_tp"] += 1
                            else:
                                curve_stats[th]["sem_fp"] += 1
                                if th == 0.50:
                                    query_group_stats[grp]["fp"] += 1
                        else:
                            curve_stats[th]["sem_fp"] += 1
                            if th == 0.50:
                                query_group_stats[grp]["fp"] += 1

                    curve_stats[th]["det_fn"] += (num_gt - len(matched_det_gt))
                    curve_stats[th]["sem_fn"] += (num_gt - len(matched_sem_gt))

                # Detailed stats at IoU >= 0.50
                if detailed:
                    matched_sem_gt_50 = set()
                    for p_idx in range(num_pred):
                        best_iou, best_gt = b_ious[p_idx].max(dim=-1)
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
                                        size_stats["Irregular (Non-rect)"]["tp"] += 1
                                    elif area < 6.0:
                                        size_stats["Small (<6m²)"]["tp"] += 1
                                    elif area <= 18.0:
                                        size_stats["Medium (6-18m²)"]["tp"] += 1
                                    else:
                                        size_stats["Large (>18m²)"]["tp"] += 1
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
                                    size_stats["Irregular (Non-rect)"]["fn"] += 1
                                elif area < 6.0:
                                    size_stats["Small (<6m²)"]["fn"] += 1
                                elif area <= 18.0:
                                    size_stats["Medium (6-18m²)"]["fn"] += 1
                                else:
                                    size_stats["Large (>18m²)"]["fn"] += 1

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

    results = {
        "curve": curve_results,
        "hungarian_mask_dice": round(float(np.mean(hungarian_dices)), 4) if hungarian_dices else 0.0,
        "hungarian_bbox_iou": round(float(np.mean(hungarian_ious)), 4) if hungarian_ious else 0.0,
        "scale_error_pct": round(float(np.mean(scale_errors_pct)), 2) if scale_errors_pct else 0.0,
        "total_queries": total_queries_eval,
        "fg_predictions": total_fg_predictions,
        "bg_rejected": total_queries_eval - total_fg_predictions,
        "query_group_stats": query_group_stats,
        "pred_class_distribution": pred_class_counts,
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
            tp, fp, fn = st["tp"], st["fp"], st["fn"]
            p = tp / max(1, tp + fp)
            r = tp / max(1, tp + fn)
            f1 = 2 * p * r / max(1e-6, p + r)
            per_size_summary[sname] = {
                "tp": tp, "fp": fp, "fn": fn, "support": st["support"],
                "precision": round(p, 4), "recall": round(r, 4), "f1": round(f1, 4),
            }

        results["per_class"] = per_class_summary
        results["per_size"] = per_size_summary
        results["confusion_matrix"] = confusion_mat.tolist()

    return results


# =====================================================================
# Sample Visualizer (Global vs High-Res Queries, Ground Truth vs Pred)
# =====================================================================

def visualize_g3b_sample(model, test_ds, device, out_path, sample_idx=0, conf_thresh=0.20):
    model.eval()
    sample_entry = test_ds.items[sample_idx]
    sample = sample_entry.get("sample_meta", sample_entry)
    orig_img_path = Path("HomeVerse-Dataset") / sample["image_path"]

    if not orig_img_path.exists():
        return

    orig_img = Image.open(orig_img_path).convert("RGB")
    orig_w, orig_h = orig_img.size

    item = test_ds[sample_idx]
    img_tensor = item["image"].unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_tensor)
        pred_logits = outputs["pred_logits"][0]
        pred_boxes = outputs["pred_boxes"][0]
        pred_masks = outputs["pred_masks"][0]
        pred_scale = outputs["pred_scale"][0].item()
        probs = pred_logits.softmax(-1)

    top_scores, top_classes = probs.max(dim=-1)
    keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)
    keep_indices = torch.where(keep)[0]

    canvas = Image.new("RGB", (orig_w * 2, orig_h), (255, 255, 255))
    canvas.paste(orig_img, (0, 0))
    canvas.paste(orig_img, (orig_w, 0))

    overlay = Image.new("RGBA", (orig_w * 2, orig_h), (255, 255, 255, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw_canvas = ImageDraw.Draw(canvas)

    palette = [
        (0, 180, 0), (30, 144, 255), (255, 140, 0), (186, 85, 211),
        (220, 20, 60), (0, 206, 209), (255, 215, 0), (128, 128, 0)
    ]

    gt_scale = sample.get("pixels_per_meter", 100.0)
    # Ground Truth Left
    draw_canvas.text((15, 15), f"GROUND TRUTH (GT Scale: {gt_scale:.1f} px/m)", fill=(0, 120, 0))
    for i, room in enumerate(sample.get("rooms", [])):
        col = palette[i % len(palette)]
        bx, by, bw, bh = room["bbox"]
        area = room.get("area_m2", room.get("dimensions", {}).get("area_m2", 10.0))
        is_small = (area < 6.0)
        tag = "[SMALL] " if is_small else ""
        label = f"{tag}{room['type']} ({area:.1f}m²)"
        x0, y0 = int(bx * orig_w), int(by * orig_h)
        w_px, h_px = int(bw * orig_w), int(bh * orig_h)
        draw_canvas.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=(255, 50, 50) if is_small else col, width=3 if is_small else 2)
        draw_canvas.rectangle([x0, max(0, y0 - 18), x0 + len(label) * 7, y0], fill=(255, 50, 50) if is_small else col)
        draw_canvas.text((x0 + 2, max(0, y0 - 16)), label, fill=(255, 255, 255))

    # Prediction Right (G3-B Two-Scale: Global vs High-Res)
    draw_canvas.text((orig_w + 15, 15), f"G3-B TWO-SCALE PREDICTIONS [Blue=Global, Orange=High-Res] (Scale: {pred_scale:.1f} px/m)", fill=(180, 0, 0))

    for idx in keep_indices:
        q_idx = idx.item()
        grp = "[G]" if q_idx < 20 else "[HR]"
        score = top_scores[q_idx].item()
        c_id = top_classes[q_idx].item()
        label_name = ROOM_CLASSES[c_id] if c_id < len(ROOM_CLASSES) else "Room"

        col = (30, 144, 255) if q_idx < 20 else (255, 140, 0)
        cx, cy, bw_n, bh_n = pred_boxes[q_idx].tolist()
        x0 = int((cx - bw_n / 2.0) * orig_w) + orig_w
        y0 = int((cy - bh_n / 2.0) * orig_h)
        w_px = int(bw_n * orig_w)
        h_px = int(bh_n * orig_h)

        draw_canvas.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=3)
        label_txt = f"{grp} {label_name} ({score:.2f})"
        draw_canvas.rectangle([x0, max(0, y0 - 18), x0 + len(label_txt) * 7, y0], fill=col)
        draw_canvas.text((x0 + 2, max(0, y0 - 16)), label_txt, fill=(255, 255, 255))

    combined = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    combined.save(out_path)
    print(f"Saved visualization to {out_path}.", flush=True)


# =====================================================================
# Main Experiment G3-B Training & Evaluation Pipeline
# =====================================================================

def run_experiment_g3b(epochs=5, batch_size=7, img_size=384, eval_only=False):
    os.environ["OMP_NUM_THREADS"] = "8"
    os.environ["MKL_NUM_THREADS"] = "8"
    torch.set_num_threads(8)
    device = torch.device("cpu")

    print("=" * 80, flush=True)
    print("EXPERIMENT G3-B: TWO-SCALE QUERY PATHWAY (20 GLOBAL + 20 HIGH-RES QUERIES)", flush=True)
    print(f"Device: {device} | Threads: 8 | Epochs: {epochs} | Batch Size: {batch_size}", flush=True)
    print("Architecture: MultiTaskViT384FPNTwoScale (Total Queries: 40)", flush=True)
    print("Base Checkpoint: checkpoints/multitask/experiment_f2a_best.pt", flush=True)
    print("=" * 80, flush=True)

    # 1. Dataset Partitioning (Identical 500-layout partition as F2-A)
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

    # 3. Model Initialization & Warm-Start from F2-A
    print("\nInitializing G3-B Two-Scale Model...", flush=True)
    model = MultiTaskViT384FPNTwoScale(pretrained_model_name="google/vit-base-patch16-384", img_size=img_size).to(device)

    f2a_ckpt_path = Path("checkpoints/multitask/experiment_f2a_best.pt")
    g3b_ckpt_path = Path("checkpoints/multitask/experiment_g3b_best.pt")
    interrupted_ckpt_path = Path("checkpoints/multitask/experiment_g3b_interrupted.pt")

    if eval_only:
        eval_ckpt = g3b_ckpt_path if g3b_ckpt_path.exists() else (interrupted_ckpt_path if interrupted_ckpt_path.exists() else f2a_ckpt_path)
        print(f"Loading checkpoint for evaluation: {eval_ckpt}...", flush=True)
        if eval_ckpt == f2a_ckpt_path:
            load_g3b_from_f2a(model, f2a_ckpt_path, device=device)
        else:
            model.load_state_dict(torch.load(eval_ckpt, map_location=device), strict=False)
    else:
        print(f"Warm-starting from F2-A checkpoint: {f2a_ckpt_path}...", flush=True)
        if not f2a_ckpt_path.exists():
            raise FileNotFoundError(f"Missing base checkpoint: {f2a_ckpt_path}")
        n_matched, n_custom, uninit = load_g3b_from_f2a(model, f2a_ckpt_path, device=device)
        print(f"Successfully loaded {n_matched} identical keys and {n_custom} mapped two-scale keys.", flush=True)
        print(f"Newly initialized layers (P8 projection): {uninit}", flush=True)

    # 4. Partial ViT Unfreezing & Optimizer Setup (Identical to F2-A)
    # Freeze ViT embeddings & Blocks 1-8; train top blocks 9-12 with 1.5e-5
    for p in model.encoder.embeddings.parameters():
        p.requires_grad = False
    vit_layers = model.encoder.encoder.layer if hasattr(model.encoder, "encoder") else model.encoder.layers
    for layer in vit_layers[:8]:
        for p in layer.parameters():
            p.requires_grad = False
    for layer in vit_layers[8:]:
        for p in layer.parameters():
            p.requires_grad = True
    for p in model.encoder.layernorm.parameters():
        p.requires_grad = True
    if hasattr(model.encoder, "pooler") and model.encoder.pooler is not None:
        for p in model.encoder.pooler.parameters():
            p.requires_grad = False

    vit_trainable = [p for p in model.encoder.parameters() if p.requires_grad]
    head_trainable = [p for n, p in model.named_parameters() if not n.startswith("encoder") and p.requires_grad]

    print(f"Trainable parameters: ViT top-4 blocks: {len(vit_trainable)} tensors | Decoders, FPN & Heads: {len(head_trainable)} tensors", flush=True)
    total_trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total trainable parameters: {total_trainable:,}", flush=True)

    optimizer = torch.optim.AdamW([
        {"params": vit_trainable, "lr": 1.5e-5, "weight_decay": 1e-4},
        {"params": head_trainable, "lr": 1.5e-4, "weight_decay": 1e-5},
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    # 5. Exact F2-A Loss Configuration
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterionF2A(
        matcher=matcher,
        num_classes=NUM_ROOM_CLASSES,
        weight_class=1.0,
        weight_bbox=5.0,
        weight_giou=2.0,
        weight_mask=2.5,
        weight_scale=0.1,
        eos_coef=0.1,
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
        base_val_m = evaluate_g3b(model, val_loader, device, conf_thresh=0.25, detailed=False)
        best_val_score = base_val_m["curve"]["iou_50"]["det_f1"] + base_val_m["hungarian_mask_dice"]
        print(f"Baseline Val Det F1: {base_val_m['curve']['iou_50']['det_f1']:.4f} | Sem F1: {base_val_m['curve']['iou_50']['sem_f1']:.4f} | Dice: {base_val_m['hungarian_mask_dice']:.4f}", flush=True)

        print("\nStarting G3-B training...", flush=True)
        best_epoch = 0

        try:
            for epoch in range(1, epochs + 1):
                t_ep0 = time.time()
                model.train()
                train_loss_total = 0.0
                train_loss_ce = 0.0
                train_loss_bbox = 0.0
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
                    train_loss_bbox += loss_dict["loss_bbox"].item()
                    train_loss_mask += loss_dict["loss_mask"].item()

                scheduler.step()

                avg_loss = train_loss_total / len(train_features)
                avg_ce = train_loss_ce / len(train_features)
                avg_bbox = train_loss_bbox / len(train_features)
                avg_mask = train_loss_mask / len(train_features)

                # Validation
                val_res = evaluate_g3b(model, val_loader, device, conf_thresh=0.25, detailed=False)
                val_dice = val_res["hungarian_mask_dice"]
                val_det_f1 = val_res["curve"]["iou_50"]["det_f1"]
                val_sem_f1 = val_res["curve"]["iou_50"]["sem_f1"]
                val_score = val_det_f1 + val_dice + val_sem_f1

                ep_time = time.time() - t_ep0
                print(f"Epoch {epoch:02d}/{epochs:02d} [{ep_time:.1f}s] | Loss: {avg_loss:.4f} [CE: {avg_ce:.3f}, BBox: {avg_bbox:.3f}, Mask: {avg_mask:.3f}] | Val Dice: {val_dice:.4f} | Val Det F1: {val_det_f1:.4f} | Val Sem F1: {val_sem_f1:.4f}", flush=True)

                if val_score > best_val_score and val_dice >= 0.82:
                    best_val_score = val_score
                    best_epoch = epoch
                    print(f"  --> New Best Model (Epoch {epoch})! Saving to {g3b_ckpt_path}...", flush=True)
                    safe_torch_save(model.state_dict(), g3b_ckpt_path)

            print(f"\nTraining completed. Best checkpoint from Epoch {best_epoch}.", flush=True)
        except KeyboardInterrupt:
            print("\n[SESSION INTERRUPT] Training stopped! Saving in-progress model weights...", flush=True)
            safe_torch_save(model.state_dict(), interrupted_ckpt_path)
            if not g3b_ckpt_path.exists():
                safe_torch_save(model.state_dict(), g3b_ckpt_path)
            print(f"[SESSION INTERRUPT] In-progress checkpoint safely saved to {interrupted_ckpt_path}.", flush=True)

    # 6. Final Benchmark on Completely Unseen Test Split
    print("\nLoading best G3-B checkpoint for final test benchmark...", flush=True)
    if g3b_ckpt_path.exists():
        model.load_state_dict(torch.load(g3b_ckpt_path, map_location=device), strict=False)

    print("Running comprehensive evaluation on 75 Unseen Test Layouts (225 images)...", flush=True)
    test_res_25 = evaluate_g3b(model, test_loader, device, conf_thresh=0.25, detailed=True)
    test_res_20 = evaluate_g3b(model, test_loader, device, conf_thresh=0.20, detailed=True)
    test_res_10 = evaluate_g3b(model, test_loader, device, conf_thresh=0.10, detailed=True)

    # Package full evaluation bundle
    full_eval = {
        "conf_25": test_res_25,
        "conf_20": test_res_20,
        "conf_10": test_res_10,
        "hungarian_mask_dice": test_res_25["hungarian_mask_dice"],
        "hungarian_bbox_iou": test_res_25["hungarian_bbox_iou"],
        "scale_error_pct": test_res_25["scale_error_pct"],
        "query_groups": test_res_25["query_group_stats"],
    }

    out_json = Path("evaluation_results/experiment_g3b_results.json")
    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(full_eval, f, indent=2)
    print(f"Saved evaluation results to {out_json}.", flush=True)

    # Print Summary Tables
    print("\n" + "=" * 80)
    print("EXPERIMENT G3-B FINAL BENCHMARK (75 UNSEEN TEST LAYOUTS)")
    print("=" * 80)
    print(f"Wall Mask Dice (FPN):   {test_res_25['hungarian_mask_dice']:.4f} (F2-A Baseline: 0.8428)")
    print(f"Hungarian BBox IoU:     {test_res_25['hungarian_bbox_iou']:.4f} (F2-A Baseline: 0.5172)")
    print(f"Scale Error %:          {test_res_25['scale_error_pct']:.2f}% (F2-A Baseline: 9.43%)")

    print("\n--- Detection & Semantic F1 Curve Across IoU Thresholds (Conf >= 0.25) ---")
    print(f"{'IoU Threshold':<16} | {'Det Prec':<9} | {'Det Rec':<8} | {'Det F1':<8} | {'Sem Prec':<9} | {'Sem Rec':<8} | {'Sem F1'}")
    print("-" * 85)
    for k, v in test_res_25["curve"].items():
        th_val = int(k.split("_")[1]) / 100.0
        print(f"IoU >= {th_val:<9.2f} | {v['det_p']:.4f}    | {v['det_r']:.4f}   | {v['det_f1']:.4f}   | {v['sem_p']:.4f}    | {v['sem_r']:.4f}   | {v['sem_f1']:.4f}")

    print("\n--- Detection & Semantic F1 Curve Across IoU Thresholds (Conf >= 0.20) ---")
    print(f"{'IoU Threshold':<16} | {'Det Prec':<9} | {'Det Rec':<8} | {'Det F1':<8} | {'Sem Prec':<9} | {'Sem Rec':<8} | {'Sem F1'}")
    print("-" * 85)
    for k, v in test_res_20["curve"].items():
        th_val = int(k.split("_")[1]) / 100.0
        print(f"IoU >= {th_val:<9.2f} | {v['det_p']:.4f}    | {v['det_r']:.4f}   | {v['det_f1']:.4f}   | {v['sem_p']:.4f}    | {v['sem_r']:.4f}   | {v['sem_f1']:.4f}")

    print("\n--- Query-Group Performance Breakdown (Global vs High-Res Queries) ---")
    qg = test_res_25["query_group_stats"]
    print(f"Global Queries (0-19):    Predictions = {qg['global']['predictions']:<5d} | TP = {qg['global']['tp']:<4d} | Small Room TP = {qg['global']['small_room_tp']}")
    print(f"High-Res Queries (20-39): Predictions = {qg['highres']['predictions']:<5d} | TP = {qg['highres']['tp']:<4d} | Small Room TP = {qg['highres']['small_room_tp']}")

    print("\n--- Room Size Recall Breakdown (Conf >= 0.25, IoU >= 0.50) ---")
    ps = test_res_25["per_size"]
    print(f"Small (<6m²) Recall:    {ps.get('Small (<6m²)', {}).get('tp', 0)} / {ps.get('Small (<6m²)', {}).get('support', 0)} ({ps.get('Small (<6m²)', {}).get('recall', 0.0)*100:.1f}%) [F2-A: 0.0%]")
    print(f"Medium (6-18m²) Recall: {ps.get('Medium (6-18m²)', {}).get('tp', 0)} / {ps.get('Medium (6-18m²)', {}).get('support', 0)} ({ps.get('Medium (6-18m²)', {}).get('recall', 0.0)*100:.1f}%)")
    print(f"Large (>18m²) Recall:   {ps.get('Large (>18m²)', {}).get('tp', 0)} / {ps.get('Large (>18m²)', {}).get('support', 0)} ({ps.get('Large (>18m²)', {}).get('recall', 0.0)*100:.1f}%)")

    print("\n--- Key Class Failure Modes Check (IoU >= 0.50, Conf >= 0.25) ---")
    pc = test_res_25["per_class"]
    print(f"Bedroom FP:        {pc.get('Bedroom', {}).get('fp', 0):<4d} (F2-A: 780)")
    print(f"Kitchen TP:        {pc.get('Kitchen', {}).get('tp', 0):<4d} (F2-A: 0)")
    print(f"Toilet TP:         {pc.get('Toilet', {}).get('tp', 0):<4d} (F2-A: 0)")
    print(f"Dining Room TP:    {pc.get('Dining Room', {}).get('tp', 0):<4d} (F2-A: 0)")
    print(f"Bathroom TP:       {pc.get('Bathroom', {}).get('tp', 0):<4d} (F2-A: 2)")
    print(f"Walk-in Closet TP: {pc.get('Walk-in Closet', {}).get('tp', 0):<4d} (F2-A: 0)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=7)
    parser.add_argument("--img-size", type=int, default=384)
    parser.add_argument("--eval-only", action="store_true")
    args = parser.parse_args()

    run_experiment_g3b(epochs=args.epochs, batch_size=args.batch_size,
                       img_size=args.img_size, eval_only=args.eval_only)
