---
phase: 4
title: Frontend Client Consolidation
status: completed
priority: P2
dependencies:
  - 1
---

# Phase 4: Frontend Client Consolidation

## Overview

Keep frontend Supabase access on the new publishable-key SSR pattern and reduce duplicate client helpers that can drift into fake or unsafe behavior.

## Requirements

- Functional: browser and server component Supabase clients use `@supabase/ssr` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Functional: frontend must not require or expose backend secret keys.
- Functional: direct frontend Supabase writes must be audited against RLS; sensitive writes should use FastAPI/BFF.
- Non-functional: do not rewrite all data fetching unless a direct client path is demonstrably unsafe.

## Architecture

Canonical frontend Supabase entry points:

```text
frontend/utils/supabase/client.ts      browser client
frontend/utils/supabase/server.ts      server client
frontend/utils/supabase/middleware.ts  cookie refresh/proxy
```

Legacy helpers such as `frontend/lib/supabase.ts` and `frontend/lib/adaptive/database.ts` should either wrap the canonical utilities or be narrowed to explicit public/read-only use.

## Related Code Files

- Modify: `frontend/utils/supabase/client.ts`
- Modify: `frontend/utils/supabase/server.ts`
- Modify: `frontend/utils/supabase/middleware.ts`
- Modify: `frontend/lib/supabase.ts`
- Modify: `frontend/lib/adaptive/database.ts`
- Modify: frontend tests or lint/type checks touching these helpers

## Implementation Steps

1. Confirm the canonical SSR utilities already prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Audit direct `createClient` calls in frontend code and classify each as:
   - auth/session;
   - public read;
   - user-scoped read/write protected by RLS;
   - sensitive write that should move through FastAPI/BFF.
3. Remove legacy anon fallback from production browser helpers if deployment env parity is confirmed.
4. Make demo-mode mock clients explicitly dev/demo only and impossible to confuse with production Supabase.
5. Route sensitive adaptive/onboarding/profile writes through existing `/api/v1` BFF when they are not already there.
6. Add focused regression checks for missing publishable key behavior in production vs demo/dev.

## Success Criteria

- [x] Frontend uses publishable key naming consistently.
- [x] No frontend code references `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or backend-only aliases.
- [x] Direct Supabase frontend operations are documented as RLS-safe or moved behind backend API.
- [x] Missing publishable key fails clearly in production and remains explicit in demo/dev.

## Risk Assessment

Risk: removing anon fallback before deployment envs are updated can break login. Mitigation: Phase 5 deploy checklist must confirm publishable key is set before fallback removal ships.

Risk: moving too many frontend paths behind FastAPI expands scope. Mitigation: only move sensitive writes or paths with weak RLS evidence; document remaining direct calls.
