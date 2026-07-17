---
phase: 6
title: "Responsive Validation"
status: pending
priority: P2
dependencies: [3, 4, 5]
---

# Phase 6: Responsive Validation

## Overview

Polish the full redesigned profile across desktop, tablet, and mobile; then run focused frontend checks. This phase is the quality gate before the redesign is considered done.

## Requirements

- Functional: all profile sections render, actions work, visualizer tabs still open, and drawer still behaves correctly.
- Non-functional: no overlap, no hidden CTA, no horizontal overflow, accessible focus states, reduced motion respected where animation is added.

## Architecture

Validation should cover:

```text
student profile happy path
-> hero
-> next care action
-> progress garden
-> recovery zones
-> visualizer tabs
-> practice CTA
-> concept drawer
```

Mentor/BTC views should be smoke-tested to ensure the redesign did not affect non-student personas.

## Related Code Files

- Validate: `frontend/components/dashboard/profile/index.tsx`
- Validate: all modified files under `frontend/components/dashboard/profile/components/`
- Validate: `frontend/app/globals.css` if touched
- Validate: `frontend/package.json` scripts for lint/build commands

## Implementation Steps

1. Run focused static checks:
   - `cd frontend && npm run lint`
   - build/type command available in `frontend/package.json`
2. Start the local frontend dev server if browser validation is needed.
3. Browser-check `/app` or the dashboard route at:
   - 390x844
   - 768x1024
   - 1280x720
   - 1440x900
4. Verify:
   - no horizontal document overflow
   - hero stats wrap cleanly
   - garden cards keep stable dimensions
   - care action CTA visible above or near first screen on mobile
   - visualizer tabs remain reachable
   - drawer does not cover required actions permanently
5. Test keyboard focus for major buttons/cards.
6. Test reduced motion behavior if hover/pulse/watering animations were added.
7. Smoke-test mentor/BTC persona switching.
8. Update docs only if commands, behavior contracts, or architecture changed.

## Success Criteria

- [ ] Lint passes.
- [ ] Build/type gate passes or any failure is documented with exact reason.
- [ ] Desktop/tablet/mobile screenshots show no layout overlap.
- [ ] Student profile primary action is visible and usable on mobile.
- [ ] Admin persona views still render.
- [ ] No docs update is needed unless implementation changes public behavior or setup.

## Risk Assessment

- Risk: tactile borders and large headings cause mobile overflow.
  - Mitigation: use `minmax(0, 1fr)`, smaller compact labels, and fixed-size icon/stat cells.
- Risk: dynamic chart imports cause hydration/loading jank.
  - Mitigation: keep existing dynamic import pattern and loading skeletons.
