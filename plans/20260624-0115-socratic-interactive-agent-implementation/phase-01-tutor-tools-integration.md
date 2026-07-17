# Phase 01 — Tutor Tools Integration

## Overview
Status: completed
Priority: High

Clean up obsolete examples and finalize the production-ready tools library inside the `src/agents/tools/` package.

## Proposed Changes

### [Component: Tools]

#### [DELETE] [example_tool.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/tools/example_tool.py)
- Delete the example file as it is a mock template not used in production code.

#### [NEW] [tutor_tools.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/tools/tutor_tools.py)
- Fully implement `calculate` tool (safe AST evaluation).
- Fully implement `retrieve_course_material` tool wrapping `RAGService`.

## Implementation Steps

1. Delete `src/agents/tools/example_tool.py`.
2. Update `src/agents/tools/__init__.py` to import `calculate` and `retrieve_course_material` from `tutor_tools.py` so they are discoverable package-wide.

## Verification Plan

### Automated Tests
- Run pytest to ensure deleting example_tool.py does not break any test suites.
  ```bash
  pytest tests/
  ```
