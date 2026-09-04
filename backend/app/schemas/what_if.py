from typing import List, Optional, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class ItemModification(BaseModel):
    action: Literal["add", "modify", "remove", "keep"]
    name: str
    category: str
    original_material: Optional[str] = None
    new_material: Optional[str] = None
    original_cost: float = 0.0
    new_cost: float = 0.0
    cost_delta: float = 0.0
    reason: str

class CostSimulationSummary(BaseModel):
    original_total_cost: float
    new_total_cost: float
    net_cost_difference: float
    project_budget: Optional[float] = None
    remaining_budget_after: Optional[float] = None
    savings_or_increase_text: str

class WhatIfQueryRequest(BaseModel):
    design_id: UUID
    query: str = Field(..., description="User's 'What If?' question or hypothesis")
    preset_type: Optional[str] = Field(
        default=None,
        description="Optional preset: reduce_budget, more_storage, luxury_look, add_work_desk, custom"
    )
    budget_delta: Optional[float] = Field(
        default=None,
        description="Target amount in INR for budget reduction/addition, e.g. -100000"
    )

class WhatIfScenarioResponse(BaseModel):
    scenario_id: str
    design_id: UUID
    query: str
    scenario_title: str
    summary: str
    design_changes: List[str]
    furniture_changes: List[str]
    material_changes: List[str]
    cost_summary: CostSimulationSummary
    modified_items: List[ItemModification]
    prompt_preview: str
    can_apply: bool = True

class WhatIfApplyRequest(BaseModel):
    design_id: UUID
    scenario_id: str
    regenerate_render: Optional[bool] = False

class WhatIfPresetOption(BaseModel):
    id: str
    title: str
    query: str
    description: str
    category: str
    icon: str
