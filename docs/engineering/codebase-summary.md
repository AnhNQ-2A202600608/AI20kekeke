# Codebase Summary

## Overview

EduGap is an Adaptive-first Socratic Tutor for higher education. The repository now contains a production-shaped web application: a Next.js frontend, a FastAPI backend, Supabase PostgreSQL with pgvector/RLS, adaptive learning algorithms, RAG chat, onboarding, auth, and mentor/admin observability surfaces.

## Current Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, Zustand, Fumadocs, Recharts, Chart.js, XYFlow |
| Frontend Auth | Supabase SSR via `@supabase/ssr` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Backend | FastAPI, Python 3.13, Pydantic v2, Uvicorn |
| AI / Agent | LangGraph, LangChain, OpenAI, Gemini, Braintrust observability |
| Database | Supabase PostgreSQL 17, pgvector, RLS policies, app/audit schemas |
| Adaptive Engine | Elo, BKT, LinUCB bandit, graph propagation, forgetting/stability days |
| Cache | Redis in production, in-memory fallback for local/stub execution |
| Deployment | Vercel-style Next.js frontend, Render Docker FastAPI backend, Render Redis, Supabase hosted database |

## Current Structure

| Path | Purpose |
| --- | --- |
| `frontend/app/` | Next.js App Router pages, layouts, BFF API proxy, docs routes, onboarding/login/app entry points. |
| `frontend/components/` | App workspace, learning path, landing, onboarding, dashboard, quiz, mascot, and UI components. |
| `frontend/lib/` | Supabase client, auth token helpers, adaptive engine client, onboarding contracts/storage, quiz data utilities. |
| `frontend/utils/supabase/` | Supabase SSR server and middleware clients using publishable key and cookie session refresh. |
| `frontend/public/` | Brand, maskable icons, learning scenery, app backgrounds, mascot assets, quiz manifests. |
| `src/api/` | FastAPI route modules for auth, adaptive engine, onboarding, admin Braintrust proxy, chat, ingestion, and audit. |
| `src/services/` | RAG, LLM, cache, Supabase config, auth JWT verification, Braintrust, chat optimization, adaptive services. |
| `src/agents/` | LangGraph tutor graph, nodes, tools, and state. |
| `src/pipeline/` | LMS/slide ingestion, document conversion, Graphusion concept extraction, Supabase initialization. |
| `db/supabase/migrations/` | Supabase schema, RLS, RPC, adaptive engine, feedback, onboarding, and stability-day migrations. |
| `tests/` | Backend API, adaptive, auth, RAG, and production-readiness tests. |
| `docs/` | Engineering, product, guide, research, domain knowledge, diagrams, and journals. |
| `plans/` | Implementation plans, reports, and scoped work context. |

## Product Capabilities

- Public landing, login, authenticated app shell, and onboarding gate.
- Student app workspace with 28-day learning path, day focus, mastery seed/soil visuals, practice sets, and profile progress.
- Adaptive quiz loop with ZPD question recommendation, server-side grading, Elo/BKT update, LinUCB reward, and replay protection.
- Socratic RAG chat with streaming SSE, intent routing, citations, tool-call events, and cache-aware student profile loading.
- Mentor/BTC surfaces for ingestion, quiz review, class insights, RAG audit, and Braintrust observability.
- Supabase Auth-based email/password login with backend RBAC for student, mentor, admin, btc, and dev roles.

## Security Baseline

- Live backend identity is Supabase JWT only; raw UUID tokens and fake demo tokens fail closed unless `AUTH_ALLOW_DEV_TOKENS=true` is explicitly enabled.
- Frontend uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser and SSR clients. Backend app/audit adapters require `SUPABASE_SECRET_KEY` and reject publishable/anon keys.
- Next.js BFF proxy forwards `/api/v1/*` calls to FastAPI without exposing backend internals to browser code.
- Demo mode is explicitly gated by `NEXT_PUBLIC_DEMO_MODE`; do not connect demo bypasses to production data.
- RBAC is enforced at backend route boundaries, not by trusting frontend role, `student_id`, persona, or local storage.

## Development Commands

| Area | Command |
| --- | --- |
| Backend install | `uv pip install -r requirements.txt` |
| Backend dev | `uv run uvicorn src.main:app --reload --port 8000` |
| Backend tests | `python -m pytest` |
| Frontend install | `cd frontend && pnpm install` |
| Frontend dev | `cd frontend && pnpm dev` |
| Frontend lint | `cd frontend && npm run lint` |
| Frontend typecheck | `cd frontend && npx tsc --noEmit` |
| Frontend build | `cd frontend && npm run build` |

## Documentation Notes

- Product and design direction lives in `docs/product/`.
- Engineering architecture, standards, and deployment live in `docs/engineering/`.
- Research and algorithm notes live in `docs/research/` and `docs/domain-knowledge/`.
- Journals under `docs/journals/` record important implementation sessions and behavioral changes.
