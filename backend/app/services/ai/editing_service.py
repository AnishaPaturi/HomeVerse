"""
Editing Service
Processes natural language room modification commands with budget impact simulation.
"""
from typing import Dict, Any, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.budget import Budget
from app.models.room import Room
from app.schemas.ai import AIChatResponse, AIChangeSuggestion, CheaperAlternative
from app.services.budget.calculation_service import CalculationService, CATALOG_ALTERNATIVES

class EditingService:
    @staticmethod
    def process_modification(
        db: Session,
        project_id: UUID,
        prompt: str,
        room_id: Optional[UUID] = None,
        current_style: str = "Modern"
    ) -> AIChatResponse:
        project = db.query(Project).filter(Project.id == project_id).first()
        budget = db.query(Budget).filter(Budget.project_id == project_id).first()
        room = db.query(Room).filter(Room.id == room_id).first() if room_id else None

        p_lower = prompt.lower()
        delta = 0.0
        suggestions: List[AIChangeSuggestion] = []
        alternatives: List[CheaperAlternative] = []

        # Example 1: User says "Make the sofa bigger" / "larger sofa"
        if "sofa" in p_lower and ("bigger" in p_lower or "larger" in p_lower or "expand" in p_lower or "sectional" in p_lower):
            delta = 35000.0
            suggestions.append(AIChangeSuggestion(
                element="Sofa",
                action="resize",
                from_value="3-Seater Standard (2.1m)",
                to_value="Modular 5-Seater L-Sectional (3.2m)",
                cost_difference=35000.0,
                reason="Expanded seating footprint requires higher-density HR foam & premium fabric yardage."
            ))
            alternatives.append(CheaperAlternative(
                item_name="Modular 4-Seater with Chaise",
                material="Performance Poly-Linen",
                estimated_price=48000.0,
                potential_savings=15000.0,
                source="HomeVerse Curated Millwork"
            ))
            alternatives.append(CheaperAlternative(
                item_name="Compact L-Sectional with Storage Ottoman",
                material="Textured Weave Chenille",
                estimated_price=42000.0,
                potential_savings=21000.0,
                source="Urban Living Co."
            ))

        # Example 2: Luxury request
        elif "luxury" in p_lower or "marble" in p_lower or "chandelier" in p_lower:
            delta = 75000.0
            suggestions.append(AIChangeSuggestion(
                element="Finishes & Lighting",
                action="replace",
                from_value="Standard Vitrified & Downlights",
                to_value="Italian Statuario Marble Accent & Brass Chandelier",
                cost_difference=75000.0,
                reason="Upgraded surface materials and designer statement luminaires."
            ))
            alternatives.append(CheaperAlternative(
                item_name="Large Format Glazed Vitrified Tile (GVT)",
                material="Bookmatched Onyx Finish",
                estimated_price=32000.0,
                potential_savings=43000.0,
                source="Ceramic World"
            ))

        # Example 3: Table / Dining changes
        elif "table" in p_lower or "dining" in p_lower:
            delta = 18000.0
            suggestions.append(AIChangeSuggestion(
                element="Dining Table",
                action="replace",
                from_value="4-Seater Oak Table",
                to_value="6-Seater Solid Teak Table",
                cost_difference=18000.0,
                reason="Solid wood extension with matching high-back chairs."
            ))

        # Default natural modification
        else:
            delta = 12000.0
            suggestions.append(AIChangeSuggestion(
                element="Room Layout",
                action="modify",
                from_value="Current Layout",
                to_value="Optimized Arrangement",
                cost_difference=delta,
                reason=f"Applying custom adjustment: '{prompt}'"
            ))

        total_b = budget.total_budget if budget else (project.budget or 1000000.0)
        room_b = total_b * 0.25
        new_room_b = room_b + delta

        budget_msg = (
            f"This change is estimated to increase the room budget by ₹{delta:,.0f}. "
            f"(Current Room Estimate: ₹{room_b:,.0f} → New: ₹{new_room_b:,.0f})"
        )

        response_text = (
            f"I have analyzed your request: '{prompt}'. "
            f"Based on your {current_style} aesthetic and budget guardrails, "
            f"I can adjust the spatial blueprint. Note that this modification increases the cost envelope. "
            f"Review the options below to apply directly or inspect value-engineered alternatives."
        )

        return AIChatResponse(
            response=response_text,
            agent="BudgetAwareArchitect",
            budget_impact=delta,
            budget_message=budget_msg,
            suggested_changes=suggestions,
            cheaper_alternatives=alternatives
        )
