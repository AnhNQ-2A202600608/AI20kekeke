# Braintrust Latency Report

- Generated: 2026-06-28T09:14:58.799789+00:00
- Events fetched: 100
- Traces observed: 16
- Errors: 0

## Span Duration Summary

| Span | Count | p50 ms | p95 ms | max ms |
|---|---:|---:|---:|---:|
| `chat.stream` | 7 | 8612.04 | 10531.75 | 10782.16 |
| `LangGraph` | 7 | 8610.83 | 9700.42 | 9946.38 |
| `respond_academic` | 8 | 5857.23 | 8341.02 | 8536.93 |
| `llm.respond_stream` | 8 | 5852.82 | 8336.0 | 8531.81 |
| `ChatOpenAI` | 9 | 5561.78 | 8306.25 | 8529.8 |
| `Chat Completion` | 9 | 5557.91 | 8302.84 | 8526.18 |
| `rag.embedding` | 3 | 833.95 | 1291.73 | 1342.59 |
| `Embedding` | 3 | 831.88 | 1087.87 | 1116.31 |
| `analyze` | 8 | 630.92 | 3420.46 | 3763.44 |
| `chat.session_validate` | 1 | 601.51 | 601.51 | 601.51 |
| `chat.message_save` | 1 | 451.55 | 451.55 | 451.55 |
| `rag.vector_rpc` | 3 | 429.98 | 455.46 | 458.29 |
| `chat.memory_load` | 1 | 239.54 | 239.54 | 239.54 |
| `chat.history_load` | 1 | 136.96 | 136.96 | 136.96 |
| `check_reflection` | 8 | 2.06 | 2.69 | 2.71 |
| `should_continue` | 8 | 0.99 | 1.15 | 1.17 |
| `rag.retrieve` | 8 | 0.36 | 2698.53 | 2984.66 |
| `chat.profile_load` | 7 | 0.15 | 0.62 | 0.79 |

## Recent Traces

| Root span | Events | Observed max span ms | Top spans |
|---|---:|---:|---|
| `83d49b8a-8771-4ad2-ab80-ee3239b7b5f7` | 2 | 2447.19 | ChatOpenAI, Chat Completion |
| `bdeca9df-0302-4a1a-8680-4fdbb23ba1d0` | 17 | 10782.16 | chat.session_validate, chat.stream, chat.history_load, chat.memory_load, LangGraph, analyze, rag.embedding, rag.retrieve |
| `6b0c7a51-deb9-4a5c-b8ee-d546b6a277c7` | 1 | 0.79 | chat.profile_load |
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
| `f3502d02-a612-4543-b071-9b7780237acd` | 8 | 4212.91 | analyze, rag.retrieve, should_continue, respond_academic, ChatOpenAI, llm.respond_stream, Chat Completion, check_reflection |
