---
phase: 2
title: "Landing Theme Alignment"
status: in-progress
priority: P1
dependencies: [1]
effort: "medium"
---

# Phase 2: Landing Theme Alignment

## Overview

Update the landing page so it feels like the same product as the current app shell: tactile EduGap theme, Sofi/Code Bay assets, app-background treatment, compact CTAs, and copy that still explains the institution/student value clearly.

## Requirements

- Functional: `/` remains the unauthenticated landing; logged-in users still route into `/app`; CTAs still route to `/login` or anchored sections.
- Visual: first viewport uses current app assets/theme rather than stale marketing cards; no dark/glass legacy tone; hero leaves a hint of the next section on desktop and mobile.
- Accessibility: links have stable names, focus states remain visible, text does not overlap or clip.

## Architecture

Keep the landing split under `frontend/components/landing/`. Reuse global tokens and assets. Do not create a separate landing design system. If shared visual snippets are needed, extract small local components inside landing files first; move to shared `components/app/` only if another app surface already needs the same primitive.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/landing/landing-page.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/landing/landing-cta.tsx`
- Modify if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/landing/adaptive-proof-simulator.tsx`
- Modify if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/landing/teacher-report-preview.tsx`
- Read/reuse assets: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/public/app-backgrounds/`
- Read/reuse assets: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/public/mascot/`
- Read/reuse assets: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/public/learning-scenery/`
- Read/reuse tokens: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/globals.css`

## Implementation Steps

1. Compare current `/` against `learn`/`profile` app shell visuals from baseline.
2. Replace landing hero's generic right-side chat card with a product-authentic scene:
   - use Code Bay/app background or learning scenery asset.
   - show real app concepts: mastery, Socratic hint ladder, onboarding, teacher signal.
   - keep text over/within the scene without nested-card clutter.
3. Normalize CTA sizing:
   - primary and secondary CTAs no taller than current app primary controls.
   - use icons for clear actions.
   - avoid oversized pill/card treatments.
4. Align section surfaces:
   - use `bg-background`, `surface-container-*`, `gray-border`, and tactile border-bottom depth consistently.
   - remove one-off dark bands unless they serve contrast and still match app.
5. Keep narrative concise:
   - hero answers "what is EduGap now?"
   - lower sections explain adaptive loop, onboarding/personalization, and teacher report.
6. Verify sticky header does not consume too much vertical space on mobile.
7. Re-run `/` desktop/mobile screenshots and compare to baseline.

## Success Criteria

- [x] Landing first viewport clearly matches the current app's tactile green/cream/asset-heavy system.
- [x] First viewport still communicates Adaptive-first AI Tutor, not generic chatbot.
- [ ] `/` has no incoherent overlap at 390x844, 768x1024, 1366x768, and 1440x900.
- [x] CTAs are compact and clickable; no text spills outside buttons.
- [x] Logged-in `/` to `/app` behavior remains intact.
- [x] `npm run lint` still passes after landing edits.

## Risk Assessment

- Risk: Landing becomes only decorative and loses product clarity. Mitigation: keep the adaptive loop and teacher signal visible in the first two sections.
- Risk: New image usage increases layout shift. Mitigation: use Next `Image` with stable dimensions or background containers with fixed aspect ratios.
- Risk: Overfitting to desktop. Mitigation: mobile screenshot is required before phase completion.
