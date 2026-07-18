# Phase 03 — Docs UI and Visual Design

## Context Links

- Plan: `plan.md`
- Design guidelines: `docs/product/design-guidelines.md`
- Landing validation: `plans/260619-1011-landing-lecturer-admin-ui-validation/plan.md`

## Overview

Priority: Medium  
Status: Complete

Make docs feel like a premium Higher-Ed AI Tutor knowledge base: readable, calm, adaptive-first, and not generic AI chatbot docs.

## Key Insights

- Current design direction uses vibrant learning tokens and tactile interactions.
- Docs should be calmer than student learning UI, but still aligned.
- Purple/indigo/magenta are banned as brand accents in current design guidelines.

## Requirements

Functional:
- Sidebar navigation visible on desktop.
- Content-first reading area.
- Optional right-side table of contents if supported.
- Clear CTA/path cards on docs landing.

Non-functional:
- WCAG AA contrast.
- Keyboard-visible focus states.
- No emoji structural icons.
- No decorative motion unless meaningful.

## Architecture

Docs UI hierarchy:

```text
Header/search
└── Docs shell
    ├── Sidebar navigation
    ├── Main MDX content
    └── Page TOC (desktop optional)
```

## Related Code Files

Modify:
- `frontend/app/docs/layout.tsx`
- `frontend/app/docs/[[...slug]]/page.tsx`
- global styles only if required by Fumadocs

Create:
- Small docs landing cards/components only if route file becomes too large

Delete:
- None

## Implementation Steps

1. Apply Fumadocs docs layout primitives.
2. Use existing color tokens from design guidelines where available.
3. Keep docs content width readable: about 65–75 characters.
4. Add quick path cards for Product, Engineering, Domain Knowledge, Guides.
5. Use Lucide/vector icons if icons are needed.
6. Verify responsive behavior at small/mobile width. Status: Complete

## Todo List

- [x] Add docs shell layout.
- [x] Add landing quick-path sections.
- [x] Ensure sidebar/main content responsive behavior.
- [x] Check contrast/focus/touch targets.

## Success Criteria

- Docs page is visually aligned with project design guidelines.
- No purple/indigo/magenta brand accents.
- Page remains readable on mobile and desktop.
- Structural icons are vector icons, not emoji.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Docs becomes too playful | Use calm surfaces, strong typography, limited tactile effects |
| UI divergence from app | Reuse existing tokens/classes where practical |
| Accessibility gaps | Validate keyboard focus and contrast |

## Security Considerations

- Do not show internal-only operational details by default.
- Avoid linking to private systems unless explicitly intended.

## Next Steps

Proceed to validation and handoff.

## Unresolved Questions

- Should docs landing expose internal engineering docs publicly, or keep them dev-only later?
