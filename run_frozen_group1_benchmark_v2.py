"""
Frozen Group 1 Recalibration Benchmark Runner (Version 2)
=========================================================
HomeVerse Project - Milestone G5-OCR-v2 Corrective Experiment

Evaluates the G5-OCR-v2 corrective spatial matcher under the locked frozen protocol:
  - Exact same 79 Group 1 Dimensioned images and 772 GT rooms.
  - Frozen Multi-Task ViT (experiment_g4b_best.pt), CAD vectorizer, and OCR engine.
  - Active Safeguards:
      1. Rejection of dummy full-image bounding boxes ([W/2, H/2]).
      2. Alternative candidate margin evaluation (Delta_margin = min_{k != j} C_ik - C_ij).
      3. Query confidence filtering (tau_conf >= 0.25) to eliminate ghost queries.
      4. Vertical dimension transposition support.
"""

import argparse
import json
import math
import sys
import time
from pathlib import Path
from typing import List, Dict, Tuple, Any, Optional

import cv2
import numpy as np
import torch
from PIL import Image
from torch.utils.data import DataLoader

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

repo_root = Path(__file__).resolve().parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from floorplan_dataset import (
    FloorplanDataset,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    LABEL2ID,
)
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta
from run_experiment_g4b import (
    MultiTaskViT384G4B,
    rasterize_canonical_instance_masks,
)
from run_experiment_g4a import CHILD_TO_PARENT
from cad_vectorizer import (
    extract_unrefined_polygon,
    adaptive_polygon_simplification,
    snap_shared_boundaries,
)
from vit_detector import HungarianMatcher
from metric_calibrator import MetricScaleCalibrator
from metric_geometry import (
    calculate_shoelace_area_px,
    calculate_mabr_dimensions,
    calculate_wall_segments,
)
from ocr_spatial_matcher_v2 import OCRSpatialMatcherV2
from ocr_spatial_matcher import parse_dimension_annotation


def compute_stats(vals: List[float], multiplier: float = 1.0) -> Dict[str, float]:
    """Computes median, mean, p90, and p95 for a list of values."""
    if not vals:
        return {"median": 0.0, "mean": 0.0, "p90": 0.0, "p95": 0.0, "count": 0}
    sorted_v = sorted(vals)
    n = len(sorted_v)
    med = float(np.median(sorted_v)) * multiplier
    mean = float(np.mean(sorted_v)) * multiplier
    p90 = float(np.percentile(sorted_v, 90)) * multiplier
    p95 = float(np.percentile(sorted_v, 95)) * multiplier
    return {
        "median": round(med, 3),
        "mean": round(mean, 3),
        "p90": round(p90, 3),
        "p95": round(p95, 3),
        "count": n,
    }


def run_benchmark_v2(
    img_size: int = 384,
    conf_thresh: float = 0.25,
    max_images: Optional[int] = None,
    output_path: Optional[Path] = None,
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 85)
    print("FROZEN GROUP 1 RECALIBRATION BENCHMARK (G5-OCR-v2)")
    print("=" * 85)
    print(f"Device: {device} | Query Confidence Threshold: {conf_thresh:.2f}")
    print("Checkpoint: checkpoints/multitask/experiment_g4b_best.pt (FROZEN)")
    print("Target Population: Exactly 79 Group 1 Dimensioned Plans (772 GT Rooms)\n")

    json_path = repo_root / "HomeVerse-Dataset/annotations/test.json"
    te_lids, test_samples, _ = select_balanced_split(str(json_path), 75)

    g1_samples = [s for s in test_samples if s.get("scale_mode") == "dimensioned"]
    if max_images is not None and max_images > 0:
        g1_samples = g1_samples[:max_images]

    print(f"Loaded {len(g1_samples)} Group 1 Dimensioned test images across {len(set(s['layout_id'] for s in g1_samples))} layouts.")

    ds = FloorplanDataset(str(repo_root / "HomeVerse-Dataset"), split="train", img_size=img_size, mask_size=(96, 96))
    ds.samples = g1_samples
    items = []
    for i in range(len(ds)):
        item = ds[i]
        item["sample_meta"] = g1_samples[i]
        valid_rooms = [r for r in g1_samples[i]["rooms"] if r.get("type") in LABEL2ID]
        item["masks"] = rasterize_canonical_instance_masks(valid_rooms, mask_size=(96, 96))
        items.append(item)

    test_ds = InMemoryDataset(items)
    test_loader = DataLoader(test_ds, batch_size=1, shuffle=False, collate_fn=collate_fn_with_meta)

    # Load frozen model and matchers
    g4b_ckpt_path = repo_root / "checkpoints/multitask/experiment_g4b_best.pt"
    model = MultiTaskViT384G4B(img_size=img_size).to(device)
    model.load_state_dict(torch.load(g4b_ckpt_path, map_location=device), strict=False)
    model.eval()

    hungarian_matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    baseline_calibrator = MetricScaleCalibrator()
    matcher_v2 = OCRSpatialMatcherV2(
        max_cost_threshold=0.65,
        min_margin_threshold=0.08,
        min_plausible_ppm=15.0,
        max_plausible_ppm=250.0,
        min_query_conf=conf_thresh,
    )

    total_gt_rooms_count = 0
    total_ocr_detected = 0
    total_unlocalized_rejected = 0
    total_filtered_queries = 0

    accepted_assignments_count = 0
    correct_accepted_assignments_count = 0
    ambiguous_annotations_count = 0
    rejected_annotations_count = 0

    baseline_scale_errors = []
    baseline_signed_scale_errors = []
    v2_scale_errors = []
    v2_signed_scale_errors = []

    baseline_room_area_errors = []
    v2_room_area_errors = []

    strata_orientation = {"horizontal": [], "vertical": [], "oblique": []}
    strata_category = {}

    per_image_records = []
    t0 = time.time()

    print("Executing G5-OCR-v2 evaluation across test images...", flush=True)

    with torch.no_grad():
        for b_idx, (images, targets) in enumerate(test_loader):
            images = images.to(device)
            outputs = model(images)

            pred_logits = outputs["pred_logits"]
            pred_boxes_1 = outputs["pred_boxes_1"]
            pred_masks_prob = outputs["pred_masks_prob"]

            indices = hungarian_matcher(pred_logits, pred_boxes_1, targets)

            meta = targets[0].get("sample_meta", {})
            img_id = meta.get("image_id", f"img_{b_idx}")
            layout_id = meta.get("layout_id", f"layout_{b_idx}")
            img_path = repo_root / "HomeVerse-Dataset" / meta.get("image_path", "")

            native_w, native_h = 1024, 1024
            if img_path.exists():
                try:
                    with Image.open(img_path) as im:
                        native_w, native_h = im.size
                except Exception:
                    pass

            gt_ppm = meta.get("pixels_per_meter")
            raw_gt_ppm = meta.get("raw_pixels_per_meter", 68.0)
            effective_gt_ppm = gt_ppm if gt_ppm is not None else raw_gt_ppm
            gt_scale_s = 1.0 / max(1e-4, effective_gt_ppm)

            gt_rooms = meta.get("rooms", [])
            valid_gt_rooms = [r for r in gt_rooms if r.get("type") in LABEL2ID]
            total_gt_rooms_count += len(valid_gt_rooms)

            query_rooms_native = []
            for q_i in range(pred_masks_prob.size(1)):
                m_prob = pred_masks_prob[0, q_i].cpu().numpy()
                probs = pred_logits[0, q_i].softmax(-1)
                c_idx = probs.argmax(-1).item()
                conf_val = float(probs[c_idx].item())
                r_name = ROOM_CLASSES[c_idx] if c_idx < NUM_ROOM_CLASSES else "Room"

                raw_nat = extract_unrefined_polygon(m_prob, orig_size=(native_w, native_h), threshold=0.50)
                if raw_nat and len(raw_nat) >= 3:
                    ref_nat = adaptive_polygon_simplification(
                        raw_nat, epsilon_factor=0.012, max_eps_px=3.0, protect_non_convex=True
                    )
                    query_rooms_native.append({
                        "query_id": q_i,
                        "polygon_tier2": raw_nat,
                        "polygon_tier3": ref_nat,
                        "type": r_name,
                        "confidence": conf_val,
                    })

            if len(query_rooms_native) >= 2:
                query_rooms_native = snap_shared_boundaries(query_rooms_native, snap_tolerance_px=8.0)

            snapped_polys = {
                r["query_id"]: r["polygon_tier3"]
                for r in query_rooms_native
                if r.get("polygon_tier3") and len(r.get("polygon_tier3", [])) >= 3
            }

            detected_rooms = []
            for r in query_rooms_native:
                poly = r.get("polygon_tier3")
                if not poly or len(poly) < 3:
                    continue
                mabr_px = calculate_mabr_dimensions(poly)
                walls_px = calculate_wall_segments(poly)
                np_pts = np.array(poly)
                min_x, min_y = float(np_pts[:, 0].min()), float(np_pts[:, 1].min())
                max_x, max_y = float(np_pts[:, 0].max()), float(np_pts[:, 1].max())

                detected_rooms.append({
                    "query_id": r["query_id"],
                    "room_id": r["query_id"],
                    "type": r["type"],
                    "confidence": r["confidence"],
                    "parent_category": CHILD_TO_PARENT.get(r["type"], "Living Area"),
                    "polygon_pixels": poly,
                    "bbox_pixels": [min_x, min_y, max_x - min_x, max_y - min_y],
                    "pixel_width": mabr_px["width_px"],
                    "pixel_length": mabr_px["length_px"],
                    "mabr": mabr_px,
                    "wall_segments": walls_px,
                })

            ocr_tokens = baseline_calibrator.extract_ocr_tokens(img_path)
            total_ocr_detected += len(ocr_tokens)

            # Baseline calculation
            base_calib_res = baseline_calibrator.match_ocr_to_rooms(ocr_tokens, detected_rooms)
            base_ppm = None
            base_scale_s = None
            if base_calib_res and base_calib_res.get("scale_px_per_m"):
                base_ppm = base_calib_res["scale_px_per_m"]
                base_scale_s = 1.0 / base_ppm
                base_s_err = abs(base_ppm - effective_gt_ppm) / effective_gt_ppm * 100.0
                base_signed_s_err = (base_scale_s - gt_scale_s) / gt_scale_s * 100.0
                baseline_scale_errors.append(base_s_err)
                baseline_signed_scale_errors.append(base_signed_s_err)

            # G5-OCR-v2 matching
            v2_match_res = matcher_v2.match(
                ocr_annotations=ocr_tokens,
                detected_rooms=detected_rooms,
                image_size=(native_w, native_h),
            )

            total_unlocalized_rejected += v2_match_res.get("unlocalized_count", len(v2_match_res.get("unlocalized_annotations", [])))
            total_filtered_queries += v2_match_res.get("filtered_queries_count", 0)

            v2_ppm = v2_match_res.get("scale_px_per_m")
            v2_scale_s = v2_match_res.get("scale_m_per_px")
            v2_is_calib = v2_match_res.get("is_calibrated", False)

            if v2_is_calib and v2_ppm is not None:
                v2_s_err = abs(v2_ppm - effective_gt_ppm) / effective_gt_ppm * 100.0
                v2_signed_s_err = (v2_scale_s - gt_scale_s) / gt_scale_s * 100.0
                v2_scale_errors.append(v2_s_err)
                v2_signed_scale_errors.append(v2_signed_s_err)

            accepted_in_img = len(v2_match_res["matched_associations"])
            ambiguous_in_img = len(v2_match_res["ambiguous_annotations"])
            rejected_in_img = len(v2_match_res["rejected_annotations"])

            accepted_assignments_count += accepted_in_img
            ambiguous_annotations_count += ambiguous_in_img
            rejected_annotations_count += rejected_in_img

            s_idx, t_idx = indices[0]
            pred_to_gt = {s_idx[k].item(): t_idx[k].item() for k in range(len(t_idx))}

            for match_item in v2_match_res["matched_associations"]:
                q_id = match_item["room_id"]
                gt_idx = pred_to_gt.get(q_id)
                if gt_idx is not None and gt_idx < len(valid_gt_rooms):
                    gt_r = valid_gt_rooms[gt_idx]
                    gt_w = gt_r.get("width_m", gt_r.get("dimensions", {}).get("width_m", 3.0))
                    gt_l = gt_r.get("length_m", gt_r.get("dimensions", {}).get("length_m", 4.0))
                    gt_min, gt_max = min(gt_w, gt_l), max(gt_w, gt_l)

                    parsed = parse_dimension_annotation(match_item["annotation_text"])
                    if parsed and parsed.get("is_paired"):
                        p_min, p_max = parsed["width_m"], parsed["length_m"]
                        err_w = abs(p_min - gt_min) / max(1e-3, gt_min)
                        err_l = abs(p_max - gt_max) / max(1e-3, gt_max)
                        if err_w <= 0.15 and err_l <= 0.15:
                            correct_accepted_assignments_count += 1
                            match_item["is_gt_correct"] = True
                        else:
                            match_item["is_gt_correct"] = False
                    else:
                        if parsed:
                            d = parsed.get("dimension_m", 0)
                            if abs(d - gt_min) / max(1e-3, gt_min) <= 0.15 or abs(d - gt_max) / max(1e-3, gt_max) <= 0.15:
                                correct_accepted_assignments_count += 1
                                match_item["is_gt_correct"] = True
                            else:
                                match_item["is_gt_correct"] = False
                else:
                    match_item["is_gt_correct"] = False

            # Room area evaluation
            for k in range(len(t_idx)):
                q_i = s_idx[k].item()
                gt_r_i = t_idx[k].item()
                if gt_r_i >= len(valid_gt_rooms):
                    continue

                gt_r = valid_gt_rooms[gt_r_i]
                gt_poly_norm = gt_r.get("polygon", [])
                if len(gt_poly_norm) < 3:
                    continue

                gt_poly_px = [(float(x) * native_w, float(y) * native_h) for x, y in gt_poly_norm]
                gt_area_px = calculate_shoelace_area_px(gt_poly_px)
                gt_area_m2 = gt_area_px * (gt_scale_s ** 2)

                pred_poly_px = snapped_polys.get(q_i, [])
                if not pred_poly_px or len(pred_poly_px) < 3:
                    continue

                pred_area_px = calculate_shoelace_area_px(pred_poly_px)

                if base_scale_s is not None:
                    base_area_m2 = pred_area_px * (base_scale_s ** 2)
                    base_a_err = abs(base_area_m2 - gt_area_m2) / gt_area_m2 * 100.0
                    baseline_room_area_errors.append(base_a_err)

                if v2_scale_s is not None:
                    v2_area_m2 = pred_area_px * (v2_scale_s ** 2)
                    v2_a_err = abs(v2_area_m2 - gt_area_m2) / gt_area_m2 * 100.0
                    v2_room_area_errors.append(v2_a_err)

                    p_cat = CHILD_TO_PARENT.get(gt_r.get("type", "Room"), "Living Area")
                    strata_category[p_cat] = strata_category.get(p_cat, []) + [v2_a_err]

                    mabr = calculate_mabr_dimensions(pred_poly_px)
                    rot = abs(mabr.get("rotation_deg", 0.0)) % 90.0
                    if rot <= 10.0 or rot >= 80.0:
                        strata_orientation["horizontal"].append(v2_a_err)
                    elif 35.0 <= rot <= 55.0:
                        strata_orientation["oblique"].append(v2_a_err)
                    else:
                        strata_orientation["vertical"].append(v2_a_err)

            per_image_records.append({
                "image_id": img_id,
                "layout_id": layout_id,
                "gt_ppm": effective_gt_ppm,
                "baseline_ppm": base_ppm,
                "v2_ppm": v2_ppm,
                "v2_scale_error_pct": abs(v2_ppm - effective_gt_ppm) / effective_gt_ppm * 100.0 if v2_ppm else None,
                "accepted_count": accepted_in_img,
                "ambiguous_count": ambiguous_in_img,
                "unlocalized_rejected": v2_match_res.get("unlocalized_count", len(v2_match_res.get("unlocalized_annotations", []))),
            })

            if (b_idx + 1) % 15 == 0 or (b_idx + 1) == len(test_loader):
                print(f"Audited {b_idx + 1}/{len(test_loader)} images ({time.time() - t0:.1f}s elapsed)...", flush=True)

    # Aggregations
    precision_numerator = correct_accepted_assignments_count
    precision_denominator = max(1, accepted_assignments_count)
    precision_pct = round((precision_numerator / precision_denominator) * 100.0, 2)

    coverage_numerator = len(v2_room_area_errors)
    coverage_denominator = max(1, total_gt_rooms_count)
    coverage_pct = round((coverage_numerator / coverage_denominator) * 100.0, 2)

    total_eval = accepted_assignments_count + ambiguous_annotations_count + rejected_annotations_count
    ambiguous_rate = round((ambiguous_annotations_count / max(1, total_eval)) * 100.0, 2)

    base_s_stats = compute_stats(baseline_scale_errors)
    base_signed_s_stats = compute_stats(baseline_signed_scale_errors)
    base_a_stats = compute_stats(baseline_room_area_errors)

    v2_s_stats = compute_stats(v2_scale_errors)
    v2_signed_s_stats = compute_stats(v2_signed_scale_errors)
    v2_a_stats = compute_stats(v2_room_area_errors)

    gate1_pass = (precision_pct >= 95.0)
    gate2_pass = (coverage_pct >= 80.0)
    gate3_pass = (ambiguous_annotations_count > 0)
    gate4_pass = (v2_s_stats["median"] <= 5.0)
    gate5_pass = (v2_a_stats["median"] <= 12.0)
    all_pass = (gate1_pass and gate2_pass and gate3_pass and gate4_pass and gate5_pass)

    summary_v2 = {
        "benchmark_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_group1_images": len(g1_samples),
        "total_gt_rooms": total_gt_rooms_count,
        "gates_evaluation": {
            "all_gates_passed": all_pass,
            "gate1_precision": {
                "target": ">= 95.0%",
                "achieved": f"{precision_pct:.2f}%",
                "formula": f"Correct / Accepted = {precision_numerator} / {precision_denominator}",
                "passed": gate1_pass,
            },
            "gate2_coverage": {
                "target": ">= 80.0%",
                "achieved": f"{coverage_pct:.2f}%",
                "formula": f"Calibrated Rooms / Eligible Rooms = {coverage_numerator} / {coverage_denominator}",
                "passed": gate2_pass,
            },
            "gate3_ambiguous_handling": {
                "target": "Explicitly flagged",
                "ambiguous_count": ambiguous_annotations_count,
                "ambiguous_rate": f"{ambiguous_rate:.2f}%",
                "passed": gate3_pass,
            },
            "gate4_scale_mape": {
                "baseline": f"{base_s_stats['median']:.2f}%",
                "target": "<= 5.0%",
                "achieved": f"{v2_s_stats['median']:.2f}%",
                "passed": gate4_pass,
            },
            "gate5_room_area_mape": {
                "baseline": f"{base_a_stats['median']:.2f}%",
                "target": "<= 12.0%",
                "achieved": f"{v2_a_stats['median']:.2f}%",
                "passed": gate5_pass,
            },
        },
        "assignment_counts": {
            "total_ocr_detected": total_ocr_detected,
            "unlocalized_dummy_boxes_rejected": total_unlocalized_rejected,
            "filtered_low_conf_queries": total_filtered_queries,
            "accepted_assignments": accepted_assignments_count,
            "correct_accepted_assignments": correct_accepted_assignments_count,
            "ambiguous_assignments": ambiguous_annotations_count,
            "rejected_assignments": rejected_annotations_count,
        },
        "scale_metrics": {
            "baseline_g5": base_s_stats,
            "v2_matcher": v2_s_stats,
            "v2_signed_bias": v2_signed_s_stats,
        },
        "room_area_metrics": {
            "baseline_g5": base_a_stats,
            "v2_matcher": v2_a_stats,
        },
        "per_image_records": per_image_records,
    }

    out_file = output_path or (repo_root / "evaluation_results/frozen_group1_benchmark_v2_results.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary_v2, f, indent=2)

    print("\n" + "=" * 85)
    print("FROZEN GROUP 1 RECALIBRATION BENCHMARK V2 RESULTS")
    print("=" * 85)
    print(f"Total Group 1 Images: {len(g1_samples)} | Total GT Rooms: {total_gt_rooms_count}")
    print(f"Accepted-Assignment Precision: {precision_pct:.2f}% (Target: >=95.0%) -> {'PASS' if gate1_pass else 'FAIL'}")
    print(f"  [Formula: Correct / Accepted = {precision_numerator} / {precision_denominator}]")
    print(f"Dimension Assignment Coverage: {coverage_pct:.2f}% (Target: >=80.0%) -> {'PASS' if gate2_pass else 'FAIL'}")
    print(f"  [Formula: Calibrated Rooms / Eligible Rooms = {coverage_numerator} / {coverage_denominator}]")
    print(f"Scale MAPE (Median):           Baseline = {base_s_stats['median']:.2f}% -> V2 = {v2_s_stats['median']:.2f}% (Target: <=5.0%) -> {'PASS' if gate4_pass else 'FAIL'}")
    print(f"Room Area MAPE (Median):       Baseline = {base_a_stats['median']:.2f}% -> V2 = {v2_a_stats['median']:.2f}% (Target: <=12.0%) -> {'PASS' if gate5_pass else 'FAIL'}")
    print(f"Unlocalized Dummy Boxes Dropped: {total_unlocalized_rejected}")
    print(f"Low-Confidence Queries Filtered: {total_filtered_queries}")
    print(f"ALL ACCEPTANCE GATES PASSED:   {'YES (Promote Candidate)' if all_pass else 'NO (Diagnose & Refine)'}")
    print(f"Results saved to: {out_file}\n", flush=True)

    return summary_v2


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Frozen Group 1 Benchmark V2")
    parser.add_argument("--img_size", type=int, default=384, help="Image resolution")
    parser.add_argument("--conf_thresh", type=float, default=0.25, help="Query confidence threshold")
    parser.add_argument("--max_images", type=int, default=None, help="Maximum images to evaluate")
    parser.add_argument("--output_path", type=str, default=None, help="Output JSON path")
    args = parser.parse_args()

    out_p = Path(args.output_path) if args.output_path else None
    run_benchmark_v2(
        img_size=args.img_size,
        conf_thresh=args.conf_thresh,
        max_images=args.max_images,
        output_path=out_p,
    )
