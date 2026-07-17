---
phase: 5
title: "Route Layout Verification"
status: in-progress
priority: P1
dependencies: [2, 3, 4]
---

# Phase 5: Route Layout Verification

## Overview

Verify the hardened UI across the user journey: landing -> login -> onboarding -> app learning -> quiz -> chat -> teacher/dashboard sample. This phase catches sizing regressions from the new button contract.

## Requirements

- Functional: target routes remain usable and do not clip primary actions.
- Non-functional: no avoidable horizontal scroll, no incoherent overlap, and no one-page workflow regression for quiz/hint/chat panels.

## Architecture

Use browser smoke tests and screenshots rather than snapshot tests unless a visual test harness already exists. The repo currently uses manual/browser verification more often than committed Playwright tests for these surfaces.

## Related Code Files

- Read/verify: all files modified by phases 2-4.
- Optional create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/260630-1935-web-design-guidelines-hardening/reports/verification.md`

## Implementation Steps

1. Run static gates:
   - `pnpm --dir frontend exec eslint app components lib`
   - `pnpm --dir frontend exec tsc --noEmit`
2. Run scans:
   - `rg -n "transition-all|alert\\(|backend|sandbox|agent-reasoning|RAG v2|\\.\\.\\.|<div[^>]*onClick" frontend/app frontend/components --glob "*.tsx"`
   - `rg -n "btn-3d|min-h-14|min-h-12|px-7|py-3" frontend/app frontend/components --glob "*.tsx"`
3. Browser verify at:
   - `375x844`
   - `768x1024`
   - `1366x768`
   - `1707x960`
4. Visit flows:
   - `/`
   - `/login`
   - `/onboarding`
   - `/app?tab=learn`
   - `/app?tab=chat`
   - start quiz and trigger hint popup/wrong-answer AI prompt
   - teacher sample tab if role/persona allows access.
5. Check button sizing:
   - primary CTA height `44-52px`
   - default icon button `40-44px`
   - dense menu/table action `32-40px`
   - no important action text clipped.
6. Record before/after screenshots or measured notes in `reports/verification.md`.

## Success Criteria

- [x] Lint and typecheck pass, or unrelated dirty-work failures are documented with exact file/line.
- [ ] Browser smoke covers all target routes and breakpoints.
- [x] No primary CTA clipped or hidden.
- [ ] Quiz hint and wrong-answer AI prompt still work after sizing migration.
- [ ] Chat slide viewer and history controls work by mouse and keyboard.
- [x] Verification report exists with commands, results, screenshots/notes, and residual risks.

## Risk Assessment

- Risk: existing dirty worktree creates unrelated failures.
  Mitigation: path-scope verification first, then broaden; document unrelated blockers.
- Risk: production data roles prevent teacher route verification.
  Mitigation: verify in demo/persona mode but label it as sample-role coverage.
