---
phase: 4
title: AI Action Dock
status: completed
priority: P2
dependencies:
  - 3
---

# Phase 4: AI Action Dock

## Overview

Replace the single generic bottom-right menu affordance on desktop with a small, discoverable AI action dock. Keep mobile conservative so AI controls do not cover the sticky CTA.

## Requirements

- Functional: expose 2-4 AI-related actions as small icon buttons on desktop.
- Functional: include Sofi coach and Ask AI as first-class actions.
- Functional: keep existing AI/chat opening behavior.
- Functional: mobile uses collapsed or bottom-safe placement.
- Non-functional: dock must not overlap CTA, issue badge, or content.
- Non-functional: icon buttons need accessible labels/tooltips.

## Architecture

The current learning page has `SofiCoachTrigger` and receives `onOpenAiCoach`. There may also be a global floating nav/menu outside `LearningPath`. Do not fight the global shell unless necessary. Prefer adding a learning-page AI dock inside the learning workspace with fixed positioning scoped to desktop breakpoints.

Possible actions:

- Sofi coach: opens `SofiCoachSheet`
- Ask AI: calls `onOpenAiCoach`
- Guidebook: calls `onSelectGuidebook` when available
- Explain selected skill: opens Sofi sheet with selected concept context

Recommended desktop dock: vertical stack of circular icon buttons near bottom-right, above the sticky/action area if present. Recommended mobile: keep one compact expandable AI button or place Sofi as an inline card below skills.

## Related Code Files

- Modify: `frontend/components/LearningPath.tsx`
- Possibly create: `frontend/components/learning/learning-ai-action-dock.tsx`
- Reuse: `frontend/components/learning/sofi-coach-sheet.tsx`
- Reuse: `frontend/components/learning/sofi-coach-trigger.tsx`

## Implementation Steps

1. Inventory current floating nav/menu source to avoid duplicate bottom-right controls.
2. Create an AI dock component only if the logic is more than a few buttons.
3. Render desktop icon buttons with `aria-label`, tooltip text, and clear focus rings.
4. Limit default visible actions to 3 unless a fourth has strong value.
5. On mobile, avoid a persistent icon cluster; use a single expandable control or inline Sofi trigger.
6. Test overlap with sticky CTA and issue badge.

## Success Criteria

- [ ] Desktop shows AI feature icons instead of one ambiguous learning menu button where applicable.
- [ ] Sofi coach opens the existing Sofi sheet.
- [ ] Ask AI still routes to the existing AI/chat surface.
- [ ] Mobile CTA remains easy to tap and unobstructed.
- [ ] All icon buttons have accessible names and visible focus states.

## Risk Assessment

Too many visible icons will create the same clutter the user wants to remove. Cap the dock to core AI actions and keep secondary actions inside the Sofi sheet.
