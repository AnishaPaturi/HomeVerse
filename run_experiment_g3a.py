import argparse
import json
import math
import os
import sys
import time
from pathlib import Path
from PIL import Image
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
    MultiTaskViT384FPN,
    classify_topology,
)
from run_experiment_f2 import (
    select_balanced_split,
    InMemoryDataset,
    collate_fn_with_meta,
    safe_torch_save,
    CLASS2FAMILY,
    FAMILY_NAMES,
    NUM_FAMILIES,
    NO_ROOM_FAMILY_ID,
)


# =====================================================================
# Sqrt-Balanced Class Weights Computation
# =====================================================================

def compute_sqrt_class_weights(train_samples):
    inst_counts = {c: 0 for c in ROOM_CLASSES}
    for s in train_samples:
        for r in s.get("rooms", []):
            t = r.get("type")
            if t in inst_counts:
                inst_counts[t] += 1

    active_counts = [cnt for cnt in inst_counts.values() if cnt > 0]
    min_active = min(active_counts) if active_counts else 1

    raw_weights = []
    for c in ROOM_CLASSES:
        cnt = inst_counts[c]
        if cnt > 0:
            raw_weights.append(1.0 / math.sqrt(cnt))
        else:
            raw_weights.append(1.0 / math.sqrt(min_active))

    mean_rw = np.mean(raw_weights)
    norm_fg_weights = [rw / mean_rw for rw in raw_weights]

    # Full weights tensor: 22 foreground classes + 1 background class (0.10)
    full_weights = torch.tensor(norm_fg_weights + [0.10], dtype=torch.float32)
    return full_weights, inst_counts


# =====================================================================
# MultiTaskCriterion with Class-Balanced Loss
# =====================================================================

class ClassBalancedMultiTaskCriterion(nn.Module):
    def __init__(self, matcher, class_weights, num_classes=NUM_ROOM_CLASSES,
                 weight_class=1.0, weight_bbox=5.0, weight_giou=2.0,
                 weight_mask=2.5, weight_scale=0.1):
        super().__init__()
        self.matcher = matcher
        self.num_classes = num_classes
        self.weight_class = weight_class
        self.weight_bbox = weight_bbox
        self.weight_giou = weight_giou
        self.weight_mask = weight_mask
        self.weight_scale = weight_scale
        self.register_buffer("class_weights", class_weights)

    def forward(self, outputs, targets):
        pred_logits = outputs["pred_logits"]
        pred_boxes = outputs["pred_boxes"]
        pred_masks = outputs["pred_masks"]
        pred_log_scale = outputs["pred_log_scale"]

        indices = self.matcher(pred_logits, pred_boxes, targets)

        # 1. Classification Loss with Class Weights
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
            weight=self.class_weights.to(pred_logits.device)
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
# Comprehensive Evaluator (Detection Curve + Per-Class + Distributions)
# =====================================================================

def evaluate_g3a(model, dataloader, device, conf_thresh=0.20, detailed=False):
    model.eval()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    # Multi-threshold IoU tracking
    iou_thresholds = [0.25, 0.35, 0.50, 0.75]
    curve_stats = {
        th: {"det_tp": 0, "det_fp": 0, "det_fn": 0, "sem_tp": 0, "sem_fp": 0, "sem_fn": 0}
        for th in iou_thresholds
    }

    hungarian_ious = []
    hungarian_dices = []
    scale_errors_pct = []

    # Predicted class distribution across all queries
    pred_class_counts = {c: 0 for c in ROOM_CLASSES}
    pred_class_counts["Background"] = 0

    # Per-class detailed stats at IoU 0.50
    class_stats = {c: {"tp": 0, "fp": 0, "fn": 0, "support": 0, "ious": []} for c in ROOM_CLASSES}
    size_stats = {
        "Small (<6m²)": {"tp": 0, "fp": 0, "fn": 0, "support": 0},
        "Medium (6-18m²)": {"tp": 0, "fp": 0, "fn": 0, "support": 0},
        "Large (>18m²)": {"tp": 0, "fp": 0, "fn": 0, "support": 0},
        "Irregular (Non-rect)": {"tp": 0, "fp": 0, "fn": 0, "support": 0},
    }

    # Confusion matrix (23 x 23)
    confusion_mat = np.zeros((NUM_ROOM_CLASSES + 1, NUM_ROOM_CLASSES + 1), dtype=np.int32)

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
                for q in range(len(top_classes_all)):
                    cls_id = top_classes_all[q].item()
                    if cls_id == NO_ROOM_ID:
                        pred_class_counts["Background"] += 1
                    elif cls_id < len(ROOM_CLASSES):
                        pred_class_counts[ROOM_CLASSES[cls_id]] += 1

                # Inference Evaluation
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

                if len(keep_indices) == 0:
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

                # Sort by confidence descending
                order = p_scores.argsort(descending=True)
                p_boxes = p_boxes[order]
                p_classes = p_classes[order]
                p_scores = p_scores[order]
                num_pred = len(p_classes)

                if num_gt == 0:
                    for th in iou_thresholds:
                        curve_stats[th]["det_fp"] += num_pred
                        curve_stats[th]["sem_fp"] += num_pred
                    continue

                p_xyxy = box_cxcywh_to_xyxy(p_boxes)
                t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
                b_ious, _ = box_iou(p_xyxy, t_xyxy)

                # Evaluate across each IoU threshold
                for th in iou_thresholds:
                    matched_det_gt = set()
                    matched_sem_gt = set()

                    for p_idx in range(num_pred):
                        best_iou, best_gt = b_ious[p_idx].max(dim=-1)
                        biou = best_iou.item()
                        bgt = best_gt.item()
                        p_cls = p_classes[p_idx].item()
                        t_cls = tgt_labels[bgt].item()

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
                            else:
                                curve_stats[th]["sem_fp"] += 1
                        else:
                            curve_stats[th]["sem_fp"] += 1

                    curve_stats[th]["det_fn"] += (num_gt - len(matched_det_gt))
                    curve_stats[th]["sem_fn"] += (num_gt - len(matched_sem_gt))

                # For detailed stats, use standard IoU >= 0.50
                if detailed:
                    matched_det_gt_50 = set()
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
# Main Experiment G3-A Training & Evaluation Pipeline
# =====================================================================

def run_experiment_g3a(epochs=5, batch_size=7, img_size=384, eval_only=False):
    os.environ["OMP_NUM_THREADS"] = "8"
    os.environ["MKL_NUM_THREADS"] = "8"
    torch.set_num_threads(8)
    device = torch.device("cpu")

    print("=" * 80, flush=True)
    print("EXPERIMENT G3-A: CLASS-BALANCED LOSS (INVERSE SQRT FREQUENCY)", flush=True)
    print(f"Device: {device} | Threads: 8 | Epochs: {epochs} | Batch Size: {batch_size}", flush=True)
    print("Architecture: MultiTaskViT384FPN (Flat 22-class, 25 Queries)", flush=True)
    print("=" * 80, flush=True)

    # 1. Dataset Partitioning (Identical 500-layout partition as F2-A)
    print("\nSelecting identical class-balanced 500-layout partition...", flush=True)
    t_lids, train_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/train.json", 350)
    v_lids, val_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/validation.json", 75)
    te_lids, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)

    print(f"Train split:      {len(train_samples)} images ({len(t_lids)} layouts)")
    print(f"Validation split: {len(val_samples)} images ({len(v_lids)} layouts)")
    print(f"Test split:       {len(test_samples)} images ({len(te_lids)} layouts)")

    # Compute Sqrt-Balanced Class Weights
    class_weights, inst_counts = compute_sqrt_class_weights(train_samples)
    print("\nComputed Class Weights (w_c ~ 1 / sqrt(freq_c)):")
    for i, c in enumerate(ROOM_CLASSES):
        print(f"  {c:<22}: weight = {class_weights[i].item():.4f} (freq = {inst_counts[c]})")
    print(f"  Background (NO_ROOM)  : weight = {class_weights[NO_ROOM_ID].item():.4f}")

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
    print("\nInitializing model...", flush=True)
    model = MultiTaskViT384FPN(pretrained_model_name="google/vit-base-patch16-384", img_size=img_size).to(device)

    f2a_ckpt_path = Path("checkpoints/multitask/experiment_f2a_best.pt")
    g3a_ckpt_path = Path("checkpoints/multitask/experiment_g3a_best.pt")

    if eval_only:
        eval_ckpt = g3a_ckpt_path if g3a_ckpt_path.exists() else f2a_ckpt_path
        print(f"Loading checkpoint for evaluation: {eval_ckpt}...", flush=True)
        model.load_state_dict(torch.load(eval_ckpt, map_location=device), strict=False)
    else:
        print(f"Warm-starting from F2-A checkpoint: {f2a_ckpt_path}...", flush=True)
        if not f2a_ckpt_path.exists():
            raise FileNotFoundError(f"Missing base checkpoint: {f2a_ckpt_path}")
        f2a_weights = torch.load(f2a_ckpt_path, map_location=device)
        missing, unexpected = model.load_state_dict(f2a_weights, strict=False)
        print(f"Loaded {len(f2a_weights) - len(missing)} weights from F2-A (unmatched: {len(missing)}).", flush=True)

    # Differential Learning Rates (protecting the 0.8428 mask representation)
    optimizer_params = [
        # Classification head: primary focus of adaptation
        {"params": [p for n, p in model.named_parameters() if "class_head" in n and p.requires_grad], "lr": 1.5e-4},
        # ViT backbone: gentle fine-tuning
        {"params": [p for n, p in model.named_parameters() if "vit" in n and p.requires_grad], "lr": 1.0e-5},
        # Geometry & scale heads: very low LR to preserve 0.8428 mask dice
        {"params": [p for n, p in model.named_parameters() if "class_head" not in n and "vit" not in n and p.requires_grad], "lr": 3.0e-6},
    ]
    optimizer = torch.optim.AdamW(optimizer_params, weight_decay=1e-4)

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = ClassBalancedMultiTaskCriterion(
        matcher=matcher,
        class_weights=class_weights,
        num_classes=NUM_ROOM_CLASSES,
        weight_class=1.2,  # slightly elevated class weight for calibration
        weight_bbox=5.0,
        weight_giou=2.0,
        weight_mask=2.5,
        weight_scale=0.1,
    )

    if not eval_only:
        print("\nStarting G3-A training...", flush=True)
        best_val_score = -1e9
        best_epoch = 0

        for epoch in range(1, epochs + 1):
            t_ep0 = time.time()
            model.train()
            train_loss_total = 0.0
            train_loss_ce = 0.0
            train_loss_mask = 0.0

            for b_idx, (images, targets) in enumerate(train_loader):
                images = images.to(device)
                optimizer.zero_grad()
                outputs = model(images)
                loss_dict = criterion(outputs, targets)
                loss = loss_dict["loss"]
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()

                train_loss_total += loss.item()
                train_loss_ce += loss_dict["loss_ce"].item()
                train_loss_mask += loss_dict["loss_mask"].item()

            avg_loss = train_loss_total / len(train_loader)
            avg_ce = train_loss_ce / len(train_loader)
            avg_mask = train_loss_mask / len(train_loader)

            # Evaluate on Validation set
            val_res = evaluate_g3a(model, val_loader, device, conf_thresh=0.20, detailed=False)
            val_dice = val_res["hungarian_mask_dice"]
            val_sem_f1 = val_res["curve"]["iou_50"]["sem_f1"]
            val_det_f1 = val_res["curve"]["iou_50"]["det_f1"]

            # Combined score: maximize semantic F1 while protecting mask dice >= 0.80
            dice_penalty = max(0.0, 0.82 - val_dice) * 5.0
            val_score = val_sem_f1 * 2.0 + val_det_f1 - dice_penalty

            ep_time = time.time() - t_ep0
            print(f"Epoch {epoch:02d}/{epochs:02d} [{ep_time:.1f}s] | Loss: {avg_loss:.4f} (CE: {avg_ce:.4f}, Mask: {avg_mask:.4f}) | Val Dice: {val_dice:.4f} | Val Det F1@50: {val_det_f1:.4f} | Val Sem F1@50: {val_sem_f1:.4f}", flush=True)

            if val_score > best_val_score and val_dice >= 0.80:
                best_val_score = val_score
                best_epoch = epoch
                print(f"  --> New Best Model (Epoch {epoch})! Saving to {g3a_ckpt_path}...", flush=True)
                safe_torch_save(model.state_dict(), g3a_ckpt_path)

        print(f"\nTraining completed. Best checkpoint from Epoch {best_epoch}.", flush=True)

    # 4. Final Benchmark on Completely Unseen Test Split
    print("\nLoading best G3-A checkpoint for final test benchmark...", flush=True)
    if g3a_ckpt_path.exists():
        model.load_state_dict(torch.load(g3a_ckpt_path, map_location=device), strict=False)

    print("Running comprehensive evaluation on 75 Unseen Test Layouts (225 images)...", flush=True)
    test_res = evaluate_g3a(model, test_loader, device, conf_thresh=0.20, detailed=True)

    # Save results to JSON
    out_json = Path("evaluation_results/experiment_g3a_results.json")
    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(test_res, f, indent=2)
    print(f"Saved evaluation results to {out_json}.", flush=True)

    # Print Summary Table
    print("\n" + "=" * 80)
    print("EXPERIMENT G3-A FINAL RESULTS (75 UNSEEN TEST LAYOUTS)")
    print("=" * 80)
    print(f"Wall Mask Dice (FPN):   {test_res['hungarian_mask_dice']:.4f} (F2-A: 0.8428)")
    print(f"Hungarian BBox IoU:     {test_res['hungarian_bbox_iou']:.4f} (F2-A: 0.5172)")
    print(f"Scale Error %:          {test_res['scale_error_pct']:.2f}% (F2-A: 9.43%)")

    print("\n--- Detection F1 Curve Across IoU Thresholds ---")
    print(f"{'IoU Threshold':<16} | {'Det Prec':<9} | {'Det Rec':<8} | {'Det F1':<8} | {'Sem Prec':<9} | {'Sem Rec':<8} | {'Sem F1'}")
    print("-" * 85)
    for k, v in test_res["curve"].items():
        th_val = int(k.split("_")[1]) / 100.0
        print(f"IoU >= {th_val:<9.2f} | {v['det_p']:.4f}    | {v['det_r']:.4f}   | {v['det_f1']:.4f}   | {v['sem_p']:.4f}    | {v['sem_r']:.4f}   | {v['sem_f1']:.4f}")

    print("\n--- Key Class Failure Modes Check ---")
    pc = test_res["per_class"]
    print(f"Bedroom FP:        {pc.get('Bedroom', {}).get('fp', 0):<4d} (F2-A Baseline: 780)")
    print(f"Kitchen TP:        {pc.get('Kitchen', {}).get('tp', 0):<4d} (F2-A Baseline: 0)")
    print(f"Toilet TP:         {pc.get('Toilet', {}).get('tp', 0):<4d} (F2-A Baseline: 0)")
    print(f"Dining Room TP:    {pc.get('Dining Room', {}).get('tp', 0):<4d} (F2-A Baseline: 0)")
    print(f"Bathroom TP:       {pc.get('Bathroom', {}).get('tp', 0):<4d} (F2-A Baseline: 2)")
    print(f"Walk-in Closet TP: {pc.get('Walk-in Closet', {}).get('tp', 0):<4d} (F2-A Baseline: 0)")

    print("\n--- Room Size Recall Check (<6m²) ---")
    ps = test_res["per_size"]
    print(f"Small (<6m²) TP:   {ps.get('Small (<6m²)', {}).get('tp', 0)} / {ps.get('Small (<6m²)', {}).get('support', 0)}")
    print(f"Medium (6-18m²) TP:{ps.get('Medium (6-18m²)', {}).get('tp', 0)} / {ps.get('Medium (6-18m²)', {}).get('support', 0)}")
    print(f"Large (>18m²) TP:  {ps.get('Large (>18m²)', {}).get('tp', 0)} / {ps.get('Large (>18m²)', {}).get('support', 0)}")

    print("\n--- Top Predicted Classes Distribution ---")
    pcd = test_res["pred_class_distribution"]
    sorted_pcd = sorted(pcd.items(), key=lambda x: x[1], reverse=True)[:10]
    for cname, cnt in sorted_pcd:
        print(f"  {cname:<22}: {cnt} predictions")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=7)
    parser.add_argument("--img-size", type=int, default=384)
    parser.add_argument("--eval-only", action="store_true")
    args = parser.parse_args()

    run_experiment_g3a(epochs=args.epochs, batch_size=args.batch_size,
                       img_size=args.img_size, eval_only=args.eval_only)
