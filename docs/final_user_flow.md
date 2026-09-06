# HomeVerse Final User Flow Architecture & Digital Home Book (Phase 46)

This document details the architecture, design principles, API specifications, data flow, and frontend implementation of the **Phase 46 Final User Flow** in HomeVerse.

---

## 1. Overview & Canonical User Journey

HomeVerse transitions users from an empty apartment into a fully designed, budget-optimized, and executed home. The canonical Phase 46 user journey is defined as follows:

```mermaid
flowchart TD
    A[Landing Page] --> B[Create Account]
    B --> C[Create Home: 2 BHK, 1,120 sq ft, ₹8.0L Budget]
    C --> D[Upload Floor Plan]
    D --> E[AI Detects Rooms & Boundaries]
    E --> F[Lifestyle Questionnaire]
    F --> G[Style Discovery Quiz]
    G --> H[AI Creates Style Profile: Warm Contemporary]
    H --> I[Living Room Space Planning]
    I --> J[Generate 3 Concepts: Design A, B, C]
    J --> K[Side-by-Side Comparison]
    K --> L[Select Design B @ ₹8.40L]
    L --> M[AI Budget Optimizer: 'Make it fit ₹8L']
    M --> N[Cost Optimized to ₹7.96L (₹44,000 Savings)]
    N --> O[Approve Design & Generate Shopping List]
    O --> P[Execution Plan & Milestones]
    P --> Q[Track Expenses & Construction Progress]
    Q --> R[Complete Home]
    R --> S[Digital Home Book Dossier & Certificate]
```

---

## 2. Key Data Points & Canonical Metrics

| Stage | Metric / Value | Description |
|---|---|---|
| **Property Format** | 2 BHK, 1,120 sq ft | Typical urban apartment configuration |
| **Initial Budget Target** | ₹8,00,000 (₹8.0 Lakhs) | Hard ceiling defined by resident |
| **Spatial Analysis** | Living Room (3.63m × 3.94m, 154 sqft), Master Bed (3.35m × 3.65m, 132 sqft), Kitchen (2.44m × 3.05m, 80 sqft) | Auto-detected from 2D floor plan |
| **Aesthetic DNA** | Warm Contemporary | Oak tones, boucle weave, linen textures, warm ambient lighting |
| **Generated Concepts** | Design A (Scandinavian - ₹8.4L), Design B (Warm Contemporary - ₹8.4L), Design C (Luxury - ₹8.9L) | 3 distinct generative layouts |
| **Selection** | Design B (Warm Contemporary) | Selected by resident |
| **Initial Estimate** | ₹8,40,000 | +₹40,000 budget variance |
| **Optimization Formula** | Substitution of solid timber to engineered walnut veneer & high-grade boucle | Preserves aesthetic and durability |
| **Optimized Total** | ₹7,96,000 | Safely under the ₹8.0L ceiling |
| **Net Savings Achieved**| ₹44,000 | Direct financial ROI delivered by AI optimizer |
| **Procurement Status** | 6 item categories procured and delivered | Sofa, table, TV console, lighting, rug, drapes |
| **Execution Progress** | 100% (6 of 6 milestones completed) | Civil prep, electrical, flooring, millwork, styling, audit |
| **Handoff Artifact** | **Digital Home Book Dossier** | PDF-ready archival record and certificate of completion |

---

## 3. Backend Endpoints

### 3.1 Design Selection
- **Endpoint**: `POST /api/designs/{design_id}/select`
- **Controller**: `app/api/designs.py`
- **Behavior**:
  - Sets `selected = True` on the target design.
  - Automatically resets `selected = False` for all sibling designs in the same project.
  - Emits the `design_selected` product telemetry event (`app/core/analytics.py`).
- **Response**: `DesignOut` schema with updated selection state.

### 3.2 Project Completion
- **Endpoint**: `POST /api/projects/{project_id}/complete`
- **Controller**: `app/api/projects.py`
- **Behavior**:
  - Sets `completed = True` and timestamp in project metadata.
  - Emits the `project_completed` telemetry event.
  - Returns direct redirect URL to the Digital Home Book.
- **Response**:
  ```json
  {
    "status": "completed",
    "project_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "completed_at": "2026-09-06T08:30:00Z",
    "home_book_url": "/project/3fa85f64-5717-4562-b3fc-2c963f66afa6/home-book"
  }
  ```

### 3.3 Digital Home Book Dossier
- **Endpoints**: `GET /api/projects/{project_id}/digital-home-book` and `/home-book`
- **Controller**: `app/api/projects.py:build_digital_home_book`
- **Aggregated Data Sections**:
  1. **Root Specifications**: BHK, area, target budget, project completion status.
  2. **Resident Profile**: Lifestyle persona, color preferences, and curated materials.
  3. **Floor Plan & Spatial Zones**: Detected room dimensions and boundary coordinate metadata.
  4. **Selected Design & Multi-Angle Renders**: Primary, front, left, right, and back camera perspective renders.
  5. **Design Comparison Matrix**: Side-by-side audit of all 3 generated concepts.
  6. **Budget Optimization Audit**: Breakdown of the ₹8.4L initial estimate, ₹7.96L optimized cost, and ₹44,000 savings.
  7. **Procurement Inventory**: Furniture, fixtures, and materials categorized with delivery statuses.
  8. **Execution Timeline & Milestones**: Milestone-by-milestone audit logs and on-site verification records.
  9. **Home Care & Material Maintenance Guide**: Specific cleaning and preservation instructions per material (hardwood, boucle, brass, glass).
  10. **Official Certificate of Completion**: Unique verifiable certificate ID (`HV-{YEAR}-CERT-{ID}`).

---

## 4. Frontend Architecture

### 4.1 Digital Home Book Page
- **Path**: `frontend/src/app/project/[projectId]/home-book/page.tsx`
- **Features**:
  - **Hero Dossier Banner**: Real-time savings counter, verification seal, and property metadata.
  - **Export & Sharing**: One-click `window.print()` formatted stylesheet for PDF generation and clipboard link sharing.
  - **Interactive Tab Navigation**:
    - `Executive Summary`: Specifications, owner profile, and verified completion certificate.
    - `Spatial & Rooms`: Architectural table of detected rooms, calculated dimensions, and sq ft.
    - `Selected Design & Renders`: 3D multi-angle view switcher (Primary, Front, Left, Right, Back).
    - `Budget & Cost Audit`: Step progression visualizer of the "Make it fit ₹8L" optimization.
    - `Shopping Inventory`: Complete itemized manifest with delivery indicators.
    - `Execution Milestones`: Progress tracker showing 100% verified status.
    - `Care Handbook`: Material care cards for long-term home upkeep.

### 4.2 Integration Touchpoints
- **Project Overview Navigation**: Added `Digital Home Book` link to `navItems` in `frontend/src/app/project/[projectId]/page.tsx`.
- **Execution Page Completion Trigger**: Added "Complete Home & Generate Book" button and completion banner in `frontend/src/app/project/[projectId]/execution/page.tsx`.
- **Typed API Client**: Added `fetchDigitalHomeBook`, `completeProject`, and `selectDesign` methods with complete `DigitalHomeBook` TypeScript interface in `frontend/src/lib/api.ts`.

---

## 5. Verification & Testing

The final user flow is covered by automated integration tests in `backend/tests/core/test_final_user_flow.py`:
- `test_select_design_toggles_selection_and_tracks_analytics`: Validates design selection exclusivity and `design_selected` event telemetry.
- `test_complete_project_endpoint`: Validates project completion transition, metadata persistence, and `project_completed` event dispatch.
- `test_get_digital_home_book_complete_dossier`: Validates end-to-end dossier schema including floor plan dimensions, multi-angle renders, budget optimization savings (₹44,000), shopping items, and completion certificate.
- `test_digital_home_book_minimal_project_defaults`: Validates intelligent canonical fallback defaults (2 BHK, 1120 sq ft, ₹8.0L budget, Design B Warm Contemporary).
