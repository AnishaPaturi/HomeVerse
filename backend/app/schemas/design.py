from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.object import Object

class DesignItemBase(BaseModel):
    name: str = Field(..., description="Name of the design item, e.g. Sofa, TV unit")
    category: str = Field(..., description="Category: Furniture, Lighting, Decor, Civil, Paint, etc.")
    quantity: float = Field(default=1.0, ge=0.0, description="Quantity of items")
    unit_cost: float = Field(default=0.0, ge=0.0, description="Unit cost in standard currency (INR)")

class DesignItemCreate(DesignItemBase):
    product_id: Optional[UUID] = None

class DesignItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = Field(default=None, ge=0.0)
    unit_cost: Optional[float] = Field(default=None, ge=0.0)
    product_id: Optional[UUID] = None

class DesignItemOut(DesignItemBase):
    id: UUID
    design_id: UUID
    total_cost: float = Field(..., description="total_cost = quantity * unit_cost")
    product_id: Optional[UUID] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CategoryCostBreakdown(BaseModel):
    category: str
    total_cost: float
    item_count: int
    percentage: float

class DesignCostSummary(BaseModel):
    design_id: UUID
    design_name: Optional[str] = None
    style: str
    total_cost: float
    item_count: int
    items: List[DesignItemOut] = []
    category_breakdown: List[CategoryCostBreakdown] = []
    project_id: Optional[UUID] = None
    total_budget: Optional[float] = None
    remaining_budget: Optional[float] = None
    within_budget: Optional[bool] = None

class DesignBase(BaseModel):
    style: str
    image_url: Optional[str] = ""
    selected: Optional[bool] = False
    name: Optional[str] = None
    description: Optional[str] = None
    room_id: Optional[UUID] = None
    estimated_cost: Optional[float] = 0.0
    status: Optional[str] = "generated"

class DesignCreate(DesignBase):
    id: Optional[UUID] = None
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
    items: List[DesignItemOut] = []

    model_config = ConfigDict(from_attributes=True)
