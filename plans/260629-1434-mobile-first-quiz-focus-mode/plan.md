---
title: "Mobile-first Quiz Focus Mode"
description: "Reduce mobile quiz cognitive load and layout movement by turning the quiz into a stable focus-mode flow with progressive disclosure for feedback, hints, and AI Tutor."
status: completed
priority: P1
branch: "dev"
tags: [frontend, mobile, quiz, ux, refactor]
blockedBy: []
blocks: [260629-1245-adaptive-first-frontend-quiz]
created: "2026-06-29"
createdBy: "ck:plan"
source: skill
---

# Mobile-first Quiz Focus Mode

## Overview

Refactor the mobile quiz experience around a focus-mode contract: one learning decision per screen, one feedback insight after answer, and one primary bottom action. The goal is not a visual reskin; it is to reduce information density, stop large layout jumps, and make optional help available through progressive disclosure.

This plan is presentation-layer only. It must not change adaptive scoring, Elo/BKT formulas, backend contracts, persistence semantics, or quiz content.

## Scope Challenge

- Existing code: `QuizWorkspace`, `QuizQuestionView`, `SocraticSidebarView`, `useQuizSession`, and `QuizResults` already own the mobile shell, question state, feedback, AI Tutor sheet, and result layout.
- Minimum change set: define a mobile state contract, stabilize shell/scroll ownership, compress post-answer feedback, demote AI Tutor and report actions into secondary affordances, then verify responsive behavior.
- Complexity: expected 3-5 frontend files plus optional visual verification script. No new service, no new API, no new data model.
- Selected scope: HOLD SCOPE. Fix hierarchy and stability first; defer adaptive data-flow migration.

## UX Contract

```text
One screen = one learning decision.
One answer = one feedback insight.
One footer = one primary next action.
Everything else = reveal on demand.
```

Mobile state hierarchy:

| State | Primary surface | Secondary surface |
| --- | --- | --- |
| Not submitted | Question + answers | AI Hint trigger, skip/unknown |
| Submitted correct | Correct state + short explanation | Full explanation details |
| Submitted wrong | Correction + correct answer + short reason | AI Tutor prompt, report issue |
| Hint open | Current hint only | Previous/next hint controls |
| AI Tutor open | Bottom sheet | Quiz remains stable behind overlay |
| Finished | Result summary | Review incorrect answers |

## Non-Goals

- Do not change `/api/v1/adaptive/recommend`, `/api/v1/adaptive/submit`, `/adaptive/sync-mastery`, or fallback behavior.
- Do not change local scoring helpers or backend source-of-truth decisions.
- Do not redesign the full dashboard, learning path, or desktop layout beyond shared-class regressions.
- Do not add new mascot, celebratory animation, or extra gamification.
- Do not hide required correctness feedback; reduce and stage it.

## Research Inputs

- NN/g progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Material Design bottom sheets: https://m3.material.io/components/bottom-sheets/overview
- Duolingo product pattern: short lesson step, focused answer, brief feedback.
- Brilliant product pattern: interactive prompt first, explanation after action.
- Quizlet/Khan Academy product pattern: practice flow keeps hints/explanations available without making them equal to the answer task.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Note |
| --- | --- | --- | --- |
| Blocks | `plans/260629-1245-adaptive-first-frontend-quiz/` | pending | Adaptive migration touches `useQuizSession`, `QuizQuestionView`, and feedback displays. Implement focus-mode hierarchy first to avoid migrating backend-powered feedback into unstable mobile UI. |
| Builds on | `plans/260629-1232-mobile-quiz-ui-stabilization/` | completed | That plan fixed clipping/viewport basics. This plan addresses remaining cognitive load and layout movement. |
| Related | `plans/260620-1700-socratic-adaptive-fallback/` | planned | Future fallback toast must use the same secondary-action hierarchy and must not compete with the main quiz action. |

## Key Files

- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Baseline UX Contract](./phase-01-baseline-ux-contract.md) | Completed |
| 2 | [Stable Quiz Shell](./phase-02-stable-quiz-shell.md) | Completed |
| 3 | [Progressive Feedback](./phase-03-progressive-feedback.md) | Completed |
| 4 | [AI Tutor Sheet](./phase-04-ai-tutor-sheet.md) | Completed |
| 5 | [Responsive Verification](./phase-05-responsive-verification.md) | Completed |

## Dependencies

- Next.js 16, React 19, Tailwind 4, `motion/react`, `lucide-react`.
- Existing Sapia design direction in `docs/product/design-guidelines.md`.
- Screenshot reference: `C:/Users/LENOVO/AppData/Local/Temp/codex-clipboard-a6f4bed6-a0c2-4369-8a0c-d4232c562cbf.png`.

## Acceptance Criteria

- [x] At `240x465`, user can answer, see correctness, read the main explanation, and reach `Tiếp tục` without incoherent overlap or horizontal scroll.
- [x] At `360x800` and `390x844`, submitting an answer does not cause a large vertical jump that hides the primary CTA.
- [x] Mobile header shows progress without cramming source, Elo, share, report, and AI controls into the same row.
- [x] Post-answer state has one dominant feedback path; hints, AI Tutor, and report issue are secondary.
- [x] AI Tutor bottom sheet opens and closes without changing quiz layout behind it.
- [x] Desktop remains visually equivalent or improved.
- [x] `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass in `frontend/`.

## Verification

See [reports/verification.md](./reports/verification.md).

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260629-1434-mobile-first-quiz-focus-mode\plan.md
```
