---
phase: 5
title: "Validation and Migration"
status: completed
priority: P1
dependencies: [1, 2, 3, 4]
---

# Phase 5: Validation and Migration

## Overview

Verify the new `/app` learn tab, migrate away from obsolete long-path assumptions, and document behavior changes only where useful for maintainers.

## Requirements

- Functional: keep existing quiz, guidebook, and profile flows working.
- Functional: verify direct day access and track filtering.
- Non-functional: run focused lint/typecheck before broad checks.
- Non-functional: do not hide existing unrelated lint failures.

## Architecture

Validation should cover:

```text
Data registry -> Day navigator -> Day focus -> Practice launch
              -> Track selector -> Day navigator filter
              -> GuidebookView
```

Use Playwright/manual screenshot checks for desktop and mobile because this is UI/navigation-heavy.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx` only if props change.
- Optional modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/product/design-guidelines.md` only if final user-visible behavior should be documented.
- Optional create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/__tests__/program-curriculum.test.ts` if test setup supports it.

## Implementation Steps

1. Add focused unit tests for registry helpers if frontend test tooling is available.
2. Run targeted TypeScript:
   - `pnpm exec tsc --noEmit --pretty false`
3. Run targeted lint on touched files first.
4. Run full `pnpm lint`; if blocked by pre-existing `quiz-question-view.tsx:934`, report separately and do not claim full lint passed.
5. Use browser validation:
   - desktop `/app`.
   - mobile width `/app`.
   - select Day 1.
   - select a later placeholder day.
   - switch to specialization phase and change track.
   - click `Start here`.
   - launch existing practice set.
6. Remove obsolete long-path rendering branches only after browser validation passes.
7. Update docs only if behavior is stable and user-visible enough to warrant it.

## Success Criteria

- [x] TypeScript passes.
- [x] Touched-file lint passes.
- [x] `/app` renders on desktop without overlap.
- [x] `/app` renders on mobile without horizontal page overflow.
- [x] Day click focuses selected day.
- [x] `Start here` focuses an actionable concept.
- [x] Practice launch still opens quiz.
- [x] Track switch filters Day 17-28.
- [x] Known unrelated lint failures are reported honestly.

## Risk Assessment

- Risk: full lint fails from unrelated existing parse error.
  - Mitigation: run targeted lint, then full lint, and report the distinction.
- Risk: visual regression on mobile bottom nav.
  - Mitigation: screenshot mobile width and inspect for overlap.
- Risk: old code path remains and confuses maintainers.
  - Mitigation: delete obsolete long-path branch after validation, not before.
