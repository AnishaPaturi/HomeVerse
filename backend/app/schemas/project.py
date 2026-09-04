from pydantic import BaseModel, ConfigDict, model_validator
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any, Dict
from app.schemas.design import Design

class ProjectBase(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    property_type: Optional[str] = "apartment"
    bhk: Optional[int] = None
    area_sqft: Optional[float] = None
    budget: Optional[float] = None
    currency: Optional[str] = "INR"
    room_type: Optional[str] = "Living Room"
    thumbnail: Optional[str] = None
    structural_analysis: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_name_and_title(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "name" in data and not data.get("title"):
                data["title"] = data["name"]
            elif "title" in data and not data.get("name"):
                data["name"] = data["title"]
        return data

class ProjectCreate(ProjectBase):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    floor_plan_url: Optional[str] = None
    lifestyle: Optional[Dict[str, Any]] = None
    preferences: Optional[Dict[str, Any]] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    property_type: Optional[str] = None
    bhk: Optional[int] = None
    area_sqft: Optional[float] = None
    budget: Optional[float] = None
    currency: Optional[str] = None
    room_type: Optional[str] = None
    thumbnail: Optional[str] = None
    structural_analysis: Optional[str] = None

class Project(ProjectBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    designs: List[Design] = []

    model_config = ConfigDict(from_attributes=True)
