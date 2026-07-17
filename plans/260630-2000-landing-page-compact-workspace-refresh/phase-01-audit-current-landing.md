---
phase: 1
title: "Audit Current Landing"
status: completed
priority: P2
dependencies: []
---

# Phase 1: Audit Current Landing

## Overview

Confirm the exact landing components, styling tokens, route behavior, and reusable UI helpers before editing. This keeps the redesign grounded in current project patterns instead of copying the reference screenshot literally.

## Requirements

- Functional: preserve guest landing route behavior from `frontend/app/page.tsx` and login navigation.
- Non-functional: keep app-scale density from `docs/product/design-guidelines.md`; do not add dependencies or new assets.

## Architecture

The root page renders `LandingPage` for logged-out users and redirects logged-in users to `/app`. Landing UI is currently split across `LandingPage`, `LandingCta`, `AdaptiveProofSimulator`, and `TeacherReportPreview`. Phase 1 decides whether to keep these boundaries or consolidate content for the new page sequence.

## Related Code Files

- Read: `frontend/app/page.tsx`
- Read: `frontend/components/landing/landing-page.tsx`
- Read: `frontend/components/landing/landing-cta.tsx`
- Read: `frontend/components/landing/adaptive-proof-simulator.tsx`
- Read: `frontend/components/landing/teacher-report-preview.tsx`
- Read: `frontend/components/learning/learning-brand-mark.tsx`
- Read: `frontend/components/ui/tactile-button.tsx`
- Read: `docs/product/design-guidelines.md`

## Implementation Steps

1. Inspect current landing route and confirm the logged-in redirect remains untouched.
2. Inventory current landing sections, CTA labels, images, imported icons, sizing classes, and section anchors.
3. Compare existing component scale against the reference note and `docs/product/design-guidelines.md`.
4. Decide component ownership for the redesign:
   - Keep `LandingCta` as shared CTA helper if labels/targets remain simple.
   - Keep or rewrite `AdaptiveProofSimulator` and `TeacherReportPreview` only if they map cleanly to the new problem/audience/trust sections.
5. Check available public assets and avoid unused scenic images in the hero.

## Success Criteria

- [x] Files and component boundaries for implementation are known.
- [x] No planned change touches auth, onboarding, backend, or state persistence.
- [x] Any retained assets have a clear hierarchy role.
- [x] The new page can be implemented without new dependencies.

## Completion Notes

- Confirmed `frontend/app/page.tsx` route/auth redirect behavior stayed unchanged.
- Kept implementation inside landing UI components and reused existing brand/tactile helpers.

## Risk Assessment

Main risk is making a static mock preview imply unavailable real metrics. Mitigate by keeping copy product-oriented, avoiding unverifiable claims, and preserving current CTA destinations.
