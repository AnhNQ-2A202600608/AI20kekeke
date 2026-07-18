---
phase: 4
title: "Dense Dashboard Migration"
status: pending
priority: P2
dependencies: [3]
---

# Phase 4: Dense Dashboard Migration

## Overview

Migrate mentor/admin dense dashboards after student flows pass, because these files contain the largest and most fragile typography surface.

## Requirements

- Functional: replace font-size arbitrary classes in mentor/admin dashboards and shared dense widgets.
- Non-functional: maintain dense table/heatmap readability and avoid horizontal overflow.

## Architecture

The dashboard files intentionally use 8px, 9px, 10px, and 11px bands to fit metadata, legends, heatmaps, chips, and table controls. Phase 4 preserves those bands exactly and postpones semantic consolidation.

## Related Code Files

- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\mentor\class-insights-tab.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\mentor\ingestion-tab.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\mentor\quiz-editor-tab.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\mentor\rag-audit-tab.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\admin\braintrust-observability-tab.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\LeftBar.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\RightBar.tsx`
- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\ui\tactile-button.tsx`

## Implementation Steps

1. Migrate exact font-size class fragments in dashboard files.
2. Inspect compact mode branches in `class-insights-tab.tsx` separately.
3. Keep table cell widths, row heights, and heatmap dimensions unchanged.
4. Run lint/typecheck.
5. Screenshot mentor class insights, quiz editor, RAG audit, and Braintrust tabs.

## Success Criteria

- [ ] Dense dashboard TSX files use tokens for font size.
- [ ] Compact mentor heatmap remains readable.
- [ ] No table or fixed-width cell changes are mixed into this phase.

## Risk Assessment

Risk: very large files make accidental class corruption harder to spot. Mitigation: use exact replacement mapping, then run grep for malformed `text-` classes and inspect rendered dashboard screenshots.
