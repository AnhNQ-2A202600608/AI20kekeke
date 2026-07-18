# `.claude/rules/`

This directory is intentionally near-empty.

Authoritative docs for AI agents and contributors:

- **[`CLAUDE.md`](../../CLAUDE.md)** — project scope guard and adaptive-first AI Tutor direction.
- **[`docs/README.md`](../../docs/README.md)** — documentation map.
- **[`docs/product/project-overview-pdr.md`](../../docs/product/project-overview-pdr.md)** — product definition, MVP scope, users, and safety goals.
- **[`docs/product/project-roadmap.md`](../../docs/product/project-roadmap.md)** — implementation phases and progress.
- **[`docs/product/design-guidelines.md`](../../docs/product/design-guidelines.md)** — UI/UX direction and mastery visualization rules.
- **[`docs/domain-knowledge/adaptive-learning.md`](../../docs/domain-knowledge/adaptive-learning.md)** — Elo-style mastery tracking and adaptive practice rules.
- **[`docs/domain-knowledge/spaced-repetition.md`](../../docs/domain-knowledge/spaced-repetition.md)** — active recall, SM-2-style scheduling, and AI grading constraints.
- **[`docs/engineering/system-architecture.md`](../../docs/engineering/system-architecture.md)** — service boundaries, data stores, and core flows.
- **[`docs/engineering/code-standards.md`](../../docs/engineering/code-standards.md)** — code, testing, documentation, Git, AI/RAG standards.
- **[`docs/engineering/deployment-guide.md`](../../docs/engineering/deployment-guide.md)** — CI/CD baseline, branch flow, and deployment roadmap.
- **[`docs/engineering/codebase-summary.md`](../../docs/engineering/codebase-summary.md)** — current repository structure and next engineering decisions.

## When to add a file here

Only add a `*.md` file in this directory if you need **path-gated context** loaded conditionally by Claude Code for a narrow part of the tree, AND the content is not already covered in `CLAUDE.md` or `docs/`.

Each file added here ships in every agent context that matches its `paths:` glob — so keep them small, current, and non-overlapping with `CLAUDE.md`. Stale rules actively mislead agents.
