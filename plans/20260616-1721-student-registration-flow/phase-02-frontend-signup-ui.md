# Phase 2: Frontend Signup UI

## Overview
- Priority: High
- Current Status: Completed
- Description: Convert the signup placeholder screen in the `LoginScreen.tsx` modal into an active registration form.

## Proposed Changes

### [MODIFY] [LoginScreen.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LoginScreen.tsx)
1. Add state handlers for registering.
2. Render a Form for signup when `loginScreenState === "SIGNUP"`.
3. Call `POST /api/v1/auth/signup` and then automatically login the user upon successful registration.
4. Add toggle links:
   - "Chưa có tài khoản? Đăng ký ngay" on Login Form.
   - "Đã có tài khoản? Đăng nhập ngay" on Signup Form.

## Implementation Steps

1. **Update Form Rendering**:
   Create a reusable inputs block or render the same inputs under the signup state, but submit to `/api/v1/auth/signup`.
2. **Handle Signup Submission**:
   Add a `handleSignup` function:
   ```typescript
   const handleSignup = async (e: React.FormEvent) => {
     // Validate inputs
     // Call /api/v1/auth/signup
     // logIn(...) in store
     // setLoginScreenState("HIDDEN")
   };
   ```
3. **Connect Forms**:
   Change "Xem hướng dẫn" link to "Đăng ký ngay" which toggles `loginScreenState` to `"SIGNUP"`.
