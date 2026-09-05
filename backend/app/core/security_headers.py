"""
Security Headers and HTTPS Enforcement Middleware (Phase 43)
Implements OWASP recommendations:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY (anti-clickjacking)
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy
- HTTPS redirection / enforcement
- Strips fingerprinting headers (Server, X-Powered-By)
"""
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response

try:
    from app.config import settings
except ImportError:
    from app.core.config import settings

logger = logging.getLogger("homeverse.security_headers")

# Baseline Content Security Policy for API and web assets
DEFAULT_CSP = (
    "default-src 'self'; "
    "img-src 'self' data: https: blob:; "
    "style-src 'self' 'unsafe-inline'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
    "connect-src 'self' http: https: ws: wss:; "
    "frame-ancestors 'none'; "
    "base-uri 'self';"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies HTTP security headers to all responses and handles HTTPS redirection.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # 1. HTTPS Enforcement
        enforce_https = getattr(settings, "ENFORCE_HTTPS", False) or (
            getattr(settings, "ENVIRONMENT", "development") == "production"
            and request.headers.get("X-Forwarded-Proto") == "http"
        )

        if enforce_https and request.url.scheme == "http":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(url), status_code=301)

        # 2. Process request through downstream pipeline
        response = await call_next(request)

        # 3. Inject Security Headers
        if getattr(settings, "ENABLE_SECURITY_HEADERS", True):
            headers = response.headers
            headers["X-Content-Type-Options"] = "nosniff"
            headers["X-Frame-Options"] = "DENY"
            headers["X-XSS-Protection"] = "1; mode=block"
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
            headers["Content-Security-Policy"] = DEFAULT_CSP

            # HSTS is enforced in production or when HTTPS is active
            if request.url.scheme == "https" or getattr(settings, "ENFORCE_HTTPS", False):
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

            # Remove server fingerprinting headers if set
            if "server" in headers:
                del headers["server"]
            if "x-powered-by" in headers:
                del headers["x-powered-by"]

        return response
