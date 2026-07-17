---
type: research-report
created: 2026-06-10 01:14 Asia/Bangkok
topic: notion-backlog-doc-report-workflow
---

# Research Report: Notion Backlog Doc + Report Workflow

## Summary

Plan `plans/20260610-0026-setup-notion-frontend-backlog/plan.md` already mentions the target workflow: each Notion database row is a page, and AI appends implementation report blocks into that page after task completion.

Implementation status is partial: frontend database setup is done, Backlog schema has the proposed classification properties, but plan lacks an enforceable report template and trigger rule for future AI sessions.

## Findings

### 1. One backlog = one doc

Notion supports this naturally: every item/page in `Backlog & Quản lý công việc` is already a document body.

Plan lines 48-55 explicitly says AI should append a report into the task page after completion:
- status update to `Hoàn thành`
- append report via `API-patch-block-children`
- include changed files, technical description, verification

Verdict: concept exists, but workflow is not strict enough.

### 2. Actual Backlog schema

Retrieved Backlog data source `37afecf3-5a15-81fd-8345-000b717c2033`.

Properties exist:
- `Area`: Frontend, Backend, AI-RAG, Data, Docs, UX
- `Component`: Chat Tutor, Quiz, Dashboard, Auth, Design System
- `Type`: Feature, UI Polish, Bug, Research
- `Screen/Page`: Student Dashboard, Adaptive Quiz, Socratic Chat RAG, Teacher Ingestion & Audit, Login/Auth
- `Trạng thái`: Chưa làm, Đang làm, Hoàn thành

Verdict: planned properties were implemented.

### 3. Are Area / Component / Screen/Page / Type suitable in one shared Backlog?

Yes, with caveat.

Good:
- `Area` = ownership/workstream filter.
- `Type` = work nature filter.
- `Screen/Page` = UI route/page progress filter.
- `Component` = reusable UI/domain module filter.

Problem:
- `Component` and `Screen/Page` can overlap. Example: `Dashboard` component vs `Student Dashboard` page.
- Select properties are rigid. Future pages/components need schema edits.
- For high-level vibecoding tasks, too many tags can cause noisy bookkeeping.

Recommendation: keep all four in shared Backlog for now, but define exact meaning and minimum required fields.

## Recommended Fix

### Backlog item body template

Each backlog page should contain:

```markdown
## Context
- Goal:
- Scope:
- Related user story:

## Acceptance Criteria
- [ ] ...

## Implementation Report
_To be appended by AI when done._

### YYYY-MM-DD — Completion Report
- **Status:** Done / Partial / Blocked
- **Changed files:**
  - `path`: change summary
- **What changed:**
- **Verification:**
- **Notes / follow-up:**
```

### Required fields rule

For every backlog item:
- Required: `Area`, `Type`, `Trạng thái`, priority.
- Required for FE/UI tasks: `Screen/Page`.
- Required only if reusable/shared module touched: `Component`.
- Avoid filling `Component` just because a page contains components.

### Property semantics

- `Area`: team/domain ownership, not file location.
- `Type`: work category.
- `Screen/Page`: user-facing route/screen affected.
- `Component`: reusable module/design-system/domain component affected.

### Completion automation rule

When AI finishes a backlog task:
1. Update `Trạng thái` to `Hoàn thành` only if validation passed.
2. Append completion report to the same Notion page body.
3. Do not create a separate report page unless user asks.
4. If blocked/partial, append report but do not mark `Hoàn thành`.

## Recommended Plan Patch

Update `plan.md` section `Quy tắc Phân rã & Báo cáo Backlog` with:
- backlog body template
- required field matrix
- definition of Area/Component/Screen/Page/Type
- completion report trigger
- rule: every implementation session tied to a backlog must append report into that backlog page

## Unresolved Questions

- Should AI update Notion automatically every time, or ask confirmation before writing external/shared Notion pages?
- What exact Notion status should partial work use if only `Chưa làm / Đang làm / Hoàn thành` exist?
