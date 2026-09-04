import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.project import Project
from app.models.design import Design, DesignItem
from app.models.budget import Budget

client = TestClient(app)

@pytest.fixture
def test_setup():
    db = SessionLocal()
    # Create test project
    proj_id = uuid.uuid4()
    project = Project(
        id=proj_id,
        user_id=uuid.uuid4(),
        name="Penthouse Residence",
        property_type="apartment",
        budget=1200000.0,
    )
    db.add(project)

    # Create project budget
    budget = Budget(
        id=uuid.uuid4(),
        project_id=proj_id,
        total_budget=1200000.0,
        allocated_budget=900000.0,
        spent_amount=200000.0,
        remaining_amount=1000000.0,
    )
    db.add(budget)

    # Create test design
    design_id = uuid.uuid4()
    design = Design(
        id=design_id,
        project_id=proj_id,
        name="Nordic Living Concept",
        style="Scandinavian",
        estimated_cost=150000.0,
    )
    db.add(design)

    # Create initial design items
    item1 = DesignItem(
        id=uuid.uuid4(),
        design_id=design_id,
        name="Custom 3-Seater Sofa",
        category="Furniture",
        quantity=1.0,
        unit_cost=70000.0,
        total_cost=70000.0,
    )
    item2 = DesignItem(
        id=uuid.uuid4(),
        design_id=design_id,
        name="Teak TV Credenza",
        category="Furniture",
        quantity=1.0,
        unit_cost=45000.0,
        total_cost=45000.0,
    )
    item3 = DesignItem(
        id=uuid.uuid4(),
        design_id=design_id,
        name="Designer Pendant Light",
        category="Lighting",
        quantity=2.0,
        unit_cost=17500.0,
        total_cost=35000.0,
    )
    db.add_all([item1, item2, item3])
    db.commit()

    yield {
        "project_id": str(proj_id),
        "design_id": str(design_id),
    }

    # Cleanup
    db.query(DesignItem).filter(DesignItem.design_id == design_id).delete()
    db.query(Design).filter(Design.id == design_id).delete()
    db.query(Budget).filter(Budget.project_id == proj_id).delete()
    db.query(Project).filter(Project.id == proj_id).delete()
    db.commit()
    db.close()


def test_what_if_presets():
    res = client.get("/api/ai/what-if/presets")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    preset_ids = [p["id"] for p in data]
    assert "reduce_budget" in preset_ids
    assert "more_storage" in preset_ids
    assert "luxury_look" in preset_ids
    assert "add_work_desk" in preset_ids


def test_what_if_reduce_budget(test_setup):
    payload = {
        "design_id": test_setup["design_id"],
        "query": "What if I reduce the budget by ₹1 lakh?",
        "preset_type": "reduce_budget",
        "budget_delta": -100000.0,
    }
    res = client.post("/api/ai/what-if/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["design_id"] == test_setup["design_id"]
    assert len(data["design_changes"]) > 0
    assert len(data["furniture_changes"]) > 0
    assert len(data["material_changes"]) > 0
    assert data["cost_summary"]["net_cost_difference"] < 0
    assert data["cost_summary"]["new_total_cost"] < data["cost_summary"]["original_total_cost"]


def test_what_if_more_storage(test_setup):
    payload = {
        "design_id": test_setup["design_id"],
        "query": "What if I want more storage?",
        "preset_type": "more_storage",
    }
    res = client.post("/api/ai/what-if/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "Storage" in data["scenario_title"]
    # Check that added items include loft or hydraulic storage
    added_items = [m for m in data["modified_items"] if m["action"] == "add"]
    assert len(added_items) >= 1
    assert any("Storage" in m["name"] or "Loft" in m["name"] for m in added_items)
    assert data["cost_summary"]["net_cost_difference"] > 0


def test_what_if_luxury_look(test_setup):
    payload = {
        "design_id": test_setup["design_id"],
        "query": "What if I want a luxury look?",
        "preset_type": "luxury_look",
    }
    res = client.post("/api/ai/what-if/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "Luxury" in data["scenario_title"]
    assert any("Brass" in m or "Leather" in m or "Italian" in m for m in data["material_changes"])
    assert data["cost_summary"]["net_cost_difference"] > 0


def test_what_if_add_work_desk(test_setup):
    payload = {
        "design_id": test_setup["design_id"],
        "query": "What if I add a work desk?",
        "preset_type": "add_work_desk",
    }
    res = client.post("/api/ai/what-if/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "Work" in data["scenario_title"] or "WFH" in data["scenario_title"]
    item_names = [m["name"] for m in data["modified_items"]]
    assert any("Desk" in n for n in item_names)
    assert any("Chair" in n for n in item_names)


def test_what_if_apply_scenario(test_setup):
    # 1. Simulate scenario
    sim_res = client.post(
        "/api/ai/what-if/simulate",
        json={
            "design_id": test_setup["design_id"],
            "query": "What if I add a work desk?",
            "preset_type": "add_work_desk",
        }
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    scenario_id = sim_data["scenario_id"]
    new_cost = sim_data["cost_summary"]["new_total_cost"]

    # 2. Apply scenario to existing design
    apply_res = client.post(
        "/api/ai/what-if/apply",
        json={
            "design_id": test_setup["design_id"],
            "scenario_id": scenario_id,
        }
    )
    assert apply_res.status_code == 200
    applied_data = apply_res.json()
    assert applied_data["id"] == test_setup["design_id"]
    # Check that design was modified in-place
    assert applied_data["estimated_cost"] == new_cost
