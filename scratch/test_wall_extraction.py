import math

def get_rect_edges(rect):
    x0, y0, x1, y1 = rect
    return [
        ("h", y0, min(x0, x1), max(x0, x1)),
        ("h", y1, min(x0, x1), max(x0, x1)),
        ("v", x0, min(y0, y1), max(y0, y1)),
        ("v", x1, min(y0, y1), max(y0, y1)),
    ]

def get_poly_edges(poly):
    edges = []
    n = len(poly)
    for i in range(n):
        p1, p2 = poly[i], poly[(i + 1) % n]
        if abs(p1[1] - p2[1]) < 1e-6: # horizontal
            edges.append(("h", p1[1], min(p1[0], p2[0]), max(p1[0], p2[0])))
        elif abs(p1[0] - p2[0]) < 1e-6: # vertical
            edges.append(("v", p1[0], min(p1[1], p2[1]), max(p1[1], p2[1])))
    return edges

def segment_overlap(seg1, seg2):
    # Both are ("h", y, x0, x1) or ("v", x, y0, y1)
    t1, pos1, a0, a1 = seg1
    t2, pos2, b0, b1 = seg2
    if t1 != t2 or abs(pos1 - pos2) > 1e-6:
        return None
    lo = max(a0, b0)
    hi = min(a1, b1)
    if hi - lo > 1e-6:
        return (t1, pos1, lo, hi)
    return None

def subtract_intervals(span, blockers):
    # span is (lo, hi), blockers is list of (b_lo, b_hi)
    lo, hi = span
    events = []
    for b_lo, b_hi in blockers:
        b_lo = max(lo, min(hi, b_lo))
        b_hi = max(lo, min(hi, b_hi))
        if b_hi > b_lo:
            events.append((b_lo, b_hi))
    events.sort()
    
    # Merge blockers
    merged = []
    for b_lo, b_hi in events:
        if not merged:
            merged.append([b_lo, b_hi])
        elif b_lo <= merged[-1][1] + 1e-6:
            merged[-1][1] = max(merged[-1][1], b_hi)
        else:
            merged.append([b_lo, b_hi])
            
    # Remaining
    rem = []
    curr = lo
    for b_lo, b_hi in merged:
        if b_lo > curr + 1e-6:
            rem.append((curr, b_lo))
        curr = max(curr, b_hi)
    if hi > curr + 1e-6:
        rem.append((curr, hi))
    return rem

# Test with 2 adjacent rooms
# Room 1: (0, 0) to (5, 4)
# Room 2: (5, 0) to (10, 4)
r1_edges = get_rect_edges((0, 0, 5, 4))
r2_edges = get_rect_edges((5, 0, 10, 4))

internal = []
for e1 in r1_edges:
    for e2 in r2_edges:
        ov = segment_overlap(e1, e2)
        if ov:
            internal.append(ov)

print("Shared edge between r1 and r2:", internal)

# Check external walls for r1
r1_ext = []
for e1 in r1_edges:
    blockers = []
    for e2 in r2_edges:
        ov = segment_overlap(e1, e2)
        if ov:
            blockers.append((ov[2], ov[3]))
    rem = subtract_intervals((e1[2], e1[3]), blockers)
    for lo, hi in rem:
        r1_ext.append((e1[0], e1[1], lo, hi))

print("R1 external walls:", r1_ext)
print("SUCCESS!")
