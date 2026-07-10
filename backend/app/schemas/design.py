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
    direction: Optional[str] = None
    layout_variant: Optional[str] = None
    image_url_left: Optional[str] = None
    image_url_right: Optional[str] = None
    image_url_back: Optional[str] = None
    image_url_front: Optional[str] = None

    objects: List[Object] = []


    class Config:
        from_attributes = True
