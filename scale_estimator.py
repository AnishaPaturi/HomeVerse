import argparse
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from tqdm import tqdm
from transformers import ViTModel, ViTConfig

from floorplan_dataset import FloorplanDataset, collate_fn


class ViTScaleEstimator(nn.Module):
    """
    Vision Transformer for predicting metric scale (pixels per meter)
    from full floor-plan images containing visual scale cues:
    - dimension text
    - graphical scale bars
    - reference objects (beds, counters, fixtures)
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-224"):
        super().__init__()
        try:
            self.encoder = ViTModel.from_pretrained(pretrained_model_name)
        except Exception:
            config = ViTConfig(image_size=224, patch_size=16, hidden_size=768)
            self.encoder = ViTModel(config)

        hidden_dim = self.encoder.config.hidden_size  # 768
        self.scale_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Softplus(),  # scale must be strictly positive
        )

    def forward(self, images):
        outputs = self.encoder(pixel_values=images)
        cls_token = outputs.last_hidden_state[:, 0, :]  # [B, 768]
        pred_scale = self.scale_head(cls_token).squeeze(-1)  # [B]
        return pred_scale


def train_epoch(model, dataloader, optimizer, device):
    model.train()
    total_loss = 0.0
    valid_samples = 0

    pbar = tqdm(dataloader, desc="Training Scale Head")
    for images, targets in pbar:
        images = images.to(device)
        gt_scales = torch.stack([t["scale_px_per_m"] for t in targets]).to(device)
        has_scale = torch.stack([t["has_scale"] for t in targets]).to(device)

        optimizer.zero_grad()
        pred_scales = model(images)

        # Masked Loss: ignore no-scale images
        raw_loss = F.smooth_l1_loss(pred_scales, gt_scales, reduction="none")
        masked_loss = raw_loss * has_scale

        denom = max(1.0, has_scale.sum().item())
        loss = masked_loss.sum() / denom

        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += masked_loss.sum().item()
        valid_samples += int(has_scale.sum().item())

        mean_err = (total_loss / max(1, valid_samples))
        pbar.set_postfix({"loss": f"{loss.item():.4f}", "mean_err_px_per_m": f"{mean_err:.2f}"})

    return total_loss / max(1, valid_samples)


@torch.no_grad()
def evaluate(model, dataloader, device):
    model.eval()
    total_loss = 0.0
    valid_samples = 0
    total_abs_rel_err = 0.0

    for images, targets in tqdm(dataloader, desc="Evaluating Scale Head"):
        images = images.to(device)
        gt_scales = torch.stack([t["scale_px_per_m"] for t in targets]).to(device)
        has_scale = torch.stack([t["has_scale"] for t in targets]).to(device)

        pred_scales = model(images)
        raw_loss = F.smooth_l1_loss(pred_scales, gt_scales, reduction="none")
        masked_loss = raw_loss * has_scale

        total_loss += masked_loss.sum().item()
        valid_samples += int(has_scale.sum().item())

        # Relative error
        mask_bool = has_scale > 0.5
        if mask_bool.any():
            rel_err = torch.abs(pred_scales[mask_bool] - gt_scales[mask_bool]) / (gt_scales[mask_bool] + 1e-6)
            total_abs_rel_err += rel_err.sum().item()

    avg_loss = total_loss / max(1, valid_samples)
    avg_rel_err = total_abs_rel_err / max(1, valid_samples)
    return avg_loss, avg_rel_err


def main():
    parser = argparse.ArgumentParser(description="Train ViT Scale Estimator")
    parser.add_argument("--data-root", type=str, default="HomeVerse-Dataset")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--max-train-samples", type=int, default=None)
    parser.add_argument("--max-val-samples", type=int, default=None)
    parser.add_argument("--save-dir", type=str, default="checkpoints/scale")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    train_ds = FloorplanDataset(args.data_root, split="train", max_samples=args.max_train_samples)
    val_ds = FloorplanDataset(args.data_root, split="validation", max_samples=args.max_val_samples)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)

    model = ViTScaleEstimator().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    save_path = Path(args.save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    best_val_loss = float("inf")
    for epoch in range(1, args.epochs + 1):
        print(f"\n--- Epoch {epoch}/{args.epochs} ---")
        train_loss = train_epoch(model, train_loader, optimizer, device)
        val_loss, rel_err = evaluate(model, val_loader, device)
        print(f"Epoch {epoch}: Train Loss = {train_loss:.4f}, Val Loss = {val_loss:.4f}, Rel Error = {rel_err*100:.2f}%")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            ckpt_file = save_path / "scale_estimator_best.pt"
            torch.save(model.state_dict(), ckpt_file)
            print(f"Saved best model checkpoint to {ckpt_file}")

    print("\nScale Estimator training completed!")


if __name__ == "__main__":
    main()
