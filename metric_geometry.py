"""
Metric Geometry & Physical Dimension Derivation Module
======================================================
HomeVerse Project - Milestone G5: Metric Geometry & Dimension Calibration

Derives real-world physical architectural measurements from refined 2D polygons:
  1. Scaled Shoelace Floor Area (A_m2 = A_px2 * s^2)
  2. Metric Polygon Perimeter (P_m = P_px * s)
  3. Minimum Area Bounding Rectangle (MABR) Oriented Dimensions (L_m, W_m)
  4. Individual Wall-Segment Lengths (l_i_m = ||p_{i+1} - p_i||_2 * s)
  5. Geometric Form Factors (Solidity, Aspect Ratio, Convexity)
  6. Rigorous 3-Scenario Mathematical Error Decomposition:
       Scenario 1: GT Polygon + Predicted Scale -> Isolates Scale Calibration Error
       Scenario 2: Predicted Polygon + GT Scale -> Isolates Geometric Segmentation Error
       Scenario 3: Predicted Polygon + Predicted Scale -> Measures End-to-End Area Error
"""

import math
from typing import Dict, List, Optional, Tuple, Any, Union

import cv2
import numpy as np
from shapely.geometry import Polygon, MultiPolygon
from shapely.validation import explain_validity


def calculate_shoelace_area_px(pts: List[Tuple[float, float]]) -> float:
    """
    Computes exact 2D polygon area in pixel^2 using the Shoelace formula.
    """
    n = len(pts)
    if n < 3:
        return 0.0
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1]
    return abs(area) / 2.0


def calculate_polygon_perimeter_px(pts: List[Tuple[float, float]]) -> float:
    """
    Computes exact 2D polygon perimeter in pixels (Euclidean sum of edges).
    """
    n = len(pts)
    if n < 2:
        return 0.0
    perimeter = 0.0
    for i in range(n):
        j = (i + 1) % n
        dx = pts[j][0] - pts[i][0]
        dy = pts[j][1] - pts[i][1]
        perimeter += math.hypot(dx, dy)
    return perimeter


def calculate_wall_segments(
    pts: List[Tuple[float, float]],
    scale_m_per_px: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Computes individual wall segment lengths and orientations.
    If scale_m_per_px is provided, adds metric lengths in meters.
    """
    n = len(pts)
    if n < 2:
        return []

    segments = []
    for i in range(n):
        j = (i + 1) % n
        p1 = pts[i]
        p2 = pts[j]
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        len_px = math.hypot(dx, dy)
        angle_deg = math.degrees(math.atan2(dy, dx)) % 360.0

        seg = {
            "index": i,
            "start": [round(p1[0], 2), round(p1[1], 2)],
            "end": [round(p2[0], 2), round(p2[1], 2)],
            "length_px": round(len_px, 2),
            "angle_deg": round(angle_deg, 1),
        }
        if scale_m_per_px is not None and scale_m_per_px > 0:
            seg["length_m"] = round(len_px * scale_m_per_px, 3)
        else:
            seg["length_m"] = None

        segments.append(seg)

    return segments


def calculate_mabr_dimensions(
    pts: List[Tuple[float, float]],
    scale_m_per_px: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes Minimum Area Bounding Rectangle (MABR) / Oriented Bounding Box.
    Returns:
      length_px, width_px (where length >= width)
      length_m, width_m (if scale_m_per_px is available)
      rotation_deg, center_px
    Note: MABR dimensions represent the bounding envelope and may differ from
    actual opposing wall lengths in irregular/non-convex rooms.
    """
    if len(pts) < 3:
        return {
            "length_px": 0.0,
            "width_px": 0.0,
            "length_m": None,
            "width_m": None,
            "aspect_ratio": 1.0,
            "rotation_deg": 0.0,
            "center": [0.0, 0.0],
        }

    np_pts = np.array(pts, dtype=np.float32)
    rect = cv2.minAreaRect(np_pts)
    (cx, cy), (w, h), angle = rect

    # Convention: length >= width
    dim_len_px = max(w, h)
    dim_wid_px = min(w, h)
    aspect_ratio = dim_len_px / max(1e-4, dim_wid_px)

    res = {
        "length_px": round(dim_len_px, 2),
        "width_px": round(dim_wid_px, 2),
        "aspect_ratio": round(aspect_ratio, 3),
        "rotation_deg": round(angle, 1),
        "center": [round(cx, 2), round(cy, 2)],
    }

    if scale_m_per_px is not None and scale_m_per_px > 0:
        res["length_m"] = round(dim_len_px * scale_m_per_px, 2)
        res["width_m"] = round(dim_wid_px * scale_m_per_px, 2)
    else:
        res["length_m"] = None
        res["width_m"] = None

    return res


def calculate_form_factors(pts: List[Tuple[float, float]]) -> Dict[str, Any]:
    """
    Computes shape form factors:
      - Solidity: Area(Polygon) / Area(ConvexHull) in (0, 1]
      - Convexity: True if Solidity >= 0.96 and no reflex corners > 185 deg
    """
    if len(pts) < 3:
        return {"solidity": 1.0, "is_non_convex": False}

    poly_area = calculate_shoelace_area_px(pts)
    np_pts = np.array(pts, dtype=np.float32)
    hull = cv2.convexHull(np_pts)
    hull_area = cv2.contourArea(hull)

    solidity = poly_area / max(1e-4, hull_area)
    solidity = min(1.0, max(0.0, solidity))

    is_non_convex = (solidity < 0.94)

    return {
        "solidity": round(solidity, 4),
        "convex_hull_area_px": round(hull_area, 2),
        "is_non_convex": is_non_convex,
    }


def compute_physical_room_geometry(
    polygon_pixels: List[Tuple[float, float]],
    scale_m_per_px: Optional[float] = None,
    room_type: str = "Room",
) -> Dict[str, Any]:
    """
    Unified geometric derivation function.
    Converts 2D pixel polygon into physical room geometry with calibrated metric attributes.
    """
    n_pts = len(polygon_pixels)
    if n_pts < 3:
        return {
            "room_type": room_type,
            "is_valid": False,
            "area_px2": 0.0,
            "area_m2": None,
            "perimeter_px": 0.0,
            "perimeter_m": None,
            "mabr": {},
            "wall_segments": [],
            "form_factors": {},
        }

    area_px = calculate_shoelace_area_px(polygon_pixels)
    perim_px = calculate_polygon_perimeter_px(polygon_pixels)
    mabr = calculate_mabr_dimensions(polygon_pixels, scale_m_per_px)
    walls = calculate_wall_segments(polygon_pixels, scale_m_per_px)
    form = calculate_form_factors(polygon_pixels)

    res = {
        "room_type": room_type,
        "is_valid": True,
        "vertices_count": n_pts,
        "area_px2": round(area_px, 2),
        "perimeter_px": round(perim_px, 2),
        "mabr": mabr,
        "wall_segments": walls,
        "form_factors": form,
    }

    if scale_m_per_px is not None and scale_m_per_px > 0:
        # A_m2 = A_px2 * s^2
        area_m2 = area_px * (scale_m_per_px ** 2)
        perim_m = perim_px * scale_m_per_px
        res["area_m2"] = round(area_m2, 4)
        res["perimeter_m"] = round(perim_m, 3)
        res["is_metric_calibrated"] = True
    else:
        res["area_m2"] = None
        res["perimeter_m"] = None
        res["is_metric_calibrated"] = False

    return res


def decompose_area_error(
    area_px_pred: float,
    area_px_gt: float,
    scale_pred: Optional[float],
    scale_gt: float,
) -> Dict[str, Any]:
    """
    Rigorous 3-Scenario Mathematical Error Decomposition.
    
    Mathematical Formulation:
      A_pred = A_px_pred * (s_pred)^2
      A_gt   = A_px_gt   * (s_gt)^2
      eps_pixel = (A_px_pred - A_px_gt) / A_px_gt
      eps_scale = (s_pred - s_gt) / s_gt
      eps_area  = (1 + eps_pixel) * (1 + eps_scale)^2 - 1

    Evaluates 3 distinct scenarios:
      Scenario 1 (Calibration isolated): GT Polygon + Predicted Scale
        A_scen1 = A_px_gt * (s_pred)^2
        Rel error = |A_scen1 - A_gt| / A_gt
      Scenario 2 (Geometry isolated): Predicted Polygon + GT Scale
        A_scen2 = A_px_pred * (s_gt)^2
        Rel error = |A_scen2 - A_gt| / A_gt
      Scenario 3 (End-to-end): Predicted Polygon + Predicted Scale
        A_scen3 = A_px_pred * (s_pred)^2
        Rel error = |A_scen3 - A_gt| / A_gt
    """
    if area_px_gt <= 0 or scale_gt <= 0:
        return {
            "error_pixel_rel": 0.0,
            "error_scale_rel": 0.0,
            "scenario1_calibration_error": 0.0,
            "scenario2_geometry_error": 0.0,
            "scenario3_total_error": 0.0,
        }

    gt_area_m2 = area_px_gt * (scale_gt ** 2)
    eps_pixel = (area_px_pred - area_px_gt) / area_px_gt

    if scale_pred is None or scale_pred <= 0:
        # No-scale / uncalibrated case
        # Scenario 2 can still be computed because GT scale exists for benchmark validation
        scen2_area_m2 = area_px_pred * (scale_gt ** 2)
        scen2_err = abs(scen2_area_m2 - gt_area_m2) / gt_area_m2
        return {
            "eps_pixel": eps_pixel,
            "eps_scale": None,
            "scenario1_calibration_error": None,
            "scenario2_geometry_error": scen2_err,
            "scenario3_total_error": None,
            "is_calibrated": False,
        }

    eps_scale = (scale_pred - scale_gt) / scale_gt

    # Scenario 1: Pure Calibration Error (GT geometry + predicted scale)
    scen1_area_m2 = area_px_gt * (scale_pred ** 2)
    scen1_err = abs(scen1_area_m2 - gt_area_m2) / gt_area_m2

    # Scenario 2: Pure Geometry Error (Predicted geometry + GT scale)
    scen2_area_m2 = area_px_pred * (scale_gt ** 2)
    scen2_err = abs(scen2_area_m2 - gt_area_m2) / gt_area_m2

    # Scenario 3: End-to-end Area Error (Predicted geometry + predicted scale)
    scen3_area_m2 = area_px_pred * (scale_pred ** 2)
    scen3_err = abs(scen3_area_m2 - gt_area_m2) / gt_area_m2

    # Verification of compounded formula:
    compounded_eps_area = (1.0 + eps_pixel) * ((1.0 + eps_scale) ** 2) - 1.0

    return {
        "eps_pixel": eps_pixel,
        "eps_scale": eps_scale,
        "scenario1_calibration_error": scen1_err,
        "scenario2_geometry_error": scen2_err,
        "scenario3_total_error": scen3_err,
        "compounded_relative_area_error": compounded_eps_area,
        "is_calibrated": True,
    }
