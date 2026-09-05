# HomeVerse Structured Logging & Security Policy (Phase 40)

This document describes the structured JSON logging architecture, contextual tracing, and sensitive data protection enforcement for the HomeVerse backend.

---

## 1. Overview & Objectives

In modern distributed microservices and serverless architectures (AWS ECS, Kubernetes), traditional plaintext logs create significant challenges for automated parsing, filtering, and aggregation. 

HomeVerse utilizes **Structured JSON Logging** across all environments (Development, Staging, Production). Every log record is emitted as a strictly-typed JSON document directly to `stdout`, enabling automatic ingestion by:
- **AWS CloudWatch Logs Insights**
- **Datadog / ELK / Grafana Loki**
- **Local Docker Compose logs**

---

## 2. Standard Log Schema

Every log statement produced by the HomeVerse platform conforms to the schema required by **Phase 40**:

```json
{
  "timestamp": "2026-09-05T05:30:00.123456Z",
  "level": "INFO",
  "service": "backend",
  "request_id": "8f3b23c9-026f-4a06-b337-df951016892a",
  "user_id": "c1f72df8-6c84-486a-bd1e-bc9a96e95c1a",
  "endpoint": "/api/projects",
  "status": 200,
  "message": "HTTP GET /api/projects finished with status 200 in 14.20ms",
  "method": "GET",
  "duration_ms": 14.2,
  "client_ip": "172.18.0.1"
}
```

### Field Reference
| Field | Type | Description |
|---|---|---|
| `timestamp` | String (ISO 8601 UTC) | Exact time the log record was generated in UTC with microsecond precision |
| `level` | String | Log severity level (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`) |
| `service` | String | Microservice name (`backend`) |
| `request_id` | String / Null | Unique correlation identifier propagated from `X-Request-ID` |
| `user_id` | String / Null | Authenticated user ID (if request is authenticated) |
| `endpoint` | String / Null | Request URI path (with sensitive query parameters scrubbed) |
| `status` | Integer / Null | HTTP response status code (e.g. `200`, `400`, `500`) |
| `message` | String | Human-readable log message (sanitized of sensitive secrets) |
| `method` | String / Null | HTTP method (`GET`, `POST`, `PUT`, `DELETE`, etc.) |
| `duration_ms`| Float / Null | Request processing latency in milliseconds |
| `exception` | String / Null | Formatted traceback (only present when an error occurs) |

---

## 3. "Never Log" Security & PII Redaction Policy

Per the security guidelines in [`IMPLEMENTATION_PLAN.md`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/IMPLEMENTATION_PLAN.md#L1998-L2004), the following categories of data are **NEVER** written to logs under any circumstance:

### Strictly Redacted Categories
1. **Passwords**:
   - `password`, `current_password`, `new_password`, `confirm_password`, `passwd`, `pwd`
2. **JWT & Session Tokens**:
   - `token`, `access_token`, `refresh_token`, `id_token`, `jwt`, `authorization`, `Bearer ...`
3. **API Keys & Secrets**:
   - `api_key`, `apikey`, `gemini_api_key`, `openai_api_key`, `claude_api_key`, `aws_secret_access_key`, `jwt_secret`
4. **Payment Information**:
   - `card_number`, `credit_card`, `pan`, `cvv`, `cvc`, `account_number`, `stripe_token`

### Automated Redaction Mechanism
The [`redact_sensitive_data`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/core/logging.py#L120-L135) and [`redact_sensitive_string`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/core/logging.py#L96-L117) helpers recursively scrub all dictionaries, query parameters, authorization headers, and raw string payloads before serialization. Any sensitive value is replaced with `[REDACTED]`, `[REDACTED_JWT]`, or `[REDACTED_CARD]`.

---

## 4. Request Correlation & Context Propagation

HomeVerse uses Python's [`contextvars`](https://docs.python.org/3/library/contextvars.html) module to maintain contextual request isolation across async coroutines and background tasks:
- `request_id_ctx`: Carries the active request ID.
- `user_id_ctx`: Carries the active user ID.
- `endpoint_ctx`: Carries the active endpoint URI.

### Header Flow
1. Incoming request arrives at [`StructuredLoggingMiddleware`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/core/logging.py#L198-L267).
2. The middleware reads `X-Request-ID` (or generates a new UUID v4).
3. The context variable `request_id_ctx` is bound for the duration of the request.
4. Any log call made deep within models, services, or DB queries automatically inherits the current `request_id` without requiring manual argument passing.
5. `X-Request-ID` and `X-Correlation-ID` are injected into response headers.

---

## 5. CloudWatch Logs Insights Examples

When ingested by AWS CloudWatch Logs, JSON logs can be analyzed with high efficiency:

### Find slow endpoints (> 500ms):
```sql
fields @timestamp, endpoint, duration_ms, status
| filter duration_ms > 500
| sort duration_ms desc
| limit 20
```

### Track error rate by endpoint:
```sql
fields @timestamp, endpoint, status, message
| filter status >= 400
| stats count(*) as error_count by endpoint, status
| sort error_count desc
```

### Trace all logs for a single user request:
```sql
fields @timestamp, level, message, duration_ms
| filter request_id = '8f3b23c9-026f-4a06-b337-df951016892a'
| sort @timestamp asc
```
