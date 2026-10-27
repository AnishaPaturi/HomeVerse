import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import json
from PIL import Image
import numpy as np

with open(repo_root / "HomeVerse-Dataset/annotations/test.json") as f:
    data = json.load(f)

# Evaluate ground truth rooms across first 50 samples with native sizing
native_area_errors = []
hardcoded_1024_errors = []

for s in data[:50]:
    ppm = s.get("pixels_per_meter") or s.get("raw_pixels_per_meter")
    if not ppm:
        continue
    scale_s = 1.0 / ppm
    img_p = repo_root / "HomeVerse-Dataset" / s["image_path"]
    with Image.open(img_p) as im:
        nw, nh = im.size
        
    for r in s["rooms"]:
        gt_a_m2 = r.get("area_m2") or r.get("dimensions", {}).get("area_m2")
        poly = r.get("polygon")
        if not poly or len(poly) < 3 or not gt_a_m2:
            continue
            
        # Native
        pts_nat = [(x * nw, y * nh) for x, y in poly]
        n = len(pts_nat)
        a_px_nat = abs(sum(pts_nat[i][0]*pts_nat[(i+1)%n][1] - pts_nat[(i+1)%n][0]*pts_nat[i][1] for i in range(n))) / 2.0
        m2_nat = a_px_nat * (scale_s ** 2)
        native_area_errors.append(abs(m2_nat - gt_a_m2) / gt_a_m2 * 100.0)
        
        # 1024
        pts_1024 = [(x * 1024, y * 1024) for x, y in poly]
        a_px_1024 = abs(sum(pts_1024[i][0]*pts_1024[(i+1)%n][1] - pts_1024[(i+1)%n][0]*pts_1024[i][1] for i in range(n))) / 2.0
        m2_1024 = a_px_1024 * (scale_s ** 2)
        hardcoded_1024_errors.append(abs(m2_1024 - gt_a_m2) / gt_a_m2 * 100.0)

print(f"Sample count: {len(native_area_errors)} rooms")
print(f"Native Area Error:   Median = {np.median(native_area_errors):.4f}% | Mean = {np.mean(native_area_errors):.4f}%")
print(f"1024 Area Error:     Median = {np.median(hardcoded_1024_errors):.2f}% | Mean = {np.mean(hardcoded_1024_errors):.2f}%")
