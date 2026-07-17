---
phase: 4
title: Unify Citation and Chat Actions
status: completed
priority: P1
dependencies:
  - 2
---

# Phase 4: Unify Citation and Chat Actions

## Overview

Restore citation buttons and citation-error/report affordances for wrong-answer material suggestions in the quiz tutor path.

## Requirements

- Functional: quiz tutor messages with citations render clickable citation buttons on desktop and mobile.
- Functional: clicking citation opens the related slide/image when available.
- Functional: if citation lacks image URL, still show source metadata and excerpt rather than hiding the whole citation block.
- Non-functional: reuse existing citation shape and avoid duplicate contracts.

## Architecture

`useSocraticSidebar` already enriches citations with `image_url`. `SocraticChatBody` renders citations only when `onZoom` is present. Desktop quiz rendering must pass `onZoom`, or citation rendering must be decoupled from zoom support.

## Related Code Files

- Modify: `frontend/components/quiz/socratic-sidebar-view.tsx`
- Modify: `frontend/components/quiz/quiz-question-view.tsx`
- Inspect/reuse: `frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx`
- Inspect: `frontend/lib/chat/stream.ts`

## Implementation Steps

1. Make `SocraticChatBody` render citations whenever `msg.citations.length > 0`.
2. Keep `onZoom` optional:
   - citation with `image_url` opens zoom.
   - citation without image expands excerpt/metadata.
3. Pass `onZoom={setZoomedImageUrl}` for desktop quiz sidebar if keeping lightbox ownership in `SocraticSidebarView` is feasible.
4. If desktop aside is rendered inside `QuizQuestionView`, move lightbox state to a shared wrapper or pass a callback from `SocraticSidebarView` to avoid duplicated modals.
5. Add or preserve `Báo lỗi trích dẫn` action for AI messages in the quiz tutor, matching main chat behavior.
6. Ensure confidence badge remains visible.

## Success Criteria

- [ ] Wrong-answer slide suggestion shows citation buttons in desktop quiz right panel.
- [ ] Same message shows citation buttons in mobile drawer.
- [ ] Citation click opens slide when `image_url` exists.
- [ ] Citation without image still displays source/slide/excerpt.
- [ ] Main Socratic chat citation behavior does not regress.

## Risk Assessment

The main risk is making citations look clickable when no slide can open. Use distinct disabled/metadata styling but do not hide citations entirely.
