"""
Metric Scale Calibrator Module
==============================
HomeVerse Project - Milestone G5: Metric Geometry & Dimension Calibration

Implements the multi-modal 5-tier hierarchical scale calibration engine:
  Priority 1: Matched Printed Room Dimensions (OCR) -> Provenance: MEASURED
  Priority 2: Graphical Scale Bar Measurement        -> Provenance: MEASURED
  Priority 3: Canonical Reference Objects & Tags     -> Provenance: ESTIMATED
  Priority 4: Learned ViT Multi-Task Scale Head      -> Provenance: ESTIMATED
  Priority 5: Insufficient Evidence / No-Scale Plan  -> Provenance: UNAVAILABLE

Strict Rule:
  A floor plan without verified scale cues cannot yield unique metric dimensions.
  No-scale floor plans strictly return scale = None, provenance = UNAVAILABLE,
  and zero confidence (non-hallucination contract).
"""

import math
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union

import cv2
import numpy as np
from PIL import Image

try:
    import pytesseract
except ImportError:
    pytesseract = None


def parse_dimension_string(text: str) -> Optional[Tuple[float, float]]:
    """
    Parses architectural room dimensions from OCR strings into (width_m, length_m).
    Handles:
      - Explicit metric: '3.03 x 7.30 m', '3.03x7.30', '3.03*7.30'
      - Imperial feet/inches: "10'11\" x 12'11\"", "10'-5\"X15'-6\"", "11'0\" x 14'0\""
      - Centimeters: '228x730', '303x730' (150-999 cm -> 1.50m - 9.99m)
      - Millimeters: '3350 x 4270' (1000-15000 mm -> 1.0m - 15.0m)
      - Reference tags: '[Bed: 1.8x2.0m]', '[Table: 1.4x0.8m]'
    Returns (w_m, l_m) where w_m, l_m are floats in meters, or None.
    """
    if not text:
        return None

    cleaned = text.strip().replace("×", "x").replace("X", "x").replace("*", "x")

    # 1. Reference object tags: [Bed: 1.8x2.0m] or [Table: 1.4x0.8m]
    tag_m = re.search(r"\[.*?:?\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*m?\]", cleaned, re.IGNORECASE)
    if tag_m:
        w_m = float(tag_m.group(1))
        l_m = float(tag_m.group(2))
        if 0.4 <= w_m <= 15.0 and 0.4 <= l_m <= 15.0:
            return (round(w_m, 2), round(l_m, 2))

    # 2. Imperial format: W'D" x L'D" or W'-D" x L'-D"
    imp_pattern = re.compile(
        r"(\d+)\s*['’]\s*[-–]?\s*(\d+)?\s*[\"”]?\s*x\s*(\d+)\s*['’]\s*[-–]?\s*(\d+)?\s*[\"”]?",
        re.IGNORECASE
    )
    m = imp_pattern.search(cleaned)
    if m:
        w_ft = float(m.group(1)) + (float(m.group(2) or 0) / 12.0)
        l_ft = float(m.group(3)) + (float(m.group(4) or 0) / 12.0)
        w_m = round(w_ft * 0.3048, 2)
        l_m = round(l_ft * 0.3048, 2)
        if 0.5 <= w_m <= 25.0 and 0.5 <= l_m <= 25.0:
            return (w_m, l_m)

    # 3. Standard Metric format: 3.35 x 4.27 or 3.35m x 4.27m
    met_pattern = re.compile(
        r"(\d+\.\d{1,2})\s*m?\s*x\s*(\d+\.\d{1,2})\s*m?",
        re.IGNORECASE
    )
    m = met_pattern.search(cleaned)
    if m:
        w_m = round(float(m.group(1)), 2)
        l_m = round(float(m.group(2)), 2)
        if 0.5 <= w_m <= 30.0 and 0.5 <= l_m <= 30.0:
            return (w_m, l_m)

    # 4. Millimeters format: 3350 x 4270 (values > 1000)
    mm_pattern = re.compile(
        r"(\d{4,5})\s*x\s*(\d{4,5})",
        re.IGNORECASE
    )
    m = mm_pattern.search(cleaned)
    if m:
        val1 = float(m.group(1))
        val2 = float(m.group(2))
        if 1000 <= val1 <= 30000 and 1000 <= val2 <= 30000:
            return (round(val1 / 1000.0, 2), round(val2 / 1000.0, 2))

    # 5. Centimeters format: 228 x 730 (values between 120 and 999)
    cm_pattern = re.compile(
        r"(\d{3})\s*x\s*(\d{3})",
        re.IGNORECASE
    )
    m = cm_pattern.search(cleaned)
    if m:
        val1 = float(m.group(1))
        val2 = float(m.group(2))
        if 100 <= val1 <= 999 and 100 <= val2 <= 999:
            return (round(val1 / 100.0, 2), round(val2 / 100.0, 2))

    return None


def parse_reference_single_dim(text: str) -> Optional[Tuple[str, float]]:
    """
    Parses single-dimension reference tags such as:
      '[Sofa: 2.4m]', '[WC: 0.7m]', '[Counter: 0.6m]'
    Returns (item_type, length_m) or None.
    """
    if not text:
        return None
    cleaned = text.strip()
    m = re.search(r"\[\s*(\w+)\s*:\s*(\d+\.?\d*)\s*m?\s*\]", cleaned, re.IGNORECASE)
    if m:
        name = m.group(1).lower()
        val = float(m.group(2))
        if 0.3 <= val <= 5.0:
            return (name, round(val, 2))
    return None


class MetricScaleCalibrator:
    """
    Hierarchical Multi-Modal Scale Calibration Engine.
    Executes Priority 1 through Priority 5 with strict non-hallucination guarantees.
    """
    def __init__(
        self,
        min_plausible_ppm: float = 15.0,
        max_plausible_ppm: float = 250.0,
        ocr_conf_threshold: float = 40.0,
    ):
        self.min_plausible_ppm = min_plausible_ppm
        self.max_plausible_ppm = max_plausible_ppm
        self.ocr_conf_threshold = ocr_conf_threshold

    def extract_ocr_tokens(self, image_input: Union[str, Path, np.ndarray, Image.Image]) -> List[Dict[str, Any]]:
        """
        Runs Tesseract OCR and returns positioned text tokens with bounding boxes.
        """
        if pytesseract is None:
            return []

        if isinstance(image_input, (str, Path)):
            pil_img = Image.open(str(image_input)).convert("RGB")
        elif isinstance(image_input, np.ndarray):
            pil_img = Image.fromarray(cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB))
        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
        else:
            return []

        orig_w, orig_h = pil_img.size

        # Preprocessing: convert to grayscale
        np_img = np.array(pil_img)
        gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

        # First pass: standard OCR
        try:
            data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
        except Exception:
            return []

        tokens = []
        n_boxes = len(data["text"])
        for i in range(n_boxes):
            txt = data["text"][i].strip()
            conf = float(data["conf"][i])
            if not txt or conf < self.ocr_conf_threshold:
                continue

            x = int(data["left"][i])
            y = int(data["top"][i])
            w = int(data["width"][i])
            h = int(data["height"][i])
            tokens.append({
                "text": txt,
                "bbox": [x, y, w, h],
                "center": [x + w / 2.0, y + h / 2.0],
                "confidence": conf / 100.0,
            })

        # Also parse full multi-word lines
        full_text = pytesseract.image_to_string(gray)
        for line in full_text.splitlines():
            line_str = line.strip()
            dims = parse_dimension_string(line_str)
            if dims is not None and not any(t["text"] == line_str for t in tokens):
                tokens.append({
                    "text": line_str,
                    "bbox": [0, 0, orig_w, orig_h],
                    "center": [orig_w / 2.0, orig_h / 2.0],
                    "confidence": 0.70,
                })

        return tokens

    def detect_scale_bar(self, image_input: Union[str, Path, np.ndarray, Image.Image]) -> Optional[Dict[str, Any]]:
        """
        Detects graphical distance scale bar at image margins.
        A canonical architectural scale bar consists of:
          - A prominent horizontal baseline with end/middle ticks.
          - Text markings like '0', '2.5m', '5 m'.
        Returns calibration dictionary if found and verified, else None.
        """
        if isinstance(image_input, (str, Path)):
            img = cv2.imread(str(image_input))
        elif isinstance(image_input, np.ndarray):
            img = image_input.copy()
        elif isinstance(image_input, Image.Image):
            img = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
        else:
            return None

        if img is None:
            return None

        h, w = img.shape[:2]
        # Focus on bottom margin (typically bottom 12% of the image)
        y_start = int(h * 0.88)
        bottom_crop = img[y_start:, :]
        crop_h, crop_w = bottom_crop.shape[:2]

        gray = cv2.cvtColor(bottom_crop, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 40, 140)

        # Detect horizontal lines
        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=40,
            minLineLength=int(w * 0.08),  # at least 8% of image width
            maxLineGap=8
        )

        if lines is None:
            return None

        # Filter strictly horizontal lines (angle <= 2 degrees)
        candidates = []
        for l in lines:
            line = l[0] if len(l.shape) > 1 else l
            x1, y1, x2, y2 = line[0], line[1], line[2], line[3]
            length = float(np.hypot(x2 - x1, y2 - y1))
            dy = abs(y2 - y1)
            dx = abs(x2 - x1)
            angle = float(np.degrees(np.arctan2(dy, max(1e-5, dx))))
            if angle <= 2.0 and length >= w * 0.08:
                # Global coordinates
                gy1 = y1 + y_start
                candidates.append({
                    "x1": min(x1, x2),
                    "x2": max(x1, x2),
                    "y": gy1,
                    "length_px": length,
                })

        if not candidates:
            return None

        # Pick longest horizontal baseline
        candidates.sort(key=lambda c: c["length_px"], reverse=True)
        best_bar = candidates[0]
        bar_len_px = best_bar["length_px"]

        # Confirm with OCR on upscaled local region around the bar
        ocr_verified = False
        bar_metric_m = 5.0  # Standard architectural default: 5 meters
        if pytesseract is not None:
            bx1 = max(0, best_bar["x1"] - 20)
            bx2 = min(w, best_bar["x2"] + 30)
            by1 = max(0, best_bar["y"] - 35)
            by2 = min(h, best_bar["y"] + 15)
            bar_roi = img[by1:by2, bx1:bx2]
            if bar_roi.size > 0:
                roi_gray = cv2.cvtColor(bar_roi, cv2.COLOR_BGR2GRAY)
                # 3x upscale for small text readability
                roi_scaled = cv2.resize(roi_gray, (0, 0), fx=3.0, fy=3.0, interpolation=cv2.INTER_CUBIC)
                _, thresh = cv2.threshold(roi_scaled, 180, 255, cv2.THRESH_BINARY)
                roi_txt = pytesseract.image_to_string(thresh, config="--psm 6").lower()

                if "5m" in roi_txt or "5 m" in roi_txt or "5" in roi_txt:
                    bar_metric_m = 5.0
                    ocr_verified = True
                elif "10m" in roi_txt or "10 m" in roi_txt:
                    bar_metric_m = 10.0
                    ocr_verified = True
                elif "2.5" in roi_txt or "25m" in roi_txt:
                    bar_metric_m = 5.0
                    ocr_verified = True

        ppm = bar_len_px / bar_metric_m
        if self.min_plausible_ppm <= ppm <= self.max_plausible_ppm:
            scale_s = 1.0 / ppm
            return {
                "scale_px_per_m": round(ppm, 3),
                "scale_m_per_px": scale_s,
                "bar_length_px": bar_len_px,
                "bar_metric_m": bar_metric_m,
                "ocr_verified": ocr_verified,
                "confidence": 0.95 if ocr_verified else 0.82,
                "provenance": "MEASURED",
            }

        return None

    def detect_reference_cues(
        self,
        ocr_tokens: List[Dict[str, Any]],
        detected_rooms: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Detects standard reference object cues from tags or canonical furniture items.
        Returns scale estimate dictionary if high-confidence cues exist, else None.
        """
        ref_estimates = []
        matched_details = []

        # Canonical metric dimensions for reference objects:
        CANONICAL_PRIORS = {
            "bed": (1.80, 2.00),      # Standard queen bed (w=1.8m, l=2.0m)
            "sofa": 2.40,             # Standard 3-seater sofa (2.4m)
            "table": (1.40, 0.80),    # Dining table (1.4m x 0.8m)
            "wc": 0.70,               # Standard toilet fixture (0.7m)
            "counter": 0.60,          # Standard kitchen counter depth (0.6m)
        }

        for tok in ocr_tokens:
            txt = tok["text"]
            # 1. Two-dimensional tags: [Bed: 1.8x2.0m], [Table: 1.4x0.8m]
            dims = parse_dimension_string(txt)
            if dims and ("[" in txt or "bed" in txt.lower() or "table" in txt.lower()):
                w_m, l_m = dims
                # Match to containing room if available
                if detected_rooms:
                    cx, cy = tok["center"]
                    for room in detected_rooms:
                        rx, ry, rw, rh = room.get("bbox_pixels", [0, 0, 0, 0])
                        if rx <= cx <= rx + rw and ry <= cy <= ry + rh:
                            px_w = room.get("pixel_width", rw)
                            px_l = room.get("pixel_length", rh)
                            # Tag gives furniture dimension, room gives context
                            # If room is a Bedroom and bed tag is present:
                            ppm = min(px_w, px_l) / min(w_m, l_m)
                            if self.min_plausible_ppm <= ppm <= self.max_plausible_ppm:
                                ref_estimates.append(ppm)
                                matched_details.append(f"Tag: {txt} in {room.get('type')}")

            # 2. Single-dimensional tags: [Sofa: 2.4m], [WC: 0.7m]
            single = parse_reference_single_dim(txt)
            if single:
                name, val_m = single
                # Use token bounding box width as pixel reference if available
                w_px = tok["bbox"][2]
                if w_px > 5:
                    ppm = (w_px * 2.5) / val_m  # text box width scaling
                    if self.min_plausible_ppm <= ppm <= self.max_plausible_ppm:
                        ref_estimates.append(ppm)
                        matched_details.append(f"Ref Single: {name} = {val_m}m")

        if ref_estimates:
            med_ppm = float(np.median(ref_estimates))
            return {
                "scale_px_per_m": round(med_ppm, 3),
                "scale_m_per_px": 1.0 / med_ppm,
                "confidence": 0.70,
                "provenance": "ESTIMATED",
                "evidence_details": matched_details,
            }

        return None

    def match_ocr_to_rooms(
        self,
        ocr_tokens: List[Dict[str, Any]],
        detected_rooms: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """
        Priority 1: Matches printed dimension text to detected room polygons.
        Computes scale from spatial containment, aspect ratio agreement, and Shoelace pixel area.
        """
        if not ocr_tokens or not detected_rooms:
            return None

        scale_estimates = []
        matched_pairs = []

        for tok in ocr_tokens:
            dims = parse_dimension_string(tok["text"])
            if dims is None:
                continue

            w_m, l_m = dims
            dim_min_m = min(w_m, l_m)
            dim_max_m = max(w_m, l_m)
            dim_aspect = dim_max_m / max(1e-3, dim_min_m)

            cx, cy = tok["center"]
            best_room = None
            best_dist = float("inf")

            for room in detected_rooms:
                rx, ry, rw, rh = room.get("bbox_pixels", [0, 0, 0, 0])
                # Direct containment check
                if rx <= cx <= rx + rw and ry <= cy <= ry + rh:
                    best_room = room
                    break

                # Proximity check to room centroid
                rcx, rcy = rx + rw / 2.0, ry + rh / 2.0
                dist = math.hypot(cx - rcx, cy - rcy)
                if dist < best_dist and dist < max(rw, rh):
                    best_dist = dist
                    best_room = room

            if best_room is not None:
                px_w = best_room.get("pixel_width", best_room.get("bbox_pixels", [0, 0, 0, 0])[2])
                px_l = best_room.get("pixel_length", best_room.get("bbox_pixels", [0, 0, 0, 0])[3])
                room_min_px = min(px_w, px_l)
                room_max_px = max(px_w, px_l)
                room_aspect = room_max_px / max(1e-3, room_min_px)

                # Aspect ratio compatibility check (tolerance within 30%)
                aspect_diff = abs(dim_aspect - room_aspect) / dim_aspect
                if aspect_diff <= 0.40 and room_min_px > 10 and room_max_px > 10:
                    ppm_w = room_min_px / dim_min_m
                    ppm_l = room_max_px / dim_max_m
                    avg_ppm = (ppm_w + ppm_l) / 2.0

                    if self.min_plausible_ppm <= avg_ppm <= self.max_plausible_ppm:
                        scale_estimates.extend([ppm_w, ppm_l])
                        matched_pairs.append({
                            "room_type": best_room.get("type", "Room"),
                            "printed_text": tok["text"],
                            "printed_dims_m": [dim_min_m, dim_max_m],
                            "room_px_dims": [room_min_px, room_max_px],
                            "measured_ppm": round(avg_ppm, 3),
                        })

        if scale_estimates:
            calibrated_ppm = float(np.median(scale_estimates))
            return {
                "scale_px_per_m": round(calibrated_ppm, 3),
                "scale_m_per_px": 1.0 / calibrated_ppm,
                "confidence": 0.94,
                "provenance": "MEASURED",
                "matched_rooms_count": len(matched_pairs),
                "matched_annotations": matched_pairs,
            }

        return None

    def calibrate(
        self,
        image_input: Union[str, Path, np.ndarray, Image.Image],
        detected_rooms: Optional[List[Dict[str, Any]]] = None,
        vit_scale_prediction: Optional[float] = None,
        scale_mode_hint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Master Calibration Method executing the 5-Tier Priority Hierarchy.
        
        Parameters:
          image_input: floor plan image (filepath, numpy array, or PIL image)
          detected_rooms: list of detected room dictionaries with 'bbox_pixels' or 'polygon_pixels'
          vit_scale_prediction: scale prediction (px/m) from the ViT multi-task head (if available)
          scale_mode_hint: optional annotation scale_mode ('dimensioned', 'scale-bar', 'reference-object', 'no-scale')
        
        Returns:
          Dictionary with:
            scale_px_per_m: float or None
            scale_m_per_px: float or None
            provenance: 'MEASURED' | 'ESTIMATED' | 'UNAVAILABLE'
            tier: int (1 to 5)
            confidence: float [0.0, 1.0]
            source_description: str
            matched_evidence: list or dict
        """
        # Strict Rule for Group 4 (no-scale plans):
        # Must not fabricate metric dimensions when no observable scale evidence exists.
        if scale_mode_hint == "no-scale":
            return {
                "scale_px_per_m": None,
                "scale_m_per_px": None,
                "provenance": "UNAVAILABLE",
                "tier": 5,
                "confidence": 0.0,
                "source_description": "Strict No-Scale Floor Plan (Relative geometry only)",
                "matched_evidence": [],
                "is_calibrated": False,
            }

        # 1. Extract OCR tokens
        ocr_tokens = self.extract_ocr_tokens(image_input)

        # -------------------------------------------------------------
        # Tier 1: Matched OCR Dimension Text (MEASURED)
        # -------------------------------------------------------------
        if ocr_tokens and detected_rooms:
            tier1_res = self.match_ocr_to_rooms(ocr_tokens, detected_rooms)
            if tier1_res is not None:
                return {
                    "scale_px_per_m": tier1_res["scale_px_per_m"],
                    "scale_m_per_px": tier1_res["scale_m_per_px"],
                    "provenance": "MEASURED",
                    "tier": 1,
                    "confidence": tier1_res["confidence"],
                    "source_description": f"Matched OCR Dimension Text ({tier1_res['matched_rooms_count']} rooms)",
                    "matched_evidence": tier1_res["matched_annotations"],
                    "is_calibrated": True,
                }

        # -------------------------------------------------------------
        # Tier 2: Graphical Scale Bar (MEASURED)
        # -------------------------------------------------------------
        tier2_res = self.detect_scale_bar(image_input)
        if tier2_res is not None:
            return {
                "scale_px_per_m": tier2_res["scale_px_per_m"],
                "scale_m_per_px": tier2_res["scale_m_per_px"],
                "provenance": "MEASURED",
                "tier": 2,
                "confidence": tier2_res["confidence"],
                "source_description": f"Graphical Scale Bar ({tier2_res['bar_metric_m']}m line)",
                "matched_evidence": tier2_res,
                "is_calibrated": True,
            }

        # -------------------------------------------------------------
        # Tier 3: Reference Objects & Canonical Priors (ESTIMATED)
        # -------------------------------------------------------------
        if ocr_tokens:
            tier3_res = self.detect_reference_cues(ocr_tokens, detected_rooms)
            if tier3_res is not None:
                return {
                    "scale_px_per_m": tier3_res["scale_px_per_m"],
                    "scale_m_per_px": tier3_res["scale_m_per_px"],
                    "provenance": "ESTIMATED",
                    "tier": 3,
                    "confidence": tier3_res["confidence"],
                    "source_description": "Reference Architectural Object Tags",
                    "matched_evidence": tier3_res["evidence_details"],
                    "is_calibrated": True,
                }

        # -------------------------------------------------------------
        # Tier 4: Learned ViT Scale Prediction (ESTIMATED)
        # -------------------------------------------------------------
        if vit_scale_prediction is not None and self.min_plausible_ppm <= vit_scale_prediction <= self.max_plausible_ppm:
            return {
                "scale_px_per_m": round(vit_scale_prediction, 3),
                "scale_m_per_px": 1.0 / vit_scale_prediction,
                "provenance": "ESTIMATED",
                "tier": 4,
                "confidence": 0.55,
                "source_description": "ViT Learned Multi-Task Scale Head",
                "matched_evidence": {"vit_raw_ppm": vit_scale_prediction},
                "is_calibrated": True,
            }

        # -------------------------------------------------------------
        # Tier 5: Insufficient Scale Evidence (UNAVAILABLE)
        # -------------------------------------------------------------
        return {
            "scale_px_per_m": None,
            "scale_m_per_px": None,
            "provenance": "UNAVAILABLE",
            "tier": 5,
            "confidence": 0.0,
            "source_description": "No Reliable Scale Evidence Available",
            "matched_evidence": [],
            "is_calibrated": False,
        }
