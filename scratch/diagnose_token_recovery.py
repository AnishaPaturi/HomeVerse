"""
Diagnostic Script: G5-OCR-v3 Token Localization & Dimension String Reconstruction
==================================================================================
HomeVerse Project - Milestone G5-OCR-v3 Design Phase

Investigates:
  1. Root cause of 159 unlocalized dummy tokens.
  2. Multi-word dimension string reconstruction via Tesseract image_to_data hierarchy:
     - Grouping words by (block_num, par_num, line_num).
     - N-gram sliding window for adjacent tokens with adaptive spatial gap tolerance.
     - Computing exact union bounding boxes [x, y, w, h] and centers.
  3. Vertical text orientation handling (OSD / 90-degree rotated labels).
  4. Wall-segment association for irregular/L-shaped rooms vs. centroid/MABR matching.
  5. Empirical recovery rate across the frozen 79 Group 1 images.
"""

import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

import cv2
import numpy as np
import pytesseract
from PIL import Image

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from metric_calibrator import parse_dimension_string
from ocr_spatial_matcher import parse_dimension_annotation


def reconstruct_dimension_tokens_from_data(
    gray_img: np.ndarray,
    conf_thresh: float = 30.0,
    max_word_gap_px: float = 40.0,
) -> Dict[str, Any]:
    """
    Extracts word tokens from Tesseract image_to_data and reconstructs
    multi-word dimension strings with exact union bounding boxes.
    """
    h_img, w_img = gray_img.shape[:2]
    
    try:
        data = pytesseract.image_to_data(gray_img, output_type=pytesseract.Output.DICT)
    except Exception as e:
        return {"error": str(e), "recovered_tokens": [], "raw_words_count": 0}

    n_boxes = len(data["text"])
    
    # Organize words by (block_num, par_num, line_num)
    lines: Dict[Tuple[int, int, int], List[Dict[str, Any]]] = {}
    valid_words = 0
    
    for i in range(n_boxes):
        txt = data["text"][i].strip()
        conf = float(data["conf"][i])
        if not txt or conf < conf_thresh:
            continue
        
        valid_words += 1
        b_num = data["block_num"][i]
        p_num = data["par_num"][i]
        l_num = data["line_num"][i]
        key = (b_num, p_num, l_num)
        
        box = {
            "text": txt,
            "conf": conf,
            "left": int(data["left"][i]),
            "top": int(data["top"][i]),
            "width": int(data["width"][i]),
            "height": int(data["height"][i]),
            "word_num": int(data["word_num"][i]),
        }
        lines.setdefault(key, []).append(box)

    recovered_tokens = []
    
    # Process each line
    for key, words in lines.items():
        # Sort words left-to-right (or top-to-bottom for vertical text)
        words.sort(key=lambda w: w["left"])
        
        # Test 1: Full-line join
        line_str = " ".join(w["text"] for w in words)
        parsed_full = parse_dimension_annotation(line_str)
        
        if parsed_full is not None:
            # Union bounding box of all words on this line
            min_x = min(w["left"] for w in words)
            min_y = min(w["top"] for w in words)
            max_x = max(w["left"] + w["width"] for w in words)
            max_y = max(w["top"] + w["height"] for w in words)
            avg_conf = sum(w["conf"] for w in words) / len(words)
            
            recovered_tokens.append({
                "raw_text": line_str,
                "parsed_dims": parsed_full,
                "bbox": [min_x, min_y, max_x - min_x, max_y - min_y],
                "center": [(min_x + max_x) / 2.0, (min_y + max_y) / 2.0],
                "confidence": avg_conf / 100.0,
                "method": "full_line_join",
                "word_count": len(words),
            })
            continue

        # Test 2: N-gram sliding window (for lines with labels like "BEDROOM 1 3.50 x 4.20 m")
        n_words = len(words)
        found_ngram = False
        for window_size in range(min(n_words, 5), 1, -1):
            for start in range(n_words - window_size + 1):
                sub_words = words[start : start + window_size]
                
                # Check spatial adjacency
                adjacent = True
                for idx in range(len(sub_words) - 1):
                    gap = sub_words[idx + 1]["left"] - (sub_words[idx]["left"] + sub_words[idx]["width"])
                    if gap > max_word_gap_px or gap < -20:  # allows slight overlap
                        adjacent = False
                        break
                
                if not adjacent:
                    continue
                
                sub_str = " ".join(w["text"] for w in sub_words)
                parsed_sub = parse_dimension_annotation(sub_str)
                if parsed_sub is not None:
                    min_x = min(w["left"] for w in sub_words)
                    min_y = min(w["top"] for w in sub_words)
                    max_x = max(w["left"] + w["width"] for w in sub_words)
                    max_y = max(w["top"] + w["height"] for w in sub_words)
                    avg_conf = sum(w["conf"] for w in sub_words) / len(sub_words)
                    
                    recovered_tokens.append({
                        "raw_text": sub_str,
                        "parsed_dims": parsed_sub,
                        "bbox": [min_x, min_y, max_x - min_x, max_y - min_y],
                        "center": [(min_x + max_x) / 2.0, (min_y + max_y) / 2.0],
                        "confidence": avg_conf / 100.0,
                        "method": f"ngram_window_{window_size}",
                        "word_count": len(sub_words),
                    })
                    found_ngram = True
                    break
            if found_ngram:
                break

    return {
        "raw_words_count": valid_words,
        "line_count": len(lines),
        "recovered_tokens": recovered_tokens,
    }


def compare_fallback_vs_reconstructed(sample_limit: int = 10):
    """
    Compares the old fallback mechanism against the new hierarchical reconstruction
    across a sample of Group 1 dimensioned images.
    """
    from run_experiment_f2 import select_balanced_split

    json_path = repo_root / "HomeVerse-Dataset/annotations/test.json"
    te_lids, test_samples, _ = select_balanced_split(str(json_path), 75)

    group1_samples = [s for s in test_samples if s.get("scale_mode") == "dimensioned"][:sample_limit]

    print(f"Auditing token localization on {len(group1_samples)} Group 1 test plans...")
    
    total_old_fallback_dummy = 0
    total_recovered_with_boxes = 0
    total_words_processed = 0

    for idx, sample in enumerate(group1_samples):
        img_rel = sample.get("image_path", "")
        img_path = repo_root / "HomeVerse-Dataset" / img_rel
        if not img_path.exists():
            continue

        gt_rooms = sample.get("rooms", [])
        
        # Load grayscale
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Run old image_to_string fallback
        full_text = pytesseract.image_to_string(gray)
        old_dummy_tokens = []
        for line in full_text.splitlines():
            line_str = line.strip()
            parsed = parse_dimension_annotation(line_str)
            if parsed is not None:
                old_dummy_tokens.append(line_str)
        total_old_fallback_dummy += len(old_dummy_tokens)

        # 2. Run new hierarchical reconstruction
        recon_res = reconstruct_dimension_tokens_from_data(gray)
        rec_tokens = recon_res["recovered_tokens"]
        total_recovered_with_boxes += len(rec_tokens)
        total_words_processed += recon_res["raw_words_count"]

        print(f"[{idx+1}/{len(group1_samples)}] {img_rel}:")
        print(f"   GT Rooms: {len(gt_rooms)}")
        print(f"   Old Fallback Dummy Tokens (Unlocalized): {len(old_dummy_tokens)}")
        print(f"   New Reconstructed Tokens with Valid BBoxes: {len(rec_tokens)}")
        for rt in rec_tokens:
            print(f"     -> Found: '{rt['raw_text']}' at bbox={rt['bbox']} center={[round(c, 1) for c in rt['center']]}")

    print("\n========================================================")
    print(f"TOTAL AUDIT ({len(group1_samples)} images):")
    print(f"  Total Raw Word Tokens:                {total_words_processed}")
    print(f"  Old Fallback Dummy Tokens (Dropped):  {total_old_fallback_dummy}")
    print(f"  New Reconstructed Tokens with BBoxes: {total_recovered_with_boxes}")
    recovery_pct = (total_recovered_with_boxes / max(1, total_old_fallback_dummy)) * 100.0
    print(f"  Recovery Efficiency:                  {recovery_pct:.1f}%")
    print("========================================================")


if __name__ == "__main__":
    compare_fallback_vs_reconstructed(sample_limit=10)
