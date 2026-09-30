# HomeVerse

> **"Turnkey AI-Powered Spatial Architecture & Interactive 3D Living Spaces across Web and Mobile."**

[![Next.js](https://img.shields.github.io/badge/Next.js-16_Turbopack-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Flutter](https://img.shields.github.io/badge/Flutter-3.x_Cross--Platform-02569B?style=flat-square&logo=flutter)](https://flutter.dev/)
[![React Three Fiber](https://img.shields.github.io/badge/React_Three_Fiber-R3F-blue?style=flat-square&logo=three.js)](https://docs.pmnd.rs/react-three-fiber)
[![FastAPI](https://img.shields.github.io/badge/FastAPI-v0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.github.io/badge/Database-PostgreSQL_%7C_SQLite-003B57?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.github.io/badge/Gemini_AI-Flash_Multimodal-4285F4?style=flat-square&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

---

## 🏛️ System Architecture

HomeVerse uses a **unified, multi-client architecture** where the desktop web application and the mobile application share the exact same backend, database, authentication, budget constraints, AI system, and 3D spatial scenes.

```text
                         HOMEVERSE
                            │
              ┌─────────────┴─────────────┐
              │                           │
       FRONTEND-WEB                  MOBILE APP
     Next.js 16 (React)            Flutter (Dart)
              │                           │
              └─────────────┬─────────────┘
                            │
                     REST / WS API
                            │
                         BACKEND
                     FastAPI (Python)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    PostgreSQL         AI Engine           Object Storage
(Single Truth)      (Agent Swarm)        (3D GLBs & Images)
```

> **Design a room on the website → close laptop → open Flutter app on your phone → see the exact same room, materials, and budget status in real time.**

---

## 💡 Key Pillars & Capabilities

### 1. Budget-First Design Engine
Budget is established during home creation rather than treated as an afterthought. It dynamically steers AI furniture recommendations, materials, and spatial trade-offs:
- **Tiers & Flexibility**: ₹5L–₹10L, ₹10L–₹25L, ₹25L–₹50L, ₹50L–₹1Cr, ₹1Cr+ with `Strict` (±0%), `Moderate` (±10%), or `Flexible` (±25%) postures.
- **Auto-Allocation**: Proportional distribution across floors, rooms, and trade categories (*Civil & Flooring, Modular Millwork, Furniture, Lighting, Walls*).
- **"What If?" Delta Simulator**: Real-time simulation testing cost impacts of material/furniture swaps (e.g. *"Reduce budget by ₹1L"* or *"Upgrade to Italian Statuario Marble"*).

### 2. 9-Step Home Creation Wizard
Replaces generic onboarding with a structured architectural flow:
1. **House Type**: Apartment, Villa, Independent House, Penthouse.
2. **Floor Count**: Multi-level navigation (1 to 4 floors).
3. **Room Count**: Bedroom, Living, Kitchen, Dining, Bathrooms, Study.
4. **Budget & Flexibility**: Sliders + Indian currency presets (`₹ Lakhs` & `₹ Crores`).
5. **Floor Plan Upload**: Vector architectural blueprint ingestion.
6. **AI Detection**: Automatic identification of walls, doors, windows, and rooms.
7. **Dimension Confirmation**: Precise metric validation ($W \times L \times H$).
8. **Room Selection**: Priority room focus.
9. **Design Style Selection**: Modern, Scandinavian, Luxury, Minimalist, Japandi, Industrial.

### 3. Canonical 3D Scene Graph
A platform-agnostic scene JSON format ensures identical spatial state across Three.js/R3F on Web and Flutter on Mobile:
```json
{
  "room_id": "r-101",
  "room_name": "Living Room",
  "width": 5.0,
  "depth": 4.5,
  "height": 3.0,
  "style": "Modern Scandinavian",
  "objects": [
    {
      "id": "sofa-01",
      "model": "sofa.glb",
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

### 4. Interactive 3D Studio & First-Person Walkthrough
- **Web Studio**: React Three Fiber viewport with transform gizmos, PBR material explorer, 2D CAD blueprint editor, and WebSpeech voice assistant.
- **Mobile Studio**: 3D scene preview, spatial properties inspector, and floating AI Copilot drawer.
- **Walkthrough**: Seamless floor-by-floor and room-by-room navigation through the house.

---

## 📂 Repository Structure

```text
HomeVerse/
├── README.md                             # Master project documentation
├── LICENSE                               # MIT License
├── .gitignore                            # Unified gitignore
├── .env.example                          # Environment variables template
├── .env.staging.example                  # Staging configuration template
├── .env.production.example               # Production configuration template
│
├── docker-compose.yml                    # Root multi-container orchestration
├── docker-compose.dev.yml                # Development compose override
├── docker-compose.prod.yml               # Production compose configuration
├── Makefile                              # Central build & run automation
│
├── frontend-web/                         # Next.js 16 Web Application
│   ├── public/                           # Assets (furniture, cutouts, 3D GLBs)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                  # Public landing page
│   │   │   ├── login/page.tsx            # Login authentication
│   │   │   ├── signup/page.tsx           # Signup registration
│   │   │   ├── dashboard/page.tsx        # Projects & budget overview
│   │   │   ├── home/new/page.tsx         # 9-Step Home Creation Wizard
│   │   │   ├── project/[projectId]/
│   │   │   │   ├── page.tsx              # Project & multi-floor view
│   │   │   │   ├── floors/[floorId]/     # Floor layout & rooms
│   │   │   │   ├── rooms/[roomId]/
│   │   │   │   │   ├── page.tsx          # Room hub & allocations
│   │   │   │   │   └── playground/       # 3D Studio, AR, VR, Voice Assistant
│   │   │   │   ├── budget/page.tsx       # Project budget simulator
│   │   │   │   ├── shopping/page.tsx     # Procurement & bill of materials
│   │   │   │   └── walkthrough/page.tsx  # 3D first-person house walkthrough
│   │   │   ├── profile/page.tsx          # User profile
│   │   │   └── preferences/page.tsx      # Style preferences
│   │   ├── components/
│   │   │   ├── landing/                  # Hero, HowItWorks, 3D Showcase, CTA
│   │   │   ├── auth/                     # LoginForm, SignupForm, GoogleAuth
│   │   │   ├── dashboard/                # ProjectCard, CreateHomeCard, BudgetSummary
│   │   │   ├── home-setup/               # 9-step wizard components
│   │   │   ├── floor-plan/               # Blueprint viewer & detection overlays
│   │   │   ├── rooms/                    # RoomCard, RoomSelector, RoomProgress
│   │   │   ├── playground/               # Canvas, Blueprint2D, Properties, Voice
│   │   │   ├── ai/                       # CopilotChat, AICopilotDrawer, Status
│   │   │   ├── three-d/                  # RoomScene, HouseScene, FurnitureObject
│   │   │   ├── walkthrough/              # WalkthroughViewer, FloorNavigation
│   │   │   ├── budget/                   # BudgetOverview, RoomBudget, Breakdown
│   │   │   └── shopping/                 # ProductCard, ShoppingTable
│   │   ├── hooks/                        # useAuth, useProject, useBudget, useScene
│   │   ├── lib/                          # api, auth, projects, budgets, scenes
│   │   ├── types/                        # user, project, floor, room, budget, scene
│   │   └── config/                       # environment configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── mobile/                               # Flutter Cross-Platform Mobile Client
│   ├── android/                          # Native Android configuration (API 34)
│   ├── ios/                              # Native iOS Runner configuration
│   ├── web/                              # Flutter Web target
│   ├── assets/                           # Bundled mobile icons & assets
│   ├── lib/
│   │   ├── main.dart                     # App entry point
│   │   ├── app/                          # App bootstrap, GoRouter, Theme
│   │   ├── core/                         # ApiClient, SecureStorage, CurrencyFormatter
│   │   ├── features/
│   │   │   ├── auth/                     # Login & Signup screens, AuthProvider
│   │   │   ├── dashboard/                # DashboardScreen & ProjectCards
│   │   │   ├── home_setup/               # 9-step wizard mobile screen
│   │   │   ├── floor_plan/               # Mobile blueprint viewer
│   │   │   ├── rooms/                    # RoomDetailScreen & budget breakdown
│   │   │   ├── playground/               # 3D Scene viewer & properties
│   │   │   ├── ai/                       # CopilotChatDrawer
│   │   │   ├── budget/                   # BudgetOverviewScreen & What-If modal
│   │   │   ├── shopping/                 # ShoppingListScreen
│   │   │   └── walkthrough/              # Panoramic floor navigator
│   │   └── shared/                       # Canonical SceneModel & widgets
│   ├── test/                             # Flutter tests
│   ├── pubspec.yaml
│   └── analysis_options.yaml
│
├── backend/                              # Unified FastAPI Python Backend
│   ├── app/
│   │   ├── main.py                       # Application initialization & routes
│   │   ├── api/                          # REST API routers (auth, projects, budget, etc.)
│   │   ├── models/                       # SQLAlchemy models (project, floor, room, budget)
│   │   ├── schemas/                      # Pydantic validation schemas
│   │   ├── services/                     # Business logic (budget, floorplan, scene)
│   │   ├── ai/                           # AI agents, vision, generation, orchestrator
│   │   │   ├── agents/                   # budget_agent, design_agent, layout_agent, etc.
│   │   │   ├── vision/                   # room_detection, dimension_detection
│   │   │   ├── generation/               # image_generation, prompt_builder
│   │   │   ├── orchestrator/             # AI agent orchestrator service
│   │   │   └── prompts/                  # Structured domain prompts
│   │   ├── db/                           # Session & base database configuration
│   │   ├── storage/                      # S3 & local storage clients
│   │   ├── monitoring/                   # Prometheus middleware & metrics
│   │   └── workers/                      # Celery async task workers
│   ├── tests/                            # Pytest test suite (test_budget_flow, etc.)
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── requirements.txt
│
├── database/                             # Database Migrations & Seeds
│   ├── migrations/                       # Alembic versioned migrations
│   └── seed/                             # Seed data scripts
│
├── docs/                                 # Technical & Product Documentation
│   ├── architecture/                     # system.md, budget.md, mobile-app.md, scene.md
│   ├── product/                          # user-flow.md, feature-spec.md, mobile-vs-web.md
│   └── deployment/                       # environments.md, production.md, mobile-release.md
│
├── infrastructure/                       # Deployment Dockerfiles & Terraform
├── monitoring/                           # Prometheus & Grafana dashboard configurations
├── scripts/                              # Setup, migration, and smoke-testing scripts
└── nginx/                                # Nginx reverse proxy configuration
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
# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows
source venv/bin/activate       # On macOS/Linux

# 2. Install dependencies
cd backend
pip install -r requirements.txt

# 3. Run database migrations
python scripts/migrate_sqlite.py   # Or Alembic for PostgreSQL

# 4. Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```
*API docs available at [http://localhost:8080/docs](http://localhost:8080/docs).*

---

### 2. Start the Web Client (Next.js 16)

```bash
cd frontend-web
npm install
npm run dev
```
*Web application runs at [http://localhost:3000](http://localhost:3000).*

To build for production:
```bash
npm run build
```

---

### 3. Start the Mobile Client (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```
*Target iOS simulator, Android emulator, physical device, or Chrome.*

---

### 4. Running with Docker Compose

To launch PostgreSQL, Redis, Celery, FastAPI, and Next.js concurrently:

```bash
# Start all services
docker compose up -d

# Development mode with live reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 🧪 Testing & Verification

### Backend Tests
```bash
cd backend
$env:PYTHONPATH = "."
pytest tests/budget/test_budget_flow.py -v
```

### Frontend Web Build Check
```bash
cd frontend-web
npm run build
```

---

## 📖 Key Documentation Links

- **[System Architecture](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/docs/architecture/system.md)**
- **[Mobile Application Architecture](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/docs/architecture/mobile-app.md)**
- **[Scene Graph Serialization](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/docs/architecture/scene-architecture.md)**
- **[Budget-First Engine Specification](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/docs/architecture/budget.md)**
- **[Mobile vs. Web Responsibilities](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/docs/product/mobile-vs-web.md)**
- **[Mobile Release Pipeline](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/docs/deployment/mobile-release.md)**

---

## 👤 Author & License

**Anisha Paturi**  
- GitHub: [@AnishaPaturi](https://github.com/AnishaPaturi)  
- Repository: [HomeVerse](https://github.com/AnishaPaturi/HomeVerse)

Licensed under the [MIT License](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/LICENSE).
