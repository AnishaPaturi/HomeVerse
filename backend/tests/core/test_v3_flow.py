"""
Test Suite for Phase 49 — Version 3 Flow
Validates the 6 core pillars:
1. 3D Visualization Scene Graph & Export (Three.js format, camera, lighting, PBR surfaces, 3D meshes)
2. Real-time Room Editing (wall paint color, flooring material, cost delta calculation, style coherence)
3. AR Furniture Placement (GLB/USDZ models, plane anchoring mode, QR mobile deep link, placement boundary check)
4. Interactive Floor Plan (Vector layout: walls, doors with swing arcs, windows, furniture footprints, parametric generator)
5. Voice Assistant Copilot (NLU intent classification: wall paint, flooring, camera perspective, budget inquiry, TTS synthesis)
6. Advanced PBR Material Visualization & Comparison Engine (Albedo, roughness, metalness, cost/sqft, durability, technical & cost comparison)
"""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.models.user import User as UserModel
from app.models.project import Project as ProjectModel
from app.models.room import Room as RoomModel
from app.models.material import Material as MaterialModel

client = TestClient(app)


@pytest.fixture
def test_project_and_room():
    """Sets up an isolated project and room in the test database."""
    from app.db.session import SessionLocal
    session = SessionLocal()
    try:
        user_id = uuid4()
        user = UserModel(
            id=user_id,
            email=f"v3_architect_{uuid4().hex[:8]}@example.com",
            password_hash="hashed_secret_pw",
            name="V3 Spatial Architect",
        )
        session.add(user)
        session.commit()

        project_id = uuid4()
        project = ProjectModel(
            id=project_id,
            user_id=user_id,
            name="The Glasshouse Penthouse",
            property_type="apartment",
            bhk=3,
            area_sqft=1450.0,
            budget=1200000.0,
            currency="INR",
        )
        session.add(project)
        session.commit()

        room_id = uuid4()
        room = RoomModel(
            id=room_id,
            project_id=project_id,
            name="Panoramic Living Room",
            room_type="Living Room",
            length=18.0,
            width=14.0,
            height=9.5,
        )
        session.add(room)
        session.commit()

        return {
            "user_id": str(user_id),
            "project_id": str(project_id),
            "room_id": str(room_id),
        }
    finally:
        session.close()


# ---------------- 1. 3D Scene Graph & Export Tests ----------------

def test_get_room_3d_scene(test_project_and_room):
    """Verifies that the 3D scene descriptor includes camera, lighting, surfaces, and meshes."""
    room_id = test_project_and_room["room_id"]
    res = client.get(f"/api/rooms/{room_id}/3d-scene")
    assert res.status_code == 200
    scene = res.json()

    assert scene["room_id"] == room_id
    assert "dimensions" in scene
    assert scene["dimensions"]["width"] > 0
    assert scene["dimensions"]["length"] > 0
    assert scene["dimensions"]["height"] > 0

    # Camera parameters
    assert "camera" in scene
    assert scene["camera"]["fov"] in [55, 60]
    assert len(scene["camera"]["position"]) == 3
    assert len(scene["camera"]["target"]) == 3

    # Lighting rig
    assert "lighting" in scene
    assert len(scene["lighting"]["rigs"]) >= 3
    light_types = [l["type"] for l in scene["lighting"]["rigs"]]
    assert "ambient" in light_types
    assert "directional" in light_types

    # Surfaces
    assert "floor" in scene
    assert "walls" in scene
    assert "ceiling" in scene
    assert scene["floor"]["roughness"] >= 0.0
    assert scene["walls"]["albedo_color"].startswith("#")

    # Furniture meshes
    assert "furniture" in scene
    assert len(scene["furniture"]) >= 3
    assert any("sofa" in f["category"].lower() for f in scene["furniture"])
    assert any(f["gltf_model_url"].endswith(".glb") for f in scene["furniture"])


def test_export_room_3d_scene(test_project_and_room):
    """Verifies Three.js / GLTF scene graph export structure."""
    room_id = test_project_and_room["room_id"]
    res = client.get(f"/api/rooms/{room_id}/3d-scene/export")
    assert res.status_code == 200
    export_data = res.json()

    assert export_data["metadata"]["generator"] == "HomeVerse 3D Scene Engine v3"
    assert export_data["metadata"]["format"] == "Three.js JSON / GLTF Schema"
    assert "scene" in export_data
    assert "camera" in export_data["scene"]
    assert "lights" in export_data["scene"]
    assert "objects" in export_data["scene"]
    assert len(export_data["scene"]["objects"]) >= 3


# ---------------- 2. Real-Time Room Editing Tests ----------------

def test_realtime_room_edit_wall_and_floor(test_project_and_room):
    """Verifies real-time room editing updates materials and calculates dynamic cost delta."""
    room_id = test_project_and_room["room_id"]

    edit_payload = {
        "wall_colour": "#2C302E",
        "flooring_material": "Italian Statuario Marble Slabs",
        "active_style": "Moody Luxury",
    }
    res = client.put(f"/api/rooms/{room_id}/realtime-edit", json=edit_payload)
    assert res.status_code == 200
    edit_resp = res.json()

    assert edit_resp["room_id"] == room_id
    assert edit_resp["cost_delta"] > 0
    assert edit_resp["modified_scene"]["walls"]["albedo_color"] == "#2C302E"
    assert "Marble" in edit_resp["modified_scene"]["floor"]["name"]
    assert edit_resp["style_coherence"] >= 80.0
    assert "Italian Marble" in edit_resp["financial_summary"]


def test_realtime_room_edit_vitrified_tiles(test_project_and_room):
    """Verifies real-time room editing with cost-saving tile choice."""
    room_id = test_project_and_room["room_id"]

    edit_payload = {
        "flooring_material": "Glazed Vitrified Tile",
    }
    res = client.put(f"/api/rooms/{room_id}/realtime-edit", json=edit_payload)
    assert res.status_code == 200
    edit_resp = res.json()
    assert edit_resp["cost_delta"] < 0  # Cost savings
    assert "tile" in edit_resp["modified_scene"]["floor"]["name"].lower()


# ---------------- 3. AR Furniture Placement Tests ----------------

def test_ar_model_metadata():
    """Verifies fetching AR model with GLB/USDZ, dimensions, and mobile QR launcher."""
    prod_id = uuid4()
    res = client.get(f"/api/products/{prod_id}/ar-model")
    assert res.status_code == 200
    ar_meta = res.json()

    assert str(ar_meta["product_id"]) == str(prod_id)
    assert ar_meta["glb_url"].endswith(".glb")
    assert ar_meta["usdz_url"].endswith(".usdz")
    assert ar_meta["placement_mode"] in ["horizontal_plane", "vertical_surface"]
    assert "width" in ar_meta["dimensions_m"]
    assert ar_meta["mobile_quicklook_url"].startswith("https://")
    assert "launch=1" in ar_meta["qr_code_data"]


def test_list_ar_ready_models():
    """Verifies listing all AR-ready catalogue items."""
    res = client.get("/api/ar/models")
    assert res.status_code == 200
    models = res.json()
    assert isinstance(models, list)


def test_ar_placement_validation():
    """Verifies physical boundary and 900mm circulation clearance validation during AR placement."""
    prod_id = str(uuid4())
    room_id = str(uuid4())

    # Valid placement within bounds
    valid_payload = {
        "product_id": prod_id,
        "room_id": room_id,
        "position": [1.2, 0.0, -1.0],
        "rotation": [0.0, 45.0, 0.0],
    }
    res_valid = client.post("/api/ar/place", json=valid_payload)
    assert res_valid.status_code == 200
    data_valid = res_valid.json()
    assert data_valid["status"] == "placed"
    assert data_valid["spatial_clearance_valid"] is True
    assert "900mm" in data_valid["message"]

    # Boundary warning placement
    boundary_payload = {
        "product_id": prod_id,
        "room_id": room_id,
        "position": [4.5, 0.0, 5.0],
        "rotation": [0.0, 0.0, 0.0],
    }
    res_boundary = client.post("/api/ar/place", json=boundary_payload)
    assert res_boundary.status_code == 200
    data_boundary = res_boundary.json()
    assert data_boundary["spatial_clearance_valid"] is False
    assert "boundary edge" in data_boundary["message"].lower()


# ---------------- 4. Interactive Floor Plan Tests ----------------

def test_get_and_generate_floorplan(test_project_and_room):
    """Verifies vector floor plan retrieval, walls, doors, windows, and parametric generation."""
    project_id = test_project_and_room["project_id"]

    # 1. Fetch floor plan
    res = client.get(f"/api/projects/{project_id}/floorplan")
    assert res.status_code == 200
    plan = res.json()

    assert plan["project_id"] == project_id
    assert plan["total_area_sqft"] > 0
    assert len(plan["rooms"]) >= 4

    # Validate room vector data
    living_room = next((r for r in plan["rooms"] if "Living" in r["name"]), None)
    assert living_room is not None
    assert len(living_room["walls"]) >= 4
    assert len(living_room["doors"]) >= 1
    assert "swing_arc" in living_room["doors"][0]
    assert len(living_room["windows"]) >= 1
    assert len(living_room["furniture_footprints"]) >= 2

    # 2. Parametric generate
    gen_res = client.post(
        f"/api/projects/{project_id}/floorplan/generate",
        params={"bhk": 3, "area_sqft": 1500.0},
    )
    assert gen_res.status_code == 200
    gen_plan = gen_res.json()
    assert gen_plan["total_area_sqft"] == 1500.0

    # 3. Update floor plan
    update_res = client.put(
        f"/api/projects/{project_id}/floorplan",
        json={"rooms": plan["rooms"], "version": 2},
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "success"


# ---------------- 5. Voice Assistant Copilot Tests ----------------

def test_voice_command_wall_color():
    """Verifies voice NLU parsing for wall paint color and synthesized speech reply."""
    payload = {"transcript": "Please paint the living room walls in a designer warm greige"}
    res = client.post("/api/voice/command", json=payload)
    assert res.status_code == 200
    cmd_resp = res.json()

    assert cmd_resp["action_type"] == "change_wall_color"
    assert "greige" in cmd_resp["voice_reply"].lower() or "warm" in cmd_resp["voice_reply"].lower()
    assert cmd_resp["action_payload"]["color_hex"] == "#D8D0C5"
    assert len(cmd_resp["action_chips"]) >= 1


def test_voice_command_flooring():
    """Verifies voice NLU parsing for Italian marble flooring change and cost calculation."""
    payload = {"transcript": "Switch the flooring to Italian statuario marble"}
    res = client.post("/api/voice/command", json=payload)
    assert res.status_code == 200
    cmd_resp = res.json()

    assert cmd_resp["action_type"] == "change_flooring"
    assert "marble" in cmd_resp["voice_reply"].lower()
    assert cmd_resp["action_payload"]["cost_impact"] > 0


def test_voice_command_camera_switch():
    """Verifies voice NLU parsing for camera perspective changes."""
    payload = {"transcript": "Show me the top-down floor plan view"}
    res = client.post("/api/voice/command", json=payload)
    assert res.status_code == 200
    cmd_resp = res.json()

    assert cmd_resp["action_type"] == "switch_camera_view"
    assert cmd_resp["action_payload"]["view_type"] == "top_down"


def test_voice_command_budget_and_timeline():
    """Verifies voice inquiry for budget status and execution timeline."""
    payload_budget = {"transcript": "How much budget do we have left for finishing?"}
    res_b = client.post("/api/voice/command", json=payload_budget)
    assert res_b.status_code == 200
    assert res_b.json()["action_type"] in ["budget_query", "budget_inquiry"]

    payload_time = {"transcript": "When will the interior project finish?"}
    res_t = client.post("/api/voice/command", json=payload_time)
    assert res_t.status_code == 200
    assert res_t.json()["action_type"] in ["timeline_query", "timeline_inquiry"]


# ---------------- 6. Advanced PBR Materials & Comparison Tests ----------------

def test_list_and_filter_materials():
    """Verifies fetching PBR materials, filtering by category, and sorting."""
    # List all
    res = client.get("/api/materials")
    assert res.status_code == 200
    mats = res.json()
    assert len(mats) >= 10

    # Filter stone
    res_stone = client.get("/api/materials?category=stone")
    assert res_stone.status_code == 200
    stones = res_stone.json()
    assert len(stones) >= 2
    for s in stones:
        assert s["category"] == "stone"

    # Filter max cost
    res_budget = client.get("/api/materials?max_cost=200")
    assert res_budget.status_code == 200
    budget_mats = res_budget.json()
    for b in budget_mats:
        assert b["cost_per_sqft"] <= 200


def test_material_comparison_engine():
    """Verifies technical and financial side-by-side comparison between materials."""
    all_res = client.get("/api/materials")
    all_mats = all_res.json()

    marble = next((m for m in all_mats if "Marble" in m["name"]), all_mats[0])
    tile = next((m for m in all_mats if "Vitrified" in m["name"]), all_mats[1])

    compare_payload = {
        "material_a_id": marble["id"],
        "material_b_id": tile["id"],
        "area_sqft": 280.0,
    }
    res = client.post("/api/materials/compare", json=compare_payload)
    assert res.status_code == 200
    cmp = res.json()

    assert cmp["material_a"]["id"] == marble["id"]
    assert cmp["material_b"]["id"] == tile["id"]
    assert cmp["area_sqft"] == 280.0
    assert cmp["total_cost_a"] == marble["cost_per_sqft"] * 280.0
    assert cmp["total_cost_b"] == tile["cost_per_sqft"] * 280.0
    assert "cost_difference" in cmp
    assert "recommendation" in cmp
    assert len(cmp["technical_tradeoffs"]) >= 3
