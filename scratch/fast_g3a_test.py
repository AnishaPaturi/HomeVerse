import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import time
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from run_experiment_f1_fpn import MultiTaskViT384FPN
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta
from floorplan_dataset import FloorplanDataset, ROOM_CLASSES, NO_ROOM_ID
from vit_detector import HungarianMatcher
from run_experiment_g3a import compute_sqrt_class_weights, ClassBalancedMultiTaskCriterion, evaluate_g3a

torch.set_num_threads(8)
device = torch.device("cpu")

print("1. Selecting splits...", flush=True)
t_lids, train_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/train.json", 350)
v_lids, val_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/validation.json", 75)
te_lids, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)

class_weights, inst_counts = compute_sqrt_class_weights(train_samples)
print("Class weights computed.")

def cache_ds(samples):
    ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=384, mask_size=(96, 96))
    ds.samples = samples
    items = [{**ds[i], "sample_meta": samples[i]} for i in range(len(ds))]
    return InMemoryDataset(items)

train_ds = cache_ds(train_samples)
val_ds = cache_ds(val_samples)
test_ds = cache_ds(test_samples)

train_loader = DataLoader(train_ds, batch_size=7, shuffle=False, collate_fn=collate_fn_with_meta)
val_loader = DataLoader(val_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)
test_loader = DataLoader(test_ds, batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

m = MultiTaskViT384FPN(img_size=384).to(device)
m.load_state_dict(torch.load("checkpoints/multitask/experiment_f2a_best.pt", map_location=device))
m.eval()

print("Pre-extracting ViT encoder features for train split...", flush=True)
t0 = time.time()
train_features = []
with torch.no_grad():
    for images, targets in train_loader:
        outputs = m.encoder(pixel_values=images, output_hidden_states=True)
        cls_token = outputs.last_hidden_state[:, 0, :].cpu()
        f6 = outputs.hidden_states[6][:, 1:, :].cpu()
        f9 = outputs.hidden_states[9][:, 1:, :].cpu()
        f12 = outputs.hidden_states[12][:, 1:, :].cpu()
        train_features.append((cls_token, f6, f9, f12, targets))
print(f"Train features extracted in {time.time() - t0:.1f}s.")

# Train decoder and class_head only
for p in m.encoder.parameters():
    p.requires_grad = False
for p in m.fpn.parameters():
    p.requires_grad = False
for p in m.query_mask_proj.parameters():
    p.requires_grad = False
for p in m.semantic_head.parameters():
    p.requires_grad = False
for p in m.bbox_head.parameters():
    p.requires_grad = False
for p in m.scale_head.parameters():
    p.requires_grad = False

m.decoder.requires_grad_(True)
m.query_embed.requires_grad_(True)
m.class_head.requires_grad_(True)

optimizer = torch.optim.AdamW([
    {"params": m.class_head.parameters(), "lr": 1.5e-4},
    {"params": m.decoder.parameters(), "lr": 2.0e-5},
    {"params": m.query_embed.parameters(), "lr": 2.0e-5},
], weight_decay=1e-4)

matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
criterion = ClassBalancedMultiTaskCriterion(
    matcher=matcher,
    class_weights=class_weights,
    num_classes=22,
    weight_class=1.5,
    weight_bbox=5.0,
    weight_giou=2.0,
    weight_mask=2.5,
    weight_scale=0.1,
)

print("\nStarting Fast Phase 1 Training (10 epochs)...", flush=True)
for epoch in range(1, 11):
    t_ep = time.time()
    m.decoder.train()
    m.class_head.train()
    total_loss = 0.0
    total_ce = 0.0

    for cls_token, f6, f9, f12, targets in train_features:
        bs = cls_token.size(0)
        optimizer.zero_grad()

        # Forward through decoder and heads
        queries = m.query_embed.weight.unsqueeze(0).expand(bs, -1, -1)
        hs = m.decoder(tgt=queries, memory=f12)
        pred_logits = m.class_head(hs)
        pred_boxes = m.bbox_head(hs)
        
        # We need mock masks and scale for criterion
        pred_log_scale = m.scale_head(cls_token).squeeze(-1)
        # Bbox and mask heads are frozen, compute mask loss using identity or dummy
        outputs = {
            "pred_logits": pred_logits,
            "pred_boxes": pred_boxes,
            "pred_masks": torch.zeros(bs, 25, 96, 96),
            "pred_log_scale": pred_log_scale,
        }
        loss_dict = criterion(outputs, targets)
        loss = loss_dict["loss_ce"] * 1.5 + loss_dict["loss_bbox"] * 0.1 # emphasize classification
        loss.backward()
        torch.nn.utils.clip_grad_norm_(m.parameters(), 1.0)
        optimizer.step()
        total_loss += loss.item()
        total_ce += loss_dict["loss_ce"].item()

    print(f"Epoch {epoch:02d} [{time.time() - t_ep:.1f}s] | Loss: {total_loss/len(train_features):.4f} | CE: {total_ce/len(train_features):.4f}", flush=True)

# Evaluate on test set
print("\nEvaluating on test set at conf 0.25...", flush=True)
res25 = evaluate_g3a(m, test_loader, device, conf_thresh=0.25, detailed=True)
print(f"Det F1@50: {res25['curve']['iou_50']['det_f1']:.4f} | Sem F1@50: {res25['curve']['iou_50']['sem_f1']:.4f} | Mask Dice: {res25['hungarian_mask_dice']:.4f}")
print("Active classes at conf 0.25:")
for k, v in res25['per_class'].items():
    if v['tp'] > 0 or v['fp'] > 0:
        print(f"  {k:<20}: tp={v['tp']:<3} fp={v['fp']:<4} fn={v['fn']:<4} f1={v['f1']:.4f}")

print("\nEvaluating on test set at conf 0.20...", flush=True)
res20 = evaluate_g3a(m, test_loader, device, conf_thresh=0.20, detailed=True)
print(f"Det F1@50: {res20['curve']['iou_50']['det_f1']:.4f} | Sem F1@50: {res20['curve']['iou_50']['sem_f1']:.4f} | Mask Dice: {res20['hungarian_mask_dice']:.4f}")
print("Active classes at conf 0.20:")
for k, v in res20['per_class'].items():
    if v['tp'] > 0 or v['fp'] > 0:
        print(f"  {k:<20}: tp={v['tp']:<3} fp={v['fp']:<4} fn={v['fp']:<4} f1={v['f1']:.4f}")
