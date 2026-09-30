# Mobile Application Architecture (Flutter)

The HomeVerse mobile client is built with **Flutter**, sharing the central FastAPI backend, PostgreSQL database, AI orchestration pipelines, budget tracking, and canonical 3D scene graphs with the Next.js web application (`frontend-web`).

## Unified Architecture Overview

```text
                     HOMEVERSE ECOSYSTEM
                              │
               ┌──────────────┴──────────────┐
               │                             │
          FRONTEND-WEB                  MOBILE APP
         Next.js (React)              Flutter (Dart)
               │                             │
               └──────────────┬──────────────┘
                              │
                    REST API & WebSockets
                              │
                           BACKEND
                      FastAPI (Python)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
    PostgreSQL            AI Engine            Object Storage
(Single Source of Truth) (Agent Swarm)       (3D GLBs & Images)
```

## Shared State & Synchronous Data Flow

1. **Single Source of Truth**: Neither the web client nor the mobile client maintain decoupled business state. All project settings, room layouts, furniture coordinates, budget envelopes, and design versions reside in PostgreSQL.
2. **Session Persistence**: JWT access and refresh tokens stored in `flutter_secure_storage` authenticate against `/api/auth/me`.
3. **Turnkey Budget Guardrails**:
   - Budget constraints established during the 9-step wizard (`HomeCreationWizardScreen`) apply universally.
   - Dynamic What-If delta simulations (`POST /api/budget/simulate-impact`) calculate net cost variations, budget compliance posture, and cheaper alternative recommendations across both platforms.

## Feature Organization

The Flutter client uses a **Feature-First modular structure**:
- `auth`: Credentials, Google OAuth, session refresh.
- `dashboard`: Real-time project overview, budget consumption cards.
- `home_setup`: 9-step home wizard (House Type → Floors → Rooms → Budget → Floor Plan → AI Detection → Dimensions → Room Selection → Design Style).
- `floor_plan`: Blueprint viewer with AI spatial overlay.
- `rooms`: Room-level hubs with area metrics and allocated budget ceilings.
- `playground`: 3D spatial studio parsing canonical scene graphs.
- `ai`: Copilot drawer communicating with the FastAPI agent orchestrator.
- `budget`: Multi-floor project budget simulator & room allocations.
- `shopping`: Value-engineered procurement list and catalog items.
- `walkthrough`: First-person panoramic 3D walkthrough across floors.
