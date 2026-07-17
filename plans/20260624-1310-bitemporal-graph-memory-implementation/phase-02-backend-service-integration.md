# Phase 02 — Backend Service Integration

<!-- Updated: Validation Session 1 - Python code simplified to offload interval management to database triggers -->

## Overview
Status: planned
Priority: High

Refactor the database interface, Supabase concrete implementation, and adaptive services (Elo, BKT) to read and write student mastery records using the bitemporal tables.

## Proposed Changes

### [Component: Database Adapters]

#### [MODIFY] [database_interface.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/database_interface.py)
- Add abstract methods for bitemporal operations:
  - `get_student_mastery_as_of(student_id, concept_id, target_time)`
  - `save_student_mastery_bitemporal(student_id, concept_id, elo, bkt, valid_range)`

#### [MODIFY] [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)
- Implement `get_student_mastery_as_of` querying using `@>` range operator.
- Implement `save_student_mastery_bitemporal`. Since the database trigger automatically handles interval closing on insertion, this function simply performs a standard INSERT of the new record (with the specified `valid_range` and default `transaction_time`). No complex `SELECT FOR UPDATE` or manual row updates are needed from Python.

### [Component: Adaptive Services]

#### [MODIFY] [elo.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/elo.py) and [bkt.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/bkt.py)
- Update calculation functions to support saving updates bitemporally.

## Implementation Steps

1. Update `database_interface.py` with the new signatures.
2. Implement the concrete methods inside `supabase_database.py`.
3. Refactor `elo.py` and `bkt.py` to trigger bitemporal records write.

## Verification Plan

### Automated Tests
- Create unit tests in `tests/test_api/test_adaptive_bitemporal.py` verifying:
  - Elo calculation updates successfully split the valid interval.
  - Querying "As Of" a historical date returns the correct past Elo value.
