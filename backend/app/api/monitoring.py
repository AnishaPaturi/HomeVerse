"""
Monitoring & Telemetry API Endpoints (Phase 38)
Provides:
- GET /metrics: Prometheus scrapable endpoint (text/plain; version=0.0.4)
- GET /api/monitoring/metrics: JSON overview for operational dashboards
- GET /api/monitoring/health: Telemetry health probe
- POST /api/monitoring/cloudwatch/publish: Manual or scheduled CloudWatch flush
"""
from fastapi import APIRouter, Depends, Response
from prometheus_client import CONTENT_TYPE_LATEST, REGISTRY, generate_latest
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import engine, get_db
from app.monitoring.cloudwatch import cloudwatch_publisher
from app.monitoring.metrics import (
    collect_all_metrics,
    get_metrics_summary,
    update_active_projects_count,
)

router = APIRouter()


@router.get(
    "/metrics",
    response_class=Response,
    summary="Scrape Prometheus Metrics",
    description="Returns standard Prometheus text-based exposition of all application telemetry.",
    include_in_schema=True,
)
def prometheus_metrics():
    """
    Standard Prometheus metrics scrape endpoint.
    Refreshes live system, database pool, and queue metrics before serializing.
    """
    collect_all_metrics(engine=engine)
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST,
    )


@router.get(
    "/summary",
    summary="Operational Telemetry JSON Summary",
    description="Returns structured metrics summary including API error rates, latency, system CPU/RAM, and DB pool stats.",
)
@router.get(
    "/metrics/summary",
    summary="Operational Telemetry JSON Summary (Alias)",
    description="Alias for /summary returning structured metrics JSON.",
)
def telemetry_summary(db: Session = Depends(get_db)):
    """
    Provides a machine-readable JSON metrics summary for dashboards,
    automated monitors, and health probes.
    """
    update_active_projects_count(db)
    summary = get_metrics_summary()
    summary["environment"] = settings.ENVIRONMENT
    summary["project"] = settings.PROJECT_NAME
    return summary


@router.post(
    "/cloudwatch/publish",
    summary="Publish Telemetry to AWS CloudWatch",
    description="Manually or periodically flushes current telemetry metrics to AWS CloudWatch.",
)
def publish_cloudwatch_telemetry():
    """
    Pushes current application metrics to AWS CloudWatch namespace.
    """
    success = cloudwatch_publisher.publish_system_and_api_telemetry()
    return {
        "published": success,
        "enabled": cloudwatch_publisher.enabled,
        "namespace": cloudwatch_publisher.namespace,
        "region": cloudwatch_publisher.region_name,
    }


@router.get(
    "/health",
    summary="Monitoring Subsystem Health",
    description="Checks the health of the monitoring subsystem.",
)
def monitoring_health():
    """
    Verifies monitoring and metrics collector status.
    """
    return {
        "status": "healthy",
        "prometheus_enabled": settings.ENABLE_PROMETHEUS_METRICS,
        "cloudwatch_enabled": settings.ENABLE_CLOUDWATCH_METRICS,
        "registry_collectors_count": len(REGISTRY._names_to_collectors),
    }
