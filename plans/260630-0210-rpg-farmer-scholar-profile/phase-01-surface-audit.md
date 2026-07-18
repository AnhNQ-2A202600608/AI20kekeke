---
phase: 1
title: "Surface Audit"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Surface Audit

## Overview

Inventory the current profile surface and lock the data-to-metaphor mapping before redesigning UI. This phase prevents the new concept from duplicating existing analytics or breaking practice launch flows.

## Requirements

- Functional: identify every current profile section, prop, callback, visual tab, and data source that must survive the redesign.
- Non-functional: keep implementation scoped to current profile architecture; avoid new runtime dependencies.

## Architecture

The profile already uses `ProfileTab` as an orchestrator, `useProfileData` as the derived-data layer, and presentational components under `components/`. The redesign should preserve that split:

```text
ProfileTab props/store data
-> useProfileData derived profile analytics
-> Farmer Scholar presentational sections
-> existing onStartPractice callback
```

## Related Code Files

- Read: `frontend/components/dashboard/profile/index.tsx`
- Read: `frontend/components/dashboard/profile/hooks/useProfileData.ts`
- Read: `frontend/components/dashboard/profile/utils/profile-utils.ts`
- Read: `frontend/components/dashboard/profile/components/*.tsx`
- Read: `frontend/components/learning/mastery-seed-*.tsx`
- Read: `frontend/components/ui/learning`
- Read: `frontend/app/globals.css`
- Read: `docs/product/design-guidelines.md`
- Modify: none in this phase unless implementation records local notes in the plan.

## Implementation Steps

1. Map current sections:
   - `ProfileHeader`
   - `BanditRecommendation`
   - visualizer tabs
   - `MasteryMap`
   - `ActivityHeatmap`
   - `RecentSessions`
   - `StudyPathGuidelines`
   - `ConceptDetailDrawer`
2. Map current data fields to concept language:
   - XP -> Sunlight XP
   - streak -> Watering Streak
   - Elo -> Learning Rank / Garden Rank
   - ZPD -> Best Growth Zone
   - weak/decay -> Recovery Soil / Needs Watering
   - mastered -> Bloomed / Harvested
3. Identify which sections are redundant after redesign and which should be merged.
4. Verify practice launch path from recommendation, mastery rows, and drawer still calls existing handlers.
5. Decide component names and file boundaries for new profile-specific components.
6. Confirm no admin/mentor/BTC flow is affected.

## Success Criteria

- [ ] Current student profile sections and data dependencies are documented.
- [ ] Data-to-metaphor mapping is explicit and approved inside this plan or implementation notes.
- [ ] File ownership for later phases is clear.
- [ ] Out-of-scope items are not accidentally included.
- [ ] Existing practice callback contract is understood before UI edits begin.

## Risk Assessment

- Risk: farming metaphor hides important analytics.
  - Mitigation: every metaphor component must show numeric labels or explanatory copy.
- Risk: duplicated components create two profile systems.
  - Mitigation: update existing profile components or add small subcomponents under the same folder.
