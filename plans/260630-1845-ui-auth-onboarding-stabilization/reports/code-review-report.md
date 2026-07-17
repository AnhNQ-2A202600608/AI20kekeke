# Code Review Report

## Scope

Reviewed pending implementation for:

- Landing theme alignment.
- App auth/login/logout interaction path.
- Onboarding hydration/API timeout handling.
- Initial app density adjustments.

Native Task/subagent tools were unavailable in this desktop session, so the `ck:cook` review pipeline was run sequentially using the `ck:code-review` spec/adversarial references.

## Spec Compliance

| Requirement | Status | Evidence |
| --- | --- | --- |
| Landing belongs to current tactile app theme | Pass for first viewport | `landing-page.tsx` uses app background/scenery assets and current tokens. |
| `/app` guest cannot enter app | Pass | Browser verified redirect to `/`. |
| Demo/user login reaches app | Pass | Browser DOM-visible click verified demo login to `/app`. |
| Profile logout exits app | Pass | Browser DOM-visible click verified `Đăng xuất` route to `/`. |
| Onboarding spinner cannot persist indefinitely | Pass for client timeout path | `onboarding-api.ts` adds abort timeout; gate surfaces offline/local state. |
| Unauthorized onboarding API does not silently enter production app | Pass | Gate logs out and redirects to `/login` for non-demo unauthorized responses. |
| Backend onboarding tests pass | Pass | `tests/test_api/test_onboarding.py` 4/4. |
| Full sizing pass for all target breakpoints | Partial | Landing first viewport and learn checked; skills/profile/chat/onboarding and all target breakpoints remain open. |

## Adversarial Review

### Findings

| Severity | Location | Finding | Verdict |
| --- | --- | --- | --- |
| Medium | `frontend/lib/onboarding/onboarding-api.ts` | Timeout helper originally used `window`, which is brittle if the module crosses a non-browser boundary. | Accepted and fixed by using global timers. |
| Medium | `frontend/components/onboarding/onboarding-gate.tsx` | Production 401 could otherwise fall through as idle/app content. | Accepted and fixed: non-demo unauthorized logs out and redirects to `/login`. |
| Low | `frontend/components/onboarding/onboarding-gate.tsx` | Demo fake-token fallback can allow app entry with unsynced onboarding when backend rejects fake tokens. | Accepted as intended demo behavior; UI banner makes local/offline status explicit. Production fake token remains blocked by hardening plan. |
| Low | `frontend/components/LearningPath.tsx` | Full sizing cannot be certified from one learn viewport. | Accepted as remaining Phase 5 work, not a blocker for current partial cook. |

## Verification

```text
npm run lint -> pass
npx tsc --noEmit -> pass
python -m pytest tests/test_api/test_onboarding.py -> 4 passed
Browser: invalid login, demo login, profile logout, guest /app redirect -> pass
```

## Verdict

Current slice is acceptable as an in-progress plan update. Do not mark the whole plan or phase 2/5 complete until production onboarding auth hardening, landing hero first-viewport tuning, and full breakpoint coverage are finished.
