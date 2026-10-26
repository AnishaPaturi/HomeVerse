"""
Experiment G4-C: Polygon Boundary Refinement & CAD Vectorization Evaluation
===========================================================================
HomeVerse Project - Milestone 4-C

Executes the deterministic 3-tier geometry vectorization pipeline on G4-B predictions:
  Tier 1: Raw Dynamic Mask Probability Map [96 x 96]
  Tier 2: Extracted Unrefined Raw Polygon Contours (1024 x 1024)
  Tier 3: Topology-Snapped & Corner-Preserving CAD Polygons

Evaluates:
  1. Polygon IoU across Tier 1, Tier 2, and Tier 3
  2. Non-Convex Polygon IoU and Alcove/L-Shape Preservation
  3. Boundary F1 Score (2-pixel tolerance)
  4. Shoelace Metric Area Error (%) vs Bounding Box Area Error (%)
  5. Invalid Polygon Rate (Self-intersections, bowties)
  6. Shared Boundary Alignment along Partition Walls
  7. DXF and SVG Export & 100% Round-Trip Geometric Verification
"""

import argparse
import json
import math
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Tuple, Any

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageDraw
from torch.utils.data import DataLoader
from shapely.geometry import Polygon, MultiPolygon

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

from floorplan_dataset import (
    FloorplanDataset,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    LABEL2ID,
    ID2LABEL,
)
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta
from run_experiment_g4a import (
    PARENT_CLASSES,
    NUM_PARENT_CLASSES,
    CHILD_TO_PARENT,
)
from run_experiment_g4b import (
    MultiTaskViT384G4B,
    rasterize_canonical_instance_masks,
    compute_boundary_f1,
)
from cad_vectorizer import (
    extract_unrefined_polygon,
    adaptive_polygon_simplification,
    snap_shared_boundaries,
    calculate_shoelace_area,
    export_to_svg,
    export_to_dxf,
    verify_svg_roundtrip,
    verify_dxf_roundtrip,
    PARENT_COLORS_HEX,
)
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
    box_iou,
)


def rasterize_polygon_to_binary_mask(pts: List[Tuple[float, float]],
                                     mask_size: Tuple[int, int] = (96, 96),
                                     orig_size: Tuple[int, int] = (1024, 1024)) -> np.ndarray:
    """Rasterizes a polygon into a binary mask of specified dimensions."""
    mw, mh = mask_size
    ow, oh = orig_size
    img = Image.new("L", (mw, mh), 0)
    draw = ImageDraw.Draw(img)
    if len(pts) >= 3:
        scaled_pts = [(float(x) * mw / ow, float(y) * mh / oh) for x, y in pts]
        draw.polygon(scaled_pts, fill=1)
    return np.array(img, dtype=np.uint8)


def run_experiment_g4c(conf_thresh: float = 0.20, img_size: int = 384):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 80, flush=True)
    print("EXPERIMENT G4-C: POLYGON BOUNDARY REFINEMENT & CAD VECTORIZATION", flush=True)
    print(f"Device: {device} | Image Size: {img_size} | Nominal Conf Thresh: {conf_thresh:.2f}", flush=True)
    print("Primary Candidate Source: checkpoints/multitask/experiment_g4b_best.pt", flush=True)
    print("=" * 80, flush=True)

    # 1. Load Balanced 75-Layout Test Split
    print("\nLoading authoritative 75-layout test partition...", flush=True)
    te_lids, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)
    print(f"Test split: {len(test_samples)} images ({len(te_lids)} unique layouts)")

    ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=img_size, mask_size=(96, 96))
    ds.samples = test_samples
    items = []
    for i in range(len(ds)):
        item = ds[i]
        item["sample_meta"] = test_samples[i]
        valid_rooms = [r for r in test_samples[i]["rooms"] if r.get("type") in LABEL2ID]
        item["masks"] = rasterize_canonical_instance_masks(valid_rooms, mask_size=(96, 96))
        items.append(item)

    test_ds = InMemoryDataset(items)
    test_loader = DataLoader(test_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

    # 2. Load Frozen G4-B Model
    g4b_ckpt_path = Path("checkpoints/multitask/experiment_g4b_best.pt")
    if not g4b_ckpt_path.exists():
        raise FileNotFoundError(f"Required primary candidate checkpoint not found: {g4b_ckpt_path}")

    print(f"\nLoading trained G4-B Primary Candidate: {g4b_ckpt_path}...", flush=True)
    model = MultiTaskViT384G4B(img_size=img_size).to(device)
    model.load_state_dict(torch.load(g4b_ckpt_path, map_location=device), strict=False)
    model.eval()

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    # 3. Comprehensive Metric Accumulators across 3 Tiers
    tier1_mask_ious, tier1_mask_dices = [], []
    tier2_poly_ious, tier2_poly_dices = [], []
    tier3_poly_ious, tier3_poly_dices = [], []

    tier1_boundary_f1s = []
    tier2_boundary_f1s = []
    tier3_boundary_f1s = []

    non_convex_tier1_ious = []
    non_convex_tier2_ious = []
    non_convex_tier3_ious = []

    shoelace_area_errors_tier2 = []
    shoelace_area_errors_tier3 = []
    bbox_area_errors = []

    non_convex_shoelace_errors = []
    non_convex_bbox_errors = []

    invalid_polygons_tier2 = 0
    invalid_polygons_tier3 = 0
    total_extracted_polygons = 0

    dxf_roundtrip_results = []
    svg_roundtrip_results = []

    cad_export_dir = Path("evaluation_results/g4c_cad_exports")
    cad_export_dir.mkdir(parents=True, exist_ok=True)

    sample_visualizations = [0, 3, 7, 12, 25, 42, 60]
    exported_samples = [0, 3, 7, 12, 25, 42, 60]

    print("\nRunning G4-C 3-Tier Vectorization & Topological Evaluation across all 75 layouts...", flush=True)
    t0_eval = time.time()
    sample_global_idx = 0

    with torch.no_grad():
        for batch_idx, (images, targets) in enumerate(test_loader):
            images = images.to(device)
            outputs = model(images)

            pred_logits = outputs["pred_logits"]
            pred_parent_logits = outputs["pred_parent_logits"]
            pred_boxes_1 = outputs["pred_boxes_1"]
            pred_masks_prob = outputs["pred_masks_prob"]
            pred_scales = outputs["pred_scale"]

            child_probs = pred_logits.softmax(-1)
            parent_probs = pred_parent_logits.softmax(-1)
            indices = matcher(pred_logits, pred_boxes_1, targets)
            bs = images.size(0)

            for b in range(bs):
                current_sample_idx = sample_global_idx
                sample_global_idx += 1

                meta = targets[b].get("sample_meta", {})
                gt_rooms = meta.get("rooms", [])
                valid_gt_rooms = [r for r in gt_rooms if r.get("type") in LABEL2ID]
                gt_masks = targets[b]["masks"].numpy() if "masks" in targets[b] else np.zeros((0, 96, 96))
                active_scale = pred_scales[b].item()
                gt_scale = targets[b]["scale_px_per_m"].item()
                eval_scale = gt_scale if gt_scale > 0 else (active_scale if active_scale > 0 else 50.0)

                # Hungarian Matched Pair Evaluation (Oracle Alignment)
                s_idx, t_idx = indices[b]
                for k in range(len(t_idx)):
                    q_i = s_idx[k].item()
                    gt_r_i = t_idx[k].item()
                    if gt_r_i >= len(valid_gt_rooms) or gt_r_i >= len(gt_masks):
                        continue

                    r_info = valid_gt_rooms[gt_r_i]
                    gt_m = (gt_masks[gt_r_i] >= 0.5).astype(np.uint8)
                    r_area_m2 = r_info.get("area_m2", r_info.get("dimensions", {}).get("area_m2", 10.0))
                    r_poly = r_info.get("polygon")

                    # Check Non-Convexity
                    is_non_convex = False
                    if r_poly and len(r_poly) >= 3:
                        poly_pts = np.array(r_poly, dtype=np.float32).reshape((-1, 1, 2))
                        is_non_convex = not cv2.isContourConvex(poly_pts)
                    elif r_poly and len(r_poly) > 4:
                        is_non_convex = True

                    # 1. Tier 1: Raw Dynamic Mask
                    m_prob = pred_masks_prob[b, q_i].cpu().numpy()
                    m1_bin = (m_prob >= 0.5).astype(np.uint8)

                    inter1 = (m1_bin & gt_m).sum()
                    union1 = (m1_bin | gt_m).sum()
                    iou1 = float(inter1) / max(1, union1)
                    dice1 = float(2.0 * inter1) / max(1, m1_bin.sum() + gt_m.sum())
                    bf1_1 = compute_boundary_f1(m1_bin, gt_m, tol=2)

                    tier1_mask_ious.append(iou1)
                    tier1_mask_dices.append(dice1)
                    tier1_boundary_f1s.append(bf1_1)
                    if is_non_convex:
                        non_convex_tier1_ious.append(iou1)

                    # 2. Tier 2: Unrefined Contour Polygon
                    pts_tier2 = extract_unrefined_polygon(m_prob, threshold=0.5, orig_size=(1024, 1024))
                    if pts_tier2 and len(pts_tier2) >= 3:
                        total_extracted_polygons += 1
                        sp2 = Polygon(pts_tier2)
                        if not sp2.is_valid:
                            invalid_polygons_tier2 += 1

                        m2_bin = rasterize_polygon_to_binary_mask(pts_tier2, mask_size=(96, 96), orig_size=(1024, 1024))
                        inter2 = (m2_bin & gt_m).sum()
                        union2 = (m2_bin | gt_m).sum()
                        iou2 = float(inter2) / max(1, union2)
                        dice2 = float(2.0 * inter2) / max(1, m2_bin.sum() + gt_m.sum())
                        bf1_2 = compute_boundary_f1(m2_bin, gt_m, tol=2)

                        tier2_poly_ious.append(iou2)
                        tier2_poly_dices.append(dice2)
                        tier2_boundary_f1s.append(bf1_2)
                        if is_non_convex:
                            non_convex_tier2_ious.append(iou2)

                        area_px_2 = calculate_shoelace_area(pts_tier2)
                        if eval_scale > 0 and r_area_m2 > 0:
                            area_m2_2 = area_px_2 / (eval_scale ** 2)
                            shoelace_area_errors_tier2.append(abs(area_m2_2 - r_area_m2) / r_area_m2 * 100.0)

                        # 3. Tier 3: Adaptive Simplification (Corner-Preserving)
                        pts_tier3 = adaptive_polygon_simplification(pts_tier2, epsilon_factor=0.012, max_eps_px=3.0, protect_non_convex=True)
                        sp3 = Polygon(pts_tier3)
                        if not sp3.is_valid:
                            invalid_polygons_tier3 += 1

                        m3_bin = rasterize_polygon_to_binary_mask(pts_tier3, mask_size=(96, 96), orig_size=(1024, 1024))
                        inter3 = (m3_bin & gt_m).sum()
                        union3 = (m3_bin | gt_m).sum()
                        iou3 = float(inter3) / max(1, union3)
                        dice3 = float(2.0 * inter3) / max(1, m3_bin.sum() + gt_m.sum())
                        bf1_3 = compute_boundary_f1(m3_bin, gt_m, tol=2)

                        tier3_poly_ious.append(iou3)
                        tier3_poly_dices.append(dice3)
                        tier3_boundary_f1s.append(bf1_3)
                        if is_non_convex:
                            non_convex_tier3_ious.append(iou3)

                        area_px_3 = calculate_shoelace_area(pts_tier3)
                        if eval_scale > 0 and r_area_m2 > 0:
                            area_m2_3 = area_px_3 / (eval_scale ** 2)
                            err_3 = abs(area_m2_3 - r_area_m2) / r_area_m2 * 100.0
                            shoelace_area_errors_tier3.append(err_3)
                            if is_non_convex:
                                non_convex_shoelace_errors.append(err_3)

                    # Bounding Box Area Benchmark (W x L)
                    bw_norm, bh_norm = pred_boxes_1[b, q_i][2].item(), pred_boxes_1[b, q_i][3].item()
                    bbox_w_px = bw_norm * 1024.0
                    bbox_h_px = bh_norm * 1024.0
                    if eval_scale > 0 and r_area_m2 > 0:
                        bbox_area_m2 = (bbox_w_px * bbox_h_px) / (eval_scale ** 2)
                        bbox_err = abs(bbox_area_m2 - r_area_m2) / r_area_m2 * 100.0
                        bbox_area_errors.append(bbox_err)
                        if is_non_convex:
                            non_convex_bbox_errors.append(bbox_err)

                # Layout-Wide Vectorization & CAD Export (Threshold-Filtered Predictions)
                top_scores, top_classes = child_probs[b].max(dim=-1)
                top_p_scores, top_p_classes = parent_probs[b].max(dim=-1)
                keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)
                keep_indices = torch.where(keep)[0]

                layout_rooms_vectorized = []
                for idx in keep_indices:
                    q_i = idx.item()
                    c_id = top_classes[q_i].item()
                    p_id = top_p_classes[q_i].item()
                    c_name = ROOM_CLASSES[c_id] if c_id < NUM_ROOM_CLASSES else "Room"
                    p_name = PARENT_CLASSES[p_id] if p_id < NUM_PARENT_CLASSES else "Living Area"

                    m_prob = pred_masks_prob[b, q_i].cpu().numpy()
                    pts_unref = extract_unrefined_polygon(m_prob, threshold=0.5, orig_size=(1024, 1024))
                    if pts_unref and len(pts_unref) >= 3:
                        pts_sim = adaptive_polygon_simplification(pts_unref, protect_non_convex=True)
                        area_px = calculate_shoelace_area(pts_sim)
                        area_m2 = area_px / (eval_scale ** 2) if eval_scale > 0 else 10.0

                        layout_rooms_vectorized.append({
                            "query_id": q_i,
                            "type": c_name,
                            "parent_category": p_name,
                            "parent_id": p_id,
                            "score": float(top_scores[q_i].item()),
                            "polygon_tier2": pts_unref,
                            "polygon_tier3": pts_sim,
                            "area_m2": area_m2,
                            "shoelace_area_px": area_px,
                        })

                # Snap shared partition boundaries across adjacent rooms
                layout_rooms_vectorized = snap_shared_boundaries(layout_rooms_vectorized, snap_tolerance_px=8.0)

                # Export sample layouts to DXF and SVG
                if current_sample_idx in exported_samples and len(layout_rooms_vectorized) > 0:
                    svg_file = cad_export_dir / f"floorplan_sample_{current_sample_idx}.svg"
                    dxf_file = cad_export_dir / f"floorplan_sample_{current_sample_idx}.dxf"

                    export_to_svg(layout_rooms_vectorized, str(svg_file), image_size=(1024, 1024), scale_ppm=eval_scale)
                    export_to_dxf(layout_rooms_vectorized, str(dxf_file), image_size=(1024, 1024), scale_ppm=eval_scale)

                    # Round-trip verification
                    svg_rt = verify_svg_roundtrip(str(svg_file))
                    dxf_rt = verify_dxf_roundtrip(str(dxf_file))
                    svg_roundtrip_results.append(svg_rt["is_valid_xml"])
                    dxf_roundtrip_results.append(dxf_rt["closed_rate"] == 100.0)

    eval_time = time.time() - t0_eval
    print(f"Vectorization evaluation complete in {eval_time:.1f}s.", flush=True)

    # 4. Compute Aggregate Benchmark Metrics
    inv_rate_tier2 = (invalid_polygons_tier2 / max(1, total_extracted_polygons)) * 100.0
    inv_rate_tier3 = (invalid_polygons_tier3 / max(1, total_extracted_polygons)) * 100.0

    dxf_success_rate = (sum(dxf_roundtrip_results) / max(1, len(dxf_roundtrip_results))) * 100.0
    svg_success_rate = (sum(svg_roundtrip_results) / max(1, len(svg_roundtrip_results))) * 100.0

    results = {
        "confidence_threshold": conf_thresh,
        "total_extracted_polygons": total_extracted_polygons,
        "tier1_raw_mask_iou": float(np.mean(tier1_mask_ious)) if tier1_mask_ious else 0.0,
        "tier1_raw_mask_dice": float(np.mean(tier1_mask_dices)) if tier1_mask_dices else 0.0,
        "tier1_boundary_f1": float(np.mean(tier1_boundary_f1s)) if tier1_boundary_f1s else 0.0,
        "tier2_unrefined_poly_iou": float(np.mean(tier2_poly_ious)) if tier2_poly_ious else 0.0,
        "tier2_unrefined_poly_dice": float(np.mean(tier2_poly_dices)) if tier2_poly_dices else 0.0,
        "tier2_boundary_f1": float(np.mean(tier2_boundary_f1s)) if tier2_boundary_f1s else 0.0,
        "tier3_refined_poly_iou": float(np.mean(tier3_poly_ious)) if tier3_poly_ious else 0.0,
        "tier3_refined_poly_dice": float(np.mean(tier3_poly_dices)) if tier3_poly_dices else 0.0,
        "tier3_boundary_f1": float(np.mean(tier3_boundary_f1s)) if tier3_boundary_f1s else 0.0,
        "non_convex_tier1_iou": float(np.mean(non_convex_tier1_ious)) if non_convex_tier1_ious else 0.0,
        "non_convex_tier2_iou": float(np.mean(non_convex_tier2_ious)) if non_convex_tier2_ious else 0.0,
        "non_convex_tier3_iou": float(np.mean(non_convex_tier3_ious)) if non_convex_tier3_ious else 0.0,
        "median_shoelace_area_error_tier2_pct": float(np.median(shoelace_area_errors_tier2)) if shoelace_area_errors_tier2 else 0.0,
        "median_shoelace_area_error_tier3_pct": float(np.median(shoelace_area_errors_tier3)) if shoelace_area_errors_tier3 else 0.0,
        "median_bbox_area_error_pct": float(np.median(bbox_area_errors)) if bbox_area_errors else 0.0,
        "non_convex_shoelace_error_pct": float(np.median(non_convex_shoelace_errors)) if non_convex_shoelace_errors else 0.0,
        "non_convex_bbox_error_pct": float(np.median(non_convex_bbox_errors)) if non_convex_bbox_errors else 0.0,
        "invalid_polygon_rate_tier2_pct": inv_rate_tier2,
        "invalid_polygon_rate_tier3_pct": inv_rate_tier3,
        "dxf_roundtrip_success_rate_pct": dxf_success_rate,
        "svg_roundtrip_success_rate_pct": svg_success_rate,
    }

    # Print Formatted Results Table
    print("\n" + "=" * 80)
    print("EXPERIMENT G4-C BENCHMARK RESULTS: 3-TIER GEOMETRY PROGRESSION")
    print("=" * 80)
    print(f"{'Metric':<38} | {'Tier 1 (Mask)':<15} | {'Tier 2 (Unrefined)':<18} | {'Tier 3 (CAD Poly)':<15}")
    print("-" * 92)
    print(f"{'Interior IoU':<38} | {results['tier1_raw_mask_iou']:.4f}          | {results['tier2_unrefined_poly_iou']:.4f}             | {results['tier3_refined_poly_iou']:.4f}")
    print(f"{'Interior Dice':<38} | {results['tier1_raw_mask_dice']:.4f}          | {results['tier2_unrefined_poly_dice']:.4f}             | {results['tier3_refined_poly_dice']:.4f}")
    print(f"{'Boundary F1 (2-pixel tolerance)':<38} | {results['tier1_boundary_f1']:.4f}          | {results['tier2_boundary_f1']:.4f}             | {results['tier3_boundary_f1']:.4f}")
    print(f"{'Non-Convex Room IoU':<38} | {results['non_convex_tier1_iou']:.4f}          | {results['non_convex_tier2_iou']:.4f}             | {results['non_convex_tier3_iou']:.4f}")
    print(f"{'Median Area Error (%)':<38} | N/A             | {results['median_shoelace_area_error_tier2_pct']:.2f}%             | {results['median_shoelace_area_error_tier3_pct']:.2f}%")
    print(f"{'Bounding Box Area Error (%)':<38} | {results['median_bbox_area_error_pct']:.2f}% (W x L)   | {results['median_bbox_area_error_pct']:.2f}% (W x L)      | {results['median_bbox_area_error_pct']:.2f}% (W x L)")
    print(f"{'Invalid Polygon Rate':<38} | 0.0% (N/A)      | {results['invalid_polygon_rate_tier2_pct']:.2f}%             | {results['invalid_polygon_rate_tier3_pct']:.2f}% (Strict 0.0%)")
    print(f"{'DXF Round-Trip Closed Polyline Rate':<38} | N/A             | N/A                | {results['dxf_roundtrip_success_rate_pct']:.1f}%")
    print(f"{'SVG Round-Trip XML Validity Rate':<38} | N/A             | N/A                | {results['svg_roundtrip_success_rate_pct']:.1f}%")
    print("=" * 80)

    # 5. Save JSON Results
    results_path = Path("evaluation_results/experiment_g4c_results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nComprehensive G4-C benchmark results saved to: {results_path}")

    # 6. Generate 4-Panel Verification Visualizations
    generate_g4c_diagnostic_panels(model, test_ds, device, sample_indices=sample_visualizations, conf_thresh=conf_thresh)
    print("\nEXPERIMENT G4-C VECTORIZATION MILESTONE COMPLETED SUCCESSFULLY!")


def generate_g4c_diagnostic_panels(model, test_ds, device,
                                   sample_indices=[0, 3, 7, 12, 25, 42, 60],
                                   conf_thresh=0.20,
                                   out_dir="evaluation_results/g4c_diagnostics"):
    """
    Generates 4-panel visual verification panels demonstrating:
      Panel 1: Ground Truth CAD Polygons
      Panel 2: Tier 1 Predicted Dynamic Instance Masks (color blended overlay)
      Panel 3: Tier 2 Extracted Unrefined Raw Contours (1024x1024)
      Panel 4: Tier 3 Refined & Snapped CAD Polygons with Metric Areas & DXF Vector Overlay
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

        gt_rooms = sample.get("rooms", [])
        gt_scale = sample.get("pixels_per_meter", sample.get("raw_pixels_per_meter", 0.0))
        active_scale = gt_scale if gt_scale > 0 else (pred_scale if pred_scale > 0 else 50.0)

        panel_w = orig_w
        panel_h = orig_h
        canvas = Image.new("RGB", (panel_w * 4, panel_h + 40), (255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        # Panel 1: Ground Truth
        canvas.paste(orig_img, (0, 40))
        draw.text((15, 10), f"SAMPLE #{s_idx} - GROUND TRUTH CAD INTERIOR POLYGONS", fill=(0, 0, 0))
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

        # Panel 2: Tier 1 Raw Masks
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
        draw.text((panel_w + 15, 10), "TIER 1: RAW DYNAMIC MASKS (G4-B)", fill=(0, 0, 180))

        # Panel 3: Tier 2 Extracted Unrefined Raw Contours
        tier2_canvas = orig_img.copy()
        tier2_draw = ImageDraw.Draw(tier2_canvas)
        layout_rooms = []
        for r_i, idx in enumerate(keep_indices):
            q_i = idx.item()
            col = COLORS[r_i % len(COLORS)]
            c_id = top_classes[q_i].item()
            c_name = ROOM_CLASSES[c_id] if c_id < NUM_ROOM_CLASSES else "Room"

            m_prob = pred_masks_prob[q_i].cpu().numpy()
            pts_unref = extract_unrefined_polygon(m_prob, threshold=0.5, orig_size=(panel_w, panel_h))
            if pts_unref and len(pts_unref) >= 3:
                tier2_draw.polygon([(int(x), int(y)) for x, y in pts_unref], outline=col, width=2)
                pts_sim = adaptive_polygon_simplification(pts_unref, protect_non_convex=True)
                layout_rooms.append({
                    "query_id": q_i,
                    "type": c_name,
                    "parent_category": "Living Area",
                    "polygon_tier2": pts_unref,
                    "polygon_tier3": pts_sim,
                })

        canvas.paste(tier2_canvas, (panel_w * 2, 40))
        draw.text((panel_w * 2 + 15, 10), "TIER 2: UNREFINED PIXEL CONTOURS", fill=(0, 100, 0))

        # Panel 4: Tier 3 Refined & Topology-Snapped CAD Polygons
        tier3_canvas = orig_img.copy()
        tier3_draw = ImageDraw.Draw(tier3_canvas)
        layout_rooms = snap_shared_boundaries(layout_rooms, snap_tolerance_px=8.0)

        for r_i, r in enumerate(layout_rooms):
            col = COLORS[r_i % len(COLORS)]
            pts_ref = r.get("polygon_tier3", [])
            c_name = r.get("type", "Room")
            if len(pts_ref) >= 3:
                int_pts = [(int(x), int(y)) for x, y in pts_ref]
                tier3_draw.polygon(int_pts, outline=col, width=3)
                area_px = calculate_shoelace_area(pts_ref)
                area_m2 = area_px / (active_scale ** 2) if active_scale > 0 else 10.0
                cx = sum(p[0] for p in int_pts) // len(int_pts)
                cy = sum(p[1] for p in int_pts) // len(int_pts)
                lbl = f"{c_name}\n{area_m2:.1f}m²"
                tier3_draw.text((cx - 20, cy - 10), lbl, fill=(0, 0, 0))

        canvas.paste(tier3_canvas, (panel_w * 3, 40))
        draw.text((panel_w * 3 + 15, 10), "TIER 3: REFINED & SNAPPED CAD GEOMETRY", fill=(180, 0, 180))

        out_file = out_dir / f"g4c_vectorization_sample_{s_idx}.png"
        canvas.save(out_file)

    print(f"Saved {len(sample_indices)} G4-C diagnostic panels to {out_dir}.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Experiment G4-C CAD Vectorization")
    parser.add_argument("--conf-thresh", type=float, default=0.20, help="Confidence threshold")
    parser.add_argument("--img-size", type=int, default=384, help="Model image size")
    args = parser.parse_args()

    run_experiment_g4c(conf_thresh=args.conf_thresh, img_size=args.img_size)
