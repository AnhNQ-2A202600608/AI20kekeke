---
phase: 5
title: Visual Validation
status: completed
priority: P1
dependencies:
  - 2
  - 3
  - 4
---

# Phase 5: Visual Validation

## Overview

Run focused compile/lint checks and browser visual validation for the synced pages. Fix layout regressions found during validation instead of weakening checks or accepting visual overlap.

## Requirements

- Functional: validate existing interactions still work.
- Non-functional: validate visual coherence, responsive behavior, and no text/control overlap.
- Evidence: capture screenshots for desktop and mobile states.
- Scope: do not broaden into unrelated quiz or backend fixes unless they block validation.

## Architecture

Use focused checks first, then broader checks only if touched files affect shared behavior.

Validation surfaces:
- `/app` learning page, to ensure target style did not regress.
- Profile tab.
- Socratic chat tab.
- Knowledge graph modal opened from launcher.

## Related Code Files

- Read/verify: `frontend/package.json`
- Verify touched files from phases 1-4.
- Capture outputs under `outputs/` if screenshot tooling is used.

## Implementation Steps

1. Run TypeScript check:
   ```bash
   cd frontend
   pnpm exec tsc --noEmit --pretty false --incremental false
   ```
2. Run focused ESLint on touched files:
   ```bash
   cd frontend
   pnpm exec eslint components/ui/learning components/dashboard/profile components/dashboard/socratic-chat app/components/dashboard-layout.tsx
   ```
3. Start dev server if needed:
   ```bash
   cd frontend
   pnpm dev
   ```
4. Use browser validation at minimum:
   - desktop `1440x900`
   - tablet/narrow `1024x768`
   - mobile `390x844`
5. Validate `/app` still matches the target screenshot style.
6. Validate profile:
   - student persona
   - chart tab switch
   - concept drawer open/close if accessible
7. Validate chat:
   - mode selector
   - message input layout
   - mobile sidebar
   - slide viewer if retrieved slide data is available
8. Validate graph:
   - trigger opens modal
   - zoom/pan controls visible
   - select node updates detail panel
   - close controls work
9. Fix any overlap, clipped text, invisible focus state, or broken scroll boundary found during screenshots.

## Success Criteria

- [ ] TypeScript check passes.
- [ ] Focused ESLint passes for touched files.
- [ ] Desktop and mobile screenshots show no incoherent overlap.
- [ ] `/app` target page did not regress while other pages were synced.
- [ ] Profile, chat, and graph retain existing interactions.
- [ ] Any known unrelated blocker is documented clearly instead of hidden.

## Risk Assessment

- Risk: repo-wide lint/build exposes unrelated dirty work. Mitigation: run focused checks first and document unrelated blockers.
- Risk: visual validation misses graph modal state. Mitigation: explicitly open modal before screenshot.
- Risk: mobile chat scroll lock breaks. Mitigation: validate body scroll and panel scroll separately.
