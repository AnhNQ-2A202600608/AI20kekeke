# Phase 04 — Clean Database Schema and Views

## Overview

Make existing Notion databases usable as project operating system.

Priority: medium  
Status: completed

## Requirements

- Focus existing DBs first; do not add many new DBs.
- Audit and normalize statuses, priorities, relation fields.
- Preserve existing data.
- Add useful views only after schema/data quality is clear.

## Target Databases

1. Roadmap & Milestones.
2. User Stories.
3. Backlog Tasks.
4. Bugs.
5. Daily Standup.
6. Optional later: Docs Library, ADR/Decisions, Research Concepts.

## Implementation Steps

1. Query schema and sample records.
2. Identify empty/invalid fields: blank descriptions, zero estimates, missing relations.
3. Normalize status/options only if values are clearly duplicates.
4. Check relations: Backlog ↔ User Story ↔ Milestone.
5. Create recommended view specs for manual or API setup.
6. Do not delete properties unless user approves.

## Success Criteria

- Backlog task can trace to user story and sprint/milestone.
- Roadmap shows current/next milestones.
- User stories can be filtered by MVP/role/status.
- Bugs and standups are discoverable from root/operations hub.

## Risks

- Notion API support for views may be limited: document manual setup when needed.
- Schema rename can break existing relations/import scripts: coordinate with old sync plans.

## Unresolved Questions

- Are empty fields intentional placeholders or failed import artifacts?
