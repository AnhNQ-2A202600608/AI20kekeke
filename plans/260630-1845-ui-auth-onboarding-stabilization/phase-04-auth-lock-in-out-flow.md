---
phase: 4
title: "Auth Lock In Out Flow"
status: completed
priority: P1
dependencies: [1]
effort: "medium"
---

# Phase 4: Auth Lock In Out Flow

## Overview

Repair and verify the visible login/logout controls. The user must be able to enter the app, leave the app, and see route state change without clicks being swallowed by profile menus, overlays, hydration fallback, or oversized fixed controls.

## Requirements

- Functional: `/login` login/demo login reaches `/app`; profile dropdown logout returns to `/`; guest `/app` redirects to `/`; modal login works when still present in nested surfaces.
- Interaction: mouse, touch-sized tap target, keyboard focus/Enter where applicable.
- State: `loggedIn`, `userId`, `token`, role/persona, and persisted store are reset consistently on logout.
- Security: production lock-in should not depend on fake tokens unless demo mode is explicit.

## Architecture

Use `useBoundStore.logIn/logOut` as the single frontend state transition. Route effects should be centralized around `/`, `/login`, and `/app` guard behavior. Do not scatter extra `router.push` calls inside every consumer unless a user action needs a direct destination.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-app-shell.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/login/page.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LoginScreen.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/app/app-profile-shortcut.tsx`
- Modify if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/createUserSlice.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/hooks/useBoundStore.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/dashboard-tabs.ts`

## Implementation Steps

1. Reproduce the exact "cannot click" issue from baseline:
   - CTA to `/login`.
   - demo login button.
   - profile shortcut open.
   - logout menu item.
   - modal login close/open if used by gated surfaces.
2. Identify source:
   - overlay z-index/backdrop intercept.
   - menu closes before action.
   - AppAuthGate fallback never becoming ready.
   - stale persisted auth state.
   - button disabled or hidden behind fixed bottom controls.
3. Fix the smallest surface:
   - If profile menu action is swallowed, stop propagation or move menu event handling.
   - If app guard stalls, use a robust mounted/hydrated strategy that works with Zustand persist and SSR.
   - If logout state resets but route remains `/app`, route to `/` after `logOut` or let app guard deterministically redirect.
4. Normalize auth action labels:
   - landing uses login/try CTA.
   - app profile uses "Đăng xuất" for logged-in and "Đăng nhập / Tạo hồ sơ" only for logged-out surfaces.
5. Browser verify repeatable flows:
   - guest `/app` -> `/`.
   - `/login` demo -> `/app`.
   - profile menu -> logout -> `/`.
   - login form invalid credentials shows error and leaves user on `/login`.
6. Check keyboard:
   - Tab can reach login/demo/logout controls.
   - Enter/Space triggers the focused button.
   - Escape closes profile menu/modal.
7. Document final route/state table in phase report or final implementation notes.

## Success Criteria

- [x] Every login/logout control in the scoped surfaces is clickable in browser verification.
- [x] Guest cannot enter app content.
- [x] Logged-in user can enter app content.
- [x] Logout clears session state and exits app content without manual refresh.
- [x] Profile menu does not remain stuck open or block subsequent clicks.
- [x] No new fake-token production path is introduced.
- [x] Lint passes after auth UI changes.

## Risk Assessment

- Risk: App guard uses client-only state and causes hydration mismatch. Mitigation: render a stable fallback until mounted, then route.
- Risk: Demo login masks production login failure. Mitigation: test both invalid real form and demo path separately.
- Risk: Logout breaks role/persona defaults. Mitigation: assert `selectedPersona` returns to `student` and app nav defaults are valid.
