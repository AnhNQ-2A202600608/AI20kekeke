---
type: implementation-report
created: 2026-06-09 21:45
phase: 05
status: completed
---

# Phase 05 Sync and Governance Report

## Summary

Defined lightweight governance for local docs, Notion mirrors, and Notion operations DBs. Policy stays convention-based for now; no bidirectional sync added.

## Source-of-Truth Rule

| Content | Source of truth | Notion role |
| --- | --- | --- |
| Product docs | Local markdown | readable mirror/review navigation |
| Engineering docs | Local markdown | readable mirror/architecture review |
| Research/domain docs | Local markdown | curated research library |
| Roadmap/backlog/bugs/standup | Notion DBs | operating trackers |
| Runtime code facts | Codebase | linked reference only |
| ADRs/decisions | Local decision docs when added | searchable mirror later |

Do not edit mirrored markdown content directly in Notion unless a write-back sync exists. Edit operational status in Notion DBs.

## Safe Sync Checklist

1. Confirm `ntn doctor` passes.
2. Read target page/database before writing.
3. Prefer append/patch over full page replacement when DB embeds exist.
4. Never delete blocks/properties without explicit approval.
5. Keep local markdown as canonical for docs.
6. After doc path/title changes, update Knowledge Address Map.
7. After importer runs, verify DB samples and relation fields.

## Cadence

- After feature/docs changes: update local docs first.
- After Notion DB operations changes: update Knowledge Address Map only if addresses/schema meaning changed.
- Before mentor review: check root page, Knowledge Address Map, Roadmap, User Stories, Backlog.

## Automation Boundary

`notion-table-fixer` can remain future sync mechanism. It must not overwrite manual DB work or treat Notion docs as canonical until write-back rules exist.

## Unresolved Questions

- Should governance be enforced by script after importer stabilizes?
- Should Knowledge Address Map be mirrored as evergreen `docs/knowledge-address-map.md`?
