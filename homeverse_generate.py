import argparse
import json
import math
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


def area(r):
    return (r[2] - r[0]) * (r[3] - r[1])


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


def share_edge(a, b):
    eps = 1e-7
    if abs(a[2] - b[0]) < eps or abs(b[2] - a[0]) < eps:
        x = a[2] if abs(a[2] - b[0]) < eps else b[2]
        lo, hi = max(a[1], b[1]), min(a[3], b[3])
        if hi - lo >= 1.2:
            return ("vertical", x, lo, hi)
    if abs(a[3] - b[1]) < eps or abs(b[3] - a[1]) < eps:
        y = a[3] if abs(a[3] - b[1]) < eps else b[3]
        lo, hi = max(a[0], b[0]), min(a[2], b[2])
        if hi - lo >= 1.2:
            return ("horizontal", y, lo, hi)
    return None


def target_room_count(rng):
    bucket = rng.choices(range(5), weights=[10, 25, 35, 20, 10])[0]
    ranges = [(1, 2), (3, 4), (5, 7), (8, 10), (11, 12)]
    return rng.randint(*ranges[bucket])


def line_segment(edge):
    orientation, fixed, lo, hi = edge
    return ([(fixed, lo), (fixed, hi)] if orientation == "vertical"
            else [(lo, fixed), (hi, fixed)])


def on_edge(edge, t):
    orientation, fixed, _, _ = edge
    return (fixed, t) if orientation == "vertical" else (t, fixed)


def choose_scale_mode(rng):
    if rng.random() < 0.12:
        return "none"
    return rng.choices(
        ["dimensioned", "scale_bar", "reference_object"],
        weights=[40, 35, 25],
    )[0]


def assign_enhanced_types(rooms, entry, l_info, rng):
    num_rooms = len(rooms)
    assigned = [None] * num_rooms
    
    # 1. Entrance / Foyer or Living Room
    if num_rooms >= 4 and rng.random() < 0.45:
        assigned[entry] = "Entrance/Foyer"
    else:
        assigned[entry] = "Living Room"

    # 2. Notch room assignment (adjoining en-suite)
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
        if aspect >= 2.2 and min(rw, rh) <= 2.4 and r["shape"] == "rectangle":
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
        "Laundry Room", "Storage Room", "Balcony", "Toilet"
    ]
    rng.shuffle(misc_pool)
    for idx in unassigned_by_area:
        assigned[idx] = misc_pool.pop(0) if misc_pool else "Bedroom"

    for i in range(num_rooms):
        rooms[i]["type"] = assigned[i]


def generate_geometry(rng):
    for _ in range(300):
        n = target_room_count(rng)
        width = round(rng.uniform(7 + 0.55*n, 10 + 0.85*n), 2)
        height = round(rng.uniform(6 + 0.35*n, 8 + 0.65*n), 2)
        
        cells = [(0.0, 0.0, width, height)]
        while len(cells) < n:
            candidates = sorted(range(len(cells)), key=lambda i: area(cells[i]), reverse=True)
            success = False
            for i in candidates:
                x0, y0, x1, y1 = cells[i]
                w, h = x1 - x0, y1 - y0
                axes = ["x", "y"] if w >= h else ["y", "x"]
                for axis in axes:
                    length = w if axis == "x" else h
                    if length < 5.0:
                        continue
                    cut = round(rng.uniform(2.3, length - 2.3), 2)
                    if axis == "x":
                        parts = [(x0, y0, x0+cut, y1), (x0+cut, y0, x1, y1)]
                    else:
                        parts = [(x0, y0, x1, y0+cut), (x0, y0+cut, x1, y1)]
                    cells[i:i+1] = parts
                    success = True
                    break
                if success:
                    break
            if not success:
                break
        if len(cells) != n:
            continue

        edges = [(i, j, s) for i in range(n) for j in range(i+1, n) if (s := share_edge(cells[i], cells[j]))]
        exterior = [i for i, (x0, y0, x1, y1) in enumerate(cells) if min(x0, y0, width-x1, height-y1) < 1e-7]
        entry = max(exterior, key=lambda i: area(cells[i]))
        
        visited, tree = {entry}, []
        while len(visited) < n:
            options = [(i, j, s) for i, j, s in edges if (i in visited) != (j in visited)]
            if not options:
                break
            i, j, s = rng.choice(options)
            tree.append((i, j, s))
            visited.update((i, j))
        if len(visited) != n:
            continue

        # Non-convex L-shape carving
        l_info = None
        if n >= 3 and rng.random() < 0.45:
            large_candidates = [i for i in range(n) if (cells[i][2]-cells[i][0] >= 4.5 and cells[i][3]-cells[i][1] >= 4.0)]
            if large_candidates:
                target_i = rng.choice(large_candidates)
                tx0, ty0, tx1, ty1 = cells[target_i]
                tw, th = tx1 - tx0, ty1 - ty0
                cut_w = round(rng.uniform(1.8, min(2.8, tw - 2.2)), 2)
                cut_h = round(rng.uniform(1.8, min(2.6, th - 2.0)), 2)
                corner = rng.choice(['top_right', 'top_left', 'bottom_right', 'bottom_left'])
                if corner == 'top_right':
                    xc, yc = tx1 - cut_w, ty1 - cut_h
                    poly_l = [(tx0, ty0), (tx1, ty0), (tx1, yc), (xc, yc), (xc, ty1), (tx0, ty1)]
                    rect_notch = (xc, yc, tx1, ty1)
                    w1 = ("horizontal", yc, xc, tx1)
                    w2 = ("vertical", xc, yc, ty1)
                elif corner == 'top_left':
                    xc, yc = tx0 + cut_w, ty1 - cut_h
                    poly_l = [(tx0, ty0), (tx1, ty0), (tx1, ty1), (xc, ty1), (xc, yc), (tx0, yc)]
                    rect_notch = (tx0, yc, xc, ty1)
                    w1 = ("horizontal", yc, tx0, xc)
                    w2 = ("vertical", xc, yc, ty1)
                elif corner == 'bottom_right':
                    xc, yc = tx1 - cut_w, ty0 + cut_h
                    poly_l = [(tx0, ty0), (xc, ty0), (xc, yc), (tx1, yc), (tx1, ty1), (tx0, ty1)]
                    rect_notch = (xc, ty0, tx1, yc)
                    w1 = ("horizontal", yc, xc, tx1)
                    w2 = ("vertical", xc, ty0, yc)
                else: # bottom_left
                    xc, yc = tx0 + cut_w, ty0 + cut_h
                    poly_l = [(xc, ty0), (tx1, ty0), (tx1, ty1), (tx0, ty1), (tx0, yc), (xc, yc)]
                    rect_notch = (tx0, ty0, xc, yc)
                    w1 = ("horizontal", yc, tx0, xc)
                    w2 = ("vertical", xc, ty0, yc)
                
                l_info = {
                    "target_index": target_i,
                    "poly_l": poly_l,
                    "rect_notch": rect_notch,
                    "notch_edge1": w1,
                    "notch_edge2": w2,
                    "corner": corner,
                }

        # Build rooms
        rooms = []
        for i, cell in enumerate(cells):
            if l_info and i == l_info["target_index"]:
                poly = l_info["poly_l"]
                xs, ys = zip(*poly)
                rooms.append({
                    "id": i + 1,
                    "rect": (min(xs), min(ys), max(xs), max(ys)),
                    "polygon_m": poly,
                    "shape": "l_shape",
                    "dimensions": {
                        "width_m": round(max(xs) - min(xs), 3),
                        "length_m": round(max(ys) - min(ys), 3),
                        "area_m2": round(poly_area(poly), 4),
                    }
                })
            else:
                rw, rh = cell[2] - cell[0], cell[3] - cell[1]
                rooms.append({
                    "id": i + 1,
                    "rect": cell,
                    "polygon_m": box_polygon(cell),
                    "shape": "rectangle",
                    "dimensions": {
                        "width_m": round(rw, 3),
                        "length_m": round(rh, 3),
                        "area_m2": round(area(cell), 4),
                    }
                })

        # Add notch room if present
        if l_info:
            rn = l_info["rect_notch"]
            notch_id = len(rooms) + 1
            rooms.append({
                "id": notch_id,
                "rect": rn,
                "polygon_m": box_polygon(rn),
                "shape": "rectangle",
                "dimensions": {
                    "width_m": round(rn[2] - rn[0], 3),
                    "length_m": round(rn[3] - rn[1], 3),
                    "area_m2": round(area(rn), 4),
                },
                "adjoining_to": l_info["target_index"] + 1,
            })

        # Build walls
        walls = []
        outer = [
            [(0, 0), (width, 0)], [(width, 0), (width, height)],
            [(width, height), (0, height)], [(0, height), (0, 0)],
        ]
        for seg in outer:
            walls.append({"type": "external", "start_m": seg[0], "end_m": seg[1], "thickness_m": 0.25})
        for i, j, edge in edges:
            start, end = line_segment(edge)
            walls.append({"type": "internal", "room_ids": [i+1, j+1], "start_m": start, "end_m": end, "thickness_m": 0.15})
        
        # Add notch internal walls
        if l_info:
            s1, e1 = line_segment(l_info["notch_edge1"])
            s2, e2 = line_segment(l_info["notch_edge2"])
            walls.append({"type": "internal", "room_ids": [l_info["target_index"]+1, notch_id], "start_m": s1, "end_m": e1, "thickness_m": 0.15})
            walls.append({"type": "internal", "room_ids": [l_info["target_index"]+1, notch_id], "start_m": s2, "end_m": e2, "thickness_m": 0.15})

        # Assign room types
        assign_enhanced_types(rooms, entry, l_info, rng)

        # Doors & windows
        doors = []
        for i, j, edge in tree:
            orientation, fixed, lo, hi = edge
            door_w = 0.8 if ("Bathroom" in (rooms[i]["type"], rooms[j]["type"])) else 0.9
            center = rng.uniform(lo + 0.45, hi - 0.45)
            doors.append({
                "id": len(doors) + 1, "room_from_id": i + 1, "room_to_id": j + 1,
                "position_m": on_edge(edge, center), "width_m": door_w,
                "orientation": orientation, "wall_edge_m": line_segment(edge),
            })
        
        # Door for notch room connecting to parent
        if l_info:
            target_id = l_info["target_index"] + 1
            edge_to_use = rng.choice([l_info["notch_edge1"], l_info["notch_edge2"]])
            orientation, fixed, lo, hi = edge_to_use
            center = (lo + hi) / 2.0
            doors.append({
                "id": len(doors) + 1, "room_from_id": target_id, "room_to_id": notch_id,
                "position_m": on_edge(edge_to_use, center), "width_m": 0.8,
                "orientation": orientation, "wall_edge_m": line_segment(edge_to_use),
            })

        # Exterior entrance door
        x0, y0, x1, y1 = rooms[entry]["rect"]
        if x0 == 0:
            e = ("vertical", 0.0, y0, y1)
        elif y0 == 0:
            e = ("horizontal", 0.0, x0, x1)
        elif abs(x1 - width) < 1e-7:
            e = ("vertical", width, y0, y1)
        else:
            e = ("horizontal", height, x0, x1)
        _, _, lo, hi = e
        doors.append({
            "id": len(doors) + 1, "room_from_id": None, "room_to_id": entry + 1,
            "position_m": on_edge(e, (lo + hi) / 2), "width_m": 0.95,
            "orientation": e[0], "wall_edge_m": line_segment(e), "entrance": True,
        })

        # Windows
        windows = []
        for i, room in enumerate(rooms):
            rx0, ry0, rx1, ry1 = room["rect"]
            sides = []
            if abs(ry0) < 1e-7 and rx1 - rx0 >= 2.0:
                sides.append(("horizontal", 0.0, rx0, rx1))
            if abs(ry1 - height) < 1e-7 and rx1 - rx0 >= 2.0:
                sides.append(("horizontal", height, rx0, rx1))
            if abs(rx0) < 1e-7 and ry1 - ry0 >= 2.0:
                sides.append(("vertical", 0.0, ry0, ry1))
            if abs(rx1 - width) < 1e-7 and ry1 - ry0 >= 2.0:
                sides.append(("vertical", width, ry0, ry1))
            rng.shuffle(sides)
            for side in sides[:1]:
                _, _, lo, hi = side
                pos = on_edge(side, (lo + hi) / 2)
                if any(math.dist(pos, d["position_m"]) < 1.4 for d in doors):
                    continue
                windows.append({
                    "id": len(windows) + 1, "room_id": room["id"],
                    "position_m": pos, "width_m": min(1.5, hi - lo - 0.5),
                    "orientation": side[0], "wall_edge_m": line_segment(side),
                })

        return width, height, rooms, walls, doors, windows
    raise RuntimeError("Could not make connected layout.")


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
            if scale_mode == "reference_object":
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
            if scale_mode == "reference_object":
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
        if scale_mode == "reference_object":
            draw.text(xy((cx, ry0 + 1.1)), "[Counter: 0.6m]", fill=ink, anchor="mm")

    # 4. Dining Room
    elif rtype == "Dining Room":
        tw, th = min(1.8, rw - 1.0), 0.9
        if rw >= 2.4 and rh >= 2.4:
            draw.rectangle([xy((cx - tw/2.0, cy - th/2.0)), xy((cx + tw/2.0, cy + th/2.0))], outline=furniture_ink, width=1)
            for ch_x in [cx - tw/3.0, cx + tw/3.0]:
                draw.rectangle([xy((ch_x - 0.2, cy - th/2.0 - 0.3)), xy((ch_x + 0.2, cy - th/2.0 - 0.05))], outline=furniture_ink, width=1)
                draw.rectangle([xy((ch_x - 0.2, cy + th/2.0 + 0.05)), xy((ch_x + 0.2, cy + th/2.0 + 0.3))], outline=furniture_ink, width=1)
            if scale_mode == "reference_object":
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
        if scale_mode == "reference_object":
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
            # Door swing arc line
            draw.line([xy(p), xy(b)], fill=furniture_ink, width=1)

    # Labels and dimensions
    if difficulty != "hard":
        for room in rooms:
            rx0, ry0, rx1, ry1 = room["rect"]
            cx, cy = xy(((rx0+rx1)/2, (ry0+ry1)/2))
            if difficulty == "easy" or rng.random() < 0.65:
                label = room["type"][:18]
                draw.text((cx, cy), label, fill=ink, anchor="mm")
            if scale_mode == "dimensioned" and (difficulty == "easy" or rng.random() < 0.70):
                d = room["dimensions"]
                draw.text((cx, cy+14), f'{d["width_m"]:.2f} x {d["length_m"]:.2f} m', fill=ink, anchor="mm")

    if scale_mode == "scale_bar":
        x, y = margin, size - margin//2
        length = 5 * scale
        if x + length < size - margin:
            draw.line([(x, y), (x+length, y)], fill=ink, width=3)
            draw.text((x, y-18), "0", fill=ink)
            draw.text((x+length, y-18), "5 m", fill=ink, anchor="ra")

    if style == "scan":
        image = image.filter(ImageFilter.GaussianBlur(radius=0.35))
    
    return image, mask


def normalized_annotation(image_id, path, size, width, height,
                          rooms, walls, doors, windows, difficulty,
                          style, scale_mode, split, layout_id):
    margin = max(38, size // 14)
    scale = (size - 2*margin)/max(width, height)
    ox, oy = (size-width*scale)/2, (size-height*scale)/2

    def norm(p):
        return [(ox+p[0]*scale)/size, (oy+p[1]*scale)/size]

    annotated_rooms = []
    for room in rooms:
        polygon = [norm(p) for p in room["polygon_m"]]
        xs, ys = zip(*polygon)
        annotated_rooms.append({
            "id": room["id"], "type": room["type"],
            "shape": room.get("shape", "rectangle"),
            "dimensions": room["dimensions"], "polygon": polygon,
            "bbox": {"x": min(xs), "y": min(ys),
                     "width": max(xs)-min(xs),
                     "height": max(ys)-min(ys)},
        })

    def opening_record(o):
        return {
            **{k: v for k, v in o.items()
               if k not in ("position_m", "wall_edge_m")},
            "position": norm(o["position_m"]),
            "wall_edge": [norm(p) for p in o["wall_edge_m"]],
        }

    return {
        "image_id": image_id, "layout_id": layout_id,
        "image_path": path, "image": {"width": size, "height": size},
        "building": {"width_m": width, "length_m": height,
                     "area_m2": round(width*height, 4)},
        "rooms": annotated_rooms,
        "doors": [opening_record(o) for o in doors],
        "windows": [opening_record(o) for o in windows],
        "walls": [{
            **{k: v for k, v in wall.items()
               if k not in ("start_m", "end_m")},
            "start": norm(wall["start_m"]),
            "end": norm(wall["end_m"]),
        } for wall in walls],
        "connectivity": [[d["room_from_id"], d["room_to_id"]]
                         for d in doors if d["room_from_id"] is not None],
        "difficulty": difficulty, "style": style,
        "scale_mode": scale_mode, "unit": "meter",
        "split": split,
    }


def validate(width, height, rooms, walls, doors, windows, ann):
    assert abs(sum(r["dimensions"]["area_m2"] for r in rooms) - width*height) < 1e-4
    assert all(r["dimensions"]["area_m2"] > 0 for r in rooms)
    assert len(doors) >= len(rooms)
    for d in doors:
        assert d["width_m"] > 0
        if d["room_from_id"] is not None:
            assert d["room_from_id"] != d["room_to_id"]
    for window in windows:
        x, y = window["position_m"]
        assert min(abs(x), abs(y), abs(x-width), abs(y-height)) < 1e-6
    for room in ann["rooms"]:
        p = room["polygon"]
        assert all(0 <= x <= 1 and 0 <= y <= 1 for x, y in p)
        xs, ys = zip(*p)
        b = room["bbox"]
        assert abs(b["x"]-min(xs)) < 1e-9
        assert abs(b["y"]-min(ys)) < 1e-9
        assert abs(b["width"]-(max(xs)-min(xs))) < 1e-9
        assert abs(b["height"]-(max(ys)-min(ys))) < 1e-9


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--layouts", type=int, default=10000)
    parser.add_argument("--variants", type=int, default=3)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--out", type=Path, default=Path("HomeVerse-Dataset"))
    args = parser.parse_args()
    assert args.layouts > 0 and args.variants > 0
    rng = random.Random(args.seed)
    root = args.out
    (root/"annotations").mkdir(parents=True, exist_ok=True)
    (root/"metadata").mkdir(parents=True, exist_ok=True)
    split_counts = Counter()
    scale_counts = Counter()

    files = {}
    first = {}
    for split in ("train", "validation", "test"):
        (root/"images"/split).mkdir(parents=True, exist_ok=True)
        (root/"segmentation"/split).mkdir(parents=True, exist_ok=True)
        f = (root/"annotations"/f"{split}.json").open("w", encoding="utf-8")
        f.write("[\n")
        files[split], first[split] = f, True

    ids = list(range(1, args.layouts+1))
    rng.shuffle(ids)
    assignments = {}
    for pos, layout_id in enumerate(ids):
        fraction = pos/args.layouts
        assignments[layout_id] = (
            "train" if fraction < 0.70 else
            "validation" if fraction < 0.85 else "test"
        )

    try:
        for layout_id in range(1, args.layouts+1):
            split = assignments[layout_id]
            width, height, rooms, walls, doors, windows = generate_geometry(rng)
            for variant in range(args.variants):
                number = (layout_id-1)*args.variants + variant + 1
                image_id = f"homeverse_{number:06d}"
                size = rng.choice(RESOLUTIONS)
                difficulty = rng.choices(
                    DIFFICULTIES, weights=[30, 40, 30]
                )[0]
                style = STYLES[variant % len(STYLES)]
                scale_mode = choose_scale_mode(rng)
                image, mask = render(
                    width, height, rooms, walls, doors, windows,
                    size, style, scale_mode, difficulty, rng
                )
                rel = f"images/{split}/{image_id}.png"
                mask_rel = f"segmentation/{split}/{image_id}.png"
                ann = normalized_annotation(
                    image_id, rel, size, width, height, rooms, walls,
                    doors, windows, difficulty, style, scale_mode,
                    split, f"layout_{layout_id:06d}"
                )
                ann["mask_path"] = mask_rel
                validate(width, height, rooms, walls, doors, windows, ann)
                image.save(root/rel)
                mask.convert("I;16").save(root/mask_rel)
                f = files[split]
                if not first[split]:
                    f.write(",\n")
                json.dump(ann, f, separators=(",", ":"))
                first[split] = False
                split_counts[split] += 1
                scale_counts[scale_mode] += 1
            if layout_id % 100 == 0 or layout_id == args.layouts:
                print(f"{layout_id}/{args.layouts} layouts generated", flush=True)
    finally:
        for f in files.values():
            f.write("\n]\n")
            f.close()

    (root/"metadata"/"rooms.json").write_text(
        json.dumps({"classes": ROOM_TYPES}, indent=2), encoding="utf-8"
    )
    (root/"metadata"/"dataset_statistics.json").write_text(
        json.dumps({
            "layouts": args.layouts, "images": sum(split_counts.values()),
            "splits": split_counts, "scale_modes": scale_counts,
            "seed": args.seed,
        }, indent=2), encoding="utf-8"
    )
    (root/"README.md").write_text(
        "# HomeVerse procedural dataset (Enhanced)\n\n"
        "Geometry is metric; polygon/bbox coordinates are normalized to the "
        "rendered image. One mask pixel value equals its room ID; zero is "
        "background. All variants of a layout share one split. "
        "Room polygons describe nominal floor regions bounded by wall "
        "centerlines; rendered wall strokes may cover boundary pixels.\n\n"
        "Features: non-convex L-shaped rooms, circulation corridors and foyers, "
        "architectural furniture symbols (beds, kitchen counters, cooktops, "
        "sinks, WC toilets, dining sets, sofas, desks), and explicit metric reference cues.\n",
        encoding="utf-8"
    )


if __name__ == "__main__":
    main()
