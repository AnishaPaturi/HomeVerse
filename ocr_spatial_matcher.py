"""
Geometric OCR Spatial Matcher Module
====================================
HomeVerse Project - Milestone G5/G6 Transition (Group 1 Calibration)

Solves the critical spatial association bottleneck:
Associates printed OCR dimension annotations to their true architectural room
polygons using geometric line-following, boundary proximity, projection alignment,
orientation agreement, and aspect ratio compatibility.

Pipeline:
  1. Dimension Parsing: Text, units, bounding box, confidence.
  2. Dimension-Line Detection: Extension lines, witness lines, orientation.
  3. Candidate Generation & Feature Extraction.
  4. Composite Cost Function:
       C_ij = w1*D_line + w2*D_proj + w3*D_cont + w4*D_orient + w5*D_aspect
  5. Global Bipartite Assignment (Hungarian Matcher) with Ambiguity Rejection.
  6. Verified Room-Scale Derivation with strict non-hallucination guardrails.
"""

import math
import re
from typing import Dict, List, Optional, Tuple, Any, Union
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import linear_sum_assignment
from shapely.geometry import Polygon, Point, LineString


def parse_dimension_annotation(text: str) -> Optional[Dict[str, Any]]:
    """
    Parses architectural room dimensions from OCR strings.
    Supports:
      - Paired metric: '3.35 x 4.27', '3.35m x 4.27m'
      - Paired imperial: 11'0" x 14'0", 10'-5" X 15'-6"
      - Single metric: '4.25m', '3.80 m'
      - Millimeters: '3350 x 4270'
      - Centimeters: '300 x 400'
    Returns structured dict with width_m, length_m, is_paired, aspect_ratio.
    """
    if not text:
        return None

    cleaned = text.strip().replace("×", "x").replace("X", "x").replace("*", "x")

    # 1. Paired Imperial format: W'D" x L'D"
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

    # 2. Paired Standard Metric: 3.35 x 4.27 or 3.35m x 4.27m
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

    # 3. Paired Millimeters: 3350 x 4270
    mm_pattern = re.compile(r"(\d{4,5})\s*x\s*(\d{4,5})", re.IGNORECASE)
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

    # 4. Paired Centimeters: 300 x 400
    cm_pattern = re.compile(r"(\d{3})\s*x\s*(\d{3})", re.IGNORECASE)
    m = cm_pattern.search(cleaned)
    if m:
        v1 = float(m.group(1)) / 100.0
        v2 = float(m.group(2)) / 100.0
        dim_min, dim_max = min(v1, v2), max(v1, v2)
        if 1.0 <= dim_min <= 20.0 and 1.0 <= dim_max <= 25.0:
            return {
                "raw_text": text,
                "is_paired": True,
                "width_m": round(dim_min, 3),
                "length_m": round(dim_max, 3),
                "aspect_ratio": dim_max / max(1e-4, dim_min),
                "unit": "metric_centimeters",
            }

    # 5. Single Dimension: e.g. 4.25m or 14'0"
    single_met = re.search(r"(\d+\.\d{1,2})\s*m\b", cleaned, re.IGNORECASE)
    if single_met:
        val_m = float(single_met.group(1))
        if 0.5 <= val_m <= 30.0:
            return {
                "raw_text": text,
                "is_paired": False,
                "dimension_m": val_m,
                "width_m": None,
                "length_m": None,
                "aspect_ratio": 1.0,
                "unit": "metric_meters_single",
            }

    single_imp = re.search(r"(\d+)\s*['’]\s*[-–]?\s*(\d+)?\s*[\"”]?", cleaned)
    if single_imp:
        val_ft = float(single_imp.group(1)) + (float(single_imp.group(2) or 0) / 12.0)
        val_m = round(val_ft * 0.3048, 3)
        if 0.5 <= val_m <= 30.0:
            return {
                "raw_text": text,
                "is_paired": False,
                "dimension_m": val_m,
                "width_m": None,
                "length_m": None,
                "aspect_ratio": 1.0,
                "unit": "imperial_single",
            }

    return None


class OCRSpatialMatcher:
    """
    Geometric Bipartite Matcher for Printed Dimensions and Architectural Polygons.
    Uses multi-criteria cost scoring and Hungarian assignment to associate annotations with rooms.
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        max_cost_threshold: float = 0.65,
        min_margin_threshold: float = 0.10,
        min_plausible_ppm: float = 15.0,
        max_plausible_ppm: float = 250.0,
    ):
        # Default weights summing to 1.0
        self.weights = weights or {
            "w_line": 0.25,        # D_line: Distance from dimension line to boundaries
            "w_proj": 0.20,        # D_projection: Alignment of extension endpoints
            "w_cont": 0.25,        # D_containment: Spatial relationship (inside vs outside)
            "w_orient": 0.15,      # D_orientation: Dimension line angle vs wall orientation
            "w_aspect": 0.15,      # D_aspect: Printed dimension ratio vs room polygon aspect
        }
        self.max_cost_threshold = max_cost_threshold
        self.min_margin_threshold = min_margin_threshold
        self.min_plausible_ppm = min_plausible_ppm
        self.max_plausible_ppm = max_plausible_ppm

    def extract_dimension_lines_from_image(
        self,
        image: np.ndarray,
        ocr_bbox: List[int],
        expansion_factor: float = 1.8,
    ) -> List[Dict[str, Any]]:
        """
        Detects dimension and witness lines in the vicinity of an OCR annotation bounding box.
        """
        if image is None or len(image.shape) < 2:
            return []

        h, w = image.shape[:2]
        bx, by, bw, bh = ocr_bbox
        # Expand ROI
        cx, cy = bx + bw / 2.0, by + bh / 2.0
        roi_w = bw * expansion_factor
        roi_h = bh * expansion_factor
        x1 = max(0, int(cx - roi_w / 2.0))
        y1 = max(0, int(cy - roi_h / 2.0))
        x2 = min(w, int(cx + roi_w / 2.0))
        y2 = min(h, int(cy + roi_h / 2.0))

        if x2 - x1 < 10 or y2 - y1 < 10:
            return []

        roi = image[y1:y2, x1:x2]
        if len(roi.shape) == 3:
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        else:
            gray = roi

        edges = cv2.Canny(gray, 30, 120)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=20, minLineLength=15, maxLineGap=5)
        if lines is None:
            return []

        detected_lines = []
        for l in lines:
            lx1, ly1, lx2, ly2 = l[0]
            # Convert back to global coordinates
            gx1, gy1 = lx1 + x1, ly1 + y1
            gx2, gy2 = lx2 + x2, ly2 + y1
            dx, dy = gx2 - gx1, gy2 - gy1
            length = math.hypot(dx, dy)
            angle = math.degrees(math.atan2(dy, dx)) % 180.0
            detected_lines.append({
                "start": (gx1, gy1),
                "end": (gx2, gy2),
                "length_px": length,
                "angle_deg": angle,
                "midpoint": ((gx1 + gx2) / 2.0, (gy1 + gy2) / 2.0),
            })

        return detected_lines

    def compute_containment_distance(
        self,
        annotation_center: Tuple[float, float],
        room_poly_pts: List[Tuple[float, float]],
    ) -> float:
        """
        Computes spatial containment penalty D_containment in [0, 1].
        - 0.0 if annotation center is strictly inside the room polygon.
        - Scales smoothly with distance outside up to max room diagonal.
        """
        if len(room_poly_pts) < 3:
            return 1.0

        poly = Polygon(room_poly_pts)
        if not poly.is_valid:
            poly = poly.buffer(0)

        pt = Point(annotation_center)
        if poly.contains(pt):
            return 0.0

        # Point is outside polygon: compute distance to polygon boundary
        dist = poly.distance(pt)
        # Normalize distance by polygon bounding envelope diagonal
        min_x, min_y, max_x, max_y = poly.bounds
        diag = max(10.0, math.hypot(max_x - min_x, max_y - min_y))
        norm_dist = min(1.0, dist / (diag * 0.75))
        return float(norm_dist)

    def compute_line_distance(
        self,
        annotation_center: Tuple[float, float],
        dim_line: Optional[Dict[str, Any]],
        room_poly_pts: List[Tuple[float, float]],
    ) -> float:
        """
        Computes D_line in [0, 1]. Distance from dimension line (or annotation center)
        to the closest room boundary wall.
        """
        if len(room_poly_pts) < 3:
            return 1.0

        poly = Polygon(room_poly_pts)
        if not poly.is_valid:
            poly = poly.buffer(0)

        boundary = poly.boundary
        min_x, min_y, max_x, max_y = poly.bounds
        diag = max(10.0, math.hypot(max_x - min_x, max_y - min_y))

        if dim_line is not None:
            l_geom = LineString([dim_line["start"], dim_line["end"]])
            dist = boundary.distance(l_geom)
        else:
            pt = Point(annotation_center)
            dist = boundary.distance(pt)

        norm_dist = min(1.0, dist / (diag * 0.5))
        return float(norm_dist)

    def compute_projection_alignment(
        self,
        dim_line: Optional[Dict[str, Any]],
        annotation_center: Tuple[float, float],
        room_poly_pts: List[Tuple[float, float]],
    ) -> float:
        """
        Computes D_projection in [0, 1]. Evaluates alignment of extension lines/endpoints
        with room corners and major opposing wall faces.
        """
        if len(room_poly_pts) < 3:
            return 1.0

        poly = Polygon(room_poly_pts)
        if not poly.is_valid:
            poly = poly.buffer(0)

        min_x, min_y, max_x, max_y = poly.bounds
        diag = max(10.0, math.hypot(max_x - min_x, max_y - min_y))

        if dim_line is not None:
            p1 = Point(dim_line["start"])
            p2 = Point(dim_line["end"])
            # Closest corner or wall projection
            dist1 = poly.boundary.distance(p1)
            dist2 = poly.boundary.distance(p2)
            avg_proj_dist = (dist1 + dist2) / 2.0
            return float(min(1.0, avg_proj_dist / (diag * 0.35)))
        else:
            # Fallback: distance of annotation center to room centroid relative to bounds
            c = poly.centroid
            cx, cy = annotation_center
            dist_to_centroid = math.hypot(cx - c.x, cy - c.y)
            return float(min(1.0, dist_to_centroid / (diag * 0.5)))

    def compute_orientation_alignment(
        self,
        dim_angle_deg: Optional[float],
        annotation_aspect: float,
        wall_segments: List[Dict[str, Any]],
        room_rotation_deg: float = 0.0,
    ) -> float:
        """
        Computes D_orientation in [0, 1]. Measures angle disagreement between the
        dimension annotation orientation and the room's primary wall axes.
        """
        if not wall_segments:
            return 0.20  # Neutral prior if no explicit wall segments

        target_angles = []
        if dim_angle_deg is not None:
            target_angles.append(dim_angle_deg % 180.0)
        else:
            # Assume standard orthogonal architectural orientation
            target_angles.extend([0.0, 90.0])

        min_angle_diff = float("inf")
        for w in wall_segments:
            w_ang = w.get("angle_deg", 0.0) % 180.0
            for t_ang in target_angles:
                diff = abs(w_ang - t_ang)
                if diff > 90.0:
                    diff = 180.0 - diff
                if diff < min_angle_diff:
                    min_angle_diff = diff

        # Normalize 0 deg diff -> 0.0, 45 deg diff (max orthogonal mismatch) -> 1.0
        norm_diff = min(1.0, min_angle_diff / 45.0)
        return float(norm_diff)

    def compute_aspect_ratio_distance(
        self,
        parsed_dim: Dict[str, Any],
        room_aspect_ratio: float,
    ) -> float:
        """
        Computes D_aspect in [0, 1]. Measures disagreement between printed dimension ratio
        and room polygon's geometric aspect ratio.
        """
        if not parsed_dim.get("is_paired", False):
            # Single dimension has no aspect ratio: return 0.0 (no penalty)
            return 0.0

        printed_aspect = parsed_dim.get("aspect_ratio", 1.0)
        aspect_ratio_diff = abs(printed_aspect - room_aspect_ratio) / max(1e-4, printed_aspect)
        norm_aspect_cost = min(1.0, aspect_ratio_diff / 0.50)  # 50% mismatch = 1.0 penalty
        return float(norm_aspect_cost)

    def compute_matching_cost(
        self,
        annotation: Dict[str, Any],
        room: Dict[str, Any],
        detected_line: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, float]:
        """
        Evaluates the 5-component cost function between an annotation and a room.
        C_ij = w1*D_line + w2*D_proj + w3*D_cont + w4*D_orient + w5*D_aspect
        """
        center = annotation.get("center", (0.0, 0.0))
        parsed = annotation.get("parsed_dims", {})
        poly_pts = room.get("polygon_pixels", [])
        walls = room.get("wall_segments", [])
        mabr = room.get("mabr", {})
        room_aspect = mabr.get("aspect_ratio", 1.0)
        room_rot = mabr.get("rotation_deg", 0.0)

        line_angle = detected_line.get("angle_deg") if detected_line else None

        d_line = self.compute_line_distance(center, detected_line, poly_pts)
        d_proj = self.compute_projection_alignment(detected_line, center, poly_pts)
        d_cont = self.compute_containment_distance(center, poly_pts)
        d_orient = self.compute_orientation_alignment(line_angle, parsed.get("aspect_ratio", 1.0), walls, room_rot)
        d_aspect = self.compute_aspect_ratio_distance(parsed, room_aspect)

        total_cost = (
            self.weights["w_line"] * d_line +
            self.weights["w_proj"] * d_proj +
            self.weights["w_cont"] * d_cont +
            self.weights["w_orient"] * d_orient +
            self.weights["w_aspect"] * d_aspect
        )

        return {
            "total_cost": round(total_cost, 4),
            "d_line": round(d_line, 4),
            "d_projection": round(d_proj, 4),
            "d_containment": round(d_cont, 4),
            "d_orientation": round(d_orient, 4),
            "d_aspect": round(d_aspect, 4),
        }

    def pre_group_orthogonal_annotations(
        self,
        annotations: List[Dict[str, Any]],
        detected_rooms: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Pre-pass: Groups compatible orthogonal single-dimension annotations in the
        same room vicinity into a unified paired dimension annotation (W_m, L_m).
        Prevents 1-to-1 Hungarian matching from discarding valid second dimensions.
        """
        paired_anns = []
        single_anns = []

        for ann in annotations:
            if ann["parsed_dims"].get("is_paired", False):
                paired_anns.append(ann)
            else:
                single_anns.append(ann)

        if len(single_anns) < 2:
            return annotations

        used_singles = set()
        merged_pairs = []

        # Try to pair singles that belong to the same candidate room
        for i in range(len(single_anns)):
            if i in used_singles:
                continue
            ann_i = single_anns[i]
            d_i = ann_i["parsed_dims"]["dimension_m"]
            cx_i, cy_i = ann_i["center"]

            best_j = None
            best_room = None
            best_score = float("inf")

            for j in range(i + 1, len(single_anns)):
                if j in used_singles:
                    continue
                ann_j = single_anns[j]
                d_j = ann_j["parsed_dims"]["dimension_m"]
                cx_j, cy_j = ann_j["center"]

                # Find which room contains or is closest to both
                for room in detected_rooms:
                    poly_pts = room.get("polygon_pixels", [])
                    if len(poly_pts) < 3:
                        continue
                    poly = Polygon(poly_pts)
                    pt_i = Point(cx_i, cy_i)
                    pt_j = Point(cx_j, cy_j)

                    # Both points should be in or near the room
                    dist_i = poly.distance(pt_i)
                    dist_j = poly.distance(pt_j)

                    if dist_i < 50.0 and dist_j < 50.0:
                        # Spatial proximity between the two labels
                        inter_label_dist = math.hypot(cx_i - cx_j, cy_i - cy_j)
                        mabr = room.get("mabr", {})
                        r_diag = math.hypot(mabr.get("length_px", 100), mabr.get("width_px", 100))

                        # If labels are within the room envelope
                        if inter_label_dist < r_diag * 0.95:
                            score = dist_i + dist_j + (inter_label_dist * 0.1)
                            if score < best_score:
                                best_score = score
                                best_j = j
                                best_room = room

            if best_j is not None and best_room is not None:
                ann_j = single_anns[best_j]
                d_j = ann_j["parsed_dims"]["dimension_m"]
                used_singles.add(i)
                used_singles.add(best_j)

                dim_min, dim_max = min(d_i, d_j), max(d_i, d_j)
                combined_text = f"{ann_i.get('raw_text')} x {ann_j.get('raw_text')}"
                combined_center = ((ann_i['center'][0] + ann_j['center'][0]) / 2.0, (ann_i['center'][1] + ann_j['center'][1]) / 2.0)
                
                # Combine bounding boxes
                bx_i, by_i, bw_i, bh_i = ann_i.get("bbox", [cx_i, cy_i, 10, 10])
                bx_j, by_j, bw_j, bh_j = ann_j.get("bbox", [cx_j, cy_j, 10, 10])
                comb_x1 = min(bx_i, bx_j)
                comb_y1 = min(by_i, by_j)
                comb_x2 = max(bx_i + bw_i, bx_j + bw_j)
                comb_y2 = max(by_i + bh_i, by_j + bh_j)

                merged_pairs.append({
                    "raw_text": combined_text,
                    "text": combined_text,
                    "bbox": [comb_x1, comb_y1, comb_x2 - comb_x1, comb_y2 - comb_y1],
                    "center": combined_center,
                    "parsed_dims": {
                        "raw_text": combined_text,
                        "is_paired": True,
                        "width_m": dim_min,
                        "length_m": dim_max,
                        "aspect_ratio": dim_max / max(1e-4, dim_min),
                        "unit": "synthesized_pair_from_singles",
                    },
                    "was_merged_from_singles": True,
                })

        # Add remaining unmatched singles
        remaining_singles = [single_anns[idx] for idx in range(len(single_anns)) if idx not in used_singles]
        return paired_anns + merged_pairs + remaining_singles

    def match(
        self,
        ocr_annotations: List[Dict[str, Any]],
        detected_rooms: List[Dict[str, Any]],
        floorplan_image: Optional[np.ndarray] = None,
        enable_pre_grouping: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes global bipartite assignment between OCR annotations and candidate rooms.
        Returns matched associations, explicitly flagged ambiguous annotations, and consensus scale.
        """
        # Step 1: Filter and parse valid dimension annotations
        valid_annotations = []
        for ann in ocr_annotations:
            txt = ann.get("text", "")
            parsed = parse_dimension_annotation(txt)
            if parsed is not None:
                ann_copy = dict(ann)
                ann_copy["parsed_dims"] = parsed
                ann_copy["raw_text"] = parsed.get("raw_text", txt)
                if "center" not in ann_copy:
                    bx, by, bw, bh = ann_copy.get("bbox", [0, 0, 10, 10])
                    ann_copy["center"] = (bx + bw / 2.0, by + bh / 2.0)
                valid_annotations.append(ann_copy)

        # Pre-pass: Group orthogonal single dimensions in the same room into pairs
        if enable_pre_grouping and len(valid_annotations) > 1 and len(detected_rooms) > 0:
            valid_annotations = self.pre_group_orthogonal_annotations(valid_annotations, detected_rooms)

        n_ann = len(valid_annotations)
        n_rooms = len(detected_rooms)

        if n_ann == 0 or n_rooms == 0:
            return {
                "matched_associations": [],
                "ambiguous_annotations": [],
                "rejected_annotations": valid_annotations,
                "is_calibrated": False,
                "scale_px_per_m": None,
                "scale_m_per_px": None,
                "provenance": "UNAVAILABLE",
                "message": "Zero valid OCR dimension annotations or detected rooms.",
            }

        # Step 2: Build Cost Matrix (N_ann x N_rooms)
        cost_matrix = np.zeros((n_ann, n_rooms), dtype=np.float32)
        cost_breakdowns = [[None for _ in range(n_rooms)] for _ in range(n_ann)]

        for i, ann in enumerate(valid_annotations):
            # Optional: detect nearby dimension lines if image is provided
            det_lines = []
            if floorplan_image is not None and "bbox" in ann:
                det_lines = self.extract_dimension_lines_from_image(floorplan_image, ann["bbox"])
            best_line = det_lines[0] if det_lines else None

            for j, room in enumerate(detected_rooms):
                bd = self.compute_matching_cost(ann, room, best_line)
                cost_matrix[i, j] = bd["total_cost"]
                cost_breakdowns[i][j] = bd

        # Step 3: Global Bipartite Hungarian Assignment
        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        matched_associations = []
        ambiguous_annotations = []
        rejected_annotations = []
        room_scale_estimates = []

        assigned_annotations = set(row_ind)
        assigned_rooms = set(col_ind)

        for i, j in zip(row_ind, col_ind):
            cost = cost_matrix[i, j]
            ann = valid_annotations[i]
            room = detected_rooms[j]
            bd = cost_breakdowns[i][j]

            # Ambiguity Check: Margin against 2nd best candidate room
            row_costs = sorted(cost_matrix[i, :])
            margin = (row_costs[1] - cost) if len(row_costs) > 1 else 1.0

            if cost > self.max_cost_threshold:
                # Cost too high -> reject
                rejected_annotations.append({
                    "annotation": ann["raw_text"],
                    "candidate_room": room.get("type", "Room"),
                    "cost": cost,
                    "reason": f"Cost {cost:.3f} exceeded threshold {self.max_cost_threshold:.3f}",
                })
                continue

            if margin < self.min_margin_threshold:
                # Insufficient distinction between rooms -> flag AMBIGUOUS
                ambiguous_annotations.append({
                    "annotation": ann["raw_text"],
                    "matched_room_id": room.get("query_id", room.get("room_id", j)),
                    "room_type": room.get("type", "Room"),
                    "cost": cost,
                    "margin": round(margin, 4),
                    "reason": f"Ambiguous association: Margin {margin:.3f} < {self.min_margin_threshold:.3f}",
                })
                continue

            # Compute physical scale from matched pair
            parsed = ann["parsed_dims"]
            mabr = room.get("mabr", {})
            px_len = mabr.get("length_px", 0.0)
            px_wid = mabr.get("width_px", 0.0)

            if px_len <= 5.0 or px_wid <= 5.0:
                rejected_annotations.append({
                    "annotation": ann["raw_text"],
                    "candidate_room": room.get("type", "Room"),
                    "cost": cost,
                    "reason": "Room pixel dimensions too small for reliable scale calculation.",
                })
                continue

            # Handle paired vs single dimensions
            if parsed.get("is_paired"):
                m_len = parsed["length_m"]
                m_wid = parsed["width_m"]
                ppm_len = px_len / max(1e-3, m_len)
                ppm_wid = px_wid / max(1e-3, m_wid)
                pair_ppm = (ppm_len + ppm_wid) / 2.0
                scale_var = abs(ppm_len - ppm_wid) / max(1e-3, pair_ppm)

                if scale_var > 0.40:
                    # Mismatch between length and width scale -> flag ambiguous
                    ambiguous_annotations.append({
                        "annotation": ann["raw_text"],
                        "matched_room_id": room.get("query_id", room.get("room_id", j)),
                        "room_type": room.get("type", "Room"),
                        "cost": cost,
                        "scale_variance": round(scale_var, 4),
                        "reason": f"Length/width scale disagreement ({scale_var * 100:.1f}% > 40%)",
                    })
                    continue

                derived_ppm = pair_ppm
            else:
                # Single dimension: match to closest oriented dimension
                dim_m = parsed["dimension_m"]
                ppm_candidates = [px_len / dim_m, px_wid / dim_m]
                valid_ppms = [p for p in ppm_candidates if self.min_plausible_ppm <= p <= self.max_plausible_ppm]
                if not valid_ppms:
                    rejected_annotations.append({
                        "annotation": ann["raw_text"],
                        "candidate_room": room.get("type", "Room"),
                        "cost": cost,
                        "reason": "Derived scale out of plausible bounds.",
                    })
                    continue
                derived_ppm = min(valid_ppms, key=lambda p: abs(p - 68.0))

            if not (self.min_plausible_ppm <= derived_ppm <= self.max_plausible_ppm):
                rejected_annotations.append({
                    "annotation": ann["raw_text"],
                    "candidate_room": room.get("type", "Room"),
                    "cost": cost,
                    "reason": f"Derived PPM {derived_ppm:.2f} out of bounds [{self.min_plausible_ppm}, {self.max_plausible_ppm}]",
                })
                continue

            # Verified Match!
            room_scale_estimates.append(derived_ppm)
            matched_associations.append({
                "annotation_text": ann["raw_text"],
                "room_id": room.get("query_id", room.get("room_id", j)),
                "room_type": room.get("type", "Room"),
                "matching_cost": cost,
                "margin": round(margin, 4),
                "cost_breakdown": bd,
                "derived_ppm": round(derived_ppm, 3),
                "derived_scale_m_per_px": 1.0 / derived_ppm,
                "confidence": round(max(0.0, 1.0 - cost), 3),
                "status": "VERIFIED_MATCH",
            })

        # Add unassigned annotations to rejected
        for i in range(n_ann):
            if i not in assigned_annotations:
                rejected_annotations.append({
                    "annotation": valid_annotations[i]["raw_text"],
                    "reason": "No unassigned candidate room available in Hungarian assignment.",
                })

        # Step 4: Consensus Scale Formulation
        is_calibrated = len(room_scale_estimates) > 0
        if is_calibrated:
            consensus_ppm = float(np.median(room_scale_estimates))
            consensus_scale_s = 1.0 / consensus_ppm
            provenance = "MEASURED"
        else:
            consensus_ppm = None
            consensus_scale_s = None
            provenance = "UNAVAILABLE"

        return {
            "matched_associations": matched_associations,
            "ambiguous_annotations": ambiguous_annotations,
            "rejected_annotations": rejected_annotations,
            "total_detected_annotations": n_ann,
            "verified_matches_count": len(matched_associations),
            "ambiguous_count": len(ambiguous_annotations),
            "rejected_count": len(rejected_annotations),
            "is_calibrated": is_calibrated,
            "scale_px_per_m": round(consensus_ppm, 3) if consensus_ppm else None,
            "scale_m_per_px": consensus_scale_s,
            "provenance": provenance,
        }
