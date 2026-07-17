---
phase: 1
title: "Graph Data Contract"
status: completed
priority: P2
dependencies: []
---

# Phase 1: Graph Data Contract

## Overview

Create a small frontend graph adapter for Socratic Chat. It should normalize existing skill/mastery data into nodes and edges that the graph modal can render, while keeping a clean upgrade path for `/adaptive/mastery` and `/adaptive/graph/relations`.

## Requirements

- Functional: provide `KnowledgeGraphNode[]`, `KnowledgeGraphEdge[]`, summary counts, and selected-node relationship helpers.
- Functional: map local `Skill` status/Elo/mastery into UI states: `mastered`, `learning`, `weak`, `not_started`, `locked`.
- Functional: support 20-30 nodes from Supabase `app.concepts`/`app.concept_relations`, with `frontend/public/skills-manifest.json` as fallback.
- Non-functional: no hard failure if graph relation data is incomplete.
- Non-functional: adapter remains pure and testable.

## Architecture

Create a local adapter under Socratic Chat, for example:

- `components/knowledge-graph/types.ts`
- `components/knowledge-graph/knowledge-graph-adapter.ts`

The adapter should accept current chat concepts, store skills, and optional relation data. It returns graph-ready nodes with normalized mastery fields:

```ts
type KnowledgeNodeStatus = 'mastered' | 'learning' | 'weak' | 'not_started' | 'locked';

interface KnowledgeGraphNode {
  id: string;
  label: string;
  shortLabel: string;
  dayId?: string;
  masteryPct: number;
  elo?: number;
  status: KnowledgeNodeStatus;
  isActive: boolean;
  isDimmed: boolean;
}
```

Initial edge data can reuse the known skill dependency pattern from profile/mentor. Do not duplicate a large static graph in multiple components if a shared helper is easy; otherwise keep the first adapter local and small.

## Related Code Files

- Create: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/types.ts`
- Create: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/knowledge-graph-adapter.ts`
- Modify: `frontend/components/dashboard/socratic-chat/index.tsx`
- Read/reuse: `frontend/public/skills-manifest.json`
- Read/reuse: `frontend/components/dashboard/profile/utils/profile-utils.ts`

## Implementation Steps

1. Define graph node, edge, summary, and selected-node detail types.
2. Build local fallback relations from existing skill prerequisite edges or a compact mapping based on current course skill IDs.
3. Normalize `Skill.status`, `masteryScore`, and `elo` into node styling state.
4. Add helpers:
   - `getGraphSummary(nodes)`
   - `getRelatedNodeIds(selectedId, edges)`
   - `getPrerequisiteNodes(selectedId, edges)`
   - `getDependentNodes(selectedId, edges)`
5. Ensure adapter can later accept API relation rows without changing modal props.
6. Add focused unit tests only if repo already has frontend test setup; otherwise verify through TypeScript and component behavior.

## Success Criteria

- [x] Adapter returns stable nodes and edges from current local skills data or Supabase concept graph data.
- [x] Not-started concepts are present but marked visually lower-priority.
- [x] Active chat concept can be marked on the graph.
- [x] Selected node relationship helpers identify prerequisites and dependents.
- [x] Backend schema stays unchanged; only a read-only Next API route is used for Supabase graph reads.

## Risk Assessment

- Risk: another duplicate graph mapping appears beside profile/mentor mappings.
  Mitigation: keep mapping compact and isolate it so it can be promoted to shared code later.
- Risk: manifest skill IDs do not map cleanly to future `concepts.code`.
  Mitigation: use adapter boundaries and avoid leaking raw source shape into UI.
