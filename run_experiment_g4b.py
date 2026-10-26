"""
Experiment G4-B: Dynamic Instance Masks for Architectural Interior Recovery
=============================================================================
HomeVerse Project - Milestone 4-B

Builds directly upon Experiment G4-A (Hierarchical Functional Supervision):
  - Preserves frozen ViT-384 backbone, FPN multi-scale representations,
    two-scale queries (20 global + 20 high-res), iterative inverse-sigmoid
    bounding box refinement, 22-class fine-grained head, and 9-class parent head.
  - Upgrades room mask projection to a full Dynamic Instance Mask Head:
      w_q, b_q = DynamicMaskHead(hs_1)  # 64-dim dynamic kernel + bias
      M_q(x, y) = sigmoid(sum_c w_{q,c} * F_c(x, y) + b_q)
  - Connects ground-truth canonical instance masks rasterized from CAD polygons
    with strict 0.0 pixel overlap between adjacent rooms sharing walls.
  - Employs Hungarian Mask Loss (BCE + Dice) on matched query-GT pairs.
  - Extracts CAD-ready simplified room polygons (Douglas-Peucker) and
    calculates exact architectural area (Shoelace formula) to eliminate
    bounding-box overestimation on non-convex and irregular room layouts.
"""

import argparse
import json
import math
import os
import sys
import time
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import cv2

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from transformers import ViTModel, ViTConfig

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

from floorplan_dataset import (
    FloorplanDataset,
    collate_fn,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    ID2LABEL,
    LABEL2ID,
    get_image_transform,
)
from segmentation_head import (
    compute_mask_loss,
    extract_room_geometry_from_mask,
    dice_loss,
    sigmoid_ce_loss,
)
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
    box_iou,
    generalized_box_iou,
)
from run_experiment_f1_fpn import (
    ViTFeaturePyramidNetwork,
    MultiTaskViT384FPN,
    classify_topology,
)
from run_experiment_g3c import MultiTaskViT384FPNRefine
from run_experiment_g4a import (
    MultiTaskViT384G4A,
    PARENT_CLASSES,
    NUM_PARENT_CLASSES,
    NO_ROOM_PARENT_ID,
    CHILD_TO_PARENT,
    PARENT_TO_CHILDREN,
)
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta


# =====================================================================
# Canonical Instance Mask Rasterizer
# =====================================================================

def rasterize_canonical_instance_masks(rooms, mask_size=(96, 96)):
    """
    Rasterizes room polygons into a single canonical integer map to guarantee:
      1. Zero pixel overlap between adjacent rooms sharing partition walls.
      2. Strict interior polygon fidelity (both convex and non-convex).
      3. Precise room instance identity preservation.
    """
    mw, mh = mask_size
    canon_img = Image.new("I", (mw, mh), 0)
    draw = ImageDraw.Draw(canon_img)
    valid_rooms = []

    for r_idx, r in enumerate(rooms, start=1):
        poly = r.get("polygon")
        if poly and len(poly) >= 3:
            pts = [(float(pt[0]) * mw, float(pt[1]) * mh) for pt in poly]
            draw.polygon(pts, fill=r_idx)
            valid_rooms.append(r)
        else:
            bbox = r.get("bbox", [0, 0, 0, 0])
            if isinstance(bbox, dict):
                bx, by, bw, bh = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
            else:
                bx, by, bw, bh = bbox[0], bbox[1], bbox[2], bbox[3]
            x0 = int(round(bx * mw))
            y0 = int(round(by * mh))
            x1 = int(round((bx + bw) * mw))
            y1 = int(round((by + bh) * mh))
            draw.rectangle([x0, y0, x1, y1], fill=r_idx)
            valid_rooms.append(r)

    canon_arr = np.array(canon_img, dtype=np.int32)
    masks = []
    for r_idx in range(1, len(valid_rooms) + 1):
        m = (canon_arr == r_idx).astype(np.float32)
        masks.append(torch.from_numpy(m))

    if masks:
        return torch.stack(masks, dim=0)
    return torch.zeros((0, mh, mw), dtype=torch.float32)


# =====================================================================
# Model Architecture: MultiTaskViT384G4B
# =====================================================================

class DynamicMaskHead(nn.Module):
    """
    Per-query Dynamic Instance Mask Head:
    Projects query hidden states hs_1 [B, 40, 768] -> dynamic weights w_q [B, 40, 64]
    and query scalar bias b_q [B, 40].
    Evaluates dynamic 1x1 convolution over spatial FPN feature map F [B, 64, 96, 96]:
      M_q(x, y) = sigmoid(sum_c w_{q,c} * F_c(x,y) + b_q)
    """
    def __init__(self, hidden_dim=768, mask_dim=64):
        super().__init__()
        self.mask_dim = mask_dim
        self.weight_proj = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, mask_dim),
        )
        self.bias_proj = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

    def forward(self, hs, pixel_feat):
        B, Q, _ = hs.shape
        w = self.weight_proj(hs)                 # [B, Q, 64]
        b = self.bias_proj(hs).view(B, Q, 1, 1)  # [B, Q, 1, 1]
        mask_logits = torch.einsum("bqc,bchw->bqhw", w, pixel_feat) + b
        return mask_logits


class MultiTaskViT384G4B(MultiTaskViT384G4A):
    """
    Experiment G4-B Architecture:
    Preserves all G4-A branches (ViT-384, FPN, 2-Scale queries, 2-layer refinement,
    fine-grained 22-class head, parent 9-class head, scale head).
    Upgrades mask generation to full Dynamic Instance Mask Head with query bias.
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-384",
                 img_size=384, num_queries_global=20, num_queries_highres=20,
                 num_classes=NUM_ROOM_CLASSES, num_parent_classes=NUM_PARENT_CLASSES,
                 mask_dim=64):
        super().__init__(
            pretrained_model_name=pretrained_model_name,
            img_size=img_size,
            num_queries_global=num_queries_global,
            num_queries_highres=num_queries_highres,
            num_classes=num_classes,
            num_parent_classes=num_parent_classes,
        )
        hidden_dim = self.encoder.config.hidden_size  # 768
        self.dynamic_mask_head = DynamicMaskHead(hidden_dim=hidden_dim, mask_dim=mask_dim)

    def forward_with_features(self, cls_token, f6, f9, f12):
        out = super().forward_with_features(cls_token, f6, f9, f12)
        hs_1 = out["hs_1"]
        pixel_feat = out["pixel_feat"]

        # Compute dynamic instance mask logits
        mask_logits = self.dynamic_mask_head(hs_1, pixel_feat)  # [B, 40, 96, 96]
        out["pred_masks"] = mask_logits
        out["pred_masks_prob"] = torch.sigmoid(mask_logits)
        return out


def load_g4b_from_g4a(model, g4a_ckpt_path, device="cpu"):
    """
    Warm-starts all weights from experiment_g4a_best.pt.
    Initializes dynamic_mask_head.weight_proj from query_mask_proj,
    and initializes dynamic_mask_head.bias_proj to zero for exact step-0 continuity.
    """
    g4a_weights = torch.load(g4a_ckpt_path, map_location=device)
    model_state = model.state_dict()
    matched_keys = []

    for k, v in g4a_weights.items():
        if k in model_state and model_state[k].shape == v.shape:
            model_state[k].copy_(v)
            matched_keys.append(k)

    # Initialize dynamic_mask_head.weight_proj from query_mask_proj
    for i in [0, 2]:
        w_k = f"query_mask_proj.{i}.weight"
        b_k = f"query_mask_proj.{i}.bias"
        if w_k in g4a_weights:
            model_state[f"dynamic_mask_head.weight_proj.{i}.weight"].copy_(g4a_weights[w_k])
            model_state[f"dynamic_mask_head.weight_proj.{i}.bias"].copy_(g4a_weights[b_k])
            matched_keys.extend([f"dynamic_mask_head.weight_proj.{i}.weight", f"dynamic_mask_head.weight_proj.{i}.bias"])

    # Zero-initialize dynamic_mask_head.bias_proj
    model_state["dynamic_mask_head.bias_proj.2.weight"].zero_()
    model_state["dynamic_mask_head.bias_proj.2.bias"].zero_()
    matched_keys.extend(["dynamic_mask_head.bias_proj.2.weight", "dynamic_mask_head.bias_proj.2.bias"])

    model.load_state_dict(model_state, strict=False)
    return len(matched_keys)


# =====================================================================
# Multi-Task Criterion for G4-B
# =====================================================================

class MultiTaskCriterionG4B(nn.Module):
    """
    Experiment G4-B Multi-Task Loss:
    Integrates G4-A classification & bounding box losses with Hungarian Dynamic Mask Loss.
    """
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES, num_parent_classes=NUM_PARENT_CLASSES,
                 weight_class=1.0, weight_parent=0.5, weight_consist=0.5,
                 weight_bbox=5.0, weight_giou=2.0, weight_mask=4.0, weight_scale=0.1,
                 eos_coef=0.1, aux_loss_coef=0.5):
        super().__init__()
        self.matcher = matcher
        self.num_classes = num_classes
        self.num_parent_classes = num_parent_classes
        self.weight_class = weight_class
        self.weight_parent = weight_parent
        self.weight_consist = weight_consist
        self.weight_bbox = weight_bbox
        self.weight_giou = weight_giou
        self.weight_mask = weight_mask
        self.weight_scale = weight_scale
        self.aux_loss_coef = aux_loss_coef

        empty_weight_c = torch.ones(num_classes + 1)
        empty_weight_c[num_classes] = eos_coef
        self.register_buffer("child_empty_weight", empty_weight_c)

        empty_weight_p = torch.ones(num_parent_classes + 1)
        empty_weight_p[num_parent_classes] = eos_coef
        self.register_buffer("parent_empty_weight", empty_weight_p)

        c2p_tensor = torch.zeros(num_classes + 1, dtype=torch.int64)
        for c, p in CHILD_TO_PARENT.items():
            c2p_tensor[c] = p
        self.register_buffer("child_to_parent_tensor", c2p_tensor)

        c2p_mat = torch.zeros(num_parent_classes + 1, num_classes + 1)
        for c, p in CHILD_TO_PARENT.items():
            c2p_mat[p, c] = 1.0
        self.register_buffer("child_to_parent_matrix", c2p_mat)

    def forward(self, outputs, targets):
        pred_logits = outputs["pred_logits"]
        pred_parent_logits = outputs["pred_parent_logits"]
        pred_boxes_1 = outputs["pred_boxes_1"]
        pred_boxes_0 = outputs["pred_boxes_0"]
        pred_masks = outputs["pred_masks"]
        pred_log_scale = outputs["pred_log_scale"]

        indices = self.matcher(pred_logits, pred_boxes_1, targets)
        bs, num_queries = pred_logits.shape[:2]

        # 1. Classification Losses
        target_classes = torch.full((bs, num_queries), self.num_classes, dtype=torch.int64, device=pred_logits.device)
        target_parents = torch.full((bs, num_queries), self.num_parent_classes, dtype=torch.int64, device=pred_logits.device)

        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                c_lbls = targets[b]["labels"][tgt_idx].to(pred_logits.device)
                target_classes[b, src_idx] = c_lbls
                target_parents[b, src_idx] = self.child_to_parent_tensor[c_lbls]

        loss_child_ce = F.cross_entropy(
            pred_logits.flatten(0, 1), target_classes.flatten(),
            weight=self.child_empty_weight.to(pred_logits.device)
        )
        loss_parent_ce = F.cross_entropy(
            pred_parent_logits.flatten(0, 1), target_parents.flatten(),
            weight=self.parent_empty_weight.to(pred_logits.device)
        )

        # 2. Hierarchical Consistency Loss
        p_child = F.softmax(pred_logits, dim=-1)
        p_parent = F.softmax(pred_parent_logits, dim=-1)
        p_implied = torch.matmul(p_child, self.child_to_parent_matrix.t().to(pred_logits.device))

        kl_1 = F.kl_div((p_parent + 1e-7).log(), p_implied, reduction="batchmean") / num_queries
        kl_2 = F.kl_div((p_implied + 1e-7).log(), p_parent, reduction="batchmean") / num_queries
        loss_consist = 0.5 * (kl_1 + kl_2)

        # 3. Bounding Box Losses
        total_boxes = sum(len(t["labels"]) for t in targets)
        num_boxes = max(total_boxes, 1)

        src_boxes_1_list, src_boxes_0_list, target_boxes_list = [], [], []
        src_masks_list, target_masks_list = [], []

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

            loss_bbox_1 = F.l1_loss(src_boxes_1, target_boxes, reduction="sum") / num_boxes
            loss_giou_1 = (1.0 - torch.diag(generalized_box_iou(
                box_cxcywh_to_xyxy(src_boxes_1), box_cxcywh_to_xyxy(target_boxes)
            ))).sum() / num_boxes

            loss_bbox_0 = F.l1_loss(src_boxes_0, target_boxes, reduction="sum") / num_boxes
            loss_giou_0 = (1.0 - torch.diag(generalized_box_iou(
                box_cxcywh_to_xyxy(src_boxes_0), box_cxcywh_to_xyxy(target_boxes)
            ))).sum() / num_boxes
        else:
            loss_bbox_1 = torch.tensor(0.0, device=pred_logits.device)
            loss_giou_1 = torch.tensor(0.0, device=pred_logits.device)
            loss_bbox_0 = torch.tensor(0.0, device=pred_logits.device)
            loss_giou_0 = torch.tensor(0.0, device=pred_logits.device)

        # 4. Dynamic Instance Mask Loss (Hungarian Matched Pairs)
        if src_masks_list and target_masks_list:
            all_src_masks = torch.cat(src_masks_list, dim=0)
            all_target_masks = torch.cat(target_masks_list, dim=0)
            if all_src_masks.shape[-2:] != all_target_masks.shape[-2:]:
                all_target_masks = F.interpolate(all_target_masks.unsqueeze(1), size=all_src_masks.shape[-2:], mode="nearest").squeeze(1)
            loss_mask, _, _ = compute_mask_loss(all_src_masks, all_target_masks)
        else:
            loss_mask = torch.tensor(0.0, device=pred_logits.device)

        # 5. Scale Loss
        gt_scales = torch.stack([t["scale_px_per_m"] for t in targets]).to(pred_logits.device).view_as(pred_log_scale)
        has_scale = torch.stack([t["has_scale"] for t in targets]).to(pred_logits.device).view_as(pred_log_scale)
        gt_log_scale = torch.log(gt_scales.clamp(min=1.0))
        raw_scale_loss = F.smooth_l1_loss(pred_log_scale, gt_log_scale, reduction="none")
        scale_denom = max(1.0, has_scale.sum().item())
        loss_scale = (raw_scale_loss * has_scale).sum() / scale_denom

        main_bbox_loss = self.weight_bbox * loss_bbox_1 + self.weight_giou * loss_giou_1
        aux_bbox_loss = self.aux_loss_coef * (self.weight_bbox * loss_bbox_0 + self.weight_giou * loss_giou_0)

        total_loss = (self.weight_class * loss_child_ce +
                      self.weight_parent * loss_parent_ce +
                      self.weight_consist * loss_consist +
                      main_bbox_loss +
                      aux_bbox_loss +
                      self.weight_mask * loss_mask +
                      self.weight_scale * loss_scale)

        return {
            "loss": total_loss,
            "loss_child_ce": loss_child_ce,
            "loss_parent_ce": loss_parent_ce,
            "loss_consist": loss_consist,
            "loss_bbox_1": loss_bbox_1,
            "loss_giou_1": loss_giou_1,
            "loss_bbox_0": loss_bbox_0,
            "loss_giou_0": loss_giou_0,
            "loss_mask": loss_mask,
            "loss_scale": loss_scale,
        }


# =====================================================================
# Boundary F1 Metric Computation (2-pixel tolerance)
# =====================================================================

def compute_boundary_f1(pred_binary, gt_binary, tol=2):
    """
    Computes Boundary F1 score between predicted and ground-truth masks
    using Euclidean distance transforms on morphological contour gradients.
    """
    if pred_binary.sum() == 0 and gt_binary.sum() == 0:
        return 1.0
    if pred_binary.sum() == 0 or gt_binary.sum() == 0:
        return 0.0

    k = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    p_b = cv2.morphologyEx(pred_binary.astype(np.uint8), cv2.MORPH_GRADIENT, k) > 0
    g_b = cv2.morphologyEx(gt_binary.astype(np.uint8), cv2.MORPH_GRADIENT, k) > 0

    if p_b.sum() == 0 and g_b.sum() == 0:
        return 1.0
    if p_b.sum() == 0 or g_b.sum() == 0:
        return 0.0

    dt_g = cv2.distanceTransform((~g_b).astype(np.uint8), cv2.DIST_L2, 3)
    dt_p = cv2.distanceTransform((~p_b).astype(np.uint8), cv2.DIST_L2, 3)

    prec = float((dt_g[p_b] <= tol).mean())
    rec = float((dt_p[g_b] <= tol).mean())

    if prec + rec == 0:
        return 0.0
    return 2.0 * prec * rec / (prec + rec)


# =====================================================================
# Comprehensive Evaluator for G4-B
# =====================================================================

def evaluate_g4b(model, dataloader, device, conf_thresh=0.20, detailed=False):
    """
    Evaluates Experiment G4-B:
      - Dual Geometry: Hungarian BBox IoU, Detection F1 (IoU 0.25 & 0.50), Small-room recall.
      - Instance Masks: Instance Dice, Instance IoU, Boundary F1, Small-room mask recall.
      - Non-Convex Benchmark: Isolated mask IoU & area error on non-convex layouts.
      - Metric Areas: Polygon contour Shoelace area error (%) vs BBox (W x L) error (%).
      - Classification: Parent F1, Child F1, Hierarchical Consistency Accuracy.
    """
    model.eval()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    hungarian_ious_1, hungarian_ious_0 = [], []
    hungarian_mask_dices, hungarian_mask_ious, boundary_f1_scores = [], [], []

    small_room_mask_dices = []
    non_convex_mask_ious, non_convex_mask_dices = [], []

    shoelace_area_errors_pct = []
    bbox_area_errors_pct = []
    non_convex_shoelace_errors = []
    non_convex_bbox_errors = []

    scale_errors_pct = []

    iou_thresholds = [0.25, 0.50]
    curve_stats = {
        th: {
            "det_tp": 0, "det_fp": 0, "det_fn": 0,
            "sem_tp": 0, "sem_fp": 0, "sem_fn": 0,
            "parent_tp": 0, "parent_fp": 0, "parent_fn": 0,
        }
        for th in iou_thresholds
    }

    small_det_matched = {0.25: 0, 0.50: 0}
    small_sem_matched = {0.25: 0, 0.50: 0}
    small_parent_matched = {0.25: 0, 0.50: 0}
    total_small_gt = 0
    total_gt = 0
    total_fg_predictions = 0

    hierarchical_credit_count_50 = 0
    hierarchical_credit_count_25 = 0

    hier_total_eval = 0
    hier_matches = 0
    hier_tp_matches = 0
    hier_tp_total = 0

    class_stats = {
        c: {"tp_50": 0, "tp_25": 0, "fp_50": 0, "fn_50": 0, "support": 0}
        for c in ROOM_CLASSES
    }
    parent_stats = {
        p: {"tp_50": 0, "tp_25": 0, "fp_50": 0, "fn_50": 0, "support": 0}
        for p in PARENT_CLASSES
    }

    child_confusion_mat = np.zeros((NUM_ROOM_CLASSES + 1, NUM_ROOM_CLASSES + 1), dtype=np.int32)
    parent_confusion_mat = np.zeros((NUM_PARENT_CLASSES + 1, NUM_PARENT_CLASSES + 1), dtype=np.int32)
    within_parent_confusion_count = 0
    cross_parent_confusion_count = 0

    with torch.no_grad():
        for images, targets in dataloader:
            images = images.to(device)
            outputs = model(images)

            pred_logits = outputs["pred_logits"]
            pred_parent_logits = outputs["pred_parent_logits"]
            pred_boxes_1 = outputs["pred_boxes_1"]
            pred_boxes_0 = outputs["pred_boxes_0"]
            pred_masks = outputs["pred_masks"]
            pred_scales = outputs["pred_scale"]

            child_probs = pred_logits.softmax(-1)
            parent_probs = pred_parent_logits.softmax(-1)

            indices = matcher(pred_logits, pred_boxes_1, targets)
            bs = images.size(0)

            for b in range(bs):
                # Scale error
                if targets[b]["has_scale"].item() > 0 and targets[b]["scale_px_per_m"].item() > 0:
                    p_s = pred_scales[b].item()
                    gt_s = targets[b]["scale_px_per_m"].item()
                    scale_errors_pct.append((abs(p_s - gt_s) / max(1.0, gt_s)) * 100.0)

                # Hungarian matching (oracle alignment)
                s_idx, t_idx = indices[b]
                tgt_labels = targets[b]["labels"].to(device)
                tgt_boxes = targets[b]["boxes"].to(device)
                tgt_masks = targets[b]["masks"].to(device) if "masks" in targets[b] else None
                meta = targets[b].get("sample_meta", {})
                gt_rooms = meta.get("rooms", [])
                valid_gt_rooms = [r for r in gt_rooms if r.get("type") in LABEL2ID]

                if len(t_idx) > 0:
                    p_xyxy_1 = box_cxcywh_to_xyxy(pred_boxes_1[b, s_idx])
                    p_xyxy_0 = box_cxcywh_to_xyxy(pred_boxes_0[b, s_idx])
                    t_xyxy = box_cxcywh_to_xyxy(tgt_boxes[t_idx])

                    ious_1, _ = box_iou(p_xyxy_1, t_xyxy)
                    ious_0, _ = box_iou(p_xyxy_0, t_xyxy)
                    hungarian_ious_1.extend(torch.diag(ious_1).cpu().tolist())
                    hungarian_ious_0.extend(torch.diag(ious_0).cpu().tolist())

                    if tgt_masks is not None and tgt_masks.numel() > 0:
                        p_m_prob = pred_masks[b, s_idx].sigmoid()  # [K, 96, 96]
                        p_m_bin = (p_m_prob >= 0.5).cpu().numpy()
                        t_m_bin = (tgt_masks[t_idx] >= 0.5).cpu().numpy()

                        p_flat = p_m_prob.flatten(1)
                        t_flat = tgt_masks[t_idx].flatten(1)

                        # Dice
                        dices = ((2.0 * (p_flat * t_flat).sum(-1) + 1e-5) /
                                 (p_flat.sum(-1) + t_flat.sum(-1) + 1e-5)).cpu().tolist()
                        hungarian_mask_dices.extend(dices)

                        # IoU, Boundary F1, Non-Convex Benchmark & Area Errors
                        for k in range(len(dices)):
                            gt_room_idx = t_idx[k].item()
                            r_info = valid_gt_rooms[gt_room_idx] if gt_room_idx < len(valid_gt_rooms) else {}
                            r_area_m2 = r_info.get("area_m2", r_info.get("dimensions", {}).get("area_m2", 10.0))
                            r_poly = r_info.get("polygon")

                            is_non_convex = False
                            if r_poly and len(r_poly) >= 3:
                                poly_pts = np.array(r_poly, dtype=np.float32).reshape((-1, 1, 2))
                                is_non_convex = not cv2.isContourConvex(poly_pts)
                            elif r_poly and len(r_poly) > 4:
                                is_non_convex = True

                            pm_k = p_m_bin[k]
                            tm_k = t_m_bin[k]

                            inter = (pm_k & tm_k).sum()
                            union = (pm_k | tm_k).sum()
                            m_iou = float(inter) / max(1, union)
                            hungarian_mask_ious.append(m_iou)

                            bf1 = compute_boundary_f1(pm_k, tm_k, tol=2)
                            boundary_f1_scores.append(bf1)

                            if r_area_m2 < 6.0:
                                small_room_mask_dices.append(dices[k])

                            if is_non_convex:
                                non_convex_mask_ious.append(m_iou)
                                non_convex_mask_dices.append(dices[k])

                            # Area Evaluation: Shoelace (Contour) vs Bounding Box
                            gt_scale = targets[b]["scale_px_per_m"].item()
                            if gt_scale > 0 and r_area_m2 > 0:
                                geom = extract_room_geometry_from_mask(p_m_prob[k].cpu().numpy(), threshold=0.5, orig_size=(1024, 1024))
                                if geom is not None and geom["pixel_area"] > 0:
                                    pred_area_m2 = geom["pixel_area"] / (gt_scale ** 2)
                                    area_err = abs(pred_area_m2 - r_area_m2) / r_area_m2 * 100.0
                                    shoelace_area_errors_pct.append(area_err)
                                    if is_non_convex:
                                        non_convex_shoelace_errors.append(area_err)

                                bw_norm, bh_norm = pred_boxes_1[b, s_idx[k]][2].item(), pred_boxes_1[b, s_idx[k]][3].item()
                                bbox_w_px = bw_norm * 1024.0
                                bbox_h_px = bh_norm * 1024.0
                                bbox_area_m2 = (bbox_w_px * bbox_h_px) / (gt_scale ** 2)
                                bbox_err = abs(bbox_area_m2 - r_area_m2) / r_area_m2 * 100.0
                                bbox_area_errors_pct.append(bbox_err)
                                if is_non_convex:
                                    non_convex_bbox_errors.append(bbox_err)

                # Query foreground filtering based on confidence
                top_scores_all, top_classes_all = child_probs[b].max(dim=-1)
                top_parent_scores_all, top_parent_classes_all = parent_probs[b].max(dim=-1)

                num_gt = len(tgt_labels)
                total_gt += num_gt

                for g_idx in range(num_gt):
                    c_id = tgt_labels[g_idx].item()
                    p_id = CHILD_TO_PARENT[c_id]
                    if c_id < NUM_ROOM_CLASSES:
                        class_stats[ROOM_CLASSES[c_id]]["support"] += 1
                    if p_id < NUM_PARENT_CLASSES:
                        parent_stats[PARENT_CLASSES[p_id]]["support"] += 1

                    if g_idx < len(valid_gt_rooms):
                        r = valid_gt_rooms[g_idx]
                        area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                        if area < 6.0:
                            total_small_gt += 1

                keep = (top_classes_all != NO_ROOM_ID) & (top_scores_all >= conf_thresh)
                keep_indices = torch.where(keep)[0]
                num_pred = len(keep_indices)
                total_fg_predictions += num_pred

                if num_pred == 0:
                    for th in iou_thresholds:
                        curve_stats[th]["det_fn"] += num_gt
                        curve_stats[th]["sem_fn"] += num_gt
                        curve_stats[th]["parent_fn"] += num_gt
                    if detailed:
                        for g_idx in range(num_gt):
                            c_id = tgt_labels[g_idx].item()
                            p_id = CHILD_TO_PARENT[c_id]
                            if c_id < NUM_ROOM_CLASSES:
                                class_stats[ROOM_CLASSES[c_id]]["fn_50"] += 1
                                child_confusion_mat[c_id, NO_ROOM_ID] += 1
                            if p_id < NUM_PARENT_CLASSES:
                                parent_stats[PARENT_CLASSES[p_id]]["fn_50"] += 1
                                parent_confusion_mat[p_id, NUM_PARENT_CLASSES] += 1
                    continue

                p_boxes_1 = pred_boxes_1[b, keep_indices]
                p_boxes_0 = pred_boxes_0[b, keep_indices]
                p_classes = top_classes_all[keep_indices]
                p_parents = top_parent_classes_all[keep_indices]
                p_scores = top_scores_all[keep_indices]
                orig_query_indices = keep_indices

                # Sort by confidence descending
                order = p_scores.argsort(descending=True)
                p_boxes_1 = p_boxes_1[order]
                p_boxes_0 = p_boxes_0[order]
                p_classes = p_classes[order]
                p_parents = p_parents[order]
                p_scores = p_scores[order]
                orig_query_indices = orig_query_indices[order]

                # Hierarchical consistency checking
                for idx in keep_indices:
                    q = idx.item()
                    hier_total_eval += 1
                    pred_c = top_classes_all[q].item()
                    pred_p = top_parent_classes_all[q].item()
                    implied_p = CHILD_TO_PARENT[pred_c]
                    if pred_p == implied_p:
                        hier_matches += 1

                if num_gt == 0:
                    for th in iou_thresholds:
                        curve_stats[th]["det_fp"] += num_pred
                        curve_stats[th]["sem_fp"] += num_pred
                        curve_stats[th]["parent_fp"] += num_pred
                    continue

                p_xyxy_1 = box_cxcywh_to_xyxy(p_boxes_1)
                t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
                b_ious_1, _ = box_iou(p_xyxy_1, t_xyxy)

                # DETR 1-to-1 Bipartite Matching
                for th in iou_thresholds:
                    matched_det_gt = set()
                    matched_parent_gt = set()
                    matched_sem_gt = set()

                    for p_idx in range(num_pred):
                        best_iou, best_gt = b_ious_1[p_idx].max(dim=-1)
                        biou = best_iou.item()
                        bgt = best_gt.item()

                        p_cls = p_classes[p_idx].item()
                        p_par = p_parents[p_idx].item()
                        t_cls = tgt_labels[bgt].item()
                        t_par = CHILD_TO_PARENT[t_cls]

                        # 1. Class-Agnostic Detection
                        if biou >= th and bgt not in matched_det_gt:
                            matched_det_gt.add(bgt)
                            curve_stats[th]["det_tp"] += 1
                            if th == 0.50:
                                hier_tp_total += 1
                                if p_par == CHILD_TO_PARENT[p_cls]:
                                    hier_tp_matches += 1

                            if bgt < len(valid_gt_rooms):
                                area = valid_gt_rooms[bgt].get("area_m2", valid_gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                if area < 6.0:
                                    small_det_matched[th] += 1
                        else:
                            curve_stats[th]["det_fp"] += 1

                        # 2. Parent-Category Functional Detection
                        parent_matches = (p_par == t_par) or (CHILD_TO_PARENT[p_cls] == t_par)
                        if biou >= th and bgt not in matched_parent_gt:
                            if parent_matches:
                                curve_stats[th]["parent_tp"] += 1
                                matched_parent_gt.add(bgt)
                                if th == 0.50:
                                    if t_par < NUM_PARENT_CLASSES:
                                        parent_stats[PARENT_CLASSES[t_par]]["tp_50"] += 1
                                    if bgt < len(valid_gt_rooms):
                                        area = valid_gt_rooms[bgt].get("area_m2", valid_gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                        if area < 6.0:
                                            small_parent_matched[0.50] += 1
                                if th == 0.25:
                                    if t_par < NUM_PARENT_CLASSES:
                                        parent_stats[PARENT_CLASSES[t_par]]["tp_25"] += 1
                                    if bgt < len(valid_gt_rooms):
                                        area = valid_gt_rooms[bgt].get("area_m2", valid_gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                        if area < 6.0:
                                            small_parent_matched[0.25] += 1
                            else:
                                curve_stats[th]["parent_fp"] += 1
                        else:
                            curve_stats[th]["parent_fp"] += 1

                        # 3. Fine-Grained 22-Class Semantic Detection
                        if biou >= th and bgt not in matched_sem_gt:
                            if p_cls == t_cls:
                                curve_stats[th]["sem_tp"] += 1
                                matched_sem_gt.add(bgt)
                                if th == 0.50 and t_cls < NUM_ROOM_CLASSES:
                                    class_stats[ROOM_CLASSES[t_cls]]["tp_50"] += 1
                                    if bgt < len(valid_gt_rooms):
                                        area = valid_gt_rooms[bgt].get("area_m2", valid_gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                        if area < 6.0:
                                            small_sem_matched[0.50] += 1
                                if th == 0.25 and t_cls < NUM_ROOM_CLASSES:
                                    class_stats[ROOM_CLASSES[t_cls]]["tp_25"] += 1
                                    if bgt < len(valid_gt_rooms):
                                        area = valid_gt_rooms[bgt].get("area_m2", valid_gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                        if area < 6.0:
                                            small_sem_matched[0.25] += 1
                            else:
                                curve_stats[th]["sem_fp"] += 1
                        else:
                            curve_stats[th]["sem_fp"] += 1

                        # Track Hierarchical Credit
                        if biou >= th:
                            if parent_matches and p_cls != t_cls:
                                if th == 0.50:
                                    hierarchical_credit_count_50 += 1
                                elif th == 0.25:
                                    hierarchical_credit_count_25 += 1

                    curve_stats[th]["det_fn"] += (num_gt - len(matched_det_gt))
                    curve_stats[th]["parent_fn"] += (num_gt - len(matched_parent_gt))
                    curve_stats[th]["sem_fn"] += (num_gt - len(matched_sem_gt))

                # Detailed confusion matrix tracking at IoU >= 0.50
                if detailed:
                    matched_sem_50 = set()
                    matched_par_50 = set()
                    for p_idx in range(num_pred):
                        best_iou, best_gt = b_ious_1[p_idx].max(dim=-1)
                        biou = best_iou.item()
                        bgt = best_gt.item()
                        p_cls = p_classes[p_idx].item()
                        p_par = p_parents[p_idx].item()
                        t_cls = tgt_labels[bgt].item()
                        t_par = CHILD_TO_PARENT[t_cls]
                        p_cname = ROOM_CLASSES[p_cls] if p_cls < NUM_ROOM_CLASSES else "Background"
                        p_pname = PARENT_CLASSES[p_par] if p_par < NUM_PARENT_CLASSES else "Background"

                        if biou >= 0.50 and bgt not in matched_sem_50:
                            child_confusion_mat[t_cls, p_cls] += 1
                            if p_cls == t_cls:
                                matched_sem_50.add(bgt)
                            else:
                                if p_cname in class_stats:
                                    class_stats[p_cname]["fp_50"] += 1
                                if CHILD_TO_PARENT[p_cls] == t_par:
                                    within_parent_confusion_count += 1
                                else:
                                    cross_parent_confusion_count += 1
                        else:
                            child_confusion_mat[NO_ROOM_ID, p_cls] += 1
                            if p_cname in class_stats:
                                class_stats[p_cname]["fp_50"] += 1

                        if biou >= 0.50 and bgt not in matched_par_50:
                            parent_confusion_mat[t_par, p_par] += 1
                            if p_par == t_par or CHILD_TO_PARENT[p_cls] == t_par:
                                matched_par_50.add(bgt)
                            else:
                                if p_pname in parent_stats:
                                    parent_stats[p_pname]["fp_50"] += 1
                        else:
                            parent_confusion_mat[NUM_PARENT_CLASSES, p_par] += 1
                            if p_pname in parent_stats:
                                parent_stats[p_pname]["fp_50"] += 1

                    for g_idx in range(num_gt):
                        if g_idx not in matched_sem_50:
                            t_cls = tgt_labels[g_idx].item()
                            if t_cls < NUM_ROOM_CLASSES:
                                class_stats[ROOM_CLASSES[t_cls]]["fn_50"] += 1
                                child_confusion_mat[t_cls, NO_ROOM_ID] += 1
                        if g_idx not in matched_par_50:
                            t_par = CHILD_TO_PARENT[tgt_labels[g_idx].item()]
                            if t_par < NUM_PARENT_CLASSES:
                                parent_stats[PARENT_CLASSES[t_par]]["fn_50"] += 1
                                parent_confusion_mat[t_par, NUM_PARENT_CLASSES] += 1

    # Aggregate Metrics
    curve_summary = {}
    for th in iou_thresholds:
        st = curve_stats[th]
        det_p = st["det_tp"] / max(1, st["det_tp"] + st["det_fp"])
        det_r = st["det_tp"] / max(1, st["det_tp"] + st["det_fn"])
        det_f1 = (2 * det_p * det_r) / max(1e-6, det_p + det_r)

        sem_p = st["sem_tp"] / max(1, st["sem_tp"] + st["sem_fp"])
        sem_r = st["sem_tp"] / max(1, st["sem_tp"] + st["sem_fn"])
        sem_f1 = (2 * sem_p * sem_r) / max(1e-6, sem_p + sem_r)

        par_p = st["parent_tp"] / max(1, st["parent_tp"] + st["parent_fp"])
        par_r = st["parent_tp"] / max(1, st["parent_tp"] + st["parent_fn"])
        par_f1 = (2 * par_p * par_r) / max(1e-6, par_p + par_r)

        small_recall = small_det_matched[th] / max(1, total_small_gt)

        curve_summary[f"iou_{int(th * 100)}"] = {
            "det_p": det_p, "det_r": det_r, "det_f1": det_f1,
            "sem_p": sem_p, "sem_r": sem_r, "sem_f1": sem_f1,
            "parent_p": par_p, "parent_r": par_r, "parent_f1": par_f1,
            "small_room_recall": small_recall,
            "counts": st,
        }

    # Macro F1 for child classes
    child_f1_list = []
    for c_name, c_s in class_stats.items():
        tp = c_s["tp_50"]
        fp = c_s["fp_50"]
        fn = c_s["fn_50"]
        p = tp / max(1, tp + fp)
        r = tp / max(1, tp + fn)
        f1 = (2 * p * r) / max(1e-6, p + r)
        c_s["f1_50"] = f1
        if c_s["support"] > 0:
            child_f1_list.append(f1)
    child_macro_f1 = float(np.mean(child_f1_list)) if child_f1_list else 0.0

    # Macro F1 for parent classes
    parent_f1_list = []
    for p_name, p_s in parent_stats.items():
        tp = p_s["tp_50"]
        fp = p_s["fp_50"]
        fn = p_s["fn_50"]
        p = tp / max(1, tp + fp)
        r = tp / max(1, tp + fn)
        f1 = (2 * p * r) / max(1e-6, p + r)
        p_s["f1_50"] = f1
        if p_s["support"] > 0:
            parent_f1_list.append(f1)
    parent_macro_f1 = float(np.mean(parent_f1_list)) if parent_f1_list else 0.0

    hier_acc = (hier_matches / max(1, hier_total_eval)) * 100.0
    hier_tp_acc = (hier_tp_matches / max(1, hier_tp_total)) * 100.0

    res = {
        "confidence_threshold": conf_thresh,
        "hungarian_bbox_iou_layer1": float(np.mean(hungarian_ious_1)) if hungarian_ious_1 else 0.0,
        "hungarian_bbox_iou_layer0": float(np.mean(hungarian_ious_0)) if hungarian_ious_0 else 0.0,
        "hungarian_mask_dice": float(np.mean(hungarian_mask_dices)) if hungarian_mask_dices else 0.0,
        "instance_mask_iou": float(np.mean(hungarian_mask_ious)) if hungarian_mask_ious else 0.0,
        "boundary_f1": float(np.mean(boundary_f1_scores)) if boundary_f1_scores else 0.0,
        "small_room_mask_dice": float(np.mean(small_room_mask_dices)) if small_room_mask_dices else 0.0,
        "non_convex_mask_iou": float(np.mean(non_convex_mask_ious)) if non_convex_mask_ious else 0.0,
        "non_convex_mask_dice": float(np.mean(non_convex_mask_dices)) if non_convex_mask_dices else 0.0,
        "shoelace_area_error_pct": float(np.median(shoelace_area_errors_pct)) if shoelace_area_errors_pct else 0.0,
        "bbox_area_error_pct": float(np.median(bbox_area_errors_pct)) if bbox_area_errors_pct else 0.0,
        "non_convex_shoelace_error_pct": float(np.median(non_convex_shoelace_errors)) if non_convex_shoelace_errors else 0.0,
        "non_convex_bbox_error_pct": float(np.median(non_convex_bbox_errors)) if non_convex_bbox_errors else 0.0,
        "scale_error_pct": float(np.median(scale_errors_pct)) if scale_errors_pct else 0.0,
        "hierarchical_consistency_accuracy": hier_acc,
        "hierarchical_tp_consistency_accuracy": hier_tp_acc,
        "hierarchical_credit_count_50": hierarchical_credit_count_50,
        "hierarchical_credit_count_25": hierarchical_credit_count_25,
        "child_macro_f1": child_macro_f1,
        "parent_macro_f1": parent_macro_f1,
        "curve": curve_summary,
    }

    if detailed:
        res["class_stats"] = class_stats
        res["parent_stats"] = parent_stats
        res["within_parent_confusion_count"] = within_parent_confusion_count
        res["cross_parent_confusion_count"] = cross_parent_confusion_count
        res["child_confusion_matrix"] = child_confusion_mat.tolist()
        res["parent_confusion_matrix"] = parent_confusion_mat.tolist()

    return res


# =====================================================================
# Diagnostic Visualizer for G4-B
# =====================================================================

def generate_g4b_diagnostic_panels(model, test_ds, device, out_dir="evaluation_results/g4b_diagnostics",
                                   sample_indices=[0, 3, 7, 12, 25, 42, 60], conf_thresh=0.20):
    """
    Generates 4-panel visual verification images for G4-B:
      Panel 1: Ground Truth CAD Polygons and Room Labels
      Panel 2: Predicted Dynamic Instance Masks (color-coded per room interior)
      Panel 3: Predicted Bounding Boxes + Fine-Grained Classes
      Panel 4: Reconstructed CAD Polygons (Douglas-Peucker) with Area (m^2) vs BBox Area
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    model.eval()

    COLORS = [
        (220, 20, 60), (30, 144, 255), (50, 205, 50), (255, 140, 0),
        (138, 43, 226), (0, 206, 209), (255, 20, 147), (218, 165, 32),
        (75, 0, 130), (0, 128, 128), (205, 92, 92), (70, 130, 180),
    ]

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
            pred_boxes_1 = outputs["pred_boxes_1"][0]
            pred_masks_prob = outputs["pred_masks_prob"][0]
            pred_scale = outputs["pred_scale"][0].item()

            child_probs = pred_logits.softmax(-1)

        top_scores, top_classes = child_probs.max(dim=-1)
        keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)
        keep_indices = torch.where(keep)[0]

        panel_w = orig_w
        panel_h = orig_h
        canvas = Image.new("RGB", (panel_w * 4, panel_h + 40), (255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        gt_rooms = sample.get("rooms", [])
        gt_scale = sample.get("pixels_per_meter", sample.get("raw_pixels_per_meter", 0.0))

        # Panel 1: Ground Truth CAD Polygons
        canvas.paste(orig_img, (0, 40))
        draw.text((15, 10), f"SAMPLE #{s_idx} - GT CAD INTERIOR POLYGONS", fill=(0, 0, 0))
        for r_i, r in enumerate(gt_rooms):
            col = COLORS[r_i % len(COLORS)]
            c_name = r.get("type", "Room")
            gt_area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 0.0))
            poly = r.get("polygon")
            if poly and len(poly) >= 3:
                pts = [(int(pt[0] * panel_w), int(pt[1] * panel_h) + 40) for pt in poly]
                draw.polygon(pts, outline=col, width=3)
                lbl = f"{c_name} ({gt_area:.1f}m²)"
                draw.text((pts[0][0], max(40, pts[0][1] - 14)), lbl, fill=col)
            else:
                b = r.get("bbox", [0, 0, 0, 0])
                bx0 = int(b[0] * panel_w)
                by0 = int(b[1] * panel_h) + 40
                bw_p = int(b[2] * panel_w)
                bh_p = int(b[3] * panel_h)
                draw.rectangle([bx0, by0, bx0 + bw_p, by0 + bh_p], outline=col, width=2)
                lbl = f"{c_name} ({gt_area:.1f}m²)"
                draw.text((bx0, max(40, by0 - 14)), lbl, fill=col)

        # Panel 2: Predicted Dynamic Instance Masks (Blended Color Overlay)
        mask_canvas = orig_img.copy()
        mask_np = np.array(mask_canvas)
        for r_i, idx in enumerate(keep_indices):
            q_i = idx.item()
            col = COLORS[r_i % len(COLORS)]
            m_prob = pred_masks_prob[q_i].cpu().numpy()
            m_full = cv2.resize((m_prob >= 0.5).astype(np.uint8), (panel_w, panel_h), interpolation=cv2.INTER_NEAREST)
            for c in range(3):
                mask_np[:, :, c] = np.where(m_full > 0, (mask_np[:, :, c] * 0.4 + col[c] * 0.6).astype(np.uint8), mask_np[:, :, c])

        canvas.paste(Image.fromarray(mask_np), (panel_w, 40))
        draw.text((panel_w + 15, 10), "DYNAMIC INSTANCE MASKS (INTERIOR RECOVERY)", fill=(0, 0, 180))

        # Panel 3: Predicted Bounding Boxes
        canvas.paste(orig_img, (panel_w * 2, 40))
        draw.text((panel_w * 2 + 15, 10), "PREDICTED BOUNDING BOXES (G3-C / G4-A)", fill=(0, 100, 0))
        for r_i, idx in enumerate(keep_indices):
            q_i = idx.item()
            col = COLORS[r_i % len(COLORS)]
            c_id = top_classes[q_i].item()
            c_name = ROOM_CLASSES[c_id] if c_id < NUM_ROOM_CLASSES else "Background"
            c_score = top_scores[q_i].item()
            cx, cy, bw, bh = pred_boxes_1[q_i].tolist()
            x0 = int((cx - bw / 2.0) * panel_w) + panel_w * 2
            y0 = int((cy - bh / 2.0) * panel_h) + 40
            w_px = int(bw * panel_w)
            h_px = int(bh * panel_h)
            draw.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=2)
            lbl = f"{c_name} ({c_score:.2f})"
            draw.text((x0 + 2, max(40, y0 - 14)), lbl, fill=col)

        # Panel 4: Reconstructed CAD Polygons + Area Comparison
        recon_canvas = orig_img.copy()
        recon_draw = ImageDraw.Draw(recon_canvas)
        active_scale = pred_scale if pred_scale > 0 else (gt_scale if gt_scale > 0 else 50.0)

        for r_i, idx in enumerate(keep_indices):
            q_i = idx.item()
            col = COLORS[r_i % len(COLORS)]
            m_prob = pred_masks_prob[q_i].cpu().numpy()
            geom = extract_room_geometry_from_mask(m_prob, threshold=0.5, orig_size=(panel_w, panel_h))
            if geom and geom["polygon"]:
                pts = [(int(pt[0] * panel_w), int(pt[1] * panel_h)) for pt in geom["polygon"]]
                if len(pts) >= 3:
                    recon_draw.polygon(pts, outline=col, width=3)
                    shoelace_area_m2 = geom["pixel_area"] / (active_scale ** 2)
                    cx, cy, bw, bh = pred_boxes_1[q_i].tolist()
                    bbox_area_m2 = (bw * panel_w * bh * panel_h) / (active_scale ** 2)
                    lbl = f"Poly: {shoelace_area_m2:.1f}m² | Box: {bbox_area_m2:.1f}m²"
                    recon_draw.text((pts[0][0], max(0, pts[0][1] - 14)), lbl, fill=col)

        canvas.paste(recon_canvas, (panel_w * 3, 40))
        draw.text((panel_w * 3 + 15, 10), "RECONSTRUCTED CAD POLYGONS (SHOELACE AREA)", fill=(180, 0, 180))

        out_file = out_dir / f"g4b_diagnostic_sample_{s_idx}.png"
        canvas.save(out_file)

    print(f"Saved {len(sample_indices)} G4-B diagnostic panels to {out_dir}.", flush=True)


# =====================================================================
# Main Training & Evaluation Pipeline
# =====================================================================

def run_experiment_g4b(epochs=5, batch_size=7, img_size=384, eval_only=False):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 80, flush=True)
    print("EXPERIMENT G4-B: DYNAMIC INSTANCE MASKS FOR ROOM INTERIORS", flush=True)
    print(f"Device: {device} | Epochs: {epochs} | Batch Size: {batch_size} | Image Size: {img_size}", flush=True)
    print("Base Checkpoint: checkpoints/multitask/experiment_g4a_best.pt", flush=True)
    print("Target Checkpoint: checkpoints/multitask/experiment_g4b_best.pt", flush=True)
    print("=" * 80, flush=True)

    # 1. Dataset Partitioning (Identical 500-layout partition)
    print("\nSelecting identical class-balanced 500-layout partition...", flush=True)
    t_lids, train_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/train.json", 350)
    v_lids, val_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/validation.json", 75)
    te_lids, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)

    print(f"Train split:      {len(train_samples)} images ({len(t_lids)} layouts)")
    print(f"Validation split: {len(val_samples)} images ({len(v_lids)} layouts)")
    print(f"Test split:       {len(test_samples)} images ({len(te_lids)} layouts)")

    # 2. Pre-cache dataset in RAM with Canonical Non-Overlapping Instance Masks
    def cache_dataset(samples):
        ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=img_size, mask_size=(96, 96))
        ds.samples = samples
        items = []
        for i in range(len(ds)):
            item = ds[i]
            item["sample_meta"] = samples[i]
            valid_rooms = [r for r in samples[i]["rooms"] if r.get("type") in LABEL2ID]
            item["masks"] = rasterize_canonical_instance_masks(valid_rooms, mask_size=(96, 96))
            items.append(item)
        return InMemoryDataset(items)

    print("\nPre-caching datasets in RAM with canonical instance masks...", flush=True)
    t_c0 = time.time()
    train_ds = cache_dataset(train_samples)
    val_ds = cache_dataset(val_samples)
    test_ds = cache_dataset(test_samples)
    print(f"Pre-caching complete in {time.time() - t_c0:.1f}s.", flush=True)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, collate_fn=collate_fn_with_meta)
    val_loader = DataLoader(val_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)
    test_loader = DataLoader(test_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

    # 3. Model Initialization & Warm-Start from G4-A
    print("\nInitializing G4-B Dynamic Instance Mask Model...", flush=True)
    model = MultiTaskViT384G4B(img_size=img_size).to(device)

    g4a_ckpt_path = Path("checkpoints/multitask/experiment_g4a_best.pt")
    g4b_ckpt_path = Path("checkpoints/multitask/experiment_g4b_best.pt")
    interrupted_ckpt_path = Path("checkpoints/multitask/experiment_g4b_interrupted.pt")

    if eval_only:
        eval_path = g4b_ckpt_path if g4b_ckpt_path.exists() else g4a_ckpt_path
        print(f"Loading checkpoint for evaluation: {eval_path}...", flush=True)
        model.load_state_dict(torch.load(eval_path, map_location=device), strict=False)
    else:
        if not g4a_ckpt_path.exists():
            raise FileNotFoundError(f"Required base checkpoint not found: {g4a_ckpt_path}")
        print(f"Warm-starting directly from G4-A: {g4a_ckpt_path}...", flush=True)
        matched = load_g4b_from_g4a(model, g4a_ckpt_path, device=device)
        print(f"Loaded {matched} weight tensors from G4-A into G4-B.", flush=True)

    # 4. ViT Frozen Backbone & Parameter Groups
    for p in model.encoder.parameters():
        p.requires_grad = False

    dyn_mask_params = list(model.dynamic_mask_head.parameters())
    parent_head_params = list(model.parent_head.parameters())
    class_head_params = list(model.class_head.parameters())
    refine_params = list(model.bbox_head_1.parameters()) + list(model.bbox_head_0.parameters())
    decoder_params = (
        list(model.decoder_global.parameters()) +
        list(model.decoder_highres.parameters()) +
        list(model.query_embed_global.parameters()) +
        list(model.query_embed_highres.parameters()) +
        list(model.p8_proj.parameters())
    )
    fpn_scale_params = (
        list(model.semantic_head.parameters()) +
        list(model.fpn.parameters()) +
        list(model.scale_head.parameters())
    )

    print(f"\nTrainable parameter groups:", flush=True)
    print(f"  - Dynamic Mask Head:         {sum(p.numel() for p in dyn_mask_params):,} params (LR: 1.5e-4)", flush=True)
    print(f"  - Parent Functional Head:    {sum(p.numel() for p in parent_head_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - Fine-Grained Class Head:   {sum(p.numel() for p in class_head_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - Refinement BBox Heads:     {sum(p.numel() for p in refine_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - Decoders & Query Pathways: {sum(p.numel() for p in decoder_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - FPN, Semantic & Scale:     {sum(p.numel() for p in fpn_scale_params):,} params (LR: 1.0e-5)", flush=True)

    optimizer = torch.optim.AdamW([
        {"params": dyn_mask_params, "lr": 1.5e-4, "weight_decay": 1e-4},
        {"params": parent_head_params, "lr": 3.0e-5, "weight_decay": 1e-4},
        {"params": class_head_params, "lr": 3.0e-5, "weight_decay": 1e-5},
        {"params": refine_params, "lr": 3.0e-5, "weight_decay": 1e-4},
        {"params": decoder_params, "lr": 3.0e-5, "weight_decay": 1e-4},
        {"params": fpn_scale_params, "lr": 1.0e-5, "weight_decay": 1e-4},
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    # 5. Loss Configuration
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterionG4B(
        matcher=matcher,
        num_classes=NUM_ROOM_CLASSES,
        num_parent_classes=NUM_PARENT_CLASSES,
        weight_class=1.0,
        weight_parent=0.5,
        weight_consist=0.5,
        weight_bbox=5.0,
        weight_giou=2.0,
        weight_mask=4.0,  # Elevated dynamic mask supervision weight
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
        print(f"Pre-extracted ViT features for 150 batches in {time.time() - t_fe0:.1f}s. Fast CPU training enabled!", flush=True)

        print("\nEvaluating baseline validation performance before starting training...", flush=True)
        base_val_m = evaluate_g4b(model, val_loader, device, conf_thresh=0.20, detailed=False)
        best_val_score = base_val_m["hungarian_mask_dice"] + base_val_m["instance_mask_iou"] + base_val_m["hungarian_bbox_iou_layer1"]
        print(f"Baseline Val Mask Dice: {base_val_m['hungarian_mask_dice']:.4f} | Mask IoU: {base_val_m['instance_mask_iou']:.4f} | Hungarian BBox IoU: {base_val_m['hungarian_bbox_iou_layer1']:.4f} | Non-Convex IoU: {base_val_m['non_convex_mask_iou']:.4f}", flush=True)

        print("\nStarting G4-B Dynamic Instance Mask training...", flush=True)
        best_epoch = 0

        try:
            for epoch in range(1, epochs + 1):
                t_ep0 = time.time()
                model.train()
                train_loss_total = 0.0
                train_loss_child = 0.0
                train_loss_parent = 0.0
                train_loss_consist = 0.0
                train_loss_bbox1 = 0.0
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
                    train_loss_child += loss_dict["loss_child_ce"].item()
                    train_loss_parent += loss_dict["loss_parent_ce"].item()
                    train_loss_consist += loss_dict["loss_consist"].item()
                    train_loss_bbox1 += loss_dict["loss_bbox_1"].item()
                    train_loss_mask += loss_dict["loss_mask"].item()

                scheduler.step()

                avg_loss = train_loss_total / len(train_features)
                avg_child = train_loss_child / len(train_features)
                avg_parent = train_loss_parent / len(train_features)
                avg_consist = train_loss_consist / len(train_features)
                avg_bbox1 = train_loss_bbox1 / len(train_features)
                avg_mask = train_loss_mask / len(train_features)

                # Validation
                val_res = evaluate_g4b(model, val_loader, device, conf_thresh=0.20, detailed=False)
                val_dice = val_res["hungarian_mask_dice"]
                val_iou = val_res["instance_mask_iou"]
                val_bf1 = val_res["boundary_f1"]
                val_nc_iou = val_res["non_convex_mask_iou"]
                val_h_iou = val_res["hungarian_bbox_iou_layer1"]
                val_det_f1 = val_res["curve"]["iou_50"]["det_f1"]
                val_score = val_dice + val_iou + val_h_iou

                ep_time = time.time() - t_ep0
                print(f"Epoch {epoch:02d}/{epochs:02d} [{ep_time:.1f}s] | Loss: {avg_loss:.4f} [Mask: {avg_mask:.3f}, BBox1: {avg_bbox1:.3f}, Child: {avg_child:.3f}] | Val Dice: {val_dice:.4f} | Mask IoU: {val_iou:.4f} | Boundary F1: {val_bf1:.4f} | Non-Convex IoU: {val_nc_iou:.4f} | BBox IoU: {val_h_iou:.4f}", flush=True)

                if val_score > best_val_score:
                    best_val_score = val_score
                    best_epoch = epoch
                    torch.save(model.state_dict(), g4b_ckpt_path)
                    print(f"  >>> Best G4-B model saved to {g4b_ckpt_path} (Val Score: {val_score:.4f})", flush=True)

        except KeyboardInterrupt:
            print(f"\nTraining interrupted! Saving model state to {interrupted_ckpt_path}...", flush=True)
            torch.save(model.state_dict(), interrupted_ckpt_path)

        if not g4b_ckpt_path.exists():
            print(f"Saving final epoch weights to {g4b_ckpt_path}...", flush=True)
            torch.save(model.state_dict(), g4b_ckpt_path)

        print(f"\nLoading best checkpoint from epoch {best_epoch} for final test evaluation...", flush=True)
        model.load_state_dict(torch.load(g4b_ckpt_path, map_location=device))

    # 6. Comprehensive Test Set Sweeps & Audit
    print("\n" + "=" * 80, flush=True)
    print("RUNNING COMPREHENSIVE G4-B TEST SET EVALUATION ACROSS CONFIDENCE SWEEPS", flush=True)
    print("=" * 80, flush=True)

    sweep_thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]
    sweep_results = {}

    for c_th in sweep_thresholds:
        t0 = time.time()
        print(f"Evaluating at confidence threshold: {c_th:.2f}...", flush=True)
        res = evaluate_g4b(model, test_loader, device, conf_thresh=c_th, detailed=(c_th == 0.20))
        sweep_results[f"conf_{int(c_th * 100)}"] = res
        print(f"  Conf {c_th:.2f} [{time.time() - t0:.1f}s]: Mask Dice: {res['hungarian_mask_dice']:.4f} | Mask IoU: {res['instance_mask_iou']:.4f} | Boundary F1: {res['boundary_f1']:.4f} | Det F1 (0.50): {res['curve']['iou_50']['det_f1']:.4f} | Hungarian BBox IoU: {res['hungarian_bbox_iou_layer1']:.4f}", flush=True)

    # 7. Save Comprehensive JSON Results
    results_dir = Path("evaluation_results")
    results_dir.mkdir(parents=True, exist_ok=True)
    results_path = results_dir / "experiment_g4b_results.json"

    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(sweep_results, f, indent=2)
    print(f"\nComplete evaluation results saved to: {results_path}", flush=True)

    # 8. Generate Visual Diagnostic Panels
    print("\nGenerating visual verification panels for G4-B...", flush=True)
    generate_g4b_diagnostic_panels(
        model, test_ds, device,
        out_dir="evaluation_results/g4b_diagnostics",
        sample_indices=[0, 3, 7, 12, 25, 42, 60],
        conf_thresh=0.20
    )

    print("\nEXPERIMENT G4-B PIPELINE COMPLETED SUCCESSFULLY!", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Experiment G4-B Dynamic Instance Masks")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=7, help="Training batch size")
    parser.add_argument("--eval-only", action="store_true", help="Run evaluation without training")
    args = parser.parse_args()

    run_experiment_g4b(epochs=args.epochs, batch_size=args.batch_size, eval_only=args.eval_only)
