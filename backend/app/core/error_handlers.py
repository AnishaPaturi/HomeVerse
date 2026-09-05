"""
Global Exception Handlers for FastAPI (Phase 41)
Ensures every error emitted by HomeVerse adheres to the standardized JSON schema:
{
    "error": {
        "code": "BUDGET_EXCEEDED",
        "message": "Design exceeds the configured budget.",
        "request_id": "...",
        "details": null
    },
    "detail": "Design exceeds the configured budget."
}
"""
import logging
from typing import Any, Dict, List
import uuid
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import HomeVerseException
from app.core.logging import request_id_ctx

logger = logging.getLogger("homeverse.errors")

HTTP_STATUS_TO_CODE = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    408: "REQUEST_TIMEOUT",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_SERVER_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
}


def _resolve_request_id(request: Request) -> str:
    """Extracts Request ID from ContextVar, headers, or generates a fallback."""
    ctx_id = request_id_ctx.get()
    if ctx_id:
        return ctx_id
    header_id = request.headers.get("X-Request-ID")
    if header_id:
        return header_id
    return str(uuid.uuid4())


async def homeverse_exception_handler(request: Request, exc: HomeVerseException) -> JSONResponse:
    """Handles domain-specific HomeVerse exceptions."""
    req_id = _resolve_request_id(request)
    headers = {"X-Request-ID": req_id}
    if getattr(exc, "headers", None):
        headers.update(exc.headers)

    payload = {
        "error": {
            "code": exc.code,
            "message": exc.message,
            "request_id": req_id,
            "details": exc.details,
        },
        "detail": exc.message,
    }

    logger.warning(
        f"Domain exception [{exc.code}] on {request.method} {request.url.path}: {exc.message}",
        extra={
            "endpoint": request.url.path,
            "method": request.method,
            "status": exc.status_code,
            "request_id": req_id,
            "error_code": exc.code,
        },
    )

    return JSONResponse(status_code=exc.status_code, content=payload, headers=headers)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handles Starlette / FastAPI HTTPExceptions."""
    req_id = _resolve_request_id(request)
    headers = {"X-Request-ID": req_id}

    # If detail is already formatted with an "error" key, return as-is
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        payload = exc.detail
        if "request_id" not in payload.get("error", {}):
            payload["error"]["request_id"] = req_id
        if "detail" not in payload:
            payload["detail"] = payload["error"].get("message", "")
        return JSONResponse(status_code=exc.status_code, content=payload, headers=headers)

    code = HTTP_STATUS_TO_CODE.get(exc.status_code, f"HTTP_{exc.status_code}")
    message = str(exc.detail) if exc.detail else "An error occurred during request processing."

    payload = {
        "error": {
            "code": code,
            "message": message,
            "request_id": req_id,
            "details": None,
        },
        "detail": message,
    }

    return JSONResponse(status_code=exc.status_code, content=payload, headers=headers)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Formats Pydantic request validation errors into human-friendly messages."""
    req_id = _resolve_request_id(request)
    headers = {"X-Request-ID": req_id}

    formatted_errors: List[Dict[str, Any]] = []
    summary_parts: List[str] = []

    for err in exc.errors():
        loc = err.get("loc", [])
        field_name = " -> ".join(str(part) for part in loc if part not in ("body", "query", "path"))
        msg = err.get("msg", "Invalid value")
        err_type = err.get("type", "value_error")

        display_field = field_name or "request_body"
        formatted_errors.append({
            "field": display_field,
            "message": msg,
            "type": err_type,
        })
        summary_parts.append(f"{display_field}: {msg}")

    summary_message = "Validation failed: " + "; ".join(summary_parts) if summary_parts else "Invalid request data."

    payload = {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": summary_message,
            "request_id": req_id,
            "details": formatted_errors,
        },
        "detail": summary_message,
    }

    return JSONResponse(
        status_code=422,
        content=payload,
        headers=headers,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled internal server exceptions."""
    req_id = _resolve_request_id(request)
    headers = {"X-Request-ID": req_id}

    logger.error(
        f"Unhandled server exception on {request.method} {request.url.path}: {str(exc)}",
        exc_info=True,
        extra={
            "endpoint": request.url.path,
            "method": request.method,
            "status": 500,
            "request_id": req_id,
        },
    )

    user_message = f"An unexpected internal error occurred. Reference Request ID {req_id} if contacting support."
    payload = {
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": user_message,
            "request_id": req_id,
            "details": None,
        },
        "detail": user_message,
    }

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=payload,
        headers=headers,
    )


def register_error_handlers(app: FastAPI) -> None:
    """Registers all standardized exception handlers on the FastAPI application."""
    app.add_exception_handler(HomeVerseException, homeverse_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
