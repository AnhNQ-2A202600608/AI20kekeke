---
phase: 3
title: "Farmer Scholar Hero"
status: pending
priority: P2
dependencies: [1, 2]
---

# Phase 3: Farmer Scholar Hero

## Overview

Replace the current plain identity card with a Farmer Scholar hero that communicates identity, rank, daily energy, watering rhythm, and readiness for the next learning action.

## Requirements

- Functional: show name, student identifier, member date, logout, XP, Elo rank, streak, ZPD count, and one concise status sentence.
- Non-functional: hero must stay compact on desktop and mobile; no text overlap; no blocking art dependency.

## Architecture

Update `ProfileHeader` in place. If the file becomes too large, split hero stats into small child components.

```text
ProfileHeader
-> identity block
-> Farmer Scholar title/rank
-> Sunlight XP meter
-> Elo rank badge
-> Watering streak chip
-> ZPD growth-zone chip
```

## Related Code Files

- Modify: `frontend/components/dashboard/profile/components/profile-header.tsx`
- Use helpers from: `frontend/components/dashboard/profile/utils/profile-metaphors.ts`
- Reuse: `frontend/components/ui/learning`
- Optional create: `frontend/components/dashboard/profile/components/sunlight-xp-meter.tsx`
- Optional create: `frontend/components/dashboard/profile/components/farmer-rank-badge.tsx`

## Implementation Steps

1. Preserve existing `ProfileHeaderProps` to avoid parent churn.
2. Convert the square initials avatar into a Farmer Scholar identity mark:
   - no generated avatar required for MVP
   - use initials, leaf/sprout detail, and tactile border treatment
3. Replace current metric pills with concept-aware metrics:
   - `Anh nang XP`
   - `Cap bac nang luc`
   - `Nhip tuoi cay`
   - `Vung phat trien`
4. Add an XP progress meter if level thresholds are locally derivable. If not, show current XP only and defer level math.
5. Add a one-line summary:
   - example: `Ban dang cham 6 cay ky nang. Hom nay nen tuoi lai 1 vung dat can phuc hoi.`
6. Keep logout visible but secondary.
7. Validate hero at 390px width. Stack metrics into two columns or horizontal scroll-free rows.

## Success Criteria

- [ ] First viewport clearly reads as a personal learning character sheet.
- [ ] All original identity and metric information remains available.
- [ ] Hero does not require backend changes or generated character art.
- [ ] Mobile layout has no overflow or clipped labels.
- [ ] Logout remains reachable for logged-in users.

## Risk Assessment

- Risk: hero becomes too tall and pushes progress below the fold.
  - Mitigation: keep illustration decorative and optional; prioritize stats and next action.
- Risk: fake level/progress math misleads users.
  - Mitigation: only show level progress if a defensible threshold exists; otherwise keep XP as current total/today value.
