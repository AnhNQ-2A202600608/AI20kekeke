---
title: "Practice Skill Garden"
description: "Redesign the student Practice tab into a Skill Garden that reuses existing EduGap seed, soil, Sofi, and practice-session contracts."
status: pending
priority: P2
branch: "codex/adaptive-first-frontend-quiz"
tags: [feature, frontend, learning, ux]
blockedBy: [260630-0115-today-mission-capsule]
blocks: []
created: "2026-06-30"
createdBy: "ck:plan"
source: skill
---

# Practice Skill Garden

## Overview

Turn the `Luyện tập` tab into a lightweight Skill Garden. The page should answer: what should I practice today, why that skill, how mastery is changing, and what happens after practice.

Hard-scope decision: build a garden-themed practice surface, not a game engine. Reuse the existing seed/soil assets, Sofi mascot component, Zustand practice session store, and `onStartPractice(skill, targetSetId)` adapter. Do not introduce backend APIs, canvas, or a new curriculum model in the MVP.

## Scope Challenge

- Existing code: `frontend/components/dashboard/skills-practice-tab.tsx` already owns the Practice tab and session resume flow. `frontend/components/learning/mastery-seed-*` already provides seed and soil primitives. `frontend/components/LearningPath.tsx` already maps curriculum concepts to practice launch adapters.
- Minimum change set: replace the generic card matrix inside `SkillsPracticeTab` with a garden page layout, add small presentational components under `frontend/components/dashboard/practice-garden/`, and keep existing store/session calls.
- Complexity: expected 6-8 touched files if kept scoped. Any API, ReactFlow graph rewrite, or new mascot controller integration is deferred.
- Selected mode: HOLD SCOPE with `--hard` gates.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Notes |
|---|---|---:|---|
| Builds on | `plans/260629-2248-mastery-seed-cards` | completed | Reuse seed/soil asset helpers and mastery primitives instead of re-creating visuals. |
| Builds on | `plans/260629-2112-learning-density-polish` | completed | Keep compact responsive workspace lessons: no overlap, no oversized repeated cards. |
| Builds on | `plans/260629-2210-sync-student-ui-style` | completed | Follow existing EduGap tactile tokens and avoid a parallel theme. |
| Related, not blocking | `plans/260629-1644-sofi-mascot-states` | pending | Use current Sofi components where available; advanced pose transitions can wait. |

## Product Decisions

- Target surface: `frontend/components/dashboard/skills-practice-tab.tsx`, because this is the student `Luyện tập` tab.
- Keep `LearningPath` as the guided curriculum/day workspace. Do not merge Learn and Practice in this plan.
- MVP garden scene is a CSS garden bed around accessible cards. No canvas/SVG game map in phase 1.
- Right rail is insight-only: selected skill, ZPD explanation, mini mastery trend, learner summary. No generic KPI dashboard.
- Mobile converts the right rail into accordions below the garden; no absolute panel or overlay.

## Design Direction

- Subject: EduGap adaptive practice for Vietnamese students.
- Tone: playful-natural but still compact and task-focused.
- Visual system: avocado background, white tactile panels, 2px borders, 5px bottom depth where useful, Fraunces headings, Be Vietnam Pro body, green/yellow/orange/blue learning accents.
- Signature element: each skill is a seed plot with growth stage + soil progress + state copy.
- Motion: small cause-effect only: hover lift, selected sprout emphasis, short watering state before navigation. Respect reduced motion.

## Out Of Scope

- New backend endpoint like `/api/practice-garden`.
- Replacing Zustand practice session mechanics.
- Canvas/WebGL garden map.
- Full dependency graph editor.
- New quiz scoring or mastery algorithms.
- Large mascot animation system.

## Hard-Mode Review Summary

Red-team risks addressed in phase files:

- Scope creep: advanced map, graph, and watering animation are deferred behind MVP.
- Overlap risk: desktop uses CSS grid with `minmax(0, 1fr)` and mobile rail collapse at `1100px`.
- Data mismatch: adapter derives garden cards from existing `Skill`, `conceptMasteries`, `quizSets`, and `activePracticeSession`.
- Accessibility: cards remain buttons, selected state uses ARIA, state meaning is not color-only.
- Build risk: plan avoids new dependencies; uses existing `motion`, `lucide-react`, Tailwind, and seed components.

## Validation Questions

- Should the Practice tab show all days by default, or default to "Hôm nay"/current selected day?
- Should mastered skills stay visible in the garden, or collapse into a "Đã nở hoa" section after MVP?
- Should `WEAK` map to "Cần tưới lại" copy, or keep stronger "Cần ôn tập" copy for clarity?

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Surface Audit](./phase-01-surface-audit.md) | Pending |
| 2 | [Data Adapter](./phase-02-data-adapter.md) | Pending |
| 3 | [Garden Main Area](./phase-03-garden-main-area.md) | Pending |
| 4 | [Insight Rail](./phase-04-insight-rail.md) | Pending |
| 5 | [Practice Flow](./phase-05-practice-flow.md) | Pending |
| 6 | [Responsive Validation](./phase-06-responsive-validation.md) | Pending |

## Dependencies

- Next.js 16 / React 19 frontend in `frontend/`.
- Existing dashboard tab route: `frontend/app/components/dashboard-layout.tsx`.
- Existing Practice tab: `frontend/components/dashboard/skills-practice-tab.tsx`.
- Existing seed/soil primitives:
  - `frontend/components/learning/mastery-seed-badge.tsx`
  - `frontend/components/learning/mastery-seed-skill-card.tsx`
  - `frontend/components/learning/mastery-soil-strip.tsx`
- Existing store/session flow:
  - `frontend/hooks/useBoundStore.ts`
  - `frontend/stores/createPracticeSlice.ts`
  - `frontend/app/hooks/useQuizSession.ts`
- Existing visual tokens: `frontend/app/globals.css`.

## Acceptance Criteria

- Practice tab presents a garden-themed, scan-friendly layout with recommended skill, day filter, garden skill cards, weekly/mastery progress, and insight rail.
- Starting, resuming, reviewing, and resetting practice continue to use existing callbacks and store behavior.
- Skill cards expose mastery stage, state copy, percent, associated set count, and primary CTA.
- Right rail updates when a skill is selected and does not overlap main content.
- Mobile layout has no horizontal overflow and no hidden CTA at 390px width.
- No new dependency is added unless implementation proves existing tools cannot cover the need.
- Focused lint/type checks pass for touched files; browser checks cover desktop, tablet, and mobile.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260630-0112-practice-skill-garden\plan.md
```
