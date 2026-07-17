---
phase: 2
title: "Implement Fixes"
status: completed
effort: "M"
---

# Phase 2: Implement Fixes

## Overview

Implement the narrow frontend fixes while preserving existing tab contracts and backend chat API.

## Implementation Steps

1. Make `useQuizSession` initialize from `initialTab` synchronously and avoid a mount-time timeout that can overwrite route-derived tabs.
2. Ensure chat is mounted when either `activeTab === 'chat'` or `initialTab === 'chat'`, so direct `/app/chat` does not need a prior UI click.
3. Keep URL synchronization compatible with canonical route paths from `dashboard-routes.ts` and legacy query tabs.
4. Add a small learning-path context helper in Socratic chat:
   - Read current curriculum skills from app state, with `public/skills-manifest.json` as fallback.
   - Detect lookup questions for `Day N` / `ngày N` / `chủ đề gì`.
   - Return a grounded local answer with day title/description and no fake citation.
5. Add a product-context guardrail for the QA prompts about adaptive quiz signals and mentor classroom insights, with citations to product/docs ground truth.
6. Do not add backend fields unless tests prove the frontend-only lookup is insufficient.

## Success Criteria

- [x] Direct `/app/chat` renders Socratic chat input without a prior UI click.
- [x] Direct `/app/profile` renders profile/progress on desktop and after mobile reload.
- [x] Legacy `/app/learn?tab=chat` no longer displays learning-path content for chat intent.
- [x] Chat answers "Day 8" from the curriculum map when that data exists locally.
- [x] Chat answers adaptive quiz signals with Elo, BKT, and learning history.
- [x] Chat answers mentor follow-up with heatmap mastery, support groups, weak concepts, RAG audit, and quiz editor.
- [x] No quiz submit, auth, or backend chat contract behavior changes.
