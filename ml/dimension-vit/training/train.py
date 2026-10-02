"""
Training Script for Floor Plan Vision Transformer Dimension Model
HomeVerse Architectural Dimension Intelligence Layer
"""

import os
import sys
import yaml
import argparse
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

# Enable relative imports when executed directly
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from models.vit_dimension import DimensionViT, ROOM_TYPES
from training.dataset import create_dataloaders
from training.validate import validate_epoch


class DimensionMultiTaskLoss(nn.Module):
    """
    Balanced Multi-Task Loss for metric dimensions:
    Combines Smooth L1 on width & height, scaled Smooth L1 on area, and MSE on confidence.
    """
    def __init__(self, area_weight: float = 0.1, conf_weight: float = 0.5):
        super().__init__()
        self.smooth_l1 = nn.SmoothL1Loss()
        self.mse = nn.MSELoss()
        self.area_weight = area_weight
        self.conf_weight = conf_weight

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        # pred and target are (B, 4): [width, height, area, conf]
        loss_w = self.smooth_l1(pred[:, 0], target[:, 0])
        loss_h = self.smooth_l1(pred[:, 1], target[:, 1])
        loss_a = self.smooth_l1(pred[:, 2], target[:, 2]) * self.area_weight
        loss_conf = self.mse(pred[:, 3], target[:, 3]) * self.conf_weight
        return loss_w + loss_h + loss_a + loss_conf


def train(
    config_path: str = "ml/dimension-vit/configs/config.yaml",
    epochs_override: int = None
):
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training on device: {device}")

    # Dataset & Dataloaders
    data_dir = cfg["dataset"]["data_dir"]
    img_size = cfg["model"]["img_size"]
    batch_size = cfg["training"]["batch_size"]
    num_epochs = epochs_override or cfg["training"]["num_epochs"]
    lr = float(cfg["training"]["learning_rate"])
    weight_decay = float(cfg["training"]["weight_decay"])
    checkpoint_dir = cfg["training"]["checkpoint_dir"]
    os.makedirs(checkpoint_dir, exist_ok=True)

    print(f"[*] Loading dataset from: {data_dir}")
    train_loader, val_loader = create_dataloaders(
        data_dir=data_dir,
        img_size=img_size,
        batch_size=batch_size,
        train_split=cfg["dataset"]["train_split"],
        seed=cfg["dataset"]["seed"]
    )
    print(f"[*] Train samples: {len(train_loader.dataset)}, Validation samples: {len(val_loader.dataset)}")

    # Initialize DimensionViT model
    model = DimensionViT(
        img_size=img_size,
        patch_size=cfg["model"]["patch_size"],
        in_channels=cfg["model"]["in_channels"],
        embed_dim=cfg["model"]["embed_dim"],
        depth=cfg["model"]["depth"],
        num_heads=cfg["model"]["num_heads"],
        mlp_ratio=cfg["model"]["mlp_ratio"],
        room_embed_dim=cfg["model"]["room_embed_dim"],
        head_hidden_dim=cfg["model"]["head_hidden_dim"],
        dropout=cfg["model"]["dropout"]
    ).to(device)

    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[*] Model initialized. Trainable parameters: {total_params:,}")

    criterion = DimensionMultiTaskLoss(area_weight=0.1, conf_weight=0.5)
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-6)

    best_val_loss = float("inf")
    best_checkpoint_path = os.path.join(checkpoint_dir, cfg["training"]["best_model_name"])

    print(f"[*] Starting training for {num_epochs} epochs...")
    for epoch in range(1, num_epochs + 1):
        model.train()
        running_loss = 0.0

        for images, room_indices, targets in train_loader:
            images = images.to(device)
            room_indices = room_indices.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()
            outputs = model(images, room_indices)
            loss = criterion(outputs, targets)
            loss.backward()

            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            running_loss += loss.item() * images.size(0)

        scheduler.step()
        train_loss = running_loss / len(train_loader.dataset)

        # Validation
        val_loss, metrics = validate_epoch(model, val_loader, criterion, device)

        print(
            f"Epoch [{epoch:02d}/{num_epochs:02d}] "
            f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
            f"MAE Width: {metrics['mae_width_m']:.2f}m | MAE Height: {metrics['mae_height_m']:.2f}m | "
            f"MAE Area: {metrics['mae_area_sqm']:.2f}m² | Geom Consist: {metrics['geometric_consistency_pct']}%",
            flush=True
        )

        # Checkpoint best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": val_loss,
                "metrics": metrics,
                "config": cfg,
                "room_types": ROOM_TYPES
            }, best_checkpoint_path)
            print(f"    --> Saved new best checkpoint (Val Loss: {val_loss:.4f}) to {best_checkpoint_path}")

    print(f"\n[*] Training complete! Best checkpoint saved to {best_checkpoint_path}")
    return best_checkpoint_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train HomeVerse Vision Transformer Dimension Model")
    parser.add_argument("--config", type=str, default="ml/dimension-vit/configs/config.yaml", help="Path to config.yaml")
    parser.add_argument("--epochs", type=int, default=None, help="Override number of training epochs")
    args = parser.parse_args()

    train(config_path=args.config, epochs_override=args.epochs)
