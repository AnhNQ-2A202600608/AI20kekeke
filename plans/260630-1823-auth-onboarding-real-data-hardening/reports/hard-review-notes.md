---
title: "Hard Review Notes: Auth Onboarding Real Data Hardening"
created: "2026-06-30"
---

# Hard Review Notes

## Research Notes

- Production identity should be verified server-side. Frontend role, user id, or local persisted store are not trust boundaries.
- Supabase live auth should validate JWT via Supabase Auth APIs or verified JWT claims. Raw UUID bearer tokens are acceptable only for test stubs when explicitly enabled.
- Demo mode can exist, but must be explicit and visible. It should not share the same path as production auth without an environment gate.
- Local fallback can preserve UX for read-only content, but write-like learning events need pending sync, retry, and visible unsynced state.

## Design Decisions

1. Fix backend auth before frontend demo cleanup.
2. Remove `userId` bearer fallback rather than trying to make backend distinguish it.
3. Gate fake tokens behind backend env, not only frontend UI hiding.
4. Keep demo accounts for local/dev and demos, but rename them as demo mode and prevent accidental production use.
5. Replace mock dashboards incrementally: first label and isolate, then wire real endpoints for MVP-critical surfaces.

## Red-Team Findings

| Risk | Plan Response |
| --- | --- |
| Removing raw UUID auth breaks tests that use UUID bearer tokens. | Update tests to use explicit stub/dev token helper or JWT fixture. Do not keep production bypass for test convenience. |
| Hiding demo login hurts demos. | Keep demo login behind `NEXT_PUBLIC_DEMO_MODE=true` and backend `AUTH_ALLOW_DEV_TOKENS=true`. |
| Blocking offline onboarding hurts local development. | Allow local dev offline flow only in demo/dev mode; production shows retry and cannot claim synced completion. |
| Replacing every mock screen with real APIs could balloon scope. | Phase 4 prioritizes honesty first, then real endpoints for MVP-critical class/profile data. |
| Build may fail for unrelated dirty worktree changes. | Verification phase records baseline and separates unrelated pre-existing failures. |

## Validation Questions

- None blocking. Proposed env names can be adjusted during implementation if a stronger project convention is found.
