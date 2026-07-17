---
title: Chat Contract Schema Unification
status: completed
created: 2026-06-30
---

# Chat Contract Schema Unification

## Overview

Unify the chat contract between FastAPI and Next.js without breaking the current `/api/v1/chat` SSE stream. Add explicit V1 schema models, typed frontend contracts, and a compatibility adapter so legacy events keep working while new agent-chat events can be emitted and consumed safely.

## Scope

In scope:

- Add backend Pydantic models for chat request, response, message parts, RAG sources, tool events, artifacts, validation, and V1 stream events.
- Add backend SSE helper support for V1 event envelopes with monotonic `seq`.
- Add frontend TypeScript contracts mirroring the backend shape.
- Refactor frontend stream parsing to normalize both legacy events and V1 events into one internal event path.
- Add focused tests for schema shape, event sequence, and legacy compatibility.

Out of scope:

- Full backend session migration from localStorage to server truth.
- Gemini/OpenAI provider router.
- Database schema changes for persisted message parts.
- UI redesign.

## Acceptance Criteria

- Existing legacy chat stream tests pass unchanged or with only additive assertions.
- New backend contract tests validate V1 model serialization.
- Frontend parser keeps accepting `thinking`, `token`, `tool_call`, `tool_result`, `analysis`, `done`, `error`.
- Frontend parser can also consume V1 `status`, `text_delta`, `source_delta`, `validation`, and `done` events.
- No breaking change to current `/api/v1/chat` request payload.

## Phases

| Phase | Status | Purpose |
| --- | --- | --- |
| [Phase 01 - Backend Contract Models](phase-01-backend-contract-models.md) | completed | Add typed Pydantic contract models and SSE V1 event envelope helpers. |
| [Phase 02 - Frontend Contract Types](phase-02-frontend-contract-types.md) | completed | Add TypeScript contracts and normalize parser behavior. |
| [Phase 03 - Compatibility Tests](phase-03-compatibility-tests.md) | completed | Lock legacy behavior and V1 schema behavior with focused tests. |
| [Phase 04 - V1 Stream Opt-In](phase-04-v1-stream-opt-in.md) | completed | Let clients request V1 SSE events while preserving legacy default stream behavior. |

## Verification

- Passed: `uv run pytest tests/test_chat_contracts.py tests/test_api/test_chat_stream.py`
- Passed: `uv run ruff check src/models/chat_contracts.py src/api/routes.py tests/test_chat_contracts.py`
- Passed: `pnpm exec eslint lib/chat/stream.ts lib/chat/contracts.ts`
- Passed: `pnpm exec tsc --noEmit`
- Passed after V1 opt-in: `uv run pytest tests/test_chat_contracts.py tests/test_api/test_chat_stream.py`
- Passed after V1 opt-in: `uv run ruff check src/models/chat_contracts.py src/models/schemas.py src/api/routes.py tests/test_chat_contracts.py tests/test_api/test_chat_stream.py`
- Passed after V1 opt-in: `pnpm exec eslint lib/chat/stream.ts lib/chat/contracts.ts`
- Passed after V1 opt-in: `pnpm exec tsc --noEmit`

## Next Slice Acceptance

- Legacy `/api/v1/chat` stream remains unchanged by default.
- A client can opt into V1 with `X-Agent-Chat-Protocol: v1` or `schemaVersion: agent-chat.v1`.
- V1 stream emits `status`, `text_delta`, and `done` for fast paths.
- V1 academic path can emit `source_delta` when retrieved slides are available.
- Frontend can request V1 via `streamChatRequest(..., { protocolVersion: 'v1' })`.

## Risks

- Frontend parser regression could break live chat even if backend is unchanged.
- Too much schema purity could overfit future provider needs. Keep V1 minimal.
- Emitting V1 and legacy events simultaneously would duplicate UI output. This plan adds V1 support, not dual-emission by default.
