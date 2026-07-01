# 🗺️ HomeVerse Project Progress & Roadmap

HomeVerse is an AI-powered interior design and room customization web application. It integrates AI image generation, room semantic segmentation, and real-time interactive 3D room planning to transition static generated designs into editable 3D workspaces.

This document highlights the **Current Accomplishments** and details the **Future Work (Roadmap & TODOs)** required to scale the application from its current state to a production-ready product.

---

## 🚦 Project Status at a Glance

* **Frontend Framework**: Next.js 15 (TypeScript, TailwindCSS)
* **3D Viewport Engine**: React Three Fiber (R3F) & Three.js
* **Backend Framework**: FastAPI (Python 3.10+, SQLite database fallback)
* **AI Core**: Gemini 3.5 Flash & Pollinations AI image generator
* **MVP Core Flow**: **100% Completed**
* **AI & Copilot Sidebar**: **100% Completed**
* **Marketplace Recommendations**: **100% Completed**

---

## 🏆 Current Accomplishments (What is Done)

### 1. Unified Monorepo & Setup
* [x] Next.js frontend and FastAPI backend structures configured to work seamlessly.
* [x] Environment fallback handling for local SQLite database (`homeverse.db`) in case of database connection failures.
* [x] CORS middleware registered on backend for local origin hosting.

### 2. Multi-Modal Room Analysis
* [x] Drag-and-drop uploads for room photos and video scans in [upload/page.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/app/upload/page.tsx).
* [x] Client-side and backend validation to reject inappropriate file uploads (outdoor nature, vehicles, food, animals) with helpful alerts.
* [x] Multimodal image & video analysis utilizing the `gemini-3.5-flash` model inside [ai_service.py](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/services/ai_service.py) to:
  * Detect room types (Living Room, Bedroom, Office, Kitchen/Dining).
  * Run a structural layout and lighting analysis (detecting windows, door locations, room shape, and primary light source directions).
  * Automatically position furniture objects (beds, sofas, tables, desks) so seating faces natural light sources.

### 3. Generative Redesigns & 3D Conversion
* [x] Dynamic prompt generation based on Gemini layout summaries, querying Pollinations AI to produce 5 style variations: **Modern, Luxury, Scandinavian, Minimalist, Japandi**.
* [x] Automated parsing of Gemini-generated coordinate placements (X, Y, Z coordinates, radian rotations) to seed initial 3D objects in the database.
* [x] Multi-style selection and projection in [studio/page.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/app/studio/page.tsx).

### 4. Interactive 3D Editor
* [x] Three.js viewport in [CanvasContainer.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/components/studio/CanvasContainer.tsx) utilizing R3F.
* [x] Responsive object representation (3D block representations of sofas, beds, coffee tables, study desks, chairs, lamps, walls, and floors).
* [x] Selected object highlighting with dynamic bounding boxes.
* [x] Full sidebar integration in [ObjectPropertiesPanel.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/components/studio/ObjectPropertiesPanel.tsx) allowing users to visually manipulate positions, scale, rotation, and materials (color hexes or textures like wood and marble).
* [x] Background photo projection supporting overlaying edited 3D items directly onto user uploads.

### 5. Conversational AI Design Copilot
* [x] Natural language processing sidebar in [CopilotChat.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/components/studio/CopilotChat.tsx) allowing conversational scene modifications.
* [x] Custom LLM action parsing (adds, updates, deletes) in the database via the Gemini copilot client.
* [x] Heuristic local fallback engine to mock copilot actions in offline environments.

### 6. Retail & Marketplace Recommendations
* [x] Structured product search engine in [recommend.py](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/api/recommend.py) mapping real Indian furniture listings (IKEA, Pepperfry, Urban Ladder) with prices (INR) and direct purchase links.
* [x] Frontend recommendation query panel syncing suggested items matching selected 3D editor objects.

---

## 📋 Roadmap & Future TODOs (What is to be Done)

### 🏎️ Immediate Next Steps (Priority 1)

#### 1. Immersive First-Person Walkthrough Mode
* [x] **Goal**: Enable users to click "Walkthrough Mode" and step inside their room, navigating via WASD and mouse-look.
* [x] **Details**:
  * [x] Implement R3F PointerLockControls inside [CanvasContainer.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/components/studio/CanvasContainer.tsx).
  * [x] Add a custom camera hook tracking WASD/Arrow keys to move the camera coordinates at eye-level height (~1.6 units).
  * [x] Add basic collision boundary boxes for walls, floors, and heavy furniture items (sofa, bed, desk) to prevent the user from walking through objects.

#### 2. Actual 3D Model Loading (glTF/GLB)
* [x] **Goal**: Replace block placeholder shapes with realistic furniture models.
* [x] **Details**:
  * [x] Integrate R3F `@react-three/drei`'s `useGLTF` hook to dynamically fetch and display `.glb` assets.
  * [x] Set up a folder structure for free-to-use 3D models (e.g. sofas, desks, chairs) in the frontend public assets, or fetch them dynamically from an external CDN.
  * [x] Map database object categories (e.g., `object_type = "sofa"`) to load specific GLTF meshes.

#### 3. Cloud Media Storage Integration
* [ ] **Goal**: Move local backend file storage to scalable cloud solutions.
* [ ] **Details**:
  * Integrate AWS S3 or Cloudinary SDK inside [config.py](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/config.py) and [ai_service.py](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/backend/app/services/ai_service.py).
  * Upload scanned room photos/videos directly to secure buckets and return cloud CDN URLs instead of mapping to local `http://localhost:8080/static/uploads/`.

#### 4. Cart Integration & Pricing Summaries
* [x] **Goal**: Let users collect recommended furniture items and compile an invoice.
* [x] **Details**:
  * [x] Create a "Shopping Cart" slide-out sidebar in the studio workspace.
  * [x] Provide a "Generate PDF Proposal" button, outputting a printable list of items, dimensions, estimated retail costs in INR, and purchase links.

---

### 🌟 Mid-Term Enhancements (Priority 2)

#### 5. Mobile WebXR AR View
* [ ] **Goal**: Allow users to project designed items onto their physical rooms via smartphone AR.
* [ ] **Details**:
  * Add a "View in AR" QR code inside the Studio.
  * Construct a light mobile page using Three.js WebXR/AR standards or Google's `<model-viewer>` web component to overlay the glTF assets onto camera streams.

#### 6. Collaborative Co-Editing Sessions
* [ ] **Goal**: Let interior designers and their clients edit the 3D room simultaneously.
* [ ] **Details**:
  * Set up WebSocket controllers in FastAPI (`app/api/ws.py`).
  * Propagate changes made in the [ObjectPropertiesPanel.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/components/studio/ObjectPropertiesPanel.tsx) or [CopilotChat.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/components/studio/CopilotChat.tsx) across all connected users in real time.

#### 7. Architectural Renovation Tools
* [ ] **Goal**: Expand scene capabilities from simple furniture placement to structure editing.
* [ ] **Details**:
  * Enable users to "Draw Walls" or place partitions in the 3D canvas.
  * Add tools to insert doorways, windows, and structural fixtures.
  * Add a 2D floorplan blueprint editor toggling between 2D and 3D perspectives.
