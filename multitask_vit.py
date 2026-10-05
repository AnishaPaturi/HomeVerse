import argparse
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from tqdm import tqdm
from scipy.optimize import linear_sum_assignment
from transformers import ViTModel, ViTConfig

from floorplan_dataset import (
    FloorplanDataset,
    collate_fn,
    get_image_transform,
    DEFAULT_IMAGE_TRANSFORM,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    ID2LABEL,
    LABEL2ID,
)
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
    generalized_box_iou,
)
from segmentation_head import (
    SegmentationHead,
    compute_mask_loss,
    extract_room_geometry_from_mask,
)
from scale_calibration import (
    ScaleCalibrator,
)


# =====================================================================
# Multi-Task Vision Transformer with Segmentation & Scale Calibration
# =====================================================================

class MultiTaskViT(nn.Module):
    """
    Unified Multi-Task Vision Transformer for Floor Plans.
    
    Architecture:
                         FLOOR PLAN
                              │
                              ▼
                         ViT Encoder
                              │
               ┌──────────────┼──────────────┬──────────────┐
               ▼              ▼              ▼              ▼
           Room Class      BBox Head   Segmentation     Scale Head
              Head            Head          Head         (Global)
               │              │              │              │
             type          x,y,w,h      Room polygon     pixels/m
               │              │              │              │
               └──────────────┴──────────────┴──────┬───────┘
                                                    ▼
                                           Scale Calibration
                                         (OCR + ViT fallback)
                                                    ▼
                                            Metric Geometry
                                         (Width, Length, Area)
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-224",
                 img_size=224, num_queries=25, num_classes=NUM_ROOM_CLASSES, decoder_layers=2):
        super().__init__()
        self.img_size = img_size
        self.num_queries = num_queries
        self.num_classes = num_classes
        self.decoder_layers = decoder_layers
        self.patch_size = 16
        self.grid_size = (img_size // self.patch_size, img_size // self.patch_size)

        # ViT Encoder
        try:
            self.encoder = ViTModel.from_pretrained(pretrained_model_name)
        except Exception:
            config = ViTConfig(image_size=img_size, patch_size=16, hidden_size=768)
            self.encoder = ViTModel(config)

        hidden_dim = self.encoder.config.hidden_size  # 768

        # 1. Scale Head (Global context from [CLS] token)
        self.scale_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Softplus(),  # scale must be strictly positive (> 0)
        )

        # 2. Room Query Decoder
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

        # 3. Room Class Head
        self.class_head = nn.Linear(hidden_dim, num_classes + 1)  # +1 for background/no-room

        # 4. Room BBox Head
        self.bbox_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, 4),
            nn.Sigmoid(),  # [cx, cy, w, h] normalized in [0, 1]
        )

        # 5. Segmentation Head (Room polygon instance & semantic masks)
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

        # ViT Encoder
        outputs = self.encoder(pixel_values=images)
        cls_token = outputs.last_hidden_state[:, 0, :]    # [B, 768]
        patch_tokens = outputs.last_hidden_state[:, 1:, :] # [B, gh*gw, 768]

        # 1. Global Scale Prediction
        pred_scale = self.scale_head(cls_token).squeeze(-1)  # [B] in pixels/meter

        # 2. Room Query Decoding
        queries = self.query_embed.weight.unsqueeze(0).expand(bs, -1, -1)
        # Use full hidden state (including CLS) as decoder memory for maximum context
        hs = self.decoder(tgt=queries, memory=outputs.last_hidden_state)  # [B, num_queries, 768]

        # 3. Heads
        pred_logits = self.class_head(hs)  # [B, num_queries, 23]
        pred_boxes = self.bbox_head(hs)    # [B, num_queries, 4]

        # 4. Segmentation Head
        seg_outputs = self.seg_head(patch_tokens, hs, grid_size=(gh, gw))

        return {
            "pred_logits": pred_logits,
            "pred_boxes": pred_boxes,
            "pred_masks": seg_outputs["pred_masks"],         # [B, num_queries, H_mask, W_mask]
            "pred_semantic": seg_outputs["pred_semantic"],   # [B, 23, H_mask, W_mask]
            "pred_scale": pred_scale,
        }

    @torch.no_grad()
    def predict_unseen_plan(self, image_path, conf_threshold=0.20, nms_threshold=0.35,
                            use_segmentation=True, calibrate_ocr=True, device="cpu"):
        """
        End-to-End Inference:
        Input: Any unseen floor-plan image -> Output: rooms + polygons + metric dimensions.
        """
        self.eval()
        orig_img = Image.open(image_path).convert("RGB")
        orig_w, orig_h = orig_img.size

        # Preprocess
        transform = get_image_transform(self.img_size)
        input_tensor = transform(orig_img).unsqueeze(0).to(device)

        # Forward Pass
        outputs = self(input_tensor)
        pred_logits = outputs["pred_logits"][0]
        pred_boxes = outputs["pred_boxes"][0]
        pred_masks = outputs["pred_masks"][0]  # [num_queries, H_mask, W_mask]
        pred_scale_ppm = outputs["pred_scale"][0].item()

        # Scale resolution mapping
        raw_scale = pred_scale_ppm * (max(orig_w, orig_h) / 1024.0)

        probs = pred_logits.softmax(-1)
        scores, labels = probs.max(dim=-1)

        # Winning class must NOT be background (no-room) AND score >= conf_threshold
        keep = (labels != self.num_classes) & (scores >= conf_threshold)
        if keep.sum() == 0:
            return {
                "image_path": str(image_path),
                "image_size": [orig_w, orig_h],
                "estimated_scale_px_per_m": round(raw_scale, 2),
                "scale_source": "vit_fallback",
                "room_count": 0,
                "rooms": [],
            }

        boxes_filt = pred_boxes[keep]
        scores_filt = scores[keep]
        labels_filt = labels[keep]
        masks_filt = pred_masks[keep]

        if nms_threshold is not None and len(boxes_filt) > 1:
            import torchvision.ops as ops
            boxes_xyxy = box_cxcywh_to_xyxy(boxes_filt)
            boxes_xyxy_px = boxes_xyxy.clone()
            boxes_xyxy_px[:, 0] *= orig_w
            boxes_xyxy_px[:, 2] *= orig_w
            boxes_xyxy_px[:, 1] *= orig_h
            boxes_xyxy_px[:, 3] *= orig_h
            nms_idx = ops.nms(boxes_xyxy_px, scores_filt, iou_threshold=nms_threshold)
            boxes_filt = boxes_filt[nms_idx]
            scores_filt = scores_filt[nms_idx]
            labels_filt = labels_filt[nms_idx]
            masks_filt = masks_filt[nms_idx]

        # Stage 1: Geometry Extraction per Room
        preliminary_rooms = []
        for i in range(len(scores_filt)):
            score = scores_filt[i].item()
            label_id = labels_filt[i].item()
            box = boxes_filt[i]
            mask_logits = masks_filt[i]
            mask_prob = mask_logits.sigmoid().cpu().numpy()

            cx, cy, bw, bh = box.tolist()
            x0 = max(0.0, cx - bw / 2.0)
            y0 = max(0.0, cy - bh / 2.0)
            bbox_px_w = bw * orig_w
            bbox_px_h = bh * orig_h
            bbox_px_x0 = int(round(x0 * orig_w))
            bbox_px_y0 = int(round(y0 * orig_h))

            # Default geometry from bounding box
            geom = {
                "polygon": [
                    [round(x0, 4), round(y0, 4)],
                    [round(x0 + bw, 4), round(y0, 4)],
                    [round(x0 + bw, 4), round(y0 + bh, 4)],
                    [round(x0, 4), round(y0 + bh, 4)],
                ],
                "num_vertices": 4,
                "is_rectangular": True,
                "pixel_width": round(min(bbox_px_w, bbox_px_h), 1),
                "pixel_length": round(max(bbox_px_w, bbox_px_h), 1),
                "pixel_area": round(bbox_px_w * bbox_px_h, 1),
                "bbox_pixels": [bbox_px_x0, bbox_px_y0, int(round(bbox_px_w)), int(round(bbox_px_h))],
                "bbox_normalized": [round(x0, 4), round(y0, 4), round(bw, 4), round(bh, 4)],
                "geometry_source": "bbox_fallback",
            }

            # Refine geometry with segmentation mask if enabled
            if use_segmentation:
                mask_geom = extract_room_geometry_from_mask(
                    mask_prob, threshold=0.45, orig_size=(orig_w, orig_h), min_area_px=100
                )
                if mask_geom is not None:
                    # Valid contour found
                    geom = mask_geom
                    geom["geometry_source"] = "segmentation_mask"

            preliminary_rooms.append({
                "type": ID2LABEL.get(label_id, "Unknown Room"),
                "confidence": round(score, 4),
                **geom
            })

        # Stage 2: Scale Calibration (OCR with ViT fallback)
        calibrated_scale = raw_scale
        scale_source = "vit_predicted"
        calib_details = {}
        if calibrate_ocr:
            calibrator = ScaleCalibrator()
            calib_res = calibrator.calibrate_scale(image_path, preliminary_rooms, raw_scale)
            calibrated_scale = calib_res["calibrated_scale_px_per_m"]
            scale_source = calib_res["scale_source"]
            calib_details = calib_res

        # Stage 3: Metric Dimension Computation
        detected_rooms = []
        for r in preliminary_rooms:
            px_w = r["pixel_width"]
            px_l = r["pixel_length"]
            px_area = r["pixel_area"]

            width_m = round(px_w / max(1e-3, calibrated_scale), 2)
            length_m = round(px_l / max(1e-3, calibrated_scale), 2)
            area_m2 = round(px_area / max(1e-3, calibrated_scale ** 2), 2)

            detected_rooms.append({
                "type": r["type"],
                "confidence": r["confidence"],
                "geometry_source": r["geometry_source"],
                "is_rectangular": r["is_rectangular"],
                "num_vertices": r["num_vertices"],
                "polygon": r["polygon"],
                "bbox_normalized": r["bbox_normalized"],
                "bbox_pixels": r["bbox_pixels"],
                "pixel_width": px_w,
                "pixel_length": px_l,
                "pixel_area": px_area,
                "width_m": width_m,
                "length_m": length_m,
                "area_m2": area_m2,
            })

        detected_rooms.sort(key=lambda x: x["area_m2"], reverse=True)

        return {
            "image_path": str(image_path),
            "image_size": [orig_w, orig_h],
            "estimated_scale_px_per_m": round(calibrated_scale, 2),
            "scale_source": scale_source,
            "vit_raw_scale_px_per_m": round(raw_scale, 2),
            "calibration_details": calib_details,
            "room_count": len(detected_rooms),
            "rooms": detected_rooms,
        }


# =====================================================================
# Multi-Task Loss Criterion with Segmentation Loss
# =====================================================================

class MultiTaskCriterion(nn.Module):
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES,
                 weight_class=1.0, weight_bbox=5.0, weight_giou=2.0,
                 weight_mask=2.0, weight_scale=1.0, eos_coef=0.1):
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
        pred_scale = outputs["pred_scale"]

        indices = self.matcher(pred_logits, pred_boxes, targets)

        # 1. Classification Loss
        bs, num_queries = pred_logits.shape[:2]
        target_classes = torch.full(
            (bs, num_queries), self.num_classes,
            dtype=torch.int64, device=pred_logits.device
        )
        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                target_classes[b, src_idx] = targets[b]["labels"][tgt_idx]

        loss_ce = F.cross_entropy(
            pred_logits.flatten(0, 1),
            target_classes.flatten(),
            weight=self.empty_weight
        )

        # 2. Bounding Box Losses
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

                # Matched masks
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
            # If target mask spatial resolution differs from pred mask, interpolate
            if all_src_masks.shape[-2:] != all_target_masks.shape[-2:]:
                all_target_masks = F.interpolate(
                    all_target_masks.unsqueeze(1),
                    size=all_src_masks.shape[-2:],
                    mode="nearest"
                ).squeeze(1)

            loss_mask, loss_mask_bce, loss_mask_dice = compute_mask_loss(all_src_masks, all_target_masks)
        else:
            loss_mask = torch.tensor(0.0, device=pred_logits.device)
            loss_mask_bce = torch.tensor(0.0, device=pred_logits.device)
            loss_mask_dice = torch.tensor(0.0, device=pred_logits.device)

        # 4. Masked Scale Estimation Loss
        gt_scales = torch.stack([t["scale_px_per_m"] for t in targets]).to(pred_logits.device)
        has_scale = torch.stack([t["has_scale"] for t in targets]).to(pred_logits.device)

        raw_scale_loss = F.smooth_l1_loss(pred_scale, gt_scales, reduction="none")
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
# Prediction Visualizer
# =====================================================================

def visualize_prediction(image_path, prediction_result, out_path):
    img = Image.open(image_path).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw_img = ImageDraw.Draw(img)

    colors = [
        (220, 50, 47, 100), (38, 139, 210, 100), (133, 153, 0, 100), (211, 54, 130, 100),
        (108, 113, 196, 100), (42, 161, 152, 100), (203, 75, 22, 100), (181, 137, 0, 100)
    ]
    solid_colors = [
        (220, 50, 47), (38, 139, 210), (133, 153, 0), (211, 54, 130),
        (108, 113, 196), (42, 161, 152), (203, 75, 22), (181, 137, 0)
    ]

    orig_w, orig_h = img.size

    for i, room in enumerate(prediction_result["rooms"]):
        color_fill = colors[i % len(colors)]
        color_solid = solid_colors[i % len(solid_colors)]

        # Draw Polygon if available
        poly = room.get("polygon")
        if poly and len(poly) >= 3:
            pts = [(int(p[0] * orig_w), int(p[1] * orig_h)) for p in poly]
            draw_overlay.polygon(pts, fill=color_fill, outline=color_solid)
            draw_img.line(pts + [pts[0]], fill=color_solid, width=3)
        else:
            x, y, w, h = room["bbox_pixels"]
            draw_img.rectangle([x, y, x + w, y + h], outline=color_solid, width=3)

        x, y, w, h = room["bbox_pixels"]
        label = f"{room['type']} ({room['confidence']:.2f}): {room['width_m']:.2f}x{room['length_m']:.2f}m ({room['area_m2']:.1f}m²)"
        draw_img.rectangle([x, max(0, y - 20), x + len(label) * 7, max(0, y)], fill=color_solid)
        draw_img.text((x + 2, max(0, y - 18)), label, fill=(255, 255, 255))

    combined = Image.alpha_composite(img, overlay).convert("RGB")
    out_p = Path(out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    combined.save(out_p)
    return out_p


# =====================================================================
# Training & Evaluation
# =====================================================================

def train_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    criterion.train()
    total_loss = 0.0
    num_batches = 0

    pbar = tqdm(dataloader, desc="Multi-Task Training")
    for images, targets in pbar:
        images = images.to(device)
        optimizer.zero_grad()

        outputs = model(images)
        loss_dict = criterion(outputs, targets)

        loss = loss_dict["loss"]
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss.item()
        num_batches += 1
        pbar.set_postfix({
            "loss": f"{loss.item():.3f}",
            "ce": f"{loss_dict['loss_ce'].item():.2f}",
            "box": f"{loss_dict['loss_bbox'].item():.2f}",
            "mask": f"{loss_dict['loss_mask'].item():.2f}",
            "scale": f"{loss_dict['loss_scale'].item():.2f}",
        })

    return total_loss / max(1, num_batches)


@torch.no_grad()
def evaluate(model, dataloader, criterion, device):
    model.eval()
    criterion.eval()
    total_loss = 0.0
    num_batches = 0

    for images, targets in tqdm(dataloader, desc="Evaluating Multi-Task"):
        images = images.to(device)
        outputs = model(images)
        loss_dict = criterion(outputs, targets)
        total_loss += loss_dict["loss"].item()
        num_batches += 1

    return total_loss / max(1, num_batches)


def main():
    parser = argparse.ArgumentParser(description="Multi-Task ViT: Room Detection + Scale + Dimensions")
    parser.add_argument("--data-root", type=str, default="HomeVerse-Dataset")
    parser.add_argument("--img-size", type=int, default=224, choices=[224, 384])
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--max-train-samples", type=int, default=None)
    parser.add_argument("--max-val-samples", type=int, default=None)
    parser.add_argument("--save-dir", type=str, default="checkpoints/multitask")
    parser.add_argument("--predict-image", type=str, default=None, help="Path to unseen image to predict")
    parser.add_argument("--conf-threshold", type=float, default=0.25, help="Confidence threshold for prediction")
    parser.add_argument("--init-checkpoint", type=str, default=None, help="Path to pretrained checkpoint")
    parser.add_argument("--freeze-backbone", action="store_true", default=True, help="Freeze ViT encoder weights")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device} | Image size: {args.img_size}x{args.img_size}")

    save_path = Path(args.save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    model_name = "google/vit-base-patch16-384" if args.img_size == 384 else "google/vit-base-patch16-224"
    model = MultiTaskViT(pretrained_model_name=model_name, img_size=args.img_size).to(device)

    if args.predict_image:
        ckpt = save_path / f"multitask_vit_{args.img_size}_best.pt"
        if not ckpt.exists():
            ckpt = save_path / "multitask_vit_best.pt"
        if ckpt.exists():
            model.load_state_dict(torch.load(ckpt, map_location=device), strict=False)
            print(f"Loaded checkpoint from {ckpt}")
        result = model.predict_unseen_plan(args.predict_image, conf_threshold=args.conf_threshold, device=device)
        import json
        print(json.dumps(result, indent=2))
        return

    train_ds = FloorplanDataset(args.data_root, split="train", img_size=args.img_size, max_samples=args.max_train_samples)
    val_ds = FloorplanDataset(args.data_root, split="validation", img_size=args.img_size, max_samples=args.max_val_samples)
    print(f"Loaded {len(train_ds)} train floorplans, {len(val_ds)} val floorplans.")

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)

    if args.init_checkpoint and Path(args.init_checkpoint).exists():
        print(f"Loading weights from {args.init_checkpoint}...")
        ckpt = torch.load(args.init_checkpoint, map_location=device)
        model.load_state_dict(ckpt, strict=False)

    if args.freeze_backbone:
        for p in model.encoder.parameters():
            p.requires_grad = False
        model.encoder.eval()
        print("Pretrained ViT encoder backbone frozen. Training heads & decoder.")

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterion(matcher=matcher, num_classes=NUM_ROOM_CLASSES).to(device)

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=args.lr, weight_decay=1e-4)

    best_val_loss = float("inf")
    for epoch in range(1, args.epochs + 1):
        print(f"\n--- Multi-Task Epoch {epoch}/{args.epochs} ---")
        train_loss = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss = evaluate(model, val_loader, criterion, device)
        print(f"Epoch {epoch}: Train Loss = {train_loss:.4f}, Val Loss = {val_loss:.4f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            ckpt_file = save_path / f"multitask_vit_{args.img_size}_best.pt"
            torch.save(model.state_dict(), ckpt_file)
            print(f"Saved best multi-task checkpoint to {ckpt_file}")

    print("\nMulti-Task ViT training completed successfully!")


if __name__ == "__main__":
    main()
