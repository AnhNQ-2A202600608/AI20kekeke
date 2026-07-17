# Phase 01 — Database Migration

<!-- Updated: Validation Session 1 - PostgreSQL triggers for interval closing -->

## Overview
Status: planned
Priority: High

Set up the database schema, extensions, bitemporal tables, triggers, and current-state Views in Supabase PostgreSQL to support dual-time modeling.

## Proposed Changes

### [Component: Database Migration]

#### [NEW] [20260624_bitemporal_mastery.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260624_bitemporal_mastery.sql)
- Enable the `btree_gist` extension (required to use scalar fields like UUID in GiST exclusion constraints).
- Create the table `app.student_mastery_bitemporal` with `valid_time TSTZRANGE` and `transaction_time TSTZRANGE`.
- Set up the exclusion constraint `no_overlapping_mastery` using GiST to ensure no temporal overlap per student and concept.
- Create PostgreSQL function and trigger to automatically close the previous `valid_time` range (set its upper bound to the new lower bound) and `transaction_time` range upon insertion of a new state.
- Create a View `app.active_student_mastery` that filters `valid_time` and `transaction_time` containing `NOW()` to act as a drop-in replacement for the original `student_mastery` queries.

## Implementation Steps

1. Create the SQL migration script `db/supabase/migrations/20260624_bitemporal_mastery.sql`.
2. Apply the migration using Supabase CLI or direct database execution.
3. Verify that the view `app.active_student_mastery` successfully compiles and targets the new table structure.

## Verification Plan

### Manual Verification
- Attempt to manually insert two rows for the same `student_id` and `concept_id` where both `valid_time` and `transaction_time` overlap.
- Verify that PostgreSQL throws an exclusion constraint violation: `no_overlapping_mastery_intervals`.
- Verify that inserting non-overlapping ranges (e.g. sequence of time intervals) succeeds.
