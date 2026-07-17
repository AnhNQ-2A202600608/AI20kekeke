# System Architecture

## Overview

EduGap is a split frontend/backend adaptive learning system. The browser and Next.js SSR layer own presentation, session cookies, app routing, and BFF proxying. The FastAPI backend owns protected business logic, RBAC, adaptive learning transactions, RAG orchestration, ingestion, and audit/observability proxies. Supabase is the primary data platform for auth, relational data, pgvector retrieval, RLS, and server-side RPCs.

## Runtime Topology

```text
-----------------------------+
| Browser / Student / Mentor |
+--------------+--------------+
               |
               v
+-----------------------------+
| Next.js 16 Frontend         |
| - App Router UI             |
| - Supabase SSR cookies      |
| - Publishable Key client    |
| - /api/v1 BFF proxy         |
+--------------+--------------+
               |
               v
+-----------------------------+        +-----------------------------+
| FastAPI Backend             | <----> | Redis Cache                 |
| - Auth/RBAC verification    |        | - Mastery/profile cache     |
| - Adaptive engine routes    |        | - Low-latency chat context  |
| - Chat/RAG SSE routes       |        +-----------------------------+
| - Onboarding sync           |
| - Braintrust proxy          |
| - Ingestion jobs            |
+--------------+--------------+
               |
               v
+-----------------------------+        +-----------------------------+
| Supabase Platform           | <----> | AI Providers / Observability|
| - Supabase Auth             |        | - OpenAI / Gemini           |
| - PostgreSQL 17             |        | - LangGraph / LangChain     |
| - pgvector HNSW search      |        | - Braintrust                |
| - RLS and RPC functions     |        +-----------------------------+
| - app/audit schemas         |
+-----------------------------+
```

## Technology Stack

| Layer | Current Choice | Notes |
| --- | --- | --- |
| Frontend | Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4 | App Router, SSR, BFF proxy, Fumadocs docs site, dense app workspace UI. |
| Frontend auth/session | `@supabase/ssr`, `@supabase/supabase-js` | Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; stores sessions through SSR-compatible cookies. |
| Backend API | FastAPI, Uvicorn, Python 3.13, Pydantic v2 | `/api/v1/*` router surface, SSE chat, health/ready probes. |
| AI orchestration | LangGraph, LangChain, OpenAI, Gemini | Intent routing, RAG retrieval, Socratic response generation, streaming tool events. |
| Adaptive learning | Elo, BKT, LinUCB, graph propagation, stability days | Server-side recommendation and submission contracts. |
| Data platform | Supabase PostgreSQL 17 + pgvector | Relational data, vector chunks, RLS, app/audit schemas, RPC transactions. |
| Cache | Redis with in-memory fallback | Production cache uses Redis; local/stub execution can fall back to memory. |
| Deployment | Next.js frontend, Render Docker FastAPI, Render Redis, Supabase hosted DB | `render.yaml` currently defines backend/Redis with manual secret injection. |

## Component Responsibilities

### Next.js Frontend

- Renders landing, login, onboarding, student app, dashboard, quiz, profile, mentor/admin, and docs surfaces.
- Uses Supabase Publishable Key for browser and SSR session handling.
- Protects client routing: unauthenticated users should stay on public landing/login routes instead of entering `/app`.
- Proxies frontend `/api/v1/*` requests to FastAPI through `frontend/app/api/v1/[...path]/route.ts`.
- Keeps demo/local fallback behavior behind `NEXT_PUBLIC_DEMO_MODE`.
- Owns design system implementation: Tailwind 4 tokens, tactile components, asset masks/icons, and app sizing baseline.

### FastAPI Backend

- Verifies Supabase JWTs and resolves RBAC roles from database state.
- Rejects raw UUID bearer tokens, fake demo tokens, missing auth, expired JWTs, and public Supabase keys in live mode.
- Uses `SUPABASE_SECRET_KEY` for server-only app/audit schema access.
- Serves adaptive recommendation, submit, mastery, graph relation, onboarding, auth, chat, ingestion, quiz report, and audit endpoints.
- Executes adaptive submit through atomic Supabase RPCs where available, including server-side grading, replay protection, Elo/BKT updates, LinUCB reward, and cache write-through.
- Streams Socratic chat over SSE and emits status/tool/token events.
- Proxies Braintrust observability for admin/BTC users without exposing Braintrust credentials to the browser.

### Supabase Platform

- Supabase Auth is the production identity provider.
- PostgreSQL stores users, roles, courses, concepts, questions, attempts, mastery, chat sessions/messages, feedback, onboarding state, audit decisions, rewards, and material chunks.
- `pgvector` stores embeddings in PostgreSQL, so no separate vector database is required.
- RLS policies limit direct access; privileged backend mutations use server-only keys and route-level RBAC.
- Publishable Key is allowed only for public/SSR client behavior governed by RLS and Supabase Auth session.

### AI and RAG Services

- RAG retrieval reads approved material chunks and returns citations tied to course sources.
- LangGraph runs analysis, tool routing, response generation, and long-term memory updates.
- Prompt caching and fast-path responses reduce latency for general or repeated chat cases.
- Braintrust records traces, timing, scores, errors, and cost/latency groups for BTC/admin review.

## Core Data Model

| Entity | Purpose |
| --- | --- |
| Users / Roles | Supabase Auth identity plus app roles: student, mentor, admin, btc, dev. |
| Courses / Concepts | Course structure, concept graph, and day/program mapping. |
| Course Materials / Chunks | Uploaded documents, slide metadata, published status, citations, and embeddings. |
| Questions / Hints | Quiz bank with MCQ, numeric, short-answer, explanations, and Socratic hints. |
| Student Mastery | Per-student concept Elo, BKT probability, mastery state, weakness flag, stability days, bitemporal history. |
| Adaptive Decisions | LinUCB recommendation trace, selected action, candidate set, expected success/reward, replay state. |
| Quiz Attempts / Rewards | Submission history, grading result, hint usage, Elo/BKT deltas, bandit reward. |
| Chat Sessions / Messages | Conversation history, mode, citations, validation metadata, and tutor responses. |
| Feedback Events | Quiz/report/citation feedback and user error reports. |
| Onboarding State | Diagnostic answers, recommendations, and completion state synced to backend. |

## Key Flows

### Auth and App Entry

1. Public user lands on `/` or `/login`.
2. Login uses Supabase Auth email/password and stores the session through Supabase SSR-compatible cookies.
3. Next.js app gate checks auth state. Guests redirect to public landing/login; authenticated users continue to onboarding or `/app`.
4. FastAPI protected routes require `Authorization: Bearer <Supabase JWT>`.
5. Backend validates the JWT, resolves app role, then enforces route-level RBAC.

### Onboarding

1. Authenticated students enter `/onboarding` when backend/local state says onboarding is incomplete.
2. The survey collects fixed diagnostic answers first, then writes completion data through backend onboarding endpoints.
3. Demo mode can complete locally, but production completion must be synced to backend and retried if sync fails.
4. `/app` becomes available only after auth and onboarding gate conditions are satisfied.

### Adaptive Quiz and Mastery Update

1. Student requests a recommendation for a course/concept.
2. Backend loads mastery, candidate questions, and LinUCB policy state.
3. Backend logs an adaptive decision and returns the selected question with expected success.
4. Student submits an answer. Backend verifies the decision belongs to the authenticated user and has not been consumed.
5. Backend grades server-side, calls `submit_attempt_v3`, updates Elo/BKT/stability days, writes bandit reward, marks replay consumed, and updates cache.
6. Background graph propagation updates related concept mastery after the main transaction.

### Socratic RAG Chat

1. Student sends a chat request with mode, course, and optional concept context.
2. Backend loads cached mastery/profile or falls back to Supabase.
3. Fast-path routing handles simple general/practice clarifications without unnecessary RAG.
4. LangGraph analyzes intent, retrieves sources where needed, and streams status, tool calls, tool results, and response tokens.
5. Response metadata includes citations, validation, timings, and session identifiers.

### Mentor/Admin Operations

1. Mentor/Admin routes require backend role checks.
2. Ingestion jobs run as backend background tasks and update Supabase materials/chunks/questions.
3. BTC/Admin Braintrust panels call backend proxy endpoints; browser never receives Braintrust secrets.
4. Audit routes expose adaptive decisions/rewards only to admin/dev roles.

## Deployment Architecture

- Frontend: Next.js deployment with `BACKEND_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Backend: Render Docker web service running FastAPI/Uvicorn with `/health` and `/ready`.
- Backend production data access: `SUPABASE_URL` + `SUPABASE_SECRET_KEY`; `SUPABASE_KEY` is only a deprecated migration alias.
- Cache: Render Redis via `REDIS_URL` and `CACHE_TYPE=redis`.
- Database: Supabase hosted PostgreSQL 17 with app/audit schemas, RLS, pgvector, migrations, and RPC functions.
- CORS: `CORS_ORIGINS` must list the actual frontend origin.

## Security Considerations

- Treat Supabase Auth JWT as the only live identity credential.
- Never trust frontend `student_id`, role, persona, or local storage as authority.
- Browser and SSR clients may use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; backend app/audit adapters must use `SUPABASE_SECRET_KEY`.
- Do not enable `AUTH_ALLOW_DEV_TOKENS` or `NEXT_PUBLIC_DEMO_MODE` against production data.
- Protected backend routes verify JWT locally through Supabase JWKS when possible, then fall back to Supabase Auth `get_user`.
- Mentor/BTC/admin dashboards must use backend data or explicit empty/demo states, not silent mock data.
- Uploaded material, citations, and RAG retrieval must stay scoped to approved course sources.
- Internal prompts, Braintrust keys, OpenAI/Gemini keys, Supabase secret keys, and Redis URLs are server-only secrets.
- Academic-integrity guardrails should return hints and reasoning prompts, not direct lab or assignment completion.
