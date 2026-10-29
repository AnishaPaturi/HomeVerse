import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import json
import torch
from floorplan_dataset import FloorplanDataset, LABEL2ID
from run_experiment_f2 import select_balanced_split
from run_experiment_g4b import MultiTaskViT384G4B, rasterize_canonical_instance_masks
from cad_vectorizer import extract_unrefined_polygon, adaptive_polygon_simplification
from metric_calibrator import MetricScaleCalibrator
from ocr_spatial_matcher import OCRSpatialMatcher

with open(repo_root / "HomeVerse-Dataset/annotations/test.json") as f:
    data = json.load(f)

sample = [s for s in data if s.get("image_id") == "homeverse_026864"][0]
img_p = repo_root / "HomeVerse-Dataset" / sample["image_path"]

calibrator = MetricScaleCalibrator()
tokens = calibrator.extract_ocr_tokens(img_p)

# Load G4-B model
model = MultiTaskViT384G4B(img_size=384)
model.load_state_dict(torch.load("checkpoints/multitask/experiment_g4b_best.pt", map_location="cpu"), strict=False)
model.eval()

ds = FloorplanDataset(str(repo_root / "HomeVerse-Dataset"), split="train", img_size=384, mask_size=(96, 96))
ds.samples = [sample]
item = ds[0]
img_tensor = item["image"].unsqueeze(0)

with torch.no_grad():
    outputs = model(img_tensor)

pred_masks_prob = outputs["pred_masks_prob"][0]
pred_logits = outputs["pred_logits"][0]

detected_rooms = []
for q_i in range(pred_masks_prob.size(0)):
    m_prob = pred_masks_prob[q_i].numpy()
    raw = extract_unrefined_polygon(m_prob, orig_size=(512, 512), threshold=0.50)
    if raw and len(raw) >= 3:
        ref = adaptive_polygon_simplification(raw)
        detected_rooms.append({
            "query_id": q_i,
            "room_id": q_i,
            "type": "Room",
            "polygon_pixels": ref,
            "mabr": {"length_px": 150.0, "width_px": 80.0, "aspect_ratio": 150/80},
        })

print(f"Detected {len(detected_rooms)} rooms.")
matcher = OCRSpatialMatcher()
res = matcher.match(tokens, detected_rooms)
print(f"Matched associations: {len(res['matched_associations'])}")
print(f"Ambiguous count: {len(res['ambiguous_annotations'])}")
print(f"Rejected count: {len(res['rejected_annotations'])}")
for amb in res['ambiguous_annotations'][:5]:
    print("  Ambiguous:", amb)
