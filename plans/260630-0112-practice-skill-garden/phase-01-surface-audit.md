---
phase: 1
title: "Surface Audit"
status: pending
priority: P1
dependencies: []
---

# Phase 1: Surface Audit

## Overview

Freeze the target surface and verify the current practice data path before UI changes. This prevents a garden rewrite from accidentally duplicating Learn-tab behavior or breaking quiz launch.

## Requirements

- Functional: identify the exact current Practice tab entry, data sources, and launch callbacks.
- Non-functional: no code behavior changes in this phase unless needed for tiny naming cleanup.

## Architecture

`DashboardLayout` renders `SkillsPracticeTab` when `activeTab === 'skills'`. `SkillsPracticeTab` reads `skills`, `conceptMasteries`, `activePracticeSession`, and practice-session actions from `useBoundStore`, then calls `onStartPractice(skill, targetSetId)`.

The Garden should sit inside this existing path:

```text
DashboardLayout
  -> SkillsPracticeTab
      -> PracticeGardenPage section components
      -> onStartPractice(skill, targetSetId)
      -> useQuizSession.handleStartPractice
```

## Related Code Files

| Action | Absolute path | Purpose |
|---|---|---|
| Read | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\app\components\dashboard-layout.tsx` | Confirm tab mount and layout margins. |
| Read | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\skills-practice-tab.tsx` | Baseline behavior to preserve. |
| Read | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\app\hooks\useQuizSession.ts` | Confirm practice launch/resume contract. |
| Read | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\stores\createPracticeSlice.ts` | Confirm active session shape. |
| Read | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mastery-seed-badge.tsx` | Reuse existing seed visual mapping. |

## Implementation Steps

1. Confirm whether `SkillsPracticeTab` is still the intended `Luyện tập` surface.
2. Inventory all state currently used: `skills`, `quizSets`, `conceptMasteries`, `activePracticeSession`.
3. List current user actions: filter day, expand skill, start skill, start set, resume session, reset session, clear session.
4. Decide what survives in MVP:
   - keep day filter
   - keep resume banner
   - keep per-set start
   - replace generic cards with garden cards
5. Identify any duplicated code with `LearningPath` that should be reused or left alone.
6. Record any dirty local changes before implementation starts. Do not revert user changes.

## Success Criteria

- [ ] Target surface is confirmed as `SkillsPracticeTab`.
- [ ] Existing launch/resume/reset behavior is documented.
- [ ] No new data source is introduced for MVP.
- [ ] File ownership for later phases is clear.

## Risk Assessment

- Risk: implementation drifts into redesigning `LearningPath`.
  Mitigation: keep Learn tab out of scope except shared primitives.
- Risk: dirty worktree includes unrelated frontend edits.
  Mitigation: read touched files before editing and avoid reverting unrelated changes.
