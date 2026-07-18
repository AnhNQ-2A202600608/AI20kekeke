---
phase: 5
title: "Responsive Verification"
status: completed
priority: P1
dependencies: [2, 3, 4]
---

# Phase 5: Responsive Verification

## Overview

Verify the focus-mode refactor with static checks, responsive screenshots, and interaction checks across the smallest target viewport and common mobile sizes.

## Requirements

- Functional: complete an MCQ path from answer to next question; open/close AI Tutor; open report issue; request hint.
- Non-functional: lint/type/build pass; no horizontal scroll; no incoherent overlap; no blank or clipped primary CTA.

## Architecture

Use the narrowest useful automated and manual checks:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- local dev server visual checks
- Playwright or browser screenshot checks if project tooling is available

Do not add heavy E2E infrastructure unless it already exists or the checks cannot be performed reliably.

## Related Code Files

- Read/verify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/package.json`
- Optional create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/scripts/verify-mobile-quiz.mjs` only if a reusable screenshot check is justified.
- Verify: files modified in phases 2-4.

## Implementation Steps

1. Run lint and typecheck after UI changes.
2. Run production build after focused checks pass.
3. Start local frontend dev server.
4. Check these viewports:
   - `240x465`
   - `360x800`
   - `390x844`
   - desktop width at least `1280x800`
5. For each mobile viewport, verify:
   - initial question
   - selected answer submitted
   - correct feedback
   - wrong feedback
   - AI Tutor sheet
   - footer CTA reachability
6. Capture screenshots or notes under the plan reports folder if visual bugs require follow-up.

## Success Criteria

- [x] `npm run lint` passes in `frontend/`.
- [x] `npx tsc --noEmit` passes in `frontend/`.
- [x] `npm run build` passes in `frontend/`.
- [x] `240x465` has no horizontal scroll, overlap, or clipped `Tiếp tục`.
- [x] `360x800` and `390x844` show stable post-answer feedback.
- [x] Desktop quiz remains usable.
- [x] Verification notes are added to `plans/260629-1434-mobile-first-quiz-focus-mode/reports/verification.md`.

## Risk Assessment

- Risk: screenshots pass but touch ergonomics fail. Mitigation: interact with buttons, not just inspect static images.
- Risk: build is slow or blocked by unrelated failures. Mitigation: report exact failing command and distinguish unrelated pre-existing failures from plan regressions.
