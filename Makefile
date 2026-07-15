.PHONY: install install-backend install-frontend dev dev-backend dev-frontend test test-backend test-frontend smoke clean

# ── Install ──────────────────────────────────────────────────────────────────

install: install-backend install-frontend

install-backend:
	cd backend && python -m venv .venv && .venv\Scripts\pip install -e ".[dev]"

install-frontend:
	cd frontend && npm install

# ── Development ──────────────────────────────────────────────────────────────

dev:
	@echo "Start backend and frontend in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

dev-backend:
	cd backend && .venv\Scripts\python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# ── Testing ──────────────────────────────────────────────────────────────────

test: test-backend test-frontend

test-backend:
	cd backend && .venv\Scripts\python -m pytest tests/ -v

test-frontend:
	cd frontend && npm test

# ── Smoke ────────────────────────────────────────────────────────────────────

smoke:
	cd backend && .venv\Scripts\python -m pytest tests/test_smoke.py -v

# ── Clean ────────────────────────────────────────────────────────────────────

clean:
	if exist backend\.venv rmdir /s /q backend\.venv
	if exist frontend\node_modules rmdir /s /q frontend\node_modules
	if exist frontend\.next rmdir /s /q frontend\.next
	if exist data rmdir /s /q data
