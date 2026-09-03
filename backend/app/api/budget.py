from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.budget import Budget as BudgetModel, BudgetCategory as BudgetCategoryModel

router = APIRouter()

class BudgetOut(BaseModel):
    id: UUID
    project_id: UUID
    total_budget: float
    allocated_budget: float
    spent_amount: float
    remaining_amount: float

    class Config:
        from_attributes = True

class BudgetUpdate(BaseModel):
    total_budget: Optional[float] = None
    allocated_budget: Optional[float] = None
    spent_amount: Optional[float] = None

@router.get("/projects/{project_id}/budget", response_model=BudgetOut)
def get_project_budget(project_id: UUID, db: Session = Depends(get_db)):
    budget = db.query(BudgetModel).filter(BudgetModel.project_id == project_id).first()
    if not budget:
        # Create default initial budget
        budget = BudgetModel(
            project_id=project_id,
            total_budget=0.0,
            allocated_budget=0.0,
            spent_amount=0.0,
            remaining_amount=0.0
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget

@router.put("/projects/{project_id}/budget", response_model=BudgetOut)
def update_project_budget(project_id: UUID, update_in: BudgetUpdate, db: Session = Depends(get_db)):
    budget = db.query(BudgetModel).filter(BudgetModel.project_id == project_id).first()
    if not budget:
        budget = BudgetModel(project_id=project_id)
        db.add(budget)
    
    if update_in.total_budget is not None:
        budget.total_budget = update_in.total_budget
    if update_in.allocated_budget is not None:
        budget.allocated_budget = update_in.allocated_budget
    if update_in.spent_amount is not None:
        budget.spent_amount = update_in.spent_amount
    budget.remaining_amount = budget.total_budget - budget.spent_amount

    db.commit()
    db.refresh(budget)
    return budget
