---
phase: 1
title: "Audit Baseline"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Audit Baseline

## Overview

Lock the current guideline violations into an actionable baseline before refactoring. This phase prevents subjective UI cleanup and gives later phases a measurable target.

## Requirements

- Functional: produce a route-by-route issue inventory for landing, login, onboarding, app shell, quiz, chat, and teacher/dashboard sample surfaces.
- Non-functional: no code changes except optional audit notes if the team wants to keep them under the plan directory.

## Architecture

Use the Vercel guideline scan as the source of rules. Map each finding to one of these buckets:

- accessibility and semantics
- button sizing and component drift
- product copy and fallback leakage
- demo/mock data exposure
- route layout and scroll ownership

## Related Code Files

- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/product/design-guidelines.md`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/globals.css`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/ui/learning/tactile-button.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/landing/*`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/login/page.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-page.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/*`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/**`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/btc-heatmap.tsx`

## Implementation Steps

1. Re-fetch the Vercel Web Interface Guidelines before implementing.
2. Run targeted `rg` scans:
   - `transition-all`
   - icon-only buttons using `title` but no `aria-label`
   - clickable `div`/`span`
   - `alert(`
   - `backend`, `sandbox`, `demo mode`, `agent`, `tool`, `RAG v2`
   - raw `.btn-3d`, `min-h-14`, `min-h-12`, `px-7`, `py-3`
3. Capture exact file/line findings in `plans/260630-1935-web-design-guidelines-hardening/reports/audit-baseline.md`.
4. Classify each item as P0/P1/P2:
   - P0: broken accessibility, misleading production data, destructive action without confirmation.
   - P1: sizing drift on primary routes, internal system copy, semantic mismatch.
   - P2: polish, transition cleanup, long-tail component drift.
5. Mark which files are already being changed by overlapping plans to avoid merge conflicts.

## Success Criteria

- [x] Baseline report exists and lists concrete file/line findings.
- [x] Each finding has severity and owner phase.
- [x] Button usage inventory identifies raw `.btn-3d` and one-off Tailwind button classes on target routes.
- [x] No implementation starts until the baseline is recorded.

## Risk Assessment

- Risk: audit grows too broad and blocks shipping.
  Mitigation: target only landing to onboarding to main app routes requested by the user.
- Risk: stale line numbers due to dirty worktree.
  Mitigation: regenerate baseline immediately before implementation.
