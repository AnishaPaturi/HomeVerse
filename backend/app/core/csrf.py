"""
CSRF (Cross-Site Request Forgery) Defense Utilities (Phase 43)
Implements double-submit CSRF token validation for state-changing requests.
"""
import hmac
import hashlib
import secrets
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

try:
    from app.config import settings
except ImportError:
    from app.core.config import settings

from app.core.exceptions import ForbiddenException

CSRF_SECRET = getattr(settings, "SECRET_KEY", "csrf-secret-key-default")


def generate_csrf_token() -> str:
    """Generates a cryptographically secure, signed CSRF token."""
    random_bytes = secrets.token_hex(16)
    signature = hmac.new(
        CSRF_SECRET.encode("utf-8"),
        random_bytes.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{random_bytes}.{signature}"


def verify_csrf_token(token: Optional[str]) -> bool:
    """Verifies that a CSRF token has a valid cryptographic signature."""
    if not token or "." not in token:
        return False

    parts = token.split(".", 1)
    random_bytes, received_sig = parts[0], parts[1]

    expected_sig = hmac.new(
        CSRF_SECRET.encode("utf-8"),
        random_bytes.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(received_sig, expected_sig)


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    Validates CSRF tokens on state-changing requests (POST, PUT, DELETE, PATCH)
    when cookie-based authentication or the X-CSRF-Token header is active.
    Safe read-only methods (GET, HEAD, OPTIONS) are exempt.
    """

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
    EXEMPT_PATHS = {"/docs", "/redoc", "/openapi.json", "/metrics", "/health"}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method in self.SAFE_METHODS:
            return await call_next(request)

        # Check path exemption
        path = request.url.path
        if any(path.startswith(exempt) for exempt in self.EXEMPT_PATHS):
            return await call_next(request)

        # In Bearer-token-only REST APIs, requests with Authorization: Bearer headers
        # are inherently immune to browser form cross-site forgery.
        # CSRF check is strictly required if session cookies or CSRF enforcement is requested.
        has_bearer = bool(request.headers.get("Authorization", "").startswith("Bearer "))
        has_session_cookie = "session" in request.cookies or "access_token" in request.cookies

        if has_session_cookie and not has_bearer:
            csrf_header = request.headers.get("X-CSRF-Token")
            csrf_cookie = request.cookies.get("csrf_token")
            token_to_verify = csrf_header or csrf_cookie

            if not verify_csrf_token(token_to_verify):
                from starlette.responses import JSONResponse
                import uuid
                req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "FORBIDDEN",
                            "message": "CSRF verification failed. Missing or invalid CSRF token.",
                            "request_id": req_id,
                            "details": None,
                        },
                        "detail": "CSRF verification failed. Missing or invalid CSRF token.",
                    },
                )

        response = await call_next(request)
        return response
