from pathlib import Path
from typing import List, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "HomeVerse"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    
    # Database and Cache
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/homeverse"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security (Phase 43)
    JWT_SECRET: str = "homeverse-dev-secret-key-do-not-use-in-production"
    SECRET_KEY: str = "homeverse-dev-secret-key-do-not-use-in-production"
    JWT_ALGORITHM: str = "HS256"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_MIN_LENGTH: int = 8
    ENFORCE_HTTPS: bool = False
    ENABLE_SECURITY_HEADERS: bool = True
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"]
    
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

    # Rate Limiting (Phase 42)
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 5
    RATE_LIMIT_REGISTER_PER_MINUTE: int = 3
    RATE_LIMIT_AI_FREE_PER_DAY: int = 5
    RATE_LIMIT_AI_PREMIUM_PER_DAY: int = 50
    RATE_LIMIT_UPLOAD_PER_MINUTE: int = 10
    RATE_LIMIT_DEFAULT_PER_MINUTE: int = 100

    # AI Cost Control & Limits (Phase 44)
    AI_COST_TRACKING_ENABLED: bool = True
    AI_COST_FREE_LIMIT_MONTHLY: float = 1.00
    AI_COST_PREMIUM_LIMIT_MONTHLY: float = 15.00
    AI_COST_PRO_LIMIT_MONTHLY: float = 60.00

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
