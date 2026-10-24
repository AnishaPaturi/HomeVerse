import os
import sys
import json
import time
from pathlib import Path
import numpy as np
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

from floorplan_dataset import (
    FloorplanDataset,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
)
from vit_detector import box_cxcywh_to_xyxy, box_iou
from run_experiment_f1_fpn import MultiTaskViT384FPN
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta


def run_model_inference_cache(model, dataloader, device):
    """Run forward pass once across the full dataloader and cache outputs."""
    model.eval()
    cached_batches = []
    t0 = time.time()
    with torch.no_grad():
        for b_idx, (images, targets) in enumerate(dataloader):
            images = images.to(device)
            outputs = model(images)
            pred_logits = outputs["pred_logits"].cpu()
            pred_boxes = outputs["pred_boxes"].cpu()
            pred_masks = outputs["pred_masks"].cpu() if "pred_masks" in outputs else None
            pred_scale = outputs["pred_scale"].cpu() if "pred_scale" in outputs else None
            probs = pred_logits.softmax(-1)

            # Move targets to CPU tensors
            cpu_targets = []
            for t in targets:
                cpu_targets.append({
                    "labels": t["labels"].cpu(),
                    "boxes": t["boxes"].cpu(),
                    "masks": t["masks"].cpu() if "masks" in t and t["masks"] is not None else None,
                    "scale_px_per_m": t["scale_px_per_m"].cpu(),
                    "has_scale": t["has_scale"].cpu(),
                    "sample_meta": t.get("sample_meta", {}),
                })

            cached_batches.append({
                "pred_logits": pred_logits,
                "probs": probs,
                "pred_boxes": pred_boxes,
                "pred_masks": pred_masks,
                "pred_scale": pred_scale,
                "targets": cpu_targets,
            })
    print(f"Inference cached across {len(cached_batches)} batches ({time.time() - t0:.1f}s).", flush=True)
    return cached_batches


def evaluate_at_conf(cached_batches, conf_thresh, iou_thresh=0.50):
    """Evaluate cached model predictions at a specific confidence threshold."""
    total_queries = 0
    num_fg_predictions = 0
    num_bg_rejected = 0

    det_tp = 0
    det_fp = 0
    det_fn = 0
    sem_tp = 0
    sem_fp = 0
    sem_fn = 0

    # Per-class tracking
    class_stats = {c: {"tp": 0, "fp": 0, "fn": 0, "support": 0} for c in ROOM_CLASSES}

    # Size-based tracking
    size_stats = {
        "Small (<6m²)": {"tp": 0, "fn": 0, "support": 0},
        "Medium (6-18m²)": {"tp": 0, "fn": 0, "support": 0},
        "Large (>18m²)": {"tp": 0, "fn": 0, "support": 0},
    }

    # Predicted class distribution across all queries
    pred_class_counts = {c: 0 for c in ROOM_CLASSES}
    pred_class_counts["Background"] = 0

    for batch in cached_batches:
        probs = batch["probs"]
        pred_boxes = batch["pred_boxes"]
        targets = batch["targets"]
        bs = probs.size(0)

        for b in range(bs):
            top_scores_all, top_classes_all = probs[b].max(dim=-1)
            num_q = len(top_classes_all)
            total_queries += num_q

            for q in range(num_q):
                cls_id = top_classes_all[q].item()
                if cls_id == NO_ROOM_ID:
                    pred_class_counts["Background"] += 1
                elif cls_id < len(ROOM_CLASSES):
                    pred_class_counts[ROOM_CLASSES[cls_id]] += 1

            meta = targets[b].get("sample_meta", {})
            gt_rooms = meta.get("rooms", [])
            tgt_labels = targets[b]["labels"]
            tgt_boxes = targets[b]["boxes"]
            num_gt = len(tgt_labels)

            # Record GT supports
            for g_idx in range(num_gt):
                c_id = tgt_labels[g_idx].item()
                if c_id < len(ROOM_CLASSES):
                    class_stats[ROOM_CLASSES[c_id]]["support"] += 1
                if g_idx < len(gt_rooms):
                    r = gt_rooms[g_idx]
                    area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                    if area < 6.0:
                        size_stats["Small (<6m²)"]["support"] += 1
                    elif area <= 18.0:
                        size_stats["Medium (6-18m²)"]["support"] += 1
                    else:
                        size_stats["Large (>18m²)"]["support"] += 1

            # Filter foreground queries above confidence threshold
            keep = (top_classes_all != NO_ROOM_ID) & (top_scores_all >= conf_thresh)
            keep_indices = torch.where(keep)[0]

            num_fg = len(keep_indices)
            num_fg_predictions += num_fg
            num_bg_rejected += (num_q - num_fg)

            if num_fg == 0:
                det_fn += num_gt
                sem_fn += num_gt
                for g_idx in range(num_gt):
                    c_id = tgt_labels[g_idx].item()
                    if c_id < len(ROOM_CLASSES):
                        class_stats[ROOM_CLASSES[c_id]]["fn"] += 1
                    if g_idx < len(gt_rooms):
                        r = gt_rooms[g_idx]
                        area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                        if area < 6.0:
                            size_stats["Small (<6m²)"]["fn"] += 1
                        elif area <= 18.0:
                            size_stats["Medium (6-18m²)"]["fn"] += 1
                        else:
                            size_stats["Large (>18m²)"]["fn"] += 1
                continue

            p_boxes = pred_boxes[b, keep_indices]
            p_classes = top_classes_all[keep_indices]
            p_scores = top_scores_all[keep_indices]

            # Sort descending by score
            order = p_scores.argsort(descending=True)
            p_boxes = p_boxes[order]
            p_classes = p_classes[order]
            p_scores = p_scores[order]

            if num_gt == 0:
                det_fp += num_fg
                sem_fp += num_fg
                for p_idx in range(num_fg):
                    p_cls = p_classes[p_idx].item()
                    if p_cls < len(ROOM_CLASSES):
                        class_stats[ROOM_CLASSES[p_cls]]["fp"] += 1
                continue

            p_xyxy = box_cxcywh_to_xyxy(p_boxes)
            t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
            b_ious, _ = box_iou(p_xyxy, t_xyxy)

            matched_det_gt = set()
            matched_sem_gt = set()

            for p_idx in range(num_fg):
                best_iou, best_gt = b_ious[p_idx].max(dim=-1)
                biou = best_iou.item()
                bgt = best_gt.item()
                p_cls = p_classes[p_idx].item()
                t_cls = tgt_labels[bgt].item()
                p_cname = ROOM_CLASSES[p_cls] if p_cls < len(ROOM_CLASSES) else "Unknown"

                # Class-agnostic detection
                if biou >= iou_thresh and bgt not in matched_det_gt:
                    det_tp += 1
                    matched_det_gt.add(bgt)
                else:
                    det_fp += 1

                # Semantic detection
                if biou >= iou_thresh and bgt not in matched_sem_gt:
                    if p_cls == t_cls:
                        sem_tp += 1
                        matched_sem_gt.add(bgt)
                        if p_cname in class_stats:
                            class_stats[p_cname]["tp"] += 1
                        if bgt < len(gt_rooms):
                            r = gt_rooms[bgt]
                            area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                            if area < 6.0:
                                size_stats["Small (<6m²)"]["tp"] += 1
                            elif area <= 18.0:
                                size_stats["Medium (6-18m²)"]["tp"] += 1
                            else:
                                size_stats["Large (>18m²)"]["tp"] += 1
                    else:
                        sem_fp += 1
                        if p_cname in class_stats:
                            class_stats[p_cname]["fp"] += 1
                else:
                    sem_fp += 1
                    if p_cname in class_stats:
                        class_stats[p_cname]["fp"] += 1

            det_fn += (num_gt - len(matched_det_gt))
            sem_fn += (num_gt - len(matched_sem_gt))

            for g_idx in range(num_gt):
                if g_idx not in matched_sem_gt:
                    t_cls = tgt_labels[g_idx].item()
                    t_cname = ROOM_CLASSES[t_cls] if t_cls < len(ROOM_CLASSES) else "Unknown"
                    if t_cname in class_stats:
                        class_stats[t_cname]["fn"] += 1
                    if g_idx < len(gt_rooms):
                        r = gt_rooms[g_idx]
                        area = r.get("area_m2", r.get("dimensions", {}).get("area_m2", 10.0))
                        if area < 6.0:
                            size_stats["Small (<6m²)"]["fn"] += 1
                        elif area <= 18.0:
                            size_stats["Medium (6-18m²)"]["fn"] += 1
                        else:
                            size_stats["Large (>18m²)"]["fn"] += 1

    # Precision, Recall, F1 calculations
    det_p = det_tp / max(1, det_tp + det_fp)
    det_r = det_tp / max(1, det_tp + det_fn)
    det_f1 = 2 * det_p * det_r / max(1e-6, det_p + det_r)

    sem_p = sem_tp / max(1, sem_tp + sem_fp)
    sem_r = sem_tp / max(1, sem_tp + sem_fn)
    sem_f1 = 2 * sem_p * sem_r / max(1e-6, sem_p + sem_r)

    small_supp = size_stats["Small (<6m²)"]["support"]
    small_tp = size_stats["Small (<6m²)"]["tp"]
    small_recall = small_tp / max(1, small_supp)

    med_supp = size_stats["Medium (6-18m²)"]["support"]
    med_tp = size_stats["Medium (6-18m²)"]["tp"]
    med_recall = med_tp / max(1, med_supp)

    large_supp = size_stats["Large (>18m²)"]["support"]
    large_tp = size_stats["Large (>18m²)"]["tp"]
    large_recall = large_tp / max(1, large_supp)

    # Per-class metrics
    per_class_res = {}
    for cname, st in class_stats.items():
        tp, fp, fn = st["tp"], st["fp"], st["fn"]
        p = tp / max(1, tp + fp)
        r = tp / max(1, tp + fn)
        f1 = 2 * p * r / max(1e-6, p + r)
        per_class_res[cname] = {
            "tp": tp, "fp": fp, "fn": fn, "support": st["support"],
            "precision": round(p, 4), "recall": round(r, 4), "f1": round(f1, 4),
        }

    return {
        "conf_thresh": conf_thresh,
        "iou_thresh": iou_thresh,
        "total_queries": total_queries,
        "num_fg_predictions": num_fg_predictions,
        "num_bg_rejected": num_bg_rejected,
        "det_precision": round(det_p, 4),
        "det_recall": round(det_r, 4),
        "det_f1": round(det_f1, 4),
        "det_tp": det_tp, "det_fp": det_fp, "det_fn": det_fn,
        "sem_precision": round(sem_p, 4),
        "sem_recall": round(sem_r, 4),
        "sem_f1": round(sem_f1, 4),
        "sem_tp": sem_tp, "sem_fp": sem_fp, "sem_fn": sem_fn,
        "small_room_tp": small_tp,
        "small_room_support": small_supp,
        "small_room_recall": round(small_recall, 4),
        "medium_room_tp": med_tp,
        "medium_room_support": med_supp,
        "medium_room_recall": round(med_recall, 4),
        "large_room_tp": large_tp,
        "large_room_support": large_supp,
        "large_room_recall": round(large_recall, 4),
        "per_class": per_class_res,
        "pred_class_distribution": pred_class_counts,
    }


def main():
    os.environ["OMP_NUM_THREADS"] = "8"
    torch.set_num_threads(8)
    device = torch.device("cpu")

    print("=" * 80)
    print("CONFIDENCE-THRESHOLD SWEEP: F2-A BASELINE VS. G3-A CALIBRATED")
    print("Device: CPU | Threads: 8 | Layouts: 75 unseen test (225 images, 5,625 queries)")
    print("=" * 80)

    # 1. Dataset setup
    te_lids, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)
    ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=384, mask_size=(96, 96))
    ds.samples = test_samples
    items = [{**ds[i], "sample_meta": test_samples[i]} for i in range(len(ds))]
    test_loader = DataLoader(InMemoryDataset(items), batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

    thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50]

    # 2. Run inference cache for F2-A
    f2a_ckpt_path = Path("checkpoints/multitask/experiment_f2a_best.pt")
    print(f"\n[1/2] Loading F2-A baseline checkpoint: {f2a_ckpt_path}...", flush=True)
    m_f2a = MultiTaskViT384FPN(img_size=384).to(device)
    m_f2a.load_state_dict(torch.load(f2a_ckpt_path, map_location=device), strict=False)
    f2a_cached = run_model_inference_cache(m_f2a, test_loader, device)

    # 3. Run inference cache for G3-A
    g3a_ckpt_path = Path("checkpoints/multitask/experiment_g3a_best.pt")
    print(f"\n[2/2] Loading G3-A calibrated checkpoint: {g3a_ckpt_path}...", flush=True)
    m_g3a = MultiTaskViT384FPN(img_size=384).to(device)
    m_g3a.load_state_dict(torch.load(g3a_ckpt_path, map_location=device), strict=False)
    g3a_cached = run_model_inference_cache(m_g3a, test_loader, device)

    # 4. Sweep thresholds for both models at IoU >= 0.50 and IoU >= 0.25
    results = {
        "thresholds": thresholds,
        "f2a": {"iou_50": {}, "iou_25": {}},
        "g3a": {"iou_50": {}, "iou_25": {}},
    }

    print("\nEvaluating F2-A across confidence thresholds...", flush=True)
    for c_th in thresholds:
        res_50 = evaluate_at_conf(f2a_cached, conf_thresh=c_th, iou_thresh=0.50)
        res_25 = evaluate_at_conf(f2a_cached, conf_thresh=c_th, iou_thresh=0.25)
        results["f2a"]["iou_50"][str(c_th)] = res_50
        results["f2a"]["iou_25"][str(c_th)] = res_25

    print("Evaluating G3-A across confidence thresholds...", flush=True)
    for c_th in thresholds:
        res_50 = evaluate_at_conf(g3a_cached, conf_thresh=c_th, iou_thresh=0.50)
        res_25 = evaluate_at_conf(g3a_cached, conf_thresh=c_th, iou_thresh=0.25)
        results["g3a"]["iou_50"][str(c_th)] = res_50
        results["g3a"]["iou_25"][str(c_th)] = res_25

    # 5. Save JSON
    out_file = Path("evaluation_results/confidence_sweep_comparison.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved full sweep results to {out_file}.")

    # 6. Print Comparison Tables
    for iou_tag, iou_key in [("IoU >= 0.50", "iou_50"), ("IoU >= 0.25", "iou_25")]:
        print("\n" + "=" * 95)
        print(f"DETECTION & SEMANTIC PERFORMANCE COMPARISON ({iou_tag})")
        print("=" * 95)
        header = (f"{'Conf':<6} | {'Model':<5} | {'FG Preds':<8} | {'BG Rej':<7} | "
                  f"{'Det Prec':<8} | {'Det Rec':<8} | {'Det F1':<8} | "
                  f"{'Sem Prec':<8} | {'Sem Rec':<8} | {'Sem F1':<8} | {'Small Rec'}")
        print(header)
        print("-" * 95)

        for c_th in thresholds:
            k = str(c_th)
            f_res = results["f2a"][iou_key][k]
            g_res = results["g3a"][iou_key][k]

            print(f"{c_th:<6.2f} | F2-A  | {f_res['num_fg_predictions']:<8d} | {f_res['num_bg_rejected']:<7d} | "
                  f"{f_res['det_precision']:<8.4f} | {f_res['det_recall']:<8.4f} | {f_res['det_f1']:<8.4f} | "
                  f"{f_res['sem_precision']:<8.4f} | {f_res['sem_recall']:<8.4f} | {f_res['sem_f1']:<8.4f} | "
                  f"{f_res['small_room_recall']:<8.4f}")

            print(f"{'':<6} | G3-A  | {g_res['num_fg_predictions']:<8d} | {g_res['num_bg_rejected']:<7d} | "
                  f"{g_res['det_precision']:<8.4f} | {g_res['det_recall']:<8.4f} | {g_res['det_f1']:<8.4f} | "
                  f"{g_res['sem_precision']:<8.4f} | {g_res['sem_recall']:<8.4f} | {g_res['sem_f1']:<8.4f} | "
                  f"{g_res['small_room_recall']:<8.4f}")
            print("-" * 95)

    # 7. Print Key Class Comparison at representative thresholds (0.10, 0.20, 0.25)
    print("\n" + "=" * 95)
    print("KEY CLASS FAILURE MODES: F2-A vs G3-A (IoU >= 0.50)")
    print("=" * 95)
    for c_th in [0.10, 0.20, 0.25]:
        k = str(c_th)
        f_pc = results["f2a"]["iou_50"][k]["per_class"]
        g_pc = results["g3a"]["iou_50"][k]["per_class"]
        print(f"\n--- Confidence >= {c_th:.2f} ---")
        print(f"{'Class':<18} | {'F2-A TP':<8} | {'G3-A TP':<8} | {'F2-A FP':<8} | {'G3-A FP':<8} | {'F2-A F1':<8} | {'G3-A F1'}")
        print("-" * 75)
        for cname in ["Bedroom", "Living Room", "Master Bedroom", "Kitchen", "Toilet", "Bathroom", "Corridor", "Entrance/Foyer", "Walk-in Closet"]:
            f_tp, f_fp, f_f1 = f_pc[cname]["tp"], f_pc[cname]["fp"], f_pc[cname]["f1"]
            g_tp, g_fp, g_f1 = g_pc[cname]["tp"], g_pc[cname]["fp"], g_pc[cname]["f1"]
            print(f"{cname:<18} | {f_tp:<8d} | {g_tp:<8d} | {f_fp:<8d} | {g_fp:<8d} | {f_f1:<8.4f} | {g_f1:<8.4f}")


if __name__ == "__main__":
    main()
