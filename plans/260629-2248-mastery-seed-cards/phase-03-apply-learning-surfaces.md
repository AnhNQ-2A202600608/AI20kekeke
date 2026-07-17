# Phase 3: Apply Learning Surfaces

Status: completed

## Touchpoints

- `frontend/components/learning/desktop-learning-sidebar.tsx`
- `frontend/components/learning/mobile-day-rail.tsx`
- `frontend/components/learning/mobile-daily-skill-list.tsx`
- `frontend/components/learning/day-detail-card.tsx`

## Steps

1. Replace `CircularProgressBadge` in desktop day list with `MasterySeedDayCard`.
2. Replace mobile day rail badge + bar with seed badge + soil strip.
3. Replace compact skill grid badge with seed mini state.
4. Replace active skill detail icon/bar with seed + soil strip.
5. Preserve existing `aria-label`, `aria-pressed`, `role="option"`, and focus ring behavior.

## State Mapping

| Existing state | Seed stage |
| --- | --- |
| preview / empty | locked |
| not-started | empty |
| weak | review |
| progress 1-24 | early |
| progress 25-49 | learning |
| progress 50-69 | growing |
| progress 70-89 | strong |
| progress 90-100 | mastered |

## Validation

- Desktop sidebar remains within 19-20rem grid column.
- Mobile day rail remains horizontally scrollable.
- Compact skill row/card remains touch-friendly.

## Risks

- If the seed image is too visually heavy, reduce displayed size before touching asset files.
