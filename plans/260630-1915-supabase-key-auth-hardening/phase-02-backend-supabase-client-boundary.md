---
phase: 2
title: Backend Supabase Client Boundary
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 2: Backend Supabase Client Boundary

## Overview

Make backend Supabase access fail closed unless a server-only key is configured. This removes the current dangerous fallback from backend DB adapters to public frontend keys.

## Requirements

- Functional: privileged adaptive/RAG/audit database clients must use `SUPABASE_SECRET_KEY` or the deprecated `SUPABASE_KEY` alias only when it is server-capable.
- Functional: public/publishable keys must be rejected for backend privileged adapters in live mode.
- Functional: stub/dev database mode must still work for tests without real Supabase secrets.
- Non-functional: client construction should be cached/singleton where safe to reduce request overhead.

## Architecture

Introduce a backend Supabase settings boundary:

```python
settings.supabase_url
settings.supabase_secret_key
settings.supabase_key_source
settings.is_stub_database
```

`get_adaptive_db()` should not repeat fallback chains inline. It should call the settings helper, then construct or reuse `SupabaseAdaptiveDatabase`.

## Related Code Files

- Modify: `src/api/adaptive_routes.py`
- Modify: `src/services/adaptive/supabase_database.py`
- Modify: `src/services/rag.py`
- Modify: `scripts/` ingestion utilities that read Supabase keys
- Modify/Create: backend config helper if no existing central module fits
- Modify: `tests/test_api/test_rbac.py`
- Create/Modify: focused config tests under `tests/`

## Implementation Steps

1. Replace inline fallback order in `get_adaptive_db()` with a single helper that:
   - accepts `SUPABASE_SECRET_KEY`;
   - accepts deprecated `SUPABASE_KEY` only as backend alias;
   - rejects `sb_publishable_`, legacy anon JWT, and `NEXT_PUBLIC_*` in live mode;
   - allows stub DB/test mode without a real key.
2. Cache `SupabaseAdaptiveDatabase` per process for identical URL/key configuration unless tests require explicit reset.
3. Rename misleading local variables such as `supabase_anon_key` in server-only RAG paths to `supabase_api_key` or `supabase_secret_key`.
4. Keep RLS/public-key direct access only in browser/frontend code, not in FastAPI privileged adapters.
5. Add tests that simulate:
   - missing backend key;
   - publishable key accidentally supplied to backend;
   - legacy anon key accidentally supplied to backend;
   - valid secret-shaped key accepted without logging the value.

## Success Criteria

- [x] Backend cannot mutate/read privileged app/audit schemas using public frontend credentials by accident.
- [x] Tests prove live mode rejects public/anon backend keys.
- [x] Stub/test mode remains available without real Supabase.
- [x] Supabase clients are not recreated on every protected request unless a test explicitly resets dependency state.

## Risk Assessment

Risk: key prefix checks may be incomplete for legacy keys. Mitigation: classify known unsafe public key shapes and add an override only for test/stub mode, never for production.

Risk: singleton clients make tests leak state. Mitigation: expose a narrow cache reset helper for tests or keep cache inside dependency override boundaries.
