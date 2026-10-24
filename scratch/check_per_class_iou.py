import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import torch
from torch.utils.data import DataLoader
from run_experiment_f1_fpn import MultiTaskViT384FPN
from run_experiment_f2 import select_balanced_split, InMemoryDataset, collate_fn_with_meta
from floorplan_dataset import FloorplanDataset, ROOM_CLASSES
from vit_detector import box_cxcywh_to_xyxy, box_iou

te_lids, test_samples, _ = select_balanced_split('HomeVerse-Dataset/annotations/test.json', 75)
ds = FloorplanDataset('HomeVerse-Dataset', split='train', img_size=384, mask_size=(96, 96))
ds.samples = test_samples
items = [{**ds[i], 'sample_meta': test_samples[i]} for i in range(len(ds))]
loader = DataLoader(InMemoryDataset(items), batch_size=15, shuffle=False, collate_fn=collate_fn_with_meta)

m = MultiTaskViT384FPN(img_size=384)
m.load_state_dict(torch.load('checkpoints/multitask/experiment_g3a_best.pt', map_location='cpu'))
m.eval()

for conf in [0.25, 0.20]:
    print(f"\n================ CONF {conf} ================")
    for iou_th in [0.25, 0.35, 0.50]:
        class_tp = {c: 0 for c in ROOM_CLASSES}
        class_fp = {c: 0 for c in ROOM_CLASSES}
        class_support = {c: 0 for c in ROOM_CLASSES}
        with torch.no_grad():
            for images, targets in loader:
                outputs = m(images)
                probs = outputs["pred_logits"].softmax(-1)
                boxes = outputs["pred_boxes"]
                for b in range(images.size(0)):
                    tgt_l = targets[b]["labels"]
                    tgt_b = targets[b]["boxes"]
                    for l in tgt_l:
                        if l.item() < len(ROOM_CLASSES):
                            class_support[ROOM_CLASSES[l.item()]] += 1
                    top_scores, top_classes = probs[b].max(-1)
                    keep = (top_classes != 22) & (top_scores >= conf)
                    if not keep.any() or len(tgt_l) == 0:
                        continue
                    p_b = boxes[b, keep]
                    p_l = top_classes[keep]
                    p_s = top_scores[keep]
                    order = p_s.argsort(descending=True)
                    p_b = p_b[order]
                    p_l = p_l[order]
                    p_xy = box_cxcywh_to_xyxy(p_b)
                    t_xy = box_cxcywh_to_xyxy(tgt_b)
                    ious, _ = box_iou(p_xy, t_xy)
                    matched_gt = set()
                    for pi in range(len(p_l)):
                        biou, bgt = ious[pi].max(-1)
                        cname = ROOM_CLASSES[p_l[pi].item()]
                        if biou.item() >= iou_th and bgt.item() not in matched_gt:
                            if p_l[pi].item() == tgt_l[bgt.item()].item():
                                class_tp[cname] += 1
                                matched_gt.add(bgt.item())
                            else:
                                class_fp[cname] += 1
                        else:
                            class_fp[cname] += 1
        print(f"--- IoU >= {iou_th} ---")
        for c in ["Bedroom", "Living Room", "Master Bedroom", "Kitchen", "Kitchen & Dining", "Dining Room", "Bathroom", "Toilet", "Walk-in Closet", "Corridor", "Entrance/Foyer"]:
            print(f"  {c:<18}: TP={class_tp[c]:<3} FP={class_fp[c]:<4} Supp={class_support[c]}")
