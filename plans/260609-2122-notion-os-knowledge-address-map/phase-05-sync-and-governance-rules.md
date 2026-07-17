# Phase 05 — Sync and Governance Rules

## Overview

Define how local markdown, Notion pages, and Notion DBs stay consistent.

Priority: medium  
Status: completed

## Requirements

- Avoid bidirectional sync unless deliberately designed.
- Local markdown remains source-of-truth for product/research/engineering docs.
- Notion DBs remain source-of-truth for operations status.
- Sync/render automation must not overwrite manual DB work.

## Proposed Policy

| Content | Source of truth | Notion role |
| --- | --- | --- |
| Product docs | Local markdown | readable mirror |
| Engineering docs | Local markdown | review mirror |
| Research docs | Local markdown | curated library |
| Roadmap/backlog/bugs/standup | Notion DB | operating tracker |
| Code facts | Codebase | linked reference only |
| ADRs | Local decision docs | mirror/search layer |

## Implementation Steps

1. Add source-of-truth block to Knowledge Address Map.
2. Add short policy to root page.
3. Cross-reference `notion-table-fixer` as optional future sync mechanism.
4. Define safe sync checklist.
5. Define update cadence: after feature/docs changes, update local docs and Notion map if addresses changed.

## Success Criteria

- Team knows where to edit each content type.
- Future automation has clear boundaries.
- Notion is useful without becoming second inconsistent documentation source.

## Risks

- Too much governance: keep policy short.
- Manual updates forgotten: add map review to major docs change checklist.

## Unresolved Questions

- Should governance be enforced by scripts or remain convention for now?
