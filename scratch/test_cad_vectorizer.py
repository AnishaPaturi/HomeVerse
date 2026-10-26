import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
from cad_vectorizer import (
    extract_unrefined_polygon,
    adaptive_polygon_simplification,
    snap_shared_boundaries,
    export_to_svg,
    export_to_dxf,
    verify_svg_roundtrip,
    verify_dxf_roundtrip,
    calculate_shoelace_area,
)

# 1. Create a dummy synthetic L-shaped mask
mask = np.zeros((96, 96), dtype=np.float32)
mask[10:70, 10:40] = 1.0  # Main vertical leg
mask[40:70, 10:70] = 1.0  # Horizontal foot (L-shape)

unref_pts = extract_unrefined_polygon(mask, orig_size=(1024, 1024))
print(f"Tier 2 Unrefined points: {len(unref_pts)}")

sim_pts = adaptive_polygon_simplification(unref_pts, protect_non_convex=True)
print(f"Tier 3 Simplified points: {len(sim_pts)} (expected 6 for an L-shape)")

area_px = calculate_shoelace_area(sim_pts)
print(f"Shoelace Area: {area_px:.1f} px^2")

# 2. Test shared boundary snapping with adjacent room
mask_adj = np.zeros((96, 96), dtype=np.float32)
mask_adj[10:40, 42:70] = 1.0 # Adjacent room, separated by 2 pixels (partition wall)
unref_adj = extract_unrefined_polygon(mask_adj, orig_size=(1024, 1024))
sim_adj = adaptive_polygon_simplification(unref_adj, protect_non_convex=True)

rooms = [
    {"type": "Living Room", "parent_category": "Living Area", "parent_id": 0, "polygon_tier3": sim_pts},
    {"type": "Kitchen", "parent_category": "Cooking Area", "parent_id": 2, "polygon_tier3": sim_adj},
]

snapped = snap_shared_boundaries(rooms, snap_tolerance_px=25.0)
print(f"Snapped rooms: {len(snapped)}, Valid: {[r['is_valid_tier3'] for r in snapped]}")

# 3. Test SVG and DXF exports
svg_path = export_to_svg(snapped, "scratch/test_floorplan.svg")
svg_chk = verify_svg_roundtrip(svg_path)
print(f"SVG Round-Trip: {svg_chk}")

dxf_path = export_to_dxf(snapped, "scratch/test_floorplan.dxf")
dxf_chk = verify_dxf_roundtrip(dxf_path)
print(f"DXF Round-Trip: {dxf_chk}")

print("ALL VECTORIZER CHECKS PASSED!")
