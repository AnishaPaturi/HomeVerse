"""
Prometheus Metrics Registry and Telemetry Collectors for HomeVerse (Phase 38)
Collects:
- API requests, errors, latency (average response time)
- AI generation time & failures
- Budget optimization requests
- Active projects count
- Database connection pool & query latency
- CPU & Memory utilization
- Background queue lengths
"""
import os
import time
from typing import Any, Dict, Optional
import psutil
from prometheus_client import (
    REGISTRY,
    Counter,
    Gauge,
    Histogram,
    CollectorRegistry,
)

# Helper for registering metrics idempotently to prevent errors during test suite reloads
def _get_or_create_metric(metric_cls, name, documentation, *args, **kwargs):
    """Retrieve an already registered metric from REGISTRY or register a new one."""
    registry = kwargs.pop("registry", REGISTRY)
    for collector in list(registry._names_to_collectors.values()):
        if getattr(collector, "_name", None) == name:
            return collector
    return metric_cls(name, documentation, *args, registry=registry, **kwargs)


# ==========================================
# 1. API REQUESTS, ERRORS & LATENCY METRICS
# ==========================================
API_REQUESTS_TOTAL = _get_or_create_metric(
    Counter,
    "homeverse_api_requests_total",
    "Total count of HTTP requests served by the HomeVerse API",
    ["method", "endpoint", "status_code"],
)

API_ERRORS_TOTAL = _get_or_create_metric(
    Counter,
    "homeverse_api_errors_total",
    "Total count of HTTP error responses (4xx and 5xx) served by HomeVerse API",
    ["method", "endpoint", "status_code", "error_type"],
)

REQUEST_LATENCY_SECONDS = _get_or_create_metric(
    Histogram,
    "homeverse_request_latency_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

# ==========================================
# 2. AI GENERATION METRICS
# ==========================================
AI_GENERATION_REQUESTS_TOTAL = _get_or_create_metric(
    Counter,
    "homeverse_ai_generation_requests_total",
    "Total number of AI design generation requests initiated",
    ["model", "status"],
)

AI_GENERATION_FAILURES_TOTAL = _get_or_create_metric(
    Counter,
    "homeverse_ai_generation_failures_total",
    "Total number of AI design generation failures",
    ["model", "error_type"],
)

AI_GENERATION_DURATION_SECONDS = _get_or_create_metric(
    Histogram,
    "homeverse_ai_generation_duration_seconds",
    "Time taken for AI model design generation in seconds",
    ["model"],
    buckets=(0.5, 1.0, 2.5, 5.0, 10.0, 20.0, 30.0, 60.0),
)

# ==========================================
# 3. BUDGET OPTIMIZATION METRICS
# ==========================================
BUDGET_OPTIMIZATIONS_TOTAL = _get_or_create_metric(
    Counter,
    "homeverse_budget_optimizations_total",
    "Total number of budget optimization and what-if simulation requests",
    ["status"],
)

# ==========================================
# 4. ACTIVE PROJECTS & DATABASE METRICS
# ==========================================
ACTIVE_PROJECTS_TOTAL = _get_or_create_metric(
    Gauge,
    "homeverse_active_projects_total",
    "Total number of active projects in the HomeVerse platform",
)

DB_CONNECTIONS_ACTIVE = _get_or_create_metric(
    Gauge,
    "homeverse_db_connections_active",
    "Number of database connections currently checked out of the pool",
)

DB_CONNECTIONS_IDLE = _get_or_create_metric(
    Gauge,
    "homeverse_db_connections_idle",
    "Number of database connections currently idle in the pool",
)

DB_POOL_SIZE = _get_or_create_metric(
    Gauge,
    "homeverse_db_pool_size",
    "Configured size of the database connection pool",
)

DB_POOL_OVERFLOW = _get_or_create_metric(
    Gauge,
    "homeverse_db_pool_overflow",
    "Number of overflow connections opened beyond the pool size",
)

DB_QUERY_DURATION_SECONDS = _get_or_create_metric(
    Histogram,
    "homeverse_db_query_duration_seconds",
    "Database query execution latency in seconds",
    ["query_type"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1.0),
)

# ==========================================
# 5. SYSTEM RESOURCE METRICS (CPU & MEMORY)
# ==========================================
CPU_USAGE_PERCENT = _get_or_create_metric(
    Gauge,
    "homeverse_cpu_usage_percent",
    "Current process CPU utilization percentage",
)

SYSTEM_CPU_PERCENT = _get_or_create_metric(
    Gauge,
    "homeverse_system_cpu_percent",
    "Overall system CPU utilization percentage",
)

MEMORY_USAGE_BYTES = _get_or_create_metric(
    Gauge,
    "homeverse_memory_usage_bytes",
    "Current process resident memory usage (RSS) in bytes",
)

MEMORY_USAGE_PERCENT = _get_or_create_metric(
    Gauge,
    "homeverse_memory_usage_percent",
    "Current process memory utilization as a percentage of system RAM",
)

# ==========================================
# 6. QUEUE LENGTH METRICS
# ==========================================
QUEUE_LENGTH = _get_or_create_metric(
    Gauge,
    "homeverse_queue_length",
    "Number of pending tasks waiting in the background processing queue",
    ["queue_name"],
)


# ==========================================
# METRIC COLLECTION HELPERS
# ==========================================
_process = psutil.Process(os.getpid())


def collect_system_metrics() -> Dict[str, float]:
    """Sample current CPU and memory utilization using psutil."""
    try:
        proc_cpu = _process.cpu_percent(interval=None)
        sys_cpu = psutil.cpu_percent(interval=None)
        mem_info = _process.memory_info()
        mem_rss = float(mem_info.rss)
        mem_pct = float(_process.memory_percent())

        CPU_USAGE_PERCENT.set(proc_cpu)
        SYSTEM_CPU_PERCENT.set(sys_cpu)
        MEMORY_USAGE_BYTES.set(mem_rss)
        MEMORY_USAGE_PERCENT.set(mem_pct)

        return {
            "process_cpu_percent": proc_cpu,
            "system_cpu_percent": sys_cpu,
            "memory_usage_bytes": mem_rss,
            "memory_usage_mb": round(mem_rss / (1024 * 1024), 2),
            "memory_percent": round(mem_pct, 2),
        }
    except Exception:
        return {
            "process_cpu_percent": 0.0,
            "system_cpu_percent": 0.0,
            "memory_usage_bytes": 0.0,
            "memory_usage_mb": 0.0,
            "memory_percent": 0.0,
        }


def collect_database_metrics(engine: Optional[Any] = None) -> Dict[str, Any]:
    """Inspect SQLAlchemy connection pool metrics."""
    if engine is None:
        try:
            from app.db.session import engine as app_engine
            engine = app_engine
        except Exception:
            return {}

    metrics = {
        "active_connections": 0,
        "idle_connections": 0,
        "pool_size": 0,
        "overflow": 0,
    }

    try:
        pool = getattr(engine, "pool", None)
        if pool is not None:
            # Check for QueuePool methods
            if hasattr(pool, "checkedout"):
                metrics["active_connections"] = pool.checkedout()
                DB_CONNECTIONS_ACTIVE.set(metrics["active_connections"])
            if hasattr(pool, "checkedin"):
                metrics["idle_connections"] = pool.checkedin()
                DB_CONNECTIONS_IDLE.set(metrics["idle_connections"])
            if hasattr(pool, "size"):
                metrics["pool_size"] = pool.size()
                DB_POOL_SIZE.set(metrics["pool_size"])
            if hasattr(pool, "overflow"):
                metrics["overflow"] = pool.overflow()
                DB_POOL_OVERFLOW.set(metrics["overflow"])
    except Exception:
        pass

    return metrics


def collect_queue_metrics(redis_client: Optional[Any] = None) -> Dict[str, int]:
    """Sample Celery / Redis background queue length."""
    queues = {"celery": 0, "default": 0}

    if redis_client is None:
        try:
            import redis
            from app.config import settings
            r = redis.Redis.from_url(
                getattr(settings, "CELERY_BROKER_URL", settings.REDIS_URL),
                socket_connect_timeout=0.5,
            )
            for q_name in queues.keys():
                q_len = r.llen(q_name)
                queues[q_name] = int(q_len)
                QUEUE_LENGTH.labels(queue_name=q_name).set(q_len)
        except Exception:
            for q_name in queues.keys():
                QUEUE_LENGTH.labels(queue_name=q_name).set(0)
    else:
        try:
            for q_name in queues.keys():
                q_len = redis_client.llen(q_name)
                queues[q_name] = int(q_len)
                QUEUE_LENGTH.labels(queue_name=q_name).set(q_len)
        except Exception:
            pass

    return queues


def update_active_projects_count(db: Optional[Any] = None) -> int:
    """Query database for current active projects count."""
    count = 0
    try:
        if db is not None:
            from app.models.project import Project
            count = db.query(Project).count()
            ACTIVE_PROJECTS_TOTAL.set(count)
        else:
            from app.db.session import SessionLocal
            from app.models.project import Project
            session = SessionLocal()
            try:
                count = session.query(Project).count()
                ACTIVE_PROJECTS_TOTAL.set(count)
            finally:
                session.close()
    except Exception:
        pass
    return count


def collect_all_metrics(engine: Optional[Any] = None, db: Optional[Any] = None) -> None:
    """Trigger all dynamic collectors to ensure Prometheus exposition is current."""
    collect_system_metrics()
    collect_database_metrics(engine)
    collect_queue_metrics()
    if db is not None:
        update_active_projects_count(db)


def get_metrics_summary() -> Dict[str, Any]:
    """Generate a clean JSON summary of key operational telemetry."""
    sys_stats = collect_system_metrics()
    db_stats = collect_database_metrics()
    queue_stats = collect_queue_metrics()

    # Calculate average response time and request counts from Prometheus collectors if available
    req_count = 0.0
    err_count = 0.0
    latency_sum = 0.0
    latency_count = 0.0

    try:
        for metric in REGISTRY.collect():
            if metric.name == "homeverse_api_requests_total":
                for sample in metric.samples:
                    req_count += sample.value
            elif metric.name == "homeverse_api_errors_total":
                for sample in metric.samples:
                    err_count += sample.value
            elif metric.name == "homeverse_request_latency_seconds":
                for sample in metric.samples:
                    if sample.name.endswith("_sum"):
                        latency_sum += sample.value
                    elif sample.name.endswith("_count"):
                        latency_count += sample.value
    except Exception:
        pass

    avg_latency_ms = (
        round((latency_sum / latency_count) * 1000.0, 2)
        if latency_count > 0
        else 0.0
    )
    error_rate_pct = (
        round((err_count / req_count) * 100.0, 2)
        if req_count > 0
        else 0.0
    )

    return {
        "api": {
            "total_requests": int(req_count),
            "total_errors": int(err_count),
            "error_rate_percent": error_rate_pct,
            "average_response_time_ms": avg_latency_ms,
        },
        "system": sys_stats,
        "database": db_stats,
        "queues": queue_stats,
        "status": "healthy",
    }
