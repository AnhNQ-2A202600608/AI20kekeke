---
phase: 4
title: "Review Feedback"
status: completed
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4: Review Feedback

## Overview

Refine the `reviewing` state so feedback teaches the distinction, not just right/wrong. Keep the explanation concise and reveal detail on demand.

## Requirements

- Functional: show correct answer and selected wrong answer distinctly.
- Functional: show concise explanation first.
- Functional: show AI explanation CTA after checking.
- Functional: show primary next CTA as the dominant action.
- Non-functional: no long always-open right panel; no paragraph-heavy screen before user requests detail.

## Architecture

Feedback panel structure:

```text
Result line:
  Chính xác / Chưa đúng
Answer line:
  Đáp án đúng là B
Short reason:
  2-3 lines
Optional:
  visual explanation if compact and relevant
Actions:
  Tiếp tục câu N
  AI giải thích thêm / Hỏi AI vì sao mình sai
```

Visual explanations should be data/content-aware. Use a lightweight pipeline visual only when it clarifies the concept and does not require new generated content.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`
- Inspect: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx`

## Implementation Steps

1. Split feedback display into compact summary and optional full explanation.
2. For correct answers:
   - show `Đáp án đúng là {key}`.
   - show why the correct concept is right.
3. For wrong answers:
   - show selected wrong state.
   - show correct answer state.
   - show why selected answer is tempting/wrong when data allows.
4. Keep current heuristic explanation parser only if it helps; do not overfit string parsing.
5. Add optional compact pipeline visual for known concept patterns if simple and reusable.
6. Change AI CTA copy:
   - correct: `AI giải thích thêm`
   - wrong: `Hỏi AI vì sao mình sai`
7. Keep `Tiếp tục câu N` as the only high-emphasis CTA.
8. Ensure report/share remain accessible but secondary.

## Success Criteria

- [x] Reviewing state is readable without scrolling excessively on standard mobile.
- [x] Wrong answer feedback clearly distinguishes user choice from correct answer.
- [x] Explanation starts compact and can expand.
- [x] AI CTA opens the existing Socratic sheet/draft without changing quiz layout.
- [x] Next CTA is visually dominant and reachable.

## Risk Assessment

- Risk: Content lacks option-level explanations. Mitigation: use available explanation first; avoid hallucinated per-option details.
- Risk: Pipeline visual becomes hardcoded to tokenizer. Mitigation: only add a generic compact visual helper if it can degrade gracefully.
- Risk: Long explanation pushes next CTA away. Mitigation: keep CTA in sticky/footer region or place it before expandable detail.
