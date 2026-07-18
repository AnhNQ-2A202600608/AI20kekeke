---
phase: 4
title: "Insight Rail"
status: pending
priority: P2
dependencies: [2, 3]
---

# Phase 4: Insight Rail

## Overview

Add a right insight rail for selected skill context: mini map, ZPD guidance, mastery trend, and compact learner summary. This replaces modal-first detail and keeps context visible.

## Requirements

- Functional: rail updates when selected skill changes and offers per-set practice actions when relevant.
- Non-functional: sticky on desktop, accordion/stack on mobile, no absolute positioning over main content.

## Architecture

Suggested components:

```text
practice-garden/
  practice-insight-rail.tsx
  skill-mini-map.tsx
  zpd-focus-panel.tsx
  mastery-trend-panel.tsx
  selected-skill-detail.tsx
```

MVP data is derived locally:

- mini map: simple SVG/list from currently filtered skills
- ZPD: copy from state/Elo/mastery; mark as guidance, not algorithm output unless real ZPD data exists
- trend: simple 7-day placeholder only if real data exists; otherwise show mastery delta from `conceptMasteries` or hide chart
- detail: associated sets, mastery, current session count, recommended set

## Related Code Files

| Action | Absolute path | Purpose |
|---|---|---|
| Create | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\practice-insight-rail.tsx` | Desktop rail/mobile accordion. |
| Create if useful | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\skill-mini-map.tsx` | Lightweight selectable node map. |
| Create if useful | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\zpd-focus-panel.tsx` | ZPD copy and gauge. |
| Reuse | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\mascot\sofi-state-mascot.tsx` | Sofi detail visual if available. |

## Implementation Steps

1. Build rail container with `position: sticky`, `max-height: calc(100dvh - 6rem)`, and internal scroll.
2. Build selected skill detail first; it is the highest-value rail panel.
3. Add ZPD panel with three labels: `Dễ`, `Vừa sức`, `Khó`.
4. Add mini map as a simple node row/grid before attempting graph edges.
5. Add per-set buttons in detail panel for `targetSetId` launch.
6. On mobile, render panels as native `details`/accordion or simple stacked sections.
7. Hide or simplify low-confidence panels rather than showing fake metrics.

## Success Criteria

- [ ] Rail never overlaps garden cards.
- [ ] Selecting a card updates rail content and map highlight.
- [ ] Mobile rail appears below main garden and remains usable.
- [ ] Per-set CTA starts the correct target set.
- [ ] ZPD copy is honest about derived data.

## Risk Assessment

- Risk: fake graph or chart lowers trust.
  Mitigation: use simple derived map and hide chart when no trend data exists.
- Risk: sticky rail gets clipped on short laptop screens.
  Mitigation: internal scroll and compact panel spacing at `max-height: 760px`.
