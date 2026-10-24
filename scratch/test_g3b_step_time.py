import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import time
import torch
from run_experiment_g3b import MultiTaskViT384FPNTwoScale, MultiTaskCriterionF2A
from vit_detector import HungarianMatcher

torch.set_num_threads(8)
m = MultiTaskViT384FPNTwoScale(img_size=384)

# ViT blocks 1-8 frozen
for p in m.encoder.embeddings.parameters():
    p.requires_grad = False
vit_layers = m.encoder.encoder.layer if hasattr(m.encoder, "encoder") else m.encoder.layers
for layer in vit_layers[:8]:
    for p in layer.parameters():
        p.requires_grad = False
for layer in vit_layers[8:]:
    for p in layer.parameters():
        p.requires_grad = True

trainable = [p for p in m.parameters() if p.requires_grad]
print(f"Trainable params count: {sum(p.numel() for p in trainable):,}")

matcher = HungarianMatcher()
crit = MultiTaskCriterionF2A(matcher)
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
step_time = time.time() - t0
print(f"1 batch (batch_size=7) step time for G3-B: {step_time:.2f}s")
print(f"Projected 1 epoch (150 batches): {step_time * 150 / 60:.1f} minutes")
