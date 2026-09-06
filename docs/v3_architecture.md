# HomeVerse Version 3 (V3) Architecture & Implementation Guide

> **Phase 49 — VERSION 3**  
> Complete documentation of the 6 core pillars delivering real-time 3D spatial visualization, mobile Augmented Reality (AR) furniture placement, vector 2D floor plans, real-time room parameter editing with dynamic financial tickers, AI voice copilot assistance, and physically based rendering (PBR) material comparison.

---

## 1. Executive Summary

Phase 49 establishes the **Version 3 (V3)** spatial, sensory, and interactive intelligence layer of HomeVerse. While Version 2 (Phase 48) delivered procurement, expense rollups, site milestones, and catalogue value-engineering, Version 3 brings physical spatial realism directly to the homeowner and architect:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HOMEVERSE VERSION 3                           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 3D Visualization       │ Three.js scene graph, lighting, camera     │
│ 2. AR Furniture Placement │ WebXR, Apple QuickLook, 900mm clearance    │
│ 3. 2D Vector Floor Plan   │ Walls, swing doors, windows, footprints    │
│ 4. Real-Time Room Editing │ Dynamic cost delta (+/- ₹), coherence score│
│ 5. Voice Assistant Copilot│ Speech recognition, TTS audio, NLU intents │
│ 6. PBR Material Engine    │ Albedo, roughness, metalness, trade-offs   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture & Component Interactions

```mermaid
flowchart TD
    User([Homeowner / Architect]) --> UI[HomeVerse 3D Studio Web Client]

    subgraph "Spatial & Rendering Layer"
        SceneAPI[3D Scene Graph Engine /api/rooms/{id}/3d-scene]
        ExportAPI[Three.js / GLTF Scene Exporter /api/rooms/{id}/3d-scene/export]
        FloorplanAPI[2D Vector Floor Plan /api/projects/{id}/floorplan]
        Canvas3D[Three.js / React Three Fiber Studio Canvas]
        Canvas2D[2D Blueprint Vector Canvas]
    end

    subgraph "Augmented Reality (AR)"
        ARModelAPI[AR Model Metadata /api/products/{id}/ar-model]
        ARPlaceAPI[Spatial Clearance Validator /api/ar/place]
        MobileQuickLook[Apple QuickLook / Android WebXR SceneViewer]
        QRLauncher[Mobile QR Code Deep Link Launcher]
    end

    subgraph "Interactive Editing & Financial Feedback"
        RealtimeEditAPI[Real-Time Room Edit /api/rooms/{id}/realtime-edit]
        CostTicker[Dynamic Cost Delta Computation Engine (+/- ₹)]
        CoherenceEngine[Style Coherence Scorer]
    end

    subgraph "Voice Intelligence"
        VoiceAPI[Voice Intent Classifier /api/voice/command]
        WebSpeech[Web Speech Recognition API]
        TTS[Text-To-Speech Audio Synthesizer]
    end

    subgraph "Advanced Material Science (PBR)"
        MaterialsAPI[PBR Materials Library /api/materials]
        CompareAPI[Side-by-Side Comparison Engine /api/materials/compare]
        PBRSpecs[Albedo, Roughness, Metalness, Normal Scale]
    end

    UI --> Canvas3D
    UI --> Canvas2D
    UI --> WebSpeech
    WebSpeech --> VoiceAPI
    VoiceAPI --> RealtimeEditAPI
    VoiceAPI --> TTS
    UI --> ARModelAPI
    ARModelAPI --> QRLauncher --> MobileQuickLook
    UI --> ARPlaceAPI
    UI --> MaterialsAPI
    MaterialsAPI --> CompareAPI
    RealtimeEditAPI --> CostTicker
    RealtimeEditAPI --> CoherenceEngine
    RealtimeEditAPI --> Canvas3D
```

---

## 3. Core Pillars in Detail

### Pillar 1: 3D Visualization Scene Graph & Export
- **Endpoints**:
  - `GET /api/rooms/{room_id}/3d-scene`: Returns full room geometry (width, length, height in meters), camera parameters (`fov: 60`, position, target), lighting rig (ambient daylight, directional sunlight at 45 degrees, warm 3000K cove lighting), surface descriptors (floor, walls, ceiling), and 3D furniture meshes.
  - `GET /api/rooms/{room_id}/3d-scene/export`: Exports client-agnostic Three.js JSON / Khronos GLTF schema compatible with Blender, Unity, and WebGL viewports.
- **Frontend**: `CanvasContainer.tsx` with React Three Fiber, OrbitControls, directional shadows, and dynamic PBR shaders.

### Pillar 2: AR Furniture Placement
- **Endpoints**:
  - `GET /api/products/{product_id}/ar-model`: Returns dual format assets (GLB for WebXR on Android, USDZ for Apple AR QuickLook on iOS), plane anchoring metadata (`horizontal_plane` vs `vertical_surface`), 1:1 real-world dimensions in meters, and a mobile deep-link QR code payload.
  - `GET /api/ar/models`: Lists all catalogue products with verified AR models.
  - `POST /api/ar/place`: Evaluates proposed 3D coordinates `[x, y, z]` against room boundaries and verifies minimum 900mm primary walkway circulation clearance.
- **Frontend**: `ARPlacementModal.tsx` providing live QR code scanning, dimensional breakdown, and interactive clearance validation.

### Pillar 3: Interactive Floor Plan (2D Vector CAD)
- **Endpoints**:
  - `GET /api/projects/{project_id}/floorplan`: Returns architectural vector layouts consisting of room polygons, dimensioned walls (north, south, east, west), swing doors with rotation arcs, daylight windows, and furniture footprints.
  - `POST /api/projects/{project_id}/floorplan/generate`: Parametrically synthesizes architectural apartment layouts tailored to project BHK count and total square footage.
  - `PUT /api/projects/{project_id}/floorplan`: Persists live architectural updates from user manipulation.
- **Frontend**: `BlueprintEditor2D.tsx` with pan/zoom canvas, interactive polygon nodes, and real-time dimension annotations.

### Pillar 4: Real-Time Room Parameter Editing & Financial Feedback
- **Endpoint**:
  - `PUT /api/rooms/{room_id}/realtime-edit`: Accepts real-time parameter changes (`wall_colour`, `flooring_material`, `active_style`) and responds immediately with:
    - `cost_delta`: Dynamic financial impact (e.g. `+₹90,720` for Italian Marble vs `-₹35,000` for Glazed Vitrified Tiles).
    - `style_coherence_score`: Evaluates design harmony across selected elements (e.g. 96.5%).
    - `financial_impact_summary`: Clear human-readable justification of price movements.
    - `updated_scene`: Full updated 3D scene graph ready for immediate Three.js re-render.
- **Frontend**: Real-time room editing inspector bar with dynamic cost ticker badge embedded directly into the studio header.

### Pillar 5: Voice Assistant Copilot
- **Endpoint**:
  - `POST /api/voice/command`: Natural Language Understanding (NLU) classifier supporting key spatial and financial intents:
    - `change_wall_color`: Maps spoken color requests ("warm greige", "charcoal", "sage") to canonical hex swatches and 3D surface updates.
    - `change_flooring`: Parses material requests ("Italian marble", "vitrified tiles", "white oak") with automatic cost impact computation.
    - `switch_camera_view`: Toggles camera perspectives ("top-down floor plan", "walkthrough", "isometric").
    - `budget_query` / `timeline_query`: Summarizes project financial cushion and construction milestones.
    - `action_chips`: Returns contextual follow-up quick actions ("Preview in 3D", "Compare Finishes", "View in AR").
- **Frontend**: `VoiceAssistantWidget.tsx` integrating the browser Web Speech API for voice recognition, visual soundwave pulses, text input fallback, and SpeechSynthesis TTS output.

### Pillar 6: Advanced PBR Material Visualization & Comparison
- **Endpoints**:
  - `GET /api/materials`: Retrieves the catalog of Physically Based Rendering materials with Albedo, Roughness, Metalness, Normal scale, cost/sqft, durability score (1-5), maintenance rating, and eco classification.
  - `GET /api/materials/{id}`: Fetches individual material technical specifications.
  - `POST /api/materials/compare`: Evaluates two materials side-by-side for a specified room area (e.g. 280 sq ft). Computes exact installed cost difference, savings percentage, durability trade-offs, maintenance overhead, and AI recommendation.
- **Frontend**: `MaterialExplorerModal.tsx` providing material cards, PBR parameter meters, side-by-side technical trade-off cards, and 1-click "Apply to Room" triggers.

---

## 4. Verification & Testing

The implementation is verified via a comprehensive test suite in `backend/tests/core/test_v3_flow.py` covering all 6 pillars:

| Test Case | Description | Result |
|---|---|---|
| `test_get_room_3d_scene` | Three.js scene graph, camera fov, lighting rig, surfaces, meshes | PASSED |
| `test_export_room_3d_scene` | Three.js JSON / GLTF export schema integrity | PASSED |
| `test_realtime_room_edit_wall_and_floor` | Live wall/floor update with dynamic cost delta & coherence | PASSED |
| `test_realtime_room_edit_vitrified_tiles` | Value-engineering tile choice yielding negative cost delta (savings) | PASSED |
| `test_ar_model_metadata` | Dual GLB/USDZ links, plane anchoring, dimensions, QR payload | PASSED |
| `test_list_ar_ready_models` | Listing catalogue products with AR support | PASSED |
| `test_ar_placement_validation` | Spatial boundary & 900mm primary walkway circulation validation | PASSED |
| `test_get_and_generate_floorplan` | Vector walls, swing doors, windows, parametric generation | PASSED |
| `test_voice_command_wall_color` | Speech intent parsing for wall paint & action payload synthesis | PASSED |
| `test_voice_command_flooring` | Speech intent parsing for flooring materials & cost delta | PASSED |
| `test_voice_command_camera_switch` | Camera navigation intent parsing (top-down blueprint) | PASSED |
| `test_voice_command_budget_and_timeline`| Financial & construction progress voice queries | PASSED |
| `test_list_and_filter_materials` | PBR material filtering by category and budget ceiling | PASSED |
| `test_material_comparison_engine` | Side-by-side technical & installed cost comparison engine | PASSED |

- **Total Backend Tests Passing**: **152 / 152 (100%)**
- **Frontend TypeScript Verification**: `npx tsc --noEmit` exited **0** with **0 errors**.
