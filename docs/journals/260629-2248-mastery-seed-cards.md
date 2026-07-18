---
date: 2026-06-29
plan: 260629-2248-mastery-seed-cards
area: frontend
---

# Mastery Seed Cards

## Context

The learning path still used generic circular status badges after the growth-themed mobile workspace work. This slice replaced those generic indicators with Mentora seed-growth assets and thin soil progress strips.

## What Happened

- Added centralized seed and soil asset stage helpers.
- Added reusable seed badge, soil strip, day card, and skill card components.
- Replaced generic status visuals on the desktop learning sidebar, mobile day rail, mobile daily skill list, and day detail concept surfaces.
- Kept the old circular progress badge file in place as rollback surface.

## Decisions

- Components receive stage state through `locked` and `review`; normal progress stages derive from progress percent.
- Seed and soil asset paths stay centralized in `frontend/lib`, not hardcoded into learning surfaces.
- State labels remain rendered as text chips so weak/review, locked, active, and mastered are not color-only.

## Verification

- Confirmed every seed and soil stage has PNG and WebP files.
- `npm run lint` passed.
- `npm run build` passed.
- Browser checks on `/app` passed at `390x844`, `768x1024`, and `1280x720` with visible loaded seed/soil assets and no document-level horizontal overflow.

## Follow-Up

- Build still reports existing warnings for npm `only-built-dependencies`, the deprecated `middleware` convention, and a Turbopack NFT trace through `next.config.ts` and `app/api/guidebook/[slug]/route.ts`.
- External review-agent startup failed due to a platform model-resolution error; final review was local.
