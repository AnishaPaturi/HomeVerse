from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, projects, designs, ai, recommend

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

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "HomeVerse API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
