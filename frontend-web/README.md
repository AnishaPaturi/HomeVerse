# HomeVerse Frontend Web

Next.js web application for HomeVerse — AI-powered spatial interior design, 3D digital twins, and budget planning.

## 🚀 Key Modules
- **9-Step Home Creation Wizard (`/home/new`)**:
  - Interactive property type and floor count selection
  - Fully editable room configuration (Bedrooms, Bathrooms, Balconies)
  - Mathematically calibrated budget slider with quick milestone chips
  - Vector floorplan blueprint ingestion & AI computer vision room detection
- **3D Spatial Studio & AR/VR Playground (`/project/[id]/rooms/[id]/playground`)**:
  - React Three Fiber interactive viewport with transform gizmos and PBR materials
  - 2D CAD floorplan editor and WebSpeech voice assistant
  - First-person 3D architectural walkthrough
- **Dashboard & Studio Settings (`/dashboard`)**:
  - User-scoped project workspace with Indian budget overview
  - Live dynamic notifications drawer with auto-polling and relative timestamps
  - Danger Zone account termination with confirmation modal

## 🛠️ Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Typecheck without emitting
npx tsc --noEmit

# 4. Build for production
npm run build
```

Application runs at [http://localhost:3000](http://localhost:3000).
