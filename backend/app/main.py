"""
HomeVerse Backend Entry Point
FastAPI Application Initialization and Route Registration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

try:
    from app.config import settings
    from app.api import auth, projects, designs, ai, recommend, preferences, budget, monitoring
    from app.monitoring.middleware import PrometheusMiddleware
    from app.db.base import Base
    from app.db.session import engine
except ImportError:
    from backend.app.config import settings
    from backend.app.api import auth, projects, designs, ai, recommend, preferences, budget, monitoring
    from backend.app.monitoring.middleware import PrometheusMiddleware
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

# Prometheus Observability Middleware (Phase 38)
if getattr(settings, "ENABLE_PROMETHEUS_METRICS", True):
    app.add_middleware(PrometheusMiddleware)

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

@app.get("/metrics", tags=["Monitoring & Telemetry"], include_in_schema=True)
def prometheus_metrics():
    return monitoring.prometheus_metrics()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(designs.router, prefix="/api/designs", tags=["Designs"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Engine"])
app.include_router(recommend.router, tags=["Recommendations"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["Preferences & Style"])
app.include_router(budget.router, prefix="/api/budget", tags=["Budget"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring & Telemetry"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
