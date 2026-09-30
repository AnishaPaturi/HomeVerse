"""
Calculation Service
Performs what-if delta calculations, cost impact evaluations, and cheaper alternative recommendations.
"""
from typing import Dict, Any, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.models.budget_allocation import BudgetAllocation
from app.models.room import Room
from app.schemas.budget import BudgetImpactSimulationRequest, BudgetImpactSimulationResponse, AlternativeItemOption

CATALOG_ALTERNATIVES = {
    "sofa": [
        {"name": "Nordic L-Shape Fabric Sectional", "price": 42000.0, "retailer": "HomeVerse Curated"},
        {"name": "Compact Modular Linen 3-Seater", "price": 28000.0, "retailer": "Urban Living Co."},
        {"name": "Ergonomic High-Density Foam Couch", "price": 22000.0, "retailer": "DecoFurnishings"},
    ],
    "bed": [
        {"name": "Engineered Wood Platform Bed with Storage", "price": 24000.0, "retailer": "SleepWell Living"},
        {"name": "Minimalist Solid Oak Bed Frame", "price": 31000.0, "retailer": "ScandiCraft"},
    ],
    "table": [
        {"name": "Extendable Tempered Glass Dining Table", "price": 18000.0, "retailer": "Urban Living Co."},
        {"name": "Solid Sheesham 4-Seater Dining Table", "price": 15000.0, "retailer": "CraftRoots"},
    ],
    "lighting": [
        {"name": "Dimmable Recessed LED Downlight Pack (x6)", "price": 4500.0, "retailer": "Lumiere Tech"},
        {"name": "Warm Brass Contemporary Pendant Lamp", "price": 3200.0, "retailer": "Nordic Lights"},
    ]
}

class CalculationService:
    @classmethod
    def evaluate_modification_impact(
        cls,
        db: Session,
        request: BudgetImpactSimulationRequest
    ) -> BudgetImpactSimulationResponse:
        budget = db.query(Budget).filter(Budget.project_id == request.project_id).first()
        total_budget = budget.total_budget if budget else 1000000.0
        flexibility = budget.flexibility if budget else "Moderate"

        # Calculate current room allocation/spend
        current_room_allocations = []
        if request.room_id and budget:
            current_room_allocations = db.query(BudgetAllocation).filter(
                BudgetAllocation.budget_id == budget.id,
                BudgetAllocation.room_id == request.room_id
            ).all()

        current_room_budget = sum(a.allocated_amount for a in current_room_allocations) or (total_budget * 0.25)
        
        delta = request.new_item_cost - request.current_item_cost
        new_room_budget = round(current_room_budget + delta, 2)
        
        remaining_before = budget.remaining_amount if budget else (total_budget - current_room_budget)
        remaining_after = round(remaining_before - delta, 2)

        # Flexibility tolerance:
        # Strict: 0% tolerance
        # Moderate: 5% tolerance over total budget
        # Flexible: 15% tolerance over total budget
        flexibility_multipliers = {"Strict": 0.0, "Moderate": 0.05, "Flexible": 0.15}
        buffer = total_budget * flexibility_multipliers.get(flexibility, 0.05)
        is_within = (remaining_after + buffer) >= 0.0

        if delta > 0:
            impact_message = f"This change is estimated to increase the room budget by ₹{delta:,.2f}."
        elif delta < 0:
            impact_message = f"This change saves ₹{abs(delta):,.2f} from the room budget."
        else:
            impact_message = "No budget change for this modification."

        # Suggest cheaper alternatives if cost increased
        alternatives: List[AlternativeItemOption] = []
        if delta > 0:
            item_key = request.action_type.lower()
            for key in CATALOG_ALTERNATIVES:
                if key in item_key or key in request.item_category.lower() or (request.description and key in request.description.lower()):
                    for alt in CATALOG_ALTERNATIVES[key]:
                        if alt["price"] < request.new_item_cost:
                            alternatives.append(AlternativeItemOption(
                                name=alt["name"],
                                price=alt["price"],
                                savings=round(request.new_item_cost - alt["price"], 2),
                                retailer=alt["retailer"]
                            ))
                    break

        return BudgetImpactSimulationResponse(
            project_id=request.project_id,
            current_room_budget=current_room_budget,
            new_room_budget=new_room_budget,
            delta_amount=delta,
            total_budget=total_budget,
            remaining_budget_before=remaining_before,
            remaining_budget_after=remaining_after,
            is_within_budget=is_within,
            budget_flexibility=flexibility,
            impact_message=impact_message,
            cheaper_alternatives=alternatives
        )
