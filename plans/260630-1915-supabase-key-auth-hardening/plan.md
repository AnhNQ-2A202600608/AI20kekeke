---
title: Supabase Key Migration And Auth Verification Hardening
description: >-
  Standardize Supabase publishable/secret key usage, remove backend public-key
  fallbacks, and reduce per-request Auth latency while preserving the real JWT
  boundary.
status: completed
priority: P1
branch: codex/adaptive-first-frontend-quiz
tags:
  - supabase
  - auth
  - backend
  - frontend
  - security
  - performance
  - configuration
blockedBy: []
blocks:
  - 260630-1845-ui-auth-onboarding-stabilization
created: '2026-06-30T11:57:39.425Z'
createdBy: 'ck:plan'
source: skill
---

# Supabase Key Migration And Auth Verification Hardening

## Overview

This plan converts the Supabase research into implementation work. The repo is already partly on the new Supabase model: frontend SSR utilities use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the local backend can use an `sb_secret_...` key through `SUPABASE_KEY`. The unsafe part is the contract: backend code still accepts public-key fallbacks, env names are ambiguous, and protected endpoints verify each JWT through a Supabase Auth network call on every request.

The goal is not a broad auth rewrite. Keep Supabase Auth and the current FastAPI/Next.js split, but make the key boundary explicit and measure/remove the hot-path `auth.get_user()` bottleneck where the project configuration supports local JWT verification.

## Evidence

- Research report: [../reports/260630-supabase-publishable-key-research.md](../reports/260630-supabase-publishable-key-research.md)
- Official Supabase API key docs: [supabase.com/docs/guides/api/api-keys](https://supabase.com/docs/guides/api/api-keys)
- Official Supabase signing key docs: [supabase.com/docs/guides/auth/signing-keys](https://supabase.com/docs/guides/auth/signing-keys)
- Official Supabase Next SSR docs: [supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)

## Scope Challenge

- Keep: Supabase Auth, `@supabase/ssr`, FastAPI protected-route dependency, existing BFF route shape, existing RLS assumptions.
- Change: env names and fallbacks, backend client creation policy, JWT verification strategy, duplicate frontend Supabase helper boundaries, deployment docs.
- Defer: new auth provider, full role/permission redesign, database schema redesign, multi-tenant policy rewrite, UI restyling.
- Brutal constraint: if production backend has only a publishable/anon key, it must fail closed instead of silently running privileged writes with a public key.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Rationale |
| --- | --- | --- | --- |
| Blocks | `plans/260630-1845-ui-auth-onboarding-stabilization` | in-progress | UI onboarding/auth verification should run against the final Supabase key/auth boundary, not transitional public-key fallbacks. |
| Related | `plans/260630-1823-auth-onboarding-real-data-hardening` | completed | That plan removed fake/raw bearer auth. This plan hardens the Supabase configuration and live verification path underneath it. |
| Related | `plans/20260628-1021-ai-latency-timing-eval` | pending | Auth verification timing should feed into latency analysis if chat/adaptive startup remains slow. |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Config Contract](./phase-01-config-contract.md) | Completed |
| 2 | [Backend Supabase Client Boundary](./phase-02-backend-supabase-client-boundary.md) | Completed |
| 3 | [JWT Verification Performance](./phase-03-jwt-verification-performance.md) | Completed |
| 4 | [Frontend Client Consolidation](./phase-04-frontend-client-consolidation.md) | Completed |
| 5 | [Deployment And Verification](./phase-05-deployment-and-verification.md) | Completed |

## Dependencies

- Supabase project URL remains stable across frontend and backend.
- Backend production must receive a server-only key: `SUPABASE_SECRET_KEY`.
- Frontend/browser code must receive only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Local JWT verification requires the project to use Supabase asymmetric signing keys/JWKS. If not available, Phase 3 must document the limitation and retain live `auth.get_user()` with caching/measurement.
- Env values must not be printed, committed, or copied into plan reports.

## Global Acceptance Criteria

- [x] `.env.example`, deployment config comments, and docs name the new key contract without exposing secrets.
- [x] Backend privileged DB adapters require `SUPABASE_SECRET_KEY` and never fall back to `NEXT_PUBLIC_*`, publishable, or anon keys in live mode.
- [x] Legacy env names are either migration aliases with warnings or removed after deployment env parity is confirmed.
- [x] Protected route auth latency is measured before and after the change.
- [x] JWT verification uses local JWKS validation when the Supabase project supports it; otherwise the plan leaves an explicit measured fallback.
- [x] Frontend Supabase code has one canonical SSR/browser client path and no sensitive writes hidden behind public-key direct clients.
- [x] Tests cover missing secret key, accidental public key in backend, valid JWT, invalid JWT, and dev-token behavior.
- [x] `npm run lint`, frontend build/type checks relevant to touched code, and backend auth/API tests pass or documented unrelated blockers remain.

## Verification Results

- `python -m ruff check src tests`: passed.
- `python -m pytest tests/test_api/test_adaptive.py tests/test_api/test_supabase_config.py tests/test_api/test_auth_verification_performance.py tests/test_api/test_rbac.py tests/test_api/test_onboarding.py`: 34 passed.
- `python -m pytest tests/test_api tests/test_chat_contracts.py tests/test_rag.py`: 72 passed, 4 skipped.
- `cd frontend && npm run lint`: passed.
- `cd frontend && npm run build`: passed with existing Next middleware/proxy and Turbopack NFT warnings.
- `ck plan validate plans\260630-1915-supabase-key-auth-hardening\plan.md --strict`: passed.

## Runtime Note

Local env currently has `SUPABASE_KEY` set to an `sb_secret_...` key and does not set `SUPABASE_SECRET_KEY`. The code accepts that as a one-release migration alias and logs a deprecation warning once. The operator fix is to copy the same server-only value into `SUPABASE_SECRET_KEY`, then remove `SUPABASE_KEY` after deployment parity is confirmed. No key value was copied into this plan.

## Verification Commands

```bash
python -m pytest tests/test_api/test_rbac.py tests/test_api/test_onboarding.py tests/test_api
cd frontend && npm run lint
cd frontend && npm run build
```

Add a focused timing check during implementation:

```bash
python -m pytest tests/test_api/test_auth_verification_performance.py
```

If no timing test file exists yet, Phase 3 owns creating the narrowest useful one.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260630-1915-supabase-key-auth-hardening\plan.md
```
