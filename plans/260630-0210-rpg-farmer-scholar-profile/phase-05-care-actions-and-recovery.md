---
phase: 5
title: "Care Actions And Recovery"
status: pending
priority: P1
dependencies: [1, 2, 4]
---

# Phase 5: Care Actions And Recovery

## Overview

Create the action layer: Next Care Action, Recovery Zones, Quest Log, and recent growth history. This makes the profile useful every day instead of only informational.

## Requirements

- Functional: surface recommended action, reason, expected impact, recovery targets, recent sessions, and achievements/progress milestones where data exists.
- Non-functional: recommendations must use current derived data; do not create fake tasks or fake achievements.

## Architecture

Use current data sources:

```text
banditRecommendation / nextActions
-> NextCareAction

computedConcepts.filter(weak/decayRisk)
-> RecoveryZones

sessions + heatmapActivities
-> GrowthTimeline or RecentGrowth
```

## Related Code Files

- Modify: `frontend/components/dashboard/profile/components/bandit-recommendation.tsx`
- Modify: `frontend/components/dashboard/profile/components/study-path-guidelines.tsx`
- Modify: `frontend/components/dashboard/profile/components/recent-sessions.tsx`
- Modify: `frontend/components/dashboard/profile/components/activity-heatmap.tsx`
- Create optional: `frontend/components/dashboard/profile/components/next-care-action.tsx`
- Create optional: `frontend/components/dashboard/profile/components/recovery-zones.tsx`
- Create optional: `frontend/components/dashboard/profile/components/growth-timeline.tsx`

## Implementation Steps

1. Convert `BanditRecommendation` into or wrap it as `NextCareAction`.
   - show action
   - why this concept
   - time estimate if available; otherwise omit
   - expected Elo gain
   - primary CTA
2. Build `RecoveryZones` from concepts where:
   - `status === 'weak'`
   - `decayRisk === true`
   - retention below threshold
3. Replace negative warning copy:
   - avoid `yeu`, `kem`, `sai nhieu`
   - use `can tuoi lai`, `sap quen`, `dang phuc hoi`
4. Reframe `StudyPathGuidelines` as `Quest Log` only if it still maps to real `nextActions`.
5. Reframe `RecentSessions` as training journal / growth log.
6. Keep `ActivityHeatmap` as watering rhythm or growth calendar, preserving numeric activity meaning.
7. Add completion/empty states:
   - no recovery zones: `Khu vuon dang on dinh`
   - no next action: fallback to first ZPD/learning concept
8. Confirm all action buttons route through existing handlers.

## Success Criteria

- [ ] The profile always answers "what should I do next?"
- [ ] Recovery areas are clear, supportive, and tied to real decay/mastery data.
- [ ] Recent activity shows growth history without becoming a generic log dump.
- [ ] No fake achievements or placeholder quests are introduced.
- [ ] Existing practice launch behavior remains intact.

## Risk Assessment

- Risk: "Quest Log" implies game mechanics that do not exist.
  - Mitigation: use quest styling only for existing next actions and practice flows.
- Risk: hiding the word weak makes urgency unclear.
  - Mitigation: include concrete reasons like retention percentage, Elo gap, or last practiced date.
