import argparse
import json
import math
from pathlib import Path
from PIL import Image
import numpy as np
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

from floorplan_dataset import FloorplanDataset, collate_fn, NUM_ROOM_CLASSES, ID2LABEL
from multitask_vit import MultiTaskViT, visualize_prediction
from vit_detector import box_cxcywh_to_xyxy, box_iou, generalized_box_iou
from scale_calibration import ScaleCalibrator


GROUND_TRUTH_PRINTED_ROOMS = [
    {"name": "DRAWING ROOM", "printed_ft": "10'11\" x 12'11\"", "printed_w_m": 3.33, "printed_l_m": 3.94, "category": "living"},
    {"name": "DINING ROOM", "printed_ft": "10'0\" x 11'6\"", "printed_w_m": 3.05, "printed_l_m": 3.51, "category": "dining"},
    {"name": "KITCHEN", "printed_ft": "7'3\" x 10'0\"", "printed_w_m": 2.21, "printed_l_m": 3.05, "category": "kitchen"},
    {"name": "BEDROOM 1 (MASTER)", "printed_ft": "11'0\" x 14'0\"", "printed_w_m": 3.35, "printed_l_m": 4.27, "category": "master"},
    {"name": "BEDROOM 2", "printed_ft": "10'0\" x 12'0\"", "printed_w_m": 3.05, "printed_l_m": 3.66, "category": "bedroom"},
    {"name": "TOILET 1", "printed_ft": "4'6\" x 7'0\"", "printed_w_m": 1.37, "printed_l_m": 2.13, "category": "toilet"},
    {"name": "TOILET 2", "printed_ft": "4'6\" x 7'0\"", "printed_w_m": 1.37, "printed_l_m": 2.13, "category": "toilet"},
    {"name": "BALCONY", "printed_ft": "5'0\" x 10'0\"", "printed_w_m": 1.52, "printed_l_m": 3.05, "category": "balcony"},
]

GROUND_TRUTH_REAL_SCALE = 100.0  # px/meter on 1527x1030 resolution


def match_pred_to_gt(gt_category, preds, used_indices):
    for i, p in enumerate(preds):
        if i in used_indices:
            continue
        pt = p["type"].lower()
        matched = False
        if gt_category == "living" and any(k in pt for k in ["living", "drawing"]):
            matched = True
        elif gt_category == "dining" and "dining" in pt:
            matched = True
        elif gt_category == "kitchen" and "kitchen" in pt:
            matched = True
        elif gt_category == "master" and ("master" in pt or "bedroom" in pt):
            matched = True
        elif gt_category == "bedroom" and "bedroom" in pt:
            matched = True
        elif gt_category == "toilet" and ("bathroom" in pt or "toilet" in pt):
            matched = True
        elif gt_category == "balcony" and "balcony" in pt:
            matched = True

        if matched:
            used_indices.add(i)
            return p, i
    return None, None


def evaluate_on_real_floorplan(model, image_path, use_segmentation=True, calibrate_ocr=True, conf=0.20):
    res = model.predict_unseen_plan(
        image_path,
        conf_threshold=conf,
        use_segmentation=use_segmentation,
        calibrate_ocr=calibrate_ocr,
        device="cpu"
    )

    pred_scale = res["estimated_scale_px_per_m"]
    scale_err_pct = abs(pred_scale - GROUND_TRUTH_REAL_SCALE) / GROUND_TRUTH_REAL_SCALE * 100.0

    used_idx = set()
    dim_errors = []
    toilet_errors = []
    room_comparisons = []

    for gt in GROUND_TRUTH_PRINTED_ROOMS:
        match, _ = match_pred_to_gt(gt["category"], res["rooms"], used_idx)
        gt_w, gt_l = gt["printed_w_m"], gt["printed_l_m"]

        if match is not None:
            pw, pl = match["width_m"], match["length_m"]
            err1 = (abs(pw - gt_w) + abs(pl - gt_l)) / 2.0
            err2 = (abs(pl - gt_w) + abs(pw - gt_l)) / 2.0
            mae = min(err1, err2)

            err_pct1 = (abs(pw - gt_w) / gt_w + abs(pl - gt_l) / gt_l) / 2.0 * 100.0
            err_pct2 = (abs(pl - gt_w) / gt_w + abs(pw - gt_l) / gt_l) / 2.0 * 100.0
            pct_err = min(err_pct1, err_pct2)

            dim_errors.append(mae)
            if gt["category"] == "toilet":
                toilet_errors.append(pct_err)

            room_comparisons.append({
                "name": gt["name"],
                "printed": f"{gt_w:.2f}x{gt_l:.2f}m",
                "pred": f"{pw:.2f}x{pl:.2f}m",
                "mae_m": round(mae, 2),
                "err_pct": round(pct_err, 1),
                "geom_source": match.get("geometry_source", "bbox"),
            })
        else:
            room_comparisons.append({
                "name": gt["name"],
                "printed": f"{gt_w:.2f}x{gt_l:.2f}m",
                "pred": "Not Detected",
                "mae_m": None,
                "err_pct": None,
                "geom_source": None,
            })

    mean_dim_mae = float(np.mean(dim_errors)) if dim_errors else 0.0
    mean_toilet_err = float(np.mean(toilet_errors)) if toilet_errors else 0.0

    return {
        "pred_scale": pred_scale,
        "scale_err_pct": round(scale_err_pct, 1),
        "scale_source": res.get("scale_source", "unknown"),
        "detected_count": res["room_count"],
        "mean_dim_mae": round(mean_dim_mae, 2),
        "mean_toilet_err_pct": round(mean_toilet_err, 1),
        "comparisons": room_comparisons,
        "full_result": res,
    }


def evaluate_on_synthetic_test(model, test_ds, device="cpu", conf_thresh=0.25, max_eval=30):
    loader = DataLoader(test_ds, batch_size=4, shuffle=False, collate_fn=collate_fn)
    model.eval()

    total_tp = 0
    total_fp = 0
    total_fn = 0
    ious = []
    scale_errors = []

    count = 0
    for images, targets in loader:
        images = images.to(device)
        with torch.no_grad():
            outputs = model(images)
            pred_logits = outputs["pred_logits"]
            pred_boxes = outputs["pred_boxes"]
            pred_scales = outputs["pred_scale"]
            probs = pred_logits.softmax(-1)

        bs = images.size(0)
        for b in range(bs):
            tgt_boxes = targets[b]["boxes"].to(device)
            tgt_labels = targets[b]["labels"].to(device)
            has_scale = targets[b]["has_scale"].item() > 0
            gt_scale = targets[b]["scale_px_per_m"].item()

            if has_scale and gt_scale > 0:
                p_scale = pred_scales[b].item()
                scale_errors.append(abs(p_scale - gt_scale) / gt_scale * 100.0)

            scores, p_labels = probs[b, :, :NUM_ROOM_CLASSES].max(dim=-1)
            keep = scores >= conf_thresh
            p_boxes = pred_boxes[b, keep]
            p_labels = p_labels[keep]

            num_gt = len(tgt_labels)
            num_pred = len(p_labels)

            if num_gt == 0:
                total_fp += num_pred
                continue
            if num_pred == 0:
                total_fn += num_gt
                continue

            p_xyxy = box_cxcywh_to_xyxy(p_boxes)
            t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
            box_ious, _ = box_iou(p_xyxy, t_xyxy)

            matched_gt = set()
            for p_idx in range(num_pred):
                best_iou, best_gt = box_ious[p_idx].max(dim=-1)
                biou = best_iou.item()
                bgt = best_gt.item()
                ious.append(biou)

                if biou >= 0.5 and bgt not in matched_gt:
                    matched_gt.add(bgt)
                    if p_labels[p_idx] == tgt_labels[bgt]:
                        total_tp += 1
                    else:
                        total_fp += 1
                else:
                    total_fp += 1

            total_fn += (num_gt - len(matched_gt))

        count += bs
        if count >= max_eval:
            break

    prec = total_tp / max(1, total_tp + total_fp)
    rec = total_tp / max(1, total_tp + total_fn)
    f1 = 2 * prec * rec / max(1e-6, prec + rec)
    mean_iou = float(np.mean(ious)) if ious else 0.0
    mean_scale_err = float(np.mean(scale_errors)) if scale_errors else 0.0

    return {
        "f1": round(f1, 4),
        "mean_iou": round(mean_iou, 4),
        "scale_err_pct": round(mean_scale_err, 1),
    }


def main():
    print("=" * 80)
    print("CONTROLLED EXPERIMENTS BENCHMARK")
    print("Comparing: Baseline (224) vs Exp B (+384) vs Exp C (+Segmentation & Calibration)")
    print("=" * 80)

    # 1. Baseline: ViT-224 + bbox + raw scale
    print("\n[1/3] Loading Baseline: ViT-224 + BBox + Raw Scale...")
    m_base = MultiTaskViT(img_size=224)
    ckpt_base = Path("checkpoints/multitask/multitask_vit_best.pt")
    if ckpt_base.exists():
        m_base.load_state_dict(torch.load(ckpt_base, map_location="cpu"), strict=False)
    m_base.eval()

    real_base = evaluate_on_real_floorplan(
        m_base, "6th floor layout.jpeg", use_segmentation=False, calibrate_ocr=False
    )

    # 2. Experiment B: ViT-384 + bbox + scale
    print("\n[2/3] Loading Experiment B: ViT-384 + BBox + Scale...")
    m_384 = MultiTaskViT(pretrained_model_name="google/vit-base-patch16-384", img_size=384)
    ckpt_384 = Path("checkpoints/multitask/multitask_vit_384_best.pt")
    if ckpt_384.exists():
        m_384.load_state_dict(torch.load(ckpt_384, map_location="cpu"), strict=False)
    else:
        # Transfer from 224
        m_384.load_state_dict(torch.load(ckpt_base, map_location="cpu"), strict=False)
    m_384.eval()

    real_exp_b = evaluate_on_real_floorplan(
        m_384, "6th floor layout.jpeg", use_segmentation=False, calibrate_ocr=False
    )

    # 3. Experiment C: ViT-384 + bbox + segmentation + calibrated scale
    print("\n[3/3] Evaluating Experiment C: ViT-384 + Segmentation + Calibrated Scale...")
    real_exp_c = evaluate_on_real_floorplan(
        m_384, "6th floor layout.jpeg", use_segmentation=True, calibrate_ocr=True
    )

    # Save visual prediction of Experiment C
    vis_c_path = Path("evaluation_results/exp_c_segmentation_overlay.png")
    visualize_prediction("6th floor layout.jpeg", real_exp_c["full_result"], vis_c_path)
    print(f"Saved Experiment C visual overlay with room polygons to: {vis_c_path}")

    # Evaluate on held-out synthetic test set
    print("\nEvaluating all 3 on held-out synthetic test split...")
    test_ds_224 = FloorplanDataset("HomeVerse-Dataset", split="test", img_size=224, max_samples=40)
    test_ds_384 = FloorplanDataset("HomeVerse-Dataset", split="test", img_size=384, max_samples=40)

    synth_base = evaluate_on_synthetic_test(m_base, test_ds_224, max_eval=40)
    synth_exp_b = evaluate_on_synthetic_test(m_384, test_ds_384, max_eval=40)
    synth_exp_c = evaluate_on_synthetic_test(m_384, test_ds_384, max_eval=40)

    # Print Summary Table
    print("\n" + "=" * 80)
    print("RESULTS COMPARISON TABLE")
    print("=" * 80)
    header = f"{'Metric':<28} | {'Current (224)':<14} | {'+384 (Exp B)':<14} | {'+Segmentation (Exp C)':<20}"
    print(header)
    print("-" * 80)
    print(f"{'Room F1 (Synthetic Test)':<28} | {synth_base['f1']:<14.4f} | {synth_exp_b['f1']:<14.4f} | {synth_exp_c['f1']:<20.4f}")
    print(f"{'BBox IoU (Synthetic Test)':<28} | {synth_base['mean_iou']:<14.4f} | {synth_exp_b['mean_iou']:<14.4f} | {synth_exp_c['mean_iou']:<20.4f}")
    print(f"{'Scale Error (Real Plan)':<28} | {real_base['scale_err_pct']:<13.1f}% | {real_exp_b['scale_err_pct']:<13.1f}% | {real_exp_c['scale_err_pct']:<19.1f}%")
    print(f"{'Dimension MAE (Meters)':<28} | {real_base['mean_dim_mae']:<14.2f} | {real_exp_b['mean_dim_mae']:<14.2f} | {real_exp_c['mean_dim_mae']:<20.2f}")
    print(f"{'Small-Room Error (Toilets)':<28} | {real_base['mean_toilet_err_pct']:<13.1f}% | {real_exp_b['mean_toilet_err_pct']:<13.1f}% | {real_exp_c['mean_toilet_err_pct']:<19.1f}%")
    print("=" * 80)

    # Detailed Real Plan Room Dimensions
    print("\nDETAILED ROOM COMPARISONS ON 6th floor layout.jpeg:")
    print("-" * 85)
    print(f"{'Room Name':<20} | {'Printed':<12} | {'Current (224)':<15} | {'Exp C (+Seg)':<15} | {'Err Red.'}")
    print("-" * 85)
    for r_base, r_c in zip(real_base["comparisons"], real_exp_c["comparisons"]):
        name = r_base["name"]
        printed = r_base["printed"]
        pred_base = r_base["pred"]
        pred_c = r_c["pred"]
        err_b = f"{r_base['err_pct']:.1f}%" if r_base['err_pct'] is not None else "N/A"
        err_c = f"{r_c['err_pct']:.1f}%" if r_c['err_pct'] is not None else "N/A"
        print(f"{name:<20} | {printed:<12} | {pred_base:<15} ({err_b}) | {pred_c:<15} ({err_c})")
    print("-" * 85)

    # Save benchmark JSON
    benchmark_data = {
        "summary": {
            "current_224": {
                "f1": synth_base["f1"],
                "bbox_iou": synth_base["mean_iou"],
                "scale_err_pct": real_base["scale_err_pct"],
                "dim_mae_m": real_base["mean_dim_mae"],
                "toilet_err_pct": real_base["mean_toilet_err_pct"],
            },
            "exp_b_384": {
                "f1": synth_exp_b["f1"],
                "bbox_iou": synth_exp_b["mean_iou"],
                "scale_err_pct": real_exp_b["scale_err_pct"],
                "dim_mae_m": real_exp_b["mean_dim_mae"],
                "toilet_err_pct": real_exp_b["mean_toilet_err_pct"],
            },
            "exp_c_384_seg_calib": {
                "f1": synth_exp_c["f1"],
                "bbox_iou": synth_exp_c["mean_iou"],
                "scale_err_pct": real_exp_c["scale_err_pct"],
                "dim_mae_m": real_exp_c["mean_dim_mae"],
                "toilet_err_pct": real_exp_c["mean_toilet_err_pct"],
            },
        },
        "real_base": real_base,
        "real_exp_c": real_exp_c,
    }
    with open("evaluation_results/experiment_benchmark_results.json", "w", encoding="utf-8") as f:
        json.dump(benchmark_data, f, indent=2)
    print("Saved benchmark JSON to: evaluation_results/experiment_benchmark_results.json")


if __name__ == "__main__":
    main()
