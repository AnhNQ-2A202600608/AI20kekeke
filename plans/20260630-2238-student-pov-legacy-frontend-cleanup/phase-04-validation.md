---
phase: 4
title: "Validation"
status: completed
effort: ""
priority: P1
dependencies: [3]
---

# Phase 4: Validation

## Overview

Validate that student POV cleanup did not break app routing, quiz flow, or visual contract.

## Requirements

- Functional: run automated checks and manual route checks for current student POV.
- Non-functional: verify no mentor/BTC/admin behavior was intentionally changed.

## Architecture

Validation needs both static and runtime checks because many student flows depend on client-side Zustand state and URL query handling.

## Related Code Files

- Validate:
  - `frontend/package.json`
  - `frontend/app/components/quiz-app-shell.tsx`
  - `frontend/app/components/dashboard-layout.tsx`
  - `frontend/app/components/quiz-workspace.tsx`
  - all modified files from Phases 2 and 3

## Implementation Steps

1. Run `pnpm lint` in `frontend/`.
2. Run `pnpm build` in `frontend/`.
3. Start `pnpm dev` and manually verify:
   - `/`
   - `/login`
   - `/onboarding`
   - `/app?tab=learn`
   - `/app?tab=skills`
   - `/app?tab=chat`
   - `/app?tab=profile`
   - quiz mode from a practice start.
4. Verify URL tab filtering:
   - A student should not be able to land on mentor/BTC tabs after role resolution.
   - Removed leaderboard branch should not leave stale query behavior.
5. Check visual basics:
   - No default gray scrollbar regression.
   - No orange/amber primary CTAs on student surfaces unless used as warning/accent token.
   - No text overflow in compact panels.

## Success Criteria

- [x] `pnpm lint` passes.
- [x] `pnpm build` passes.
- [ ] Student route smoke test passes.
- [x] No imports reference deleted files.
- [x] Design guideline drift is documented for any intentionally deferred student surface.

## Validation Notes

- `pnpm lint` passed in `frontend/`.
- `pnpm build` passed in `frontend/`.
- Build still reports an existing Next/Turbopack warning about the deprecated `middleware` convention and an NFT trace through `next.config.ts` -> `app/api/guidebook/[slug]/route.ts`; this is not introduced by this cleanup.

## Risk Assessment

`pnpm build` may surface unrelated pre-existing issues. If so, record them separately and do not hide failures.
