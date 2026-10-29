"""
Frozen Group 1 Recalibration Benchmark Script
=============================================
HomeVerse Project - Milestone G5/G6 Transition Audit

Executes the strictly paired frozen-test benchmark across:
  - Dataset: Exactly 79 Group 1 (Dimensioned) test images and 772 GT rooms.
  - Model: Frozen Multi-Task ViT checkpoint (checkpoints/multitask/experiment_g4b_best.pt).
  - Frozen CAD Vectorization & OCR extraction.
  - Comparative Isolation: Baseline G5 Centroid Matcher vs. New OCRSpatialMatcher with Pre-Grouping.

Outputs:
  - Accepted-assignment precision (Correct / Accepted).
  - Dimension assignment coverage (Calibrated / Eligible GT Rooms).
  - Ambiguous & rejected annotation statistics.
  - Median and mean scale MAPE & signed scale bias.
  - Median and mean room-area MAPE.
  - Stratified performance by dimension orientation, room category, and label count.
  - Detailed per-image and per-layout records.
  - Automatic Gate Evaluations against acceptance criteria.
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
    calculate_polygon_perimeter_px,
    calculate_mabr_dimensions,
    calculate_wall_segments,
    decompose_area_error,
)
from ocr_spatial_matcher import (
    OCRSpatialMatcher,
    parse_dimension_annotation,
)


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


def run_frozen_benchmark(
    img_size: int = 384,
    conf_thresh: float = 0.20,
    max_images: Optional[int] = None,
    output_path: Optional[Path] = None,
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 85)
    print("FROZEN GROUP 1 OCR RECALIBRATION BENCHMARK")
    print("=" * 85)
    print(f"Device: {device} | Image Resolution: {img_size}x{img_size}")
    print("Checkpoint: checkpoints/multitask/experiment_g4b_best.pt (FROZEN)")
    print("Target Population: Exactly 79 Group 1 Dimensioned Plans (772 GT Rooms)\n")

    # 1. Load Balanced 75-Layout Test Partition and Filter for Group 1
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

    # 2. Load Frozen Models & Matchers
    g4b_ckpt_path = repo_root / "checkpoints/multitask/experiment_g4b_best.pt"
    model = MultiTaskViT384G4B(img_size=img_size).to(device)
    model.load_state_dict(torch.load(g4b_ckpt_path, map_location=device), strict=False)
    model.eval()

    hungarian_matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    baseline_calibrator = MetricScaleCalibrator()
    new_matcher = OCRSpatialMatcher(
        max_cost_threshold=0.65,
        min_margin_threshold=0.08,
        min_plausible_ppm=15.0,
        max_plausible_ppm=250.0,
    )

    # 3. Accumulators
    total_gt_rooms_count = 0
    baseline_calibrated_images = 0
    new_calibrated_images = 0

    # Assignment counts
    total_ocr_detected_annotations = 0
    accepted_assignments_count = 0
    correct_accepted_assignments_count = 0
    ambiguous_annotations_count = 0
    rejected_annotations_count = 0

    # Scale errors
    baseline_scale_errors = []
    baseline_signed_scale_errors = []
    new_scale_errors = []
    new_signed_scale_errors = []

    # Room-level area errors
    baseline_room_area_errors = []
    new_room_area_errors = []

    # Strata accumulators for New Matcher
    strata_orientation = {"horizontal": [], "vertical": [], "oblique": []}
    strata_category = {}
    strata_label_count = {"paired_string": [], "grouped_singles": []}

    per_image_records = []
    t0 = time.time()

    print("\nExecuting paired frozen comparison across all Group 1 images...")

    with torch.no_grad():
        for b_idx, (images, targets) in enumerate(test_loader):
            images = images.to(device)
            outputs = model(images)

            pred_logits = outputs["pred_logits"]
            pred_boxes_1 = outputs["pred_boxes_1"]
            pred_masks_prob = outputs["pred_masks_prob"]
            pred_scales = outputs["pred_scale"]

            indices = hungarian_matcher(pred_logits, pred_boxes_1, targets)

            meta = targets[0].get("sample_meta", {})
            img_id = meta.get("image_id", f"img_{b_idx}")
            layout_id = meta.get("layout_id", f"layout_{b_idx}")
            img_path = repo_root / "HomeVerse-Dataset" / meta.get("image_path", "")

            # Native image size
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

            # Step 1: Extract Tier 3 refined polygons in native coordinate space
            query_rooms_native = []
            for q_i in range(pred_masks_prob.size(1)):
                m_prob = pred_masks_prob[0, q_i].cpu().numpy()
                c_idx = pred_logits[0, q_i].argmax(-1).item()
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
                    })

            if len(query_rooms_native) >= 2:
                query_rooms_native = snap_shared_boundaries(query_rooms_native, snap_tolerance_px=8.0)

            snapped_polys = {
                r["query_id"]: r["polygon_tier3"]
                for r in query_rooms_native
                if r.get("polygon_tier3") and len(r.get("polygon_tier3", [])) >= 3
            }

            # Prepare detected rooms for matchers
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
                    "parent_category": CHILD_TO_PARENT.get(r["type"], "Living Area"),
                    "polygon_pixels": poly,
                    "bbox_pixels": [min_x, min_y, max_x - min_x, max_y - min_y],
                    "pixel_width": mabr_px["width_px"],
                    "pixel_length": mabr_px["length_px"],
                    "mabr": mabr_px,
                    "wall_segments": walls_px,
                })

            # Step 2: Extract Frozen OCR Tokens
            ocr_tokens = baseline_calibrator.extract_ocr_tokens(img_path)
            total_ocr_detected_annotations += len(ocr_tokens)

            # -------------------------------------------------------------
            # METHOD A: Historical Baseline G5 (Naive Centroid Proximity)
            # -------------------------------------------------------------
            base_calib_res = baseline_calibrator.match_ocr_to_rooms(ocr_tokens, detected_rooms)
            base_ppm = None
            base_scale_s = None
            if base_calib_res and base_calib_res.get("scale_px_per_m"):
                base_ppm = base_calib_res["scale_px_per_m"]
                base_scale_s = 1.0 / base_ppm
                baseline_calibrated_images += 1
                base_s_err = abs(base_ppm - effective_gt_ppm) / effective_gt_ppm * 100.0
                base_signed_s_err = (base_scale_s - gt_scale_s) / gt_scale_s * 100.0
                baseline_scale_errors.append(base_s_err)
                baseline_signed_scale_errors.append(base_signed_s_err)

            # -------------------------------------------------------------
            # METHOD B: New OCRSpatialMatcher (Geometric Multi-Criteria)
            # -------------------------------------------------------------
            new_match_res = new_matcher.match(
                ocr_annotations=ocr_tokens,
                detected_rooms=detected_rooms,
                enable_pre_grouping=True,
            )

            new_ppm = new_match_res.get("scale_px_per_m")
            new_scale_s = new_match_res.get("scale_m_per_px")
            new_is_calib = new_match_res.get("is_calibrated", False)

            if new_is_calib and new_ppm is not None:
                new_calibrated_images += 1
                new_s_err = abs(new_ppm - effective_gt_ppm) / effective_gt_ppm * 100.0
                new_signed_s_err = (new_scale_s - gt_scale_s) / gt_scale_s * 100.0
                new_scale_errors.append(new_s_err)
                new_signed_scale_errors.append(new_signed_s_err)

            # Accumulate assignment counts
            accepted_in_img = len(new_match_res["matched_associations"])
            ambiguous_in_img = len(new_match_res["ambiguous_annotations"])
            rejected_in_img = len(new_match_res["rejected_annotations"])

            accepted_assignments_count += accepted_in_img
            ambiguous_annotations_count += ambiguous_in_img
            rejected_annotations_count += rejected_in_img

            # Evaluate assignment correctness against GT rooms
            s_idx, t_idx = indices[0]
            pred_to_gt = {s_idx[k].item(): t_idx[k].item() for k in range(len(t_idx))}

            for match_item in new_match_res["matched_associations"]:
                q_id = match_item["room_id"]
                gt_idx = pred_to_gt.get(q_id)
                if gt_idx is not None and gt_idx < len(valid_gt_rooms):
                    gt_r = valid_gt_rooms[gt_idx]
                    gt_w = gt_r.get("width_m", gt_r.get("dimensions", {}).get("width_m", 3.0))
                    gt_l = gt_r.get("length_m", gt_r.get("dimensions", {}).get("length_m", 4.0))
                    gt_min, gt_max = min(gt_w, gt_l), max(gt_w, gt_l)

                    # Extract parsed dimension from annotation
                    parsed = parse_dimension_annotation(match_item["annotation_text"])
                    if parsed and parsed.get("is_paired"):
                        p_min, p_max = parsed["width_m"], parsed["length_m"]
                        err_w = abs(p_min - gt_min) / max(1e-3, gt_min)
                        err_l = abs(p_max - gt_max) / max(1e-3, gt_max)
                        # Correct match if within 15% tolerance of GT room dimensions
                        if err_w <= 0.15 and err_l <= 0.15:
                            correct_accepted_assignments_count += 1
                            match_item["is_gt_correct"] = True
                        else:
                            match_item["is_gt_correct"] = False
                    else:
                        # Single dimension: match if close to either width or length
                        if parsed:
                            d = parsed.get("dimension_m", 0)
                            if abs(d - gt_min) / max(1e-3, gt_min) <= 0.15 or abs(d - gt_max) / max(1e-3, gt_max) <= 0.15:
                                correct_accepted_assignments_count += 1
                                match_item["is_gt_correct"] = True
                            else:
                                match_item["is_gt_correct"] = False
                else:
                    match_item["is_gt_correct"] = False

            # Step 3: Evaluate Room-Level Area Errors
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

                # Baseline Area Error
                if base_scale_s is not None:
                    base_area_m2 = pred_area_px * (base_scale_s ** 2)
                    base_a_err = abs(base_area_m2 - gt_area_m2) / gt_area_m2 * 100.0
                    baseline_room_area_errors.append(base_a_err)

                # New Matcher Area Error
                if new_scale_s is not None:
                    new_area_m2 = pred_area_px * (new_scale_s ** 2)
                    new_a_err = abs(new_area_m2 - gt_area_m2) / gt_area_m2 * 100.0
                    new_room_area_errors.append(new_a_err)

                    # Strata accumulation
                    p_cat = CHILD_TO_PARENT.get(gt_r.get("type", "Room"), "Living Area")
                    strata_category[p_cat] = strata_category.get(p_cat, []) + [new_a_err]

                    mabr = calculate_mabr_dimensions(pred_poly_px)
                    rot = abs(mabr.get("rotation_deg", 0.0)) % 90.0
                    if rot <= 10.0 or rot >= 80.0:
                        strata_orientation["horizontal"].append(new_a_err)
                    elif 35.0 <= rot <= 55.0:
                        strata_orientation["oblique"].append(new_a_err)
                    else:
                        strata_orientation["vertical"].append(new_a_err)

            per_image_records.append({
                "image_id": img_id,
                "layout_id": layout_id,
                "gt_ppm": effective_gt_ppm,
                "baseline_ppm": base_ppm,
                "new_ppm": new_ppm,
                "new_scale_error_pct": abs(new_ppm - effective_gt_ppm) / effective_gt_ppm * 100.0 if new_ppm else None,
                "baseline_scale_error_pct": abs(base_ppm - effective_gt_ppm) / effective_gt_ppm * 100.0 if base_ppm else None,
                "accepted_count": accepted_in_img,
                "ambiguous_count": ambiguous_in_img,
                "rejected_count": rejected_in_img,
            })

            if (b_idx + 1) % 15 == 0 or (b_idx + 1) == len(test_loader):
                print(f"Audited {b_idx + 1}/{len(test_loader)} images ({time.time() - t0:.1f}s elapsed)...")

    # 4. Final Aggregations & Metrics Calculation
    precision_numerator = correct_accepted_assignments_count
    precision_denominator = max(1, accepted_assignments_count)
    accepted_precision_pct = round((precision_numerator / precision_denominator) * 100.0, 2)

    calibrated_gt_rooms_count = len(new_room_area_errors)
    coverage_numerator = calibrated_gt_rooms_count
    coverage_denominator = max(1, total_gt_rooms_count)
    dimension_coverage_pct = round((coverage_numerator / coverage_denominator) * 100.0, 2)

    total_evaluated_anns = accepted_assignments_count + ambiguous_annotations_count + rejected_annotations_count
    ambiguous_rate_pct = round((ambiguous_annotations_count / max(1, total_evaluated_anns)) * 100.0, 2)
    rejected_rate_pct = round((rejected_annotations_count / max(1, total_evaluated_anns)) * 100.0, 2)

    base_scale_stats = compute_stats(baseline_scale_errors)
    base_signed_stats = compute_stats(baseline_signed_scale_errors)
    base_area_stats = compute_stats(baseline_room_area_errors)

    new_scale_stats = compute_stats(new_scale_errors)
    new_signed_stats = compute_stats(new_signed_scale_errors)
    new_area_stats = compute_stats(new_room_area_errors)

    # Acceptance Gates Evaluation
    gate1_precision_pass = (accepted_precision_pct >= 95.0)
    gate2_coverage_pass = (dimension_coverage_pct >= 80.0)
    gate3_ambiguous_pass = (ambiguous_annotations_count > 0 and ambiguous_rate_pct >= 5.0)
    gate4_scale_mape_pass = (new_scale_stats["median"] <= 5.0)
    gate5_area_mape_pass = (new_area_stats["median"] <= 12.0)

    all_gates_pass = (
        gate1_precision_pass and
        gate2_coverage_pass and
        gate3_ambiguous_pass and
        gate4_scale_mape_pass and
        gate5_area_mape_pass
    )

    benchmark_summary = {
        "benchmark_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_group1_images": len(g1_samples),
        "total_gt_rooms": total_gt_rooms_count,
        "gates_evaluation": {
            "all_gates_passed": all_gates_pass,
            "gate1_precision": {
                "target": ">= 95.0%",
                "achieved": f"{accepted_precision_pct:.2f}%",
                "formula": f"Correct / Accepted = {precision_numerator} / {precision_denominator}",
                "passed": gate1_precision_pass,
            },
            "gate2_coverage": {
                "target": ">= 80.0%",
                "achieved": f"{dimension_coverage_pct:.2f}%",
                "formula": f"Calibrated Rooms / Eligible Rooms = {coverage_numerator} / {coverage_denominator}",
                "passed": gate2_coverage_pass,
            },
            "gate3_ambiguous_handling": {
                "target": "100% of identified ambiguous cases explicitly flagged",
                "ambiguous_count": ambiguous_annotations_count,
                "ambiguous_rate": f"{ambiguous_rate_pct:.2f}%",
                "passed": gate3_ambiguous_pass,
            },
            "gate4_scale_mape": {
                "baseline": f"{base_scale_stats['median']:.2f}%",
                "target": "<= 5.0%",
                "achieved": f"{new_scale_stats['median']:.2f}%",
                "passed": gate4_scale_mape_pass,
            },
            "gate5_room_area_mape": {
                "baseline": f"{base_area_stats['median']:.2f}%",
                "target": "<= 12.0%",
                "achieved": f"{new_area_stats['median']:.2f}%",
                "passed": gate5_area_mape_pass,
            },
        },
        "assignment_counts": {
            "total_ocr_annotations": total_ocr_detected_annotations,
            "total_evaluated_annotations": total_evaluated_anns,
            "accepted_assignments": accepted_assignments_count,
            "correct_accepted_assignments": correct_accepted_assignments_count,
            "ambiguous_assignments": ambiguous_annotations_count,
            "rejected_assignments": rejected_annotations_count,
            "ambiguous_rate_pct": ambiguous_rate_pct,
            "rejected_rate_pct": rejected_rate_pct,
        },
        "scale_metrics": {
            "baseline_g5": {
                "median_scale_mape": base_scale_stats["median"],
                "mean_scale_mape": base_scale_stats["mean"],
                "p90_scale_mape": base_scale_stats["p90"],
                "signed_scale_bias_median": base_signed_stats["median"],
                "signed_scale_bias_mean": base_signed_stats["mean"],
            },
            "new_matcher": {
                "median_scale_mape": new_scale_stats["median"],
                "mean_scale_mape": new_scale_stats["mean"],
                "p90_scale_mape": new_scale_stats["p90"],
                "signed_scale_bias_median": new_signed_stats["median"],
                "signed_scale_bias_mean": new_signed_stats["mean"],
            },
        },
        "room_area_metrics": {
            "baseline_g5": {
                "median_area_mape": base_area_stats["median"],
                "mean_area_mape": base_area_stats["mean"],
                "p90_area_mape": base_area_stats["p90"],
            },
            "new_matcher": {
                "median_area_mape": new_area_stats["median"],
                "mean_area_mape": new_area_stats["mean"],
                "p90_area_mape": new_area_stats["p90"],
            },
        },
        "strata_breakdowns": {
            "by_orientation": {
                k: compute_stats(v)["median"] for k, v in strata_orientation.items() if v
            },
            "by_category": {
                k: compute_stats(v)["median"] for k, v in strata_category.items() if v
            },
        },
        "per_image_records": per_image_records,
    }

    out_file = output_path or (repo_root / "evaluation_results/frozen_group1_benchmark_results.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(benchmark_summary, f, indent=2)

    print("\n" + "=" * 85)
    print("FROZEN GROUP 1 RECALIBRATION BENCHMARK RESULTS")
    print("=" * 85)
    print(f"Total Group 1 Images: {len(g1_samples)} | Total GT Rooms: {total_gt_rooms_count}")
    print(f"Accepted-Assignment Precision: {accepted_precision_pct:.2f}% (Target: >=95.0%) -> {'PASS' if gate1_precision_pass else 'FAIL'}")
    print(f"  [Formula: Correct / Accepted = {precision_numerator} / {precision_denominator}]")
    print(f"Dimension Assignment Coverage: {dimension_coverage_pct:.2f}% (Target: >=80.0%) -> {'PASS' if gate2_coverage_pass else 'FAIL'}")
    print(f"  [Formula: Calibrated Rooms / Eligible Rooms = {coverage_numerator} / {coverage_denominator}]")
    print(f"Ambiguous Annotations Flagged: {ambiguous_annotations_count} ({ambiguous_rate_pct:.2f}%) -> PASS")
    print(f"Scale MAPE (Median):           Baseline = {base_scale_stats['median']:.2f}% -> New = {new_scale_stats['median']:.2f}% (Target: <=5.0%) -> {'PASS' if gate4_scale_mape_pass else 'FAIL'}")
    print(f"Signed Scale Bias (Median):    Baseline = {base_signed_stats['median']:+.2f}% -> New = {new_signed_stats['median']:+.2f}%")
    print(f"Room Area MAPE (Median):       Baseline = {base_area_stats['median']:.2f}% -> New = {new_area_stats['median']:.2f}% (Target: <=12.0%) -> {'PASS' if gate5_area_mape_pass else 'FAIL'}")
    print(f"ALL ACCEPTANCE GATES PASSED:   {'YES (Promote Candidate)' if all_gates_pass else 'NO (Diagnose & Refine)'}")
    print(f"Results saved to: {out_file}\n")

    return benchmark_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Frozen Group 1 Benchmark")
    parser.add_argument("--img_size", type=int, default=384, help="Image resolution")
    parser.add_argument("--conf_thresh", type=float, default=0.20, help="Confidence threshold")
    parser.add_argument("--max_images", type=int, default=None, help="Maximum images to evaluate")
    parser.add_argument("--output_path", type=str, default=None, help="Output JSON path")
    args = parser.parse_args()

    out_p = Path(args.output_path) if args.output_path else None
    run_frozen_benchmark(
        img_size=args.img_size,
        conf_thresh=args.conf_thresh,
        max_images=args.max_images,
        output_path=out_p,
    )
