# Phase 3: RAG Retrieval & Low-confidence Fallback

## Context Links
- Database Interface: [database_interface.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/database_interface.py)
- Supabase Implementation: [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)
- LangGraph graph definition: [graph.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/graph.py)

## Overview
- **Priority**: High
- **Current Status**: Pending
- **Description**: Add document retrieval capabilities to the LangGraph flow, search for matching chunks in Supabase using vector embeddings, and fallback gracefully if confidence is low.

## Requirements
- **Vector Search**: Retrieve chunks from `app.material_chunks` using cosine similarity.
- **Low-confidence Fallback**:
  - Threshold: If similarity score of top chunks is below `0.70` (or list is empty), classify as `low_confidence`.
  - Action: Bypasses normal answering node. Instead of hallucinating, returns a friendly message informing that official course material lacks this content, and suggests related concepts for study (e.g. concepts within the same course).
- **Citations**: Embed citations (source title, slide/page number, quoted excerpt) in the successful response.

## Related Code Files
- [MODIFY] [database_interface.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/database_interface.py)
- [MODIFY] [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)
- [NEW] [rag_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/rag_node.py)
- [MODIFY] [graph.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/graph.py)

## Implementation Steps
1. Define a Database RPC SQL function `match_chunks` if not already present.
2. Add `get_similar_chunks(self, query_embedding: List[float], course_id: UUID, match_threshold: float, match_count: int)` method to `DatabaseInterface` and implement it in `SupabaseAdaptiveDatabase`.
3. Create a RAG retrieval node in `src/agents/nodes/rag_node.py`:
   - Generate embeddings for user query (using OpenAI Embedding API).
   - Query similarity chunks.
   - Check if top-chunk similarity >= threshold (0.7).
   - If above threshold: set `context` and `rag_confidence` in state.
   - If below threshold: set `policy_action = 'low_confidence'` and query DB for other concepts in the course to recommend.
4. Modify `graph.py` to route to:
   - `guardrail` -> `retrieve_context` -> `analyze` -> `respond`.
   - If `policy_action == 'low_confidence'`, bypass `analyze` and go to a fallback response generator.

## Todo List
- [ ] Create `match_chunks` DB helper function in Python or SQL
- [ ] Add `get_similar_chunks` method to database services
- [ ] Implement `retrieve_context` node in `rag_node.py`
- [ ] Implement low-confidence recommendation query (retrieving related concepts in course)
- [ ] Modify LangGraph routing in `graph.py` to support RAG and fallback paths

## Success Criteria
- Low similarity queries (e.g. general chit-chat on unrelated topics, or missing material topics) are detected and handled by the fallback handler.
- Related concepts from the same course are dynamically returned to the user as suggestions.
