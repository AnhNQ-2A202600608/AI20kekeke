---
title: "Frontend Font Size Token Migration"
description: "Refactor frontend arbitrary font-size classes into semantic Tailwind v4 typography tokens without changing visual output in phase 1."
status: pending
priority: P2
branch: "blue"
tags: [refactor, frontend, tech-debt]
blockedBy: []
blocks: []
created: "2026-07-01"
createdBy: "ck:plan"
source: skill
---

# Frontend Font Size Token Migration

## Overview

Create a typography token contract for the frontend before replacing hard-coded `text-[Npx]` classes. Phase 1 must preserve exact current pixels because [frontend/app/globals.css](../../frontend/app/globals.css) sets `html { font-size: 18px; }`, so default Tailwind `rem` utilities are not a safe visual match.

## Source Basis

- User attachment: `C:\Users\LENOVO\.codex\attachments\41ad0b1d-ff36-4c4b-8e08-ae32982ee7ac\pasted-text.txt`
- Existing proposal artifact: [outputs/frontend-font-size-token-proposal.md](../../outputs/frontend-font-size-token-proposal.md)
- Current code scan: `rg --no-filename -o "!?[a-z:!]*text-\[[0-9.]+px\]" frontend\app frontend\components frontend\docs`
- Repomix artifacts for review: [outputs/frontend-ui-fontsize-repomix.md](../../outputs/frontend-ui-fontsize-repomix.md), [outputs/frontend-repomix.md](../../outputs/frontend-repomix.md)

## Hard Validation Summary

- Verified: `frontend/app/globals.css` owns Tailwind v4 `@theme` and root font-size.
- Verified: arbitrary font-size usage is concentrated around dense dashboard, app shell, quiz, learning, Socratic chat, and login surfaces.
- Verified: dominant values are `10px` and `9px`, not title sizes. These are dense UI labels/captions, so a visual-preserving token migration must be incremental.
- Failed old proposal assumption: current scan includes `25px`, `28px`, and `36px` in [frontend/app/login/page.tsx](../../frontend/app/login/page.tsx), so the token table must include those display sizes or intentionally exclude them.
- Decision: keep phase 1 one-to-one. Do not merge adjacent sizes, change line-height, convert to `text-xs`, or redesign hierarchy.

## Token Contract Draft

Add only font-size variables to the existing `@theme` block in [frontend/app/globals.css](../../frontend/app/globals.css):

```css
@theme {
  --text-annotation-micro: 7px;
  --text-progress-micro: 7.5px;
  --text-badge-micro: 8px;
  --text-kicker-micro: 9px;
  --text-helper-micro: 9.5px;
  --text-caption-tight: 10px;
  --text-card-title-micro: 10.5px;
  --text-label-tight: 11px;
  --text-node-label: 12px;
  --text-body-dense: 13px;
  --text-control-label: 14px;
  --text-body-compact: 15px;
  --text-form-base: 16px;
  --text-question-title-sm: 22px;
  --text-auth-title-sm: 25px;
  --text-auth-title-md: 28px;
  --text-question-title-lg: 24px;
  --text-display-auth: 36px;
}
```

Do not add `--text-*--line-height` in phase 1. Existing `leading-*`, `tracking-*`, font family, weight, breakpoints, and `!` modifiers stay unchanged.

## Current Scan Snapshot

| Class | Count |
|---|---:|
| `text-[10px]` | 316 |
| `text-[9px]` | 176 |
| `text-[11px]` | 157 |
| `text-[8px]` | 38 |
| `text-[13px]` | 25 |
| `text-[12px]` | 10 |
| `text-[7px]` | 8 |
| `text-[16px]` | 5 |
| `text-[14px]` | 3 |
| `text-[7.5px]`, `text-[9.5px]`, `text-[10.5px]`, `text-[15px]`, `text-[22px]`, `text-[25px]`, `text-[28px]`, `text-[36px]`, `sm:text-[22px]`, `lg:text-[24px]`, `md:text-[11px]`, `!text-[8px]`, `!text-[15px]` | 1 each |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Inventory and Token Contract](./phase-01-inventory-and-token-contract.md) | Pending |
| 2 | [Pilot Migration](./phase-02-pilot-migration.md) | Pending |
| 3 | [Core Learning Flow Migration](./phase-03-core-learning-flow-migration.md) | Pending |
| 4 | [Dense Dashboard Migration](./phase-04-dense-dashboard-migration.md) | Pending |
| 5 | [Visual Regression and Cleanup](./phase-05-visual-regression-and-cleanup.md) | Pending |

## Cross-Plan Dependencies

None detected. This plan depends on no code implementation plan, but it should not be cooked while another active UI refactor owns the same files.

## Acceptance Criteria

- [ ] Typography token names are documented before code replacement.
- [ ] `text-[Npx]` replacements preserve exact pixel output.
- [ ] `public/mockup.html` is excluded unless confirmed production-relevant.
- [ ] `/login`, `/app`, quiz focus mode, learning dashboard, Socratic chat, profile, mentor class insights, quiz editor, RAG audit, and Braintrust screenshots are checked.
- [ ] `pnpm exec eslint ...` and `pnpm exec tsc --noEmit --pretty false` pass from `frontend/`.
- [ ] Final scan reports no unintended arbitrary font-size classes in production TSX files, except explicitly deferred cases.

## Validation Log

### Verification Results

- Tier: Full, because the migration spans many frontend areas.
- Claims checked: 8
- Verified: 7
- Failed: 1
- Unverified: 0
- Evidence:
  - `frontend/app/globals.css` contains `html { font-size: 18px; }`.
  - `frontend/app/globals.css` contains existing Tailwind v4 `@theme` variables.
  - `frontend/app/login/page.tsx` contains `text-[16px]` input/form sizing and display values above the original proposal.
  - `frontend/components/quiz/quiz-question-view.tsx` contains responsive question title classes `sm:text-[22px]` and `lg:text-[24px]`.
  - `frontend/components/dashboard/mentor/class-insights-tab.tsx` is the largest dense dashboard hotspot.
  - `frontend/public/mockup.html` contains many arbitrary classes but is a static public mockup/reference.
  - Package manager guide confirms frontend validation uses `pnpm`.
  - Failed prior assumption: proposal did not include all current display values (`25px`, `28px`, `36px`).

### Critical Questions For User

1. Should `public/mockup.html` be migrated?
   - Recommended: defer it unless it is production-visible.
   - Alternative: migrate it after TSX files to keep reference parity.

2. Should `25px`, `28px`, and `36px` login display sizes become permanent tokens?
   - Recommended: include them in phase 1 to avoid residual arbitrary classes, then consolidate after screenshots.
   - Alternative: leave them arbitrary until auth visual design is revisited.

3. Should phase 1 preserve exact pixels even if some sizes feel too small?
   - Recommended: preserve exact pixels first, then resize only after screenshot approval.
   - Alternative: combine token migration with visual resizing, but regression risk is much higher.

### Whole-Plan Consistency Sweep

- No contradiction between overview and phases.
- Token table includes all current scanned values from production frontend TSX/docs scope.
- Phase order matches risk: contract first, isolated pilot second, high-value flows third, dense dashboards fourth, visual cleanup last.
