# Phase 1: Database Interface Extensions

## Context Links
- Database Interface: [database_interface.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/database_interface.py)
- Supabase Implementation: [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)
- DB Migration Schema: [20260611_initial_schema.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260611_initial_schema.sql)

## Overview
- **Priority**: High
- **Current Status**: Pending
- **Description**: Add abstract methods and concrete Supabase implementations for logging user feedback events and student learning signals into the relational database.

## Requirements
- Add `log_feedback` method to log helpful/unhelpful events.
- Add `log_learning_signal` method to save telemetry data for mentors/BTC audits.
- Map data fields correctly to database schemas:
  - `app.feedback_events`: `user_id`, `course_id`, `target_type`, `target_id`, `feedback_type`, `comment`.
  - `app.learning_signals`: `student_id`, `course_id`, `concept_id`, `signal_type`, `signal_value`.

## Related Code Files
- [MODIFY] [database_interface.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/database_interface.py)
- [MODIFY] [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)

## Implementation Steps
1. Add definitions for `log_feedback` and `log_learning_signal` in `database_interface.py`.
2. Implement `log_feedback` in `supabase_database.py` using `self.app_client` to insert into `feedback_events`.
3. Implement `log_learning_signal` in `supabase_database.py` using `self.app_client` to insert into `learning_signals`.

## Todo List
- [ ] Add `log_feedback` abstract method to `database_interface.py`
- [ ] Add `log_learning_signal` abstract method to `database_interface.py`
- [ ] Implement `log_feedback` in `supabase_database.py`
- [ ] Implement `log_learning_signal` in `supabase_database.py`

## Success Criteria
- Code compiles without error.
- Successfully logs record to mock / local database wrapper.
