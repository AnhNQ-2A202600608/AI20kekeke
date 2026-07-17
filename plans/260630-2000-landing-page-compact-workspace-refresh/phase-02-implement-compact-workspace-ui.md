---
phase: 2
title: "Implement Compact Workspace UI"
status: completed
priority: P2
dependencies: [1]
---

# Phase 2: Implement Compact Workspace UI

## Overview

Implement the new landing structure as a compact EduGap workspace preview. The page should feel tactile and app-like while using the reference only for direction, not as a pixel-perfect spec.

## Requirements

- Functional: maintain guest CTA links to login and in-page section anchors.
- Functional: present the value story in this order: value proposition, problem, core loop, student benefits, mentor benefits, guardrails/RAG trust, final CTA.
- Non-functional: no new dependencies; use current Tailwind tokens, `lucide-react`, `next/image`, and existing brand assets.
- Non-functional: preserve accessibility basics for headings, links, focus states, image alt text, and responsive stacking.

## Architecture

`LandingPage` should own page sequencing and section composition. Small local arrays can drive repeated cards and steps. Use static product UI mock cards for preview content, with compact cards and progress bars rather than a full dashboard. Keep `LandingCta` if it remains a useful link component; otherwise reduce it to a simple CTA row that preserves current routes.

## Related Code Files

- Modify: `frontend/components/landing/landing-page.tsx`
- Modify: `frontend/components/landing/landing-cta.tsx`
- Modify: `frontend/components/landing/adaptive-proof-simulator.tsx`
- Modify: `frontend/components/landing/teacher-report-preview.tsx`
- Maybe read: `frontend/components/ui/tactile-button.tsx`
- Maybe read: `frontend/components/learning/learning-brand-mark.tsx`

## Implementation Steps

1. Update header:
   - Compact sticky header, logo left, desktop nav center, login plus primary CTA right.
   - Use labels: `Sản phẩm`, `Học viên`, `Giảng viên`, `RAG & Guardrails`.
2. Replace hero:
   - Left copy card with eyebrow, requested H1/subcopy, primary and secondary CTAs, and three trust chips.
   - Right product preview panel with weak concept, practice queue, Socratic coach/citation, and mentor signal modules.
3. Add problem section:
   - Three compact cards explaining student uncertainty, AI answer risk, and teacher visibility gap.
4. Add core loop section:
   - Five steps: Diagnose, Practice, Socratic Coach, Mastery Signal, Mentor Intervention.
   - Use desktop horizontal flow and mobile stacked flow.
5. Add audience section:
   - Student panel with small path/coach preview and three benefit rows.
   - Mentor panel with simple heatmap preview and three benefit rows.
6. Add guardrails/RAG section:
   - Copy, compact chat bubbles, citation card, and trust chips.
7. Add final CTA and compact footer:
   - Reuse login/onboarding destination currently available.
   - Avoid unverified claims like free usage unless already accepted in product copy.
8. Remove or adapt old section content that conflicts with the exact page structure.

## Success Criteria

- [x] Page structure matches the requested sequence.
- [x] Hero preview contains only compact core-loop modules.
- [x] Student and mentor panels are distinct and scan quickly.
- [x] RAG/citation/guardrails section uses concrete citation/source UI.
- [x] CTA labels and destinations remain consistent with existing routes.
- [x] No obvious text overflow on mobile or desktop.

## Completion Notes

- Replaced the scenery-led hero with compact app-like product preview cards.
- Split problem, loop, student, mentor, guardrails, final CTA, and footer into local section helpers.
- Updated `LandingCta` to support requested labels without changing login destination.

## Risk Assessment

The reference uses one-pixel borders and softer cards while the app guideline uses tactile two-pixel borders and bottom depth. Prefer the project guideline when they conflict, but keep spacing and page density close to the reference.
