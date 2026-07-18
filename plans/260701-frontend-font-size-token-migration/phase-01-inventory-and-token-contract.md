---
phase: 1
title: "Inventory and Token Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1: Inventory and Token Contract

## Overview

Lock the semantic font-size token contract before touching frontend classes. This phase is additive only unless the docs update is accepted.

## Requirements

- Functional: define Tailwind v4 `--text-*` variables for every current arbitrary pixel size in production frontend scope.
- Non-functional: preserve exact rendered font sizes; no line-height or hierarchy change.

## Architecture

Tailwind v4 reads `--text-*` variables from `@theme` and generates matching `text-*` utilities. Because the app root uses `html { font-size: 18px; }`, tokens must use absolute `px` values in phase 1.

## Related Code Files

- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\app\globals.css`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\docs\frontend-design-tokens.md`
- Read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\outputs\frontend-font-size-token-proposal.md`

## Implementation Steps

1. Add the token variables from `plan.md` to the existing `@theme` block.
2. Document the token names, pixel values, and intended roles in `frontend/docs/frontend-design-tokens.md`.
3. Keep line-height, tracking, font weight, and font family outside the token variables.
4. Run a scan and confirm token coverage for every observed production `text-[Npx]` value.

## Success Criteria

- [ ] All observed production arbitrary sizes have one token.
- [ ] No component classes are replaced in this phase.
- [ ] Docs explain why phase 1 uses `px`, not default Tailwind `rem` utilities.

## Risk Assessment

Risk: tokens are named too narrowly and become hard to reuse. Mitigation: keep phase 1 role names broad enough for current surfaces, then split by component role in phase 2 cleanup only after screenshots.
