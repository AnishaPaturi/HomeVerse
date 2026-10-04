import time
from pathlib import Path
import torch
from torch.utils.data import DataLoader

from floorplan_dataset import FloorplanDataset, collate_fn
from multitask_vit import MultiTaskViT, MultiTaskCriterion, train_epoch, evaluate
from vit_detector import HungarianMatcher


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training Experiment ViT-384 + Segmentation on: {device}")

    save_dir = Path("checkpoints/multitask")
    save_dir.mkdir(parents=True, exist_ok=True)
    ckpt_384_path = save_dir / "multitask_vit_384_best.pt"

    # 1. Initialize ViT-384 Model
    model = MultiTaskViT(
        pretrained_model_name="google/vit-base-patch16-384",
        img_size=384,
        num_queries=25,
        num_classes=22,
    ).to(device)

    # 2. Transfer pretrained weights from 224 checkpoint for fast convergence
    ckpt_224_path = save_dir / "multitask_vit_best.pt"
    if ckpt_224_path.exists():
        print(f"Transferring pretrained detector & scale weights from {ckpt_224_path}...")
        ckpt_224 = torch.load(ckpt_224_path, map_location=device)
        head_weights = {k: v for k, v in ckpt_224.items() if not k.startswith("encoder.")}
        missing, unexpected = model.load_state_dict(head_weights, strict=False)
        print(f"Weights transferred. Seg-head new parameters: {len(missing)}.")

    # Freeze ViT-384 backbone for rapid CPU training
    for p in model.encoder.parameters():
        p.requires_grad = False
    model.encoder.eval()

    # 3. Datasets (focused experiment subset)
    train_samples = 100
    val_samples = 20
    print(f"Loading {train_samples} train and {val_samples} val floor plans at 384x384...")
    train_ds = FloorplanDataset("HomeVerse-Dataset", split="train", img_size=384, max_samples=train_samples)
    val_ds = FloorplanDataset("HomeVerse-Dataset", split="validation", img_size=384, max_samples=val_samples)

    train_loader = DataLoader(train_ds, batch_size=5, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=5, shuffle=False, collate_fn=collate_fn)

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterion(
        matcher=matcher,
        weight_class=1.0,
        weight_bbox=5.0,
        weight_giou=2.0,
        weight_mask=2.5,
        weight_scale=1.0
    ).to(device)

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=1.5e-4, weight_decay=1e-4)

    epochs = 3
    best_val_loss = float("inf")
    print("\nStarting Experiment C (ViT-384 + Segmentation Head) Training:")

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        print(f"\n--- Epoch {epoch}/{epochs} ---")
        train_loss = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - t0
        print(f"Epoch {epoch} finished in {elapsed:.1f}s | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")

        if val_loss < best_val_loss or not ckpt_384_path.exists():
            best_val_loss = val_loss
            torch.save(model.state_dict(), ckpt_384_path)
            print(f"--> Saved best ViT-384 checkpoint to {ckpt_384_path}")

    print("\nViT-384 training finished successfully!")


if __name__ == "__main__":
    main()
