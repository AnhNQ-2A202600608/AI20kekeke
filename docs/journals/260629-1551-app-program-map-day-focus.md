---
date: "2026-06-29"
topic: "App program map and day focus redesign"
plan: "plans/260629-1524-app-program-map-day-focus/plan.md"
---

# App Program Map and Day Focus Redesign

## Context

The student `/app` learn tab used a long path model that did not fit a 27-28 day AI Thuc Chien program, especially because the curriculum branches into three tracks after Day 16. The user wanted direct day access first, with daily exercises and a non-disruptive "Start here" behavior.

## What Happened

- Added a typed frontend curriculum registry for phases, days, concepts, and track branches.
- Replaced the old long-scroll `LearningPath` composition with program overview, phase tabs, day navigator, track selector, and selected-day concept focus.
- Kept existing guidebook and quiz launch contracts intact.
- Added shell rendering for days and track branches that do not yet have quiz sets.
- Updated frontend page documentation and synced the implementation plan to completed.

## Decisions

- Treat the program as a 28-day path per selected track: Day 1-16 shared, Day 17-28 filtered by selected track.
- Keep track labels config-driven until official names are confirmed.
- Use hover/highlight as passive feedback only; `Start here` click scrolls to the first weak, incomplete, or available concept.
- Do not add backend/profile persistence for selected track in this pass.

## Validation

- TypeScript passed.
- Focused ESLint passed for touched frontend files.
- Full frontend ESLint passed.
- Playwright desktop/mobile checks passed with no horizontal overflow.
- Practice launch still opened quiz mode through the existing `?set=day1-basics&mode=quiz` path.

## Next

- Replace placeholder Day 13-28 shells with official content.
- Confirm final Vietnamese names for the three specialization tracks.
- Consider persisting selected track only after enrollment behavior is defined.
