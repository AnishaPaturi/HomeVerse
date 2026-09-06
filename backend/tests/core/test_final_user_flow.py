import json
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.project import Project as ProjectModel
from app.models.design import Design as DesignModel
from app.models.user import User as UserModel
from app.models.analytics_event import AnalyticsEvent
from app.core.security import get_password_hash

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def sample_user(db):
    user = db.query(UserModel).filter(UserModel.email == "resident_p46@example.com").first()
    if not user:
        user = UserModel(
            id=uuid4(),
            email="resident_p46@example.com",
            name="Anisha Resident",
            password_hash=get_password_hash("SecretPassword123!"),
            plan="Free",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@pytest.fixture
def sample_project(db, sample_user):
    project = ProjectModel(
        id=uuid4(),
        user_id=sample_user.id,
        name="Serene 2BHK Home",
        property_type="Apartment",
        bhk=2,
        area_sqft=1120.0,
        budget=800000.0,
        currency="INR",
        room_type="Living Room",
        thumbnail="https://example.com/floorplan.jpg",
        structural_analysis=json.dumps({
            "rooms": [
                {"name": "Living Room", "width_m": 3.63, "length_m": 3.94, "area_sqft": 154.0},
                {"name": "Master Bedroom", "width_m": 3.35, "length_m": 3.65, "area_sqft": 132.0},
                {"name": "Kitchen", "width_m": 2.44, "length_m": 3.05, "area_sqft": 80.0},
            ]
        }),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

def test_select_design_toggles_selection_and_tracks_analytics(db, sample_project):
    """
    Test Phase 46 design selection:
    Selecting Design B marks it as selected=True, resets Design A to selected=False,
    and fires design_selected analytics event.
    """
    design_a = DesignModel(
        id=uuid4(),
        project_id=sample_project.id,
        name="Design A - Scandinavian Minimalist",
        style="Scandinavian",
        estimated_cost=840000.0,
        selected=True,
    )
    design_b = DesignModel(
        id=uuid4(),
        project_id=sample_project.id,
        name="Design B - Warm Contemporary",
        style="Warm Contemporary",
        estimated_cost=796000.0,
        selected=False,
    )
    db.add(design_a)
    db.add(design_b)
    db.commit()

    try:
        # Select Design B
        resp = client.post(f"/api/designs/{design_b.id}/select")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["id"] == str(design_b.id)
        assert data["selected"] is True

        # Verify DB state
        db.refresh(design_a)
        db.refresh(design_b)
        assert design_b.selected is True
        assert design_a.selected is False

        # Verify analytics event
        ev = (
            db.query(AnalyticsEvent)
            .filter(
                AnalyticsEvent.event_name == "design_selected",
                AnalyticsEvent.user_id == sample_project.user_id,
            )
            .order_by(AnalyticsEvent.created_at.desc())
            .first()
        )
        assert ev is not None
        assert ev.properties["design_id"] == str(design_b.id)
        assert ev.properties["style"] == "Warm Contemporary"

    finally:
        db.delete(design_a)
        db.delete(design_b)
        db.commit()

def test_complete_project_endpoint(db, sample_project):
    """
    Test Phase 46 project completion endpoint:
    Marks project completed, records project_completed analytics event,
    and returns home_book_url.
    """
    resp = client.post(f"/api/projects/{sample_project.id}/complete")
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["status"] == "completed"
    assert data["project_id"] == str(sample_project.id)
    assert "completed_at" in data
    assert f"/project/{sample_project.id}/home-book" in data["home_book_url"]

    # Verify event recorded
    ev = (
        db.query(AnalyticsEvent)
        .filter(
            AnalyticsEvent.event_name == "project_completed",
            AnalyticsEvent.user_id == sample_project.user_id,
        )
        .order_by(AnalyticsEvent.created_at.desc())
        .first()
    )
    assert ev is not None
    assert ev.properties["project_id"] == str(sample_project.id)

def test_get_digital_home_book_complete_dossier(db, sample_project):
    """
    Test Phase 46 Digital Home Book endpoint:
    Returns the comprehensive architectural, design, budget, procurement,
    and care dossier.
    """
    # Complete the project first
    client.post(f"/api/projects/{sample_project.id}/complete")

    # Add Design B as selected design
    design_b = DesignModel(
        id=uuid4(),
        project_id=sample_project.id,
        name="Design B - Warm Contemporary",
        style="Warm Contemporary",
        estimated_cost=796000.0,
        selected=True,
    )
    db.add(design_b)
    db.commit()

    try:
        resp = client.get(f"/api/projects/{sample_project.id}/digital-home-book")
        assert resp.status_code == 200, resp.text
        book = resp.json()

        # 1. Root specifications
        assert book["project_id"] == str(sample_project.id)
        assert book["name"] == sample_project.name
        assert book["bhk"] == 2
        assert book["area_sqft"] == 1120.0
        assert book["target_budget"] == 800000.0
        assert book["status"] == "completed"

        # 2. Floor plan & rooms
        fp = book["floor_plan"]
        assert len(fp["detected_rooms"]) >= 3
        living_rm = next((r for r in fp["detected_rooms"] if r["name"] == "Living Room"), None)
        assert living_rm is not None
        assert living_rm["area_sqft"] == 154.0

        # 3. Selected design & renders
        sd = book["selected_design"]
        assert sd["style"] == "Warm Contemporary"
        assert sd["estimated_cost"] == 796000.0
        assert "primary" in sd["renders"]

        # 4. Budget & savings audit
        b_summary = book["budget_summary"]
        assert b_summary["target_budget"] == 800000.0
        assert b_summary["initial_estimate"] == 840000.0
        assert b_summary["optimized_cost"] == 796000.0
        assert b_summary["savings_achieved"] == 44000.0
        assert b_summary["is_within_budget"] is True

        # 5. Shopping items & inventory
        inventory = book["shopping_inventory"]
        assert len(inventory) >= 4
        assert any("Sofa" in item["name"] for item in inventory)

        # 6. Execution timeline
        timeline = book["execution_timeline"]
        assert timeline["total_tasks"] >= 3
        assert timeline["completion_percentage"] == 100.0

        # 7. Maintenance guide & certificate
        assert len(book["maintenance_and_care"]) >= 3
        cert = book["completion_certificate"]
        assert "CERT" in cert["certificate_id"]
        assert cert["issued_to"] is not None

    finally:
        db.delete(design_b)
        db.commit()

def test_digital_home_book_minimal_project_defaults(db, sample_user):
    """
    Test Phase 46 Digital Home Book fallback defaults for freshly created project:
    Default 2 BHK, 1120 sq ft, ₹8.0L budget, Design B Warm Contemporary,
    ₹7.96L optimized cost, ₹44,000 savings.
    """
    fresh_proj = ProjectModel(
        id=uuid4(),
        user_id=sample_user.id,
        name="Fresh User Project",
        budget=800000.0,
    )
    db.add(fresh_proj)
    db.commit()
    db.refresh(fresh_proj)

    try:
        resp = client.get(f"/api/projects/{fresh_proj.id}/digital-home-book")
        assert resp.status_code == 200, resp.text
        book = resp.json()

        assert book["project_id"] == str(fresh_proj.id)
        assert book["bhk"] == 2
        assert book["area_sqft"] == 1120.0
        assert book["target_budget"] == 800000.0
        assert book["budget_summary"]["initial_estimate"] == 840000.0
        assert book["budget_summary"]["optimized_cost"] == 796000.0
        assert book["budget_summary"]["savings_achieved"] == 44000.0
        assert len(book["floor_plan"]["detected_rooms"]) >= 3
        assert book["selected_design"]["style"] == "Warm Contemporary"
        assert len(book["shopping_inventory"]) >= 4
        assert len(book["maintenance_and_care"]) >= 3
    finally:
        db.delete(fresh_proj)
        db.commit()

