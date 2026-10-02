"""
Pydantic Schemas for HomeVerse Architectural Blueprint Understanding & Dimension Intelligence
Phase 50 - Multi-Stage Blueprint Pipeline with Source Attribution & Gatekeeping
"""

from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class DimensionSource(str, Enum):
    BLUEPRINT = "blueprint"                    # Explicitly read from blueprint text (e.g. 11'11" × 14'11")
    USER = "user"                              # Explicitly entered by user
    GEOMETRY_CALIBRATED = "geometry"           # Derived from pixel polygon boundaries via calibrated scale
    VIT_ASSISTED = "vit_assisted"              # Prior model estimate (unverified, requires user approval)
    MISSING = "missing"                        # Missing/unverified


class ScaleStatus(str, Enum):
    VERIFIED = "verified"                      # Explicit scale or reference found
    USER_VERIFIED = "user_verified"            # Calibrated using user-supplied known dimension
    UNCALIBRATED = "uncalibrated"              # Geometry detected but physical scale not calibrated
    MISSING = "missing"                        # No scale or reference dimension available


class PipelineStage(str, Enum):
    ALL_VERIFIED = "all_verified"              # All rooms have verified dimensions -> ready for confirmation
    DIMENSIONS_REQUIRED = "dimensions_required" # One or more rooms missing dimensions -> Step 6A required
    SCALE_REQUIRED = "scale_required"          # Entire blueprint lacks scale reference -> user reference needed
    CONFIRMED = "confirmed"                    # User has explicitly confirmed -> canonical scene unlocked


class RoomDimensionPrediction(BaseModel):
    model_config = ConfigDict(extra="ignore")

    room_name: str = Field(..., description="Canonical or custom room name")
    source_label: Optional[str] = Field(default=None, description="Exact label as printed on floor plan")
    width: float = Field(..., description="Width in meters")
    depth: float = Field(..., description="Depth / length in meters")
    height: float = Field(default=2.8, description="Ceiling height in meters")
    area: float = Field(..., description="Floor area in square meters")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Model & geometric validation confidence score")
    is_valid: bool = Field(default=True, description="True if passes physical geometry constraints")
    validation_notes: List[str] = Field(default_factory=list, description="Validation warnings or notes")
    detected_imperial: Optional[str] = Field(default=None, description="Dimensions formatted in feet & inches")
    ground_truth_imperial: Optional[str] = Field(default=None, description="Exact dimensions printed on blueprint")
    dimension_error_pct: Optional[float] = Field(default=None, description="Error percentage vs ground truth")
    raw_area_predicted: Optional[float] = Field(default=None, description="Raw uncalibrated neural prediction")


class DimensionInferenceRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    target_room: Optional[str] = Field(default=None, description="Optional target room to predict, e.g. 'Living Room'")
    standard_ceiling_height_m: float = Field(default=2.8, ge=2.0, le=6.0, description="Standard ceiling height in meters")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded floor plan image")
    image_url: Optional[str] = Field(default=None, description="Publicly accessible URL to floor plan image")


class DimensionInferenceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    success: bool = True
    total_width_m: Optional[float] = Field(default=None, description="Estimated overall building envelope width")
    total_height_m: Optional[float] = Field(default=None, description="Estimated overall building envelope depth/length")
    total_area_sqm: Optional[float] = Field(default=None, description="Estimated total building area in square meters")
    overall_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    rooms: List[RoomDimensionPrediction] = Field(default_factory=list)
    model_version: str = "HomeVerse-ViT-Dimension-v1"
    validation_summary: Dict[str, Any] = Field(default_factory=dict)



class AnalysisChecklistItem(BaseModel):
    name: str = Field(..., description="Checklist item name")
    description: str = Field(..., description="Detail of check")
    passed: bool = Field(default=True, description="True if verified")
    details: Optional[str] = None


class RoomBlueprintData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    room_id: str = Field(..., description="Unique room identifier")
    source_label: str = Field(..., description="Exact label as printed on blueprint (e.g. BEDROOM-01)")
    room_type: str = Field(default="room", description="Canonical room category for shaders/models")
    width: Optional[float] = Field(default=None, description="Width in meters")
    depth: Optional[float] = Field(default=None, description="Depth / length in meters")
    height: float = Field(default=2.8, description="Standard ceiling height in meters")
    area: Optional[float] = Field(default=None, description="Floor area in square meters")
    
    # Metadata & Source Tracking (Crucial for HomeVerse debugging)
    dimension_source: DimensionSource = Field(default=DimensionSource.MISSING)
    scale_status: ScaleStatus = Field(default=ScaleStatus.UNCALIBRATED)
    width_source: Optional[str] = Field(default=None, description="Raw source text e.g. 11'11\"")
    depth_source: Optional[str] = Field(default=None, description="Raw source text e.g. 14'11\"")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    user_confirmed: bool = Field(default=False)
    
    # Error tracking against benchmark
    ground_truth_imperial: Optional[str] = Field(default=None)
    dimension_error_pct: Optional[float] = Field(default=None)
    is_valid: bool = Field(default=True)
    validation_notes: List[str] = Field(default_factory=list)
    
    # Pixel geometry if detected
    bbox_pixels: Optional[List[int]] = Field(default=None, description="[x1, y1, x2, y2]")


class BlueprintAnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    success: bool = True
    analysis_complete: bool = True
    pipeline_stage: PipelineStage = Field(default=PipelineStage.ALL_VERIFIED)
    
    # Scale Information
    scale_px_per_meter: Optional[float] = Field(default=None)
    scale_status: ScaleStatus = Field(default=ScaleStatus.VERIFIED)
    scale_reference_note: Optional[str] = None
    
    # Dimension Status Counts
    total_rooms_count: int = 0
    verified_rooms_count: int = 0
    missing_rooms_count: int = 0
    all_rooms_have_dimensions: bool = True
    
    # Room Collections
    verified_rooms: List[RoomBlueprintData] = Field(default_factory=list)
    missing_rooms: List[RoomBlueprintData] = Field(default_factory=list)
    all_rooms: List[RoomBlueprintData] = Field(default_factory=list)
    
    # Total Building Envelope
    total_width_m: Optional[float] = None
    total_height_m: Optional[float] = None
    total_area_sqm: Optional[float] = None
    
    # Live Visual Analysis Checklist
    checklist: List[AnalysisChecklistItem] = Field(default_factory=list)


class ScaleCalibrationRequest(BaseModel):
    reference_length_m: float = Field(..., gt=0.5, lt=100.0, description="Real world dimension in meters")
    reference_type: str = Field(default="overall_width", description="Type of reference: overall_width, overall_height, wall")
    reference_pixels: Optional[float] = Field(default=None, description="Pixel length in blueprint image")


class MissingRoomInput(BaseModel):
    width: float = Field(..., gt=0.5, lt=30.0, description="Room width in meters")
    depth: float = Field(..., gt=0.5, lt=30.0, description="Room depth in meters")
    height: Optional[float] = Field(default=2.8, gt=1.8, lt=6.0)


class MissingDimensionsSubmission(BaseModel):
    rooms: Dict[str, MissingRoomInput] = Field(..., description="Map of room_id or source_label to dimensions")


class FinalSceneConfirmationRequest(BaseModel):
    user_confirmed: bool = Field(..., description="Must be true to unlock 3D scene")
    confirmed_rooms: List[RoomBlueprintData] = Field(..., description="Final list of verified rooms")


class CanonicalSceneRoom(BaseModel):
    room_id: str
    source_label: str
    room_type: str
    width: float
    depth: float
    height: float
    area: float
    dimension_source: str
    scale_status: str
    user_confirmed: bool


class CanonicalSceneResponse(BaseModel):
    success: bool
    status: str
    can_proceed_to_3d: bool
    rejection_reason: Optional[str] = None
    rooms: List[CanonicalSceneRoom] = Field(default_factory=list)
    scene_metadata: Dict[str, Any] = Field(default_factory=dict)
