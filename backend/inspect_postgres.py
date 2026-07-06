from sqlalchemy import create_engine, text
from app.config import settings

try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id, style, image_url FROM designs LIMIT 20"))
        print("Designs in DB:")
        for r in res:
            print(dict(r._mapping))
except Exception as e:
    print("Error reading designs:", e)
