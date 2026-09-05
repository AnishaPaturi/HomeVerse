# HomeVerse Product Analytics & Event Tracking Architecture (Phase 45)

This document details the telemetry tracking engine, event taxonomy, database persistence schema, conversion funnel computation, drop-off diagnostics, room/style popularity algorithms, and frontend client integration implemented across HomeVerse.

---

## 1. Overview & Objectives

Understanding user behavior across the end-to-end design and budgeting lifecycle is critical for product optimization. Without unified product telemetry, teams cannot identify user drop-off points, feature adoption barriers, or space planning trends.

HomeVerse implements a comprehensive **Product Analytics Engine** meeting all **Phase 45** specifications:
- **Unified Event Taxonomy**: Standard tracking across all 11 lifecycle stages (`user_registered`, `project_created`, `room_created`, `style_selected`, `design_generated`, `design_selected`, `budget_optimized`, `product_added`, `shopping_item_ordered`, `execution_started`, `project_completed`).
- **Drop-off Diagnostics & Funnel Analysis**: Step-by-step conversion funnel analysis with drop-off percentage calculations identifying primary bottleneck stages.
- **Popular Rooms & Styles**: Aggregates and ranks popular room types and preferred design aesthetics with percentage distributions.
- **Budget Metrics**: Calculates average, median, min, and max user budgets across created and optimized projects.
- **Generation Analytics**: Computes total design generations and average generations per user and per project.
- **Feature Utility**: Ranks feature usage frequency to distinguish high-value features from neglected workflows.
- **Database Persistence & Migrations**: Managed via Alembic revision `9a6b51dd369f` with indexed `user_id`, `session_id`, `event_name`, and `created_at`.
- **Prometheus Telemetry Integration**: Real-time counter `homeverse_product_analytics_events_total` with Prometheus scrapes.
- **Type-safe Frontend SDK**: Fully typed TypeScript client with non-blocking fire-and-forget telemetry in `frontend/src/lib/analytics.ts`.

---

## 2. Standard Event Taxonomy

| Event Name | Trigger Location | Contextual Properties | Business Value |
|---|---|---|---|
| `user_registered` | `POST /api/auth/register` | `plan`, `email`, `referral` | Acquisition & signup funnel |
| `project_created` | `POST /api/projects` | `project_id`, `name`, `property_type`, `bhk`, `area_sqft`, `budget`, `currency` | Project creation rate & property profile |
| `room_created` | `POST /api/rooms` / upload | `room_type`, `dimensions`, `project_id` | Popular rooms & home layout breakdown |
| `style_selected` | Style quiz / Onboarding | `style`, `color_palette`, `material_pref` | Aesthetic preference demand |
| `design_generated` | `POST /api/ai/generate-dynamic-design` | `project_id`, `room_type`, `style`, `design_id` | Core AI feature engagement & consumption |
| `design_selected` | Design comparison modal | `design_id`, `style`, `project_id` | User preference commitment & decision rate |
| `budget_optimized` | `POST /api/ai/what-if/*`, `/api/budget` | `design_id`, `budget`, `cost_delta`, `scenario_title` | Cost engineering & "What If?" utility |
| `product_added` | Shopping catalogue | `product_id`, `category`, `price`, `vendor` | Product marketplace intent |
| `shopping_item_ordered`| Procurement checkout | `item_id`, `vendor`, `order_total` | Monetization & fulfillment |
| `execution_started` | Milestone tracker | `project_id`, `task_count`, `timeline_days` | Conversion to physical execution |
| `project_completed` | Project dashboard | `project_id`, `duration_days`, `final_spend` | Lifecycle completion & customer satisfaction |

Custom / specialized events can also be ingested seamlessly.

---

## 3. Database Schema: `analytics_events` Table

Migrations are tracked via Alembic revision `9a6b51dd369f`:

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(128) NULL,
    event_name VARCHAR(100) NOT NULL,
    properties JSON NOT NULL DEFAULT '{}'::json,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX ix_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX ix_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX ix_analytics_events_created_at ON analytics_events(created_at);
```

---

## 4. Analytics Core Engine (`app/core/analytics.py`)

- `track_event(db, event_name, user_id=None, properties=None, session_id=None) -> AnalyticsEvent`: Records event into `analytics_events`, sanitizes JSON fields, increments Prometheus metric, and writes structured logs.
- `get_analytics_summary(db, days=30) -> Dict[str, Any]`: Returns total event volume, distinct active users, unique sessions, and breakdown counts by `event_name`.
- `get_funnel_analysis(db, days=30) -> Dict[str, Any]`: Evaluates user progression across all 11 lifecycle stages, computing conversion from top-of-funnel and step-to-step drop-off percentages, identifying the primary bottleneck stage.
- `get_product_insights(db, days=30) -> Dict[str, Any]`:
  - **Popular Rooms**: Aggregates room types across `room_created` and `design_generated`.
  - **Selected Styles**: Ranks styles from `style_selected` and `design_generated`.
  - **Budget Statistics**: Aggregates `average_budget`, `median_budget`, `min_budget`, and `max_budget`.
  - **Generation Statistics**: Computes total generations, active generating users/projects, and average generations per user/project.
  - **Feature Utility**: Ranked frequency of event types to identify feature popularity.
- `get_event_history(db, event_name=None, user_id=None, limit=50, offset=0) -> List[AnalyticsEvent]`: Paginated audit log for diagnostic queries.

---

## 5. API Endpoints (`/api/analytics`)

### 1. `POST /api/analytics/track`
Accepts client-side or backend events.
```json
{
  "event_name": "style_selected",
  "properties": {
    "style": "Scandinavian",
    "palette": "Warm Neutral"
  },
  "session_id": "sess_8923a1"
}
```
**Response (201 Created)**:
```json
{
  "status": "recorded",
  "event_id": "75e81d6f-8703-4f93-b8c1-196025687799",
  "event_name": "style_selected",
  "user_id": "96ae3205-942b-4044-9e9a-220a5d5ff8d2",
  "is_standard_event": true
}
```

### 2. `GET /api/analytics/summary?days=30`
```json
{
  "window_days": 30,
  "total_events": 1420,
  "unique_users": 284,
  "unique_sessions": 450,
  "event_counts": {
    "user_registered": 284,
    "project_created": 210,
    "design_generated": 680,
    "budget_optimized": 140
  }
}
```

### 3. `GET /api/analytics/funnel?days=30`
Computes step-by-step conversion rates and isolates user friction points:
```json
{
  "window_days": 30,
  "primary_drop_off_stage": "design_selected",
  "overall_conversion_rate": 8.45,
  "funnel_steps": [
    {
      "step_number": 1,
      "event_name": "user_registered",
      "total_events": 284,
      "unique_users": 284,
      "conversion_rate_from_start": 100.0,
      "drop_off_rate_from_previous": 0.0
    },
    {
      "step_number": 2,
      "event_name": "project_created",
      "total_events": 210,
      "unique_users": 210,
      "conversion_rate_from_start": 73.94,
      "drop_off_rate_from_previous": 26.06
    }
  ]
}
```

### 4. `GET /api/analytics/insights?days=30`
```json
{
  "window_days": 30,
  "popular_rooms": [
    { "room_type": "Living Room", "count": 142, "percentage": 48.3 },
    { "room_type": "Master Bedroom", "count": 98, "percentage": 33.3 }
  ],
  "popular_styles": [
    { "style": "Scandinavian", "count": 120, "percentage": 42.1 },
    { "style": "Modern Luxury", "count": 85, "percentage": 29.8 }
  ],
  "budget_statistics": {
    "average_budget": 854000.0,
    "median_budget": 800000.0,
    "min_budget": 350000.0,
    "max_budget": 2500000.0,
    "total_data_points": 210
  },
  "generation_statistics": {
    "total_generations": 680,
    "active_generating_users": 190,
    "active_generating_projects": 204,
    "average_generations_per_user": 3.58,
    "average_generations_per_project": 3.33
  },
  "feature_utility": [
    { "feature_event": "design_generated", "count": 680 },
    { "feature_event": "user_registered", "count": 284 }
  ]
}
```

### 5. `GET /api/analytics/events?limit=50&offset=0`
Returns paginated raw event history.

---

## 6. Frontend Telemetry SDK (`frontend/src/lib/analytics.ts`)

Type-safe and fail-safe instrumentation for UI components:

```typescript
import { trackProductEvent, fetchAnalyticsFunnel, fetchAnalyticsInsights } from "@/lib/analytics";

// 1. Track user interactions
await trackProductEvent("style_selected", {
  style: "Japandi",
  source: "onboarding_wizard",
});

// 2. Fetch funnel diagnostics for internal admin / analytics dashboard
const funnel = await fetchAnalyticsFunnel(30);
console.log(`Primary Drop-Off Stage: ${funnel.primary_drop_off_stage}`);

// 3. Fetch product insights
const insights = await fetchAnalyticsInsights(30);
console.log(`Average User Budget: ₹${insights.budget_statistics.average_budget}`);
```
