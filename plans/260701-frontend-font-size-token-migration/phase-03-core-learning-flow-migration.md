---
phase: 3
title: "Core Learning Flow Migration"
status: pending
priority: P1
dependencies: [2]
---

# Phase 3: Core Learning Flow Migration

## Overview

Migrate the student-facing learning and quiz flow after the pilot proves visually neutral.

## Requirements

- Functional: migrate quiz, learning, app shell, profile, and Socratic chat font-size classes.
- Non-functional: avoid changing the compact quiz layout or navbar integration already present in the worktree.

## Architecture

This phase handles routes and components students see repeatedly. It should be reviewed with browser screenshots because text density and readable hierarchy matter more than raw grep success.

## Related Code Files

- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\app\components\quiz-workspace.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\quiz\quiz-question-view.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\quiz\quiz-results.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\quiz\socratic-sidebar-view.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\quiz\sofi-quiz-coach-card.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\*.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\app\*.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\socratic-chat\**\*.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\profile\**\*.tsx`

## Implementation Steps

1. Replace exact class fragments using the approved mapping.
2. Keep `public/mockup.html` out of scope unless the user answers otherwise.
3. Run `pnpm exec eslint` on touched files from `frontend/`.
4. Run `pnpm exec tsc --noEmit --pretty false` from `frontend/`.
5. Screenshot `/app`, quiz focus mode, Socratic chat, and profile.

## Success Criteria

- [ ] Core student TSX files use semantic font-size tokens.
- [ ] Quiz title responsive sizes still map to 22px and 24px.
- [ ] No page/body overflow is introduced.
- [ ] Typecheck and focused lint pass.

## Risk Assessment

Risk: bulk replace touches current navbar/layout edits and makes review noisy. Mitigation: keep replacements mechanical and inspect diffs around existing quiz workspace changes.
