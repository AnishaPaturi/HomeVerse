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
                        checkpoint="checkpoints/multitask/multitask_vit_best.pt",
                        conf_thresh=0.20,
                        out_dir="evaluation_results"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Testing real floor plan on device: {device}")
    img_p = Path(image_path)
    if not img_p.exists():
        raise FileNotFoundError(f"Real floor plan not found at: {img_p}")

    model = MultiTaskViT().to(device)
    ckpt_p = Path(checkpoint)
    if ckpt_p.exists():
        model.load_state_dict(torch.load(ckpt_p, map_location=device))
        print(f"Loaded multi-task checkpoint from {ckpt_p}")
    else:
        print(f"Checkpoint {ckpt_p} not found, using initialized model.")

    results = model.predict_unseen_plan(str(img_p), conf_threshold=conf_thresh, device=device)

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

    print("\n" + "="*70)
    print(f"EVALUATION ON REAL UNSEEN PLAN: {image_path}")
    print("="*70)
    print(f"Image Resolution:           {results['image_size'][0]} x {results['image_size'][1]}")
    print(f"Estimated Metric Scale:     {results['estimated_scale_px_per_m']} px/meter")
    print(f"Total Detected Rooms:       {results['room_count']}")
    print("-" * 70)
    print(f"{'Detected Room':<22} | {'Conf':<6} | {'Width (m)':<10} | {'Length (m)':<10} | {'Area (m²)':<10}")
    print("-" * 70)
    for r in results["rooms"]:
        print(f"{r['type']:<22} | {r['confidence']:<6.2f} | {r['width_m']:<10.2f} | {r['length_m']:<10.2f} | {r['area_m2']:<10.2f}")
    print("="*70)

    # Compare with ground truth printed dimensions
    print("\nCOMPARISON WITH PRINTED DIMENSIONS ON 6th floor layout.jpeg:")
    print("-" * 75)
    print(f"{'Room Name':<18} | {'Printed (ft)':<14} | {'Printed (m)':<14} | {'Model Pred (m)':<14}")
    print("-" * 75)
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
            # Direct vs Transposed orientation comparison
            err_direct = (abs(pred_w - gt_w)/gt_w + abs(pred_l - gt_l)/gt_l) / 2 * 100
            err_transposed = (abs(pred_l - gt_w)/gt_w + abs(pred_w - gt_l)/gt_l) / 2 * 100
            mean_err = min(err_direct, err_transposed)
            pred_m_str = f"{pred_w:.2f} x {pred_l:.2f}"
            print(f"{gt['name']:<18} | {gt['printed_ft']:<14} | {gt_m_str:<14} | {pred_m_str:<14} (Err: {mean_err:.1f}%)")
        else:
            print(f"{gt['name']:<18} | {gt['printed_ft']:<14} | {gt_m_str:<14} | {'Not Detected':<14}")
    print("-" * 75)

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, default="6th floor layout.jpeg")
    parser.add_argument("--checkpoint", type=str, default="checkpoints/multitask/multitask_vit_best.pt")
    parser.add_argument("--conf", type=float, default=0.20)
    args = parser.parse_args()
    test_real_floorplan(args.image, args.checkpoint, args.conf)
