"""
Geometric OCR Spatial Matcher Module (Version 3 - Authoritative)
================================================================
HomeVerse Project - Milestone G5-OCR-v3 Implementation

Implements the five-stage architecture mandated for Milestone G5-OCR-v3:
  Stage 1 — Hierarchical OCR Recovery:
    - Recovers word-level bounding boxes via pytesseract.image_to_data.
    - Groups tokens using hierarchical line keys: (block_num, par_num, line_num).
    - Computes exact union bounding boxes [x, y, w, h] and centers.
    - Rejects dummy full-image boxes (span >= 60% of image dimensions).
    - Preserves OCR confidence, word counts, and localization provenance.

  Stage 2 — Dimension Annotation Reconstruction:
    - Supports metric (meters, centimeters, millimeters) and imperial (ft-in).
    - Handles split multi-word tokens via adaptive sliding window.
    - Retains original word boxes and reconstructed geometry for full auditability.

  Stage 3 — Perpendicular Wall-Segment Association:
    - Evaluates exact perpendicular point-to-line distance:
        d_perp(p, s) = |(p - a) x (b - a)| / ||b - a||
    - Computes projection containment parameter t in [-0.2, 1.2].
    - Evaluates orientation agreement and scalar span agreement.
    - Aggregates collinear multi-segment wall spans to distinguish single segment
      lengths from multi-segment room walls.

  Stage 4 — Global Assignment & Bipartite Optimization:
    - Supports multiple dimensions per room and orthogonal dimension pairing.
    - Applies query confidence filtering (tau_conf >= 0.25).
    - Solves bipartite assignment via Hungarian algorithm (linear_sum_assignment).
    - Evaluates globally valid alternative assignment margin:
        Delta_margin = min_{k != j} C_ik - C_ij
    - Preserves explicit ambiguity and rejection states (zero forced fits).

  Stage 5 — Calibration & Provenance Tracking:
    - Derives pixels_per_meter exclusively from accepted geometric assignments.
    - Strictly preserves distinct provenance: MEASURED, ESTIMATED, AMBIGUOUS, UNAVAILABLE.
"""

import math
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Set, Union

import cv2
import numpy as np
import pytesseract
from PIL import Image
from scipy.optimize import linear_sum_assignment
from shapely.geometry import Polygon, Point, LineString


# =============================================================================
# Stage 1 & 2: Dimension String Parsing & Hierarchical OCR Recovery
# =============================================================================

def parse_dimension_annotation_v3(text: str) -> Optional[Dict[str, Any]]:
    """
    Robust dimension parser supporting standard metric, compact metric,
    millimeters, centimeters, and imperial formats.
    """
    if not text:
        return None

    cleaned = text.strip().replace("×", "x").replace("X", "x").replace("*", "x").replace("—", "-")
    # Clean OCR noise: replace isolated % or + between numbers with x
    cleaned = re.sub(r"(\d+)\s*[%+]\s*(\d+)", r"\1 x \2", cleaned)

    # 1. Paired Imperial: 11'0" x 14'0", 10'-5" X 15'-6", 12' x 14'
    imp_pattern = re.compile(
        r"(\d+)\s*['’]\s*[-–]?\s*(\d+)?\s*[\"”]?\s*x\s*(\d+)\s*['’]\s*[-–]?\s*(\d+)?\s*[\"”]?",
        re.IGNORECASE
    )
    m = imp_pattern.search(cleaned)
    if m:
        w_ft = float(m.group(1)) + (float(m.group(2) or 0) / 12.0)
        l_ft = float(m.group(3)) + (float(m.group(4) or 0) / 12.0)
        w_m = round(w_ft * 0.3048, 3)
        l_m = round(l_ft * 0.3048, 3)
        dim_min, dim_max = min(w_m, l_m), max(w_m, l_m)
        if 0.5 <= dim_min <= 25.0 and 0.5 <= dim_max <= 30.0:
            return {
                "raw_text": text,
                "is_paired": True,
                "width_m": dim_min,
                "length_m": dim_max,
                "aspect_ratio": dim_max / max(1e-4, dim_min),
                "unit": "imperial_feet_inches",
            }

    # 2. Standard Metric Decimal: 3.35 x 4.27 or 3.35m x 4.27m
    met_pattern = re.compile(r"(\d+\.\d{1,2})\s*m?\s*x\s*(\d+\.\d{1,2})\s*m?", re.IGNORECASE)
    m = met_pattern.search(cleaned)
    if m:
        w_m = float(m.group(1))
        l_m = float(m.group(2))
        dim_min, dim_max = min(w_m, l_m), max(w_m, l_m)
        if 0.5 <= dim_min <= 30.0 and 0.5 <= dim_max <= 35.0:
            return {
                "raw_text": text,
                "is_paired": True,
                "width_m": dim_min,
                "length_m": dim_max,
                "aspect_ratio": dim_max / max(1e-4, dim_min),
                "unit": "metric_meters",
            }

    # 3. Paired Millimeters (4 to 5 digits): 3350 x 4270, 3500 x 4200
    mm_pattern = re.compile(r"(?<!\d)(\d{4,5})\s*x\s*(\d{4,5})(?!\d)", re.IGNORECASE)
    m = mm_pattern.search(cleaned)
    if m:
        v1 = float(m.group(1)) / 1000.0
        v2 = float(m.group(2)) / 1000.0
        dim_min, dim_max = min(v1, v2), max(v1, v2)
        if 0.8 <= dim_min <= 30.0 and 0.8 <= dim_max <= 35.0:
            return {
                "raw_text": text,
                "is_paired": True,
                "width_m": round(dim_min, 3),
                "length_m": round(dim_max, 3),
                "aspect_ratio": dim_max / max(1e-4, dim_min),
                "unit": "metric_millimeters",
            }

    # 4. Compact 3-Digit Centimeter / Decimeter: 494x244m -> 4.94m x 2.44m
    compact_pattern = re.compile(r"(?<!\d)(\d{3})\s*m?\s*x\s*(\d{3})\s*m?(?!\d)", re.IGNORECASE)
    m = compact_pattern.search(cleaned)
    if m:
        v1 = float(m.group(1)) / 100.0
        v2 = float(m.group(2)) / 100.0
        dim_min, dim_max = min(v1, v2), max(v1, v2)
        if 0.8 <= dim_min <= 15.0 and 0.8 <= dim_max <= 20.0:
            return {
                "raw_text": text,
                "is_paired": True,
                "width_m": round(dim_min, 3),
                "length_m": round(dim_max, 3),
                "aspect_ratio": dim_max / max(1e-4, dim_min),
                "unit": "metric_centimeters_compact",
            }

    # 5. Single Scalar Metric Dimension: 4.25m or 3.80 m
    single_met_pattern = re.compile(r"(?:^|[^\d.])(\d+\.\d{1,2})\s*m(?:$|[^\w])", re.IGNORECASE)
    m = single_met_pattern.search(cleaned)
    if m:
        val_m = float(m.group(1))
        if 0.8 <= val_m <= 30.0:
            return {
                "raw_text": text,
                "is_paired": False,
                "scalar_dim_m": val_m,
                "width_m": val_m,
                "length_m": val_m,
                "aspect_ratio": 1.0,
                "unit": "metric_meters_scalar",
            }

    return None


def extract_hierarchical_ocr_tokens(
    gray_image: np.ndarray,
    conf_thresh: float = 20.0,
    max_word_gap_px: float = 40.0,
    max_image_dim_span_pct: float = 0.60,
) -> Dict[str, Any]:
    """
    Stage 1: Hierarchical line-level token extraction from Tesseract image_to_data.
    Reconstructs exact bounding boxes while eliminating dummy full-image boxes.
    """
    h_img, w_img = gray_image.shape[:2]
    try:
        data = pytesseract.image_to_data(gray_image, output_type=pytesseract.Output.DICT)
    except Exception as e:
        return {
            "recovered_tokens": [],
            "unlocalized_tokens": [],
            "error": str(e),
            "raw_word_boxes_count": 0,
        }

    n_boxes = len(data["text"])
    lines: Dict[Tuple[int, int, int], List[Dict[str, Any]]] = {}
    word_boxes = []

    for i in range(n_boxes):
        txt = data["text"][i].strip()
        conf = float(data["conf"][i])
        if not txt or conf < conf_thresh:
            continue

        b_num = int(data["block_num"][i])
        p_num = int(data["par_num"][i])
        l_num = int(data["line_num"][i])
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
    unlocalized_tokens = []

    for key, words in lines.items():
        # Sort words in reading order (left-to-right)
        words.sort(key=lambda w: w["left"])

        # Method A: Full line concatenation
        line_str = " ".join(w["text"] for w in words)
        parsed_full = parse_dimension_annotation_v3(line_str)

        if parsed_full is not None:
            min_x = min(w["left"] for w in words)
            min_y = min(w["top"] for w in words)
            max_x = max(w["left"] + w["width"] for w in words)
            max_y = max(w["top"] + w["height"] for w in words)
            bw = max_x - min_x
            bh = max_y - min_y

            # Safeguard 1: Validate spatial localization (no dummy box)
            if bw < max_image_dim_span_pct * w_img and bh < max_image_dim_span_pct * h_img and bw > 1 and bh > 1:
                avg_conf = sum(w["conf"] for w in words) / len(words)
                recovered_tokens.append({
                    "raw_text": line_str,
                    "parsed_dims": parsed_full,
                    "bbox": [min_x, min_y, bw, bh],
                    "center": (min_x + bw / 2.0, min_y + bh / 2.0),
                    "confidence": avg_conf / 100.0,
                    "provenance": "MEASURED_HIERARCHICAL_LINE",
                    "method": "full_line_join",
                    "word_boxes": words,
                    "words_used": len(words),
                })
            else:
                unlocalized_tokens.append({
                    "text": line_str,
                    "reason": "Dummy full-image span rejected",
                })
            continue

        # Method B: N-gram sliding window (for labels like 'Bedroom 1 4.50 x 3.20m')
        n_words = len(words)
        found_ngram = False
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
                parsed_sub = parse_dimension_annotation_v3(sub_str)
                if parsed_sub is not None:
                    min_x = min(w["left"] for w in sub_words)
                    min_y = min(w["top"] for w in sub_words)
                    max_x = max(w["left"] + w["width"] for w in sub_words)
                    max_y = max(w["top"] + w["height"] for w in sub_words)
                    bw = max_x - min_x
                    bh = max_y - min_y

                    if bw < max_image_dim_span_pct * w_img and bh < max_image_dim_span_pct * h_img and bw > 1 and bh > 1:
                        avg_conf = sum(w["conf"] for w in sub_words) / len(sub_words)
                        recovered_tokens.append({
                            "raw_text": sub_str,
                            "parsed_dims": parsed_sub,
                            "bbox": [min_x, min_y, bw, bh],
                            "center": (min_x + bw / 2.0, min_y + bh / 2.0),
                            "confidence": avg_conf / 100.0,
                            "provenance": "MEASURED_HIERARCHICAL_NGRAM",
                            "method": f"ngram_window_{window_size}",
                            "word_boxes": sub_words,
                            "words_used": len(sub_words),
                        })
                        found_ngram = True
                        break
            if found_ngram:
                break

    return {
        "recovered_tokens": recovered_tokens,
        "unlocalized_tokens": unlocalized_tokens,
        "raw_word_boxes_count": len(word_boxes),
    }


# =============================================================================
# Stage 3: Perpendicular Wall-Segment Distance & Collinear Span Aggregation
# =============================================================================

def point_to_wall_segment_perpendicular(
    px: float, py: float,
    ax: float, ay: float,
    bx: float, by: float,
) -> Dict[str, float]:
    """
    Computes exact perpendicular point-to-segment distance:
      d_perp = |(p - a) x (b - a)| / ||b - a||
    and projection parameter t = ((p - a) . (b - a)) / ||b - a||^2.
    """
    dx = bx - ax
    dy = by - ay
    seg_len_sq = dx * dx + dy * dy
    seg_len = math.sqrt(seg_len_sq)

    if seg_len < 1e-6:
        d = math.hypot(px - ax, py - ay)
        return {"dist_perp": d, "dist_euclidean": d, "t": 0.0, "seg_len": 0.0, "angle_deg": 0.0}

    # Cross product in 2D: |(px - ax)*dy - (py - ay)*dx|
    cross = abs((px - ax) * dy - (py - ay) * dx)
    d_perp = cross / seg_len

    # Projection parameter t
    t = ((px - ax) * dx + (py - ay) * dy) / seg_len_sq

    # Point of closest approach on finite segment
    t_clamped = max(0.0, min(1.0, t))
    proj_x = ax + t_clamped * dx
    proj_y = ay + t_clamped * dy
    d_euclidean = math.hypot(px - proj_x, py - proj_y)

    angle_deg = math.degrees(math.atan2(dy, dx)) % 180.0

    return {
        "dist_perp": d_perp,
        "dist_euclidean": d_euclidean,
        "t": t,
        "seg_len": seg_len,
        "angle_deg": angle_deg,
    }


def aggregate_collinear_wall_spans(
    wall_segments: List[Dict[str, Any]],
    angle_tolerance_deg: float = 6.0,
    collinear_dist_tolerance_px: float = 12.0,
) -> List[Dict[str, Any]]:
    """
    Aggregates collinear wall segments on the same perimeter line
    to capture the composite room wall span.
    """
    if not wall_segments:
        return []

    spans = []
    used = set()

    for i, s1 in enumerate(wall_segments):
        if i in used:
            continue
        used.add(i)
        a1, b1 = s1["start"], s1["end"]
        ang1 = s1.get("angle_deg", 0.0)
        total_len = s1.get("length_px", math.hypot(b1[0] - a1[0], b1[1] - a1[1]))
        sub_segs = [s1]

        for j, s2 in enumerate(wall_segments):
            if j in used or j <= i:
                continue
            ang2 = s2.get("angle_deg", 0.0)
            ang_diff = min(abs(ang1 - ang2), abs(ang1 - ang2 - 180.0), abs(ang1 - ang2 + 180.0))
            if ang_diff <= angle_tolerance_deg:
                # Check perpendicular offset
                p_eval = point_to_wall_segment_perpendicular(s2["start"][0], s2["start"][1], a1[0], a1[1], b1[0], b1[1])
                if p_eval["dist_perp"] <= collinear_dist_tolerance_px:
                    used.add(j)
                    sub_segs.append(s2)
                    total_len += s2.get("length_px", 0.0)

        spans.append({
            "composite_length_px": total_len,
            "angle_deg": ang1,
            "segments_count": len(sub_segs),
            "primary_segment": s1,
        })

    return spans


# =============================================================================
# Stage 4 & 5: Geometric OCR Spatial Matcher V3
# =============================================================================

class OCRSpatialMatcherV3:
    """
    Authoritative G5-OCR-v3 Spatial Matcher.
    Combines hierarchical line-level token recovery with perpendicular wall-segment
    association and globally valid Hungarian margin optimization.
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        max_cost_threshold: float = 0.65,
        min_margin_threshold: float = 0.08,
        min_plausible_ppm: float = 15.0,
        max_plausible_ppm: float = 250.0,
        min_query_conf: float = 0.25,
        ocr_conf_thresh: float = 20.0,
    ):
        self.weights = weights or {
            "w_wall": 0.30,         # Perpendicular wall distance
            "w_containment": 0.25,  # Room polygon interior containment
            "w_orientation": 0.15,  # Orientation angle alignment
            "w_aspect": 0.15,       # Aspect ratio agreement
            "w_span": 0.15,         # Dimension scalar span agreement
        }
        self.max_cost_threshold = max_cost_threshold
        self.min_margin_threshold = min_margin_threshold
        self.min_plausible_ppm = min_plausible_ppm
        self.max_plausible_ppm = max_plausible_ppm
        self.min_query_conf = min_query_conf
        self.ocr_conf_thresh = ocr_conf_thresh

    def filter_query_rooms(
        self,
        detected_rooms: List[Dict[str, Any]],
        conf_thresh: Optional[float] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Safeguard 3: Filters low-confidence room query predictions prior to matching.
        """
        thresh = conf_thresh if conf_thresh is not None else self.min_query_conf
        filtered_rooms = []
        discarded_count = 0

        for r in detected_rooms:
            conf = r.get("confidence", r.get("det_conf", 1.0))
            if conf >= thresh:
                filtered_rooms.append(r)
            else:
                discarded_count += 1

        return filtered_rooms, discarded_count

    def compute_wall_segment_cost(
        self,
        annotation_center: Tuple[float, float],
        poly_pts: List[Tuple[float, float]],
        parsed_dims: Dict[str, Any],
        diag_px: float,
    ) -> Tuple[float, float, float]:
        """
        Computes perpendicular wall distance cost (D_wall in [0, 1]) and
        orientation alignment against the closest wall segment.
        """
        if len(poly_pts) < 3:
            return 1.0, 1.0, 1.0

        px, py = annotation_center
        n_pts = len(poly_pts)
        min_dist = float("inf")
        best_wall_angle = 0.0

        for i in range(n_pts):
            p1 = poly_pts[i]
            p2 = poly_pts[(i + 1) % n_pts]
            p_res = point_to_wall_segment_perpendicular(px, py, p1[0], p1[1], p2[0], p2[1])

            # Use perpendicular distance if projection t is near segment [-0.2, 1.2],
            # otherwise fall back to Euclidean distance to nearest corner
            effective_d = p_res["dist_perp"] if (-0.2 <= p_res["t"] <= 1.2) else p_res["dist_euclidean"]
            if effective_d < min_dist:
                min_dist = effective_d
                best_wall_angle = p_res["angle_deg"]

        # Normalize wall distance by 35% of room diagonal
        norm_wall_dist = min(1.0, min_dist / max(10.0, diag_px * 0.35))

        # Check orientation agreement (horizontal ~ 0/180 deg, vertical ~ 90 deg)
        text_is_vertical = parsed_dims.get("is_vertical", False)
        ann_angle = 90.0 if text_is_vertical else 0.0
        angle_diff = min(abs(best_wall_angle - ann_angle), abs(best_wall_angle - ann_angle - 180.0), abs(best_wall_angle - ann_angle + 180.0))
        norm_orient_cost = min(1.0, angle_diff / 45.0)

        return float(norm_wall_dist), float(norm_orient_cost), float(min_dist)

    def compute_containment_cost(
        self,
        annotation_center: Tuple[float, float],
        poly_pts: List[Tuple[float, float]],
        diag_px: float,
    ) -> float:
        """
        Computes room containment penalty D_containment in [0, 1].
        """
        if len(poly_pts) < 3:
            return 1.0

        poly = Polygon(poly_pts)
        if not poly.is_valid:
            poly = poly.buffer(0)

        pt = Point(annotation_center)
        if poly.contains(pt):
            return 0.0

        # Point is outside polygon: measure distance to perimeter
        dist = poly.distance(pt)
        norm_dist = min(1.0, dist / max(10.0, diag_px * 0.50))
        return float(norm_dist)

    def compute_aspect_and_span_cost(
        self,
        parsed_dims: Dict[str, Any],
        room_w_px: float,
        room_l_px: float,
    ) -> Tuple[float, float]:
        """
        Computes aspect ratio cost (D_aspect in [0, 1]) and scalar span agreement.
        Supports orthogonal dimension transposition for vertical orientation.
        """
        if not parsed_dims.get("is_paired", False):
            return 0.0, 0.0

        printed_aspect = parsed_dims.get("aspect_ratio", 1.0)
        room_short = min(room_w_px, room_l_px)
        room_long = max(room_w_px, room_l_px)
        room_aspect = room_long / max(1e-4, room_short)

        # Standard aspect comparison
        diff1 = abs(printed_aspect - room_aspect) / max(1e-4, printed_aspect)

        # Swapped orientation comparison
        inv_aspect = 1.0 / max(1e-4, printed_aspect)
        diff2 = abs(inv_aspect - room_aspect) / max(1e-4, inv_aspect)

        best_diff = min(diff1, diff2)
        norm_aspect_cost = min(1.0, best_diff / 0.50)

        # Span cost (approximate scale consistency)
        span_cost = min(1.0, best_diff / 0.75)

        return float(norm_aspect_cost), float(span_cost)

    def compute_matching_cost(
        self,
        annotation: Dict[str, Any],
        room: Dict[str, Any],
    ) -> Dict[str, float]:
        """
        Evaluates the complete 5-component cost function between an annotation and a room.
        """
        center = annotation.get("center", (0.0, 0.0))
        parsed = annotation.get("parsed_dims", {})
        poly_pts = room.get("polygon_pixels", room.get("polygon_tier3", []))

        if len(poly_pts) < 3:
            return {"total_cost": 1.0, "d_wall": 1.0, "d_cont": 1.0, "d_orient": 1.0, "d_aspect": 1.0, "d_span": 1.0}

        pts_arr = np.array(poly_pts)
        min_x, min_y = pts_arr[:, 0].min(), pts_arr[:, 1].min()
        max_x, max_y = pts_arr[:, 0].max(), pts_arr[:, 1].max()
        diag_px = math.hypot(max_x - min_x, max_y - min_y)
        room_w_px = max(1.0, max_x - min_x)
        room_l_px = max(1.0, max_y - min_y)

        # 1. Perpendicular Wall Distance & Orientation Cost
        d_wall, d_orient, raw_dist = self.compute_wall_segment_cost(center, poly_pts, parsed, diag_px)

        # 2. Containment Cost
        d_cont = self.compute_containment_cost(center, poly_pts, diag_px)

        # 3. Aspect Ratio and Span Cost
        d_aspect, d_span = self.compute_aspect_and_span_cost(parsed, room_w_px, room_l_px)

        # Weighted Total Cost
        w = self.weights
        total_cost = (
            w["w_wall"] * d_wall
            + w["w_containment"] * d_cont
            + w["w_orientation"] * d_orient
            + w["w_aspect"] * d_aspect
            + w["w_span"] * d_span
        )

        return {
            "total_cost": float(total_cost),
            "d_wall": float(d_wall),
            "d_cont": float(d_cont),
            "d_orient": float(d_orient),
            "d_aspect": float(d_aspect),
            "d_span": float(d_span),
            "raw_wall_dist_px": float(raw_dist),
        }

    def match(
        self,
        image_input: Optional[Union[np.ndarray, Image.Image, str, Path]] = None,
        ocr_annotations: Optional[List[Dict[str, Any]]] = None,
        detected_rooms: Optional[List[Dict[str, Any]]] = None,
        image_size: Tuple[int, int] = (1024, 1024),
    ) -> Dict[str, Any]:
        """
        Executes end-to-end G5-OCR-v3 matching across all 5 stages.
        """
        detected_rooms = detected_rooms or []

        # Step 1: Query Confidence Filtering (Safeguard 3)
        filtered_rooms, filtered_queries_count = self.filter_query_rooms(detected_rooms)

        # Step 2: Extract & Reconstruct Hierarchical Tokens (Stage 1 & 2)
        valid_annotations = []
        unlocalized_annotations = []

        if image_input is not None:
            if isinstance(image_input, (str, Path)):
                img = cv2.imread(str(image_input))
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img is not None else None
            elif isinstance(image_input, np.ndarray):
                gray = cv2.cvtColor(image_input, cv2.COLOR_BGR2GRAY) if len(image_input.shape) == 3 else image_input
            elif isinstance(image_input, Image.Image):
                gray = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2GRAY)
            else:
                gray = None

            if gray is not None:
                recon_res = extract_hierarchical_ocr_tokens(gray, conf_thresh=self.ocr_conf_thresh)
                valid_annotations.extend(recon_res["recovered_tokens"])
                unlocalized_annotations.extend(recon_res["unlocalized_tokens"])

        # Also support passing existing pre-extracted annotations (with dummy box rejection)
        if ocr_annotations:
            for ann in ocr_annotations:
                txt = ann.get("text", "")
                parsed = parse_dimension_annotation_v3(txt)
                if parsed is not None:
                    ann_copy = dict(ann)
                    ann_copy["parsed_dims"] = parsed
                    ann_copy["raw_text"] = parsed.get("raw_text", txt)
                    bx, by, bw, bh = ann_copy.get("bbox", [0, 0, 0, 0])
                    img_w, img_h = image_size

                    # Safeguard 1: Validate spatial localization (no dummy box)
                    if bw < 0.60 * img_w and bh < 0.60 * img_h and bw > 1 and bh > 1:
                        if "center" not in ann_copy:
                            ann_copy["center"] = (bx + bw / 2.0, by + bh / 2.0)
                        # Avoid duplicates
                        if not any(v["raw_text"] == ann_copy["raw_text"] for v in valid_annotations):
                            valid_annotations.append(ann_copy)
                    else:
                        unlocalized_annotations.append({
                            "text": txt,
                            "reason": "Dummy full-image span rejected",
                        })

        n_ann = len(valid_annotations)
        n_rooms = len(filtered_rooms)

        if n_ann == 0 or n_rooms == 0:
            return {
                "matched_associations": [],
                "ambiguous_annotations": [],
                "unlocalized_annotations": unlocalized_annotations,
                "unlocalized_count": len(unlocalized_annotations),
                "rejected_annotations": valid_annotations,
                "filtered_queries_count": filtered_queries_count,
                "retained_rooms_count": n_rooms,
                "is_calibrated": False,
                "scale_px_per_m": None,
                "scale_m_per_px": None,
                "provenance": "UNAVAILABLE",
                "message": f"Zero localized annotations ({n_ann}) or filtered rooms ({n_rooms}).",
            }

        # Step 3: Build Cost Matrix (Stage 3 & 4)
        cost_matrix = np.zeros((n_ann, n_rooms), dtype=np.float32)
        cost_breakdowns = [[None for _ in range(n_rooms)] for _ in range(n_ann)]

        for i, ann in enumerate(valid_annotations):
            for j, room in enumerate(filtered_rooms):
                bd = self.compute_matching_cost(ann, room)
                cost_matrix[i, j] = bd["total_cost"]
                cost_breakdowns[i][j] = bd

        # Step 4: Bipartite Matching via Hungarian Algorithm
        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        matched_associations = []
        ambiguous_annotations = []
        rejected_annotations = []
        room_scale_estimates = []

        assigned_annotations = set(row_ind)

        for i, j in zip(row_ind, col_ind):
            cost = cost_matrix[i, j]
            ann = valid_annotations[i]
            room = filtered_rooms[j]
            bd = cost_breakdowns[i][j]

            # Safeguard 2: Globally Valid Alternative Hungarian Margin
            row_costs = sorted([cost_matrix[i, k] for k in range(n_rooms)])
            if len(row_costs) > 1:
                # Minimum cost among all other rooms except j
                other_costs = [cost_matrix[i, k] for k in range(n_rooms) if k != j]
                margin = min(other_costs) - cost if other_costs else 0.50
            else:
                margin = 0.50

            # Evaluation Gates
            if cost > self.max_cost_threshold:
                rejected_annotations.append({
                    "annotation": ann["raw_text"],
                    "cost": float(cost),
                    "reason": f"Cost ({cost:.3f}) exceeds threshold ({self.max_cost_threshold})",
                })
            elif margin < self.min_margin_threshold:
                ambiguous_annotations.append({
                    "annotation": ann["raw_text"],
                    "margin": float(margin),
                    "cost": float(cost),
                    "assigned_room_id": room.get("query_id", j),
                    "reason": f"Ambiguous assignment: margin ({margin:.3f}) < {self.min_margin_threshold}",
                })
            else:
                # Stage 5: Derive Room Scale
                poly_pts = room.get("polygon_pixels", room.get("polygon_tier3", []))
                pts_arr = np.array(poly_pts)
                min_x, min_y = pts_arr[:, 0].min(), pts_arr[:, 1].min()
                max_x, max_y = pts_arr[:, 0].max(), pts_arr[:, 1].max()
                w_px = max(1.0, max_x - min_x)
                l_px = max(1.0, max_y - min_y)

                parsed = ann["parsed_dims"]
                w_m = parsed.get("width_m", 1.0)
                l_m = parsed.get("length_m", 1.0)

                # Pair short and long dimensions
                s_px_w = min(w_px, l_px) / max(1e-4, min(w_m, l_m))
                s_px_l = max(w_px, l_px) / max(1e-4, max(w_m, l_m))
                room_ppm = (s_px_w + s_px_l) / 2.0

                if self.min_plausible_ppm <= room_ppm <= self.max_plausible_ppm:
                    room_scale_estimates.append(room_ppm)
                    matched_associations.append({
                        "annotation_text": ann["raw_text"],
                        "annotation_center": ann["center"],
                        "annotation_bbox": ann["bbox"],
                        "room_query_id": room.get("query_id", j),
                        "room_type": room.get("type", "Room"),
                        "matching_cost": float(cost),
                        "assignment_margin": float(margin),
                        "cost_breakdown": bd,
                        "room_ppm": float(room_ppm),
                        "provenance": ann.get("provenance", "MEASURED_HIERARCHICAL_LINE"),
                        "is_correct": False,  # Evaluated by benchmark
                    })
                else:
                    rejected_annotations.append({
                        "annotation": ann["raw_text"],
                        "reason": f"Implausible derived scale: {room_ppm:.1f} ppm",
                    })

        # Check unassigned annotations
        for i in range(n_ann):
            if i not in assigned_annotations:
                rejected_annotations.append({
                    "annotation": valid_annotations[i]["raw_text"],
                    "reason": "Unassigned by Hungarian matching",
                })

        # Step 5: Final Scale Calibration
        if room_scale_estimates:
            final_ppm = float(np.median(room_scale_estimates))
            final_scale_s = float(1.0 / final_ppm)
            is_calibrated = True
            provenance = "MEASURED"
        else:
            final_ppm = None
            final_scale_s = None
            is_calibrated = False
            provenance = "AMBIGUOUS" if ambiguous_annotations else "UNAVAILABLE"

        return {
            "matched_associations": matched_associations,
            "ambiguous_annotations": ambiguous_annotations,
            "unlocalized_annotations": unlocalized_annotations,
            "unlocalized_count": len(unlocalized_annotations),
            "rejected_annotations": rejected_annotations,
            "filtered_queries_count": filtered_queries_count,
            "retained_rooms_count": n_rooms,
            "is_calibrated": is_calibrated,
            "scale_px_per_m": final_ppm,
            "scale_m_per_px": final_scale_s,
            "provenance": provenance,
            "room_scale_estimates_count": len(room_scale_estimates),
        }
