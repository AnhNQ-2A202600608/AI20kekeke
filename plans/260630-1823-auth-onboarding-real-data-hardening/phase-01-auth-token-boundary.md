---
phase: 1
title: "Auth Token Boundary"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Auth Token Boundary

## Context Links

- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/auth-token.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/chat/stream.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/adaptive/api-client.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-api.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/auth_routes.py`
- Tests: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_rbac.py`, `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_routes.py`

## Overview

Close the identity boundary. Production backend must accept only verified live tokens for protected routes, and frontend must never substitute `userId` as authorization.

## Requirements

- Functional:
  - Live mode rejects raw UUID bearer tokens.
  - Live mode rejects `fake-jwt-token-*`.
  - `service_role` bypass remains available only for tests/internal execution when explicitly enabled.
  - Frontend protected calls use a valid token or surface an unauthenticated state.
- Non-functional:
  - Do not weaken RBAC tests.
  - Do not trust frontend role/persona state.
  - Keep local test ergonomics through explicit fixtures, not production bypasses.

## Architecture

Current risk:

```text
Zustand userId -> frontend auth fallback -> Authorization: Bearer <uuid> -> backend live mode accepts UUID
```

Target:

```text
Supabase JWT -> frontend request -> backend verifies JWT -> backend derives user id and role
Missing/expired token -> 401 -> frontend clears session or asks user to log in
Demo token -> allowed only when AUTH_ALLOW_DEV_TOKENS=true and marked demo
```

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/auth-token.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/chat/stream.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/adaptive/api-client.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/onboarding/onboarding-api.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/auth_routes.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_rbac.py`
- Modify/Create: auth-specific backend tests if existing coverage cannot express the new boundary.

## Implementation Steps

1. Add backend auth mode helpers in `src/api/adaptive_routes.py`.
   - Proposed env: `AUTH_ALLOW_DEV_TOKENS=false` by default.
   - In live DB mode, only accept Supabase JWT through `db.app_client.auth.get_user(token)`.
   - Permit `service_role`, fake tokens, or raw UUID only when test/dev mode is explicit.
2. Remove live raw UUID branch.
   - The branch at `get_current_user` that parses non-JWT tokens must become test/dev-only.
   - Any non-JWT live token returns 401.
3. Normalize fake-token behavior.
   - Stub DB mode can still map seeded fake users.
   - Live DB mode rejects `fake-jwt-token-*` unless `AUTH_ALLOW_DEV_TOKENS=true`.
4. Rewrite frontend token helper.
   - Replace `getRequestAuthToken(token, fallbackUserId)` with a helper that returns either valid token or unauthenticated state.
   - Expired JWT should clear token and return no bearer, not fallback to user id.
5. Update callers.
   - Chat: remove the 401 retry with `Authorization: Bearer ${studentId}` in `frontend/lib/chat/stream.ts`.
   - Adaptive: if token missing/expired, throw an auth error and let UI request login.
   - Onboarding/profile/admin calls: same no-token behavior.
6. Update auth/login tests.
   - Add tests for live mode rejecting raw UUID and fake token.
   - Add tests for stub/dev mode accepting seeded demo tokens only when intended.
7. Audit protected endpoints.
   - Grep `Depends(adaptive_routes.get_current_user)` and `require_role`.
   - Confirm all protected endpoints derive user id from auth dependency, not request body.

## Todo List

- [x] Backend rejects raw UUID token in live mode.
- [x] Backend rejects fake token in live mode.
- [x] Backend preserves explicit stub/dev tests.
- [x] Frontend helper no longer emits `userId` as bearer token.
- [x] Chat retry with studentId bearer removed.
- [x] Adaptive/onboarding/profile calls handle missing token deliberately.
- [x] Auth/RBAC tests updated.

## Success Criteria

- [x] `Bearer <uuid>` returns 401 in live-mode test.
- [x] `Bearer fake-jwt-token-<uuid>` returns 401 in live-mode test.
- [x] `Bearer <expired-jwt>` causes frontend token clear and no raw UUID retry.
- [x] Student cannot spoof another `student_id` request using known UUID.
- [x] Existing valid JWT login path still works.
- [x] No protected frontend API client builds an Authorization header from persisted `userId`.

## Risk Assessment

- Risk: tests depend on UUID bearer shortcuts.
  - Mitigation: move shortcuts behind explicit test mode and update fixtures.
- Risk: local demo becomes harder.
  - Mitigation: phase 3 adds explicit demo gates.
- Risk: Supabase Auth calls add latency.
  - Mitigation: keep role lookup as-is initially; cache only after correctness is restored.

## Security Considerations

- This is the security gate for all later phases.
- Do not accept frontend `role`, `selectedPersona`, or `student_id` as authority.
- Do not log raw tokens.
