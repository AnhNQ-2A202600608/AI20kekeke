---
title: Quiz AI Regression Fix
description: >-
  Fix quiz tutor regressions: hidden AI hint, wrong-answer chat affordance,
  missing quiz citation buttons, adaptive question loading jank, and duplicate
  chat navigation controls.
status: completed
priority: P1
branch: codex/adaptive-first-frontend-quiz
tags:
  - bugfix
  - frontend
  - quiz
  - chat
  - performance
blockedBy: []
blocks: []
created: '2026-06-30T11:18:57.973Z'
createdBy: 'ck:plan'
source: skill
---

# Quiz AI Regression Fix

## Overview

Team feedback points to a frontend regression cluster introduced by recent quiz answer flow and chat modularization work. The fix should preserve the current adaptive backend contracts while restoring the expected student UX:

- AI tutor is hidden until the learner opens it.
- A visible `AI Hint` action exists before submit and increments the existing hint ladder.
- Wrong-answer state exposes a chat input/prompt path in the tutor box, not only a passive mascot teaser.
- RAG citations from wrong-answer slide suggestions show clickable citation buttons in the quiz tutor panel.
- Adaptive next-question transitions avoid replacing the whole question screen with a 1s loading card.
- The Socratic chat page shows one navigation menu control, not two adjacent hamburger buttons.

## Confirmed Root Causes

| Feedback | Confirmed cause | Evidence |
| --- | --- | --- |
| Tutor should open only when user clicks | Partially implemented, but UX is split: overlay sheet honors `isSocraticOpen`, while desktop post-submit aside renders automatically once submitted. | `frontend/app/components/quiz-workspace.tsx` only opens overlay on state; `frontend/components/quiz/quiz-question-view.tsx:1071` renders desktop aside whenever `isSubmitted && currentQuestion.options`. |
| Missing `AI Hint` button | Hint state exists, but the actual button was removed/renamed during redesign. `handleRequestNextHint` is unused. | `frontend/components/quiz/quiz-question-view.tsx:473`; no caller in `rg`; footer shows `Sofi · Trợ lý học tập` at `:1128-1140`. |
| Moving to next question loads about 1s | Adaptive flow calls `setIsLoadingQuestions(true)` while awaiting `/adaptive/recommend`, causing `QuizWorkspace` to swap the whole view for `LoadingQuestionsCard`. | `frontend/app/hooks/useQuizSession.ts:907-922`; `frontend/app/components/quiz-workspace.tsx:29-41`. |
| Citation button missing for wrong-answer related materials | Quiz sidebar desktop reuses `SocraticChatBody` without `onZoom`; citations render only when `onZoom` exists. | `frontend/components/quiz/socratic-sidebar-view.tsx:300-302`; desktop call at `frontend/components/quiz/quiz-question-view.tsx:1083-1091` omits `onZoom`. |
| Wrong answer has no prompt input in chat box | Wrong-answer suggestion fetch runs in background, but desktop tutor box stays in teaser state until the learner clicks footer/nudge. | `frontend/app/hooks/useSocraticSidebar.ts:202-230`; `frontend/components/quiz/quiz-question-view.tsx:1081-1113`. |
| Two menu bars/buttons in chat | Collapsed `ChatSidebar` renders its own expand menu, and `SocraticChatTab` header renders another desktop expand menu when collapsed. | `frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx:156-166`; `frontend/components/dashboard/socratic-chat/index.tsx:135-142`. |

## Scope

In scope:

- Frontend-only fixes in quiz and Socratic chat UI.
- Keep existing adaptive API, chat API, Elo/BKT, and persisted answer history contracts.
- Add focused tests where project tooling supports it; otherwise add Playwright/manual validation notes.

Out of scope:

- Backend RAG quality changes.
- Chat contract schema redesign.
- Full quiz layout redesign.
- New persistence schema for quiz tutor messages.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Note |
| --- | --- | --- | --- |
| Builds on | `plans/260629-2015-quiz-answer-flow-redesign/` | completed | Current regressions are in the redesigned quiz answer/review flow. |
| Builds on | `plans/260630-0935-chat-contract-schema-unification/` | completed | Use existing `buildChatArtifacts` and chat contracts; do not invent a new citation schema. |
| Related | `plans/20260624-0115-socratic-interactive-agent-implementation/` | in-progress | Backend agent widgets are not required for this frontend regression fix. |

## Key Files

- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/index.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx`

## Acceptance Criteria

- [x] Pre-submit MCQ state has a visible `AI Hint` button that unlocks hint 1/2/3 and updates hint penalty count.
- [x] Tutor/chat panel does not auto-open on fresh unanswered questions.
- [x] Wrong-answer review state shows an actionable chat input or one-click prefilled prompt in the tutor box on desktop and mobile.
- [x] Wrong-answer RAG slide suggestions show clickable citation buttons in quiz tutor desktop and mobile.
- [x] Adaptive next question keeps the current review UI visible while fetching; no full-screen question loading card between answered questions.
- [x] Next button disables or shows inline progress while recommendation is pending to prevent double-click duplicate fetches.
- [x] Socratic chat collapsed state shows only one hamburger/expand control.
- [x] `pnpm --dir frontend exec tsc --noEmit` passes.
- [x] `pnpm --dir frontend lint` passes or reports only pre-existing unrelated failures with evidence.
- [x] Visual/manual checks cover quiz wrong answer, quiz hint, adaptive next, and chat collapsed menu.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Diagnose Contracts](./phase-01-diagnose-contracts.md) | Completed |
| 2 | [Restore Quiz Tutor UX](./phase-02-restore-quiz-tutor-ux.md) | Completed |
| 3 | [Reduce Question Transition Latency](./phase-03-reduce-question-transition-latency.md) | Completed |
| 4 | [Unify Citation and Chat Actions](./phase-04-unify-citation-and-chat-actions.md) | Completed |
| 5 | [Fix Duplicate Chat Navigation](./phase-05-fix-duplicate-chat-navigation.md) | Completed |
| 6 | [Verification](./phase-06-verification.md) | Completed |

## Dependencies

- Next.js frontend under `frontend/`.
- Existing design tokens and tactile style from `docs/product/design-guidelines.md`.
- Existing chat artifact adapter in `frontend/lib/chat/stream.ts`.
- Existing adaptive API client in `frontend/lib/adaptive/api-client.ts`.

## Red Team Review

1. Risk: hiding the desktop tutor aside completely could remove useful post-answer coaching.
   Decision: do not remove coaching; make it on-demand before submit and actionable after wrong answers.
2. Risk: reducing loading jank by prefetching next adaptive question before submit could mutate recommendation order too early.
   Decision: first fix should keep recommendation after answer, but make loading inline instead of replacing the screen. Prefetch can be a later optimization if backend semantics allow it.
3. Risk: citation rendering in quiz sidebar may diverge from main chat if duplicated.
   Decision: reuse/shared citation renderer or pass required props consistently; avoid a second citation UI contract.
4. Risk: changing chat menu controls could break mobile navigation.
   Decision: keep mobile drawer button; remove only the duplicate desktop collapsed expand control.

## Validation Log

- Fact-checked paths and symbols with `rg`/file reads on 2026-06-30.
- Verified `handleRequestNextHint` exists but has no caller.
- Verified desktop quiz sidebar omits `onZoom` while citation rendering requires it.
- Verified adaptive next question toggles global `isLoadingQuestions`.
- Verified duplicate collapsed chat menu controls in `ChatSidebar` and `SocraticChatTab`.
- Implemented on 2026-06-30:
  - added `isLoadingNextQuestion` for adaptive next-question fetches.
  - restored pre-submit `AI Hint` button and hint counter.
  - rendered wrong-answer tutor chat input with a prefilled editable prompt.
  - rendered quiz tutor citations independent of zoom support and added citation report affordance.
  - removed duplicate desktop collapsed chat expand button.
- Verification:
  - Passed `pnpm --dir frontend exec tsc --noEmit`.
  - Passed `pnpm --dir frontend lint`.
  - Browser smoke at `http://localhost:3000/app`: verified `AI Hint 0/3`, hint panel after click, wrong-answer tutor prompt input, inline next button, and single desktop collapsed chat expand control.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260630-1818-quiz-ai-regression-fix\plan.md
```
