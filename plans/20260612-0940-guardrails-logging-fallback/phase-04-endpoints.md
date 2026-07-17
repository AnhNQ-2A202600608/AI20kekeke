# Phase 4: API Endpoints for Feedback & Logging

## Context Links
- API Router: [routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/routes.py)
- DB Migration Schema: [20260611_initial_schema.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260611_initial_schema.sql)

## Overview
- **Priority**: Medium
- **Current Status**: Pending
- **Description**: Expose API endpoints for receiving user feedback (helpful/unhelpful) and write learning signals dynamically to record student interactions for instructor dashboard monitoring.

## Requirements
- **Feedback Endpoint**:
  - Route: `POST /api/v1/feedback`
  - Parameters: `user_id`, `course_id`, `target_type`, `target_id`, `feedback_type`, `comment`.
  - Save to: `app.feedback_events` table using `log_feedback`.
- **Learning Signals Telemetry**:
  - Automatically log telemetry during chat invocations.
  - Trigger points:
    - On chat request start or finish.
    - If off-scope or cheating guardrail is triggered, log a learning signal of type `guardrail` or `chat` with guardrail flags.
  - Save to: `app.learning_signals` table using `log_learning_signal`.

## Related Code Files
- [MODIFY] [routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/routes.py)
- [MODIFY] [schemas.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/models/schemas.py)

## Implementation Steps
1. Add `FeedbackRequest` model to `src/models/schemas.py`.
2. Add `POST /feedback` endpoint to `routes.py`.
3. Update `POST /chat` in `routes.py` to record learning signals asynchronously (similar to mastery update task).

## Todo List
- [ ] Add `FeedbackRequest` model to `schemas.py`
- [ ] Add `feedback` endpoint in `routes.py`
- [ ] Integrate learning signal logging into the `/chat` route in `routes.py`
- [ ] Run logging as background tasks to keep response latency low

## Success Criteria
- Requesting `POST /api/v1/feedback` successfully inserts feedback.
- Every chat request logs a telemetry event to `learning_signals` in the database.
