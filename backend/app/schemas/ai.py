from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class AIChatRequest(BaseModel):
    project_id: uuid.UUID
    room_id: Optional[uuid.UUID] = None
    prompt: str = Field(..., min_length=1)
    current_style: Optional[str] = "Modern"
    context: Optional[Dict[str, Any]] = None

class CheaperAlternative(BaseModel):
    item_name: str
    material: str
    estimated_price: float
    potential_savings: float
    source: Optional[str] = "Local Vendor / Catalog"

class AIChangeSuggestion(BaseModel):
    element: str
    action: str  # replace, resize, remove, recolor
    from_value: str
    to_value: str
    cost_difference: float
    reason: str

class AIChatResponse(BaseModel):
    response: str
    agent: str = "DesignCopilot"
    budget_impact: float = 0.0
    budget_message: Optional[str] = None
    suggested_changes: List[AIChangeSuggestion] = []
    cheaper_alternatives: List[CheaperAlternative] = []

class HouseModelCreationRequest(BaseModel):
    project_id: uuid.UUID
    property_type: str = "apartment"
    budget: float = 1000000.0
    budget_flexibility: str = "Moderate"
    num_floors: int = 1
    num_rooms: int = 4
    house_details: Optional[Dict[str, Any]] = None

class ScratchDesignInitRequest(BaseModel):
    project_id: uuid.UUID
    room_type: str
    budget: float
    style: Optional[str] = "Modern"
