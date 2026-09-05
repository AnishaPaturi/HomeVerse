"""
Unit and Integration Tests for Standardized API Error Handling (Phase 41)
"""
import uuid
import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient

from app.main import app
from app.core.exceptions import (
    HomeVerseException,
    BudgetExceededException,
    ResourceNotFoundException,
    UnauthorizedException,
    ForbiddenException,
    ValidationErrorException,
    AIGenerationException,
    RateLimitExceededException,
)

# Router to trigger specific error conditions
error_test_router = APIRouter(prefix="/test/errors", tags=["Testing"])

@error_test_router.get("/budget-exceeded")
def trigger_budget_exceeded():
    raise BudgetExceededException()

@error_test_router.get("/not-found")
def trigger_not_found():
    raise ResourceNotFoundException(
        message="Design concept not found.",
        resource_type="Design",
        resource_id="8f3b23c9-026f-4a06-b337-df951016892a",
    )

@error_test_router.get("/unauthorized")
def trigger_unauthorized():
    raise UnauthorizedException()

@error_test_router.get("/forbidden")
def trigger_forbidden():
    raise ForbiddenException()

@error_test_router.get("/ai-failed")
def trigger_ai_failed():
    raise AIGenerationException()

@error_test_router.get("/rate-limited")
def trigger_rate_limited():
    raise RateLimitExceededException(retry_after_seconds=60)

@error_test_router.get("/unhandled-500")
def trigger_unhandled():
    raise RuntimeError("Simulated unhandled internal server crash")

app.include_router(error_test_router)
client = TestClient(app, raise_server_exceptions=False)


def test_budget_exceeded_standard_schema():
    """Verify Phase 41 exact error response schema for BUDGET_EXCEEDED."""
    response = client.get("/test/errors/budget-exceeded")
    assert response.status_code == 400
    data = response.json()

    assert "error" in data
    err = data["error"]
    assert err["code"] == "BUDGET_EXCEEDED"
    assert err["message"] == "Design exceeds the configured budget."
    assert "request_id" in err
    assert len(err["request_id"]) > 5
    # Backward-compatible detail field
    assert data["detail"] == "Design exceeds the configured budget."
    # Response header check
    assert response.headers["X-Request-ID"] == err["request_id"]


def test_resource_not_found_standard_schema():
    """Verify NOT_FOUND error response schema with contextual resource details."""
    response = client.get("/test/errors/not-found")
    assert response.status_code == 404
    data = response.json()

    assert "error" in data
    err = data["error"]
    assert err["code"] == "NOT_FOUND"
    assert err["message"] == "Design concept not found."
    assert err["details"]["resource_type"] == "Design"
    assert err["details"]["resource_id"] == "8f3b23c9-026f-4a06-b337-df951016892a"


def test_unauthorized_error_schema():
    """Verify UNAUTHORIZED error returns 401 and standard code."""
    response = client.get("/test/errors/unauthorized")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_forbidden_error_schema():
    """Verify FORBIDDEN error returns 403 and standard code."""
    response = client.get("/test/errors/forbidden")
    assert response.status_code == 403
    data = response.json()
    assert data["error"]["code"] == "FORBIDDEN"


def test_ai_generation_failed_error_schema():
    """Verify AI_GENERATION_FAILED returns 500 and human-friendly message."""
    response = client.get("/test/errors/ai-failed")
    assert response.status_code == 500
    data = response.json()
    assert data["error"]["code"] == "AI_GENERATION_FAILED"
    assert "AI design generation encountered an unexpected error" in data["error"]["message"]


def test_rate_limit_exceeded_error_schema():
    """Verify RATE_LIMIT_EXCEEDED returns 429 with retry_after detail."""
    response = client.get("/test/errors/rate-limited")
    assert response.status_code == 429
    data = response.json()
    assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert data["error"]["details"]["retry_after_seconds"] == 60


def test_unhandled_exception_fallback():
    """Verify unhandled internal server exceptions return 500 with request_id without crashing."""
    response = client.get("/test/errors/unhandled-500")
    assert response.status_code == 500
    data = response.json()
    assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"
    assert "request_id" in data["error"]
    assert "Reference Request ID" in data["error"]["message"]


def test_missing_route_not_found():
    """Verify non-existent API routes return standardized NOT_FOUND JSON."""
    response = client.get("/api/definitely-not-found-endpoint-xyz")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "NOT_FOUND"
    assert "request_id" in data["error"]
    assert data["error"]["message"] == "Not Found"


def test_pydantic_validation_error_formatting():
    """Verify malformed payload returns HTTP 422 with VALIDATION_ERROR and field details."""
    # Attempting to create a design with invalid payload
    response = client.post("/api/designs/", json={"invalid_field": 123})
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "Validation failed:" in data["error"]["message"]
    assert isinstance(data["error"]["details"], list)
    assert len(data["error"]["details"]) > 0
    assert "field" in data["error"]["details"][0]
    assert "message" in data["error"]["details"][0]
