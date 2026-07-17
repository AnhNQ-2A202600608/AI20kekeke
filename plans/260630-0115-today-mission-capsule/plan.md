---
title: "Today Mission Learning Capsule"
description: "Replace the mission KPI grid with a compact seed-growth capsule that preserves today metrics while reducing visual height and dashboard feel."
status: completed
priority: P2
branch: "codex/adaptive-first-frontend-quiz"
tags: [feature, frontend, ux]
blockedBy: []
blocks: [260630-0112-practice-skill-garden]
created: 2026-06-30
createdBy: "ck:plan"
source: skill
---

# Today Mission Learning Capsule

## Overview

Implement Concept 3: replace the 4-stat KPI grid inside `MobileTodayMissionCard` with a single premium mission capsule. The capsule should keep `conceptCount`, `practiceCount`, estimated minutes, and `completionPercent`, but read as a compact learning journey summary instead of an enterprise KPI row.

## Scope Challenge

- Existing code: `frontend/components/learning/mobile-today-mission-card.tsx` already computes and renders all required metrics. `LearningPath.tsx` already passes the data twice, desktop and mobile.
- Minimum changes: create one reusable capsule component, replace the KPI grid in the mission card, validate responsive behavior. No route, state, API, or curriculum changes.
- Complexity: expected 3-5 frontend files. One new component. One integration point. No backend impact.
- Selected mode: HOLD scope with `--hard` review. Keep the capsule focused; defer full Practice page redesign to `260630-0112-practice-skill-garden`.

## Cross-Plan Dependencies

| Relationship | Plan | Reason |
| --- | --- | --- |
| Blocks | `260630-0112-practice-skill-garden` | That broader Practice page redesign should consume or preserve this capsule decision instead of reintroducing KPI cards. |

## Hard-Mode Research Summary

| Thread | Finding | Plan impact |
| --- | --- | --- |
| UI pattern research | Best approach is a single progress summary strip, not another card group. | Use a pill/capsule shell with inline metrics and one progress bar. |
| Codebase scout | Current mission card uses lucide icons, semantic Tailwind tokens, compact/comfortable density, and shared seed-growth assets. | Implement with Tailwind and existing lucide/seed visual language; avoid global CSS unless needed. |

## Red-Team Notes

- Risk: capsule becomes too dense on mobile. Mitigation: mobile wraps summary, hides badge text, keeps metric labels visible.
- Risk: new component duplicates mission card logic. Mitigation: capsule receives primitive metrics only; mission card remains source of estimated minutes calculation unless later extracted.
- Risk: direct hex colors drift from theme tokens. Mitigation: prefer existing semantic classes (`primary-green`, `surface-container-low`, `gray-border`) and use arbitrary colors only where current token set lacks exact capsule treatment.
- Risk: this solves Learn mission card, not Practice page styling. Mitigation: keep Practice page redesign in its separate plan and do not expand this plan.

## Validation Assumptions

- User wants `Concept 3 — Learning Capsule` implemented from pasted spec.
- `MobileTodayMissionCard` remains shared for desktop Learn and mobile Learn.
- The old 4 KPI boxes should be removed wherever that mission card renders.
- Target success is visual height reduction by roughly 40-50% versus the old KPI row, with no metric loss.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Audit Mission Surface](./phase-01-audit-mission-surface.md) | Completed |
| 2 | [Implement Capsule Component](./phase-02-implement-capsule-component.md) | Completed |
| 3 | [Integrate And Replace KPI Row](./phase-03-integrate-and-replace-kpi-row.md) | Completed |
| 4 | [Responsive Visual Validation](./phase-04-responsive-visual-validation.md) | Completed |

## Dependencies

- Existing frontend stack: Next.js, React, Tailwind CSS, lucide-react.
- Related pending plan: [Practice Skill Garden](../260630-0112-practice-skill-garden/plan.md).

## Acceptance Criteria

- [x] `TodayMissionCapsule` exists and accepts `concepts`, `practices`, `estimatedMinutes`, `progress`, and optional `className`.
- [x] `MobileTodayMissionCard` no longer renders the 4 KPI grid.
- [x] Capsule displays concept count, practice count, estimated minutes, and progress.
- [x] Capsule includes accessible `aria-label` and `role="progressbar"`.
- [x] Desktop capsule height stays about 64-76px.
- [x] Mobile layout wraps without horizontal overflow.
- [x] `npm run lint` passes.
- [x] Browser screenshot check covers desktop 100%, desktop compact-height/0.75-like viewport, and mobile.

## Not In Scope

- Full Practice page visual redesign.
- New adaptive data fields.
- New backend progress calculations.
- Replacing Skill Map / RightBar content.
- Global design token reset.

## Cook Handoff

Recommended implementation command after review:

```text
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260630-0115-today-mission-capsule\plan.md
```
