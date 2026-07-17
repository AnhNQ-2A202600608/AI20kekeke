---
phase: 1
title: "Route consolidation"
status: completed
effort: "S"
---

# Phase 1: Route consolidation

## Overview

Move mentor/admin tab destinations into the `/app` namespace while keeping existing route pages as compatibility wrappers.

## Implementation Steps

1. Update `frontend/lib/dashboard-routes.ts` so mentor/admin `TabType` values point to `/app/<tab>`.
2. Add App Router pages under `frontend/app/app/` for `insights`, `ingestion`, `quiz-editor`, `rag-audit`, `btc-heatmap`, and `observability`.
3. Reuse `QuizAppShell` with the correct `initialTab` in each new page.
4. Leave existing `/mentor/*` and `/admin/*` pages untouched.

## Success Criteria

- [x] Calling `getRouteForTab('insights')` returns an `/app/...` route.
- [x] New `/app/...` pages compile and render through `QuizAppShell`.
- [x] Existing compatibility pages still exist.
