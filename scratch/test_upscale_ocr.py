import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import cv2
import numpy as np
from PIL import Image
import pytesseract

def test_upscale_ocr():
    img_path = repo_root / "HomeVerse-Dataset/images/test/homeverse_000664.png"
    img = cv2.imread(str(img_path))
    h, w = img.shape[:2]
    # Crop around the scale bar line (found at y=1236, x=91)
    crop = img[int(h - 80):int(h - 20), 40:450]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    
    # 3x Bicubic interpolation
    scaled = cv2.resize(gray, (0, 0), fx=3.0, fy=3.0, interpolation=cv2.INTER_CUBIC)
    _, thresh = cv2.threshold(scaled, 180, 255, cv2.THRESH_BINARY)
    
    txt = pytesseract.image_to_string(thresh, config="--psm 6")
    print("Upscaled thresholded OCR text:", repr(txt.strip()))

if __name__ == "__main__":
    test_upscale_ocr()
