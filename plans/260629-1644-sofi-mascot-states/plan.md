---
title: "Sofi mascot state assets and frontend controller"
description: "Prepare optimized exported mascot assets and a frontend state contract without integrating into live screens yet."
status: pending
priority: P2
branch: "master"
blockedBy: []
blocks: [260629-1907-mobile-learning-growth-workspace]
created: "2026-06-29"
---

# Sofi Mascot State Assets And Frontend Controller

## Scope

Prepare assets and code modules only. Do not mount mascot into `QuizWorkspace`, dashboard, chat, or landing routes yet.

## Current Decision

Rive is paused. Use exported mascot poses directly in frontend as optimized WebP assets, controlled by semantic state.

## State Contract

| State | Trigger source later | Behavior | Asset |
|---|---|---|---|
| `idle` | default | ambient loop | `edugap-fox-idle-welcome.webp` |
| `thinking` | tutor preparing response/hint | one-shot, return idle | `edugap-fox-thinking.webp` |
| `correct` | answer accepted | one-shot, return idle | `edugap-fox-correct-answer.webp` |
| `wrong` | answer rejected | one-shot, return idle | `edugap-fox-wrong-answer-encouragement.webp` |
| `coach` | hint, skill map, next action | one-shot, return idle | `edugap-fox-quiz-coach.webp` |
| `mastery` | concept mastery/level up | one-shot, return idle | `edugap-fox-level-up-mastery.webp` |
| `loading` | data or tutor response loading | sticky until false | `edugap-fox-loading-reading.webp` |
| `soft_error` | recoverable API/UI issue | one-shot, return idle | `edugap-fox-error-apology.webp` |

## Files Added

| Path | Purpose |
|---|---|
| `frontend/public/mascot/sofi/512/*.webp` | mobile/default optimized assets |
| `frontend/public/mascot/sofi/1024/*.webp` | high-resolution optimized assets |
| `frontend/components/mascot/sofi-mascot-assets.ts` | state-to-asset manifest |
| `frontend/components/mascot/use-sofi-mascot-controller.ts` | one-shot/sticky state controller |
| `frontend/components/mascot/sofi-state-mascot.tsx` | standalone render component |
| `frontend/components/mascot/index.ts` | public exports for later integration |

## Implementation Phases

1. Assets ready
   - Convert selected transparent PNG poses to WebP.
   - Keep 512 and 1024 variants.
   - Preload only core states: `idle`, `loading`, `thinking`, `correct`, `wrong`.

2. State module ready
   - Keep state names semantic.
   - Keep asset file names private to the mascot module.
   - Enforce `loading` as sticky state.
   - Return one-shot states to `idle` after their configured duration.

3. Screen integration later
   - Decide placement in quiz/chat/dashboard.
   - Wire backend/frontend events to `send()` and `setLoading()`.
   - Validate no layout shift and no distraction.

## Validation

- Run `pnpm lint`.
- Later, when mounted, verify:
  - reduced motion disables image motion
  - state transitions do not block user input
  - image loads do not shift layout
  - mobile uses 512 asset via `srcSet`

## Unresolved Questions

- Final placement: quiz right panel, Socratic sidebar, or dashboard companion?
- Should mastery use `level-up` or `celebration-confetti` as final asset?
- Should prompt bubble be visible by default or only in tutor/chat surfaces?
