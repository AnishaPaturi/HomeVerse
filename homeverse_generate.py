import argparse
import json
import math
import multiprocessing
import os
import random
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOM_TYPES = [
    "Living Room", "Kitchen", "Dining Room", "Kitchen & Dining",
    "Master Bedroom", "Bedroom", "Children's Bedroom", "Guest Bedroom",
    "Bathroom", "Toilet", "Study Room", "Office", "Utility Room",
    "Laundry Room", "Balcony", "Terrace", "Corridor", "Entrance/Foyer",
    "Storage Room", "Walk-in Closet", "Garage", "Staircase",
]
RESOLUTIONS = [512, 768, 1024, 1280, 1536]
STYLES = ["cad", "blueprint", "scan"]
DIFFICULTIES = ["easy", "medium", "hard"]

SCALE_MODES = ["dimensioned", "scale-bar", "reference-object", "no-scale"]
# Strict distribution: 35.2% dimensioned, 30.8% scale-bar, 22.0% reference-object, 12.0% no-scale
SCALE_WEIGHTS = [352, 308, 220, 120]


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


def choose_scale_mode(rng):
    return rng.choices(SCALE_MODES, weights=SCALE_WEIGHTS)[0]


# =====================================================================
# Procedural Geometry & Diverse Footprint Engines
# =====================================================================

def partition_rect(rect, target_count, rng, min_dim=2.2):
    x0, y0, x1, y1 = rect
    cells = [(x0, y0, x1, y1)]
    while len(cells) < target_count:
        candidates = sorted(
            range(len(cells)),
            key=lambda i: (cells[i][2] - cells[i][0]) * (cells[i][3] - cells[i][1]),
            reverse=True
        )
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
    return partition_rect((0.0, 0.0, w, h), n, rng, min_dim=2.2)


def generate_l_layout(rng):
    n1 = rng.randint(2, 5)
    n2 = rng.randint(2, 5)
    w1 = round(rng.uniform(6.0 + 0.8*n1, 9.0 + 1.1*n1), 2)
    h1 = round(rng.uniform(4.5, 6.5), 2)
    w2 = round(rng.uniform(4.5, 6.5), 2)
    h2 = round(rng.uniform(5.5 + 0.7*n2, 8.5 + 1.0*n2), 2)
    corner = rng.choice(["bottom_left", "bottom_right", "top_left", "top_right"])

    if w2 > w1 - 2.0:
        w2 = round(w1 * 0.5, 2)

    cells1 = partition_rect((0.0, 0.0, w1, h1), n1, rng, min_dim=2.2)
    cells2 = partition_rect((0.0, h1, w2, h1 + h2), n2, rng, min_dim=2.2)
    all_cells = cells1 + cells2

    total_w = w1
    total_h = h1 + h2
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

    min_x = min(c[0] for c in transformed)
    min_y = min(c[1] for c in transformed)
    return [(round(c[0]-min_x, 2), round(c[1]-min_y, 2), round(c[2]-min_x, 2), round(c[3]-min_y, 2)) for c in transformed]


def generate_t_layout(rng):
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

    if rng.random() < 0.5:
        total_h = h_base + h_wings
        all_cells = [(c[0], round(total_h - c[3], 2), c[2], round(total_h - c[1], 2)) for c in all_cells]

    min_x = min(c[0] for c in all_cells)
    min_y = min(c[1] for c in all_cells)
    return [(round(c[0]-min_x, 2), round(c[1]-min_y, 2), round(c[2]-min_x, 2), round(c[3]-min_y, 2)) for c in all_cells]


def generate_staggered_layout(rng):
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
        all_cells = [(c[1], c[0], c[3], c[2]) for c in all_cells]

    min_x = min(c[0] for c in all_cells)
    min_y = min(c[1] for c in all_cells)
    return [(round(c[0]-min_x, 2), round(c[1]-min_y, 2), round(c[2]-min_x, 2), round(c[3]-min_y, 2)) for c in all_cells]


LAYOUT_GENERATORS = [
    (generate_rect_layout, 35, "rectilinear"),
    (generate_l_layout, 20, "l_shaped"),
    (generate_t_layout, 15, "t_shaped"),
    (generate_u_layout, 10, "u_shaped"),
    (generate_staggered_layout, 10, "z_shaped"),
    (generate_corridor_spine_layout, 10, "corridor_spine"),
]


def carve_l_shaped_room(cells, rng):
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
    else:  # bottom_left
        xc, yc = tx0 + cut_w, ty0 + cut_h
        poly_l = [(xc, ty0), (tx1, ty0), (tx1, ty1), (tx0, ty1), (tx0, yc), (xc, yc)]
        rect_notch = (tx0, ty0, xc, yc)

    return cells, {
        "target_index": target_i,
        "poly_l": poly_l,
        "rect_notch": rect_notch,
    }


def extract_walls_and_connectivity(rooms):
    num_rooms = len(rooms)
    internal_walls = []
    internal_edges = []
    adj = {i: [] for i in range(num_rooms)}

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
                        start = (lo, pos) if t == "h" else (pos, lo)
                        end = (hi, pos) if t == "h" else (pos, hi)
                        internal_walls.append({
                            "type": "internal",
                            "room_ids": [rooms[i]["id"], rooms[j]["id"]],
                            "start_m": start,
                            "end_m": end,
                            "thickness_m": 0.15,
                        })

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
                    start = (lo, pos) if t == "h" else (pos, lo)
                    end = (hi, pos) if t == "h" else (pos, hi)
                    external_walls.append({
                        "type": "external",
                        "room_ids": [rooms[i]["id"]],
                        "start_m": start,
                        "end_m": end,
                        "thickness_m": 0.25,
                    })

    return internal_walls + external_walls, internal_edges, adj


def assign_room_types(rooms, entry_idx, l_info, rng):
    num_rooms = len(rooms)
    assigned = [None] * num_rooms

    # 1. Entrance / Foyer or Living Room
    if num_rooms >= 4 and rng.random() < 0.45:
        assigned[entry_idx] = "Entrance/Foyer"
    else:
        assigned[entry_idx] = "Living Room"

    # 2. Notch room assignment (ensuite / walk-in closet)
    if l_info:
        notch_idx = num_rooms - 1
        notch_area = rooms[notch_idx]["dimensions"]["area_m2"]
        if notch_area <= 5.5:
            assigned[notch_idx] = rng.choice(["Bathroom", "Toilet", "Walk-in Closet", "Storage Room"])
        else:
            assigned[notch_idx] = rng.choice(["Bathroom", "Study Room", "Utility Room"])

        target_idx = l_info["target_index"]
        if assigned[target_idx] is None:
            if assigned[notch_idx] in ["Walk-in Closet", "Bathroom"]:
                assigned[target_idx] = "Master Bedroom"
            else:
                assigned[target_idx] = rng.choice(["Living Room", "Kitchen & Dining", "Master Bedroom"])

    # 3. Detect corridors (elongated narrow rooms)
    for idx, r in enumerate(rooms):
        if assigned[idx] is not None:
            continue
        rx0, ry0, rx1, ry1 = r["rect"]
        rw, rh = rx1 - rx0, ry1 - ry0
        aspect = max(rw, rh) / max(min(rw, rh), 0.1)
        if aspect >= 2.4 and min(rw, rh) <= 2.2 and r["shape"] == "rectangle":
            assigned[idx] = "Corridor"
            break

    # 4. Mandatory rooms
    unassigned = [i for i in range(num_rooms) if assigned[i] is None]
    unassigned_by_area = sorted(unassigned, key=lambda i: rooms[i]["dimensions"]["area_m2"], reverse=True)

    if "Living Room" not in assigned and unassigned_by_area:
        assigned[unassigned_by_area.pop(0)] = "Living Room"

    if "Kitchen" not in assigned and "Kitchen & Dining" not in assigned and unassigned_by_area:
        assigned[unassigned_by_area.pop(min(len(unassigned_by_area)-1, 1))] = rng.choice(["Kitchen", "Kitchen & Dining"])

    if "Bathroom" not in assigned and unassigned_by_area:
        assigned[unassigned_by_area.pop(-1)] = "Bathroom"

    # 5. Bedrooms
    if "Master Bedroom" not in assigned and unassigned_by_area:
        assigned[unassigned_by_area.pop(0)] = "Master Bedroom"

    bedroom_pool = ["Bedroom", "Bedroom", "Children's Bedroom", "Guest Bedroom"]
    rng.shuffle(bedroom_pool)
    while unassigned_by_area and bedroom_pool:
        assigned[unassigned_by_area.pop(0)] = bedroom_pool.pop(0)

    # 6. Secondary / Service / Outdoor rooms
    misc_pool = [
        "Dining Room", "Study Room", "Office", "Utility Room",
        "Laundry Room", "Storage Room", "Balcony", "Toilet", "Terrace",
    ]
    rng.shuffle(misc_pool)
    for idx in unassigned_by_area:
        assigned[idx] = misc_pool.pop(0) if misc_pool else "Bedroom"

    for i in range(num_rooms):
        rooms[i]["type"] = assigned[i]


def place_doors_and_windows(rooms, walls, internal_edges, entry_idx, rng):
    num_rooms = len(rooms)
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
        if (min(i, j), max(i, j)) not in used_edges and rng.random() < 0.22:
            doors.append(make_door(rooms[i]["id"], rooms[j]["id"], ov))
            used_edges.add((min(i, j), max(i, j)))

    # Exterior entrance door on entry room
    ext_walls = [w for w in walls if w["type"] == "external" and rooms[entry_idx]["id"] in w["room_ids"]]
    if not ext_walls:
        ext_walls = [w for w in walls if w["type"] == "external"]
    if ext_walls:
        ew = max(ext_walls, key=lambda w: math.dist(w["start_m"], w["end_m"]))
        s, e = ew["start_m"], ew["end_m"]
        t = "h" if abs(s[1] - e[1]) < 1e-5 else "v"
        lo = min(s[0], e[0]) if t == "h" else min(s[1], e[1])
        hi = max(s[0], e[0]) if t == "h" else max(s[1], e[1])
        pos = s[1] if t == "h" else s[0]
        ov = (t, pos, lo, hi)
        doors.append(make_door(None, rooms[entry_idx]["id"], ov, is_entrance=True))

    # Windows on external walls
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


def generate_layout(rng):
    gen_func = rng.choices([g[0] for g in LAYOUT_GENERATORS], weights=[g[1] for g in LAYOUT_GENERATORS])[0]
    for _ in range(50):
        cells = gen_func(rng)
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
                },
                "adjoining_to": l_info["target_index"] + 1,
            })

        walls, internal_edges, adj = extract_walls_and_connectivity(rooms)

        # Entrance selection
        ext_wall_rooms = {r_id for w in walls if w["type"] == "external" for r_id in w["room_ids"]}
        entry_candidates = [i for i, r in enumerate(rooms) if r["id"] in ext_wall_rooms]
        if not entry_candidates:
            entry_candidates = list(range(len(rooms)))
        entry_idx = max(entry_candidates, key=lambda i: rooms[i]["dimensions"]["area_m2"])

        assign_room_types(rooms, entry_idx, l_info, rng)
        doors, windows = place_doors_and_windows(rooms, walls, internal_edges, entry_idx, rng)

        if len(doors) >= len(rooms):
            # Building envelope dimensions
            all_xs = [p[0] for r in rooms for p in r["polygon_m"]]
            all_ys = [p[1] for r in rooms for p in r["polygon_m"]]
            width = round(max(all_xs) - min(all_xs), 3)
            height = round(max(all_ys) - min(all_ys), 3)
            return width, height, rooms, walls, doors, windows

    # Ultimate guaranteed fallback
    cells = generate_rect_layout(rng)
    rooms = []
    for idx, c in enumerate(cells):
        w, h = round(c[2] - c[0], 3), round(c[3] - c[1], 3)
        rooms.append({
            "id": idx + 1, "rect": c, "polygon_m": box_polygon(c),
            "edges": get_rect_edges(c), "shape": "rectangle",
            "dimensions": {"width_m": w, "length_m": h, "area_m2": round(w * h, 4)}
        })
    walls, internal_edges, adj = extract_walls_and_connectivity(rooms)
    entry_idx = max(range(len(rooms)), key=lambda i: rooms[i]["dimensions"]["area_m2"])
    assign_room_types(rooms, entry_idx, None, rng)
    doors, windows = place_doors_and_windows(rooms, walls, internal_edges, entry_idx, rng)
    all_xs = [p[0] for r in rooms for p in r["polygon_m"]]
    all_ys = [p[1] for r in rooms for p in r["polygon_m"]]
    width = round(max(all_xs) - min(all_xs), 3)
    height = round(max(all_ys) - min(all_ys), 3)
    return width, height, rooms, walls, doors, windows


# =====================================================================
# Rendering & Visual Synthesis
# =====================================================================

def draw_architectural_symbols(draw, room, xy, scale, furniture_ink, ink, scale_mode, rng):
    rtype = room["type"]
    rx0, ry0, rx1, ry1 = room["rect"]
    rw, rh = rx1 - rx0, ry1 - ry0
    cx = (rx0 + rx1) / 2.0
    cy = (ry0 + ry1) / 2.0

    # 1. Bedrooms
    if rtype in ["Bedroom", "Master Bedroom", "Children's Bedroom", "Guest Bedroom"]:
        bed_w = 1.8 if rtype == "Master Bedroom" else (1.0 if rtype == "Children's Bedroom" else 1.5)
        bed_l = 2.0
        if rw >= bed_w + 0.6 and rh >= bed_l + 0.6:
            bx0 = rx0 + (rw - bed_w) / 2.0
            by0 = ry0 + 0.2
            bx1 = bx0 + bed_w
            by1 = by0 + bed_l
            draw.rectangle([xy((bx0, by0)), xy((bx1, by1))], outline=furniture_ink, width=1)
            pw = 0.55 if bed_w >= 1.4 else (bed_w - 0.2)
            if bed_w >= 1.4:
                draw.rectangle([xy((bx0 + 0.1, by0 + 0.1)), xy((bx0 + 0.1 + pw, by0 + 0.45))], outline=furniture_ink, width=1)
                draw.rectangle([xy((bx1 - 0.1 - pw, by0 + 0.1)), xy((bx1 - 0.1, by0 + 0.45))], outline=furniture_ink, width=1)
            else:
                draw.rectangle([xy((bx0 + 0.1, by0 + 0.1)), xy((bx1 - 0.1, by0 + 0.45))], outline=furniture_ink, width=1)
            draw.line([xy((bx0, by0 + 0.9)), xy((bx1, by0 + 0.9))], fill=furniture_ink, width=1)
            if bx0 - rx0 >= 0.5:
                draw.rectangle([xy((bx0 - 0.45, by0)), xy((bx0 - 0.05, by0 + 0.4))], outline=furniture_ink, width=1)
            if rx1 - bx1 >= 0.5:
                draw.rectangle([xy((bx1 + 0.05, by0)), xy((bx1 + 0.45, by0 + 0.4))], outline=furniture_ink, width=1)
            if scale_mode == "reference-object":
                draw.text(xy((cx, by0 + 1.2)), f"[Bed: {bed_w:.1f}x{bed_l:.1f}m]", fill=ink, anchor="mm")

    # 2. Living Room
    elif rtype == "Living Room":
        sw, sh = min(2.4, rw - 1.0), 0.85
        if rw >= 3.0 and rh >= 3.0:
            sofa_x = cx - sw / 2.0
            sofa_y = ry0 + 0.4
            draw.rectangle([xy((sofa_x, sofa_y)), xy((sofa_x + sw, sofa_y + sh))], outline=furniture_ink, width=1)
            draw.rectangle([xy((sofa_x, sofa_y)), xy((sofa_x + sw, sofa_y + 0.25))], outline=furniture_ink, width=1)
            draw.rectangle([xy((sofa_x, sofa_y)), xy((sofa_x + 0.22, sofa_y + sh))], outline=furniture_ink, width=1)
            draw.rectangle([xy((sofa_x + sw - 0.22, sofa_y)), xy((sofa_x + sw, sofa_y + sh))], outline=furniture_ink, width=1)
            cw, ch = min(1.2, sw - 0.4), 0.5
            draw.rectangle([xy((cx - cw/2.0, sofa_y + sh + 0.3)), xy((cx + cw/2.0, sofa_y + sh + 0.3 + ch))], outline=furniture_ink, width=1)
            if rh >= 4.0:
                draw.rectangle([xy((cx - 1.0, ry1 - 0.5)), xy((cx + 1.0, ry1 - 0.15))], outline=furniture_ink, width=1)
            if scale_mode == "reference-object":
                draw.text(xy((cx, sofa_y + sh + 0.55)), f"[Sofa: {sw:.1f}m]", fill=ink, anchor="mm")

    # 3. Kitchen & Dining / Kitchen
    elif rtype in ["Kitchen", "Kitchen & Dining"]:
        draw.rectangle([xy((rx0 + 0.1, ry0 + 0.1)), xy((rx1 - 0.1, ry0 + 0.7))], outline=furniture_ink, width=1)
        ck_x = rx0 + 0.4
        draw.rectangle([xy((ck_x, ry0 + 0.18)), xy((ck_x + 0.7, ry0 + 0.62))], outline=furniture_ink, width=1)
        for bx_i, by_i in [(ck_x + 0.18, ry0 + 0.28), (ck_x + 0.52, ry0 + 0.28), (ck_x + 0.18, ry0 + 0.52), (ck_x + 0.52, ry0 + 0.52)]:
            draw.ellipse([xy((bx_i - 0.07, by_i - 0.07)), xy((bx_i + 0.07, by_i + 0.07))], outline=furniture_ink, width=1)
        sk_x = rx1 - 1.2
        if sk_x > ck_x + 0.9:
            draw.rectangle([xy((sk_x, ry0 + 0.18)), xy((sk_x + 0.8, ry0 + 0.62))], outline=furniture_ink, width=1)
            draw.rectangle([xy((sk_x + 0.05, ry0 + 0.22)), xy((sk_x + 0.38, ry0 + 0.58))], outline=furniture_ink, width=1)
            draw.rectangle([xy((sk_x + 0.42, ry0 + 0.22)), xy((sk_x + 0.75, ry0 + 0.58))], outline=furniture_ink, width=1)
        if rtype == "Kitchen & Dining" and rh >= 4.0:
            tw, th = 1.4, 0.8
            draw.rectangle([xy((cx - tw/2.0, ry0 + 1.8)), xy((cx + tw/2.0, ry0 + 1.8 + th))], outline=furniture_ink, width=1)
        if scale_mode == "reference-object":
            draw.text(xy((cx, ry0 + 1.1)), "[Counter: 0.6m]", fill=ink, anchor="mm")

    # 4. Dining Room
    elif rtype == "Dining Room":
        tw, th = min(1.8, rw - 1.0), 0.9
        if rw >= 2.4 and rh >= 2.4:
            draw.rectangle([xy((cx - tw/2.0, cy - th/2.0)), xy((cx + tw/2.0, cy + th/2.0))], outline=furniture_ink, width=1)
            for ch_x in [cx - tw/3.0, cx + tw/3.0]:
                draw.rectangle([xy((ch_x - 0.2, cy - th/2.0 - 0.3)), xy((ch_x + 0.2, cy - th/2.0 - 0.05))], outline=furniture_ink, width=1)
                draw.rectangle([xy((ch_x - 0.2, cy + th/2.0 + 0.05)), xy((ch_x + 0.2, cy + th/2.0 + 0.3))], outline=furniture_ink, width=1)
            if scale_mode == "reference-object":
                draw.text(xy((cx, cy)), f"[Table: {tw:.1f}x{th:.1f}m]", fill=ink, anchor="mm")

    # 5. Bathroom / Toilet
    elif rtype in ["Bathroom", "Toilet"]:
        wc_x = rx0 + 0.2
        draw.rectangle([xy((wc_x, ry0 + 0.1)), xy((wc_x + 0.45, ry0 + 0.25))], outline=furniture_ink, width=1)
        draw.ellipse([xy((wc_x + 0.05, ry0 + 0.22)), xy((wc_x + 0.4, ry0 + 0.65))], outline=furniture_ink, width=1)
        if rw >= 1.8:
            vx = rx1 - 0.8
            draw.rectangle([xy((vx, ry0 + 0.1)), xy((vx + 0.65, ry0 + 0.45))], outline=furniture_ink, width=1)
            draw.ellipse([xy((vx + 0.1, ry0 + 0.15)), xy((vx + 0.55, ry0 + 0.4))], outline=furniture_ink, width=1)
        if rtype == "Bathroom" and rh >= 2.2:
            draw.rectangle([xy((rx0 + 0.1, ry1 - 0.95)), xy((rx0 + 0.95, ry1 - 0.1))], outline=furniture_ink, width=1)
            draw.line([xy((rx0 + 0.1, ry1 - 0.95)), xy((rx0 + 0.95, ry1 - 0.1))], fill=furniture_ink, width=1)
            draw.line([xy((rx0 + 0.1, ry1 - 0.1)), xy((rx0 + 0.95, ry1 - 0.95))], fill=furniture_ink, width=1)
        if scale_mode == "reference-object":
            draw.text(xy((cx, cy + 0.4)), "[WC: 0.7m]", fill=ink, anchor="mm")

    # 6. Study Room / Office
    elif rtype in ["Study Room", "Office"]:
        dw, dh = min(1.4, rw - 0.8), 0.65
        draw.rectangle([xy((rx0 + 0.2, ry0 + 0.2)), xy((rx0 + 0.2 + dw, ry0 + 0.2 + dh))], outline=furniture_ink, width=1)
        draw.ellipse([xy((rx0 + 0.2 + dw/2.0 - 0.2, ry0 + 0.2 + dh + 0.1)), xy((rx0 + 0.2 + dw/2.0 + 0.2, ry0 + 0.2 + dh + 0.5))], outline=furniture_ink, width=1)

    # 7. Laundry Room / Utility Room
    elif rtype in ["Laundry Room", "Utility Room"]:
        draw.rectangle([xy((rx0 + 0.2, ry0 + 0.2)), xy((rx0 + 0.8, ry0 + 0.8))], outline=furniture_ink, width=1)
        draw.ellipse([xy((rx0 + 0.3, ry0 + 0.3)), xy((rx0 + 0.7, ry0 + 0.7))], outline=furniture_ink, width=1)

    # 8. Storage Room / Walk-in Closet
    elif rtype in ["Storage Room", "Walk-in Closet"]:
        draw.line([xy((rx0 + 0.35, ry0 + 0.1)), xy((rx0 + 0.35, ry1 - 0.1))], fill=furniture_ink, width=1)
        draw.line([xy((rx1 - 0.35, ry0 + 0.1)), xy((rx1 - 0.35, ry1 - 0.1))], fill=furniture_ink, width=1)

    # 9. Balcony / Terrace
    elif rtype in ["Balcony", "Terrace"]:
        step = 0.4
        curr = rx0 + step
        while curr < rx1 - 0.1:
            draw.line([xy((curr, ry0 + 0.1)), xy((curr, ry1 - 0.1))], fill=furniture_ink, width=1)
            curr += step


def render(width, height, rooms, walls, doors, windows, size,
           style, scale_mode, difficulty, rng):
    bg, ink = ((19, 54, 103), (240, 247, 255)) if style == "blueprint" \
              else ((255, 255, 255), (25, 30, 35))
    furniture_ink = (100, 160, 220) if style == "blueprint" else (85, 100, 120)

    image = Image.new("RGB", (size, size), bg)
    mask = Image.new("I", (size, size), 0)
    draw, mdraw = ImageDraw.Draw(image), ImageDraw.Draw(mask)
    margin = max(38, size // 14)
    scale = (size - 2*margin) / max(width, height)
    ox = (size - width*scale)/2
    oy = (size - height*scale)/2

    def xy(p):
        return (ox + p[0]*scale, oy + p[1]*scale)

    for room in rooms:
        poly = [xy(p) for p in room["polygon_m"]]
        mdraw.polygon(poly, fill=room["id"])

    # Draw architectural furniture symbols
    for room in rooms:
        draw_architectural_symbols(draw, room, xy, scale, furniture_ink, ink, scale_mode, rng)

    # Walls
    for wall in walls:
        pts = [xy(wall["start_m"]), xy(wall["end_m"])]
        stroke = max(2, round(wall["thickness_m"]*scale))
        draw.line(pts, fill=ink, width=stroke)

    # Doors & windows
    for opening in doors + windows:
        p = opening["position_m"]
        half = opening["width_m"]/2
        horizontal = opening["orientation"] == "horizontal"
        a = (p[0]-half, p[1]) if horizontal else (p[0], p[1]-half)
        b = (p[0]+half, p[1]) if horizontal else (p[0], p[1]+half)
        draw.line([xy(a), xy(b)], fill=bg, width=max(4, round(0.31*scale)))
        if opening in windows:
            draw.line([xy(a), xy(b)], fill=(45, 165, 210), width=max(2, round(0.045*scale)))
        else:
            draw.line([xy(p), xy(b)], fill=ink, width=2)
            draw.line([xy(p), xy(b)], fill=furniture_ink, width=1)

    # Room Labels & Dimension Text (Only if scale_mode allows it!)
    if difficulty != "hard":
        for room in rooms:
            rx0, ry0, rx1, ry1 = room["rect"]
            cx, cy = xy(((rx0+rx1)/2, (ry0+ry1)/2))
            if difficulty == "easy" or rng.random() < 0.65:
                label = room["type"][:18]
                draw.text((cx, cy), label, fill=ink, anchor="mm")
            # Render dimension text ONLY when scale_mode is "dimensioned"
            if scale_mode == "dimensioned" and (difficulty == "easy" or rng.random() < 0.70):
                d = room["dimensions"]
                draw.text((cx, cy+14), f'{d["width_m"]:.2f} x {d["length_m"]:.2f} m', fill=ink, anchor="mm")

    # Scale Bar (Only if scale_mode is "scale-bar")
    if scale_mode == "scale-bar":
        x, y = margin, size - margin//2
        bar_len = 5 * scale
        if x + bar_len < size - margin:
            draw.line([(x, y), (x + bar_len, y)], fill=ink, width=3)
            draw.line([(x, y - 4), (x, y + 4)], fill=ink, width=2)
            draw.line([(x + bar_len/2, y - 3), (x + bar_len/2, y + 3)], fill=ink, width=2)
            draw.line([(x + bar_len, y - 4), (x + bar_len, y + 4)], fill=ink, width=2)
            draw.text((x, y-18), "0", fill=ink)
            draw.text((x + bar_len/2, y-18), "2.5m", fill=ink, anchor="ma")
            draw.text((x + bar_len, y-18), "5 m", fill=ink, anchor="ra")

    if style == "scan":
        image = image.filter(ImageFilter.GaussianBlur(radius=0.35))

    return image, mask, scale


# =====================================================================
# Annotation Schema & Validation
# =====================================================================

def normalized_annotation(image_id, path, size, width, height,
                          rooms, walls, doors, windows, difficulty,
                          style, scale_mode, scale_px_per_m, split, layout_id, variant_idx):
    margin = max(38, size // 14)
    scale = (size - 2*margin) / max(width, height)
    ox, oy = (size - width*scale)/2, (size - height*scale)/2

    def norm(p):
        return [round((ox + p[0]*scale)/size, 5), round((oy + p[1]*scale)/size, 5)]

    annotated_rooms = []
    for room in rooms:
        polygon = [norm(p) for p in room["polygon_m"]]
        xs, ys = zip(*polygon)
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        w_norm = round(max_x - min_x, 5)
        h_norm = round(max_y - min_y, 5)

        annotated_rooms.append({
            "id": room["id"],
            "type": room["type"],
            "shape": room.get("shape", "rectangle"),
            "polygon": polygon,
            "bbox": [round(min_x, 5), round(min_y, 5), w_norm, h_norm],
            "bbox_dict": {"x": min_x, "y": min_y, "width": w_norm, "height": h_norm},
            "width_m": room["dimensions"]["width_m"],
            "length_m": room["dimensions"]["length_m"],
            "area_m2": room["dimensions"]["area_m2"],
            "dimensions": room["dimensions"],
        })

    def opening_record(o):
        return {
            **{k: v for k, v in o.items() if k not in ("position_m", "wall_edge_m")},
            "position": norm(o["position_m"]),
            "wall_edge": [norm(p) for p in o["wall_edge_m"]],
        }

    total_floor_area = round(sum(r["dimensions"]["area_m2"] for r in rooms), 4)

    return {
        "image_id": image_id,
        "layout_id": layout_id,
        "variant": variant_idx,
        "image_path": path,
        "image": {"width": size, "height": size},
        "building": {
            "width_m": width,
            "length_m": height,
            "area_m2": total_floor_area,
        },
        "rooms": annotated_rooms,
        "doors": [opening_record(o) for o in doors],
        "windows": [opening_record(o) for o in windows],
        "walls": [{
            **{k: v for k, v in wall.items() if k not in ("start_m", "end_m")},
            "start": norm(wall["start_m"]),
            "end": norm(wall["end_m"]),
        } for wall in walls],
        "connectivity": [[d["room_from_id"], d["room_to_id"]]
                         for d in doors if d["room_from_id"] is not None],
        "difficulty": difficulty,
        "style": style,
        "scale_mode": scale_mode,
        "pixels_per_meter": round(scale_px_per_m, 4) if scale_mode != "no-scale" else None,
        "raw_pixels_per_meter": round(scale_px_per_m, 4),
        "unit": "meter",
        "split": split,
    }


def validate(width, height, rooms, walls, doors, windows, ann):
    total_area = sum(r["dimensions"]["area_m2"] for r in rooms)
    assert abs(ann["building"]["area_m2"] - total_area) < 1e-4
    assert all(r["dimensions"]["area_m2"] > 0 for r in rooms)
    assert len(doors) >= len(rooms)
    for d in doors:
        assert d["width_m"] > 0
        if d["room_from_id"] is not None:
            assert d["room_from_id"] != d["room_to_id"]
    for room in ann["rooms"]:
        p = room["polygon"]
        assert all(0 <= x <= 1 and 0 <= y <= 1 for x, y in p)
        xs, ys = zip(*p)
        b = room["bbox"]
        assert abs(b[0] - min(xs)) < 1e-4
        assert abs(b[1] - min(ys)) < 1e-4


# =====================================================================
# Multiprocess Batch Worker
# =====================================================================

def generate_layout_chunk(args_tuple):
    layout_ids, variants_per_layout, seed, out_dir_str, assignments = args_tuple
    out_dir = Path(out_dir_str)
    rng = random.Random(seed)

    results_by_split = {"train": [], "validation": [], "test": []}
    split_counts = Counter()
    scale_counts = Counter()

    for layout_id in layout_ids:
        split = assignments[layout_id]
        layout_name = f"layout_{layout_id:06d}"

        width, height, rooms, walls, doors, windows = generate_layout(rng)

        for variant in range(variants_per_layout):
            number = (layout_id - 1) * variants_per_layout + variant + 1
            image_id = f"homeverse_{number:06d}"
            size = rng.choice(RESOLUTIONS)
            difficulty = rng.choices(DIFFICULTIES, weights=[30, 40, 30])[0]
            style = STYLES[variant % len(STYLES)]
            scale_mode = choose_scale_mode(rng)

            image, mask, scale_px_per_m = render(
                width, height, rooms, walls, doors, windows,
                size, style, scale_mode, difficulty, rng
            )

            rel_img = f"images/{split}/{image_id}.png"
            rel_mask = f"segmentation/{split}/{image_id}.png"

            ann = normalized_annotation(
                image_id, rel_img, size, width, height, rooms, walls,
                doors, windows, difficulty, style, scale_mode,
                scale_px_per_m, split, layout_name, variant
            )
            ann["mask_path"] = rel_mask
            validate(width, height, rooms, walls, doors, windows, ann)

            # Save PNG files
            image.save(out_dir / rel_img)
            mask.convert("I;16").save(out_dir / rel_mask)

            results_by_split[split].append(ann)
            split_counts[split] += 1
            scale_counts[scale_mode] += 1

    return results_by_split, split_counts, scale_counts


# =====================================================================
# Main CLI Entrypoint
# =====================================================================

def main():
    parser = argparse.ArgumentParser(description="HomeVerse Diverse Procedural Dataset Generator")
    parser.add_argument("--layouts", type=int, default=10000)
    parser.add_argument("--variants", type=int, default=3)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--out", type=Path, default=Path("HomeVerse-Dataset"))
    parser.add_argument("--workers", type=int, default=min(8, os.cpu_count() or 4))
    args = parser.parse_args()

    assert args.layouts > 0 and args.variants > 0
    rng = random.Random(args.seed)
    root = args.out
    (root / "annotations").mkdir(parents=True, exist_ok=True)
    (root / "metadata").mkdir(parents=True, exist_ok=True)

    for split in ("train", "validation", "test"):
        (root / "images" / split).mkdir(parents=True, exist_ok=True)
        (root / "segmentation" / split).mkdir(parents=True, exist_ok=True)

    # Layout-level splitting: all variants of layout_000123 stay strictly in the same split
    ids = list(range(1, args.layouts + 1))
    rng.shuffle(ids)
    assignments = {}
    for pos, layout_id in enumerate(ids):
        fraction = pos / args.layouts
        assignments[layout_id] = (
            "train" if fraction < 0.70 else
            "validation" if fraction < 0.85 else "test"
        )

    # Chunk layout IDs across worker processes
    num_workers = min(args.workers, args.layouts)
    chunk_size = math.ceil(args.layouts / num_workers)
    chunks = []
    for w in range(num_workers):
        start_idx = w * chunk_size + 1
        end_idx = min((w + 1) * chunk_size + 1, args.layouts + 1)
        if start_idx < end_idx:
            chunk_ids = list(range(start_idx, end_idx))
            worker_seed = args.seed + w * 10007
            chunks.append((chunk_ids, args.variants, worker_seed, str(root), assignments))

    print(f"Generating {args.layouts} unique layouts x {args.variants} variants = {args.layouts * args.variants} images")
    print(f"Using {len(chunks)} parallel worker processes...")

    all_results = {"train": [], "validation": [], "test": []}
    total_split_counts = Counter()
    total_scale_counts = Counter()

    if len(chunks) == 1:
        res, sc, sm = generate_layout_chunk(chunks[0])
        for s in ("train", "validation", "test"):
            all_results[s].extend(res[s])
        total_split_counts.update(sc)
        total_scale_counts.update(sm)
    else:
        with multiprocessing.Pool(processes=len(chunks)) as pool:
            for res, sc, sm in pool.imap_unordered(generate_layout_chunk, chunks):
                for s in ("train", "validation", "test"):
                    all_results[s].extend(res[s])
                total_split_counts.update(sc)
                total_scale_counts.update(sm)
                total_done = sum(total_split_counts.values()) // args.variants
                print(f"Progress: {total_done}/{args.layouts} layouts completed ({sum(total_split_counts.values())} images)...", flush=True)

    # Write annotation files in sorted order
    for split in ("train", "validation", "test"):
        split_anns = sorted(all_results[split], key=lambda a: a["image_id"])
        ann_path = root / "annotations" / f"{split}.json"
        with ann_path.open("w", encoding="utf-8") as f:
            json.dump(split_anns, f, indent=2)

    # Write metadata
    (root / "metadata" / "rooms.json").write_text(
        json.dumps({"classes": ROOM_TYPES}, indent=2), encoding="utf-8"
    )
    (root / "metadata" / "dataset_statistics.json").write_text(
        json.dumps({
            "layouts": args.layouts,
            "images": sum(total_split_counts.values()),
            "splits": dict(total_split_counts),
            "scale_modes": dict(total_scale_counts),
            "scale_mode_percentages": {
                k: round(v / max(1, sum(total_scale_counts.values())) * 100, 2)
                for k, v in total_scale_counts.items()
            },
            "seed": args.seed,
        }, indent=2), encoding="utf-8"
    )
    (root / "README.md").write_text(
        "# HomeVerse Procedural Dataset (Diverse Geometry)\n\n"
        "Geometry-first synthetic dataset with 10k+ diverse architectural typologies.\n\n"
        "## Typologies Included:\n"
        "- Rectilinear partitioned layouts (studios, apartments, residences)\n"
        "- L-shaped winged residences with corner patios\n"
        "- T-shaped modular residences with central stem wings\n"
        "- U-shaped courtyard layouts\n"
        "- Staggered / Z-shaped articulated volume layouts\n"
        "- Central corridor spine residential plans\n"
        "- Non-convex L-shaped room carvings (open living/dining, ensuite baths)\n\n"
        "## Scale Mode Distribution:\n"
        "- 35.2% dimensioned (explicit room dimension text)\n"
        "- 30.8% scale-bar (graphical distance scale bar)\n"
        "- 22.0% reference-object (architectural fixtures with metric scale tags)\n"
        "- 12.0% no-scale (raw geometry only, unannotated)\n\n"
        "## Split Integrity:\n"
        "Split strictly by unique layout ID. All 3 visual variants of any layout share the exact same split.\n",
        encoding="utf-8"
    )

    print("\nGeneration finished successfully!")
    print(f"Total images generated: {sum(total_split_counts.values())}")
    print(f"Splits: {dict(total_split_counts)}")
    print(f"Scale modes: {dict(total_scale_counts)}")


if __name__ == "__main__":
    main()
