---
phase: 1
title: Baseline & Contracts
status: completed
priority: P1
dependencies: []
---

# Phase 1: Baseline & Contracts

## Overview

Capture the current mobile failure and define the layout contract before touching UI code. This phase prevents a cosmetic-only patch that hides one screenshot bug while keeping the same viewport trap.

## Requirements

- Functional: identify exact states that must render correctly before answer, after correct answer, after wrong answer, after hint use, and with AI Tutor sheet open.
- Non-functional: no horizontal scroll, one primary mobile CTA, one main scroll region, stable touch targets, no text overlap at narrow widths.

## Architecture

The quiz workspace should have one outer viewport owner and one inner content scroll region. The question card should not fight the workspace with another fixed full-height lock. Feedback panels should be ordered by task importance:

1. Question and chosen answer context.
2. Correct/wrong state.
3. Explanation or next learning step.
4. Optional AI Tutor support.
5. Primary navigation action.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/adaptive/practice-scoring.ts`

## Implementation Steps

1. Reproduce the provided screenshot state locally or with the closest quiz state available.
2. Record baseline screenshots for:
   - `240x465`
   - `360x800`
   - `390x844`
   - desktop width
3. Inventory all UI elements rendered in `QuizQuestionView` by state:
   - pre-submit MCQ
   - post-submit correct MCQ
   - post-submit wrong MCQ
   - essay post-submit
   - selected hint visible
   - report modal open
4. Confirm current scoring display is read-only UI:
   - `calculatePracticeEloProgression` is display-side only.
   - `useQuizSession` owns submitted state.
   - no plan step changes adaptive persistence.
5. Write down mobile layout invariants in implementation notes before code edits.

## Success Criteria

- [ ] Baseline screenshots or written observations capture the current clipping/crowding.
- [ ] Layout invariants are documented in the implementation notes or PR summary.
- [ ] No code change touches adaptive scoring, BKT, backend endpoint contracts, or database logic.
- [ ] The implementation owner can explain which element owns page scrolling on mobile.

## Risk Assessment

- Risk: a developer starts by changing random Tailwind classes. Mitigation: require baseline capture first.
- Risk: scoring bugs get mixed with UI work. Mitigation: explicitly exclude algorithm files unless a display-only import breaks.
