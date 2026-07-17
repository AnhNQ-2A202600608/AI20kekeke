---
phase: 6
title: "Responsive Validation"
status: pending
priority: P1
dependencies: [3, 4, 5]
---

# Phase 6: Responsive Validation

## Overview

Validate the Garden on desktop, narrow desktop/tablet, mobile, reduced motion, keyboard navigation, lint, and typecheck. This phase is required because the original risk is right-panel overlap.

## Requirements

- Functional: all key user paths work after the redesign.
- Non-functional: no overlap, no horizontal scroll, accessible focus order, no build/type/lint regressions from touched files.

## Validation Matrix

| Viewport | Must verify |
|---|---|
| 1440x900 | Desktop garden + sticky rail visible; no overlap. |
| 1280x720 | Rail internal scroll works; header does not consume too much height. |
| 1024x768 | Layout collapses before overlap. |
| 768x1024 | Tablet stack usable; accordions visible. |
| 390x844 | Mobile no horizontal overflow; CTA and nav not covered. |

## Related Code Files

| Action | Absolute path | Purpose |
|---|---|---|
| Validate | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\skills-practice-tab.tsx` | Main changed surface. |
| Validate | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\*.tsx` | New Garden components. |
| Update if behavior changed | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\docs\frontend-pages.md` | Document only if public page behavior changes materially. |

## Implementation Steps

1. Run focused lint for touched files:

```bash
cd frontend
npx eslint components/dashboard/skills-practice-tab.tsx components/dashboard/practice-garden
```

2. Run TypeScript:

```bash
cd frontend
npx tsc --noEmit --pretty false --incremental false
```

3. Run build only if lint/typecheck pass and unrelated dirty files are not blocking:

```bash
cd frontend
npm run build
```

4. Start local dev server if browser validation is needed:

```bash
cd frontend
npm run dev
```

5. Browser-check `/app` with student persona and `Luyện tập` tab:
   - load tab
   - filter a day
   - select a skill
   - open mobile accordion
   - click start/resume only far enough to verify navigation intent
6. Check DOM for document-level horizontal overflow.
7. Check keyboard tab order through day chips, cards, rail buttons, and CTA.
8. Check reduced motion: no essential state relies on animation.
9. Update `frontend/docs/frontend-pages.md` only if the public page inventory or behavior description changes.

## Success Criteria

- [ ] Focused ESLint passes.
- [ ] TypeScript passes.
- [ ] Build passes or unrelated pre-existing blocker is documented with exact file/error.
- [ ] Browser screenshots/checks pass at 1440x900, 1024x768, and 390x844.
- [ ] No document-level horizontal overflow.
- [ ] No incoherent text/button overlap.
- [ ] Keyboard focus and visible focus states work.

## Risk Assessment

- Risk: existing dirty worktree blocks broad build.
  Mitigation: run focused checks first and report unrelated blockers explicitly.
- Risk: mobile sticky navigation covers Garden CTA.
  Mitigation: reserve bottom padding and test on 390x844.
