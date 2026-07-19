# Mentora Architecture

This document is the Demo Day architecture deliverable. The Mermaid diagrams below are the current text-first version; the polished visual diagram will be drawn from the plan in `plans/20260708-demo-day-architecture-diagram/plan.md`.

## System Overview

```mermaid
flowchart TB
  learner[Learner]
  mentor[Mentor]
  admin[Admin]

  subgraph frontend["Next.js Frontend on Vercel"]
    app["Student App\nLearning path, Socratic chat, adaptive quiz"]
    mentorUi["Mentor/Admin UI\nQuiz editor, ingestion, observability"]
    bff["Next.js BFF Proxy\n/api/v1/*"]
    supabaseSsr["Supabase SSR Auth"]
  end

  subgraph backend["FastAPI Backend on Render"]
    api["API Routes\nAuth, chat, adaptive, onboarding, audit"]
    langgraph["LangGraph Tutor\nIntent routing, Socratic response, tool use"]
    adaptive["Adaptive Engine\nElo, BKT, LinUCB, graph propagation"]
    ingestion["Course Ingestion\nSlides, chunks, metadata"]
    observability["Braintrust + AI Logs\nTraces, feedback, latency"]
  end

  subgraph data["Supabase + Cache"]
    auth["Supabase Auth\nMSSV/account identity"]
    db[("PostgreSQL 17\napp + audit schemas, RLS, RPC")]
    vector[("pgvector\nCourse slide embeddings")]
    storage["Supabase Storage\nCourse assets"]
    redis[("Redis\nSemantic and app cache")]
  end

  subgraph external["External AI Services"]
    llm["OpenAI / Gemini\nChat and evaluation calls"]
  end

  learner --> app
  mentor --> mentorUi
  admin --> mentorUi
  app --> supabaseSsr
  mentorUi --> supabaseSsr
  app --> bff
  mentorUi --> bff
  bff --> api
  supabaseSsr --> auth

  api --> langgraph
  api --> adaptive
  api --> ingestion
  api --> observability

  langgraph --> llm
  langgraph --> vector
  langgraph --> db
  adaptive --> db
  adaptive --> redis
  ingestion --> storage
  ingestion --> vector
  observability --> db
  auth --> db
  db --> vector
```

## Learning Loop

```mermaid
sequenceDiagram
  autonumber
  actor Learner
  participant UI as Next.js App
  participant API as FastAPI API
  participant Agent as LangGraph Tutor
  participant RAG as Supabase pgvector
  participant Adaptive as Elo/BKT/LinUCB Engine
  participant DB as Supabase PostgreSQL
  participant Logs as Braintrust/AI Logs

  Learner->>UI: Ask course question or start practice
  UI->>API: Authenticated request via BFF proxy
  API->>Agent: Route intent and build tutor state
  Agent->>RAG: Retrieve cited course context
  RAG-->>Agent: Relevant slide chunks and metadata
  Agent-->>API: Socratic answer with citations
  API->>Logs: Trace answer, latency, feedback metadata
  API-->>UI: Stream or return tutor response
  Learner->>UI: Submit quiz answer
  UI->>API: Submit attempt with telemetry
  API->>Adaptive: Score and update mastery
  Adaptive->>DB: Atomic RPC update for answer, Elo, BKT, graph signals
  DB-->>Adaptive: Updated mastery state
  Adaptive-->>API: Next review/recommendation state
  API-->>UI: Feedback and next learning step
```

## Adaptive Learning Path Loop

```mermaid
sequenceDiagram
  autonumber
  actor Learner
  participant UI as Next.js App
  participant API as FastAPI API
  participant Agent as LangGraph Path Agent
  participant DB as Supabase PostgreSQL

  Learner->>UI: Submit Exam
  UI->>API: POST /exams/attempts/{id}/submit
  API->>DB: Calculate score & identify weak concepts
  DB-->>API: Exam results & weak concept list
  API->>Agent: Invoke Path Graph (student_id, attempt_id)
  Agent->>DB: Fetch quiz attempts & active concepts
  DB-->>Agent: Quiz attempts data
  Note over Agent: asyncio.gather parallel run:
  Note over Agent: 1. Kahn's Topological Sort (quant)
  Note over Agent: 2. LLM Qualitative Mistake Analysis (qual)
  Agent->>DB: Save path_data to learning_path_instances (JSONB DAG)
  DB-->>Agent: New path instance created
  Agent-->>API: Return instance_id & DAG path
  API-->>UI: Learning path generated successfully
```

## CI/CD and Runtime Operations

```mermaid
flowchart LR
  dev["Developer branch or PR"] --> ciBackend["Backend CI\nruff, pytest, readiness"]
  dev --> ciFrontend["Frontend CI\nlint, Next build"]
  ciBackend -->|pass on main/dev| render["Render Deploy Hook\nBackend API"]
  ciFrontend -->|pass on main/dev| vercel["Vercel Deploy\nFrontend"]
  render --> health["/health and /ready checks"]
  vercel --> smoke["Browser smoke paths\n/app, /app/chat, /app/learn"]
  health --> monitor["Keep-awake + monitoring"]
  smoke --> monitor
```

## Components

| Component | Current implementation | Role |
|---|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Zustand | Student, mentor, and admin product surfaces |
| Backend | FastAPI, Python 3.13, Pydantic v2 | API, chat, adaptive learning, auth, ingestion |
| AI tutor / Agents | LangGraph + LangChain + OpenAI/Gemini | Socratic tutoring & Socratic hints (Tutor Graph); mistake-analysis & path DAG generation (Path Graph) |
| Database | Supabase PostgreSQL 17 with RLS, app/audit schemas, RPC | User, quiz, mastery, learning path instances, audit, and learning telemetry state |
| Retrieval | Supabase `pgvector` | Course slide retrieval for cited tutor responses |
| Cache | Redis with in-memory fallback | Semantic cache and production app caching |
| Observability | Braintrust, AI logs, pytest/RAGAS evidence | Traces, feedback, latency, and evaluation evidence |

## Visual Diagram Plan

The final drawn diagram should keep the same system boundaries as the Mermaid version:

- Vercel frontend boundary: Student app, mentor/admin UI, BFF proxy, Supabase SSR auth.
- Render backend boundary: FastAPI routes, LangGraph tutor, adaptive engine, ingestion, observability.
- Supabase boundary: Auth, PostgreSQL schemas/RPC, pgvector, storage.
- External services: OpenAI/Gemini and Braintrust/AI logs.
- Three callout flows: Socratic chat with citations, adaptive quiz mastery update, CI/CD deploy path.
