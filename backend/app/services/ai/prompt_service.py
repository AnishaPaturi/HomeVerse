"""
Prompt Service
Injects financial envelopes, room dimensions, house constraints, and materials into AI prompt engineering.
"""
from typing import Dict, Any, Optional
from app.models.budget import Budget
from app.models.room import Room
from app.models.project import Project

class PromptService:
    @staticmethod
    def build_budget_aware_design_prompt(
        room: Room,
        project: Project,
        budget: Optional[Budget],
        style: str,
        user_preference: Optional[str] = None
    ) -> str:
        total_budget = budget.total_budget if budget else (project.budget or 1000000.0)
        currency = budget.currency if budget else "INR"
        flexibility = budget.flexibility if budget else "Moderate"

        # Calculate reasonable envelope for this specific room
        room_allocation = round(total_budget * 0.25, 2)
        dimensions_str = f"{room.length or 4.0}m x {room.width or 4.0}m, ceiling {room.height or 2.8}m"

        prompt = (
            f"Professional interior design rendering of a {room.room_type} ({room.name}). "
            f"Architectural dimensions: {dimensions_str}. "
            f"Aesthetic Style: {style}. "
            f"Budget guardrail: Maximum ₹{room_allocation:,.0f} {currency} ({flexibility} adherence). "
            f"Key furnishings: proportioned to room scale, high functional clearance, layered lighting. "
            f"Materials: durable quality matching {style} aesthetic within the allocated cost tier. "
            f"Photorealistic 8k, architectural digest photography, raytraced ambient occlusion."
        )

        if user_preference:
            prompt += f" Client specific note: {user_preference}."

        return prompt

    @staticmethod
    def build_copilot_context_prompt(
        user_message: str,
        project: Project,
        budget: Optional[Budget],
        room: Optional[Room],
        current_style: str = "Modern"
    ) -> Dict[str, Any]:
        total_budget = budget.total_budget if budget else (project.budget or 1000000.0)
        spent = budget.spent_amount if budget else 0.0
        remaining = budget.remaining_amount if budget else total_budget
        flexibility = budget.flexibility if budget else "Moderate"

        return {
            "system_directive": (
                "You are the HomeVerse AI Architect and Financial Copilot. "
                "You provide design guidance strictly calibrated to the project's financial budget. "
                "Whenever the user asks to add, resize, upgrade, or modify a furniture piece or material, "
                "you must calculate the estimated financial impact, warn if it exceeds the room allocation, "
                "and propose high-value value-engineered alternatives."
            ),
            "financial_context": {
                "total_budget": total_budget,
                "spent_amount": spent,
                "remaining_amount": remaining,
                "currency": budget.currency if budget else "INR",
                "flexibility": flexibility
            },
            "spatial_context": {
                "room_name": room.name if room else "General",
                "room_type": room.room_type if room else "Living Room",
                "dimensions": f"{room.length or 4.0}m x {room.width or 4.0}m" if room else "Standard",
                "current_style": current_style
            },
            "user_prompt": user_message
        }
