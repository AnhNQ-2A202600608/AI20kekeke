---
phase: 3
title: "Demo Fallback Governance"
status: completed
priority: P1
dependencies: [1, 2]
---

# Phase 3: Demo Fallback Governance

## Context Links

- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/login/page.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LoginScreen.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/api/v1/[...path]/route.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/supabase.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/auth_routes.py`

## Overview

Separate demo behavior from production behavior. Demo login, mock Supabase, keyword chat mocks, and backend offline fallbacks must be explicit, gated, and labeled.

## Requirements

- Functional:
  - Demo bypass controls appear only when `NEXT_PUBLIC_DEMO_MODE=true` or local dev equivalent.
  - Backend fake-token login works only when `AUTH_ALLOW_DEV_TOKENS=true` or stub DB mode.
  - Mock Supabase client cannot run silently in production builds.
  - Chat mock trigger branches are disabled outside demo mode.
  - BFF proxy 503 is an error state, not a fake successful data path.
- Non-functional:
  - Keep demos easy to run.
  - Avoid scattering `process.env` checks across many components.

## Architecture

Add one small frontend helper:

```ts
export const isDemoMode = () =>
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';
```

Use this helper to gate UI bypasses and client-side demo branches. Backend uses a separate server-only env so frontend cannot enable protected fake auth by itself.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/demo-mode.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/login/page.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LoginScreen.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/supabase.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/auth_routes.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/.env.example`

## Implementation Steps

1. Define demo mode env contract.
   - Frontend: `NEXT_PUBLIC_DEMO_MODE`.
   - Backend: `AUTH_ALLOW_DEV_TOKENS`.
   - Document both in `.env.example`.
2. Gate demo login UI.
   - Hide "Vao lop demo" in `frontend/app/login/page.tsx` unless demo mode.
   - Hide role quick login in `frontend/components/LoginScreen.tsx` unless demo mode.
   - When visible, label as demo/sandbox, not production login.
3. Gate backend fake auth.
   - `auth_routes.py` stub mock users remain for stub DB mode.
   - Live DB fake token generation or acceptance requires `AUTH_ALLOW_DEV_TOKENS=true`.
4. Gate chat demo branches.
   - Keyword branches that generate `mockSlides`, `mockCitations`, and synthetic sandbox runs should run only in demo mode.
   - Outside demo mode, every chat request should go through `streamChatRequest`.
5. Harden mock Supabase client.
   - `frontend/lib/supabase.ts` should throw or expose an explicit unavailable client outside dev/demo when env missing.
   - Do not return random `mock-id-*` in production.
6. BFF offline behavior.
   - Keep 503 JSON, but ensure frontend callers treat it as failure/offline.
   - No component should convert the BFF 503 to successful learning data.
7. UI labeling.
   - Reuse existing mentor sandbox banner pattern.
   - Add small consistent "Demo data" badges where demo mode content appears.

## Todo List

- [x] Frontend demo helper created.
- [x] Demo login buttons env-gated.
- [x] Backend fake/dev token acceptance env-gated.
- [x] Chat keyword mock branches env-gated.
- [x] Mock Supabase client fails visibly outside dev/demo.
- [x] `.env.example` documents demo mode.
- [x] Demo labels are visible where demo data is used.

## Success Criteria

- [x] Production env with `NEXT_PUBLIC_DEMO_MODE` unset shows no bypass login controls.
- [x] Production backend with `AUTH_ALLOW_DEV_TOKENS` unset rejects fake tokens.
- [x] Missing Supabase frontend env in production does not return random mock ids.
- [x] Chat demo prompts no longer bypass backend outside demo mode.
- [x] Local demo can still be run with explicit env flags.

## Risk Assessment

- Risk: demo stakeholders lose access to easy flows.
  - Mitigation: document env flags and keep demo UI polished when enabled.
- Risk: env names drift.
  - Mitigation: centralize helper and `.env.example`.
- Risk: partial gating leaves one bypass behind.
  - Mitigation: search for `fake-jwt-token`, `mockSlides`, `MOCK_`, `mock-id`, `bypass`, and `demo`.

## Security Considerations

- Frontend env can only hide/show UI. Backend server env decides fake-token acceptance.
- Never allow demo mode to grant admin/BTC in production unless explicitly isolated from live data.
