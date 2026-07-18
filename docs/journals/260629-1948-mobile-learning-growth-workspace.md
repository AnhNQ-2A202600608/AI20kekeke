---
date: 2026-06-29
plan: 260629-1907-mobile-learning-growth-workspace
area: frontend
---

# Mobile Learning Growth Workspace

## Context

The student learning screen needed to move closer to the discussed growth-design mockups while preserving the app's current learning contracts. The key product decision was to keep desktop focused on roadmap plus day detail, and make mobile a task-first workspace.

## What Happened

- Added a mobile compact top bar, horizontal day rail, desktop week sidebar, Today Mission card, daily skills list, tokenizer preview, Sofi coach trigger, Sofi coach sheet, and CTA.
- Replaced desktop rendering from `ProgramRoadmap` and `DayDetailCard` to `DesktopLearningSidebar` plus the mission/skills workspace.
- Kept state ownership in `LearningPath`; mobile components receive selected day/concept data as props.
- Routed Sofi `Hỏi AI` to the existing chat tab instead of embedding a permanent chat panel.

## Decisions

- Sofi is an on-demand coach popup/bottom sheet, not a right-side panel.
- The middle section lists all concepts/skills for the selected day on both desktop and mobile, not a single concept hero.
- Tokenizer preview is static and conditional, so it does not pretend to be an interactive playground.
- Mobile top status uses real store values for streak and profile initial, with fallback only when user data is empty.

## Verification

- `npx eslint` on touched learning/layout files passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed before the later unrelated quiz source issue surfaced.
- Browser checks confirmed the mobile controls render and Sofi sheet opens/closes before the desktop follow-up.

## Follow-Up

- Repo-wide `npm run lint` is still blocked by an unrelated existing `react-hooks/set-state-in-effect` issue in `frontend/components/quiz/quiz-question-view.tsx`.
- Clean `npm run build` is now blocked by an unrelated syntax issue in the dirty `frontend/components/quiz/quiz-question-view.tsx`, which prevents final browser verification of the desktop update.
- Add focused UI coverage for mobile day selection, concept selection, preview gating, Sofi sheet open/close, and sticky CTA when the test harness is ready.
