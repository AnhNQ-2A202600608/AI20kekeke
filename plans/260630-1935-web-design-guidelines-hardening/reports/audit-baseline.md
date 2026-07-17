# Web Design Guidelines Audit Baseline

Generated: 2026-06-30

Source rules: Vercel Web Interface Guidelines, project sizing baseline in `docs/product/design-guidelines.md`, and the plan acceptance criteria.

## Findings

| Severity | Owner Phase | Area | Evidence | Fix Direction |
| --- | --- | --- | --- | --- |
| P1 | 2 | Button sizing drift | `frontend/app/login/page.tsx` uses raw `.btn-3d` with `min-h-14`, `min-h-12`, and `px-7` for primary login actions. | Move login CTA actions to shared `TactileButton` with `lg` and `md` sizes. |
| P1 | 2 | Button sizing drift | `frontend/components/landing/landing-page.tsx` and `frontend/components/landing/landing-cta.tsx` use raw `.btn-3d` link classes. | Use shared button class helper for `Link` elements. |
| P1 | 2 | Quiz action drift | `frontend/components/quiz/quiz-question-view.tsx` uses raw `.btn-3d` for footer AI/continue actions. | Keep quiz behavior stable; migrate to shared button sizing in the focused quiz pass. |
| P0 | 3 | Blocking browser alert | `frontend/app/hooks/useQuizSession.ts` calls `alert()` when a skill/set is missing. | Replace with inline adaptive/session error state. |
| P1 | 3 | Icon-only accessibility | `frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx` relies on `title` for collapsed navigation/history/delete actions. | Add `aria-label`, `type="button"`, and explicit transition classes. |
| P1 | 3 | Slide viewer controls | `frontend/components/dashboard/socratic-chat/components/slide-viewer.tsx` has icon-only controls with `title` only and a clickable drawer `div`. | Add accessible labels and replace the drawer handle with a semantic button. |
| P1 | 3 | Teacher heatmap alert | `frontend/components/dashboard/btc-heatmap.tsx` uses `alert()` for workshop request. | Replace with inline status message. |
| P1 | 4 | Internal system copy | `frontend/components/dashboard/socratic-chat/components/chat-input-bar.tsx` shows `Socratic RAG v2` and unfinished attachment copy. | Use student-facing copy and hide/disable incomplete upload affordance with a product explanation. |
| P1 | 4 | Internal trace labels | `frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx` exposes `/agent-reasoning-trail`, `tool`, `ms`, `Parameters`, `Observation`, and `Code sandbox`. | Rename visible labels to product concepts while keeping details inside expandable UI. |
| P1 | 4 | Demo/sandbox leakage | `frontend/app/components/dashboard-layout.tsx`, `frontend/components/dashboard/mentor-dashboard.tsx`, and `frontend/components/dashboard/btc-heatmap.tsx` mention sandbox/demo internals. | Phrase demo states as sample data only when demo mode is active. |
| P2 | 3 | Transition scope | Multiple audited route files use `transition-all`. | Replace touched interactions with `transition-colors`, `transition-transform`, `transition-opacity`, or targeted transitions. |

## Initial Inventory

Static scan confirmed raw button drift in the high-traffic route files:

- `frontend/components/landing/landing-page.tsx`
- `frontend/components/landing/landing-cta.tsx`
- `frontend/app/login/page.tsx`
- `frontend/components/quiz/quiz-question-view.tsx`
- `frontend/components/dashboard/socratic-chat/components/chat-input-bar.tsx`

Static scan also confirmed broader long-tail drift in mentor/admin/dashboard surfaces. Those remain follow-up scope unless the file is touched by this hardening pass.

## Scope Guard

This implementation pass will first harden the shared button primitive and the landing/login/chat/teacher heatmap touchpoints. Quiz hint behavior and adaptive next-question prefetch are preserved unless verification reveals a regression.
