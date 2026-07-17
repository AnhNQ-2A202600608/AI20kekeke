---
phase: 1
title: "API Proxy Contract"
status: completed
priority: P1
dependencies: []
---

# Phase 1: API Proxy Contract

## Overview

Keep `frontend/app/api/v1/[...path]/route.ts` as a thin BFF proxy. It should forward auth, stream SSE, disable server fetch caching, and return a clear 503 proxy error when the backend is unreachable.

## Related Code Files

- Modify: `frontend/app/api/v1/[...path]/route.ts`
- Validate: frontend lint/build plus manual contract review

## Implementation Steps

1. Preserve current upstream forwarding and header filtering.
2. Replace the "Friendly fallback" wording/body with a structured proxy error: `error`, `message`, `trace_id`, `upstream`, `timestamp`.
3. Keep status `503` for network/connectivity failures; do not fabricate domain data.
4. Keep diagnostics logging around start/complete/error.

## Success Criteria

- [x] Backend offline yields explicit proxy error with trace id.
- [x] Upstream responses and SSE continue to pass through.
- [x] No mock/fake API payload is returned by the proxy.
