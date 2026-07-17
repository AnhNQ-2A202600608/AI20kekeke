---
phase: 3
title: "Garden Main Area"
status: pending
priority: P1
dependencies: [2]
---

# Phase 3: Garden Main Area

## Overview

Replace the generic Practice tab card matrix with a garden-themed main area: header, day filter, Sofi focus, garden bed, seed cards, and progress strip.

## Requirements

- Functional: user can filter by day, select skill, see recommended skill, and start/resume practice.
- Non-functional: accessible buttons, no color-only states, no horizontal overflow, no layout shift from hover or selection.

## Architecture

Suggested component split:

```text
frontend/components/dashboard/practice-garden/
  practice-garden-page.tsx
  practice-day-filter.tsx
  sofi-focus-card.tsx
  skill-garden-bed.tsx
  practice-seed-card.tsx
  garden-empty-state.tsx
```

Keep components presentational. `SkillsPracticeTab` can own fetching manifests and store actions until a later refactor proves useful.

Desktop layout:

```css
.practice-garden-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(18rem, 28vw, 23rem);
  gap: 1rem;
}
```

Mobile:

```css
@media (max-width: 1100px) {
  .practice-garden-layout { grid-template-columns: 1fr; }
}
```

## Related Code Files

| Action | Absolute path | Purpose |
|---|---|---|
| Modify | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\skills-practice-tab.tsx` | Mount Garden page and keep store behavior. |
| Create | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\practice-garden-page.tsx` | Main layout component. |
| Create | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\practice-seed-card.tsx` | Garden skill card. |
| Create | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\skill-garden-bed.tsx` | Garden bed wrapper and responsive card grid. |
| Reuse | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mastery-seed-badge.tsx` | Growth stage visual. |
| Reuse | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mastery-soil-strip.tsx` | Soil progress visual. |

## Implementation Steps

1. Build page shell with header copy:
   - title: `Vườn kỹ năng`
   - subtitle: `Sofi gợi ý những kỹ năng nên chăm hôm nay.`
2. Convert existing day timeline into compact chips with active, review, empty, and all-days states.
3. Add Sofi focus card with recommended skill and concise reason.
4. Build garden bed container using CSS background bands, not heavy images.
5. Build `PracticeSeedCard`:
   - seed badge
   - title and description
   - state label
   - mastery percent
   - soil strip
   - associated set count
   - CTA label
6. Move per-set practice list into selected detail or rail, not every card by default.
7. Preserve active session banner but restyle it as a garden task strip.
8. Add empty state for no skills in selected day.

## Success Criteria

- [ ] Practice tab immediately reads as Skill Garden.
- [ ] Skill cards remain scannable; no large repeated dashboard cards.
- [ ] Recommended skill is above the fold on desktop and mobile.
- [ ] Clicking a card selects it without opening a modal.
- [ ] CTA behavior matches existing Practice tab.

## Risk Assessment

- Risk: decorative garden background competes with readable content.
  Mitigation: keep garden as wrapper; card content stays on high-contrast surfaces.
- Risk: too many rounded cards create generic SaaS feel.
  Mitigation: use tactile panels and soil/seed signature, not nested cards.
 
## Accessibility Notes

- Every skill card is a button with `aria-pressed` or `aria-selected`.
- State labels include text: `Cần tưới lại`, `Đang nảy mầm`, `Đã nở hoa`, `Sắp mở`.
- Focus rings use existing `primary-green/25` pattern.
