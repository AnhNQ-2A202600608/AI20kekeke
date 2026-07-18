---
date: 2026-06-30
topic: landing-workspace-refresh
---

# Landing Workspace Refresh

## Context

The landing page needed to move from a broad scenery-led marketing page to a compact Mentora workspace preview. The provided screenshot was treated as directional reference, while the project design guidelines remained the source of truth for scale, colors, typography, tactile cards, and CTA behavior.

## What Happened

- Rebuilt `frontend/components/landing/landing-page.tsx` around a product-like sequence: header, hero copy, compact product preview, problem cards, five-step loop, student and mentor panels, guardrails/RAG trust panel, final CTA, and footer.
- Updated `frontend/components/landing/landing-cta.tsx` so CTA labels and secondary anchors are configurable while preserving `/login` as the primary route.
- Kept route/auth behavior in `frontend/app/page.tsx` unchanged.
- Synced the implementation plan and phase files to completed status.

## Decisions

- Inlined the new landing sections instead of forcing the old scenery/proof preview components into the new structure.
- Used static UI mock cards as product evidence and avoided new assets or dependencies.
- Used explicit pixel header heights to satisfy the app-scale guideline in the current browser rendering environment.

## Verification

- `pnpm lint` passed.
- `pnpm exec tsc --noEmit` passed before restoring generated `frontend/next-env.d.ts` noise.
- Static audit found no banned oversized landing classes.
- Clean Playwright guest checks passed at `1440x900` and `375x812`, with no horizontal overflow.

## Next

Review the page in the running local app and decide whether the old unused landing preview components should be retired in a separate cleanup.
