from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

class BudgetAllocationBase(BaseModel):
    category: str = Field(..., description="Category: Furniture, Lighting, Flooring, Walls, Ceiling, Materials, Decor, Electrical, Other")
    allocated_amount: float = Field(default=0.0, ge=0)
    estimated_amount: float = Field(default=0.0, ge=0)
    actual_amount: float = Field(default=0.0, ge=0)
    floor_id: Optional[uuid.UUID] = None
    room_id: Optional[uuid.UUID] = None

class BudgetAllocationCreate(BudgetAllocationBase):
    pass

class BudgetAllocationOut(BudgetAllocationBase):
    id: uuid.UUID
    budget_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BudgetBase(BaseModel):
    total_budget: float = Field(..., ge=0, description="Total house budget in project currency")
    currency: str = Field(default="INR")
    flexibility: str = Field(default="Moderate", description="Strict, Moderate, or Flexible")

class BudgetCreate(BudgetBase):
    project_id: uuid.UUID
    estimated_amount: Optional[float] = 0.0
    spent_amount: Optional[float] = 0.0

class BudgetUpdate(BaseModel):
    total_budget: Optional[float] = None
    currency: Optional[str] = None
    flexibility: Optional[str] = None
    spent_amount: Optional[float] = None
    estimated_amount: Optional[float] = None
    remaining_amount: Optional[float] = None

class BudgetOut(BudgetBase):
    id: uuid.UUID
    project_id: uuid.UUID
    spent_amount: float
    estimated_amount: float
    remaining_amount: float
    created_at: datetime
    updated_at: datetime
    allocations: List[BudgetAllocationOut] = []
    model_config = ConfigDict(from_attributes=True)

class BudgetImpactSimulationRequest(BaseModel):
    project_id: uuid.UUID
    room_id: Optional[uuid.UUID] = None
    action_type: str = Field(..., description="e.g. modify_object, add_object, change_style, resize_item")
    item_category: str = "Furniture"
    current_item_cost: float = 0.0
    new_item_cost: float = 0.0
    description: Optional[str] = None

class AlternativeItemOption(BaseModel):
    name: str
    price: float
    savings: float
    image_url: Optional[str] = None
    retailer: Optional[str] = None

class BudgetImpactSimulationResponse(BaseModel):
    project_id: uuid.UUID
    current_room_budget: float
    new_room_budget: float
    delta_amount: float
    total_budget: float
    remaining_budget_before: float
    remaining_budget_after: float
    is_within_budget: bool
    budget_flexibility: str
    impact_message: str
    cheaper_alternatives: List[AlternativeItemOption] = []
