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

## 🚀 MVP Scope (Completed)

The core user journey prototype has been successfully built:
1. **Upload**: Users can upload room image or video scan in [upload/page.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/app/upload/page.tsx).
2. **Generative Styles**: Generates 5 distinct design variations (Modern, Luxury, Scandinavian, Minimalist, Japandi) with dynamic Pollinations AI imaging and Gemini structural extraction.
3. **Selection**: Users select their preferred redesign.
4. **3D View**: Renders the room in an interactive React Three Fiber editor in [studio/page.tsx](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/frontend/src/app/studio/page.tsx).
5. **Editing**: Fully functional visual configurator and conversational AI Design Copilot to update wall/floor textures and add, swap, modify, or delete 3D scene elements.

For future targets (First-Person Walkthroughs, glTF loading, AR previews), see [project_todo_roadmap.md](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/project_todo_roadmap.md).
