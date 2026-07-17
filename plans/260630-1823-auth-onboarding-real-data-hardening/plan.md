---
title: "Auth Onboarding Real Data Hardening"
description: "Close auth bypasses, make onboarding reliable, govern demo fallback paths, and replace misleading mock surfaces with explicit real-data contracts."
status: completed
priority: P1
branch: "codex/adaptive-first-frontend-quiz"
tags: [bugfix, auth, security, frontend, backend, api, data-integrity]
blockedBy: []
blocks: [260630-1818-quiz-ai-regression-fix, 260630-0210-rpg-farmer-scholar-profile, 260630-0112-practice-skill-garden, 260630-1845-ui-auth-onboarding-stabilization]
created: "2026-06-30T11:23:50.775Z"
createdBy: "ck:plan"
source: skill
---

# Auth Onboarding Real Data Hardening

## Overview

This plan fixes the audit findings from the frontend/backend codebase review:

- Backend live auth accepts raw UUID bearer tokens.
- Frontend falls back from expired JWT to `userId`.
- Demo login and fake tokens are available in normal user entry points.
- Onboarding hydration can stall and offline completion can become permanently local.
- Student quiz/chat call backend only on some paths; several surfaces still use static/demo data.
- Mentor/BTC/profile analytics present mock data as if it were operational data.

The implementation must keep the MVP usable, but it must separate production behavior from demo behavior. Production must fail closed for auth, disclose demo data clearly, and never let fake/local-only state masquerade as persisted learning evidence.

## Scope Challenge

- Existing code: FastAPI auth and RBAC already exist in `src/api/auth_routes.py` and `src/api/adaptive_routes.py`. Next.js BFF proxy exists at `frontend/app/api/v1/[...path]/route.ts`. Frontend auth/token helpers exist at `frontend/lib/auth-token.ts`. Onboarding APIs and local storage helpers already exist under `frontend/lib/onboarding/` and `src/api/onboarding_routes.py`.
- Minimum changes: remove raw UUID auth acceptance from live mode, remove client fallback to `userId`, gate demo bypasses by env, fix hydration checks, add onboarding sync retry, and replace misleading mock dashboards with explicit loading/empty/demo states plus targeted real API wiring.
- Complexity: touches more than 8 files because findings span auth, onboarding, chat, adaptive quiz, profile, mentor, and BTC surfaces. Keep new abstractions to at most two shared helpers: a frontend demo-mode flag helper and a backend auth/test-mode helper.
- Selected mode: HOLD SCOPE with `--hard`. Fix every finding, but do not build new product features beyond the reviewed defects.

## Evidence

- Scout report: [reports/scout-report.md](./reports/scout-report.md)
- Hard-mode review notes: [reports/hard-review-notes.md](./reports/hard-review-notes.md)
- Relevant docs:
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/engineering/code-standards.md`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/engineering/system-architecture.md`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/product/design-guidelines.md`

## Cross-Plan Dependencies

| Relationship | Plan | Status | Rationale |
| --- | --- | --- | --- |
| Blocks | `plans/260630-1818-quiz-ai-regression-fix` | pending | Quiz UX polish should not hide the current static-demo/adaptive boundary defects. |
| Blocks | `plans/260630-0210-rpg-farmer-scholar-profile` | pending | Profile redesign depends on trustworthy profile/activity/session data semantics. |
| Blocks | `plans/260630-0112-practice-skill-garden` | pending | Practice garden should not build on misleading mock mastery states. |
| Blocks | `plans/260630-1845-ui-auth-onboarding-stabilization` | pending | UI/auth/onboarding verification must not preserve raw UUID or fake-token production paths. |
| Related | `plans/260630-0935-chat-contract-schema-unification` | present | Reuse chat contract types and stream behavior; do not invent another schema. |
| Related | `plans/20260612-2045-connect-backend-frontend-fallback` | present | This plan tightens earlier robust fallback choices so production is not silently demo. |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Auth Token Boundary](./phase-01-auth-token-boundary.md) | Completed |
| 2 | [Onboarding Reliability](./phase-02-onboarding-reliability.md) | Completed |
| 3 | [Demo Fallback Governance](./phase-03-demo-fallback-governance.md) | Completed |
| 4 | [Real Data Integration](./phase-04-real-data-integration.md) | Completed |
| 5 | [Verification Documentation](./phase-05-verification-documentation.md) | Completed |

## Dependencies

- Supabase Auth remains the source of live user identity.
- FastAPI `get_current_user` remains the backend boundary for protected endpoints.
- Next.js BFF `/api/v1/[...path]` remains the frontend-to-backend path.
- Zustand persisted store remains the frontend session store, but cannot create production auth credentials.
- Demo mode is allowed only when explicitly configured by environment.

## Global Acceptance Criteria

- [x] Live backend rejects raw UUID, `fake-jwt-token-*`, expired JWT, and missing auth for every protected endpoint.
- [x] Frontend never uses `userId` as bearer auth in production.
- [x] Demo login/bypass controls are hidden outside explicit demo/dev mode.
- [x] Onboarding cannot get stuck because hydration finished before component mount.
- [x] Offline onboarding is retried and visible until synced, or user is clearly blocked based on product decision.
- [x] Student adaptive quiz and chat surfaces disclose static/demo fallback and do not update mastery as if persisted.
- [x] Mentor/BTC surfaces either read real backend data or show explicit demo/empty states. No silent fake operational metrics.
- [x] Existing frontend lint passes.
- [x] Backend auth/onboarding/chat/adaptive tests run after dependency issue is fixed.
- [x] Docs/worklog are updated because auth behavior, demo mode, and data contracts change.

## Verification Commands

Run narrow first:

```bash
python -m pytest tests/test_api/test_rbac.py tests/test_api/test_onboarding.py tests/test_api/test_chat_stream.py tests/test_chat_contracts.py
cd frontend && npm run lint
```

Then broaden:

```bash
python -m pytest tests/test_api tests/test_chat_contracts.py
cd frontend && npm run build
```

Current blocker found during review: `python -m pytest ...` fails before tests because `langchain_openai` is not installed in the active Python environment. Phase 5 must resolve environment parity or document the exact bootstrap command before claiming backend verification.

Resolved during implementation: installed the declared `langchain-openai` and `supabase` Python packages in the active interpreter so backend tests import correctly.

## Red-Team Summary

- Auth must be fixed first. Any frontend polish before closing raw UUID auth can accidentally preserve a security bypass.
- Demo affordances are not evil, but they must be impossible to confuse with production auth.
- "Fallback" is acceptable for read-only learning content. It is not acceptable for identity, mastery writes, onboarding completion, class analytics, or admin observability.
- Do not add a large "data service layer" unless current components cannot share a small adapter. YAGNI applies.

## Validation Log

### Verification Results

Implementation run:

- `cd frontend && npm run lint`: passed.
- `python -m pytest tests/test_api/test_rbac.py tests/test_api/test_onboarding.py tests/test_api/test_chat_stream.py tests/test_chat_contracts.py`: 20 passed.
- `python -m pytest tests/test_api tests/test_chat_contracts.py`: 51 passed, 4 skipped.
- `cd frontend && npm run build`: passed with existing Next/Turbopack warnings.

- Tier: Full, because this plan has 5 phases.
- Claims checked: 24
- Verified: 22
- Failed: 1
- Unverified: 1

Failures:

1. Backend verification command blocked by missing `langchain_openai` in current environment.

Unverified:

1. Exact production deployment env names for enabling demo mode. Plan uses `NEXT_PUBLIC_DEMO_MODE` and `AUTH_ALLOW_DEV_TOKENS` as proposed names unless the repo already has stronger conventions during implementation.

### Whole-Plan Consistency Sweep

- Files reread: plan.md and all 5 phase files before initial write.
- Decision deltas checked: auth fail-closed, env-gated demo, onboarding sync retry, explicit demo/empty data states.
- Reconciled stale references: none.
- Unresolved contradictions: 0.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260630-1823-auth-onboarding-real-data-hardening\plan.md
```
