# HomeVerse Version 2 (V2) Architecture & Implementation Guide

> **Phase 48 — VERSION 2**  
> Comprehensive documentation of the 7 core pillars transforming HomeVerse from an AI image generator into an end-to-end interior design, budgeting, procurement, and site execution platform.

---

## 1. Executive Summary

Phase 48 introduces the complete **Version 2 (V2)** architectural layer for HomeVerse. While Phase 47 established the core end-to-end MVP flow (auth, project creation, lifestyle style profiling, AI design generation, and initial budget estimation), Version 2 equips homeowners and interior teams with execution-grade tools:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HOMEVERSE VERSION 2                           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Product Catalogue      │ Real catalog items, styles, specs, brands  │
│ 2. Shopping List          │ Itemized procurement lifecycle             │
│ 3. Product Alternatives   │ Value-engineering & material substitutes   │
│ 4. Expense Tracker        │ Actual expenses vs budget tracking         │
│ 5. Execution Tracker      │ 10-stage milestone timeline & progress     │
│ 6. Notification Engine    │ Budget alerts, milestone handovers, orders │
│ 7. Advanced AI Chat       │ Architectural copilot & cost simulations   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture & Information Flow

```mermaid
flowchart TD
    User([User / Homeowner]) --> WebApp[HomeVerse Web Application]

    subgraph "AI & Copilot Layer"
        Copilot[Advanced AI Copilot /api/ai/chat]
        CostEngine[Cost Impact Simulation Engine]
        ValueEng[Value Engineering Alternatives Engine]
    end

    subgraph "Commerce & Procurement"
        CatalogAPI[Product Catalogue /api/products]
        ShoppingAPI[Shopping & Procurement /api/projects/{id}/shopping]
        SwapEngine[Alternative Product Swapper]
    end

    subgraph "Site Execution & Financial Control"
        TimelineAPI[Execution Tracker /api/projects/{id}/tasks]
        ExpenseAPI[Expense Tracker /api/projects/{id}/expenses]
        ReceiptUpload[Receipt Storage & Attachment]
    end

    subgraph "Notification & Telemetry"
        NotifAPI[Notification Engine /api/notifications]
        Analytics[Product Analytics & Event Tracking]
    end

    WebApp --> Copilot
    Copilot --> CostEngine
    WebApp --> CatalogAPI
    CatalogAPI --> ValueEng
    WebApp --> ShoppingAPI
    ShoppingAPI --> SwapEngine
    WebApp --> TimelineAPI
    WebApp --> ExpenseAPI
    ExpenseAPI --> ReceiptUpload
    TimelineAPI --> NotifAPI
    ExpenseAPI --> NotifAPI
```

---

## 3. Core Pillars & API Specifications

### 1. Product Catalogue (`/api/products`)
* **Purpose**: Filterable catalogue of designer-grade furniture, fixtures, lighting, and finishes.
* **Capabilities**:
  * Filtering by `category` (sofa, table, storage, lighting, decor), `min_price`, `max_price`, `brand`, and `style`.
  * Keyword search matching across name, description, category, and brand.
  * Auto-seeding canonical products with dimensions, ratings, availability, materials, and colours.
* **Endpoints**:
  * `GET /api/products`: List filtered products.
  * `GET /api/products/{id}`: Single product specification.
  * `POST /api/products`: Create product catalogue item.

### 2. Shopping List (`/api/projects/{id}/shopping`)
* **Purpose**: Manage procurement registry for active projects.
* **Status Lifecycle**: `Wishlist` &rarr; `Selected` &rarr; `Ordered` &rarr; `Delivered` &rarr; `Installed`.
* **Summary Rollup**:
  * Computes total procurement cost, item counts, and status breakdowns.
* **Endpoints**:
  * `GET /api/projects/{id}/shopping`: List project items.
  * `GET /api/projects/{id}/shopping/summary`: Cost aggregations and status metrics.
  * `POST /api/projects/{id}/shopping`: Add procurement item.
  * `PUT /api/shopping/{item_id}`: Update quantity, cost, or status.
  * `DELETE /api/shopping/{item_id}`: Remove item from shopping list.

### 3. Product Alternatives Engine (`/api/products/{id}/alternatives`)
* **Purpose**: Value-engineering mechanism identifying affordable substitutes that match the room's aesthetic while reducing capital outlay.
* **Output Metrics**:
  * `savings`: Raw financial reduction (e.g. ₹33,000).
  * `savings_percentage`: Proportional reduction (e.g. 38.8%).
  * `difference_reason`: Explicit design rationale (e.g. *"Commercial-grade stain-resistant weave sofa with engineered frame releases ₹33,000 back to budget contingency"*).
* **Swap Endpoint**:
  * `POST /api/shopping/{item_id}/swap?alternative_product_id={alt_id}`: Instantly swaps the shopping list item with the selected alternative, updating total project rollups.

### 4. Expense Tracker (`/api/projects/{id}/expenses`)
* **Purpose**: Tracks actual on-site disbursements against the estimated project budget.
* **Target Scenario** (as specified in Phase 48):
  * **Target Budget**: ₹8.0L (₹800,000)
  * **Estimated Scope**: ₹7.7L (₹770,000)
  * **Actual Expenses**: ₹5.2L (₹520,000)
  * **Remaining Cushion**: ₹2.8L (₹280,000)
* **Receipt Integration**:
  * `POST /api/expenses/{id}/receipt`: Supports both direct multipart file uploads and cloud receipt URLs.
* **Summary Endpoint**:
  * `GET /api/projects/{id}/expenses/summary`: Rollup of budget, estimated cost, actual paid, remaining cushion, variance, and trade breakdown (Civil, Electrical, Plumbing, Kitchen, Painting, Lighting).

### 5. Execution Tracker (`/api/projects/{id}/tasks`)
* **Purpose**: 10-stage sequential project execution roadmap:
  1. Planning & Architectural Design
  2. Site Measurement & Laser Survey
  3. Civil & Demolition Works
  4. Electrical & Plumbing Rough-In
  5. Surface Prep & Primer Painting
  6. Modular Kitchen Carcass & Counters
  7. Custom Wardrobes & Woodwork
  8. Loose Furniture Delivery & Placement
  9. Architectural & Ambient Lighting
  10. Styling & Final Handover Setup
* **Statuses**: `Pending`, `In Progress`, `Completed`, `Blocked`.
* **Progress Calculation**:
  $$\text{Progress \%} = \text{round}\left(\frac{\text{completed\_tasks}}{\text{total\_tasks}} \times 100, 1\right)$$
* **Endpoints**:
  * `GET /api/projects/{id}/tasks`: List milestone tasks.
  * `GET /api/projects/{id}/tasks/summary`: Computes progress percentage, status counts, and estimated vs actual costs.
  * `POST /api/projects/{id}/tasks`: Add custom milestone.
  * `PUT /api/tasks/{task_id}`: Update status, costs, or dates.
  * `POST /api/projects/{id}/tasks/seed`: Seed/reset canonical 10-stage timeline.

### 6. Notification Engine (`/api/notifications`)
* **Purpose**: System-wide alert and milestone event dispatcher.
* **Alert Categories**:
  * `budget_alert`: Warning when expenditure reaches contingency thresholds (e.g. 65% utilized).
  * `milestone`: Notification upon phase completions (e.g. Civil and Demolition finished).
  * `delivery`: Courier dispatch tracking for ordered furniture and fixtures.
  * `recommendation`: AI-curated value engineering tips.
* **Endpoints**:
  * `GET /api/notifications`: Filter by `project_id`, `user_id`, and `unread_only`.
  * `GET /api/notifications/summary`: Real-time unread count and latest alerts.
  * `POST /api/notifications`: Dispatch new notification.
  * `PUT /api/notifications/{id}/read`: Mark individual alert as read.
  * `PUT /api/notifications/read-all`: Mark all alerts as read.
  * `DELETE /api/notifications/{id}`: Delete notification.

### 7. Advanced AI Design Copilot (`/api/ai/chat`)
* **Purpose**: Context-aware interior architectural copilot providing spatial layout guidance, material comparisons, action chips, and real-time cost impact simulations.
* **Specialized Capabilities**:
  * **Material Comparison & Simulation**:
    * e.g., Italian Statuario Marble (₹2.20L) vs Large-Format Vitrified Tiles (₹92k) &rarr; Simulates instant ₹1.28L savings.
  * **Budget Value-Engineering**:
    * e.g., Furniture package optimization to fit within ₹8.0L project targets.
  * **Interactive Action Chips**:
    * Direct navigation links (`/budget`, `/shopping`, `/execution`, `/catalogue`) for immediate one-click actions.

---

## 4. Database Schema & Migration

Database changes were committed and verified through Alembic:
* **Migration Revision**: `9b313abdd02f_add_v2_product_columns_and_notifications.py`
* **Schema Updates**:
  * Added `dimensions`, `rating`, `availability`, `style`, `material`, and `colour` to `products` table.
  * Added `notifications` table with foreign keys to `users` and `projects`.
* **Verification**: `pytest tests/integration/test_migrations.py` passes cleanly with zero schema divergence.

---

## 5. Verification & Test Coverage

The entire test suite (`backend/tests/core/test_v2_flow.py` and global suite) was verified:

```bash
$ pytest tests/ -q
........................................................................ [ 52%]
..................................................................       [100%]
138 passed in 27.86s
```

Frontend TypeScript type safety:
```bash
$ npx tsc --noEmit
# Exit code 0 (0 errors)
```

---

*HomeVerse Version 2 marks the realization of a full design-to-delivery interior platform.*
