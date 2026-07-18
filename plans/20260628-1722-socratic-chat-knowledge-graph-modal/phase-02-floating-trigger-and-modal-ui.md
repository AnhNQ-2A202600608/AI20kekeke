---
phase: 2
title: "Floating Trigger and Modal UI"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Floating Trigger and Modal UI

## Overview

Add the user-facing graph entry point and full modal. The small entry point stays out of the chat flow; the modal provides enough space for 20-30 nodes, mastery rings, relationship highlighting, and a selected-node detail panel.

## Requirements

- Functional: floating trigger visible in Socratic Chat, showing summary counts.
- Functional: click opens graph modal; Escape/backdrop/close button closes it.
- Functional: graph renders nodes with mastery ring and state-specific styling.
- Functional: selected node highlights prerequisites and dependents; unrelated nodes/edges dim.
- Functional: side detail panel shows actionable node information and CTAs.
- Non-functional: modal is keyboard accessible and does not create body/page scroll.
- Non-functional: labels are readable; buttons show pointer cursor and active states.

## Architecture

Create a small component set:

- `knowledge-graph-trigger.tsx`
- `knowledge-graph-modal.tsx`
- `knowledge-graph-node.tsx`
- `knowledge-graph-detail-panel.tsx`

Use `@xyflow/react` with `dagre` layout. Keep `zoomOnScroll={false}` initially to avoid nested scroll conflicts. Use explicit modal viewport constraints:

- overlay: `fixed inset-0`
- modal shell: `max-h-[calc(100dvh-32px)]`
- graph canvas: fixed/flex height with internal overflow where needed

Node visual rules:

| Status | Visual Treatment |
| --- | --- |
| `mastered` | high opacity, green ring, strong border, mastery percent visible |
| `learning` | normal opacity, yellow/green ring, active learning badge |
| `weak` | high opacity, red/orange warning border, CTA emphasis |
| `not_started` | smaller visual weight, low opacity, neutral border |
| `locked` | very dim, dashed border, no primary CTA |

## Related Code Files

- Create: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-trigger.tsx`
- Create: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-modal.tsx`
- Create: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-node.tsx`
- Create: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-detail-panel.tsx`
- Modify: `frontend/components/dashboard/socratic-chat/index.tsx`
- Potential modify: `frontend/components/dashboard/socratic-chat/components/chat-input-bar.tsx` only if trigger placement near input is chosen.

## Implementation Steps

1. Add trigger near lower-left chat workspace or header utility area without hiding message/input controls.
2. Build modal shell with accessible close controls and focus-safe interactions.
3. Render React Flow graph using adapter output and custom node type.
4. Implement node mastery ring with CSS conic/radial background or SVG circle; avoid canvas-only state that is hard to inspect.
5. Add selected-node state in modal and derive highlighted/dimmed node/edge classes.
6. Add detail panel with:
   - concept name and short description if available
   - mastery %, Elo, status
   - prerequisite list
   - affected/dependent list
   - `Hỏi Sofi về node này`, `Luyện tập`, `Xem học liệu` CTAs where existing handlers exist
7. Add mobile behavior: modal becomes full-screen, graph on top, detail panel below or drawer.
8. Ensure all clickable controls have readable labels, `cursor-pointer`, and active/hover states.

## Success Criteria

- [x] Trigger opens/closes modal reliably.
- [x] 20-30 nodes are readable at desktop size with fit-view.
- [x] Not-started/locked nodes are visibly lower priority but still part of the dependency map.
- [x] Learned nodes show mastery ring around the node.
- [x] Selecting a node highlights relationship paths and populates detail panel.
- [x] Modal does not reintroduce outer page scroll in chat.
- [x] Mobile layout remains usable.

## Risk Assessment

- Risk: React Flow adds scroll-wheel conflicts.
  Mitigation: keep `zoomOnScroll={false}`, use controls for zoom, preserve body scroll lock.
- Risk: graph labels become too small.
  Mitigation: use short labels in nodes and full label in detail panel/tooltip.
- Risk: 30 nodes still cluttered.
  Mitigation: dim unrelated nodes, group by day/track visually, and add fit/search before adding more features.
