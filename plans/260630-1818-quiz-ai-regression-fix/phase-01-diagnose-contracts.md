---
phase: 1
title: Diagnose Contracts
status: completed
priority: P1
dependencies: []
---

# Phase 1: Diagnose Contracts

## Overview

Lock the current intended UX contracts before editing. This prevents solving one screenshot complaint while breaking adaptive scoring, chat grounding, or mobile layout.

## Requirements

- Functional: map each teammate feedback item to an explicit UI state and owning component.
- Functional: identify whether the expected behavior is pre-submit, post-submit correct, post-submit wrong, mobile, desktop, or Socratic chat page.
- Non-functional: preserve adaptive submit/recommend semantics and current answer history persistence.

## Architecture

The quiz flow is split across `useQuizSession` for adaptive/question state, `useSocraticSidebar` for tutor chat/hints, `QuizQuestionView` for the main question/review UI, and `SocraticSidebarView` for overlay/mobile tutor rendering. The chat page has its own `SocraticChatTab` plus `ChatSidebar`.

## Related Code Files

- Modify later: `frontend/components/quiz/quiz-question-view.tsx`
- Modify later: `frontend/components/quiz/socratic-sidebar-view.tsx`
- Modify later: `frontend/app/hooks/useSocraticSidebar.ts`
- Modify later: `frontend/app/hooks/useQuizSession.ts`
- Modify later: `frontend/components/dashboard/socratic-chat/index.tsx`
- Modify later: `frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx`

## Implementation Steps

1. Write a short state matrix in implementation notes before code:
   - `answering`
   - `mcq-selected`
   - `mcq-correct`
   - `mcq-wrong`
   - adaptive next pending
   - chat collapsed desktop
2. Confirm UI copy:
   - visible button label must include `AI Hint`.
   - wrong-answer chat CTA can be `Hỏi AI vì sao sai`, but the tutor box must expose input/prefilled prompt once opened.
3. Confirm no backend or DB schema changes are needed.
4. Confirm citation data shape remains the existing `buildChatArtifacts` output.
5. Record any pre-existing lint/type failures before changing files.

## Success Criteria

- [ ] Every feedback item has a mapped component, state, and acceptance check.
- [ ] Implementation does not require backend API changes.
- [ ] Any pre-existing validation failures are captured before edits.

## Risk Assessment

Low technical risk, high UX sensitivity. The main risk is mixing quiz hint ladder and full chat affordance into one confusing action. Keep them separate: `AI Hint` increments hints; `Hỏi AI` opens chat.
