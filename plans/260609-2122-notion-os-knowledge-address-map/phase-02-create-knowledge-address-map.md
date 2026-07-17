# Phase 02 — Create Knowledge Address Map

## Overview

Create a concise Notion page mapping project knowledge topics to local docs, Notion pages, and usage.

Priority: high  
Status: completed

## Requirements

- Keep map as index only, no duplicated long docs.
- Include source-of-truth policy.
- Link from root page.
- Cover product, adaptive learning, engineering, frontend, operations.

## Architecture

Knowledge Address Map sections:

1. Project North Star.
2. Adaptive Learning Knowledge.
3. Engineering Knowledge.
4. Frontend Knowledge.
5. Project Operations.
6. Source-of-Truth Policy.

## Implementation Steps

1. Draft page content from brainstorm report.
2. Validate local paths exist before including.
3. Use `ntn pages create` under Edugap root, or update existing page if already present.
4. Add root link to Knowledge Address Map.
5. Verify page renders cleanly in markdown via `ntn pages get`.

## Success Criteria

- A reviewer can find project scope, architecture, mastery docs, user stories, and backlog from one page.
- Each row has topic, local source, Notion address, usage, source-of-truth.
- Root page links the map.

## Risks

- Links may drift: add review cadence and source-of-truth rule.
- Page too long: keep concise tables.

## Unresolved Questions

- Should this page also be mirrored as `docs/knowledge-address-map.md` later?
