from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from app.schemas.object import Object

class DesignBase(BaseModel):
    style: str
    image_url: str
    selected: Optional[bool] = False

class DesignCreate(DesignBase):
    project_id: UUID

class Design(DesignBase):
    id: UUID
    project_id: UUID
    objects: List[Object] = []

    class Config:
        from_attributes = True
