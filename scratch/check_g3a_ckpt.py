import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import torch
from torch.utils.data import DataLoader
from run_experiment_f1_fpn import MultiTaskViT384FPN
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta
from floorplan_dataset import FloorplanDataset, ROOM_CLASSES
from run_experiment_g3a import evaluate_g3a

te_lids, test_samples, _ = select_balanced_split('HomeVerse-Dataset/annotations/test.json', 75)
ds = FloorplanDataset('HomeVerse-Dataset', split='train', img_size=384, mask_size=(96, 96))
ds.samples = test_samples
items = [{**ds[i], 'sample_meta': test_samples[i]} for i in range(len(ds))]
loader = DataLoader(InMemoryDataset(items), batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

m = MultiTaskViT384FPN(img_size=384)
m.load_state_dict(torch.load('checkpoints/multitask/experiment_g3a_best.pt', map_location='cpu'))

for conf in [0.25, 0.20, 0.15, 0.10]:
    res = evaluate_g3a(m, loader, torch.device('cpu'), conf_thresh=conf, detailed=True)
    print(f"\n=== CONF THRESHOLD {conf} ===")
    print(f"Det F1@50: {res['curve']['iou_50']['det_f1']:.4f} | Sem F1@50: {res['curve']['iou_50']['sem_f1']:.4f} | Mask Dice: {res['hungarian_mask_dice']:.4f}")
    print("Pred class distribution (across all queries):")
    for k, v in sorted(res['pred_class_distribution'].items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {k:<20}: {v}")
    print("Active Classes (TP/FP/FN):")
    for k, v in res['per_class'].items():
        if v['tp'] > 0 or v['fp'] > 0:
            print(f"  {k:<20}: tp={v['tp']:<4} fp={v['fp']:<4} fn={v['fn']:<4} f1={v['f1']:.4f}")
