"""
Prometheus HTTP Middleware for FastAPI (Phase 38)
Automatically tracks:
- Request counts by method, endpoint, and status code
- Error counts and classification (client_error vs server_error)
- Request latency distribution and average response time
- URL path normalization to prevent high-cardinality metric explosion
- Injects X-Process-Time response header
"""
import re
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.monitoring.metrics import (
    API_REQUESTS_TOTAL,
    API_ERRORS_TOTAL,
    REQUEST_LATENCY_SECONDS,
)

# Regex to match UUIDs (e.g., 123e4567-e89b-12d3-a456-426614174000)
UUID_PATTERN = re.compile(
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    re.IGNORECASE,
)

# Regex to match purely numeric IDs
NUMERIC_ID_PATTERN = re.compile(r"(?<=/)\d+(?=(/|$))")


def normalize_path(path: str) -> str:
    """
    Standardizes dynamic URL path parameters to prevent high-cardinality label explosion
    in Prometheus metric collections.
    Examples:
        /api/projects/a1b2c3d4-0000-1111-2222-333344445555 -> /api/projects/{id}
        /api/designs/12345/items -> /api/designs/{id}/items
    """
    # Replace UUIDs
    normalized = UUID_PATTERN.sub("{id}", path)
    # Replace integers
    normalized = NUMERIC_ID_PATTERN.sub("{id}", normalized)
    return normalized


class PrometheusMiddleware(BaseHTTPMiddleware):
    """
    FastAPI / Starlette middleware collecting HTTP request counts,
    error counts, and latency metrics.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Exclude metrics scrape endpoint itself to avoid self-referential loop skewing
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        endpoint = normalize_path(request.url.path)
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time
            status_code = response.status_code

            # Record Prometheus metrics
            API_REQUESTS_TOTAL.labels(
                method=method,
                endpoint=endpoint,
                status_code=str(status_code),
            ).inc()

            REQUEST_LATENCY_SECONDS.labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)

            if status_code >= 400:
                err_type = "client_error" if status_code < 500 else "server_error"
                API_ERRORS_TOTAL.labels(
                    method=method,
                    endpoint=endpoint,
                    status_code=str(status_code),
                    error_type=err_type,
                ).inc()

            # Append X-Process-Time header in milliseconds
            response.headers["X-Process-Time"] = f"{duration * 1000:.2f}ms"
            return response

        except Exception as exc:
            duration = time.perf_counter() - start_time
            API_REQUESTS_TOTAL.labels(
                method=method,
                endpoint=endpoint,
                status_code="500",
            ).inc()

            REQUEST_LATENCY_SECONDS.labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)

            API_ERRORS_TOTAL.labels(
                method=method,
                endpoint=endpoint,
                status_code="500",
                error_type="unhandled_exception",
            ).inc()

            raise exc
