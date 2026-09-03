"""
API Route Tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "HomeVerse" in response.json()["message"]
