---
title: Mobile Quiz UI Stabilization
description: >-
  Stabilize the mobile quiz experience by fixing viewport locking, reducing
  header/footer density, and making post-answer feedback readable without
  changing adaptive scoring logic.
status: completed
priority: P1
branch: dev
tags:
  - frontend
  - bugfix
  - ui
  - mobile
  - quiz
blockedBy: []
blocks: []
created: '2026-06-29'
createdBy: 'ck:plan'
source: skill
---

# Mobile Quiz UI Stabilization

## Overview

Mobile quiz UI is currently cramped and can clip content on small screens. The root cause is a fixed-height app shell plus nested `overflow-hidden` containers, a dense header, and too many post-answer panels rendered inline. This plan fixes the presentation layer only: no backend adaptive contract, no Elo/mastery algorithm changes, and no fake data.

## Scope Challenge

- Existing code: `QuizWorkspace`, `QuizQuestionView`, `SocraticSidebarView`, and `QuizResults` already own the quiz app shell, answer feedback, AI Tutor sheet, and result layout.
- Minimum changes: update mobile layout classes, restructure header/footer hierarchy, compact wrong-answer tutor prompt, and add visual verification.
- Complexity: expected 3-5 frontend files plus optional Playwright/screenshot script. No new service/class. Four phases because baseline and verification should be explicit.
- Selected mode: HOLD SCOPE with `--hard`; focus on robust execution and failure modes.

## Non-Goals

- Do not change adaptive/Elo/BKT formulas.
- Do not change `/adaptive/recommend`, `/adaptive/submit`, or quiz persistence contracts.
- Do not redesign the full desktop quiz UI unless desktop breaks from shared classes.
- Do not introduce mock data, fallback scoring, or hardcoded learning metrics.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Note |
| --- | --- | --- | --- |
| Related | `plans/20260618-1748-integrate-quiz-header-to-card/` | Planning | Same files; current code already reflects integrated header direction. Treat as design context, not a blocker. |
| Related | `plans/260620-1700-socratic-adaptive-fallback/` | planned | Future quiz toast/fallback UI must fit the mobile hierarchy created here. |
| Related | `plans/20260621-1217-elo-system-calibration-plan/` | pending review | Elo display must remain presentation-only and must not alter scoring semantics. |
| Related | `plans/20260624-0115-socratic-interactive-agent-implementation/` | in-progress | AI Tutor sheet behavior should remain compatible with future interactive widgets. |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Baseline & Contracts](./phase-01-baseline-contracts.md) | Completed |
| 2 | [Mobile App Shell](./phase-02-mobile-app-shell.md) | Completed |
| 3 | [Feedback Hierarchy](./phase-03-feedback-hierarchy.md) | Completed |
| 4 | [Responsive Verification](./phase-04-responsive-verification.md) | Completed |

## Dependencies

- Project standards from injected `AGENTS.md`: YAGNI, KISS, DRY, scoped edits, real behavior, focused verification.
- Source screenshot: `C:/Users/LENOVO/AppData/Local/Temp/codex-clipboard-7f52c0e0-5e7f-40fc-b43f-1f094774e1a3.png`.
- Key files:
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`

## Acceptance Criteria

- [x] At `240x465`, the quiz screen has no incoherent overlap, no clipped primary CTA, and no horizontal scroll.
- [x] At `360x800` and `390x844`, question, selected answer, feedback, and `Tiếp tục` remain reachable without layout jumps.
- [x] Mobile header shows progress and status without cramming all telemetry into one row.
- [x] Mobile footer prioritizes one primary action and hides desktop keyboard hints.
- [x] Wrong-answer feedback renders as a clear learning state; AI Tutor help is available but not competing with the main explanation.
- [x] AI Tutor bottom sheet still opens, closes, scrolls, and respects safe-area spacing.
- [x] Desktop quiz remains visually equivalent or improved.
- [x] `npm run lint`, `npx tsc --noEmit`, and a production build pass in `frontend/`.

## Red-Team Notes

- Risk: fixing mobile by adding more wrappers could worsen nested scroll. Mitigation: one explicit scroll owner per viewport.
- Risk: hiding ELO on mobile could reduce transparency. Mitigation: keep it accessible as compact secondary telemetry, not primary header content.
- Risk: AI Tutor nudge may become too hidden. Mitigation: keep a visible compact action near feedback and preserve footer trigger.
- Risk: screenshots pass but touch ergonomics fail. Mitigation: validate tap targets and bottom safe area in browser, not just static screenshots.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260629-1232-mobile-quiz-ui-stabilization\plan.md
```
