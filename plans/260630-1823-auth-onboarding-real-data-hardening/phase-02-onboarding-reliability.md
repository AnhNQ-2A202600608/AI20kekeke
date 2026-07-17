---
phase: 2
title: "Onboarding Reliability"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Onboarding Reliability

## Context Links

- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-gate.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-page.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-api.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-storage.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/onboarding_routes.py`
- Tests: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_onboarding.py`

## Overview

Make onboarding deterministic. It must not hang on hydration, and it must not silently treat local-only completion as backend completion in production.

## Requirements

- Functional:
  - Gate and page detect already-finished Zustand hydration.
  - Backend status is the source of production completion.
  - Offline draft completion is visible and retryable.
  - User cannot permanently skip backend onboarding sync without explicit demo/dev mode.
- Non-functional:
  - Preserve draft autosave.
  - Keep graceful local development path.
  - Avoid duplicate submit writes.

## Architecture

Introduce a clear local state model:

```text
draft -> submitting -> synced
draft -> offline_pending -> retry -> synced
offline_pending + production -> show retry/blocking banner
offline_pending + demo -> allow app with visible unsynced marker
```

The gate should consult local storage only as a UI optimization. It should not skip backend status forever when `syncPending=true`.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-gate.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-page.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-storage.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-api.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/onboarding_routes.py`
- Modify/Create: frontend unit tests if test stack exists; otherwise add manual validation checklist in phase 5.

## Implementation Steps

1. Fix hydration initialization.
   - In `OnboardingGate` and `OnboardingPage`, mirror `AppAuthGate`: if `useBoundStore.persist.hasHydrated()` is already true, set hydrated immediately.
   - Keep `onFinishHydration` subscription for delayed hydration.
2. Strengthen local storage contract.
   - Ensure local completion includes `syncPending`, `completedAt`, `summary`, and maybe `lastSyncError`.
   - `readLocalOnboardingComplete` must expose whether status is synced or pending.
3. Change gate logic.
   - If local status is completed but `syncPending=true`, do not skip status check.
   - If backend says incomplete and local pending exists, route user to onboarding retry/result screen or show a blocking sync banner depending on product choice.
4. Change finish behavior.
   - Production: if backend submission fails, keep user on result step with retry.
   - Demo/dev: allow "Vao app truoc", but show unsynced marker after entering app.
5. Add retry path.
   - On app load or onboarding result step, retry `completeOnboarding` when pending draft exists and token is valid.
   - Use idempotent upsert already present in backend.
6. Backend response hardening.
   - Keep status source explicit: `database`, `stub`, or `local_pending` only on frontend.
   - Ensure validation errors do not turn into offline bypass.
7. Tests.
   - Backend tests for complete/status validation remain.
   - Add frontend/manual checks for hydration already complete, offline retry, invalid payload, and successful sync.

## Todo List

- [x] Hydration cannot hang when store is already hydrated.
- [x] Local pending completion does not suppress backend check.
- [x] Production offline completion keeps retry visible.
- [x] Demo/dev offline completion is visibly unsynced.
- [x] Retry path syncs pending draft and clears `syncPending`.
- [x] Tests/checklist cover hydration and offline states.

## Success Criteria

- [x] Reloading `/onboarding` after store hydration never stays on loading forever.
- [x] Backend offline during onboarding does not silently mark production user complete.
- [x] Reconnected backend syncs pending onboarding exactly once.
- [x] Backend invalid 422 payload cannot be bypassed as offline.
- [x] `/app` gate redirects users with no synced onboarding unless demo/dev bypass is explicit.

## Risk Assessment

- Risk: stricter production flow blocks pilot users if backend is down.
  - Mitigation: show clear retry and support message; demo mode remains opt-in.
- Risk: duplicate onboarding rows.
  - Mitigation: keep backend `upsert(... on_conflict="student_id,profile_version")`.
- Risk: local draft shape changes break old drafts.
  - Mitigation: version storage parser and gracefully ignore malformed old entries.

## Security Considerations

- Onboarding writes must use authenticated user id from backend dependency only.
- Do not let request payload provide `student_id`.
