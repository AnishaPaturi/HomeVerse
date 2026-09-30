from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class DetectedRoomSchema(BaseModel):
    name: str
    room_type: str
    width_m: float
    length_m: float
    area_sqm: float
    confidence: float = 0.95
    suggested_budget_share: float = 0.20
    coordinates: Optional[Dict[str, Any]] = None

class FloorplanAnalysisResponse(BaseModel):
    floorplan_id: uuid.UUID
    image_url: str
    status: str
    scale_px_per_meter: float
    total_area_sqm: float
    total_area_sqft: float
    detected_rooms: List[DetectedRoomSchema]
    detected_doors_count: int
    detected_windows_count: int
    raw_analysis: Optional[Dict[str, Any]] = None

class FloorplanConfirmRequest(BaseModel):
    floorplan_id: uuid.UUID
    confirmed_rooms: List[DetectedRoomSchema]
    scale_correction: Optional[float] = None

class FloorplanOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    floor_id: Optional[uuid.UUID] = None
    image_url: str
    dimensions_data: Optional[str] = None
    detected_rooms: Optional[str] = None
    scale: float
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
