# Student Registration Flow Plan

This plan details the implementation of a student self-registration flow based on their Full Name and MSSV matching the secret format (`2A2026` + 5 digits).

## User Review Required

> [!IMPORTANT]
> The MSSV validation format (`2A2026` + 5 digits) will be validated on the client side silently and on the server side, without revealing the regex structure directly in public labels.
> Newly registered users will be assigned the `student` role (role_id: 1) by default.

## Phases

- **Phase 1: Backend Signup API**
  - Status: Completed
  - Links: [phase-01-backend-signup-api.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260616-1721-student-registration-flow/phase-01-backend-signup-api.md)
- **Phase 2: Frontend Signup UI**
  - Status: Completed
  - Links: [phase-02-frontend-signup-ui.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260616-1721-student-registration-flow/phase-02-frontend-signup-ui.md)

## Verification Plan

### Automated Tests
- Test API endpoint `/api/v1/auth/signup` with valid and invalid MSSV formats.

### Manual Verification
- Test registration modal in UI, ensuring that a user is successfully registered in Supabase and logged in automatically after signup.
