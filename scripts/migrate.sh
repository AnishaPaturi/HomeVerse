#!/usr/bin/env bash
set -e

echo "=== Running Database Migrations ==="
cd "$(dirname "$0")/../backend"

if [ -f ".venv/Scripts/python.exe" ]; then
    PYTHON_BIN=".venv/Scripts/python.exe"
elif [ -f ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
else
    PYTHON_BIN="py"
fi

if [ -f ".venv/Scripts/alembic.exe" ]; then
    ALEMBIC_BIN=".venv/Scripts/alembic.exe"
elif [ -f ".venv/bin/alembic" ]; then
    ALEMBIC_BIN=".venv/bin/alembic"
elif command -v alembic >/dev/null 2>&1; then
    ALEMBIC_BIN="alembic"
else
    ALEMBIC_BIN=""
fi

if [ -n "$ALEMBIC_BIN" ]; then
    "$ALEMBIC_BIN" upgrade head
    echo "Alembic migrations executed successfully."
else
    echo "Running Python table initialization fallback..."
    "$PYTHON_BIN" -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"
    echo "Database tables created."
fi
