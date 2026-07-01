from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "HomeVerse"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/homeverse"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
    
    # AI Keys (Future V2/V3 integration)
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    CLAUDE_API_KEY: str = ""
    


    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
