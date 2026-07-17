---
title: "UI Auth Onboarding Stabilization"
description: "Align the landing page with the current app theme, prove onboarding API behavior, repair login/logout click flows, and make app surfaces fit the viewport without oversized controls."
status: in-progress
priority: P1
branch: "codex/adaptive-first-frontend-quiz"
tags: [frontend, auth, onboarding, ui, bugfix]
blockedBy: [260630-1823-auth-onboarding-real-data-hardening, 260630-1915-supabase-key-auth-hardening]
blocks: []
created: "2026-06-30T11:31:27.507Z"
createdBy: "ck:plan"
source: skill
---

# UI Auth Onboarding Stabilization

## Overview

Fix four currently observed product-quality gaps without starting a broad redesign:

1. Landing page does not match the newer app shell theme, assets, background masks, and denser learning surfaces.
2. Onboarding has not been verified end-to-end against the API path.
3. Login/logout controls exist but the clickable flow is unreliable and not covered by a reproducible browser test.
4. App sizing is inconsistent with the intended "fit one screen, explain only what matters, keep buttons compact" direction.

This plan is intentionally execution-focused. It uses the existing Next.js App Router, Zustand store, tactile CSS tokens, Sofi/Code Bay assets, and current component boundaries. It does not introduce a new design system, a new auth provider, or a new test framework unless the current tooling cannot prove the flows.

## Scope Challenge

- Existing code: landing exists under `frontend/components/landing/`; app shell/auth gate exists in `frontend/app/components/quiz-app-shell.tsx`; login/logout surfaces exist in `frontend/app/login/page.tsx`, `frontend/components/LoginScreen.tsx`, `frontend/components/app/app-profile-shortcut.tsx`; onboarding API/client/storage exists under `frontend/lib/onboarding/` and `src/api/onboarding_routes.py`; app sizing is concentrated in `frontend/app/components/dashboard-layout.tsx`, `frontend/components/LearningPath.tsx`, and `frontend/components/app/*`.
- Minimum changes: make landing reuse current tokens/assets/layout density; create a small repeatable QA harness/checklist for auth and onboarding; fix only the click blockers found by reproduction; normalize viewport heights, overflow ownership, and control sizing on the app surfaces.
- Complexity: expected touch count is 8-14 files because the issues cross landing, auth, onboarding, and app layout. New abstractions should be limited to small helpers or test utilities. No new page architecture.
- Selected mode: HOLD SCOPE with `--hard`. Fix the named failures and verify them. Defer unrelated polish.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Reason |
| --- | --- | --- | --- |
| Blocked by | `plans/260630-1823-auth-onboarding-real-data-hardening` | pending | Onboarding/auth API verification must not preserve `userId` bearer fallback or fake-token production paths. |
| Blocked by | `plans/260630-1915-supabase-key-auth-hardening` | pending | Final onboarding/auth API verification should run against the cleaned Supabase key and JWT verification boundary. |
| Related | `plans/260619-1011-landing-lecturer-admin-ui-validation` | review | Older landing validation defines messaging, but current task supersedes its visual direction with the new app theme and assets. |
| Related | `plans/260630-0210-rpg-farmer-scholar-profile` | pending | Profile/menu surfaces and app nav sizing overlap. Avoid duplicate profile redesign work. |

## Architecture Direction

- Keep `/` as unauthenticated landing. Keep `/login` as the explicit auth entry.
- Keep `/app` protected by app-level auth guard, then run `OnboardingGate` only for logged-in users.
- Treat onboarding API as a live contract, not a visual-only wizard. Status and complete calls must be verified with valid auth, unauthorized auth, and backend-offline states.
- Use current tactile UI tokens from `frontend/app/globals.css`: `bg-background`, `text-on-background`, `btn-3d`, `primary-green`, `gray-border`, `surface-container-*`.
- Use app assets already present in `frontend/public/app-backgrounds/`, `frontend/public/mascot/`, `frontend/public/learning-scenery/`, and `frontend/public/brand/edugap/`.
- Make dense app surfaces own exactly one scroll container per viewport. Prefer compact controls and fixed-size icon buttons over large text-heavy buttons.

## Non-Goals

- No new auth provider.
- No broad redesign of mentor/BTC dashboards beyond sizing regressions.
- No new marketing-page feature scope such as pricing, contact forms, or LMS integrations.
- No fake API mocks to make checks pass. Use real local backend/BFF paths or explicit offline expectations.

## Verification Strategy

Run narrow first:

```bash
cd frontend && npm run lint
cd frontend && npx tsc --noEmit
python -m pytest tests/test_api/test_onboarding.py
```

Then browser/API flows:

```text
1. Guest visits /app -> lands on /
2. Demo/user login -> reaches /app
3. Profile menu logout -> returns to /
4. Logged-in user with incomplete onboarding -> /app redirects to /onboarding
5. Onboarding submit -> POST /api/v1/onboarding/complete receives expected payload and returns persisted completion
6. Desktop 1440x900, laptop 1366x768, tablet 1024x768, mobile 390x844 have no incoherent overlap and no primary action clipped
```

Current known verification blocker: `cd frontend && npx tsc --noEmit` fails in `frontend/lib/adaptive/database.ts` lines 182-183 from unrelated dirty work. Phase 1 must either resolve that blocker or record it as an external precondition before claiming typecheck coverage.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Baseline Reproduction](./phase-01-baseline-reproduction.md) | Completed |
| 2 | [Landing Theme Alignment](./phase-02-landing-theme-alignment.md) | In Progress |
| 3 | [Onboarding API Verification](./phase-03-onboarding-api-verification.md) | In Progress |
| 4 | [Auth Lock In Out Flow](./phase-04-auth-lock-in-out-flow.md) | Completed |
| 5 | [App Sizing Density Pass](./phase-05-app-sizing-density-pass.md) | In Progress |

## Dependencies

- `@supabase/ssr` and existing FastAPI `/api/v1` BFF rewrites remain in place.
- Existing Zustand `useBoundStore` remains the client auth/session source.
- Browser verification should use the running Next dev server on `http://localhost:3000` unless that port is unavailable.
- `plans/260630-1823-auth-onboarding-real-data-hardening` must settle production auth token policy before final onboarding/auth verification is accepted.

## Global Acceptance Criteria

- [x] Landing first viewport visually belongs to the current app: same tactile theme, updated assets/backgrounds, compact CTAs, and no stale dark/glass marketing feel.
- [x] `/app` guest, login, logout, and onboarding redirects are reproducible and documented.
- [ ] Onboarding status and completion API paths are verified with real request/response behavior.
- [ ] Login/logout controls are clickable by mouse and keyboard without menu/modal overlays swallowing events.
- [ ] Main app surfaces fit intended breakpoints with compact buttons and no clipped primary actions.
- [x] Lint passes. Typecheck/build blockers are either fixed or explicitly linked to unrelated dirty work with a follow-up.

## Hard-Mode Red-Team Summary

- Do not let visual fixes mask auth debt. If onboarding still sends `Authorization: Bearer <userId>`, the plan must depend on auth hardening or env-gate demo paths.
- Do not solve sizing by hiding overflow globally. Each page needs clear scroll ownership.
- Do not make landing a decorative clone of the app. It must communicate the product while matching the app's visual system.
- Do not rely on "I clicked once manually" for login/logout. Capture repeatable browser steps and expected URL/state.
- Avoid adding Playwright/Vitest unless the repo accepts new test dependencies. Browser verification through the current app tooling is enough for this pass if documented.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260630-1845-ui-auth-onboarding-stabilization\plan.md
```
