# VAIC Universal Starter

A domain-neutral full-stack starter template for VAIC competitions. Not tied to any specific problem type — works for AI agents, data analysis, optimization, document processing, and more.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 22+
- npm 10+

### 1. Clone & Install

```bash
git clone <repo-url>
cd AI20kekeke

# Backend
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\pip install -e ".[dev]"
# Linux/Mac:
# .venv/bin/pip install -e ".[dev]"
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Run

```bash
# Terminal 1: Backend
cd backend
.venv\Scripts\python -m uvicorn src.api.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

### 3. Test

```bash
cd backend
.venv\Scripts\python -m pytest tests/ -v
```

## Architecture

```
frontend/  → Next.js + TypeScript UI
backend/   → FastAPI + Python API
  src/
    api/           → HTTP routes
    core/          → Config, logging, errors
    models/        → Response envelopes
    storage/       → File, run, artifact storage
    capabilities/  → Pluggable processing units
    services/      → Business logic orchestration
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/ready` | Readiness check |
| GET | `/api/v1/capabilities` | List registered capabilities |
| POST | `/api/v1/files` | Upload a file |
| GET | `/api/v1/files/{id}` | Get file metadata |
| POST | `/api/v1/runs` | Create and execute a run |
| GET | `/api/v1/runs/{id}` | Get run status |
| GET | `/api/v1/artifacts/{id}` | Get artifact content |

## Adding a New Capability

1. Create `backend/src/capabilities/your_capability.py`
2. Implement `BaseCapability` (name, description, execute)
3. Register in `backend/src/api/main.py`

No AI/ML dependencies are assumed. Add what your problem requires.

## Environment Variables

See `.env.example` for all available settings. No API keys required for development.
