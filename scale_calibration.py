import re
from pathlib import Path
import numpy as np
from PIL import Image

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import pytesseract
except ImportError:
    pytesseract = None


def parse_dimension_string(text):
    """
    Parses architectural dimension strings in feet/inches or meters.
    Examples:
      - 10'11\" x 12'11\"
      - 10'-5\"X15'-6\"
      - 11'0\" x 14'0\"
      - 4'6\" x 7'0\"
      - 3.35 x 4.27
      - 3350 x 4270 (mm)
    Returns:
      (width_m, length_m) or None
    """
    cleaned = text.strip().replace("×", "x").replace("X", "x").replace("*", "x")

    # 1. Imperial format: W'D" x L'D" or W'-D" x L'-D"
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
        if w_m > 0.5 and l_m > 0.5:
            return (w_m, l_m)

    # 2. Metric format: 3.35 x 4.27 or 3.35m x 4.27m
    met_pattern = re.compile(
        r"(\d+\.\d+)\s*m?\s*x\s*(\d+\.\d+)\s*m?",
        re.IGNORECASE
    )
    m = met_pattern.search(cleaned)
    if m:
        w_m = round(float(m.group(1)), 2)
        l_m = round(float(m.group(2)), 2)
        if w_m > 0.5 and l_m > 0.5:
            return (w_m, l_m)

    # 3. Millimeters: 3350 x 4270
    mm_pattern = re.compile(
        r"(\d{3,5})\s*x\s*(\d{3,5})",
        re.IGNORECASE
    )
    m = mm_pattern.search(cleaned)
    if m:
        val1 = float(m.group(1))
        val2 = float(m.group(2))
        if val1 > 500 and val2 > 500:
            return (round(val1 / 1000.0, 2), round(val2 / 1000.0, 2))

    return None


class ScaleCalibrator:
    """
    Hybrid Scale Calibration Pipeline:
    Extracts explicit dimensions via OCR when present;
    falls back smoothly to ViT Scale Head when annotations are absent or unreadable.
    """
    def __init__(self, fallback_ppm=78.0, min_plausible_ppm=30.0, max_plausible_ppm=250.0):
        self.fallback_ppm = fallback_ppm
        self.min_plausible_ppm = min_plausible_ppm
        self.max_plausible_ppm = max_plausible_ppm

    def extract_dimensions_from_image(self, image_path):
        """
        Runs OCR and extracts all detected dimension annotations with their pixel locations.
        """
        if pytesseract is None:
            return []

        img_p = Path(image_path)
        if not img_p.exists():
            return []

        try:
            pil_img = Image.open(img_p).convert("RGB")
            orig_w, orig_h = pil_img.size

            # If OpenCV is available, enhance image for OCR
            if cv2 is not None:
                img_cv = cv2.imread(str(img_p))
                gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                # Denoise & threshold
                blur = cv2.GaussianBlur(gray, (3, 3), 0)
                ocr_img = blur
            else:
                ocr_img = pil_img

            data = pytesseract.image_to_data(ocr_img, output_type=pytesseract.Output.DICT)
            extracted = []

            for i in range(len(data["text"])):
                raw_txt = data["text"][i].strip()
                if not raw_txt:
                    continue

                dims = parse_dimension_string(raw_txt)
                if dims is not None:
                    w_m, l_m = dims
                    x = int(data["left"][i])
                    y = int(data["top"][i])
                    bw = int(data["width"][i])
                    bh = int(data["height"][i])
                    conf = float(data["conf"][i])
                    extracted.append({
                        "raw_text": raw_txt,
                        "width_m": w_m,
                        "length_m": l_m,
                        "pixel_center": [x + bw / 2.0, y + bh / 2.0],
                        "bbox_pixels": [x, y, bw, bh],
                        "confidence": conf,
                    })

            # Also check multi-line text blocks
            full_text = pytesseract.image_to_string(ocr_img)
            for line in full_text.splitlines():
                line = line.strip()
                dims = parse_dimension_string(line)
                if dims is not None and not any(e["raw_text"] == line for e in extracted):
                    extracted.append({
                        "raw_text": line,
                        "width_m": dims[0],
                        "length_m": dims[1],
                        "pixel_center": None,
                        "bbox_pixels": None,
                        "confidence": 75.0,
                    })

            return extracted
        except Exception as e:
            print(f"[ScaleCalibrator] OCR warning: {e}")
            return []

    def calibrate_scale(self, image_path, detected_rooms, vit_predicted_scale):
        """
        Calibrates scale using OCR annotations matched to detected room boundaries.
        Falls back to vit_predicted_scale if no annotations are matched.
        """
        ocr_dims = self.extract_dimensions_from_image(image_path)
        if not ocr_dims or not detected_rooms:
            return {
                "calibrated_scale_px_per_m": round(vit_predicted_scale, 2),
                "scale_source": "vit_fallback",
                "calibration_factor": 1.0,
                "matched_annotations": [],
            }

        scale_estimates = []
        matched_pairs = []

        for dim in ocr_dims:
            w_m = dim["width_m"]
            l_m = dim["length_m"]
            dim_min_m = min(w_m, l_m)
            dim_max_m = max(w_m, l_m)

            best_room = None
            best_dist = float("inf")

            # Match dimension to containing or nearest room
            for room in detected_rooms:
                rx, ry, rw, rh = room.get("bbox_pixels", [0, 0, 0, 0])
                if dim["pixel_center"] is not None:
                    cx, cy = dim["pixel_center"]
                    # Check if inside room
                    if rx <= cx <= rx + rw and ry <= cy <= ry + rh:
                        best_room = room
                        break
                    # Or distance to room center
                    room_cx, room_cy = rx + rw / 2.0, ry + rh / 2.0
                    dist = ((cx - room_cx) ** 2 + (cy - room_cy) ** 2) ** 0.5
                    if dist < best_dist and dist < max(rw, rh):
                        best_dist = dist
                        best_room = room

            if best_room is not None:
                # Use contour/oriented pixel width & length if available, else bbox
                px_w = best_room.get("pixel_width", best_room.get("bbox_pixels", [0, 0, 0, 0])[2])
                px_l = best_room.get("pixel_length", best_room.get("bbox_pixels", [0, 0, 0, 0])[3])
                room_min_px = min(px_w, px_l)
                room_max_px = max(px_w, px_l)

                if dim_min_m > 0 and dim_max_m > 0 and room_min_px > 10 and room_max_px > 10:
                    ppm_w = room_min_px / dim_min_m
                    ppm_l = room_max_px / dim_max_m
                    avg_ppm = (ppm_w + ppm_l) / 2.0

                    if self.min_plausible_ppm <= avg_ppm <= self.max_plausible_ppm:
                        scale_estimates.extend([ppm_w, ppm_l])
                        matched_pairs.append({
                            "room_type": best_room.get("type", "Room"),
                            "printed_text": dim["raw_text"],
                            "printed_dimensions_m": [dim_min_m, dim_max_m],
                            "room_pixel_dimensions": [room_min_px, room_max_px],
                            "measured_ppm": round(avg_ppm, 2),
                        })

        if scale_estimates:
            # Robust median scale
            calibrated_ppm = float(np.median(scale_estimates))
            calib_factor = calibrated_ppm / max(1e-3, vit_predicted_scale)
            return {
                "calibrated_scale_px_per_m": round(calibrated_ppm, 2),
                "scale_source": "ocr_calibrated",
                "calibration_factor": round(calib_factor, 3),
                "matched_annotations": matched_pairs,
            }
        else:
            return {
                "calibrated_scale_px_per_m": round(vit_predicted_scale, 2),
                "scale_source": "vit_fallback",
                "calibration_factor": 1.0,
                "matched_annotations": [],
            }
