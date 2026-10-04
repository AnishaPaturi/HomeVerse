import argparse
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

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
    DEFAULT_IMAGE_TRANSFORM,
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    ID2LABEL,
)
from vit_detector import (
    HungarianMatcher,
    box_cxcywh_to_xyxy,
    generalized_box_iou,
)


# =====================================================================
# Multi-Task Vision Transformer
# =====================================================================

class MultiTaskViT(nn.Module):
    """
    Unified Multi-Task Vision Transformer for Floor Plans.
    
    Architecture:
                         IMAGE
                           ↓
                     ViT Encoder
                           ↓
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
       Room Class       BBox Head      Scale Head
            ↓              ↓              ↓
          type          x,y,w,h        pixels/m
                           │              │
                           └──────┬───────┘
                                  ↓
                          Dimensions in meters
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-224",
                 num_queries=25, num_classes=NUM_ROOM_CLASSES, decoder_layers=2):
        super().__init__()
        self.num_queries = num_queries
        self.num_classes = num_classes
        self.decoder_layers = decoder_layers

        # ViT Encoder
        try:
            self.encoder = ViTModel.from_pretrained(pretrained_model_name)
        except Exception:
            config = ViTConfig(image_size=224, patch_size=16, hidden_size=768)
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

    def forward(self, images):
        bs = images.size(0)

        # ViT Encoder
        outputs = self.encoder(pixel_values=images)
        cls_token = outputs.last_hidden_state[:, 0, :]   # [B, 768]
        patch_tokens = outputs.last_hidden_state          # [B, 197, 768]

        # 1. Global Scale Prediction
        pred_scale = self.scale_head(cls_token).squeeze(-1)  # [B] in pixels/meter

        # 2. Room Query Decoding
        queries = self.query_embed.weight.unsqueeze(0).expand(bs, -1, -1)
        hs = self.decoder(tgt=queries, memory=patch_tokens)  # [B, num_queries, 768]

        # 3. Heads
        pred_logits = self.class_head(hs)  # [B, num_queries, 23]
        pred_boxes = self.bbox_head(hs)    # [B, num_queries, 4]

        return {
            "pred_logits": pred_logits,
            "pred_boxes": pred_boxes,
            "pred_scale": pred_scale,
        }

    @torch.no_grad()
    def predict_unseen_plan(self, image_path, conf_threshold=0.20, nms_threshold=0.30, device="cpu"):
        """
        End-to-End Inference:
        Input: Any unseen floor-plan image -> Output: rooms + dimensions in meters
        """
        self.eval()
        orig_img = Image.open(image_path).convert("RGB")
        orig_w, orig_h = orig_img.size

        # Preprocess
        input_tensor = DEFAULT_IMAGE_TRANSFORM(orig_img).unsqueeze(0).to(device)

        # Forward Pass
        outputs = self(input_tensor)
        pred_logits = outputs["pred_logits"][0]
        pred_boxes = outputs["pred_boxes"][0]
        pred_scale_ppm = outputs["pred_scale"][0].item()  # pixels / meter (at original or normalized resolution)

        # Scale resolution: dataset images were rendered at canonical 1024x1024 resolution.
        # pred_scale_ppm represents estimated pixels per meter on a 1024-pixel dimension.
        # On the original image of size (orig_w, orig_h), the scale is proportional to max(orig_w, orig_h):
        orig_scale = pred_scale_ppm * (max(orig_w, orig_h) / 1024.0)

        probs = pred_logits.softmax(-1)
        scores, labels = probs[:, :self.num_classes].max(dim=-1)

        keep = scores >= conf_threshold
        if keep.sum() == 0:
            return {
                "image_path": str(image_path),
                "image_size": [orig_w, orig_h],
                "estimated_scale_px_per_m": round(orig_scale, 2),
                "room_count": 0,
                "rooms": [],
            }

        boxes_filt = pred_boxes[keep]
        scores_filt = scores[keep]
        labels_filt = labels[keep]

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

        detected_rooms = []
        for score, label_id, box in zip(scores_filt, labels_filt, boxes_filt):
            cx, cy, bw, bh = box.tolist()
            x0 = max(0.0, cx - bw / 2.0)
            y0 = max(0.0, cy - bh / 2.0)

            # Pixel dimensions
            px_w = bw * orig_w
            px_h = bh * orig_h
            px_x0 = int(round(x0 * orig_w))
            px_y0 = int(round(y0 * orig_h))
            px_w_int = int(round(px_w))
            px_h_int = int(round(px_h))

            # Metric Dimensions in meters
            width_m = round(px_w / max(1e-3, orig_scale), 2)
            length_m = round(px_h / max(1e-3, orig_scale), 2)
            bbox_area_m2 = round(width_m * length_m, 2)

            detected_rooms.append({
                "type": ID2LABEL.get(label_id.item(), "Unknown Room"),
                "confidence": round(score.item(), 4),
                "bbox_normalized": [round(x0, 4), round(y0, 4), round(bw, 4), round(bh, 4)],
                "bbox_pixels": [px_x0, px_y0, px_w_int, px_h_int],
                "width_m": width_m,
                "length_m": length_m,
                "area_m2": bbox_area_m2,
                "bbox_area_m2": bbox_area_m2,
                "is_rectangular_estimate": True,
            })

        # Sort rooms by area descending
        detected_rooms.sort(key=lambda r: r["area_m2"], reverse=True)

        return {
            "image_path": str(image_path),
            "image_size": [orig_w, orig_h],
            "estimated_scale_px_per_m": round(orig_scale, 2),
            "room_count": len(detected_rooms),
            "rooms": detected_rooms,
        }


# =====================================================================
# Multi-Task Loss Criterion
# =====================================================================

class MultiTaskCriterion(nn.Module):
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES,
                 weight_class=1.0, weight_bbox=5.0, weight_giou=2.0,
                 weight_scale=1.0, eos_coef=0.1):
        super().__init__()
        self.matcher = matcher
        self.num_classes = num_classes
        self.weight_class = weight_class
        self.weight_bbox = weight_bbox
        self.weight_giou = weight_giou
        self.weight_scale = weight_scale

        empty_weight = torch.ones(num_classes + 1)
        empty_weight[num_classes] = eos_coef
        self.register_buffer("empty_weight", empty_weight)

    def forward(self, outputs, targets):
        pred_logits = outputs["pred_logits"]
        pred_boxes = outputs["pred_boxes"]
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
        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                src_boxes_list.append(pred_boxes[b, src_idx])
                target_boxes_list.append(targets[b]["boxes"][tgt_idx].to(pred_boxes.device))

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

        # 3. Masked Scale Estimation Loss (Masked out for 12% no-scale)
        gt_scales = torch.stack([t["scale_px_per_m"] for t in targets]).to(pred_logits.device)
        has_scale = torch.stack([t["has_scale"] for t in targets]).to(pred_logits.device)

        raw_scale_loss = F.smooth_l1_loss(pred_scale, gt_scales, reduction="none")
        scale_denom = max(1.0, has_scale.sum().item())
        loss_scale = (raw_scale_loss * has_scale).sum() / scale_denom

        total_loss = (self.weight_class * loss_ce +
                      self.weight_bbox * loss_bbox +
                      self.weight_giou * loss_giou +
                      self.weight_scale * loss_scale)

        return {
            "loss": total_loss,
            "loss_ce": loss_ce,
            "loss_bbox": loss_bbox,
            "loss_giou": loss_giou,
            "loss_scale": loss_scale,
        }


# =====================================================================
# Prediction Visualizer
# =====================================================================

def visualize_prediction(image_path, prediction_result, out_path):
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    colors = [
        (220, 50, 47), (38, 139, 210), (133, 153, 0), (211, 54, 130),
        (108, 113, 196), (42, 161, 152), (203, 75, 22), (181, 137, 0)
    ]

    for i, room in enumerate(prediction_result["rooms"]):
        color = colors[i % len(colors)]
        x, y, w, h = room["bbox_pixels"]
        draw.rectangle([x, y, x + w, y + h], outline=color, width=3)

        label = f"{room['type']} ({room['confidence']:.2f}): {room['width_m']:.2f}x{room['length_m']:.2f}m ({room['area_m2']:.1f}m²)"
        draw.rectangle([x, max(0, y - 20), x + len(label)*7, max(0, y)], fill=color)
        draw.text((x + 2, max(0, y - 18)), label, fill=(255, 255, 255))

    out_p = Path(out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_p)
    return out_p


# =====================================================================
# Training & CLI
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
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--max-train-samples", type=int, default=None)
    parser.add_argument("--max-val-samples", type=int, default=None)
    parser.add_argument("--save-dir", type=str, default="checkpoints/multitask")
    parser.add_argument("--predict-image", type=str, default=None, help="Path to unseen image to predict")
    parser.add_argument("--conf-threshold", type=float, default=0.25, help="Confidence threshold for prediction")
    parser.add_argument("--init-detector", type=str, default="checkpoints/detector/vit_detector_best.pt", help="Path to pretrained detector checkpoint")
    parser.add_argument("--init-scale", type=str, default="checkpoints/scale/scale_estimator_best.pt", help="Path to pretrained scale checkpoint")
    parser.add_argument("--freeze-backbone", action="store_true", default=True, help="Freeze ViT encoder weights for fast CPU training")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    save_path = Path(args.save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    if args.predict_image:
        model = MultiTaskViT().to(device)
        ckpt = save_path / "multitask_vit_best.pt"
        if ckpt.exists():
            model.load_state_dict(torch.load(ckpt, map_location=device))
            print(f"Loaded checkpoint from {ckpt}")
        result = model.predict_unseen_plan(args.predict_image, conf_threshold=args.conf_threshold, device=device)
        import json
        print(json.dumps(result, indent=2))
        return

    train_ds = FloorplanDataset(args.data_root, split="train", max_samples=args.max_train_samples)
    val_ds = FloorplanDataset(args.data_root, split="validation", max_samples=args.max_val_samples)
    print(f"Loaded {len(train_ds)} train floorplans, {len(val_ds)} val floorplans.")

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)

    model = MultiTaskViT().to(device)

    # Initialize from pretrained detector and scale checkpoints if available
    if args.init_detector and Path(args.init_detector).exists():
        print(f"Loading pretrained detector weights from {args.init_detector}...")
        det_ckpt = torch.load(args.init_detector, map_location=device)
        model.load_state_dict(det_ckpt, strict=False)

    if args.init_scale and Path(args.init_scale).exists():
        print(f"Loading pretrained scale head weights from {args.init_scale}...")
        scale_ckpt = torch.load(args.init_scale, map_location=device)
        scale_dict = {k.replace('scale_head.', ''): v for k, v in scale_ckpt.items() if 'scale_head' in k}
        model.scale_head.load_state_dict(scale_dict)

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
            ckpt_file = save_path / "multitask_vit_best.pt"
            torch.save(model.state_dict(), ckpt_file)
            print(f"Saved best multi-task checkpoint to {ckpt_file}")

    print("\nMulti-Task ViT training completed successfully!")


if __name__ == "__main__":
    main()
