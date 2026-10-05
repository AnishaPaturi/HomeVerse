import json
import math
import os
import sys
import time
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

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
    SegmentationHead,
    compute_mask_loss,
    extract_room_geometry_from_mask,
)
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
    box_iou,
    generalized_box_iou,
)


class InMemoryDataset(Dataset):
    def __init__(self, items):
        self.items = items

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        return self.items[idx]


def collate_fn_with_meta(batch):
    images = torch.stack([item["image"] for item in batch], dim=0)
    targets = []
    for item in batch:
        targets.append({
            "boxes": item["boxes"],
            "labels": item["labels"],
            "masks": item["masks"],
            "semantic_mask": item["semantic_mask"],
            "widths_m": item["widths_m"],
            "lengths_m": item["lengths_m"],
            "areas_m2": item["areas_m2"],
            "scale_px_per_m": item["scale_px_per_m"],
            "has_scale": item["has_scale"],
            "scale_mode": item["scale_mode"],
            "image_id": item["image_id"],
            "layout_id": item["layout_id"],
            "sample_meta": item.get("sample_meta", {}),
        })
    return images, targets


# =====================================================================
# Model Architecture (ViT-384 with Log-Scale Regression)
# =====================================================================

class MultiTaskViT384(nn.Module):
    def __init__(self, pretrained_model_name="google/vit-base-patch16-384",
                 img_size=384, num_queries=25, num_classes=NUM_ROOM_CLASSES, decoder_layers=2):
        super().__init__()
        self.img_size = img_size
        self.num_queries = num_queries
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

        # 2. Query Embeddings & Transformer Decoder
        self.query_embed = nn.Embedding(num_queries, hidden_dim)
        decoder_layer = nn.TransformerDecoderLayer(
            d_model=hidden_dim,
            nhead=8,
            dim_feedforward=2048,
            dropout=0.1,
            activation="relu",
            batch_first=True,
        )
        self.decoder = nn.TransformerDecoder(decoder_layer, num_layers=decoder_layers)

        # 3. Class Head (+1 for NO_ROOM_ID background)
        self.class_head = nn.Linear(hidden_dim, num_classes + 1)

        # 4. BBox Head
        self.bbox_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, 4),
            nn.Sigmoid(),
        )

        # 5. Segmentation Head (resolution-agnostic Conv2d decoder)
        self.seg_head = SegmentationHead(
            in_dim=hidden_dim,
            num_queries=num_queries,
            num_classes=num_classes,
            mask_dim=64,
        )

    def forward(self, images):
        bs = images.size(0)
        h, w = images.shape[2], images.shape[3]
        gh, gw = h // self.patch_size, w // self.patch_size

        outputs = self.encoder(pixel_values=images)
        cls_token = outputs.last_hidden_state[:, 0, :]
        patch_tokens = outputs.last_hidden_state[:, 1:, :]

        # Scale prediction
        pred_log_scale = self.scale_head(cls_token).squeeze(-1)
        pred_scale = torch.exp(pred_log_scale)

        # Decoder queries
        queries = self.query_embed.weight.unsqueeze(0).expand(bs, -1, -1)
        hs = self.decoder(tgt=queries, memory=outputs.last_hidden_state)

        pred_logits = self.class_head(hs)
        pred_boxes = self.bbox_head(hs)
        seg_out = self.seg_head(patch_tokens, hs, grid_size=(gh, gw))

        return {
            "pred_logits": pred_logits,
            "pred_boxes": pred_boxes,
            "pred_masks": seg_out["pred_masks"],
            "pred_semantic": seg_out["pred_semantic"],
            "pred_log_scale": pred_log_scale,
            "pred_scale": pred_scale,
        }


# =====================================================================
# Multi-Task Criterion with Log-Scale Loss
# =====================================================================

class MultiTaskCriterion(nn.Module):
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

        # 1. Classification Loss
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
            weight=self.empty_weight
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
                target_boxes_list.append(targets[b]["boxes"][tgt_idx].to(pred_boxes.device))

                if "masks" in targets[b] and targets[b]["masks"].numel() > 0:
                    matched_gt_masks = targets[b]["masks"][tgt_idx].to(pred_masks.device)
                    matched_pred_masks = pred_masks[b, src_idx]
                    src_masks_list.append(matched_pred_masks)
                    target_masks_list.append(matched_gt_masks)

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

        # 3. Mask Loss: BCE + Dice
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

        # 4. Normalized Log-Scale Loss
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
# Topology Classification
# =====================================================================

def classify_topology(layout_item):
    rooms = layout_item.get("rooms", [])
    building = layout_item.get("building", {})
    w = building.get("width_m", 0.0)
    l = building.get("length_m", 0.0)
    envelope_area = max(1e-3, w * l)
    room_area_sum = sum(r.get("dimensions", {}).get("area_m2", 0.0) for r in rooms)
    fill_ratio = room_area_sum / envelope_area

    # Check for corridor spine
    for r in rooms:
        rtype = r.get("type", "").lower()
        if "corridor" in rtype or "hallway" in rtype:
            rw = r.get("dimensions", {}).get("width_m", 1.0)
            rl = r.get("dimensions", {}).get("length_m", 1.0)
            aspect = max(rw, rl) / max(0.1, min(rw, rl))
            if aspect >= 4.0 or max(rw, rl) >= 7.0:
                return "Corridor spine"

    if fill_ratio >= 0.96:
        return "Rectilinear"
    elif fill_ratio >= 0.80:
        return "L-shaped"
    elif fill_ratio >= 0.70:
        return "T-shaped"
    elif fill_ratio >= 0.60:
        return "U-shaped"
    else:
        return "Z-shaped / Non-convex"


# =====================================================================
# Evaluation with Background Filtering & Fine-Grained Breakdowns
# =====================================================================

def evaluate_split(model, dataloader, device, conf_thresh=0.25, iou_thresh=0.50, detailed=False):
    model.eval()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    total_tp = 0
    total_fp = 0
    total_fn = 0
    sum_iou = 0.0
    num_matched_ious = 0

    hungarian_correct_classes = 0
    hungarian_total_targets = 0
    hungarian_dices = []
    hungarian_ious = []
    scale_errors_abs = []
    scale_errors_pct = []

    # Fine-grained accumulators (only populated when detailed=True)
    if detailed:
        class_stats = {cls_name: {"tp": 0, "fp": 0, "fn": 0, "ious": [], "dices": []} for cls_name in ROOM_CLASSES}
        size_stats = {
            "Small (<6m²)": {"tp": 0, "fp": 0, "fn": 0, "ious": []},
            "Medium (6-18m²)": {"tp": 0, "fp": 0, "fn": 0, "ious": []},
            "Large (>18m²)": {"tp": 0, "fp": 0, "fn": 0, "ious": []},
            "Irregular (Non-rect)": {"tp": 0, "fp": 0, "fn": 0, "ious": []},
        }
        topo_stats = {}

    for images, targets in dataloader:
        images = images.to(device)
        with torch.no_grad():
            outputs = model(images)
            pred_logits = outputs["pred_logits"]
            pred_boxes = outputs["pred_boxes"]
            pred_masks = outputs["pred_masks"]
            pred_scales = outputs["pred_scale"]
            probs = pred_logits.softmax(-1)

        bs = images.size(0)

        # Scale MAE & Percentage Error
        for b in range(bs):
            if targets[b]["has_scale"].item() > 0 and targets[b]["scale_px_per_m"].item() > 0:
                p_s = pred_scales[b].item()
                gt_s = targets[b]["scale_px_per_m"].item()
                err_abs = abs(p_s - gt_s)
                scale_errors_abs.append(err_abs)
                scale_errors_pct.append((err_abs / max(1.0, gt_s)) * 100.0)

        # 1. Hungarian Matching Metrics
        indices = matcher(pred_logits, pred_boxes, targets)
        for b in range(bs):
            src_idx, tgt_idx = indices[b]
            tgt_labels = targets[b]["labels"].to(device)
            tgt_boxes = targets[b]["boxes"].to(device)
            tgt_masks = targets[b]["masks"].to(device) if "masks" in targets[b] else None

            if len(tgt_idx) > 0:
                hungarian_total_targets += len(tgt_idx)
                top_cls = probs[b, src_idx].argmax(dim=-1)
                hungarian_correct_classes += (top_cls == tgt_labels[tgt_idx]).sum().item()

                p_xyxy = box_cxcywh_to_xyxy(pred_boxes[b, src_idx])
                t_xyxy = box_cxcywh_to_xyxy(tgt_boxes[tgt_idx])
                ious, _ = box_iou(p_xyxy, t_xyxy)
                diag_ious = torch.diag(ious)
                hungarian_ious.extend(diag_ious.cpu().tolist())

                if tgt_masks is not None and tgt_masks.numel() > 0:
                    p_masks = pred_masks[b, src_idx]
                    t_masks = tgt_masks[tgt_idx]
                    if p_masks.shape[-2:] != t_masks.shape[-2:]:
                        t_masks = F.interpolate(t_masks.unsqueeze(1), size=p_masks.shape[-2:], mode="nearest").squeeze(1)
                    p_probs = p_masks.sigmoid().flatten(1)
                    t_flat = t_masks.flatten(1)
                    dices = (2.0 * (p_probs * t_flat).sum(-1) + 1e-5) / (p_probs.sum(-1) + t_flat.sum(-1) + 1e-5)
                    hungarian_dices.extend(dices.cpu().tolist())

        # 2. Corrected Background-Filtered Inference Metrics
        for b in range(bs):
            meta = targets[b].get("sample_meta", {})
            topology = meta.get("topology", "Unknown")
            if detailed and topology not in topo_stats:
                topo_stats[topology] = {"tp": 0, "fp": 0, "fn": 0, "ious": []}

            tgt_labels = targets[b]["labels"].to(device)
            tgt_boxes = targets[b]["boxes"].to(device)
            gt_rooms = meta.get("rooms", [])
            num_gt = len(tgt_labels)

            # Max over ALL 23 classes
            top_scores, top_classes = probs[b].max(dim=-1)
            keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)

            p_boxes = pred_boxes[b, keep]
            p_labels = top_classes[keep]
            num_pred = len(p_labels)

            if num_gt == 0:
                total_fp += num_pred
                if detailed:
                    topo_stats[topology]["fp"] += num_pred
                    for p_l in p_labels.cpu().tolist():
                        cname = ID2LABEL.get(p_l, "Unknown")
                        if cname in class_stats:
                            class_stats[cname]["fp"] += 1
                continue

            if num_pred == 0:
                total_fn += num_gt
                if detailed:
                    topo_stats[topology]["fn"] += num_gt
                    for g_idx, t_l in enumerate(tgt_labels.cpu().tolist()):
                        cname = ID2LABEL.get(t_l, "Unknown")
                        if cname in class_stats:
                            class_stats[cname]["fn"] += 1
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

            p_xyxy = box_cxcywh_to_xyxy(p_boxes)
            t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
            b_ious, _ = box_iou(p_xyxy, t_xyxy)

            matched_gt = set()
            for p_idx in range(num_pred):
                best_iou, best_gt = b_ious[p_idx].max(dim=-1)
                biou = best_iou.item()
                bgt = best_gt.item()
                p_cls = p_labels[p_idx].item()
                p_cname = ID2LABEL.get(p_cls, "Unknown")

                if biou >= iou_thresh and bgt not in matched_gt:
                    matched_gt.add(bgt)
                    t_cls = tgt_labels[bgt].item()
                    t_cname = ID2LABEL.get(t_cls, "Unknown")

                    if p_cls == t_cls:
                        total_tp += 1
                        sum_iou += biou
                        num_matched_ious += 1
                        if detailed:
                            topo_stats[topology]["tp"] += 1
                            topo_stats[topology]["ious"].append(biou)
                            if p_cname in class_stats:
                                class_stats[p_cname]["tp"] += 1
                                class_stats[p_cname]["ious"].append(biou)
                            if bgt < len(gt_rooms):
                                r = gt_rooms[bgt]
                                area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                                shape = r.get("shape", "rectangle")
                                if shape != "rectangle" or (r.get("polygon") and len(r.get("polygon")) > 4):
                                    size_stats["Irregular (Non-rect)"]["tp"] += 1
                                    size_stats["Irregular (Non-rect)"]["ious"].append(biou)
                                elif area < 6.0:
                                    size_stats["Small (<6m²)"]["tp"] += 1
                                    size_stats["Small (<6m²)"]["ious"].append(biou)
                                elif area <= 18.0:
                                    size_stats["Medium (6-18m²)"]["tp"] += 1
                                    size_stats["Medium (6-18m²)"]["ious"].append(biou)
                                else:
                                    size_stats["Large (>18m²)"]["tp"] += 1
                                    size_stats["Large (>18m²)"]["ious"].append(biou)
                    else:
                        total_fp += 1
                        if detailed:
                            topo_stats[topology]["fp"] += 1
                            if p_cname in class_stats:
                                class_stats[p_cname]["fp"] += 1
                else:
                    total_fp += 1
                    if detailed:
                        topo_stats[topology]["fp"] += 1
                        if p_cname in class_stats:
                            class_stats[p_cname]["fp"] += 1

            unmatched_gts = [i for i in range(num_gt) if i not in matched_gt]
            total_fn += len(unmatched_gts)
            if detailed:
                topo_stats[topology]["fn"] += len(unmatched_gts)
                for g_idx in unmatched_gts:
                    t_cname = ID2LABEL.get(tgt_labels[g_idx].item(), "Unknown")
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

    prec = total_tp / max(1, total_tp + total_fp)
    rec = total_tp / max(1, total_tp + total_fn)
    f1 = 2 * prec * rec / max(1e-6, prec + rec)
    mean_iou = sum_iou / max(1, num_matched_ious)

    hung_acc = hungarian_correct_classes / max(1, hungarian_total_targets)
    hung_iou = float(np.mean(hungarian_ious)) if hungarian_ious else 0.0
    hung_dice = float(np.mean(hungarian_dices)) if hungarian_dices else 0.0
    scale_mae = float(np.mean(scale_errors_abs)) if scale_errors_abs else 0.0
    scale_err_pct = float(np.mean(scale_errors_pct)) if scale_errors_pct else 0.0

    ret_dict = {
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "bbox_iou": round(mean_iou, 4),
        "hungarian_class_acc": round(hung_acc, 4),
        "hungarian_bbox_iou": round(hung_iou, 4),
        "hungarian_mask_dice": round(hung_dice, 4),
        "scale_mae": round(scale_mae, 2),
        "scale_error_pct": round(scale_err_pct, 2),
        "total_tp": total_tp,
        "total_fp": total_fp,
        "total_fn": total_fn,
    }

    if detailed:
        # Compute per-class F1
        per_class_summary = {}
        for cname, st in class_stats.items():
            c_tp, c_fp, c_fn = st["tp"], st["fp"], st["fn"]
            c_p = c_tp / max(1, c_tp + c_fp)
            c_r = c_tp / max(1, c_tp + c_fn)
            c_f1 = 2 * c_p * c_r / max(1e-6, c_p + c_r)
            c_iou = float(np.mean(st["ious"])) if st["ious"] else 0.0
            if (c_tp + c_fn) > 0:
                per_class_summary[cname] = {
                    "tp": c_tp, "fp": c_fp, "fn": c_fn,
                    "precision": round(c_p, 4), "recall": round(c_r, 4), "f1": round(c_f1, 4),
                    "bbox_iou": round(c_iou, 4),
                    "support": c_tp + c_fn,
                }

        # Compute per-size F1
        per_size_summary = {}
        for sname, st in size_stats.items():
            s_tp, s_fp, s_fn = st["tp"], st["fp"], st["fn"]
            s_p = s_tp / max(1, s_tp + s_fp)
            s_r = s_tp / max(1, s_tp + s_fn)
            s_f1 = 2 * s_p * s_r / max(1e-6, s_p + s_r)
            s_iou = float(np.mean(st["ious"])) if st["ious"] else 0.0
            per_size_summary[sname] = {
                "tp": s_tp, "fp": s_fp, "fn": s_fn,
                "precision": round(s_p, 4), "recall": round(s_r, 4), "f1": round(s_f1, 4),
                "bbox_iou": round(s_iou, 4),
                "support": s_tp + s_fn,
            }

        # Compute per-topology F1
        per_topo_summary = {}
        for tname, st in topo_stats.items():
            t_tp, t_fp, t_fn = st["tp"], st["fp"], st["fn"]
            t_p = t_tp / max(1, t_tp + t_fp)
            t_r = t_tp / max(1, t_tp + t_fn)
            t_f1 = 2 * t_p * t_r / max(1e-6, t_p + t_r)
            t_iou = float(np.mean(st["ious"])) if st["ious"] else 0.0
            per_topo_summary[tname] = {
                "tp": t_tp, "fp": t_fp, "fn": t_fn,
                "precision": round(t_p, 4), "recall": round(t_r, 4), "f1": round(t_f1, 4),
                "bbox_iou": round(t_iou, 4),
                "support": t_tp + t_fn,
            }

        ret_dict["per_class"] = per_class_summary
        ret_dict["per_size"] = per_size_summary
        ret_dict["per_topology"] = per_topo_summary

    return ret_dict


# =====================================================================
# Visualization on Test Layout
# =====================================================================

def visualize_test_sample(model, dataset, device, out_path, sample_idx=0, conf_thresh=0.25):
    model.eval()
    sample_entry = dataset.items[sample_idx]
    sample = sample_entry.get("sample_meta", sample_entry)
    orig_img_path = Path("HomeVerse-Dataset") / sample["image_path"]

    orig_img = Image.open(orig_img_path).convert("RGB")
    orig_w, orig_h = orig_img.size

    item = dataset[sample_idx]
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
        col_alpha = (*col, 90)
        poly = room.get("polygon", [])
        if poly and len(poly) >= 3:
            pts = [(int(p[0] * orig_w), int(p[1] * orig_h)) for p in poly]
            draw_overlay.polygon(pts, fill=col_alpha, outline=col)
            draw_canvas.line(pts + [pts[0]], fill=col, width=3)
        bx, by, bw, bh = room["bbox"]
        label = f"{room['type']} ({room.get('width_m', 0):.1f}x{room.get('length_m', 0):.1f}m)"
        x0, y0 = int(bx * orig_w), int(by * orig_h)
        draw_canvas.rectangle([x0, max(0, y0 - 18), x0 + len(label) * 7, y0], fill=col)
        draw_canvas.text((x0 + 2, max(0, y0 - 16)), label, fill=(255, 255, 255))

    # Prediction Right
    draw_canvas.text((orig_w + 15, 15), f"PREDICTION (Pred Scale: {pred_scale:.1f} px/m, Err: {abs(pred_scale - gt_scale)/gt_scale*100:.1f}%)", fill=(180, 0, 0))
    boxes_filt = pred_boxes[keep]
    scores_filt = top_scores[keep]
    labels_filt = top_classes[keep]
    masks_filt = pred_masks[keep]

    for i in range(len(scores_filt)):
        col = palette[i % len(palette)]
        col_alpha = (*col, 90)
        score = scores_filt[i].item()
        label_name = ID2LABEL.get(labels_filt[i].item(), "Room")

        mask_np = masks_filt[i].sigmoid().cpu().numpy()
        geom = extract_room_geometry_from_mask(mask_np, threshold=0.5, orig_size=(orig_w, orig_h))

        if geom is not None and geom.get("polygon"):
            poly = geom["polygon"]
            pts = [(int(p[0] * orig_w) + orig_w, int(p[1] * orig_h)) for p in poly]
            draw_overlay.polygon(pts, fill=col_alpha, outline=col)
            draw_canvas.line(pts + [pts[0]], fill=col, width=3)
            bx, by, bw, bh = geom["bbox_pixels"]
            x0 = bx + orig_w
            y0 = by
        else:
            cx, cy, bw_n, bh_n = boxes_filt[i].tolist()
            x0 = int((cx - bw_n / 2.0) * orig_w) + orig_w
            y0 = int((cy - bh_n / 2.0) * orig_h)
            w_px = int(bw_n * orig_w)
            h_px = int(bh_n * orig_h)
            draw_canvas.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=3)

        label_txt = f"{label_name} ({score:.2f})"
        draw_canvas.rectangle([x0, max(0, y0 - 18), x0 + len(label_txt) * 7, y0], fill=col)
        draw_canvas.text((x0 + 2, max(0, y0 - 16)), label_txt, fill=(255, 255, 255))

    combined = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    out_p = Path(out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    combined.save(out_p)
    print(f"Saved visual artifact to: {out_p}", flush=True)


# =====================================================================
# Safe Checkpoint Save
# =====================================================================

def safe_torch_save(obj, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(f".tmp_{os.getpid()}_{int(time.time()*1000)}")
    for attempt in range(5):
        try:
            torch.save(obj, tmp_path)
            if path.exists():
                try:
                    path.unlink()
                except OSError:
                    pass
            os.replace(tmp_path, path)
            return
        except OSError:
            time.sleep(0.5)
    try:
        torch.save(obj, path)
    except Exception as e:
        print(f"Warning: could not save checkpoint ({e}), continuing...", flush=True)


# =====================================================================
# Main Training & Evaluation Loop for Experiment E
# =====================================================================

def run_experiment_e(epochs=150, batch_size=7, img_size=384, patience=15, eval_only=False):
    os.environ["OMP_NUM_THREADS"] = "8"
    os.environ["MKL_NUM_THREADS"] = "8"
    os.environ["OMP_WAIT_POLICY"] = "PASSIVE"
    os.environ["KMP_BLOCKTIME"] = "0"
    num_threads = 8
    torch.set_num_threads(num_threads)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 80, flush=True)
    print("EXPERIMENT E — 100 LAYOUTS (300 IMAGES TOTAL)", flush=True)
    print(f"Device: {device} | Threads: {num_threads} | Image Res: {img_size}x{img_size} | Max Epochs: {epochs} | Batch Size: {batch_size}", flush=True)
    print("=" * 80, flush=True)

    # 1. Dataset Partitioning: 70 train layouts, 15 val layouts, 15 test layouts (3 variants each)
    transform = get_image_transform(img_size)

    def extract_split_samples(split_name, layout_count):
        json_path = Path("HomeVerse-Dataset") / f"annotations/{split_name}.json"
        with open(json_path, "r", encoding="utf-8") as f:
            all_samples = json.load(f)

        selected_layouts = {}
        for s in all_samples:
            lid = s["layout_id"]
            if lid not in selected_layouts:
                if len(selected_layouts) >= layout_count:
                    continue
                selected_layouts[lid] = []
            selected_layouts[lid].append(s)

        samples = []
        for lid, items in selected_layouts.items():
            topo = classify_topology(items[0])
            for it in items:
                it["topology"] = topo
                samples.append(it)
        return samples

    print("\nExtracting disjoint layout splits...", flush=True)
    train_samples = extract_split_samples("train", 70)          # 210 images
    val_samples = extract_split_samples("validation", 15)       # 45 images
    test_samples = extract_split_samples("test", 15)            # 45 images

    train_lids = set(s["layout_id"] for s in train_samples)
    val_lids = set(s["layout_id"] for s in val_samples)
    test_lids = set(s["layout_id"] for s in test_samples)

    print(f"Train split:      {len(train_samples)} images ({len(train_lids)} layouts)")
    print(f"Validation split: {len(val_samples)} images ({len(val_lids)} layouts)")
    print(f"Test split:       {len(test_samples)} images ({len(test_lids)} layouts)")

    # Assert zero layout leakage
    assert len(train_lids.intersection(val_lids)) == 0, "FATAL: Layout leakage between Train and Val!"
    assert len(train_lids.intersection(test_lids)) == 0, "FATAL: Layout leakage between Train and Test!"
    assert len(val_lids.intersection(test_lids)) == 0, "FATAL: Layout leakage between Val and Test!"
    print("Verification passed: Layout IDs are 100% disjoint with zero data leakage!", flush=True)

    # 2. Pre-cache all samples in RAM for maximum training throughput
    def cache_dataset(samples):
        ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=img_size, mask_size=(96, 96))
        ds.samples = samples
        items = []
        for i in range(len(ds)):
            item = ds[i]
            item["sample_meta"] = samples[i]
            items.append(item)
        return InMemoryDataset(items)

    print("\nPre-caching dataset images and annotations in RAM...", flush=True)
    t_c0 = time.time()
    train_ds = cache_dataset(train_samples)
    val_ds = cache_dataset(val_samples)
    test_ds = cache_dataset(test_samples)
    print(f"Pre-caching complete in {time.time() - t_c0:.1f}s. Zero disk I/O overhead during training.", flush=True)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, collate_fn=collate_fn_with_meta)
    val_loader = DataLoader(val_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)
    test_loader = DataLoader(test_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

    # 3. Model Architecture Setup
    model = MultiTaskViT384(pretrained_model_name="google/vit-base-patch16-384", img_size=img_size).to(device)

    # Check for existing experiment_e_best or overfit_30_v2 checkpoint
    ckpt_e = Path("checkpoints/multitask/experiment_e_best.pt")
    ckpt_v2 = Path("checkpoints/multitask/overfit_30_v2_best.pt")
    if ckpt_e.exists():
        print(f"Loading weights from previous Experiment E checkpoint: {ckpt_e}...", flush=True)
        try:
            ckpt = torch.load(ckpt_e, map_location=device)
            missing, unexpected = model.load_state_dict(ckpt, strict=False)
            print(f"Loaded weights from {ckpt_e} (missing: {len(missing)}, unexpected: {len(unexpected)}).", flush=True)
        except Exception as e:
            print(f"Could not load {ckpt_e}: {e}", flush=True)
    elif ckpt_v2.exists():
        print(f"Transferring detector head weights from {ckpt_v2}...", flush=True)
        try:
            ckpt = torch.load(ckpt_v2, map_location=device)
            head_weights = {k: v for k, v in ckpt.items() if not k.startswith("encoder")}
            missing, unexpected = model.load_state_dict(head_weights, strict=False)
            print(f"Transferred {len(head_weights)} detector head weight tensors successfully.", flush=True)
        except Exception as e:
            print(f"Could not load {ckpt_v2}: {e}, initializing from scratch.", flush=True)

    # 4. Partial ViT Unfreezing:
    # Blocks 1-8 frozen, Blocks 9-12 trainable
    for p in model.encoder.embeddings.parameters():
        p.requires_grad = False

    vit_layers = model.encoder.layers if hasattr(model.encoder, "layers") else model.encoder.encoder.layer
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
    head_trainable = (
        list(model.query_embed.parameters()) +
        list(model.decoder.parameters()) +
        list(model.class_head.parameters()) +
        list(model.bbox_head.parameters()) +
        list(model.seg_head.parameters()) +
        list(model.scale_head.parameters())
    )
    print(f"Trainable parameters: ViT top-4 blocks: {len(vit_trainable)}, Decoder & Heads: {len(head_trainable)}", flush=True)

    # 5. Loss Formulation & Optimizer
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterion(
        matcher=matcher,
        weight_class=1.0,
        weight_bbox=5.0,
        weight_giou=2.0,
        weight_mask=2.5,
        weight_scale=0.1,
        eos_coef=0.1
    ).to(device)

    # Differential Learning Rates: Head LR = 1.5e-4, ViT LR = 1.5e-5
    optimizer = torch.optim.AdamW([
        {"params": vit_trainable, "lr": 1.5e-5, "weight_decay": 1e-4},
        {"params": head_trainable, "lr": 1.5e-4, "weight_decay": 1e-5},
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    best_val_f1 = -1.0
    best_epoch = -1
    patience_counter = 0
    best_ckpt_path = Path("checkpoints/multitask/experiment_e_best.pt")

    if not eval_only and epochs > 0:
        print("\nEvaluating baseline validation performance before starting training...", flush=True)
        base_val_m = evaluate_split(model, val_loader, device, conf_thresh=0.25, iou_thresh=0.50, detailed=False)
        best_val_f1 = base_val_m["f1"]
        print(f"Loaded checkpoint baseline Val F1: {best_val_f1:.4f} (IoU: {base_val_m['bbox_iou']:.4f}, Dice: {base_val_m['hungarian_mask_dice']:.4f})", flush=True)

        print("\nStarting Training...", flush=True)
        t_train_start = time.time()

        for epoch in range(1, epochs + 1):
            t_ep0 = time.time()
            model.train()

            running_loss = 0.0
            running_ce = 0.0
            running_bbox = 0.0
            running_giou = 0.0
            running_mask = 0.0
            running_scale = 0.0
            num_batches = 0

            for images, targets in train_loader:
                images = images.to(device)
                optimizer.zero_grad()

                outputs = model(images)
                loss_dict = criterion(outputs, targets)
                loss = loss_dict["loss"]

                loss.backward()
                torch.nn.utils.clip_grad_norm_(vit_trainable + head_trainable, max_norm=1.0)
                optimizer.step()

                running_loss += loss.item()
                running_ce += loss_dict["loss_ce"].item()
                running_bbox += loss_dict["loss_bbox"].item()
                running_giou += loss_dict["loss_giou"].item()
                running_mask += loss_dict["loss_mask"].item()
                running_scale += loss_dict["loss_scale"].item()
                num_batches += 1

                if num_batches % 5 == 0 or num_batches == len(train_loader):
                    print(f"  [Epoch {epoch:03d} | Batch {num_batches:02d}/{len(train_loader)}] Current Batch Loss: {loss.item():.4f}", flush=True)

            scheduler.step()
            ep_duration = time.time() - t_ep0

            avg_loss = running_loss / num_batches
            avg_ce = running_ce / num_batches
            avg_bbox = running_bbox / num_batches
            avg_giou = running_giou / num_batches
            avg_mask = running_mask / num_batches
            avg_scale = running_scale / num_batches

            # Evaluate on Validation Set
            val_m = evaluate_split(model, val_loader, device, conf_thresh=0.25, iou_thresh=0.50, detailed=False)

            print(
                f"Epoch {epoch:03d}/{epochs} ({ep_duration:.1f}s) | "
                f"Loss: {avg_loss:.4f} [CE: {avg_ce:.3f}, BBox: {avg_bbox:.3f}, GIoU: {avg_giou:.3f}, Mask: {avg_mask:.3f}, Sc: {avg_scale:.3f}] | "
                f"Val F1: {val_m['f1']:.4f} (P: {val_m['precision']:.3f}, R: {val_m['recall']:.3f}) | "
                f"Val IoU: {val_m['bbox_iou']:.4f} | Val Dice: {val_m['hungarian_mask_dice']:.4f} | "
                f"Val Sc Err: {val_m['scale_error_pct']:.1f}%",
                flush=True,
            )

            # Checkpointing and Early Stopping
            if val_m["f1"] > best_val_f1:
                best_val_f1 = val_m["f1"]
                best_epoch = epoch
                patience_counter = 0
                safe_torch_save(model.state_dict(), best_ckpt_path)
                print(f"  --> Saved new best model (Val F1: {best_val_f1:.4f}) to {best_ckpt_path}", flush=True)
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"\n[Early Stopping triggered at epoch {epoch}] No validation improvement for {patience} epochs.", flush=True)
                    break

        print(f"\nTraining completed in {(time.time() - t_train_start)/60:.1f} minutes. Best epoch: {best_epoch} with Val F1: {best_val_f1:.4f}", flush=True)
    else:
        epoch = 0
        best_epoch = "checkpoint"

    # =====================================================================
    # Comprehensive Final Evaluation Across Train, Validation, and Test
    # =====================================================================
    print("\n" + "=" * 80, flush=True)
    print("RUNNING COMPREHENSIVE BENCHMARK EVALUATION ACROSS ALL SPLITS", flush=True)
    print("=" * 80, flush=True)

    # Load best checkpoint
    if best_ckpt_path.exists():
        model.load_state_dict(torch.load(best_ckpt_path, map_location=device))
        print(f"Loaded best checkpoint from {best_ckpt_path}.", flush=True)

    # 1. Train Evaluation
    print("Evaluating Train Set (210 images / 70 layouts)...", flush=True)
    train_eval_loader = DataLoader(train_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)
    train_metrics = evaluate_split(model, train_eval_loader, device, conf_thresh=0.25, iou_thresh=0.50, detailed=False)

    # 2. Validation Evaluation
    print("Evaluating Validation Set (45 images / 15 layouts)...", flush=True)
    val_metrics = evaluate_split(model, val_loader, device, conf_thresh=0.25, iou_thresh=0.50, detailed=False)

    # 3. Test Evaluation (Completely unseen layouts)
    print("Evaluating Test Set (45 images / 15 completely unseen layouts)...", flush=True)
    test_metrics = evaluate_split(model, test_loader, device, conf_thresh=0.25, iou_thresh=0.50, detailed=True)

    # 4. Save visualization artifact
    vis_path = "evaluation_results/experiment_e_test_vis.png"
    visualize_test_sample(model, test_ds, device, vis_path, sample_idx=0, conf_thresh=0.25)
    brain_vis = Path(r"C:\Users\anish\.gemini\antigravity-cli\brain\693badfe-ba5c-404d-835e-6d2b0610b1b1\experiment_e_test_vis.png")
    try:
        import shutil
        shutil.copy(vis_path, brain_vis)
        print(f"Copied visual artifact to brain: {brain_vis}", flush=True)
    except Exception as e:
        print(f"Could not copy artifact to brain: {e}", flush=True)

    # 5. Save results to JSON
    full_results = {
        "experiment": "Experiment E — 100 Layouts (300 Images)",
        "config": {
            "image_size": img_size,
            "vit_model": "google/vit-base-patch16-384",
            "epochs_run": epoch,
            "best_epoch": best_epoch,
            "batch_size": batch_size,
            "head_lr": 1.5e-4,
            "vit_lr": 1.5e-5,
            "loss_weights": {"ce": 1.0, "bbox": 5.0, "giou": 2.0, "mask": 2.5, "scale": 0.1},
        },
        "gates": {
            "train": {"target_f1": 0.90, "target_iou": 0.85, "target_dice": 0.85},
            "validation": {"target_f1": 0.75, "target_iou": 0.65, "target_dice": 0.70, "target_scale_err_pct": 10.0},
            "test": {"target_f1": 0.70, "target_iou": 0.60, "target_dice": 0.65, "target_scale_err_pct": 10.0},
        },
        "train": {
            "room_f1": train_metrics["f1"],
            "precision": train_metrics["precision"],
            "recall": train_metrics["recall"],
            "hungarian_class_acc": train_metrics["hungarian_class_acc"],
            "bbox_iou": train_metrics["bbox_iou"],
            "mask_dice": train_metrics["hungarian_mask_dice"],
            "scale_mae": train_metrics["scale_mae"],
            "scale_error_pct": train_metrics["scale_error_pct"],
        },
        "validation": {
            "room_f1": val_metrics["f1"],
            "precision": val_metrics["precision"],
            "recall": val_metrics["recall"],
            "hungarian_class_acc": val_metrics["hungarian_class_acc"],
            "bbox_iou": val_metrics["bbox_iou"],
            "mask_dice": val_metrics["hungarian_mask_dice"],
            "scale_mae": val_metrics["scale_mae"],
            "scale_error_pct": val_metrics["scale_error_pct"],
        },
        "test": {
            "room_f1": test_metrics["f1"],
            "precision": test_metrics["precision"],
            "recall": test_metrics["recall"],
            "hungarian_class_acc": test_metrics["hungarian_class_acc"],
            "bbox_iou": test_metrics["bbox_iou"],
            "mask_dice": test_metrics["hungarian_mask_dice"],
            "scale_mae": test_metrics["scale_mae"],
            "scale_error_pct": test_metrics["scale_error_pct"],
            "per_class": test_metrics["per_class"],
            "per_size": test_metrics["per_size"],
            "per_topology": test_metrics["per_topology"],
        },
    }

    results_path = Path("evaluation_results/experiment_e_results.json")
    results_path.parent.mkdir(parents=True, exist_ok=True)
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(full_results, f, indent=2)
    print(f"\nSaved full benchmark results to: {results_path}", flush=True)

    print("\n" + "=" * 80, flush=True)
    print("FINAL SUMMARY COMPARISON AGAINST TARGET GATES", flush=True)
    print("=" * 80, flush=True)
    print(f"{'Split':<12} | {'Metric':<20} | {'Achieved':<12} | {'Target Gate':<12} | {'Status'}")
    print("-" * 70)
    print(f"{'Train':<12} | {'Room F1':<20} | {train_metrics['f1']:<12.4f} | {'> 0.9000':<12} | {'PASS' if train_metrics['f1'] >= 0.90 else 'CHECK'}")
    print(f"{'Train':<12} | {'BBox IoU':<20} | {train_metrics['bbox_iou']:<12.4f} | {'> 0.8500':<12} | {'PASS' if train_metrics['bbox_iou'] >= 0.85 else 'CHECK'}")
    print(f"{'Train':<12} | {'Mask Dice':<20} | {train_metrics['hungarian_mask_dice']:<12.4f} | {'> 0.8500':<12} | {'PASS' if train_metrics['hungarian_mask_dice'] >= 0.85 else 'CHECK'}")
    print("-" * 70)
    print(f"{'Validation':<12} | {'Room F1':<20} | {val_metrics['f1']:<12.4f} | {'> 0.7500':<12} | {'PASS' if val_metrics['f1'] >= 0.75 else 'CHECK'}")
    print(f"{'Validation':<12} | {'BBox IoU':<20} | {val_metrics['bbox_iou']:<12.4f} | {'> 0.6500':<12} | {'PASS' if val_metrics['bbox_iou'] >= 0.65 else 'CHECK'}")
    print(f"{'Validation':<12} | {'Mask Dice':<20} | {val_metrics['hungarian_mask_dice']:<12.4f} | {'> 0.7000':<12} | {'PASS' if val_metrics['hungarian_mask_dice'] >= 0.70 else 'CHECK'}")
    print(f"{'Validation':<12} | {'Scale Error':<20} | {val_metrics['scale_error_pct']:<11.1f}% | {'< 10.0%':<12} | {'PASS' if val_metrics['scale_error_pct'] <= 10.0 else 'CHECK'}")
    print("-" * 70)
    print(f"{'Test':<12} | {'Room F1':<20} | {test_metrics['f1']:<12.4f} | {'> 0.7000':<12} | {'PASS' if test_metrics['f1'] >= 0.70 else 'CHECK'}")
    print(f"{'Test':<12} | {'BBox IoU':<20} | {test_metrics['bbox_iou']:<12.4f} | {'> 0.6000':<12} | {'PASS' if test_metrics['bbox_iou'] >= 0.60 else 'CHECK'}")
    print(f"{'Test':<12} | {'Mask Dice':<20} | {test_metrics['hungarian_mask_dice']:<12.4f} | {'> 0.6500':<12} | {'PASS' if test_metrics['hungarian_mask_dice'] >= 0.65 else 'CHECK'}")
    print(f"{'Test':<12} | {'Scale Error':<20} | {test_metrics['scale_error_pct']:<11.1f}% | {'< 10.0%':<12} | {'PASS' if test_metrics['scale_error_pct'] <= 10.0 else 'CHECK'}")
    print("=" * 80, flush=True)

    # 6. Generate Markdown Report in Brain Directory
    brain_dir = Path(r"C:\Users\anish\.gemini\antigravity-cli\brain\693badfe-ba5c-404d-835e-6d2b0610b1b1")
    report_path = brain_dir / "experiment_e_100_layout_results.md"
    generate_markdown_report(full_results, report_path)
    print(f"Generated markdown report at: {report_path}", flush=True)


def generate_markdown_report(res, out_path):
    train = res["train"]
    val = res["validation"]
    test = res["test"]
    cfg = res["config"]
    gates = res["gates"]

    def status_badge(achieved, target, higher_is_better=True):
        passed = (achieved >= target) if higher_is_better else (achieved <= target)
        if passed:
            return '<span style="color:green;font-weight:bold;">PASS</span>'
        else:
            return '<span style="color:orange;font-weight:bold;">CHECK</span>'

    md = []
    md.append("# Experiment E: 100-Layout Generalization Benchmark Report\n")
    md.append("## Executive Summary\n")
    md.append("Following the success of Experiment D (30-image overfit test), **Experiment E** evaluated whether the validated multi-task Vision Transformer architecture and loss formulation survive and generalize across **100 unique layouts (300 images total)**.\n")
    md.append(f"- **Dataset**: 100 unique architectural layouts × 3 visual styles (CAD, Blueprint, Scanned drawing) = 300 images total.")
    md.append(f"- **Partitioning**: 70 train layouts (210 images), 15 validation layouts (45 images), 15 test layouts (45 images). **Layout IDs are 100% disjoint with zero data leakage**.")
    md.append(f"- **Architecture**: ViT-384 (`google/vit-base-patch16-384`), Blocks 1–8 frozen, Blocks 9–12 trainable, differential LR (ViT: {cfg['vit_lr']}, Heads: {cfg['head_lr']}).")
    md.append(f"- **Multi-Task Objective**: $\\mathcal{{L}} = 1.0\\mathcal{{L}}_{{ce}} + 5.0\\mathcal{{L}}_{{bbox}} + 2.0\\mathcal{{L}}_{{giou}} + 2.5\\mathcal{{L}}_{{mask}} + 0.1\\mathcal{{L}}_{{scale}}$ with $\\log(\\text{{px/m}})$ scale regression.\n")

    md.append("### Target Gates vs. Benchmark Results\n")
    md.append("| Split | Metric | Gate | Achieved | Status |")
    md.append("|:---|:---|:---:|:---:|:---:|")
    md.append(f"| **Train** (70 layouts / 210 images) | Room F1 | > {gates['train']['target_f1']:.2f} | **{train['room_f1']:.4f}** | {status_badge(train['room_f1'], gates['train']['target_f1'])} |")
    md.append(f"| | Hungarian Class Acc | — | **{train['hungarian_class_acc']:.4f}** | — |")
    md.append(f"| | BBox IoU | > {gates['train']['target_iou']:.2f} | **{train['bbox_iou']:.4f}** | {status_badge(train['bbox_iou'], gates['train']['target_iou'])} |")
    md.append(f"| | Mask Dice | > {gates['train']['target_dice']:.2f} | **{train['mask_dice']:.4f}** | {status_badge(train['mask_dice'], gates['train']['target_dice'])} |")
    md.append(f"| | Scale Error | — | **{train['scale_error_pct']:.1f}%** ({train['scale_mae']:.2f} px/m) | — |")
    md.append(f"| **Validation** (15 layouts / 45 images) | Room F1 | > {gates['validation']['target_f1']:.2f} | **{val['room_f1']:.4f}** | {status_badge(val['room_f1'], gates['validation']['target_f1'])} |")
    md.append(f"| | Hungarian Class Acc | — | **{val['hungarian_class_acc']:.4f}** | — |")
    md.append(f"| | BBox IoU | > {gates['validation']['target_iou']:.2f} | **{val['bbox_iou']:.4f}** | {status_badge(val['bbox_iou'], gates['validation']['target_iou'])} |")
    md.append(f"| | Mask Dice | > {gates['validation']['target_dice']:.2f} | **{val['mask_dice']:.4f}** | {status_badge(val['mask_dice'], gates['validation']['target_dice'])} |")
    md.append(f"| | Scale Error | < {gates['validation']['target_scale_err_pct']:.1f}% | **{val['scale_error_pct']:.1f}%** ({val['scale_mae']:.2f} px/m) | {status_badge(val['scale_error_pct'], gates['validation']['target_scale_err_pct'], False)} |")
    md.append(f"| **Unseen Test** (15 layouts / 45 images) | Room F1 | > {gates['test']['target_f1']:.2f} | **{test['room_f1']:.4f}** | {status_badge(test['room_f1'], gates['test']['target_f1'])} |")
    md.append(f"| | Hungarian Class Acc | — | **{test['hungarian_class_acc']:.4f}** | — |")
    md.append(f"| | BBox IoU | > {gates['test']['target_iou']:.2f} | **{test['bbox_iou']:.4f}** | {status_badge(test['bbox_iou'], gates['test']['target_iou'])} |")
    md.append(f"| | Mask Dice | > {gates['test']['target_dice']:.2f} | **{test['mask_dice']:.4f}** | {status_badge(test['mask_dice'], gates['test']['target_dice'])} |")
    md.append(f"| | Scale Error | < {gates['test']['target_scale_err_pct']:.1f}% | **{test['scale_error_pct']:.1f}%** ({test['scale_mae']:.2f} px/m) | {status_badge(test['scale_error_pct'], gates['test']['target_scale_err_pct'], False)} |\n")

    md.append("---")
    md.append("## Visual Validation on Unseen Test Layout\n")
    md.append("Below is the side-by-side visualization comparing Ground Truth layout geometry and room labels (left) against Raw Model Predictions (right) on a completely unseen test layout:\n")
    md.append("![Experiment E Test Visual Overlay](experiment_e_test_vis.png)\n")

    md.append("---")
    md.append("## Granular Test Set Breakdowns (Completely Unseen Layouts)\n")
    md.append("### 1. Breakdown by Room Type\n")
    md.append("| Room Class | Precision | Recall | Room F1 | Mean BBox IoU | Ground Truth Support |")
    md.append("|:---|:---:|:---:|:---:|:---:|:---:|")
    per_class = test.get("per_class", {})
    for cname, st in sorted(per_class.items(), key=lambda item: item[1]["support"], reverse=True):
        md.append(f"| **{cname}** | {st['precision']:.4f} | {st['recall']:.4f} | **{st['f1']:.4f}** | {st['bbox_iou']:.4f} | {st['support']} |")

    md.append("\n### 2. Breakdown by Room Size\n")
    md.append("| Room Category | Definition | Precision | Recall | F1 Score | Mean BBox IoU | Support |")
    md.append("|:---|:---|:---:|:---:|:---:|:---:|:---:|")
    per_size = test.get("per_size", {})
    defs = {
        "Small (<6m²)": "Area < 6.0 m² (Toilets, powder rooms, closets)",
        "Medium (6-18m²)": "Area 6.0–18.0 m² (Bedrooms, kitchens, dining)",
        "Large (>18m²)": "Area > 18.0 m² (Living halls, master suites)",
        "Irregular (Non-rect)": "Non-rectangular polygons (> 4 vertices / L-shaped)"
    }
    for sname, st in per_size.items():
        d = defs.get(sname, "")
        md.append(f"| **{sname}** | {d} | {st['precision']:.4f} | {st['recall']:.4f} | **{st['f1']:.4f}** | {st['bbox_iou']:.4f} | {st['support']} |")

    md.append("\n### 3. Breakdown by Architectural Topology\n")
    md.append("| Topology Family | Description | Precision | Recall | F1 Score | Mean BBox IoU | Support |")
    md.append("|:---|:---|:---:|:---:|:---:|:---:|:---:|")
    per_topo = test.get("per_topology", {})
    for tname, st in sorted(per_topo.items(), key=lambda item: item[1]["support"], reverse=True):
        md.append(f"| **{tname}** | Layout envelope & room layout | {st['precision']:.4f} | {st['recall']:.4f} | **{st['f1']:.4f}** | {st['bbox_iou']:.4f} | {st['support']} |")

    out_p = Path(out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_p, "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=150)
    parser.add_argument("--batch-size", type=int, default=7)
    parser.add_argument("--img-size", type=int, default=384)
    parser.add_argument("--patience", type=int, default=15)
    parser.add_argument("--eval-only", action="store_true")
    args = parser.parse_args()

    run_experiment_e(epochs=args.epochs, batch_size=args.batch_size, img_size=args.img_size, patience=args.patience, eval_only=args.eval_only)
