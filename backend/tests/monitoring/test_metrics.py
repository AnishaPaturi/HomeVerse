"""
Unit and Integration Tests for HomeVerse Monitoring & Telemetry Subsystem (Phase 38)
"""
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.monitoring.metrics import (
    API_REQUESTS_TOTAL,
    API_ERRORS_TOTAL,
    REQUEST_LATENCY_SECONDS,
    AI_GENERATION_REQUESTS_TOTAL,
    AI_GENERATION_FAILURES_TOTAL,
    AI_GENERATION_DURATION_SECONDS,
    BUDGET_OPTIMIZATIONS_TOTAL,
    collect_system_metrics,
    collect_database_metrics,
    collect_queue_metrics,
    get_metrics_summary,
)
from app.monitoring.middleware import normalize_path
from app.monitoring.cloudwatch import CloudWatchMetricsPublisher

client = TestClient(app)


def test_metrics_scrape_endpoint_format():
    """Verify GET /metrics returns standard Prometheus plain text exposition format."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    text = response.text

    # Verify standard metrics exist in exposition
    assert "homeverse_api_requests_total" in text
    assert "homeverse_request_latency_seconds" in text
    assert "homeverse_cpu_usage_percent" in text
    assert "homeverse_memory_usage_bytes" in text
    assert "homeverse_db_connections_active" in text
    assert "homeverse_queue_length" in text


def test_prometheus_middleware_tracks_requests_and_latency():
    """Verify HTTP requests pass through middleware, record latency, and add X-Process-Time header."""
    response = client.get("/")
    assert response.status_code == 200
    assert "X-Process-Time" in response.headers
    assert response.headers["X-Process-Time"].endswith("ms")

    # Scrape metrics and verify counter updated
    metrics_resp = client.get("/metrics")
    assert 'homeverse_api_requests_total{endpoint="/",method="GET",status_code="200"}' in metrics_resp.text


def test_prometheus_middleware_tracks_errors():
    """Verify 4xx error responses increment the error counter with client_error label."""
    fake_id = str(uuid.uuid4())
    response = client.get(f"/api/projects/{fake_id}")
    # May return 404 or 401 depending on auth/data
    assert response.status_code >= 400

    metrics_resp = client.get("/metrics")
    assert "homeverse_api_errors_total" in metrics_resp.text
    assert 'error_type="client_error"' in metrics_resp.text


def test_path_normalization():
    """Verify dynamic UUIDs and integer path parameters are normalized to avoid label explosion."""
    test_uuid = "123e4567-e89b-12d3-a456-426614174000"
    normalized = normalize_path(f"/api/projects/{test_uuid}/designs/42/items")
    assert test_uuid not in normalized
    assert normalized == "/api/projects/{id}/designs/{id}/items"


def test_telemetry_summary_endpoint():
    """Verify GET /api/monitoring/metrics/summary returns structured JSON telemetry."""
    response = client.get("/api/monitoring/metrics/summary")
    assert response.status_code == 200
    data = response.json()

    assert "api" in data
    assert "total_requests" in data["api"]
    assert "average_response_time_ms" in data["api"]
    assert "error_rate_percent" in data["api"]

    assert "system" in data
    assert "process_cpu_percent" in data["system"]
    assert "memory_usage_mb" in data["system"]
    assert data["system"]["memory_usage_mb"] > 0

    assert "database" in data
    assert "queues" in data
    assert data["status"] == "healthy"


def test_monitoring_health_endpoint():
    """Verify GET /api/monitoring/health reports healthy status."""
    response = client.get("/api/monitoring/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "registry_collectors_count" in data


def test_system_telemetry_collector_direct():
    """Verify psutil system metrics sampling returns valid positive values."""
    stats = collect_system_metrics()
    assert isinstance(stats["process_cpu_percent"], (int, float))
    assert isinstance(stats["memory_usage_bytes"], (int, float))
    assert stats["memory_usage_bytes"] > 0
    assert stats["memory_usage_mb"] > 0


def test_database_telemetry_collector_direct():
    """Verify DB metrics collector runs safely."""
    stats = collect_database_metrics()
    assert isinstance(stats, dict)
    assert "active_connections" in stats
    assert "pool_size" in stats


def test_queue_telemetry_collector_direct():
    """Verify background task queue collector inspects Celery and default queues safely."""
    stats = collect_queue_metrics()
    assert isinstance(stats, dict)
    assert "celery" in stats
    assert "default" in stats


def test_ai_and_budget_metrics_instruments():
    """Verify AI model generation and budget optimization metrics increment properly."""
    AI_GENERATION_REQUESTS_TOTAL.labels(model="gemini-3.5-flash", status="test_run").inc()
    AI_GENERATION_FAILURES_TOTAL.labels(model="gemini-3.5-flash", error_type="TestTimeout").inc()
    AI_GENERATION_DURATION_SECONDS.labels(model="gemini-3.5-flash").observe(1.42)
    BUDGET_OPTIMIZATIONS_TOTAL.labels(status="test_success").inc()

    metrics_resp = client.get("/metrics")
    text = metrics_resp.text
    assert 'homeverse_ai_generation_requests_total{model="gemini-3.5-flash",status="test_run"}' in text
    assert 'homeverse_ai_generation_failures_total{error_type="TestTimeout",model="gemini-3.5-flash"}' in text
    assert 'homeverse_budget_optimizations_total{status="test_success"}' in text


def test_cloudwatch_publisher_safety():
    """Verify CloudWatch publisher operates safely without throwing exceptions when disabled."""
    publisher = CloudWatchMetricsPublisher(enabled=False)
    assert publisher.enabled is False
    assert publisher.put_metric("TestMetric", 1.0) is False
    assert publisher.publish_system_and_api_telemetry() is False
