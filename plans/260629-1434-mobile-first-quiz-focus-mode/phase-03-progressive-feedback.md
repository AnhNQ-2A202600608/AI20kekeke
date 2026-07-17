---
phase: 3
title: "Progressive Feedback"
status: completed
priority: P1
dependencies: [1, 2]
---

# Phase 3: Progressive Feedback

## Overview

Replace competing post-answer panels with one dominant feedback path and on-demand detail. This is the main cognitive-load reduction phase.

## Requirements

- Functional: after submit, the learner immediately sees correct/wrong state, correct answer when needed, a concise explanation, and the next action.
- Non-functional: secondary content must not compete with primary feedback on mobile.

## Architecture

Render feedback as a compact state machine:

```text
not submitted -> answers + optional hint trigger
submitted correct -> success line + short why + next
submitted wrong -> correction line + correct answer + short why + next
essay submitted -> reference/checklist + self-grade action + next
```

Longer explanation details can be in an expandable disclosure. AI Tutor and report issue become secondary action chips/rows.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx`

## Implementation Steps

1. Split `parsedExplanation` into mobile summary and full detail:
   - summary: one concise paragraph
   - detail: expandable "Xem giải thích đầy đủ"
2. For correct MCQ:
   - show one success state
   - keep selected/correct option clear
   - show short explanation
3. For wrong MCQ:
   - show selected answer as wrong and correct answer as right
   - show one correction panel
   - move "Tại sao phương án khác chưa tối ưu" behind disclosure
4. For hints:
   - pre-submit: show current hint only when requested
   - post-submit: collapse hint deck unless learner explicitly reopens it
5. For report issue:
   - keep modal behavior
   - expose as a small secondary action, not a main-card block
6. Ensure `Tiếp tục` remains primary after feedback.

## Success Criteria

- [x] Post-answer mobile view never shows explanation, wrong-answer tutor card, hint deck, and report action as four equal-weight panels.
- [x] Correct answer and reason are visible without opening AI Tutor.
- [x] Full explanation remains reachable.
- [x] Report issue remains reachable.
- [x] Essay flow still supports self-grading and reference answer.

## Risk Assessment

- Risk: explanation truncation hides important learning content. Mitigation: summary plus explicit disclosure for full detail.
- Risk: secondary AI action becomes too hidden. Mitigation: keep visible action chip near wrong feedback.
