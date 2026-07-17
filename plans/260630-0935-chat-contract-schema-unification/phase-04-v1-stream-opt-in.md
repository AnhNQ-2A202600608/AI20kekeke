# Phase 04 - V1 Stream Opt-In

Status: completed

## Requirements

- Keep legacy stream as default.
- Add opt-in detection using request header `X-Agent-Chat-Protocol: v1` or body `schemaVersion: agent-chat.v1`.
- Emit V1 event envelopes through `sse_v1_event()` only when opted in.
- Map legacy RAG slides to `RagSource` and emit `source_delta` after analysis when available.
- Build V1 final `done.response` with message parts, sources, validation, and metadata.
- Add frontend option `protocolVersion: 'legacy' | 'v1'`.

## Files

- `src/models/schemas.py`
- `src/models/chat_contracts.py`
- `src/api/routes.py`
- `frontend/lib/chat/contracts.ts`
- `frontend/lib/chat/stream.ts`
- `tests/test_api/test_chat_stream.py`

## Validation

- `uv run pytest tests/test_chat_contracts.py tests/test_api/test_chat_stream.py`
- `uv run ruff check src/models/chat_contracts.py src/models/schemas.py src/api/routes.py tests/test_chat_contracts.py tests/test_api/test_chat_stream.py`
- `pnpm exec eslint lib/chat/stream.ts lib/chat/contracts.ts`
- `pnpm exec tsc --noEmit`
