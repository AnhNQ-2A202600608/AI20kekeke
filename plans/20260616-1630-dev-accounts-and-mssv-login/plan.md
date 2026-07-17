# Plan: Authentication via Full Name and Student ID (MSSV)

Implement a secure, simplified login flow that uses the student's **Full Name** (Họ và tên) and **Student ID** (MSSV). The Student ID must conform to the format `2A2026` followed by 5 digits (e.g., `2A202612345`), but this specific format validation pattern must not be exposed to the end user.

---

## User Review Required

> [!IMPORTANT]
> - **Exclusion of Format Guidelines:** In accordance with instructions, the frontend login UI will not display any hint, helper text, or placeholder detailing the `2A2026xxxxx` format constraint.
> - **Validation Strategy:** Format validation is done silently in the background (client-side form validation and server-side regex).
> - **Security/Privacy:** Failed logins (due to incorrect credentials OR malformed MSSV formats) will return a generic error message: *"Họ tên hoặc mã số sinh viên không chính xác."* (Full Name or Student ID is incorrect) to avoid leaking whether the format was wrong or the account doesn't exist.

---

## Proposed Changes

### 1. Database Schema (Already Applied)
- Added `dev` role to `app.course_role` enum and registered it in the `app.roles` table.
- Added `mssv` column (`text UNIQUE`) to the `app.users` table.
- Seeded three dev accounts:
  1. `dev1@edugap.vn` (MSSV: `2A202600001`, Role: `dev`)
  2. `dev2@edugap.vn` (MSSV: `2A202600002`, Role: `dev`)
  3. `dev3@edugap.vn` (MSSV: `2A202600003`, Role: `dev`)

### 2. Backend Infrastructure (FastAPI)

#### [NEW] [auth_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/auth_routes.py)
- Create authentication routes under `/api/v1/auth`.
- Implement `POST /api/v1/auth/login` accepting:
  ```python
  class LoginRequest(BaseModel):
      full_name: str
      mssv: str
  ```
- Validate `mssv` format server-side using a regex pattern: `r"^2A2026\d{5}$"` (case-insensitive).
- If validation fails, immediately return `401 Unauthorized` with a generic message: `"Họ tên hoặc mã số sinh viên không chính xác."`
- Query the database to find the user with matching `full_name` and `mssv`.
- If found, retrieve the user's role from `app.user_roles` and return:
  - User details (ID, Email, Full Name, MSSV, Role).
  - A secure HTTP session cookie or JWT token.
- Include `/auth` routes in `src/api/routes.py`.

### 3. Frontend Integration (Next.js)

#### [NEW] [login/page.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/login/page.tsx)
- Create a premium-designed login page using vanilla CSS and Tailwind/Motion (if applicable).
- Form inputs:
  - **Họ và tên:** Text input.
  - **Mã số sinh viên:** Text input (placeholder: `"Nhập mã số sinh viên của bạn"`).
- Client-side validation:
  - Match pattern `/^2A2026\d{5}$/i` on submit.
  - If mismatch, show the generic error toast/message: *"Họ tên hoặc mã số sinh viên không chính xác."*
- Post credentials to `/api/v1/auth/login`.
- Save the session token/cookie upon successful login, and redirect:
  - `dev` -> `/dashboard` (or Developer workspace).
  - `student` -> `/` (Learning Path).
  - `mentor` / `admin` -> Lecturer dashboard.

#### [MODIFY] [middleware.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/middleware.ts)
- Add middleware protection to redirect unauthenticated users to `/login` (excluding `/login` and `/api/v1/auth/*` routes).

---

## Verification Plan

### Automated Tests
- Run backend unit tests using `pytest` to assert that:
  - Valid name + MSSV (e.g. `2A202600001`) returns success with role `dev`.
  - Invalid MSSV format (e.g. `1A202600001` or `2A2026123`) returns a generic `401 Unauthorized`.
  - Mismatched name + MSSV returns `401 Unauthorized`.

### Manual Verification
- Test login with `Developer One` and `2A202600001` on the frontend login form.
- Attempt to enter invalid formats and confirm no technical details about the regex are exposed on the UI.
