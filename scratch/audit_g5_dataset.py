import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import json
from run_experiment_f2 import select_balanced_split

def run_audit():
    print("=" * 80)
    print("AUDIT: HOMEVERSE DATASET G5 METRIC GEOMETRY & SCALE METADATA")
    print("=" * 80)

    json_path = "HomeVerse-Dataset/annotations/test.json"
    data_root = Path("HomeVerse-Dataset")
    
    te_lids, test_samples, _ = select_balanced_split(json_path, 75)
    print(f"Loaded {len(test_samples)} test samples across {len(te_lids)} unique layouts.\n")

    mode_counts = {}
    missing_images = []
    missing_scale = []
    zero_rooms = []
    total_rooms = 0
    rooms_with_dims = 0
    rooms_with_polys = 0
    scale_values = {"dimensioned": [], "scale-bar": [], "reference-object": [], "no-scale": []}

    group_room_counts = {"dimensioned": 0, "scale-bar": 0, "reference-object": 0, "no-scale": 0}

    for i, s in enumerate(test_samples):
        mode = s.get("scale_mode", "unknown")
        mode_counts[mode] = mode_counts.get(mode, 0) + 1
        
        # Check image file existence
        img_p = data_root / s["image_path"]
        if not img_p.exists():
            missing_images.append(str(img_p))

        ppm = s.get("pixels_per_meter")
        raw_ppm = s.get("raw_pixels_per_meter")
        effective_ppm = ppm if ppm is not None else raw_ppm

        if mode != "no-scale":
            if effective_ppm is None or effective_ppm <= 0:
                missing_scale.append((i, s["image_id"], mode))
            else:
                scale_values[mode].append(effective_ppm)
        else:
            scale_values[mode].append(effective_ppm)

        rooms = s.get("rooms", [])
        if len(rooms) == 0:
            zero_rooms.append((i, s["image_id"]))
        total_rooms += len(rooms)
        group_room_counts[mode] = group_room_counts.get(mode, 0) + len(rooms)

        for r in rooms:
            w = r.get("width_m") or r.get("dimensions", {}).get("width_m")
            l = r.get("length_m") or r.get("dimensions", {}).get("length_m")
            a = r.get("area_m2") or r.get("dimensions", {}).get("area_m2")
            if w is not None and l is not None and a is not None and w > 0 and l > 0 and a > 0:
                rooms_with_dims += 1
            poly = r.get("polygon")
            if poly and len(poly) >= 3:
                rooms_with_polys += 1

    print("1. SCALE-MODE STRATIFICATION:")
    for mode, count in sorted(mode_counts.items()):
        rooms = group_room_counts.get(mode, 0)
        print(f"  - {mode:<18}: {count:>3} images ({count/len(test_samples)*100:>5.1f}%) | {rooms:>4} GT rooms")
    print()

    print("2. INTEGRITY CHECKS:")
    print(f"  - Missing image files: {len(missing_images)}")
    print(f"  - Missing scale in Groups 1-3: {len(missing_scale)}")
    print(f"  - Samples with 0 rooms: {len(zero_rooms)}")
    print(f"  - Total ground-truth rooms: {total_rooms}")
    print(f"  - Rooms with exact (w, l, a) metric dimensions: {rooms_with_dims} ({rooms_with_dims/total_rooms*100:.2f}%)")
    print(f"  - Rooms with closed CAD polygon coordinates: {rooms_with_polys} ({rooms_with_polys/total_rooms*100:.2f}%)\n")

    print("3. GROUND-TRUTH SCALE DISTRIBUTION (PPM = Pixels Per Meter):")
    for mode in ["dimensioned", "scale-bar", "reference-object", "no-scale"]:
        vals = [v for v in scale_values[mode] if v is not None and v > 0]
        if vals:
            min_v = min(vals)
            max_v = max(vals)
            med_v = sorted(vals)[len(vals)//2]
            mean_v = sum(vals) / len(vals)
            print(f"  - {mode:<18}: N={len(vals):>3} | Median={med_v:.2f} | Mean={mean_v:.2f} | Range=[{min_v:.2f}, {max_v:.2f}] px/m")
        else:
            print(f"  - {mode:<18}: N={len(scale_values[mode]):>3} | All uncalibrated / 0.0 px/m (Strict No-Scale)")
    print()

    # Detailed inspection of samples per group
    print("4. SAMPLE METADATA ANATOMY PER GROUP:")
    for mode in ["dimensioned", "scale-bar", "reference-object", "no-scale"]:
        sample = next((s for s in test_samples if s.get("scale_mode") == mode), None)
        if sample:
            print(f"\n--- [Group: {mode}] Sample ID: {sample['image_id']} ---")
            print(f"  Image Path: {sample['image_path']}")
            print(f"  Style: {sample.get('style')}, Difficulty: {sample.get('difficulty')}")
            print(f"  PPM: {sample.get('pixels_per_meter')}, Raw PPM: {sample.get('raw_pixels_per_meter')}, Unit: {sample.get('unit')}")
            print(f"  Num Rooms: {len(sample.get('rooms', []))}, Num Doors: {len(sample.get('doors', []))}, Num Walls: {len(sample.get('walls', []))}")
            if sample.get("rooms"):
                r0 = sample["rooms"][0]
                print(f"  Sample Room 0: Type='{r0.get('type')}', Dims={r0.get('dimensions')}, Poly vertices={len(r0.get('polygon', []))}")

    print("\n" + "=" * 80)
    print("AUDIT RESULT: PASSED ALL CHECKS" if (len(missing_images) == 0 and len(missing_scale) == 0 and rooms_with_dims == total_rooms and rooms_with_polys == total_rooms) else "AUDIT RESULT: ANOMALIES DETECTED")
    print("=" * 80)

if __name__ == "__main__":
    run_audit()
