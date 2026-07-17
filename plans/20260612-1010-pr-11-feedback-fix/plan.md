# Plan: Fix PR 11 Review Feedback and Audit Blockers

This plan outlines the steps to resolve the PR 11 review comments (Copilot feedback) and the 7 blockers identified in the adaptive audit report (`BAO_CAO_THAM_DINH_ADAPTIVE.md`), making the Adaptive Learning Engine production-ready.

## Tasks

- [ ] **Task 1: Sherman-Morrison Numerical Stability** → Enforce symmetry `A_inv = (A_inv + A_inv.T) / 2.0` and add small regularization/clamping in `src/services/adaptive/bandit.py` to prevent singularity.
- [ ] **Task 2: Chat Route Cleanup** → Remove the unused `block_profile` variable in `src/api/routes.py` and ensure `updated_profile` is fully validated before caching.
- [ ] **Task 3: PostgreSQL RPC Transaction & Concurrency Locking (Blockers 1, 2, 3, 5, 6)**:
  - Create a migration file to declare `app.submit_attempt_txn` function in Supabase.
  - Implement pessimistic locking (`FOR UPDATE`) for student mastery and question difficulty.
  - Set `consumed_at` to prevent Replay Attacks on adaptive decisions.
  - Call the RPC function in `SupabaseAdaptiveDatabase` instead of mock transaction methods.
- [ ] **Task 4: Server-side Grading (Blocker 4)** → Modify `submit_attempt` in `adaptive_routes.py` to grade student answers against `answer_key` on the server and check hint counts server-side.
- [ ] **Task 5: Chat Background Sync & Cache Invalidation (Blocker 7 & H5)**:
  - Fix `sync_mastery_to_db` to use a non-incrementing update function (do not touch `attempt_count`).
  - Align default Elo to 1200.0 and correct enums.
  - Add cache invalidation/write-through at the end of `/submit` route to prevent stale chatbot context.
- [ ] **Task 6: Verification & Test Suite** → Add test cases for AI-help, replay attacks, and rollback scenarios, and run `pytest`.

## Done When
- [ ] All 7 Blocker issues and 2 Copilot comments are resolved in the codebase.
- [ ] The entire test suite passes (`pytest` returns 100% success).
