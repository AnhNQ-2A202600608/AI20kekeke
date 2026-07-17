---
type: implementation-report
created: 2026-06-09 21:45
phase: 04
status: completed
---

# Phase 04 Database Cleanup Report

## Summary

Audited core Notion DB access and samples. No destructive schema edits made. Existing schema is usable; main issue is incomplete imported rows and missing Backlog → User Story relations.

## Verified Data Sources

| Database | Database ID | Data source ID | Status |
| --- | --- | --- | --- |
| Roadmap & Milestones | `37afecf35a15819a865bd8734825d7b3` | `37afecf35a1581cf83e4000b8730a8ce` | verified |
| User Stories | `37afecf35a1581618877dd7fe6499051` | `37afecf35a1581df8681000b1ac8b204` | verified |
| Backlog Tasks | `37afecf35a158168a575fbcf208fdbe2` | `37afecf35a1581fd8345000b717c2033` | verified |
| Bug Tracking | `37afecf35a158197a714e207782a3c66` | `37afecf35a158198851a000bfabfd4c2` | verified |
| Daily Standup | `37afecf35a15818d9906c2210989d418` | `37afecf35a158112a82d000b56dbbe70` | verified |

## Findings

| Area | Finding | Action |
| --- | --- | --- |
| Roadmap | Sample rows populated with week/status/deliverables | keep schema |
| User Stories | `US-027`, `US-028` have blank story fields | treat as placeholders or failed import rows |
| Backlog | `T-020` to `T-024` have blank task details, owner, US text, 0 estimate | needs manual content cleanup |
| Backlog relations | `Sprint/Milestone` populated, `User Story liên quan` empty in samples | link tasks to matching user stories after content is clarified |
| Bugs/Standup | IDs in mapping were valid databases; search simply missed them | update map/report status to verified |
| Schema | Existing fields are enough for MVP ops | no new DBs needed now |

## Recommended Views

### Roadmap & Milestones

- Current/Next: filter `Trạng thái` != `Hoàn thành`, sort `Tuần` ascending.
- Completed: filter `Trạng thái` = `Hoàn thành`.

### User Stories

- MVP Must: filter `Mức ưu tiên` = `Bắt buộc (Must)`.
- By Sprint: group by `Sprint dự kiến`.
- Needs Detail: filter blank `Tên câu chuyện` OR blank `Tôi muốn` OR blank `Để đạt được`.

### Backlog Tasks

- Active Sprint: group by `Sprint`, filter `Trạng thái` != done value.
- Needs Triage: filter blank `Tên công việc` OR `Dự kiến (giờ)` = 0 OR empty `User Story liên quan`.
- By Milestone: group by `Sprint/Milestone`.

### Bug Tracking

- Open Bugs: filter non-closed status once status options are confirmed.
- Severity Queue: group by severity/priority if fields exist.

### Daily Standup

- Latest Updates: sort date descending once date field is confirmed.
- Blockers: filter blocker field/status if present.

## What Was Not Changed

- No properties deleted.
- No status/select values renamed.
- No placeholder rows removed.
- No relations auto-filled because blank rows do not provide enough reliable matching data.

## Next Step

Use Phase 05 governance to state: Notion DBs own operational status, but incomplete DB rows must be fixed manually or by a validated importer.

## Unresolved Questions

- Are blank `US-027`/`US-028` and `T-020` to `T-024` intentional placeholders or failed imports?
- Should view creation be manual in Notion UI, or should a future script manage views after the schema stabilizes?
