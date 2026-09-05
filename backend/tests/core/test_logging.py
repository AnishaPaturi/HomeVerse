"""
Unit and Integration Tests for Structured Logging and Data Redaction (Phase 40)
"""
import io
import json
import logging
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.logging import (
    StructuredJSONFormatter,
    redact_sensitive_data,
    redact_sensitive_string,
    request_id_ctx,
    user_id_ctx,
    endpoint_ctx,
    setup_logging,
    get_logger,
)

client = TestClient(app)


def test_structured_json_format_matches_specification():
    """Verify log record serializes to JSON matching Phase 40 specification schema."""
    formatter = StructuredJSONFormatter(service_name="backend")
    record = logging.LogRecord(
        name="homeverse",
        level=logging.INFO,
        pathname="app/api/projects.py",
        lineno=42,
        msg="Projects fetched successfully",
        args=(),
        exc_info=None,
    )
    record.request_id = "req-test-12345"
    record.user_id = "user-abc-999"
    record.endpoint = "/projects"
    record.status = 200

    output = formatter.format(record)
    parsed = json.loads(output)

    # Validate mandatory Phase 40 fields
    assert "timestamp" in parsed
    assert parsed["level"] == "INFO"
    assert parsed["service"] == "backend"
    assert parsed["request_id"] == "req-test-12345"
    assert parsed["user_id"] == "user-abc-999"
    assert parsed["endpoint"] == "/projects"
    assert parsed["status"] == 200
    assert parsed["message"] == "Projects fetched successfully"


def test_never_log_passwords():
    """Verify password fields in dictionaries, JSON, and strings are strictly redacted."""
    raw_secret = "SuperSecretP@ssword123!"

    # 1. Test dictionary redaction
    payload = {
        "username": "anisha",
        "password": raw_secret,
        "current_password": raw_secret,
        "confirm_password": raw_secret,
        "nested": {"pwd": raw_secret},
    }
    redacted_dict = redact_sensitive_data(payload)
    assert redacted_dict["password"] == "[REDACTED]"
    assert redacted_dict["current_password"] == "[REDACTED]"
    assert redacted_dict["confirm_password"] == "[REDACTED]"
    assert redacted_dict["nested"]["pwd"] == "[REDACTED]"
    assert raw_secret not in str(redacted_dict)

    # 2. Test in-string JSON redaction
    text_log = f'{{"email": "user@homeverse.ai", "password": "{raw_secret}"}}'
    redacted_str = redact_sensitive_string(text_log)
    assert raw_secret not in redacted_str
    assert '"[REDACTED]"' in redacted_str


def test_never_log_jwt_tokens():
    """Verify JWT tokens and Bearer authorization headers are scrubbed."""
    fake_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFuaXNoYSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

    # 1. In Authorization header format
    auth_header = f"Bearer {fake_jwt}"
    redacted_auth = redact_sensitive_string(auth_header)
    assert fake_jwt not in redacted_auth
    assert "Bearer [REDACTED]" in redacted_auth

    # 2. In dictionary tokens
    token_dict = {
        "access_token": fake_jwt,
        "refresh_token": fake_jwt,
        "token": fake_jwt,
    }
    redacted_dict = redact_sensitive_data(token_dict)
    assert redacted_dict["access_token"] == "[REDACTED]"
    assert redacted_dict["refresh_token"] == "[REDACTED]"
    assert fake_jwt not in str(redacted_dict)


def test_never_log_api_keys():
    """Verify API keys and cloud credentials are never written to logs."""
    fake_key = "AIzaSyD-RandomGeminiKey1234567890"

    cred_dict = {
        "api_key": fake_key,
        "gemini_api_key": fake_key,
        "aws_secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "jwt_secret": "homeverse-secret",
    }
    redacted = redact_sensitive_data(cred_dict)
    assert redacted["api_key"] == "[REDACTED]"
    assert redacted["gemini_api_key"] == "[REDACTED]"
    assert redacted["aws_secret_access_key"] == "[REDACTED]"
    assert redacted["jwt_secret"] == "[REDACTED]"
    assert fake_key not in str(redacted)


def test_never_log_payment_information():
    """Verify credit card numbers, CVVs, and payment fields are masked."""
    fake_card = "4532 0150 9876 5432"
    fake_cvv = "999"

    payment_data = {
        "card_number": fake_card,
        "cvv": fake_cvv,
        "credit_card": fake_card,
        "pan": "5412751234123456",
    }
    redacted = redact_sensitive_data(payment_data)
    assert redacted["card_number"] == "[REDACTED]"
    assert redacted["cvv"] == "[REDACTED]"
    assert redacted["credit_card"] == "[REDACTED]"
    assert redacted["pan"] == "[REDACTED]"

    # In raw text
    msg = f"Payment processed for card {fake_card} with auth code."
    redacted_text = redact_sensitive_string(msg)
    assert fake_card not in redacted_text
    assert "[REDACTED_CARD]" in redacted_text


def test_middleware_request_id_generation_and_headers():
    """Verify StructuredLoggingMiddleware generates and returns X-Request-ID."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Correlation-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) > 10


def test_middleware_request_id_propagation():
    """Verify custom X-Request-ID is honored and echoed back by middleware."""
    custom_trace = "trace-custom-uuid-12345"
    response = client.get(
        "/health",
        headers={"X-Request-ID": custom_trace, "X-Correlation-ID": "corr-999"},
    )
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == custom_trace
    assert response.headers["X-Correlation-ID"] == "corr-999"


def test_context_vars_logging_integration():
    """Verify ContextVars automatically inject request_id and endpoint into standard log records."""
    token_req = request_id_ctx.set("trace-ctx-999")
    token_user = user_id_ctx.set("user-ctx-42")
    token_ep = endpoint_ctx.set("/api/projects/sample")

    formatter = StructuredJSONFormatter(service_name="backend")
    record = logging.LogRecord(
        name="homeverse",
        level=logging.INFO,
        pathname="test.py",
        lineno=1,
        msg="Context test",
        args=(),
        exc_info=None,
    )

    output = formatter.format(record)
    parsed = json.loads(output)

    assert parsed["request_id"] == "trace-ctx-999"
    assert parsed["user_id"] == "user-ctx-42"
    assert parsed["endpoint"] == "/api/projects/sample"

    request_id_ctx.reset(token_req)
    user_id_ctx.reset(token_user)
    endpoint_ctx.reset(token_ep)


def test_exception_structured_logging():
    """Verify unhandled exceptions are captured with stack trace in structured JSON."""
    formatter = StructuredJSONFormatter(service_name="backend")
    try:
        raise ValueError("Simulated unexpected test error")
    except ValueError:
        import sys
        exc_info = sys.exc_info()
        record = logging.LogRecord(
            name="homeverse",
            level=logging.ERROR,
            pathname="test.py",
            lineno=99,
            msg="Unhandled exception occurred",
            args=(),
            exc_info=exc_info,
        )
        output = formatter.format(record)
        parsed = json.loads(output)
        assert parsed["level"] == "ERROR"
        assert "exception" in parsed
        assert "Simulated unexpected test error" in parsed["exception"]
