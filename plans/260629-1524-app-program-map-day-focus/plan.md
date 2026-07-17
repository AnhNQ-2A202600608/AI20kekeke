---
title: "Redesign /app Program Map and Day Focus"
description: "Rework the student /app learning dashboard for a 27-28 day AI Thuc Chien curriculum with direct day access, concept-level practice, and three specialization tracks after Day 16."
status: completed
priority: P2
branch: "codex/adaptive-first-frontend-quiz"
tags: [feature, frontend, curriculum, ux]
blockedBy: []
blocks: []
created: "2026-06-29"
createdBy: "ck:plan"
source: skill
---

# Redesign /app Program Map and Day Focus

## Overview

Redesign the student `/app` learning tab from a long Duolingo-style path into a curriculum cockpit for AI Thuc Chien: a compact program map, direct day access, focused day detail, and track branching after Day 16. Keep existing quiz/session behavior. Move path visuals down one level so each day can show its concepts and "Start here" target clearly.

## Scope Challenge

- Existing code: `LearningPath.tsx` already supports week sections, day headers, active node labels, skill modal, guidebook CTA, and `onStartPractice(skill, targetSetId)`.
- Minimum change: add a frontend curriculum registry and replace the main learn-tab composition; keep `quiz-manifest.json`, quiz loading, `GuidebookView`, and `handleStartPractice` contracts.
- Complexity: expected 6-8 touched files, 2-3 new frontend modules/components. Avoid backend/database work in this plan.
- Selected mode: hold scope with validation. Build the pragmatic version, not a full LMS.

## Current Constraints

- Current hardcoded curriculum only covers `day1` to `day12` in `frontend/lib/quiz/constants.ts`.
- `frontend/public/quiz-manifest.json` groups practice sets by `parent_id`, which is useful for day mapping but insufficient for phase/track/concept metadata.
- Design must follow Sapia AI tactile learning style in `docs/product/design-guidelines.md`.
- Existing lint is currently blocked globally by an unrelated parse error in `frontend/components/quiz/quiz-question-view.tsx:934`; phase validation should use targeted lint/typecheck first.

## Recommended Architecture

```text
/app learn tab
  ProgramOverviewHeader
  PhaseTabs
  DayNavigator
  DayFocusView
    DaySummaryCard
    ConceptPath / ConceptList
    PracticeSetDrawer
  TrackSelector / TrackBranchPanel
  RightBar context from selected day
```

## Data Shape

Create a typed frontend registry that maps the real program:

```ts
type ProgramDay = {
  id: string;
  dayNumber: number;
  phaseId: string;
  trackId?: string;
  title: string;
  outcome: string;
  guidebookDayId?: string;
  concepts: ProgramConcept[];
};

type ProgramConcept = {
  id: string;
  title: string;
  description: string;
  setIds: string[];
};
```

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Curriculum Data Model](./phase-01-curriculum-data-model.md) | Completed |
| 2 | [Program Navigation Shell](./phase-02-program-navigation-shell.md) | Completed |
| 3 | [Day Focus Experience](./phase-03-day-focus-experience.md) | Completed |
| 4 | [Track Branching](./phase-04-track-branching.md) | Completed |
| 5 | [Validation and Migration](./phase-05-validation-and-migration.md) | Completed |

## Cross-Plan Dependencies

| Relationship | Plan | Notes |
|---|---|---|
| Related historical plan | `plans/20260616-1522-migrate-skills-practice-to-learning-path` | Existing path/skill approach. This plan supersedes the long-path layout direction, not the practice/session mechanics. |
| Related active plan | `plans/260629-1434-mobile-first-quiz-focus-mode` | No dependency. That plan excludes dashboard redesign; keep shared class regressions in mind. |
| Related active plan | `plans/260629-1245-adaptive-first-frontend-quiz` | No dependency. Reuse `handleStartPractice` and concept mastery contracts. |

## Acceptance Criteria

- `/app` learn tab shows direct day access for 27-28 days.
- User can click a day and focus that day without scrolling the entire curriculum.
- Day detail shows concepts and direct practice/guidebook CTAs.
- "Start here" click scrolls/focuses first incomplete concept or recommended practice set.
- Hover highlights active concept only; hover must not trigger disruptive page scroll.
- After Day 16, three track branches are represented without rendering all branches as one long path.
- Existing quiz launch path still uses `handleStartPractice(skill, targetSetId)` or a compatible adapter.
- Desktop and mobile layouts remain usable.

## Out of Scope

- Backend schema changes.
- Creating all missing quiz content for Day 13-28.
- Rewriting quiz attempt flow.
- Rebuilding profile/mastery analytics.
- Route-level rewrite to `/app/day/[id]` unless needed after validation.

## Validation Log

### Verification Results

- Tier: Full, because the plan has 5 phases.
- Verified paths:
  - `frontend/components/LearningPath.tsx` exists and owns current long path UI.
  - `frontend/lib/quiz/constants.ts` exists and contains `TOPICS`, `WEEKS`, `UNIT_STYLES`.
  - `frontend/public/quiz-manifest.json` exists and uses `parent_id` day grouping.
  - `frontend/app/components/dashboard-layout.tsx` exists and renders `LearningPath`.
  - `frontend/app/hooks/useQuizSession.ts` exists and provides `handleStartPractice`.
- Failed: no current source of truth for Day 13-28 or track names found in frontend registry.
- Unverified: exact official track names after Day 16.

### Critical Questions

1. Track naming: confirm exact names for the 3 tracks after Day 16.
   - Recommended: use placeholder ids in code (`agent-builder`, `ai-product`, `rag-data`) but display final Vietnamese labels from config.
2. Access policy: should users see all 28 days immediately or only unlocked days?
   - Recommended: all visible, future days disabled/previewed. Direct access still works for available days.
3. Start behavior: should hover or click move the viewport?
   - Recommended: hover highlights only; click scrolls/focuses.
4. Day 13-28 content availability: should placeholder days render before quiz sets exist?
   - Recommended: yes, render day shells with "coming soon" concept states to preserve curriculum map.

### Whole-Plan Consistency Sweep

- No backend dependency remains in implementation phases.
- All phases preserve existing quiz/session contracts.
- The plan consistently treats path visuals as day-local, not program-global.
