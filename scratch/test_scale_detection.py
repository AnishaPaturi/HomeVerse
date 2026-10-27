import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import cv2
import numpy as np
from PIL import Image
import pytesseract

def test():
    img_path = repo_root / "HomeVerse-Dataset/images/test/homeverse_000664.png"
    img = cv2.imread(str(img_path))
    h, w = img.shape[:2]
    # Crop bottom margin
    crop = img[int(h - 100):h, 50:int(w * 0.7)]
    txt = pytesseract.image_to_string(crop)
    print("Crop OCR text:", repr(txt.strip()))
    
    # Visual line detection for horizontal bar with tick marks
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=50, maxLineGap=5)
    print("Detected Hough lines in bottom crop:")
    if lines is not None:
        for l in lines[:5]:
            line = l[0] if len(l.shape) > 1 else l
            x1, y1, x2, y2 = line[0], line[1], line[2], line[3]
            length = np.hypot(x2 - x1, y2 - y1)
            angle = np.degrees(np.arctan2(abs(y2 - y1), abs(x2 - x1)))
            print(f"  Line: ({x1},{y1}) -> ({x2},{y2}), length={length:.1f}px, angle={angle:.1f} deg")

if __name__ == "__main__":
    test()
