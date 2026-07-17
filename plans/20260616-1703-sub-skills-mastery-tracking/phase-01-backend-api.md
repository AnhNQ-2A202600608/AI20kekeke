# Phase 1: Backend API for Concept Mastery

## Overview
- Priority: High
- Current Status: Pending
- Description: Extend the database adapter and add a FastAPI route to fetch all student concept masteries for a course in a single query.

## Proposed Changes

### [MODIFY] [database_interface.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/database_interface.py)
Add `get_all_student_concept_mastery` abstract method.

### [MODIFY] [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)
Implement `get_all_student_concept_mastery` to query Supabase with `concepts(code)` relation.

### [MODIFY] [adaptive_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py)
Add a new route `GET /mastery` accepting `student_id` and `course_id` query parameters.

## Implementation Steps

1. **Update `database_interface.py`**:
   Define `get_all_student_concept_mastery` with UUID parameters.

2. **Update `supabase_database.py`**:
   Write the Supabase query:
   ```python
   response = self.app_client.table("student_concept_mastery")\
       .select("concept_id, elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count, concepts(code)")\
       .eq("student_id", str(student_id))\
       .eq("course_id", str(course_id))\
       .execute()
   ```
   Add a fallback for stub mode.

3. **Update `adaptive_routes.py`**:
   Define route `@router.get("/mastery")`. Ensure proper error handling.
