"""
Architectural Dimension Normalization & Extraction Engine
Converts raw CAD/blueprint imperial dimensions (feet & inches) to metric standards,
calculates areas, evaluates percentage errors against ground truth, and preserves exact source room labels.
"""

import re
from typing import Dict, Any, Optional, Tuple, List


# Exact conversion factors
METERS_PER_FOOT = 0.3048
INCHES_PER_FOOT = 12.0
METERS_PER_INCH = METERS_PER_FOOT / INCHES_PER_FOOT
SQFT_PER_SQM = 10.7639104


def parse_imperial_length(text: str) -> Optional[float]:
    """
    Parses a single dimension string (e.g. `11'11"`, `11'-11"`, `5'0"`, `5'3"`, `12'`) into meters.
    Returns float meters or None if unparseable.
    """
    if not text:
        return None
    cleaned = text.strip().replace("’", "'").replace("”", '"').replace("“", '"')

    # Case 1: Feet and Inches (e.g. 11'11", 11'-11", 5'0")
    match_fi = re.search(r"(\d+)\s*(?:'|ft|feet|-)\s*(\d+(?:\.\d+)?)\s*(?:\"|in|inches)?", cleaned, re.IGNORECASE)
    if match_fi:
        feet = float(match_fi.group(1))
        inches = float(match_fi.group(2))
        total_meters = (feet * METERS_PER_FOOT) + (inches * METERS_PER_INCH)
        return round(total_meters, 3)

    # Case 2: Only Feet (e.g. 6', 12 ft)
    match_f = re.search(r"(\d+(?:\.\d+)?)\s*(?:'|ft|feet)", cleaned, re.IGNORECASE)
    if match_f:
        feet = float(match_f.group(1))
        return round(feet * METERS_PER_FOOT, 3)

    # Case 3: Only Inches (e.g. 63", 48 in)
    match_i = re.search(r"(\d+(?:\.\d+)?)\s*(?:\"|in|inches)", cleaned, re.IGNORECASE)
    if match_i:
        inches = float(match_i.group(1))
        return round(inches * METERS_PER_INCH, 3)

    # Case 4: Pure metric (e.g. 3.63m, 4.55)
    match_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:m|meters)?", cleaned, re.IGNORECASE)
    if match_m:
        val = float(match_m.group(1))
        return round(val, 3)

    return None


def parse_dimension_pair(text: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Parses a dimension pair like `11'11" × 12'11"`, `11'11" x 12'11"`, or `3.63m x 3.94m`.
    Returns (width_m, length_m) or (None, None).
    """
    if not text:
        return None, None

    # Handle single span like "5'3" WIDE"
    if "WIDE" in text.upper():
        val = parse_imperial_length(text.upper().replace("WIDE", ""))
        return val, val

    # Split on ×, x, X, or BY
    parts = re.split(r"\s*(?:×|x|X|by)\s*", text.strip())
    if len(parts) >= 2:
        w = parse_imperial_length(parts[0])
        l = parse_imperial_length(parts[1])
        return w, l

    # Single value fallback
    w = parse_imperial_length(text)
    return w, w


def meters_to_imperial_str(meters: float) -> str:
    """Converts a dimension in meters to standard architectural imperial notation (e.g. 11'11\")."""
    total_inches = meters / METERS_PER_INCH
    feet = int(total_inches // 12)
    inches = round(total_inches % 12)
    if inches == 12:
        feet += 1
        inches = 0
    return f"{feet}'{inches}\""


def calculate_dimension_error(detected: float, ground_truth: float) -> float:
    """Calculates absolute percentage error: |detected - gt| / gt * 100%."""
    if ground_truth <= 0:
        return 0.0
    return round(abs(detected - ground_truth) / ground_truth * 100.0, 2)


class DimensionNormalizer:
    """
    Normalizes architectural room records, converting imperial annotations
    into exact metric dimensions and maintaining ground-truth comparison.
    """

    @staticmethod
    def normalize_room_record(
        source_label: str,
        detected_w_m: float,
        detected_l_m: float,
        gt_imperial_str: Optional[str] = None,
        gt_w_m: Optional[float] = None,
        gt_l_m: Optional[float] = None,
        confidence: float = 0.90,
        ceiling_height_m: float = 2.8
    ) -> Dict[str, Any]:
        """
        Builds a canonical, dimensionally faithful room output dictionary
        matching the user's structured schema:
        Detected Room -> Detected Dimensions -> Ground Truth Dimensions -> Dimension Error % -> Detection Confidence.
        """
        # If ground truth was provided as a string (e.g. 11'11" × 12'11"), parse it
        if gt_imperial_str and (gt_w_m is None or gt_l_m is None):
            parsed_gw, parsed_gl = parse_dimension_pair(gt_imperial_str)
            gt_w_m = gt_w_m or parsed_gw
            gt_l_m = gt_l_m or parsed_gl

        detected_w = round(detected_w_m, 2)
        detected_l = round(detected_l_m, 2)
        detected_area = round(detected_w * detected_l, 2)
        detected_area_sqft = round(detected_area * SQFT_PER_SQM, 1)

        result: Dict[str, Any] = {
            "source_label": source_label,
            "name": source_label,  # Preserve the exact authentic label (no synthetic renaming)
            "room_type": DimensionNormalizer.infer_room_type(source_label),
            "width_m": detected_w,
            "length_m": detected_l,
            "height_m": ceiling_height_m,
            "area_sqm": detected_area,
            "area_sqft": detected_area_sqft,
            "detected_imperial": f"{meters_to_imperial_str(detected_w)} × {meters_to_imperial_str(detected_l)}",
            "confidence": round(confidence, 3),
        }

        # If ground truth is known, compute exact discrepancies
        if gt_w_m is not None and gt_l_m is not None:
            gt_w = round(gt_w_m, 2)
            gt_l = round(gt_l_m, 2)
            gt_area = round(gt_w * gt_l, 2)
            gt_area_sqft = round(gt_area * SQFT_PER_SQM, 1)

            err_w = calculate_dimension_error(detected_w, gt_w)
            err_l = calculate_dimension_error(detected_l, gt_l)
            err_area = calculate_dimension_error(detected_area, gt_area)

            # Combined dimension error % (average of width and length error)
            combined_dim_error = round((err_w + err_l) / 2.0, 2)

            result.update({
                "ground_truth_w_m": gt_w,
                "ground_truth_l_m": gt_l,
                "ground_truth_area_sqm": gt_area,
                "ground_truth_area_sqft": gt_area_sqft,
                "ground_truth_imperial": gt_imperial_str or f"{meters_to_imperial_str(gt_w)} × {meters_to_imperial_str(gt_l)}",
                "width_error_pct": err_w,
                "length_error_pct": err_l,
                "dimension_error_pct": combined_dim_error,
                "area_error_pct": err_area,
                "is_dimensionally_accurate": combined_dim_error <= 5.0
            })
        else:
            result.update({
                "ground_truth_imperial": None,
                "dimension_error_pct": None,
                "is_dimensionally_accurate": True
            })

        return result

    @staticmethod
    def infer_room_type(label: str) -> str:
        """Map raw architectural blueprint label to canonical category for 3D shaders/models."""
        l = label.upper()
        if "MASTER BED" in l:
            return "master_bedroom"
        if "BED" in l:
            return "bedroom"
        if "DRAWING" in l:
            return "drawing_room"
        if "LIVING" in l:
            return "living_room"
        if "DINING" in l:
            return "dining_room"
        if "KITCHEN" in l:
            return "kitchen"
        if "TOILET" in l or "BATH" in l or "WC" in l:
            return "bathroom"
        if "BALCONY" in l or "SITOUT" in l:
            return "balcony"
        if "UTILITY" in l or "WASH" in l or "SERVICE" in l:
            return "utility"
        if "PUJA" in l or "POOJA" in l:
            return "puja"
        if "FOYER" in l or "ENTRY" in l or "LOBBY" in l:
            return "foyer"
        return "room"
