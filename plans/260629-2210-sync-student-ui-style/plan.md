---
title: Sync Student Pages With /app UI Style
description: >-
  Unify profile, Socratic chat, and knowledge graph UI with the current /app
  learning workspace style without changing product behavior.
status: completed
priority: P2
branch: codex/adaptive-first-frontend-quiz
tags:
  - frontend
  - refactor
  - ux
blockedBy: []
blocks: []
created: '2026-06-29T15:11:15.954Z'
createdBy: 'ck:plan'
source: skill
---

# Sync Student Pages With /app UI Style

## Overview

Sync the student-facing profile page, AI chat bot page, and knowledge graph modal with the current `/app` learning workspace visual system. This is a UI consistency refactor only: no backend changes, no route changes, no new data model, and no rewrite of chat/graph logic.

The correct target is the existing EduGap learning style: avocado background, white tactile panels, 2px borders with 5px bottom depth, Fraunces headings, Be Vietnam Pro body text, green/yellow/orange/blue mastery accents, compact metric pills, and tactile icon buttons. Do not copy the `/app` layout blindly into chat or graph; preserve each workflow's ergonomics.

## Scope

In scope:
- Extract small shared UI primitives for the `/app` style.
- Reuse those primitives in profile, knowledge graph, and Socratic chat surfaces.
- Preserve existing state hooks, data contracts, route behavior, and CTAs.
- Validate desktop and mobile visual fit.

Out of scope:
- Backend/API changes.
- Quiz flow redesign.
- Mentor/BTC admin page redesign except incidental shared primitive compatibility.
- New gamification, new curriculum data, or new graph algorithm.
- Replacing ReactFlow or chat state management.

## Existing Context

- `/app` renders through `frontend/app/components/quiz-app-shell.tsx` and `frontend/app/components/dashboard-layout.tsx`.
- Current learning style lives in `frontend/components/LearningPath.tsx`, `frontend/components/learning/*`, and `frontend/app/globals.css`.
- Profile entry point is `frontend/components/dashboard/profile/index.tsx`.
- Chat entry point is `frontend/components/dashboard/socratic-chat/index.tsx`.
- Graph modal is `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-modal.tsx`.
- Existing design tokens are documented in `docs/product/design-guidelines.md`.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Notes |
|---|---|---:|---|
| Builds on | `plans/260629-1524-app-program-map-day-focus` | completed | Established `/app` program/day focus architecture. |
| Builds on | `plans/260629-2112-learning-density-polish` | completed | Defines the current dense learning workspace target shown in the screenshot. |
| Related | `plans/20260628-1722-socratic-chat-knowledge-graph-modal` | completed | Graph modal already exists; this plan only restyles and validates it. |
| Related historical | `plans/20260618-1650-refactor-socratic-chat-tab` | in-progress/stale | Code now has split chat components; preserve that structure and avoid reintroducing a monolith. |

## Architecture Direction

```text
frontend/components/ui/learning/
  learning-page-shell.tsx
  tactile-panel.tsx
  tactile-button.tsx
  metric-pill.tsx
  section-header.tsx

profile/index.tsx
  uses shell + tactile panels + metric pills

knowledge-graph-modal.tsx
  uses tactile header/actions/panels
  keeps ReactFlow canvas and adapter intact

socratic-chat/index.tsx + chat components
  uses tactile top bar, mode selector, message cards, input bar
  keeps full-height chat shell and scroll-lock behavior
```

## Design Rules

- Use existing tokens from `frontend/app/globals.css`; do not create a parallel theme.
- Keep `rounded-2xl` acceptable where already used, but prefer the current `/app` tactile pattern over soft SaaS cards.
- Interactive controls should have visible focus states and tactile active states.
- Do not use purple, indigo, violet, or magenta as accents.
- Keep chat full-height; do not force it into the `/app` day rail layout.
- Keep graph canvas unblocked; controls must not obscure core graph interactions.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Shared UI Primitives](./phase-01-shared-ui-primitives.md) | Completed |
| 2 | [Profile Page Sync](./phase-02-profile-page-sync.md) | Completed |
| 3 | [Knowledge Graph Sync](./phase-03-knowledge-graph-sync.md) | Completed |
| 4 | [Socratic Chat Sync](./phase-04-socratic-chat-sync.md) | Completed |
| 5 | [Visual Validation](./phase-05-visual-validation.md) | Completed |

## Dependencies

- Next.js 16 / React 19 frontend in `frontend/`.
- Tailwind v4 theme tokens in `frontend/app/globals.css`.
- `lucide-react` for icons.
- `motion` where existing animation already exists.
- `@xyflow/react` for graph rendering.

## Acceptance Criteria

- Profile, chat, and graph visually read as part of the same EduGap product as `/app`.
- Shared primitives are small and reused; no large new design-system abstraction.
- Existing behavior remains unchanged: profile metrics render, chat sends messages, graph opens/zooms/pans/selects nodes.
- Desktop and mobile layouts have no incoherent overlap or clipped controls.
- Focus states remain visible for keyboard navigation.
- `pnpm exec tsc --noEmit --pretty false --incremental false` passes from `frontend/`.
- Focused ESLint passes for touched frontend files.
- Browser screenshot checks cover `/app` profile/chat/graph paths at desktop and mobile sizes.

## Implementation Notes

- Added shared learning UI primitives under `frontend/components/ui/learning/`.
- Synced profile surfaces to tactile panels, metric pills, and `/app` typography/tokens.
- Removed violet/purple styling from touched profile and chat/graph areas.
- Synced Socratic chat chrome, message cards, input bar, sidebar, slide viewer, and graph trigger/modal chrome.
- Preserved existing hooks, routing, graph adapter, ReactFlow behavior, and public component props.

## Validation Results

- Passed: `pnpm exec tsc --noEmit --pretty false --incremental false`
- Passed: `pnpm exec eslint components/ui/learning components/dashboard/profile components/dashboard/socratic-chat app/components/dashboard-layout.tsx`
- Passed: `rg "violet|purple|indigo|magenta" frontend/components/dashboard/profile frontend/components/dashboard/socratic-chat frontend/components/ui/learning` returned no matches.
- Browser checks saved screenshots:
  - `outputs/sync-ui-app-desktop.png`
  - `outputs/sync-ui-profile-desktop.png`
  - `outputs/sync-ui-chat-desktop.png`
  - `outputs/sync-ui-graph-desktop.png`
  - `outputs/sync-ui-app-mobile.png`
  - `outputs/sync-ui-chat-mobile.png`
- Browser DOM checks found no horizontal overflow on validated `/app`, profile, chat, graph modal, and mobile chat states.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260629-2210-sync-student-ui-style\plan.md
```
