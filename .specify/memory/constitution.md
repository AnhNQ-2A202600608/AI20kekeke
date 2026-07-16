<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template Principle 1 -> I. Demoable MVP First
- Template Principle 2 -> II. Reproducible Cross-Platform Workflow
- Template Principle 3 -> III. Safe-by-Default Delivery
- Template Principle 4 -> IV. Evidence-Based Changes
- Template Principle 5 -> V. Optional Complexity, Not Mandatory Weight
Added sections:
- Operational Constraints
- Delivery Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ updated: .specify/templates/plan-template.md
- ✅ updated: .specify/templates/tasks-template.md
- ✅ reviewed: .specify/templates/spec-template.md
- ✅ reviewed: .agents/skills/speckit-constitution/SKILL.md
- ✅ reviewed: .agents/skills/speckit-specify/SKILL.md
- ✅ reviewed: .agents/skills/speckit-plan/SKILL.md
- ✅ reviewed: .agents/skills/speckit-tasks/SKILL.md
- ✅ reviewed: .agents/skills/speckit-implement/SKILL.md
- ✅ reviewed: .agents/skills/speckit-converge/SKILL.md
- ✅ reviewed: .agents/skills/speckit-clarify/SKILL.md
- ✅ reviewed: .agents/skills/speckit-analyze/SKILL.md
- ✅ reviewed: .agents/skills/speckit-checklist/SKILL.md
- ✅ reviewed: .agents/skills/speckit-taskstoissues/SKILL.md
Follow-up TODOs:
- None
-->

# VAIC Universal Starter Constitution

## Core Principles

### I. Demoable MVP First

Every feature MUST be planned as a demoable vertical slice before it is treated as
complete. Specifications MUST prioritize user stories by demo value, plans MUST identify
the MVP checkpoint, and tasks MUST preserve at least one independently testable story that
can be shown within a 24-48 hour hackathon window. Work that improves polish but delays
the first working demo MUST be deferred unless it removes a critical blocker.

### II. Reproducible Cross-Platform Workflow

Development, validation, packaging, and demo preparation MUST run through checked-in,
documented entrypoints. For this repository, `python scripts/project_tasks.py <command>`
is the default operator surface, while `Makefile` remains an optional convenience layer.
Any OS-specific manual step, local tool dependency, or Docker-only path MUST be documented
in project guidance before the team relies on it.

### III. Safe-by-Default Delivery

Features MUST preserve the starter's safe defaults: secrets stay out of version control and
submission archives, generated runtime data stays disposable, and challenge workspaces stay
isolated from shared framework code. New capabilities that touch uploads, archives, logs,
or external services MUST define their failure behavior, data boundaries, and a disabled or
fallback path before they are treated as ready.

### IV. Evidence-Based Changes

Every non-trivial change MUST include verification evidence proportional to its risk. At
minimum, contributors MUST run targeted linting, type checks, tests, builds, or documented
manual validation scenarios relevant to the changed surface. A claim that something is
"done", "fixed", or "ready to demo" is invalid unless the executed checks or the reason a
check could not run are recorded in the handoff.

### V. Optional Complexity, Not Mandatory Weight

Heavy modules, external providers, specialized runtimes, and advanced infrastructure MUST
remain optional until the active feature spec proves they are necessary. The default path
for a fresh clone MUST stay runnable with the baseline stack, and optional capabilities
MUST declare the dependencies, environment variables, and activation steps required to use
them. If a simpler path can satisfy the acceptance criteria, it MUST be preferred.

## Operational Constraints

This repository exists to accelerate hackathon execution, not to maximize abstraction.
Team-facing documentation, planning artifacts, and handoff notes SHOULD be written in
Vietnamese unless an external submission explicitly requires another language. The existing
stack of Next.js frontend, FastAPI backend, local challenge workspaces, and scripted
lifecycle commands is the default operating model; deviations MUST be justified in the
implementation plan. `challenges/` is protected work product and MUST never be treated as
throwaway cache. Packaging MUST include the active challenge source while excluding secrets,
dependencies, caches, and runtime-generated data.

## Delivery Workflow

For any material feature, the team MUST use the Spec Kit sequence:
`constitution -> specify -> plan -> tasks -> implement`, with `clarify`, `checklist`,
`analyze`, and `converge` used when ambiguity or delivery gaps remain. Each generated
feature directory under `specs/` MUST map to a single feature objective and preserve a
clear MVP path. Plans MUST document the validation path, command entrypoints, optional
dependency switches, and any safety implications. Tasks MUST be grouped so teammates can
split work with minimal file overlap and still validate each story independently.

## Governance

This constitution overrides ad hoc preferences when they conflict. Changes to it MUST:
1. explain the reason for the amendment,
2. update any affected Spec Kit templates or runtime guidance in the same change, and
3. include an updated Sync Impact Report at the top of this file.

Versioning rules are mandatory:
- MAJOR for removing or redefining a governing principle in a backward-incompatible way.
- MINOR for adding a new principle or materially expanding enforcement scope.
- PATCH for wording clarifications that do not change team obligations.

Compliance review for every substantial change MUST confirm that:
- the work preserves a demoable MVP path,
- the documented command flow remains reproducible,
- safe-by-default behavior is intact, and
- verification evidence is present or explicitly deferred with reason.

**Version**: 1.0.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16
