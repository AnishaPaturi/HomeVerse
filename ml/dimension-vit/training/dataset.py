"""
PyTorch Dataset and DataLoader for Floor Plan Dimension Training
Extracts floor plan images, room conditioning tokens, and metric ground-truth targets.
"""

import os
import json
import random
from typing import List, Dict, Any, Tuple
from PIL import Image

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

try:
    from ..models.vit_dimension import ROOM_TO_IDX, ROOM_TYPES
except (ImportError, ValueError):
    from models.vit_dimension import ROOM_TO_IDX, ROOM_TYPES


# Standard ImageNet normalization parameters
IMAGE_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
IMAGE_STD = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)


def preprocess_image(img: Image.Image, img_size: int = 224) -> torch.Tensor:
    """Preprocess PIL image to normalized (3, H, W) float32 tensor."""
    img = img.convert("RGB")
    if img.size != (img_size, img_size):
        img = img.resize((img_size, img_size), Image.Resampling.BILINEAR)

    arr = np.asarray(img, dtype=np.float32) / 255.0
    tensor = torch.from_numpy(arr).permute(2, 0, 1)
    tensor = (tensor - IMAGE_MEAN) / IMAGE_STD
    return tensor


class FloorPlanDimensionDataset(Dataset):
    """
    Dataset yielding (image_tensor, room_index, target_metrics)
    where target_metrics is [width_m, height_m, area_sqm, confidence_target=1.0].
    """
    def __init__(
        self,
        plan_ids: List[str],
        data_dir: str,
        img_size: int = 224,
        include_overall: bool = True
    ):
        self.data_dir = data_dir
        self.img_size = img_size
        self.samples: List[Dict[str, Any]] = []
        self._cache: Dict[str, torch.Tensor] = {}

        images_dir = os.path.join(data_dir, "images")
        annotations_dir = os.path.join(data_dir, "annotations")

        for pid in plan_ids:
            json_path = os.path.join(annotations_dir, f"{pid}.json")
            img_path = os.path.join(images_dir, f"{pid}.png")

            if not os.path.exists(json_path) or not os.path.exists(img_path):
                continue

            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Sample 1: Overall Building Envelope
            if include_overall:
                self.samples.append({
                    "img_path": img_path,
                    "room_name": "Overall Building",
                    "room_idx": ROOM_TO_IDX["Overall Building"],
                    "width_m": float(data.get("total_width_m", 10.0)),
                    "height_m": float(data.get("total_height_m", 10.0)),
                    "area_sqm": float(data.get("total_area_sqm", 100.0)),
                    "confidence": 1.0
                })

            # Samples 2..N: Individual Rooms
            for room in data.get("rooms", []):
                name = room.get("name", "Living Room")
                if name not in ROOM_TO_IDX:
                    continue

                w = float(room.get("width_m", 4.0))
                h = float(room.get("height_m", 4.0))
                a = float(room.get("area_sqm", w * h))

                self.samples.append({
                    "img_path": img_path,
                    "room_name": name,
                    "room_idx": ROOM_TO_IDX[name],
                    "width_m": w,
                    "height_m": h,
                    "area_sqm": a,
                    "confidence": 1.0
                })

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        sample = self.samples[idx]
        img_path = sample["img_path"]
        if img_path not in self._cache:
            img = Image.open(img_path)
            self._cache[img_path] = preprocess_image(img, img_size=self.img_size)
        img_tensor = self._cache[img_path]

        room_idx = torch.tensor(sample["room_idx"], dtype=torch.long)
        targets = torch.tensor([
            sample["width_m"],
            sample["height_m"],
            sample["area_sqm"],
            sample["confidence"]
        ], dtype=torch.float32)

        return img_tensor, room_idx, targets


def create_dataloaders(
    data_dir: str,
    img_size: int = 224,
    batch_size: int = 8,
    train_split: float = 0.8,
    seed: int = 42
) -> Tuple[DataLoader, DataLoader]:
    """
    Split available plans into train/val partitions without data leakage,
    returning train and val DataLoaders.
    """
    annotations_dir = os.path.join(data_dir, "annotations")
    all_files = [f for f in os.listdir(annotations_dir) if f.endswith(".json")]
    plan_ids = sorted([os.path.splitext(f)[0] for f in all_files])

    random.seed(seed)
    shuffled_ids = plan_ids.copy()
    random.shuffle(shuffled_ids)

    split_idx = int(len(shuffled_ids) * train_split)
    train_ids = shuffled_ids[:split_idx]
    val_ids = shuffled_ids[split_idx:]

    train_ds = FloorPlanDimensionDataset(train_ids, data_dir=data_dir, img_size=img_size)
    val_ds = FloorPlanDimensionDataset(val_ids, data_dir=data_dir, img_size=img_size)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, drop_last=False)

    return train_loader, val_loader
