# Phase 01 - Backend Contract Models

Status: completed

## Requirements

- Add `src/models/chat_contracts.py`.
- Keep existing `src/models/schemas.py` intact for `/api/v1/chat`.
- Define stable V1 models for request, response, stream events, RAG source, tool events, artifact, validation, and metadata.
- Add helper support for V1 event envelopes without changing default legacy emission.

## Files

- `src/models/chat_contracts.py`
- `src/api/routes.py`
- `tests/test_chat_contracts.py`

## Validation

- Pydantic serialization tests pass.
- Existing chat stream tests still pass.
