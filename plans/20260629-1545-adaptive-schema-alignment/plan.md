# Adaptive Schema Alignment

Status: completed

## Scope

- Align frontend adaptive quiz payloads with backend Pydantic contracts.
- Keep backend as source of truth.
- Extract adaptive quiz helpers from `frontend/app/hooks/useQuizSession.ts` to reduce god-component pressure.

## Acceptance Criteria

- `submitAdaptiveAnswer` sends `student_answer` as an object matching backend grading keys.
- Adaptive questions keep the resolved `concept_id` even though backend `RecommendResponse` does not return it.
- Existing adaptive quiz and ZPD widget callers compile against the updated client contract.
- Focused frontend type/lint verification runs.

## Out Of Scope

- OpenAPI type generation.
- Adding response models for every raw backend endpoint.
- Changing database schema or adaptive grading behavior.
