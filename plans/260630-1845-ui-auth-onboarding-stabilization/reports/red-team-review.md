---
title: "UI Auth Onboarding Stabilization Red-Team Review"
status: complete
created: 2026-06-30
---

# UI Auth Onboarding Stabilization Red-Team Review

## Summary

The plan is viable if implementation keeps auth verification ahead of UI polish. The biggest failure mode is making the interface look coherent while preserving unverified onboarding API calls and fake-token production behavior.

## Findings

| Severity | Finding | Required Response |
| --- | --- | --- |
| High | `frontend/lib/onboarding/onboarding-api.ts` currently builds bearer auth from `token || userId`. | Phase 3 must coordinate with `260630-1823-auth-onboarding-real-data-hardening` and avoid accepting `userId` as production auth. |
| High | App sizing can be "fixed" by adding hidden overflow, which would only hide clipped actions. | Phase 5 requires explicit scroll ownership and viewport screenshots, not just CSS overflow changes. |
| Medium | Landing can drift into pure marketing and stop representing the real app. | Phase 2 must use real app tokens/assets and keep adaptive loop plus teacher signal visible. |
| Medium | Login/logout click bugs are easy to misdiagnose from code alone. | Phase 4 requires browser reproduction and route/state verification. |
| Medium | Typecheck is currently blocked by unrelated dirty `frontend/lib/adaptive/database.ts`. | Phase 1 must decide whether to fix or record as an external blocker before later phases claim type safety. |

## Non-Negotiable Gates

- No phase completion based only on static code review.
- No production auth path that treats raw UUID or fake token as a valid credential.
- No layout acceptance without mobile and laptop viewport checks.
- No new design system or broad refactor unless a specific baseline failure requires it.

## Recommendation

Proceed with the plan. Keep `Phase 1` as the hard gate; if it cannot reproduce the click/API/sizing issues, stop and update the plan before implementation.
