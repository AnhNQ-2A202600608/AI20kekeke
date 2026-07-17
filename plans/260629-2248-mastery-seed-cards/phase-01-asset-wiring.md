# Phase 1: Asset Wiring

Status: completed

## Requirements

- Keep original PNG assets as source files.
- Use WebP in UI where possible.
- Keep asset path metadata centralized.

## Files

- `frontend/public/learning-seeds/*`
- `frontend/public/learning-soils/*`
- `frontend/lib/learning-seed-assets.ts`
- `frontend/lib/learning-soil-assets.ts`

## Steps

1. Confirm every seed and soil stage has PNG and WebP.
2. Use `getLearningSeedStage(progress, state)` and `getLearningSoilStage(progress, state)` as the only stage-selection helpers.
3. Avoid hardcoding asset paths inside components.
4. Add missing alt/aria labels at component call sites.

## Validation

- Confirm all referenced URLs exist under `frontend/public`.
- Run TypeScript through `npm run build`.

## Risks

- WebP can render with slightly different edges than PNG; use PNG fallback through `<picture>` if needed.
