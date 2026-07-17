---
phase: 2
title: "Button Sizing System"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Button Sizing System

## Overview

Create a single button sizing contract and migrate high-traffic buttons to it. This is the core fix for inconsistent button scale.

## Requirements

- Functional: one shared React button primitive supports standard sizes, variants, icon-only buttons, loading state, disabled state, and accessible labels.
- Non-functional: preserve tactile 3D interaction and existing app visual language; do not introduce a new component library.

## Architecture

Recommended location:

- Prefer move/alias from `frontend/components/ui/learning/tactile-button.tsx` to `frontend/components/ui/tactile-button.tsx`.
- Keep compatibility export from old path so existing imports do not break.
- Keep color tokens and low-level CSS variables in `frontend/app/globals.css`.
- Move button sizing/composition into React props, not global class strings.

Sizing API:

```tsx
<TactileButton variant="primary" size="md">Bắt đầu học</TactileButton>
<TactileButton variant="neutral" size="sm">Quay lại</TactileButton>
<TactileButton variant="ghost" size="icon-md" aria-label="Đóng">...</TactileButton>
```

Approved sizes:

| Size | Height | Use |
| --- | --- | --- |
| `xs` | `32-36px` | table/action rows, dense teacher tools |
| `sm` | `36-40px` | secondary actions, menus |
| `md` | `44px` | default app actions |
| `lg` | `48-52px` | primary onboarding/login/quiz footer action |
| `icon-sm` | `36px` square | dense toolbar |
| `icon-md` | `40-44px` square | default toolbar/nav |

## Related Code Files

- Modify/Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/ui/tactile-button.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/ui/learning/tactile-button.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/globals.css`
- Modify target routes only after primitive is stable:
  - `frontend/components/landing/landing-cta.tsx`
  - `frontend/app/login/page.tsx`
  - `frontend/components/LoginScreen.tsx`
  - `frontend/components/onboarding/onboarding-page.tsx`
  - `frontend/components/quiz/quiz-question-view.tsx`
  - `frontend/components/dashboard/socratic-chat/components/chat-input-bar.tsx`
  - `frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx`

## Implementation Steps

1. Extend `TactileButton` props:
   - `variant`
   - `size`
   - `isLoading`
   - `leftIcon` / `rightIcon` if local pattern accepts it, otherwise keep children flexible.
   - `aria-label` required by convention for icon sizes.
2. Define size class map with stable dimensions.
3. Replace direct `.btn-3d` on high-traffic route CTAs with the shared component.
4. Do not migrate every low-risk dashboard button in one pass; leave an inventory for later.
5. Update `docs/product/design-guidelines.md` button sizing section only if implementation changes the documented baseline.
6. Search for remaining `btn-3d`, `min-h-14`, `min-h-12`, `px-7`; classify remaining occurrences as allowed exceptions or follow-up.

## Success Criteria

- [x] Shared `TactileButton` has explicit size/variant maps.
- [x] Primary route CTAs use the shared button primitive or a documented exception.
- [x] No audited primary action defaults above `52px` height.
- [x] Icon buttons migrated in this phase expose `aria-label`.
- [x] Existing tactile visual style remains recognizable.

## Risk Assessment

- Risk: moving component path breaks imports.
  Mitigation: keep re-export from old `ui/learning` path.
- Risk: changing `.btn-3d` globally causes broad regressions.
  Mitigation: avoid changing global defaults until component migration is complete; prefer component usage.
- Risk: too many visual diffs.
  Mitigation: migrate route-by-route and screenshot each target route.
