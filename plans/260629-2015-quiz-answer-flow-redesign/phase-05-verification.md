---
phase: 5
title: "Verification"
status: completed
priority: P1
dependencies: [1, 2, 3, 4]
---

# Phase 5: Verification

## Overview

Verify behavior, adaptive contract preservation, responsive layout, and accessibility basics after the flow change.

## Requirements

- Functional: all three states work for MCQ adaptive and fallback/demo paths.
- Functional: hint count and submit result remain correct.
- Non-functional: no mobile overlap, no horizontal scroll, no broken build.

## Architecture

Validation layers:

```text
unit/type/lint -> manual flow checks -> responsive screenshots -> build
```

## Related Code Files

- Inspect: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Inspect: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Inspect: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`
- Optional create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/260629-2015-quiz-answer-flow-redesign/reports/verification.md`

## Implementation Steps

1. Run static checks:
   - `pnpm --dir frontend exec tsc --noEmit`
   - `pnpm --dir frontend lint`
2. Run production build:
   - `pnpm --dir frontend build`
3. Manually verify MCQ state flow:
   - answering: click option only highlights.
   - selected: `Bỏ chọn` clears.
   - selected: `Kiểm tra đáp án` submits once.
   - reviewing: next question works.
4. Verify hint flow:
   - Hint 1 opens first.
   - Hint 2/3 unlock progressively.
   - final submit includes actual hint count.
5. Verify adaptive behavior:
   - submit uses existing backend adaptive path.
   - Elo/BKT deltas render from backend result.
   - submit error remains recoverable.
6. Verify responsive sizes:
   - `240x465`
   - `360x800`
   - `390x844`
   - desktop wide
7. Check accessibility basics:
   - keyboard selection and Enter check.
   - visible focus states.
   - correctness not conveyed by color alone.
8. Write verification report if implementation happens in a separate cook session.

## Success Criteria

- [x] TypeScript passes.
- [x] Lint passes.
- [x] Build passes.
- [x] Manual flow checks pass for answering, selected, reviewing.
- [x] No mobile text overlap or horizontal scroll in checked viewport sizes.
- [x] No backend scoring/API contract changes.

## Risk Assessment

- Risk: Existing build warnings obscure new issues. Mitigation: record known warnings separately and fail only on new errors.
- Risk: Visual regressions on very small screens. Mitigation: test the existing project-critical `240x465` viewport.
- Risk: Adaptive backend unavailable locally. Mitigation: verify demo fallback and document backend-dependent checks separately if needed.
