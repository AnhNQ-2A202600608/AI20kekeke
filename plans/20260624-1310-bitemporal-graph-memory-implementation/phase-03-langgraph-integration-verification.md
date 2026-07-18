# Phase 03 — LangGraph Integration & Verification

## Overview
Status: completed
Priority: Medium

Integrate the bitemporal memory retrieval into the LangGraph routing pipeline and compile time-travel diagnostics API endpoints.

## Proposed Changes

### [Component: Agent Nodes]

#### [MODIFY] [analyze_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/analyze_node.py)
- Pull student profile metrics using the bitemporal active view `app.active_student_mastery` instead of the legacy static table.
- If the agent detects a stale profile claim, invoke a refresh using the bitemporal retrieval tool.

### [Component: API Diagnostics]

#### [MODIFY] [routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/routes.py)
- Add a new GET endpoint `/api/v1/student/mastery/history` which accepts `student_id`, `concept_id`, and `as_of` parameters, enabling UI graphs to visualize the student's mastery progression over time.

## Implementation Steps

1. Update `analyze_node.py` database calls.
2. Build the time-travel diagnostics endpoint in `routes.py`.
3. Conduct performance latency benchmark tests.

## Verification Plan

### Automated Tests
- Run performance benchmarks to verify database query overhead is under 15ms.
  ```bash
  uv run pytest tests/
  ```

### Manual Verification
- Deploy changes, run mock sessions, and call the `/history` API with various historical timestamps to verify the returned Elo scores correctly match past states.
