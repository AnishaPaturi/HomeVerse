import json
from pathlib import Path
from PIL import Image
import torch
from torch.utils.data import Dataset
from torchvision import transforms

ROOM_CLASSES = [
    "Living Room", "Kitchen", "Dining Room", "Kitchen & Dining",
    "Master Bedroom", "Bedroom", "Children's Bedroom", "Guest Bedroom",
    "Bathroom", "Toilet", "Study Room", "Office", "Utility Room",
    "Laundry Room", "Balcony", "Terrace", "Corridor", "Entrance/Foyer",
    "Storage Room", "Walk-in Closet", "Garage", "Staircase",
]
NUM_ROOM_CLASSES = len(ROOM_CLASSES)
NO_ROOM_ID = NUM_ROOM_CLASSES  # Background / no-object class = 22

LABEL2ID = {name: idx for idx, name in enumerate(ROOM_CLASSES)}
ID2LABEL = {idx: name for idx, name in enumerate(ROOM_CLASSES)}

DEFAULT_IMAGE_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


class FloorplanDataset(Dataset):
    """
    Dataset for full uncropped floor-plan images and multi-room annotations.
    """
    def __init__(self, data_root, split="train", transform=None, max_samples=None):
        self.data_root = Path(data_root)
        self.split = split
        self.transform = transform or DEFAULT_IMAGE_TRANSFORM

        ann_file = self.data_root / "annotations" / f"{split}.json"
        if not ann_file.exists():
            raise FileNotFoundError(f"Annotation file not found: {ann_file}")

        with open(ann_file, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        if max_samples is not None:
            raw_data = raw_data[:max_samples]

        self.samples = raw_data

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        ann = self.samples[idx]
        img_path = self.data_root / ann["image_path"]
        image = Image.open(img_path).convert("RGB")
        img_tensor = self.transform(image)

        boxes = []
        labels = []
        widths_m = []
        lengths_m = []
        areas_m2 = []

        for room in ann["rooms"]:
            rtype = room["type"]
            if rtype not in LABEL2ID:
                continue

            # Normalized bbox: [x, y, w, h] (top-left)
            bbox = room["bbox"]
            if isinstance(bbox, dict):
                bx, by, bw, bh = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
            else:
                bx, by, bw, bh = bbox[0], bbox[1], bbox[2], bbox[3]

            # Convert to center format [cx, cy, w, h]
            cx = bx + bw / 2.0
            cy = by + bh / 2.0
            boxes.append([cx, cy, bw, bh])
            labels.append(LABEL2ID[rtype])

            widths_m.append(room.get("width_m", room.get("dimensions", {}).get("width_m", 0.0)))
            lengths_m.append(room.get("length_m", room.get("dimensions", {}).get("length_m", 0.0)))
            areas_m2.append(room.get("area_m2", room.get("dimensions", {}).get("area_m2", 0.0)))

        num_rooms = len(labels)
        if num_rooms > 0:
            boxes_t = torch.tensor(boxes, dtype=torch.float32)
            labels_t = torch.tensor(labels, dtype=torch.long)
            widths_m_t = torch.tensor(widths_m, dtype=torch.float32)
            lengths_m_t = torch.tensor(lengths_m, dtype=torch.float32)
            areas_m2_t = torch.tensor(areas_m2, dtype=torch.float32)
        else:
            boxes_t = torch.zeros((0, 4), dtype=torch.float32)
            labels_t = torch.zeros((0,), dtype=torch.long)
            widths_m_t = torch.zeros((0,), dtype=torch.float32)
            lengths_m_t = torch.zeros((0,), dtype=torch.float32)
            areas_m2_t = torch.zeros((0,), dtype=torch.float32)

        scale_mode = ann.get("scale_mode", "no-scale")
        has_scale = (scale_mode != "no-scale")
        raw_scale = ann.get("pixels_per_meter")
        if raw_scale is None:
            raw_scale = ann.get("raw_pixels_per_meter", 0.0)

        scale_t = torch.tensor(raw_scale if has_scale else 0.0, dtype=torch.float32)
        has_scale_t = torch.tensor(1.0 if has_scale else 0.0, dtype=torch.float32)

        return {
            "image": img_tensor,
            "boxes": boxes_t,
            "labels": labels_t,
            "widths_m": widths_m_t,
            "lengths_m": lengths_m_t,
            "areas_m2": areas_m2_t,
            "scale_px_per_m": scale_t,
            "has_scale": has_scale_t,
            "scale_mode": scale_mode,
            "image_id": ann["image_id"],
            "layout_id": ann["layout_id"],
        }


def collate_fn(batch):
    """
    Collate variable number of rooms per image.
    """
    images = torch.stack([item["image"] for item in batch], dim=0)
    targets = []
    for item in batch:
        targets.append({
            "boxes": item["boxes"],
            "labels": item["labels"],
            "widths_m": item["widths_m"],
            "lengths_m": item["lengths_m"],
            "areas_m2": item["areas_m2"],
            "scale_px_per_m": item["scale_px_per_m"],
            "has_scale": item["has_scale"],
            "scale_mode": item["scale_mode"],
            "image_id": item["image_id"],
            "layout_id": item["layout_id"],
        })
    return images, targets
