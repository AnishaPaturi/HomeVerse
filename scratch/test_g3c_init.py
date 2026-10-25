import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
import torch.nn.functional as F
from run_experiment_g3c import MultiTaskViT384FPNRefine, load_g3c_from_g3b, MultiTaskCriterionG3C
from vit_detector import HungarianMatcher
from floorplan_dataset import NUM_ROOM_CLASSES

print("Testing G3-C model creation & G3-B checkpoint warm-start...", flush=True)
model = MultiTaskViT384FPNRefine(img_size=384)
matched, uninit = load_g3c_from_g3b(model, "checkpoints/multitask/experiment_g3b_best.pt", device="cpu")
print(f"Matched keys: {matched}, Uninitialized keys: {uninit}")

# Test forward pass with dummy feature inputs
bs = 2
cls_tok = torch.randn(bs, 768)
f6 = torch.randn(bs, 576, 768)
f9 = torch.randn(bs, 576, 768)
f12 = torch.randn(bs, 576, 768)

model.eval()
with torch.no_grad():
    out = model.forward_with_features(cls_tok, f6, f9, f12)

p_b0 = out["pred_boxes_0"]
p_b1 = out["pred_boxes_1"]
deltas = out["delta_boxes_1"]

print("Delta max abs at step 0:", deltas.abs().max().item())
print("BBox difference between Layer 0 and Layer 1 at step 0:", (p_b1 - p_b0).abs().max().item())
assert deltas.abs().max().item() < 1e-6, "Deltas should be 0 at step 0!"
assert (p_b1 - p_b0).abs().max().item() < 1e-6, "Layer 0 and Layer 1 boxes should match at step 0!"

# Test backward pass and gradient flow
model.train()
outputs = model.forward_with_features(cls_tok, f6, f9, f12)
matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
criterion = MultiTaskCriterionG3C(matcher=matcher, num_classes=NUM_ROOM_CLASSES)

targets = [
    {
        "labels": torch.tensor([0, 1]),
        "boxes": torch.tensor([[0.5, 0.5, 0.3, 0.3], [0.2, 0.3, 0.1, 0.1]]),
        "masks": torch.zeros((2, 96, 96)),
        "scale_px_per_m": torch.tensor([50.0]),
        "has_scale": torch.tensor([1]),
    },
    {
        "labels": torch.tensor([2]),
        "boxes": torch.tensor([[0.7, 0.6, 0.2, 0.4]]),
        "masks": torch.zeros((1, 96, 96)),
        "scale_px_per_m": torch.tensor([50.0]),
        "has_scale": torch.tensor([1]),
    }
]

loss_dict = criterion(outputs, targets)
print("Loss breakdown at step 0:")
for k, v in loss_dict.items():
    print(f"  {k}: {v.item():.4f}")

loss_dict["loss"].backward()

grad_head_0 = model.bbox_head_0[4].weight.grad
grad_head_1 = model.bbox_head_1[4].weight.grad

print("Gradient on bbox_head_0 (norm):", grad_head_0.norm().item())
print("Gradient on bbox_head_1 (norm):", grad_head_1.norm().item())

assert grad_head_0 is not None and grad_head_0.norm().item() > 0, "No gradients on bbox_head_0!"
assert grad_head_1 is not None and grad_head_1.norm().item() > 0, "No gradients on bbox_head_1!"

print("\nALL G3-C INITIALIZATION & BACKWARD SANITY CHECKS PASSED PERFECTLY!", flush=True)
