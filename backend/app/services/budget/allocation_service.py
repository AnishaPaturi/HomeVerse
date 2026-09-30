"""
Allocation Service
Handles distribution of budgets across floors, rooms, and trade categories.
"""
from typing import List, Optional, Dict
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.models.budget_allocation import BudgetAllocation
from app.schemas.budget import BudgetAllocationCreate

STANDARD_TRADE_WEIGHTS: Dict[str, float] = {
    "Furniture": 0.35,
    "Lighting": 0.12,
    "Flooring": 0.15,
    "Walls": 0.10,
    "Ceiling": 0.08,
    "Materials": 0.08,
    "Decor": 0.07,
    "Electrical": 0.05,
}

class AllocationService:
    @staticmethod
    def list_allocations(
        db: Session,
        budget_id: UUID,
        floor_id: Optional[UUID] = None,
        room_id: Optional[UUID] = None
    ) -> List[BudgetAllocation]:
        query = db.query(BudgetAllocation).filter(BudgetAllocation.budget_id == budget_id)
        if floor_id:
            query = query.filter(BudgetAllocation.floor_id == floor_id)
        if room_id:
            query = query.filter(BudgetAllocation.room_id == room_id)
        return query.all()

    @staticmethod
    def create_allocation(db: Session, budget_id: UUID, data: BudgetAllocationCreate) -> BudgetAllocation:
        alloc = BudgetAllocation(
            id=uuid.uuid4(),
            budget_id=budget_id,
            floor_id=data.floor_id,
            room_id=data.room_id,
            category=data.category,
            allocated_amount=data.allocated_amount,
            estimated_amount=data.estimated_amount,
            actual_amount=data.actual_amount
        )
        db.add(alloc)
        db.commit()
        db.refresh(alloc)
        return alloc

    @classmethod
    def auto_distribute_room_budget(
        cls,
        db: Session,
        budget_id: UUID,
        room_id: UUID,
        room_budget: float,
        floor_id: Optional[UUID] = None
    ) -> List[BudgetAllocation]:
        """
        Automatically provisions standard trade envelopes for a room based on standard weights.
        """
        # Delete existing room allocations to replace cleanly
        db.query(BudgetAllocation).filter(
            BudgetAllocation.budget_id == budget_id,
            BudgetAllocation.room_id == room_id
        ).delete()

        created: List[BudgetAllocation] = []
        for category, weight in STANDARD_TRADE_WEIGHTS.items():
            amount = round(room_budget * weight, 2)
            alloc = BudgetAllocation(
                id=uuid.uuid4(),
                budget_id=budget_id,
                floor_id=floor_id,
                room_id=room_id,
                category=category,
                allocated_amount=amount,
                estimated_amount=0.0,
                actual_amount=0.0
            )
            db.add(alloc)
            created.append(alloc)

        db.commit()
        for a in created:
            db.refresh(a)
        return created
