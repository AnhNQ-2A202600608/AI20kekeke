---
title: "Mobile Learning Growth Workspace"
description: "Redesign the student learning page into a responsive growth workspace with day rail/sidebar, mission card, daily skills, optional tokenizer preview, and Sofi coach popup."
status: completed
priority: P2
branch: "codex/adaptive-first-frontend-quiz"
tags: [feature, frontend, mobile, ux]
blockedBy: [260629-1644-sofi-mascot-states]
blocks: []
created: "2026-06-29T12:07:48.309Z"
createdBy: "ck:plan"
source: skill
---

# Mobile Learning Growth Workspace

## Overview

Create a responsive version of the `/app` learning dashboard based on the discussed ChatGPT mockups, while preserving current project contracts. The final experience replaces the old desktop detail-card composition with a week sidebar plus mission-first workspace, turns the mobile roadmap into a horizontal day rail, places Today Mission above the fold, shows all concepts/skills in the selected day, adds a small optional tokenizer preview, and keeps Sofi/AI as an on-demand popup rather than a permanent right panel.

## Design Decision

- Adopt from mockups: compact brand bar on mobile, horizontal day chips, desktop week sidebar, Today Mission card, mountain illustration slot, collapsible Sofi coach, primary CTA.
- Adapt for this app: middle content becomes the selected day's concept/skill list, not a single concept card.
- Reject for now: permanent right panel, full bottom nav duplication, always-visible AI chat, always-on tokenizer playground for every concept.
- Keep current contracts: `LearningPath` owns selected day/concept state, `onStartPractice(skill, targetSetId)` launches quiz, `onSelectGuidebook(dayId)` opens guidebook, existing AI chat remains a separate tab/drawer pattern.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Notes |
|---|---|---:|---|
| Blocked by | `260629-1644-sofi-mascot-states` | pending | Sofi popup should reuse optimized WebP assets and semantic mascot component when available. |
| Builds on | `260629-1524-app-program-map-day-focus` | completed | Reuses curriculum registry, day selection, concept adapters, and quiz launch contract. |

## Scope

### In Scope

- Responsive learning layout for student `/app` learn tab.
- Desktop growth-workspace shell with week/day sidebar and mission-first middle panel.
- Day rail derived from current `ProgramDay[]`.
- Today Mission card with optional mountain asset slot.
- Day skills list showing multiple concepts per day.
- Optional tokenizer preview only for relevant concepts.
- Sofi coach trigger/popup that does not become a permanent panel.
- Focus, reduced-motion, safe-area, and no-overlap validation.

### Out of Scope

- Backend changes.
- New quiz content or curriculum authoring.
- Replacing Socratic chat architecture.
- Full gamification economy, unlock rewards, or real streak logic changes.
- Mandatory AI-generated art pipeline. Use prompts/placeholders if assets are missing.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Responsive Learning Shell](./phase-01-responsive-learning-shell.md) | Completed |
| 2 | [Today Mission Card](./phase-02-today-mission-card.md) | Completed |
| 3 | [Daily Skills List](./phase-03-daily-skills-list.md) | Completed |
| 4 | [Tokenizer Preview](./phase-04-tokenizer-preview.md) | Completed |
| 5 | [Sofi Coach Popup And Validation](./phase-05-sofi-coach-popup-and-validation.md) | Completed |

## Dependencies

- Existing frontend stack: Next.js 16, React 19, Tailwind utilities, `motion`, `lucide-react`.
- Existing components:
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/program-roadmap.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/day-detail-card.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LeftBar.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/mascot/*`
- Validation commands:
  - `npm run lint`
  - `npm run build`
  - Browser screenshot checks for desktop and mobile viewport.

## Acceptance Criteria

- Mobile `/app` learn screen shows compact brand/status, horizontal day rail, Today Mission, daily concept list, optional preview, Sofi coach trigger, sticky CTA.
- The middle content lists all concepts for selected day and updates selected concept without losing day selection.
- `Bắt đầu` launches practice through existing `onStartPractice(skill, targetSetId)` adapter.
- Guidebook remains secondary and accessible.
- Sofi/AI appears only after user action or as a collapsed card; no permanent right panel.
- Mobile has no incoherent overlap between sticky CTA, floating nav/AI button, and safe-area bottom.
- Desktop shows the growth workspace instead of the old roadmap/detail-card composition.

## Implementation Report

- Completed responsive `/app` learn workspace with compact mobile top bar, mobile day rail, desktop week sidebar, Today Mission, daily skill list, tokenizer preview, Sofi coach trigger/sheet, and CTA.
- Replaced the old desktop `ProgramRoadmap` plus `DayDetailCard` composition with `DesktopLearningSidebar` plus the mission/skill workspace.
- Preserved quiz launch and guidebook contracts: `onStartPractice(skill, targetSetId)` and `onSelectGuidebook(dayId)`.
- Routed Sofi `Hỏi AI` through the existing chat tab instead of adding a permanent AI panel.
- Verification:
  - `npx eslint` on touched learning/layout files passed.
  - `npx tsc --noEmit` passed before the later unrelated quiz source issue surfaced.
  - `npm run build` passed before the later unrelated quiz source issue surfaced.
  - Browser checks initially confirmed mobile elements render and Sofi sheet opens/closes.
  - After the desktop growth-workspace fix, browser/build verification is blocked by an unrelated syntax issue in `frontend/components/quiz/quiz-question-view.tsx`.
- Known unrelated gate:
  - Repo-wide `npm run lint` is blocked by the pre-existing `react-hooks/set-state-in-effect` issue in `frontend/components/quiz/quiz-question-view.tsx`.
  - Clean `npm run build` is currently blocked by an unrelated syntax issue in the same quiz file.

## Open Questions

- Final mountain illustration asset is optional. If not provided, implementation uses a lightweight CSS/SVG placeholder.
- Final Sofi coach popup copy can be static per selected concept initially, then later wired to tutor state.
