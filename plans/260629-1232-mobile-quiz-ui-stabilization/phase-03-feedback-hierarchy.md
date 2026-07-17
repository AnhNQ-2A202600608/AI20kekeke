---
phase: 3
title: Feedback Hierarchy
status: completed
priority: P1
dependencies:
  - 2
---

# Phase 3: Feedback Hierarchy

## Overview

Make the post-answer state understandable. The current UI shows too many equally loud panels after a wrong answer; this phase establishes a single learning path and demotes optional help.

## Requirements

- Functional: correct/wrong state, explanation, selected answer, AI Tutor help, and next action are all visible or reachable in a predictable order.
- Non-functional: avoid duplicate cards; keep copy concise; preserve current AI Tutor open/draft behavior.

## Architecture

Feedback should render as a compact state machine:

```text
not submitted -> answer choices + optional hint
submitted correct -> success state + explanation + next
submitted wrong -> correction state + explanation + compact AI Tutor action + next
essay submitted -> reference answer + checklist + optional AI Tutor action + next
```

The AI Tutor nudge remains connected to `openSocraticWithDraft`, but it should not be a full-height card competing with the answer feedback on small screens.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`

## Implementation Steps

1. Compact `wrongAnswerTutorNudge`:
   - on mobile, render as a small action row or inline button near explanation.
   - preserve full context on larger screens if useful.
2. Consolidate post-answer panels:
   - avoid stacking AI Tutor nudge, wrong answer card, explanation card, and hint card above the fold at once.
   - make the main explanation visually dominant.
3. Ensure answer cards do not keep excessive height after submission:
   - preserve readability.
   - reduce visual bulk for non-selected options if needed.
4. Make selected hints subordinate:
   - hint deck should not push primary feedback/CTA out of reach after answer unless user explicitly opened it.
5. Check AI Tutor sheet mobile ergonomics:
   - `h-[78vh]` may be acceptable, but header/status rows should not crowd the input.
   - safe-area bottom padding should protect input on iOS-like browsers.

## Success Criteria

- [ ] Wrong-answer state has one clear primary explanation path.
- [ ] AI Tutor help remains available with the existing prepared prompt behavior.
- [ ] A user can reach `Tiếp tục` without visually parsing four competing cards.
- [ ] Hint content does not unexpectedly dominate post-submit feedback.
- [ ] Socratic sheet still opens from both footer trigger and wrong-answer action.

## Risk Assessment

- Risk: demoting AI Tutor reduces help usage. Mitigation: keep the action visible but smaller; do not bury it in a menu.
- Risk: changing feedback order breaks essay flow. Mitigation: verify essay and MCQ branches separately.
