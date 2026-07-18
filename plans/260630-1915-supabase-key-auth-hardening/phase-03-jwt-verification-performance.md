---
phase: 3
title: JWT Verification Performance
status: completed
priority: P1
dependencies:
  - 1
  - 2
---

# Phase 3: JWT Verification Performance

## Overview

Measure and reduce the current protected-route bottleneck where each request calls Supabase Auth via `auth.get_user(token)`. Use local JWT/JWKS verification when the Supabase project supports asymmetric signing keys.

## Requirements

- Functional: valid Supabase JWTs still map to the same user identity and role behavior.
- Functional: invalid, expired, malformed, fake, and raw UUID tokens still fail closed.
- Functional: if local verification is unavailable, retain live verification with clear measurement and bounded caching.
- Non-functional: do not cache auth decisions longer than token validity or role freshness allows.

## Architecture

Target flow:

```text
Authorization bearer JWT
  -> parse headers and claims
  -> verify locally with Supabase JWKS when configured
  -> derive user id/email
  -> load app role/profile from DB or short TTL cache
  -> protected endpoint handler
```

Fallback flow:

```text
Authorization bearer JWT
  -> measured Supabase auth.get_user(token)
  -> role/profile lookup
  -> protected endpoint handler
```

## Related Code Files

- Modify: `src/api/adaptive_routes.py`
- Modify/Create: `src/services/auth/` or nearest existing auth helper module
- Modify: `tests/test_api/test_rbac.py`
- Create: `tests/test_api/test_auth_verification_performance.py`
- Modify: docs if auth verification behavior changes

## Implementation Steps

1. Add timing around current `auth.get_user(token)` verification to capture baseline in tests/logs without printing tokens.
2. Determine if current project config exposes JWKS/asymmetric signing metadata via env or Supabase standard JWKS URL.
3. Implement a local verifier helper only when enough project configuration is present:
   - fetch JWKS by project URL;
   - cache keys with TTL;
   - validate issuer/audience/expiry/signature;
   - reject unsupported algorithms.
4. Keep `auth.get_user()` fallback for projects still using legacy symmetric JWT secret or missing JWKS configuration.
5. Add a short TTL role/profile cache if role lookup becomes the next repeated hot path; keep it easy to disable in tests.
6. Update `get_current_user()` so tests can force each mode: local verifier, live Supabase verifier, stub/dev verifier.

## Success Criteria

- [x] Baseline auth verification timing is captured.
- [x] Local JWT verification is used when Supabase JWKS/asymmetric signing configuration is available.
- [x] Fallback live verification remains correct and measured when local verification is not possible.
- [x] Existing fake-token/raw-UUID rejection tests still pass.
- [x] New tests cover local verifier fallback behavior and retained live verification. Full issuer/audience/key-id cases remain covered by the PyJWT verifier contract and should be expanded if local mode is forced in production.

## Risk Assessment

Risk: implementing JWT verification incorrectly is worse than the current latency. Mitigation: use a maintained JWT/JWKS library, validate issuer/audience/expiry/signature, and keep live Supabase verification fallback behind a feature flag until tests prove parity.

Risk: role cache hides permission changes. Mitigation: use a short TTL, include cache invalidation in tests, and avoid caching admin/mentor elevation longer than necessary.
