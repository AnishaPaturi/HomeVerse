import argparse
import math
from pathlib import Path

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
    ROOM_CLASSES,
    NUM_ROOM_CLASSES,
    NO_ROOM_ID,
    ID2LABEL,
)


# =====================================================================
# Box Utilities (GIoU and Format Conversions)
# =====================================================================

def box_cxcywh_to_xyxy(x):
    cx, cy, w, h = x.unbind(-1)
    b = [(cx - 0.5 * w), (cy - 0.5 * h),
         (cx + 0.5 * w), (cy + 0.5 * h)]
    return torch.stack(b, dim=-1)


def box_xyxy_to_cxcywh(x):
    x0, y0, x1, y1 = x.unbind(-1)
    b = [(x0 + x1) / 2.0, (y0 + y1) / 2.0,
         (x1 - x0), (y1 - y0)]
    return torch.stack(b, dim=-1)


def box_iou(boxes1, boxes2):
    area1 = (boxes1[:, 2] - boxes1[:, 0]) * (boxes1[:, 3] - boxes1[:, 1])
    area2 = (boxes2[:, 2] - boxes2[:, 0]) * (boxes2[:, 3] - boxes2[:, 1])

    lt = torch.max(boxes1[:, None, :2], boxes2[:, :2])  # [N, M, 2]
    rb = torch.min(boxes1[:, None, 2:], boxes2[:, 2:])  # [N, M, 2]

    wh = (rb - lt).clamp(min=0)  # [N, M, 2]
    inter = wh[:, :, 0] * wh[:, :, 1]  # [N, M]

    union = area1[:, None] + area2 - inter
    iou = inter / (union + 1e-6)
    return iou, union


def generalized_box_iou(boxes1, boxes2):
    """
    Generalized IoU from Rezatofighi et al. (CVPR 2019)
    Both boxes1 and boxes2 in xyxy format.
    """
    iou, union = box_iou(boxes1, boxes2)

    lt = torch.min(boxes1[:, None, :2], boxes2[:, :2])
    rb = torch.max(boxes1[:, None, 2:], boxes2[:, 2:])

    wh = (rb - lt).clamp(min=0)
    area = wh[:, :, 0] * wh[:, :, 1]

    return iou - (area - union) / (area + 1e-6)


# =====================================================================
# Hungarian Bipartite Matcher
# =====================================================================

class HungarianMatcher(nn.Module):
    """
    Computes optimal assignment between targets and predictions.
    """
    def __init__(self, cost_class=1.0, cost_bbox=5.0, cost_giou=2.0):
        super().__init__()
        self.cost_class = cost_class
        self.cost_bbox = cost_bbox
        self.cost_giou = cost_giou

    @torch.no_grad()
    def forward(self, pred_logits, pred_boxes, targets):
        """
        pred_logits: [B, num_queries, num_classes + 1]
        pred_boxes:  [B, num_queries, 4] in (cx, cy, w, h)
        targets:     list of dicts with 'labels' [M], 'boxes' [M, 4]
        """
        bs, num_queries = pred_logits.shape[:2]
        indices = []

        out_prob = pred_logits.softmax(-1)

        for b in range(bs):
            tgt_ids = targets[b]["labels"]
            tgt_bbox = targets[b]["boxes"]

            if len(tgt_ids) == 0:
                indices.append((
                    torch.empty(0, dtype=torch.int64),
                    torch.empty(0, dtype=torch.int64),
                ))
                continue

            # Class cost: -P(target_class)
            cost_class = -out_prob[b, :, tgt_ids]

            # L1 box cost
            cost_bbox = torch.cdist(pred_boxes[b], tgt_bbox, p=1)

            # GIoU cost
            cost_giou = -generalized_box_iou(
                box_cxcywh_to_xyxy(pred_boxes[b]),
                box_cxcywh_to_xyxy(tgt_bbox)
            )

            # Total cost matrix [num_queries, num_targets]
            C = self.cost_class * cost_class + self.cost_bbox * cost_bbox + self.cost_giou * cost_giou
            C = C.cpu().numpy()

            row_ind, col_ind = linear_sum_assignment(C)
            indices.append((
                torch.as_tensor(row_ind, dtype=torch.int64),
                torch.as_tensor(col_ind, dtype=torch.int64),
            ))

        return indices


# =====================================================================
# Set Prediction Criterion (Loss)
# =====================================================================

class SetCriterion(nn.Module):
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES,
                 weight_class=1.0, weight_bbox=5.0, weight_giou=2.0, eos_coef=0.1):
        super().__init__()
        self.matcher = matcher
        self.num_classes = num_classes
        self.weight_class = weight_class
        self.weight_bbox = weight_bbox
        self.weight_giou = weight_giou

        # Background class weight
        empty_weight = torch.ones(num_classes + 1)
        empty_weight[num_classes] = eos_coef
        self.register_buffer("empty_weight", empty_weight)

    def forward(self, pred_logits, pred_boxes, targets):
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

        # 2. Bounding Box Losses (L1 and GIoU on matched pairs only)
        total_boxes = sum(len(t["labels"]) for t in targets)
        num_boxes = max(total_boxes, 1)

        loss_bbox = torch.tensor(0.0, device=pred_logits.device)
        loss_giou = torch.tensor(0.0, device=pred_logits.device)

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

        total_loss = (self.weight_class * loss_ce +
                      self.weight_bbox * loss_bbox +
                      self.weight_giou * loss_giou)

        return {
            "loss": total_loss,
            "loss_ce": loss_ce,
            "loss_bbox": loss_bbox,
            "loss_giou": loss_giou,
        }


# =====================================================================
# ViT Room Detector Model
# =====================================================================

class ViTRoomDetector(nn.Module):
    """
    Vision Transformer Room Detector for full floor plans.
    Input: Floor plan image (B, 3, 224, 224)
    Output: Multiple rooms [class_logits, [cx, cy, w, h]]
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-224",
                 num_queries=25, num_classes=NUM_ROOM_CLASSES, decoder_layers=3):
        super().__init__()
        self.num_queries = num_queries
        self.num_classes = num_classes

        # ViT Encoder
        try:
            self.encoder = ViTModel.from_pretrained(pretrained_model_name)
        except Exception:
            # Fallback to local config if offline
            config = ViTConfig(image_size=224, patch_size=16, hidden_size=768)
            self.encoder = ViTModel(config)

        hidden_dim = self.encoder.config.hidden_size  # 768

        # Room Queries
        self.query_embed = nn.Embedding(num_queries, hidden_dim)

        # Transformer Decoder
        decoder_layer = nn.TransformerDecoderLayer(
            d_model=hidden_dim,
            nhead=8,
            dim_feedforward=2048,
            dropout=0.1,
            activation="relu",
            batch_first=True,
        )
        self.decoder = nn.TransformerDecoder(decoder_layer, num_layers=decoder_layers)

        # Output Heads
        self.class_head = nn.Linear(hidden_dim, num_classes + 1)  # +1 for background
        self.bbox_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, 4),
            nn.Sigmoid(),  # Box coords in [0, 1]
        )

    def forward(self, images):
        # 1. ViT Encoder
        encoder_outputs = self.encoder(pixel_values=images)
        memory = encoder_outputs.last_hidden_state  # [B, 197, 768] (patch + CLS tokens)

        # 2. Room Query Decoder
        bs = images.size(0)
        queries = self.query_embed.weight.unsqueeze(0).expand(bs, -1, -1)  # [B, num_queries, 768]
        hs = self.decoder(tgt=queries, memory=memory)  # [B, num_queries, 768]

        # 3. Heads
        pred_logits = self.class_head(hs)  # [B, num_queries, 23]
        pred_boxes = self.bbox_head(hs)    # [B, num_queries, 4] in (cx, cy, w, h)

        return pred_logits, pred_boxes

    @torch.no_grad()
    def predict_rooms(self, images, conf_threshold=0.4):
        """
        Inference helper: returns detected rooms for each image in batch.
        """
        self.eval()
        pred_logits, pred_boxes = self(images)
        probs = pred_logits.softmax(-1)

        batch_detections = []
        for b in range(images.size(0)):
            scores, labels = probs[b, :, :self.num_classes].max(dim=-1)
            keep = scores >= conf_threshold

            rooms = []
            for score, label_id, box in zip(scores[keep], labels[keep], pred_boxes[b][keep]):
                cx, cy, bw, bh = box.tolist()
                x0 = max(0.0, cx - bw / 2.0)
                y0 = max(0.0, cy - bh / 2.0)
                rooms.append({
                    "type": ID2LABEL.get(label_id.item(), "Unknown"),
                    "label_id": label_id.item(),
                    "confidence": round(score.item(), 4),
                    "bbox": [round(x0, 4), round(y0, 4), round(bw, 4), round(bh, 4)],
                    "cxcywh": [round(cx, 4), round(cy, 4), round(bw, 4), round(bh, 4)],
                })
            batch_detections.append(rooms)

        return batch_detections


# =====================================================================
# Training & Evaluation Script
# =====================================================================

def train_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    criterion.train()
    total_loss = 0.0
    num_batches = 0

    pbar = tqdm(dataloader, desc="Training")
    for images, targets in pbar:
        images = images.to(device)
        optimizer.zero_grad()

        pred_logits, pred_boxes = model(images)
        loss_dict = criterion(pred_logits, pred_boxes, targets)

        loss = loss_dict["loss"]
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss.item()
        num_batches += 1
        pbar.set_postfix({
            "loss": f"{loss.item():.4f}",
            "ce": f"{loss_dict['loss_ce'].item():.3f}",
            "box": f"{loss_dict['loss_bbox'].item():.3f}",
            "giou": f"{loss_dict['loss_giou'].item():.3f}",
        })

    return total_loss / max(1, num_batches)


@torch.no_grad()
def evaluate(model, dataloader, criterion, device, iou_thresh=0.5, conf_thresh=0.25):
    model.eval()
    criterion.eval()
    total_loss = 0.0
    num_batches = 0

    total_tp = 0
    total_fp = 0
    total_fn = 0
    total_class_correct = 0
    total_matched = 0
    sum_iou = 0.0
    sum_giou = 0.0
    total_pred_rooms = 0
    total_gt_rooms = 0

    for images, targets in tqdm(dataloader, desc="Evaluating"):
        images = images.to(device)
        pred_logits, pred_boxes = model(images)
        loss_dict = criterion(pred_logits, pred_boxes, targets)
        total_loss += loss_dict["loss"].item()
        num_batches += 1

        probs = pred_logits.softmax(-1)
        bs = images.size(0)

        for b in range(bs):
            tgt_boxes = targets[b]["boxes"].to(device)
            tgt_labels = targets[b]["labels"].to(device)
            num_gt = len(tgt_labels)
            total_gt_rooms += num_gt

            # Extract predicted candidate rooms (non-background, conf >= conf_thresh)
            scores, pred_labels = probs[b, :, :NUM_ROOM_CLASSES].max(dim=-1)
            keep = scores >= conf_thresh
            p_boxes = pred_boxes[b, keep]
            p_labels = pred_labels[keep]
            p_scores = scores[keep]
            num_preds = len(p_labels)
            total_pred_rooms += num_preds

            if num_gt == 0:
                total_fp += num_preds
                continue
            if num_preds == 0:
                total_fn += num_gt
                continue

            # Compute IoU matrix [num_preds, num_gt]
            p_xyxy = box_cxcywh_to_xyxy(p_boxes)
            t_xyxy = box_cxcywh_to_xyxy(tgt_boxes)
            ious, _ = box_iou(p_xyxy, t_xyxy)
            gious = generalized_box_iou(p_xyxy, t_xyxy)

            # Greedy match by highest IoU
            matched_gt = set()
            for p_idx in range(num_preds):
                best_iou, best_gt = ious[p_idx].max(dim=-1)
                best_iou_val = best_iou.item()
                best_gt_idx = best_gt.item()
                best_giou_val = gious[p_idx, best_gt_idx].item()

                sum_iou += max(0.0, best_iou_val)
                sum_giou += best_giou_val
                total_matched += 1

                if best_iou_val >= iou_thresh and best_gt_idx not in matched_gt:
                    matched_gt.add(best_gt_idx)
                    if p_labels[p_idx] == tgt_labels[best_gt_idx]:
                        total_tp += 1
                        total_class_correct += 1
                    else:
                        total_fp += 1
                else:
                    total_fp += 1

            total_fn += (num_gt - len(matched_gt))

    precision = total_tp / max(1, total_tp + total_fp)
    recall = total_tp / max(1, total_tp + total_fn)
    f1 = 2 * precision * recall / max(1e-6, precision + recall)
    mean_iou = sum_iou / max(1, total_matched)
    mean_giou = sum_giou / max(1, total_matched)
    class_acc = total_class_correct / max(1, total_tp + (total_matched - total_tp))

    total_samples = max(1, len(dataloader.dataset))
    avg_pred_rooms = total_pred_rooms / total_samples
    avg_gt_rooms = total_gt_rooms / total_samples

    metrics = {
        "loss": total_loss / max(1, num_batches),
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "class_acc": class_acc,
        "mean_iou": mean_iou,
        "mean_giou": mean_giou,
        "avg_detected_rooms": avg_pred_rooms,
        "avg_gt_rooms": avg_gt_rooms,
    }
    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train ViT Room Detector for full floor plans")
    parser.add_argument("--data-root", type=str, default="HomeVerse-Dataset")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--freeze-backbone", action="store_true", default=True, help="Freeze ViT encoder weights")
    parser.add_argument("--max-train-samples", type=int, default=None)
    parser.add_argument("--max-val-samples", type=int, default=None)
    parser.add_argument("--save-dir", type=str, default="checkpoints/detector")
    parser.add_argument("--eval-only", action="store_true", default=False)
    parser.add_argument("--split", type=str, default="test", help="Split for eval-only mode")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    save_path = Path(args.save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    model = ViTRoomDetector(decoder_layers=2).to(device)

    if args.freeze_backbone:
        for p in model.encoder.parameters():
            p.requires_grad = False
        model.encoder.eval()
        print("Pretrained ViT encoder backbone frozen. Training Room Query Decoder and Heads.")

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = SetCriterion(matcher=matcher, num_classes=NUM_ROOM_CLASSES).to(device)

    if args.eval_only:
        ckpt_file = save_path / "vit_detector_best.pt"
        if ckpt_file.exists():
            model.load_state_dict(torch.load(ckpt_file, map_location=device))
            print(f"Loaded checkpoint from {ckpt_file}")
        test_ds = FloorplanDataset(args.data_root, split=args.split, max_samples=args.max_val_samples)
        test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)
        print(f"\n--- Evaluating on {len(test_ds)} unseen {args.split} floorplans ---")
        metrics = evaluate(model, test_loader, criterion, device)
        print("\nEvaluation Results:")
        print(f"  Loss:                 {metrics['loss']:.4f}")
        print(f"  Classification Acc:   {metrics['class_acc']*100:.2f}%")
        print(f"  Classification F1:    {metrics['f1']:.4f}")
        print(f"  Precision:            {metrics['precision']*100:.2f}%")
        print(f"  Recall:               {metrics['recall']*100:.2f}%")
        print(f"  Mean BBox IoU:        {metrics['mean_iou']:.4f}")
        print(f"  Mean GIoU:            {metrics['mean_giou']:.4f}")
        print(f"  Avg Detected Rooms:   {metrics['avg_detected_rooms']:.1f}")
        print(f"  Avg Ground Truth:     {metrics['avg_gt_rooms']:.1f}")
        return

    train_ds = FloorplanDataset(args.data_root, split="train", max_samples=args.max_train_samples)
    val_ds = FloorplanDataset(args.data_root, split="validation", max_samples=args.max_val_samples)

    print(f"Loaded {len(train_ds)} train floorplans, {len(val_ds)} validation floorplans.")

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=args.lr, weight_decay=1e-4)

    best_f1 = -1.0
    for epoch in range(1, args.epochs + 1):
        print(f"\n--- Epoch {epoch}/{args.epochs} ---")
        train_loss = train_epoch(model, train_loader, criterion, optimizer, device)
        metrics = evaluate(model, val_loader, criterion, device)

        print(f"Epoch {epoch} Validation Metrics:")
        print(f"  Loss:               {metrics['loss']:.4f} (Train Loss: {train_loss:.4f})")
        print(f"  Classification Acc: {metrics['class_acc']*100:.2f}%")
        print(f"  F1 Score:           {metrics['f1']:.4f}")
        print(f"  Precision:          {metrics['precision']*100:.2f}%")
        print(f"  Recall:             {metrics['recall']*100:.2f}%")
        print(f"  Mean BBox IoU:      {metrics['mean_iou']:.4f}")
        print(f"  Mean GIoU:          {metrics['mean_giou']:.4f}")
        print(f"  Avg Rooms Detected: {metrics['avg_detected_rooms']:.1f} (GT: {metrics['avg_gt_rooms']:.1f})")

        if metrics["f1"] > best_f1:
            best_f1 = metrics["f1"]
            ckpt_file = save_path / "vit_detector_best.pt"
            torch.save(model.state_dict(), ckpt_file)
            print(f"  --> Saved new best detector checkpoint to {ckpt_file} (F1: {best_f1:.4f})")

    print("\nViT Room Detector training completed!")


if __name__ == "__main__":
    main()

