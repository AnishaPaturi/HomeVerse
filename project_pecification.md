# HomeVerse Project Specification & Roadmap

HomeVerse is an AI-powered interior design and room customization web application. It enables users to upload a room photo, receive multiple AI-generated redesigns in seconds, edit the room in an interactive 3D environment, and customize materials, furniture, and styling using an AI Design Copilot.

---

## 🌟 Core Concepts

- **Canva + Figma + ChatGPT + Planner5D for Interior Design**: Integrates AI image generation, room semantic segmentation, and real-time interactive 3D room planning.
- **Workflow**: 
  1. Photo Upload
  2. Semantic Image Analysis (YOLOv11 & SAM 2)
  3. Style Generation (FLUX/SDXL)
  4. Interactive 3D Editor (Three.js/R3F)
  5. AI Design Copilot Integration
  6. Smart Furniture Marketplace integration

---

## 🏗️ Architecture & Stack

### Frontend & 3D Editor
* **Next.js & TypeScript**
* **TailwindCSS & Shadcn UI**
* **React Three Fiber (R3F) & Drei**

### Backend & AI Layer
* **FastAPI (Python)**
* **PostgreSQL**
* **Cloudinary & AWS S3**
* **AI Engine**: YOLOv11, SAM 2, FLUX/SDXL, Large Language Models (Gemini/Claude/GPT)

---

## 🗄️ Database Design

### `Users`
* `id` (UUID, PK)
* `name` (VARCHAR)
* `email` (VARCHAR, Unique)
* `plan` (VARCHAR)
* `created_at` (TIMESTAMP)

### `Projects`
* `id` (UUID, PK)
* `user_id` (UUID, FK)
* `title` (VARCHAR)
* `room_type` (VARCHAR)
* `thumbnail` (VARCHAR)
* `created_at` (TIMESTAMP)

### `Designs`
* `id` (UUID, PK)
* `project_id` (UUID, FK)
* `style` (VARCHAR)
* `image_url` (VARCHAR)
* `selected` (BOOLEAN)

### `Objects`
* `id` (UUID, PK)
* `design_id` (UUID, FK)
* `object_type` (VARCHAR)
* `position_x` / `position_y` / `position_z` (FLOAT)
* `rotation` (FLOAT)
* `scale` (FLOAT)
* `material` (VARCHAR)

---

## 🚀 MVP Scope

The immediate goal is to build a functional prototype proving the core user journey:
1. **Upload**: User uploads a room image.
2. **Generative Styles**: Outputs 5 redesign variations.
3. **Selection**: User chooses one.
4. **3D View**: Renders the room in a basic interactive Three.js canvas.
5. **Editing**: User can modify wall colors and replace/move furniture objects.
