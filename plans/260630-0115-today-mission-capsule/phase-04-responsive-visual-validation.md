---
phase: 4
title: "Responsive Visual Validation"
status: completed
priority: P1
dependencies: [3]
---

# Phase 4: Responsive Visual Validation

## Overview

Verify the capsule across desktop, compact-height desktop, and mobile to ensure the new mission summary is smaller, readable, and non-overlapping.

## Requirements

- Functional: all mission metrics remain visible or accessible.
- Non-functional: no horizontal overflow.
- Non-functional: no overlap with Sofi art, Daily Skills, sticky CTA, or right-side navigation/panels.
- Non-functional: lint passes.

## Architecture

Validation should cover the actual app route, not isolated component assumptions.

```text
npm run lint
browser: /app Learn tab
viewports:
  desktop 1440x900
  compact desktop around 1210x640
  mobile around 390x844
```

## Related Code Files

- Verify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\today-mission-capsule.tsx`
- Verify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mobile-today-mission-card.tsx`
- Verify route: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\app\components\dashboard-layout.tsx`

## Implementation Steps

1. Run `npm run lint` in `frontend`.
2. Start or reuse local dev server.
3. Capture desktop screenshot of `/app` Learn tab.
4. Capture compact-height screenshot matching the user's 0.75-like baseline.
5. Capture mobile screenshot.
6. Inspect DOM or screenshot for:
   - capsule does not overlap mascot
   - capsule does not overlap Daily Skills
   - sticky CTA does not cover capsule
   - no horizontal scroll
7. If overlap remains, adjust spacing in the capsule or mission card only.

## Success Criteria

- [x] `npm run lint` passes.
- [x] Desktop screenshot shows one capsule, not four KPI boxes.
- [x] Compact-height screenshot fits mission card and Daily Skills without collision.
- [x] Mobile screenshot wraps metrics cleanly.
- [x] Progressbar width matches `completionPercent`.
- [x] Accessibility attributes are present.

## Risk Assessment

- Risk: browser automation package unavailable in local shell.
  Mitigation: use in-app browser tooling or manual screenshot verification; record limitation.
- Risk: screenshots differ because logged-in state data changes.
  Mitigation: compare layout structure and overlap, not exact numbers.
- Risk: existing unrelated working tree changes affect visuals.
  Mitigation: only inspect files in this plan's related file list during implementation.
