# Phase 02 - Frontend Contract Types

Status: completed

## Requirements

- Add `frontend/lib/chat/contracts.ts`.
- Refactor `frontend/lib/chat/stream.ts` to import shared frontend types.
- Normalize V1 and legacy events in one parser path.
- Preserve public function names: `streamChatRequest`, `buildChatArtifacts`.

## Files

- `frontend/lib/chat/contracts.ts`
- `frontend/lib/chat/stream.ts`

## Validation

- TypeScript/ESLint focused validation for touched chat files.
- Existing chat UI callers continue compiling.
