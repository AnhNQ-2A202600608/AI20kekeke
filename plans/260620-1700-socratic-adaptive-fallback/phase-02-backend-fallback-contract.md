# Phase 02 — Backend Fallback Contract

## Context Links

- Plan: [plan.md](plan.md)
- LangGraph: `src/agents/graph.py`
- Respond node: `src/agents/nodes/respond_node.py`
- Existing guardrails plan: `plans/20260612-0940-guardrails-logging-fallback/plan.md`

## Overview

Priority: High  
Status: planned

Define how backend exposes fallback suggestions, accepts opt-in direct solution requests, records skipped attempts, and logs fallback telemetry.

## Requirements

- Response metadata can include `show_direct_fallback_prompt` and `fallback_reasons`.
- Request can include `force_direct_mode: true` only after user opt-in.
- Quiz attempt is recorded as `skipped` with no score when direct fallback is used.
- Elo/mastery update is skipped for fallback attempts.
- Log a fallback event to `LearningSignals` or equivalent audit telemetry.

## Architecture

KISS option: evaluate fallback before or inside `respond_node`, then pass metadata to frontend. Avoid adding a new LangGraph node unless routing complexity grows.

Quiz flow must separate three outcomes:

| Outcome | Attempt status | Score | Mastery update |
| --- | --- | --- | --- |
| Correct/incorrect answer | submitted | normal | yes |
| Student manually skips | skipped | none | no |
| Direct fallback accepted | skipped | none | no |

## Related Code Files

- Modify: `src/agents/state.py`
- Modify: `src/agents/nodes/respond_node.py`
- Modify API/chat route if present.
- Modify quiz attempt persistence service if present.
- Modify telemetry/logging service from guardrails plan when available.

## Implementation Steps

1. Add metadata keys for fallback prompt and reasons.
2. Add request handling for `force_direct_mode`.
3. When `force_direct_mode` is true, select fallback prompt mode and attach telemetry event.
4. In quiz submission flow, map direct fallback to `attempt_status = "skipped"` and `score = None`.
5. Ensure Elo/mastery update function is not called for skipped attempts.
6. Persist fallback event with student, course/session/question ids when available.

## Todo List

- [ ] Define request/response metadata contract.
- [ ] Add fallback metadata propagation.
- [ ] Add force direct mode handling.
- [ ] Add skipped/no-score attempt path.
- [ ] Add telemetry logging event.
- [ ] Add backend tests.

## Success Criteria

- Frontend can show toast from response metadata.
- Direct fallback responses are explicit opt-in only.
- Skipped fallback attempts never change Elo/mastery.
- Lecturer telemetry can count fallback usage.

## Risk Assessment

- Existing quiz UI may already expose answer skipping. Reuse that path instead of adding duplicate state.
- Guardrails logging plan may not be implemented yet. Keep this plan blocked until logging contract exists or implement a minimal compatible event function.

## Security Considerations

- Never trust frontend for role/course ownership.
- Do not expose internal prompt text in metadata.
- Log only reason codes and ids needed for audit.

## Next Steps

Update prompt YAML after backend mode contract is final.
