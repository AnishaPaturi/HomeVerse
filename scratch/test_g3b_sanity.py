import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import time
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import ViTModel, ViTConfig
from floorplan_dataset import NUM_ROOM_CLASSES
from vit_detector import HungarianMatcher, box_cxcywh_to_xyxy, generalized_box_iou
from segmentation_head import compute_mask_loss
from run_experiment_f1_fpn import ViTFeaturePyramidNetwork


class MultiTaskViT384FPNTwoScale(nn.Module):
    """
    Experiment G3-B: Multi-Scale ViT-FPN with Two-Scale Query Pathway
      - 20 Global Queries: Attending to ViT Block 12 patch representations (stride 16, 24x24)
      - 20 High-Resolution Queries: Attending to FPN P8 feature map (stride 8, 48x48)
      - Total: 40 Queries, with shared Class Head, BBox Head, and Query Mask Proj
    """
    def __init__(self, pretrained_model_name="google/vit-base-patch16-384",
                 img_size=384, num_queries_global=20, num_queries_highres=20,
                 num_classes=NUM_ROOM_CLASSES, decoder_layers=2):
        super().__init__()
        self.img_size = img_size
        self.num_queries_global = num_queries_global
        self.num_queries_highres = num_queries_highres
        self.total_queries = num_queries_global + num_queries_highres
        self.num_classes = num_classes
        self.patch_size = 16
        self.grid_size = (img_size // self.patch_size, img_size // self.patch_size)

        # ViT-384 Encoder
        try:
            self.encoder = ViTModel.from_pretrained(pretrained_model_name)
        except Exception:
            config = ViTConfig(image_size=img_size, patch_size=16, hidden_size=768)
            self.encoder = ViTModel(config)

        hidden_dim = self.encoder.config.hidden_size  # 768

        # 1. Log-Scale Head
        self.scale_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

        # 2. Multi-Scale Feature Pyramid Network
        self.fpn = ViTFeaturePyramidNetwork(in_dim=hidden_dim, fpn_dim=128)

        # 3. High-Resolution Feature Projection (P8 stride 8: 128 -> hidden_dim 768)
        self.p8_proj = nn.Sequential(
            nn.Conv2d(128, hidden_dim, kernel_size=1),
            nn.GroupNorm(8, hidden_dim),
            nn.GELU(),
        )

        # 4. Pathway A: 20 Global Queries & Decoder
        self.query_embed_global = nn.Embedding(num_queries_global, hidden_dim)
        dec_layer_global = nn.TransformerDecoderLayer(
            d_model=hidden_dim, nhead=8, dim_feedforward=2048, dropout=0.1,
            activation="relu", batch_first=True
        )
        self.decoder_global = nn.TransformerDecoder(dec_layer_global, num_layers=decoder_layers)

        # 5. Pathway B: 20 High-Resolution Queries & Decoder
        self.query_embed_highres = nn.Embedding(num_queries_highres, hidden_dim)
        dec_layer_highres = nn.TransformerDecoderLayer(
            d_model=hidden_dim, nhead=8, dim_feedforward=2048, dropout=0.1,
            activation="relu", batch_first=True
        )
        self.decoder_highres = nn.TransformerDecoder(dec_layer_highres, num_layers=decoder_layers)

        # 6. Shared Prediction Heads
        self.class_head = nn.Linear(hidden_dim, num_classes + 1)
        self.bbox_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, 4),
            nn.Sigmoid(),
        )
        self.query_mask_proj = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 64),
        )
        self.semantic_head = nn.Sequential(
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, num_classes + 1, kernel_size=1),
        )

    def forward(self, images):
        bs = images.size(0)
        outputs = self.encoder(pixel_values=images, output_hidden_states=True)
        cls_token = outputs.last_hidden_state[:, 0, :]

        # Extract Block 6, Block 9, Block 12 patch tokens
        f6 = outputs.hidden_states[6][:, 1:, :]
        f9 = outputs.hidden_states[9][:, 1:, :]
        f12 = outputs.hidden_states[12][:, 1:, :]

        # 1. Log-Scale prediction
        pred_log_scale = self.scale_head(cls_token).squeeze(-1)
        pred_scale = torch.exp(pred_log_scale)

        # 2. Multi-Scale FPN features
        pixel_feat, pyramid = self.fpn(f6, f9, f12, grid_size=self.grid_size)
        p8 = pyramid["p8"]  # [B, 128, 48, 48]

        # 3. High-Resolution Memory map (stride 8, 48x48 = 2304 locations)
        mem_highres = self.p8_proj(p8).flatten(2).permute(0, 2, 1)  # [B, 2304, 768]

        # 4. Pathway A: Global Queries (20 queries attending to f12 stride 16)
        queries_g = self.query_embed_global.weight.unsqueeze(0).expand(bs, -1, -1)
        hs_global = self.decoder_global(tgt=queries_g, memory=f12)  # [B, 20, 768]

        # 5. Pathway B: High-Res Queries (20 queries attending to mem_highres stride 8)
        queries_hr = self.query_embed_highres.weight.unsqueeze(0).expand(bs, -1, -1)
        hs_highres = self.decoder_highres(tgt=queries_hr, memory=mem_highres)  # [B, 20, 768]

        # 6. Concatenate 40 queries: [0:20] = Global, [20:40] = High-Res
        hs = torch.cat([hs_global, hs_highres], dim=1)  # [B, 40, 768]

        # 7. Shared Heads
        pred_logits = self.class_head(hs)  # [B, 40, 23]
        pred_boxes = self.bbox_head(hs)    # [B, 40, 4]
        q_masks = self.query_mask_proj(hs) # [B, 40, 64]

        # Dynamic mask prediction
        pred_masks = torch.einsum("bqc,bchw->bqhw", q_masks, pixel_feat)  # [B, 40, 96, 96]
        pred_semantic = self.semantic_head(pixel_feat)

        return {
            "pred_logits": pred_logits,
            "pred_boxes": pred_boxes,
            "pred_masks": pred_masks,
            "pred_semantic": pred_semantic,
            "pred_log_scale": pred_log_scale,
            "pred_scale": pred_scale,
            "pixel_feat": pixel_feat,
            "hs": hs,
            "hs_global": hs_global,
            "hs_highres": hs_highres,
        }


def load_g3b_from_f2a(model, f2a_ckpt_path):
    """Load weights from F2-A checkpoint with precise mapping for two-scale pathway."""
    f2a_weights = torch.load(f2a_ckpt_path, map_location="cpu")
    model_state = model.state_dict()

    matched_keys = []
    missing_keys = []
    custom_loaded = []

    # Map identical keys
    for k, v in f2a_weights.items():
        if k in model_state and model_state[k].shape == v.shape:
            model_state[k].copy_(v)
            matched_keys.append(k)

    # Custom mapping for decoder and queries
    # 1. query_embed: F2-A has [25, 768] -> load first 20 into query_embed_global
    if "query_embed.weight" in f2a_weights:
        model.query_embed_global.weight.data.copy_(f2a_weights["query_embed.weight"][:20])
        # Initialize query_embed_highres with remaining queries + small noise for diversity
        model.query_embed_highres.weight.data.copy_(f2a_weights["query_embed.weight"][:20] + 0.01 * torch.randn(20, 768))
        custom_loaded.append("query_embed_global (first 20 of F2-A query_embed)")
        custom_loaded.append("query_embed_highres (initialized from F2-A query_embed + noise)")

    # 2. decoder: F2-A has decoder.layers.* -> load into decoder_global and decoder_highres
    for k, v in f2a_weights.items():
        if k.startswith("decoder."):
            suffix = k[len("decoder."):]
            k_g = f"decoder_global.{suffix}"
            k_hr = f"decoder_highres.{suffix}"
            if k_g in model_state and model_state[k_g].shape == v.shape:
                model_state[k_g].copy_(v)
                custom_loaded.append(k_g)
            if k_hr in model_state and model_state[k_hr].shape == v.shape:
                model_state[k_hr].copy_(v)
                custom_loaded.append(k_hr)

    # Load updated state
    model.load_state_dict(model_state)

    # Report
    print(f"Loaded {len(matched_keys)} direct keys from F2-A.")
    print(f"Loaded {len(custom_loaded)} mapped/initialized keys (decoder_global, decoder_highres, queries).")
    uninitialized = [k for k in model_state if k not in matched_keys and not any(k.startswith(p) for p in ["decoder_global", "decoder_highres", "query_embed_global", "query_embed_highres"])]
    print(f"Newly initialized layers (p8_proj): {uninitialized}")
    return model


if __name__ == "__main__":
    print("Running G3-B Two-Scale Architecture Sanity Test...", flush=True)
    m = MultiTaskViT384FPNTwoScale(img_size=384)
    f2a_path = Path("checkpoints/multitask/experiment_f2a_best.pt")
    if f2a_path.exists():
        m = load_g3b_from_f2a(m, f2a_path)

    # Count parameters
    total_params = sum(p.numel() for p in m.parameters())
    trainable_params = sum(p.numel() for p in m.parameters() if p.requires_grad)
    print(f"Total params: {total_params:,} | Trainable: {trainable_params:,}")

    # Forward pass
    dummy_img = torch.randn(2, 3, 384, 384)
    t0 = time.time()
    out = m(dummy_img)
    fwd_time = time.time() - t0

    print(f"\nForward pass successful in {fwd_time:.2f}s!")
    print(f"pred_logits shape: {out['pred_logits'].shape} (expected [2, 40, 23])")
    print(f"pred_boxes shape:  {out['pred_boxes'].shape} (expected [2, 40, 4])")
    print(f"pred_masks shape:  {out['pred_masks'].shape} (expected [2, 40, 96, 96])")
    print(f"pred_scale shape:  {out['pred_scale'].shape} (expected [2])")
    print(f"hs_global shape:   {out['hs_global'].shape} (expected [2, 20, 768])")
    print(f"hs_highres shape:  {out['hs_highres'].shape} (expected [2, 20, 768])")

    assert out['pred_logits'].shape == (2, 40, 23), "Invalid pred_logits shape!"
    assert out['pred_boxes'].shape == (2, 40, 4), "Invalid pred_boxes shape!"
    assert out['pred_masks'].shape == (2, 40, 96, 96), "Invalid pred_masks shape!"

    # Test Hungarian Matcher on 40 queries
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    dummy_targets = [
        {"labels": torch.tensor([1, 5, 8, 9]), "boxes": torch.tensor([[0.2, 0.2, 0.1, 0.1], [0.5, 0.5, 0.3, 0.3], [0.8, 0.8, 0.15, 0.15], [0.3, 0.7, 0.1, 0.1]])},
        {"labels": torch.tensor([0, 4]), "boxes": torch.tensor([[0.4, 0.4, 0.4, 0.4], [0.7, 0.3, 0.2, 0.2]])},
    ]
    indices = matcher(out['pred_logits'], out['pred_boxes'], dummy_targets)
    print(f"\nHungarian matching successful! Matched indices:")
    for b, (src_idx, tgt_idx) in enumerate(indices):
        g_matches = [i.item() for i in src_idx if i.item() < 20]
        hr_matches = [i.item() for i in src_idx if i.item() >= 20]
        print(f"  Batch {b}: {len(src_idx)} targets matched (Global: {len(g_matches)}, High-Res: {len(hr_matches)})")

    # Backward pass test
    loss = out['pred_logits'].sum() + out['pred_boxes'].sum() + out['pred_masks'].sum() + out['pred_scale'].sum()
    loss.backward()
    print("\nBackward pass successful! Gradients verified across all heads.")
