# Phase 01 — Telemetry Rules

## Context Links

- Plan: [plan.md](plan.md)
- State schema: `src/agents/state.py`
- Architecture telemetry: `docs/engineering/system-architecture.md`

## Overview

Priority: High  
Status: planned

Add simple telemetry evaluation for frustration and rapid guessing. Keep the logic deterministic, testable, and independent from LLM calls.

## Requirements

- Detect rapid guessing from `response_time` vs question length.
- Detect repeated errors from session-level `consecutive_errors`.
- Detect frustration keywords in Vietnamese user input.
- Detect late-night pressure after 23:00 local time.
- Return a boolean plus reason codes for logging/UI copy.
- Do not persist `consecutive_errors` to DB.

## Architecture

Create or update a backend service module for fallback telemetry. Prefer a pure function:

```python
result = evaluate_fallback_telemetry(
    query=query,
    question_text=question_text,
    response_time=response_time,
    consecutive_errors=consecutive_errors,
    local_hour=local_hour,
)
```

Return shape:

```python
{
    "should_suggest_fallback": True,
    "reasons": ["rapid_guessing", "repeated_errors"]
}
```

## Related Code Files

- Modify: `src/agents/state.py`
- Create or modify: `src/services/fallback_telemetry.py`
- Add tests near current backend test structure.

## Implementation Steps

1. Add optional state fields: `response_time`, `consecutive_errors`, `fallback_suggested`, `fallback_reasons`.
2. Implement reading threshold: `max(3.0, word_count * 0.2)`.
3. Trigger fallback when:
   - rapid guessing and `consecutive_errors >= 3`, or
   - local hour >= 23 and `consecutive_errors >= 2`, or
   - frustration keyword appears.
4. Keep keyword list small and configurable later only if duplication grows.
5. Add unit tests for trigger and no-trigger cases.

## Todo List

- [ ] Add telemetry result model or typed dict.
- [ ] Add evaluator function.
- [ ] Add state fields.
- [ ] Add tests for rapid guessing.
- [ ] Add tests for late-night pressure.
- [ ] Add tests for frustration keywords.

## Success Criteria

- Evaluator is deterministic and has no external service dependency.
- Normal slow answer with low error count does not trigger fallback.
- Late-night rule works without deadline metadata.

## Risk Assessment

- False positives can annoy students. Mitigate by showing a dismissible toast only.
- Keyword detection can be crude. Keep reasons logged for later tuning.

## Security Considerations

- Do not store raw frustration text beyond normal message logging rules.
- Reason codes are safe for analytics.

## Next Steps

Proceed to backend contract once evaluator output is stable.
