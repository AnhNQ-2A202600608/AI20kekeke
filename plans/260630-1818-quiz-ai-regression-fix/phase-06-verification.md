---
phase: 6
title: Verification
status: completed
priority: P1
dependencies:
  - 2
  - 3
  - 4
  - 5
---

# Phase 6: Verification

## Overview

Run focused automated and visual checks for the regression cluster.

## Requirements

- Functional: verify each teammate feedback item against UI.
- Non-functional: typecheck/lint and avoid introducing broader frontend regressions.

## Architecture

Use the existing Next.js frontend dev server and browser automation if available. Prefer narrow manual/Playwright checks over broad unrelated refactors.

## Related Code Files

- Validate: `frontend/components/quiz/quiz-question-view.tsx`
- Validate: `frontend/components/quiz/socratic-sidebar-view.tsx`
- Validate: `frontend/app/hooks/useQuizSession.ts`
- Validate: `frontend/components/dashboard/socratic-chat/index.tsx`
- Validate: `frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx`

## Implementation Steps

1. Run typecheck:
   ```bash
   pnpm --dir frontend exec tsc --noEmit
   ```
2. Run lint:
   ```bash
   pnpm --dir frontend lint
   ```
3. Start frontend if visual validation is needed:
   ```bash
   pnpm --dir frontend dev
   ```
4. Manual/Playwright checks:
   - Start a quiz.
   - Confirm `AI Hint` visible pre-submit.
   - Click `AI Hint`; confirm hint deck and penalty count.
   - Submit wrong answer.
   - Confirm tutor box has prompt/input path.
   - Confirm wrong-answer RAG citations display as buttons.
   - Click next adaptive question; confirm no full loading card flash.
   - Open chat tab, collapse sidebar; confirm only one menu icon.
5. Capture screenshots for before/after if implementing in PR.
6. Record remaining known issues separately, not as hidden failures.

## Success Criteria

- [ ] Typecheck passes.
- [ ] Lint passes or only unrelated pre-existing issues remain documented.
- [ ] All six teammate feedback items are verified fixed.
- [ ] Desktop and mobile screenshots show no duplicate menu or missing controls.
- [ ] No new fake data or mock shortcuts were added.

## Risk Assessment

Visual validation matters because most failures are affordance/state regressions, not pure logic bugs. Do not rely on typecheck alone.
