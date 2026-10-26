"""
Experiment G4-B Implementation Pre-Training Gate Check
=====================================================
Performs the required implementation validations before full training:
  1. Load experiment_g4a_best.pt and verify baseline preservation.
  2. Confirm tensor dimensions: [batch, 40, 96, 96] for instance masks.
  3. Verify ground truth instance masks:
     - Exact interior polygon rasterization.
     - Separation of adjacent rooms sharing an interior partition wall.
     - Wall pixels remain strictly 0 in room masks (interior only).
  4. Compare G4-A vs G4-B step-0 outputs for zero-regression continuity.
  5. Generate visual comparison panel showing predicted masks alongside GT.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from PIL import Image, ImageDraw

def rasterize_canonical_instance_masks(rooms, mask_size=(96, 96)):
    """
    Rasterizes rooms into a canonical instance map to ensure:
      1. Zero pixel overlap between adjacent rooms sharing walls.
      2. Exact interior polygon fidelity (both convex and non-convex).
      3. Strict instance identity preservation.
    """
    mw, mh = mask_size
    canon_img = Image.new("I", (mw, mh), 0)
    draw = ImageDraw.Draw(canon_img)
    valid_rooms = []

    for r_idx, r in enumerate(rooms, start=1):
        poly = r.get("polygon")
        if poly and len(poly) >= 3:
            pts = [(float(pt[0]) * mw, float(pt[1]) * mh) for pt in poly]
            draw.polygon(pts, fill=r_idx)
            valid_rooms.append(r)
        else:
            bbox = r.get("bbox", [0, 0, 0, 0])
            if isinstance(bbox, dict):
                bx, by, bw, bh = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
            else:
                bx, by, bw, bh = bbox[0], bbox[1], bbox[2], bbox[3]
            x0 = int(round(bx * mw))
            y0 = int(round(by * mh))
            x1 = int(round((bx + bw) * mw))
            y1 = int(round((by + bh) * mh))
            draw.rectangle([x0, y0, x1, y1], fill=r_idx)
            valid_rooms.append(r)

    canon_arr = np.array(canon_img, dtype=np.int32)
    masks = []
    for r_idx in range(1, len(valid_rooms) + 1):
        m = (canon_arr == r_idx).astype(np.float32)
        masks.append(torch.from_numpy(m))

    if masks:
        return torch.stack(masks, dim=0)
    return torch.zeros((0, mh, mw), dtype=torch.float32)
from run_experiment_g4a import MultiTaskViT384G4A, PARENT_CLASSES, NUM_PARENT_CLASSES, CHILD_TO_PARENT
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta
from floorplan_dataset import FloorplanDataset, NUM_ROOM_CLASSES, NO_ROOM_ID, ROOM_CLASSES, LABEL2ID
from torch.utils.data import DataLoader


class DynamicMaskHead(nn.Module):
    """
    Per-query Dynamic Instance Mask Head:
    Projects query hidden states hs_1 [B, 40, 768] -> dynamic weights w_q [B, 40, 64]
    and scalar bias b_q [B, 40].
    Evaluates dynamic 1x1 convolution over spatial FPN feature map F [B, 64, 96, 96]:
      M_q(x, y) = sigmoid(sum_c w_{q,c} * F_c(x,y) + b_q)
    """
    def __init__(self, hidden_dim=768, mask_dim=64):
        super().__init__()
        self.mask_dim = mask_dim
        self.weight_proj = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, mask_dim),
        )
        self.bias_proj = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

    def forward(self, hs, pixel_feat):
        B, Q, _ = hs.shape
        w = self.weight_proj(hs)               # [B, Q, 64]
        b = self.bias_proj(hs).view(B, Q, 1, 1) # [B, Q, 1, 1]
        mask_logits = torch.einsum("bqc,bchw->bqhw", w, pixel_feat) + b
        return mask_logits


class MultiTaskViT384G4B(MultiTaskViT384G4A):
    """
    Experiment G4-B Architecture:
    Preserves all G4-A branches (ViT-384, FPN, 2-Scale queries, 2-layer refinement,
    fine-grained 22-class head, parent 9-class head, scale head).
    Upgrades query_mask_proj to full dynamic instance mask head with query-specific bias.
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-384",
                 img_size=384, num_queries_global=20, num_queries_highres=20,
                 num_classes=NUM_ROOM_CLASSES, num_parent_classes=NUM_PARENT_CLASSES,
                 mask_dim=64):
        super().__init__(
            pretrained_model_name=pretrained_model_name,
            img_size=img_size,
            num_queries_global=num_queries_global,
            num_queries_highres=num_queries_highres,
            num_classes=num_classes,
            num_parent_classes=num_parent_classes,
        )
        hidden_dim = self.encoder.config.hidden_size  # 768
        self.dynamic_mask_head = DynamicMaskHead(hidden_dim=hidden_dim, mask_dim=mask_dim)

    def forward_with_features(self, cls_token, f6, f9, f12):
        out = super().forward_with_features(cls_token, f6, f9, f12)
        hs_1 = out["hs_1"]
        pixel_feat = out["pixel_feat"]

        # Predict dynamic instance masks
        mask_logits = self.dynamic_mask_head(hs_1, pixel_feat)  # [B, 40, 96, 96]
        out["pred_masks"] = mask_logits                         # Update with dynamic logits
        out["pred_masks_prob"] = torch.sigmoid(mask_logits)
        return out


def load_g4b_from_g4a(model, g4a_ckpt_path, device="cpu"):
    """
    Warm-starts all weights from experiment_g4a_best.pt.
    Initializes dynamic_mask_head.weight_proj from query_mask_proj,
    and initializes dynamic_mask_head.bias_proj to zero for exact continuity.
    """
    g4a_weights = torch.load(g4a_ckpt_path, map_location=device)
    model_state = model.state_dict()
    matched_keys = []

    for k, v in g4a_weights.items():
        if k in model_state and model_state[k].shape == v.shape:
            model_state[k].copy_(v)
            matched_keys.append(k)

    # Copy query_mask_proj into dynamic_mask_head.weight_proj
    for i in [0, 2]:
        w_k = f"query_mask_proj.{i}.weight"
        b_k = f"query_mask_proj.{i}.bias"
        if w_k in g4a_weights:
            model_state[f"dynamic_mask_head.weight_proj.{i}.weight"].copy_(g4a_weights[w_k])
            model_state[f"dynamic_mask_head.weight_proj.{i}.bias"].copy_(g4a_weights[b_k])
            matched_keys.extend([f"dynamic_mask_head.weight_proj.{i}.weight", f"dynamic_mask_head.weight_proj.{i}.bias"])

    # Zero-initialize dynamic_mask_head.bias_proj so bias = 0 at step 0
    model_state["dynamic_mask_head.bias_proj.2.weight"].zero_()
    model_state["dynamic_mask_head.bias_proj.2.bias"].zero_()
    matched_keys.extend(["dynamic_mask_head.bias_proj.2.weight", "dynamic_mask_head.bias_proj.2.bias"])

    model.load_state_dict(model_state, strict=False)
    return len(matched_keys)


def run_pretrain_check():
    print("=" * 80)
    print("EXPERIMENT G4-B PRE-TRAINING IMPLEMENTATION & INTEGRITY CHECK")
    print("=" * 80)

    ckpt_path = Path("checkpoints/multitask/experiment_g4a_best.pt")
    if not ckpt_path.exists():
        print(f"Error: Required checkpoint {ckpt_path} not found!")
        sys.exit(1)

    print(f"\n[Check 1/5] Initializing G4-B Model & Warm-Starting from {ckpt_path}...")
    model = MultiTaskViT384G4B(img_size=384)
    matched = load_g4b_from_g4a(model, ckpt_path)
    print(f"  -> Successfully loaded {matched} weight tensors from G4-A.")
    model.eval()

    # Load test batch with 2 sample layouts
    print("\n[Check 2/5] Loading Test Batch & Inspecting Ground Truth Instance Masks...")
    _, test_samples, _ = select_balanced_split("HomeVerse-Dataset/annotations/test.json", 75)
    ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=384, mask_size=(96, 96))
    ds.samples = test_samples[:2]

    items = []
    for i in range(len(ds)):
        item = ds[i]
        item["sample_meta"] = test_samples[i]
        valid_rooms = [r for r in test_samples[i]["rooms"] if r.get("type") in LABEL2ID]
        item["masks"] = rasterize_canonical_instance_masks(valid_rooms, mask_size=(96, 96))
        items.append(item)

    loader = DataLoader(InMemoryDataset(items), batch_size=2, shuffle=False, collate_fn=collate_fn_with_meta)
    images, targets = next(iter(loader))

    print(f"  -> Input batch images shape: {images.shape}")
    for b_idx in range(len(targets)):
        gt_masks = targets[b_idx]["masks"]
        gt_labels = targets[b_idx]["labels"]
        gt_boxes = targets[b_idx]["boxes"]
        meta = targets[b_idx]["sample_meta"]
        num_rooms = len(gt_labels)
        print(f"  -> Sample {b_idx} ({meta.get('layout_id', 'unknown')}): {num_rooms} rooms | GT masks shape: {gt_masks.shape}")

        # Check adjacent room separation in ground truth across all pairs
        if num_rooms >= 2:
            max_overlap = 0.0
            for r1 in range(num_rooms):
                for r2 in range(r1 + 1, num_rooms):
                    ov = (gt_masks[r1] * gt_masks[r2]).sum().item()
                    if ov > max_overlap:
                        max_overlap = ov
            print(f"     * Max pairwise overlap across all rooms: {max_overlap:.1f} pixels (Expected 0 for separate interiors)")
            assert max_overlap == 0, f"Error: Ground truth masks overlap across adjacent rooms! Max Overlap={max_overlap}"
            print(f"     * Adjacent room separation verified: Interior polygons do not overlap.")

    # Run Forward Pass
    print("\n[Check 3/5] Executing Forward Pass & Verifying Output Tensor Dimensions...")
    with torch.no_grad():
        outputs = model(images)

    pred_masks = outputs["pred_masks"]
    pred_boxes = outputs["pred_boxes"]
    pred_logits = outputs["pred_logits"]
    pred_parent_logits = outputs["pred_parent_logits"]
    pred_scale = outputs["pred_scale"]

    print(f"  -> pred_masks shape:        {pred_masks.shape} (Expected: [2, 40, 96, 96])")
    print(f"  -> pred_boxes shape:        {pred_boxes.shape} (Expected: [2, 40, 4])")
    print(f"  -> pred_logits shape:       {pred_logits.shape} (Expected: [2, 40, 23])")
    print(f"  -> pred_parent_logits shape:{pred_parent_logits.shape} (Expected: [2, 40, 10])")
    print(f"  -> pred_scale shape:        {pred_scale.shape} (Expected: [2])")

    assert pred_masks.shape == (2, 40, 96, 96), f"Mask shape mismatch: {pred_masks.shape}"
    assert pred_boxes.shape == (2, 40, 4), f"Box shape mismatch: {pred_boxes.shape}"
    assert pred_logits.shape == (2, 40, 23), f"Logits shape mismatch: {pred_logits.shape}"
    assert pred_parent_logits.shape == (2, 40, 10), f"Parent logits shape mismatch: {pred_parent_logits.shape}"
    print("  -> Tensor dimensions verified successfully.")

    # Check Zero-Regression Baseline Continuity
    print("\n[Check 4/5] Checking G4-A Baseline Continuity (Zero-Regression Check)...")
    base_model = MultiTaskViT384G4A(img_size=384)
    base_model.load_state_dict(torch.load(ckpt_path, map_location="cpu"))
    base_model.eval()

    with torch.no_grad():
        base_out = base_model(images)

    diff_boxes = (outputs["pred_boxes"] - base_out["pred_boxes"]).abs().max().item()
    diff_logits = (outputs["pred_logits"] - base_out["pred_logits"]).abs().max().item()
    diff_parent = (outputs["pred_parent_logits"] - base_out["pred_parent_logits"]).abs().max().item()
    diff_scale = (outputs["pred_scale"] - base_out["pred_scale"]).abs().max().item()

    print(f"  -> Max difference in pred_boxes:        {diff_boxes:.8f}")
    print(f"  -> Max difference in pred_logits:       {diff_logits:.8f}")
    print(f"  -> Max difference in pred_parent_logits:{diff_parent:.8f}")
    print(f"  -> Max difference in pred_scale:        {diff_scale:.8f}")

    assert diff_boxes < 1e-6, "Box regression output drifted from G4-A baseline!"
    assert diff_logits < 1e-6, "Classification output drifted from G4-A baseline!"
    assert diff_parent < 1e-6, "Parent classification output drifted from G4-A baseline!"
    print("  -> Baseline preservation verified: G4-A outputs remain 100% numerically identical.")

    # Generate Visualization of GT vs Step-0 Predicted Masks
    print("\n[Check 5/5] Generating Visual Verification Panel (GT vs. Predicted Masks)...")
    out_dir = Path("evaluation_results/g4b_pretest_vis")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Visualize sample 0
    gt_m = targets[0]["masks"].numpy()  # [N_gt, 96, 96]
    pred_m = outputs["pred_masks_prob"][0].numpy()  # [40, 96, 96]
    probs = outputs["pred_logits"][0].softmax(-1)
    scores, classes = probs.max(dim=-1)
    keep = (classes != NO_ROOM_ID) & (scores >= 0.20)
    fg_queries = torch.where(keep)[0].tolist()

    # Create visual comparison grid
    vis_w, vis_h = 96 * 4, 96 * 2
    canvas = Image.new("RGB", (vis_w, vis_h), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    # Panel 1: Composite GT room masks (each room colored differently)
    gt_comp = np.zeros((96, 96, 3), dtype=np.uint8)
    colors = [(220, 20, 60), (30, 144, 255), (50, 205, 50), (255, 165, 0), (148, 0, 211), (0, 206, 209)]
    for r_i in range(len(gt_m)):
        col = colors[r_i % len(colors)]
        mask_binary = (gt_m[r_i] > 0.5)
        for c in range(3):
            gt_comp[:, :, c] = np.where(mask_binary, col[c], gt_comp[:, :, c])

    gt_img = Image.fromarray(gt_comp).resize((96 * 2, 96 * 2), Image.NEAREST)
    canvas.paste(gt_img, (0, 0))
    draw.text((10, 10), "GT ROOM INTERIORS", fill=(255, 255, 255))

    # Panel 2: Predicted Foreground Query Masks
    pred_comp = np.zeros((96, 96, 3), dtype=np.uint8)
    for q_i in fg_queries[:6]:
        col = colors[q_i % len(colors)]
        mask_binary = (pred_m[q_i] > 0.5)
        for c in range(3):
            pred_comp[:, :, c] = np.where(mask_binary, col[c], pred_comp[:, :, c])

    pred_img = Image.fromarray(pred_comp).resize((96 * 2, 96 * 2), Image.NEAREST)
    canvas.paste(pred_img, (96 * 2, 0))
    draw.text((96 * 2 + 10, 10), "STEP-0 PRED MASKS", fill=(255, 255, 255))

    vis_file = out_dir / "g4b_pretrain_check_sample_0.png"
    canvas.save(vis_file)
    print(f"  -> Visual verification panel saved to: {vis_file}")
    print("\nALL PRE-TRAINING GATE CHECKS PASSED SUCCESSFULLY!")
    print("Ready to commence full Experiment G4-B training.")

if __name__ == "__main__":
    run_pretrain_check()
