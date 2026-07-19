# Fix Log - SEC-002: Rate Limiting

## Overview
Implemented API rate limiting using `slowapi` and `limits` to protect key backend endpoints against cost-incurring DoS attacks and brute-force attempts.

## Completed Tasks

1. **Libraries Installed**:
   - Installed `slowapi` and `limits` libraries for rate limiting.

2. **Limiter Architecture**:
   - Subclassed `Limiter` into `FailOpenLimiter` to support fail-open mechanism in case Redis goes down or becomes unreachable (it logs a warning once and allows requests to pass through).
   - In test/development environment without Redis, fallbacks automatically to `memory://` storage.

3. **Key Rate Limits Configured**:
   - **Default global limit**: `120/minute`.
   - **POST `/api/v1/chat`**: `20/minute` keyed by JWT `sub` (authenticated user UUID).
   - **POST `/api/v1/auth/login`**: IP + email limit `5/minute` to protect accounts, plus IP limit `30/minute`.
   - **POST `/api/v1/auth/signup`**: IP limit `3/minute`.
   - **Adaptive endpoints (`/adaptive/*`)**: `60/minute` keyed by JWT `sub`.

4. **Integration**:
   - Added rate limit configuration variables to `Settings` class in `src/config.py`.
   - Setup `SlowAPIMiddleware` in `src/main.py`.
   - Added custom exception handler for `RateLimitExceeded` to return a standardized JSON response matching the specifications (`{"detail": "Too Many Requests. ..."}`) with the `Retry-After` header.
   - Refactored request signatures in endpoints (`routes.py`, `auth_routes.py`, `adaptive_routes.py`) to conform to slowapi's signature rules (`request: Request`), avoiding conflicts with existing request body parameters by renaming them (e.g. `login_request`, `chat_request`, etc.).

5. **Tests**:
   - Created comprehensive tests in `tests/test_api/test_rate_limit.py` to cover chat rate limiting, login brute force protection, bypass checks, retry-after headers, and fail-open mechanism verification.
   - All tests successfully pass, including the full test suite.
