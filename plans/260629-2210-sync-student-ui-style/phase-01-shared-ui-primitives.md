---
phase: 1
title: Shared UI Primitives
status: completed
priority: P1
dependencies: []
---

# Phase 1: Shared UI Primitives

## Overview

Create a tiny set of reusable learning-style primitives so profile, chat, and graph can share the `/app` visual language without copy-pasting long Tailwind class strings into every page.

## Requirements

- Functional: expose reusable panel, button, metric pill, section header, and optional page shell components.
- Non-functional: keep components lightweight, typed, and styling-only; no data fetching or app state.
- Compatibility: components must work in client components and not require new dependencies.
- Accessibility: preserve `button` semantics, `aria-label` passthrough, focus-visible rings, and disabled states.

## Architecture

Create a small UI namespace under `frontend/components/ui/learning/`. Keep primitives composable:

```text
LearningPageShell -> outer page/background/container only
TactilePanel -> section/card wrapper with depth border
TactileButton -> tactile button variants
MetricPill -> compact stat badge
SectionHeader -> eyebrow + title + optional action
```

Do not encode page-specific text, profile data, chat modes, or graph semantics in these primitives.

## Related Code Files

- Create: `frontend/components/ui/learning/learning-page-shell.tsx`
- Create: `frontend/components/ui/learning/tactile-panel.tsx`
- Create: `frontend/components/ui/learning/tactile-button.tsx`
- Create: `frontend/components/ui/learning/metric-pill.tsx`
- Create: `frontend/components/ui/learning/section-header.tsx`
- Create: `frontend/components/ui/learning/index.ts`
- Modify if needed: `frontend/app/globals.css`
- Reference: `frontend/components/learning/*`

## Implementation Steps

1. Inspect the final `/app` classes in `LearningPath`, `DesktopLearningSidebar`, `DaySummaryCard`, and `ConceptPath`.
2. Define shared variants conservatively:
   - panel tones: `white`, `green`, `subtle`
   - button variants: `green`, `white`, `ghost`
   - metric tones: `green`, `orange`, `blue`, `yellow`, `neutral`
3. Implement primitives using `React.ComponentPropsWithoutRef` patterns and `clsx` if already used, otherwise simple class joins.
4. Keep all components presentational. Use `children`, `className`, and native props for extension.
5. Export from `frontend/components/ui/learning/index.ts`.
6. Avoid modifying existing `/app` components in this phase unless a primitive is extracted without behavior change.

## Success Criteria

- [ ] Shared primitives compile.
- [ ] Primitives use existing Tailwind theme tokens from `globals.css`.
- [ ] No duplicated theme constants or new package dependency.
- [ ] Tactile buttons have active and focus-visible states.
- [ ] Existing `/app` page remains visually unchanged if not refactored yet.

## Risk Assessment

- Risk: over-building a mini design system. Mitigation: only create components needed by phases 2-4.
- Risk: variants become too generic. Mitigation: keep names tied to EduGap learning UI.
- Risk: class extraction changes `/app`. Mitigation: avoid refactoring `/app` until after target pages are synced.
