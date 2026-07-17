---
phase: 3
title: Knowledge Graph Sync
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 3: Knowledge Graph Sync

## Overview

Restyle the knowledge graph launcher/modal to match the `/app` skill-map feeling while preserving ReactFlow behavior, graph data adapter, node selection, zoom/pan controls, detail panel, and chat/learn CTAs.

## Requirements

- Functional: graph trigger opens modal, graph loads from cache/API/fallback, nodes select, detail panel actions still work.
- Non-functional: modal should feel like an EduGap skill tree rather than a generic admin graph.
- Responsive: modal usable at desktop and mobile widths.
- Performance: do not increase graph node count or replace ReactFlow.

## Architecture

Keep graph logic intact and restyle chrome:

```text
KnowledgeGraphLauncher
  KnowledgeGraphTrigger -> tactile floating action / dock style

KnowledgeGraphModal
  tactile header with MetricPill summary
  ReactFlow canvas remains primary
  tactile control cluster
  KnowledgeGraphDetailPanel restyled as learning side panel
```

## Related Code Files

- Modify: `frontend/components/dashboard/knowledge-graph-launcher.tsx`
- Modify: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-trigger.tsx`
- Modify: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-modal.tsx`
- Modify: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-detail-panel.tsx`
- Modify if needed: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-node.tsx`
- Keep intact: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-adapter.ts`

## Implementation Steps

1. Restyle `KnowledgeGraphTrigger` to match the floating `/app` nav/dock language.
2. Replace modal shell with tactile border/depth treatment while keeping fixed full-screen overlay.
3. Update modal header:
   - section eyebrow such as `Skill Tree`
   - Fraunces title
   - metric pills for visible nodes, mastered count, average mastery, data source
4. Convert action buttons (`Về hiện tại`, `Lộ trình`, close, zoom controls) to shared tactile/icon button styles.
5. Keep the graph canvas visually open. Use subtle `surface-container-low` backgrounds, not heavy card nesting.
6. Restyle detail panel with clear mastery status, prerequisites/dependents, and CTAs using shared primitives.
7. Verify keyboard `Escape`, outside click close, zoom/pan, fit view, and node selection still work.

## Success Criteria

- [ ] Graph launcher/modal reads as a learning skill tree aligned with `/app`.
- [ ] ReactFlow canvas is not obscured by decorative UI.
- [ ] Existing graph loading/cache/fallback behavior unchanged.
- [ ] Node selection and detail panel actions still work.
- [ ] Modal remains usable on mobile.

## Risk Assessment

- Risk: control styling overlaps graph content. Mitigation: fixed-size control cluster and canvas padding.
- Risk: modal becomes too similar to `/app` cards and loses graph focus. Mitigation: canvas remains the largest visual region.
- Risk: graph node changes break ReactFlow data shape. Mitigation: avoid adapter changes unless strictly needed for styling.
