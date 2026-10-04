import math
import random
from collections import Counter
from PIL import Image, ImageDraw, ImageFilter

ROOM_TYPES = [
    "Living Room", "Kitchen", "Dining Room", "Kitchen & Dining",
    "Master Bedroom", "Bedroom", "Children's Bedroom", "Guest Bedroom",
    "Bathroom", "Toilet", "Study Room", "Office", "Utility Room",
    "Laundry Room", "Balcony", "Terrace", "Corridor", "Entrance/Foyer",
    "Storage Room", "Walk-in Closet", "Garage", "Staircase",
]

SCALE_MODES = ["dimensioned", "scale-bar", "reference-object", "no-scale"]
SCALE_WEIGHTS = [0.352, 0.308, 0.220, 0.120]

def poly_area(pts):
    n = len(pts)
    a = 0.0
    for i in range(n):
        j = (i + 1) % n
        a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1]
    return abs(a) / 2.0

def box_polygon(r):
    x0, y0, x1, y1 = r
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]

print("Test generator script initialized.")
