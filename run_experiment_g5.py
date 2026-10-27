"""
Experiment G5: Metric Geometry & Dimension Calibration Evaluation
==================================================================
HomeVerse Project - Milestone 5

Executes the authoritative G5 benchmark across the 75-layout unseen test set (225 images):
  Group 1: Dimensioned Plans (79 images)      -> Matched OCR Dimension Text
  Group 2: Scale-Bar Plans (70 images)        -> Graphical Scale Bar Measurement
  Group 3: Reference-Object Plans (49 images) -> Reference Prior Tags & ViT Multi-Task Fallback
  Group 4: No-Scale Plans (27 images)         -> Non-Hallucination & Relative Geometry Only

Evaluates:
  1. Calibration Coverage & Provenance Tracking (MEASURED, ESTIMATED, UNAVAILABLE)
  2. Scale Estimation MAPE (%) across all groups
  3. Room Area MAPE (%), Length MAE (m), Width MAE (m), Perimeter MAE (m), Wall Segment MAE (m)
  4. Rigorous 3-Scenario Mathematical Error Decomposition:
       Scenario 1: GT Polygon + Predicted Scale -> Isolates Scale Calibration Error
       Scenario 2: Predicted Polygon + GT Scale -> Isolates Geometric Segmentation Error
       Scenario 3: Predicted Polygon + Predicted Scale -> Measures End-to-End Area Error
  5. Statistical Distribution Standards: Median, Mean, P90, P95
  6. Enriched CAD Export (.dxf & .svg with metric dimensions, area m2, and provenance tags)
"""

import argparse
import html
import json
import math
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Tuple, Any, Optional

import cv2
import numpy as np
import torch
from PIL import Image, ImageDraw
from torch.utils.data import DataLoader
from shapely.geometry import Polygon

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
from run_experiment_g4b import (
    MultiTaskViT384G4B,
    rasterize_canonical_instance_masks,
)
from cad_vectorizer import (
    extract_unrefined_polygon,
    adaptive_polygon_simplification,
    snap_shared_boundaries,
    PARENT_COLORS_HEX,
)
from run_experiment_g4a import CHILD_TO_PARENT, PARENT_CLASSES
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
)
from metric_calibrator import MetricScaleCalibrator
from metric_geometry import (
    calculate_shoelace_area_px,
    calculate_polygon_perimeter_px,
    calculate_wall_segments,
    calculate_mabr_dimensions,
    calculate_form_factors,
    compute_physical_room_geometry,
    decompose_area_error,
)


def compute_distribution_stats(vals: List[float], multiplier: float = 1.0) -> Dict[str, float]:
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


PARENT_NAME_TO_COLOR = {
    "Living Area": "#4169E1",
    "Sleeping Area": "#8A2BE2",
    "Cooking Area": "#FF8C00",
    "Sanitary Area": "#00BFFF",
    "Circulation Area": "#20B2AA",
    "Outdoor Area": "#32CD32",
    "Utility Area": "#DAA520",
    "Storage Area": "#8B4513",
    "Vehicle Area": "#708090",
}


def export_enriched_svg(
    rooms: List[Dict[str, Any]],
    scale_meta: Dict[str, Any],
    filepath: Path,
    img_size: Tuple[int, int] = (1024, 1024),
):
    """Exports interactive SVG with metric room dimensions, area m2, and provenance metadata."""
    w, h = img_size
    svg_lines = [
        f'<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">',
        f'  <rect width="{w}" height="{h}" fill="#f8fafc" />',
        f'  <!-- Header Metadata -->',
        f'  <g id="metadata" font-family="sans-serif" font-size="14" fill="#0f172a">',
        f'    <text x="20" y="30" font-weight="bold">HomeVerse Architectural Metric Plan</text>',
        f'    <text x="20" y="50" fill="#64748b">Scale: {scale_meta.get("scale_px_per_m", "N/A")} px/m | Provenance: {scale_meta.get("provenance", "UNAVAILABLE")} | Confidence: {scale_meta.get("confidence", 0.0)*100:.0f}%</text>',
        f'  </g>',
        f'  <g id="rooms" stroke-linejoin="round" stroke-linecap="round">',
    ]

    for r in rooms:
        poly = r.get("polygon_pixels", [])
        if not poly or len(poly) < 3:
            continue
        c_name = r.get("room_type", "Room")
        p_name = r.get("parent_category", "Living Area")
        color = PARENT_NAME_TO_COLOR.get(p_name, "#64748b")
        pts_str = " ".join(f"{x:.1f},{y:.1f}" for x, y in poly)
        
        area_m2_str = f"{r.get('area_m2', 0.0):.2f} m²" if r.get("area_m2") is not None else f"{r.get('area_px2', 0.0):.0f} px²"
        mabr = r.get("mabr", {})
        l_str = f"{mabr.get('length_m', 0.0):.2f}" if mabr.get("length_m") is not None else f"{mabr.get('length_px', 0.0):.0f}px"
        w_str = f"{mabr.get('width_m', 0.0):.2f}" if mabr.get("width_m") is not None else f"{mabr.get('width_px', 0.0):.0f}px"
        dims_str = f"{l_str} x {w_str} m" if mabr.get("length_m") is not None else f"{l_str} x {w_str}"

        cx = sum(p[0] for p in poly) / len(poly)
        cy = sum(p[1] for p in poly) / len(poly)

        svg_lines.append(
            f'    <polygon points="{pts_str}" fill="{color}" fill-opacity="0.25" stroke="{color}" stroke-width="2">'
            f'<title>{html.escape(c_name)} ({html.escape(p_name)})&#10;Dims: {dims_str}&#10;Area: {area_m2_str}&#10;Solidity: {r.get("solidity", 1.0):.2f}</title></polygon>'
        )
        svg_lines.append(
            f'    <text x="{cx:.1f}" y="{cy - 8:.1f}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">{html.escape(c_name)}</text>'
        )
        svg_lines.append(
            f'    <text x="{cx:.1f}" y="{cy + 10:.1f}" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">{dims_str}</text>'
        )
        svg_lines.append(
            f'    <text x="{cx:.1f}" y="{cy + 25:.1f}" font-family="sans-serif" font-size="11" font-weight="600" fill="#0284c7" text-anchor="middle">{area_m2_str}</text>'
        )

    svg_lines.append('  </g>')
    svg_lines.append('</svg>')
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(svg_lines))


def export_enriched_dxf(
    rooms: List[Dict[str, Any]],
    scale_meta: Dict[str, Any],
    filepath: Path,
):
    """Exports AutoCAD DXF file with closed polylines, layer assignments, and metric room text labels."""
    try:
        import ezdxf
    except ImportError:
        return

    doc = ezdxf.new("R2000")
    msp = doc.modelspace()

    # Create CAD layers
    for p_name, col_idx in [
        ("Living Area", 1), ("Sleeping Area", 3), ("Cooking Area", 2),
        ("Sanitary Area", 4), ("Circulation Area", 7), ("Outdoor Area", 5),
        ("Utility Area", 6), ("Storage Area", 8), ("Vehicle Area", 9),
    ]:
        if p_name not in doc.layers:
            doc.layers.new(name=p_name, dxfattribs={"color": col_idx})
    if "DIMENSIONS" not in doc.layers:
        doc.layers.new(name="DIMENSIONS", dxfattribs={"color": 7})

    for r in rooms:
        poly = r.get("polygon_pixels", [])
        if not poly or len(poly) < 3:
            continue
        p_name = r.get("parent_category", "Living Area")
        c_name = r.get("room_type", "Room")
        # In DXF Y-coordinates are inverted from raster
        dxf_pts = [(float(x), float(1024 - y)) for x, y in poly]

        msp.add_lwpolyline(dxf_pts, close=True, dxfattribs={"layer": p_name})

        # Text label with metric dimensions and area
        cx = sum(p[0] for p in dxf_pts) / len(dxf_pts)
        cy = sum(p[1] for p in dxf_pts) / len(dxf_pts)
        mabr = r.get("mabr", {})
        area_str = f"{r.get('area_m2', 0.0):.2f}m2" if r.get("area_m2") is not None else f"{r.get('area_px2', 0.0):.0f}px2"
        l_str = f"{mabr.get('length_m', 0.0):.2f}" if mabr.get("length_m") is not None else ""
        w_str = f"{mabr.get('width_m', 0.0):.2f}" if mabr.get("width_m") is not None else ""
        label_txt = f"{c_name}\\P{l_str}x{w_str}m\\P{area_str}" if l_str else f"{c_name}\\P{area_str}"

        msp.add_mtext(
            label_txt,
            dxfattribs={
                "layer": "DIMENSIONS",
                "char_height": 12.0,
                "attachment_point": 5,  # Middle Center
                "insert": (cx, cy),
            }
        )

    doc.saveas(str(filepath))


def run_experiment_g5(conf_thresh: float = 0.20, img_size: int = 384):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 80, flush=True)
    print("EXPERIMENT G5: METRIC GEOMETRY & DIMENSION CALIBRATION BENCHMARK", flush=True)
    print(f"Device: {device} | Image Size: {img_size} | Nominal Conf Thresh: {conf_thresh:.2f}", flush=True)
    print("Primary Candidate Checkpoint: checkpoints/multitask/experiment_g4b_best.pt", flush=True)
    print("=" * 80, flush=True)

    # 1. Load Balanced 75-Layout Test Partition
    print("\nLoading authoritative 75-layout test partition (225 images)...", flush=True)
    te_lids, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)
    print(f"Loaded {len(test_samples)} test samples across {len(te_lids)} unique layouts.", flush=True)

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

    # 2. Load Frozen G4-B Primary Candidate
    g4b_ckpt_path = Path("checkpoints/multitask/experiment_g4b_best.pt")
    if not g4b_ckpt_path.exists():
        raise FileNotFoundError(f"Checkpoint not found: {g4b_ckpt_path}")

    print(f"Loading frozen G4-B Primary Candidate: {g4b_ckpt_path}...", flush=True)
    model = MultiTaskViT384G4B(img_size=img_size).to(device)
    model.load_state_dict(torch.load(g4b_ckpt_path, map_location=device), strict=False)
    model.eval()

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    calibrator = MetricScaleCalibrator()

    # 3. Accumulators Stratified by Group
    GROUPS = ["dimensioned", "scale-bar", "reference-object", "no-scale"]
    group_stats = {g: {
        "images_count": 0,
        "calibrated_count": 0,
        "uncalibrated_count": 0,
        "provenance_counts": {"MEASURED": 0, "ESTIMATED": 0, "UNAVAILABLE": 0},
        "scale_errors_pct": [],
        "room_area_errors_pct": [],
        "room_length_errors_m": [],
        "room_width_errors_m": [],
        "room_perimeter_errors_m": [],
        "wall_segment_errors_m": [],
        # Error decomposition accumulators:
        "scen1_calib_errors_pct": [],
        "scen2_geom_errors_pct": [],
        "scen3_total_errors_pct": [],
        "eps_pixel_vals": [],
        "eps_scale_vals": [],
        # Relative geometry accumulators (Group 4):
        "aspect_ratio_errors_pct": [],
        "solidity_errors": [],
    } for g in GROUPS}

    cad_export_dir = Path("evaluation_results/g5_cad_exports")
    cad_export_dir.mkdir(parents=True, exist_ok=True)
    exported_sample_indices = [0, 3, 7, 12, 25, 42, 60]

    print("\nExecuting G5 Multi-Modal Calibration & Metric Dimension Evaluation...", flush=True)
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

            indices = matcher(pred_logits, pred_boxes_1, targets)
            bs = images.size(0)

            for b in range(bs):
                current_sample_idx = sample_global_idx
                sample_global_idx += 1

                meta = targets[b].get("sample_meta", {})
                scale_mode = meta.get("scale_mode", "no-scale")
                img_path = Path("HomeVerse-Dataset") / meta.get("image_path", "")
                gt_rooms = meta.get("rooms", [])
                valid_gt_rooms = [r for r in gt_rooms if r.get("type") in LABEL2ID]
                gt_masks = targets[b]["masks"].numpy() if "masks" in targets[b] else np.zeros((0, 96, 96))
                
                gt_ppm = meta.get("pixels_per_meter")
                raw_gt_ppm = meta.get("raw_pixels_per_meter", 68.0)
                effective_gt_ppm = gt_ppm if gt_ppm is not None else raw_gt_ppm
                gt_scale_s = 1.0 / max(1e-4, effective_gt_ppm)

                vit_pred_ppm = float(pred_scales[b].item())

                # Step 1: Extract all detected room boxes in pixel space for calibrator
                s_idx, t_idx = indices[b]
                q_to_gt = {s_idx[k].item(): t_idx[k].item() for k in range(len(t_idx))}

                # Extract Tier 3 refined polygons for all queries
                query_rooms = []
                for q_i in range(pred_masks_prob.size(1)):
                    m_prob = pred_masks_prob[b, q_i].cpu().numpy()
                    raw_poly = extract_unrefined_polygon(m_prob, orig_size=(1024, 1024), threshold=0.50)
                    if raw_poly and len(raw_poly) >= 3:
                        refined_poly = adaptive_polygon_simplification(
                            raw_poly, epsilon_factor=0.012, max_eps_px=3.0, protect_non_convex=True
                        )
                        c_idx = pred_logits[b, q_i].argmax(-1).item()
                        r_name = ROOM_CLASSES[c_idx] if c_idx < NUM_ROOM_CLASSES else "Room"
                        query_rooms.append({
                            "query_id": q_i,
                            "polygon_tier2": raw_poly,
                            "polygon_tier3": refined_poly,
                            "type": r_name,
                        })

                # Snap shared boundaries across all rooms in this floor plan
                if len(query_rooms) >= 2:
                    query_rooms = snap_shared_boundaries(query_rooms, snap_tolerance_px=8.0)

                snapped_polygons = {
                    r["query_id"]: r["polygon_tier3"]
                    for r in query_rooms
                    if r.get("polygon_tier3") and len(r.get("polygon_tier3", [])) >= 3
                }

                detected_rooms_for_calib = []
                for r in query_rooms:
                    poly = r.get("polygon_tier3")
                    if not poly or len(poly) < 3:
                        continue
                    mabr_px = calculate_mabr_dimensions(poly)
                    np_pts = np.array(poly)
                    min_x, min_y = np_pts[:, 0].min(), np_pts[:, 1].min()
                    max_x, max_y = np_pts[:, 0].max(), np_pts[:, 1].max()
                    detected_rooms_for_calib.append({
                        "query_id": r["query_id"],
                        "type": r["type"],
                        "bbox_pixels": [min_x, min_y, max_x - min_x, max_y - min_y],
                        "pixel_width": mabr_px["width_px"],
                        "pixel_length": mabr_px["length_px"],
                    })

                # Step 2: Run Metric Scale Calibrator
                calib_res = calibrator.calibrate(
                    image_input=img_path,
                    detected_rooms=detected_rooms_for_calib,
                    vit_scale_prediction=vit_pred_ppm,
                    scale_mode_hint=scale_mode,
                )

                g_data = group_stats[scale_mode]
                g_data["images_count"] += 1
                prov = calib_res["provenance"]
                g_data["provenance_counts"][prov] += 1

                if calib_res["is_calibrated"]:
                    g_data["calibrated_count"] += 1
                else:
                    g_data["uncalibrated_count"] += 1

                calib_ppm = calib_res["scale_px_per_m"]
                calib_scale_s = calib_res["scale_m_per_px"]

                # Scale estimation MAPE (for Groups 1, 2, 3)
                if calib_res["is_calibrated"] and gt_ppm is not None and gt_ppm > 0:
                    scale_err_pct = abs(calib_ppm - gt_ppm) / gt_ppm * 100.0
                    g_data["scale_errors_pct"].append(scale_err_pct)

                # Step 3: Match predicted rooms to GT rooms and evaluate physical geometry
                enriched_rooms_for_cad = []

                for k in range(len(t_idx)):
                    q_i = s_idx[k].item()
                    gt_r_i = t_idx[k].item()
                    if gt_r_i >= len(valid_gt_rooms):
                        continue

                    r_info = valid_gt_rooms[gt_r_i]
                    gt_poly_norm = r_info.get("polygon", [])
                    if len(gt_poly_norm) < 3:
                        continue

                    # Ground Truth Geometry in native 1024x1024 space
                    gt_poly_px = [(float(x) * 1024.0, float(y) * 1024.0) for x, y in gt_poly_norm]
                    gt_area_px = calculate_shoelace_area_px(gt_poly_px)
                    gt_mabr = calculate_mabr_dimensions(gt_poly_px, gt_scale_s)
                    gt_walls = calculate_wall_segments(gt_poly_px, gt_scale_s)
                    gt_perim_m = calculate_polygon_perimeter_px(gt_poly_px) * gt_scale_s
                    gt_form = calculate_form_factors(gt_poly_px)

                    # Official GT metric dimensions
                    gt_w_m = r_info.get("width_m", r_info.get("dimensions", {}).get("width_m", gt_mabr.get("width_m", 3.0)))
                    gt_l_m = r_info.get("length_m", r_info.get("dimensions", {}).get("length_m", gt_mabr.get("length_m", 4.0)))
                    gt_a_m2 = r_info.get("area_m2", r_info.get("dimensions", {}).get("area_m2", gt_w_m * gt_l_m))
                    gt_len_m = max(gt_w_m, gt_l_m)
                    gt_wid_m = min(gt_w_m, gt_l_m)

                    # Predicted CAD Geometry
                    pred_poly_px = snapped_polygons.get(q_i, [])
                    if not pred_poly_px or len(pred_poly_px) < 3:
                        continue

                    pred_area_px = calculate_shoelace_area_px(pred_poly_px)
                    pred_form = calculate_form_factors(pred_poly_px)

                    child_cls_idx = pred_logits[b, q_i].argmax(-1).item()
                    room_type_name = ROOM_CLASSES[child_cls_idx] if child_cls_idx < NUM_ROOM_CLASSES else r_info.get("type", "Room")
                    parent_cat_name = CHILD_TO_PARENT.get(room_type_name, "Living Area")

                    # Geometric derivation
                    pred_geom = compute_physical_room_geometry(
                        pred_poly_px,
                        scale_m_per_px=calib_scale_s,
                        room_type=room_type_name,
                    )
                    pred_mabr = pred_geom["mabr"]

                    # Pack for CAD export
                    enriched_rooms_for_cad.append({
                        "room_type": room_type_name,
                        "parent_category": parent_cat_name,
                        "polygon_pixels": pred_poly_px,
                        "area_px2": pred_area_px,
                        "area_m2": pred_geom.get("area_m2"),
                        "mabr": pred_mabr,
                        "solidity": pred_form.get("solidity", 1.0),
                    })

                    # If Calibrated (Groups 1, 2, 3):
                    if calib_res["is_calibrated"]:
                        pred_a_m2 = pred_geom.get("area_m2", 0.0)
                        pred_len_m = pred_mabr.get("length_m", 0.0)
                        pred_wid_m = pred_mabr.get("width_m", 0.0)
                        pred_perim_m = pred_geom.get("perimeter_m", 0.0)

                        if gt_a_m2 > 0 and pred_a_m2 is not None:
                            area_err_pct = abs(pred_a_m2 - gt_a_m2) / gt_a_m2 * 100.0
                            g_data["room_area_errors_pct"].append(area_err_pct)

                        if pred_len_m is not None:
                            g_data["room_length_errors_m"].append(abs(pred_len_m - gt_len_m))
                        if pred_wid_m is not None:
                            g_data["room_width_errors_m"].append(abs(pred_wid_m - gt_wid_m))
                        if pred_perim_m is not None:
                            g_data["room_perimeter_errors_m"].append(abs(pred_perim_m - gt_perim_m))

                        # Wall segments MAE
                        pred_walls = pred_geom.get("wall_segments", [])
                        if pred_walls and gt_walls:
                            # Match closest wall segment lengths
                            pw_lens = sorted([w["length_m"] for w in pred_walls if w.get("length_m") is not None])
                            gw_lens = sorted([w["length_m"] for w in gt_walls if w.get("length_m") is not None])
                            min_len = min(len(pw_lens), len(gw_lens))
                            for wl_i in range(min_len):
                                g_data["wall_segment_errors_m"].append(abs(pw_lens[wl_i] - gw_lens[wl_i]))

                        # Error Decomposition (3 Scenarios)
                        decomp = decompose_area_error(
                            area_px_pred=pred_area_px,
                            area_px_gt=gt_area_px,
                            scale_pred=calib_scale_s,
                            scale_gt=gt_scale_s,
                        )
                        if decomp["scenario1_calibration_error"] is not None:
                            g_data["scen1_calib_errors_pct"].append(decomp["scenario1_calibration_error"] * 100.0)
                        if decomp["scenario2_geometry_error"] is not None:
                            g_data["scen2_geom_errors_pct"].append(decomp["scenario2_geometry_error"] * 100.0)
                        if decomp["scenario3_total_error"] is not None:
                            g_data["scen3_total_errors_pct"].append(decomp["scenario3_total_error"] * 100.0)
                        if decomp["eps_pixel"] is not None:
                            g_data["eps_pixel_vals"].append(decomp["eps_pixel"])
                        if decomp["eps_scale"] is not None:
                            g_data["eps_scale_vals"].append(decomp["eps_scale"])

                    else:
                        # Group 4 (no-scale): Relative Geometry & Pure Geometry Error
                        decomp = decompose_area_error(
                            area_px_pred=pred_area_px,
                            area_px_gt=gt_area_px,
                            scale_pred=None,
                            scale_gt=gt_scale_s,
                        )
                        if decomp["scenario2_geometry_error"] is not None:
                            g_data["scen2_geom_errors_pct"].append(decomp["scenario2_geometry_error"] * 100.0)

                        gt_ar = gt_mabr.get("aspect_ratio", 1.0)
                        pred_ar = pred_mabr.get("aspect_ratio", 1.0)
                        if gt_ar > 0:
                            g_data["aspect_ratio_errors_pct"].append(abs(pred_ar - gt_ar) / gt_ar * 100.0)

                        g_data["solidity_errors"].append(abs(pred_form.get("solidity", 1.0) - gt_form.get("solidity", 1.0)))

                # Enriched CAD Exports for selected diagnostic samples
                if current_sample_idx in exported_sample_indices:
                    sample_dxf_path = cad_export_dir / f"metric_floorplan_sample_{current_sample_idx}.dxf"
                    sample_svg_path = cad_export_dir / f"metric_floorplan_sample_{current_sample_idx}.svg"
                    export_enriched_dxf(enriched_rooms_for_cad, calib_res, sample_dxf_path)
                    export_enriched_svg(enriched_rooms_for_cad, calib_res, sample_svg_path)

            if (batch_idx + 1) % 3 == 0 or (batch_idx + 1) == len(test_loader):
                elapsed = time.time() - t0_eval
                print(f"Processed batch {batch_idx + 1}/{len(test_loader)} ({sample_global_idx}/225 images, {elapsed:.1f}s elapsed)...", flush=True)

    total_eval_time = time.time() - t0_eval
    print(f"\nEvaluation finished in {total_eval_time:.1f}s.", flush=True)

    # 4. Compute Statistical Metrics per Group
    print("\n" + "=" * 80)
    print("EXPERIMENT G5: BENCHMARK RESULTS & ERROR DECOMPOSITION")
    print("=" * 80)

    summary_results = {
        "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_test_images": sample_global_idx,
        "evaluation_time_seconds": round(total_eval_time, 1),
        "groups": {},
    }

    for g_name in GROUPS:
        g = group_stats[g_name]
        cov_pct = (g["calibrated_count"] / max(1, g["images_count"])) * 100.0
        
        scale_stats = compute_distribution_stats(g["scale_errors_pct"])
        area_stats = compute_distribution_stats(g["room_area_errors_pct"])
        len_stats = compute_distribution_stats(g["room_length_errors_m"])
        wid_stats = compute_distribution_stats(g["room_width_errors_m"])
        perim_stats = compute_distribution_stats(g["room_perimeter_errors_m"])
        wall_stats = compute_distribution_stats(g["wall_segment_errors_m"])

        scen1_stats = compute_distribution_stats(g["scen1_calib_errors_pct"])
        scen2_stats = compute_distribution_stats(g["scen2_geom_errors_pct"])
        scen3_stats = compute_distribution_stats(g["scen3_total_errors_pct"])

        print(f"\n[{g_name.upper()}] (N = {g['images_count']} images)")
        print(f"  Calibration Coverage: {g['calibrated_count']}/{g['images_count']} ({cov_pct:.1f}%) | Provenance: {g['provenance_counts']}")

        if g_name != "no-scale":
            print(f"  Scale Estimation MAPE (%):  Median={scale_stats['median']:.2f}% | Mean={scale_stats['mean']:.2f}% | P90={scale_stats['p90']:.2f}% | P95={scale_stats['p95']:.2f}%")
            print(f"  Room Area MAPE (%):        Median={area_stats['median']:.2f}% | Mean={area_stats['mean']:.2f}% | P90={area_stats['p90']:.2f}% | P95={area_stats['p95']:.2f}%")
            print(f"  Room Length MAE (m):       Median={len_stats['median']:.3f}m | Mean={len_stats['mean']:.3f}m | P90={len_stats['p90']:.3f}m | P95={len_stats['p95']:.3f}m")
            print(f"  Room Width MAE (m):        Median={wid_stats['median']:.3f}m | Mean={wid_stats['mean']:.3f}m | P90={wid_stats['p90']:.3f}m | P95={wid_stats['p95']:.3f}m")
            print(f"  Room Perimeter MAE (m):    Median={perim_stats['median']:.3f}m | Mean={perim_stats['mean']:.3f}m | P90={perim_stats['p90']:.3f}m | P95={perim_stats['p95']:.3f}m")
            print(f"  Wall Segment MAE (m):      Median={wall_stats['median']:.3f}m | Mean={wall_stats['mean']:.3f}m | P90={wall_stats['p90']:.3f}m | P95={wall_stats['p95']:.3f}m")

            print(f"  --- ERROR DECOMPOSITION ---")
            print(f"  Scenario 1 (Pure Calibration Error): Median={scen1_stats['median']:.2f}% | Mean={scen1_stats['mean']:.2f}%")
            print(f"  Scenario 2 (Pure Geometry Error):    Median={scen2_stats['median']:.2f}% | Mean={scen2_stats['mean']:.2f}%")
            print(f"  Scenario 3 (End-to-End Area Error):  Median={scen3_stats['median']:.2f}% | Mean={scen3_stats['mean']:.2f}%")
        else:
            # Group 4 Non-Hallucination
            non_halluc_rate = (g["uncalibrated_count"] / max(1, g["images_count"])) * 100.0
            ar_stats = compute_distribution_stats(g["aspect_ratio_errors_pct"])
            sol_stats = compute_distribution_stats(g["solidity_errors"])
            print(f"  Non-Hallucination Compliance: {g['uncalibrated_count']}/{g['images_count']} ({non_halluc_rate:.1f}%) [Target: 100.0%]")
            print(f"  Pure Geometry Error (Scen 2): Median={scen2_stats['median']:.2f}% | Mean={scen2_stats['mean']:.2f}%")
            print(f"  Aspect Ratio Error (%):       Median={ar_stats['median']:.2f}% | Mean={ar_stats['mean']:.2f}%")
            print(f"  Solidity Error:               Median={sol_stats['median']:.4f} | Mean={sol_stats['mean']:.4f}")

        summary_results["groups"][g_name] = {
            "images_count": g["images_count"],
            "calibrated_count": g["calibrated_count"],
            "uncalibrated_count": g["uncalibrated_count"],
            "calibration_coverage_pct": round(cov_pct, 2),
            "provenance_counts": g["provenance_counts"],
            "scale_mape": scale_stats,
            "room_area_mape": area_stats,
            "room_length_mae_m": len_stats,
            "room_width_mae_m": wid_stats,
            "room_perimeter_mae_m": perim_stats,
            "wall_segment_mae_m": wall_stats,
            "error_decomposition": {
                "scenario1_pure_calibration_error_pct": scen1_stats,
                "scenario2_pure_geometry_error_pct": scen2_stats,
                "scenario3_end_to_end_area_error_pct": scen3_stats,
            }
        }

    # Aggregate Over All Calibrated Groups (Groups 1, 2, 3)
    all_calib_area_errs = (
        group_stats["dimensioned"]["room_area_errors_pct"] +
        group_stats["scale-bar"]["room_area_errors_pct"] +
        group_stats["reference-object"]["room_area_errors_pct"]
    )
    all_calib_scale_errs = (
        group_stats["dimensioned"]["scale_errors_pct"] +
        group_stats["scale-bar"]["scale_errors_pct"] +
        group_stats["reference-object"]["scale_errors_pct"]
    )
    all_calib_scen1 = (
        group_stats["dimensioned"]["scen1_calib_errors_pct"] +
        group_stats["scale-bar"]["scen1_calib_errors_pct"] +
        group_stats["reference-object"]["scen1_calib_errors_pct"]
    )
    all_calib_scen2 = (
        group_stats["dimensioned"]["scen2_geom_errors_pct"] +
        group_stats["scale-bar"]["scen2_geom_errors_pct"] +
        group_stats["reference-object"]["scen2_geom_errors_pct"] +
        group_stats["no-scale"]["scen2_geom_errors_pct"]
    )
    all_calib_scen3 = (
        group_stats["dimensioned"]["scen3_total_errors_pct"] +
        group_stats["scale-bar"]["scen3_total_errors_pct"] +
        group_stats["reference-object"]["scen3_total_errors_pct"]
    )

    agg_scale_stats = compute_distribution_stats(all_calib_scale_errs)
    agg_area_stats = compute_distribution_stats(all_calib_area_errs)
    agg_scen1 = compute_distribution_stats(all_calib_scen1)
    agg_scen2 = compute_distribution_stats(all_calib_scen2)
    agg_scen3 = compute_distribution_stats(all_calib_scen3)

    print("\n" + "-" * 80)
    print("AGGREGATE CALIBRATED GEOMETRY & ROOT-CAUSE RESOLUTION")
    print("-" * 80)
    print(f"Overall Calibrated Scale MAPE:   Median={agg_scale_stats['median']:.2f}% | Mean={agg_scale_stats['mean']:.2f}% | P90={agg_scale_stats['p90']:.2f}%")
    print(f"Overall Calibrated Area MAPE:    Median={agg_area_stats['median']:.2f}% | Mean={agg_area_stats['mean']:.2f}% | P90={agg_area_stats['p90']:.2f}%")
    print(f"\nROOT CAUSE DECOMPOSITION OF 53.55% G4-C ERROR:")
    print(f"  * Scenario 2 (Pure Geometry Error with GT Scale):      Median={agg_scen2['median']:.2f}% | Mean={agg_scen2['mean']:.2f}%")
    print(f"  * Scenario 1 (Pure Calibration Error with GT Geom):   Median={agg_scen1['median']:.2f}% | Mean={agg_scen1['mean']:.2f}%")
    print(f"  * Scenario 3 (Compounded End-to-End Area Error):      Median={agg_scen3['median']:.2f}% | Mean={agg_scen3['mean']:.2f}%")
    print("-" * 80)

    summary_results["aggregate"] = {
        "overall_calibrated_scale_mape": agg_scale_stats,
        "overall_calibrated_area_mape": agg_area_stats,
        "scenario1_pure_calibration": agg_scen1,
        "scenario2_pure_geometry": agg_scen2,
        "scenario3_compounded_total": agg_scen3,
    }

    # Save Results
    results_path = Path("evaluation_results/experiment_g5_results.json")
    results_path.parent.mkdir(parents=True, exist_ok=True)
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(summary_results, f, indent=2)
    print(f"\nSaved G5 evaluation results to: {results_path}")

    return summary_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Experiment G5 Evaluation")
    parser.add_argument("--conf_thresh", type=float, default=0.20, help="Confidence threshold")
    parser.add_argument("--img_size", type=int, default=384, help="Image resolution")
    args = parser.parse_args()

    run_experiment_g5(conf_thresh=args.conf_thresh, img_size=args.img_size)
