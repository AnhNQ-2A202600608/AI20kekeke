---
phase: 4
title: "Personal Progress Garden"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4: Personal Progress Garden

## Overview

Turn the main personal progress section into a Skill Farm Overview that shows concept mastery as living plants while preserving the current charts, DAG, forgetting curve, and skill map as secondary inspection modes.

## Requirements

- Functional: show concept groups/cards with mastery stage, Elo, retention/review risk, ZPD fit, and practice CTA.
- Non-functional: keep data-driven and accessible. The garden must not be decorative-only.

## Architecture

Recommended structure:

```text
ProfileTab
-> PersonalProgressGarden
   -> SkillPlantCard[]
   -> optional selected skill summary
-> Existing visualizer tabs remain below or inside "Inspect deeper"
```

The garden should derive from `computedConcepts` and call `handleStartConceptPractice(conceptId)` or the existing skill id adapter.

## Related Code Files

- Modify: `frontend/components/dashboard/profile/index.tsx`
- Modify or replace section use: `frontend/components/dashboard/profile/components/mastery-map.tsx`
- Create: `frontend/components/dashboard/profile/components/personal-progress-garden.tsx`
- Create: `frontend/components/dashboard/profile/components/skill-plant-card.tsx`
- Reuse: `frontend/components/learning/mastery-seed-badge.tsx`
- Reuse: `frontend/components/learning/mastery-soil-strip.tsx`
- Keep: `frontend/components/dashboard/profile/components/performance-charts.tsx`
- Keep: `frontend/components/dashboard/profile/components/skill-tree-graph.tsx`
- Keep: `frontend/components/dashboard/profile/components/memory-decay-chart.tsx`

## Implementation Steps

1. Build `SkillPlantCard` around `ConceptMastery`.
   - title
   - stage label
   - Elo
   - retention or BKT value
   - state label
   - CTA
2. Build `PersonalProgressGarden` as the primary progress surface.
   - section heading: `Khu vuon ky nang`
   - short explanation-free subtitle focused on current state
   - responsive grid of skill cards
3. Map concept state to plant states:
   - `cold_start` -> seed
   - `weak` or `decayRisk` -> dry soil / needs watering
   - `learning` -> growing
   - `zpd` -> best growth zone
   - `mastered` -> bloom/harvest
4. Keep the existing multi-tab visualizers but demote their visual weight:
   - label as `Kiem tra sau` or `Ban do chi tiet`
   - avoid making charts the first emotional impression
5. If `MasteryMap` overlaps with the garden, either:
   - refactor it into the garden card list, or
   - keep it as a detailed table below the garden.
6. Ensure every CTA uses existing concept/skill identifiers and does not fake target set IDs.
7. Add empty/cold-start states:
   - no concepts: show onboarding garden seed prompt
   - no practice data: show exploration copy and first action

## Success Criteria

- [ ] Main progress section communicates mastery growth at a glance.
- [ ] Every plant card exposes a real metric, not only an illustration.
- [ ] Weak/decay states are actionable and not shame-framed.
- [ ] Existing graph/chart inspection modes still render.
- [ ] Practice CTA works for concepts with valid skill IDs.
- [ ] Cold-start users get a clear first action.

## Risk Assessment

- Risk: current data has only six concept mappings, making the garden feel sparse.
  - Mitigation: design a compact grid with quality cards and a useful cold-start state rather than filler.
- Risk: duplicate with Practice Skill Garden.
  - Mitigation: Profile garden is progress/identity; Practice garden is session launch/work queue.
