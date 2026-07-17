# Plan: Guardrails, Fallback, and Logging Integration

This plan outlines the design and implementation steps for integrating Intent Classification, Cheating Guardrails, Low-confidence RAG Fallback, and Feedback/Audit Logging endpoints.

## Status Overview

- **Phase 1: Database Interface Extensions** (Status: `[ ] Pending`)
  - Extend the database interface and Supabase implementation to support logging learning signals and user feedback.
- **Phase 2: Intent Classification & Cheating Heuristics** (Status: `[ ] Pending`)
  - Implement the rule-based cheating check and LangGraph Intent Classifier node.
- **Phase 3: RAG Retrieval & Low-confidence Fallback** (Status: `[ ] Pending`)
  - Implement semantic search and the low-confidence fallback mechanism in LangGraph.
- **Phase 4: API Endpoints for Feedback & Logging** (Status: `[ ] Pending`)
  - Add API endpoints to receive and store feedback and log learning signals.
- **Phase 5: Verification & Testing** (Status: `[ ] Pending`)
  - Write unit and integration tests to verify the correctness of the new features.

## Detailed Phase Plans
- [Phase 1: Database Interface Extensions](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260612-0940-guardrails-logging-fallback/phase-01-database-interface.md)
- [Phase 2: Intent Classification & Cheating Heuristics](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260612-0940-guardrails-logging-fallback/phase-02-guardrails-and-nodes.md)
- [Phase 3: RAG Retrieval & Low-confidence Fallback](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260612-0940-guardrails-logging-fallback/phase-03-fallback-rag.md)
- [Phase 4: API Endpoints for Feedback & Logging](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260612-0940-guardrails-logging-fallback/phase-04-endpoints.md)
- [Phase 5: Verification & Testing](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260612-0940-guardrails-logging-fallback/phase-05-verification.md)

## Key Dependencies
- Current Supabase connection setup in `SupabaseAdaptiveDatabase` (using `app_client`).
- LangGraph compilation flow in `src/agents/graph.py` and state representation in `src/agents/state.py`.
- Correct environment credentials (`SUPABASE_URL`, `SUPABASE_KEY`) loaded.
