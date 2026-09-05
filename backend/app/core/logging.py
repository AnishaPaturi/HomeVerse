"""
Structured JSON Logging Subsystem for HomeVerse (Phase 40)

Features:
- Standardized Structured JSON output formatted for CloudWatch, Datadog, ELK, and stdout.
- Automatic Request ID and User ID contextual correlation using ContextVars.
- Strict PII and secret redaction filter:
  * Passwords
  * JWT tokens
  * API keys
  * Payment information (Credit cards, CVV, account numbers)
- FastAPI / Starlette StructuredLoggingMiddleware tracking duration and response status.
- Correlation ID propagation via X-Request-ID and X-Correlation-ID headers.
"""

import contextvars
from datetime import datetime, timezone
import json
import logging
import re
import sys
import time
from typing import Any, Dict, Optional
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Context Variables for contextual tracking across async task chains
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("request_id_ctx", default="")
user_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id_ctx", default=None)
endpoint_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("endpoint_ctx", default="")

# -------------------------------------------------------------
# Sensitive Field Keys & Patterns (Never Log)
# -------------------------------------------------------------
SENSITIVE_KEY_NAMES = {
    # Passwords
    "password",
    "current_password",
    "new_password",
    "confirm_password",
    "passwd",
    "pwd",
    "secret",
    "client_secret",
    # JWT & Tokens
    "token",
    "access_token",
    "refresh_token",
    "id_token",
    "jwt",
    "authorization",
    "auth",
    "bearer",
    # API Keys
    "api_key",
    "apikey",
    "gemini_api_key",
    "openai_api_key",
    "claude_api_key",
    "ai_api_key",
    "aws_secret_access_key",
    "jwt_secret",
    "secret_key",
    # Payment Information
    "card_number",
    "credit_card",
    "card_num",
    "cvv",
    "cvc",
    "pan",
    "account_number",
    "payment_info",
    "billing_details",
    "stripe_token",
}

# Regex patterns for sensitive in-text tokens
BEARER_TOKEN_PATTERN = re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE)
JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+")
CREDIT_CARD_PATTERN = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
SENSITIVE_JSON_KV_PATTERN = re.compile(
    r'("(?:' + "|".join(re.escape(k) for k in SENSITIVE_KEY_NAMES) + r')"\s*:\s*)"[^"]+"',
    re.IGNORECASE,
)
SENSITIVE_QUERY_PARAM_PATTERN = re.compile(
    r'([?&](?:' + "|".join(re.escape(k) for k in SENSITIVE_KEY_NAMES) + r')=)[^&]+',
    re.IGNORECASE,
)


def redact_sensitive_string(text: str) -> str:
    """Scrub sensitive JWTs, API keys, passwords, and credit card numbers from raw strings."""
    if not isinstance(text, str) or not text:
        return text

    # Redact Bearer tokens
    sanitized = BEARER_TOKEN_PATTERN.sub("Bearer [REDACTED]", text)
    # Redact raw JWT tokens
    sanitized = JWT_PATTERN.sub("[REDACTED_JWT]", sanitized)
    # Redact JSON key-value pairs
    sanitized = SENSITIVE_JSON_KV_PATTERN.sub(r'\1"[REDACTED]"', sanitized)
    # Redact query parameters in URLs
    sanitized = SENSITIVE_QUERY_PARAM_PATTERN.sub(r"\1[REDACTED]", sanitized)
    # Redact 13-19 digit payment cards (ignoring short numbers)
    sanitized = CREDIT_CARD_PATTERN.sub(
        lambda m: "[REDACTED_CARD]" if len(re.sub(r"\D", "", m.group(0))) in [13, 14, 15, 16, 19] else m.group(0),
        sanitized,
    )
    return sanitized


def redact_sensitive_data(val: Any) -> Any:
    """Recursively traverse dictionaries, lists, and values to redact all sensitive fields."""
    if isinstance(val, dict):
        cleaned = {}
        for k, v in val.items():
            if str(k).lower() in SENSITIVE_KEY_NAMES:
                cleaned[k] = "[REDACTED]"
            else:
                cleaned[k] = redact_sensitive_data(v)
        return cleaned
    elif isinstance(val, list):
        return [redact_sensitive_data(item) for item in val]
    elif isinstance(val, str):
        return redact_sensitive_string(val)
    return val


# -------------------------------------------------------------
# Structured JSON Formatter
# -------------------------------------------------------------
class StructuredJSONFormatter(logging.Formatter):
    """
    Standardizes log records into structured JSON objects adhering to Phase 40 specification:
    {
        "timestamp": "...",
        "level": "INFO",
        "service": "backend",
        "request_id": "...",
        "user_id": "...",
        "endpoint": "/projects",
        "status": 200
    }
    """

    def __init__(self, service_name: str = "backend"):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        # Resolve contextual values with fallback to record attributes
        req_id = getattr(record, "request_id", None) or request_id_ctx.get() or None
        usr_id = getattr(record, "user_id", None) or user_id_ctx.get() or None
        ep = getattr(record, "endpoint", None) or endpoint_ctx.get() or None
        if ep:
            ep = redact_sensitive_string(str(ep))

        status_code = getattr(record, "status", None)

        # Build standard Phase 40 JSON payload
        log_payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.service_name,
            "request_id": req_id,
            "user_id": usr_id,
            "endpoint": ep,
            "status": status_code,
            "message": redact_sensitive_string(record.getMessage()),
        }

        # Include additional telemetry if available
        for attr in ("method", "duration_ms", "client_ip"):
            if hasattr(record, attr):
                log_payload[attr] = getattr(record, attr)

        # Include error/exception details if present
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)
        elif record.exc_text:
            log_payload["exception"] = record.exc_text

        # Sanitize any extra attributes attached to record
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_payload["data"] = redact_sensitive_data(record.extra_data)

        # Ensure all fields are sanitized
        safe_payload = redact_sensitive_data(log_payload)
        return json.dumps(safe_payload, default=str)


# -------------------------------------------------------------
# Logging Configuration Setup
# -------------------------------------------------------------
def setup_logging(level: int = logging.INFO) -> logging.Logger:
    """Configures structured JSON logging on the homeverse logger and root handler."""
    logger = logging.getLogger("homeverse")
    logger.setLevel(level)
    logger.propagate = False

    # Clear existing handlers to prevent duplicates during reloads
    logger.handlers.clear()

    formatter = StructuredJSONFormatter(service_name="backend")
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


# Global singleton logger
logger = setup_logging()


def get_logger(name: str = "homeverse") -> logging.Logger:
    """Returns a child logger scoped under the homeverse structured logging namespace."""
    if name == "homeverse" or name.startswith("homeverse."):
        return logging.getLogger(name)
    return logging.getLogger(f"homeverse.{name}")


# -------------------------------------------------------------
# Structured Logging Middleware for FastAPI
# -------------------------------------------------------------
class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    HTTP Middleware that assigns a Request ID, binds contextual variables,
    tracks response status and latency, and writes a structured JSON log entry.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract or generate Request ID and Correlation ID
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        correlation_id = request.headers.get("X-Correlation-ID") or req_id

        # Extract user_id from authorization or query if present
        user_id = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # We never log the token, but we could parse subject if desired
            pass

        # Set ContextVars for this async context
        token_req = request_id_ctx.set(req_id)
        token_user = user_id_ctx.set(user_id)
        token_ep = endpoint_ctx.set(request.url.path)

        start_time = time.perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

            # Skip verbose logging for noisy static polling endpoints like /metrics
            if request.url.path not in ("/metrics",):
                level = logging.INFO if status_code < 400 else (logging.WARNING if status_code < 500 else logging.ERROR)
                logger.log(
                    level,
                    f"HTTP {request.method} {request.url.path} finished with status {status_code} in {duration_ms}ms",
                    extra={
                        "endpoint": request.url.path,
                        "method": request.method,
                        "status": status_code,
                        "duration_ms": duration_ms,
                        "request_id": req_id,
                        "user_id": user_id,
                        "client_ip": request.client.host if request.client else "unknown",
                    },
                )

            # Propagate Request ID and Correlation ID in response headers
            response.headers["X-Request-ID"] = req_id
            response.headers["X-Correlation-ID"] = correlation_id
            return response

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
            logger.error(
                f"HTTP {request.method} {request.url.path} failed with unhandled exception: {str(exc)}",
                exc_info=True,
                extra={
                    "endpoint": request.url.path,
                    "method": request.method,
                    "status": 500,
                    "duration_ms": duration_ms,
                    "request_id": req_id,
                    "user_id": user_id,
                    "client_ip": request.client.host if request.client else "unknown",
                },
            )
            raise exc

        finally:
            # Reset ContextVars to avoid leaking between requests on worker thread pool
            request_id_ctx.reset(token_req)
            user_id_ctx.reset(token_user)
            endpoint_ctx.reset(token_ep)
