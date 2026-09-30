from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class SceneObjectBase(BaseModel):
    object_type: str = Field(..., description="e.g. sofa, bed, chair, desk, lamp, table, wall, floor")
    name: Optional[str] = None
    position_x: float = 0.0
    position_y: float = 0.0
    position_z: float = 0.0
    rotation: float = 0.0
    scale: float = 1.0
    material: Optional[str] = None
    color: Optional[str] = None
    product_id: Optional[uuid.UUID] = None
    unit_price: float = 0.0

class SceneObjectCreate(SceneObjectBase):
    scene_id: uuid.UUID

class SceneObjectUpdate(BaseModel):
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None
    rotation: Optional[float] = None
    scale: Optional[float] = None
    material: Optional[str] = None
    color: Optional[str] = None
    unit_price: Optional[float] = None

class SceneObjectOut(SceneObjectBase):
    id: uuid.UUID
    scene_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SceneBase(BaseModel):
    name: str = "Room 3D View"
    scene_type: str = "room"  # room, floor, house, walkthrough
    camera_settings: Optional[str] = None
    lighting_settings: Optional[str] = None

class SceneCreate(SceneBase):
    project_id: uuid.UUID
    room_id: Optional[uuid.UUID] = None

class SceneUpdate(BaseModel):
    name: Optional[str] = None
    camera_settings: Optional[str] = None
    lighting_settings: Optional[str] = None

class SceneOut(SceneBase):
    id: uuid.UUID
    project_id: uuid.UUID
    room_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    scene_objects: List[SceneObjectOut] = []
    model_config = ConfigDict(from_attributes=True)
