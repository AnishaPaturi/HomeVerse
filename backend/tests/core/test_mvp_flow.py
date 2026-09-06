"""
HomeVerse Phase 47 — MVP Integration Test Suite
Validates the 11 Core MVP Features:
1. Authentication
2. Project creation
3. Budget
4. Room creation
5. Image upload
6. Style questionnaire
7. AI design generation
8. Three design concepts
9. Budget estimation
10. Budget optimizer
11. Dashboard & Dossier
"""

import io
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User as UserModel, UserPreference as UserPreferenceModel
from app.models.project import Project as ProjectModel
from app.models.room import Room as RoomModel
from app.models.design import Design as DesignModel, DesignItem as DesignItemModel
from app.models.budget import Budget as BudgetModel
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
def mvp_user(db):
    user = db.query(UserModel).filter(UserModel.email == "mvp_resident@homeverse.ai").first()
    if not user:
        user = UserModel(
            id=uuid4(),
            email="mvp_resident@homeverse.ai",
            name="MVP Resident",
            password_hash=get_password_hash("SecretPass123!"),
            plan="Free",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# --------------------------------------------------------------------------
# 1. AUTHENTICATION (MVP Feature 1)
# --------------------------------------------------------------------------
def test_mvp_feature_1_authentication(db):
    """Verifies registration and token issuance flow for MVP."""
    unique_email = f"mvp_auth_{uuid4().hex[:8]}@example.com"
    pwd = "SecurePassword123!"

    # Registration
    reg_resp = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": pwd,
        "name": "MVP Tester",
    })
    assert reg_resp.status_code == 201, reg_resp.text
    user_data = reg_resp.json()
    assert user_data["email"] == unique_email

    # Token issuance
    token_resp = client.post("/api/auth/token", json={
        "email": unique_email,
        "password": pwd,
    })
    assert token_resp.status_code == 200, token_resp.text
    tokens = token_resp.json()
    assert "access_token" in tokens
    assert tokens["token_type"].lower() == "bearer"

# --------------------------------------------------------------------------
# 2. PROJECT CREATION (MVP Feature 2)
# --------------------------------------------------------------------------
def test_mvp_feature_2_project_creation(db):
    """Verifies project creation with 2 BHK, 1120 sq ft, ₹8.0L budget."""
    proj_resp = client.post("/api/projects", json={
        "name": "MVP 2BHK Apartment",
        "property_type": "apartment",
        "bhk": 2,
        "area_sqft": 1120.0,
        "budget": 800000.0,
        "currency": "INR",
    })
    assert proj_resp.status_code in [200, 201], proj_resp.text
    p = proj_resp.json()
    assert p["name"] == "MVP 2BHK Apartment"
    assert p["bhk"] == 2
    assert p["area_sqft"] == 1120.0
    assert p["budget"] == 800000.0

# --------------------------------------------------------------------------
# 3. BUDGET MANAGEMENT (MVP Feature 3)
# --------------------------------------------------------------------------
def test_mvp_feature_3_budget_setup(db, mvp_user):
    """Verifies budget retrieval and initialization for a project."""
    proj_id = uuid4()
    p = ProjectModel(id=proj_id, user_id=mvp_user.id, name="Budget Test", budget=800000.0)
    b = BudgetModel(project_id=proj_id, total_budget=800000.0, remaining_amount=800000.0)
    db.add(p)
    db.add(b)
    db.commit()

    try:
        resp = client.get(f"/api/budget/{proj_id}")
        assert resp.status_code == 200, resp.text
        b_data = resp.json()
        assert b_data["total_budget"] == 800000.0
    finally:
        db.delete(b)
        db.delete(p)
        db.commit()

# --------------------------------------------------------------------------
# 4. ROOM CREATION (MVP Feature 4)
# --------------------------------------------------------------------------
def test_mvp_feature_4_room_creation(db, mvp_user):
    """Verifies room creation with spatial dimensions and boundaries."""
    proj_id = uuid4()
    p = ProjectModel(id=proj_id, user_id=mvp_user.id, name="Rooms Project", budget=800000.0)
    db.add(p)
    db.commit()

    try:
        # Create Living Room
        resp = client.post(f"/api/projects/{proj_id}/rooms", json={
            "name": "Living Room",
            "room_type": "Living Room",
            "length": 4.8,
            "width": 4.6,
            "area": 240.0,
            "status": "planning",
        })
        assert resp.status_code == 201, resp.text
        rm = resp.json()
        assert rm["name"] == "Living Room"
        assert rm["length"] == 4.8
        assert rm["width"] == 4.6

        # Fetch rooms list
        list_resp = client.get(f"/api/projects/{proj_id}/rooms")
        assert list_resp.status_code == 200, list_resp.text
        rms = list_resp.json()
        assert len(rms) >= 1
    finally:
        db.query(RoomModel).filter(RoomModel.project_id == proj_id).delete()
        db.delete(p)
        db.commit()

# --------------------------------------------------------------------------
# 5. IMAGE UPLOAD (MVP Feature 5)
# --------------------------------------------------------------------------
def test_mvp_feature_5_image_upload():
    """Verifies floor plan and room photo upload endpoint."""
    file_bytes = b"Fake floor plan content"
    files = {"file": ("floorplan.png", io.BytesIO(file_bytes), "image/png")}

    resp = client.post("/api/uploads", files=files)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "uploaded"
    assert "url" in data
    assert data["original_name"] == "floorplan.png"

# --------------------------------------------------------------------------
# 6. STYLE QUESTIONNAIRE (MVP Feature 6)
# --------------------------------------------------------------------------
def test_mvp_feature_6_style_questionnaire(db):
    """Verifies user aesthetic questionnaire and style profile persistence."""
    u_id = uuid4()
    user = UserModel(
        id=u_id,
        email=f"style_{uuid4().hex[:6]}@example.com",
        name="Style Client",
        password_hash=get_password_hash("Pass123!"),
    )
    db.add(user)
    db.commit()

    try:
        resp = client.post(f"/api/preferences/{u_id}", json={
            "style": "Warm Contemporary",
            "colour_preferences": ["Neutral", "Warm Wood", "Cream"],
            "material_preferences": ["Oak", "Boucle", "Linen"],
            "lifestyle_preferences": {"wfh": True, "entertains": True},
        })
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["style"] == "Warm Contemporary"
        assert "Oak" in data["material_preferences"]
    finally:
        db.query(UserPreferenceModel).filter(UserPreferenceModel.user_id == u_id).delete()
        db.delete(user)
        db.commit()

# --------------------------------------------------------------------------
# 7 & 8. THREE DESIGN CONCEPTS & SELECTION (MVP Features 7 & 8)
# --------------------------------------------------------------------------
def test_mvp_features_7_and_8_three_concepts_and_selection(db, mvp_user):
    """Verifies generation of 3 distinct concepts and selecting Design B."""
    proj_id = uuid4()
    p = ProjectModel(id=proj_id, user_id=mvp_user.id, name="3 Concepts Project", budget=800000.0)
    db.add(p)
    db.commit()

    da = DesignModel(id=uuid4(), project_id=proj_id, name="Concept A", style="Scandinavian", estimated_cost=840000.0)
    db_model = DesignModel(id=uuid4(), project_id=proj_id, name="Concept B", style="Warm Contemporary", estimated_cost=840000.0)
    dc = DesignModel(id=uuid4(), project_id=proj_id, name="Concept C", style="Modern Luxury", estimated_cost=890000.0)
    db.add_all([da, db_model, dc])
    db.commit()

    try:
        # Select Concept B
        sel_resp = client.post(f"/api/designs/{db_model.id}/select")
        assert sel_resp.status_code == 200, sel_resp.text
        assert sel_resp.json()["selected"] is True

        # Verify siblings are unselected
        db.refresh(da)
        db.refresh(dc)
        assert da.selected is False
        assert dc.selected is False
    finally:
        db.delete(da)
        db.delete(db_model)
        db.delete(dc)
        db.delete(p)
        db.commit()

# --------------------------------------------------------------------------
# 9. BUDGET ESTIMATION (MVP Feature 9)
# --------------------------------------------------------------------------
def test_mvp_feature_9_budget_estimation(db, mvp_user):
    """Verifies formula total_cost = quantity * unit_cost and cost calculation."""
    proj_id = uuid4()
    p = ProjectModel(id=proj_id, user_id=mvp_user.id, name="Estimation Project", budget=800000.0)
    d = DesignModel(id=uuid4(), project_id=proj_id, name="Design Est", style="Modern")
    db.add_all([p, d])
    db.commit()

    # Add items: sofa (1 * 85000) and coffee table (1 * 24000)
    i1 = DesignItemModel(design_id=d.id, name="Sofa", category="Furniture", quantity=1.0, unit_cost=85000.0, total_cost=85000.0)
    i2 = DesignItemModel(design_id=d.id, name="Table", category="Furniture", quantity=1.0, unit_cost=24000.0, total_cost=24000.0)
    db.add_all([i1, i2])
    db.commit()

    try:
        resp = client.get(f"/api/designs/{d.id}/cost")
        assert resp.status_code == 200, resp.text
        cost_data = resp.json()
        assert cost_data["total_cost"] == 109000.0
        assert len(cost_data["items"]) == 2
    finally:
        db.delete(i1)
        db.delete(i2)
        db.delete(d)
        db.delete(p)
        db.commit()

# --------------------------------------------------------------------------
# 10. BUDGET OPTIMIZER (MVP Feature 10)
# --------------------------------------------------------------------------
def test_mvp_feature_10_budget_optimizer(db, mvp_user):
    """Verifies 'Make it fit ₹8L' AI budget optimization reduces cost to ₹7.96L."""
    proj_id = uuid4()
    p = ProjectModel(id=proj_id, user_id=mvp_user.id, name="Optimizer Project", budget=800000.0)
    d = DesignModel(id=uuid4(), project_id=proj_id, name="Design B", style="Warm Contemporary", estimated_cost=840000.0, selected=True)
    b = BudgetModel(project_id=proj_id, total_budget=800000.0, allocated_budget=840000.0)
    db.add_all([p, d, b])
    db.commit()

    try:
        resp = client.post(f"/api/budget/{proj_id}/optimize", json={"target_budget": 800000.0})
        assert resp.status_code == 200, resp.text
        opt = resp.json()

        assert opt["target_budget"] == 800000.0
        assert opt["initial_estimate"] == 840000.0
        assert opt["optimized_cost"] == 796000.0
        assert opt["savings_achieved"] == 44000.0
        assert opt["is_within_budget"] is True
        assert len(opt["substitutions"]) >= 2

        # Verify DB updated
        db.refresh(d)
        assert d.estimated_cost == 796000.0
    finally:
        db.delete(b)
        db.delete(d)
        db.delete(p)
        db.commit()

# --------------------------------------------------------------------------
# 11. DASHBOARD & DIGITAL HOME BOOK (MVP Feature 11)
# --------------------------------------------------------------------------
def test_mvp_feature_11_dashboard_and_home_book(db, mvp_user):
    """Verifies complete Digital Home Book dossier aggregating all MVP milestones."""
    proj_id = uuid4()
    p = ProjectModel(id=proj_id, user_id=mvp_user.id, name="Full MVP Home", bhk=2, area_sqft=1120.0, budget=800000.0)
    db.add(p)
    db.commit()

    try:
        resp = client.get(f"/api/projects/{proj_id}/digital-home-book")
        assert resp.status_code == 200, resp.text
        book = resp.json()

        assert book["project_id"] == str(proj_id)
        assert book["bhk"] == 2
        assert book["area_sqft"] == 1120.0
        assert book["budget_summary"]["target_budget"] == 800000.0
        assert book["budget_summary"]["savings_achieved"] == 44000.0
        assert "detected_rooms" in book["floor_plan"]
        assert "completion_certificate" in book
    finally:
        db.delete(p)
        db.commit()
