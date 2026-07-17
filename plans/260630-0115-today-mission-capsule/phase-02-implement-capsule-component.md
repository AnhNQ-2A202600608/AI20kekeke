---
phase: 2
title: "Implement Capsule Component"
status: completed
priority: P2
dependencies: [1]
---

# Phase 2: Implement Capsule Component

## Overview

Create `TodayMissionCapsule` as a small, accessible, reusable component that renders the mission metrics as one seed-growth capsule.

## Requirements

- Functional: display concepts, practices, estimated minutes, and clamped progress.
- Functional: support optional `className`.
- Functional: show completed state when progress is 100.
- Non-functional: compact enough to replace the KPI grid with 40-50% less height.
- Non-functional: responsive without horizontal overflow.
- Non-functional: keyboard/screen-reader accessible.

## Architecture

Create a presentational component near the learning components. Keep it stateless.

```tsx
type TodayMissionCapsuleProps = {
  concepts: number;
  practices: number;
  estimatedMinutes: number;
  progress: number;
  className?: string;
};
```

Recommended path:

```text
frontend/components/learning/today-mission-capsule.tsx
```

## Related Code Files

- Create: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\today-mission-capsule.tsx`
- Read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mastery-seed-badge.tsx`
- Read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\ui\learning\index.ts`

## Implementation Steps

1. Create `TodayMissionCapsule`.
2. Import `BookOpen`, `Clock3`, `Pencil`, and `Sprout` from `lucide-react`.
3. Clamp progress with `Math.max(0, Math.min(100, Math.round(progress)))`.
4. Render:
   - left seed avatar
   - summary row
   - slim progressbar
   - right progress badge
5. Use Tailwind classes aligned with current project tokens:
   - green: `primary-green`, `primary-green-dark`
   - border: `gray-border`, `primary-green/20`
   - surface: `white`, `surface-container-low`
6. Use `aria-label` on shell and `role="progressbar"` on progress track.
7. Respect mobile:
   - desktop: rounded-full, grid columns `44px 1fr auto`
   - mobile: rounded-3xl or rounded-2xl, summary wraps, badge hides text

## Success Criteria

- [x] Component compiles without client/server boundary issues.
- [x] Icons are decorative with `aria-hidden`.
- [x] Progressbar exposes `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
- [x] Progress is clamped to 0-100.
- [x] Component has no local state and no store dependency.

## Risk Assessment

- Risk: arbitrary color classes conflict with design tokens.
  Mitigation: prefer semantic Tailwind tokens already present in the app.
- Risk: text gets cramped in Vietnamese at small widths.
  Mitigation: allow summary row wrapping under `sm`, hide badge text under `md`.
- Risk: adding CSS file creates style drift.
  Mitigation: use Tailwind in component first; add CSS only if class readability becomes poor.
