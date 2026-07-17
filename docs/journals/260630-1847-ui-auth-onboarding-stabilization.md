---
date: "2026-06-30"
topic: "UI auth onboarding stabilization"
---

# UI Auth Onboarding Stabilization

## Context

Cook executed `plans/260630-1845-ui-auth-onboarding-stabilization/plan.md` for landing theme alignment, onboarding verification, login/logout click flow, and app sizing density.

## What Changed

- Landing first viewport now uses app/scenery assets and denser tactile controls.
- Real login success redirects to `/app`; demo login remains explicit in development.
- Profile dropdown actions close deterministically and do not bubble into parent click handlers.
- Onboarding API calls have an 8s abort timeout.
- Onboarding gate treats unauthorized production responses as logout/login, while demo fake-token failures show an explicit local/offline state instead of an infinite spinner.
- Initial app density pass reduced some oversized CTA/bottom rail sizing.

## Decisions

- Did not claim full production onboarding completion because auth token policy is still owned by the hardening dependency plan.
- Did not mark full sizing complete because only landing/learn and auth surfaces were browser-checked in this pass.
- Kept demo fallback explicit rather than silently pretending backend sync succeeded.

## Verification

- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `python -m pytest tests/test_api/test_onboarding.py` passed 4/4.
- Browser verified demo login, profile logout, and guest `/app` redirect.
