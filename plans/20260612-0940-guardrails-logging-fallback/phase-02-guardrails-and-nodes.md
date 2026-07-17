# Phase 2: Intent Classification & Cheating Heuristics

## Context Links
- LangGraph graph definition: [graph.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/graph.py)
- LangGraph state representation: [state.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/state.py)
- Existing nodes: [example_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/example_node.py)

## Overview
- **Priority**: High
- **Current Status**: Pending
- **Description**: Implement a fast-path rule-based filter and an LLM intent classifier to catch off-scope queries and cheating attempts (submitting homework code directly for solutions), and route them appropriately in LangGraph.

## Requirements
- **Off-scope Classifier**: Catch queries not related to computer science, coding, or course syllabus. Politely refuse.
- **Cheating Guardrail**: Detect if student submits homework/Lab code to ask for a direct solution.
  - Hybrid Detection:
    - *Rule-based (Fast Path)*: Check for code blocks (` ``` `) along with keywords like "giải bài này", "viết hộ code", "đáp án", "cho xin code", "giải giúp", etc.
    - *LLM Classifier (Slow Path)*: Under the `analyze` node or a dedicated `guardrail` node, classify intent to catch cheating patterns that bypass rule-based filters.
  - Action: Automatically force the chat mode to `Step-by-step hint` (Socratic Hint), set `policy_action = 'hint'`, add guardrail flags, and prevent the system from showing the complete solution.

## Related Code Files
- [NEW] [guardrail_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/guardrail_node.py)
- [MODIFY] [graph.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/graph.py)

## Implementation Steps
1. Create `guardrail_node.py` containing:
   - Heuristics to check for code block patterns and cheating keywords.
   - LLM classification prompt for off-scope detection and intent verification.
   - Polite refusal templates for off-scope requests.
2. Modify `graph.py` to add `guardrail` node as the starting node, routing to:
   - `respond` node immediately if off-scope or block is needed.
   - `analyze` node if the query is on-scope.

## Todo List
- [ ] Implement rule-based cheating detector in `guardrail_node.py`
- [ ] Implement LLM off-scope & intent classifier in `guardrail_node.py`
- [ ] Connect `guardrail` node in `graph.py`
- [ ] Implement routing logic in `graph.py` based on `policy_action`

## Success Criteria
- Direct requests for solutions/answers trigger Socratic mode instead of providing copy-pasteable code.
- Off-scope queries are gracefully rejected without calling the full RAG pipeline or expensive LLM tasks.
