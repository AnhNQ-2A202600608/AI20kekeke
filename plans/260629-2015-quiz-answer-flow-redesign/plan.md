---
title: "Quiz Answer Flow Redesign"
description: "Improve the quiz page learning loop with answering, selected, and reviewing states while preserving focus, adaptive scoring, and compact learning status."
status: completed
priority: P1
branch: "codex/adaptive-first-frontend-quiz"
tags: [feature, frontend, quiz, ux]
blockedBy: []
blocks: []
created: "2026-06-29"
createdBy: "ck:plan"
source: skill
---

# Quiz Answer Flow Redesign

## Overview

Redesign the active quiz answer flow from instant grading to a three-state learning interaction:

```text
answering -> selected -> reviewing
```

The goal is to keep the current focused quiz layout, restore/strengthen the top learning status panel, move hint help into the question flow, and make post-answer feedback a clear learning moment. This is a frontend interaction plan. It must not change backend adaptive scoring, Elo/BKT math, question recommendation, persistence semantics, or quiz content generation.

## UX Decision

Final flow:

| State | User intent | UI contract |
| --- | --- | --- |
| `answering` | Read, think, optionally request hint | Top status panel, question, options, compact hint ladder, compact Sofi affordance |
| `selected` | Confirm the intended answer | Selected option highlighted, no correctness revealed, footer shows `Bỏ chọn` and `Kiểm tra đáp án` |
| `reviewing` | Learn from result | Correct/wrong option states, concise explanation panel, primary `Tiếp tục câu N`, secondary AI explanation |

## Non-Goals

- Do not change `/api/v1/adaptive/recommend` or `/api/v1/adaptive/submit`.
- Do not change Elo/BKT, hint penalty calculation, attempt logging, or backend source-of-truth behavior.
- Do not add a permanent desktop right panel that competes with the question.
- Do not show long Sofi coach cards before the learner answers.
- Do not redesign dashboard, results page, or course map except for regressions caused by shared quiz components.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Note |
| --- | --- | --- | --- |
| Builds on | `plans/260629-1434-mobile-first-quiz-focus-mode/` | completed | Keeps progressive disclosure and stable mobile shell as baseline. |
| Builds on | `plans/260629-1245-adaptive-first-frontend-quiz/` | completed | Preserve adaptive backend submit as source of truth; only delay submit until explicit check. |
| Related | `plans/20260618-1748-integrate-quiz-header-to-card/` | completed | Previous work removed standalone header; this plan reintroduces a compact top learning status inside the current shell, not the old header component. |

## Key Files

- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/types.ts`
- `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/createPracticeSlice.ts`

## Acceptance Criteria

- [ ] MCQ click does not submit immediately; it enters `selected`.
- [ ] `Kiểm tra đáp án` submits exactly once through existing adaptive submit flow.
- [ ] `Bỏ chọn` returns to `answering` without attempt history, Elo/BKT mutation, or hint count reset.
- [ ] `reviewing` shows correct answer, selected wrong answer if any, short explanation, and next action.
- [ ] Top learning status shows question progress, topic/difficulty, streak, Elo, report, and share on desktop.
- [ ] Mobile header remains compact and has no horizontal scroll or text overlap at `240x465`, `360x800`, and `390x844`.
- [ ] Hint ladder is visible near the answer flow; `Bỏ qua & xem giải thích` is not the first escape hatch.
- [ ] AI Tutor is subtle before answering and more available after reviewing.
- [ ] `pnpm --dir frontend exec tsc --noEmit`, `pnpm --dir frontend lint`, and `pnpm --dir frontend build` pass.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [State Contract](./phase-01-state-contract.md) | Completed |
| 2 | [Header And Hint UI](./phase-02-header-and-hint-ui.md) | Completed |
| 3 | [Selection Confirmation](./phase-03-selection-confirmation.md) | Completed |
| 4 | [Review Feedback](./phase-04-review-feedback.md) | Completed |
| 5 | [Verification](./phase-05-verification.md) | Completed |

## Dependencies

- Next.js 16, React 19, Tailwind 4, `motion/react`, `lucide-react`.
- Existing design tokens in `docs/product/design-guidelines.md`.
- Existing adaptive quiz contract from completed plan `260629-1245-adaptive-first-frontend-quiz`.
- Existing mobile focus contract from completed plan `260629-1434-mobile-first-quiz-focus-mode`.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260629-2015-quiz-answer-flow-redesign\plan.md
```
