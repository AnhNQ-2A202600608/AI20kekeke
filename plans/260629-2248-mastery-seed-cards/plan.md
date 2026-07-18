---
status: completed
created: 2026-06-29
owner: codex
scope: frontend learning path UI
---

# Mastery Seed Cards Plan

## Context

Replace generic circular status badges in the learning path with EduGap's seed-growth signature. Seed assets live in `frontend/public/learning-seeds/`; thin soil progress assets live in `frontend/public/learning-soils/`.

## Phases

| Phase | Status | File |
| --- | --- | --- |
| 1. Asset wiring | completed | [phase-01-asset-wiring.md](phase-01-asset-wiring.md) |
| 2. Seed card components | completed | [phase-02-seed-card-components.md](phase-02-seed-card-components.md) |
| 3. Apply to learning surfaces | completed | [phase-03-apply-learning-surfaces.md](phase-03-apply-learning-surfaces.md) |
| 4. Validation | completed | [phase-04-validation.md](phase-04-validation.md) |

## Dependencies

- `frontend/lib/learning-seed-assets.ts`
- `frontend/lib/learning-soil-assets.ts`
- `frontend/public/learning-seeds/index.json`
- `frontend/public/learning-soils/index.json`
- Current learning surfaces:
  - `frontend/components/learning/desktop-learning-sidebar.tsx`
  - `frontend/components/learning/mobile-day-rail.tsx`
  - `frontend/components/learning/mobile-daily-skill-list.tsx`
  - `frontend/components/learning/day-detail-card.tsx`

## Acceptance Criteria

- Day cards no longer look like generic icon/status rows.
- Seed icon communicates mastery stage.
- Thin soil strip communicates progress without becoming bulky.
- Weak/review, locked, active, and mastered states have visible non-color labels.
- Desktop and mobile layouts do not overlap at 390px, 768px, 1280px.
- `npm run lint` and `npm run build` pass.

## Completion Notes

- Implemented seed/soil asset helpers and presentational seed UI components.
- Replaced generic icon/status badges on the planned desktop and mobile learning surfaces.
- Confirmed PNG and WebP files exist for every seed and soil stage.
- `npm run lint` passed.
- `npm run build` passed.
- Browser checks on `/app` passed at `390x844`, `768x1024`, and `1280x720` with loaded seed/soil assets and no document-level horizontal overflow.
