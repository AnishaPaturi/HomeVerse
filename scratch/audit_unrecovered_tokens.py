"""
Scratch Script: Audit Remaining 76 Unrecovered Tokens
=====================================================
Analyzes why 76 of 199 fallback tokens were not recovered by full-line join:
  - Multi-line split (width on line 1, length on line 2)
  - Low OCR confidence (< 30)
  - OCR punctuation distortion (e.g. '%' instead of 'x')
  - Vertical orientation / rotated text
"""

import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Any

import cv2
import numpy as np
import pytesseract

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from run_experiment_f2 import select_balanced_split
from ocr_spatial_matcher import parse_dimension_annotation

json_path = repo_root / "HomeVerse-Dataset/annotations/test.json"
te_lids, test_samples, _ = select_balanced_split(str(json_path), 75)
g1_samples = [s for s in test_samples if s.get("scale_mode") == "dimensioned"]

print(f"Auditing failure reasons across {len(g1_samples)} images...")

failure_categories = {
    "multi_line_split": 0,
    "low_ocr_confidence_filtered": 0,
    "ocr_character_distortion": 0,
    "vertical_rotated_orientation": 0,
    "non_dimension_text_false_positive": 0,
}

unrecovered_samples = []

for sample in g1_samples:
    img_path = repo_root / "HomeVerse-Dataset" / sample.get("image_path", "")
    if not img_path.exists():
        continue
    img = cv2.imread(str(img_path))
    if img is None:
        continue
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Old image_to_string lines
    full_text = pytesseract.image_to_string(gray)
    old_dummy = []
    for line in full_text.splitlines():
        line_str = line.strip()
        parsed = parse_dimension_annotation(line_str)
        if parsed is not None:
            old_dummy.append(line_str)

    # 2. image_to_data
    try:
        data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
    except Exception:
        continue

    # Extract all words regardless of confidence
    all_raw_words = [data["text"][i].strip() for i in range(len(data["text"])) if data["text"][i].strip()]
    conf_30_words = [data["text"][i].strip() for i in range(len(data["text"])) if data["text"][i].strip() and float(data["conf"][i]) >= 30.0]

    # Full line joins
    lines = {}
    for i in range(len(data["text"])):
        txt = data["text"][i].strip()
        conf = float(data["conf"][i])
        if not txt or conf < 30.0:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines.setdefault(key, []).append(txt)

    recovered_line_texts = []
    for k, words in lines.items():
        l_str = " ".join(words)
        if parse_dimension_annotation(l_str) is not None:
            recovered_line_texts.append(l_str)

    # Compare old_dummy vs recovered_line_texts
    for od in old_dummy:
        # Check if recovered
        od_clean = re.sub(r"\s+", " ", od.lower())
        matched = any(od_clean in re.sub(r"\s+", " ", rl.lower()) or re.sub(r"\s+", " ", rl.lower()) in od_clean for rl in recovered_line_texts)
        if not matched:
            # Diagnose reason
            # 1. Did words exist in all_raw_words but not conf_30_words?
            od_words = od.split()
            low_conf = any(w in all_raw_words and w not in conf_30_words for w in od_words)
            if low_conf:
                failure_categories["low_ocr_confidence_filtered"] += 1
                reason = "low_ocr_confidence_filtered"
            elif any("%" in od or "*" in od or "+" in od for _ in [0]):
                failure_categories["ocr_character_distortion"] += 1
                reason = "ocr_character_distortion"
            elif any(w not in all_raw_words for w in od_words):
                failure_categories["non_dimension_text_false_positive"] += 1
                reason = "non_dimension_text_false_positive"
            else:
                # Words exist on line data but split across lines
                failure_categories["multi_line_split"] += 1
                reason = "multi_line_split"

            unrecovered_samples.append({
                "text": od,
                "reason": reason,
                "image": sample.get("image_path", ""),
            })

print("\n========================================================")
print("AUDIT OF UNRECOVERED TOKENS:")
print(f"Total Unrecovered: {len(unrecovered_samples)}")
for cat, count in failure_categories.items():
    pct = (count / max(1, len(unrecovered_samples))) * 100.0
    print(f"  - {cat}: {count} ({pct:.1f}%)")
print("========================================================")
for s in unrecovered_samples[:10]:
    print(f"Sample: '{s['text']}' -> {s['reason']}")
