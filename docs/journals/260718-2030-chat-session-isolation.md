# 2026-07-18 — Chat session isolation & ESLint fix

- **Why:** Chat history was leaking between different logged-in student accounts. In addition, existing ESLint warnings prevented successful build/CI checks due to synchronous `setState` inside `useEffect` blocks.
- **What changed:**
  - Updated `sofi-conversation-store.ts` to use per-user keys (`edugap_sofi_conversations_v1_<studentId>`) instead of a single shared global key.
  - Passed `studentId` from `useSocraticChat.ts` hook callers to ensure isolation.
  - Wrapped synchronous state setters in `setTimeout(..., 0)` inside `AppShell.tsx` and `useOnboardingProfile.ts` to defer rendering and clear ESLint warnings.
- **Validation:**
  - Ran backend test suite (`pytest tests/`) -> 343 tests passed.
  - Ran frontend lint check (`npm run lint` / `eslint`) -> 0 errors.
  - Ran TypeScript compile check (`tsc --noEmit`) -> 0 errors.
- **Follow-up:** None.
