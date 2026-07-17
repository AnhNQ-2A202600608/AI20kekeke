---
phase: 2
title: Restore Quiz Tutor UX
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 2: Restore Quiz Tutor UX

## Overview

Restore the intended quiz tutor interaction: closed by default, visible `AI Hint` before submit, and actionable chat after wrong answers.

## Requirements

- Functional: add a pre-submit `AI Hint` button that calls existing hint logic.
- Functional: keep tutor closed on new unanswered questions unless user opens it.
- Functional: wrong-answer state must expose an input or prefilled prompt path in the visible tutor area.
- Non-functional: no new fake AI responses; use existing chat request path.

## Architecture

Use existing `quizHintCount`, `handleRequestQuizHint`, `sidebarInputValue`, `openSocraticWithDraft`, and `SocraticChatBody`. Avoid adding a second hint state.

## Related Code Files

- Modify: `frontend/components/quiz/quiz-question-view.tsx`
- Modify if needed: `frontend/app/hooks/useSocraticSidebar.ts`
- Modify if needed: `frontend/components/quiz/socratic-sidebar-view.tsx`

## Implementation Steps

1. Wire `handleRequestNextHint` to a visible `AI Hint` button in the pre-submit footer or near the answer actions.
2. Keep the existing hint deck display at `quizHintCount > 0`.
3. Make the button disabled or maxed at 3 hints with clear copy like `AI Hint 3/3`.
4. Separate the tutor chat toggle from hint increment:
   - `AI Hint` unlocks next hint.
   - `Hỏi AI` opens chat/sidebar.
5. For wrong answers, change the desktop aside default content so it includes:
   - a prefilled prompt preview or immediate `SocraticChatBody` with `sidebarInputValue`.
   - a clear send action.
6. Ensure new unanswered questions reset `isSocraticOpen=false` as currently done.
7. Remove stale copy that says "Hãy bấm nút AI Hint bên dưới" if the button location/copy changes.

## Success Criteria

- [ ] User can request hints before answering.
- [ ] Hint count and Elo penalty copy update correctly.
- [ ] Tutor does not pop open on question transition.
- [ ] Wrong-answer desktop view has a usable prompt/input path without hunting for footer controls.
- [ ] Mobile drawer still opens and sends messages.

## Risk Assessment

Do not auto-send wrong-answer prompts. Prefill is acceptable; auto-send can surprise users and burn API calls. If product wants auto-send later, make it a separate decision.
