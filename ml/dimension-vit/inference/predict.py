"""
Inference & Prediction Pipeline for HomeVerse Vision Transformer Dimension Model
Includes geometry validation and canonical scene format transformation.
"""

import os
import sys
from typing import Dict, Any, List, Optional, Union
from PIL import Image
import torch

# Enable path resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from models.vit_dimension import DimensionViT, ROOM_TYPES, ROOM_TO_IDX
from training.dataset import preprocess_image


class DimensionPredictor:
    """
    High-level inference predictor for floor plan metric dimensions.
    Loads trained checkpoint and validates predictions geometrically.
    """
    def __init__(
        self,
        checkpoint_path: str = "ml/dimension-vit/checkpoints/vit_dimension_best.pth",
        device: Optional[str] = None
    ):
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))
        self.checkpoint_path = checkpoint_path

        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}")

        checkpoint = torch.load(checkpoint_path, map_location=self.device, weights_only=False)
        cfg = checkpoint.get("config", {})
        m_cfg = cfg.get("model", {})

        self.img_size = m_cfg.get("img_size", 224)
        self.model = DimensionViT(
            img_size=self.img_size,
            patch_size=m_cfg.get("patch_size", 16),
            in_channels=m_cfg.get("in_channels", 3),
            embed_dim=m_cfg.get("embed_dim", 192),
            depth=m_cfg.get("depth", 6),
            num_heads=m_cfg.get("num_heads", 6),
            mlp_ratio=m_cfg.get("mlp_ratio", 4.0),
            room_embed_dim=m_cfg.get("room_embed_dim", 64),
            head_hidden_dim=m_cfg.get("head_hidden_dim", 256),
            dropout=0.0
        ).to(self.device)

        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()

    def validate_geometry(
        self,
        width: float,
        height: float,
        area: float,
        tolerance_pct: float = 20.0
    ) -> Dict[str, Any]:
        """
        Validate that predicted metric dimensions are physically plausible
        and geometrically coherent (area ~= width * height).
        """
        notes = []
        is_valid = True

        if width <= 0 or height <= 0 or area <= 0:
            return {
                "is_valid": False,
                "notes": ["Dimensions and area must be strictly positive."],
                "corrected_area": max(0.1, round(width * height, 2)),
                "confidence_penalty": 0.5
            }

        calc_area = width * height
        discrepancy_pct = (abs(area - calc_area) / area) * 100.0

        if discrepancy_pct > tolerance_pct:
            is_valid = False
            notes.append(
                f"Area discrepancy of {discrepancy_pct:.1f}% exceeds tolerance threshold of {tolerance_pct}%."
            )
            confidence_penalty = min(0.4, discrepancy_pct / 100.0)
        else:
            confidence_penalty = 0.0

        return {
            "is_valid": is_valid,
            "discrepancy_pct": round(discrepancy_pct, 1),
            "calculated_area": round(calc_area, 2),
            "notes": notes,
            "confidence_penalty": confidence_penalty
        }

    def predict(
        self,
        image_input: Union[str, Image.Image],
        target_room: str = "Living Room",
        standard_ceiling_height_m: float = 2.8
    ) -> Dict[str, Any]:
        """
        Predict dimensions for a single target room.
        Returns Canonical Scene compatible room dimension dict.
        """
        if isinstance(image_input, str):
            img = Image.open(image_input)
        else:
            img = image_input

        tensor = preprocess_image(img, img_size=self.img_size).unsqueeze(0).to(self.device)

        raw = self.model.predict_room(tensor, room_name=target_room, device=self.device)
        w = raw["width_m"]
        h = raw["height_m"]
        a = raw["area_sqm"]
        base_conf = raw["confidence"]

        # Validate geometry
        val = self.validate_geometry(w, h, a)
        final_conf = max(0.1, round(base_conf - val["confidence_penalty"], 3))
        effective_area = val["calculated_area"] if not val["is_valid"] else a

        return {
            "room_name": target_room,
            "width": w,
            "depth": h,
            "height": standard_ceiling_height_m,
            "area": effective_area,
            "raw_area_predicted": a,
            "confidence": final_conf,
            "is_valid": val["is_valid"],
            "validation_notes": val["notes"]
        }

    def predict_all(
        self,
        image_input: Union[str, Image.Image],
        standard_ceiling_height_m: float = 2.8
    ) -> List[Dict[str, Any]]:
        """
        Predict metric dimensions for all canonical room types in the vocabulary.
        """
        if isinstance(image_input, str):
            img = Image.open(image_input)
        else:
            img = image_input

        results = []
        for room_name in ROOM_TYPES:
            res = self.predict(img, target_room=room_name, standard_ceiling_height_m=standard_ceiling_height_m)
            results.append(res)
        return results


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run ViT dimension inference on floor plan")
    parser.add_argument("--image", type=str, default="ml/dimension-vit/dataset/data/images/floor_000001.png", help="Path to floor plan image")
    parser.add_argument("--room", type=str, default="Living Room", help="Target room name")
    parser.add_argument("--checkpoint", type=str, default="ml/dimension-vit/checkpoints/vit_dimension_best.pth", help="Checkpoint path")
    args = parser.parse_args()

    predictor = DimensionPredictor(checkpoint_path=args.checkpoint)
    res = predictor.predict(args.image, target_room=args.room)
    print("\n=== Prediction Result ===")
    for k, v in res.items():
        print(f"  {k}: {v}")
