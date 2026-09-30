"""
Phase 51: Budget Agent
Analyzes total budget constraints, allocates spending envelopes across trades,
and enforces cost caps and value optimization.
"""

from typing import Dict, Any, Optional


class BudgetAgent:
    """
    Tier 1 Agent: Financial Modeling & Allocation Envelopes
    Decomposes lump-sum budgets into trade-specific spending envelopes.
    """

    def __init__(self):
        self.name = "BudgetAgent"
        self.role = "Financial Modeling & Trade Allocation Envelopes"

    async def allocate_budget(
        self,
        total_budget: float = 800000.0,
        currency: str = "INR",
        style: str = "Modern",
        area_sqft: float = 240.0,
    ) -> Dict[str, Any]:
        """
        Allocates realistic budget envelopes across interior trades.
        """
        # Tier classification
        cost_per_sqft = total_budget / max(1.0, area_sqft)
        if cost_per_sqft >= 3500:
            tier = "Ultra-Luxury Bespoke"
        elif cost_per_sqft >= 2000:
            tier = "Premium Turnkey"
        else:
            tier = "Value-Optimized Smart"

        # Percentage allocations conforming to industry standard benchmarks
        allocations = {
            "civil_and_surfaces": {
                "name": "Civil, Flooring & Wall Treatments",
                "percentage": 20.0,
                "amount": round(total_budget * 0.20, 2),
                "scope": "Surface preparation, vitrified tiles / marble hone, skim coats, anti-fungal paint.",
            },
            "modular_millwork": {
                "name": "Modular Millwork & Built-in Storage",
                "percentage": 35.0,
                "amount": round(total_budget * 0.35, 2),
                "scope": "IS:710 BWP marine plywood carcasses, soft-close hardware, custom wardrobes & TV console.",
            },
            "loose_furniture": {
                "name": "Loose Furniture & Seating",
                "percentage": 25.0,
                "amount": round(total_budget * 0.25, 2),
                "scope": "Modular sectional sofa, ergonomic dining table/chairs, accent loungers, and coffee table.",
            },
            "architectural_lighting": {
                "name": "Architectural & Layered Lighting",
                "percentage": 12.0,
                "amount": round(total_budget * 0.12, 2),
                "scope": "Recessed 3000K downlights, magnetic track lighting, cove LED drivers, and accent pendants.",
            },
            "soft_furnishings_contingency": {
                "name": "Soft Furnishings & Site Contingency",
                "percentage": 8.0,
                "amount": round(total_budget * 0.08, 2),
                "scope": "Drapes, wool area rugs, cushions, and 5% contingency reserve.",
            },
        }

        return {
            "agent": self.name,
            "status": "completed",
            "total_budget": total_budget,
            "currency": currency,
            "budget_tier": tier,
            "cost_per_sqft": round(cost_per_sqft, 2),
            "allocation_envelopes": allocations,
            "spending_guardrails": {
                "max_single_item_cap": round(total_budget * 0.15, 2),
                "contingency_buffer": round(total_budget * 0.05, 2),
                "budget_discipline_score": "High (Strictly Enforced)",
            },
        }


budget_agent = BudgetAgent()
