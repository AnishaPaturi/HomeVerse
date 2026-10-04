import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw

import torch
from multitask_vit import MultiTaskViT, visualize_prediction


# Ground truth printed dimensions from "6th floor layout.jpeg"
# (Indian Standard Architectural Floor Plan notation: W'D" x L'D")
GROUND_TRUTH_PRINTED_ROOMS = [
    {
        "name": "DRAWING ROOM",
        "printed_ft": "10'11\" x 12'11\"",
        "printed_width_m": 3.33,
        "printed_length_m": 3.94,
        "printed_area_m2": 13.12,
    },
    {
        "name": "DINING ROOM",
        "printed_ft": "10'0\" x 11'6\"",
        "printed_width_m": 3.05,
        "printed_length_m": 3.51,
        "printed_area_m2": 10.71,
    },
    {
        "name": "KITCHEN",
        "printed_ft": "7'3\" x 10'0\"",
        "printed_width_m": 2.21,
        "printed_length_m": 3.05,
        "printed_area_m2": 6.74,
    },
    {
        "name": "BEDROOM 1 (MASTER)",
        "printed_ft": "11'0\" x 14'0\"",
        "printed_width_m": 3.35,
        "printed_length_m": 4.27,
        "printed_area_m2": 14.30,
    },
    {
        "name": "BEDROOM 2",
        "printed_ft": "10'0\" x 12'0\"",
        "printed_width_m": 3.05,
        "printed_length_m": 3.66,
        "printed_area_m2": 11.16,
    },
    {
        "name": "TOILET 1",
        "printed_ft": "4'6\" x 7'0\"",
        "printed_width_m": 1.37,
        "printed_length_m": 2.13,
        "printed_area_m2": 2.92,
    },
    {
        "name": "TOILET 2",
        "printed_ft": "4'6\" x 7'0\"",
        "printed_width_m": 1.37,
        "printed_length_m": 2.13,
        "printed_area_m2": 2.92,
    },
    {
        "name": "BALCONY",
        "printed_ft": "5'0\" x 10'0\"",
        "printed_width_m": 1.52,
        "printed_length_m": 3.05,
        "printed_area_m2": 4.64,
    }
]


def test_real_floorplan(image_path="6th floor layout.jpeg",
                        checkpoint=None,
                        img_size=384,
                        use_segmentation=True,
                        calibrate_ocr=True,
                        conf_thresh=0.20,
                        out_dir="evaluation_results"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Testing real floor plan on device: {device} | Resolution: {img_size}x{img_size}")
    img_p = Path(image_path)
    if not img_p.exists():
        raise FileNotFoundError(f"Real floor plan not found at: {img_p}")

    model_name = "google/vit-base-patch16-384" if img_size == 384 else "google/vit-base-patch16-224"
    model = MultiTaskViT(pretrained_model_name=model_name, img_size=img_size).to(device)

    # Resolve default checkpoint
    if checkpoint is None:
        ckpt_candidate = Path("checkpoints/multitask/multitask_vit_384_best.pt" if img_size == 384 else "checkpoints/multitask/multitask_vit_best.pt")
        if ckpt_candidate.exists():
            checkpoint = str(ckpt_candidate)
        else:
            checkpoint = "checkpoints/multitask/multitask_vit_best.pt"

    ckpt_p = Path(checkpoint)
    if ckpt_p.exists():
        model.load_state_dict(torch.load(ckpt_p, map_location=device), strict=False)
        print(f"Loaded multi-task checkpoint from {ckpt_p}")
    else:
        print(f"Checkpoint {ckpt_p} not found, using initialized weights.")

    results = model.predict_unseen_plan(
        str(img_p),
        conf_threshold=conf_thresh,
        use_segmentation=use_segmentation,
        calibrate_ocr=calibrate_ocr,
        device=device
    )

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # Save visual overlay
    vis_path = out_path / "6th_floor_predictions.png"
    visualize_prediction(str(img_p), results, vis_path)
    print(f"Saved visual prediction overlay to: {vis_path}")

    # Save JSON results
    json_path = out_path / "6th_floor_evaluation.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n" + "="*75)
    print(f"EVALUATION ON REAL UNSEEN PLAN: {image_path}")
    print("="*75)
    print(f"Image Resolution:           {results['image_size'][0]} x {results['image_size'][1]}")
    print(f"Estimated Metric Scale:     {results['estimated_scale_px_per_m']} px/meter (Source: {results.get('scale_source', 'N/A')})")
    print(f"Total Detected Rooms:       {results['room_count']}")
    print("-" * 75)
    print(f"{'Detected Room':<22} | {'Conf':<6} | {'Width (m)':<10} | {'Length (m)':<10} | {'Area (m²)':<10} | {'Geom Source'}")
    print("-" * 75)
    for r in results["rooms"]:
        print(f"{r['type']:<22} | {r['confidence']:<6.2f} | {r['width_m']:<10.2f} | {r['length_m']:<10.2f} | {r['area_m2']:<10.2f} | {r.get('geometry_source', 'bbox')}")
    print("="*75)

    # Compare with ground truth printed dimensions
    print("\nCOMPARISON WITH PRINTED DIMENSIONS ON 6th floor layout.jpeg:")
    print("-" * 80)
    print(f"{'Room Name':<18} | {'Printed (m)':<14} | {'Model Pred (m)':<16} | {'Error'}")
    print("-" * 80)
    used_pred_indices = set()
    for gt in GROUND_TRUTH_PRINTED_ROOMS:
        match = None
        match_idx = None
        for i, pred in enumerate(results["rooms"]):
            if i in used_pred_indices:
                continue
            pt = pred["type"].lower()
            gt_n = gt["name"].lower()
            if any(k in pt for k in ["living", "drawing"]) and "drawing" in gt_n:
                match, match_idx = pred, i
                break
            elif "dining" in pt and "dining" in gt_n:
                match, match_idx = pred, i
                break
            elif "kitchen" in pt and "kitchen" in gt_n:
                match, match_idx = pred, i
                break
            elif "master" in gt_n and ("master" in pt or "bedroom" in pt):
                match, match_idx = pred, i
                break
            elif "bedroom" in gt_n and "bedroom" in pt:
                match, match_idx = pred, i
                break
            elif "toilet" in gt_n and ("bathroom" in pt or "toilet" in pt):
                match, match_idx = pred, i
                break
            elif "balcony" in pt and "balcony" in gt_n:
                match, match_idx = pred, i
                break

        gt_m_str = f"{gt['printed_width_m']:.2f} x {gt['printed_length_m']:.2f}"
        if match:
            used_pred_indices.add(match_idx)
            pred_w, pred_l = match['width_m'], match['length_m']
            gt_w, gt_l = gt['printed_width_m'], gt['printed_length_m']
            err_direct = (abs(pred_w - gt_w)/gt_w + abs(pred_l - gt_l)/gt_l) / 2 * 100
            err_transposed = (abs(pred_l - gt_w)/gt_w + abs(pred_w - gt_l)/gt_l) / 2 * 100
            mean_err = min(err_direct, err_transposed)
            pred_m_str = f"{pred_w:.2f} x {pred_l:.2f}"
            print(f"{gt['name']:<18} | {gt_m_str:<14} | {pred_m_str:<16} | {mean_err:.1f}% error ({match.get('geometry_source', 'bbox')})")
        else:
            print(f"{gt['name']:<18} | {gt_m_str:<14} | {'Not Detected':<16} | N/A")
    print("-" * 80)

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, default="6th floor layout.jpeg")
    parser.add_argument("--checkpoint", type=str, default=None)
    parser.add_argument("--img-size", type=int, default=384, choices=[224, 384])
    parser.add_argument("--conf", type=float, default=0.20)
    parser.add_argument("--no-seg", action="store_true", help="Disable segmentation head")
    parser.add_argument("--no-ocr", action="store_true", help="Disable OCR scale calibration")
    args = parser.parse_args()

    test_real_floorplan(
        image_path=args.image,
        checkpoint=args.checkpoint,
        img_size=args.img_size,
        use_segmentation=not args.no_seg,
        calibrate_ocr=not args.no_ocr,
        conf_thresh=args.conf
    )
