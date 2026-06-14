from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class ObjectBase(BaseModel):
    object_type: str
    position_x: Optional[float] = 0.0
    position_y: Optional[float] = 0.0
    position_z: Optional[float] = 0.0
    rotation: Optional[float] = 0.0
    scale: Optional[float] = 1.0
    material: Optional[str] = None

class ObjectCreate(ObjectBase):
    design_id: UUID

class ObjectUpdate(BaseModel):
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None
    rotation: Optional[float] = None
    scale: Optional[float] = None
    material: Optional[str] = None

class Object(ObjectBase):
    id: UUID
    design_id: UUID

    class Config:
        from_attributes = True
