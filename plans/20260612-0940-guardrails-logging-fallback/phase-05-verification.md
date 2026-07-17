# Phase 5: Verification & Testing

## Context Links
- Test Graph: [test_graph.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_agents/test_graph.py)
- Test Routes: [test_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_routes.py)

## Overview
- **Priority**: High
- **Current Status**: Pending
- **Description**: Add unit and integration tests to verify the correctness of the guardrail rules, intent classifier, low-confidence fallback behavior, and feedback API endpoint.

## Requirements
- Test rule-based heuristics for cheating detection.
- Test intent classification with simulated off-scope inputs.
- Test RAG fallback behavior under low-confidence scenarios.
- Test API route responses for `/feedback`.

## Related Code Files
- [NEW] [test_guardrails.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_agents/test_guardrails.py)
- [MODIFY] [test_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_routes.py)

## Verification Steps
1. Run pytest suite on local machine:
   ```bash
   pytest tests/
   ```
2. Verify database records are successfully created for feedback/signals.

## Todo List
- [ ] Write unit tests for rule-based heuristics in `test_guardrails.py`
- [ ] Write integration tests for `/chat` guardrail trigger & fallback routing
- [ ] Write integration tests for `/feedback` route
- [ ] Verify all tests pass successfully

## Success Criteria
- Test coverage for guardrail paths.
- Zero failures in pytest suite.
