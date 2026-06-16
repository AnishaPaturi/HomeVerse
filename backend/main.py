from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, projects, designs, ai, recommend
from app.db.base import Base
from app.db.session import engine

# Automatically create all database tables
Base.metadata.create_all(bind=engine)

# Seed fallback user to prevent SQLite UUID numeric affinity bugs
from app.db.session import SessionLocal
from app.models.user import User as UserModel
from uuid import UUID
db = SessionLocal()
try:
    fallback_id = UUID("d0000000-0000-0000-0000-000000000000")
    fallback_user = db.query(UserModel).filter(UserModel.id == fallback_id).first()
    if not fallback_user:
        fallback_user = UserModel(
            id=fallback_id,
            name="Offline Designer",
            email="offline@homeverse.ai",
            plan="Free"
        )
        db.add(fallback_user)
        db.commit()
except Exception as e:
    print(f"Warning: Failed to seed fallback user: {e}")
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
