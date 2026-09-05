# HomeVerse Rate Limiting Architecture (Phase 42)

This document details the sliding window rate limiting architecture, endpoint protection policies, tier-aware AI generation quotas, standard RFC response headers, and in-memory fallback strategies implemented across HomeVerse.

---

## 1. Overview & Objectives

Unrestricted API access leaves backend services vulnerable to credential stuffing, denial-of-service (DoS) bursts, and resource depletion from heavy AI inference models (e.g. Gemini Multimodal and 3D reconstruction pipelines).

HomeVerse implements a multi-tier sliding window rate limiter fulfilling **Phase 42** requirements:
- **Sliding Window Protection**: Prevents token-burst vulnerabilities at window boundaries (unlike fixed window counters).
- **Targeted Protections**: Restricts auth endpoints (login, registration), file uploads, and general API endpoints.
- **Tier-Aware AI Quotas**: Enforces daily limits based on subscription plans (Free: 5 designs/day, Premium/Pro: 50 designs/day).
- **RFC Standard Compliance**: Injects `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` into all evaluated requests, with `Retry-After` on HTTP 429.
- **Phase 41 Error Compatibility**: Rejections return standardized error envelopes (`code="RATE_LIMIT_EXCEEDED"`, HTTP 429).
- **Dual-Storage Resilience**: Uses Redis sorted sets for distributed multi-instance clusters, with a thread-safe in-memory fallback for offline or local development.

---

## 2. Rate Limiting Policies

| Endpoint / Scope | Window | Limit | Target Protection |
|---|---|---|---|
| `POST /api/auth/login` | 1 minute | **5 requests** | Credential stuffing & brute-force protection |
| `POST /api/auth/register` | 1 minute | **3 requests** | Bot account creation & spam defense |
| `POST /api/ai/analyze-upload` | 1 minute | **10 uploads** | Storage & compute exhaustion prevention |
| `POST /api/ai/generate-dynamic-design` (Free) | 24 hours | **5 designs** | Free tier compute allocation |
| `POST /api/ai/generate-dynamic-design` (Premium / Pro) | 24 hours | **50 designs** | Paid tier resource quota |
| `General Endpoints` | 1 minute | **100 requests** | Baseline API scraping & flood protection |

---

## 3. Sliding Window Algorithm

### Redis Implementation
The Redis backend stores sliding window timestamps in sorted sets (`ZSET`):
```text
Key: rl:<scope>:<identifier>
Score: Timestamp (seconds since epoch)
Member: <Timestamp>-<UUID nonce>
```

For every request:
1. `ZREMRANGEBYSCORE key -inf (now - window_seconds)`: Purges expired events outside the sliding window.
2. `ZCARD key`: Counts remaining events inside the window.
3. If `count >= limit`, computes `retry_after = oldest_event + window_seconds - now` and rejects with HTTP 429.
4. If `count < limit`, executes `ZADD key now <member>` and sets expiration `EXPIRE key (window_seconds + 1)`.

### In-Memory Sliding Window Fallback
When Redis is unavailable (or during unit tests/offline development), `_InMemorySlidingWindow` maintains thread-safe (`threading.Lock`) lists of timestamps per key.
- Automatically purges timestamps older than `now - window_seconds`.
- Accurately tracks remaining quota and computes exact `retry_after` seconds.
- Fails open/gracefully without interrupting core user workflows.

---

## 4. RFC Headers & Error Responses

### Successful Requests (HTTP 200 / 201)
Every rate-limited endpoint provides client visibility via standard RFC headers:
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1725514800
```

### Rate-Limited Requests (HTTP 429)
When a threshold is exceeded, the server responds with HTTP 429 Too Many Requests, accompanied by `Retry-After` and the standardized Phase 41 error body:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 48
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1725514848
Content-Type: application/json

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Daily AI generation limit reached (5 designs/day for Free tier). Upgrade to Premium for 50 designs/day.",
    "request_id": "069d5018-a893-43e0-8f83-46d1b1c00a81",
    "details": {
      "retry_after_seconds": 48
    }
  },
  "detail": "Daily AI generation limit reached (5 designs/day for Free tier). Upgrade to Premium for 50 designs/day."
}
```

---

## 5. Tier-Aware Quota Inspection

HomeVerse exposes a dedicated quota inspection endpoint allowing the UI to display real-time daily generation usage without triggering counter increments:

### Endpoint
`GET /api/ai/quota`

### Query Parameters / Headers
- `email`: (Optional query param or `X-User-Email` header)
- `user_id`: (Optional query param or `X-User-Id` header)

### Sample Response
```json
{
  "tier": "Free",
  "is_premium": false,
  "limit_per_day": 5,
  "used_today": 2,
  "remaining_today": 3,
  "resets_in_seconds": 86400
}
```

### Frontend Integration (`frontend/src/lib/api.ts`)
```typescript
import { fetchAiQuota } from "@/lib/api";

const quota = await fetchAiQuota("designer@homeverse.ai");
console.log(`Designs remaining today: ${quota.remaining_today}/${quota.limit_per_day}`);
```

---

## 6. Configuration & Environment Variables

The rate limiting system is configured in `backend/app/config.py` via Pydantic BaseSettings:

| Environment Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_ENABLED` | `True` | Master toggle to enable/disable rate limiting |
| `RATE_LIMIT_LOGIN_PER_MINUTE` | `5` | Allowed login attempts per minute per IP |
| `RATE_LIMIT_REGISTER_PER_MINUTE` | `3` | Allowed registrations per minute per IP |
| `RATE_LIMIT_AI_FREE_PER_DAY` | `5` | Allowed AI generations per 24 hours for Free tier |
| `RATE_LIMIT_AI_PREMIUM_PER_DAY` | `50` | Allowed AI generations per 24 hours for Premium tier |
| `RATE_LIMIT_UPLOAD_PER_MINUTE` | `10` | Allowed photo/blueprint uploads per minute |
| `RATE_LIMIT_DEFAULT_PER_MINUTE` | `100` | Baseline rate limit for general API endpoints |
| `REDIS_URL` | `redis://localhost:6379/0` | Primary Redis connection string |

---

## 7. Verification & Testing

The test suite in `backend/tests/core/test_rate_limiter.py` provides 100% coverage across rate limiting subsystems:
```powershell
# Run Rate Limiting tests
.\.venv\Scripts\pytest tests/core/test_rate_limiter.py -v

# Run entire backend test suite
.\.venv\Scripts\pytest tests/ -v
```

Verified Test Scenarios:
1. `test_in_memory_sliding_window_basic`: Checks window pruning and counter exhaustion.
2. `test_in_memory_sliding_window_expiration`: Verifies capacity restoration after window expiration.
3. `test_rate_limiter_rfc_headers_on_success`: Asserts presence and accuracy of `X-RateLimit-*` headers.
4. `test_rate_limiter_429_envelope_and_retry_after`: Asserts HTTP 429 schema and `Retry-After`.
5. `test_tier_aware_rate_limiting_free_tier`: Verifies Free tier caps at 5 requests/day.
6. `test_tier_aware_rate_limiting_premium_tier`: Verifies Premium tier allows up to 50 requests/day.
7. `test_login_rate_limiting`: Verifies 5 req/min protection on `/api/auth/login`.
8. `test_register_rate_limiting`: Verifies 3 req/min protection on `/api/auth/register`.
9. `test_ai_quota_endpoint_anonymous`: Verifies anonymous quota inspection.
10. `test_ai_quota_endpoint_authenticated_premium`: Verifies premium user quota inspection.
11. `test_rate_limiter_handles_redis_failure_silently`: Verifies seamless in-memory fallback when Redis is unreachable.
