from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from app.schemas.design import Design

class ProjectBase(BaseModel):
    title: str
    room_type: str
    thumbnail: Optional[str] = None

class ProjectCreate(ProjectBase):
    user_id: UUID

class Project(ProjectBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    designs: List[Design] = []

    class Config:
        from_attributes = True
