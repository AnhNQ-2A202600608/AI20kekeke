# Phase 03 — Interactive Widgets Schema

## Overview
Status: planned
Priority: Medium

Design and implement the structured JSON schemas for interactive Socratic widgets within the `AgentState`. This will allow the backend to generate quizzes, blank-fills, and code sandboxes dynamically on-the-fly and pass them to the client.

## Proposed Changes

### [Component: State Schema]

#### [MODIFY] [state.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/state.py)
- Add `interactive_widget` dictionary property to `AgentState`.
- Add `student_submission` dictionary property to `AgentState`.

### [Component: Practice Generator Nodes]

#### [NEW] [practice_generator_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/practice_generator_node.py)
- Implement a node that formats a structured JSON payload using OpenAI Structured Outputs (or Pydantic parser) for:
  - Multiple Choice Questions (MCQ) with option length balance.
  - Fill-in-the-blanks with regex-based answer keys.
  - Code skeleton completions with placeholders.

#### [NEW] [grading_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/grading_node.py)
- Implement a node to evaluate student answers:
  - Match simple string/regex patterns for fill-in-the-blanks.
  - Call AI grading prompt for short answer criteria.
  - Trigger Elo and BKT updates on success/failure.

## Implementation Steps

1. Modify `src/agents/state.py`.
2. Implement schemas in `src/agents/nodes/practice_generator_node.py`.
3. Add the `grading` and `practice_generator` nodes to the main graph.
4. Hook frontend-facing API responses to pass the widget metadata to the client.

## Verification Plan
- Write unit tests verifying that the LLM generates valid JSON matching the specified schemas for MCQ, Fill-in-the-blanks, and Code Skeleton questions.
