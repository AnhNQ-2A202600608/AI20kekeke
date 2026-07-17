---
phase: 1
title: "Baseline Reproduction"
status: completed
priority: P1
dependencies: []
effort: "medium"
---

# Phase 1: Baseline Reproduction

## Overview

Create a trustworthy baseline before changing UI. Reproduce the four reported failures, capture current screenshots/state, and unblock verification commands enough that later phases cannot claim success on guesswork.

## Requirements

- Functional: reproduce landing mismatch, onboarding uncertainty, login/logout click failure, and sizing overflow/oversized controls.
- Non-functional: use current local app behavior; no fake backend mocks; preserve user worktree changes outside this plan.

## Architecture

This phase does not change product behavior except for narrow test-blocker fixes if they are required to run validation. It creates a baseline report under this plan and defines the exact browser/API flows every later phase must re-run.

## Related Code Files

- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/landing/landing-page.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-app-shell.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-gate.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-page.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-api.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/app/app-profile-shortcut.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Possibly modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/adaptive/database.ts` only if its current TypeScript errors block all verification and the dirty change is confirmed as intended.
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/260630-1845-ui-auth-onboarding-stabilization/reports/baseline-report.md`

## Implementation Steps

1. Record current git status and isolate files already dirty before edits.
2. Start or reuse Next dev server. Prefer `http://localhost:3000`.
3. Capture baseline browser states:
   - `/` at desktop and mobile.
   - `/login` login and demo login path.
   - `/app` guest redirect.
   - logged-in profile menu open, logout click, post-logout URL.
   - incomplete onboarding redirect and `/onboarding` first/last step.
   - app `learn`, `skills`, `profile`, `chat` at 1440x900, 1366x768, 390x844.
4. Capture API baseline:
   - `GET /api/v1/onboarding/status` with no auth.
   - same with valid logged-in token if available.
   - `POST /api/v1/onboarding/complete` with minimal valid payload from the frontend contract.
5. Run `cd frontend && npm run lint`.
6. Run `cd frontend && npx tsc --noEmit`.
7. Run `python -m pytest tests/test_api/test_onboarding.py` if Python dependencies are available.
8. Write baseline report with exact failures, screenshots paths if captured, and commands/output summaries.
9. Decide whether current `frontend/lib/adaptive/database.ts` type errors must be fixed before UI work; if unrelated and user-owned, record as external blocker for typecheck only.

## Success Criteria

- [x] Baseline report exists and lists exact reproduction steps for all four user-reported problem groups.
- [x] Each later phase has a concrete before/after check from the baseline.
- [x] Lint baseline is known.
- [x] Typecheck status is known, including whether `frontend/lib/adaptive/database.ts` is an external blocker.
- [x] Onboarding API status is known for unauthenticated, authenticated, and offline/server-error paths where possible.

## Risk Assessment

- Risk: Browser session has persisted auth and hides guest bugs. Mitigation: explicitly logout through UI or use a clean browser context supported by the available browser tool.
- Risk: Backend dependencies are missing locally. Mitigation: record exact missing dependency and keep API verification pending until environment is fixed.
- Risk: Existing dirty files are mistaken for this work. Mitigation: baseline report includes git status before edits.
