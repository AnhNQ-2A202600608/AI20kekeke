---
title: "Scout Report: Auth Onboarding Real Data Hardening"
created: "2026-06-30"
---

# Scout Report

## Summary

The codebase already has real backend integration through the Next.js BFF proxy, but production and demo behavior are mixed. Auth fallback is the highest-risk boundary because frontend and backend both tolerate user-id-derived bearer values.

## Key Paths

| Area | Evidence |
| --- | --- |
| BFF proxy | `frontend/app/api/v1/[...path]/route.ts` forwards `/api/v1/*` requests to FastAPI. |
| Frontend token helper | `frontend/lib/auth-token.ts` returns `fallbackUserId` when token missing or expired. |
| Backend auth boundary | `src/api/adaptive_routes.py` parses `fake-jwt-token-*`, raw UUID, JWT, and `service_role`. |
| Login page | `frontend/app/login/page.tsx` has `handleBypass` and "Vao lop demo". |
| Login modal | `frontend/components/LoginScreen.tsx` has role-based bypass and fake token creation. |
| Onboarding gate | `frontend/components/onboarding/onboarding-gate.tsx` lacks immediate `persist.hasHydrated()` check. |
| Onboarding page | `frontend/components/onboarding/onboarding-page.tsx` allows local finish on offline state. |
| Adaptive quiz | `frontend/app/hooks/useQuizSession.ts` calls `/adaptive/recommend` and `/adaptive/submit`, but falls back to `static-demo`. |
| Chat stream | `frontend/lib/chat/stream.ts` retries 401 with `Authorization: Bearer ${studentId}`. |
| Chat demo paths | `frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts` has keyword-triggered mock slides/citations. |
| Profile generated data | `frontend/components/dashboard/profile/utils/profile-utils.ts` uses fixed dates and generated chart data. |
| Mentor mock data | `frontend/components/dashboard/mentor/class-insights-tab.tsx`, `quiz-editor-tab.tsx`, and `ingestion-tab.tsx` contain static student/question/document data. |
| BTC mock data | `frontend/components/dashboard/btc-heatmap.tsx` uses `MOCK_HEATMAP`. |

## Existing Patterns To Reuse

- FastAPI dependencies for auth/RBAC.
- Next.js route handlers for backend proxying.
- Zustand store for user/session state.
- Existing onboarding API functions.
- Existing adaptive API client.
- Existing mentor wrapper already labels some mentor data as sandbox.

## Main Gaps

1. No single production/demo mode contract.
2. Frontend token fallback violates backend auth expectations.
3. Backend live mode accepts non-JWT raw UUID.
4. Local onboarding completion can suppress future backend sync.
5. Mock operational dashboards are not consistently labeled or isolated.

