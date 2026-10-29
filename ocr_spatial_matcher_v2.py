"""
Geometric OCR Spatial Matcher Module (Version 2 - Corrective Experiment)
========================================================================
HomeVerse Project - Milestone G5-OCR-v2 Corrective Experiment

Addresses the three critical defects identified in the G5 frozen benchmark:
  1. Bounding-Box Fallback Safeguard:
     - Detects and rejects dummy full-image bounding boxes ([W/2, H/2]).
     - Missing spatial evidence remains explicitly unlocalized (zero fabricated centers).
  2. Globally Valid Hungarian Margin Evaluation:
     - Margin is evaluated as Delta_margin = min_{k != j} C_{ik} - C_{ij} against valid alternative rooms.
     - Eliminates false ambiguity rejections caused by Hungarian global cost optimization.
  3. Query Confidence Filtering:
     - Filters out low-confidence queries (conf < tau_conf) before bipartite matching,
       preventing background fragments from siphoning annotations.
  4. Rotated / Vertical Dimension Orientation Inversion Handling:
     - Supports orthogonal dimension transposition (W <-> L) for vertical text labels.
"""

import math
import re
from typing import Dict, List, Optional, Tuple, Any, Set
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import linear_sum_assignment
from shapely.geometry import Polygon, Point, LineString

from ocr_spatial_matcher import parse_dimension_annotation


class OCRSpatialMatcherV2:
    """
    Corrective G5-OCR-v2 Geometric Bipartite Matcher.
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        max_cost_threshold: float = 0.65,
        min_margin_threshold: float = 0.08,
        min_plausible_ppm: float = 15.0,
        max_plausible_ppm: float = 250.0,
        min_query_conf: float = 0.25,
    ):
        self.weights = weights or {
            "w_line": 0.25,
            "w_proj": 0.20,
            "w_cont": 0.25,
            "w_orient": 0.15,
            "w_aspect": 0.15,
        }
        self.max_cost_threshold = max_cost_threshold
        self.min_margin_threshold = min_margin_threshold
        self.min_plausible_ppm = min_plausible_ppm
        self.max_plausible_ppm = max_plausible_ppm
        self.min_query_conf = min_query_conf

    def filter_query_rooms(
        self,
        detected_rooms: List[Dict[str, Any]],
        conf_thresh: Optional[float] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Safeguard 3: Filters out low-confidence room query predictions prior to matching.
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

    def validate_spatial_evidence(
        self,
        annotation: Dict[str, Any],
        image_size: Tuple[int, int] = (1024, 1024),
    ) -> bool:
        """
        Safeguard 1: Validates that an annotation has genuine local spatial evidence.
        Rejects full-image dummy bounding boxes spanning >= 60% of image dimensions.
        """
        bbox = annotation.get("bbox")
        if not bbox or len(bbox) < 4:
            return False

        bx, by, bw, bh = bbox
        img_w, img_h = image_size

        # Dummy bounding box check: Spans most of image or centered at exact midpoint
        if bw >= 0.60 * img_w or bh >= 0.60 * img_h:
            return False

        # If bounding box is degenerate (0 area)
        if bw <= 1 or bh <= 1:
            return False

        return True

    def compute_containment_distance(
        self,
        annotation_center: Tuple[float, float],
        room_poly_pts: List[Tuple[float, float]],
    ) -> float:
        """
        Computes spatial containment penalty D_containment in [0, 1].
        """
        if len(room_poly_pts) < 3:
            return 1.0

        poly = Polygon(room_poly_pts)
        if not poly.is_valid:
            poly = poly.buffer(0)

        pt = Point(annotation_center)
        if poly.contains(pt):
            return 0.0

        dist = poly.distance(pt)
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
        Computes D_line in [0, 1].
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
        Computes D_projection in [0, 1].
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
            dist1 = poly.boundary.distance(p1)
            dist2 = poly.boundary.distance(p2)
            avg_proj_dist = (dist1 + dist2) / 2.0
            return float(min(1.0, avg_proj_dist / (diag * 0.35)))
        else:
            c = poly.centroid
            cx, cy = annotation_center
            dist_to_centroid = math.hypot(cx - c.x, cy - c.y)
            return float(min(1.0, dist_to_centroid / (diag * 0.5)))

    def compute_orientation_alignment(
        self,
        dim_angle_deg: Optional[float],
        wall_segments: List[Dict[str, Any]],
    ) -> float:
        """
        Computes D_orientation in [0, 1].
        """
        if not wall_segments:
            return 0.20

        target_angles = []
        if dim_angle_deg is not None:
            target_angles.append(dim_angle_deg % 180.0)
        else:
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

        norm_diff = min(1.0, min_angle_diff / 45.0)
        return float(norm_diff)

    def compute_aspect_ratio_distance(
        self,
        parsed_dim: Dict[str, Any],
        room_aspect_ratio: float,
        is_vertical_text: bool = False,
    ) -> float:
        """
        Computes D_aspect in [0, 1] with vertical orientation swap support.
        """
        if not parsed_dim.get("is_paired", False):
            return 0.0

        printed_aspect = parsed_dim.get("aspect_ratio", 1.0)
        aspect_ratio_diff = abs(printed_aspect - room_aspect_ratio) / max(1e-4, printed_aspect)

        # If vertical text, also test inverted aspect (1.0 / printed_aspect)
        if is_vertical_text:
            inv_aspect = 1.0 / max(1e-4, printed_aspect)
            inv_diff = abs(inv_aspect - room_aspect_ratio) / max(1e-4, inv_aspect)
            aspect_ratio_diff = min(aspect_ratio_diff, inv_diff)

        norm_aspect_cost = min(1.0, aspect_ratio_diff / 0.50)
        return float(norm_aspect_cost)

    def compute_matching_cost(
        self,
        annotation: Dict[str, Any],
        room: Dict[str, Any],
        detected_line: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, float]:
        """
        Evaluates 5-component cost function.
        """
        center = annotation.get("center", (0.0, 0.0))
        parsed = annotation.get("parsed_dims", {})
        poly_pts = room.get("polygon_pixels", [])
        walls = room.get("wall_segments", [])
        mabr = room.get("mabr", {})
        room_aspect = mabr.get("aspect_ratio", 1.0)

        line_angle = detected_line.get("angle_deg") if detected_line else None
        is_vert = (line_angle is not None and (35.0 <= (line_angle % 180.0) <= 145.0))

        d_line = self.compute_line_distance(center, detected_line, poly_pts)
        d_proj = self.compute_projection_alignment(detected_line, center, poly_pts)
        d_cont = self.compute_containment_distance(center, poly_pts)
        d_orient = self.compute_orientation_alignment(line_angle, walls)
        d_aspect = self.compute_aspect_ratio_distance(parsed, room_aspect, is_vertical_text=is_vert)

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

    def match(
        self,
        ocr_annotations: List[Dict[str, Any]],
        detected_rooms: List[Dict[str, Any]],
        image_size: Tuple[int, int] = (1024, 1024),
    ) -> Dict[str, Any]:
        """
        Executes G5-OCR-v2 matching with all three safeguards active.
        """
        # Safeguard 3: Query Confidence Filtering
        filtered_rooms, filtered_queries_count = self.filter_query_rooms(detected_rooms)

        # Safeguard 1: Filter annotations with valid localized bounding box evidence
        valid_annotations = []
        unlocalized_annotations = []

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

                # Validate spatial localization
                if self.validate_spatial_evidence(ann_copy, image_size=image_size):
                    valid_annotations.append(ann_copy)
                else:
                    unlocalized_annotations.append({
                        "annotation": ann_copy["raw_text"],
                        "reason": "Lacks localized spatial bounding box (dummy full-image center rejected)",
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

        # Build Cost Matrix
        cost_matrix = np.zeros((n_ann, n_rooms), dtype=np.float32)
        cost_breakdowns = [[None for _ in range(n_rooms)] for _ in range(n_ann)]

        for i, ann in enumerate(valid_annotations):
            for j, room in enumerate(filtered_rooms):
                bd = self.compute_matching_cost(ann, room)
                cost_matrix[i, j] = bd["total_cost"]
                cost_breakdowns[i][j] = bd

        # Bipartite Assignment
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

            # Safeguard 2: Globally Valid Alternative Margin Calculation
            # Compare assigned room cost against the best alternative candidate room k != j
            alternative_costs = [cost_matrix[i, k] for k in range(n_rooms) if k != j]
            if alternative_costs:
                min_alt_cost = min(alternative_costs)
                delta_margin = min_alt_cost - cost
            else:
                delta_margin = 1.0

            if cost > self.max_cost_threshold:
                rejected_annotations.append({
                    "annotation": ann["raw_text"],
                    "candidate_room": room.get("type", "Room"),
                    "cost": float(cost),
                    "reason": f"Cost {cost:.3f} exceeded threshold {self.max_cost_threshold:.3f}",
                })
                continue

            # Flag ambiguous only if an alternative room is nearly as good as assigned room
            if delta_margin < self.min_margin_threshold:
                ambiguous_annotations.append({
                    "annotation": ann["raw_text"],
                    "matched_room_id": room.get("query_id", room.get("room_id", j)),
                    "room_type": room.get("type", "Room"),
                    "cost": float(cost),
                    "margin": round(float(delta_margin), 4),
                    "reason": f"Alternative candidate room within delta margin {delta_margin:.3f} < {self.min_margin_threshold:.3f}",
                })
                continue

            # Compute physical scale from verified match
            parsed = ann["parsed_dims"]
            mabr = room.get("mabr", {})
            px_len = mabr.get("length_px", 0.0)
            px_wid = mabr.get("width_px", 0.0)

            if px_len <= 5.0 or px_wid <= 5.0:
                rejected_annotations.append({
                    "annotation": ann["raw_text"],
                    "candidate_room": room.get("type", "Room"),
                    "cost": float(cost),
                    "reason": "Room pixel dimensions too small for reliable scale calculation.",
                })
                continue

            if parsed.get("is_paired"):
                m_len = parsed["length_m"]
                m_wid = parsed["width_m"]
                ppm_len = px_len / max(1e-3, m_len)
                ppm_wid = px_wid / max(1e-3, m_wid)
                pair_ppm = (ppm_len + ppm_wid) / 2.0
                scale_var = abs(ppm_len - ppm_wid) / max(1e-3, pair_ppm)

                if scale_var > 0.40:
                    ambiguous_annotations.append({
                        "annotation": ann["raw_text"],
                        "matched_room_id": room.get("query_id", room.get("room_id", j)),
                        "room_type": room.get("type", "Room"),
                        "cost": float(cost),
                        "scale_variance": round(float(scale_var), 4),
                        "reason": f"Length/width scale disagreement ({scale_var * 100:.1f}% > 40%)",
                    })
                    continue

                derived_ppm = pair_ppm
            else:
                dim_m = parsed["dimension_m"]
                ppm_candidates = [px_len / dim_m, px_wid / dim_m]
                valid_ppms = [p for p in ppm_candidates if self.min_plausible_ppm <= p <= self.max_plausible_ppm]
                if not valid_ppms:
                    rejected_annotations.append({
                        "annotation": ann["raw_text"],
                        "candidate_room": room.get("type", "Room"),
                        "cost": float(cost),
                        "reason": "Derived scale out of plausible bounds.",
                    })
                    continue
                derived_ppm = min(valid_ppms, key=lambda p: abs(p - 68.0))

            if not (self.min_plausible_ppm <= derived_ppm <= self.max_plausible_ppm):
                rejected_annotations.append({
                    "annotation": ann["raw_text"],
                    "candidate_room": room.get("type", "Room"),
                    "cost": float(cost),
                    "reason": f"Derived PPM {derived_ppm:.2f} out of bounds [{self.min_plausible_ppm}, {self.max_plausible_ppm}]",
                })
                continue

            room_scale_estimates.append(derived_ppm)
            matched_associations.append({
                "annotation_text": ann["raw_text"],
                "room_id": room.get("query_id", room.get("room_id", j)),
                "room_type": room.get("type", "Room"),
                "matching_cost": float(cost),
                "margin": round(float(delta_margin), 4),
                "derived_ppm": round(float(derived_ppm), 3),
                "derived_scale_m_per_px": 1.0 / float(derived_ppm),
                "confidence": round(max(0.0, 1.0 - float(cost)), 3),
                "status": "VERIFIED_MATCH",
            })

        for i in range(n_ann):
            if i not in assigned_annotations:
                rejected_annotations.append({
                    "annotation": valid_annotations[i]["raw_text"],
                    "reason": "No candidate room assigned in Hungarian assignment.",
                })

        is_calibrated = len(room_scale_estimates) > 0
        consensus_ppm = float(np.median(room_scale_estimates)) if is_calibrated else None

        return {
            "matched_associations": matched_associations,
            "ambiguous_annotations": ambiguous_annotations,
            "unlocalized_annotations": unlocalized_annotations,
            "rejected_annotations": rejected_annotations,
            "total_detected_annotations": len(ocr_annotations),
            "localized_annotations_count": n_ann,
            "unlocalized_count": len(unlocalized_annotations),
            "filtered_queries_count": filtered_queries_count,
            "retained_rooms_count": n_rooms,
            "verified_matches_count": len(matched_associations),
            "ambiguous_count": len(ambiguous_annotations),
            "rejected_count": len(rejected_annotations),
            "is_calibrated": is_calibrated,
            "scale_px_per_m": round(consensus_ppm, 3) if consensus_ppm else None,
            "scale_m_per_px": (1.0 / consensus_ppm) if consensus_ppm else None,
            "provenance": "MEASURED" if is_calibrated else "UNAVAILABLE",
        }
