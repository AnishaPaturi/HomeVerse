import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
import torch.nn as nn
import torch.nn.functional as F
from floorplan_dataset import ROOM_CLASSES, NUM_ROOM_CLASSES, NO_ROOM_ID

# Define 9 Functional Parent Categories
PARENT_CLASSES = [
    "Living Area",        # 0
    "Bedroom Area",       # 1
    "Cooking Area",       # 2
    "Wet Area",           # 3
    "Study / Work Area",  # 4
    "Circulation",        # 5
    "Utility Area",       # 6
    "Outdoor Area",       # 7
    "Garage / Parking",   # 8
]
NUM_PARENT_CLASSES = len(PARENT_CLASSES)  # 9
NO_ROOM_PARENT_ID = NUM_PARENT_CLASSES    # 9 = Background

# Exact Child to Parent Mapping
CHILD_TO_PARENT = {
    0: 0,   # Living Room -> Living Area
    1: 2,   # Kitchen -> Cooking Area
    2: 0,   # Dining Room -> Living Area
    3: 2,   # Kitchen & Dining -> Cooking Area
    4: 1,   # Master Bedroom -> Bedroom Area
    5: 1,   # Bedroom -> Bedroom Area
    6: 1,   # Children's Bedroom -> Bedroom Area
    7: 1,   # Guest Bedroom -> Bedroom Area
    8: 3,   # Bathroom -> Wet Area
    9: 3,   # Toilet -> Wet Area
    10: 4,  # Study Room -> Study / Work Area
    11: 4,  # Office -> Study / Work Area
    12: 6,  # Utility Room -> Utility Area
    13: 6,  # Laundry Room -> Utility Area
    14: 7,  # Balcony -> Outdoor Area
    15: 7,  # Terrace -> Outdoor Area
    16: 5,  # Corridor -> Circulation
    17: 5,  # Entrance/Foyer -> Circulation
    18: 6,  # Storage Room -> Utility Area
    19: 6,  # Walk-in Closet -> Utility Area
    20: 8,  # Garage -> Garage / Parking
    21: 5,  # Staircase -> Circulation
    22: 9,  # Background -> Background
}

PARENT_TO_CHILDREN = {p: [] for p in range(NUM_PARENT_CLASSES + 1)}
for c, p in CHILD_TO_PARENT.items():
    PARENT_TO_CHILDREN[p].append(c)

print("Parent to Children mapping:")
for p, children in PARENT_TO_CHILDREN.items():
    pname = PARENT_CLASSES[p] if p < NUM_PARENT_CLASSES else "Background"
    cnames = [ROOM_CLASSES[c] if c < NUM_ROOM_CLASSES else "Background" for c in children]
    print(f"  [{p}] {pname} ({len(children)}): {cnames}")

# Verify every child has exactly one parent
assert len(CHILD_TO_PARENT) == 23
assert sum(len(c) for c in PARENT_TO_CHILDREN.values()) == 23
print("\nTaxonomy verified: Exactly one parent per child, all 22 classes + background covered!")
