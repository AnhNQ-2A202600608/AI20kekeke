# Deployment Guide

## Overview

EduGap deploys as a split web application:

- Next.js frontend: serves the public landing, login, onboarding, app workspace, docs, and BFF proxy.
- FastAPI backend: serves `/api/v1/*`, adaptive learning, chat/RAG streaming, onboarding sync, ingestion, audit, and admin observability.
- Supabase: hosted Auth, PostgreSQL 17, pgvector, RLS, and RPC functions.
- Redis: production cache for mastery/profile and low-latency chat context.

## Runtime Services

| Service | Runtime | Purpose |
| --- | --- | --- |
| Frontend | Next.js 16 / Node.js | UI, SSR, Supabase cookie session handling, BFF proxy. |
| Backend | FastAPI / Python 3.11 / Docker | Protected API, RBAC, adaptive transactions, RAG/agent orchestration. |
| Database | Supabase PostgreSQL 17 | App/audit schemas, Supabase Auth, pgvector, RLS, RPC. |
| Cache | Redis | Production profile/mastery cache and latency reduction. |
| AI/Observability | OpenAI, Gemini, Braintrust | Tutor generation, embeddings/LLM calls, trace/cost/latency review. |

## Frontend Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by browser and SSR clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase Publishable Key for browser/SSR clients governed by Supabase Auth and RLS. |
| `BACKEND_API_URL` | Yes in deployed frontend | FastAPI origin used by `frontend/app/api/v1/[...path]/route.ts`. Defaults to `http://127.0.0.1:8000` locally. |
| `NEXT_PUBLIC_DEMO_MODE` | No | Enable only for isolated demo/local mode. Do not enable against production data. |
| `NEXT_PUBLIC_SUPABASE_URL_DEV` / `_PROD` | Optional | Legacy/convenience fallbacks used by some frontend helpers. Prefer the canonical variable above. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_DEV` / `_PROD` | Optional | Legacy/convenience fallbacks. Prefer the canonical variable above. |

Frontend commands:

```bash
cd frontend
pnpm install
pnpm dev
npm run lint
npx tsc --noEmit
npm run build
```

## Backend Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_ENV` | Yes | `development`, `test`, or `production`. |
| `CORS_ORIGINS` | Yes | Comma-separated frontend origins. Must include the deployed frontend URL. |
| `SUPABASE_URL` | Yes | Supabase project URL for backend server-side access. |
| `SUPABASE_SECRET_KEY` | Yes | Server-only Supabase `sb_secret_...` key. Required for app/audit schema adapters. |
| `SUPABASE_KEY` | Deprecated | Migration alias only. Remove after environments use `SUPABASE_SECRET_KEY`. |
| `DATABASE_URL` | Optional/operational | Direct Postgres URL for scripts or DB tooling when needed. |
| `CACHE_TYPE` | Production: `redis` | Use Redis in production; local/stub can use in-memory fallback. |
| `REDIS_URL` | Production yes | Redis connection string. |
| `OPENAI_API_KEY` | When OpenAI paths enabled | LLM/chat/embedding provider key. |
| `GEMINI_API_KEY` | When Gemini paths enabled | Gemini provider key. |
| `BRAINTRUST_API_KEY` / project vars | When observability enabled | Server-only Braintrust access for admin proxy. |
| `AUTH_ALLOW_DEV_TOKENS` | Local only | Allows raw UUID/fake/service_role dev tokens only for local/stub execution. Never enable for production data. |
| `LLM_ALLOW_MOCK` | Local tests only | Allows the backend to use the mock LLM when provider keys are missing. Keep unset in production. |
| `RAG_ENABLE_GLOBAL_FALLBACK` | Optional, default false | Enables broad global slide retrieval when concept-scoped retrieval is weak. Leave unset unless the wider source scope is intentional. |
| `QUIZ_REPORT_AUDIT_PATH` | Optional, default `outputs/quiz_reports.jsonl` | Local audit sink for quiz report submissions; tests should point this at a temp file. |

Backend commands:

```bash
uv pip install -r requirements.txt
uv run uvicorn src.main:app --reload --port 8000
python -m pytest
```

Render backend note:

- Docker currently installs backend dependencies from `requirements.txt`.
- Keep `requirements.txt` and `pyproject.toml` aligned for runtime dependencies; `uv.lock` alone does not control the Render Docker build.

Live API smoke check after deploying frontend and backend:

```bash
FRONTEND_BASE_URL=https://your-frontend.example.com \
BACKEND_BASE_URL=https://your-backend.example.com \
LIVE_SMOKE_CORS_ORIGIN=https://your-frontend.example.com \
uv run python scripts/smoke_live_api.py
```

To verify a real Supabase login end to end, add a short-lived user access token:

```bash
LIVE_SUPABASE_ACCESS_TOKEN=eyJ... \
FRONTEND_BASE_URL=https://your-frontend.example.com \
BACKEND_BASE_URL=https://your-backend.example.com \
uv run python scripts/smoke_live_api.py
```

The smoke check verifies backend `/health` and `/ready`, backend CORS preflight, frontend BFF forwarding, fake-token rejection, raw UUID token rejection, and optional real-token `/api/v1/auth/me`. Fake/raw token checks only pass on `401` or `403`; `503` means the dependency path is unhealthy and must be fixed before release.

## Render Backend

`render.yaml` defines:

- `c2-app-backend`: Docker web service in Singapore with `/health` health check.
- `c2-app-redis`: Redis service for cache/rate-limiting paths.
- Manual secret injection for Supabase, model provider keys, and CORS.

Current `render.yaml` still declares the backend and Redis plans as `free`. If the project moves to a stronger paid/server plan, update `render.yaml` and this guide together so the documented target matches infrastructure as code.

Backend readiness endpoints:

- `GET /health`: basic process health and environment.
- `GET /ready`: checks Supabase adapter state and cache availability; returns sanitized `503` fields when a critical dependency is unavailable.

## Keep-Awake Workflow

Repository includes [keep-awake.yml](</D:/Project/Vin_AI/000 Group Project/C2-App-125/.github/workflows/keep-awake.yml:1>) to reduce Render cold starts by pinging deployed URLs on a schedule.

Workflow behavior:

- Runs every 15 minutes via GitHub Actions `schedule`.
- Always pings backend `GET /health`.
- Can also be triggered manually from the GitHub Actions tab via `workflow_dispatch`.

Required GitHub repository secrets:

| Secret | Required | Example | Notes |
| --- | --- | --- | --- |
| `RENDER_APP_URL` | Yes | `https://c2-app-backend.onrender.com` | Base backend URL. Workflow appends `/health` automatically. |

Setup steps:

1. Push `.github/workflows/keep-awake.yml` to the default branch used by GitHub Actions scheduling.
2. Open GitHub repository `Settings -> Secrets and variables -> Actions`.
3. Create `RENDER_APP_URL` with the production Render backend URL only, without `/health`.
4. Open the `Keep Services Awake` workflow in the Actions tab and use `Run workflow` once to verify the secret and URL.

Notes:

- GitHub scheduled workflows are best-effort and may run a few minutes late under load.
- This reduces cold starts but does not guarantee zero cold starts on free or sleeping infrastructure.
- If scheduled workflows stop running, confirm the repository still has Actions enabled and has not had schedules auto-disabled after long inactivity.

## Supabase Key Boundary

Use the strongest key appropriate to the execution surface:

| Surface | Key | Reason |
| --- | --- | --- |
| Browser client | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public key scoped by Supabase Auth/RLS. |
| Next.js SSR client | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase SSR session refresh and cookie handling; still public/RLS-scoped. |
| FastAPI backend | `SUPABASE_SECRET_KEY` | Server-only app/audit schema access, RPC execution, and privileged reads/writes. |
| Migrations/scripts | `DATABASE_URL` or service/secret credentials | Operational DB changes; never commit credentials. |

Backend code intentionally rejects publishable/anon keys for privileged app/audit adapters. Do not copy `NEXT_PUBLIC_*` keys into backend secret variables.
When `APP_ENV=production`, backend Supabase stub mode is disabled: missing `SUPABASE_URL` or `SUPABASE_SECRET_KEY` must fail deployment instead of serving mock/stub data.

## Production Checklist

- Frontend has `BACKEND_API_URL` pointing to the deployed FastAPI origin.
- Backend `CORS_ORIGINS` includes the deployed frontend origin and local origins only when intended.
- `SUPABASE_SECRET_KEY` is configured on backend; `SUPABASE_KEY` is removed or left only as temporary migration alias.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is configured on frontend.
- `AUTH_ALLOW_DEV_TOKENS` is unset/false in production.
- `LLM_ALLOW_MOCK` is unset/false in production, and either `OPENAI_API_KEY` or `OPENROUTER_API_KEY` is configured.
- `NEXT_PUBLIC_DEMO_MODE` is unset/false for production data.
- `RAG_ENABLE_GLOBAL_FALLBACK` is unset/false unless broad retrieval outside the selected concept/day is an accepted product behavior.
- Quiz pre/post survey and waitlist writes go through authenticated `/api/v1/surveys` and require backend `SUPABASE_SECRET_KEY`.
- `/api/questions*` returns Supabase-backed data by default; local JSON fallback is limited to explicit demo/test mode.
- Internal benchmark/debug routes and pages return unavailable/not-found in production.
- Redis is attached and `CACHE_TYPE=redis`.
- Supabase migrations and RPC grants are applied.
- `/health` and `/ready` pass after deployment.
- `uv run python scripts/smoke_live_api.py` passes against the deployed frontend/backend.
- Frontend lint/typecheck/build pass before release.
- Backend focused tests pass for auth, onboarding, adaptive submit/recommend, and RAG/chat routes touched by the release.

## Secret Handling

- Never commit `.env`, Supabase secret keys, provider API keys, Redis URLs, Braintrust credentials, private keys, or personal data.
- Keep public Supabase publishable keys only in `NEXT_PUBLIC_*` variables.
- Keep AI provider and Braintrust credentials server-side.
- Rotate any key that has appeared in committed config, logs, screenshots, or shared prompts.

## Troubleshooting

| Symptom | Likely Cause | Check |
| --- | --- | --- |
| Frontend BFF returns `503 backend_unavailable` | `BACKEND_API_URL` wrong or backend down | Verify frontend env, response `trace_id`, and backend `/health`. |
| Protected API returns `401` after login | Missing/expired Supabase JWT or fake/raw token sent to live backend | Inspect Authorization header and Supabase session refresh. |
| Adaptive submit returns `503` permission issue | Backend using wrong Supabase key or RPC grants missing | Confirm `SUPABASE_SECRET_KEY` and function grants. |
| Adaptive recommend/submit returns `Kho dữ liệu adaptive hiện không sẵn sàng` | Bandit, question-link, hint, or AI-usage signal store is unavailable | Check app/audit schema grants for `bandit_arms`, `question_concepts`, `learning_signals`, and `chat_messages`. |
| Adaptive mastery/sync/graph endpoints return unavailable errors | App schema mastery or concept graph store is unavailable | Check app schema grants for `active_student_mastery`, `student_mastery`, `concepts`, and `concept_relations`. |
| Signup returns `Hệ thống vai trò chưa sẵn sàng` or `Không thể gán vai trò` | `roles.code='student'` missing or `user_roles` insert failed | Check seeded roles, app schema grants, and cleanup logs for partial Auth users. |
| Auth works locally but fails in production | `AUTH_ALLOW_DEV_TOKENS` masked local behavior | Test with real Supabase JWT only. |
| App enters demo state unexpectedly | `NEXT_PUBLIC_DEMO_MODE=true` | Disable for production deployments. |
| RAG returns sources outside the selected concept/day | `RAG_ENABLE_GLOBAL_FALLBACK=true` or stale retrieval cache | Disable the flag unless desired; cache keys include fallback flags for new entries. |
| Chat or RAG audit returns LLM provider unavailable | Provider API keys missing and mock LLM disabled | Configure `OPENAI_API_KEY` or `OPENROUTER_API_KEY`; do not enable `LLM_ALLOW_MOCK` in production. |
| RAG audit returns `Kho học liệu RAG hiện không sẵn sàng` | Supabase RAG config/RPC is unavailable | Check `SUPABASE_SECRET_KEY`, `slide_embeddings`, and `match_slides` grants. |
| RAG sandbox or mentor audit endpoints return unavailable errors | Audit store, concept tables, embeddings, or LLM runtime failed | Check backend Supabase secret, app/public schema grants, provider keys, and server logs for sanitized internal details. |
| Survey submission logs `Không thể lưu khảo sát` | Backend Supabase secret or `public.surveys` access is unavailable | Check `/api/v1/surveys`, `SUPABASE_SECRET_KEY`, and table grants/schema. |
| Chat returns `Không thể tải hồ sơ học tập` | Mastery/profile read failed for a contextual chat request | Check Supabase app schema access and mastery rows for the requested student/course/concept. |
| Chat returns `chat_persistence_unavailable` or `Không thể tải hoặc lưu phiên chat` | Chat session/history/message/memory tables are unavailable or grants are missing | Check backend Supabase app schema access for `chat_sessions`, `chat_messages`, and `student_memories`. |
| Question APIs return `questions_unavailable` | Supabase question/concept read failed and local JSON fallback is disabled outside explicit demo/test mode | Check Supabase env, RLS/API grants, and response `trace_id`. |
| Question or guidebook route handlers return unavailable errors | Supabase data, local manifest, or knowledge files are unavailable for the current mode | Check `quiz-manifest.json`, `public/quizzes`, `knowledge/`, and production demo fallback settings. |
| Student activity/session endpoints return `503` or graph relation delete returns `404` | Live app schema read/delete did not affect the expected data | Check app schema grants, requested IDs, and whether the relation/session rows exist. |
| Cache status is `in_memory` on `/ready` | Redis not attached or `CACHE_TYPE` not set | Check `REDIS_URL` and Render Redis service. |
