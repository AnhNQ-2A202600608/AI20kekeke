---
title: "Socratic Chat Knowledge Graph Modal"
description: "Add a compact knowledge-graph entry point to Socratic Chat that opens a large mastery-aware prerequisite graph modal without changing backend contracts."
status: completed
priority: P2
branch: "dev"
tags: [feature, frontend, chat, adaptive, graph]
blockedBy: []
blocks: []
created: "2026-06-28T10:23:02.174Z"
createdBy: "ck:plan"
source: skill
---

# Socratic Chat Knowledge Graph Modal

## Overview

Add a floating knowledge-graph trigger to the Socratic Chat page. On click, it opens a large modal showing the course prerequisite graph, mastery rings per node, hidden/dimmed styling for not-started nodes, and click-to-focus relationship highlighting.

The first implementation is frontend-only and reuses existing graph patterns from profile/mentor pages. It must not reopen the global page-scroll issue in chat. Backend `/adaptive/mastery` and `/adaptive/graph/relations` stay future-ready through a local adapter, but no backend changes are required in this plan.

## Scope Decisions

- Build inside `frontend/components/dashboard/socratic-chat/`.
- Reuse `@xyflow/react`, `dagre`, existing `skills-manifest.json`, and profile graph conventions.
- Show 20-30 nodes effectively via modal, not a permanent left panel.
- Render not-started nodes lower-priority: dim, smaller visual weight, still visible for relation context.
- Render learned nodes as prominent circles with mastery progress ring around the node.
- Highlight prerequisites/dependents only when a node is selected to reduce edge clutter.
- Defer Supabase/API wiring unless existing frontend API wrappers already make it trivial.
- Do not create new backend routes or database migrations.

## Existing Reuse Points

| Area | Files |
| --- | --- |
| Socratic chat layout and state | `frontend/components/dashboard/socratic-chat/index.tsx`, `frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts` |
| Existing React Flow graph | `frontend/components/dashboard/profile/components/skill-tree-graph.tsx`, `frontend/components/dashboard/mentor/components/mentor-skill-tree-graph.tsx` |
| Graph layout helper and mock mastery mapping | `frontend/components/dashboard/profile/utils/profile-utils.ts` |
| Course skill manifest | `frontend/public/skills-manifest.json` |
| Future backend contracts | `src/api/adaptive_routes.py`, `src/services/adaptive/database_interface.py` |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Graph Data Contract](./phase-01-graph-data-contract.md) | Completed |
| 2 | [Floating Trigger and Modal UI](./phase-02-floating-trigger-and-modal-ui.md) | Completed |
| 3 | [Integration Validation](./phase-03-integration-validation.md) | Completed |

## Dependencies

- Data graph generation work exists in `plans/20260622-2336-skills-dependency-graph/`; this UI should not depend on that plan finishing because MVP uses frontend fallback data.
- Socratic chat layout work exists in `plans/20260616-1936-unified-socratic-chat-redesign/`; this plan should follow current component files, not stale `socratic-chat-tab.tsx` references.
- Current chat page scroll-lock edits must be preserved: the modal must not reintroduce document/body scrolling while chat is active.

## Acceptance Criteria

- Floating trigger is visible but unobtrusive in Socratic Chat desktop and mobile layouts.
- Trigger opens a large keyboard-accessible graph modal.
- Modal can display 20-30 concept nodes without permanent clutter.
- Nodes show mastery visually: ring/progress for learned nodes, dimmed styling for not-started nodes, warning styling for weak nodes.
- Clicking a node highlights prerequisite and dependent paths, dims unrelated graph elements, and shows a detail panel.
- Detail panel exposes concept name, day/track where available, Elo/mastery/status, prerequisites, affected dependents, and CTAs.
- Existing chat scroll behavior stays one-page: body/page does not scroll; modal content handles its own overflow.
- `pnpm exec tsc --noEmit` and focused ESLint pass.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\20260628-1722-socratic-chat-knowledge-graph-modal\plan.md
```
