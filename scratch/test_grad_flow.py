import json
import torch
from floorplan_dataset import FloorplanDataset, collate_fn
from multitask_vit import MultiTaskViT, MultiTaskCriterion
from vit_detector import HungarianMatcher
from torch.utils.data import DataLoader

def test_grad_flow():
    ds = FloorplanDataset('HomeVerse-Dataset', split='train', img_size=224, max_samples=2)
    with open('HomeVerse-Mini/annotations/train.json') as f:
        ds.samples = json.load(f)[:2]

    loader = DataLoader(ds, batch_size=2, collate_fn=collate_fn)
    model = MultiTaskViT(img_size=224)
    matcher = HungarianMatcher()
    crit = MultiTaskCriterion(matcher=matcher)

    for p in model.encoder.parameters():
        p.requires_grad = False
    model.encoder.eval()

    opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=1e-3)
    model.train()

    print("Running 5 gradient descent steps on 2 samples...")
    for step in range(1, 6):
        for imgs, tgts in loader:
            opt.zero_grad()
            outs = model(imgs)
            ld = crit(outs, tgts)
            ld['loss'].backward()
            opt.step()
            print(f"Step {step}: Total Loss={ld['loss'].item():.4f} | CE={ld['loss_ce'].item():.4f} | Box={ld['loss_bbox'].item():.4f} | Mask={ld['loss_mask'].item():.4f} | Scale={ld['loss_scale'].item():.4f}")

if __name__ == "__main__":
    test_grad_flow()
