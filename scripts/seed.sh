#!/usr/bin/env bash
set -e

echo "=== Seeding Database ==="
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

"$PYTHON_BIN" ../database/seed/seed_data.py

echo "Seeding completed successfully."
