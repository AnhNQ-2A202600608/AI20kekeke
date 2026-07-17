---
phase: 5
title: "Visual Regression and Cleanup"
status: pending
priority: P2
dependencies: [4]
---

# Phase 5: Visual Regression and Cleanup

## Overview

Validate the completed token migration and only then decide whether to consolidate tokens by role.

## Requirements

- Functional: verify no unintended hard-coded production font-size classes remain.
- Non-functional: do not tune sizes until screenshot parity is accepted.

## Architecture

Phase 5 is a gate, not a redesign phase. Any role consolidation should be a follow-up plan or a clearly separate commit after phase 1 visual parity is proven.

## Related Code Files

- Read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\app\globals.css`
- Read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\docs\frontend-design-tokens.md`
- Read: all touched TSX files from phases 2-4
- Optional: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\public\mockup.html`

## Implementation Steps

1. Run a final `rg "text-\[[0-9.]+px\]"` scan in production frontend TSX scope.
2. Run `pnpm exec eslint` on changed files, then `pnpm exec tsc --noEmit --pretty false`.
3. Perform browser screenshots for `/login`, `/app`, quiz focus, Socratic chat, profile, mentor class insights, quiz editor, RAG audit, and Braintrust.
4. Document residual arbitrary sizes with explicit reasons, or migrate them.
5. Open a follow-up note for phase 2 semantic cleanup: split overloaded 9/10/11px roles only after screenshots.

## Success Criteria

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Screenshot review passes with no text overlap or overflow.
- [ ] Any remaining arbitrary font-size classes are listed and intentionally deferred.
- [ ] Plan validation questions are answered or recorded as blockers before `/ck:cook`.

## Risk Assessment

Risk: successful typecheck hides visual regressions. Mitigation: require screenshot checks because this migration is primarily visual behavior.
