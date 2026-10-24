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
from run_experiment_g3a import compute_sqrt_class_weights, evaluate_g3a

torch.set_num_threads(8)
device = torch.device("cpu")

print("Loading test dataset and model...", flush=True)
te_lids, test_samples, _ = select_balanced_split('HomeVerse-Dataset/annotations/test.json', 75)
ds_test = FloorplanDataset('HomeVerse-Dataset', split='train', img_size=384, mask_size=(96, 96))
ds_test.samples = test_samples
items_test = [{**ds_test[i], 'sample_meta': test_samples[i]} for i in range(len(ds_test))]
test_loader = DataLoader(InMemoryDataset(items_test), batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

m = MultiTaskViT384FPN(img_size=384).to(device)
m.load_state_dict(torch.load('checkpoints/multitask/experiment_f2a_best.pt', map_location=device))
m.eval()

res = evaluate_g3a(m, test_loader, device, conf_thresh=0.25, detailed=True)
print(f"F2-A Baseline Test Metrics:")
print(f"Det F1@50: {res['curve']['iou_50']['det_f1']:.4f} | Sem F1@50: {res['curve']['iou_50']['sem_f1']:.4f} | Dice: {res['hungarian_mask_dice']:.4f}")
print(f"Bedroom FP: {res['per_class']['Bedroom']['fp']} | Kitchen TP: {res['per_class']['Kitchen']['tp']} | Toilet TP: {res['per_class']['Toilet']['tp']}")
