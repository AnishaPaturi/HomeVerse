"""
API Tests for Phase 7 Project Creation & Management
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_project_crud_lifecycle():
    # 1. Create Project (Phase 7 example payload)
    payload = {
        "name": "Ocean View Apartment",
        "property_type": "apartment",
        "bhk": 2,
        "area_sqft": 1120.0,
        "budget": 800000.0,
        "currency": "INR",
        "lifestyle": {"wfh": True, "pets": False},
        "preferences": {"style": "warm_contemporary"}
    }
    create_res = client.post("/api/projects", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["name"] == "Ocean View Apartment"
    assert created_data["bhk"] == 2
    assert created_data["budget"] == 800000.0
    project_id = created_data["id"]

    # 2. Get All Projects
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    projects_list = list_res.json()
    assert any(p["id"] == project_id for p in projects_list)

    # 3. Get Project by ID
    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Ocean View Apartment"

    # 4. Update Project
    update_res = client.put(f"/api/projects/{project_id}", json={"budget": 850000.0, "name": "Ocean View Luxury 2BHK"})
    assert update_res.status_code == 200
    assert update_res.json()["budget"] == 850000.0
    assert update_res.json()["name"] == "Ocean View Luxury 2BHK"

    # 5. Delete Project
    del_res = client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == 204

    # 6. Verify Deletion
    verify_res = client.get(f"/api/projects/{project_id}")
    assert verify_res.status_code == 404
