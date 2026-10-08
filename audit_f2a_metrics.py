import json
import math
import os
import sys
import time
from pathlib import Path
import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from transformers import ViTModel, ViTConfig
from scipy.optimize import linear_sum_assignment

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
    CLASS2FAMILY,
    FAMILY_NAMES,
    NUM_FAMILIES,
    NO_ROOM_FAMILY_ID,
)


def nms_boxes(boxes, scores, iou_threshold=0.5):
    """
    Standard greedy Non-Maximum Suppression (xyxy boxes).
    """
    if len(boxes) == 0:
        return torch.empty(0, dtype=torch.long)
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    areas = (x2 - x1).clamp(min=0) * (y2 - y1).clamp(min=0)
    order = scores.argsort(descending=True)
    keep = []
    while order.numel() > 0:
        i = order[0].item()
        keep.append(i)
        if order.numel() == 1:
            break
        xx1 = torch.maximum(x1[i], x1[order[1:]])
        yy1 = torch.maximum(y1[i], y1[order[1:]])
        xx2 = torch.minimum(x2[i], x2[order[1:]])
        yy2 = torch.minimum(y2[i], y2[order[1:]])
        w = (xx2 - xx1).clamp(min=0)
        h = (yy2 - yy1).clamp(min=0)
        inter = w * h
        ovr = inter / (areas[i] + areas[order[1:]] - inter + 1e-6)
        remaining = torch.where(ovr <= iou_threshold)[0]
        order = order[remaining + 1]
    return torch.tensor(keep, dtype=torch.long)


def run_single_image_audit(model, test_samples, device, sample_idx=0):
    """
    Detailed audit of a single unseen test image.
    Prints GT rooms, all 25 queries, Hungarian matching, and inference matching.
    """
    sample = test_samples[sample_idx]
    layout_id = sample.get("layout_id", "unknown")
    img_name = sample.get("image", "unknown")
    print(f"\n=======================================================")
    print(f"AUDIT 1: Single Image Inspection (Layout {layout_id}, Image {img_name})")
    print(f"=======================================================")

    ds = FloorplanDataset("HomeVerse-Dataset", split="test", img_size=384, mask_size=(96, 96))
    ds.samples = [sample]
    item = ds[0]
    item["sample_meta"] = sample

    img_tensor = item["image"].unsqueeze(0).to(device)
    targets = [{
        "boxes": item["boxes"].to(device),
        "labels": item["labels"].to(device),
        "masks": item["masks"].to(device),
        "scale_px_per_m": item["scale_px_per_m"].to(device),
        "has_scale": item["has_scale"].to(device),
        "sample_meta": sample,
    }]

    model.eval()
    with torch.no_grad():
        outputs = model(img_tensor)
        pred_logits = outputs["pred_logits"]
        pred_boxes = outputs["pred_boxes"]
        pred_masks = outputs["pred_masks"]
        pred_scale = outputs["pred_scale"]
        probs = pred_logits.softmax(-1)[0] # [25, 23]
        boxes = pred_boxes[0]              # [25, 4]
        masks = pred_masks[0]              # [25, 96, 96]

    gt_boxes = targets[0]["boxes"]         # [N, 4]
    gt_labels = targets[0]["labels"]       # [N]
    gt_masks = targets[0]["masks"]         # [N, 96, 96]
    gt_rooms = sample.get("rooms", [])
    num_gt = len(gt_labels)

    print(f"\nGround Truth Rooms Count: {num_gt}")
    for i in range(num_gt):
        lbl = gt_labels[i].item()
        cname = ID2LABEL.get(lbl, "Unknown")
        b = gt_boxes[i].cpu().tolist()
        r_meta = gt_rooms[i] if i < len(gt_rooms) else {}
        w_m = r_meta.get("width_m", r_meta.get("dimensions", {}).get("width_m", "N/A"))
        l_m = r_meta.get("length_m", r_meta.get("dimensions", {}).get("length_m", "N/A"))
        area = r_meta.get("area_m2", r_meta.get("dimensions", {}).get("area_m2", "N/A"))
        print(f"  GT {i:02d}: {cname:<20} | Box [cx={b[0]:.3f}, cy={b[1]:.3f}, w={b[2]:.3f}, h={b[3]:.3f}] | Dim: {w_m}x{l_m}m ({area} m²)")

    # 1. Hungarian Matching
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    indices = matcher(pred_logits, pred_boxes, targets)
    src_idx, tgt_idx = indices[0]

    p_xyxy = box_cxcywh_to_xyxy(boxes[src_idx])
    t_xyxy = box_cxcywh_to_xyxy(gt_boxes[tgt_idx])
    pair_ious, _ = box_iou(p_xyxy, t_xyxy)
    h_ious = torch.diag(pair_ious).cpu().tolist()

    p_m_sub = masks[src_idx].sigmoid().flatten(1)
    t_m_sub = gt_masks[tgt_idx].flatten(1)
    dices = ((2.0 * (p_m_sub * t_m_sub).sum(-1) + 1e-5) / (p_m_sub.sum(-1) + t_m_sub.sum(-1) + 1e-5)).cpu().tolist()

    print(f"\n--- Hungarian Matching (Oracle 1-to-1 Matching using GT cost) ---")
    print(f"{'GT Room':<22} | {'Matched Query':<14} | {'Top Pred Class':<18} | {'Score':<7} | {'Bg Score':<9} | {'BBox IoU':<9} | {'Mask Dice'}")
    print("-" * 105)
    for k in range(len(tgt_idx)):
        g_i = tgt_idx[k].item()
        q_i = src_idx[k].item()
        g_name = ID2LABEL.get(gt_labels[g_i].item(), "Unknown")
        top_cls = probs[q_i].argmax().item()
        top_score = probs[q_i, top_cls].item()
        bg_score = probs[q_i, NO_ROOM_ID].item()
        top_name = ID2LABEL.get(top_cls, "Unknown")
        iou = h_ious[k]
        dice = dices[k]
        print(f"GT {g_i:02d} ({g_name:<16}) | Query {q_i:02d}       | {top_name:<18} | {top_score:.3f}   | {bg_score:.3f}     | {iou:.4f}    | {dice:.4f}")

    mean_h_iou = np.mean(h_ious) if h_ious else 0.0
    mean_h_dice = np.mean(dices) if dices else 0.0
    print(f"Hungarian Mean IoU: {mean_h_iou:.4f} | Hungarian Mean Mask Dice: {mean_h_dice:.4f}")

    # 2. All 25 Queries Inspection
    print(f"\n--- All 25 Query Predictions (Unconditional) ---")
    print(f"{'Q_ID':<5} | {'Top Class':<20} | {'Score':<7} | {'Bg Prob':<8} | {'cx,cy,w,h':<24} | {'Max GT IoU':<10} | {'Nearest GT'}")
    print("-" * 95)
    all_p_xyxy = box_cxcywh_to_xyxy(boxes)
    all_gt_xyxy = box_cxcywh_to_xyxy(gt_boxes)
    all_ious, _ = box_iou(all_p_xyxy, all_gt_xyxy)

    for q in range(25):
        top_cls = probs[q].argmax().item()
        top_score = probs[q, top_cls].item()
        bg_prob = probs[q, NO_ROOM_ID].item()
        top_name = ID2LABEL.get(top_cls, "Background" if top_cls == NO_ROOM_ID else "Unknown")
        b = boxes[q].cpu().tolist()
        b_str = f"{b[0]:.2f},{b[1]:.2f},{b[2]:.2f},{b[3]:.2f}"
        max_iou, best_gt = all_ious[q].max(dim=-1)
        best_gt_name = ID2LABEL.get(gt_labels[best_gt.item()].item(), "Unknown")
        print(f"Q{q:02d}  | {top_name:<20} | {top_score:.3f}   | {bg_prob:.3f}    | {b_str:<24} | {max_iou.item():.4f}     | GT {best_gt.item():02d} ({best_gt_name})")

    # 3. Detection Matching Logic Comparison on this image
    conf_thresh = 0.25
    top_scores, top_classes = probs.max(dim=-1)
    keep_mask = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)
    keep_indices = torch.where(keep_mask)[0]

    print(f"\n--- Detection Matching Comparison on this Image (conf_thresh={conf_thresh}, iou_thresh=0.50) ---")
    print(f"Queries surviving conf >= {conf_thresh} & not Background: {len(keep_indices)} out of 25")
    for qi in keep_indices.tolist():
        cls_id = top_classes[qi].item()
        cname = ID2LABEL.get(cls_id, "Unknown")
        sc = top_scores[qi].item()
        best_iou, best_gt = all_ious[qi].max(dim=-1)
        print(f"  Surviving Q{qi:02d}: {cname:<18} (score={sc:.3f}), Max IoU={best_iou.item():.3f} with GT {best_gt.item()} ({ID2LABEL.get(gt_labels[best_gt].item())})")

    # (A) Current Implementation (Query index order, NO score sort, NO NMS)
    det_tp_cur, det_fp_cur = 0, 0
    matched_det_gt_cur = set()
    for qi in keep_indices.tolist():
        best_iou, best_gt = all_ious[qi].max(dim=-1)
        biou = best_iou.item()
        bgt = best_gt.item()
        if biou >= 0.50 and bgt not in matched_det_gt_cur:
            det_tp_cur += 1
            matched_det_gt_cur.add(bgt)
        else:
            det_fp_cur += 1
    det_fn_cur = num_gt - len(matched_det_gt_cur)
    p_cur = det_tp_cur / max(1, det_tp_cur + det_fp_cur)
    r_cur = det_tp_cur / max(1, det_tp_cur + det_fn_cur)
    f1_cur = 2 * p_cur * r_cur / max(1e-6, p_cur + r_cur)
    print(f"\n(A) Current Logic (Query order, No Sort, No NMS):")
    print(f"    TP: {det_tp_cur}, FP: {det_fp_cur}, FN: {det_fn_cur} => Precision: {p_cur:.4f}, Recall: {r_cur:.4f}, F1: {f1_cur:.4f}")

    # (B) Score-Sorted Greedy Matching (Standard VOC/COCO)
    sorted_order = keep_indices[top_scores[keep_indices].argsort(descending=True)].tolist()
    det_tp_sort, det_fp_sort = 0, 0
    matched_det_gt_sort = set()
    for qi in sorted_order:
        best_iou, best_gt = all_ious[qi].max(dim=-1)
        biou = best_iou.item()
        bgt = best_gt.item()
        if biou >= 0.50 and bgt not in matched_det_gt_sort:
            det_tp_sort += 1
            matched_det_gt_sort.add(bgt)
        else:
            det_fp_sort += 1
    det_fn_sort = num_gt - len(matched_det_gt_sort)
    p_sort = det_tp_sort / max(1, det_tp_sort + det_fp_sort)
    r_sort = det_tp_sort / max(1, det_tp_sort + det_fn_sort)
    f1_sort = 2 * p_sort * r_sort / max(1e-6, p_sort + r_sort)
    print(f"\n(B) Score-Sorted Greedy (Descending confidence, No NMS):")
    print(f"    TP: {det_tp_sort}, FP: {det_fp_sort}, FN: {det_fn_sort} => Precision: {p_sort:.4f}, Recall: {r_sort:.4f}, F1: {f1_sort:.4f}")

    # (C) Score-Sorted Greedy WITH NMS (iou=0.4)
    nms_keep_sub = nms_boxes(all_p_xyxy[keep_indices], top_scores[keep_indices], iou_threshold=0.40)
    nms_indices = keep_indices[nms_keep_sub]
    sorted_nms_order = nms_indices[top_scores[nms_indices].argsort(descending=True)].tolist()
    det_tp_nms, det_fp_nms = 0, 0
    matched_det_gt_nms = set()
    for qi in sorted_nms_order:
        best_iou, best_gt = all_ious[qi].max(dim=-1)
        biou = best_iou.item()
        bgt = best_gt.item()
        if biou >= 0.50 and bgt not in matched_det_gt_nms:
            det_tp_nms += 1
            matched_det_gt_nms.add(bgt)
        else:
            det_fp_nms += 1
    det_fn_nms = num_gt - len(matched_det_gt_nms)
    p_nms = det_tp_nms / max(1, det_tp_nms + det_fp_nms)
    r_nms = det_tp_nms / max(1, det_tp_nms + det_fn_nms)
    f1_nms = 2 * p_nms * r_nms / max(1e-6, p_nms + r_nms)
    print(f"\n(C) Score-Sorted Greedy WITH NMS (IoU thresh=0.40):")
    print(f"    Kept queries after NMS: {len(nms_indices)}")
    print(f"    TP: {det_tp_nms}, FP: {det_fp_nms}, FN: {det_fn_nms} => Precision: {p_nms:.4f}, Recall: {r_nms:.4f}, F1: {f1_nms:.4f}")


def run_full_dataset_audit(model, test_samples, device, max_layouts=75):
    """
    Evaluates multiple variations across unseen test layouts:
    - Current Logic (conf 0.25, iou 0.50, query order)
    - Threshold Sweeps (conf 0.10, 0.20, 0.25, 0.35, 0.50)
    - IoU Sweeps (0.25, 0.40, 0.50)
    - With vs Without NMS
    - Deep Breakdown by Room Size (<6m², 6-18m², >18m²)
    - Deep Breakdown by Room Class
    """
    print(f"\n=======================================================")
    print(f"AUDIT 2: Benchmark Evaluation Audit on 75 Unseen Layouts")
    print(f"=======================================================")

    img_size = 384
    ds = FloorplanDataset("HomeVerse-Dataset", split="test", img_size=img_size, mask_size=(96, 96))
    ds.samples = test_samples
    items = []
    for i in range(len(ds)):
        it = ds[i]
        it["sample_meta"] = test_samples[i]
        items.append(it)
    test_ds = InMemoryDataset(items)
    dataloader = DataLoader(test_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

    # Collect predictions once across test set
    model.eval()
    all_data = []
    print(f"Running inference on {len(test_ds)} test images...", flush=True)
    t0 = time.time()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    hungarian_ious_all = []
    hungarian_dices_all = []

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
                # Hungarian metrics
                s_idx, t_idx = indices[b]
                tgt_labels = targets[b]["labels"].to(device)
                tgt_boxes = targets[b]["boxes"].to(device)
                tgt_masks = targets[b]["masks"].to(device) if "masks" in targets[b] else None
                if len(t_idx) > 0:
                    p_xyxy = box_cxcywh_to_xyxy(pred_boxes[b, s_idx])
                    t_xyxy = box_cxcywh_to_xyxy(tgt_boxes[t_idx])
                    ious, _ = box_iou(p_xyxy, t_xyxy)
                    hungarian_ious_all.extend(torch.diag(ious).cpu().tolist())

                    if tgt_masks is not None and tgt_masks.numel() > 0:
                        p_m = pred_masks[b, s_idx].sigmoid().flatten(1)
                        t_m = tgt_masks[t_idx].flatten(1)
                        d = ((2.0 * (p_m * t_m).sum(-1) + 1e-5) / (p_m.sum(-1) + t_m.sum(-1) + 1e-5)).cpu().tolist()
                        hungarian_dices_all.extend(d)

                all_data.append({
                    "probs": probs[b].cpu(),
                    "pred_boxes": pred_boxes[b].cpu(),
                    "tgt_labels": targets[b]["labels"].cpu(),
                    "tgt_boxes": targets[b]["boxes"].cpu(),
                    "sample_meta": targets[b]["sample_meta"],
                })

    print(f"Inference completed in {time.time() - t0:.1f}s.")
    print(f"\n[Baseline Verification]")
    print(f"Hungarian BBox IoU:       {np.mean(hungarian_ious_all):.4f}")
    print(f"Hungarian Wall Mask Dice:  {np.mean(hungarian_dices_all):.4f}")

    def evaluate_with_settings(conf_thresh, iou_thresh, sort_by_conf=False, use_nms=False, nms_iou=0.40):
        det_tp, det_fp, det_fn = 0, 0, 0
        sem_tp, sem_fp, sem_fn = 0, 0, 0

        for item in all_data:
            probs = item["probs"]
            pred_boxes = item["pred_boxes"]
            tgt_labels = item["tgt_labels"]
            tgt_boxes = item["tgt_boxes"]

            num_gt = len(tgt_labels)
            top_scores, top_classes = probs.max(dim=-1)
            keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)
            keep_indices = torch.where(keep)[0]

            if len(keep_indices) == 0:
                det_fn += num_gt
                sem_fn += num_gt
                continue

            p_boxes = pred_boxes[keep_indices]
            p_scores = top_scores[keep_indices]
            p_classes = top_classes[keep_indices]

            if use_nms:
                xyxy = box_cxcywh_to_xyxy(p_boxes)
                nms_keep = nms_boxes(xyxy, p_scores, iou_threshold=nms_iou)
                keep_indices = keep_indices[nms_keep]
                p_boxes = pred_boxes[keep_indices]
                p_scores = top_scores[keep_indices]
                p_classes = top_classes[keep_indices]

            if sort_by_conf:
                order = p_scores.argsort(descending=True)
                p_boxes = p_boxes[order]
                p_classes = p_classes[order]
                p_scores = p_scores[order]

            num_pred = len(p_classes)
            if num_gt == 0:
                det_fp += num_pred
                sem_fp += num_pred
                continue

            p_xyxy = box_cxcywh_to_xyxy(p_boxes)
            t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
            b_ious, _ = box_iou(p_xyxy, t_xyxy)

            matched_det_gt = set()
            matched_sem_gt = set()

            for p_idx in range(num_pred):
                best_iou, best_gt = b_ious[p_idx].max(dim=-1)
                biou = best_iou.item()
                bgt = best_gt.item()
                p_cls = p_classes[p_idx].item()
                t_cls = tgt_labels[bgt].item()

                if biou >= iou_thresh and bgt not in matched_det_gt:
                    det_tp += 1
                    matched_det_gt.add(bgt)
                else:
                    det_fp += 1

                if biou >= iou_thresh and bgt not in matched_sem_gt:
                    if p_cls == t_cls:
                        sem_tp += 1
                        matched_sem_gt.add(bgt)
                    else:
                        sem_fp += 1
                else:
                    sem_fp += 1

            det_fn += (num_gt - len(matched_det_gt))
            sem_fn += (num_gt - len(matched_sem_gt))

        det_p = det_tp / max(1, det_tp + det_fp)
        det_r = det_tp / max(1, det_tp + det_fn)
        det_f1 = 2 * det_p * det_r / max(1e-6, det_p + det_r)

        sem_p = sem_tp / max(1, sem_tp + sem_fp)
        sem_r = sem_tp / max(1, sem_tp + sem_fn)
        sem_f1 = 2 * sem_p * sem_r / max(1e-6, sem_p + sem_r)

        return {
            "det_tp": det_tp, "det_fp": det_fp, "det_fn": det_fn,
            "det_p": det_p, "det_r": det_r, "det_f1": det_f1,
            "sem_tp": sem_tp, "sem_fp": sem_fp, "sem_fn": sem_fn,
            "sem_p": sem_p, "sem_r": sem_r, "sem_f1": sem_f1,
        }

    print(f"\n--- AUDIT 2.1: Matching Logic & Deduplication Comparison ---")
    print(f"{'Configuration':<45} | {'Det Prec':<9} | {'Det Rec':<8} | {'Det F1':<8} | {'Sem F1':<8} | {'TP':<5} | {'FP':<5} | {'FN'}")
    print("-" * 105)

    configs = [
        ("Current F2-A (Query order, No Sort, No NMS)", 0.25, 0.50, False, False, 0.4),
        ("Score-Sorted Greedy (No NMS)", 0.25, 0.50, True, False, 0.4),
        ("Score-Sorted + NMS (IoU 0.50)", 0.25, 0.50, True, True, 0.50),
        ("Score-Sorted + NMS (IoU 0.40)", 0.25, 0.50, True, True, 0.40),
        ("Score-Sorted + NMS (IoU 0.30)", 0.25, 0.50, True, True, 0.30),
    ]

    for name, c_th, i_th, sort_c, nms_c, nms_i in configs:
        res = evaluate_with_settings(c_th, i_th, sort_by_conf=sort_c, use_nms=nms_c, nms_iou=nms_i)
        print(f"{name:<45} | {res['det_p']:.4f}    | {res['det_r']:.4f}   | {res['det_f1']:.4f}   | {res['sem_f1']:.4f}   | {res['det_tp']:<5} | {res['det_fp']:<5} | {res['det_fn']}")

    print(f"\n--- AUDIT 2.2: Confidence Threshold Sweep (with Score-Sorted + NMS 0.40, IoU 0.50) ---")
    print(f"{'Conf Threshold':<16} | {'Det Prec':<9} | {'Det Rec':<8} | {'Det F1':<8} | {'Sem F1':<8} | {'TP':<5} | {'FP':<5} | {'FN'}")
    print("-" * 75)
    for c_th in [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]:
        res = evaluate_with_settings(c_th, 0.50, sort_by_conf=True, use_nms=True, nms_iou=0.40)
        print(f"conf >= {c_th:<8.2f} | {res['det_p']:.4f}    | {res['det_r']:.4f}   | {res['det_f1']:.4f}   | {res['sem_f1']:.4f}   | {res['det_tp']:<5} | {res['det_fp']:<5} | {res['det_fn']}")

    print(f"\n--- AUDIT 2.3: IoU Threshold Sweep (conf >= 0.20, Score-Sorted + NMS 0.40) ---")
    print(f"{'IoU Threshold':<16} | {'Det Prec':<9} | {'Det Rec':<8} | {'Det F1':<8} | {'Sem F1':<8} | {'TP':<5} | {'FP':<5} | {'FN'}")
    print("-" * 75)
    for i_th in [0.25, 0.35, 0.40, 0.50, 0.60, 0.75]:
        res = evaluate_with_settings(0.20, i_th, sort_by_conf=True, use_nms=True, nms_iou=0.40)
        print(f"IoU >= {i_th:<9.2f} | {res['det_p']:.4f}    | {res['det_r']:.4f}   | {res['det_f1']:.4f}   | {res['sem_f1']:.4f}   | {res['det_tp']:<5} | {res['det_fp']:<5} | {res['det_fn']}")


def main():
    torch.set_num_threads(8)
    device = torch.device("cpu")
    print("Initializing F2-A model on CPU...", flush=True)
    model = MultiTaskViT384FPN(pretrained_model_name="google/vit-base-patch16-384", img_size=384).to(device)

    ckpt_path = Path("checkpoints/multitask/experiment_f2a_best.pt")
    if not ckpt_path.exists():
        print(f"Error: {ckpt_path} not found!")
        return

    print(f"Loading checkpoint {ckpt_path}...", flush=True)
    ckpt = torch.load(ckpt_path, map_location=device)
    model.load_state_dict(ckpt, strict=False)
    print("Checkpoint loaded successfully.", flush=True)

    print("Selecting 75 test layouts...", flush=True)
    te_lids, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)
    print(f"Selected {len(test_samples)} test images across {len(te_lids)} unique layouts.")

    # Run single image audit
    run_single_image_audit(model, test_samples, device, sample_idx=0)

    # Run full dataset audit
    run_full_dataset_audit(model, test_samples, device, max_layouts=75)


if __name__ == "__main__":
    main()
