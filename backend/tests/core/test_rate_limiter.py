"""
Tests for Sliding Window Rate Limiting (Phase 42)
Validates:
- Sliding window counter mechanics and expiration
- RFC standard header injection (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- Standard HTTP 429 error envelopes with Retry-After header
- Tier-aware quotas (Free 5/day vs Premium 50/day)
- Login and Register endpoint rate limiting
- AI Quota inspection endpoint (/api/v1/ai/quota)
- In-memory fallback resilience
"""
import time
import uuid
import pytest
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.core.rate_limiter import (
    RateLimiter,
    _in_memory_store,
    _InMemorySlidingWindow,
    get_user_ai_quota,
    rate_limit_login,
    rate_limit_register,
    rate_limit_ai_generation,
)
from app.db.session import get_db
from app.models.user import User as UserModel

# Setup isolated test router for RateLimiter mechanics
rate_test_router = APIRouter(prefix="/test/rate-limit", tags=["Testing"])

limiter_strict = RateLimiter(times=3, seconds=2, scope="test:strict")
limiter_tier = RateLimiter(times=5, seconds=60, scope="test:tier", tier_aware=True)


@rate_test_router.get("/limited", dependencies=[Depends(limiter_strict)])
def limited_endpoint():
    return {"message": "success"}


@rate_test_router.get("/tier-limited", dependencies=[Depends(limiter_tier)])
def tier_limited_endpoint():
    return {"message": "tier success"}


app.include_router(rate_test_router)
client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def clean_rate_limit_store():
    """Clear in-memory sliding window counters before every test."""
    _in_memory_store.clear()
    limiter_strict._redis_failed = True
    limiter_strict._redis_client = None
    limiter_tier._redis_failed = True
    limiter_tier._redis_client = None
    yield
    _in_memory_store.clear()


# ============================================================================
# 1. In-Memory Sliding Window Core Unit Tests
# ============================================================================

def test_in_memory_sliding_window_basic():
    store = _InMemorySlidingWindow()
    key = "user:test-1"

    # Request 1
    is_limited, rem, retry, reset = store.check(key, limit=2, window_seconds=10)
    assert not is_limited
    assert rem == 1
    assert retry == 0
    assert reset > time.time()

    # Request 2
    is_limited, rem, retry, reset = store.check(key, limit=2, window_seconds=10)
    assert not is_limited
    assert rem == 0

    # Request 3 -> Limit Exceeded
    is_limited, rem, retry, reset = store.check(key, limit=2, window_seconds=10)
    assert is_limited
    assert rem == 0
    assert retry > 0
    assert reset > time.time()


def test_in_memory_sliding_window_expiration():
    store = _InMemorySlidingWindow()
    key = "user:expiring"

    # Fill capacity (1 request per 1-second window)
    is_limited, _, _, _ = store.check(key, limit=1, window_seconds=1)
    assert not is_limited

    # Immediate next request is blocked
    is_limited, _, retry, _ = store.check(key, limit=1, window_seconds=1)
    assert is_limited
    assert retry <= 1

    # Wait for window to slide past
    time.sleep(1.05)

    # Next request succeeds
    is_limited, rem, _, _ = store.check(key, limit=1, window_seconds=1)
    assert not is_limited
    assert rem == 0


# ============================================================================
# 2. RFC Standard Rate Limit Headers & HTTP 429 Envelope
# ============================================================================

def test_rate_limiter_rfc_headers_on_success():
    client_ip = f"10.0.0.{uuid.uuid4().int % 250 + 1}"
    resp = client.get("/test/rate-limit/limited", headers={"X-Forwarded-For": client_ip})
    assert resp.status_code == 200
    assert resp.json() == {"message": "success"}

    # RFC Headers
    assert resp.headers.get("X-RateLimit-Limit") == "3"
    assert resp.headers.get("X-RateLimit-Remaining") == "2"
    assert "X-RateLimit-Reset" in resp.headers


def test_rate_limiter_429_envelope_and_retry_after():
    client_ip = f"10.0.1.{uuid.uuid4().int % 250 + 1}"
    headers = {"X-Forwarded-For": client_ip}

    # Consume 3 allowed tokens
    for _ in range(3):
        r = client.get("/test/rate-limit/limited", headers=headers)
        assert r.status_code == 200

    # 4th request triggers rate limit
    resp = client.get("/test/rate-limit/limited", headers=headers)
    assert resp.status_code == 429

    # Standard Phase 41 error schema
    payload = resp.json()
    assert "error" in payload
    assert payload["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert "Rate limit exceeded" in payload["error"]["message"]
    assert "retry_after_seconds" in payload["error"]["details"]
    assert payload["error"]["details"]["retry_after_seconds"] >= 1

    # Standard headers
    assert resp.headers.get("X-RateLimit-Remaining") == "0"
    assert resp.headers.get("Retry-After") is not None


# ============================================================================
# 3. Tier-Aware AI Generation Rate Limiting (Free vs Premium)
# ============================================================================

def test_tier_aware_rate_limiting_free_tier():
    # User with Free tier
    email = f"free_{uuid.uuid4().hex[:6]}@example.com"
    # Seed user in DB
    db = next(get_db())
    try:
        user = UserModel(name="Free User", email=email, plan="Free")
        db.add(user)
        db.commit()
        db.refresh(user)

        headers = {"X-User-Email": email}

        # Free tier limit is settings.RATE_LIMIT_AI_FREE_PER_DAY (5)
        for i in range(settings.RATE_LIMIT_AI_FREE_PER_DAY):
            r = client.get("/test/rate-limit/tier-limited", headers=headers)
            assert r.status_code == 200, f"Request {i+1} should have succeeded"

        # (Limit + 1)-th request must be blocked
        blocked_resp = client.get("/test/rate-limit/tier-limited", headers=headers)
        assert blocked_resp.status_code == 429
        error_body = blocked_resp.json()["error"]
        assert error_body["code"] == "RATE_LIMIT_EXCEEDED"
        assert "Daily AI generation limit reached" in error_body["message"]
        assert "Upgrade to Premium" in error_body["message"]
    finally:
        db.close()


def test_tier_aware_rate_limiting_premium_tier():
    # User with Premium / Pro Designer tier
    email = f"premium_{uuid.uuid4().hex[:6]}@example.com"
    db = next(get_db())
    try:
        user = UserModel(name="Pro User", email=email, plan="Pro Designer")
        db.add(user)
        db.commit()
        db.refresh(user)

        headers = {"X-User-Email": email}

        # Premium user can perform more than 5 requests (free tier limit)
        for i in range(7):
            r = client.get("/test/rate-limit/tier-limited", headers=headers)
            assert r.status_code == 200, f"Request {i+1} should have succeeded for Premium user"

        assert int(r.headers["X-RateLimit-Limit"]) == settings.RATE_LIMIT_AI_PREMIUM_PER_DAY
    finally:
        db.close()


# ============================================================================
# 4. Auth Endpoint Rate Limiting (Login & Register)
# ============================================================================

def test_login_rate_limiting():
    client_ip = f"10.0.2.{uuid.uuid4().int % 250 + 1}"
    headers = {"X-Forwarded-For": client_ip}

    limit = settings.RATE_LIMIT_LOGIN_PER_MINUTE

    # Perform allowed login attempts
    for _ in range(limit):
        r = client.post("/api/auth/login?email=designer@homeverse.ai", headers=headers)
        assert r.status_code == 200

    # Next attempt should be blocked
    resp = client.post("/api/auth/login?email=designer@homeverse.ai", headers=headers)
    assert resp.status_code == 429
    assert resp.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert resp.headers.get("Retry-After") is not None


def test_register_rate_limiting():
    client_ip = f"10.0.3.{uuid.uuid4().int % 250 + 1}"
    headers = {"X-Forwarded-For": client_ip}

    limit = settings.RATE_LIMIT_REGISTER_PER_MINUTE

    for i in range(limit):
        unique_email = f"test_reg_{uuid.uuid4().hex[:6]}@example.com"
        r = client.post(
            "/api/auth/register",
            json={"email": unique_email, "name": f"User {i}", "plan": "Free"},
            headers=headers,
        )
        assert r.status_code == 201

    # (Limit + 1)-th attempt blocked
    blocked = client.post(
        "/api/auth/register",
        json={"email": f"blocked_{uuid.uuid4().hex[:6]}@example.com", "name": "Blocked", "plan": "Free"},
        headers=headers,
    )
    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"


# ============================================================================
# 5. AI Quota Inspection Endpoint (/api/ai/quota)
# ============================================================================

def test_ai_quota_endpoint_anonymous():
    resp = client.get("/api/ai/quota")
    assert resp.status_code == 200
    data = resp.json()

    assert data["tier"] == "Free"
    assert data["is_premium"] is False
    assert data["limit_per_day"] == settings.RATE_LIMIT_AI_FREE_PER_DAY
    assert "used_today" in data
    assert "remaining_today" in data
    assert data["resets_in_seconds"] == 86400


def test_ai_quota_endpoint_authenticated_premium():
    email = f"quota_pro_{uuid.uuid4().hex[:6]}@example.com"
    db = next(get_db())
    try:
        user = UserModel(name="Quota Pro", email=email, plan="Premium")
        db.add(user)
        db.commit()
        db.refresh(user)

        resp = client.get(f"/api/ai/quota?email={email}")
        assert resp.status_code == 200
        data = resp.json()

        assert data["tier"] == "Premium"
        assert data["is_premium"] is True
        assert data["limit_per_day"] == settings.RATE_LIMIT_AI_PREMIUM_PER_DAY
        assert data["remaining_today"] <= settings.RATE_LIMIT_AI_PREMIUM_PER_DAY
    finally:
        db.close()


# ============================================================================
# 6. Fallback and Configuration Safety
# ============================================================================

def test_rate_limiter_handles_redis_failure_silently():
    # Force redis error
    broken_limiter = RateLimiter(times=2, seconds=60, scope="test:broken")
    broken_limiter._redis_failed = False

    class MockFailingRedis:
        def pipeline(self):
            raise ConnectionError("Simulated Redis down")

    broken_limiter._redis_client = MockFailingRedis()

    # The check should seamlessly fall back to memory without crashing
    is_limited, rem, _, _ = broken_limiter.check("key-1", 2, 60)
    assert not is_limited
    assert rem == 1
    assert broken_limiter._redis_failed is True
