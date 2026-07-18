# Braintrust Latency Report

- Generated: 2026-06-28T08:49:18.111137+00:00
- Events fetched: 50
- Traces observed: 11
- Errors: 0

## Span Duration Summary

| Span | Count | p50 ms | p95 ms | max ms |
|---|---:|---:|---:|---:|
| `chat.stream` | 2 | 7987.27 | 9629.19 | 9811.63 |
| `LangGraph` | 2 | 7264.23 | 8256.5 | 8366.75 |
| `analyze` | 2 | 4188.59 | 5042.04 | 5136.87 |
| `respond_academic` | 3 | 3225.47 | 5793.98 | 6079.37 |
| `llm.respond_stream` | 3 | 3220.86 | 5788.28 | 6073.55 |
| `ChatOpenAI` | 6 | 3064.99 | 5594.25 | 6069.92 |
| `Chat Completion` | 7 | 2908.22 | 5495.45 | 6065.84 |
| `agent.intent_classify` | 2 | 2351.12 | 2573.48 | 2598.19 |
| `rag.embedding` | 1 | 1056.47 | 1056.47 | 1056.47 |
| `Embedding` | 1 | 844.94 | 844.94 | 844.94 |
| `chat.session_validate` | 1 | 561.0 | 561.0 | 561.0 |
| `rag.vector_rpc` | 1 | 422.75 | 422.75 | 422.75 |
| `chat.message_save` | 1 | 385.11 | 385.11 | 385.11 |
| `chat.history_load` | 1 | 151.69 | 151.69 | 151.69 |
| `chat.memory_load` | 1 | 126.59 | 126.59 | 126.59 |
| `check_reflection` | 3 | 2.83 | 3.03 | 3.05 |
| `should_continue` | 3 | 1.13 | 1.16 | 1.16 |
| `rag.retrieve` | 3 | 0.5 | 2121.94 | 2357.66 |
| `chat.profile_load` | 2 | 0.43 | 0.64 | 0.66 |
| `root` | 5 | 0.23 | 4.02 | 4.86 |

## Recent Traces

| Root span | Events | Observed max span ms | Top spans |
|---|---:|---:|---|
| `367d6221-74de-458b-be6a-b3c905108e04` | 2 | 4167.24 | ChatOpenAI, Chat Completion |
| `21838971-447c-47bc-ad23-06ab255cfbc0` | 20 | 9811.63 | chat.session_validate, chat.stream, chat.history_load, chat.memory_load, LangGraph, analyze, agent.intent_classify, ChatOpenAI |
| `b0834508-0a77-4516-93aa-9adfcc65cb6c` | 1 | 0.66 | chat.profile_load |
| `cdc19147-c345-4e9c-9a7c-e4093c09b0c8` | 1 | 4.86 | root |
| `28ba4639-cf68-4d51-8110-d79716316304` | 1 | 0.14 | root |
| `f5a1cc5e-c822-49ba-8368-fcc55ba9d630` | 1 | 0.15 | root |
| `0726474d-66df-4755-a1dd-9a3e4eb589e2` | 1 | 0.23 | root |
| `12feaca2-024d-4ae6-9234-aa235063734e` | 1 | 0.65 | root |
| `37e69920-0ea5-4080-9b03-89568177a623` | 13 | 6162.92 | chat.stream, LangGraph, analyze, agent.intent_classify, ChatOpenAI, Chat Completion, rag.retrieve, should_continue |
| `1c672366-ee0e-4407-9662-e3c8606613b0` | 1 | 0.2 | chat.profile_load |
| `ff0fba42-39d6-4912-a4f2-f76b30d61acd` | 8 | 6079.37 | Chat Completion, rag.retrieve, should_continue, respond_academic, llm.respond_stream, ChatOpenAI, Chat Completion, check_reflection |
