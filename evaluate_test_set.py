import argparse
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

from floorplan_dataset import (
    FloorplanDataset,
    collate_fn,
    DEFAULT_IMAGE_TRANSFORM,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    ID2LABEL,
)
from vit_detector import (
    ViTRoomDetector,
    HungarianMatcher,
    SetCriterion,
    box_cxcywh_to_xyxy,
    box_iou,
    generalized_box_iou,
)


def evaluate_detector_on_test(model, test_loader, device, iou_thresh=0.5, conf_thresh=0.25):
    model.eval()
    total_tp = 0
    total_fp = 0
    total_fn = 0
    total_class_correct = 0
    total_matched = 0
    sum_iou = 0.0
    sum_giou = 0.0
    total_pred_rooms = 0
    total_gt_rooms = 0

    per_image_results = []

    for batch_idx, (images, targets) in enumerate(tqdm(test_loader, desc="Testing on 4,500 unseen images")):
        images = images.to(device)
        with torch.no_grad():
            pred_logits, pred_boxes = model(images)
            probs = pred_logits.softmax(-1)

        bs = images.size(0)
        for b in range(bs):
            tgt_boxes = targets[b]["boxes"].to(device)
            tgt_labels = targets[b]["labels"].to(device)
            num_gt = len(tgt_labels)
            total_gt_rooms += num_gt

            scores, pred_labels = probs[b, :, :NUM_ROOM_CLASSES].max(dim=-1)
            keep = scores >= conf_thresh
            p_boxes = pred_boxes[b, keep]
            p_labels = pred_labels[keep]
            p_scores = scores[keep]
            num_preds = len(p_labels)
            total_pred_rooms += num_preds

            img_res = {
                "image_id": targets[b]["image_id"],
                "layout_id": targets[b]["layout_id"],
                "gt_count": num_gt,
                "pred_count": num_preds,
                "tp": 0, "fp": 0, "fn": 0,
                "mean_iou": 0.0,
                "predictions": [],
            }

            for p_idx in range(num_preds):
                cx, cy, bw, bh = p_boxes[p_idx].tolist()
                x0 = max(0.0, cx - bw / 2.0)
                y0 = max(0.0, cy - bh / 2.0)
                img_res["predictions"].append({
                    "type": ID2LABEL.get(p_labels[p_idx].item(), "Unknown"),
                    "confidence": round(p_scores[p_idx].item(), 4),
                    "bbox": [round(x0, 4), round(y0, 4), round(bw, 4), round(bh, 4)],
                })

            if num_gt == 0:
                total_fp += num_preds
                img_res["fp"] = num_preds
                per_image_results.append(img_res)
                continue
            if num_preds == 0:
                total_fn += num_gt
                img_res["fn"] = num_gt
                per_image_results.append(img_res)
                continue

            p_xyxy = box_cxcywh_to_xyxy(p_boxes)
            t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
            ious, _ = box_iou(p_xyxy, t_xyxy)
            gious = generalized_box_iou(p_xyxy, t_xyxy)

            matched_gt = set()
            img_sum_iou = 0.0

            for p_idx in range(num_preds):
                best_iou, best_gt = ious[p_idx].max(dim=-1)
                best_iou_val = best_iou.item()
                best_gt_idx = best_gt.item()
                best_giou_val = gious[p_idx, best_gt_idx].item()

                sum_iou += max(0.0, best_iou_val)
                sum_giou += best_giou_val
                img_sum_iou += max(0.0, best_iou_val)
                total_matched += 1

                if best_iou_val >= iou_thresh and best_gt_idx not in matched_gt:
                    matched_gt.add(best_gt_idx)
                    if p_labels[p_idx] == tgt_labels[best_gt_idx]:
                        total_tp += 1
                        total_class_correct += 1
                        img_res["tp"] += 1
                    else:
                        total_fp += 1
                        img_res["fp"] += 1
                else:
                    total_fp += 1
                    img_res["fp"] += 1

            fn_count = num_gt - len(matched_gt)
            total_fn += fn_count
            img_res["fn"] = fn_count
            img_res["mean_iou"] = round(img_sum_iou / max(1, num_preds), 4)
            per_image_results.append(img_res)

    precision = total_tp / max(1, total_tp + total_fp)
    recall = total_tp / max(1, total_tp + total_fn)
    f1 = 2 * precision * recall / max(1e-6, precision + recall)
    mean_iou = sum_iou / max(1, total_matched)
    mean_giou = sum_giou / max(1, total_matched)
    class_acc = total_class_correct / max(1, total_tp + (total_matched - total_tp))

    total_samples = max(1, len(test_loader.dataset))
    avg_pred_rooms = total_pred_rooms / total_samples
    avg_gt_rooms = total_gt_rooms / total_samples

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "class_acc": class_acc,
        "mean_iou": mean_iou,
        "mean_giou": mean_giou,
        "avg_detected_rooms": avg_pred_rooms,
        "avg_gt_rooms": avg_gt_rooms,
        "total_test_samples": total_samples,
        "per_image_results": per_image_results,
    }


def draw_detection_comparison(orig_img_path, gt_rooms, pred_rooms, out_path):
    img = Image.open(orig_img_path).convert("RGB")
    w, h = img.size
    draw = ImageDraw.Draw(img)

    # 1. Draw Ground Truth boxes in GREEN dashed or thin lines
    for r in gt_rooms:
        b = r["bbox"]
        if isinstance(b, dict):
            bx, by, bw, bh = b["x"]*w, b["y"]*h, b["width"]*w, b["height"]*h
        else:
            bx, by, bw, bh = b[0]*w, b[1]*h, b[2]*w, b[3]*h
        draw.rectangle([bx, by, bx+bw, by+bh], outline=(34, 139, 34), width=2)
        draw.text((bx + 2, by + 2), f"GT: {r['type']}", fill=(34, 139, 34))

    # 2. Draw Predicted boxes in BLUE/RED
    for r in pred_rooms:
        b = r["bbox"]
        bx, by, bw, bh = b[0]*w, b[1]*h, b[2]*w, b[3]*h
        draw.rectangle([bx, by, bx+bw, by+bh], outline=(220, 20, 60), width=2)
        label = f"{r['type']} ({r['confidence']:.2f})"
        draw.text((bx + 2, by + bh - 14), label, fill=(220, 20, 60))

    out_p = Path(out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_p)


def main():
    parser = argparse.ArgumentParser(description="Evaluate ViT Room Detector on Unseen Test Images")
    parser.add_argument("--data-root", type=str, default="HomeVerse-Dataset")
    parser.add_argument("--checkpoint", type=str, default="checkpoints/detector/vit_detector_best.pt")
    parser.add_argument("--max-test-samples", type=int, default=None)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--conf-thresh", type=float, default=0.25)
    parser.add_argument("--iou-thresh", type=float, default=0.5)
    parser.add_argument("--save-vis-dir", type=str, default="evaluation_results/detector_vis")
    parser.add_argument("--out-report", type=str, default="evaluation_results/test_metrics.json")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Evaluating detector on device: {device}")

    model = ViTRoomDetector(decoder_layers=2).to(device)
    ckpt = Path(args.checkpoint)
    if ckpt.exists():
        model.load_state_dict(torch.load(ckpt, map_location=device))
        print(f"Loaded checkpoint from {ckpt}")
    else:
        print(f"Warning: checkpoint {ckpt} not found, evaluating with initialized weights.")

    test_ds = FloorplanDataset(args.data_root, split="test", max_samples=args.max_test_samples)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)
    print(f"Evaluating on {len(test_ds)} unseen test floor plans...")

    metrics = evaluate_detector_on_test(
        model, test_loader, device,
        iou_thresh=args.iou_thresh,
        conf_thresh=args.conf_thresh
    )

    print("\n" + "="*50)
    print("TEST SET EVALUATION RESULTS (Unseen Floor Plans)")
    print("="*50)
    print(f"Total Evaluated Images:    {metrics['total_test_samples']}")
    print(f"Classification Accuracy:   {metrics['class_acc']*100:.2f}%")
    print(f"Classification F1 Score:   {metrics['f1']:.4f}")
    print(f"Precision:                 {metrics['precision']*100:.2f}%")
    print(f"Recall:                    {metrics['recall']*100:.2f}%")
    print(f"Mean BBox IoU:             {metrics['mean_iou']:.4f}")
    print(f"Mean GIoU:                 {metrics['mean_giou']:.4f}")
    print(f"Avg Detected Rooms/Image:  {metrics['avg_detected_rooms']:.2f}")
    print(f"Avg Ground Truth Rooms:    {metrics['avg_gt_rooms']:.2f}")
    print("="*50)

    # Save visual samples
    vis_dir = Path(args.save_vis_dir)
    vis_dir.mkdir(parents=True, exist_ok=True)
    with open(Path(args.data_root) / "annotations" / "test.json", "r", encoding="utf-8") as f:
        test_annotations = json.load(f)
    ann_by_id = {item["image_id"]: item for item in test_annotations[:200]}

    num_vis = 0
    for res in metrics["per_image_results"]:
        img_id = res["image_id"]
        if img_id in ann_by_id and num_vis < 5:
            ann = ann_by_id[img_id]
            img_path = Path(args.data_root) / ann["image_path"]
            out_vis = vis_dir / f"test_detection_{num_vis + 1}_{img_id}.png"
            draw_detection_comparison(img_path, ann["rooms"], res["predictions"], out_vis)
            print(f"Saved visual sample to: {out_vis}")
            num_vis += 1

    # Save JSON report
    report_path = Path(args.out_report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    clean_metrics = {k: v for k, v in metrics.items() if k != "per_image_results"}
    clean_metrics["sample_predictions"] = metrics["per_image_results"][:10]
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(clean_metrics, f, indent=2)
    print(f"Saved detailed evaluation metrics to: {report_path}")


if __name__ == "__main__":
    main()
