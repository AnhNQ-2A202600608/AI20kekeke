---
phase: 2
title: "Design System And Assets"
status: pending
priority: P2
dependencies: [1]
---

# Phase 2: Design System And Assets

## Overview

Create the Farmer Scholar design vocabulary, component primitives, and asset strategy using the existing EduGap tactile system. This phase makes the redesign coherent before section-level changes begin.

## Requirements

- Functional: define reusable state labels, rank names, mastery-stage copy, and small presentational helpers.
- Non-functional: reuse current CSS tokens, seed/soil assets, lucide icons, and learning UI primitives. Do not add new dependencies.

## Architecture

Keep the visual vocabulary as a thin presentation layer:

```text
ConceptMastery status/elo/retention
-> profile metaphor helpers
-> presentational cards/sections
```

Suggested helper module:

```text
frontend/components/dashboard/profile/utils/profile-metaphors.ts
```

Suggested optional components:

```text
frontend/components/dashboard/profile/components/farmer-stat-pill.tsx
frontend/components/dashboard/profile/components/garden-section-heading.tsx
frontend/components/dashboard/profile/components/recovery-state-label.tsx
```

## Related Code Files

- Create: `frontend/components/dashboard/profile/utils/profile-metaphors.ts`
- Create optional: `frontend/components/dashboard/profile/components/farmer-stat-pill.tsx`
- Create optional: `frontend/components/dashboard/profile/components/garden-section-heading.tsx`
- Modify: `frontend/components/dashboard/profile/components/profile-header.tsx`
- Modify: `frontend/components/dashboard/profile/components/mastery-map.tsx`
- Modify: `frontend/components/dashboard/profile/components/study-path-guidelines.tsx`
- Reuse: `frontend/components/learning/mastery-seed-badge.tsx`
- Reuse: `frontend/components/learning/mastery-soil-strip.tsx`

## Implementation Steps

1. Define copy constants:
   - profile title: `Ho so nang luc` / `Vuon nang luc cua ban`
   - role: `Nguoi cham vuon ky nang`
   - XP: `Anh nang XP`
   - streak: `Nhip tuoi cay`
   - weak: `Can tuoi lai`
   - decay: `Vung dat can phuc hoi`
2. Define rank labels from Elo bands:
   - below 900: `Hat moi gieo`
   - 900-1049: `Mam dang lon`
   - 1050-1199: `Nguoi cham vuon kien thuc`
   - 1200-1399: `Nguoi thu hoach khai niem`
   - 1400+: `Bac thay khu vuon`
3. Define mastery stage labels from status/mastery:
   - cold_start -> `Hat moi`
   - weak/decay -> `Can tuoi lai`
   - learning -> `Dang lon`
   - zpd -> `Vung phat trien tot`
   - mastered -> `Da no hoa`
4. Choose icon set from lucide only:
   - Sun / Zap for XP
   - Droplets / Flame for streak
   - Gauge / Badge for Elo
   - Sprout / Leaf for skill stages
   - Target for next action
5. Add helper functions and unit-testable pure mappings if the repo has a suitable test pattern; otherwise keep functions simple and review via UI.
6. Replace shame-heavy labels in touched profile sections with care/recovery labels.

## Success Criteria

- [ ] Metaphor labels are centralized or clearly reusable.
- [ ] Status mapping is deterministic and easy to test.
- [ ] Existing color tokens are used; no purple/indigo/magenta accents are introduced.
- [ ] Accessibility is preserved with text labels, not color-only meaning.
- [ ] No new visual dependency is added.

## Risk Assessment

- Risk: copy becomes too cute and less clear.
  - Mitigation: pair metaphor label with concrete metric, e.g. `Can tuoi lai - retention 54%`.
- Risk: inconsistent labels across Profile and Practice.
  - Mitigation: align with `Practice Skill Garden` names before implementation.
