# Code Standards

## Overview

This project prioritizes simple, maintainable implementation for an Adaptive-first AI Tutor. Code should support the MVP directly and avoid speculative abstractions.

## Core Principles

- KISS: choose the simplest implementation that works.
- DRY: extract shared logic when duplication becomes real.
- YAGNI: do not build future-phase features before MVP needs them.
- Security-first at boundaries: validate user input, uploaded files, auth, API calls, and AI outputs.

## File Organization

- Prefer descriptive kebab-case filenames where the language ecosystem allows it.
- Keep code files under 200 lines where practical.
- Split large files by responsibility: UI component, service, route/controller, utility, schema/model.
- Do not create parallel "enhanced" files; update the existing implementation directly.

## Documentation Expectations

- Keep `docs/` updated when architecture, scope, CI/CD, or major behavior changes.
- Update `JOURNAL.md` before each PR per README.
- Update `WORKLOG.md` for technical decisions, direction changes, task assignments, brainstorm conclusions, or important bugs.

## Git and PR Standards

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Keep commits focused.
- Do not include AI references in commit messages.
- Do not commit secrets, `.env`, API keys, private keys, or credentials.
- PRs should explain scope, validation, AI Tutor fit, and CI/CD impact.

## Testing Standards

- Add or update tests for changed behavior when the project stack supports tests.
- Cover happy path and at least one failure or edge case for meaningful logic.
- Do not use fake shortcuts just to pass CI.
- Run available compile/typecheck/test commands before marking implementation complete.
- For frontend shared behavior, run `cd frontend && npm run lint` and `cd frontend && npx tsc --noEmit` before handoff.
- For protected backend/auth/adaptive behavior, run focused `python -m pytest tests/...` first, then broaden when public contracts changed.

## AI and RAG Standards

- RAG answers must cite official course sources when retrieval is used.
- Broad/global RAG fallback must be opt-in through configuration and represented in retrieval cache keys.
- RAG provider/config/RPC failures must be surfaced as unavailable errors; only successful `200` retrievals with no rows should be treated as valid empty results.
- LLM calls must fail closed when provider keys are missing outside tests or an explicit local `LLM_ALLOW_MOCK=true` flag.
- Tutor behavior should be Socratic: guide reasoning, avoid direct homework completion.
- Academic integrity guardrails must switch to explanation, method hints, or guiding questions.
- AI grading outputs should be bounded and validated before affecting mastery data.

## UI Standards

- Follow `docs/product/design-guidelines.md` as the source of truth for color, typography, spacing, sizing, tactile controls, accessibility, and asset usage.
- Use the active `/app` workspace density as the baseline. Primary app-like pages should fit one viewport where possible and avoid oversized marketing scales.
- Default button sizing: `min-h-10` or `min-h-11`, `text-xs`/`text-sm`, `px-3`/`px-4`. Avoid defaulting to `min-h-12` unless the control is intentionally prominent.
- Default card/panel sizing: `rounded-xl`/`rounded-2xl`, `p-3`/`p-4`, `gap-2` to `gap-4`. Avoid broad use of `rounded-[28px]`, `p-6`, and `py-16 md:py-20`.
- Use Tailwind 4 theme tokens from `frontend/app/globals.css`: cozy background, green/yellow/orange/blue/red state colors, gray borders, Be Vietnam Pro body font, Fraunces headings.
- Use project assets from `frontend/public/brand`, `frontend/public/app-backgrounds`, `frontend/public/learning-scenery`, `frontend/public/learning-seeds`, `frontend/public/learning-soils`, and mascot folders instead of generic stock-like visuals.
- Preserve maskable icon assets under `frontend/public/brand/mentora/` and keep PWA/browser icon references aligned with the brand package.
- Use accessible contrast, visible focus states, labels beyond color-only state, and `prefers-reduced-motion` fallbacks for animated learning UI.
- Reflect mastery states consistently: mastered, learning, weak, not started.
- Show loading, retry, empty, unauthorized, and offline/demo states for AI or protected backend work.
- Avoid UI patterns that obscure citations, guardrail reasons, or primary quiz/app actions.

## Frontend Auth and Data Standards

- Browser and Next SSR Supabase clients use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Do not introduce frontend fallbacks to raw UUID bearer tokens or fake JWTs for live backend calls.
- Shared frontend API helpers must reject `fake-jwt-token-*` outside explicit demo mode; individual call sites should not forward raw store tokens directly.
- Route guests to public landing/login surfaces; do not let unauthenticated users enter `/app`.
- Demo behavior must be explicit through `NEXT_PUBLIC_DEMO_MODE` and must not be presented as live production data.
- Query-param mock loaders such as `?mock=true` must be ignored outside explicit demo mode.
- Client-side simulated pipelines and seeded mentor data must not mutate visible state outside explicit demo mode.
- Local JSON question data may support explicit demo/test mode, but normal question APIs must use Supabase or fail with an explicit unavailable/not-found status.
- The frontend may pass IDs for context, but backend routes must derive authority from the verified token.
- Next.js API adapters that use public Supabase keys should be read-only and expose narrow methods instead of raw schema clients.
- Frontend data mutations such as surveys, reports, and adaptive submissions should go through authenticated `/api/v1` routes, not browser Supabase table writes.
- Feedback/report APIs must return unavailable errors when live persistence fails; local audit files or logs are not a substitute for a successful API mutation.

## Backend and Supabase Standards

- Backend Supabase adapters use `SUPABASE_SECRET_KEY`; public, publishable, anon, and `NEXT_PUBLIC_*` keys must not be accepted for app/audit schema access.
- Keep `SUPABASE_KEY` only as a deprecated migration alias while production environments move to `SUPABASE_SECRET_KEY`.
- Do not allow production to fall back to Supabase stub mode; missing backend Supabase secrets should fail closed.
- Do not expose benchmark/debug endpoints that use mock contexts or provider calls in production.
- Benchmark/debug endpoints that use mock contexts must also be disabled by default outside production and require an explicit opt-in flag.
- Supabase diagnostic pages that query test tables must be disabled by default and require an explicit opt-in flag.
- Admin/audit endpoints must not fabricate rows in stub mode; return an empty real state or an explicit unavailable error when the live audit store fails.
- Mentor audit/sandbox endpoints must not expose raw exception strings; RAG, embedding, and audit-store runtime failures should return sanitized unavailable errors.
- Protected live routes accept only Supabase JWTs. Raw UUID tokens, fake demo tokens, and missing auth fail closed unless `AUTH_ALLOW_DEV_TOKENS=true` is intentionally enabled for local/stub execution.
- Live JWT authentication must not silently downgrade users when `user_roles` cannot be read; return an explicit unavailable error and let clients retry.
- Signup must persist Auth, app user, and role assignment as one logical operation; never hardcode role ids or return success after a partial identity write.
- Auth provider errors should log internal details server-side but return sanitized user-safe messages from public auth endpoints.
- Auth business-store failures and Next.js route handler dependency/config failures should return explicit unavailable errors instead of generic 500 responses.
- Request validation responses should include field errors but must not echo raw request bodies, invalid input values, or validation contexts.
- Chat/adaptive personalization must not silently replace failed mastery/profile reads with default learner data when request context identifies a real student/course/concept.
- Adaptive recommendation and submission must not default bandit state, hint counts, or AI-usage signals when the backing store fails; return explicit unavailable errors so learning metrics remain auditable.
- Adaptive submission RPCs must return an affected result; empty transaction results are dependency failures, not successful submissions.
- Adaptive mastery, sync, and concept-graph routes should treat live store failures as unavailable errors and keep not-found/user-input errors distinct.
- Chat session, history, message, and student-memory persistence must not invent fallback IDs or silently drop DB failures on live requests; return explicit unavailable errors so clients can retry.
- Chat runtime/agent failures should log internal exception details server-side but return sanitized retryable API/SSE errors to clients.
- Mutation routes that create, update, or delete records must verify the backend affected the expected row when the contract expects one; empty write results are errors, not success.
- Protected read endpoints should return explicit unavailable errors on live store failures instead of leaking raw infrastructure exceptions.
- Public health/readiness endpoints should log dependency details server-side and return sanitized status codes/fields to clients.
- Prefer server-side grading, server-side hint counting, server-side replay protection, and atomic RPCs for adaptive submissions.
- Return explicit `401`, `403`, `409`, and `503` errors for auth, RBAC, replay, and Supabase permission failures instead of masking them as generic success states.
