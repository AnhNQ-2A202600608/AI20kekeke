---
phase: 2
title: "Pilot Migration"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2: Pilot Migration

## Overview

Replace hard-coded font-size classes in isolated, visually representative components first. Use this to prove the mapping is visually neutral.

## Requirements

- Functional: replace exact class fragments only, including responsive and important modifiers.
- Non-functional: no spacing, layout, color, weight, or line-height changes.

## Architecture

Pilot scope covers auth/form text and micro learning cards because they exercise both display and tiny dense sizes without touching the largest mentor dashboard file first.

## Related Code Files

- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\app\login\page.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\practice-seed-card.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mastery-seed-day-card.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mastery-seed-skill-card.tsx`

## Implementation Steps

1. Replace `text-[Npx]` with the matching token class only in pilot files.
2. Preserve modifiers: `!text-[8px]` becomes `!text-badge-micro`, `md:text-[11px]` becomes `md:text-label-tight`.
3. Run focused grep for residual arbitrary font sizes in pilot files.
4. Capture screenshots for `/login` and the learning/practice card surfaces.

## Success Criteria

- [ ] Pilot files have no unintended arbitrary font-size classes.
- [ ] Form/input text remains at least 16px.
- [ ] Screenshots show no text clipping, button overflow, or hierarchy drift.

## Risk Assessment

Risk: token names make future designers think values are resize permissions. Mitigation: document phase 1 as visual preservation, not visual tuning.
