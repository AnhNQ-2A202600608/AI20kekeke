---
title: Learning Page Density Polish
description: >-
  Polish the learning workspace density after the growth-layout pass: larger
  logo only, compact header text, focused left timeline, compact daily skill
  list with click-to-detail, and a small AI action dock.
status: completed
priority: P2
branch: codex/adaptive-first-frontend-quiz
tags:
  - frontend
  - learning
  - ux
  - responsive
blockedBy: []
blocks: []
created: '2026-06-29T14:12:51.407Z'
createdBy: 'ck:plan'
source: skill
---

# Learning Page Density Polish

## Overview

Refine the `/app` learning page that was introduced by `260629-1907-mobile-learning-growth-workspace`. The current direction is correct, but the visual density is off: the logo treatment enlarged the whole header instead of only the brand mark, the left panel spends vertical space on summary cards, the daily skill cards are too large for scanning, and the bottom-right AI entry is hidden behind one generic menu button.

This plan keeps the current product model and component contracts. It is a polish pass, not a new learning architecture.

## Decisions

- Increase only the EduGap logo/mark, not the adjacent page title.
- Make the desktop header shorter so the learning workspace gets more vertical room.
- Remove the bottom summary stack from the left sidebar; keep left panel focused on day navigation and day signature chips.
- Convert daily skills from large explanation cards into a compact master-detail pattern: scan first, click for detail.
- Replace the single bottom-right AI/menu button on desktop with a small AI action dock; keep mobile collapsed/expandable to avoid covering the CTA.
- Preserve existing quiz and guidebook contracts: `onStartPractice(skill, targetSetId)` and `onSelectGuidebook(dayId)`.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Notes |
|---|---|---:|---|
| Builds on | `260629-1907-mobile-learning-growth-workspace` | completed | This plan polishes the growth workspace implementation rather than replacing it. |
| Related | `260629-1644-sofi-mascot-states` | pending | AI/Sofi actions should reuse the mascot assets/controller when that plan is completed, but this plan can ship icon-only actions first. |
| Related | `260629-1524-app-program-map-day-focus` | completed | Keep the curriculum registry, day selection, and practice launch adapter intact. |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Header Brand Density](./phase-01-header-brand-density.md) | Completed |
| 2 | [Left Timeline Focus](./phase-02-left-timeline-focus.md) | Completed |
| 3 | [Daily Skills Master Detail](./phase-03-daily-skills-master-detail.md) | Completed |
| 4 | [AI Action Dock](./phase-04-ai-action-dock.md) | Completed |
| 5 | [Responsive Validation](./phase-05-responsive-validation.md) | Completed |

## Dependencies

- Existing frontend stack: Next.js, React, Tailwind utilities, `lucide-react`.
- Existing UI files:
  - `frontend/components/LearningPath.tsx`
  - `frontend/components/learning/learning-brand-mark.tsx`
  - `frontend/components/learning/desktop-learning-sidebar.tsx`
  - `frontend/components/learning/mobile-daily-skill-list.tsx`
  - `frontend/components/learning/mobile-today-mission-card.tsx`
  - `frontend/components/learning/concept-preview-router.tsx`
  - `frontend/components/learning/sofi-coach-trigger.tsx`
  - `frontend/components/learning/sofi-coach-sheet.tsx`
- Existing dirty unrelated build blocker: `frontend/components/quiz/quiz-question-view.tsx` may prevent clean repo-wide build until fixed separately.

## Acceptance Criteria

- Desktop header shows a larger EduGap logo/mark while the title and metadata are visually smaller than the current screenshot.
- Header height decreases or remains compact; it must not take more vertical space than the current implementation.
- Left sidebar no longer has the bottom summary/signature stack consuming day-list space.
- Day rows keep a recognizable signature through compact icon/chip/progress treatment.
- Daily skills render as compact scan rows by default; long description/detail appears only after selecting a skill.
- Today Mission remains above the fold and is visually lighter than the current large card.
- Desktop AI entry becomes a small dock of 2-4 clear icon actions.
- Mobile keeps AI actions collapsed or tucked below content so the sticky CTA is not covered.
- No overlapping text/buttons on desktop, tablet-width, or mobile.

## Validation Commands

- Targeted lint for touched files, for example:
  - `npx eslint frontend/components/LearningPath.tsx frontend/components/learning/desktop-learning-sidebar.tsx frontend/components/learning/mobile-daily-skill-list.tsx frontend/components/learning/mobile-today-mission-card.tsx`
- Browser screenshot checks for:
  - desktop `1440x900`
  - narrow desktop/tablet `1024x768`
  - mobile `390x844`
- Full `npm run build` only after the unrelated quiz file parse issue is resolved.

## Out Of Scope

- Backend changes.
- New curriculum data.
- New AI chat architecture.
- Permanent Sofi right panel.
- Full gamification/reward redesign.

## Implementation Report

- Completed header density polish: `LearningBrandMark` uses the cropped EduGap logo asset and the desktop page title/meta are smaller.
- Completed left sidebar focus pass: removed the bottom weekly summary area and kept compact day-row signature chips.
- Completed skill density pass: daily skills use compact rows with selected-row detail instead of large repeated cards.
- Completed mobile density pass: Today Mission and Daily Skills use compact mode on mobile; sticky CTA is reduced to one row with a Guidebook icon plus Start action.
- Completed desktop floating nav pass: learning tab desktop shows a vertical icon dock instead of a single hamburger button.
- Stabilized `/app` visual validation by removing the learn-tab `initial opacity: 0` wrapper that could leave the page blank in reduced-motion/headless checks.

## Validation Results

- Passed: `npx eslint app/components/dashboard-layout.tsx components/LearningPath.tsx components/LeftBar.tsx components/learning/learning-brand-mark.tsx components/learning/desktop-learning-sidebar.tsx components/learning/mobile-daily-skill-list.tsx components/learning/mobile-today-mission-card.tsx`
- Passed: `npx tsc --noEmit --pretty false --incremental false`
- Passed: `npm run build`
- Captured: `outputs/learning-density-desktop.png`
- Captured: `outputs/learning-density-mobile.png`
- Build warnings only: existing Next middleware deprecation and Turbopack NFT trace warning in `next.config.ts` / guidebook route.
