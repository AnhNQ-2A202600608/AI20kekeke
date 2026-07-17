---
phase: 1
title: Implement Hero Match
status: completed
priority: P1
dependencies: []
---

# Phase 1: Implement Hero Match

## Overview

Replace the current compact landing hero with a screenshot-matched EduGap hero while reusing existing logo, mascot, icons, Tailwind tokens, and route contracts.

## Requirements

- Functional: guest users landing on `/` see the screenshot-inspired first viewport and can still navigate to login/onboarding via existing links.
- Non-functional: responsive, no new package dependency, no fake production claims, no horizontal overflow.

## Architecture

Keep the route boundary unchanged. `frontend/app/page.tsx` continues to render `LandingPage`; the landing component owns the static hero mockup and below-fold sections.

## Related Code Files

- Modify: `frontend/components/landing/landing-page.tsx`
- Possibly modify: `frontend/components/landing/landing-cta.tsx`
- Read: `frontend/components/learning/learning-brand-mark.tsx`
- Read: `frontend/components/mascot/sofi-mascot-assets.ts`

## Implementation Steps

1. Rebuild the hero shell: background wash, header, nav, language control, and first-viewport spacing.
2. Implement screenshot-matched left copy, CTA pair, three trust chips, and used-by proof row.
3. Replace the existing `HeroProductPreview` with a laptop-style learning path mockup and Sofi image overlay.
4. Keep below-fold sections present but visually secondary so the first viewport resembles the reference.
5. Tighten responsive behavior for 375px, tablet, and desktop widths.

## Success Criteria

- [ ] Hero visually follows the screenshot composition and hierarchy.
- [ ] CTA links still point to `/login` and `#loop`.
- [ ] Mobile layout stacks cleanly with no clipped text or horizontal scroll.
