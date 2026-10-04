# HomeVerse

> **"Turnkey AI-Powered Spatial Architecture & Interactive 3D Living Spaces."**

[![Next.js](https://img.shields.io/badge/Next.js-14%2F15%2F16_Turbopack-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-R3F-blue?style=flat-square&logo=three.js)](https://docs.pmnd.rs/react-three-fiber)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_%7C_SQLite-003B57?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-Flash_Multimodal-4285F4?style=flat-square&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🏛️ System Architecture

HomeVerse uses a modern client-server architecture pairing a Next.js 3D Web application with a high-performance FastAPI backend, database, AI system, and 3D spatial scene graph.

```text
                                HOMEVERSE
                                    │
                                    ▼
                              FRONTEND-WEB
                             Next.js (React)
                                    │
                              REST / WS API
                                    │
                                 BACKEND
                             FastAPI (Python)
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
            PostgreSQL          AI Engine           Object Storage
        (Single Source)      (Agent Swarm)        (3D GLBs & Images)
```

> **Design a room in your browser → see real-time updates, materials, and budget allocations in interactive 3D.**

---

## 💡 Key Pillars & Capabilities

### 1. Budget-First Architectural Engine
Budget is established during home creation rather than treated as an afterthought. It dynamically steers AI furniture recommendations, materials, and spatial trade-offs:
- **Calibrated Slider & Indian Denominations**: Precision-calibrated linear marks (₹5L, ₹25L, ₹50L, ₹75L, ₹1Cr) with 1-click round milestone chips and direct figure inputs.
- **Tiers & Flexibility**: Standard Indian budget brackets with `Strict` (0% tolerance), `Moderate` (±5%), or `Flexible` (±15%) posture settings.
- **Auto-Allocation**: Proportional distribution across floors, rooms, and trade packages (*Civil & Flooring, Modular Millwork, Furniture, Lighting, Walls*).
- **"What If?" Delta Simulator**: Real-time simulation testing cost impacts of material/furniture swaps (e.g. *"Reduce budget by ₹1L"* or *"Upgrade to Italian Statuario Marble"*).

### 2. 9-Step Home Creation Wizard (`/home/new`)
Replaces generic onboarding with an interactive architectural flow:
1. **House Type**: Apartment, Villa, Independent House, Penthouse.
2. **Floor Count**: Multi-level navigation (1 to 4 floors with hierarchy).
3. **Room Configuration**: Fully editable interactive steppers and numeric inputs for **Bedrooms (1–12)**, **Bathrooms (1–10)**, and **Balconies (0–8)** with live total spatial zone calculations.
4. **Budget & Flexibility**: Mathematically aligned slider marks (clicking at 25 Lakhs accurately registers ₹25,00,000) + preset tier pills.
5. **Floor Plan Upload**: Vector architectural blueprint ingestion with live preview.
6. **AI Detection**: Automatic identification of walls, doors, windows, and rooms with confidence metrics.
7. **Dimension Confirmation & Adjustment**: Precise metric and imperial validation ($W \times L \times H$) with editable room dimensions.
8. **Room Focus**: Priority starting room anchor (Living Room, Kitchen, Master Bedroom).
9. **Design Style DNA**: Modern, Scandinavian, Luxury, Minimalist, Japandi, Industrial.

### 3. Canonical 3D Scene Graph
A platform-agnostic scene JSON format ensures persistent spatial state across Three.js/R3F:
```json
{
  "room_id": "r-101",
  "room_name": "Living Room",
  "width": 5.5,
  "depth": 6.5,
  "height": 3.0,
  "style": "Japandi",
  "objects": [
    {
      "id": "sofa-01",
      "model": "sectional_sofa.glb",
      "object_type": "sofa",
      "position": [0.0, 0.0, 1.2],
      "rotation": [0.0, 0.0, 0.0],
      "scale": [1.0, 1.0, 1.0],
      "material": "Oatmeal Boucle",
      "cost": 85000.0
    }
  ]
}
```

### 4. Interactive 3D Studio, AR/VR & 2D CAD
- **Spatial 3D Studio**: React Three Fiber viewport with transform gizmos, PBR material explorer, 2D CAD blueprint editor, and WebSpeech voice assistant.
- **First-Person Walkthrough**: Seamless floor-by-floor and room-by-room navigation through the 3D living space.

### 5. Dynamic Live Notifications Engine
- **Context-Aware Alerts**: Dynamic notification registry for milestone handovers, budget status, procurement deliveries, and AI recommendations.
- **Live User & Project Binding**: Automatically generates contextual alerts linked to real projects, budgets, and rooms; provides personalized onboarding alerts for new creators.
- **Real-Time Polling & Relative Times**: Live relative timestamps (`"Just now"`, `"5m ago"`, etc.) with background polling, mark-as-read, and per-alert dismissal.
- **High-Contrast Opaque UI**: Completely opaque, elevated dark container preventing transparency bleed and ensuring crisp legibility.

### 6. Zero-Trace Account Lifecycle & Surgical Purge
- **Complete Cascading Purge (`AccountPurgeService`)**: Deleting an account removes every trace across all 30 database tables (projects, rooms, budgets, floorplans, scenes, objects, tasks, notifications, preferences, provider listings, and analytics).
- **Clean Slate Guarantee**: Re-registering with the same email starts with a guaranteed fresh, empty account (0 projects, 0 preferences, 0 notifications, 0 analytics).
- **Safety Confirmation**: Studio Settings Danger Zone (`/dashboard/settings#danger-zone`) requires explicit `DELETE` confirmation before account purging.

---

## 📂 Repository Structure

```text
HomeVerse/
├── README.md                             # Master project documentation
├── LICENSE                               # MIT License
├── .gitignore                            # Unified gitignore
├── .env.example                          # Environment variables template
├── docker-compose.yml                    # Root multi-container orchestration
├── Makefile                              # Central build & run automation
│
├── frontend-web/                         # Next.js Web Application
│   ├── public/                           # Assets (furniture, cutouts, 3D GLBs)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                  # Public landing page
│   │   │   ├── login/page.tsx            # Login authentication
│   │   │   ├── signup/page.tsx           # Signup registration
│   │   │   ├── dashboard/                # Projects, budget overview & settings
│   │   │   │   ├── page.tsx              # Main dashboard
│   │   │   │   ├── settings/page.tsx     # Studio settings & Danger Zone
│   │   │   │   └── projects/page.tsx     # Project grid
│   │   │   ├── home/new/page.tsx         # 9-Step Home Creation Wizard
│   │   │   ├── project/[projectId]/      # Project workspace
│   │   │   │   ├── page.tsx              # Multi-floor overview
│   │   │   │   ├── budget/page.tsx       # Budget allocation simulator
│   │   │   │   ├── contracts/page.tsx    # Contractor contracts
│   │   │   │   ├── execution/page.tsx    # Milestone execution tracker
│   │   │   │   ├── shopping/page.tsx     # Procurement bill of materials
│   │   │   │   ├── walkthrough/page.tsx  # 3D first-person walkthrough
│   │   │   │   └── rooms/[roomId]/
│   │   │   │       ├── page.tsx          # Room hub & allocations
│   │   │   │       └── playground/       # 3D Studio, AR, VR, Voice Assistant
│   │   │   ├── profile/page.tsx          # User spaces & profile
│   │   │   └── preferences/page.tsx      # Style preferences
│   │   ├── components/
│   │   │   ├── layout/                   # Navbar, NotificationBell, Footer
│   │   │   ├── home-setup/               # 9-step wizard components (RoomCount, Budget, etc.)
│   │   │   ├── dashboard/                # ProjectCard, CreateHomeCard, BudgetSummary
│   │   │   ├── playground/               # Canvas, Blueprint2D, Properties, Voice
│   │   │   ├── ai/                       # CopilotChat, AICopilotDrawer, Status
│   │   │   └── three-d/                  # RoomScene, HouseScene, FurnitureObject
│   │   ├── lib/                          # api, auth, projects, budgets, scenes, utils
│   │   └── types/                        # user, project, floor, room, budget, scene
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                               # Flutter Cross-Platform Mobile Client
│   ├── android/                          # Native Android configuration (API 34)
│   ├── ios/                              # Native iOS Runner configuration
│   ├── lib/
│   │   ├── main.dart                     # App entry point
│   │   ├── core/                         # ApiClient, SecureStorage, CurrencyFormatter
│   │   ├── features/                     # Auth, Dashboard, Home Setup, 3D Playground
│   │   └── shared/                       # Canonical SceneModel & widgets
│   └── pubspec.yaml
│
├── backend/                              # Unified FastAPI Python Backend
│   ├── app/
│   │   ├── main.py                       # Application initialization & routes
│   │   ├── api/                          # REST routers (auth, projects, budget, notifications)
│   │   ├── models/                       # SQLAlchemy models (project, floor, room, budget, user)
│   │   ├── schemas/                      # Pydantic validation schemas
│   │   ├── services/                     # Business logic (account_purge, budget, scene)
│   │   ├── ai/                           # AI agent swarm, vision, prompt builders
│   │   └── db/                           # Session & database configuration
│   ├── tests/                            # Pytest suite (account purge, projects, notifications)
│   ├── requirements.txt
│   └── pyproject.toml
│
└── docs/                                 # Architectural & Technical Specifications
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: `>= 3.10`
- **Node.js**: `>= 20.0`
- **Flutter SDK**: `>= 3.2.0` (for mobile)
- **Docker & Docker Compose** (optional)

---

### 1. Start the Backend (FastAPI)

```bash
# 1. Navigate to backend & activate virtual environment
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows
source venv/bin/activate       # On macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```
*Interactive Swagger API documentation is available at [http://localhost:8080/docs](http://localhost:8080/docs).*

---

### 2. Start the Web Client (Next.js)

```bash
cd frontend-web
npm install
npm run dev
```
*Web application runs at [http://localhost:3000](http://localhost:3000).*

To check TypeScript compilation:
```bash
npx tsc --noEmit
```

---

### 3. Start the Mobile Client (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```
*Targets iOS simulator, Android emulator, physical device, or Chrome.*

---

### 4. Running with Docker Compose

Launch PostgreSQL, Redis, Celery, FastAPI, and Next.js concurrently:

```bash
# Start all services in the background
docker compose up -d

# Development mode with live reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 🧪 Testing & Verification

### Backend Pytest Suite
```bash
cd backend
$env:PYTHONPATH = "."          # On Windows PowerShell
export PYTHONPATH="."          # On macOS/Linux

# Run core tests
pytest tests/api/test_account_deletion_and_recreation.py -v
pytest tests/api/test_projects.py -v
pytest tests/core/test_v2_flow.py -v
```

### Frontend Typecheck & Build
```bash
cd frontend-web
npx tsc --noEmit
npm run build
```

---

## 📡 Core API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | User signup with sanitized fields and clean slate verification |
| `POST` | `/api/auth/login` | Email/password verification or development session init |
| `POST` | `/api/auth/demo` | Seeds official development demo creator |
| `DELETE` | `/api/users/account` | Surgical account purge across all 30 database tables |
| `GET` | `/api/projects` | User-scoped projects list (filters by `user_id` or `email`) |
| `POST` | `/api/projects` | Creates project bound to authenticated user |
| `GET` | `/api/projects/{id}` | Project detail with floors, rooms, and budget hierarchy |
| `POST` | `/api/projects/{id}/budget/auto-allocate` | Proportional budget allocation across trade packages |
| `GET` | `/api/notifications/summary` | Live unread count & user/project dynamic alerts |
| `PUT` | `/api/notifications/read-all` | Marks all matching user notifications as read |
| `DELETE` | `/api/notifications/{id}` | Dismisses individual notification |

---

## 📖 Key Documentation Links

- **[System Architecture](docs/architecture/system.md)**
- **[Mobile Application Architecture](docs/architecture/mobile-app.md)**
- **[Scene Graph Serialization](docs/architecture/scene-architecture.md)**
- **[Budget-First Engine Specification](docs/architecture/budget.md)**
- **[Mobile vs. Web Responsibilities](docs/product/mobile-vs-web.md)**
- **[Mobile Release Pipeline](docs/deployment/mobile-release.md)**

---

## 👤 Author & License

**Anisha Paturi**  
- GitHub: [@AnishaPaturi](https://github.com/AnishaPaturi)  
- Repository: [HomeVerse](https://github.com/AnishaPaturi/HomeVerse)

Licensed under the [MIT License](LICENSE).
