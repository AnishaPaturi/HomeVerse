"""
HomeVerse Monitoring & Observability Package (Phase 38)
Provides Prometheus metrics collection, system telemetry, CloudWatch alarms,
and request tracking middleware.
"""

from app.monitoring.metrics import (
    API_REQUESTS_TOTAL,
    API_ERRORS_TOTAL,
    REQUEST_LATENCY_SECONDS,
    AI_GENERATION_REQUESTS_TOTAL,
    AI_GENERATION_FAILURES_TOTAL,
    AI_GENERATION_DURATION_SECONDS,
    BUDGET_OPTIMIZATIONS_TOTAL,
    ACTIVE_PROJECTS_TOTAL,
    DB_CONNECTIONS_ACTIVE,
    DB_CONNECTIONS_IDLE,
    DB_POOL_SIZE,
    DB_QUERY_DURATION_SECONDS,
    CPU_USAGE_PERCENT,
    SYSTEM_CPU_PERCENT,
    MEMORY_USAGE_BYTES,
    MEMORY_USAGE_PERCENT,
    QUEUE_LENGTH,
    collect_all_metrics,
    get_metrics_summary,
)
from app.monitoring.middleware import PrometheusMiddleware

__all__ = [
    "API_REQUESTS_TOTAL",
    "API_ERRORS_TOTAL",
    "REQUEST_LATENCY_SECONDS",
    "AI_GENERATION_REQUESTS_TOTAL",
    "AI_GENERATION_FAILURES_TOTAL",
    "AI_GENERATION_DURATION_SECONDS",
    "BUDGET_OPTIMIZATIONS_TOTAL",
    "ACTIVE_PROJECTS_TOTAL",
    "DB_CONNECTIONS_ACTIVE",
    "DB_CONNECTIONS_IDLE",
    "DB_POOL_SIZE",
    "DB_QUERY_DURATION_SECONDS",
    "CPU_USAGE_PERCENT",
    "SYSTEM_CPU_PERCENT",
    "MEMORY_USAGE_BYTES",
    "MEMORY_USAGE_PERCENT",
    "QUEUE_LENGTH",
    "collect_all_metrics",
    "get_metrics_summary",
    "PrometheusMiddleware",
]
