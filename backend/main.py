from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, projects, designs, ai, recommend, preferences
from app.db.base import Base
from app.db.session import engine

# Automatically create all database tables
Base.metadata.create_all(bind=engine)

# Seed official demo accounts for development and testing
from app.db.session import SessionLocal
from app.models.user import User as UserModel
from uuid import UUID
db = SessionLocal()
try:
    demo_users = [
        {
            "id": UUID("d0000000-0000-0000-0000-000000000000"),
            "name": "Anisha Paturi",
            "email": "designer@homeverse.ai",
            "plan": "Pro Designer",
        },
        {
            "id": UUID("d1111111-1111-1111-1111-111111111111"),
            "name": "Demo Tester",
            "email": "demo@homeverse.ai",
            "plan": "Pro Designer",
        },
    ]
    for u in demo_users:
        existing = db.query(UserModel).filter((UserModel.id == u["id"]) | (UserModel.email == u["email"])).first()
        if not existing:
            new_user = UserModel(
                id=u["id"],
                name=u["name"],
                email=u["email"],
                plan=u["plan"]
            )
            db.add(new_user)
        else:
            existing.name = u["name"]
            existing.plan = u["plan"]
    db.commit()
    print("Demo development users seeded successfully (designer@homeverse.ai, demo@homeverse.ai)")
except Exception as e:
    print(f"Warning: Failed to seed demo users: {e}")
finally:
    db.close()

app = FastAPI(
    title="HomeVerse API",
    description="Backend API for HomeVerse - AI-Powered Interior Design Studio",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(designs.router, prefix="/api/designs", tags=["Designs"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Engine"])
app.include_router(recommend.router, tags=["default"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["Preferences & Style"])

# V2 Microservices Pipeline Router
from app.v2.gateway import router as v2_router
app.include_router(v2_router.router, prefix="/api/v2", tags=["V2 Pipeline"])

from fastapi.staticfiles import StaticFiles
import os

# Create static directory if it doesn't exist
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "HomeVerse API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
