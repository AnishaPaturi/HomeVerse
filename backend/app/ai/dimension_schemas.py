"""
Pydantic Schemas for HomeVerse ViT Floor Plan Dimension Inference
Phase 50 - Vision Transformer Architectural Intelligence
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RoomDimensionPrediction(BaseModel):
    model_config = {"extra": "ignore"}

    room_name: str = Field(..., description="Canonical or custom room name")
    width: float = Field(..., description="Width in meters")
    depth: float = Field(..., description="Depth / length in meters")
    height: float = Field(default=2.8, description="Ceiling height in meters")
    area: float = Field(..., description="Floor area in square meters")
    raw_area_predicted: Optional[float] = Field(default=None, description="Raw uncalibrated neural prediction")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model & geometric validation confidence score")
    is_valid: bool = Field(default=True, description="True if passes physical geometry constraints")
    validation_notes: List[str] = Field(default_factory=list, description="Validation warnings or notes")


class DimensionInferenceRequest(BaseModel):
    target_room: Optional[str] = Field(default=None, description="Optional target room to predict, e.g. 'Living Room'")
    standard_ceiling_height_m: float = Field(default=2.8, ge=2.0, le=6.0, description="Standard ceiling height in meters")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded floor plan image")
    image_url: Optional[str] = Field(default=None, description="Publicly accessible URL to floor plan image")


class DimensionInferenceResponse(BaseModel):
    success: bool = True
    total_width_m: Optional[float] = Field(default=None, description="Estimated overall building envelope width")
    total_height_m: Optional[float] = Field(default=None, description="Estimated overall building envelope depth/length")
    total_area_sqm: Optional[float] = Field(default=None, description="Estimated total building area in square meters")
    overall_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    rooms: List[RoomDimensionPrediction] = Field(default_factory=list)
    model_version: str = "HomeVerse-ViT-Dimension-v1"
    validation_summary: Dict[str, Any] = Field(default_factory=dict)
