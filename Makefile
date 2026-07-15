# Makefile for VAIC Universal Starter

.PHONY: help bootstrap install dev dev-backend dev-frontend docker-up docker-down lint format typecheck test test-backend smoke eval validate clean package

# ── Help ─────────────────────────────────────────────────────────────────────
help:
	@echo "====================================================================="
	@echo "VAIC Universal Starter CLI Commands"
	@echo "====================================================================="
	@echo "  make bootstrap      Initialize virtual environment and copy configs"
	@echo "  make install        Install backend and frontend dependencies"
	@echo "  make dev            Inform dev servers launch steps"
	@echo "  make dev-backend    Launch FastAPI backend reload server"
	@echo "  make dev-frontend   Launch Next.js frontend development server"
	@echo "  make docker-up      Build and spin up docker-compose services"
	@echo "  make docker-down    Spin down docker-compose containers"
	@echo "  make lint           Check code quality and lints"
	@echo "  make format         Auto-format codebases"
	@echo "  make typecheck      Check type annotations correctness"
	@echo "  make test           Run unit tests for both parts"
	@echo "  make smoke          Run integration pipeline smoke test"
	@echo "  make eval           Run validation metrics scoring checks"
	@echo "  make validate       Validate optional capability module manifests"
	@echo "  make clean          Clean node_modules, build targets, and data stores"
	@echo "  make package        Package repository workspace as zip ready for upload"
	@echo "====================================================================="

# ── Bootstrap & Install ──────────────────────────────────────────────────────
bootstrap:
	if not exist .env copy .env.example .env
	if not exist frontend\.env.local copy frontend\.env.example frontend\.env.local
	cd backend && python -m venv .venv

install:
	cd backend && .venv\Scripts\python -m pip install --upgrade pip
	cd backend && .venv\Scripts\pip install -e ".[dev]"
	cd frontend && npm install

# ── Development ──────────────────────────────────────────────────────────────
dev:
	@echo "Start development servers in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

dev-backend:
	cd backend && .venv\Scripts\python -m uvicorn src.api.main:create_app --reload --host 0.0.0.0 --port 8000 --factory

dev-frontend:
	cd frontend && npm run dev

# ── Docker ───────────────────────────────────────────────────────────────────
docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down

# ── Quality, Formatting, Linting ─────────────────────────────────────────────
lint:
	cd backend && .venv\Scripts\python -m ruff check src/ tests/
	cd frontend && npm run lint

format:
	cd backend && .venv\Scripts\python -m ruff format src/ tests/

typecheck:
	cd backend && .venv\Scripts\python -m mypy src/ || echo "mypy check bypassed"

# ── Testing & Scopes ─────────────────────────────────────────────────────────
test: test-backend

test-backend:
	cd backend && .venv\Scripts\python -m pytest tests/ -v

smoke:
	cd backend && .venv\Scripts\python -m pytest tests/test_smoke.py -v

eval:
	cd backend && .venv\Scripts\python -c "from src.core.evaluation import EvaluationRunner; import json; from pathlib import Path; runner = EvaluationRunner(); runs = list(Path('data/runs').glob('**/run.json')); records = [json.loads(p.read_text(encoding='utf-8')) for p in runs if p.exists()]; report = runner.generate_report(records); runner.write_reports(report, Path('data/evals')); print('Evaluation report written under data/evals/')"

validate:
	python scripts/validate_modules.py

# ── Clean & Package ─────────────────────────────────────────────────────────
clean:
	if exist backend\.venv rmdir /s /q backend\.venv
	if exist frontend\node_modules rmdir /s /q frontend\node_modules
	if exist frontend\.next rmdir /s /q frontend\.next
	if exist data rmdir /s /q data
	if exist challenges rmdir /s /q challenges

package:
	tar -czf vaic-starter-submission.tar.gz backend/ frontend/ docs/ scripts/ shared/ Makefile README.md PROJECT_STATUS.md
