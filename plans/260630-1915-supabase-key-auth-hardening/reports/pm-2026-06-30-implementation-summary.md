---
status: completed
created: 2026-06-30
source: ck:project-management
---

# Supabase Key Auth Hardening Implementation Summary

## Summary

Implemented the Supabase publishable/secret key migration plan. Backend privileged Supabase access now uses `SUPABASE_SECRET_KEY` or a temporary `SUPABASE_KEY` alias only when it is server-capable. Public/publishable/anon keys are rejected for backend app/audit adapters. Frontend public clients use publishable-key naming. Protected route auth can verify JWTs locally through Supabase JWKS when available and falls back to measured live `auth.get_user`.

## Runtime Diagnosis

Local env currently sets `SUPABASE_KEY` to an `sb_secret_...` value and does not set `SUPABASE_SECRET_KEY`. This is accepted as a migration alias and warns once. Direct checks with the current local key show `submit_attempt_v3` has EXECUTE permission; a random submit returns the expected business error `DECISION_INVALID_OR_CONSUMED`, not `42501 permission denied`.

If a running backend still logs `permission denied for function submit_attempt_v3`, restart the backend and ensure the process env has the server-only key. The preferred env name is `SUPABASE_SECRET_KEY`; `SUPABASE_KEY` is temporary.

## Verification

| Check | Result |
| --- | --- |
| `python -m ruff check src tests` | passed |
| focused auth/config/adaptive/onboarding tests | 34 passed |
| `python -m pytest tests/test_api tests/test_chat_contracts.py tests/test_rag.py` | 72 passed, 4 skipped |
| `cd frontend && npm run lint` | passed |
| `cd frontend && npm run build` | passed with existing Next/Turbopack warnings |
| `ck plan validate ... --strict` | passed |

## Changed Areas

- Backend Supabase config helper and key classification.
- Cached adaptive DB dependency.
- Optional JWKS local JWT verification helper.
- RAG/ingestion scripts moved to backend secret-key contract.
- Frontend Supabase helpers removed legacy anon fallback.
- Env examples, Render config, architecture docs, worklog.
- Focused regression tests for key classification, local/fallback auth verification, and RPC permission error handling.

## Open Questions

- Production environment should be updated to set `SUPABASE_SECRET_KEY` explicitly and remove `SUPABASE_KEY` after one release.
- If Supabase JWT signing keys are still legacy symmetric, local JWKS verification will stay in fallback mode until the project migrates to asymmetric signing keys.
