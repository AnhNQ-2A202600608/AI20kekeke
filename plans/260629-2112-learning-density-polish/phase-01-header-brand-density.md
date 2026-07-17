---
phase: 1
title: Header Brand Density
status: completed
priority: P2
dependencies: []
---

# Phase 1: Header Brand Density

## Overview

Fix the top desktop header so the EduGap logo is more visible without enlarging the adjacent page title. The goal is to recover vertical space for the learning workspace and avoid the current heavy header feel.

## Requirements

- Functional: keep the current brand/header area visible on desktop.
- Functional: increase only the logo/mark visual size.
- Functional: keep the page title and metadata readable but smaller than the current screenshot.
- Non-functional: no extra header height; preferably reduce header height.
- Non-functional: do not introduce a new brand asset pipeline.

## Architecture

`LearningPath.tsx` owns the desktop header composition. `LearningBrandMark` owns the rendered image. The likely issue is a combination of CSS sizing and whitespace inside the PNG. Implementation should first inspect the rendered asset box, then choose the smallest fix:

1. If PNG whitespace causes the logo to look small, crop/replace the logo asset in `public/brand/edugap/` or use a tighter existing logo file from `public`.
2. If the asset is tight, adjust only `LearningBrandMark` image height/width.
3. Reduce the sibling text block in `LearningPath.tsx`.

## Related Code Files

- Modify: `frontend/components/LearningPath.tsx`
- Modify: `frontend/components/learning/learning-brand-mark.tsx`
- Possibly modify/add: `frontend/public/brand/edugap/logo.png` or a tighter brand asset if current PNG has excess transparent padding.

## Implementation Steps

1. Inspect actual logo asset dimensions and transparent padding.
2. Keep the desktop header as a single row: logo, divider, compact title/meta block.
3. Set brand mark target visual height around `44-52px`, but do not raise title size.
4. Reduce title to roughly `20-24px` and metadata to `11-12px`.
5. Reduce desktop header bottom padding/gap if possible.
6. Confirm mobile top bar is unaffected unless it uses the same logo component.

## Success Criteria

- [ ] Logo/mark is visibly larger than in the latest screenshot.
- [ ] `Lộ trình học tập` title is not larger than current screenshot.
- [ ] Header takes less or equal vertical height compared with current implementation.
- [ ] Brand image is not blurry or clipped.
- [ ] No text overlap at `1024px` desktop width.

## Risk Assessment

If the PNG contains large transparent whitespace, pure CSS sizing will not satisfy the user. Prefer cropping/replacing the asset over further enlarging the whole header.
