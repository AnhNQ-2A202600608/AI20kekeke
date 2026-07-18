# Technical Worklog

This file records key technical decisions, task assignments, direction changes, brainstorm conclusions, and important bug fixes.

---

## [2026-07-18] Isolate Chat Sessions per Student Account
- **Type:** Technical Decision / Bug Fix
- **Context:** Chat history was leaking across student accounts because the store used a single global key in localStorage (`edugap_sofi_conversations_v1`).
- **Resolution:** Modified [`frontend/lib/chat/sofi-conversation-store.ts`](frontend/lib/chat/sofi-conversation-store.ts) to read/write using student-specific keys (`edugap_sofi_conversations_v1_${studentId}`). Updated all calling hooks to correctly pass down `studentId`.

## [2026-07-18] Wrap searchParams-dependent Pages in Suspense
- **Type:** Bug Fix / Build Optimization
- **Context:** Next.js production build (`npm run build` using Turbopack compiler) failed due to `useSearchParams() should be wrapped in a suspense boundary` errors during static page generation.
- **Resolution:** Wrapped all pages and layouts consuming search parameters in `<Suspense>` containers. This resolved static generation bailouts across 16 student and general pages.

## [2026-07-18] Database & History Purge (Pre-July-15 Cleanup)
- **Type:** Data Administration
- **Context:** The user requested the removal of all history and development logs before July 15, 2026.
- **Resolution:** Deleted outdated journals from `docs/journals/` and executed a python script calling Supabase to delete chat records and messages created before July 15, 2026.
