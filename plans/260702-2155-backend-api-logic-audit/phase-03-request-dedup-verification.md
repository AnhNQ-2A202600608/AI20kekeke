---
phase: 3
title: "Request Dedup Verification"
status: completed
priority: P1
dependencies: [1, 2]
---

# Phase 3: Request Dedup Verification

## Overview

Deduplicate static question fetches around `/api/questions/:setId` where both explicit practice start and hook effects can race.

## Related Code Files

- Modify: `frontend/app/hooks/useQuizSession.ts`
- Existing reference: `frontend/stores/createPracticeSlice.ts` mastery TTL/in-flight pattern

## Implementation Steps

1. Add a small module-level in-flight map for static question requests.
2. Reuse the same promise for the same `setId` until it resolves.
3. Clear the in-flight entry only if the stored promise is still the active one.
4. Verify lint/build does not flag hook dependency regressions.

## Success Criteria

- [x] Concurrent static question requests for the same set share one fetch.
- [x] Failed fetches are not cached forever.
- [x] No new dependency or broad state-management rewrite.
