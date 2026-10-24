import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import torch
from floorplan_dataset import FloorplanDataset, NUM_ROOM_CLASSES, NO_ROOM_ID
from vit_detector import box_cxcywh_to_xyxy, box_iou
from run_experiment_g3b import MultiTaskViT384FPNTwoScale
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta
from torch.utils.data import DataLoader

_, test_samples, _ = select_balanced_split('HomeVerse-Dataset/annotations/test.json', 75)
ds = FloorplanDataset('HomeVerse-Dataset', split='train', img_size=384, mask_size=(96, 96))
ds.samples = test_samples
items = []
for i in range(len(ds)):
    it = ds[i]
    it['sample_meta'] = test_samples[i]
    items.append(it)

test_loader = DataLoader(InMemoryDataset(items), batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

m = MultiTaskViT384FPNTwoScale(img_size=384)
m.load_state_dict(torch.load('checkpoints/multitask/experiment_g3b_best.pt', map_location='cpu'), strict=False)
m.eval()

small_det_matched = {0.25: 0, 0.35: 0, 0.50: 0}
small_support = 0

all_det_matched = {0.25: 0, 0.35: 0, 0.50: 0}
all_support = 0

with torch.no_grad():
    for images, targets in test_loader:
        out = m(images)
        p_boxes = out['pred_boxes']
        probs = out['pred_logits'].softmax(-1)
        for b in range(len(targets)):
            top_s, top_c = probs[b].max(-1)
            keep = (top_c != NO_ROOM_ID) & (top_s >= 0.20)
            fg_boxes = p_boxes[b, keep]
            tgt_boxes = targets[b]['boxes']
            meta = targets[b]['sample_meta']
            rooms = meta.get('rooms', [])
            all_support += len(tgt_boxes)
            for r_idx, r in enumerate(rooms):
                if r_idx >= len(tgt_boxes):
                    continue
                area = r.get('area_m2', r.get('dimensions', {}).get('area_m2', 10.0))
                is_small = (area < 6.0)
                if is_small:
                    small_support += 1
                if len(fg_boxes) > 0:
                    ious, _ = box_iou(box_cxcywh_to_xyxy(fg_boxes), box_cxcywh_to_xyxy(tgt_boxes[r_idx:r_idx+1]))
                    max_iou = ious.max().item()
                    for th in [0.25, 0.35, 0.50]:
                        if max_iou >= th:
                            all_det_matched[th] += 1
                            if is_small:
                                small_det_matched[th] += 1

print(f'Total Rooms: {all_support} | Total Small Rooms (<6m²): {small_support}')
for th in [0.25, 0.35, 0.50]:
    rec_all = all_det_matched[th] / max(1, all_support)
    rec_small = small_det_matched[th] / max(1, small_support)
    print(f'Class-Agnostic Overall Recall @ IoU {th:.2f} (conf 0.20): {all_det_matched[th]} / {all_support} ({rec_all*100:.2f}%)')
    print(f'Class-Agnostic Small Room Recall @ IoU {th:.2f} (conf 0.20): {small_det_matched[th]} / {small_support} ({rec_small*100:.2f}%)')
