# Baseline And Verification Report

## Summary

| Area | Result | Evidence |
| --- | --- | --- |
| Landing theme | Improved | First viewport now uses Code Bay/app background assets, learning scenery, compact header/CTAs, tactile tokens. |
| Guest `/app` | Pass | Browser: after logout, direct `http://localhost:3000/app` redirected to `http://localhost:3000/`. |
| Demo login | Pass with demo/offline note | Browser: `/login` demo entered `/app`; onboarding status fell back to visible local/offline banner instead of spinner. |
| Profile logout | Pass | Browser: profile menu opened, one `Đăng xuất` menuitem was clickable, route returned to `/`. |
| Onboarding status API | Partially verified | `GET /api/v1/onboarding/status` without auth returns 401; browser fake demo token is treated as explicit demo/offline fallback. |
| Onboarding backend tests | Pass | `python -m pytest tests/test_api/test_onboarding.py` -> 4 passed. |
| Sizing quick pass | Partial | Landing 390/768/1366/1440 and learn viewport had no horizontal overflow; landing hero still needs first-viewport hint tuning, and full skills/profile/chat sweep remains open. |

## Commands

```text
cd frontend && npm run lint
Result: pass

cd frontend && npx tsc --noEmit
Result: pass

python -m pytest tests/test_api/test_onboarding.py
Result: 4 passed
```

## Browser Checks

| Flow | Status | Notes |
| --- | --- | --- |
| `/` desktop/mobile | Pass | Landing renders Edugap hero, asset scene, compact CTAs. |
| `/login` demo -> `/app` | Pass | DOM-visible click loads app after onboarding status timeout/401 fallback. |
| `/app` onboarding gate | Pass for demo fallback | No indefinite spinner; shows `Onboarding đang dùng trạng thái cục bộ`. |
| Profile menu -> logout | Pass | DOM-visible click opens menu and logout exits app content. |
| Guest `/app` | Pass | Redirects to landing. |
| Invalid login click | Pass | DOM-visible click on `Vào học` with wrong credentials showed `Email hoặc mật khẩu không chính xác.` and stayed on `/login`. |

## Remaining Gaps

- Production onboarding auth policy remains tied to `plans/260630-1823-auth-onboarding-real-data-hardening`.
- Full breakpoint sweep for `skills`, `profile`, `chat`, and onboarding was not completed in this pass.
- Landing still needs first-viewport hint tuning even though no horizontal overflow was observed at target widths.
