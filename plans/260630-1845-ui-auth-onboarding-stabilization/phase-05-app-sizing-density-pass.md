---
phase: 5
title: "App Sizing Density Pass"
status: in-progress
priority: P1
dependencies: [1, 2, 4]
effort: "high"
---

# Phase 5: App Sizing Density Pass

## Overview

Make the app surfaces fit the product direction: one-screen learning workspace where possible, compact controls, clear explanations only where needed, and no oversized buttons/cards crowding the viewport.

## Requirements

- Functional: learning, skills, profile, chat, onboarding, and landing remain usable at target breakpoints.
- Layout: define scroll ownership per surface; avoid nested uncontrolled scroll and clipped fixed CTAs.
- Density: reduce oversized buttons/cards where they compete with content; preserve accessible hit targets.
- Accessibility: no text overlap; focus outlines remain visible; tap targets remain practical on mobile.

## Architecture

Keep layout responsibility close to each surface:

- `DashboardLayout` owns app shell height, background, sidebars, and tab wrappers.
- `LearningPath` owns the learning workspace grid and mobile bottom action rail.
- `AppTopNav`, `MobileLearningTopBar`, and `AppProfileShortcut` own compact navigation/control sizing.
- Individual cards own internal density variants. Prefer existing `density="compact"` props where present before adding new variants.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/mobile-learning-top-bar.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/app/app-top-nav.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/app/app-profile-shortcut.tsx`
- Modify if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/desktop-learning-sidebar.tsx`
- Modify if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/skills-practice-tab.tsx`
- Modify if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/index.tsx`
- Modify if needed: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-page.tsx`

## Implementation Steps

1. Define target breakpoints from baseline:
   - mobile: 390x844.
   - tablet: 768x1024.
   - laptop: 1366x768.
   - desktop: 1440x900.
2. For each surface, record current scroll owner:
   - app shell.
   - tab main.
   - card list area.
   - fixed bottom CTA.
3. Fix shell height first:
   - avoid `min-h-screen` plus fixed footer causing overflow where app should be `100dvh`.
   - keep chat full-bleed lock behavior isolated.
4. Fix top/nav controls:
   - profile shortcut max width and dropdown position.
   - metric pills not crowding title.
   - mobile top bar does not wrap into two tall rows unless needed.
5. Fix learning workspace density:
   - keep day sidebar and main content within viewport on laptop.
   - use compact variants for mission and skill cards.
   - constrain bottom action rail so it does not cover content.
6. Fix onboarding/footer sizing if baseline shows controls too large:
   - keep footer buttons compact.
   - allow content section to scroll while header/footer stay stable.
7. Fix landing CTAs as part of Phase 2, then re-check here with app surfaces.
8. Run browser viewport pass:
   - take screenshots or DOM snapshots at each breakpoint.
   - assert no primary CTA is clipped.
   - assert no text overlaps a prior/subsequent element.
9. Only after layout passes, run `npm run lint` and typecheck/build if blocker resolved.

## Success Criteria

- [x] App `learn` fits within laptop viewport with a clear single primary scroll area.
- [ ] App `skills`, `profile`, and `chat` have no incoherent overlap at target breakpoints.
- [ ] Onboarding wizard keeps primary action visible and does not make buttons dominate the viewport.
- [ ] Landing CTAs and app CTAs use comparable density.
- [ ] Profile/metric controls do not overflow top nav.
- [ ] Mobile bottom action rail does not hide selected content or become impossible to tap.
- [ ] Browser screenshots/snapshots are captured or summarized for all target breakpoints.
- [ ] Lint passes; typecheck/build status is reported.

## Risk Assessment

- Risk: Reducing button size harms accessibility. Mitigation: keep minimum tap targets near 44px while reducing padding/text verbosity.
- Risk: Fixing one viewport breaks another. Mitigation: no phase completion without all four breakpoints.
- Risk: Global CSS changes create broad regressions. Mitigation: prefer component-local class changes; touch `globals.css` only for reusable token-level issues.
- Risk: Hidden scrollbars hide content discoverability. Mitigation: preserve scroll functionality and avoid relying on invisible overflow for core actions.
