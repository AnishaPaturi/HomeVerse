#!/usr/bin/env bash
set -e

echo "=== HomeVerse Environment Setup ==="

# Check requirements
command -v git >/dev/null 2>&1 || { echo "Git is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python >/dev/null 2>&1 || { echo "Python is required but not installed. Aborting." >&2; exit 1; }

echo "1. Creating Python virtual environment..."
cd backend
if [ ! -d ".venv" ]; then
    python -m venv .venv
fi
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "2. Installing Frontend dependencies..."
cd frontend
npm install
cd ..

echo "3. Initializing .env configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

echo "=== Setup completed successfully! ==="
