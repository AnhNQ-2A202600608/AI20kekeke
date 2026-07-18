---
type: project
created: 2026-05-25
updated: 2026-05-25
---

# Project Conventions

## Git Workflow
- Always create a new dedicated branch for major code changes.
- Branch name format should follow: `feature/[task-slug]` or `fix/[bug-slug]`.
- DO NOT automatically commit and push code changes. Always present the changes to the user and obtain their explicit review and approval before committing/pushing.

## Testing Workflow
- DO NOT start browser subagents (`browser_subagent`) automatically to test UI/UX or verify layout fixes, as it consumes API quota.
- Instead, after making a fix, inform the user clearly and ask them to test it themselves.
