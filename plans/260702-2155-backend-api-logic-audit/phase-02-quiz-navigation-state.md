---
phase: 2
title: "Quiz Navigation State"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Quiz Navigation State

## Overview

Ensure top-nav EduGap brand click exits quiz mode before routing back to the app dashboard.

## Related Code Files

- Modify: `frontend/components/app/app-top-nav.tsx`
- Modify: `frontend/app/components/quiz-workspace.tsx`
- Uses: `frontend/app/hooks/useQuizSession.ts`

## Implementation Steps

1. Add an optional brand-click callback to `AppTopNav`.
2. In `QuizWorkspace`, call `quiz.handleExitQuiz()` and set tab to `learn` from that callback.
3. Let the existing Next `Link` still navigate to `/app`.

## Success Criteria

- [x] Clicking EduGap logo in quiz mode returns to dashboard UI, not the stale quiz screen.
- [x] Existing non-quiz top-nav consumers remain compatible.
