import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

Base = declarative_base()
engine = None
SessionLocal = None

def init_db():
    global engine, SessionLocal
    database_url = settings.DATABASE_URL or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/homeverse")
    try:
        engine = create_engine(database_url, pool_size=20, max_overflow=10, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            pass
        print(f"V2 Database: PostgreSQL Connected successfully to {database_url.split('@')[-1]}")
    except Exception as e:
        print(f"V2 Database Warning: connection to PostgreSQL failed ({e}). Falling back to SQLite...")
        sqlite_path = "sqlite:///./homeverse.db"
        engine = create_engine(sqlite_path, connect_args={"check_same_thread": False})
        print("V2 Database: SQLite fallback initialized.")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_v2_db():
    if SessionLocal is None:
        init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
