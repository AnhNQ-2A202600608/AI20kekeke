---
phase: 5
title: Responsive Validation
status: completed
priority: P1
dependencies:
  - 1
  - 2
  - 3
  - 4
---

# Phase 5: Responsive Validation

## Overview

Validate the final density polish in real viewports. The work is UI-sensitive, so screenshots and overlap checks matter more than only static lint.

## Requirements

- Functional: desktop, tablet-width, and mobile layouts remain usable.
- Functional: sticky CTA and AI controls do not overlap.
- Functional: day selection, skill selection, guidebook, start practice, and Sofi sheet still work.
- Non-functional: targeted lint passes for touched files.
- Non-functional: document any unrelated repo-wide blocker instead of hiding it.

## Architecture

Validation should use the running Next.js frontend when available. If `npm run build` is blocked by the unrelated quiz source issue, run targeted lint and browser checks against the dev server if it can compile the learning route.

## Related Code Files

- Verify: all files touched by phases 1-4.
- Known blocker to mention if still present: `frontend/components/quiz/quiz-question-view.tsx`.

## Implementation Steps

1. Run targeted ESLint on touched learning files.
2. Start or reuse the frontend dev server.
3. Capture screenshots/check layout at `1440x900`, `1024x768`, and `390x844`.
4. Interact with day selection, skill selection, guidebook, start button disabled/enabled state, Sofi sheet, and AI dock.
5. Check for overflow, clipped title text, clipped logo, sticky CTA overlap, and dock overlap.
6. Run full build only if unrelated quiz parse issue has been resolved.
7. Record validation result in the implementation report or plan notes.

## Success Criteria

- [ ] Targeted lint for touched learning files passes.
- [ ] Desktop screenshot shows compact header, focused sidebar, compact skill rows, and AI dock.
- [ ] Mobile screenshot shows day rail, Today Mission, compact skills/detail, Sofi access, and unobstructed CTA.
- [ ] No incoherent text/button overlap is visible.
- [ ] Any build failure is clearly attributed to a specific unrelated file if not caused by this plan.

## Risk Assessment

The existing dirty worktree may contain unrelated quiz/layout changes. Do not revert them. Validate narrowly first, then broaden only when the unrelated blocker is fixed.
