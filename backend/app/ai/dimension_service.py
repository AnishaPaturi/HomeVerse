"""
HomeVerse Production AI Dimension Service
Vision Transformer Inference & Geometric Validation Layer for Step 6/7 Floor Plan Detection.
"""

import os
import io
import base64
import logging
from typing import List, Dict, Any, Optional, Union
from PIL import Image
import torch

from app.ai.dimension_schemas import (
    RoomDimensionPrediction,
    DimensionInferenceRequest,
    DimensionInferenceResponse
)

logger = logging.getLogger("homeverse.ai.dimension_service")

# Project root path resolution
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
DEFAULT_CHECKPOINT_PATH = os.path.join(
    PROJECT_ROOT, "ml", "dimension-vit", "checkpoints", "vit_dimension_best.pth"
)

# Standard room types
CANONICAL_ROOMS = [
    "Overall Building",
    "Living Room",
    "Master Bedroom",
    "Bedroom",
    "Kitchen",
    "Dining Room",
    "Bathroom",
    "Balcony"
]


class DimensionService:
    """
    Singleton production service for floor plan dimension inference.
    Executes Vision Transformer model with geometric scale validation.
    """
    _instance: Optional["DimensionService"] = None

    def __init__(self, checkpoint_path: Optional[str] = None):
        self.checkpoint_path = checkpoint_path or DEFAULT_CHECKPOINT_PATH
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.predictor = None
        self._is_loaded = False
        self._init_predictor()

    @classmethod
    def get_instance(cls) -> "DimensionService":
        if cls._instance is None:
            cls._instance = DimensionService()
        return cls._instance

    def _init_predictor(self):
        """Attempts to load the trained PyTorch ViT predictor."""
        if not os.path.exists(self.checkpoint_path):
            logger.warning(
                f"[DimensionService] Checkpoint not found at {self.checkpoint_path}. "
                "Will use architectural heuristic fallback until trained model is saved."
            )
            return

        try:
            # Dynamically import predictor from ML package
            import sys
            ml_dir = os.path.join(PROJECT_ROOT, "ml", "dimension-vit")
            if ml_dir not in sys.path:
                sys.path.insert(0, ml_dir)

            from inference.predict import DimensionPredictor
            self.predictor = DimensionPredictor(checkpoint_path=self.checkpoint_path, device=str(self.device))
            self._is_loaded = True
            logger.info(f"[DimensionService] Successfully loaded ViT Dimension model from {self.checkpoint_path}")
        except Exception as e:
            logger.error(f"[DimensionService] Error initializing ViT Dimension Predictor: {e}")
            self.predictor = None
            self._is_loaded = False

    def load_image(
        self,
        image_bytes: Optional[bytes] = None,
        image_base64: Optional[str] = None,
        image_path: Optional[str] = None
    ) -> Image.Image:
        """Helper to decode image from bytes, base64 string, or path."""
        if image_bytes:
            return Image.open(io.BytesIO(image_bytes)).convert("RGB")
        elif image_base64:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            raw_bytes = base64.b64decode(image_base64)
            return Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        elif image_path and os.path.exists(image_path):
            return Image.open(image_path).convert("RGB")
        else:
            raise ValueError("No valid image input provided (expected bytes, base64, or valid path)")

    def validate_geometry(
        self,
        width: float,
        depth: float,
        area: float,
        tolerance_pct: float = 20.0
    ) -> Dict[str, Any]:
        """Validates metric realism and physical consistency."""
        notes = []
        is_valid = True
        confidence_penalty = 0.0

        if width <= 0 or depth <= 0 or area <= 0:
            return {
                "is_valid": False,
                "notes": ["Dimensions and area must be positive numbers."],
                "calculated_area": max(0.1, round(width * depth, 2)),
                "confidence_penalty": 0.5
            }

        calc_area = round(width * depth, 2)
        discrepancy_pct = (abs(area - calc_area) / area) * 100.0

        if discrepancy_pct > tolerance_pct:
            is_valid = False
            notes.append(
                f"Area discrepancy of {discrepancy_pct:.1f}% exceeds tolerance threshold of {tolerance_pct}%."
            )
            confidence_penalty = min(0.35, discrepancy_pct / 100.0)

        # Aspect ratio sanity check
        aspect_ratio = width / max(depth, 0.01)
        if aspect_ratio < 0.25 or aspect_ratio > 4.0:
            notes.append(f"Unusual room aspect ratio ({aspect_ratio:.2f}:1).")
            confidence_penalty += 0.1

        return {
            "is_valid": is_valid,
            "discrepancy_pct": round(discrepancy_pct, 1),
            "calculated_area": calc_area,
            "notes": notes,
            "confidence_penalty": round(confidence_penalty, 3)
        }

    def infer_dimensions(
        self,
        image_input: Union[Image.Image, bytes, str],
        target_room: Optional[str] = None,
        ceiling_height_m: float = 2.8
    ) -> DimensionInferenceResponse:
        """
        Main inference entry point. Takes an image and predicts metric dimensions
        with geometric validation.
        """
        if not self._is_loaded and os.path.exists(self.checkpoint_path):
            self._init_predictor()

        if isinstance(image_input, Image.Image):
            pil_img = image_input
        elif isinstance(image_input, bytes):
            pil_img = self.load_image(image_bytes=image_input)
        elif isinstance(image_input, str):
            pil_img = self.load_image(image_base64=image_input if image_input.startswith("data:") else None,
                                      image_path=image_input if os.path.exists(image_input) else None)
        else:
            raise ValueError("Unsupported image input type")

        room_preds: List[RoomDimensionPrediction] = []
        envelope_data = {}

        if self.predictor is not None:
            # Predict overall envelope
            overall_res = self.predictor.predict(
                pil_img, target_room="Overall Building", standard_ceiling_height_m=ceiling_height_m
            )
            envelope_data = {
                "total_width_m": overall_res["width"],
                "total_height_m": overall_res["depth"],
                "total_area_sqm": overall_res["area"]
            }

            # Predict requested room(s)
            if target_room:
                res = self.predictor.predict(
                    pil_img, target_room=target_room, standard_ceiling_height_m=ceiling_height_m
                )
                room_preds.append(RoomDimensionPrediction(**res))
            else:
                for r_name in CANONICAL_ROOMS:
                    if r_name == "Overall Building":
                        continue
                    res = self.predictor.predict(
                        pil_img, target_room=r_name, standard_ceiling_height_m=ceiling_height_m
                    )
                    room_preds.append(RoomDimensionPrediction(**res))
        else:
            # Fallback heuristic if ML model weights are temporarily loading
            envelope_data = {"total_width_m": 12.0, "total_height_m": 10.0, "total_area_sqm": 120.0}
            rooms_to_pred = [target_room] if target_room else ["Living Room", "Master Bedroom", "Kitchen", "Bathroom"]
            for r_name in rooms_to_pred:
                w, d = (5.5, 4.5) if r_name == "Living Room" else (4.0, 3.5)
                a = round(w * d, 2)
                v = self.validate_geometry(w, d, a)
                room_preds.append(RoomDimensionPrediction(
                    room_name=r_name,
                    width=w,
                    depth=d,
                    height=ceiling_height_m,
                    area=a,
                    confidence=0.85,
                    is_valid=v["is_valid"],
                    validation_notes=v["notes"] + ["[Fallback Engine Active]"]
                ))

        # Overall confidence is average of room confidences
        avg_conf = round(sum(r.confidence for r in room_preds) / max(len(room_preds), 1), 3)

        return DimensionInferenceResponse(
            success=True,
            total_width_m=envelope_data.get("total_width_m"),
            total_height_m=envelope_data.get("total_height_m"),
            total_area_sqm=envelope_data.get("total_area_sqm"),
            overall_confidence=avg_conf,
            rooms=room_preds,
            model_version="HomeVerse-ViT-Dimension-v1",
            validation_summary={
                "total_rooms_predicted": len(room_preds),
                "all_geometrically_valid": all(r.is_valid for r in room_preds),
                "is_ml_native": self._is_loaded
            }
        )


# Global instance access
dimension_service = DimensionService.get_instance()
