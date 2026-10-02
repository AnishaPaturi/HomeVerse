"""
Vision Transformer for Floor Plan Metric Dimension Prediction
HomeVerse Architectural Dimension Intelligence Layer
"""

import math
from typing import Dict, Any, List, Optional
import torch
import torch.nn as nn
import torch.nn.functional as F
try:
    from .heads import DimensionRegressionHead
except (ImportError, ValueError):
    from models.heads import DimensionRegressionHead


# Standard room label vocabulary
ROOM_TYPES = [
    "Overall Building",
    "Living Room",
    "Master Bedroom",
    "Bedroom",
    "Kitchen",
    "Dining Room",
    "Bathroom",
    "Balcony"
]
ROOM_TO_IDX = {name: idx for idx, name in enumerate(ROOM_TYPES)}
IDX_TO_ROOM = {idx: name for idx, name in enumerate(ROOM_TYPES)}


class PatchEmbedding(nn.Module):
    """Splits image into non-overlapping patches and projects them to embedding dimension."""
    def __init__(self, img_size: int = 224, patch_size: int = 16, in_channels: int = 3, embed_dim: int = 192):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2

        self.proj = nn.Conv2d(
            in_channels,
            embed_dim,
            kernel_size=patch_size,
            stride=patch_size
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, C, H, W) -> (B, D, H/P, W/P) -> (B, D, N) -> (B, N, D)
        x = self.proj(x)
        x = x.flatten(2).transpose(1, 2)
        return x


class TransformerBlock(nn.Module):
    """Transformer Encoder Block with Pre-LayerNorm Multi-Head Attention and MLP."""
    def __init__(self, embed_dim: int, num_heads: int, mlp_ratio: float = 4.0, dropout: float = 0.1):
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = nn.MultiheadAttention(
            embed_dim=embed_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True
        )
        self.norm2 = nn.LayerNorm(embed_dim)
        hidden_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, embed_dim),
            nn.Dropout(dropout)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Attention with residual
        norm_x = self.norm1(x)
        attn_out, _ = self.attn(norm_x, norm_x, norm_x)
        x = x + attn_out

        # MLP with residual
        x = x + self.mlp(self.norm2(x))
        return x


class NativeViTBackbone(nn.Module):
    """Vision Transformer Backbone (Patch Embedding + CLS Token + Positional Encoding + Encoder Stack)."""
    def __init__(
        self,
        img_size: int = 224,
        patch_size: int = 16,
        in_channels: int = 3,
        embed_dim: int = 192,
        depth: int = 6,
        num_heads: int = 6,
        mlp_ratio: float = 4.0,
        dropout: float = 0.1
    ):
        super().__init__()
        self.patch_embed = PatchEmbedding(img_size, patch_size, in_channels, embed_dim)
        num_patches = self.patch_embed.num_patches

        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        self.pos_drop = nn.Dropout(p=dropout)

        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, mlp_ratio, dropout)
            for _ in range(depth)
        ])
        self.norm = nn.LayerNorm(embed_dim)

        # Initialize positional embedding and CLS token
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B = x.shape[0]
        # Patch projection
        x = self.patch_embed(x)  # (B, N, D)

        # Prepend CLS token
        cls_tokens = self.cls_token.expand(B, -1, -1)  # (B, 1, D)
        x = torch.cat((cls_tokens, x), dim=1)  # (B, N+1, D)

        # Add positional embedding
        x = self.pos_drop(x + self.pos_embed)

        # Transformer blocks
        for block in self.blocks:
            x = block(x)

        x = self.norm(x)
        # Return CLS token feature representation
        return x[:, 0]


class DimensionViT(nn.Module):
    """
    HomeVerse Vision Transformer for Architectural Metric Dimension Intelligence.
    Combines visual floor plan features with target room conditioning to predict:
    (width_m, height_m, area_sqm, confidence).
    """
    def __init__(
        self,
        img_size: int = 224,
        patch_size: int = 16,
        in_channels: int = 3,
        embed_dim: int = 192,
        depth: int = 6,
        num_heads: int = 6,
        mlp_ratio: float = 4.0,
        room_embed_dim: int = 64,
        head_hidden_dim: int = 256,
        dropout: float = 0.1,
        num_room_types: int = len(ROOM_TYPES)
    ):
        super().__init__()
        self.img_size = img_size
        self.embed_dim = embed_dim
        self.room_embed_dim = room_embed_dim

        # ViT Backbone
        self.backbone = NativeViTBackbone(
            img_size=img_size,
            patch_size=patch_size,
            in_channels=in_channels,
            embed_dim=embed_dim,
            depth=depth,
            num_heads=num_heads,
            mlp_ratio=mlp_ratio,
            dropout=dropout
        )

        # Target Room Conditioning Embedding
        self.room_embedding = nn.Embedding(num_room_types, room_embed_dim)

        # Dimension Regression Head
        self.head = DimensionRegressionHead(
            feature_dim=embed_dim,
            room_embed_dim=room_embed_dim,
            hidden_dim=head_hidden_dim,
            dropout=dropout
        )

    def forward(self, images: torch.Tensor, room_indices: torch.Tensor) -> torch.Tensor:
        """
        Args:
            images: (B, 3, H, W) normalized floor plan images
            room_indices: (B,) integer indices of target room classes
        Returns:
            (B, 4) tensor [width_m, height_m, area_sqm, confidence]
        """
        img_feats = self.backbone(images)  # (B, embed_dim)
        room_embeds = self.room_embedding(room_indices)  # (B, room_embed_dim)
        predictions = self.head(img_feats, room_embeds)  # (B, 4)
        return predictions

    @torch.no_grad()
    def predict_room(
        self,
        image_tensor: torch.Tensor,
        room_name: str = "Living Room",
        device: torch.device = torch.device("cpu")
    ) -> Dict[str, Any]:
        """
        Predict metric dimensions for a single target room given an image tensor (1, 3, H, W).
        """
        self.eval()
        room_idx = ROOM_TO_IDX.get(room_name, 1)  # Default to Living Room if unknown
        room_tensor = torch.tensor([room_idx], dtype=torch.long, device=device)
        image_tensor = image_tensor.to(device)

        preds = self.forward(image_tensor, room_tensor).cpu().squeeze(0).numpy()
        w = round(float(preds[0]), 2)
        h = round(float(preds[1]), 2)
        area = round(float(preds[2]), 2)
        conf = round(float(preds[3]), 3)

        return {
            "room_name": room_name,
            "width_m": w,
            "height_m": h,
            "area_sqm": area,
            "confidence": conf
        }

    @torch.no_grad()
    def predict_all_rooms(
        self,
        image_tensor: torch.Tensor,
        device: torch.device = torch.device("cpu")
    ) -> List[Dict[str, Any]]:
        """
        Predict dimensions for all canonical room categories in the vocabulary.
        """
        results = []
        for name in ROOM_TYPES:
            res = self.predict_room(image_tensor, room_name=name, device=device)
            results.append(res)
        return results
