"""
Comprehensive Health Check Subsystem Tests (Phase 39)
Validates:
- GET /health: API liveness probe
- GET /health/db: Database connectivity & latency check
- GET /health/redis: Redis connectivity & ping check
- GET /health/full: Composite health check aggregating API, DB, and Redis
- GET /health/live: Kubernetes liveness probe alias
- GET /health/ready: Kubernetes readiness probe alias
"""
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health_endpoint():
    """Verify GET /health returns HTTP 200 with ok and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["api"] == "healthy"


def test_api_health_trailing_slash():
    """Verify GET /health/ also returns HTTP 200."""
    response = client.get("/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_api_health_liveness_alias():
    """Verify GET /health/live returns HTTP 200 with liveness details."""
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["api"] == "healthy"


def test_api_root():
    """Verify API root welcomes client."""
    response = client.get("/")
    assert response.status_code == 200
    assert "HomeVerse" in response.json()["message"]


def test_database_health_endpoint():
    """Verify GET /health/db executes SELECT 1 and returns healthy status with latency."""
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "healthy"
    assert isinstance(data["latency_ms"], (int, float))
    assert data["latency_ms"] >= 0


def test_database_health_api_prefix():
    """Verify GET /api/health/db is accessible via /api prefix."""
    response = client.get("/api/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["database"] == "healthy"


def test_database_health_failure_branch():
    """Verify GET /health/db returns HTTP 503 when database execution fails."""
    with patch("app.api.health.check_db_health", return_value={
        "status": "unhealthy",
        "latency_ms": 15.2,
        "dialect": "unknown",
        "error": "Database connection refused",
    }):
        response = client.get("/health/db")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "unhealthy"
        assert "Database connection refused" in data["error"]


def test_redis_health_success():
    """Verify GET /health/redis returns HTTP 200 when Redis ping succeeds."""
    with patch("app.api.health.check_redis_health", return_value={
        "status": "healthy",
        "latency_ms": 0.65,
        "error": None,
    }):
        response = client.get("/health/redis")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["redis"] == "healthy"


def test_redis_health_failure():
    """Verify GET /health/redis returns HTTP 503 when Redis is down."""
    with patch("app.api.health.check_redis_health", return_value={
        "status": "unhealthy",
        "latency_ms": 1002.5,
        "error": "Error 10061 connecting to localhost:6379",
    }):
        response = client.get("/health/redis")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["redis"] == "unhealthy"


def test_full_health_endpoint_all_healthy():
    """Verify GET /health/full returns exact Phase 39 specification: api, database, redis all healthy."""
    with patch("app.api.health.check_redis_health", return_value={"status": "healthy", "latency_ms": 0.5, "error": None}):
        response = client.get("/health/full")
        assert response.status_code == 200
        data = response.json()
        assert data["api"] == "healthy"
        assert data["database"] == "healthy"
        assert data["redis"] == "healthy"
        assert data["status"] == "healthy"


def test_full_health_endpoint_degraded():
    """Verify GET /health/full returns HTTP 503 with degraded status when Redis is down."""
    with patch("app.api.health.check_redis_health", return_value={"status": "unhealthy", "latency_ms": 10.0, "error": "Timeout"}):
        response = client.get("/health/full")
        assert response.status_code == 503
        data = response.json()
        assert data["api"] == "healthy"
        assert data["database"] == "healthy"
        assert data["redis"] == "unhealthy"
        assert data["status"] == "degraded"


def test_readiness_probe_healthy():
    """Verify GET /health/ready returns HTTP 200 when database is ready."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "healthy"


def test_readiness_probe_unready():
    """Verify GET /health/ready returns HTTP 503 when database is unready."""
    with patch("app.api.health.check_db_health", return_value={"status": "unhealthy", "latency_ms": 5.0, "dialect": "unknown", "error": "Down"}):
        response = client.get("/health/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unready"
        assert data["database"] == "unhealthy"
