# Phase 05 — Validation

## Context Links

- Plan: [plan.md](plan.md)
- Commands: `CLAUDE.md`
- Code standards: `docs/engineering/code-standards.md`

## Overview

Priority: High  
Status: planned

Validate telemetry logic, backend scoring semantics, prompt mode behavior, telemetry logging, and UI interaction.

## Requirements

- Run compile/typecheck/test commands available for touched stack.
- Verify no-score/skipped behavior cannot update mastery.
- Verify fallback telemetry event is persisted.
- Verify direct fallback only appears after explicit opt-in.
- Verify toast is non-blocking in chat and quiz.

## Test Matrix

| Area | Case | Expected |
| --- | --- | --- |
| Telemetry | `response_time = 1.5`, errors = 3 | suggest fallback |
| Telemetry | late night >= 23h, errors = 2 | suggest fallback |
| Telemetry | normal time, slow answer, errors = 1 | no fallback |
| Prompt | normal mode | no direct answer by default |
| Prompt | fallback mode | direct explanation allowed |
| Quiz | accept fallback | attempt `skipped`, score null, no Elo/mastery update |
| Chat | accept fallback | direct answer request with telemetry event |
| UI | toast visible | page remains interactive |

## Related Code Files

- Backend tests near existing test layout.
- Frontend component/hook tests if project supports them.
- Manual browser validation for UI.

## Implementation Steps

1. Run backend unit tests for evaluator.
2. Run backend tests for skipped/no-score path.
3. Validate YAML syntax and prompt builder output.
4. Run frontend lint/typecheck if configured.
5. Start frontend dev server and manually test quiz toast and chat toast.
6. Confirm telemetry event exists in logs/DB or mocked local sink depending current implementation.

## Todo List

- [ ] Unit test telemetry evaluator.
- [ ] Unit/integration test scoring bypass.
- [ ] Test prompt mode selection.
- [ ] Test telemetry logging.
- [ ] Typecheck/frontend validation.
- [ ] Manual browser validation.

## Success Criteria

- All relevant tests pass.
- No syntax/type errors.
- Manual UI flow works on desktop and mobile viewport.
- No unresolved scoring ambiguity remains.

## Risk Assessment

- If logging infrastructure from blocked plan is unfinished, validation should mark this phase blocked or implement minimal event logging first.

## Security Considerations

- Verify direct fallback is auditable.
- Verify guardrails remain strict outside opted-in fallback.

## Next Steps

After validation, update roadmap/changelog if implementation changes user-facing behavior.
