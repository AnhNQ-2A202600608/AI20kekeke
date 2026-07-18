# Plan: Personalized Semantic Cache

This plan outlines the design and implementation steps for a Personalized Semantic Cache. The system caches Socratic responses using vector embeddings (via Redis Vector Search or Supabase pgvector) and segments them based on student Elo/BKT levels to preserve personalization.

## Context & Requirements

1.  **Semantic Similarity Matching**:
    *   Convert incoming student questions to vector embeddings (e.g., using OpenAI `text-embedding-3-small` or Gemini embeddings).
    *   Search the cache for historically asked questions with a Cosine Similarity of $\ge 0.92$.
2.  **Personalization Separation (Elo Banding)**:
    *   Since different students receive different pedagogical responses (Socratic hints for low-mastery students vs. deep concept questions for high-mastery students), the cache must not return a high-mastery answer to a low-mastery student.
    *   **Solution**: Partition cache entries into Elo bands (e.g., `Low` [Elo < 1100], `Medium` [Elo 1100 - 1300], `High` [Elo > 1300]). A cache hit occurs only if the semantic similarity is met **and** the current student's Elo band matches the cached entry's Elo band.
3.  **Low Latency & Async Syncing**:
    *   Query cache before invoking RAG and LLM (< 50ms target).
    *   Write new Q&A pairs asynchronously to the cache database using background tasks to prevent blocking the HTTP response.
4.  **2-Tier Caching & Prompt Caching (LLM Provider-level)**:
    *   For **Cache Misses**, route requests to LLM using **Prompt Caching** to minimize input token costs (saving 50%-90%) and time-to-first-token.
    *   **Prompt Structuring**: Order the prompt dynamically from static to dynamic: `System Prompt (static)` $\rightarrow$ `Course Knowledge / RAG Context (static/long)` $\rightarrow$ `Chat History (semi-dynamic)` $\rightarrow$ `Current Question (dynamic)`.
    *   **Provider Caching Configuration**: Add support for Anthropic's `"cache_control": {"type": "ephemeral"}` metadata markers in the LangGraph message builder.

## Proposed Submodules

1.  `src/services/cache/semantic_base.py`: Abstract interface `BaseSemanticCache` defining `get_cache(query_vector, elo_band)` and `set_cache(query_text, query_vector, answer_text, elo_band)`.
2.  `src/services/cache/supabase_semantic.py`: Postgres `pgvector` implementation querying a `semantic_cache` table.
3.  `src/services/cache/redis_semantic.py`: Redis Vector Search implementation using `redis-py` (if Redis is active).
4.  `src/services/cache/embeddings.py`: Service to generate embeddings for user queries.
5.  `src/agents/nodes/chat.py`: Modify the chat LangGraph/FastAPI node to perform a semantic cache lookup.
6.  `src/agents/prompt_builder.py`: Implement prompt formatting logic matching the Prompt Caching guidelines (Static-to-Dynamic ordering) and attaching `cache_control` headers.

## Implementation Steps

1.  **Database / Schema Setup**:
    *   Create a Supabase SQL migration script to enable `pgvector` and create a `semantic_cache` table:
        ```sql
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE TABLE app.semantic_cache (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            question_text text NOT NULL,
            embedding vector(1536) NOT NULL, -- matching text-embedding-3-small
            answer_text text NOT NULL,
            elo_band varchar(20) NOT NULL,
            created_at timestamptz DEFAULT now()
        );
        CREATE INDEX ON app.semantic_cache USING hnsw (embedding vector_cosine_ops);
        ```
2.  **Implement Embedding & Cache Services**:
    *   Write the embedding helper using OpenAI/Gemini client.
    *   Write the `SupabaseSemanticCache` logic using SQL Cosine distance (`<=>` operator).
3.  **Prompt Caching & Message Builder Setup**:
    *   Create/update `src/agents/prompt_builder.py` to order messages: System Prompt $\rightarrow$ RAG Chunks $\rightarrow$ Chat History $\rightarrow$ User Question.
    *   Attach `cache_control: {"type": "ephemeral"}` to System Prompt and RAG Chunks for Anthropic API compatibility.
4.  **FastAPI Integration**:
    *   In the `/chat` endpoint, check the student's ELO score from their profile.
    *   Compute the query vector and perform a cache lookup matching the Elo band.
    *   On a **Cache Hit**: Instantly return the cached Socratic answer.
    *   On a **Cache Miss**: Execute RAG + LLM (with Prompt Caching structured inputs), return the response, and dispatch a FastAPI `BackgroundTask` to compute and save the new Q&A vector pair to the cache.
5.  **Verify & Test**:
    *   Simulate two students with different Elo scores asking the same question. Ensure they receive distinct cached/fresh answers suited to their proficiency levels.
    *   Audit LLM API response metadata to verify Prompt Cache Hits/Misses and token savings.

