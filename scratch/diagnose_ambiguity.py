import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import json
from metric_calibrator import MetricScaleCalibrator
from ocr_spatial_matcher import OCRSpatialMatcher, parse_dimension_annotation

with open(repo_root / "HomeVerse-Dataset/annotations/test.json") as f:
    data = json.load(f)

# Find the first Group 1 sample: homeverse_026864
sample = [s for s in data if s.get("image_id") == "homeverse_026864"][0]
print("Image ID:", sample["image_id"])
print("Scale mode:", sample.get("scale_mode"))
print("GT PPM:", sample.get("pixels_per_meter"))

img_p = repo_root / "HomeVerse-Dataset" / sample["image_path"]
calibrator = MetricScaleCalibrator()
tokens = calibrator.extract_ocr_tokens(img_p)
print(f"\nExtracted {len(tokens)} OCR tokens:")
for t in tokens:
    parsed = parse_dimension_annotation(t["text"])
    if parsed:
        print(f"  Token: '{t['text']}' -> Parsed: {parsed['raw_text']}, center: {t['center']}")

print("\nGT rooms:")
for r in sample["rooms"][:5]:
    dims = r.get("dimensions", {})
    print(f"  Room {r.get('id')}: {r.get('type')}, dims: {dims.get('width_m')}x{dims.get('length_m')}m")
