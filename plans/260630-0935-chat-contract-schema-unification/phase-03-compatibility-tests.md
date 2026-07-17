# Phase 03 - Compatibility Tests

Status: completed

## Requirements

- Add focused backend tests for V1 contracts.
- Keep existing stream tests passing.
- Add parser-level frontend validation if local test tooling supports it; otherwise rely on TypeScript lint.

## Files

- `tests/test_chat_contracts.py`
- `tests/test_api/test_chat_stream.py`
- Optional frontend test file if current setup has a test runner.

## Validation

- `uv run pytest tests/test_chat_contracts.py tests/test_api/test_chat_stream.py`
- `pnpm exec eslint lib/chat/stream.ts lib/chat/contracts.ts`
