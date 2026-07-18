---
phase: 2
title: Left Timeline Focus
status: completed
priority: P2
dependencies:
  - 1
---

# Phase 2: Left Timeline Focus

## Overview

Make the left sidebar serve one job: fast day selection. Remove the bottom summary/signature stack that consumes vertical space, then preserve project personality through compact day-row signatures.

## Requirements

- Functional: show the active week/day timeline clearly.
- Functional: remove the bottom summary cards from the left sidebar.
- Functional: keep compact day signature chips where useful.
- Functional: preserve week tab navigation and optional track selector.
- Non-functional: no nested-card visual clutter.
- Non-functional: day rows must remain scannable in short viewport heights.

## Architecture

`DesktopLearningSidebar` already has the right structure: header, scrollable day list, optional track selector, week tabs. The bottom `LearningSidebarSignatureStack` is the part most likely stealing space. The replacement should be inline and compact:

- active day row: state icon, day label, status, one compact skill-family chip
- inactive rows: smaller chip or no chip depending on width
- left progress rail remains

## Related Code Files

- Modify: `frontend/components/learning/desktop-learning-sidebar.tsx`
- Modify: `frontend/components/learning/signature/pipeline-day-label.tsx`
- Possibly delete/unmount only: `LearningSidebarSignatureStack` usage
- Keep files available: `frontend/components/learning/signature/*` unless no longer referenced after implementation.

## Implementation Steps

1. Remove `LearningSidebarSignatureStack` from the sidebar render path.
2. Keep or simplify `PipelineDayLabel` inside each day row as the primary signature.
3. Tune row height to stay around `64-76px` on desktop.
4. Make active row slightly richer; keep inactive rows quieter.
5. Ensure scroll area gets the freed height instead of the outer panel growing.
6. Keep week tabs fixed at the bottom of the sidebar.

## Success Criteria

- [ ] Bottom summary/signature cards no longer appear in the left sidebar.
- [ ] Day list gets visibly more usable vertical space.
- [ ] Active day still feels distinctive through icon/chip/progress.
- [ ] Week tabs remain reachable without covering the day list.
- [ ] Sidebar has no internal overlap at `900px`, `768px`, and shorter heights.

## Risk Assessment

Removing the signature stack may make the UI feel less branded. Mitigate by keeping a small, consistent day-row signature chip rather than reintroducing large summary cards.
