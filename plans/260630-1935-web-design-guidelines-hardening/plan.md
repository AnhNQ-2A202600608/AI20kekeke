---
title: "Web Design Guidelines Hardening"
description: "Bring landing, onboarding, quiz, chat, and dashboard surfaces into Vercel Web Interface Guidelines compliance while centralizing button sizing in the app design system."
status: in-progress
priority: P1
branch: "codex/adaptive-first-frontend-quiz"
tags: [frontend, ui, accessibility, design-system, tech-debt]
blockedBy: [260630-1845-ui-auth-onboarding-stabilization, 260630-1925-landing-page-app-scale-redesign]
blocks: []
created: "2026-06-30T12:27:03.968Z"
createdBy: "ck:plan"
source: skill
---

# Web Design Guidelines Hardening

## Overview

Harden the current UI against the Vercel Web Interface Guidelines scan findings: inaccessible icon buttons, `transition-all`, clickable `div`s, production-visible backend/demo/fallback copy, hardcoded demo behavior, and inconsistent button scale across landing, auth, onboarding, quiz, chat, and dashboard pages.

The central design decision is to standardize button sizing in a shared app button primitive, then migrate route surfaces gradually. Do not keep adding one-off Tailwind button strings. Do not solve density by shrinking random pages independently.

## Scope Challenge

- Existing code: `frontend/components/ui/learning/tactile-button.tsx` already defines a small tactile button primitive; `frontend/app/globals.css` also defines global `.btn-3d` button classes. `docs/product/design-guidelines.md` already contains a runtime app sizing baseline. Many route components bypass these primitives with hand-written classes.
- Minimum changes: create one canonical button API and lintable usage pattern; migrate only high-traffic surfaces first; replace user-facing system copy; fix clear accessibility violations found in the audit.
- Complexity: touches 12-20 files if done correctly. Avoid a broad visual redesign. New abstraction count should be one shared button primitive plus optional small copy/status helpers.
- Selected mode: HOLD SCOPE. This is a hardening plan, not a new theme.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Reason |
| --- | --- | --- | --- |
| Blocked by | `plans/260630-1845-ui-auth-onboarding-stabilization` | in-progress | Auth/onboarding/app sizing work is actively changing the same entry surfaces. Rebase this hardening pass after that plan settles. |
| Blocked by | `plans/260630-1925-landing-page-app-scale-redesign` | planned | Landing scale normalization should land before global button migration judges landing regressions. |
| Builds on | `plans/260630-1818-quiz-ai-regression-fix` | completed | Quiz AI/hint regressions are fixed; this plan should preserve that behavior while hardening sizing/accessibility. |
| Builds on | `plans/260630-0935-chat-contract-schema-unification` | completed | Chat contract is stable enough to clean copy and UI without changing stream semantics. |

## Button Sizing Strategy

Canonical home: `frontend/components/ui/learning/tactile-button.tsx`, or a new `frontend/components/ui/tactile-button.tsx` if the component should no longer be learning-only. Prefer moving/aliasing over duplicating.

Do not standardize sizing in `globals.css` alone. Global `.btn-3d` cannot enforce props, variants, accessible labels, icon-only sizes, loading states, or route-specific intent. Keep CSS variables/tokens in `globals.css`; keep button composition in a React component.

Recommended API:

```tsx
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md';
type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'ghost' | 'danger' | 'warning';
type ButtonTone = 'student' | 'teacher' | 'ai';
```

Sizing contract:

| Use | Size | Height | Padding | Text | Icon |
| --- | --- | --- | --- | --- | --- |
| Dense table/menu row | `xs` | `32-36px` | `px-2` | `10-11px` | `14px` |
| Secondary page action | `sm` | `36-40px` | `px-3` | `11-12px` | `16px` |
| Default app action | `md` | `44px` | `px-4` | `12-14px` | `18px` |
| Primary flow action | `lg` | `48-52px` | `px-5` | `14-16px` | `20px` |
| Compact icon | `icon-sm` | `36px square` | none | n/a | `16px` |
| Default icon | `icon-md` | `40-44px square` | none | n/a | `18-20px` |

Rules:

- Default app button = `md`, not `lg`.
- Landing/auth/onboarding CTAs may use `lg`, but only primary end-of-flow actions.
- Quiz footer and chat composer actions should use `md` or `icon-md`.
- Dashboard table/tool actions should use `xs` or `sm`.
- Icon-only button requires `aria-label`; enforce in component typing or runtime dev warning if practical.
- Avoid `normal-case tracking-normal` overrides by making case a prop, e.g. `textCase="title" | "upper"`.
- Deprecate raw `.btn-3d btn-*` use after migration; keep only as compatibility classes until no direct usages remain.

## Target Surfaces

- Landing: `frontend/components/landing/*`
- Login/auth modal: `frontend/app/login/page.tsx`, `frontend/components/LoginScreen.tsx`
- Onboarding: `frontend/components/onboarding/onboarding-page.tsx`
- Quiz: `frontend/components/quiz/*`, `frontend/app/components/quiz-workspace.tsx`
- Chat: `frontend/components/dashboard/socratic-chat/**`
- Dashboard/teacher demo surfaces: `frontend/app/components/dashboard-layout.tsx`, `frontend/components/dashboard/btc-heatmap.tsx`

## Non-Goals

- No new visual brand.
- No backend contract rewrite.
- No removal of demo mode. Only gate and phrase demo mode correctly.
- No blanket migration of every button in the repo in one commit if it makes review unsafe.
- No fake data or mocks to satisfy checks.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Audit Baseline](./phase-01-audit-baseline.md) | Completed |
| 2 | [Button Sizing System](./phase-02-button-sizing-system.md) | Completed |
| 3 | [Accessibility Interaction Pass](./phase-03-accessibility-interaction-pass.md) | Completed |
| 4 | [Product Copy Fallback Cleanup](./phase-04-product-copy-fallback-cleanup.md) | Completed |
| 5 | [Route Layout Verification](./phase-05-route-layout-verification.md) | In Progress |

## Dependencies

- Vercel Web Interface Guidelines fetched from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`.
- Existing sizing baseline in `docs/product/design-guidelines.md`.
- Existing tactile UI behavior in `frontend/app/globals.css` and `frontend/components/ui/learning/tactile-button.tsx`.
- Current dirty worktree contains unrelated changes; implementation must stage/commit scoped files only.

## Acceptance Criteria

- [x] Shared button primitive defines all approved sizes/variants and documents usage.
- [x] High-traffic route buttons no longer use inconsistent `min-h-14`, ad hoc `px-7`, or raw `.btn-3d` unless explicitly exempted.
- [x] Icon-only buttons in audited surfaces have `aria-label`.
- [x] Clickable `div`/`span` controls in audited surfaces are replaced with semantic controls.
- [x] `transition-all` is removed from audited interactive components or replaced with explicit transitions.
- [x] User-facing fallback copy no longer says `backend`, `sandbox`, `RAG v2`, `agent`, `tool`, or internal error details to students by default.
- [x] Demo/mock data surfaces are gated and labelled as sample data only when demo mode is active.
- [ ] Browser checks cover `/`, `/login`, `/onboarding`, `/app?tab=learn`, `/app?tab=chat`, quiz wrong-answer flow, and one teacher/dashboard sample route.

## Verification

Run after implementation:

```bash
pnpm --dir frontend exec eslint app components lib
pnpm --dir frontend exec tsc --noEmit
```

Browser smoke:

```text
375x844 mobile
768x1024 tablet
1366x768 laptop
1707x960 desktop
```

Audit checks:

```bash
rg -n "transition-all|alert\\(|backend|sandbox|agent-reasoning|RAG v2|\\.\\.\\.|<div[^>]*onClick|title=\"(Đóng|Mở|Xóa|Phóng|Slide)" frontend/app frontend/components --glob "*.tsx"
rg -n "btn-3d|min-h-14|min-h-12|px-7|py-3" frontend/app frontend/components --glob "*.tsx"
```

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260630-1935-web-design-guidelines-hardening\plan.md
```
