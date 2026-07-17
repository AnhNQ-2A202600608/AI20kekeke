---
phase: 2
title: "Floating nav role dropdown"
status: completed
effort: "M"
---

# Phase 2: Floating nav role dropdown

## Overview

Expose teacher and admin/BTC controls together in the existing right-side floating app nav for admin/dev users.

## Implementation Steps

1. Keep `RightBar` disabled for this flow so no large sidebar or student stat widgets are mounted.
2. Extend `frontend/components/LeftBar.tsx` floating-nav variant with a persona switcher for multi-persona accounts.
3. Keep role/persona switching separate from tab destinations.
4. On persona switch, set the target persona, navigate to that persona's default tab, and collapse the switcher.
5. Keep the rail as metadata-only; do not import teacher/admin dashboard components here.

## Success Criteria

- [x] Admin/dev sees a compact persona switcher in the existing floating nav.
- [x] Teacher-only users keep the teacher panel without admin-only actions.
- [x] Student workspace/floating navigation behavior is not regressed.
- [x] Teacher/admin feature components remain lazy-loaded through `DashboardLayout` tab boundaries.
