# Landing Page App-Scale Redesign Plan

## Status

Implemented on 2026-06-30.

## Context

The landing page still uses a large marketing scale while the active `/app` workspace now uses a compact, dense learning-workspace scale.

Evidence from current code:

- `frontend/components/landing/landing-page.tsx` uses `md:text-6xl`, `md:text-5xl`, `py-16 md:py-20`, `rounded-[28px]`, `rounded-[24px]`, and large hero/card spacing.
- `frontend/components/landing/landing-cta.tsx` uses `min-h-12 px-5`, larger than the app button baseline.
- `frontend/components/landing/adaptive-proof-simulator.tsx` and `frontend/components/landing/teacher-report-preview.tsx` repeat the same oversized section/card patterns.
- `docs/product/design-guidelines.md` defines the active app sizing baseline: headings `20-24px`, body `14-16px`, buttons `min-h-10`/`min-h-11`, cards `p-3`/`p-4`, sections `py-8 md:py-10`, cards `rounded-2xl`.

## Root Cause

Landing was implemented as a hero-centric marketing page after the product UI moved to a compact app workspace. Its component scale was not migrated to the app sizing baseline, so public entry screens feel disconnected from the current Codebay/EduGap app.

## Scope

Modify:

- `frontend/components/landing/landing-page.tsx`
- `frontend/components/landing/landing-cta.tsx`
- `frontend/components/landing/adaptive-proof-simulator.tsx`
- `frontend/components/landing/teacher-report-preview.tsx`

Read/compare:

- `frontend/components/app/app-top-nav.tsx`
- `frontend/components/app/app-metric-pill.tsx`
- `frontend/components/ui/learning/tactile-button.tsx`
- `frontend/components/ui/learning/tactile-panel.tsx`
- `docs/product/design-guidelines.md`

Out of scope:

- Auth behavior changes.
- Onboarding behavior changes.
- Backend/API changes.
- New asset generation unless existing assets cannot support the redesign.

## Design Direction

Use the landing page as a compact product-workspace preview, not a large editorial hero.

- Keep Sapia/EduGap tactile learning style.
- Preserve project colors and assets.
- First viewport should show brand, login CTA, concise value proposition, and a product-like preview.
- Reduce copy weight and section height so the page feels connected to `/app`.
- Use app-like components: compact metric pills, small section headers, dense cards, visible evidence rows.

## Implementation Phases

### Phase 1: Normalize Landing Scale

- Header: reduce desktop height to `56-64px`; mascot/logo smaller; nav gaps tighter.
- Hero title: cap at `text-2xl md:text-4xl`, not `md:text-6xl`.
- Hero copy: `text-sm md:text-base`, shorter line-height.
- CTA buttons: `min-h-10` or `min-h-11`, `text-xs`/`text-sm`, `px-3`/`px-4`.
- Hero panel: replace `rounded-[28px]` with `rounded-2xl`; reduce image/card min-height.

### Phase 2: Convert Sections to Dense Workspace Bands

- Replace `py-16 md:py-20` with `py-8 md:py-10`.
- Replace `max-w-7xl px-5 md:px-8` with app-like bounded shell, preferably `max-w-[82rem] px-3 md:px-4`.
- Section headings: `text-xl md:text-2xl` or at most compact `md:text-3xl` for section anchors.
- Body copy: `text-sm md:text-base`.

### Phase 3: Compact Cards and Proof Widgets

- Replace `p-5`, `p-6`, `gap-8`, `gap-5` with `p-3`, `p-4`, `gap-3`, `gap-4`.
- Replace `rounded-[24px]` and `rounded-[28px]` with `rounded-xl`/`rounded-2xl`.
- Keep tactile bottom borders, but reduce repeated heavy borders where layout becomes visually loud.
- Make the proof simulator feel like an embedded app card: compact quiz row, evidence chips, and small metric cells.
- Make teacher preview feel like a dashboard excerpt, not a marketing card wall.

### Phase 4: Responsive and Accessibility Pass

- Verify at `375`, `768`, `1024`, and `1707x960`.
- No horizontal scroll.
- Touch targets remain at least `44px`.
- Focus-visible states remain visible.
- Meaningful images keep alt text; decorative images use empty alt.
- Text does not overlap or overflow cards/buttons.

### Phase 5: Verification

- Run `cd frontend && npm run lint`.
- Run `cd frontend && npx tsc --noEmit`.
- Use browser verification on `/` in guest state.
- Check viewport metrics:
  - Header height `56-64px`.
  - Landing CTA height `40-50px`.
  - Hero title desktop no larger than `md:text-4xl` equivalent.
  - Main sections use `py-8 md:py-10`.
  - Cards mostly `p-3`/`p-4` and `rounded-2xl`.

## Acceptance Criteria

- Landing visually matches the compact `/app` workspace density.
- No usage remains in landing components for `md:text-6xl`, `md:text-5xl`, `py-16`, `md:py-20`, `rounded-[28px]`, broad `p-6`, or default CTA `min-h-12`.
- Public landing still clearly communicates:
  - adaptive quiz,
  - Socratic RAG,
  - citation/evidence,
  - teacher reporting,
  - academic integrity.
- Guest can navigate to login from header and CTAs.
- Landing remains responsive and accessible across mobile and desktop.

## Implementation Notes

- Updated `frontend/components/landing/landing-page.tsx` to use the app-scale shell, compact header, smaller hero, product preview imagery, dense loop/integrity sections, and compact final CTA.
- Replaced the old SVG `SofiMascot` usage in landing with the current image-based `LearningBrandMark` and `SofiStateMascot` assets.
- Updated `frontend/components/landing/landing-cta.tsx` so CTA buttons use `min-h-11`, `px-4`, `text-sm`, and app-style icon sizing.
- Updated `frontend/components/landing/adaptive-proof-simulator.tsx` and `frontend/components/landing/teacher-report-preview.tsx` to use compact dashboard-card sizing and reduced section spacing.
- Updated `frontend/app/login/page.tsx` so the standalone login page uses the current logo/mascot assets and app-scale input/card/button sizing.
- Updated `frontend/components/LoginScreen.tsx` so the in-app login/signup modal no longer shows the old SVG mascot.
- Verified no landing component keeps `md:text-6xl`, `md:text-5xl`, `py-16`, `md:py-20`, `rounded-[28px]`, broad `p-6`, or default CTA `min-h-12`.
- Verified no `SofiMascot`, `rounded-[28px]`, `min-h-14`, `min-h-12`, `text-5xl`, `text-6xl`, `md:text-5xl`, `md:text-6xl`, `py-16`, or `md:py-20` remains in `frontend/components/landing`, `frontend/app/login/page.tsx`, or `frontend/components/LoginScreen.tsx`.
- Verified server-rendered `/login` HTML contains the new `logo-cropped` and `edugap-fox` assets.
- `npm run lint` passed in `frontend/`.
- `npx tsc --noEmit` passed in `frontend/`.
- Browser opened `http://localhost:3000/`, but the current in-app browser profile is already logged in and route `/` redirects to `/app`; guest visual verification could not be completed in that browser profile without clearing the user's local auth state.
