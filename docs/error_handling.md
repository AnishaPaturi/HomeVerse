# HomeVerse Standardized Error Handling Architecture (Phase 41)

This document specifies the centralized API error handling architecture, standardized error response schemas, error code taxonomy, and frontend user notification strategies implemented across HomeVerse.

---

## 1. Overview & Objectives

In distributed architectures, unstandardized errors (e.g. raw stack traces, inconsistent strings, differing response envelopes) degrade the user experience and complicate automated logging and debugging.

HomeVerse enforces a single, standardized error response schema across all endpoints, aligning with **Phase 41** requirements:
- **Predictable Error Envelope**: Consistent JSON schema containing `code`, `message`, and `request_id`.
- **Request Tracing**: Every error payload includes the unique `request_id` to correlate backend logs with user reports.
- **Human-Friendly Explanations**: Technical failure details are mapped to clear, actionable guidance on the frontend.
- **Backward Compatibility**: Maintains the standard `detail` field alongside `error` for universal client compatibility.

---

## 2. Standardized Error Response Schema

All error responses (4xx and 5xx) conform to the following JSON structure:

```json
{
  "error": {
    "code": "BUDGET_EXCEEDED",
    "message": "Design exceeds the configured budget.",
    "request_id": "8f3b23c9-026f-4a06-b337-df951016892a",
    "details": null
  },
  "detail": "Design exceeds the configured budget."
}
```

### Schema Field Reference
| Field | Type | Description |
|---|---|---|
| `error.code` | String | Machine-readable error code (e.g., `BUDGET_EXCEEDED`, `NOT_FOUND`, `VALIDATION_ERROR`) |
| `error.message` | String | Clear, human-readable summary of the problem |
| `error.request_id` | String | UUID matching the `X-Request-ID` response header for log correlation |
| `error.details` | Any / Null | Optional field-level validation errors or contextual parameters |
| `detail` | String | Standard FastAPI-compatible message string ensuring legacy client compatibility |

---

## 3. Error Code Catalog

| Error Code | HTTP Status | Meaning | User-Friendly Guidance |
|---|---|---|---|
| `BUDGET_EXCEEDED` | 400 | Selected design elements exceed the project budget cap | "Design exceeds the configured budget. Use 'What If?' mode or product alternatives to balance your cost." |
| `NOT_FOUND` | 404 | The requested project, room, design, or user does not exist | "The requested project, room, or design could not be found." |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token | "Your session has expired. Please sign in again to continue." |
| `FORBIDDEN` | 403 | User does not have access permissions for the resource | "You do not have permission to access or modify this project." |
| `VALIDATION_ERROR` | 422 | Input data failed schema or business validation rules | "Please check the highlighted fields and try again." |
| `AI_GENERATION_FAILED`| 500 | Gemini or multimodal generation encountered an error | "AI design generation encountered an issue. Please retry or adjust your custom prompt." |
| `CONFLICT` | 409 | Duplicate resource (e.g. email already registered) | "A resource with this identifier already exists." |
| `RATE_LIMIT_EXCEEDED` | 429 | Client exceeded allowed request threshold | "Too many requests. Please wait a few moments before trying again." |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server exception | "An unexpected error occurred. Please reference the Request ID when contacting support." |

---

## 4. Backend Implementation

### Custom Domain Exceptions ([`app/core/exceptions.py`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/core/exceptions.py))
Domain logic raises typed exceptions directly:
```python
from app.core.exceptions import BudgetExceededException, ResourceNotFoundException

# When design total exceeds project cap:
if total_cost > max_budget:
    raise BudgetExceededException("Design exceeds the configured budget.")

# When project is not found:
if not project:
    raise ResourceNotFoundException(resource_type="Project", resource_id=str(project_id))
```

### Global Handlers ([`app/core/error_handlers.py`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/core/error_handlers.py))
Registered via [`register_error_handlers(app)`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/core/error_handlers.py#L188-L194) in [`main.py`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/main.py#L38-L39):
1. **`HomeVerseException`**: Catches domain exceptions and extracts codes, messages, and details.
2. **`StarletteHTTPException`**: Catches standard HTTP exceptions and maps status codes to standard codes.
3. **`RequestValidationError`**: Parses Pydantic validation errors into field-level diagnostics.
4. **`Exception`**: Catch-all for 500s that logs full stack trace to CloudWatch/stdout while returning a safe message and `request_id` to the user.

---

## 5. Frontend Human-Friendly Messages

Frontend API clients use [`frontend/src/lib/api.ts`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/lib/api.ts) which provides the [`getHumanErrorMessage`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/lib/api.ts#L36-L69) translator:

```typescript
import { fetchApi, getHumanErrorMessage, ApiError } from "@/lib/api";

try {
  await fetchApi("/api/designs/generate-dynamic-design", { method: "POST", body });
} catch (err) {
  // Returns actionable user text matching the error code
  const userMessage = getHumanErrorMessage(err);
  showToast({ type: "error", message: userMessage });
}
```

---

## 6. Testing & Automated Verification

Automated test suite in [`backend/tests/core/test_error_handling.py`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/tests/core/test_error_handling.py):
```bash
pytest backend/tests/core/test_error_handling.py -v
```

Verifies:
- `BUDGET_EXCEEDED` returns HTTP 400 and exact Phase 41 schema.
- `NOT_FOUND` returns HTTP 404 with resource metadata.
- Pydantic validation errors return HTTP 422 with `error.details` containing field-by-field messages.
- `X-Request-ID` is present in both headers and JSON payload.
