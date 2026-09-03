"""
HomeVerse Backend Entry Point
FastAPI Application Initialization and Route Registration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

try:
    from app.config import settings
    from app.api import auth, projects, designs, ai, recommend
    from app.db.base import Base
    from app.db.session import engine
except ImportError:
    from backend.app.config import settings
    from backend.app.api import auth, projects, designs, ai, recommend
    from backend.app.db.base import Base
    from backend.app.db.session import engine

# Initialize Base tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Notice: Table auto-generation warning: {e}")

app = FastAPI(
    title="HomeVerse API",
    description="AI Interior Design & Budget Planning Platform API",
    version="1.0.0",
)

# CORS
cors_origins = getattr(settings, "CORS_ORIGINS", ["*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core endpoints
@app.get("/")
def root():
    return {
        "message": "Welcome to HomeVerse AI Interior Design API",
        "docs": "/docs",
        "status": "online"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(designs.router, prefix="/api/designs", tags=["Designs"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Engine"])
app.include_router(recommend.router, tags=["Recommendations"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
