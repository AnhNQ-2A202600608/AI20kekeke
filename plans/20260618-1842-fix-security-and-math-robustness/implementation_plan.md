# Refactor Auth Security, UCB Robustness, and Cache Invalidation

This plan addresses a critical security flaw in authentication logic, mathematical edge cases in LinUCB recommendations, and robustness improvements in graph propagation.

## User Review Required

> [!IMPORTANT]
> - **Production JWT Validation**: In production mode (`db._stub_mode` is `False`), the `Authorization` bearer token is now validated against Supabase Auth (`db.app_client.auth.get_user(token)`) to extract the true user UUID, preventing token-forgery/impersonation attacks.
> - **Stub Mode Fallback**: In local testing and development environments (`db._stub_mode = True`), we will continue to support direct UUID parsing to ensure unit tests pass.
> - **Removal of service_role Hardcoding**: The insecure check `token == "service_role"` in `require_teacher` is now restricted to stub/development mode only.

## Proposed Changes

---

### API Security & Authentication

#### [MODIFY] [adaptive_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py)
- Update `get_current_student_id` to accept `db: AdaptiveDatabaseInterface = Depends(get_adaptive_db)` as a nested dependency.
- Refactor `get_current_student_id` to validate token using `db.app_client.auth.get_user(token)` in production, and fall back to raw UUID parsing only in stub mode.
- Refactor `require_teacher` to validate token using `db.app_client.auth.get_user(token)` in production, and query the role code for the validated `user_id`.

---

### UCB Score Math Robustness

#### [MODIFY] [bandit.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/bandit.py)
- Update `compute_ucb_score` to validate both `pred` and `std_dev` separately.
- Replace the fallback `ucb = -float("inf")` (which permanently disables the question from being recommended) with a safer default `ucb = pred` (falling back to the expected prediction without variance boost).

---

### Graph Propagation Safety

#### [MODIFY] [graph_propagation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/graph_propagation.py)
- Update `propagate_mastery` signature to accept a `visited: set[UUID] | None = None` parameter.
- Implement cycle protection by skipping concepts already inside the `visited` set.
- Enable recursive multi-step propagation safely and return the set of all modified concept IDs to allow clean cache invalidation.

---

## Verification Plan

### Automated Tests
- Run `uv run pytest` to ensure all existing API tests pass.
- Run `uv run ruff check` and `uv run ruff format --check` to ensure no lint/formatting regressions are introduced.

### Manual Verification
- Verify code correctness by reviewing modified functions.
