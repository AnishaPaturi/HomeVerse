"""
Budget Service
Manages project budgets, total amounts, currency, and flexibility guardrails.
"""
from typing import Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate

class BudgetService:
    @staticmethod
    def get_by_project_id(db: Session, project_id: UUID) -> Optional[Budget]:
        return db.query(Budget).filter(Budget.project_id == project_id).first()

    @staticmethod
    def get_or_create_budget(
        db: Session,
        project_id: UUID,
        total_budget: float = 0.0,
        currency: str = "INR",
        flexibility: str = "Moderate"
    ) -> Budget:
        budget = db.query(Budget).filter(Budget.project_id == project_id).first()
        if not budget:
            budget = Budget(
                id=uuid.uuid4(),
                project_id=project_id,
                total_budget=total_budget,
                currency=currency,
                flexibility=flexibility,
                spent_amount=0.0,
                estimated_amount=0.0,
                remaining_amount=total_budget
            )
            db.add(budget)
            db.commit()
            db.refresh(budget)
        return budget

    @staticmethod
    def update_budget(db: Session, budget_id: UUID, data: BudgetUpdate) -> Budget:
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            raise ValueError("Budget not found")

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(budget, key, val)

        # Recalculate remaining amount if total or spent/estimated updated
        budget.remaining_amount = max(0.0, budget.total_budget - (budget.spent_amount or budget.estimated_amount or 0.0))
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget
