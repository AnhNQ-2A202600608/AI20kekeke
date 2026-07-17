---
title: "Unified Admin Teacher App Panel"
description: "Unify mentor/admin navigation into the app shell and keep role switching inside the right floating app nav."
status: completed
priority: P2
branch: "blue"
tags: []
blockedBy: []
blocks: []
created: "2026-07-08T05:58:29.900Z"
createdBy: "ck:plan"
source: skill
---

# Unified Admin Teacher App Panel

## Overview

Admin/dev users currently land on separate mentor/admin route namespaces even though those pages render the same app shell. The goal is to keep the modern app interface as the single surface, then expose student, teacher, and admin/BTC personas from the existing right-side floating app navigation so an admin can inspect each surface without bouncing between old-feeling sections.

Loading decision: the floating nav is only a lightweight route switchboard. It must not import or render teacher/admin feature components inside the nav. Each heavy surface stays behind the existing `dynamic()` tab boundary and mounts only after the user opens that tab. Shared app chrome such as the top nav stays in the layout shell so the theme is consistent without merging heavy tab code into one component.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Route consolidation](./phase-01-route-consolidation.md) | Completed |
| 2 | [Floating nav role dropdown](./phase-02-right-panel-accordion.md) | Completed |
| 3 | [Verification](./phase-03-verification.md) | Completed |

## Dependencies

None. Existing `/mentor/*` and `/admin/*` pages remain as compatibility entrypoints.

## Acceptance Criteria

- Admin/dev navigation uses `/app/...` routes for teacher/admin tabs.
- `/mentor/*` and `/admin/*` compatibility pages still render the same tab content.
- Admin/dev users switch student, teacher, and admin/BTC personas inside the existing right floating icon pill.
- Persona switching expands vertically inside the floating nav rather than opening a separate panel.
- The right nav does not mount teacher/admin content components before navigation.
- Mentor and admin/BTC app pages keep the shared EduGap top nav chrome.
- The redundant floating Skill Map launcher is not shown on mentor/admin/BTC pages.
- Student-only layout remains unchanged for normal student role.
- Frontend type and lint checks pass, or unrelated failures are explicitly called out.
