from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.budget import Budget as BudgetModel, BudgetCategory as BudgetCategoryModel
from app.models.design import Design as DesignModel, DesignItem as DesignItemModel

router = APIRouter()


class BudgetOut(BaseModel):
    id: UUID
    project_id: UUID
    total_budget: float
    allocated_budget: float
    spent_amount: float
    remaining_amount: float

    model_config = ConfigDict(from_attributes=True)


class BudgetUpdate(BaseModel):
    total_budget: Optional[float] = None
    allocated_budget: Optional[float] = None
    spent_amount: Optional[float] = None


class ProjectCategoryCost(BaseModel):
    category: str
    total_cost: float
    item_count: int
    percentage: float


class ProjectDesignCostSummary(BaseModel):
    project_id: UUID
    total_budget: float
    estimated_total_cost: float
    remaining_budget: float
    within_budget: bool
    designs_count: int
    total_items_count: int
    category_breakdown: List[ProjectCategoryCost] = []


def _get_or_create_budget(project_id: UUID, db: Session) -> BudgetModel:
    budget = db.query(BudgetModel).filter(BudgetModel.project_id == project_id).first()
    if not budget:
        budget = BudgetModel(
            project_id=project_id,
            total_budget=0.0,
            allocated_budget=0.0,
            spent_amount=0.0,
            remaining_amount=0.0,
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget


def _update_budget(project_id: UUID, update_in: BudgetUpdate, db: Session) -> BudgetModel:
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


def _compute_project_design_costs(project_id: UUID, db: Session) -> ProjectDesignCostSummary:
    budget = db.query(BudgetModel).filter(BudgetModel.project_id == project_id).first()
    total_budget = budget.total_budget if budget else 0.0

    designs = db.query(DesignModel).filter(DesignModel.project_id == project_id).all()
    design_ids = [d.id for d in designs]

    items = (
        db.query(DesignItemModel).filter(DesignItemModel.design_id.in_(design_ids)).all()
        if design_ids
        else []
    )

    estimated_total = 0.0
    category_map: Dict[str, Dict[str, Any]] = {}

    for item in items:
        # Enforce total_cost = quantity * unit_cost
        expected_total = round(float(item.quantity) * float(item.unit_cost), 2)
        if item.total_cost != expected_total:
            item.total_cost = expected_total
            db.add(item)

        estimated_total += item.total_cost
        cat = item.category or "General"
        if cat not in category_map:
            category_map[cat] = {"total_cost": 0.0, "item_count": 0}
        category_map[cat]["total_cost"] += item.total_cost
        category_map[cat]["item_count"] += 1

    estimated_total = round(estimated_total, 2)
    db.commit()

    breakdowns: List[ProjectCategoryCost] = []
    for cat_name, val in sorted(category_map.items()):
        subtotal = round(val["total_cost"], 2)
        pct = round((subtotal / estimated_total * 100.0), 1) if estimated_total > 0 else 0.0
        breakdowns.append(
            ProjectCategoryCost(
                category=cat_name,
                total_cost=subtotal,
                item_count=val["item_count"],
                percentage=pct,
            )
        )

    remaining_budget = round(total_budget - estimated_total, 2)
    within_budget = estimated_total <= total_budget if total_budget > 0 else True

    return ProjectDesignCostSummary(
        project_id=project_id,
        total_budget=total_budget,
        estimated_total_cost=estimated_total,
        remaining_budget=remaining_budget,
        within_budget=within_budget,
        designs_count=len(designs),
        total_items_count=len(items),
        category_breakdown=breakdowns,
    )


# Support both /projects/{project_id}/budget and /{project_id}
@router.get("/projects/{project_id}/budget", response_model=BudgetOut)
@router.get("/{project_id}", response_model=BudgetOut)
def get_project_budget_endpoint(project_id: UUID, db: Session = Depends(get_db)):
    return _get_or_create_budget(project_id, db)


@router.put("/projects/{project_id}/budget", response_model=BudgetOut)
@router.put("/{project_id}", response_model=BudgetOut)
def update_project_budget_endpoint(project_id: UUID, update_in: BudgetUpdate, db: Session = Depends(get_db)):
    return _update_budget(project_id, update_in, db)


@router.get("/projects/{project_id}/design-costs", response_model=ProjectDesignCostSummary)
@router.get("/{project_id}/design-costs", response_model=ProjectDesignCostSummary)
def get_project_design_costs_endpoint(project_id: UUID, db: Session = Depends(get_db)):
    return _compute_project_design_costs(project_id, db)
