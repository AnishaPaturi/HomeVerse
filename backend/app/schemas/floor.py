from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

class FloorBase(BaseModel):
    floor_number: int = Field(default=1, ge=0)
    name: str = Field(default="Ground Floor")
    level_type: str = Field(default="residential")  # residential, basement, rooftop, mezzanine
    area_sqft: Optional[float] = None

class FloorCreate(FloorBase):
    project_id: uuid.UUID

class FloorUpdate(BaseModel):
    floor_number: Optional[int] = None
    name: Optional[str] = None
    level_type: Optional[str] = None
    area_sqft: Optional[float] = None

class FloorOut(FloorBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
