---
title: "Fix Student App Routing and Chat Context QA Findings"
description: "Fix QA findings for student app deep links, mobile profile reload, and chat answers that need current learning-path context."
status: completed
priority: P1
branch: "blue"
tags: [frontend, routing, chat, qa]
blockedBy: []
blocks: []
created: "2026-07-06T08:04:27.427Z"
createdBy: "ck:plan"
source: skill
---

# Fix Student App Routing and Chat Context QA Findings

## Overview

Fix the highest-signal issues from the mentor QA report:

- Direct student routes must hydrate the matching tab: `/app/chat`, `/app/profile`, `/app/learn`, `/app/skills`.
- Legacy query links such as `/app/learn?tab=chat` must still route to the matching tab or canonical route.
- Mobile reload at 390x844 must preserve profile/progress instead of falling back to the learning path.
- Socratic chat should answer simple learning-path lookup questions such as "Day 8" from current app curriculum context instead of sending them to RAG with no context.
- Socratic chat should answer the QA product-context questions about adaptive quiz signals and mentor classroom insight from verified EduGap product ground truth before falling back to slide RAG.

Scope is intentionally narrow: no backend schema changes, no broad chat agent redesign, no quiz submission workflow changes.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Root Cause Evidence](./phase-01-root-cause-evidence.md) | Completed |
| 2 | [Implement Fixes](./phase-02-implement-fixes.md) | Completed |
| 3 | [Verify QA Findings](./phase-03-verify-qa-findings.md) | Completed |

## Dependencies

- QA evidence: `plans/reports/20260706-edugap-c2-mentor-qa-report.md`
- Relevant frontend files:
  - `frontend/app/hooks/useQuizSession.ts`
  - `frontend/app/components/dashboard-layout.tsx`
  - `frontend/lib/dashboard-routes.ts`
  - `frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts`
  - `frontend/lib/quiz/types.ts`
