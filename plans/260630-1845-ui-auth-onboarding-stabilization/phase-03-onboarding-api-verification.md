---
phase: 3
title: "Onboarding API Verification"
status: in-progress
priority: P1
dependencies: [1]
effort: "high"
---

# Phase 3: Onboarding API Verification

## Overview

Make onboarding a verified flow instead of an assumed UI path. Prove status checking, completion payloads, auth failure behavior, offline fallback, and post-completion routing against the local BFF/backend contract.

## Requirements

- Functional: logged-in users with incomplete onboarding are sent to `/onboarding`; completed users enter `/app`; invalid/unauthorized API responses surface clear states.
- API: `GET /api/v1/onboarding/status` and `POST /api/v1/onboarding/complete` are tested with valid auth and invalid/missing auth.
- Security: do not preserve `userId` bearer fallback as production auth. Coordinate with `260630-1823-auth-onboarding-real-data-hardening`.
- UX: onboarding can be completed with keyboard/mouse and does not trap users in a hydration loading state.

## Architecture

Keep the wizard in `OnboardingPage`. Fix hydration at the shared gate/page level if needed. Keep API wrapper thin, but separate "valid token" from "demo/offline fallback" behavior so verification can tell whether the backend was actually called.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-gate.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-page.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-api.ts`
- Modify if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-storage.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-contract.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/onboarding_routes.py`
- Modify tests if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_onboarding.py`
- Create if useful: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/260630-1845-ui-auth-onboarding-stabilization/reports/onboarding-api-verification.md`

## Implementation Steps

1. From Phase 1 baseline, identify exact onboarding failure:
   - hydration stuck.
   - API never called.
   - unauthorized response silently ignored.
   - completion stored only locally.
2. Remove ambiguity in `authHeader`:
   - live request should prefer valid token only.
   - `userId` fallback must be demo/dev-only or removed after hardening plan is applied.
3. Fix hydration checks in `OnboardingGate` and `OnboardingPage` so they handle already-hydrated Zustand persist state, not only `onFinishHydration`.
4. Add clear handling for:
   - 401/403: logout or send to `/login` with message.
   - 400/422: stay on current step/result and show validation message.
   - offline/server: show explicit offline state and do not mark remote completion as synced.
5. Verify status flow:
   - completed false -> `/onboarding`.
   - completed true -> stays in `/app`.
6. Verify submit flow:
   - build payload through `toSubmitPayload`.
   - complete API returns summary.
   - local completion marker writes only after successful remote response, except explicit offline demo path.
7. Add/update backend tests for request validation and auth behavior if existing tests are insufficient.
8. Write verification report with request method, path, status, and expected UI state.

## Success Criteria

- [x] No onboarding hydration spinner can persist indefinitely after store hydration.
- [x] `GET /api/v1/onboarding/status` is observed in the expected app entry flow.
- [ ] `POST /api/v1/onboarding/complete` is observed with payload matching `OnboardingSubmitPayload`.
- [x] Unauthorized onboarding API responses do not silently fall through into app.
- [x] Offline mode is visually explicit and does not pretend remote sync succeeded.
- [x] `tests/test_api/test_onboarding.py` passes, or environment blocker is documented with exact missing dependency.
- [ ] Browser verification covers at least one complete onboarding run.

## Risk Assessment

- Risk: Fix conflicts with auth hardening plan. Mitigation: do not invent a second auth policy; mark this phase blocked on that plan for production-token decisions.
- Risk: Local demo mode becomes unusable. Mitigation: preserve explicit demo flow, but label it and keep it separate from production auth.
- Risk: Backend unavailable slows UI work. Mitigation: API verification report can mark backend unavailable, but phase cannot be complete until live path is exercised or environment is repaired.
