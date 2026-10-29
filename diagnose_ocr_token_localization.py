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
    printed_dim1_m = parsed.get("dim1_m")
    printed_dim2_m = parsed.get("dim2_m")

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
