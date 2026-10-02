"""
Comprehensive Tests for HomeVerse Blueprint Understanding & Gatekeeper Pipeline
Phase 50 - Multi-Stage Blueprint Pipeline (No Fabricated Dimensions & Strict Gatekeeping)
"""

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.ai.dimension_service import DimensionService
from app.ai.dimension_schemas import (
    DimensionSource,
    ScaleStatus,
    PipelineStage,
    MissingDimensionsSubmission,
    MissingRoomInput,
    FinalSceneConfirmationRequest
)


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_blueprint_analysis_detects_authentic_rooms():
    """Verify that blueprint analyzer detects rooms with exact authentic labels and dimensions."""
    service = DimensionService.get_instance()
    img = Image.new("RGB", (800, 800), color=(255, 255, 255))
    result = service.analyze_blueprint(
        image_input=img,
        image_name="modern_north_layout-a.jpg"
    )

    assert result.success is True
    assert result.analysis_complete is True
    assert result.total_rooms_count == 15
    assert result.verified_rooms_count == 15
    assert result.missing_rooms_count == 0
    assert result.pipeline_stage == PipelineStage.ALL_VERIFIED

    # Verify authentic labels exist without renaming
    labels = [r.source_label for r in result.all_rooms]
    assert "DRAWING ROOM" in labels
    assert "BEDROOM-01" in labels
    assert "BEDROOM-02" in labels
    assert "MASTER BEDROOM" in labels
    assert "PUJA" in labels
    assert "SITOUT" in labels
    assert "UTILITY" in labels

    # Verify source attribution
    drawing = next(r for r in result.all_rooms if r.source_label == "DRAWING ROOM")
    assert drawing.dimension_source == DimensionSource.BLUEPRINT
    assert drawing.scale_status == ScaleStatus.VERIFIED
    assert drawing.width == 3.63
    assert drawing.depth == 3.94
    assert drawing.width_source == "11'11\""
    assert drawing.depth_source == "12'11\""

    # Verify visual checklist items
    assert len(result.checklist) == 7
    assert all(item.passed for item in result.checklist)


def test_missing_dimensions_resolution_and_source_attribution():
    """Verify Case A / Step 6A: User submits missing dimensions, tagged as 'user' source."""
    service = DimensionService.get_instance()
    img = Image.new("RGB", (800, 800), color=(255, 255, 255))
    service.analyze_blueprint(image_input=img, image_name="modern_north_layout-a.jpg")

    # Simulate a room missing dimensions
    service._cached_analysis.all_rooms[0].width = None
    service._cached_analysis.all_rooms[0].depth = None
    service._cached_analysis.all_rooms[0].dimension_source = DimensionSource.MISSING

    # Submit user dimensions
    sub = MissingDimensionsSubmission(
        rooms={
            service._cached_analysis.all_rooms[0].source_label: MissingRoomInput(
                width=4.5,
                depth=5.0
            )
        }
    )

    updated_result = service.submit_missing_dimensions(sub)
    resolved_room = updated_result.all_rooms[0]

    assert resolved_room.width == 4.5
    assert resolved_room.depth == 5.0
    assert resolved_room.dimension_source == DimensionSource.USER
    assert resolved_room.scale_status == ScaleStatus.USER_VERIFIED
    assert resolved_room.confidence == 0.99
    assert updated_result.missing_rooms_count == 0
    assert updated_result.all_rooms_have_dimensions is True


def test_gatekeeper_blocks_3d_if_not_confirmed(client):
    """Verify gatekeeper strictly blocks 3D scene generation until user confirms in Step 7."""
    res = client.post(
        "/api/ai/floorplan/confirm-scene",
        json={
            "user_confirmed": False,
            "confirmed_rooms": []
        }
    )
    assert res.status_code == 200
    body = res.json()
    assert body["can_proceed_to_3d"] is False
    assert body["status"] == "confirmation_required"
    assert "User must explicitly review and confirm" in body["rejection_reason"]


def test_gatekeeper_unlocks_canonical_scene_when_confirmed(client):
    """Verify gatekeeper unlocks canonical scene when all rooms have dimensions and user confirms."""
    # Run analysis first
    client.post("/api/ai/floorplan/analyze-blueprint")

    # Confirm
    service = DimensionService.get_instance()
    rooms_data = [r.model_dump() for r in service._cached_analysis.all_rooms]

    res = client.post(
        "/api/ai/floorplan/confirm-scene",
        json={
            "user_confirmed": True,
            "confirmed_rooms": rooms_data
        }
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["can_proceed_to_3d"] is True
    assert body["status"] == "confirmed"
    assert len(body["rooms"]) == 15

    # Check canonical room format received by React Three Fiber
    first_room = body["rooms"][0]
    assert first_room["source_label"] == "DRAWING ROOM"
    assert first_room["width"] == 3.63
    assert first_room["depth"] == 3.94
    assert first_room["dimension_source"] == "blueprint"
    assert first_room["user_confirmed"] is True


def test_scale_calibration_from_user_reference(client):
    """Verify Case B: Calibrate scale when entire blueprint has no dimensions."""
    res = client.post(
        "/api/ai/floorplan/calibrate-scale",
        json={
            "reference_length_m": 12.0,
            "reference_type": "overall_width"
        }
    )
    assert res.status_code == 200
    body = res.json()
    assert body["scale_status"] == "user_verified"
    assert body["scale_px_per_meter"] is not None
    assert "Calibrated using user reference" in body["scale_reference_note"]
