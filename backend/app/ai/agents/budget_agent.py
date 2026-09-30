"""
Budget Agent
Tier 1 Financial Modeling Agent:
Decomposes lump-sum house budgets into trade-specific spending envelopes,
enforces cost caps, dynamically evaluates delta changes, and recommends value-engineered alternatives.
"""
from typing import Dict, Any, Optional, List

class BudgetAgent:
    def __init__(self):
        self.name = "BudgetAgent"
        self.role = "Financial Modeling, Trade Envelopes & Cost Optimization"

    async def allocate_budget(
        self,
        total_budget: float = 1000000.0,
        currency: str = "INR",
        style: str = "Modern",
        area_sqft: float = 1200.0,
        flexibility: str = "Moderate"
    ) -> Dict[str, Any]:
        """
        Allocates realistic budget envelopes across architectural and interior trades.
        """
        cost_per_sqft = total_budget / max(1.0, area_sqft)
        if cost_per_sqft >= 3500:
            tier = "Ultra-Luxury Bespoke"
        elif cost_per_sqft >= 2000:
            tier = "Premium Turnkey"
        elif cost_per_sqft >= 1200:
            tier = "Standard Contemporary"
        else:
            tier = "Value-Optimized Smart"

        allocations = {
            "civil_and_surfaces": {
                "name": "Civil, Flooring & Wall Treatments",
                "percentage": 20.0,
                "amount": round(total_budget * 0.20, 2),
                "scope": "Surface preparation, vitrified tiles / marble hone, skim coats, anti-fungal paint."
            },
            "modular_millwork": {
                "name": "Modular Millwork & Built-in Storage",
                "percentage": 35.0,
                "amount": round(total_budget * 0.35, 2),
                "scope": "BWP marine plywood carcasses, soft-close hardware, custom wardrobes & TV console."
            },
            "loose_furniture": {
                "name": "Loose Furniture & Seating",
                "percentage": 25.0,
                "amount": round(total_budget * 0.25, 2),
                "scope": "Modular sectional sofa, ergonomic dining table/chairs, accent loungers, and coffee table."
            },
            "architectural_lighting": {
                "name": "Architectural & Layered Lighting",
                "percentage": 12.0,
                "amount": round(total_budget * 0.12, 2),
                "scope": "Recessed 3000K downlights, magnetic track lighting, cove LED drivers, and accent pendants."
            },
            "soft_furnishings_contingency": {
                "name": "Soft Furnishings & Site Contingency",
                "percentage": 8.0,
                "amount": round(total_budget * 0.08, 2),
                "scope": "Drapes, wool area rugs, cushions, and site contingency reserve."
            }
        }

        # Guardrails based on flexibility
        max_item_cap = 0.20 if flexibility == "Flexible" else 0.15 if flexibility == "Moderate" else 0.10

        return {
            "agent": self.name,
            "status": "completed",
            "total_budget": total_budget,
            "currency": currency,
            "budget_tier": tier,
            "flexibility": flexibility,
            "cost_per_sqft": round(cost_per_sqft, 2),
            "allocation_envelopes": allocations,
            "spending_guardrails": {
                "max_single_item_cap": round(total_budget * max_item_cap, 2),
                "contingency_buffer": round(total_budget * 0.05, 2),
                "budget_discipline_score": f"High ({flexibility} Adherence)"
            }
        }

    async def evaluate_change_cost(
        self,
        current_cost: float,
        new_cost: float,
        room_allocation: float,
        flexibility: str = "Moderate"
    ) -> Dict[str, Any]:
        """
        Evaluates a spatial item alteration (e.g. larger sofa or marble upgrade).
        """
        delta = new_cost - current_cost
        new_total_room = room_allocation + delta
        tolerance = 0.15 if flexibility == "Flexible" else 0.05 if flexibility == "Moderate" else 0.0
        exceeds = delta > (room_allocation * tolerance)

        return {
            "delta": delta,
            "current_room_cost": room_allocation,
            "new_room_cost": new_total_room,
            "exceeds_tolerance": exceeds,
            "message": f"This change is estimated to increase the room budget by ₹{delta:,.0f}." if delta > 0 else f"Saves ₹{abs(delta):,.0f}."
        }

budget_agent = BudgetAgent()
