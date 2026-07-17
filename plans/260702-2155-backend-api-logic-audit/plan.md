---
title: "Backend API Logic Audit Fix"
description: "Fix verified API-boundary and quiz-state regressions without introducing new data-fetching infrastructure."
status: completed
priority: P1
branch: "blue"
tags: [bugfix, frontend, api]
blockedBy: []
blocks: []
created: "2026-07-02T14:46:40.481Z"
createdBy: "ck:plan"
source: skill
---

# Backend API Logic Audit Fix

## Overview

Fix the concrete regressions found during backend/API scout:

- BFF proxy must stay a transparent API boundary: no fake successful data, no vague fallback contract, preserve upstream status and trace id.
- Clicking the EduGap brand while in quiz mode must leave quiz mode and return to the app dashboard.
- Static question loading must deduplicate in-flight requests so effects and explicit practice starts do not call the same API twice.
- Knowledge graph API must fail with explicit unavailable status instead of returning empty fallback data as success.
- Question APIs must not silently switch from Supabase to local JSON in production.
- Production backend must not enter Supabase stub mode when required secrets are missing.
- Internal benchmark endpoints must not expose mock RAG contexts or live OpenAI calls in production.
- Internal test pages must not issue direct Supabase test-table reads in production.
- Student profile/mastery calls should use explicit query construction, shared error parsing, and avoid caching failed requests as successful.
- BFF proxy must not forward browser cookies or hop-by-hop headers to FastAPI; it should forward a stable trace id.
- Mentor RAG audit UI should call live audit APIs through one auth/error helper and should not keep unused preset/mock result datasets.
- RAG audit mutation endpoints must use the backend Supabase secret config helper instead of reading deprecated env keys directly.
- Braintrust admin polling should use encoded query parameters, shared error parsing, same-origin credentials, and in-flight request deduplication.
- Quiz report submissions must send the verified bearer token, clear expired tokens, and surface backend errors instead of a generic failure.
- Quiz Socratic sidebar should reuse the shared chat API client; chat requests must require a real store user id/token and must not fall back to seeded student identity.
- Adaptive recommend/submit client calls must fail locally when no bearer token is available instead of producing avoidable unauthorized backend calls.
- Static quiz/skills manifests should use shared cached loaders so app and practice views do not duplicate asset requests.
- Guidebook API should be allowlisted, path-scoped to `knowledge/`, return explicit 404 for missing content, and avoid vague empty-success responses.
- Knowledge graph launcher should deduplicate in-flight API requests and avoid refreshing immediately when a fresh Supabase cache was already hydrated.
- Onboarding API client should fail fast without a valid bearer token, include same-origin credentials, and deduplicate in-flight status checks.
- Query-param mock user loading should be disabled outside demo/development mode.
- RAG global fallback should be explicit opt-in and retrieval cache keys should separate fallback modes.
- BFF proxy should not perform Supabase cookie-session lookup for public auth endpoints that do not need a bearer token.
- Next.js Supabase question/graph adapter should be narrow and read-only instead of exposing raw schema clients and unused write/RPC methods.
- Quiz survey and waitlist submissions should use an authenticated backend API instead of direct browser Supabase table writes.
- Unused browser Supabase mock client should be removed after survey writes move behind `/api/v1`.
- Contextual chat profile loading should fail explicitly on DB read errors instead of using default learner data.
- Chat session/history/message/memory persistence should fail explicitly instead of generating fallback session IDs or silently dropping DB errors.
- Signup must not return success until the business user and role assignment are both persisted; partial Auth users must be cleaned up on downstream failures.
- Adaptive recommendation/submission must fail explicitly when bandit or server-side signal stores are unavailable instead of defaulting arm state, hint count, or AI usage.
- LLM calls must not fall back to mock responses outside tests or an explicit local mock flag.
- RAG dependency failures must be distinguished from valid empty retrieval results and surfaced as unavailable errors.
- Frontend API helpers must reject fake demo tokens outside demo/development mode and avoid raw token forwarding.
- Audit log endpoints should not fabricate decision/reward rows in stub mode.
- Quiz report submissions should fail explicitly when the live feedback store cannot persist the report.
- Graph relation mutations should not return success when Supabase returns no created/updated row.
- Student activity/session reads should return explicit unavailable errors on backend store failures, and graph relation deletes should verify a relation existed before returning success.
- Chat runtime failures should return sanitized retryable errors without leaking infrastructure exception strings, and demo bypass handlers should be guarded even when hidden in live UI.
- Audit log read endpoints should treat live audit store failures as dependency-unavailable errors instead of generic server crashes.
- Adaptive submit RPC empty results should be treated as unavailable dependency failures instead of opaque server errors.
- Mentor audit and RAG sandbox endpoints should return sanitized unavailable errors for live store/runtime failures and avoid exposing raw exception strings.
- Public auth provider failures should return sanitized user-safe messages while logging provider details server-side.
- Adaptive mastery, sync, and graph relation auxiliary endpoints should use explicit unavailable errors for live store failures.
- Auth business-store failures and Next.js question/guidebook route handler failures should use explicit unavailable errors instead of generic 500 responses.
- Demo/mock behavior should not be enabled implicitly by `NODE_ENV=development`; it must require an explicit demo flag.
- Adaptive submit database contract should be covered by tests so direct RPC access and hot-row calibration do not regress.
- Practice logo navigation and frontend read-only Supabase adapter invariants should be covered by tests.
- Protected frontend `/api/v1` calls should include same-origin credentials and stay covered by contract tests.
- Explicit demo auth should bypass onboarding backend calls and the practice logo flow should be verified in a local browser smoke test.
- BFF proxy and Next route handlers should keep header filtering, trace propagation, and explicit unavailable/not-found errors covered by tests.
- Live auth role lookup should fail closed with an explicit unavailable error when the role store cannot be read.
- Benchmark/mock backend endpoints and client-side simulated pipelines should require explicit opt-in demo/dev flags.
- Duplicate, unused frontend API/chat implementations should be removed so there is one clear runtime path per feature.
- Backend API error hygiene should be covered by regression tests that block generic 500 responses and raw exception details.
- Frontend Supabase diagnostics should be explicit opt-in, and browser code should not write directly to Supabase tables.
- Deployed frontend/backend API boundaries should have a no-secrets smoke checker for live evidence.
- Public readiness endpoints should not expose raw database/cache exception strings.
- Request validation errors should not echo raw request bodies or invalid input values back to clients/logs.
- Live smoke token-rejection checks should only accept auth rejections; dependency failures must fail the smoke run.
- ZPD recommendation widgets must not invent seeded student identities or present auth/dependency failures as successful completion.

Out of scope: replacing all client state with TanStack Query, removing intentional demo-mode mentor data, or changing Supabase schema/RLS.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [API Proxy Contract](./phase-01-api-proxy-contract.md) | Completed |
| 2 | [Quiz Navigation State](./phase-02-quiz-navigation-state.md) | Completed |
| 3 | [Request Dedup Verification](./phase-03-request-dedup-verification.md) | Completed |
| 4 | Knowledge Graph/API Source Hardening | Completed |
| 5 | Production Question Source Guard | Completed |
| 6 | Production Stub Guard | Completed |
| 7 | Production Benchmark Guard | Completed |
| 8 | Debug Page Production Guard | Completed |
| 9 | Student Profile/Mastery API Normalization | Completed |
| 10 | BFF Header Boundary Hardening | Completed |
| 11 | Mentor RAG Audit API Cleanup | Completed |
| 12 | RAG Audit Supabase Key Boundary | Completed |
| 13 | Braintrust Admin Polling Dedup | Completed |
| 14 | Quiz Report Auth/Error Contract | Completed |
| 15 | Shared Chat API Client Contract | Completed |
| 16 | Adaptive Client Auth Preflight | Completed |
| 17 | Manifest Fetch Dedup | Completed |
| 18 | Guidebook API Contract Hardening | Completed |
| 19 | Knowledge Graph Runtime Dedup | Completed |
| 20 | Onboarding API Auth/Dedup Contract | Completed |
| 21 | Mock User Production Guard | Completed |
| 22 | RAG Global Fallback Guard | Completed |
| 23 | Public Auth Proxy Dedup | Completed |
| 24 | Next Supabase Read-Only Adapter | Completed |
| 25 | Survey Backend Mutation Boundary | Completed |
| 26 | Unused Browser Supabase Mock Removal | Completed |
| 27 | Chat Profile Failure Contract | Completed |
| 28 | Chat Persistence Failure Contract | Completed |
| 29 | Signup Role Assignment Atomicity | Completed |
| 30 | Adaptive Algorithm Dependency Contract | Completed |
| 31 | LLM Provider Mock Guard | Completed |
| 32 | RAG Dependency Failure Contract | Completed |
| 33 | Frontend Fake Token Boundary | Completed |
| 34 | Audit Endpoint Mock Row Removal | Completed |
| 35 | Quiz Report Persistence Contract | Completed |
| 36 | Graph Relation Mutation Contract | Completed |
| 37 | Student Activity and Relation Delete Contract | Completed |
| 38 | Chat Error Hygiene and Demo Bypass Guard | Completed |
| 39 | Audit Store Failure Contract | Completed |
| 40 | Adaptive Submit Empty Transaction Contract | Completed |
| 41 | Mentor Audit Endpoint Failure Contract | Completed |
| 42 | Auth Provider Error Sanitization | Completed |
| 43 | Adaptive Auxiliary Store Failure Contract | Completed |
| 44 | Auth and Next Route Unavailable Contract | Completed |
| 45 | Explicit Demo Mode Boundary | Completed |
| 46 | Adaptive SQL Submit Contract Test | Completed |
| 47 | Frontend API and Navigation Contract Test | Completed |
| 48 | Protected API Credentials Contract Test | Completed |
| 49 | Demo Gate and Practice Logo Browser Smoke | Completed |
| 50 | BFF Proxy and Route Trace Contract Test | Completed |
| 51 | Live Auth Role Store Failure Contract | Completed |
| 52 | Benchmark and Mentor Ingestion Demo Boundary | Completed |
| 53 | Legacy Socratic Chat Implementation Removal | Completed |
| 54 | Backend Error Hygiene Contract Tests | Completed |
| 55 | Supabase Debug and Browser Write Boundary | Completed |
| 56 | Live API Smoke Checker | Completed |
| 57 | Readiness Error Sanitization | Completed |
| 58 | Validation Error Body Sanitization | Completed |
| 59 | Validation Detail Input Sanitization | Completed |
| 60 | Live Smoke Token Rejection Strictness | Completed |
| 61 | ZPD Widget Identity and Error Boundary | Completed |

## Dependencies

- Research references: FastAPI APIRouter docs, Next.js Route Handler/fetch docs, TanStack Query important defaults, Supabase changelog/docs.
- Existing patterns: `frontend/app/api/v1/[...path]/route.ts`, `frontend/app/hooks/useQuizSession.ts`, `frontend/stores/createPracticeSlice.ts`.

## Reports

- [API Surface Audit Report](./reports/api-surface-audit.md)
