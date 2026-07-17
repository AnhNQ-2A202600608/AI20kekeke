---
phase: 3
title: "Verify Responsive Quality"
status: completed
priority: P2
dependencies: [2]
---

# Phase 3: Verify Responsive Quality

## Overview

Run focused frontend validation and visual checks to confirm the landing redesign is compact, responsive, accessible enough for keyboard users, and aligned with the app-scale design baseline.

## Requirements

- Functional: landing loads for logged-out users, CTA links resolve, and in-page anchors scroll to expected sections.
- Non-functional: lint/type checks pass; layout avoids horizontal scroll and oversized marketing scale.

## Architecture

Verification is frontend-only. Use package manager guidance from `docs/guide/setup/package-managers.md`: commands should run from `frontend/` with `pnpm` where available. Browser checks should verify guest landing behavior; if local persisted auth redirects to `/app`, use an isolated browser context or explicitly report that limitation rather than clearing user auth state.

## Related Code Files

- Validate: `frontend/components/landing/landing-page.tsx`
- Validate: `frontend/components/landing/landing-cta.tsx`
- Validate: `frontend/components/landing/adaptive-proof-simulator.tsx`
- Validate: `frontend/components/landing/teacher-report-preview.tsx`
- Validate: `frontend/app/page.tsx`

## Implementation Steps

1. Static class audit:
   - Search landing files for banned scale classes: `md:text-5xl`, `md:text-6xl`, `py-16`, `md:py-20`, `rounded-[28px]`, and broad `p-6`.
2. Run focused checks:
   - `cd frontend && pnpm lint` if configured.
   - `cd frontend && pnpm tsc --noEmit` or the repo's actual typecheck command if different.
3. Start local frontend only if needed for browser verification:
   - `cd frontend && pnpm dev`.
4. Browser verification:
   - Desktop: around `1440x900` or current desktop size.
   - Mobile: `375x812`.
   - Confirm header height, no text overlap, no horizontal scroll, and product preview remains readable.
5. Interaction checks:
   - Header login and hero/final primary CTA route to `/login`.
   - Secondary CTA anchors to the how-it-works or product section.
   - Keyboard focus remains visible for links/buttons.

## Success Criteria

- [x] Lint passes or failures are reported with exact root cause.
- [x] Typecheck passes or failures are reported with exact root cause.
- [x] Landing renders in guest state or guest verification limitation is explicitly documented.
- [x] Desktop and mobile screenshots show no overlap or horizontal scroll.
- [x] No banned oversized landing classes remain.

## Completion Notes

- `pnpm lint` passed.
- `pnpm exec tsc --noEmit` passed.
- Static audit found no banned oversized landing classes.
- Playwright guest checks passed at 1440x900 and 375x812 with no horizontal overflow.

## Risk Assessment

The local browser profile may already be authenticated and redirect `/` to `/app`. Do not clear user data without approval; use an isolated verification path if possible, otherwise report the limitation plainly.
