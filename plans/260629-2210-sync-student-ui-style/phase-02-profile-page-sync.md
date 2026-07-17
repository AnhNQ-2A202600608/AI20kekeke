---
phase: 2
title: Profile Page Sync
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 2: Profile Page Sync

## Overview

Restyle the student profile tab so it feels like a learning progress workspace, not an old dashboard. Preserve the existing profile data hook, persona switcher behavior, charts, mastery map, heatmap, recent sessions, and concept drawer.

## Requirements

- Functional: keep all existing student profile sections and admin persona fallback behavior.
- Non-functional: align spacing, panels, metric badges, and CTAs with `/app`.
- Responsive: profile must remain readable on mobile and desktop.
- Compatibility: do not change `ProfileTabProps` or parent `DashboardLayout` behavior.

## Architecture

Apply the shared primitives at the page composition level first:

```text
ProfileTab
  LearningPageShell
  PersonaSwitcher
  ProfileHeader / metric summary as tactile panels
  Visualizer tabs as tactile segmented control
  Existing charts/maps wrapped in TactilePanel
```

Admin/mentor profile view can receive lighter treatment, but do not redesign mentor/BTC workflows in this plan.

## Related Code Files

- Modify: `frontend/components/dashboard/profile/index.tsx`
- Modify: `frontend/components/dashboard/profile/components/profile-header.tsx`
- Modify: `frontend/components/dashboard/profile/components/bandit-recommendation.tsx`
- Modify: `frontend/components/dashboard/profile/components/mastery-map.tsx`
- Modify: `frontend/components/dashboard/profile/components/activity-heatmap.tsx`
- Modify if needed: `frontend/components/dashboard/profile/components/recent-sessions.tsx`
- Modify if needed: `frontend/components/dashboard/profile/components/study-path-guidelines.tsx`
- Reference: `frontend/components/learning/day-summary-card.tsx`

## Implementation Steps

1. Replace the profile root background/max-width/padding with `LearningPageShell` or equivalent classes.
2. Convert the top identity area to tactile styling:
   - white panel
   - green accent icon/avatar
   - compact metric pills for Elo, XP, streak, ZPD count
3. Convert persona switcher to match `/app` segmented controls, but keep role filtering unchanged.
4. Wrap chart tab content in `TactilePanel`; make tabs look like compact tactile tabs instead of a flat dashboard nav.
5. Restyle `BanditRecommendation`, `MasteryMap`, `ActivityHeatmap`, `RecentSessions`, and `StudyPathGuidelines` wrappers with shared panel/button primitives where low risk.
6. Remove or soften developer-only instructional copy if it visually breaks the student product surface; if still useful, move it into a compact secondary callout.
7. Verify `ConceptDetailDrawer` still opens and does not conflict with new spacing.

## Success Criteria

- [ ] Student profile looks coherent next to `/app` screenshot: avocado background, tactile panels, compact green/yellow/orange stats.
- [ ] All existing profile data sections still render.
- [ ] Persona switcher still respects allowed roles.
- [ ] Chart tabs still switch between charts, skill tree, and memory decay.
- [ ] No public prop changes required in `DashboardLayout`.

## Risk Assessment

- Risk: charts/ReactFlow areas become cramped inside tactile cards. Mitigation: set stable min heights and avoid nested cards.
- Risk: profile page becomes too decorative. Mitigation: prioritize scan density and progress interpretation.
- Risk: admin persona view gets unintentionally student-styled. Mitigation: keep admin changes minimal and role-specific.
