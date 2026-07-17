# Braintrust Latency Report

- Generated: 2026-06-28T09:08:00.737313+00:00
- Events fetched: 200
- Traces observed: 37
- Errors: 0

## Span Duration Summary

| Span | Count | p50 ms | p95 ms | max ms |
|---|---:|---:|---:|---:|
| `chat.stream` | 15 | 6750.93 | 9852.38 | 9947.45 |
| `LangGraph` | 15 | 6750.0 | 9535.59 | 9946.38 |
| `respond_academic` | 13 | 5473.68 | 8201.09 | 8536.93 |
| `llm.respond_stream` | 13 | 5470.14 | 8196.13 | 8531.81 |
| `ChatOpenAI` | 21 | 4206.37 | 7970.92 | 8529.8 |
| `Chat Completion` | 21 | 4203.07 | 7967.82 | 8526.18 |
| `agent.intent_classify` | 3 | 2104.06 | 2548.78 | 2598.19 |
| `respond_general` | 3 | 1775.35 | 2672.03 | 2771.66 |
| `llm.respond_general_stream` | 3 | 1773.72 | 2071.29 | 2104.35 |
| `rag.embedding` | 4 | 945.21 | 1074.27 | 1077.41 |
| `Embedding` | 4 | 838.41 | 916.14 | 928.71 |
| `analyze` | 15 | 630.78 | 4569.38 | 5136.87 |
| `chat.session_validate` | 1 | 561.0 | 561.0 | 561.0 |
| `rag.vector_rpc` | 4 | 440.52 | 1463.58 | 1640.99 |
| `chat.message_save` | 1 | 385.11 | 385.11 | 385.11 |
| `chat.history_load` | 1 | 151.69 | 151.69 | 151.69 |
| `chat.memory_load` | 1 | 126.59 | 126.59 | 126.59 |
| `check_reflection` | 13 | 2.17 | 3.31 | 3.69 |
| `should_continue` | 16 | 1.03 | 1.24 | 1.47 |
| `rag.retrieve` | 13 | 0.4 | 2906.9 | 3730.76 |
| `root` | 5 | 0.23 | 4.02 | 4.86 |
| `chat.profile_load` | 15 | 0.15 | 0.71 | 0.82 |

## Recent Traces

| Root span | Events | Observed max span ms | Top spans |
|---|---:|---:|---|
| `da5ade3c-6ab0-40ff-903d-3231f88b2028` | 10 | 8612.04 | chat.stream, LangGraph, analyze, rag.retrieve, should_continue, respond_academic, llm.respond_stream, ChatOpenAI |
| `e37d2a3d-3531-478e-bc88-45adeb43aa71` | 1 | 0.14 | chat.profile_load |
| `198b2cec-dbad-40cd-9cf0-d7091a156b92` | 10 | 9119.05 | chat.stream, LangGraph, analyze, rag.retrieve, should_continue, respond_academic, llm.respond_stream, ChatOpenAI |
| `4af7a247-2d73-482a-8cc2-0cbd986c1411` | 1 | 0.22 | chat.profile_load |
| `c00d5c03-37c5-4f6d-b425-12ea2019d432` | 13 | 9947.45 | chat.stream, LangGraph, analyze, rag.embedding, rag.retrieve, Embedding, rag.vector_rpc, should_continue |
| `44e4b2fd-bd45-46ed-89b4-8be2c4c475b1` | 1 | 0.14 | chat.profile_load |
| `28d8d4fb-0ab7-40c7-8532-8aaa4dc87892` | 10 | 6203.39 | LangGraph, chat.stream, analyze, rag.retrieve, should_continue, respond_academic, llm.respond_stream, Chat Completion |
| `08b0d187-8274-4526-8261-db5fcfa941ae` | 1 | 0.22 | chat.profile_load |
| `74b484e1-3d5a-4bd1-be17-dff4a3369b15` | 10 | 6750.93 | chat.stream, LangGraph, analyze, rag.retrieve, should_continue, respond_academic, ChatOpenAI, llm.respond_stream |
| `56e3f77e-ea07-49e5-a0bc-a9fb14ab95b8` | 1 | 0.15 | chat.profile_load |
| `8e660e4e-3d30-4741-8aec-178c08290536` | 13 | 8261.34 | chat.stream, LangGraph, analyze, rag.embedding, rag.retrieve, Embedding, rag.vector_rpc, should_continue |
| `4df3d353-76c8-4bdd-802a-5b991f3b9a1e` | 1 | 0.15 | chat.profile_load |
| `f3502d02-a612-4543-b071-9b7780237acd` | 10 | 4839.16 | LangGraph, chat.stream, analyze, rag.retrieve, should_continue, respond_academic, ChatOpenAI, llm.respond_stream |
| `7a59be19-8f4d-43f9-87a0-f6103940d757` | 1 | 0.15 | chat.profile_load |
| `7cf4bbba-523b-4ae1-855f-4d9d8dd562a0` | 10 | 4888.89 | chat.stream, LangGraph, analyze, rag.retrieve, should_continue, respond_academic, llm.respond_stream, Chat Completion |
| `29a773b7-8320-4ba5-bbe6-246882f36633` | 1 | 0.15 | chat.profile_load |
| `2a57bd9b-5baa-4d0d-a510-af6d8658caa3` | 13 | 9360.88 | LangGraph, chat.stream, analyze, rag.embedding, rag.retrieve, Embedding, rag.vector_rpc, should_continue |
| `21b8bd48-471d-4378-909f-4f614ca1a175` | 1 | 0.34 | chat.profile_load |
| `cc957ede-2671-44dc-8245-c8ab18913650` | 8 | 1781.58 | chat.stream, LangGraph, analyze, should_continue, respond_general, llm.respond_general_stream, Chat Completion, ChatOpenAI |
| `3e1341c8-c6e9-44cf-9791-e4746cfdfe7e` | 1 | 0.15 | chat.profile_load |
