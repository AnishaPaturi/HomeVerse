import pytest
import uuid
from app.db.session import SessionLocal, engine, Base
from app.models.project import Project
from app.models.user import User
from app.models.budget import Budget
from app.models.budget_allocation import BudgetAllocation
from app.models.floor import Floor
from app.models.room import Room
from app.services.budget.budget_service import BudgetService
from app.services.budget.allocation_service import AllocationService
from app.services.budget.calculation_service import CalculationService
from app.schemas.budget import BudgetImpactSimulationRequest

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_budget_creation_and_flexibility(db):
    user_id = uuid.uuid4()
    project_id = uuid.uuid4()
    
    project = Project(
        id=project_id,
        user_id=user_id,
        name="Villa Serenity",
        property_type="independent",
        bhk=4,
        budget=2500000.0,
        currency="INR"
    )
    db.add(project)
    db.commit()

    budget = BudgetService.get_or_create_budget(
        db=db,
        project_id=project_id,
        total_budget=2500000.0,
        currency="INR",
        flexibility="Moderate"
    )
    assert budget.total_budget == 2500000.0
    assert budget.flexibility == "Moderate"
    assert budget.remaining_amount == 2500000.0

def test_budget_room_allocation(db):
    project_id = uuid.uuid4()
    room_id = uuid.uuid4()
    
    budget = BudgetService.get_or_create_budget(
        db=db,
        project_id=project_id,
        total_budget=2000000.0
    )

    allocations = AllocationService.auto_distribute_room_budget(
        db=db,
        budget_id=budget.id,
        room_id=room_id,
        room_budget=500000.0
    )
    assert len(allocations) > 0
    furniture_alloc = next((a for a in allocations if a.category == "Furniture"), None)
    assert furniture_alloc is not None
    assert furniture_alloc.allocated_amount == 175000.0  # 35% of 500k

def test_what_if_budget_delta_impact(db):
    project_id = uuid.uuid4()
    budget = BudgetService.get_or_create_budget(
        db=db,
        project_id=project_id,
        total_budget=2500000.0,
        flexibility="Moderate"
    )

    req = BudgetImpactSimulationRequest(
        project_id=project_id,
        action_type="Make sofa bigger",
        item_category="Furniture",
        current_item_cost=420000.0,
        new_item_cost=455000.0,
        description="Expanded 5-seater L-sectional sofa"
    )
    result = CalculationService.evaluate_modification_impact(db, req)
    assert result.delta_amount == 35000.0
    assert "₹35,000" in result.impact_message
    assert result.is_within_budget is True
