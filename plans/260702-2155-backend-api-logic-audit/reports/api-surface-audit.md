# API Surface Audit Report

Date: 2026-07-03

## Scope

- Backend FastAPI route modules under `src/api/`.
- Backend service adapters that touch Supabase, RAG, LLM, Braintrust, chat persistence, and adaptive learning state.
- Frontend API boundaries under `frontend/app/api`, `frontend/lib`, `frontend/stores`, and dashboard hooks/components that issue network calls.
- Static asset/data loaders for quizzes, guidebook content, and knowledge graph data.

## Applied API Rules

- Browser code must call same-origin Next.js/BFF endpoints for protected backend work.
- BFF proxy must preserve upstream status and streaming behavior while stripping browser cookies and hop-by-hop headers from backend requests.
- BFF proxy errors and Next route handler errors must include trace ids for log correlation and must use explicit unavailable/not-found status codes instead of vague `500` responses.
- Backend FastAPI routes must not use generic `500` responses or expose raw exception details in `HTTPException.detail`.
- Public readiness responses must not expose raw database/cache exception strings.
- Request validation responses/logs must not echo raw request bodies or invalid input values back to clients.
- Authenticated frontend calls must use a verified bearer token; fake demo tokens are rejected unless `NEXT_PUBLIC_DEMO_MODE=true`.
- Demo/mock data must be explicit. `NODE_ENV=development` no longer enables demo mode by itself.
- Mock benchmark endpoints and simulated mentor ingestion flows must be disabled by default and require explicit demo/dev opt-in.
- Supabase diagnostic pages must be disabled by default and require explicit opt-in.
- Explicit demo login must be able to enter the app without calling live onboarding APIs with fake tokens.
- Question APIs must use Supabase by default. Local JSON fallback is limited to explicit demo mode or tests.
- Backend production must not enter Supabase stub mode when secrets are missing or public keys are used for privileged adapters.
- Live auth must fail closed when user role lookup is unavailable; it must not silently default to a lower role.
- Live backend store failures must return explicit unavailable errors, not fake success payloads.
- Mutation endpoints must verify that the expected row was created, updated, or deleted when that is part of the contract.
- RAG/LLM provider failures must fail closed and return sanitized dependency errors.
- Client-side repeated calls should use in-flight deduplication or shared cached loaders where duplicate effects/practice starts can trigger the same request.
- Unused duplicate UI/API implementations should be removed instead of kept as ambiguous alternate runtime paths.
- Adaptive submit RPC must be callable only through backend service credentials and must keep hot question/bandit calibration out of the synchronous request transaction.
- Practice navigation and frontend API boundaries should have regression tests where runtime browser automation is not available.
- Deployed API boundaries should be smoke-tested with real frontend/backend URLs before release.

## Verified Surfaces

- `/api/v1/[...path]` Next.js BFF proxy: transparent proxy, sanitized headers, trace propagation, upstream status preservation.
- `/api/questions` and `/api/questions/[slug]`: Supabase-first behavior, explicit unavailable/not-found errors, no implicit local fallback in normal development.
- `/api/guidebook/[slug]`: allowlisted path scope and explicit unavailable/not-found errors.
- `/api/knowledge-graph`: Supabase-backed source, explicit unavailable response instead of empty success on dependency failure.
- `/api/v1/auth/*`: sanitized provider errors, business user sync failures surfaced, signup role assignment treated atomically.
- Live JWT verification: role-store failures now return an explicit `role_store_unavailable` response instead of silently treating the user as `student`.
- `/api/v1/chat` and chat stream: real token/user requirements, persistence failures surfaced, sanitized runtime/SSE errors.
- `/api/v1/adaptive/*`: auth preflight on frontend, backend dependency failures surfaced for bandit state, mastery, submit transactions, and graph relations.
- `app.submit_attempt_v3` SQL contract: latest migration revokes direct `authenticated/public` execution, grants `service_role`, keeps synchronous submit scoped to student-owned state plus append-only audit/outbox writes, and moves question/bandit calibration through `app.calibration_outbox`.
- `/api/v1/quiz/report`: verified bearer use, persistence failure handling, configurable local audit path for tests/dev.
- `/api/v1/surveys`: browser Supabase writes moved behind authenticated backend endpoints.
- `/api/v1/admin/braintrust/*`: encoded query params, shared error parsing, same-origin credentials, in-flight deduplication.
- Mentor RAG/audit endpoints: backend secret-key boundary and sanitized unavailable responses.
- Static quiz/guidebook/manifest fetches: shared cached loaders or in-flight deduplication where repeated UI paths can trigger duplicate requests.
- Practice app logo navigation: clicking the EduGap brand exits quiz mode and returns to the learning app tab.
- Frontend contract tests verify that the practice logo callback calls `handleExitQuiz()` and sets the active tab to `learn`, that demo mode requires `NEXT_PUBLIC_DEMO_MODE=true`, that the Next.js Supabase adapter remains read-only, and that the Supabase debug page requires explicit opt-in.
- Frontend contract tests verify the ZPD widget does not fall back to the seeded demo student UUID, requires logged-in user id/token before adaptive calls, and does not render auth/dependency failures as successful completion.
- Frontend contract tests also verify protected `/api/v1` call sites include same-origin credentials so auth/session behavior stays explicit across adaptive, chat, surveys, onboarding, quiz reports, mentor audit, profile, and Braintrust admin APIs.
- Frontend contract tests verify BFF header filtering for `host`, `accept-encoding`, `connection`, `content-length`, and `cookie`, request trace propagation via `x-request-id`, backend-unavailable `503` responses, and trace-bearing Next route handler errors for questions, guidebook, and knowledge graph APIs.
- Local runtime smoke test on `http://localhost:3100` with `NEXT_PUBLIC_DEMO_MODE=true` verified demo login reaches `/app`, starting practice opens `/app?set=day1-basics&mode=quiz`, and clicking the EduGap logo returns to `/app` with an empty query string and no quiz-question UI.
- `/api/v1/benchmark-caching`: unavailable in production and disabled by default in non-production unless `ENABLE_BENCHMARK_CACHING=true`; missing OpenAI configuration returns an explicit unavailable error.
- Mentor ingestion demo data: initial documents, graph relations, quiz-generation simulation, and upload simulation are gated by `NEXT_PUBLIC_DEMO_MODE=true`.
- Legacy `frontend/components/dashboard/socratic-chat-tab.tsx` was removed; the dashboard now has a single Socratic chat implementation through `frontend/components/dashboard/socratic-chat/`.
- Backend static contract tests now verify `src/api` routes do not reintroduce generic 500 responses or raw exception detail exposure.
- `/supabase-test` now requires `ENABLE_SUPABASE_TEST_PAGE=true`; frontend contract tests also block direct Supabase table writes from browser/source files.
- `scripts/smoke_live_api.py` provides a no-secrets live smoke check for `/health`, `/ready`, CORS preflight, BFF forwarding, fake/raw token rejection, and optional real Supabase token `/api/v1/auth/me`; token rejection checks only pass on `401` or `403`, so dependency `503` failures cannot be mistaken for valid auth rejection.
- `/ready` now logs dependency exceptions server-side but returns sanitized `database: "error"` or `cache: "error"` fields to clients.
- FastAPI request validation now returns sanitized field errors only; raw request bodies, invalid input values, and validation contexts stay out of 422 responses and logs.

## Intentional Demo/Test Boundaries

- Demo login, demo dashboard data, mentor sandbox mock data, and Socratic demo triggers remain available only when `NEXT_PUBLIC_DEMO_MODE=true`; local demo auth bypasses onboarding backend status checks instead of sending fake tokens to live onboarding APIs.
- Backend stub mode remains available only for non-production/local tests where backend Supabase configuration is intentionally absent.
- Local quiz JSON remains valid fixture data for explicit demo/test mode; it is no longer the default for normal local development.

## Residual Risk

- This audit is static plus automated unit/build validation, including SQL migration and frontend contract checks, plus a local demo browser smoke test for the practice-logo flow. It does not itself prove live Supabase permissions, real JWT issuance, deployed CORS, or browser interaction with a real Supabase account.
- Run `uv run python scripts/smoke_live_api.py` against the target environment with real frontend/backend URLs and, when available, `LIVE_SUPABASE_ACCESS_TOKEN` before merge/release.
