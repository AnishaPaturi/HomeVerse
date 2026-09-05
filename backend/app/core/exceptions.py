"""
Standardized Application Exceptions for HomeVerse (Phase 41)
Provides structured, typed exceptions with machine-readable error codes
and human-friendly messages.
"""
from typing import Any, Optional


class HomeVerseException(Exception):
    """
    Base application exception conforming to Phase 41 standardized error schema:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human-friendly explanation",
            "request_id": "...",
            "details": null
        }
    }
    """

    def __init__(
        self,
        message: str,
        code: str = "APPLICATION_ERROR",
        status_code: int = 400,
        details: Optional[Any] = None,
        headers: Optional[dict] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        self.headers = headers or {}


# Specialized Domain Exceptions

class BudgetExceededException(HomeVerseException):
    """Raised when proposed furniture, material, or design selections exceed the project budget cap."""

    def __init__(
        self,
        message: str = "Design exceeds the configured budget.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            code="BUDGET_EXCEEDED",
            status_code=400,
            details=details,
        )


class ResourceNotFoundException(HomeVerseException):
    """Raised when a requested resource (project, design, room, user) is not found."""

    def __init__(
        self,
        message: str = "The requested resource was not found.",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
    ):
        details = {}
        if resource_type:
            details["resource_type"] = resource_type
        if resource_id:
            details["resource_id"] = str(resource_id)

        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=404,
            details=details or None,
        )


class UnauthorizedException(HomeVerseException):
    """Raised when authentication is missing or token is invalid/expired."""

    def __init__(
        self,
        message: str = "Authentication credentials were not provided or are invalid.",
    ):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=401,
        )


class ForbiddenException(HomeVerseException):
    """Raised when user lacks permission to access or modify a resource."""

    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
    ):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
        )


class ValidationErrorException(HomeVerseException):
    """Raised when custom business validation fails on input data."""

    def __init__(
        self,
        message: str = "Invalid input data supplied.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class AIGenerationException(HomeVerseException):
    """Raised when Gemini or multimodal generation encounters a processing failure."""

    def __init__(
        self,
        message: str = "AI design generation encountered an unexpected error. Please try again.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            code="AI_GENERATION_FAILED",
            status_code=500,
            details=details,
        )


class ConflictException(HomeVerseException):
    """Raised on state conflicts such as duplicate email or concurrent modifications."""

    def __init__(
        self,
        message: str = "A conflict occurred with an existing resource.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            details=details,
        )


class RateLimitExceededException(HomeVerseException):
    """Raised when a client exceeds rate limits on an endpoint."""

    def __init__(
        self,
        message: str = "Too many requests. Please slow down and try again later.",
        retry_after_seconds: Optional[int] = None,
        headers: Optional[dict] = None,
    ):
        details = {"retry_after_seconds": retry_after_seconds} if retry_after_seconds else None
        all_headers = dict(headers or {})
        if retry_after_seconds is not None:
            all_headers["Retry-After"] = str(retry_after_seconds)

        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details,
            headers=all_headers,
        )


class AICostLimitExceededException(HomeVerseException):
    """Raised when a user exceeds their tier-allocated AI cost/spending budget (Phase 44)."""

    def __init__(
        self,
        message: str = "Monthly AI generation spending limit exceeded. Please upgrade your subscription tier to continue.",
        current_spend: Optional[float] = None,
        limit: Optional[float] = None,
        details: Optional[Any] = None,
    ):
        info = dict(details or {})
        if current_spend is not None:
            info["current_spend_usd"] = round(current_spend, 4)
        if limit is not None:
            info["monthly_limit_usd"] = round(limit, 2)

        super().__init__(
            message=message,
            code="AI_COST_LIMIT_EXCEEDED",
            status_code=402,
            details=info or None,
        )
