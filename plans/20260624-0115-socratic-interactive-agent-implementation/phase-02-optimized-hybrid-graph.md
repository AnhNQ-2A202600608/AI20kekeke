# Phase 02 — Optimized Hybrid Graph

## Overview
Status: completed
Priority: High

Refactor the LangGraph definition to split chat processing into two distinct pathways: a fast-path for general/conversational queries (no RAG, no Critic, ~200ms response) and a robust Socratic pathway for academic queries.

## Proposed Changes

### [Component: Graph Router]

#### [MODIFY] [graph.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/graph.py)
- Import `respond_general_node` and `respond_academic_node`.
- Add conditional edges from `analyze` to route either to `respond_general` or `respond_academic` based on the detected intent:
  - If `intent == "general"`, route to `respond_general`.
  - If `intent == "academic"`, route to `respond_academic`.
- Set `respond_general` node to directly lead to `END`.
- Connect `respond_academic` to the `check_reflection` routing edge.

#### [NEW] [respond_general_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/respond_general_node.py)
- Implement a lightweight conversational node that answers greetings, small talk, and off-topic questions without invoking `RAGService` or the Socratic Critic.
- Uses a small, fast prompt to ensure minimal Time-To-First-Token.

#### [MODIFY] [respond_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/respond_node.py)
- Rename or keep as the academic response node (`respond_academic_node`).

## Implementation Steps

1. Create `src/agents/nodes/respond_general_node.py`.
2. Refactor `src/agents/graph.py` to add nodes `respond_general` and `respond_academic`.
3. Adjust routing transitions from the `analyze` node using `intent` in `AgentState["metadata"]`.
4. Update `routes.py` event handling if node names changed during `astream_events` listening.

## Verification Plan

### Manual Verification
- Test via the chat interface:
  - Ask "Chào bạn" (general) and verify it returns a response instantly.
  - Ask "Docker Volume là gì?" (academic) and verify it shows slide references and triggers Socratic guidance.
