---
phase: 3
title: "Accessibility Interaction Pass"
status: completed
priority: P1
dependencies: [1, 2]
---

# Phase 3: Accessibility Interaction Pass

## Overview

Fix the concrete accessibility and interaction violations from the scan without redesigning page flows.

## Requirements

- Functional: all audited icon-only buttons have accessible names; action controls are semantic buttons; destructive actions have confirmation or undo.
- Non-functional: focus states remain visible and keyboard behavior works across desktop/mobile.

## Architecture

Use semantic HTML first:

- `button` for UI actions.
- `Link`/`a` for navigation.
- `aria-label` for icon-only buttons.
- `aria-expanded`/`aria-controls` for collapsible panels where practical.
- `role="dialog"` plus Escape/backdrop close behavior for modal/lightbox/drawer surfaces.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/slide-viewer.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-page.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/btc-heatmap.tsx`

## Implementation Steps

1. Replace icon-only `title` reliance with `aria-label`.
2. Replace clickable drawer handle `div` with a `button` and accessible label.
3. Replace `alert()` flows with inline status/toast/modal:
   - missing skill/set in quiz start
   - teacher heatmap workshop action
4. Add confirmation or undo for delete-history actions.
5. Replace `focus:outline-none focus:ring-*` with `focus-visible:*` on audited controls.
6. Replace `transition-all` in audited files with explicit transitions:
   - `transition-colors`
   - `transition-transform`
   - `transition-opacity`
   - `transition-[width]` only where width animation is intentional.
7. Add `overscroll-contain` to drawers/lightboxes where missing.

## Success Criteria

- [x] `rg` scan no longer finds icon-only audited controls without `aria-label`.
- [x] No audited clickable `div` remains.
- [x] No audited `alert()` remains.
- [ ] Destructive chat history delete has confirm or undo.
- [ ] Keyboard smoke test passes for chat sidebar, slide viewer, and quiz/app actions.

## Risk Assessment

- Risk: confirmation modal adds friction.
  Mitigation: use undo toast for low-risk local history delete; use confirm only for irreversible server actions.
- Risk: drawer focus trap scope grows.
  Mitigation: add Escape and labels first; focus trap only if current modal behavior is demonstrably confusing.
