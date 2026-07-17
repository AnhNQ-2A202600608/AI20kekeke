---
phase: 1
title: "Curriculum Data Model"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Curriculum Data Model

## Overview

Create a typed frontend curriculum registry for AI Thuc Chien. It must represent phases, 27-28 days, concept groups per day, and optional track branches after Day 16 without changing quiz data format.

## Requirements

- Functional: expose phases, days, tracks, concepts, and set ids through typed helpers.
- Functional: preserve `quiz-manifest.json` as the practice set source.
- Non-functional: avoid backend dependency; keep data easy to extend by content editors.
- Non-functional: do not infer track membership from loose string parsing.

## Architecture

Use a new registry module as the UI source of truth:

```text
program-curriculum.ts
  PROGRAM_PHASES
  PROGRAM_TRACKS
  PROGRAM_DAYS
  getProgramDay(dayId)
  getDaysForPhase(phaseId, selectedTrackId?)
  getConceptPracticeSets(dayId, conceptId)
```

The registry maps `ProgramConcept.setIds` to existing `QuestionSet.id` values. Missing sets are allowed and render as "coming soon" in later phases.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/program-curriculum.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/types.ts`
- Read-only reference: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/public/quiz-manifest.json`
- Read-only reference: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/constants.ts`

## Implementation Steps

1. Add `ProgramPhase`, `ProgramTrack`, `ProgramDay`, and `ProgramConcept` types.
2. Define phases:
   - Foundation: Day 1-7.
   - Systems: Day 8-16.
   - Specialization: Day 17-28, track-aware.
3. Seed Day 1-12 by mapping existing `TOPICS` and manifest set ids.
4. Add placeholder Day 13-28 shells with empty or provisional concept groups.
5. Add track ids for Day 17-28 using placeholders until exact labels are confirmed.
6. Add helpers that return days safely even when quiz sets are missing.
7. Add comments only for non-obvious constraints, e.g. why track labels are config-driven.

## Success Criteria

- [x] TypeScript imports `PROGRAM_DAYS` and helpers without errors.
- [x] Day 1-12 map to existing manifest `parent_id` groups.
- [x] Day 13-28 can render as shells without crashing.
- [x] Track-specific days can be filtered after Day 16.
- [x] No existing quiz JSON schema changes.

## Risk Assessment

- Risk: inaccurate track names hardcoded too early.
  - Mitigation: keep stable internal ids and config-driven display labels.
- Risk: registry duplicates manifest information.
  - Mitigation: registry owns curriculum structure; manifest owns practice set details.
- Risk: missing Day 13-28 content blocks UI.
  - Mitigation: support empty concept/practice states.
