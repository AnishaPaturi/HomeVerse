import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import time
import torch
from run_experiment_f1_fpn import MultiTaskViT384FPN
from run_experiment_g3a import ClassBalancedMultiTaskCriterion
from vit_detector import HungarianMatcher

torch.set_num_threads(8)
m = MultiTaskViT384FPN(img_size=384)

# Freeze ViT and FPN
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

trainable = [p for p in m.parameters() if p.requires_grad]
print(f"Trainable params count: {sum(p.numel() for p in trainable)}")

matcher = HungarianMatcher()
crit = ClassBalancedMultiTaskCriterion(matcher, torch.ones(23))
opt = torch.optim.AdamW(trainable, lr=1e-4)

x = torch.randn(7, 3, 384, 384)
targets = [{
    "labels": torch.tensor([1, 5, 8]),
    "boxes": torch.tensor([[0.5, 0.5, 0.2, 0.2], [0.3, 0.3, 0.2, 0.2], [0.7, 0.7, 0.2, 0.2]]),
    "masks": torch.zeros(3, 96, 96),
    "scale_px_per_m": torch.tensor(30.0),
    "has_scale": torch.tensor(1.0),
} for _ in range(7)]

t0 = time.time()
out = m(x)
loss = crit(out, targets)["loss"]
loss.backward()
opt.step()
print(f"1 batch (batch_size=7) step time: {time.time() - t0:.2f}s")
