# HomeVerse

> **"Transform any room into a personalized, AI-powered living space."**

HomeVerse is an AI-powered interior design and room customization web application. It allows users to upload a photo of a room, receive multiple AI-generated redesigns in seconds, edit the room in an interactive 3D environment, and customize materials, furniture, and styling with the help of an AI Design Copilot.

The platform is designed to be highly extensible, with future expansion pathways into architecture, renovation planning, furniture e-commerce, AR visualization, and smart home integration.

---

## 🌟 Vision & Differentiator

Think of HomeVerse as:
**Canva + Figma + ChatGPT + Planner5D for Interior Design**

Unlike typical AI design apps that stop at static image generation, HomeVerse transitions the generated design into a **fully interactive, editable 3D design studio**.

```
Original Room Photo
       ↓
AI Room Segmentation & Style Generation (5 variations)
       ↓
Select a Design
       ↓
Interactive 3D Design Studio (Customize, Edit, chat with AI Copilot)
       ↓
High-quality Render, Walkthrough & Shopping Guide
```

---

## 🗺️ Core User Journey

### Step 1: Upload & Capture
Users upload, capture a photo, or record/upload a video walkthrough of their space:
* Living Room
* Bedroom
* Kitchen
* Office

### Step 2: AI Analysis
Behind the scenes, HomeVerse executes:
1. **Object Detection**: Identifies physical items like sofas, tables, TVs, beds, lights, cabinets, and decor.
2. **Segmentation**: Isolates boundaries of walls, floor, ceiling, windows, and doors.
3. **Room Understanding**: Constructs a semantic map of the 3D space.
4. **Style Generation**: Generates 5 aesthetic variations.

### Step 3: Generate Designs
Within seconds, the original room is transformed into 5 distinct styles:
* **Modern**
* **Luxury**
* **Scandinavian**
* **Minimalist**
* **Japandi**

```
┌────────┐ ┌────────┐
│Style 1 │ │Style 2 │
└────────┘ └────────┘

┌────────┐ ┌────────┐
│Style 3 │ │Style 4 │
└────────┘ └────────┘

     Style 5 (Featured)
```

### Step 4: Enter Design Studio
By clicking **"Open in Design Studio"**, the user enters an interactive 3D environment powered by Three.js where objects are selectable and editable.

#### Interactive Objects Context Menu:
* **Furniture (e.g., Sofa, Table, Bed)**: Customize Color, Material, Size, Position, Rotation, Replace, or Delete.
* **Wall**: Paint Color, Wallpaper, Texture, Material.
* **Floor**: Tiles, Wood, Marble, Granite.

---

## 🤖 AI Design Copilot & Marketplace

### AI Design Copilot
A conversational sidebar allows users to modify the room using natural language:
* *User*: "Make this room brighter"  
  *AI Copilot*: *Adds larger windows, changes wall color to off-white, and adds warm lighting.*
* *User*: "Replace sofa with luxury furniture"  
  *AI Copilot*: *Updates the 3D scene with premium leather sofa and accents.*
* *User*: "Make this suitable for a study room"  
  *AI Copilot*: *Inserts a wooden bookshelf, a minimalist desk, and an adjustable desk lamp.*

### Smart Furniture Marketplace
Clicking any object in the 3D scene reveals a marketplace panel with:
* Similar real-world product suggestions
* Price comparison and direct purchase links
* Exact dimensions for compatibility checks

### Room Recreation (Viral Feature)
Users upload inspiration images from Pinterest, Instagram, or hotels. HomeVerse extracts the style profile and applies it directly to the user's analyzed room footprint.

### 🎮 3D Walkthrough Mode
Step inside the designed space with video game controls:
* **Movement**: `WASD` / Arrow keys
* **Camera**: Mouse-look / Touch drag

### 📤 Export Options
* 4K Realistic Renders (Images/Videos)
* 360° Room Tours
* PDF Design Proposals (including Furniture Lists & Cost Estimates)

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    A[Frontend: Next.js + TS] --> B[3D Engine: R3F / Three.js]
    A --> C[Backend: FastAPI / Python]
    C --> D[Database: PostgreSQL]
    C --> E[Storage: S3 / Cloudinary]
    C --> F[AI Layer]
    F --> F1[YOLOv11: Object Detection]
    F --> F2[SAM 2: Segmentation]
    F --> F3[FLUX / SDXL: Style Gen]
    F --> F4[LLMs: Gemini / Claude / GPT]
```

### Frontend
* **Core Framework**: Next.js (TypeScript)
* **Styling**: TailwindCSS, Shadcn UI
* **State Management**: React Query

### 3D Engine
* Three.js, React Three Fiber (R3F), Drei

### Backend
* **Core API**: FastAPI (Python)
* **Database**: PostgreSQL (Prisma or SQLAlchemy ORM)
* **Asset Storage**: AWS S3 / Cloudinary (for uploaded images & renders)

### AI Layer
* **Object Detection**: YOLOv11 (Furniture identification)
* **Segmentation**: Segment Anything Model 2 (SAM 2) (Object and boundary separation)
* **Design Generation**: FLUX / Stable Diffusion XL (SDXL) (Generative redesigns)
* **AI Copilot**: Gemini / Claude / GPT (Intent parsing and 3D scene updates)

---

## 📂 Project Structure

HomeVerse is structured as a monorepo with the frontend (Next.js client) and backend (FastAPI server) separated to simplify independent scaling, containerization, and deployment.

```
HomeVerse/
├── frontend/             # Next.js & Three.js client application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing & Upload page
│   │   │   ├── studio/
│   │   │   │   └── page.tsx      # 3D Design Studio Page
│   │   │   ├── globals.css       # Style sheets
│   │   │   └── layout.tsx        # App layout wrapper
│   │   ├── components/
│   │   │   └── studio/
│   │   │       ├── CanvasContainer.tsx       # 3D R3F Room Viewport
│   │   │       ├── ObjectPropertiesPanel.tsx # Object configurator sidepanel
│   │   │       └── CopilotChat.tsx           # AI chat sidepanel
│   │   ├── hooks/
│   │   └── lib/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/              # FastAPI Python server application
│   ├── main.py           # Application entrypoint
│   ├── requirements.txt  # Project Python dependencies
│   └── app/
│       ├── config.py     # Settings and secret key manager
│       ├── api/          # Route routers
│       │   ├── auth.py
│       │   ├── projects.py
│       │   ├── designs.py
│       │   └── ai.py
│       ├── db/           # Connection sessions & ORM aggregation
│       │   ├── base.py
│       │   └── session.py
│       ├── models/       # SQLAlchemy models
│       │   ├── user.py
│       │   ├── project.py
│       │   ├── design.py
│       │   └── object.py
│       ├── schemas/      # Pydantic validation schemas
│       │   ├── user.py
│       │   ├── project.py
│       │   ├── design.py
│       │   └── object.py
│       └── services/     # Mock & external AI service clients
│           └── ai_service.py
```

---

## 🚀 Getting Started

To run **HomeVerse** locally, you need to set up and run both the backend FastAPI server and the frontend Next.js application.

### Prerequisites

Before starting, ensure you have the following installed:
* **Python**: `v3.10` or higher
* **Node.js**: `v18.0` or higher
* **Package Manager**: `npm` (packaged with Node.js) or `yarn` / `pnpm` / `bun`
* **PostgreSQL** (Optional): The application attempts to connect to PostgreSQL. If a database connection fails, it automatically falls back to a local SQLite database (`homeverse.db`) in the backend folder.

---

### 1. Backend Setup (FastAPI)

The backend is built with FastAPI. Follow these steps to set it up:

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create a Virtual Environment**:
   A virtual environment prevents dependency conflicts. You can create one using:
   ```bash
   python -m venv venv
   ```

3. **Activate the Virtual Environment**:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (Command Prompt)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   * **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install Dependencies**:
   Install all required Python packages from [backend/requirements.txt](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/requirements.txt):
   ```bash
   pip install -r requirements.txt
   ```

5. **Configuration (Optional)**:
   Settings are managed in [backend/app/config.py](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/config.py). You can create a `.env` file in the `backend/` directory to customize configurations:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/homeverse
   GEMINI_API_KEY=your-api-key-here
   ```
   *Note: If no PostgreSQL configuration is specified or the connection fails, SQLite will be automatically initialized at `backend/homeverse.db`.*

6. **Run the Backend Server**:
   Start the FastAPI development server by running [backend/main.py](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/main.py):
   ```bash
   python main.py
   ```
   Alternatively, you can run Uvicorn directly:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8080 --reload
   ```

The backend server will run on [http://localhost:8080](http://localhost:8080). You can check its health at `/health` and view the auto-generated Swagger documentation at [http://localhost:8080/docs](http://localhost:8080/docs).

---

### 2. Frontend Setup (Next.js)

The frontend is a Next.js application using React Three Fiber. Follow these steps to start it:

1. **Navigate to the Frontend Directory**:
   ```bash
   cd ../frontend
   ```

2. **Install Node Modules**:
   Install dependencies listed in [frontend/package.json](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/package.json):
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   Run the Next.js development server:
   ```bash
   npm run dev
   ```

The frontend application will be served at [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Schema Design

### `Users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for each user |
| `name` | VARCHAR | User's full name |
| `email` | VARCHAR (Unique) | User's email address |
| `plan` | VARCHAR | Subscription tier (e.g., Free, Premium) |
| `created_at` | TIMESTAMP | Timestamp of account creation |

### `Projects`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the project |
| `user_id` | UUID (FK) | Reference to `Users.id` |
| `title` | VARCHAR | Project name |
| `room_type` | VARCHAR | Type of room (e.g., Living Room, Office) |
| `thumbnail` | VARCHAR | URL of the project's cover image |
| `created_at` | TIMESTAMP | Timestamp of project creation |

### `Designs`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the design variation |
| `project_id` | UUID (FK) | Reference to `Projects.id` |
| `style` | VARCHAR | Aesthetic style (e.g., Japandi, Scandinavian) |
| `image_url` | VARCHAR | URL of the generated room redesign image |
| `selected` | BOOLEAN | Flag indicating if this is the active design |

### `Objects`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the 3D entity |
| `design_id` | UUID (FK) | Reference to `Designs.id` |
| `object_type` | VARCHAR | Entity classification (e.g., sofa, floor, wall) |
| `position_x` | FLOAT | X coordinate in the 3D viewport |
| `position_y` | FLOAT | Y coordinate in the 3D viewport |
| `position_z` | FLOAT | Z coordinate in the 3D viewport |
| `rotation` | FLOAT | Rotation angle / vector representation |
| `scale` | FLOAT | Scale factor of the object |
| `material` | VARCHAR | Applied material name, color, or texture link |

---

## 🚀 Roadmap

For a detailed breakdown of all accomplished features and future developer tasks, see [project_todo_roadmap.md](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/project_todo_roadmap.md).

### 📦 MVP (Phase 1: Build First) - Completed
Focus is strictly on proving the core concept.
* [x] Upload room image & video walkthroughs.
* [x] Generate 5 interior styles (Modern, Luxury, Scandinavian, Minimalist, Japandi) with structural detection.
* [x] Select one design variation.
* [x] Enter basic 3D editor viewport.
* [x] Modify colors (walls) and swap/replace/move furniture objects in a 3D R3F canvas.

### 🌟 Phase 2: AI & Catalog (V2) - Completed
* [x] Integrations with Gemini 3.5 Flash for the conversational AI Design Copilot.
* [x] Expanded furniture asset recommendation engine linking to real e-commerce store listings and price points.
* [x] Advanced object rotation, translation, scaling, and placement tools in a side configurator panel.

### 👓 Phase 3: Realism & Walkthroughs (V3) - In Progress
* [ ] Immersive walkthrough modes (First-person pointer lock WASD + mouse controls).
* [ ] Real glTF/GLB 3D models loading.
* [ ] Production-ready Cloud Storage integration (Cloudinary/AWS S3).
* [ ] Shopping cart invoicing and cost estimations.

### 🏠 Phase 4: Full-Scale Architecture (V4) - Planned
* [ ] AR room placement preview on mobile devices (WebXR/AR).
* [ ] Multi-room house generation and blueprint layout drafting modes.
* [ ] Collaborative real-time multiplayer co-editing sessions.
