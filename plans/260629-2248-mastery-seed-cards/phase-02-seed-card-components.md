# Phase 2: Seed Card Components

Status: completed

## Requirements

- Create reusable presentational components, not one-off markup in sidebar files.
- Keep sizing stable to avoid layout shift.
- Use assets for seed/soil only; render text, chip, percent, focus rings with CSS.

## Proposed Files

- `frontend/components/learning/mastery-seed-badge.tsx`
- `frontend/components/learning/mastery-soil-strip.tsx`
- `frontend/components/learning/mastery-seed-day-card.tsx`
- `frontend/components/learning/mastery-seed-skill-card.tsx`

## Component Contracts

- `MasterySeedBadge`
  - `progress: number`
  - `state?: 'locked' | 'review'`
  - `size?: 'xs' | 'sm' | 'md'`
  - `label: string`
- `MasterySoilStrip`
  - `progress: number`
  - `state?: 'locked' | 'review'`
  - `label: string`
- `MasterySeedDayCard`
  - `dayNumber`, `title`, `topic`, `progress`, `stateLabel`, `selected`, click props
- `MasterySeedSkillCard`
  - `title`, `progress`, `stateLabel`, `selected`, compact props

## Validation

- Snapshot visually in isolation through `/app`.
- Confirm focus-visible styles still work on buttons.

## Risks

- Too many nested components can make quick iteration slower. Keep component boundaries shallow and props explicit.
