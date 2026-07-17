# Plan: Chatbot Cache Interface and Personalization

This plan outlines the design and implementation steps for integrating a 2-tier memory architecture (In-memory/Redis Cache + Asynchronous Background Database Writes) and personalizing the LangGraph Chatbot based on student mastery data (Elo/BKT).

## Context & Requirements
1. **Cache Store Interface**: Define an abstraction for caching student state (Elo, BKT, session cache).
2. **Multiple Drivers**:
   - `in_memory`: For local testing without Redis.
   - `redis`: Supporting local Redis (Docker) and Upstash Redis.
3. **Personalization & Dynamic Prompting**:
   - Classify student proficiency (Low, Mid, High Elo).
   - Adapt the Chatbot's System Prompt dynamically based on Elo ratings and selected modes.
   - Implement Academic Integrity Guardrails (Socratic Hint Ladder instead of direct code).
4. **Latency Optimization**:
   - Read from cache/state during active chat turns.
   - Use FastAPI `BackgroundTasks` to write changes back to Supabase/Postgres asynchronously.

## Proposed Submodules

1. `src/services/cache/base.py`: Abstract `BaseCacheStore` class.
2. `src/services/cache/in_memory.py`: In-memory dictionary implementation.
3. `src/services/cache/redis_store.py`: Redis client implementation supporting URL and Token.
4. `src/services/cache/__init__.py`: Factory pattern helper to return the active cache store.
5. `src/agents/state.py`: Add `student_profile` to the LangGraph state.
6. `src/agents/nodes/example_node.py`: Implement student Elo classification and dynamic prompts.
7. `src/api/routes.py`: Integrate FastAPI `BackgroundTasks` for async DB writes.

## Implementation Steps

1. **Add Dependencies**: Add `redis` to `requirements.txt`.
2. **Implement Cache Store**:
   - Write the base class, in-memory client, and redis client.
   - Add tests for both cache implementations.
3. **Implement Personalization Prompting**:
   - Update `src/agents/state.py` to support student profiles.
   - Update `src/agents/nodes/example_node.py` to format dynamic system prompts.
4. **FastAPI & LangGraph Route Integration**:
   - Update the `/chat` endpoint to fetch student profiles from cache/DB first.
   - Invoke LangGraph with the profile.
   - Use `BackgroundTasks` to sync the updated profile back to Supabase.
5. **Verify**:
   - Run tests and check chat response styling under different simulated Elo levels.
