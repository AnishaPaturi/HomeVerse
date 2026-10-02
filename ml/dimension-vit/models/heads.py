"""
Dimension Regression Heads for Vision Transformer
Predicts room/building width, height, area, and model confidence score.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class DimensionRegressionHead(nn.Module):
    """
    MLP Regression head predicting (width_m, height_m, area_sqm, confidence)
    from combined image representation and room token embedding.
    """
    def __init__(
        self,
        feature_dim: int,
        room_embed_dim: int,
        hidden_dim: int = 256,
        dropout: float = 0.1
    ):
        super().__init__()
        in_dim = feature_dim + room_embed_dim

        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.LayerNorm(hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout)
        )

        # Dimension output: [width_m, height_m, area_sqm]
        self.dim_out = nn.Linear(hidden_dim // 2, 3)
        # Confidence output: [confidence score in range (0, 1)]
        self.conf_out = nn.Linear(hidden_dim // 2, 1)

    def forward(self, img_features: torch.Tensor, room_embedding: torch.Tensor) -> torch.Tensor:
        """
        Args:
            img_features: (B, feature_dim)
            room_embedding: (B, room_embed_dim)
        Returns:
            (B, 4) tensor containing:
            [0: width_m, 1: height_m, 2: area_sqm, 3: confidence]
        """
        combined = torch.cat([img_features, room_embedding], dim=-1)
        hidden = self.net(combined)

        # Ensure positive metric dimensions with Softplus
        dims = F.softplus(self.dim_out(hidden))
        # Ensure confidence in [0, 1] with Sigmoid
        conf = torch.sigmoid(self.conf_out(hidden))

        return torch.cat([dims, conf], dim=-1)
