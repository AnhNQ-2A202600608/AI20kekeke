---
title: Bitemporal Graph Memory Implementation Plan
status: completed
created: 2026-06-24
blockedBy:
  - 20260624-0115-socratic-interactive-agent-implementation
blocks: []
---

# Bitemporal Graph Memory Implementation Plan

## Overview

Implement a PostgreSQL-native Bitemporal Graph Memory system in Supabase to track student concept mastery changes over time. This architectural enhancement allows the Socratic AI agent to observe rate of learning progress, perform retroactive pedagogical calibrations (retroactive updates), and trace historical states for explainable AI recommendations without infrastructure overhead.

## Scope Decisions

- Implement bitemporal dimensions (`valid_time` and `transaction_time` `tstzrange` fields) directly in Supabase using PostgreSQL temporal algebra.
- Enforce unique non-overlapping intervals per student/concept using a GiST index exclusion constraint.
- Refactor the backend adaptation services (`elo.py` and `bkt.py`) to query and write student mastery records using the bitemporal history.
- Provide a PostgreSQL View to select the active mastery state (`AS OF NOW`) to keep standard queries fast and clean.

## Phases

| Phase | Status | Purpose |
| --- | --- | --- |
| [Phase 01 — Database Migration](phase-01-database-migration.md) | completed | Create tables, GiST exclusion constraints, indexes, and current-state Views. |
| [Phase 02 — Backend Service Integration](phase-02-backend-service-integration.md) | completed | Refactor FastAPI adaptive services and database interfaces to use the bitemporal data model. |
| [Phase 03 — LangGraph Integration & Verification](phase-03-langgraph-integration-verification.md) | completed | Hook the bitemporal state retrieval to analyze node and perform historical auditing. |

## Dependencies

- Current Database Interface: [database_interface.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/database_interface.py).
- Supabase Implementation: [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py).
- Adaptive Algorithms: [elo.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/elo.py), [bkt.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/bkt.py).

## Success Criteria

- Database correctly rejects overlapping valid and transaction intervals for the same student and concept.
- Backend can fetch the student's mastery profile `AS OF` any valid and transaction time slice.
- Performance overhead of temporal select queries is `< 15ms` using GiST indexing.
- Unit tests verify retroactive updates (e.g. updating a past concept state correctly creates split intervals).

## Validation Log

### Session 1 — 2026-06-24
**Trigger:** User requested validation of Bitemporal Graph Memory Implementation Plan.
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** How should bitemporal transaction and valid time interval management (e.g., closing previous intervals) be executed?
   - Options: PostgreSQL triggers/functions (Recommended) | Python implementation in supabase_database.py | Hybrid
   - **Answer:** PostgreSQL triggers/functions: Encapsulate temporal interval closing and default upper bounds in PostgreSQL (ensures strict transactional safety).
   - **Rationale:** Offloading interval calculations and locking to a PostgreSQL trigger ensures that concurrently written intervals for the same student/concept never overlap at the database layer.

2. **[Tradeoffs]** If a mentor retroactively corrects a student's score at a historical valid time (T_past), how should subsequent mastery metrics behave?
   - Options: Isolated Patch (Recommended) | Retroactive Propagation | Informational Only
   - **Answer:** Isolated Patch: Update the mastery state for only that specific valid time range. Leave subsequent history intact.
   - **Rationale:** Avoids expensive recalculations of subsequent Elo/BKT history, making updates fast and deterministic.

3. **[Scope/Scale]** Bitemporal logging is insert-only, producing new rows on every state transition. How should we manage potential table bloat for the MVP?
   - Options: Defer (Recommended) | Partitioning | State Merging
   - **Answer:** Defer: Standard B-Tree/GiST indexing will easily handle MVP volumes; defer partitioning/archival rules.
   - **Rationale:** Focuses resources on the core logic and testing, avoiding premature optimization.

#### Confirmed Decisions
- Transaction logic: Handled by PostgreSQL triggers/functions.
- Retroactive score updates: Will be recorded as isolated patches for the specific time range.
- Table bloat/partitioning: Deferred for future phases.

#### Action Items
- [x] Implement database-level trigger for bitemporal interval updates in Phase 01. (Updated in Phase 01 spec)
- [x] Simplify Python client code in Phase 02 since interval management is now offloaded to the database. (Updated in Phase 02 spec)

#### Impact on Phases
- Phase 1: Create PostgreSQL function and trigger for managing bitemporal ranges.
- Phase 2: Python `supabase_database.py` only needs to run simple `INSERT` statements, as PostgreSQL will handle closing previous ranges automatically.
