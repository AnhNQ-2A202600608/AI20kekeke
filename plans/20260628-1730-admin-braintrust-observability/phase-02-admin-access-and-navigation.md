---
phase: 2
title: Admin Access and Navigation
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 2: Admin Access and Navigation

## Overview

Expose the new observability panel only to `admin` users. Use the existing `admin` role rather than creating a separate `btc` role.

## Requirements

- Functional: admin users see a BTC/admin observability navigation item.
- Functional: student, mentor, and dev users do not see the tab.
- Functional: backend remains the source of truth; frontend hiding is only UX.
- Non-functional: preserve current student/mentor flows and existing `btc-heatmap` behavior unless explicitly replacing it.

## Architecture

Use current persona/nav patterns:

```text
login role=admin
  -> frontend store/persona maps admin to BTC/admin navigation
  -> dashboard layout renders BraintrustObservability tab
  -> tab calls FastAPI admin endpoint with auth token
```

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/dashboard-tabs.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx`
- Potentially modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/*`
- Potentially modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/hooks/useBoundStore.ts`
- Reference: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/auth_routes.py`

## Implementation Steps

1. Inspect current role-to-persona mapping in frontend store/layout.
2. Confirm `admin@edugap.vn` in stub mode maps to an admin/BTC experience.
3. Add a new tab id, for example `braintrust-observability`.
4. Add a navigation item with an operations/analytics icon.
5. Wire dashboard layout render switch to the new component from Phase 3.
6. Keep `btc-heatmap` available if it remains valuable; otherwise make Braintrust observability the primary admin tab and keep heatmap as a secondary admin view.
7. Ensure API requests include the auth token already returned by login.
8. Add frontend fallback for 401/403:
   - show access denied
   - do not retry in a loop
   - do not reveal backend error internals

## Success Criteria

- [ ] Admin login can navigate to the Braintrust observability panel.
- [ ] Student/mentor login does not show the panel.
- [ ] Direct endpoint calls as non-admin fail at backend.
- [ ] Existing dashboard tabs still render.

## Risk Assessment

- Risk: frontend currently treats `btc` and `admin` separately. Mitigation: normalize `admin` to BTC/admin persona only at presentation boundary.
- Risk: role is stored only client-side. Mitigation: Phase 1 backend dependency verifies role server-side.
