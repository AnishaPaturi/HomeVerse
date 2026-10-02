"""
Validation Engine for ViT Floor Plan Dimension Predictor
"""

from typing import Dict, Any, Tuple
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from .metrics import calculate_metrics


def validate_epoch(
    model: nn.Module,
    val_loader: DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Tuple[float, Dict[str, float]]:
    """
    Run evaluation on the validation set.
    Returns:
        (avg_val_loss, metrics_dict)
    """
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, room_indices, targets in val_loader:
            images = images.to(device)
            room_indices = room_indices.to(device)
            targets = targets.to(device)

            outputs = model(images, room_indices)
            loss = criterion(outputs, targets)
            total_loss += loss.item() * images.size(0)

            all_preds.append(outputs.cpu().numpy())
            all_targets.append(targets.cpu().numpy())

    avg_loss = total_loss / len(val_loader.dataset)
    pred_arr = np.concatenate(all_preds, axis=0)
    target_arr = np.concatenate(all_targets, axis=0)

    metrics = calculate_metrics(pred_arr, target_arr)
    metrics["val_loss"] = round(avg_loss, 4)

    return avg_loss, metrics
