import json
import math
import os
import sys
import time
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from transformers import ViTModel, ViTConfig

# Ensure real-time line buffering in logs
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

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
from segmentation_head import (
    SegmentationHead,
    compute_mask_loss,
    extract_room_geometry_from_mask,
)
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
    box_iou,
    generalized_box_iou,
)


class InMemoryDataset(Dataset):
    def __init__(self, items):
        self.items = items
    def __len__(self):
        return len(self.items)
    def __getitem__(self, idx):
        return self.items[idx]


# =====================================================================
# Model Architecture with Log-Scale Regression
# =====================================================================

class OverfitMultiTaskViT(nn.Module):
    def __init__(self, pretrained_model_name="google/vit-base-patch16-224",
                 img_size=224, num_queries=25, num_classes=NUM_ROOM_CLASSES, decoder_layers=2):
        super().__init__()
        self.img_size = img_size
        self.num_queries = num_queries
        self.num_classes = num_classes
        self.patch_size = 16
        self.grid_size = (img_size // self.patch_size, img_size // self.patch_size)

        # ViT Encoder
        try:
            self.encoder = ViTModel.from_pretrained(pretrained_model_name)
        except Exception:
            config = ViTConfig(image_size=img_size, patch_size=16, hidden_size=768)
            self.encoder = ViTModel(config)

        hidden_dim = self.encoder.config.hidden_size  # 768

        # 1. Log-Scale Head (Outputs log(pixels_per_meter) from [CLS] token)
        self.scale_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

        # 2. Query Embeddings & Transformer Decoder
        self.query_embed = nn.Embedding(num_queries, hidden_dim)
        decoder_layer = nn.TransformerDecoderLayer(
            d_model=hidden_dim,
            nhead=8,
            dim_feedforward=2048,
            dropout=0.1,
            activation="relu",
            batch_first=True,
        )
        self.decoder = nn.TransformerDecoder(decoder_layer, num_layers=decoder_layers)

        # 3. Class Head (+1 for NO_ROOM_ID = 22)
        self.class_head = nn.Linear(hidden_dim, num_classes + 1)

        # 4. BBox Head
        self.bbox_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, 4),
            nn.Sigmoid(),
        )

        # 5. Segmentation Head
        self.seg_head = SegmentationHead(
            in_dim=hidden_dim,
            num_queries=num_queries,
            num_classes=num_classes,
            mask_dim=64,
        )

    def forward(self, images):
        bs = images.size(0)
        h, w = images.shape[2], images.shape[3]
        gh, gw = h // self.patch_size, w // self.patch_size

        outputs = self.encoder(pixel_values=images)
        cls_token = outputs.last_hidden_state[:, 0, :]
        patch_tokens = outputs.last_hidden_state[:, 1:, :]

        # Predict log-scale
        pred_log_scale = self.scale_head(cls_token).squeeze(-1)
        pred_scale = torch.exp(pred_log_scale)

        queries = self.query_embed.weight.unsqueeze(0).expand(bs, -1, -1)
        hs = self.decoder(tgt=queries, memory=outputs.last_hidden_state)

        pred_logits = self.class_head(hs)
        pred_boxes = self.bbox_head(hs)
        seg_out = self.seg_head(patch_tokens, hs, grid_size=(gh, gw))

        return {
            "pred_logits": pred_logits,
            "pred_boxes": pred_boxes,
            "pred_masks": seg_out["pred_masks"],
            "pred_semantic": seg_out["pred_semantic"],
            "pred_log_scale": pred_log_scale,
            "pred_scale": pred_scale,
        }


# =====================================================================
# Criterion with Log-Scale Loss and Tuned Weights
# =====================================================================

class OverfitCriterion(nn.Module):
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES,
                 weight_class=1.0, weight_bbox=5.0, weight_giou=2.0,
                 weight_mask=2.5, weight_scale=0.1, eos_coef=0.1):
        super().__init__()
        self.matcher = matcher
        self.num_classes = num_classes
        self.weight_class = weight_class
        self.weight_bbox = weight_bbox
        self.weight_giou = weight_giou
        self.weight_mask = weight_mask
        self.weight_scale = weight_scale

        empty_weight = torch.ones(num_classes + 1)
        empty_weight[num_classes] = eos_coef
        self.register_buffer("empty_weight", empty_weight)

    def forward(self, outputs, targets):
        pred_logits = outputs["pred_logits"]
        pred_boxes = outputs["pred_boxes"]
        pred_masks = outputs["pred_masks"]
        pred_log_scale = outputs["pred_log_scale"]

        indices = self.matcher(pred_logits, pred_boxes, targets)

        # 1. Classification Loss
        bs, num_queries = pred_logits.shape[:2]
        target_classes = torch.full(
            (bs, num_queries), self.num_classes,
            dtype=torch.int64, device=pred_logits.device
        )
        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                target_classes[b, src_idx] = targets[b]["labels"][tgt_idx].to(pred_logits.device)

        loss_ce = F.cross_entropy(
            pred_logits.flatten(0, 1),
            target_classes.flatten(),
            weight=self.empty_weight
        )

        # 2. BBox Losses
        total_boxes = sum(len(t["labels"]) for t in targets)
        num_boxes = max(total_boxes, 1)

        src_boxes_list = []
        target_boxes_list = []
        src_masks_list = []
        target_masks_list = []

        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                src_boxes_list.append(pred_boxes[b, src_idx])
                target_boxes_list.append(targets[b]["boxes"][tgt_idx].to(pred_boxes.device))

                if "masks" in targets[b] and targets[b]["masks"].numel() > 0:
                    matched_gt_masks = targets[b]["masks"][tgt_idx].to(pred_masks.device)
                    matched_pred_masks = pred_masks[b, src_idx]
                    src_masks_list.append(matched_pred_masks)
                    target_masks_list.append(matched_gt_masks)

        if src_boxes_list:
            src_boxes = torch.cat(src_boxes_list, dim=0)
            target_boxes = torch.cat(target_boxes_list, dim=0)

            loss_bbox = F.l1_loss(src_boxes, target_boxes, reduction="sum") / num_boxes
            loss_giou = (1.0 - torch.diag(generalized_box_iou(
                box_cxcywh_to_xyxy(src_boxes),
                box_cxcywh_to_xyxy(target_boxes)
            ))).sum() / num_boxes
        else:
            loss_bbox = torch.tensor(0.0, device=pred_logits.device)
            loss_giou = torch.tensor(0.0, device=pred_logits.device)

        # 3. Mask Loss: BCE + Dice
        if src_masks_list and target_masks_list:
            all_src_masks = torch.cat(src_masks_list, dim=0)
            all_target_masks = torch.cat(target_masks_list, dim=0)
            if all_src_masks.shape[-2:] != all_target_masks.shape[-2:]:
                all_target_masks = F.interpolate(
                    all_target_masks.unsqueeze(1),
                    size=all_src_masks.shape[-2:],
                    mode="nearest"
                ).squeeze(1)
            loss_mask, _, _ = compute_mask_loss(all_src_masks, all_target_masks)
        else:
            loss_mask = torch.tensor(0.0, device=pred_logits.device)

        # 4. Normalized Log-Scale Loss
        gt_scales = torch.stack([t["scale_px_per_m"] for t in targets]).to(pred_logits.device)
        has_scale = torch.stack([t["has_scale"] for t in targets]).to(pred_logits.device)
        gt_log_scale = torch.log(gt_scales.clamp(min=1.0))

        raw_scale_loss = F.smooth_l1_loss(pred_log_scale, gt_log_scale, reduction="none")
        scale_denom = max(1.0, has_scale.sum().item())
        loss_scale = (raw_scale_loss * has_scale).sum() / scale_denom

        total_loss = (self.weight_class * loss_ce +
                      self.weight_bbox * loss_bbox +
                      self.weight_giou * loss_giou +
                      self.weight_mask * loss_mask +
                      self.weight_scale * loss_scale)

        return {
            "loss": total_loss,
            "loss_ce": loss_ce,
            "loss_bbox": loss_bbox,
            "loss_giou": loss_giou,
            "loss_mask": loss_mask,
            "loss_scale": loss_scale,
        }


# =====================================================================
# Rigorous Evaluation with Corrected Background Filtering
# =====================================================================

def compute_eval_metrics_v2(model, dataloader, device, conf_thresh=0.25, iou_thresh=0.50):
    model.eval()
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)

    total_tp = 0
    total_fp = 0
    total_fn = 0
    sum_iou = 0.0
    num_matched_ious = 0

    hungarian_correct_classes = 0
    hungarian_total_targets = 0
    hungarian_dices = []
    hungarian_ious = []
    scale_errors_abs = []

    for images, targets in dataloader:
        images = images.to(device)
        with torch.no_grad():
            outputs = model(images)
            pred_logits = outputs["pred_logits"]
            pred_boxes = outputs["pred_boxes"]
            pred_masks = outputs["pred_masks"]
            pred_scales = outputs["pred_scale"]
            probs = pred_logits.softmax(-1)

        bs = images.size(0)

        # Scale MAE
        for b in range(bs):
            if targets[b]["has_scale"].item() > 0 and targets[b]["scale_px_per_m"].item() > 0:
                p_s = pred_scales[b].item()
                gt_s = targets[b]["scale_px_per_m"].item()
                scale_errors_abs.append(abs(p_s - gt_s))

        # 1. Hungarian Matching Metrics (Matches every GT room to its assigned query)
        indices = matcher(pred_logits, pred_boxes, targets)
        for b in range(bs):
            src_idx, tgt_idx = indices[b]
            tgt_labels = targets[b]["labels"].to(device)
            tgt_boxes = targets[b]["boxes"].to(device)
            tgt_masks = targets[b]["masks"].to(device) if "masks" in targets[b] else None

            if len(tgt_idx) > 0:
                hungarian_total_targets += len(tgt_idx)
                top_cls = probs[b, src_idx].argmax(dim=-1)
                hungarian_correct_classes += (top_cls == tgt_labels[tgt_idx]).sum().item()

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

        # 2. Corrected Threshold Inference Metrics (Filtering Background First)
        for b in range(bs):
            tgt_labels = targets[b]["labels"].to(device)
            tgt_boxes = targets[b]["boxes"].to(device)
            num_gt = len(tgt_labels)

            # Max over ALL 23 classes
            top_scores, top_classes = probs[b].max(dim=-1)

            # Query is kept ONLY IF winning class is NOT background (22) AND score >= conf_thresh
            keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)

            p_boxes = pred_boxes[b, keep]
            p_labels = top_classes[keep]
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
    scale_mae = float(np.mean(scale_errors_abs)) if scale_errors_abs else 0.0

    return {
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "bbox_iou": round(mean_iou, 4),
        "hungarian_class_acc": round(hung_acc, 4),
        "hungarian_bbox_iou": round(hung_iou, 4),
        "hungarian_mask_dice": round(hung_dice, 4),
        "scale_mae": round(scale_mae, 2),
        "total_tp": total_tp,
        "total_fp": total_fp,
        "total_fn": total_fn,
    }


def visualize_v2(model, dataset, device, out_path, sample_idx=0, conf_thresh=0.25):
    model.eval()
    sample = dataset.items[sample_idx] if hasattr(dataset, "items") else dataset.samples[sample_idx]
    orig_img_path = Path("HomeVerse-Dataset") / sample["image_id"].replace("homeverse_", "images/train/homeverse_")
    if not orig_img_path.with_suffix(".png").exists():
        # Fallback to direct path in sample
        orig_img_path = Path("HomeVerse-Dataset") / sample.get("image_path", "")
    else:
        orig_img_path = orig_img_path.with_suffix(".png")

    orig_img = Image.open(orig_img_path).convert("RGB")
    orig_w, orig_h = orig_img.size

    item = dataset[sample_idx]
    img_tensor = item["image"].unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_tensor)
        pred_logits = outputs["pred_logits"][0]
        pred_boxes = outputs["pred_boxes"][0]
        pred_masks = outputs["pred_masks"][0]
        probs = pred_logits.softmax(-1)

    top_scores, top_classes = probs.max(dim=-1)
    keep = (top_classes != NO_ROOM_ID) & (top_scores >= conf_thresh)

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

    # Ground Truth Left
    draw_canvas.text((15, 15), "GROUND TRUTH", fill=(0, 120, 0))
    for i, room in enumerate(sample.get("rooms", [])):
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

    # Prediction Right
    draw_canvas.text((orig_w + 15, 15), "MODEL PREDICTION (Experiment D Overfit v2)", fill=(180, 0, 0))
    boxes_filt = pred_boxes[keep]
    scores_filt = top_scores[keep]
    labels_filt = top_classes[keep]
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
    print(f"Saved GT vs Prediction v2 overlay to: {out_p}", flush=True)


# =====================================================================
# Main Training Loop for Experiment D
# =====================================================================

def run_experiment_d(epochs=150, batch_size=6, img_size=224):
    num_threads = min(12, os.cpu_count() or 4)
    torch.set_num_threads(num_threads)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device} | Threads: {num_threads} | Image resolution: {img_size}x{img_size}", flush=True)

    # 1. Load and Pre-cache all 30 samples in RAM for 0.0ms loading overhead
    base_ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=img_size, max_samples=30)
    with open("HomeVerse-Mini/annotations/train.json", "r", encoding="utf-8") as f:
        mini_samples = json.load(f)
    base_ds.samples = mini_samples

    print(f"Pre-caching {len(mini_samples)} samples in memory...", flush=True)
    cached_items = []
    for i in range(len(base_ds)):
        item = base_ds[i]
        item["sample_meta"] = mini_samples[i]
        cached_items.append(item)
    dataset = InMemoryDataset(cached_items)
    print("Pre-caching complete. Zero disk I/O during training.", flush=True)

    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, collate_fn=collate_fn)
    eval_loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, collate_fn=collate_fn)

    model = OverfitMultiTaskViT(pretrained_model_name="google/vit-base-patch16-224", img_size=img_size).to(device)

    # 4. Partial ViT Unfreezing:
    # Freeze embeddings and layers 0..8. Unfreeze layers 9..11 (top 3 blocks) + layernorm.
    for p in model.encoder.embeddings.parameters():
        p.requires_grad = False
    for layer in model.encoder.layers[:9]:
        for p in layer.parameters():
            p.requires_grad = False
    for layer in model.encoder.layers[9:]:
        for p in layer.parameters():
            p.requires_grad = True
    for p in model.encoder.layernorm.parameters():
        p.requires_grad = True

    vit_trainable = [p for p in model.encoder.parameters() if p.requires_grad]
    head_trainable = (
        list(model.query_embed.parameters()) +
        list(model.decoder.parameters()) +
        list(model.class_head.parameters()) +
        list(model.bbox_head.parameters()) +
        list(model.seg_head.parameters()) +
        list(model.scale_head.parameters())
    )
    print(f"Trainable params: ViT top-3 blocks: {len(vit_trainable)}, Decoder & Heads: {len(head_trainable)}", flush=True)

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = OverfitCriterion(
        matcher=matcher,
        weight_class=1.0,
        weight_bbox=5.0,
        weight_giou=2.0,
        weight_mask=2.5,
        weight_scale=0.1,  # Downweighted log-scale loss
        eos_coef=0.1
    ).to(device)

    # Differential Learning Rates: 2.5e-5 for ViT top layers, 5e-4 for Decoder & Heads
    optimizer = torch.optim.AdamW([
        {"params": vit_trainable, "lr": 2.5e-5, "weight_decay": 1e-4},
        {"params": head_trainable, "lr": 5e-4, "weight_decay": 1e-5},
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    print("\n" + "=" * 75, flush=True)
    print(f"STARTING EXPERIMENT D: 30-IMAGE OVERFIT TEST v2 ({epochs} EPOCHS)", flush=True)
    print("=" * 75, flush=True)

    history = []
    best_f1 = 0.0

    t_start = time.time()
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        tot_ce = 0.0
        tot_box = 0.0
        tot_mask = 0.0
        tot_scale = 0.0
        batches = 0

        for images, targets in dataloader:
            images = images.to(device)
            optimizer.zero_grad()

            outputs = model(images)
            loss_dict = criterion(outputs, targets)

            loss = loss_dict["loss"]
            loss.backward()
            nn.utils.clip_grad_norm_(vit_trainable + head_trainable, max_norm=1.0)
            optimizer.step()

            total_loss += loss.item()
            tot_ce += loss_dict["loss_ce"].item()
            tot_box += loss_dict["loss_bbox"].item()
            tot_mask += loss_dict["loss_mask"].item()
            tot_scale += loss_dict["loss_scale"].item()
            batches += 1

        scheduler.step()

        avg_loss = total_loss / batches
        avg_ce = tot_ce / batches
        avg_box = tot_box / batches
        avg_mask = tot_mask / batches
        avg_scale = tot_scale / batches

        # Periodic evaluation every 15 epochs, first epoch, and last epoch
        if epoch % 15 == 0 or epoch == 1 or epoch == epochs:
            eval_metrics = compute_eval_metrics_v2(model, eval_loader, device, conf_thresh=0.25)
            print(
                f"Epoch {epoch:03d}/{epochs} | "
                f"Loss: {avg_loss:.3f} (ce: {avg_ce:.2f}, box: {avg_box:.2f}, mask: {avg_mask:.2f}, sc: {avg_scale:.2f}) | "
                f"F1: {eval_metrics['f1']:.4f} | "
                f"IoU: {eval_metrics['bbox_iou']:.4f} | "
                f"HungAcc: {eval_metrics['hungarian_class_acc']:.2f} | "
                f"Dice: {eval_metrics['hungarian_mask_dice']:.4f} | "
                f"TP={eval_metrics['total_tp']}, FP={eval_metrics['total_fp']}, FN={eval_metrics['total_fn']}",
                flush=True
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
                torch.save(model.state_dict(), "checkpoints/multitask/overfit_30_v2_best.pt")

    t_total = time.time() - t_start
    print(f"\nTraining completed in {t_total:.1f}s ({t_total/epochs:.2f}s per epoch).", flush=True)

    # Final Evaluation & Visualization
    final_metrics = compute_eval_metrics_v2(model, eval_loader, device, conf_thresh=0.25)
    print("\n" + "=" * 75, flush=True)
    print("EXPERIMENT D: 30-IMAGE OVERFIT TEST v2 FINAL RESULTS", flush=True)
    print("=" * 75, flush=True)
    print(f"Train Room F1:                   {final_metrics['f1']:.4f}    (Target > 0.90)", flush=True)
    print(f"Train Hungarian Class Accuracy:  {final_metrics['hungarian_class_acc']:.4f}    (Target > 0.90)", flush=True)
    print(f"Train BBox IoU:                  {final_metrics['bbox_iou']:.4f}    (Target > 0.80)", flush=True)
    print(f"Train Mask Dice:                 {final_metrics['hungarian_mask_dice']:.4f}    (Target > 0.80)", flush=True)
    print(f"Train Loss:                      {avg_loss:.4f}", flush=True)
    print(f"Scale MAE:                       {final_metrics['scale_mae']:.2f} px/m", flush=True)
    print("=" * 75, flush=True)

    # Save visual comparison
    vis_path = Path("evaluation_results/overfit_30_gt_vs_pred_v2.png")
    visualize_v2(model, dataset, device, vis_path, sample_idx=0, conf_thresh=0.25)

    # Save JSON results
    out_json = Path("evaluation_results/overfit_30_v2_results.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump({
            "final_metrics": final_metrics,
            "final_losses": {
                "total_loss": round(avg_loss, 4),
                "ce": round(avg_ce, 4),
                "box": round(avg_box, 4),
                "mask": round(avg_mask, 4),
                "scale": round(avg_scale, 4),
            },
            "history": history,
            "training_time_seconds": round(t_total, 1),
        }, f, indent=2)
    print(f"Saved Experiment D results to: {out_json}", flush=True)

    return final_metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=150)
    parser.add_argument("--batch-size", type=int, default=6)
    parser.add_argument("--img-size", type=int, default=224)
    args = parser.parse_args()

    run_experiment_d(epochs=args.epochs, batch_size=args.batch_size, img_size=args.img_size)
