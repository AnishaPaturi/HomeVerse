import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from scale_calibration import parse_dimension_string

test_strings = [
    "2.21x2.48",
    "2.21 x 2.48",
    "3.03 x 7.30 m",
    "10'11\" x 12'11\"",
    "10'-5\"X15'-6\"",
    "3350 x 4270",
    "228x730", # often cm or mm without decimal
]

for s in test_strings:
    print(f"{s!r:<20} -> {parse_dimension_string(s)}")
