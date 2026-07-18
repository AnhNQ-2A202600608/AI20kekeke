# Phase 1: Backend Signup API

## Overview
- Priority: High
- Current Status: Completed
- Description: Implement the `POST /api/v1/auth/signup` API endpoint in FastAPI to validate MSSV and register new users with the student role.

## Proposed Changes

### [MODIFY] [auth_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/auth_routes.py)
Add `SignupRequest` schema and `@router.post("/signup")` route.

## Implementation Steps

1. Define `SignupRequest` model with `full_name` and `mssv` fields.
2. Validate MSSV against `^2A2026\d{5}$` regex case-insensitively.
3. Check for duplicates in the `app.users` table matching `mssv`.
4. Insert user record and then insert user role linking to `role_id: 1` (student).
5. Return the registered user object.
