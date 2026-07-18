---
phase: 2
title: Mobile App Shell
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 2: Mobile App Shell

## Overview

Fix the viewport and shell behavior so mobile content can breathe. The goal is not a full visual redesign; it is to remove the fixed-height/overflow trap and make header/footer responsive.

## Requirements

- Functional: quiz content scrolls predictably; bottom action remains reachable; header does not compress telemetry into an unreadable row.
- Non-functional: use existing components and Tailwind patterns; keep desktop behavior stable; avoid adding new dependencies.

## Architecture

`QuizWorkspace` should own the viewport using dynamic viewport units and safe-area-aware padding. `QuizQuestionView` should become a flexible panel with a compact mobile header, a scrollable body, and an action area that does not consume unnecessary height. Desktop can keep richer telemetry.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx`

## Implementation Steps

1. Replace brittle mobile viewport locking:
   - prefer `min-h-dvh` / `h-dvh` where supported by project Tailwind config.
   - remove unnecessary outer `overflow-hidden` if it prevents content recovery.
   - keep exactly one intended vertical scroll owner.
2. Tighten mobile padding:
   - reduce card body padding below `sm`.
   - reduce gaps between question, answers, and feedback.
   - keep desktop padding via `sm:`/`md:` variants.
3. Rebuild mobile header hierarchy:
   - primary: progress strip and `Câu x/y`.
   - secondary: source and Elo as compact/optional metadata.
   - keep report/share actions accessible but not layout-dominant.
4. Rebuild footer hierarchy:
   - hide keyboard hints on mobile.
   - expose one primary CTA when submitted.
   - keep AI Tutor and Hint as secondary icon/text buttons with stable widths.
   - use safe-area bottom padding.
5. Confirm desktop still supports keyboard hints and richer controls.

## Success Criteria

- [ ] Header does not overflow or visually collide at `240px` width.
- [ ] Footer no longer consumes two rows of scarce mobile height unless controls genuinely wrap.
- [ ] No horizontal scroll appears at mobile widths.
- [ ] Question body remains scrollable when feedback content is long.
- [ ] Desktop layout keeps the same functional controls.

## Risk Assessment

- Risk: using `position: sticky` inside the wrong overflow parent makes footer disappear. Mitigation: prefer normal flex footer first; only use sticky with verified scroll parent.
- Risk: compacting controls hides important actions. Mitigation: keep `Tiếp tục`, AI Tutor, and report reachable; demote only telemetry/hints.
