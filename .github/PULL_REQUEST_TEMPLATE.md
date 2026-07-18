## Summary

- What changed and why.
- Keep this to 3-6 bullets focused on user-visible or architecture-impacting changes.

## Problem

- What issue, risk, or course requirement this PR addresses.
- Include context needed for reviewers to evaluate correctness quickly.

## Solution

- How the implementation solves the problem.
- Note important design decisions and tradeoffs.

## AI Tutor Scope Check

> Keep the project aligned with the Adaptive-first AI Tutor direction. If a row does not apply, mark `N/A` with one-line reason.

- **MVP fit:** Yes / No / N/A — reason:
- **USP served:** Adaptive Learning / Socratic RAG Tutor / Academic Integrity Guardrails / Progress & Lecturer Insight / N/A
- **Scope label:** MVP / Post-MVP / Research / Infrastructure
- **Anti-scope check:** This PR does not turn the project into a generic chatbot, homework-solver, generic LMS, unfocused analytics dashboard, or unrelated agent platform.

## Submission Checklist

> If an item does not apply to this change, mark it as `N/A` with a one-line reason. Do not delete items.

- [ ] `JOURNAL.md` updated for this PR, per README weekly journal requirement.
- [ ] `WORKLOG.md` updated if this PR includes a technical decision, task assignment, direction change, brainstorm conclusion, or important bug fix.
- [ ] AI usage logging hooks remain intact, or changes to hooks/scripts are explained in `## Impact`.
- [ ] No confidential information committed (`.env`, API keys, credentials, course-provided secrets, logs containing secrets).
- [ ] Tests/checks run for affected stack, or `N/A` because this is documentation/config-only.
- [ ] Manual smoke checked for affected user flow, or `N/A` with reason.
- [ ] CI/CD impact reviewed if this changes `.github/workflows/`, hooks, scripts, or branch flow.
- [ ] Linked issue closed via `Closes #NNN` in `## Related`, or `N/A` if no issue.

## Validation

- Commands run:
  - `command:`
  - `result:`
- Focused tests:
- Manual checks:
- Validation blocked:
  - `command:`
  - `error:`
  - `impact:`

## Impact

- Runtime/platform impact:
- Performance/security/migration/compatibility implications:
- CI/CD or branch flow impact:

## Related

<!--
Use a closing keyword so GitHub auto-closes the issue on merge. One per line.
Supported: close/closes/closed, fix/fixes/fixed, resolve/resolves/resolved.
A bare "#123" reference is just a link — it does not close the issue.
-->

- Closes:
- Follow-up PR(s)/TODOs:

---

## AI Authored PR Metadata

> Keep this section for AI-authored PRs. For human-only PRs, mark each field `N/A`.

### Issue / Task

- Tracker key:
- URL:

### Commit & Branch

- Branch:
- Commit SHA:

### Behavior Changes

- Intended behavior change:
- User-visible effect:

### Parity / Guardrails

- Legacy behavior preserved:
- Academic-integrity guardrail impact:
- RAG citation/source behavior impact:
