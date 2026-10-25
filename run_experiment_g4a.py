"""
HomeVerse - Experiment G4-A: Hierarchical Functional Supervision
===============================================================
Objective:
  Test whether hierarchical classification improves semantic understanding without
  damaging the geometric localization and boundary refinement achieved in G3-C.

Experimental Controls (Strict Protocol):
  1. Initialization: warm-started directly from 'checkpoints/multitask/experiment_g3c_best.pt'.
  2. Query Pathway: Unchanged (20 Global + 20 High-Res P8 queries).
  3. Bounding-Box Refinement: Unchanged (inverse-sigmoid single-layer delta update).
  4. Backbone & FPN: Unchanged (ViT-B/16 @ 384x384, frozen backbone).
  5. Dataset & Split: Same 500 layouts (350 train, 75 val, 75 test).
  6. Room Geometry & Scale Losses: Preserved exactly as in G3-C.
  7. New Intervention: Hierarchical Functional Supervision
     - Original 22-class head retained.
     - New parent functional category head (9 functional categories + background).
     - Consistency loss enforcing agreement between parent and child predictions.
"""

import sys
import os
import time
import math
import json
import argparse
from pathlib import Path
from collections import defaultdict, Counter
from PIL import Image, ImageDraw, ImageFont

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from transformers import ViTModel, ViTConfig

from floorplan_dataset import (
    FloorplanDataset,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    LABEL2ID,
    ID2LABEL,
    get_image_transform,
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
    compute_mask_loss,
)
from run_experiment_f2 import (
    select_balanced_split,
    InMemoryDataset,
    collate_fn_with_meta,
)
from run_experiment_g3c import (
    MultiTaskViT384FPNRefine,
    inverse_sigmoid,
    build_box_head,
)

# =====================================================================
# Functional Taxonomy Definition (9 Parent Categories + Background)
# =====================================================================

PARENT_CLASSES = [
    "Living Area",        # 0: Living Room (0), Dining Room (2)
    "Bedroom Area",       # 1: Master Bedroom (4), Bedroom (5), Children's Bedroom (6), Guest Bedroom (7)
    "Cooking Area",       # 2: Kitchen (1), Kitchen & Dining (3)
    "Wet Area",           # 3: Bathroom (8), Toilet (9)
    "Study / Work Area",  # 4: Study Room (10), Office (11)
    "Circulation",        # 5: Corridor (16), Entrance/Foyer (17), Staircase (21)
    "Utility Area",       # 6: Utility Room (12), Laundry Room (13), Storage Room (18), Walk-in Closet (19)
    "Outdoor Area",       # 7: Balcony (14), Terrace (15)
    "Garage / Parking",   # 8: Garage (20)
]
NUM_PARENT_CLASSES = len(PARENT_CLASSES)  # 9
NO_ROOM_PARENT_ID = NUM_PARENT_CLASSES    # 9 = Background

# Exact 1-to-1 Child to Parent Mapping (Every child class has exactly one parent)
CHILD_TO_PARENT = {
    0: 0,   # Living Room -> Living Area
    1: 2,   # Kitchen -> Cooking Area
    2: 0,   # Dining Room -> Living Area
    3: 2,   # Kitchen & Dining -> Cooking Area
    4: 1,   # Master Bedroom -> Bedroom Area
    5: 1,   # Bedroom -> Bedroom Area
    6: 1,   # Children's Bedroom -> Bedroom Area
    7: 1,   # Guest Bedroom -> Bedroom Area
    8: 3,   # Bathroom -> Wet Area
    9: 3,   # Toilet -> Wet Area
    10: 4,  # Study Room -> Study / Work Area
    11: 4,  # Office -> Study / Work Area
    12: 6,  # Utility Room -> Utility Area
    13: 6,  # Laundry Room -> Utility Area
    14: 7,  # Balcony -> Outdoor Area
    15: 7,  # Terrace -> Outdoor Area
    16: 5,  # Corridor -> Circulation
    17: 5,  # Entrance/Foyer -> Circulation
    18: 6,  # Storage Room -> Utility Area
    19: 6,  # Walk-in Closet -> Utility Area
    20: 8,  # Garage -> Garage / Parking
    21: 5,  # Staircase -> Circulation
    22: 9,  # Background -> Background
}

PARENT_TO_CHILDREN = {p: [] for p in range(NUM_PARENT_CLASSES + 1)}
for c, p in CHILD_TO_PARENT.items():
    PARENT_TO_CHILDREN[p].append(c)


# =====================================================================
# Model Architecture: MultiTaskViT384G4A
# =====================================================================

class MultiTaskViT384G4A(MultiTaskViT384FPNRefine):
    """
    Experiment G4-A Architecture:
    Extends G3-C (Two-Scale Queries + Iterative Inverse-Sigmoid BBox Refinement)
    with a dedicated Functional Parent Category Head:
      - self.class_head: Linear(768, 23) -> 22 fine-grained classes + background
      - self.parent_head: Linear(768, 10) -> 9 parent categories + background
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-384",
                 img_size=384, num_queries_global=20, num_queries_highres=20,
                 num_classes=NUM_ROOM_CLASSES, num_parent_classes=NUM_PARENT_CLASSES,
                 decoder_layers=2):
        super().__init__(
            pretrained_model_name=pretrained_model_name,
            img_size=img_size,
            num_queries_global=num_queries_global,
            num_queries_highres=num_queries_highres,
            num_classes=num_classes,
            decoder_layers=decoder_layers,
        )
        self.num_parent_classes = num_parent_classes
        hidden_dim = self.encoder.config.hidden_size  # 768
        self.parent_head = nn.Linear(hidden_dim, num_parent_classes + 1)

    def forward_with_features(self, cls_token, f6, f9, f12):
        out = super().forward_with_features(cls_token, f6, f9, f12)
        hs_1 = out["hs_1"]
        pred_parent_logits = self.parent_head(hs_1)  # [B, 40, 10]
        out["pred_parent_logits"] = pred_parent_logits
        return out


def load_g4a_from_g3c(model, g3c_ckpt_path, device="cpu"):
    """
    Warm-starts all weights from experiment_g3c_best.pt.
    Initializes parent_head directly from fine-grained class_head by averaging
    the child class weights and biases belonging to each parent category.
    """
    g3c_weights = torch.load(g3c_ckpt_path, map_location=device)
    model_state = model.state_dict()
    matched_keys = []

    for k, v in g3c_weights.items():
        if k in model_state and model_state[k].shape == v.shape:
            model_state[k].copy_(v)
            matched_keys.append(k)

    # Initialize parent_head from class_head by averaging child weights
    class_w = g3c_weights["class_head.weight"]  # [23, 768]
    class_b = g3c_weights["class_head.bias"]    # [23]

    for p in range(NUM_PARENT_CLASSES):
        children = PARENT_TO_CHILDREN[p]
        p_w = torch.stack([class_w[c] for c in children]).mean(dim=0)
        p_b = torch.stack([class_b[c] for c in children]).mean(dim=0)
        model_state["parent_head.weight"][p].copy_(p_w)
        model_state["parent_head.bias"][p].copy_(p_b)

    # Background
    model_state["parent_head.weight"][NO_ROOM_PARENT_ID].copy_(class_w[22])
    model_state["parent_head.bias"][NO_ROOM_PARENT_ID].copy_(class_b[22])
    matched_keys.extend(["parent_head.weight", "parent_head.bias"])

    model.load_state_dict(model_state)
    uninitialized = [k for k in model_state if k not in matched_keys]
    return len(matched_keys), uninitialized


# =====================================================================
# Hierarchical Multi-Task Criterion
# =====================================================================

class MultiTaskCriterionG4A(nn.Module):
    """
    Preserves all G3-C geometric, scale, and wall segmentation losses:
      - CE child: 1.0, BBox 1: 5.0, GIoU 1: 2.0, Aux BBox 0: 2.5, Aux GIoU 0: 1.0
      - Mask: 2.5, Scale: 0.1, EOS: 0.1
    Adds Hierarchical Functional Supervision:
      - Parent CE loss (weight 0.5, EOS 0.1)
      - Bidirectional Hierarchical Consistency Loss (weight 0.5)
    """
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES, num_parent_classes=NUM_PARENT_CLASSES,
                 weight_class=1.0, weight_parent=0.5, weight_consist=0.5,
                 weight_bbox=5.0, weight_giou=2.0, weight_mask=2.5, weight_scale=0.1,
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

        # Child class empty weight (EOS = 0.1 for background class 22)
        child_empty_weight = torch.ones(num_classes + 1)
        child_empty_weight[num_classes] = eos_coef
        self.register_buffer("child_empty_weight", child_empty_weight)

        # Parent class empty weight (EOS = 0.1 for background parent 9)
        parent_empty_weight = torch.ones(num_parent_classes + 1)
        parent_empty_weight[num_parent_classes] = eos_coef
        self.register_buffer("parent_empty_weight", parent_empty_weight)

        # Mapping tensor: child_id -> parent_id
        child_to_parent_tensor = torch.zeros(num_classes + 1, dtype=torch.int64)
        for c, p in CHILD_TO_PARENT.items():
            child_to_parent_tensor[c] = p
        self.register_buffer("child_to_parent_tensor", child_to_parent_tensor)

        # Aggregation matrix: [10, 23]
        child_to_parent_matrix = torch.zeros(num_parent_classes + 1, num_classes + 1)
        for c, p in CHILD_TO_PARENT.items():
            child_to_parent_matrix[p, c] = 1.0
        self.register_buffer("child_to_parent_matrix", child_to_parent_matrix)

    def forward(self, outputs, targets):
        pred_logits = outputs["pred_logits"]                 # [B, 40, 23]
        pred_parent_logits = outputs["pred_parent_logits"]   # [B, 40, 10]
        pred_boxes_1 = outputs["pred_boxes_1"]               # [B, 40, 4]
        pred_boxes_0 = outputs["pred_boxes_0"]               # [B, 40, 4]
        pred_masks = outputs["pred_masks"]                   # [B, 40, 96, 96]
        pred_log_scale = outputs["pred_log_scale"]           # [B]

        indices = self.matcher(pred_logits, pred_boxes_1, targets)
        bs, num_queries = pred_logits.shape[:2]

        # 1. Child Classification Loss
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

        # 2. Parent Functional Classification Loss
        loss_parent_ce = F.cross_entropy(
            pred_parent_logits.flatten(0, 1), target_parents.flatten(),
            weight=self.parent_empty_weight.to(pred_logits.device)
        )

        # 3. Hierarchical Consistency Loss (Bidirectional KL divergence normalized by num_queries)
        p_child = F.softmax(pred_logits, dim=-1)             # [B, 40, 23]
        p_parent = F.softmax(pred_parent_logits, dim=-1)     # [B, 40, 10]
        p_implied = torch.matmul(p_child, self.child_to_parent_matrix.t().to(pred_logits.device)) # [B, 40, 10]

        kl_1 = F.kl_div((p_parent + 1e-7).log(), p_implied, reduction="batchmean") / num_queries
        kl_2 = F.kl_div((p_implied + 1e-7).log(), p_parent, reduction="batchmean") / num_queries
        loss_consist = 0.5 * (kl_1 + kl_2)

        # 4. BBox Losses (Layer 1 + Auxiliary Layer 0)
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

        # 5. Mask Loss
        if src_masks_list and target_masks_list:
            all_src_masks = torch.cat(src_masks_list, dim=0)
            all_target_masks = torch.cat(target_masks_list, dim=0)
            if all_src_masks.shape[-2:] != all_target_masks.shape[-2:]:
                all_target_masks = F.interpolate(all_target_masks.unsqueeze(1), size=all_src_masks.shape[-2:], mode="nearest").squeeze(1)
            loss_mask, _, _ = compute_mask_loss(all_src_masks, all_target_masks)
        else:
            loss_mask = torch.tensor(0.0, device=pred_logits.device)

        # 6. Scale Loss
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
# Comprehensive Evaluator for G4-A
# =====================================================================

def evaluate_g4a(model, dataloader, device, conf_thresh=0.20, detailed=False):
    """
    Evaluates G4-A across all dimensions required by the evaluation protocol:
      1. Hungarian BBox IoU (Layer 1 and Layer 0)
      2. Wall Mask Dice
      3. Scale error %
      4. Detection Precision / Recall / F1 (IoU >= 0.25, 0.35, 0.50, 0.75)
      5. Small-Room Recall (IoU >= 0.25, 0.35, 0.50)
      6. Fine-grained 22-class Semantic Precision / Recall / F1
      7. Parent-category Functional Precision / Recall / F1
      8. Hierarchical Credit (Cases where parent is correct despite fine-grained confusion)
      9. Confusion matrices (22x22 child, 9x9 parent)
      10. Within-group vs cross-group confusion distribution
    """
    model.eval()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    iou_thresholds = [0.25, 0.35, 0.50, 0.75]
    curve_stats = {
        th: {
            "det_tp": 0, "det_fp": 0, "det_fn": 0,
            "sem_tp": 0, "sem_fp": 0, "sem_fn": 0,
            "parent_tp": 0, "parent_fp": 0, "parent_fn": 0,
        }
        for th in iou_thresholds
    }

    hungarian_ious_1 = []
    hungarian_ious_0 = []
    hungarian_dices = []
    scale_errors_pct = []

    # Small room tracking
    small_det_matched = {th: 0 for th in iou_thresholds}
    small_sem_matched = {th: 0 for th in iou_thresholds}
    small_parent_matched = {th: 0 for th in iou_thresholds}
    total_small_gt = 0
    total_gt = 0

    # Query groups (Global vs High-Res)
    query_group_stats = {
        "global": {"predictions": 0, "tp_25": 0, "tp_50": 0, "fp_50": 0, "small_room_tp_25": 0, "small_room_tp_50": 0},
        "highres": {"predictions": 0, "tp_25": 0, "tp_50": 0, "fp_50": 0, "small_room_tp_25": 0, "small_room_tp_50": 0},
    }

    # Hit-rate style tracking (class-agnostic any-hit)
    hitrate_matched_all = {th: 0 for th in iou_thresholds}
    hitrate_matched_small = {th: 0 for th in iou_thresholds}
    hitrate_matched_layer0_all = {th: 0 for th in iou_thresholds}
    hitrate_matched_layer0_small = {th: 0 for th in iou_thresholds}

    # Hierarchical credit tracking
    hierarchical_credit_count_50 = 0
    hierarchical_credit_count_25 = 0
    within_parent_confusion_count = 0
    cross_parent_confusion_count = 0

    # Detailed per-class and per-parent statistics
    class_stats = {c: {"tp_50": 0, "fp_50": 0, "fn_50": 0, "tp_25": 0, "support": 0} for c in ROOM_CLASSES}
    parent_stats = {p: {"tp_50": 0, "fp_50": 0, "fn_50": 0, "tp_25": 0, "support": 0} for p in PARENT_CLASSES}

    child_confusion_mat = np.zeros((NUM_ROOM_CLASSES + 1, NUM_ROOM_CLASSES + 1), dtype=np.int64)
    parent_confusion_mat = np.zeros((NUM_PARENT_CLASSES + 1, NUM_PARENT_CLASSES + 1), dtype=np.int64)

    total_queries_eval = 0
    total_fg_predictions = 0

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

                if len(t_idx) > 0:
                    p_xyxy_1 = box_cxcywh_to_xyxy(pred_boxes_1[b, s_idx])
                    p_xyxy_0 = box_cxcywh_to_xyxy(pred_boxes_0[b, s_idx])
                    t_xyxy = box_cxcywh_to_xyxy(tgt_boxes[t_idx])

                    ious_1, _ = box_iou(p_xyxy_1, t_xyxy)
                    ious_0, _ = box_iou(p_xyxy_0, t_xyxy)
                    hungarian_ious_1.extend(torch.diag(ious_1).cpu().tolist())
                    hungarian_ious_0.extend(torch.diag(ious_0).cpu().tolist())

                    if tgt_masks is not None and tgt_masks.numel() > 0:
                        p_m = pred_masks[b, s_idx].sigmoid().flatten(1)
                        t_m = tgt_masks[t_idx].flatten(1)
                        d = ((2.0 * (p_m * t_m).sum(-1) + 1e-5) / (p_m.sum(-1) + t_m.sum(-1) + 1e-5)).cpu().tolist()
                        hungarian_dices.extend(d)

                # Query foreground filtering based on confidence
                top_scores_all, top_classes_all = child_probs[b].max(dim=-1)
                top_parent_scores_all, top_parent_classes_all = parent_probs[b].max(dim=-1)
                num_q = len(top_classes_all)
                total_queries_eval += num_q

                num_gt = len(tgt_labels)
                total_gt += num_gt

                # Count ground truth supports
                for g_idx in range(num_gt):
                    c_id = tgt_labels[g_idx].item()
                    p_id = CHILD_TO_PARENT[c_id]
                    if c_id < NUM_ROOM_CLASSES:
                        class_stats[ROOM_CLASSES[c_id]]["support"] += 1
                    if p_id < NUM_PARENT_CLASSES:
                        parent_stats[PARENT_CLASSES[p_id]]["support"] += 1

                    if g_idx < len(gt_rooms):
                        r = gt_rooms[g_idx]
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
                                parent_confusion_mat[p_id, NO_ROOM_PARENT_ID] += 1
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

                if num_gt == 0:
                    for th in iou_thresholds:
                        curve_stats[th]["det_fp"] += num_pred
                        curve_stats[th]["sem_fp"] += num_pred
                        curve_stats[th]["parent_fp"] += num_pred
                    continue

                p_xyxy_1 = box_cxcywh_to_xyxy(p_boxes_1)
                p_xyxy_0 = box_cxcywh_to_xyxy(p_boxes_0)
                t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
                b_ious_1, _ = box_iou(p_xyxy_1, t_xyxy)
                b_ious_0, _ = box_iou(p_xyxy_0, t_xyxy)

                for q_i in orig_query_indices:
                    grp = "global" if q_i.item() < 20 else "highres"
                    query_group_stats[grp]["predictions"] += 1

                # Class-agnostic hit rate
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

                # DETR 1-to-1 Bipartite Matching
                for th in iou_thresholds:
                    matched_det_gt = set()
                    matched_sem_gt = set()
                    matched_parent_gt = set()

                    for p_idx in range(num_pred):
                        best_iou, best_gt = b_ious_1[p_idx].max(dim=-1)
                        biou = best_iou.item()
                        bgt = best_gt.item()
                        p_cls = p_classes[p_idx].item()
                        p_par = p_parents[p_idx].item()
                        t_cls = tgt_labels[bgt].item()
                        t_par = CHILD_TO_PARENT[t_cls]
                        q_orig = orig_query_indices[p_idx].item()
                        grp = "global" if q_orig < 20 else "highres"

                        # 1. Class-Agnostic Detection
                        if biou >= th and bgt not in matched_det_gt:
                            curve_stats[th]["det_tp"] += 1
                            matched_det_gt.add(bgt)
                            if th == 0.25:
                                query_group_stats[grp]["tp_25"] += 1
                                if bgt < len(gt_rooms):
                                    area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                    if area < 6.0:
                                        small_det_matched[0.25] += 1
                                        query_group_stats[grp]["small_room_tp_25"] += 1
                            if th == 0.50:
                                query_group_stats[grp]["tp_50"] += 1
                                if bgt < len(gt_rooms):
                                    area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                    if area < 6.0:
                                        small_det_matched[0.50] += 1
                                        query_group_stats[grp]["small_room_tp_50"] += 1
                        else:
                            curve_stats[th]["det_fp"] += 1
                            if th == 0.50:
                                query_group_stats[grp]["fp_50"] += 1

                        # 2. Parent-Category Functional Detection
                        # Prediction receives parent-level credit if p_par == t_par OR if CHILD_TO_PARENT[p_cls] == t_par
                        parent_matches = (p_par == t_par) or (CHILD_TO_PARENT[p_cls] == t_par)
                        if biou >= th and bgt not in matched_parent_gt:
                            if parent_matches:
                                curve_stats[th]["parent_tp"] += 1
                                matched_parent_gt.add(bgt)
                                if th == 0.50:
                                    if t_par < NUM_PARENT_CLASSES:
                                        parent_stats[PARENT_CLASSES[t_par]]["tp_50"] += 1
                                    if bgt < len(gt_rooms):
                                        area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                        if area < 6.0:
                                            small_parent_matched[0.50] += 1
                                if th == 0.25:
                                    if t_par < NUM_PARENT_CLASSES:
                                        parent_stats[PARENT_CLASSES[t_par]]["tp_25"] += 1
                                    if bgt < len(gt_rooms):
                                        area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
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
                                    if bgt < len(gt_rooms):
                                        area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                        if area < 6.0:
                                            small_sem_matched[0.50] += 1
                                if th == 0.25 and t_cls < NUM_ROOM_CLASSES:
                                    class_stats[ROOM_CLASSES[t_cls]]["tp_25"] += 1
                                    if bgt < len(gt_rooms):
                                        area = gt_rooms[bgt].get("area_m2", gt_rooms[bgt].get("dimensions", {}).get("area_m2", 10.0))
                                        if area < 6.0:
                                            small_sem_matched[0.25] += 1
                            else:
                                curve_stats[th]["sem_fp"] += 1
                        else:
                            curve_stats[th]["sem_fp"] += 1

                        # Track Hierarchical Credit (Parent correct, child confused)
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
                                # Check if error is within-parent or cross-parent
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
                            parent_confusion_mat[NO_ROOM_PARENT_ID, p_par] += 1
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
                                parent_confusion_mat[t_par, NO_ROOM_PARENT_ID] += 1

    # Aggregate Metrics
    curve_summary = {}
    for th in iou_thresholds:
        st = curve_stats[th]
        # Class-agnostic detection
        det_p = st["det_tp"] / max(1, st["det_tp"] + st["det_fp"])
        det_r = st["det_tp"] / max(1, st["det_tp"] + st["det_fn"])
        det_f1 = (2 * det_p * det_r) / max(1e-6, det_p + det_r)

        # Fine-grained semantic
        sem_p = st["sem_tp"] / max(1, st["sem_tp"] + st["sem_fp"])
        sem_r = st["sem_tp"] / max(1, st["sem_tp"] + st["sem_fn"])
        sem_f1 = (2 * sem_p * sem_r) / max(1e-6, sem_p + sem_r)

        # Parent functional
        par_p = st["parent_tp"] / max(1, st["parent_tp"] + st["parent_fp"])
        par_r = st["parent_tp"] / max(1, st["parent_tp"] + st["parent_fn"])
        par_f1 = (2 * par_p * par_r) / max(1e-6, par_p + par_r)

        curve_summary[f"iou_{int(th*100)}"] = {
            "det_p": round(det_p, 4), "det_r": round(det_r, 4), "det_f1": round(det_f1, 4),
            "sem_p": round(sem_p, 4), "sem_r": round(sem_r, 4), "sem_f1": round(sem_f1, 4),
            "parent_p": round(par_p, 4), "parent_r": round(par_r, 4), "parent_f1": round(par_f1, 4),
            "det_tp": st["det_tp"], "det_fp": st["det_fp"], "det_fn": st["det_fn"],
            "sem_tp": st["sem_tp"], "sem_fp": st["sem_fp"], "sem_fn": st["sem_fn"],
            "parent_tp": st["parent_tp"], "parent_fp": st["parent_fp"], "parent_fn": st["parent_fn"],
        }

    h_iou_1 = float(np.mean(hungarian_ious_1)) if hungarian_ious_1 else 0.0
    h_iou_0 = float(np.mean(hungarian_ious_0)) if hungarian_ious_0 else 0.0
    h_dice = float(np.mean(hungarian_dices)) if hungarian_dices else 0.0
    scale_err = float(np.mean(scale_errors_pct)) if scale_errors_pct else 0.0

    results = {
        "conf_thresh": conf_thresh,
        "curve": curve_summary,
        "hungarian_bbox_iou_layer1": round(h_iou_1, 4),
        "hungarian_bbox_iou_layer0": round(h_iou_0, 4),
        "hungarian_mask_dice": round(h_dice, 4),
        "scale_error_pct": round(scale_err, 2),
        "total_queries": total_queries_eval,
        "fg_predictions": total_fg_predictions,
        "bg_rejected": total_queries_eval - total_fg_predictions,
        "query_group_stats": query_group_stats,
        "hitrate": {
            "overall_recall": {
                f"iou_{int(th*100)}": {
                    "layer1": round(hitrate_matched_all[th] / max(1, total_gt), 4),
                    "layer0": round(hitrate_matched_layer0_all[th] / max(1, total_gt), 4),
                }
                for th in iou_thresholds
            },
            "small_room_recall": {
                f"iou_{int(th*100)}": {
                    "matched_count_layer1": hitrate_matched_small[th],
                    "matched_count_layer0": hitrate_matched_layer0_small[th],
                    "total_small_gt": total_small_gt,
                    "layer1": round(hitrate_matched_small[th] / max(1, total_small_gt), 4),
                    "layer0": round(hitrate_matched_layer0_small[th] / max(1, total_small_gt), 4),
                }
                for th in iou_thresholds
            },
        },
        "hierarchical_summary": {
            "hierarchical_credit_count_50": hierarchical_credit_count_50,
            "hierarchical_credit_count_25": hierarchical_credit_count_25,
            "within_parent_confusion_count": within_parent_confusion_count,
            "cross_parent_confusion_count": cross_parent_confusion_count,
            "within_parent_confusion_pct": round(within_parent_confusion_count / max(1, within_parent_confusion_count + cross_parent_confusion_count) * 100.0, 2),
        }
    }

    if detailed:
        # Per-class summary
        per_class_summary = {}
        for cname, st in class_stats.items():
            tp = st["tp_50"]
            fp = st["fp_50"]
            fn = st["fn_50"]
            prec = tp / max(1, tp + fp)
            rec = tp / max(1, tp + fn)
            f1 = (2 * prec * rec) / max(1e-6, prec + rec)
            per_class_summary[cname] = {
                "support": st["support"], "tp": tp, "fp": fp, "fn": fn,
                "precision": round(prec, 4), "recall": round(rec, 4), "f1": round(f1, 4),
            }

        # Per-parent summary
        per_parent_summary = {}
        for pname, st in parent_stats.items():
            tp = st["tp_50"]
            fp = st["fp_50"]
            fn = st["fn_50"]
            prec = tp / max(1, tp + fp)
            rec = tp / max(1, tp + fn)
            f1 = (2 * prec * rec) / max(1e-6, prec + rec)
            per_parent_summary[pname] = {
                "support": st["support"], "tp": tp, "fp": fp, "fn": fn,
                "precision": round(prec, 4), "recall": round(rec, 4), "f1": round(f1, 4),
            }

        results["per_class"] = per_class_summary
        results["per_parent"] = per_parent_summary
        results["child_confusion_matrix"] = child_confusion_mat.tolist()
        results["parent_confusion_matrix"] = parent_confusion_mat.tolist()

    return results


# =====================================================================
# Visual Diagnostics Generator for G4-A
# =====================================================================

def visualize_g4a_diagnostics(model, test_ds, device, out_dir, sample_indices=[0, 3, 7, 12, 25, 42, 60], conf_thresh=0.20):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    model.eval()

    # Color palette for 9 parent categories
    PARENT_COLORS = [
        (65, 105, 225),   # Living Area: Royal Blue
        (138, 43, 226),   # Bedroom Area: Blue Violet
        (255, 140, 0),    # Cooking Area: Dark Orange
        (0, 191, 255),    # Wet Area: Deep Sky Blue
        (46, 139, 87),    # Study / Work Area: Sea Green
        (218, 165, 32),   # Circulation: Goldenrod
        (112, 128, 144),  # Utility Area: Slate Gray
        (50, 205, 50),    # Outdoor Area: Lime Green
        (139, 69, 19),    # Garage / Parking: Saddle Brown
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
            pred_parent_logits = outputs["pred_parent_logits"][0]
            pred_boxes_1 = outputs["pred_boxes_1"][0]
            child_probs = pred_logits.softmax(-1)
            parent_probs = pred_parent_logits.softmax(-1)

        top_scores, top_classes = child_probs.max(dim=-1)
        top_parent_scores, top_parent_classes = parent_probs.max(dim=-1)

        keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)
        keep_indices = torch.where(keep)[0]

        # 4-panel visual comparison:
        # Panel 1: Ground Truth (Labeled with fine-grained class + parent)
        # Panel 2: Predicted Functional Parent Categories (Color coded by parent)
        # Panel 3: Predicted Fine-Grained Classes
        # Panel 4: Hierarchical Agreement & Credit (Green = Full agree, Amber = Parent correct child confused, Red = Parent error)
        panel_w = orig_w
        panel_h = orig_h
        canvas = Image.new("RGB", (panel_w * 4, panel_h + 40), (255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        gt_rooms = sample.get("rooms", [])

        # Panel 1: Ground Truth
        canvas.paste(orig_img, (0, 40))
        draw.text((15, 10), f"SAMPLE #{s_idx} - GROUND TRUTH", fill=(0, 0, 0))
        for r in gt_rooms:
            b = r.get("bbox", [0, 0, 0, 0])
            c_name = r.get("type", "Room")
            c_id = LABEL2ID.get(c_name, 0)
            p_id = CHILD_TO_PARENT[c_id]
            p_name = PARENT_CLASSES[p_id] if p_id < NUM_PARENT_CLASSES else "Other"
            col = PARENT_COLORS[p_id % len(PARENT_COLORS)]
            x0 = int(b[0] * panel_w)
            y0 = int(b[1] * panel_h) + 40
            w_px = int(b[2] * panel_w)
            h_px = int(b[3] * panel_h)
            draw.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=2)
            lbl = f"{c_name} [{p_name}]"
            draw.rectangle([x0, max(40, y0 - 18), x0 + len(lbl) * 7, y0], fill=col)
            draw.text((x0 + 2, max(40, y0 - 16)), lbl, fill=(255, 255, 255))

        # Panel 2: Functional Parent Predictions
        canvas.paste(orig_img, (panel_w, 40))
        draw.text((panel_w + 15, 10), "FUNCTIONAL PARENT PREDICTIONS", fill=(0, 0, 180))
        for idx in keep_indices:
            q_i = idx.item()
            p_id = top_parent_classes[q_i].item()
            p_score = top_parent_scores[q_i].item()
            p_name = PARENT_CLASSES[p_id] if p_id < NUM_PARENT_CLASSES else "Background"
            col = PARENT_COLORS[p_id % len(PARENT_COLORS)] if p_id < NUM_PARENT_CLASSES else (150, 150, 150)
            cx, cy, bw, bh = pred_boxes_1[q_i].tolist()
            x0 = int((cx - bw / 2.0) * panel_w) + panel_w
            y0 = int((cy - bh / 2.0) * panel_h) + 40
            w_px = int(bw * panel_w)
            h_px = int(bh * panel_h)
            draw.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=2)
            lbl = f"{p_name} ({p_score:.2f})"
            draw.rectangle([x0, max(40, y0 - 18), x0 + len(lbl) * 7, y0], fill=col)
            draw.text((x0 + 2, max(40, y0 - 16)), lbl, fill=(255, 255, 255))

        # Panel 3: Fine-Grained Room Predictions
        canvas.paste(orig_img, (panel_w * 2, 40))
        draw.text((panel_w * 2 + 15, 10), "FINE-GRAINED 22-CLASS PREDICTIONS", fill=(0, 100, 0))
        for idx in keep_indices:
            q_i = idx.item()
            c_id = top_classes[q_i].item()
            c_score = top_scores[q_i].item()
            c_name = ROOM_CLASSES[c_id] if c_id < NUM_ROOM_CLASSES else "Background"
            p_id = CHILD_TO_PARENT[c_id]
            col = PARENT_COLORS[p_id % len(PARENT_COLORS)] if p_id < NUM_PARENT_CLASSES else (150, 150, 150)
            cx, cy, bw, bh = pred_boxes_1[q_i].tolist()
            x0 = int((cx - bw / 2.0) * panel_w) + panel_w * 2
            y0 = int((cy - bh / 2.0) * panel_h) + 40
            w_px = int(bw * panel_w)
            h_px = int(bh * panel_h)
            draw.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=2)
            lbl = f"{c_name} ({c_score:.2f})"
            draw.rectangle([x0, max(40, y0 - 18), x0 + len(lbl) * 7, y0], fill=col)
            draw.text((x0 + 2, max(40, y0 - 16)), lbl, fill=(255, 255, 255))

        # Panel 4: Hierarchical Agreement & Credit
        canvas.paste(orig_img, (panel_w * 3, 40))
        draw.text((panel_w * 3 + 15, 10), "HIERARCHICAL CONSISTENCY & CREDIT", fill=(128, 0, 128))
        for idx in keep_indices:
            q_i = idx.item()
            c_id = top_classes[q_i].item()
            p_id = top_parent_classes[q_i].item()
            implied_p = CHILD_TO_PARENT[c_id]
            c_name = ROOM_CLASSES[c_id] if c_id < NUM_ROOM_CLASSES else "Background"
            p_name = PARENT_CLASSES[p_id] if p_id < NUM_PARENT_CLASSES else "Background"

            agrees = (p_id == implied_p)
            col = (0, 200, 0) if agrees else (255, 69, 0) # Green if parent head agrees with child head
            cx, cy, bw, bh = pred_boxes_1[q_i].tolist()
            x0 = int((cx - bw / 2.0) * panel_w) + panel_w * 3
            y0 = int((cy - bh / 2.0) * panel_h) + 40
            w_px = int(bw * panel_w)
            h_px = int(bh * panel_h)
            draw.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=2)
            lbl = f"{c_name} | {p_name}" if agrees else f"DISAGREE: {c_name} vs {p_name}"
            draw.rectangle([x0, max(40, y0 - 18), x0 + len(lbl) * 7, y0], fill=col)
            draw.text((x0 + 2, max(40, y0 - 16)), lbl, fill=(255, 255, 255))

        out_file = out_dir / f"g4a_diagnostic_sample_{s_idx}.png"
        canvas.save(out_file)

    print(f"Saved {len(sample_indices)} diagnostic panels to {out_dir}.", flush=True)


# =====================================================================
# Main Training & Evaluation Pipeline
# =====================================================================

def run_experiment_g4a(epochs=5, batch_size=7, img_size=384, eval_only=False):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 80, flush=True)
    print("EXPERIMENT G4-A: HIERARCHICAL FUNCTIONAL SUPERVISION", flush=True)
    print(f"Device: {device} | Epochs: {epochs} | Batch Size: {batch_size} | Image Size: {img_size}", flush=True)
    print("Base Checkpoint: checkpoints/multitask/experiment_g3c_best.pt", flush=True)
    print(f"Functional Parent Categories: {len(PARENT_CLASSES)} ({PARENT_CLASSES})", flush=True)
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

    # 3. Model Initialization & Warm-Start from G3-C
    print("\nInitializing G4-A Hierarchical Supervision Model...", flush=True)
    model = MultiTaskViT384G4A(img_size=img_size).to(device)

    g3c_ckpt_path = Path("checkpoints/multitask/experiment_g3c_best.pt")
    g4a_ckpt_path = Path("checkpoints/multitask/experiment_g4a_best.pt")
    interrupted_ckpt_path = Path("checkpoints/multitask/experiment_g4a_interrupted.pt")

    if eval_only:
        eval_path = g4a_ckpt_path if g4a_ckpt_path.exists() else g3c_ckpt_path
        print(f"Loading checkpoint for evaluation: {eval_path}...", flush=True)
        model.load_state_dict(torch.load(eval_path, map_location=device), strict=False)
    else:
        if not g3c_ckpt_path.exists():
            raise FileNotFoundError(f"Required base checkpoint not found: {g3c_ckpt_path}")
        print(f"Warm-starting directly from G3-C: {g3c_ckpt_path}...", flush=True)
        matched, uninit = load_g4a_from_g3c(model, g3c_ckpt_path, device=device)
        print(f"Loaded {matched} weight tensors from G3-C.", flush=True)
        print(f"Parent Head initialized via child class projection. Uninitialized keys: {uninit}", flush=True)

    # 4. ViT Frozen Backbone & Differential Optimizers
    for p in model.encoder.parameters():
        p.requires_grad = False

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
    mask_scale_params = (
        list(model.query_mask_proj.parameters()) +
        list(model.semantic_head.parameters()) +
        list(model.fpn.parameters()) +
        list(model.scale_head.parameters())
    )

    print(f"\nTrainable parameter groups:", flush=True)
    print(f"  - Parent Functional Head:    {sum(p.numel() for p in parent_head_params):,} params (LR: 1.5e-4)", flush=True)
    print(f"  - Fine-Grained Class Head:   {sum(p.numel() for p in class_head_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - Refinement BBox Heads:     {sum(p.numel() for p in refine_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - Decoders & Query Pathways: {sum(p.numel() for p in decoder_params):,} params (LR: 3.0e-5)", flush=True)
    print(f"  - Mask, FPN & Scale Heads:   {sum(p.numel() for p in mask_scale_params):,} params (LR: 1.0e-5)", flush=True)

    optimizer = torch.optim.AdamW([
        {"params": parent_head_params, "lr": 1.5e-4, "weight_decay": 1e-4},
        {"params": class_head_params, "lr": 3.0e-5, "weight_decay": 1e-5},
        {"params": refine_params, "lr": 3.0e-5, "weight_decay": 1e-4},
        {"params": decoder_params, "lr": 3.0e-5, "weight_decay": 1e-4},
        {"params": mask_scale_params, "lr": 1.0e-5, "weight_decay": 1e-4},
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    # 5. Loss Configuration
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterionG4A(
        matcher=matcher,
        num_classes=NUM_ROOM_CLASSES,
        num_parent_classes=NUM_PARENT_CLASSES,
        weight_class=1.0,
        weight_parent=0.5,
        weight_consist=0.5,
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
        base_val_m = evaluate_g4a(model, val_loader, device, conf_thresh=0.20, detailed=False)
        best_val_score = base_val_m["curve"]["iou_50"]["parent_f1"] + base_val_m["curve"]["iou_50"]["sem_f1"] + base_val_m["hungarian_mask_dice"] + base_val_m["hungarian_bbox_iou_layer1"]
        print(f"Baseline Val Parent F1 (IoU 0.50): {base_val_m['curve']['iou_50']['parent_f1']:.4f} | Sem F1: {base_val_m['curve']['iou_50']['sem_f1']:.4f} | Hungarian IoU: {base_val_m['hungarian_bbox_iou_layer1']:.4f} | Mask Dice: {base_val_m['hungarian_mask_dice']:.4f}", flush=True)

        print("\nStarting G4-A Hierarchical Supervision training...", flush=True)
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
                val_res = evaluate_g4a(model, val_loader, device, conf_thresh=0.20, detailed=False)
                val_dice = val_res["hungarian_mask_dice"]
                val_det_f1 = val_res["curve"]["iou_50"]["det_f1"]
                val_sem_f1 = val_res["curve"]["iou_50"]["sem_f1"]
                val_parent_f1 = val_res["curve"]["iou_50"]["parent_f1"]
                val_h_iou = val_res["hungarian_bbox_iou_layer1"]
                val_score = val_parent_f1 + val_sem_f1 + val_dice + val_h_iou

                ep_time = time.time() - t_ep0
                print(f"Epoch {epoch:02d}/{epochs:02d} [{ep_time:.1f}s] | Loss: {avg_loss:.4f} [Child: {avg_child:.3f}, Parent: {avg_parent:.3f}, Consist: {avg_consist:.3f}, BBox1: {avg_bbox1:.3f}] | Val Dice: {val_dice:.4f} | Hungarian IoU: {val_h_iou:.4f} | Val Parent F1: {val_parent_f1:.4f} | Val Sem F1: {val_sem_f1:.4f}", flush=True)

                if val_score > best_val_score and val_dice >= 0.82:
                    best_val_score = val_score
                    best_epoch = epoch
                    torch.save(model.state_dict(), g4a_ckpt_path)
                    print(f"  >>> Best G4-A model saved to {g4a_ckpt_path} (Val Score: {val_score:.4f})", flush=True)

        except KeyboardInterrupt:
            print(f"\nTraining interrupted! Saving model state to {interrupted_ckpt_path}...", flush=True)
            torch.save(model.state_dict(), interrupted_ckpt_path)

        if not g4a_ckpt_path.exists():
            print(f"Saving final epoch weights to {g4a_ckpt_path}...", flush=True)
            torch.save(model.state_dict(), g4a_ckpt_path)

        print(f"\nLoading best checkpoint from epoch {best_epoch} for final test set evaluation...", flush=True)
        model.load_state_dict(torch.load(g4a_ckpt_path, map_location=device))

    # 6. Final Comprehensive Test Set Sweep (Across Confidence Thresholds)
    print("\n" + "=" * 80, flush=True)
    print("RUNNING COMPREHENSIVE G4-A TEST SET EVALUATION", flush=True)
    print("=" * 80, flush=True)

    sweep_thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50]
    sweep_results = {}

    for c_th in sweep_thresholds:
        is_nominal = (c_th == 0.20)
        res = evaluate_g4a(model, test_loader, device, conf_thresh=c_th, detailed=is_nominal)
        tag = f"conf_{int(c_th*100):02d}"
        sweep_results[tag] = res

        c50 = res["curve"]["iou_50"]
        c25 = res["curve"]["iou_25"]
        sm50 = res["hitrate"]["small_room_recall"]["iou_50"]
        sm25 = res["hitrate"]["small_room_recall"]["iou_25"]

        print(f"[Conf {c_th:.2f}] Det F1 @ 0.50: {c50['det_f1']:.4f} | Parent F1 @ 0.50: {c50['parent_f1']:.4f} | Sem F1 @ 0.50: {c50['sem_f1']:.4f} | Small Recall @ 0.50: {sm50['matched_count_layer1']}/{sm50['total_small_gt']} ({sm50['layer1']*100:.2f}%) | Det F1 @ 0.25: {c25['det_f1']:.4f} | Parent F1 @ 0.25: {c25['parent_f1']:.4f}", flush=True)

    # Save final results JSON
    final_payload = {
        "sweep": sweep_results,
        "conf_05": sweep_results["conf_05"],
        "conf_10": sweep_results["conf_10"],
        "conf_20": sweep_results["conf_20"],
        "conf_25": sweep_results["conf_25"],
        "hungarian_mask_dice": sweep_results["conf_20"]["hungarian_mask_dice"],
        "hungarian_bbox_iou_layer1": sweep_results["conf_20"]["hungarian_bbox_iou_layer1"],
        "hungarian_bbox_iou_layer0": sweep_results["conf_20"]["hungarian_bbox_iou_layer0"],
        "scale_error_pct": sweep_results["conf_20"]["scale_error_pct"],
        "query_groups": sweep_results["conf_20"]["query_group_stats"],
        "hitrate_summary": sweep_results["conf_20"]["hitrate"],
        "hierarchical_summary": sweep_results["conf_20"]["hierarchical_summary"],
    }

    out_json = Path("evaluation_results/experiment_g4a_results.json")
    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w") as f:
        json.dump(final_payload, f, indent=2)
    print(f"\nFinal G4-A evaluation results written to {out_json}.", flush=True)

    # 7. Generate Visual Diagnostics
    print("\nGenerating visual diagnostic panels...", flush=True)
    visualize_g4a_diagnostics(
        model=model,
        test_ds=test_ds,
        device=device,
        out_dir="evaluation_results/g4a_diagnostics",
        sample_indices=[0, 3, 7, 12, 25, 42, 60],
        conf_thresh=0.20,
    )
    print("\nG4-A Pipeline Execution Finished Successfully!", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Experiment G4-A: Hierarchical Functional Supervision")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs (default: 5)")
    parser.add_argument("--batch-size", type=int, default=7, help="Training batch size (default: 7)")
    parser.add_argument("--eval-only", action="store_true", help="Run evaluation only")
    args = parser.parse_args()

    run_experiment_g4a(epochs=args.epochs, batch_size=args.batch_size, eval_only=args.eval_only)
