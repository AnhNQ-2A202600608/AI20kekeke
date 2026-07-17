---
title: Socratic Adaptive Fallback Plan
status: planned
created: 2026-06-20
blockedBy:
  - 20260612-0940-guardrails-logging-fallback
blocks: []
---

# Socratic Adaptive Fallback Plan

## Overview

Implement an adaptive fallback for students who show frustration, rapid guessing, or late-night pressure in chat tutor and quiz flows. When triggered, the UI shows a non-blocking toast offering direct solution support. If accepted, the current quiz attempt is recorded as `skipped` with no score and no mastery/Elo update, while the fallback event is logged for lecturer insight.

## Scope Decisions

- Direct solution is allowed only after explicit student opt-in through fallback.
- Applies to both Socratic chat tutor and adaptive quiz UI.
- Quiz fallback records `skipped` / no-score / no mastery update.
- Fallback event is persisted to telemetry/learning signals.
- Deadline metadata is deferred; late-night trigger uses local time after 23:00.
- UI uses non-blocking toast, not modal.

## Phases

| Phase | Status | Purpose |
| --- | --- | --- |
| [Phase 01 — Telemetry Rules](phase-01-telemetry-rules.md) | planned | Add evaluator for rapid guessing, repeated errors, frustration keywords, and late-night pressure. |
| [Phase 02 — Backend Fallback Contract](phase-02-backend-fallback-contract.md) | planned | Add API/agent metadata contract, skipped attempt semantics, and telemetry logging. |
| [Phase 03 — Prompt Guardrail Update](phase-03-prompt-guardrail-update.md) | planned | Update YAML prompts so direct fallback is explicit, opt-in, and audit-safe. |
| [Phase 04 — Frontend Toast Flow](phase-04-frontend-toast-flow.md) | planned | Add toast UX in chat and quiz without blocking student interaction. |
| [Phase 05 — Validation](phase-05-validation.md) | planned | Verify logic, no-score behavior, telemetry logging, and UI golden paths. |

## Dependencies

- Existing guardrails/logging plan: `plans/20260612-0940-guardrails-logging-fallback/`.
- Current LangGraph flow: `src/agents/graph.py`, `src/agents/state.py`, `src/agents/nodes/respond_node.py`.
- Prompt config: `config/prompts.yaml`.
- Quiz UI: `frontend/components/quiz/quiz-question-view.tsx` and related quiz hooks.

## Success Criteria

- Students receive fallback only when telemetry threshold triggers or they explicitly choose help.
- Direct fallback never silently affects mastery; quiz attempt is `skipped` and no-score.
- Fallback events are logged for lecturer/admin insight.
- Prompt wording no longer conflicts with academic integrity rules.
- Toast is non-blocking and available in both chat and quiz flows.
- Tests cover trigger/no-trigger cases, no-score semantics, and metadata propagation.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260620-1700-socratic-adaptive-fallback\plan.md
```
