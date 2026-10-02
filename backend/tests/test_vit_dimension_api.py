"""
Unit & Integration Tests for HomeVerse ViT Floor Plan Dimension API
Phase 50 - Vision Transformer Architectural Intelligence
"""

import os
import io
import base64
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.ai.dimension_service import DimensionService
from app.ai.dimension_schemas import DimensionInferenceResponse


@pytest.fixture(scope="module")
def sample_floorplan_bytes():
    """Create or load a sample 224x224 architectural test floorplan."""
    sample_path = "ml/dimension-vit/dataset/data/images/floor_000001.png"
    if os.path.exists(sample_path):
        with open(sample_path, "rb") as f:
            return f.read()

    # Fallback to generated image in memory
    img = Image.new("RGB", (224, 224), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_dimension_service_direct_inference(sample_floorplan_bytes):
    """Verify that DimensionService directly generates validated room metrics."""
    service = DimensionService.get_instance()
    response = service.infer_dimensions(
        image_input=sample_floorplan_bytes,
        target_room="Living Room",
        ceiling_height_m=2.8
    )

    assert isinstance(response, DimensionInferenceResponse)
    assert response.success is True
    assert len(response.rooms) == 1

    living_room = response.rooms[0]
    assert living_room.room_name == "Living Room"
    assert living_room.width > 0.0
    assert living_room.depth > 0.0
    assert living_room.height == 2.8
    assert living_room.area > 0.0
    assert 0.0 <= living_room.confidence <= 1.0
    assert response.total_width_m is not None
    assert response.total_height_m is not None


def test_api_predict_dimensions_multipart_file_upload(client, sample_floorplan_bytes):
    """Test POST /api/ai/floorplan/dimensions with multipart file upload."""
    files = {
        "file": ("floorplan.png", sample_floorplan_bytes, "image/png")
    }
    data = {
        "target_room": "Master Bedroom",
        "ceiling_height_m": "3.0"
    }

    res = client.post("/api/ai/floorplan/dimensions", files=files, data=data)
    assert res.status_code == 200

    body = res.json()
    assert body["success"] is True
    assert body["model_version"] == "HomeVerse-ViT-Dimension-v1"
    assert len(body["rooms"]) == 1

    room = body["rooms"][0]
    assert room["room_name"] == "Master Bedroom"
    assert room["width"] > 0
    assert room["depth"] > 0
    assert room["height"] == 3.0
    assert room["area"] > 0
    assert "confidence" in room


def test_api_predict_dimensions_all_rooms(client, sample_floorplan_bytes):
    """Test predicting all canonical rooms when target_room is not specified."""
    files = {
        "file": ("floorplan.png", sample_floorplan_bytes, "image/png")
    }

    res = client.post("/api/ai/floorplan/dimensions", files=files)
    assert res.status_code == 200

    body = res.json()
    assert body["success"] is True
    assert len(body["rooms"]) >= 5
    room_names = [r["room_name"] for r in body["rooms"]]
    assert "Living Room" in room_names
    assert "Kitchen" in room_names
    assert "Bathroom" in room_names


def test_api_predict_dimensions_base64_json(client, sample_floorplan_bytes):
    """Test POST /api/ai/floorplan/dimensions/json with base64 payload."""
    b64_str = f"data:image/png;base64,{base64.b64encode(sample_floorplan_bytes).decode('utf-8')}"
    payload = {
        "target_room": "Kitchen",
        "standard_ceiling_height_m": 2.8,
        "image_base64": b64_str
    }

    res = client.post("/api/ai/floorplan/dimensions/json", json=payload)
    assert res.status_code == 200

    body = res.json()
    assert body["success"] is True
    assert len(body["rooms"]) == 1
    assert body["rooms"][0]["room_name"] == "Kitchen"
    assert body["rooms"][0]["area"] > 0


def test_api_predict_dimensions_missing_input_error(client):
    """Verify 400 Bad Request if neither file nor base64 is provided."""
    res = client.post("/api/ai/floorplan/dimensions", data={"target_room": "Living Room"})
    assert res.status_code == 400
    assert "Must provide either an uploaded image file" in res.json()["detail"]
