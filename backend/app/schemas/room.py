from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

class RoomImageOut(BaseModel):
    id: uuid.UUID
    room_id: uuid.UUID
    image_url: str
    image_type: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RoomBase(BaseModel):
    name: str = Field(..., min_length=1)
    room_type: str = Field(default="Living Room")
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = 2.8
    area: Optional[float] = None
    status: Optional[str] = "planning"
    floor_id: Optional[uuid.UUID] = None

class RoomCreate(RoomBase):
    project_id: uuid.UUID

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    room_type: Optional[str] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    area: Optional[float] = None
    status: Optional[str] = None
    floor_id: Optional[uuid.UUID] = None

class RoomOut(RoomBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime
    images: List[RoomImageOut] = []
    model_config = ConfigDict(from_attributes=True)
