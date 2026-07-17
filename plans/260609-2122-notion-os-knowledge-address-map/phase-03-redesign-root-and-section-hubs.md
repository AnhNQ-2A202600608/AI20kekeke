# Phase 03 — Redesign Root and Section Hubs

## Overview

Turn root and hub pages from link lists into review dashboards.

Priority: medium  
Status: completed

## Requirements

- Root must explain project, MVP scope, current review targets, and navigation.
- Hubs must include summary, start-here links, related DBs, open questions.
- Rename Notion page titles for humans while preserving local filename in map.

## Target Structure

Root:

```text
EduGap Project OS
├─ Project one-liner + MVP scope
├─ Mentor Review shortcuts
├─ Knowledge Address Map
├─ Documentation Hubs
├─ Project Operations DBs
└─ Source-of-Truth Policy
```

Each hub:

- Purpose.
- Start here.
- Key docs.
- Related DBs.
- Open questions.

## Implementation Steps

1. Use Phase 01 IDs.
2. Prepare exact markdown update for root and hubs.
3. Update with `ntn pages update` if content replacement is safe.
4. If full replacement risks losing inline DB blocks, patch/appended sections via Notion MCP instead.
5. Rename page titles where safe.
6. Verify navigation with `ntn pages get`.

## Success Criteria

- Root no longer reads as simple link dump.
- Each hub gives review context before links.
- Mentor can start from root without reading repo first.

## Risks

- `ntn pages update` may replace content and disturb DB embeds: prefer append/patch when preserving blocks matters.
- Page title renames may break informal references: mapping keeps old local filenames.

## Unresolved Questions

- Should Review Hub be a separate page or root section?
