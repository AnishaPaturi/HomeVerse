"""
Design Cost Calculation Engine (Phase 15)
Calculates design item costs, category rollups, design totals,
and links with project budget constraints.
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.design import Design, DesignItem
from app.models.budget import Budget, BudgetCategory
from app.schemas.design import (
    DesignItemCreate,
    DesignItemUpdate,
    DesignCostSummary,
    CategoryCostBreakdown,
    DesignItemOut,
)

SAMPLE_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    # Phase 15 exact specification example:
    # Sofa: ₹50,000, TV unit: ₹30,000, Lighting: ₹10,000, Decor: ₹15,000 -> Total: ₹1,05,000
    "living_room": [
        {"name": "Sofa", "category": "Furniture", "quantity": 1.0, "unit_cost": 50000.0},
        {"name": "TV unit", "category": "Furniture", "quantity": 1.0, "unit_cost": 30000.0},
        {"name": "Lighting", "category": "Lighting", "quantity": 1.0, "unit_cost": 10000.0},
        {"name": "Decor", "category": "Decor", "quantity": 1.0, "unit_cost": 15000.0},
    ],
    "bedroom": [
        {"name": "King Size Bed", "category": "Furniture", "quantity": 1.0, "unit_cost": 45000.0},
        {"name": "Wardrobe (3-door)", "category": "Wardrobes", "quantity": 1.0, "unit_cost": 65000.0},
        {"name": "Bedside Tables", "category": "Furniture", "quantity": 2.0, "unit_cost": 6000.0},
        {"name": "Ambient Pendant Lights", "category": "Lighting", "quantity": 2.0, "unit_cost": 4500.0},
        {"name": "Blackout Curtains", "category": "Curtains", "quantity": 1.0, "unit_cost": 12000.0},
    ],
    "kitchen": [
        {"name": "Modular Base Cabinets", "category": "Kitchen", "quantity": 1.0, "unit_cost": 85000.0},
        {"name": "Overhead Storage & Chimney", "category": "Kitchen", "quantity": 1.0, "unit_cost": 45000.0},
        {"name": "Under-cabinet LED Strips", "category": "Lighting", "quantity": 3.0, "unit_cost": 2500.0},
        {"name": "Granite Countertop Finishing", "category": "Civil", "quantity": 1.0, "unit_cost": 30000.0},
    ]
}


class CostCalculatorService:
    @staticmethod
    def calculate_item_cost(quantity: float, unit_cost: float) -> float:
        """
        Formula: total_cost = quantity * unit_cost
        """
        return round(float(quantity) * float(unit_cost), 2)

    @classmethod
    def get_cost_summary(cls, db: Session, design_id: UUID) -> DesignCostSummary:
        """
        Calculates full itemized cost summary, category breakdown,
        and project budget comparison for a design.
        """
        design = db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Design with id {design_id} not found",
            )

        items = db.query(DesignItem).filter(DesignItem.design_id == design_id).all()

        total_cost = 0.0
        category_map: Dict[str, Dict[str, Any]] = {}
        item_outs: List[DesignItemOut] = []

        for item in items:
            expected_total = cls.calculate_item_cost(item.quantity, item.unit_cost)
            if item.total_cost != expected_total:
                item.total_cost = expected_total
                db.add(item)

            total_cost += item.total_cost
            cat = item.category or "General"
            if cat not in category_map:
                category_map[cat] = {"total_cost": 0.0, "item_count": 0}
            category_map[cat]["total_cost"] += item.total_cost
            category_map[cat]["item_count"] += 1

            item_outs.append(DesignItemOut.model_validate(item))

        # Synchronize design estimated_cost
        total_cost = round(total_cost, 2)
        if design.estimated_cost != total_cost:
            design.estimated_cost = total_cost
            db.add(design)
        db.commit()

        # Category breakdowns with percentages
        breakdowns: List[CategoryCostBreakdown] = []
        for cat_name, val in sorted(category_map.items()):
            subtotal = round(val["total_cost"], 2)
            pct = round((subtotal / total_cost * 100.0), 1) if total_cost > 0 else 0.0
            breakdowns.append(
                CategoryCostBreakdown(
                    category=cat_name,
                    total_cost=subtotal,
                    item_count=val["item_count"],
                    percentage=pct,
                )
            )

        # Retrieve project budget context if associated
        project_budget: Optional[float] = None
        remaining_budget: Optional[float] = None
        within_budget: Optional[bool] = None

        if design.project_id:
            budget_obj = db.query(Budget).filter(Budget.project_id == design.project_id).first()
            if budget_obj and budget_obj.total_budget > 0:
                project_budget = budget_obj.total_budget
                remaining_budget = round(project_budget - total_cost, 2)
                within_budget = total_cost <= project_budget

        return DesignCostSummary(
            design_id=design.id,
            design_name=design.name or f"{design.style} Design",
            style=design.style,
            total_cost=total_cost,
            item_count=len(items),
            items=item_outs,
            category_breakdown=breakdowns,
            project_id=design.project_id,
            total_budget=project_budget,
            remaining_budget=remaining_budget,
            within_budget=within_budget,
        )

    @classmethod
    def add_item(cls, db: Session, design_id: UUID, item_in: DesignItemCreate) -> DesignItem:
        """
        Creates a design item ensuring total_cost = quantity * unit_cost,
        and synchronizes the parent design's estimated cost.
        """
        design = db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Design with id {design_id} not found",
            )

        total_cost = cls.calculate_item_cost(item_in.quantity, item_in.unit_cost)

        new_item = DesignItem(
            id=uuid.uuid4(),
            design_id=design_id,
            name=item_in.name,
            category=item_in.category,
            quantity=item_in.quantity,
            unit_cost=item_in.unit_cost,
            total_cost=total_cost,
            product_id=item_in.product_id,
        )
        db.add(new_item)
        db.flush()

        cls._recalculate_design_total(db, design)
        db.commit()
        db.refresh(new_item)
        return new_item

    @classmethod
    def update_item(cls, db: Session, item_id: UUID, update_in: DesignItemUpdate) -> DesignItem:
        """
        Updates an item, recalculating total_cost and design estimated_cost.
        """
        item = db.query(DesignItem).filter(DesignItem.id == item_id).first()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Design item with id {item_id} not found",
            )

        update_data = update_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)

        item.total_cost = cls.calculate_item_cost(item.quantity, item.unit_cost)
        db.add(item)
        db.flush()

        design = db.query(Design).filter(Design.id == item.design_id).first()
        if design:
            cls._recalculate_design_total(db, design)

        db.commit()
        db.refresh(item)
        return item

    @classmethod
    def delete_item(cls, db: Session, item_id: UUID) -> None:
        """
        Deletes an item and recalculates design estimated_cost.
        """
        item = db.query(DesignItem).filter(DesignItem.id == item_id).first()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Design item with id {item_id} not found",
            )

        design_id = item.design_id
        db.delete(item)
        db.flush()

        design = db.query(Design).filter(Design.id == design_id).first()
        if design:
            cls._recalculate_design_total(db, design)

        db.commit()

    @classmethod
    def seed_template_items(cls, db: Session, design_id: UUID, template_key: str = "living_room") -> List[DesignItem]:
        """
        Populates standard design items according to room template,
        defaulting to the exact Phase 15 spec (Sofa, TV unit, Lighting, Decor).
        """
        design = db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Design with id {design_id} not found",
            )

        template = SAMPLE_TEMPLATES.get(template_key, SAMPLE_TEMPLATES["living_room"])
        created_items = []
        for raw in template:
            item = DesignItem(
                id=uuid.uuid4(),
                design_id=design_id,
                name=raw["name"],
                category=raw["category"],
                quantity=raw["quantity"],
                unit_cost=raw["unit_cost"],
                total_cost=cls.calculate_item_cost(raw["quantity"], raw["unit_cost"]),
            )
            db.add(item)
            created_items.append(item)

        db.flush()
        cls._recalculate_design_total(db, design)
        db.commit()
        for item in created_items:
            db.refresh(item)
        return created_items

    @classmethod
    def _recalculate_design_total(cls, db: Session, design: Design) -> float:
        """
        Sums all items for a design and updates design.estimated_cost.
        """
        items = db.query(DesignItem).filter(DesignItem.design_id == design.id).all()
        total = sum(item.total_cost for item in items)
        design.estimated_cost = round(total, 2)
        db.add(design)
        return design.estimated_cost
