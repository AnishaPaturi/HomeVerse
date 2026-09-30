"""
Generation Service
Orchestrates AI room design generation conditioned on budget tiers and room constraints.
"""
from typing import Dict, Any, List
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.design import Design
from app.models.budget import Budget
from app.models.room import Room

STYLE_SEEDS = {
    "Modern": 100,
    "Scandinavian": 200,
    "Modern Luxury": 300,
    "Japandi": 400,
    "Industrial": 500,
    "Contemporary": 600,
}

class GenerationService:
    @staticmethod
    def generate_style_variants(
        db: Session,
        project_id: UUID,
        room_id: UUID,
        room_type: str,
        budget_tier: str = "10L"
    ) -> List[Design]:
        # Check budget context
        budget = db.query(Budget).filter(Budget.project_id == project_id).first()
        total_budget = budget.total_budget if budget else 1000000.0

        # Estimate room budget (default 25% of house budget)
        estimated_room_budget = round(total_budget * 0.25, 2)

        styles = ["Modern", "Japandi", "Scandinavian", "Modern Luxury"]
        created_designs: List[Design] = []

        room_slug = room_type.lower().replace(" ", "_")
        for style in styles:
            seed = STYLE_SEEDS.get(style, 100)
            cost_multiplier = 1.3 if "Luxury" in style else 0.9 if "Scandinavian" in style else 1.0
            variant_cost = round(estimated_room_budget * cost_multiplier, 2)
            
            img_url = f"https://image.pollinations.ai/prompt/{style.lower()}_interior_design_{room_slug}_concept?width=800&height=600&nologo=true&seed={seed}"

            design = Design(
                id=uuid.uuid4(),
                project_id=project_id,
                room_id=room_id,
                name=f"{style} {room_type}",
                style=style,
                description=f"AI crafted {style} layout optimized for ₹{variant_cost:,.2f} budget allocation.",
                estimated_cost=variant_cost,
                image_url=img_url,
                status="completed"
            )
            db.add(design)
            created_designs.append(design)

        db.commit()
        for d in created_designs:
            db.refresh(d)
        return created_designs
