# HomeVerse AI Cost Control & Tracking Architecture (Phase 44)

This document details the cost estimation engine, token and image metering models, tier-based spending limits, database persistence schemas, audit history APIs, and frontend integration hooks implemented across HomeVerse.

---

## 1. Overview & Objectives

AI model inference (such as Gemini 1.5 Flash, Gemini 1.5 Pro, and Multimodal Vision) and image rendering (e.g. Imagen 3, Pollinations FLUX) represent dynamic variable infrastructure costs. Without strict telemetry and budgetary guardrails, automated loops, high concurrency, or excessive usage can lead to runaway cloud billing.

HomeVerse implements a centralized, fine-grained **AI Cost Control Engine** meeting **Phase 44** specifications:
- **Comprehensive Metering**: Tracks `user_id`, `generation_id`, `model`, `input_tokens`, `output_tokens`, `image_count`, and computed USD `cost`.
- **Accurate Model Pricing**: Granular pricing matrices reflecting Google Gemini token rates and diffusion image rendering units.
- **Tier-Based Spending Caps**: Rolling monthly budgets configured per user plan (Free: $1.00/mo, Premium: $15.00/mo, Pro Designer: $60.00/mo).
- **Hard Execution Gates**: Verifies remaining budget before executing costly inference pipelines; blocks overages with standardized HTTP 402 / `AI_COST_LIMIT_EXCEEDED` envelopes.
- **Persistent Database Audit Log**: Records all inference activity in the `ai_usage` table with Alembic migrations and GUID primary keys.
- **Transparency & Dashboard APIs**: Exposes usage summaries, spend breakdown by model/operation, spending limits, and paginated event history.
- **Full Client Integration**: Type-safe TypeScript interfaces and API client methods in `frontend/src/lib/api.ts`.

---

## 2. Model Pricing Matrix

Rates are defined per 1,000,000 tokens or per generated image unit:

| Model Identifier | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) | Per-Image Scan / Unit | Primary Workload |
|---|---|---|---|---|
| `gemini-1.5-flash` / `gemini-3.5-flash` | **$0.075** | **$0.30** | $0.00 | Rapid layout generation & prompt compilation |
| `gemini-1.5-pro` / `gemini-pro` | **$1.25** | **$5.00** | $0.00 | Complex spatial reasoning & architectural analysis |
| `gemini-multimodal` | **$0.15** | **$0.60** | **$0.002** | Room image analysis, structural parsing & dimensioning |
| `imagen-3` | $0.00 | $0.00 | **$0.030** | Photorealistic diffusion image rendering |
| `dall-e-3` | $0.00 | $0.00 | **$0.040** | High-fidelity texture and styling renders |
| *Unlisted / Fallback* | **$0.10** | **$0.40** | **$0.025** | Conservative fallback default |

### Cost Calculation Formula
$$\text{Cost} = \left(\frac{\text{Input Tokens}}{1,000,000} \times \text{Input Rate}\right) + \left(\frac{\text{Output Tokens}}{1,000,000} \times \text{Output Rate}\right) + (\text{Image Count} \times \text{Image Unit Rate})$$

All costs are calculated to 6 decimal precision in USD.

---

## 3. Subscription Tier Spending Limits

Monthly spending limits are dynamically configurable via environment variables and application settings:

| Subscription Tier | Monthly Budget Limit | Setting Name | Default Cap |
|---|---|---|---|
| **Free** | $1.00 / month | `AI_COST_FREE_LIMIT_MONTHLY` | $1.00 |
| **Premium** | $15.00 / month | `AI_COST_PREMIUM_LIMIT_MONTHLY` | $15.00 |
| **Pro Designer** | $60.00 / month | `AI_COST_PRO_LIMIT_MONTHLY` | $60.00 |
| *Enterprise / Custom* | Custom quota | Custom configuration | Unlimited / Custom |

Global tracking and enforcement can be enabled/disabled via `AI_COST_TRACKING_ENABLED=true/false`.

---

## 4. Database Schema: `ai_usage` Table

Migrations are managed via Alembic revision `2b6d9f74160e`:

```sql
CREATE TABLE ai_usage (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generation_id VARCHAR NULL,
    operation VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    image_count INTEGER NOT NULL DEFAULT 0,
    cost FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX ix_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX ix_ai_usage_operation ON ai_usage(operation);
CREATE INDEX ix_ai_usage_model ON ai_usage(model);
CREATE INDEX ix_ai_usage_generation_id ON ai_usage(generation_id);
```

---

## 5. Core Cost Tracker Functions (`app/core/ai_cost_tracker.py`)

- `calculate_ai_cost(model, input_tokens, output_tokens, image_count) -> float`: Computes estimated USD cost based on token counts and image outputs.
- `get_tier_cost_limit(plan) -> float`: Resolves monthly limit in USD based on user's plan.
- `get_user_monthly_spend(db, user_id, days=30) -> float`: Aggregates cumulative spending over a rolling 30-day window using SQL `SUM(cost)`.
- `check_ai_cost_limit(db, user, projected_additional_cost=0.0, raise_exception=True) -> Tuple[bool, float, float, float]`: Verifies if user is within their monthly cap; raises `AICostLimitExceededException` when over budget.
- `record_ai_usage(db, user_id, operation, model, input_tokens, output_tokens, image_count, generation_id, explicit_cost) -> AIUsage`: Persists inference event to the database and logs telemetry.
- `get_user_usage_summary(db, user, days=30) -> Dict[str, Any]`: Aggregates spend, tokens, images, percentage of budget consumed, and breakdowns by model and operation.

---

## 6. API Endpoints

All endpoints are mounted under `/api/ai/usage`:

### 1. `GET /api/ai/usage/summary`
Returns comprehensive usage statistics for dashboard display:
```json
{
  "user_id": "96ae3205-942b-4044-9e9a-220a5d5ff8d2",
  "plan": "Premium",
  "monthly_limit_usd": 15.00,
  "current_month_spend_usd": 1.482650,
  "remaining_budget_usd": 13.517350,
  "percentage_used": 9.88,
  "total_generations": 42,
  "total_tokens": 182400,
  "total_images": 28,
  "cost_by_model": {
    "gemini-1.5-flash": 0.421500,
    "imagen-3": 0.840000,
    "gemini-multimodal": 0.221150
  },
  "cost_by_operation": {
    "dynamic_design": 0.741500,
    "image_rendering": 0.520000,
    "room_analysis": 0.221150
  },
  "window_days": 30
}
```

### 2. `GET /api/ai/usage/limits`
Returns current spending vs monthly limit and an overage flag:
```json
{
  "user_id": "96ae3205-942b-4044-9e9a-220a5d5ff8d2",
  "plan": "Free",
  "monthly_limit_usd": 1.00,
  "current_spend_usd": 0.9850,
  "remaining_budget_usd": 0.0150,
  "percentage_used": 98.50,
  "is_budget_exceeded": false
}
```

### 3. `GET /api/ai/usage/history`
Returns paginated audit records of recent AI operations (`limit`, `offset`).

---

## 7. Budget Overage Handling & Error Format

When a user's monthly spend plus projected cost exceeds their tier limit, generation endpoints raise `AICostLimitExceededException`. This is rendered via the Phase 41 standardized global error handler:

```json
{
  "error": {
    "code": "AI_COST_LIMIT_EXCEEDED",
    "message": "Monthly AI generation spending limit of $1.00 reached for Free tier (Current spend: $1.0500). Please upgrade your subscription tier to continue generating designs.",
    "request_id": "67659be7-7410-424e-bc96-693ba3e7918c",
    "details": {
      "current_spend_usd": 1.05,
      "monthly_limit_usd": 1.00,
      "remaining_budget_usd": 0.0
    }
  }
}
```

HTTP Status Code: `402 Payment Required`

---

## 8. Frontend Integration (`frontend/src/lib/api.ts`)

Type definitions and helper functions for frontend clients:

```typescript
import { fetchAiUsageSummary, fetchAiSpendingLimits, getHumanErrorMessage } from "@/lib/api";

// Fetch user's 30-day AI cost and token summary
const summary = await fetchAiUsageSummary();
console.log(`Current spend: $${summary.current_month_spend_usd} / $${summary.monthly_limit_usd}`);

// Fetch spending limit check
const limits = await fetchAiSpendingLimits();
if (limits.is_budget_exceeded) {
  toast.error("Monthly AI generation limit reached. Please upgrade your plan.");
}
```
