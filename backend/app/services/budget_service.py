"""
Budget Service Layer
Handles budget allocations, category rollups, and expense tracking.
"""
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.budget import Budget

class BudgetService:
    @staticmethod
    def get_or_create_budget(db: Session, project_id: UUID) -> Budget:
        budget = db.query(Budget).filter(Budget.project_id == project_id).first()
        if not budget:
            budget = Budget(project_id=project_id, total_budget=0.0)
            db.add(budget)
            db.commit()
            db.refresh(budget)
        return budget
