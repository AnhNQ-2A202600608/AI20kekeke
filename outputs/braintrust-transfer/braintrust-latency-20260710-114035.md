# Braintrust Latency Report

- Generated: 2026-07-10T11:40:35.221705+00:00
- Events fetched: 200
- Traces observed: 30
- Errors: 7

## Span Duration Summary

| Span | Count | p50 ms | p95 ms | max ms |
|---|---:|---:|---:|---:|
| `LangGraph` | 8 | 7801.73 | 17795.08 | 18737.22 |
| `chat.stream` | 10 | 7523.01 | 18983.06 | 19303.56 |
| `respond_academic` | 10 | 4755.75 | 7816.43 | 7990.15 |
| `llm.respond_stream` | 10 | 4752.51 | 7812.29 | 7984.79 |
| `ChatOpenAI` | 24 | 2456.44 | 7580.81 | 7983.4 |
| `Chat Completion` | 24 | 2453.01 | 7578.22 | 7978.46 |
| `analyze` | 8 | 2136.01 | 6709.58 | 8051.35 |
| `rag.retrieve` | 9 | 2003.87 | 4594.6 | 6047.35 |
| `agent.intent_classify` | 3 | 1956.18 | 1964.58 | 1965.51 |
| `pedagogical_reflection` | 2 | 1364.15 | 1782.52 | 1829.01 |
| `llm.reflection` | 2 | 1361.27 | 1779.66 | 1826.15 |
| `rag.vector_rpc` | 8 | 719.52 | 1569.7 | 1699.17 |
| `rag.embedding` | 8 | 659.83 | 3285.52 | 4078.43 |
| `Embedding` | 8 | 654.53 | 1421.13 | 1808.28 |
| `chat.message_save` | 8 | 270.22 | 584.53 | 598.43 |
| `chat.session_validate` | 1 | 249.76 | 249.76 | 249.76 |
| `chat.session_create` | 9 | 141.31 | 581.55 | 744.05 |
| `chat.history_load` | 8 | 113.22 | 150.14 | 165.38 |
| `chat.memory_load` | 8 | 98.6 | 201.12 | 249.81 |
| `check_reflection` | 10 | 1.23 | 2.28 | 2.64 |
| `should_continue` | 9 | 0.88 | 1.66 | 2.04 |
| `check_feedback` | 2 | 0.81 | 0.88 | 0.89 |
| `chat.static_general` | 1 | 0.58 | 0.58 | 0.58 |
| `chat.profile_load` | 10 | 0.16 | 0.33 | 0.44 |

## Recent Traces

| Root span | Events | Observed max span ms | Top spans |
|---|---:|---:|---|
| `3ac7d8aa8d08198a2f50cccbaeb5707a` | 2 | 4828.72 | ChatOpenAI, Chat Completion |
| `167600429051b7ddc3e86c283aa6a716` | 20 | 8346.01 | chat.session_create, chat.stream, chat.history_load, chat.memory_load, LangGraph, analyze, agent.intent_classify, ChatOpenAI |
| `457349f6c00f305c2be342c18f6c58ae` | 1 | 0.16 | chat.profile_load |
| `e2ae19585e4ab1f015be0af83933a3d3` | 2 | 2105.68 | ChatOpenAI, Chat Completion |
| `8545eb781df529bece6775507e951ead` | 20 | 6700.0 | chat.session_validate, chat.stream, chat.history_load, chat.memory_load, LangGraph, analyze, agent.intent_classify, ChatOpenAI |
| `9fc086e835813a1d09c39479ebd673a0` | 1 | 0.17 | chat.profile_load |
| `5bba58372f182c472fcc79337887e6bf` | 2 | 2460.44 | Chat Completion, ChatOpenAI |
| `60967c269ab079e1d125209db560f265` | 20 | 18591.34 | chat.stream, chat.session_create, chat.history_load, chat.memory_load, LangGraph, analyze, agent.intent_classify, ChatOpenAI |
| `8b8f0bc8c0153934777eb1e88ae1adfc` | 1 | 0.44 | chat.profile_load |
| `a25bb76ced63ba9e3baa0b65e9d58a88` | 2 | 178.98 | chat.session_create, chat.stream |
| `79090cd14227c56c931c9851f820cf57` | 1 | 0.18 | chat.profile_load |
| `91117c07360674b063d66639a86d2823` | 2 | 7470.51 | ChatOpenAI, Chat Completion |
| `82da6c84ac970cfa173b227e9388d5ab` | 17 | 8937.96 | chat.stream, chat.session_create, chat.history_load, chat.memory_load, LangGraph, analyze, rag.retrieve, rag.embedding |
| `3477fbca4d44f9a05090705826e47869` | 1 | 0.2 | chat.profile_load |
| `53aceb01dbbaa5ccd68cd47a45388b00` | 1 | 0.58 | chat.static_general |
| `4d666794c25c982c2ea078e5ff6e3a37` | 2 | 1886.45 | ChatOpenAI, Chat Completion |
| `c3ba2021e82178993e15a0008cb0ff76` | 17 | 4358.34 | chat.session_create, chat.stream, chat.history_load, chat.memory_load, LangGraph, analyze, rag.retrieve, rag.embedding |
| `d20d3c4a53dc69466696dd18d6fa2a94` | 1 | 0.16 | chat.profile_load |
| `748bc4d26133c9bcfb5dac0d617b2a52` | 2 | 2166.46 | ChatOpenAI, Chat Completion |
| `bdce267a0e240c2ef8269fed932bec61` | 17 | 3918.64 | chat.session_create, chat.stream, chat.history_load, chat.memory_load, LangGraph, analyze, rag.retrieve, rag.embedding |

## Errors

| Root span | Span | Error |
|---|---|---|
| `a25bb76ced63ba9e3baa0b65e9d58a88` | `chat.session_create` | "Traceback (most recent call last):\n  File \"/app/src/services/adaptive/supabase_database.py\", line 928, in create_chat_session\n    response = self.app_clie... |
| `a25bb76ced63ba9e3baa0b65e9d58a88` | `chat.stream` | "Unable to create chat session." |
| `d547e619cc45cf1908415033128870c1` | `chat.stream` | "Unable to create chat session." |
| `d547e619cc45cf1908415033128870c1` | `chat.session_create` | "Traceback (most recent call last):\n  File \"/app/src/services/adaptive/supabase_database.py\", line 928, in create_chat_session\n    response = self.app_clie... |
| `15aa6450-cd84-4524-85df-8ddededaaf4a` | `ChatOpenAI` | "Error code: 429 - {'error': {'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, read... |
| `15aa6450-cd84-4524-85df-8ddededaaf4a` | `llm.respond_stream` | "Traceback (most recent call last):\n  File \"D:\\Project\\Vin_AI\\000 Group Project\\C2-App-125\\src\\services\\braintrust_observability.py\", line 45, in spa... |
| `15aa6450-cd84-4524-85df-8ddededaaf4a` | `ChatOpenAI` | "Error code: 429 - {'error': {'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, read... |
