# Architecture Diagram

This file mirrors the Demo Day architecture entry point at `docs/architecture.md`. Keep both paths available because older docs and links may point here.

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
