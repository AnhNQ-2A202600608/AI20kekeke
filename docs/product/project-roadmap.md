# Project Roadmap

## Overview

This roadmap tracks the current Adaptive-first AI Tutor implementation. The project has moved beyond the original starter phase: core app, auth, onboarding, adaptive engine, RAG chat, design system assets, and deployment scaffolding now exist. Remaining work should focus on stabilization, evidence, production hardening, and content/mentor workflow completion.

## Phase 0: Repository and Documentation Foundation

**Status:** Complete / Maintained

- Preserve AI logging and collaboration workflow files.
- Maintain PR template, branch-flow validation, journals, worklogs, and docs.
- Keep engineering docs aligned with actual Next.js/FastAPI/Supabase architecture.

## Phase 1: Core Product Shell and Design System

**Status:** In Progress

- Public landing, login, onboarding, and authenticated app shell exist.
- Current priority: align landing page with the new dense app workspace style.
- Maintain app sizing baseline in `docs/product/design-guidelines.md`.
- Keep colors, tactile states, maskable icon assets, learning scenery, backgrounds, seeds/soils, and mascot assets consistent across surfaces.
- Ensure unauthenticated users route to public landing/login instead of entering `/app`.

## Phase 2: Auth, Onboarding, and Access Control

**Status:** In Progress / Hardening

- Supabase email/password auth is integrated.
- Next.js SSR uses Supabase Publishable Key and cookie sessions.
- Backend protected routes verify Supabase JWTs and resolve RBAC from database roles.
- Live mode rejects raw UUID tokens, fake demo tokens, missing auth, and expired JWTs.
- Onboarding gates app access and syncs completion with backend.
- Remaining work: broaden onboarding regression tests and production session edge-case coverage.

## Phase 3: Adaptive Learning Engine

**Status:** Implemented / Stabilizing

- Elo, BKT, LinUCB recommendation, expected success, adaptive decision logs, reward logs, and graph propagation exist.
- Submit path uses server-side grading and atomic RPC where configured.
- Replay protection and cross-user checks are enforced.
- Redis/in-memory cache supports mastery profile reads and write-through updates.
- Remaining work: expand test coverage for high-contention quiz submit, RPC permission failures, and multi-skill graph propagation quality.

## Phase 4: Socratic RAG Chat and AI Tutor

**Status:** Implemented / Stabilizing

- Streaming SSE chat exists with status, tool-call, tool-result, and token events.
- LangGraph orchestrates analysis, RAG retrieval, response generation, and memory update paths.
- Fast paths reduce unnecessary RAG/LLM work for simple general or clarification cases.
- Citations, validation metadata, and Braintrust timing/traces are integrated.
- Remaining work: continue golden-case evaluation, citation quality checks, and guardrail regression tests.

## Phase 5: Mentor/BTC Workflows

**Status:** Partially Implemented

- Mentor/BTC dashboard surfaces exist for class insights, ingestion, quiz review, profile/skill views, RAG audit, and Braintrust observability.
- Backend RBAC protects mentor/admin/dev-only routes.
- Ingestion can run as a backend background task.
- Remaining work: replace any remaining silent mock operational data with real backend data or explicit demo/empty states, then verify end-to-end mentor publishing and audit flows.

## Phase 6: Deployment and Production Operations

**Status:** In Progress

- Render Docker backend and Redis blueprint exists.
- `/health` and `/ready` probes exist.
- Supabase key boundary is defined: frontend/SSR uses Publishable Key, backend uses `SUPABASE_SECRET_KEY`.
- Remaining work: confirm actual production plan/service size, remove deprecated `SUPABASE_KEY`, configure real frontend CORS origin, verify Redis production cache, and rotate any exposed legacy secrets.

## Future Scope

- React Flow DAG editor for prerequisite review.
- Rich concept mind map and graph approval workflow.
- LMS integration.
- Fully automated learning plan generator.
- Advanced multimodal tutoring.
- Expanded teacher analytics and evidence export.

## MVP Success Metrics

- Guests cannot enter `/app`; authenticated students complete onboarding before app access.
- Student can ask course-grounded questions in 5 modes with citations and Elo-adaptive explanations.
- Student can take ZPD-calibrated quizzes and receive server-authored mastery updates.
- Guardrails prevent direct lab/gate assignment completion and route students toward hints/reasoning.
- Mentor/BTC can inspect class gaps, ingestion state, RAG audit signals, and Braintrust observability through protected backend routes.
- Golden tests and focused auth/onboarding/adaptive/chat tests pass for core happy and error paths.
