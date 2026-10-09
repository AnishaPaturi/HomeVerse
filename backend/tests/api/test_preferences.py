"""
API Tests for Phase 10: Preference Questionnaire & Style Discovery Engine
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_reference_images():
    response = client.get("/api/preferences/reference-images")
    assert response.status_code == 200
    catalog = response.json()
    assert len(catalog) >= 5
    assert all("style" in img and "image_url" in img and "colours" in img for img in catalog)

def test_calculate_style_discovery():
    payload = {
        "reactions": [
            {"image_id": "ref-warm-contemp-1", "reaction": "like"},
            {"image_id": "ref-japandi-1", "reaction": "like"},
            {"image_id": "ref-industrial-1", "reaction": "dislike"},
            {"image_id": "ref-minimalist-1", "reaction": "skip"}
        ],
        "questionnaire": {
            "lifestyle": "family_centric",
            "family_size": "3-4",
            "pets": True,
            "children": True,
            "work_from_home": "frequent",
            "entertainment": "occasional",
            "storage_requirements": "high",
            "maintenance_preference": "low_maintenance"
        }
    }

    response = client.post("/api/preferences/calculate-style", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Validate Phase 10 output structure
    assert "primary_style" in data
    assert "secondary_style" in data
    assert "wood_preference" in data
    assert isinstance(data["colour_preference"], list)
    assert len(data["colour_preference"]) > 0
    assert "material_preferences" in data
    assert data["confidence_score"] >= 0.70
    assert data["lifestyle"]["family_size"] == "3-4"

def test_get_current_preferences():
    response = client.get("/api/preferences")
    assert response.status_code == 200
    profile = response.json()
    assert "primary_style" in profile
    assert "colour_preference" in profile
    assert "wood_preference" in profile

def test_save_and_resume_questionnaire_progress():
    # Simulate user answering questions up to index 3 and pausing / disconnecting
    save_payload = {
        "current_index": 3,
        "active_tab": "discovery",
        "reactions": [
            {"image_id": "ref-warm-contemp-1", "reaction": "like"},
            {"image_id": "ref-japandi-1", "reaction": "dislike"},
            {"image_id": "ref-industrial-1", "reaction": "like"}
        ],
        "questionnaire": {
            "family_size": "Couple",
            "pets": True,
            "children": False,
            "work_from_home": "Full-time",
            "entertainment": "Occasional Dinners",
            "storage_requirements": "moderate",
            "maintenance_preference": "artisanal"
        }
    }

    save_res = client.post("/api/preferences/save-progress", json=save_payload)
    assert save_res.status_code == 200
    saved = save_res.json()
    assert saved["status"] == "saved"
    assert saved["current_index"] == 3
    assert len(saved["reactions"]) == 3

    # Now simulate user reconnecting / reloading and querying progress
    progress_res = client.get("/api/preferences/progress")
    assert progress_res.status_code == 200
    progress = progress_res.json()
    assert progress["status"] == "restored"
    assert progress["current_index"] == 3
    assert progress["active_tab"] == "discovery"
    assert len(progress["reactions"]) == 3
    assert progress["reactions"][0]["image_id"] == "ref-warm-contemp-1"
    assert progress["reactions"][0]["reaction"] == "like"
    assert progress["questionnaire"]["family_size"] == "Couple"
    assert progress["questionnaire"]["pets"] is True
    assert progress["questionnaire"]["maintenance_preference"] == "artisanal"

