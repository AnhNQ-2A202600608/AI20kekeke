# Quiz ELO Counter Animation

## Goal
Animate the existing quiz ELO value after each adaptive answer without changing scoring or layout.

## Tasks
- [x] Locate the existing quiz ELO display and adaptive submit result.
- [x] Add a reusable counter for `old_elo` to `new_elo`, including delta feedback and reduced-motion support.
- [x] Connect the current question submit event to the existing ELO pill.
- [x] Run frontend lint, TypeScript checks, and build verification.

## Done When
- [x] Each adaptive answer animates the existing ELO value once and accurately reflects increases or decreases.
- [x] No new dependency, API, scoring, or layout changes are introduced.

## Notes
- Approved scope: main practice quiz only.
- Approved treatment: per-digit odometer roll, directional movement, signed delta, directional color, and a subtle completion emphasis.
- Only changed digits roll; the signed delta remains visible until the next question.

## Number Roll Upgrade
- [x] Replace the continuous numeric tween with fixed-width rolling digit columns.
- [x] Roll changed digits up for increases and down for decreases; keep unchanged digits still.
- [x] Preserve signed delta, directional color, reduced-motion behavior, and next-question reset.
- [x] Run frontend ESLint, TypeScript checks, and production build verification.
