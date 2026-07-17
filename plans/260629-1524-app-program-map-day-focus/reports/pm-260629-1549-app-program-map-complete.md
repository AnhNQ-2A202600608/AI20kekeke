## Plan Complete: Redesign /app Program Map and Day Focus

### Summary

| Item | Result |
|---|---|
| Status | Completed |
| Phases | 5/5 |
| UI target | `/app` learn tab |
| Validation | TypeScript pass, focused ESLint pass, full ESLint pass, Playwright desktop/mobile pass |

### Work Completed

- [x] Added typed curriculum registry with phases, 28-day path view, and three configurable specialization tracks.
- [x] Replaced long-scroll learning path with program overview, phase tabs, direct day navigator, track selector, and day focus view.
- [x] Preserved quiz launch contract through `onStartPractice(skill, targetSetId)`.
- [x] Preserved guidebook contract through `onSelectGuidebook(dayId)`.
- [x] Added shell states for Day 13-28 and track days without changing quiz manifest schema.

### Validation Evidence

- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec eslint components/LearningPath.tsx components/learning/*.tsx lib/quiz/program-curriculum.ts lib/quiz/types.ts`
- `pnpm lint`
- Playwright:
  - desktop `/app` screenshot: `outputs/app-program-map-desktop.png`
  - mobile `/app` screenshot: `outputs/app-program-map-mobile.png`
  - track switch to Product branch passed
  - Day 18 selection passed
  - `Start here` focus passed
  - practice launch opened `?set=day1-basics&mode=quiz`

### Known Limitations

- Official track labels were not confirmed; labels are config-driven in `frontend/lib/quiz/program-curriculum.ts`.
- Day 13-28 and specialization track content render as shells until real quiz sets are added.
- No backend/profile persistence for selected track in this pass.
