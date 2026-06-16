from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    # Show tables in SQLite
    res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
    print("Tables:", [r[0] for r in res])
    
    # Show projects schema
    try:
        res = conn.execute(text("PRAGMA table_info(projects)"))
        print("Projects table info:", [dict(r._mapping) for r in res])
    except Exception as e:
        print("Error projects info:", e)

    # Show users schema
    try:
        res = conn.execute(text("PRAGMA table_info(users)"))
        print("Users table info:", [dict(r._mapping) for r in res])
    except Exception as e:
        print("Error users info:", e)
        
    # Show projects rows
    try:
        res = conn.execute(text("SELECT * FROM projects"))
        print("Projects rows:", [dict(r._mapping) for r in res])
    except Exception as e:
        print("Error projects rows:", e)
