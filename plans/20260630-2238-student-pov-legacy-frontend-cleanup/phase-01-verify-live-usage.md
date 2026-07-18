---
phase: 1
title: "Verify live usage"
status: completed
effort: ""
priority: P1
dependencies: []
---

# Phase 1: Verify live usage

## Overview

Lock the cleanup scope to student POV and prove which candidate files are live through the current app entry points.

## Requirements

- Functional: classify every previously flagged file as active student, inactive student, mentor/BTC/admin-only, or shared shell.
- Non-functional: do not delete or migrate files in this phase.

## Architecture

Current student flow starts at `/app` via `QuizAppShell`. `DashboardLayout` renders student tabs when `selectedPersona === 'student'`; `QuizWorkspace` owns adaptive quiz mode. URL tab filtering in `useQuizSession` must be treated as part of reachability.

## Related Code Files

- Read: `frontend/app/app/page.tsx`
- Read: `frontend/app/components/quiz-app-shell.tsx`
- Read: `frontend/app/components/dashboard-layout.tsx`
- Read: `frontend/app/components/quiz-workspace.tsx`
- Read: `frontend/lib/dashboard-tabs.ts`
- Read: `frontend/app/hooks/useQuizSession.ts`
- Read: `frontend/components/dashboard/profile/index.tsx`
- Read: `frontend/components/dashboard/skills-practice-tab.tsx`
- Read: `frontend/components/dashboard/socratic-chat/index.tsx`
- Read: `frontend/components/quiz/**`

## Implementation Steps

1. Run a full source search for imports/references of all delete candidates:
   `Calendar`, `TileTooltip`, `DifficultyBadge`, old profile child components, `RadarChart`, and `LeaderboardTab`.
2. Confirm student tabs from `frontend/lib/dashboard-tabs.ts` remain `learn`, `skills`, `chat`, and `profile`.
3. Confirm URL query handling in `useQuizSession` cannot expose out-of-scope mentor/BTC tabs to a student role after role resolution.
4. Record final classification in the plan or a report before deleting anything.

## Success Criteria

- [x] Each candidate file has a verified action: delete, migrate, keep, or out-of-scope.
- [x] Mentor/BTC/admin-only files are excluded from this cleanup.
- [x] No source files are modified in this phase.

## Risk Assessment

The main risk is deleting a component that is dynamically imported or reachable through query-state edge cases. Mitigate with `rg`, `pnpm lint`, and `pnpm build` before and after deletion.
