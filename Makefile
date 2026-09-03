.PHONY: help install dev dev-backend dev-frontend build test lint docker-up docker-down migrate seed clean

help:
	@echo "Available commands:"
	@echo "  make install        Install frontend & backend dependencies"
	@echo "  make dev            Run frontend and backend concurrently"
	@echo "  make dev-backend    Run backend development server"
	@echo "  make dev-frontend   Run frontend Next.js development server"
	@echo "  make build          Build production artifacts for frontend and backend"
	@echo "  make test           Run backend and frontend tests"
	@echo "  make lint           Run linters across codebase"
	@echo "  make docker-up      Start all services via docker-compose"
	@echo "  make docker-down    Stop all docker-compose services"
	@echo "  make migrate        Run database migrations"
	@echo "  make seed           Seed the database with initial demo data"
	@echo "  make clean          Clean temp files and caches"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting backend and frontend..."
	$(MAKE) -j 2 dev-backend dev-frontend

build:
	cd frontend && npm run build

test:
	cd backend && pytest
	cd frontend && npm test --if-present

lint:
	cd backend && ruff check . || flake8 .
	cd frontend && npm run lint

docker-up:
	docker compose up -d

docker-down:
	docker compose down

migrate:
	bash scripts/migrate.sh

seed:
	bash scripts/seed.sh

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf frontend/.next
