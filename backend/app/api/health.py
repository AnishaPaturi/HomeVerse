"""
Health Check Endpoints for HomeVerse (Phase 39)
Provides:
- GET /health: API liveness probe
- GET /health/db: Database connectivity & latency check
- GET /health/redis: Redis cache & task broker ping check
- GET /health/full: Composite health check aggregating API, DB, and Redis
- GET /health/live: Kubernetes / ECS liveness probe alias
- GET /health/ready: Kubernetes / ECS readiness probe alias
"""
import time
from typing import Any, Dict
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db

router = APIRouter()


def check_db_health(db: Session) -> Dict[str, Any]:
    """Execute lightweight SELECT 1 query to verify database connectivity."""
    start = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start) * 1000.0, 2)
        dialect_name = getattr(getattr(db, "bind", None), "name", "unknown")
        return {
            "status": "healthy",
            "latency_ms": latency_ms,
            "dialect": dialect_name,
            "error": None,
        }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start) * 1000.0, 2)
        return {
            "status": "unhealthy",
            "latency_ms": latency_ms,
            "dialect": "unknown",
            "error": str(e),
        }


def check_redis_health() -> Dict[str, Any]:
    """Ping Redis server to verify cache and Celery broker reachability."""
    start = time.perf_counter()
    try:
        import redis
        client = redis.Redis.from_url(
            getattr(settings, "CELERY_BROKER_URL", settings.REDIS_URL),
            socket_connect_timeout=1.0,
            socket_timeout=1.0,
        )
        is_alive = client.ping()
        latency_ms = round((time.perf_counter() - start) * 1000.0, 2)
        if is_alive:
            return {
                "status": "healthy",
                "latency_ms": latency_ms,
                "error": None,
            }
        else:
            return {
                "status": "unhealthy",
                "latency_ms": latency_ms,
                "error": "Redis did not respond with PONG",
            }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start) * 1000.0, 2)
        return {
            "status": "unhealthy",
            "latency_ms": latency_ms,
            "error": str(e),
        }


@router.get(
    "",
    summary="API Liveness Probe",
    description="Basic ping check verifying the backend process is running and accepting HTTP requests.",
)
@router.get(
    "/",
    include_in_schema=False,
)
def api_liveness():
    """
    Standard liveness probe for ALB, ECS, and Docker healthchecks.
    Fast execution with no downstream database or cache calls.
    """
    return {
        "status": "ok",
        "api": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


@router.get(
    "/live",
    summary="Kubernetes Liveness Probe",
    description="Alias for /health used by Kubernetes and ECS container orchestrators.",
)
def liveness_probe():
    return api_liveness()


@router.get(
    "/db",
    summary="Database Connectivity Check",
    description="Performs an active SQL query to confirm database read/write readiness.",
)
def database_health(response: Response, db: Session = Depends(get_db)):
    """
    Validates database connection.
    Returns HTTP 200 when connected, or HTTP 503 if unreachable.
    """
    result = check_db_health(db)
    if result["status"] != "healthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "unhealthy",
            "error": result["error"],
            "latency_ms": result["latency_ms"],
        }
    return {
        "status": "ok",
        "database": "healthy",
        "latency_ms": result["latency_ms"],
        "dialect": result["dialect"],
    }


@router.get(
    "/redis",
    summary="Redis Connectivity Check",
    description="Sends PING to Redis cache and task broker to confirm reachability.",
)
def redis_health(response: Response):
    """
    Validates Redis connection.
    Returns HTTP 200 when connected, or HTTP 503 if unreachable.
    """
    result = check_redis_health()
    if result["status"] != "healthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "redis": "unhealthy",
            "error": result["error"],
            "latency_ms": result["latency_ms"],
        }
    return {
        "status": "ok",
        "redis": "healthy",
        "latency_ms": result["latency_ms"],
    }


@router.get(
    "/full",
    summary="Application Composite Health Check",
    description="Aggregated health check testing API, Database, and Redis subsystems.",
)
def full_health(response: Response, db: Session = Depends(get_db)):
    """
    Comprehensive health check matching Phase 39 specification:
    {
        "api": "healthy",
        "database": "healthy",
        "redis": "healthy"
    }
    """
    db_result = check_db_health(db)
    redis_result = check_redis_health()

    api_status = "healthy"
    db_status = db_result["status"]
    redis_status = redis_result["status"]

    overall_healthy = (db_status == "healthy") and (redis_status == "healthy")
    if not overall_healthy:
        # In staging/prod, failure of DB or Redis degrades service readiness
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "healthy" if overall_healthy else "degraded",
        "api": api_status,
        "database": db_status,
        "redis": redis_status,
        "details": {
            "database": db_result,
            "redis": redis_result,
        },
    }


@router.get(
    "/ready",
    summary="Kubernetes Readiness Probe",
    description="Readiness check verifying database and essential services before routing user traffic.",
)
def readiness_probe(response: Response, db: Session = Depends(get_db)):
    """
    Readiness probe for load balancers.
    Requires database connectivity to be healthy.
    """
    db_result = check_db_health(db)
    if db_result["status"] != "healthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unready",
            "database": "unhealthy",
            "error": db_result["error"],
        }
    return {
        "status": "ready",
        "database": "healthy",
        "latency_ms": db_result["latency_ms"],
    }
