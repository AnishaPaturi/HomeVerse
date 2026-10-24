import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import torch
import numpy as np
from torch.utils.data import DataLoader
from run_experiment_f1_fpn import MultiTaskViT384FPN
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta
from floorplan_dataset import FloorplanDataset, ROOM_CLASSES, NO_ROOM_ID
from run_experiment_g3a import evaluate_g3a

te_lids, test_samples, _ = select_balanced_split('HomeVerse-Dataset/annotations/test.json', 75)
ds = FloorplanDataset('HomeVerse-Dataset', split='train', img_size=384, mask_size=(96, 96))
ds.samples = test_samples
items = [{**ds[i], 'sample_meta': test_samples[i]} for i in range(len(ds))]
loader = DataLoader(InMemoryDataset(items), batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

m = MultiTaskViT384FPN(img_size=384)
m.load_state_dict(torch.load('checkpoints/multitask/experiment_g3a_best.pt', map_location='cpu'))

res = evaluate_g3a(m, loader, torch.device('cpu'), conf_thresh=0.20, detailed=True)
cm = np.array(res['confusion_matrix'])

print("Confusion analysis for target classes (rows = GT, cols = Pred):")
for target_name in ["Kitchen", "Dining Room", "Toilet", "Walk-in Closet", "Bathroom", "Bedroom", "Living Room"]:
    t_id = ROOM_CLASSES.index(target_name)
    row = cm[t_id]
    total_gt = row.sum()
    pred_dist = []
    for p_id in range(len(ROOM_CLASSES)):
        if row[p_id] > 0:
            pred_dist.append(f"{ROOM_CLASSES[p_id]}: {row[p_id]}")
    if row[NO_ROOM_ID] > 0:
        pred_dist.append(f"Unmatched/Background: {row[NO_ROOM_ID]}")
    print(f"GT {target_name:<16} (total={total_gt}): {', '.join(pred_dist)}")
