# Admin Braintrust Observability

## Context

Implemented the admin-only Braintrust observability plan for the BTC panel. The current Braintrust project has trace logs but no configured evaluator score rules, so the feature treats missing scores as a known state rather than an error.

## Changes

- Added a FastAPI admin Braintrust proxy that reads Braintrust env vars server-side and returns sanitized aggregate summaries.
- Added admin-only frontend navigation for an AI Observability panel.
- Built the dashboard with health stats, span latency chart, score availability state, error rows, slow trace rows, and Braintrust detail links.
- Added backend tests for aggregation, admin-only access, missing env handling, and score absence.
- Updated architecture docs and `.env.example` for the optional Braintrust app URL.

## Verification

- `uv run pytest tests/test_api/test_admin_braintrust.py tests/test_api/test_rbac.py`
- `uv run ruff check src/services/braintrust_dashboard.py src/api/admin_braintrust_routes.py tests/test_api/test_admin_braintrust.py`
- `cd frontend; pnpm lint`
- `cd frontend; pnpm build` is blocked by an unrelated existing type error in `frontend/components/dashboard/knowledge-graph-launcher.tsx`.

## Decisions

- Use existing `admin` role for BTC access.
- Keep Braintrust API key out of frontend and browser payloads.
- Show "No evaluator configured" until Braintrust `scores` fields contain evaluator output.
