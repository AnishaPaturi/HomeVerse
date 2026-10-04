import json
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from tqdm import tqdm

from floorplan_dataset import (
    FloorplanDataset,
    collate_fn,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    ID2LABEL,
    LABEL2ID,
    get_image_transform,
)
from multitask_vit import MultiTaskViT, MultiTaskCriterion
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
    box_iou,
    generalized_box_iou,
)
from segmentation_head import dice_loss, extract_room_geometry_from_mask


def compute_eval_metrics(model, dataloader, device, conf_thresh=0.20, iou_thresh=0.50):
    """
    Evaluates detector on dataset:
    Returns Room F1, Precision, Recall, Mean BBox IoU, and Mean Mask Dice.
    """
    model.eval()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    total_tp = 0
    total_fp = 0
    total_fn = 0
    sum_iou = 0.0
    num_matched_ious = 0

    # Hungarian assignment tracking
    hungarian_correct_classes = 0
    hungarian_total_targets = 0
    hungarian_dices = []
    hungarian_ious = []

    for images, targets in dataloader:
        images = images.to(device)
        with torch.no_grad():
            outputs = model(images)
            pred_logits = outputs["pred_logits"]
            pred_boxes = outputs["pred_boxes"]
            pred_masks = outputs["pred_masks"]
            probs = pred_logits.softmax(-1)

        bs = images.size(0)

        # 1. Hungarian Matching Metrics (isolates representation capacity)
        indices = matcher(pred_logits, pred_boxes, targets)
        for b in range(bs):
            src_idx, tgt_idx = indices[b]
            tgt_labels = targets[b]["labels"].to(device)
            tgt_boxes = targets[b]["boxes"].to(device)
            tgt_masks = targets[b]["masks"].to(device) if "masks" in targets[b] else None

            if len(tgt_idx) > 0:
                hungarian_total_targets += len(tgt_idx)
                pred_cls = probs[b, src_idx, :NUM_ROOM_CLASSES].argmax(dim=-1)
                hungarian_correct_classes += (pred_cls == tgt_labels[tgt_idx]).sum().item()

                p_xyxy = box_cxcywh_to_xyxy(pred_boxes[b, src_idx])
                t_xyxy = box_cxcywh_to_xyxy(tgt_boxes[tgt_idx])
                ious, _ = box_iou(p_xyxy, t_xyxy)
                diag_ious = torch.diag(ious)
                hungarian_ious.extend(diag_ious.cpu().tolist())

                if tgt_masks is not None and tgt_masks.numel() > 0:
                    p_masks = pred_masks[b, src_idx]
                    t_masks = tgt_masks[tgt_idx]
                    if p_masks.shape[-2:] != t_masks.shape[-2:]:
                        t_masks = F.interpolate(t_masks.unsqueeze(1), size=p_masks.shape[-2:], mode="nearest").squeeze(1)
                    p_probs = p_masks.sigmoid().flatten(1)
                    t_flat = t_masks.flatten(1)
                    dices = (2.0 * (p_probs * t_flat).sum(-1) + 1e-5) / (p_probs.sum(-1) + t_flat.sum(-1) + 1e-5)
                    hungarian_dices.extend(dices.cpu().tolist())

        # 2. Threshold Detection Metrics (User Inference F1)
        for b in range(bs):
            tgt_labels = targets[b]["labels"].to(device)
            tgt_boxes = targets[b]["boxes"].to(device)
            num_gt = len(tgt_labels)

            # Keep queries where top class is not background and score >= conf_thresh
            scores, p_labels = probs[b, :, :NUM_ROOM_CLASSES].max(dim=-1)
            keep = scores >= conf_thresh
            p_boxes = pred_boxes[b, keep]
            p_labels = p_labels[keep]

            num_pred = len(p_labels)
            if num_gt == 0:
                total_fp += num_pred
                continue
            if num_pred == 0:
                total_fn += num_gt
                continue

            p_xyxy = box_cxcywh_to_xyxy(p_boxes)
            t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
            b_ious, _ = box_iou(p_xyxy, t_xyxy)

            matched_gt = set()
            for p_idx in range(num_pred):
                best_iou, best_gt = b_ious[p_idx].max(dim=-1)
                biou = best_iou.item()
                bgt = best_gt.item()

                if biou >= iou_thresh and bgt not in matched_gt:
                    matched_gt.add(bgt)
                    if p_labels[p_idx] == tgt_labels[bgt]:
                        total_tp += 1
                        sum_iou += biou
                        num_matched_ious += 1
                    else:
                        total_fp += 1
                else:
                    total_fp += 1

            total_fn += (num_gt - len(matched_gt))

    prec = total_tp / max(1, total_tp + total_fp)
    rec = total_tp / max(1, total_tp + total_fn)
    f1 = 2 * prec * rec / max(1e-6, prec + rec)
    mean_iou = sum_iou / max(1, num_matched_ious)

    hung_acc = hungarian_correct_classes / max(1, hungarian_total_targets)
    hung_iou = float(np.mean(hungarian_ious)) if hungarian_ious else 0.0
    hung_dice = float(np.mean(hungarian_dices)) if hungarian_dices else 0.0

    return {
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "bbox_iou": round(mean_iou, 4),
        "hungarian_class_acc": round(hung_acc, 4),
        "hungarian_bbox_iou": round(hung_iou, 4),
        "hungarian_mask_dice": round(hung_dice, 4),
        "total_tp": total_tp,
        "total_fp": total_fp,
        "total_fn": total_fn,
    }


def visualize_gt_vs_pred(model, dataset, device, out_path, sample_idx=0, conf_thresh=0.20):
    model.eval()
    sample = dataset.samples[sample_idx]
    img_path = dataset.data_root / sample["image_path"]
    orig_img = Image.open(img_path).convert("RGB")
    orig_w, orig_h = orig_img.size

    item = dataset[sample_idx]
    img_tensor = item["image"].unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_tensor)
        pred_logits = outputs["pred_logits"][0]
        pred_boxes = outputs["pred_boxes"][0]
        pred_masks = outputs["pred_masks"][0]
        probs = pred_logits.softmax(-1)

    scores, pred_labels = probs[:, :NUM_ROOM_CLASSES].max(dim=-1)
    keep = scores >= conf_thresh

    # Canvas: Side by side (Left: Ground Truth, Right: Model Prediction)
    canvas = Image.new("RGB", (orig_w * 2, orig_h), (255, 255, 255))
    canvas.paste(orig_img, (0, 0))
    canvas.paste(orig_img, (orig_w, 0))

    overlay = Image.new("RGBA", (orig_w * 2, orig_h), (255, 255, 255, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw_canvas = ImageDraw.Draw(canvas)

    palette = [
        (0, 180, 0), (30, 144, 255), (255, 140, 0), (186, 85, 211),
        (220, 20, 60), (0, 206, 209), (255, 215, 0), (128, 128, 0)
    ]

    # 1. Draw Ground Truth on Left
    draw_canvas.text((15, 15), "GROUND TRUTH (10-Layout Overfit)", fill=(0, 120, 0))
    for i, room in enumerate(sample["rooms"]):
        col = palette[i % len(palette)]
        col_alpha = (*col, 90)
        poly = room.get("polygon", [])
        if poly and len(poly) >= 3:
            pts = [(int(p[0] * orig_w), int(p[1] * orig_h)) for p in poly]
            draw_overlay.polygon(pts, fill=col_alpha, outline=col)
            draw_canvas.line(pts + [pts[0]], fill=col, width=3)
        bx, by, bw, bh = room["bbox"]
        label = f"{room['type']} ({room.get('width_m', 0):.1f}x{room.get('length_m', 0):.1f}m)"
        x0, y0 = int(bx * orig_w), int(by * orig_h)
        draw_canvas.rectangle([x0, max(0, y0 - 18), x0 + len(label) * 7, y0], fill=col)
        draw_canvas.text((x0 + 2, max(0, y0 - 16)), label, fill=(255, 255, 255))

    # 2. Draw Predictions on Right
    draw_canvas.text((orig_w + 15, 15), "MODEL PREDICTION (Overfit Memorization)", fill=(180, 0, 0))
    boxes_filt = pred_boxes[keep]
    scores_filt = scores[keep]
    labels_filt = pred_labels[keep]
    masks_filt = pred_masks[keep]

    for i in range(len(scores_filt)):
        col = palette[i % len(palette)]
        col_alpha = (*col, 90)
        score = scores_filt[i].item()
        label_name = ID2LABEL.get(labels_filt[i].item(), "Room")

        mask_np = masks_filt[i].sigmoid().cpu().numpy()
        geom = extract_room_geometry_from_mask(mask_np, threshold=0.5, orig_size=(orig_w, orig_h))

        if geom is not None and geom.get("polygon"):
            poly = geom["polygon"]
            pts = [(int(p[0] * orig_w) + orig_w, int(p[1] * orig_h)) for p in poly]
            draw_overlay.polygon(pts, fill=col_alpha, outline=col)
            draw_canvas.line(pts + [pts[0]], fill=col, width=3)
            bx, by, bw, bh = geom["bbox_pixels"]
            x0 = bx + orig_w
            y0 = by
        else:
            cx, cy, bw_n, bh_n = boxes_filt[i].tolist()
            x0 = int((cx - bw_n / 2.0) * orig_w) + orig_w
            y0 = int((cy - bh_n / 2.0) * orig_h)
            w_px = int(bw_n * orig_w)
            h_px = int(bh_n * orig_h)
            draw_canvas.rectangle([x0, y0, x0 + w_px, y0 + h_px], outline=col, width=3)

        label_txt = f"{label_name} ({score:.2f})"
        draw_canvas.rectangle([x0, max(0, y0 - 18), x0 + len(label_txt) * 7, y0], fill=col)
        draw_canvas.text((x0 + 2, max(0, y0 - 16)), label_txt, fill=(255, 255, 255))

    combined = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    out_p = Path(out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    combined.save(out_p)
    print(f"Saved side-by-side GT vs Prediction overlay to: {out_p}")


def run_overfit_test(epochs=45, batch_size=5, lr=5e-4, img_size=224):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device} | Image resolution: {img_size}x{img_size}")

    # Load 30 images dataset
    dataset = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=img_size, max_samples=30)
    mini_ann_path = Path("HomeVerse-Mini/annotations/train.json")
    with open(mini_ann_path, "r", encoding="utf-8") as f:
        mini_samples = json.load(f)
    dataset.samples = mini_samples
    print(f"Loaded {len(dataset)} samples from {mini_ann_path} across 10 layouts.")

    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, collate_fn=collate_fn)
    eval_loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, collate_fn=collate_fn)

    # Initialize model
    model_name = "google/vit-base-patch16-384" if img_size == 384 else "google/vit-base-patch16-224"
    model = MultiTaskViT(pretrained_model_name=model_name, img_size=img_size).to(device)

    # Transfer pretrained head weights if available to speed up convergence
    ckpt_path = Path("checkpoints/multitask/multitask_vit_best.pt")
    if ckpt_path.exists():
        print(f"Transferring starting weights from {ckpt_path}...")
        ckpt = torch.load(ckpt_path, map_location=device)
        model.load_state_dict(ckpt, strict=False)

    # Freeze encoder backbone for fast training on CPU
    for p in model.encoder.parameters():
        p.requires_grad = False
    model.encoder.eval()

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterion(
        matcher=matcher,
        weight_class=1.5,
        weight_bbox=5.0,
        weight_giou=2.0,
        weight_mask=2.5,
        weight_scale=1.0,
        eos_coef=0.1
    ).to(device)

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=lr, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    print("\n" + "=" * 70)
    print(f"STARTING 10-LAYOUT (30 IMAGES) OVERFIT SANITY TEST FOR {epochs} EPOCHS")
    print("=" * 70)

    best_f1 = 0.0
    history = []

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        ce_loss_tot = 0.0
        box_loss_tot = 0.0
        giou_loss_tot = 0.0
        mask_loss_tot = 0.0
        scale_loss_tot = 0.0
        batches = 0

        for images, targets in dataloader:
            images = images.to(device)
            optimizer.zero_grad()

            outputs = model(images)
            loss_dict = criterion(outputs, targets)

            loss = loss_dict["loss"]
            loss.backward()
            nn.utils.clip_grad_norm_(trainable_params, max_norm=1.0)
            optimizer.step()

            total_loss += loss.item()
            ce_loss_tot += loss_dict["loss_ce"].item()
            box_loss_tot += loss_dict["loss_bbox"].item()
            giou_loss_tot += loss_dict["loss_giou"].item()
            mask_loss_tot += loss_dict["loss_mask"].item()
            scale_loss_tot += loss_dict["loss_scale"].item()
            batches += 1

        scheduler.step()

        avg_loss = total_loss / batches
        avg_ce = ce_loss_tot / batches
        avg_box = box_loss_tot / batches
        avg_giou = giou_loss_tot / batches
        avg_mask = mask_loss_tot / batches
        avg_scale = scale_loss_tot / batches

        # Periodic evaluation every 5 epochs or on the last epoch
        if epoch % 5 == 0 or epoch == epochs or epoch == 1:
            eval_metrics = compute_eval_metrics(model, eval_loader, device, conf_thresh=0.20)
            print(
                f"Epoch {epoch:02d}/{epochs} | "
                f"Loss: {avg_loss:.2f} (ce: {avg_ce:.2f}, box: {avg_box:.2f}, mask: {avg_mask:.2f}, scale: {avg_scale:.1f}) | "
                f"F1: {eval_metrics['f1']:.4f} | "
                f"IoU: {eval_metrics['bbox_iou']:.4f} | "
                f"HungAcc: {eval_metrics['hungarian_class_acc']:.2f} | "
                f"Dice: {eval_metrics['hungarian_mask_dice']:.4f}"
            )
            history.append({
                "epoch": epoch,
                "loss": round(avg_loss, 4),
                "ce": round(avg_ce, 4),
                "box": round(avg_box, 4),
                "mask": round(avg_mask, 4),
                "scale": round(avg_scale, 4),
                **eval_metrics
            })
            if eval_metrics["f1"] > best_f1:
                best_f1 = eval_metrics["f1"]

    # Final Evaluation & Visualization
    final_metrics = compute_eval_metrics(model, eval_loader, device, conf_thresh=0.20)
    print("\n" + "=" * 70)
    print("10-LAYOUT OVERFIT TEST FINAL RESULTS (TRAIN SET - 30 IMAGES)")
    print("=" * 70)
    print(f"Train Room F1 (Inference Threshold):     {final_metrics['f1']:.4f}  (Target > 0.90)")
    print(f"Train BBox IoU (Inference Matches):       {final_metrics['bbox_iou']:.4f}  (Target > 0.80)")
    print(f"Hungarian Top-1 Room Class Accuracy:     {final_metrics['hungarian_class_acc']:.4f}")
    print(f"Hungarian BBox IoU:                      {final_metrics['hungarian_bbox_iou']:.4f}")
    print(f"Hungarian Segmentation Mask Dice:        {final_metrics['hungarian_mask_dice']:.4f}  (Target > 0.80)")
    print(f"Final Total Loss:                         {avg_loss:.4f}")
    print("=" * 70)

    # Save visual comparison
    vis_path = Path("evaluation_results/overfit_30_gt_vs_pred.png")
    visualize_gt_vs_pred(model, dataset, device, vis_path, sample_idx=0, conf_thresh=0.20)

    # Save metrics JSON
    out_json = Path("evaluation_results/overfit_30_results.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump({
            "final_metrics": final_metrics,
            "final_losses": {
                "total_loss": round(avg_loss, 4),
                "ce_loss": round(avg_ce, 4),
                "box_loss": round(avg_box, 4),
                "giou_loss": round(avg_giou, 4),
                "mask_loss": round(avg_mask, 4),
                "scale_loss": round(avg_scale, 4),
            },
            "history": history,
        }, f, indent=2)
    print(f"Saved overfit results JSON to: {out_json}")

    return final_metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=45)
    parser.add_argument("--batch-size", type=int, default=5)
    parser.add_argument("--lr", type=float, default=5e-4)
    parser.add_argument("--img-size", type=int, default=224, choices=[224, 384])
    args = parser.parse_args()

    run_overfit_test(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr, img_size=args.img_size)
