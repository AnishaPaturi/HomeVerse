import math
import random
from collections import Counter
from PIL import Image, ImageDraw

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
        if abs(p1[1] - p2[1]) < 1e-6:
            edges.append(("h", p1[1], min(p1[0], p2[0]), max(p1[0], p2[0])))
        elif abs(p1[0] - p2[0]) < 1e-6:
            edges.append(("v", p1[0], min(p1[1], p2[1]), max(p1[1], p2[1])))
    return edges

def segment_overlap(seg1, seg2):
    t1, pos1, a0, a1 = seg1
    t2, pos2, b0, b1 = seg2
    if t1 != t2 or abs(pos1 - pos2) > 1e-5:
        return None
    lo = max(a0, b0)
    hi = min(a1, b1)
    if hi - lo > 0.05:
        return (t1, pos1, lo, hi)
    return None

def subtract_intervals(span, blockers):
    lo, hi = span
    events = []
    for b_lo, b_hi in blockers:
        b_lo = max(lo, min(hi, b_lo))
        b_hi = max(lo, min(hi, b_hi))
        if b_hi > b_lo + 1e-5:
            events.append((b_lo, b_hi))
    events.sort()
    
    merged = []
    for b_lo, b_hi in events:
        if not merged:
            merged.append([b_lo, b_hi])
        elif b_lo <= merged[-1][1] + 1e-5:
            merged[-1][1] = max(merged[-1][1], b_hi)
        else:
            merged.append([b_lo, b_hi])
            
    rem = []
    curr = lo
    for b_lo, b_hi in merged:
        if b_lo > curr + 1e-5:
            rem.append((curr, b_lo))
        curr = max(curr, b_hi)
    if hi > curr + 1e-5:
        rem.append((curr, hi))
    return rem

# Subdivider for a rectangular region
def partition_rect(rect, target_count, rng, min_dim=2.2):
    x0, y0, x1, y1 = rect
    cells = [(x0, y0, x1, y1)]
    while len(cells) < target_count:
        candidates = sorted(range(len(cells)), key=lambda i: (cells[i][2]-cells[i][0])*(cells[i][3]-cells[i][1]), reverse=True)
        split_done = False
        for i in candidates:
            cx0, cy0, cx1, cy1 = cells[i]
            cw, ch = cx1 - cx0, cy1 - cy0
            axes = ["x", "y"] if cw >= ch else ["y", "x"]
            for axis in axes:
                length = cw if axis == "x" else ch
                if length < 2 * min_dim:
                    continue
                cut = round(rng.uniform(min_dim, length - min_dim), 2)
                if axis == "x":
                    parts = [(cx0, cy0, cx0 + cut, cy1), (cx0 + cut, cy0, cx1, cy1)]
                else:
                    parts = [(cx0, cy0, cx1, cy0 + cut), (cx0, cy0 + cut, cx1, cy1)]
                cells[i:i+1] = parts
                split_done = True
                break
            if split_done:
                break
        if not split_done:
            break
    return cells


def generate_rect_layout(rng):
    n = rng.choices([2, 3, 4, 5, 6, 7, 8, 9, 10], weights=[5, 10, 20, 25, 20, 10, 5, 3, 2])[0]
    w = round(rng.uniform(7.0 + 0.6*n, 10.0 + 0.9*n), 2)
    h = round(rng.uniform(6.0 + 0.4*n, 8.5 + 0.7*n), 2)
    cells = partition_rect((0.0, 0.0, w, h), n, rng, min_dim=2.2)
    return cells


def generate_l_layout(rng):
    # Two wings meeting at a corner
    n1 = rng.randint(2, 5)
    n2 = rng.randint(2, 5)
    w1 = round(rng.uniform(6.0 + 0.8*n1, 9.0 + 1.1*n1), 2)
    h1 = round(rng.uniform(4.5, 6.5), 2)
    w2 = round(rng.uniform(4.5, 6.5), 2)
    h2 = round(rng.uniform(5.5 + 0.7*n2, 8.5 + 1.0*n2), 2)
    
    # Corner choice: top_left, top_right, bottom_left, bottom_right
    corner = rng.choice(["bottom_left", "bottom_right", "top_left", "top_right"])
    
    # Base layout: bottom-left orientation
    # Wing 1 horizontal: [0, w1] x [0, h1]
    # Wing 2 vertical:   [0, w2] x [h1, h1 + h2]  (assuming w2 <= w1)
    if w2 > w1 - 2.0:
        w2 = round(w1 * 0.5, 2)
        
    cells1 = partition_rect((0.0, 0.0, w1, h1), n1, rng, min_dim=2.2)
    cells2 = partition_rect((0.0, h1, w2, h1 + h2), n2, rng, min_dim=2.2)
    all_cells = cells1 + cells2
    
    total_w = w1
    total_h = h1 + h2
    
    # Transform if corner differs
    transformed = []
    for (x0, y0, x1, y1) in all_cells:
        if corner == "bottom_left":
            transformed.append((x0, y0, x1, y1))
        elif corner == "bottom_right":
            transformed.append((round(total_w - x1, 2), y0, round(total_w - x0, 2), y1))
        elif corner == "top_left":
            transformed.append((x0, round(total_h - y1, 2), x1, round(total_h - y0, 2)))
        elif corner == "top_right":
            transformed.append((round(total_w - x1, 2), round(total_h - y1, 2), round(total_w - x0, 2), round(total_h - y0, 2)))
            
    # Normalize coords so min(x)=0, min(y)=0
    min_x = min(c[0] for c in transformed)
    min_y = min(c[1] for c in transformed)
    return [(round(c[0]-min_x, 2), round(c[1]-min_y, 2), round(c[2]-min_x, 2), round(c[3]-min_y, 2)) for c in transformed]


def generate_t_layout(rng):
    # Main body and a perpendicular stem
    n_main = rng.randint(3, 6)
    n_stem = rng.randint(2, 4)
    w_main = round(rng.uniform(10.0, 15.0), 2)
    h_main = round(rng.uniform(5.0, 7.5), 2)
    w_stem = round(rng.uniform(5.0, min(8.0, w_main - 3.0)), 2)
    h_stem = round(rng.uniform(4.5, 7.0), 2)
    
    offset_x = round(rng.uniform(1.5, w_main - w_stem - 1.5), 2)
    
    cells_main = partition_rect((0.0, 0.0, w_main, h_main), n_main, rng, min_dim=2.2)
    cells_stem = partition_rect((offset_x, h_main, offset_x + w_stem, h_main + h_stem), n_stem, rng, min_dim=2.2)
    all_cells = cells_main + cells_stem
    
    # Orient stem (North, South, East, West)
    orient = rng.choice(["north", "south", "east", "west"])
    total_w = w_main
    total_h = h_main + h_stem
    transformed = []
    for (x0, y0, x1, y1) in all_cells:
        if orient == "north":
            transformed.append((x0, y0, x1, y1))
        elif orient == "south":
            transformed.append((x0, round(total_h - y1, 2), x1, round(total_h - y0, 2)))
        elif orient == "east":
            transformed.append((y0, x0, y1, x1))
        elif orient == "west":
            transformed.append((round(total_h - y1, 2), x0, round(total_h - y0, 2), x1))
            
    min_x = min(c[0] for c in transformed)
    min_y = min(c[1] for c in transformed)
    return [(round(c[0]-min_x, 2), round(c[1]-min_y, 2), round(c[2]-min_x, 2), round(c[3]-min_y, 2)) for c in transformed]


def generate_u_layout(rng):
    # Courtyard layout: base + left wing + right wing
    w_base = round(rng.uniform(12.0, 18.0), 2)
    h_base = round(rng.uniform(4.5, 6.0), 2)
    w_wing1 = round(rng.uniform(4.5, 5.5), 2)
    w_wing2 = round(rng.uniform(4.5, 5.5), 2)
    court_w = w_base - w_wing1 - w_wing2
    if court_w < 3.5:
        w_base = w_wing1 + w_wing2 + 4.0
    h_wings = round(rng.uniform(5.0, 8.0), 2)
    
    n_base = rng.randint(2, 4)
    n_w1 = rng.randint(2, 3)
    n_w2 = rng.randint(2, 3)
    
    cells_base = partition_rect((0.0, 0.0, w_base, h_base), n_base, rng, min_dim=2.2)
    cells_w1 = partition_rect((0.0, h_base, w_wing1, h_base + h_wings), n_w1, rng, min_dim=2.2)
    cells_w2 = partition_rect((w_base - w_wing2, h_base, w_base, h_base + h_wings), n_w2, rng, min_dim=2.2)
    all_cells = cells_base + cells_w1 + cells_w2
    
    # Orient courtyard opening: north, south
    if rng.random() < 0.5:
        total_h = h_base + h_wings
        all_cells = [(c[0], round(total_h - c[3], 2), c[2], round(total_h - c[1], 2)) for c in all_cells]
        
    min_x = min(c[0] for c in all_cells)
    min_y = min(c[1] for c in all_cells)
    return [(round(c[0]-min_x, 2), round(c[1]-min_y, 2), round(c[2]-min_x, 2), round(c[3]-min_y, 2)) for c in all_cells]


def generate_staggered_layout(rng):
    # Two offset boxes meeting along a partial wall
    w1 = round(rng.uniform(7.0, 11.0), 2)
    h1 = round(rng.uniform(5.0, 8.0), 2)
    w2 = round(rng.uniform(7.0, 11.0), 2)
    h2 = round(rng.uniform(5.0, 8.0), 2)
    offset_x = round(rng.uniform(2.5, min(w1 - 2.5, w2 - 2.5)), 2)
    
    n1 = rng.randint(2, 5)
    n2 = rng.randint(2, 5)
    
    cells1 = partition_rect((0.0, 0.0, w1, h1), n1, rng, min_dim=2.2)
    cells2 = partition_rect((offset_x, h1, offset_x + w2, h1 + h2), n2, rng, min_dim=2.2)
    all_cells = cells1 + cells2
    
    min_x = min(c[0] for c in all_cells)
    min_y = min(c[1] for c in all_cells)
    return [(round(c[0]-min_x, 2), round(c[1]-min_y, 2), round(c[2]-min_x, 2), round(c[3]-min_y, 2)) for c in all_cells]


def generate_corridor_spine_layout(rng):
    # A central hallway with rooms flanking on top and bottom (or left and right)
    hall_len = round(rng.uniform(8.0, 14.0), 2)
    hall_w = round(rng.uniform(1.3, 1.6), 2)
    depth_top = round(rng.uniform(4.0, 6.0), 2)
    depth_bot = round(rng.uniform(4.0, 6.0), 2)
    
    n_top = rng.randint(2, 4)
    n_bot = rng.randint(2, 4)
    
    hall_cell = (0.0, depth_bot, hall_len, depth_bot + hall_w)
    cells_bot = partition_rect((0.0, 0.0, hall_len, depth_bot), n_bot, rng, min_dim=2.2)
    cells_top = partition_rect((0.0, depth_bot + hall_w, hall_len, depth_bot + hall_w + depth_top), n_top, rng, min_dim=2.2)
    
    all_cells = [hall_cell] + cells_bot + cells_top
    if rng.random() < 0.5:
        # rotate 90 deg
        all_cells = [(c[1], c[0], c[3], c[2]) for c in all_cells]
        
    min_x = min(c[0] for c in all_cells)
    min_y = min(c[1] for c in all_cells)
    return [(round(c[0]-min_x, 2), round(c[1]-min_y, 2), round(c[2]-min_x, 2), round(c[3]-min_y, 2)) for c in all_cells]


def carve_l_shaped_room(cells, rng):
    # Optionally carve an L-shape from a large cell
    if len(cells) < 3 or rng.random() > 0.45:
        return cells, None
        
    large_idx = [i for i, c in enumerate(cells) if (c[2]-c[0] >= 4.5 and c[3]-c[1] >= 4.2)]
    if not large_idx:
        return cells, None
        
    target_i = rng.choice(large_idx)
    tx0, ty0, tx1, ty1 = cells[target_i]
    tw, th = tx1 - tx0, ty1 - ty0
    cut_w = round(rng.uniform(1.8, min(2.8, tw - 2.2)), 2)
    cut_h = round(rng.uniform(1.8, min(2.6, th - 2.0)), 2)
    corner = rng.choice(['top_right', 'top_left', 'bottom_right', 'bottom_left'])
    
    if corner == 'top_right':
        xc, yc = tx1 - cut_w, ty1 - cut_h
        poly_l = [(tx0, ty0), (tx1, ty0), (tx1, yc), (xc, yc), (xc, ty1), (tx0, ty1)]
        rect_notch = (xc, yc, tx1, ty1)
    elif corner == 'top_left':
        xc, yc = tx0 + cut_w, ty1 - cut_h
        poly_l = [(tx0, ty0), (tx1, ty0), (tx1, ty1), (xc, ty1), (xc, yc), (tx0, yc)]
        rect_notch = (tx0, yc, xc, ty1)
    elif corner == 'bottom_right':
        xc, yc = tx1 - cut_w, ty0 + cut_h
        poly_l = [(tx0, ty0), (xc, ty0), (xc, yc), (tx1, yc), (tx1, ty1), (tx0, ty1)]
        rect_notch = (xc, ty0, tx1, yc)
    else: # bottom_left
        xc, yc = tx0 + cut_w, ty0 + cut_h
        poly_l = [(xc, ty0), (tx1, ty0), (tx1, ty1), (tx0, ty1), (tx0, yc), (xc, yc)]
        rect_notch = (tx0, ty0, xc, yc)
        
    return cells, {
        "target_index": target_i,
        "poly_l": poly_l,
        "rect_notch": rect_notch,
    }


def extract_walls_and_connectivity(rooms):
    # Returns (walls, internal_edges, adjacency)
    # Each room has "id", "polygon_m", "edges"
    num_rooms = len(rooms)
    internal_walls = []
    internal_edges = [] # (i, j, seg)
    adj = {i: [] for i in range(num_rooms)}
    
    # Find internal walls
    for i in range(num_rooms):
        for j in range(i+1, num_rooms):
            for e1 in rooms[i]["edges"]:
                for e2 in rooms[j]["edges"]:
                    ov = segment_overlap(e1, e2)
                    if ov and (ov[3] - ov[2] >= 0.7):
                        internal_edges.append((i, j, ov))
                        adj[i].append((j, ov))
                        adj[j].append((i, ov))
                        t, pos, lo, hi = ov
                        if t == "h":
                            start, end = (lo, pos), (hi, pos)
                        else:
                            start, end = (pos, lo), (pos, hi)
                        internal_walls.append({
                            "type": "internal",
                            "room_ids": [rooms[i]["id"], rooms[j]["id"]],
                            "start_m": start,
                            "end_m": end,
                            "thickness_m": 0.15,
                        })
                        
    # Find external walls
    external_walls = []
    for i in range(num_rooms):
        for e in rooms[i]["edges"]:
            blockers = []
            for j in range(num_rooms):
                if i == j:
                    continue
                for e2 in rooms[j]["edges"]:
                    ov = segment_overlap(e, e2)
                    if ov:
                        blockers.append((ov[2], ov[3]))
            rem = subtract_intervals((e[2], e[3]), blockers)
            for lo, hi in rem:
                if hi - lo >= 0.2:
                    t, pos = e[0], e[1]
                    if t == "h":
                        start, end = (lo, pos), (hi, pos)
                    else:
                        start, end = (pos, lo), (pos, hi)
                    external_walls.append({
                        "type": "external",
                        "room_ids": [rooms[i]["id"]],
                        "start_m": start,
                        "end_m": end,
                        "thickness_m": 0.25,
                    })
                    
    return internal_walls + external_walls, internal_edges, adj


print("Wall and connectivity extractor defined.")

def place_doors_and_windows(rooms, walls, internal_edges, entry_idx, rng):
    num_rooms = len(rooms)
    
    # 1. Spanning tree for connectivity
    # Use randomized BFS/DFS from entry_idx
    visited = {entry_idx}
    tree_edges = []
    
    while len(visited) < num_rooms:
        options = []
        for i, j, ov in internal_edges:
            if (i in visited) != (j in visited):
                options.append((i, j, ov))
        if not options:
            break
        i, j, ov = rng.choice(options)
        tree_edges.append((i, j, ov))
        visited.update((i, j))
        
    doors = []
    used_edges = set()
    
    def make_door(r_from, r_to, ov, is_entrance=False):
        t, pos, lo, hi = ov
        door_w = 0.85
        center = rng.uniform(lo + 0.45, hi - 0.45) if (hi - lo >= 1.1) else (lo + hi)/2.0
        pos_m = (center, pos) if t == "h" else (pos, center)
        wall_seg = [(lo, pos), (hi, pos)] if t == "h" else [(pos, lo), (pos, hi)]
        return {
            "id": len(doors) + 1,
            "room_from_id": r_from,
            "room_to_id": r_to,
            "position_m": pos_m,
            "width_m": door_w,
            "orientation": "horizontal" if t == "h" else "vertical",
            "wall_edge_m": wall_seg,
            "entrance": is_entrance,
        }

    for i, j, ov in tree_edges:
        doors.append(make_door(rooms[i]["id"], rooms[j]["id"], ov))
        used_edges.add((min(i, j), max(i, j)))
        
    # Extra doors (e.g. kitchen to dining, master to balcony)
    for i, j, ov in internal_edges:
        if (min(i, j), max(i, j)) not in used_edges and rng.random() < 0.20:
            doors.append(make_door(rooms[i]["id"], rooms[j]["id"], ov))
            used_edges.add((min(i, j), max(i, j)))
            
    # Exterior entrance door on entry room
    ext_walls = [w for w in walls if w["type"] == "external" and rooms[entry_idx]["id"] in w["room_ids"]]
    if not ext_walls:
        ext_walls = [w for w in walls if w["type"] == "external"]
    if ext_walls:
        # Pick longest external wall of entry room
        ew = max(ext_walls, key=lambda w: math.dist(w["start_m"], w["end_m"]))
        s, e = ew["start_m"], ew["end_m"]
        t = "h" if abs(s[1] - e[1]) < 1e-5 else "v"
        lo = min(s[0], e[0]) if t == "h" else min(s[1], e[1])
        hi = max(s[0], e[0]) if t == "h" else max(s[1], e[1])
        pos = s[1] if t == "h" else s[0]
        ov = (t, pos, lo, hi)
        doors.append(make_door(None, rooms[entry_idx]["id"], ov, is_entrance=True))
        
    # Windows
    windows = []
    habitable = {
        "Living Room", "Dining Room", "Kitchen", "Kitchen & Dining",
        "Master Bedroom", "Bedroom", "Children's Bedroom", "Guest Bedroom",
        "Study Room", "Office",
    }
    for room in rooms:
        r_ext = [w for w in walls if w["type"] == "external" and room["id"] in w["room_ids"]]
        rtype = room.get("type", "Living Room")
        if rtype in habitable:
            max_win = 2 if len(r_ext) >= 2 and rng.random() < 0.4 else 1
            for ew in r_ext[:max_win]:
                s, e = ew["start_m"], ew["end_m"]
                w_len = math.dist(s, e)
                if w_len < 1.3:
                    continue
                t = "h" if abs(s[1] - e[1]) < 1e-5 else "v"
                lo = min(s[0], e[0]) if t == "h" else min(s[1], e[1])
                hi = max(s[0], e[0]) if t == "h" else max(s[1], e[1])
                pos = s[1] if t == "h" else s[0]
                center = (lo + hi) / 2.0
                pos_m = (center, pos) if t == "h" else (pos, center)
                if any(math.dist(pos_m, d["position_m"]) < 1.2 for d in doors):
                    continue
                win_w = min(1.6, w_len - 0.4)
                windows.append({
                    "id": len(windows) + 1,
                    "room_id": room["id"],
                    "position_m": pos_m,
                    "width_m": round(win_w, 2),
                    "orientation": "horizontal" if t == "h" else "vertical",
                    "wall_edge_m": [s, e],
                })
        elif rtype in ["Bathroom", "Toilet", "Utility Room", "Laundry Room"] and rng.random() < 0.65:
            for ew in r_ext[:1]:
                s, e = ew["start_m"], ew["end_m"]
                w_len = math.dist(s, e)
                if w_len < 1.0:
                    continue
                t = "h" if abs(s[1] - e[1]) < 1e-5 else "v"
                lo = min(s[0], e[0]) if t == "h" else min(s[1], e[1])
                hi = max(s[0], e[0]) if t == "h" else max(s[1], e[1])
                pos = s[1] if t == "h" else s[0]
                center = (lo + hi) / 2.0
                pos_m = (center, pos) if t == "h" else (pos, center)
                if any(math.dist(pos_m, d["position_m"]) < 1.0 for d in doors):
                    continue
                windows.append({
                    "id": len(windows) + 1,
                    "room_id": room["id"],
                    "position_m": pos_m,
                    "width_m": 0.8,
                    "orientation": "horizontal" if t == "h" else "vertical",
                    "wall_edge_m": [s, e],
                })

    return doors, windows


# Run test over 50 layouts of varying typologies
rng = random.Random(123)
generators = [
    generate_rect_layout,
    generate_l_layout,
    generate_t_layout,
    generate_u_layout,
    generate_staggered_layout,
    generate_corridor_spine_layout,
]

for test_idx in range(50):
    gen = rng.choice(generators)
    cells = gen(rng)
    cells, l_info = carve_l_shaped_room(cells, rng)
    
    rooms = []
    for idx, c in enumerate(cells):
        if l_info and idx == l_info["target_index"]:
            poly = l_info["poly_l"]
            xs, ys = zip(*poly)
            rooms.append({
                "id": idx + 1,
                "rect": (min(xs), min(ys), max(xs), max(ys)),
                "polygon_m": poly,
                "edges": get_poly_edges(poly),
                "shape": "l_shape",
                "dimensions": {
                    "width_m": round(max(xs) - min(xs), 3),
                    "length_m": round(max(ys) - min(ys), 3),
                    "area_m2": round(poly_area(poly), 4),
                }
            })
        else:
            w = round(c[2] - c[0], 3)
            h = round(c[3] - c[1], 3)
            poly = box_polygon(c)
            rooms.append({
                "id": idx + 1,
                "rect": c,
                "polygon_m": poly,
                "edges": get_rect_edges(c),
                "shape": "rectangle",
                "dimensions": {
                    "width_m": w,
                    "length_m": h,
                    "area_m2": round(w * h, 4),
                }
            })
            
    if l_info:
        rn = l_info["rect_notch"]
        notch_id = len(rooms) + 1
        w = round(rn[2] - rn[0], 3)
        h = round(rn[3] - rn[1], 3)
        poly = box_polygon(rn)
        rooms.append({
            "id": notch_id,
            "rect": rn,
            "polygon_m": poly,
            "edges": get_rect_edges(rn),
            "shape": "rectangle",
            "dimensions": {
                "width_m": w,
                "length_m": h,
                "area_m2": round(w * h, 4),
            }
        })
        
    walls, edges, adj = extract_walls_and_connectivity(rooms)
    entry_idx = max(range(len(rooms)), key=lambda i: rooms[i]["dimensions"]["area_m2"])
    doors, windows = place_doors_and_windows(rooms, walls, edges, entry_idx, rng)
    
    # Assertions
    assert len(doors) >= len(rooms), f"Test {test_idx}: Not enough doors"
    assert any(d.get("entrance") for d in doors), f"Test {test_idx}: No entrance door"
    assert sum(r["dimensions"]["area_m2"] for r in rooms) > 10.0

print("50/50 MULTI-TYPOLOGY LAYOUT TESTS PASSED PERFECTLY!")


