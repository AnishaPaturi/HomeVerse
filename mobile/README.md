# HomeVerse Mobile (Flutter)

Cross-platform mobile application for **HomeVerse** (iOS & Android), connecting directly to the central FastAPI backend and sharing the single PostgreSQL database, authentication, AI system, budget constraints, and 3D scene data.

## Features

- **Shared State**: Changes made on Web (`frontend-web`) immediately reflect on Mobile and vice versa.
- **Budget-First**: Projects, floors, and rooms strictly adhere to the project's overall turnkey budget and flexibility posture.
- **House Creation Wizard**: 9-step wizard (`House Type` → `Floors` → `Rooms` → `Budget` → `Floor Plan` → `AI Detection` → `Dimensions` → `Room Selection` → `Design Style`).
- **Interactive 3D & Spatial Viewer**: Parses canonical scene graph JSON (`{room, objects: [{model, position, rotation, scale, material}]}`) to render 3D room scenes and walkthroughs.
- **AI Spatial Copilot**: Mobile drawer for conversational design modifications and what-if simulations.

## Project Structure

```text
mobile/
├── android/            # Native Android project configuration
├── ios/                # Native iOS project configuration
├── web/                # Optional Flutter Web target
├── assets/             # Bundled local icons, textures & sample 3D models
└── lib/
    ├── app/            # App bootstrap, GoRouter navigation, theme
    ├── core/           # API client, tokens, storage, currency formatting
    ├── features/       # Feature-driven modular architecture
    │   ├── auth/       # Login, Signup, Google OAuth
    │   ├── dashboard/  # Project list, budget summary, progress
    │   ├── home_setup/ # 9-step home creation wizard
    │   ├── floor_plan/ # Blueprint upload & AI dimension overlay
    │   ├── rooms/      # Room cards, allocation breakdown
    │   ├── playground/ # 3D Studio, object inspector, scene manipulation
    │   ├── ai/         # Copilot chat, AI alternatives drawer
    │   ├── budget/     # Project & room budget tracking, What-If simulator
    │   ├── shopping/   # Procurement list & value-engineered alternatives
    │   └── walkthrough/# Multi-floor 3D house walkthrough
    └── shared/         # Reusable widgets, shared models & extensions
```

## Running the Application

Ensure the HomeVerse FastAPI backend is running at `http://localhost:8080` (or `http://10.0.2.2:8080` on the Android emulator).

```bash
flutter pub get
flutter run
```
