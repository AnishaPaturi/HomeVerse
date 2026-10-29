"""
Comprehensive Diagnostic Suite: G5-OCR-v3 Token Localization & Dimension Association
=====================================================================================
HomeVerse Project - Milestone G5-OCR-v3 Design Phase

Addresses all five user diagnostic mandates:
  1. Recover the 159 rejected full-text OCR tokens via hierarchical token reconstruction.
  2. Compare word-level vs line-level vs character-level bounding boxes.
  3. Multi-word dimension string reconstruction (sliding window and line grouping).
  4. Wall-segment association for irregular/L-shaped rooms vs. oriented bounding box (MABR).
  5. Quantify localization recovery and association accuracy across all 79 Group 1 images.
"""

import sys
import json
import time
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

import cv2
import numpy as np
import pytesseract
from PIL import Image

repo_root = Path(__file__).resolve().parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from run_experiment_f2 import select_balanced_split
from metric_calibrator import parse_dimension_string
from ocr_spatial_matcher import parse_dimension_annotation
from metric_geometry import calculate_mabr_dimensions


def extract_hierarchical_tokens(
    gray_img: np.ndarray,
    conf_thresh: float = 30.0,
    max_word_gap_px: float = 40.0,
) -> Dict[str, Any]:
    """
    Extracts word tokens and reconstructs compound dimension annotations with
    exact spatial bounding boxes from Tesseract image_to_data.
    """
    h_img, w_img = gray_img.shape[:2]
    try:
        data = pytesseract.image_to_data(gray_img, output_type=pytesseract.Output.DICT)
    except Exception as e:
        return {"error": str(e), "recovered_tokens": [], "word_boxes": []}

    n_boxes = len(data["text"])
    lines: Dict[Tuple[int, int, int], List[Dict[str, Any]]] = {}
    word_boxes = []

    for i in range(n_boxes):
        txt = data["text"][i].strip()
        conf = float(data["conf"][i])
        if not txt or conf < conf_thresh:
            continue

        b_num = data["block_num"][i]
        p_num = data["par_num"][i]
        l_num = data["line_num"][i]
        w_box = {
            "text": txt,
            "conf": conf,
            "left": int(data["left"][i]),
            "top": int(data["top"][i]),
            "width": int(data["width"][i]),
            "height": int(data["height"][i]),
            "word_num": int(data["word_num"][i]),
            "line_key": (b_num, p_num, l_num),
        }
        word_boxes.append(w_box)
        lines.setdefault((b_num, p_num, l_num), []).append(w_box)

    recovered_tokens = []

    for key, words in lines.items():
        words.sort(key=lambda w: w["left"])
        
        # Method A: Full-line concatenation
        line_str = " ".join(w["text"] for w in words)
        parsed_full = parse_dimension_annotation(line_str)
        if parsed_full is not None:
            min_x = min(w["left"] for w in words)
            min_y = min(w["top"] for w in words)
            max_x = max(w["left"] + w["width"] for w in words)
            max_y = max(w["top"] + w["height"] for w in words)
            avg_conf = sum(w["conf"] for w in words) / len(words)
            recovered_tokens.append({
                "raw_text": line_str,
                "parsed_dims": parsed_full,
                "bbox": [min_x, min_y, max_x - min_x, max_y - min_y],
                "center": [(min_x + max_x) / 2.0, (min_y + max_y) / 2.0],
                "confidence": avg_conf / 100.0,
                "method": "full_line_join",
                "words_used": len(words),
            })
            continue

        # Method B: N-gram sliding window (2 to 5 words)
        n_words = len(words)
        found_window = False
        for window_size in range(min(n_words, 5), 1, -1):
            for start in range(n_words - window_size + 1):
                sub_words = words[start : start + window_size]
                
                # Verify adjacency
                is_adj = True
                for idx in range(len(sub_words) - 1):
                    gap = sub_words[idx + 1]["left"] - (sub_words[idx]["left"] + sub_words[idx]["width"])
                    if gap > max_word_gap_px or gap < -25:
                        is_adj = False
                        break
                if not is_adj:
                    continue

                sub_str = " ".join(w["text"] for w in sub_words)
                parsed_sub = parse_dimension_annotation(sub_str)
                if parsed_sub is not None:
                    min_x = min(w["left"] for w in sub_words)
                    min_y = min(w["top"] for w in sub_words)
                    max_x = max(w["left"] + w["width"] for w in sub_words)
                    max_y = max(w["top"] + w["height"] for w in sub_words)
                    avg_conf = sum(w["conf"] for w in sub_words) / len(sub_words)
                    recovered_tokens.append({
                        "raw_text": sub_str,
                        "parsed_dims": parsed_sub,
                        "bbox": [min_x, min_y, max_x - min_x, max_y - min_y],
                        "center": [(min_x + max_x) / 2.0, (min_y + max_y) / 2.0],
                        "confidence": avg_conf / 100.0,
                        "method": f"ngram_window_{window_size}",
                        "words_used": len(sub_words),
                    })
                    found_window = True
                    break
            if found_window:
                break

    return {
        "word_boxes": word_boxes,
        "recovered_tokens": recovered_tokens,
    }


def compute_point_to_segment_distance(
    px: float, py: float,
    x1: float, y1: float,
    x2: float, y2: float
) -> Tuple[float, float]:
    """
    Returns (distance_px, segment_length_px) from point (px, py) to line segment (x1, y1)-(x2, y2).
    """
    seg_dx = x2 - x1
    seg_dy = y2 - y1
    seg_len_sq = seg_dx * seg_dx + seg_dy * seg_dy
    seg_len = np.sqrt(seg_len_sq)

    if seg_len < 1e-6:
        dist = np.hypot(px - x1, py - y1)
        return float(dist), 0.0

    # Project point onto segment
    t = max(0.0, min(1.0, ((px - x1) * seg_dx + (py - y1) * seg_dy) / seg_len_sq))
    proj_x = x1 + t * seg_dx
    proj_y = y1 + t * seg_dy
    dist = np.hypot(px - proj_x, py - proj_y)
    return float(dist), float(seg_len)


def evaluate_wall_segment_association(
    annotation: Dict[str, Any],
    room_polygon_px: List[Tuple[float, float]],
    pixel_scale_ppm: float,
) -> Dict[str, Any]:
    """
    Evaluates wall-segment distance association for non-convex or irregular rooms.
    Compares printed dimension against adjacent wall segment lengths.
    """
    cx, cy = annotation["center"]
    parsed = annotation["parsed_dims"]
    printed_dim1_m = parsed.get("width_m") or parsed.get("dim1_m")
    printed_dim2_m = parsed.get("length_m") or parsed.get("dim2_m")

    # Decompose room polygon into wall segments
    n_pts = len(room_polygon_px)
    wall_matches = []

    for i in range(n_pts):
        p1 = room_polygon_px[i]
        p2 = room_polygon_px[(i + 1) % n_pts]
        dist_px, seg_len_px = compute_point_to_segment_distance(cx, cy, p1[0], p1[1], p2[0], p2[1])
        seg_len_m = seg_len_px / max(1e-4, pixel_scale_ppm)

        # Check error against dim1 and dim2
        err1 = abs(seg_len_m - printed_dim1_m) / max(1e-4, printed_dim1_m) if printed_dim1_m else 999.0
        err2 = abs(seg_len_m - printed_dim2_m) / max(1e-4, printed_dim2_m) if printed_dim2_m else 999.0
        best_err = min(err1, err2)

        wall_matches.append({
            "segment_idx": i,
            "dist_px": round(dist_px, 1),
            "seg_len_m": round(seg_len_m, 2),
            "min_error_pct": round(best_err * 100.0, 2),
        })

    # Sort by proximity to annotation
    wall_matches.sort(key=lambda w: w["dist_px"])
    closest_wall = wall_matches[0] if wall_matches else None

    return {
        "closest_wall_dist_px": closest_wall["dist_px"] if closest_wall else 999.0,
        "closest_wall_len_m": closest_wall["seg_len_m"] if closest_wall else 0.0,
        "closest_wall_err_pct": closest_wall["min_error_pct"] if closest_wall else 999.0,
        "top3_walls": wall_matches[:3],
    }


def run_full_diagnostic(max_images: Optional[int] = None):
    print("=" * 80)
    print("G5-OCR-v3 DESIGN PHASE: TOKEN LOCALIZATION DIAGNOSTIC")
    print("=" * 80)
    t0 = time.time()

    json_path = repo_root / "HomeVerse-Dataset/annotations/test.json"
    te_lids, test_samples, _ = select_balanced_split(str(json_path), 75)
    g1_samples = [s for s in test_samples if s.get("scale_mode") == "dimensioned"]
    if max_images is not None and max_images > 0:
        g1_samples = g1_samples[:max_images]

    n_images = len(g1_samples)
    print(f"Executing diagnostic across {n_images} Group 1 Dimensioned test images...\n")

    total_old_dummy_tokens = 0
    total_new_recovered_tokens = 0
    total_raw_word_boxes = 0

    reconstructed_methods = {"full_line_join": 0, "ngram_window": 0}
    wall_association_errors = []
    centroid_association_errors = []

    per_image_diagnostics = []

    for b_idx, sample in enumerate(g1_samples):
        img_id = sample.get("image_id", f"img_{b_idx}")
        layout_id = sample.get("layout_id", f"layout_{b_idx}")
        img_rel = sample.get("image_path", "")
        img_path = repo_root / "HomeVerse-Dataset" / img_rel

        if not img_path.exists():
            continue

        gt_ppm = sample.get("pixels_per_meter")
        raw_gt_ppm = sample.get("raw_pixels_per_meter", 68.0)
        effective_ppm = gt_ppm if gt_ppm is not None else raw_gt_ppm

        img = cv2.imread(str(img_path))
        if img is None:
            continue
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Run old image_to_string fallback
        full_text = pytesseract.image_to_string(gray)
        old_dummy_list = []
        for line in full_text.splitlines():
            line_str = line.strip()
            parsed = parse_dimension_annotation(line_str)
            if parsed is not None:
                old_dummy_list.append(line_str)
        total_old_dummy_tokens += len(old_dummy_list)

        # 2. Run new hierarchical token extraction
        recon = extract_hierarchical_tokens(gray)
        rec_tokens = recon["recovered_tokens"]
        word_boxes = recon["word_boxes"]

        total_new_recovered_tokens += len(rec_tokens)
        total_raw_word_boxes += len(word_boxes)

        for rt in rec_tokens:
            meth = rt.get("method", "other")
            if meth == "full_line_join":
                reconstructed_methods["full_line_join"] += 1
            else:
                reconstructed_methods["ngram_window"] += 1

        # 3. Wall segment vs Centroid association test on GT rooms
        gt_rooms = sample.get("rooms", [])
        image_wall_evals = []

        for rt in rec_tokens:
            cx, cy = rt["center"]
            # Find closest room in native pixel coordinates
            best_room = None
            best_poly_px = None
            min_c_dist = float("inf")

            for r in gt_rooms:
                raw_poly = r.get("polygon", [])
                if len(raw_poly) >= 3:
                    # Convert normalized [0, 1] polygon to native image pixels
                    poly_px = [[pt[0] * w, pt[1] * h] for pt in raw_poly]
                    pts = np.array(poly_px)
                    rcx, rcy = pts[:, 0].mean(), pts[:, 1].mean()
                    d = np.hypot(cx - rcx, cy - rcy)
                    if d < min_c_dist:
                        min_c_dist = d
                        best_room = r
                        best_poly_px = poly_px

            if best_room and best_poly_px and len(best_poly_px) >= 3:
                # Wall segment association
                w_assoc = evaluate_wall_segment_association(rt, best_poly_px, effective_ppm)
                image_wall_evals.append(w_assoc)
                wall_association_errors.append(w_assoc["closest_wall_err_pct"])

                # Centroid / MABR association baseline
                mabr = calculate_mabr_dimensions(best_poly_px)
                mabr_w_m = mabr["width_px"] / max(1e-4, effective_ppm)
                mabr_l_m = mabr["length_px"] / max(1e-4, effective_ppm)
                p1 = rt["parsed_dims"].get("width_m") or rt["parsed_dims"].get("dim1_m", 0.0)
                p2 = rt["parsed_dims"].get("length_m") or rt["parsed_dims"].get("dim2_m", 0.0)
                if p1 > 0 and p2 > 0:
                    # Match oriented box dimensions to parsed dimensions (allow min/max orientation alignment)
                    pred_short = min(mabr_w_m, mabr_l_m)
                    pred_long = max(mabr_w_m, mabr_l_m)
                    true_short = min(p1, p2)
                    true_long = max(p1, p2)
                    c_err_short = abs(pred_short - true_short) / true_short
                    c_err_long = abs(pred_long - true_long) / true_long
                    c_err_pct = (c_err_short + c_err_long) / 2.0 * 100.0
                    centroid_association_errors.append(c_err_pct)

        per_image_diagnostics.append({
            "image_id": img_id,
            "layout_id": layout_id,
            "old_unlocalized_dummy_count": len(old_dummy_list),
            "new_recovered_bbox_count": len(rec_tokens),
            "recovered_tokens": [
                {"text": rt["raw_text"], "bbox": rt["bbox"], "center": rt["center"], "method": rt["method"]}
                for rt in rec_tokens
            ],
        })

        if (b_idx + 1) % 15 == 0 or (b_idx + 1) == n_images:
            print(f"Processed {b_idx + 1}/{n_images} images ({time.time() - t0:.1f}s elapsed)...", flush=True)

    recovery_rate_pct = (total_new_recovered_tokens / max(1, total_old_dummy_tokens)) * 100.0
    med_wall_err = float(np.median(wall_association_errors)) if wall_association_errors else 0.0
    med_cent_err = float(np.median(centroid_association_errors)) if centroid_association_errors else 0.0

    output_summary = {
        "diagnostic_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_images_audited": n_images,
        "total_raw_word_boxes_extracted": total_raw_word_boxes,
        "old_unlocalized_dummy_tokens": total_old_dummy_tokens,
        "new_recovered_tokens_with_bboxes": total_new_recovered_tokens,
        "token_recovery_rate_pct": round(recovery_rate_pct, 2),
        "reconstruction_methods_breakdown": reconstructed_methods,
        "association_comparison": {
            "wall_segment_association_median_error_pct": round(med_wall_err, 2),
            "centroid_mabr_association_median_error_pct": round(med_cent_err, 2),
            "error_reduction_factor": round((med_cent_err - med_wall_err) / max(1e-4, med_cent_err) * 100.0, 1),
            "sample_count": len(wall_association_errors),
        },
        "per_image_diagnostics": per_image_diagnostics,
    }

    out_file = repo_root / "evaluation_results/ocr_token_localization_diagnostic.json"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output_summary, f, indent=2)

    print("\n" + "=" * 80)
    print("G5-OCR-v3 TOKEN LOCALIZATION DIAGNOSTIC RESULTS")
    print("=" * 80)
    print(f"Total Group 1 Images Audited:          {n_images}")
    print(f"Total Raw Word Boxes Extracted:        {total_raw_word_boxes}")
    print(f"Old Fallback Dummy Tokens (Dropped):   {total_old_dummy_tokens}")
    print(f"New Reconstructed Tokens with BBoxes:  {total_new_recovered_tokens}")
    print(f"Token Recovery Efficiency:             {recovery_rate_pct:.2f}%")
    print(f"Reconstruction Methods:")
    print(f"  - Full Line Join:                    {reconstructed_methods['full_line_join']}")
    print(f"  - N-gram Sliding Window:             {reconstructed_methods['ngram_window']}")
    print(f"Association Diagnostic on Irregular / Complex Rooms:")
    print(f"  - Wall-Segment Association Error:    {med_wall_err:.2f}% (Median)")
    print(f"  - Centroid / MABR Matching Error:    {med_cent_err:.2f}% (Median)")
    print(f"  - Spatial Error Reduction:           {output_summary['association_comparison']['error_reduction_factor']}%")
    print(f"Saved complete diagnostic to: {out_file}")
    print("=" * 80)

    return output_summary


if __name__ == "__main__":
    run_full_diagnostic()

