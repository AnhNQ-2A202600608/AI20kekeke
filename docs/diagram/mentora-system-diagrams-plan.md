# Mentora System Diagram Plan

Status: draft for Excalidraw handoff
Updated: 2026-07-08

## Scope

This file defines the content for the split Excalidraw architecture files under `docs/diagram/excalidraw/`.

The previous combined canvas `docs/diagram/mentora-system-diagrams.excalidraw` has been replaced by one file per chart so each system diagram can be edited and exported independently.

The diagram set should explain the current system as implemented: Next.js frontend/BFF, FastAPI backend, Supabase Auth/Postgres/pgvector/Storage, Redis cache, OpenAI/LLM services, Braintrust observability, adaptive learning algorithms, RAG ingestion, and CI/CD.

## Chart 01 - System Runtime Topology

File: `docs/diagram/excalidraw/01-system-runtime-topology.excalidraw`

Purpose: show the complete runtime boundary for Demo Day.

Nodes:
- Learners, mentors, admins, dev/BTC users
- Next.js app on Vercel
- Next.js BFF `/api/v1/*`
- FastAPI backend on Render
- Supabase Auth, Postgres schemas, pgvector, Storage
- Redis cache
- OpenAI/LLM providers
- Braintrust and local audit logs

Main message: the product is a real full-stack adaptive learning system, not a single chatbot.

## Chart 02 - Auth And Role Gate

File: `docs/diagram/excalidraw/02-auth-role-gate.excalidraw`

Purpose: show how authenticated app access is enforced.

Flow:
1. User signs in with Supabase browser client.
2. Frontend calls `/api/v1/auth/me`.
3. Next BFF reads the Supabase cookie session or forwarded Bearer token.
4. FastAPI verifies Supabase JWT locally or via Supabase fallback.
5. Backend resolves `user_roles`.
6. Route guards enforce student, mentor, admin, dev, and BTC access.

Risk note: live mode is fail-closed; fake/dev tokens are explicitly gated.

## Chart 03 - Socratic AI Chat Runtime

File: `docs/diagram/excalidraw/03-socratic-ai-chat-runtime.excalidraw`

Purpose: show the AI runtime path from chat UI to streaming answer.

Flow:
1. Student sends a message from Sofi chat.
2. Frontend streams to `/api/v1/chat`.
3. FastAPI creates or validates chat session.
4. LangGraph `analyze` classifies intent and loads profile/memory.
5. Academic questions call RAG `match_slides`; general questions skip RAG.
6. Response node streams LLM output.
7. Socratic reflection node checks for direct answers/code leaks.
8. Invalid answers loop back for rewrite, up to the configured attempt cap.
9. SSE events return response, retrieved slides, metadata, and timings.

Main message: the AI assistant has retrieval, guardrails, reflection, and audit surfaces.

## Chart 04 - RAG Ingestion And Retrieval

File: `docs/diagram/excalidraw/04-rag-ingestion-retrieval.excalidraw`

Purpose: separate offline knowledge ingestion from runtime retrieval.

Ingestion flow:
1. Mentor/Admin/Dev triggers `/ingest/slides`.
2. Backend parses PDF slide text and slide images.
3. Slide images upload to Supabase Storage.
4. Text is embedded with OpenAI `text-embedding-3-small`.
5. Rows insert into `slide_embeddings`.

Retrieval flow:
1. Query embedding is cached.
2. Supabase RPC `match_slides` performs pgvector search.
3. Neighbor/context expansion and fallback ranking build citations.
4. Chat answer cites retrieved course slides.

Important correction: do not draw Chroma as a current runtime component.

## Chart 05 - Adaptive Recommendation

File: `docs/diagram/excalidraw/05-adaptive-recommendation.excalidraw`

Purpose: show how the next question is chosen.

Flow:
1. Quiz session gathers active set, concept, student, and excluded question IDs.
2. Frontend calls `/api/v1/adaptive/recommend`.
3. Backend loads student mastery: BKT probability and Elo.
4. Backend loads candidate questions and filters by set/concept/exclusion.
5. Backend loads policy state and bandit arms.
6. LinUCB builds context `[1, BKT, normalized Elo]`.
7. The selected question is logged as an adaptive decision.
8. The response returns question payload, hints, expected success, and diagnostics for admin/dev.

Main message: personalization is driven by student state plus exploration/exploitation, not random selection.

## Chart 06 - Adaptive Submit Transaction

File: `docs/diagram/excalidraw/06-adaptive-submit-transaction.excalidraw`

Purpose: show the critical correctness path after a student answers.

Flow:
1. Frontend submits answer with `decision_id`.
2. Backend verifies the adaptive decision belongs to the student and question.
3. Backend blocks replay if decision is already consumed.
4. Backend grades the answer server-side.
5. Backend counts hint usage from server logs.
6. Backend calls Supabase RPC `submit_attempt_v3`.
7. RPC atomically updates student Elo, BKT, mastery state, quiz attempt, mastery events, rewards, and calibration outbox.
8. Backend commits, writes mastery cache, and schedules graph propagation.

Main message: the state update is transaction-backed and replay-resistant.

## Chart 07 - Algorithm Internals

File: `docs/diagram/excalidraw/07-algorithm-internals.excalidraw`

Purpose: make the math explainable without overclaiming novelty.

Blocks:
- BKT updates mastery probability with slip, guess, transition learn, and threshold states.
- Elo computes expected success and updates student/question difficulty with hint discount.
- LinUCB computes arm score from context and uncertainty.
- Reward is aligned to Zone of Proximal Development around 75 percent expected success.
- Sherman-Morrison rank-one update maintains bandit matrices.

Main message: the system combines established adaptive methods consistently in production.

## Chart 08 - Async Calibration Outbox

File: `docs/diagram/excalidraw/08-async-calibration-outbox.excalidraw`

Purpose: explain bounded staleness and why heavy work is moved out of the request path.

Flow:
1. `submit_attempt_v3` inserts outbox rows.
2. Calibration worker batches rows.
3. Worker recalibrates question difficulty and counters.
4. Worker updates LinUCB bandit arms.
5. Worker deletes processed outbox rows.

Main message: request path stays fast while calibration catches up asynchronously.

## Chart 09 - Concept Graph And Bitemporal Mastery

File: `docs/diagram/excalidraw/09-concept-graph-bitemporal-mastery.excalidraw`

Purpose: show how mastery changes spread and how historical mastery is stored.

Flow:
1. A target concept BKT delta is produced by submit.
2. Graph propagation applies weighted updates to parent and child concepts.
3. Each propagated change logs mastery events.
4. Cache entries are cleared for affected concepts.
5. Bitemporal triggers sync changes into mastery history.
6. Current mastery views feed heatmap, profile, and skill graph surfaces.

Main message: learning state is graph-aware and historical, not only a flat score.

## Chart 10 - Onboarding Diagnostic

File: `docs/diagram/excalidraw/10-onboarding-diagnostic.excalidraw`

Purpose: show first-run personalization.

Flow:
1. User signs up or logs in.
2. App checks onboarding status.
3. Diagnostic session selects published MCQ candidates.
4. Student answers until the required completion threshold.
5. Completion persists survey/profile and seeds learning state.
6. Student enters the learning path with a personalized baseline.

## Chart 11 - Core Data Model

File: `docs/diagram/excalidraw/11-core-data-model.excalidraw`

Purpose: provide an ERD-level map for reviewers.

Entities:
- `auth.users`, `app.users`, `roles`, `user_roles`
- `courses`, `concepts`, `concept_relations`
- `questions`, `question_hints`
- `student_concept_mastery`, `student_mastery_bitemporal`
- `adaptive_decisions`, `quiz_attempts`, `mastery_events`, `adaptive_rewards`
- `calibration_outbox`, `bandit_arms`, `bkt_parameters`
- `slide_embeddings`, `chat_sessions`, `chat_messages`, `feedback`

Main message: data ownership is split between app state, audit state, and vector knowledge state.

## Chart 12 - CI/CD And Operations

File: `docs/diagram/excalidraw/12-cicd-operations.excalidraw`

Purpose: show delivery and verification paths.

Flow:
1. PR/push runs branch and PR format validators.
2. Backend CI runs uv install, Ruff, pytest, readiness checks.
3. Frontend CI runs pnpm install, lint, and Next build.
4. Push to `main` or `dev` triggers Render backend deploy hook and Vercel frontend deployment.
5. Keep-awake workflow pings backend health.
6. Manual backend verification can run golden AI evaluation and Docker build.

Main message: demo artifacts are backed by repeatable checks and deployed services.
