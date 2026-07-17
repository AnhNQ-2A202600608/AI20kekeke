---
title: "Landing Page Compact Workspace Refresh"
description: "Plan the follow-up landing redesign into a compact EduGap app-like workspace page using the provided reference as directional input."
status: completed
priority: P2
branch: "codex/adaptive-first-frontend-quiz"
tags: [frontend, landing-page, design]
blockedBy: []
blocks: []
created: "2026-06-30T13:00:51.005Z"
createdBy: "ck:plan"
source: skill
---

# Landing Page Compact Workspace Refresh

## Overview

Refresh the public EduGap landing page so it reads like a compact extension of the app workspace instead of a broad marketing page. The user-provided screenshot and note are directional references, but implementation must follow `docs/product/design-guidelines.md`, existing React/Tailwind patterns, and current app-scale constraints.

This is a follow-up to `plans/260630-1925-landing-page-app-scale-redesign/plan.md`, which already normalized broad scale. The new work is more specific: restructure the landing content into the requested product story, replace the current scenery-led hero with a compact product UI preview, and separate student, mentor, and RAG/guardrails value clearly.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Audit Current Landing](./phase-01-audit-current-landing.md) | Completed |
| 2 | [Implement Compact Workspace UI](./phase-02-implement-compact-workspace-ui.md) | Completed |
| 3 | [Verify Responsive Quality](./phase-03-verify-responsive-quality.md) | Completed |

## Dependencies

- Existing implemented baseline: `plans/260630-1925-landing-page-app-scale-redesign/plan.md`.
- Design source of truth: `docs/product/design-guidelines.md`.
- Package manager validation rules: `docs/guide/setup/package-managers.md`.
- No backend, auth, onboarding, or data contract changes are planned.

## Scope

Modify:

- `frontend/components/landing/landing-page.tsx`
- `frontend/components/landing/landing-cta.tsx`
- `frontend/components/landing/adaptive-proof-simulator.tsx`
- `frontend/components/landing/teacher-report-preview.tsx`

Read/compare:

- `frontend/app/page.tsx`
- `frontend/components/learning/learning-brand-mark.tsx`
- `frontend/components/ui/tactile-button.tsx`
- `frontend/components/app/app-top-nav.tsx`
- `docs/product/design-guidelines.md`
- `docs/guide/setup/package-managers.md`

Out of scope:

- Changing login redirects or onboarding behavior.
- Adding new dependencies.
- Generating new imagery.
- Claiming free usage, pilot metrics, LMS integrations, or production adoption unless already represented elsewhere in the product.

## Acceptance Criteria

- Landing structure follows: header, hero copy plus compact product preview, problem section, five-step core loop, student and mentor panels, guardrails/RAG trust panel, final CTA, compact footer.
- Hero uses app-like sizing: header `56-64px`, H1 no larger than `text-2xl md:text-4xl`, CTAs `min-h-10`/`min-h-11`, section padding around `py-8 md:py-10`.
- Product preview is made of compact UI mock cards, not a full dashboard and not a large scenic illustration.
- Student and mentor benefits are visually separated.
- RAG/citation/guardrails appear as trust evidence, not as a generic feature list.
- No decorative gradient blobs, orbs, oversized mascot, `md:text-5xl`, `md:text-6xl`, `py-16`, `md:py-20`, or widespread `rounded-[28px]`.
- Existing public navigation still lets guests reach login from header and primary CTA.
- Frontend lint/type checks and browser responsive checks pass.

## Implementation Notes

- Prefer the project-owned logo and existing public assets under `frontend/public/brand/edugap/` and `frontend/public/app-backgrounds/`.
- Use `LearningBrandMark` for logo consistency unless the component prevents the required compact header.
- Existing `LandingCta` can be adjusted to expose labels like `Bắt đầu diagnose`, `Xem cách hoạt động`, and `Tạo learning profile`; do not introduce behavior beyond current login/hash links.
- If current split components (`AdaptiveProofSimulator`, `TeacherReportPreview`) make the target structure awkward, simplify them or inline the new sections in `landing-page.tsx`; keep extraction only where it reduces real complexity.

## Completion Notes

- Completed on 2026-06-30.
- Implemented the compact landing sequence in `frontend/components/landing/landing-page.tsx`.
- Updated `LandingCta` labels and options while preserving `/login` and in-page anchor behavior.
- Verified with `pnpm lint`, `pnpm exec tsc --noEmit`, static oversized-class audit, and Playwright desktop/mobile checks.
