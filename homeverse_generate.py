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


def box_polygon(r):
    x0, y0, x1, y1 = r
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def share_edge(a, b):
    """Return (orientation, fixed_coordinate, overlap_start, overlap_end)."""
    eps = 1e-7
    if abs(a[2] - b[0]) < eps or abs(b[2] - a[0]) < eps:
        x = a[2] if abs(a[2] - b[0]) < eps else b[2]
        lo, hi = max(a[1], b[1]), min(a[3], b[3])
        if hi - lo >= 1.5:
            return ("vertical", x, lo, hi)
    if abs(a[3] - b[1]) < eps or abs(b[3] - a[1]) < eps:
        y = a[3] if abs(a[3] - b[1]) < eps else b[3]
        lo, hi = max(a[0], b[0]), min(a[2], b[2])
        if hi - lo >= 1.5:
            return ("horizontal", y, lo, hi)
    return None


def target_room_count(rng):
    # Exact bucket proportions in expectation, not a per-class balance claim.
    bucket = rng.choices(range(5), weights=[10, 25, 35, 20, 10])[0]
    ranges = [(1, 2), (3, 4), (5, 7), (8, 10), (11, 12)]
    return rng.randint(*ranges[bucket])


def make_layout(rng):
    """Partition one rectangular footprint; reject unsplittable layouts."""
    for _ in range(200):
        n = target_room_count(rng)
        # Larger footprints for larger programs; metric coordinates throughout.
        width = round(rng.uniform(7 + 0.55*n, 10 + 0.85*n), 2)
        height = round(rng.uniform(6 + 0.35*n, 8 + 0.65*n), 2)
        rooms = [(0.0, 0.0, width, height)]
        while len(rooms) < n:
            candidates = sorted(
                range(len(rooms)), key=lambda i: area(rooms[i]), reverse=True
            )
            success = False
            for i in candidates:
                x0, y0, x1, y1 = rooms[i]
                w, h = x1-x0, y1-y0
                axes = ["x", "y"] if w >= h else ["y", "x"]
                for axis in axes:
                    length = w if axis == "x" else h
                    if length < 5.2:
                        continue
                    cut = round(rng.uniform(2.5, length-2.5), 2)
                    if axis == "x":
                        parts = [(x0, y0, x0+cut, y1),
                                 (x0+cut, y0, x1, y1)]
                    else:
                        parts = [(x0, y0, x1, y0+cut),
                                 (x0, y0+cut, x1, y1)]
                    rooms[i:i+1] = parts
                    success = True
                    break
                if success:
                    break
            if not success:
                break
        if len(rooms) != n:
            continue

        edges = [(i, j, s) for i in range(n) for j in range(i+1, n)
                 if (s := share_edge(rooms[i], rooms[j]))]
        # Every room must be reachable from an exterior entrance.
        exterior = [
            i for i, (x0, y0, x1, y1) in enumerate(rooms)
            if min(x0, y0, width-x1, height-y1) < 1e-7
        ]
        entry = max(exterior, key=lambda i: area(rooms[i]))
        visited, tree = {entry}, []
        while len(visited) < n:
            options = [(i, j, s) for i, j, s in edges
                       if (i in visited) != (j in visited)]
            if not options:
                break
            i, j, s = rng.choice(options)
            tree.append((i, j, s))
            visited.update((i, j))
        if len(visited) == n:
            return width, height, rooms, edges, tree, entry
    raise RuntimeError("Could not make a connected layout; change the seed.")


def assign_types(rooms, entry, rng):
    ids = sorted(range(len(rooms)), key=lambda i: area(rooms[i]), reverse=True)
    result = [None] * len(rooms)
    result[entry] = "Living Room"
    remaining = [i for i in ids if i != entry]
    required = (["Bathroom"] if len(rooms) >= 2 else []) + (
        ["Kitchen"] if len(rooms) >= 3 else []
    )
    # Prefer adequate floor area for the kitchen.
    if "Kitchen" in required and remaining:
        result[remaining.pop(0)] = "Kitchen"
        required.remove("Kitchen")
    for label in required:
        if remaining:
            result[remaining.pop(-1)] = label
    optional = [
        "Master Bedroom", "Bedroom", "Bedroom", "Dining Room",
        "Study Room", "Guest Bedroom", "Utility Room", "Storage Room",
        "Office", "Laundry Room", "Children's Bedroom",
    ]
    rng.shuffle(optional)
    for i, label in zip(remaining, optional):
        result[i] = label
    return result


def line_segment(edge):
    orientation, fixed, lo, hi = edge
    return ([(fixed, lo), (fixed, hi)] if orientation == "vertical"
            else [(lo, fixed), (hi, fixed)])


def on_edge(edge, t):
    orientation, fixed, _, _ = edge
    return (fixed, t) if orientation == "vertical" else (t, fixed)


def build_openings(width, height, rooms, tree, entry, rng):
    doors = []
    for i, j, edge in tree:
        orientation, fixed, lo, hi = edge
        door_width = 0.8 if (
            "Bathroom" in (rooms[i]["type"], rooms[j]["type"])
        ) else 0.9
        center = rng.uniform(lo+0.55, hi-0.55)
        doors.append({
            "id": len(doors)+1, "room_from_id": i+1, "room_to_id": j+1,
            "position_m": on_edge(edge, center), "width_m": door_width,
            "orientation": orientation, "wall_edge_m": line_segment(edge),
        })

    x0, y0, x1, y1 = rooms[entry]["rect"]
    if x0 == 0:
        e = ("vertical", 0.0, y0, y1)
    elif y0 == 0:
        e = ("horizontal", 0.0, x0, x1)
    elif abs(x1-width) < 1e-7:
        e = ("vertical", width, y0, y1)
    else:
        e = ("horizontal", height, x0, x1)
    _, _, lo, hi = e
    doors.append({
        "id": len(doors)+1, "room_from_id": None,
        "room_to_id": entry+1, "position_m": on_edge(e, (lo+hi)/2),
        "width_m": 0.95, "orientation": e[0],
        "wall_edge_m": line_segment(e), "entrance": True,
    })

    windows = []
    for i, room in enumerate(rooms):
        x0, y0, x1, y1 = room["rect"]
        sides = []
        if abs(y0) < 1e-7 and x1-x0 >= 2:
            sides.append(("horizontal", 0.0, x0, x1))
        if abs(y1-height) < 1e-7 and x1-x0 >= 2:
            sides.append(("horizontal", height, x0, x1))
        if abs(x0) < 1e-7 and y1-y0 >= 2:
            sides.append(("vertical", 0.0, y0, y1))
        if abs(x1-width) < 1e-7 and y1-y0 >= 2:
            sides.append(("vertical", width, y0, y1))
        rng.shuffle(sides)
        for side in sides[:1]:
            _, _, lo, hi = side
            pos = on_edge(side, (lo+hi)/2)
            if any(math.dist(pos, d["position_m"]) < 1.6 for d in doors):
                continue
            windows.append({
                "id": len(windows)+1, "room_id": i+1, "position_m": pos,
                "width_m": min(1.5, hi-lo-0.5),
                "orientation": side[0], "wall_edge_m": line_segment(side),
            })
    return doors, windows


def generate_geometry(rng):
    width, height, rects, edges, tree, entry = make_layout(rng)
    types = assign_types(rects, entry, rng)
    rooms = []
    for i, (r, kind) in enumerate(zip(rects, types)):
        rw, rh = r[2]-r[0], r[3]-r[1]
        rooms.append({
            "id": i+1, "type": kind, "rect": r,
            "polygon_m": box_polygon(r),
            "dimensions": {
                "width_m": round(rw, 3),
                "length_m": round(rh, 3),
                "area_m2": round(area(r), 4),
            },
        })
    walls = []
    outer = [
        [(0, 0), (width, 0)], [(width, 0), (width, height)],
        [(width, height), (0, height)], [(0, height), (0, 0)],
    ]
    for segment in outer:
        walls.append({"type": "external", "start_m": segment[0],
                      "end_m": segment[1], "thickness_m": 0.25})
    for i, j, edge in edges:
        start, end = line_segment(edge)
        walls.append({"type": "internal", "room_ids": [i+1, j+1],
                      "start_m": start, "end_m": end, "thickness_m": 0.15})
    doors, windows = build_openings(width, height, rooms, tree, entry, rng)
    return width, height, rooms, walls, doors, windows


def choose_scale_mode(rng):
    if rng.random() < 0.12:
        return "none"
    return rng.choices(
        ["dimensioned", "scale_bar", "reference_object"],
        weights=[40, 35, 25],
    )[0]


def render(width, height, rooms, walls, doors, windows, size,
           style, scale_mode, difficulty, rng):
    bg, ink = ((19, 54, 103), (240, 247, 255)) if style == "blueprint" \
              else ((255, 255, 255), (25, 30, 35))
    image = Image.new("RGB", (size, size), bg)
    mask = Image.new("I", (size, size), 0)
    draw, mdraw = ImageDraw.Draw(image), ImageDraw.Draw(mask)
    margin = max(38, size // 14)
    scale = (size - 2*margin) / max(width, height)
    ox = (size - width*scale)/2
    oy = (size - height*scale)/2

    def xy(p):
        return (ox+p[0]*scale, oy+p[1]*scale)

    for room in rooms:
        poly = [xy(p) for p in room["polygon_m"]]
        mdraw.polygon(poly, fill=room["id"])

    for wall in walls:
        pts = [xy(wall["start_m"]), xy(wall["end_m"])]
        stroke = max(2, round(wall["thickness_m"]*scale))
        draw.line(pts, fill=ink, width=stroke)

    # Openings are cut into the centerline wall rendering, not invented
    # at positions detached from the wall geometry.
    for opening in doors + windows:
        p = opening["position_m"]
        half = opening["width_m"]/2
        horizontal = opening["orientation"] == "horizontal"
        a = (p[0]-half, p[1]) if horizontal else (p[0], p[1]-half)
        b = (p[0]+half, p[1]) if horizontal else (p[0], p[1]+half)
        draw.line([xy(a), xy(b)], fill=bg,
                  width=max(4, round(0.31*scale)))
        if opening in windows:
            draw.line([xy(a), xy(b)], fill=(45, 165, 210),
                      width=max(2, round(0.045*scale)))
        else:
            draw.line([xy(p), xy(b)], fill=ink, width=2)

    if difficulty != "hard":
        for room in rooms:
            x0, y0, x1, y1 = room["rect"]
            cx, cy = xy(((x0+x1)/2, (y0+y1)/2))
            if difficulty == "easy" or rng.random() < 0.55:
                label = room["type"][:18]
                draw.text((cx, cy), label, fill=ink, anchor="mm")
            if scale_mode == "dimensioned" and (
                difficulty == "easy" or rng.random() < 0.65
            ):
                d = room["dimensions"]
                draw.text((cx, cy+12),
                          f'{d["width_m"]:.2f} x {d["length_m"]:.2f} m',
                          fill=ink, anchor="mm")
    if scale_mode == "scale_bar":
        x, y = margin, size-margin//2
        length = 5*scale
        if x+length < size-margin:
            draw.line([(x, y), (x+length, y)], fill=ink, width=3)
            draw.text((x, y-18), "0", fill=ink)
            draw.text((x+length, y-18), "5 m", fill=ink, anchor="ra")

    # Scan degradation changes appearance, never canonical geometry/masks.
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
    assert abs(sum(area(r["rect"]) for r in rooms)-width*height) < 1e-5
    assert all(r["dimensions"]["area_m2"] > 0 for r in rooms)
    assert len(doors) >= len(rooms)  # spanning tree + entrance
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
        f = (root/"annotations"/f"{split}.json").open("w")
        f.write("[\n")
        files[split], first[split] = f, True

    # Shuffle layout identities before allocating splits; never split variants
    # of one metric layout across train, validation and test.
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
                mask.save(root/mask_rel)
                f = files[split]
                if not first[split]:
                    f.write(",\n")
                json.dump(ann, f, separators=(",", ":"))
                first[split] = False
                split_counts[split] += 1
                scale_counts[scale_mode] += 1
            if layout_id % 100 == 0:
                print(f"{layout_id}/{args.layouts} layouts generated", flush=True)
    finally:
        for f in files.values():
            f.write("\n]\n")
            f.close()

    (root/"metadata"/"rooms.json").write_text(
        json.dumps({"classes": ROOM_TYPES}, indent=2)
    )
    (root/"metadata"/"dataset_statistics.json").write_text(
        json.dumps({
            "layouts": args.layouts, "images": sum(split_counts.values()),
            "splits": split_counts, "scale_modes": scale_counts,
            "seed": args.seed,
        }, indent=2)
    )
    (root/"README.md").write_text(
        "# HomeVerse procedural baseline\n\n"
        "Geometry is metric; polygon/bbox coordinates are normalized to the "
        "rendered image. One mask pixel value equals its room ID; zero is "
        "background. All variants of a layout share one split. "
        "Room polygons describe nominal floor regions bounded by wall "
        "centerlines; rendered wall strokes may cover boundary pixels.\n\n"
        "Limitations: rectangular partition layouts, three rendering styles, "
        "no perspective transforms, and no audited building-code compliance. "
        "A 'none' scale mode is for relative geometry evaluation, not "
        "absolute metric accuracy.\n"
    )


if __name__ == "__main__":
    main()
