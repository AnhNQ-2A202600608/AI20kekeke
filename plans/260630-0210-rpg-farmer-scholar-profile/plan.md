---
title: "RPG Farmer Scholar Profile"
description: "Redesign the student Profile and Personal Progress surface into a cozy RPG Farmer Scholar character sheet that reuses current profile analytics, seed assets, and EduGap tactile UI."
status: pending
priority: P2
branch: "codex/adaptive-first-frontend-quiz"
tags: [feature, frontend, profile, ux]
blockedBy: []
blocks: []
created: "2026-06-30"
createdBy: "ck:plan"
source: skill
---

# RPG Farmer Scholar Profile

## Overview

Redesign the student profile into a "living capability profile": the learner becomes a Farmer Scholar, skills become plants, XP becomes sunlight, streak becomes watering rhythm, weak areas become recovery soil, and recommendations become daily care actions.

This plan should not build a farming game engine. It should reskin and restructure the existing profile/progress experience around the concept while preserving current data contracts: Elo, XP, streak, ZPD, BKT/decay, concept mastery, sessions, heatmap, and practice launch callbacks.

## Scope Challenge

- Existing code: `frontend/components/dashboard/profile/` already contains a modular `ProfileTab`, `ProfileHeader`, recommendation banner, charts, mastery map, heatmap, sessions, guidelines, and concept drawer. `frontend/components/learning/mastery-seed-*` and `frontend/public/learning-soils/` already provide seed/soil primitives.
- Minimum changes: add a small profile-specific presentational layer, update current profile sections in place, reuse `useProfileData`, and map current analytics into farmer-scholar copy/state. Defer canvas maps, inventory mechanics, avatar customization, and backend schema changes.
- Complexity: expected 8-12 touched frontend files if implemented cleanly. More than this likely means the plan is drifting into a new game surface.
- Selected mode: HOLD SCOPE. The brainstorm is creative, but implementation should stay MVP-first and compatible with the current dashboard.

## Product Decisions

- Target surface is the student profile only. Mentor/BTC profile views should keep their operational layout unless a later plan redesigns admin personas.
- Profile should become action-oriented: first screen must expose identity, progress state, and the next best learning action.
- Weakness copy must avoid shame framing. Use "vung dat can cham", "can tuoi lai", "dang phuc hoi", or equivalent.
- Keep current analytics meaningful. Do not replace charts with decorative farm art unless the same learning signal remains visible.
- Use existing EduGap tactile style: green/cream panels, 2px borders, 5px depth, Plus Jakarta/Fraunces/Nunito patterns already present in the app.
- MVP should be CSS/component driven. No canvas, WebGL, new animation dependency, or backend endpoint.
- Edo is the learner-avatar. Sofi remains the AI tutor companion. The UI should show Edo as the student being guided by Sofi, not replace Sofi's tutor role.

## Edo Asset Index

Asset root:

```text
frontend/public/mascot/edo/
```

Metadata:

```text
frontend/public/mascot/edo/index.json
```

MVP asset mapping:

| UI state | Asset | Priority |
|---|---|---:|
| Profile hero | `/mascot/edo/edo-sofi-shoulder-companion.webp` | P1 |
| Next best action / daily quest | `/mascot/edo/edo-sofi-next-path-lantern.webp` | P1 |
| Recovery / weak soil | `/mascot/edo/edo-sofi-watering-recovery.webp` | P1 |
| Achievement / mastery bloom | `/mascot/edo/edo-sofi-achievement-bloom.webp` | P1 |
| Skill map planning | `/mascot/edo/edo-sofi-skill-map-planning.webp` | P2 |
| Skill graph / prerequisites | `/mascot/edo/edo-sofi-skill-graph-guide.webp` | P2 |
| Socratic hint | `/mascot/edo/edo-sofi-hint-leaf.webp` | P2 |
| Reflection / journal | `/mascot/edo/edo-sofi-study-reflection.webp` | P2 |
| Decay diagnosis | `/mascot/edo/edo-sofi-weak-soil-diagnosis.webp` | P2 |
| Error review | `/mascot/edo/edo-sofi-error-review.webp` | P3 |
| Garden guide / empty state | `/mascot/edo/edo-sofi-garden-signpost.webp` | P3 |
| Profile reading | `/mascot/edo/edo-sofi-profile-reading.webp` | P2 |

## Cross-Plan Dependencies

| Relationship | Plan | Status | Notes |
|---|---|---:|---|
| Related | `plans/260630-0112-practice-skill-garden` | pending | Profile should share vocabulary and visual primitives with the Practice Skill Garden instead of inventing a second garden language. |
| Builds on | `plans/260629-2248-mastery-seed-cards` | completed | Reuse seed/soil assets and mastery stage mapping. |
| Builds on | `plans/260629-2210-sync-student-ui-style` | completed | Stay inside the synchronized student UI style. |
| Builds on | `plans/20260618-1700-refactor-profile-tab` | completed in code | Current profile is already modular under `frontend/components/dashboard/profile/`. |

## MVP Slice

1. Farmer Scholar identity hero.
2. Sunlight XP, Elo rank, and Watering Streak metrics.
3. Personal Progress Garden using current concepts/mastery data.
4. Next Care Action from existing bandit recommendation/next action data.
5. Recovery Zones from decay risk and weak concepts.
6. Responsive validation for 390px, 768px, and desktop.

## Out Of Scope

- Full farm simulation.
- Avatar customization flow.
- Inventory economy or consumable items.
- New database tables or backend APIs.
- Replacing the existing quiz/practice launch contract.
- Rebuilding the skill DAG or knowledge graph.
- Heavy generated art dependency for core UX.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Surface Audit](./phase-01-surface-audit.md) | Pending |
| 2 | [Design System And Assets](./phase-02-design-system-and-assets.md) | Pending |
| 3 | [Farmer Scholar Hero](./phase-03-farmer-scholar-hero.md) | Pending |
| 4 | [Personal Progress Garden](./phase-04-personal-progress-garden.md) | Pending |
| 5 | [Care Actions And Recovery](./phase-05-care-actions-and-recovery.md) | Pending |
| 6 | [Responsive Validation](./phase-06-responsive-validation.md) | Pending |

## Dependencies

- Next.js / React frontend under `frontend/`.
- Current student profile entrypoint: `frontend/components/dashboard/profile/index.tsx`.
- Current profile data hook: `frontend/components/dashboard/profile/hooks/useProfileData.ts`.
- Current profile types/helpers: `frontend/components/dashboard/profile/utils/profile-utils.ts`.
- Current profile components under `frontend/components/dashboard/profile/components/`.
- Learning UI primitives: `frontend/components/ui/learning`.
- Seed/soil primitives:
  - `frontend/components/learning/mastery-seed-badge.tsx`
  - `frontend/components/learning/mastery-seed-skill-card.tsx`
  - `frontend/components/learning/mastery-soil-strip.tsx`
  - `frontend/lib/learning-soil-assets.ts`
- Visual tokens: `frontend/app/globals.css` and `docs/product/design-guidelines.md`.
- Edo asset index: `frontend/public/mascot/edo/index.json`.

## Acceptance Criteria

- Student profile reads as a cohesive Farmer Scholar / Skill Garden profile, not a generic analytics dashboard.
- Existing analytics remain visible and actionable: Elo, XP, streak, ZPD, mastery, decay/review risk, activity, sessions, and recommended next action.
- Weakness/review states are reframed as recovery/care states without losing clarity.
- Existing `onStartPractice(skillId, targetSetId)` flow still works from recommendations and concept actions.
- No new backend API or state model is required.
- Mobile has no horizontal overflow at 390px and no hidden primary CTA.
- `npm run lint` and the project build/type gate used by the frontend pass after implementation.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260630-0210-rpg-farmer-scholar-profile\plan.md
```
