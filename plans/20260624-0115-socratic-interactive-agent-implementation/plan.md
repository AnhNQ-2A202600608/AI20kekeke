---
title: Socratic Interactive Agent Implementation Plan
status: in-progress
created: 2026-06-24
blockedBy: []
blocks: []
---

# Socratic Interactive Agent & Latency Optimization Plan

## Overview

Refactor and enhance the LangGraph agent architecture to support both high-speed interaction and Socratic interactive widgets. This plan aims to clean up mock tools, split the graph into optimized general vs. academic paths to decrease latency, design schemas for interactive learning widgets (MCQ, Fill-in-the-blanks, Code Skeleton), and establish robust debugging observability via LangSmith.

## Scope Decisions

- Remove the obsolete [example_tool.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/tools/example_tool.py) and fully integrate [tutor_tools.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/tools/tutor_tools.py) with production-ready `calculate` and `retrieve_course_material` tools.
- Split the monolithic `respond` node into `respond_general` (for chit-chat, bypassing RAG/Critic, latency ~200ms) and `respond_academic` (for core Socratic tutoring with RAG & validation).
- Define structured schemas for interactive widgets (`interactive_widget` key in `AgentState`) to be consumed by the Frontend.
- Setup LangSmith tracing for step-by-step agent debugging.

## Phases

| Phase | Status | Purpose |
| --- | --- | --- |
| [Phase 01 — Tutor Tools Integration](phase-01-tutor-tools-integration.md) | completed | Remove example_tool.py and verify tutor_tools.py calculations. |
| [Phase 02 — Optimized Hybrid Graph](phase-02-optimized-hybrid-graph.md) | completed | Refactor graph.py to split general/academic nodes and optimize latency. |
| [Phase 03 — Interactive Widgets Schema](phase-03-interactive-widgets-schema.md) | planned | Integrate dynamic interactive JSON widget structures into AgentState. |
| [Phase 04 — Observability and Tracing](phase-04-observability-and-tracing.md) | planned | Connect LangSmith tracing and run latency/correctness benchmarks. |

## Dependencies

- Current LangGraph configuration: [graph.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/graph.py).
- LangGraph State schema: [state.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/state.py).
- RAG retrieval service: [rag.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/rag.py).

## Success Criteria

- Average latency for `general` chat queries is reduced to `< 500ms`.
- No regression in Socratic validation rules.
- Graph successfully generates structured interactive widget payloads (MCQ, blank-fill) for Frontend.
- Every node execution path is fully traceable in LangSmith dashboard.

## Cook Handoff

```bash
/ck:cook d:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\20260624-0115-socratic-interactive-agent-implementation\plan.md
```
