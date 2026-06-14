from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = None

try:
    # Attempt connecting to PostgreSQL
    engine = create_engine(settings.DATABASE_URL)
    # Test connection
    with engine.connect() as conn:
        pass
    print("Database connection: PostgreSQL (Connected successfully)")
except Exception as e:
    print(f"Warning: PostgreSQL connection failed ({e}). Falling back to local SQLite database...")
    engine = create_engine("sqlite:///./homeverse.db", connect_args={"check_same_thread": False})
    print("Database connection: SQLite (Initialized at ./homeverse.db)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
