# Demo Day Architecture Diagram Plan

Status: Mermaid draft complete; polished visual drawing pending user input.

## Goal

Produce the final visual architecture diagram for Demo Day from the current Mermaid source in `docs/architecture.md`.

## Current Source Of Truth

- `README.md` for production URLs, tech stack, and deliverable links.
- `docs/architecture.md` for the current Mermaid architecture, learning loop, and CI/CD flow.
- `docs/diagram/architecture_diagram.md` for the older diagram copy kept for compatibility.
- `docs/engineering/system-architecture.md` for deeper maintainer context.
- `.github/workflows/ci-backend.yml` and `.github/workflows/ci-frontend.yml` for CI/CD details.

## Visual Requirements

- Show four boundaries: users, Vercel frontend, Render backend, Supabase/cache/data, external AI/observability.
- Emphasize three product flows:
  - Socratic chat retrieves course context and returns cited hints.
  - Adaptive quiz submits attempts and updates Elo/BKT/LinUCB mastery.
  - CI/CD deploys frontend/backend through gated checks.
- Use EduGap palette: avocado background, green/yellow/orange accents, no purple.
- Keep labels readable for slide projection.

## Files To Update Later

- `docs/architecture.md` if final diagram changes the system model.
- `docs/diagram/architecture_diagram.md` if keeping the older diagram path in sync.
- `README.md` if the final exported PNG/PDF path changes.

## Acceptance Criteria

- Mermaid source stays valid and readable in GitHub Markdown.
- Final drawn diagram has one system overview and optional separate learning-loop/CI-CD diagrams.
- README links to the final diagram entry point.
- No secrets, environment values, or private URLs are embedded.
