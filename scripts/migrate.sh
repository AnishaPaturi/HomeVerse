#!/usr/bin/env bash
set -e

echo "=== Running Database Migrations ==="
cd backend
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true

if command -v alembic >/dev/null 2>&1; then
    alembic upgrade head
    echo "Alembic migrations executed successfully."
else
    echo "Running Python table initialization fallback..."
    python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"
    echo "Database tables created."
fi
