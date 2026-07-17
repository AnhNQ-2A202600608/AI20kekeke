---
phase: 4
title: "Product Copy Fallback Cleanup"
status: completed
priority: P1
dependencies: [1]
---

# Phase 4: Product Copy Fallback Cleanup

## Overview

Remove system-facing copy and silent hardcoded fallbacks from student-facing UI. Keep technical details in logs/dev-only surfaces.

## Requirements

- Functional: user sees actionable product messages; demo/mock/fallback states are explicit and gated.
- Non-functional: do not remove telemetry or developer diagnostics, but hide them from the default student experience.

## Architecture

Introduce a lightweight copy/status mapping if repeated messages appear:

```ts
type UserFacingStatus = {
  title: string;
  detail: string;
  actionLabel?: string;
  devDetail?: string;
};
```

Potential home:

- `frontend/lib/ui/status-copy.ts`
- or colocated helpers if reuse is too small.

Rule: user-facing `title/detail` never says `backend`, `sandbox`, `agent`, `tool`, fake token, or raw API status. `devDetail` can carry technical context for console/dev panel only.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/onboarding/onboarding-page.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/login/page.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/chat-input-bar.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/btc-heatmap.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`

## Implementation Steps

1. Replace onboarding messages:
   - "Backend onboarding đang lỗi hoặc offline" -> "Chưa lưu được hồ sơ học tập. Tiến độ đã lưu trên thiết bị này; thử lưu lại khi kết nối ổn định."
   - "sync backend" -> "lưu tiến độ trên tài khoản".
2. Replace chat/system labels:
   - `/agent-reasoning-trail` -> "Cách Sofi kiểm tra câu trả lời" or hide behind advanced details.
   - `tool`, `observation`, `ms` -> product labels like "Tìm học liệu", "Đối chiếu nguồn".
   - `Socratic RAG v2` -> "Học liệu có trích dẫn" or remove from student footer.
3. Replace unfinished feature toast:
   - hide attach button if no upload flow exists, or open disabled explanatory popover with a product next step.
4. Gate demo/mock surfaces:
   - teacher heatmap sample data only visible in demo mode.
   - production empty state says what data is missing and how to create it.
5. Move hardcoded demo auth/token and UUID concerns out of visible UI copy. Do not create fake data for production.
6. Use `…` instead of `...` in audited copy.

## Success Criteria

- [x] Student default UI does not expose `backend`, `sandbox`, `RAG v2`, `agent`, `tool`, or fake-token concepts.
- [x] Every fallback message includes a user next step.
- [x] Demo/mock data is visibly sample data only when demo mode is active.
- [x] No silent fallback hides data-quality or API failure from the user; it becomes empty/offline/retry state.
- [x] Copy remains Vietnamese-first and second-person where applicable.

## Risk Assessment

- Risk: hiding diagnostics makes debugging harder.
  Mitigation: keep `devDetail` in console/dev panel, not in student copy.
- Risk: removing demo banners confuses stakeholders in demo builds.
  Mitigation: keep demo labels in demo mode, but phrase as "Dữ liệu mẫu" instead of "sandbox/backend".
