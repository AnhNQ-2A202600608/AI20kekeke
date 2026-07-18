# Phase 4: Validation

Status: completed

## Results

- `npm run lint`: passed.
- `npm run build`: passed.
- Browser `/app` checks:
  - `390x844`: seed/soil assets visible and loaded; `0px` document horizontal overflow.
  - `768x1024`: seed/soil assets visible and loaded; `0px` document horizontal overflow.
  - `1280x720`: seed/soil assets visible and loaded; `0px` document horizontal overflow; desktop sidebar measured about `360px`.

## Commands

```powershell
cd frontend
npm run lint
npm run build
```

## Browser Checks

- Desktop: `1280x720`, route `/app`
- Mobile: `390x844`, route `/app`
- Optional tablet: `768x1024`, route `/app`

## Acceptance Checks

- Day 1 active is clearly current without reading tiny text.
- Weak/review state is visibly different but not alarming.
- Locked state is muted and does not look actionable.
- Mastered state feels rewarding but not noisy.
- Soil strip is thin and does not make cards bulky.

## Rollback

- Keep current `CircularProgressBadge` file until seed UI is accepted.
- Revert only component call sites if visual direction misses; keep asset indexes.
