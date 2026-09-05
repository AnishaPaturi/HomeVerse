from pathlib import Path
from typing import List, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "HomeVerse"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    
    # Database and Cache
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/homeverse"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    JWT_SECRET: str = "homeverse-dev-secret-key-do-not-use-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://staging.homeverse.ai",
        "https://app.homeverse.ai",
        "https://homeverse.ai"
    ]
    
    # Cloud & Storage (AWS S3)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_BUCKET_NAME: str = "homeverse-uploads-development"
    
    # AI API Credentials
    AI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    # Monitoring & Observability (Phase 38)
    ENABLE_PROMETHEUS_METRICS: bool = True
    ENABLE_CLOUDWATCH_METRICS: bool = False
    CLOUDWATCH_NAMESPACE: str = "HomeVerse/Application"

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent.parent / ".env"),
            ".env",
            ".env.local",
        ),
        extra="ignore",
    )

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def is_staging(self) -> bool:
        return self.ENVIRONMENT == "staging"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

settings = Settings()
