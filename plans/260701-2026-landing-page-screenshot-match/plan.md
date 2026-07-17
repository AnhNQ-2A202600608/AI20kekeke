---
title: Landing Page Screenshot Match
description: >-
  Match the public EduGap landing hero to the provided screenshot while
  preserving existing routes and frontend conventions.
status: completed
priority: P2
branch: blue
tags:
  - frontend
  - landing-page
  - design
blockedBy: []
blocks: []
created: '2026-07-01T13:26:12.396Z'
createdBy: 'ck:plan'
source: skill
---

# Landing Page Screenshot Match

## Overview

Rework the public landing page first viewport so it closely matches the provided EduGap screenshot: bright cream/green background, compact header, left Vietnamese hero copy, CTA pair, trust chips, large laptop-style learning path mockup, and Sofi mascot layered on the right. Keep the implementation in the existing Next.js/Tailwind landing surface.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Implement Hero Match](./phase-01-implement-hero-match.md) | Completed |
| 2 | [Verify Responsive](./phase-02-verify-responsive.md) | Completed |

## Dependencies

- Prior completed landing plan: `plans/260630-2000-landing-page-compact-workspace-refresh/plan.md`.
- Design and package setup docs: `docs/product/design-guidelines.md`, `docs/guide/setup/package-managers.md`.
- Existing route behavior: `frontend/app/page.tsx` redirects logged-in users to `/app`; guest users see `LandingPage`.

## Scope

- Modify `frontend/components/landing/landing-page.tsx`.
- Modify `frontend/components/landing/landing-cta.tsx` only if CTA sizing/labels need adjustment.
- Do not change login/onboarding routing, backend APIs, config files, or add dependencies.

## Acceptance Criteria

- Desktop hero matches the screenshot composition: logo/nav/header controls, left badge/headline/body/CTA/trust row, right oversized laptop UI and mascot.
- Mobile keeps the same story without horizontal overflow, with the visual preview below the copy.
- Existing `/login` CTA and `#loop` secondary CTA behavior remain intact.
- Validation includes focused frontend lint/type/build checks where feasible and visual browser inspection.
