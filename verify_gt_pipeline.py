import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from floorplan_dataset import (
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    LABEL2ID,
    ID2LABEL,
    FloorplanDataset,
    rasterize_room_masks,
)
from segmentation_head import extract_room_geometry_from_mask


def test_gt_pipeline():
    print("=" * 70)
    print("STEP 2, 4, 5, 6: GROUND TRUTH & PIPELINE INTEGRITY VERIFICATION")
    print("=" * 70)

    # 1. Class Mapping Verification
    print(f"\n[1] Verifying Class Mapping:")
    print(f"Total Room Classes: {NUM_ROOM_CLASSES}")
    print(f"NO_ROOM_ID (Background): {NO_ROOM_ID}")
    assert len(ROOM_CLASSES) == NUM_ROOM_CLASSES, "Mismatch in NUM_ROOM_CLASSES"
    assert NO_ROOM_ID == 22, f"Expected NO_ROOM_ID=22, got {NO_ROOM_ID}"
    assert len(LABEL2ID) == NUM_ROOM_CLASSES
    assert len(ID2LABEL) == NUM_ROOM_CLASSES
    for i, name in enumerate(ROOM_CLASSES):
        assert LABEL2ID[name] == i
        assert ID2LABEL[i] == name
    print("Class mapping is consistent and bi-directional.")

    # 2. Inspect Sample 0 from train.json
    ann_file = Path("HomeVerse-Dataset/annotations/train.json")
    with open(ann_file, "r", encoding="utf-8") as f:
        samples = json.load(f)

    # Find a sample that has a Toilet/Bathroom and bedrooms
    sample = None
    for s in samples[:50]:
        r_types = [r["type"].lower() for r in s["rooms"]]
        if any("toilet" in t or "bath" in t for t in r_types):
            sample = s
            break
    if sample is None:
        sample = samples[0]

    img_rel_path = sample["image_path"]
    img_path = Path("HomeVerse-Dataset") / img_rel_path
    print(f"\n[2] Inspected Sample: {sample['image_id']} (Layout: {sample['layout_id']})")
    print(f"Image path: {img_path}")
    assert img_path.exists(), f"Image not found: {img_path}"

    pil_img = Image.open(img_path).convert("RGBA")
    orig_w, orig_h = pil_img.size
    print(f"Image Size: {orig_w} x {orig_h}")
    scale_px_per_m = sample.get("pixels_per_meter", sample.get("raw_pixels_per_meter", 100.0))
    print(f"GT Scale: {scale_px_per_m} px/m")

    # 3. Check each room's bbox vs polygon
    print(f"\n[3] Checking Rooms ({len(sample['rooms'])} rooms):")
    print(f"{'Room ID':<8} | {'Type':<18} | {'Class ID':<8} | {'BBox (xywh)':<24} | {'Poly pts':<8} | {'BBox vs Poly IoU'}")
    print("-" * 80)

    overlay = Image.new("RGBA", pil_img.size, (255, 255, 255, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw_img = ImageDraw.Draw(pil_img)

    palette = [
        (255, 0, 0), (0, 180, 0), (0, 100, 255), (255, 165, 0),
        (180, 0, 255), (0, 220, 220), (255, 20, 147), (139, 69, 19)
    ]

    for idx, room in enumerate(sample["rooms"]):
        rtype = room["type"]
        cid = LABEL2ID.get(rtype, -1)
        poly = room.get("polygon", [])
        bbox = room["bbox"]
        if isinstance(bbox, dict):
            bx, by, bw, bh = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
        else:
            bx, by, bw, bh = bbox[0], bbox[1], bbox[2], bbox[3]

        # Calculate bounding box of polygon
        if poly and len(poly) >= 3:
            xs = [p[0] for p in poly]
            ys = [p[1] for p in poly]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            poly_bw = max_x - min_x
            poly_bh = max_y - min_y

            # Check bbox vs poly bbox alignment
            diff_x = abs(bx - min_x)
            diff_y = abs(by - min_y)
            diff_w = abs(bw - poly_bw)
            diff_h = abs(bh - poly_bh)
            is_aligned = (diff_x < 1e-3 and diff_y < 1e-3 and diff_w < 1e-3 and diff_h < 1e-3)
            align_str = "ALIGNED" if is_aligned else f"Diff: x={diff_x:.3f},y={diff_y:.3f}"
        else:
            align_str = "NO_POLY"

        print(f"{room['id']:<8} | {rtype:<18} | {cid:<8} | [{bx:.3f},{by:.3f},{bw:.3f},{bh:.3f}] | {len(poly):<8} | {align_str}")

        # Draw on overlay
        col = palette[idx % len(palette)]
        col_alpha = (*col, 90)

        # Draw Polygon
        if poly and len(poly) >= 3:
            pts_px = [(int(p[0] * orig_w), int(p[1] * orig_h)) for p in poly]
            draw_overlay.polygon(pts_px, fill=col_alpha, outline=col)
            draw_img.line(pts_px + [pts_px[0]], fill=col, width=3)

        # Draw BBox
        x0_px = int(bx * orig_w)
        y0_px = int(by * orig_h)
        x1_px = int((bx + bw) * orig_w)
        y1_px = int((by + bh) * orig_h)
        draw_img.rectangle([x0_px, y0_px, x1_px, y1_px], outline=(255, 255, 255), width=1)

        # Label
        label = f"#{room['id']} {rtype} ({cid})"
        draw_img.rectangle([x0_px, max(0, y0_px - 18), x0_px + len(label) * 8, y0_px], fill=col)
        draw_img.text((x0_px + 2, max(0, y0_px - 16)), label, fill=(255, 255, 255))

    out_dir = Path("evaluation_results")
    out_dir.mkdir(parents=True, exist_ok=True)
    vis_path = out_dir / "gt_verification_sample.png"
    combined = Image.alpha_composite(pil_img, overlay).convert("RGB")
    combined.save(vis_path)
    print(f"\n[4] Saved visual GT inspection overlay to: {vis_path}")

    # 4. Step 5 & 6: Test Rasterization and Contour Extraction independently
    print(f"\n[5] Testing Rasterization + Geometry Extraction on Sample GT Masks:")
    inst_masks, sem_mask = rasterize_room_masks(sample["rooms"], mask_size=(96, 96))
    print(f"Rasterized {inst_masks.shape[0]} instance masks at 96x96 resolution.")

    for i, room in enumerate(sample["rooms"]):
        rtype = room["type"]
        mask_np = inst_masks[i].numpy()
        geom = extract_room_geometry_from_mask(mask_np, threshold=0.5, orig_size=(orig_w, orig_h))
        gt_w_m = room.get("width_m", room.get("dimensions", {}).get("width_m", 0.0))
        gt_l_m = room.get("length_m", room.get("dimensions", {}).get("length_m", 0.0))

        if geom is not None:
            # Recover metric dimensions using GT scale
            rec_w_m = geom["pixel_width"] / scale_px_per_m
            rec_l_m = geom["pixel_length"] / scale_px_per_m
            w_err = abs(rec_w_m - min(gt_w_m, gt_l_m))
            l_err = abs(rec_l_m - max(gt_w_m, gt_l_m))
            print(f"  Room #{room['id']} ({rtype}): GT = {gt_w_m:.2f} x {gt_l_m:.2f} m | Extracted = {rec_w_m:.2f} x {rec_l_m:.2f} m | Error: w={w_err:.2f}m, l={l_err:.2f}m")
        else:
            print(f"  Room #{room['id']} ({rtype}): Contour extraction returned NONE!")

    print("\nVerification completed successfully!")


if __name__ == "__main__":
    test_gt_pipeline()
