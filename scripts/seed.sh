#!/usr/bin/env bash
set -e

echo "=== Seeding Database ==="
cd backend
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true

python -c "
import sys
sys.path.insert(0, '.')
from database.seed.seed_data import seed
seed()
" 2>/dev/null || python ../database/seed/seed_data.py

echo "Seeding completed."
