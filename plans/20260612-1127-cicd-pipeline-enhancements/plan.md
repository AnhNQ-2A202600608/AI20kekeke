# Plan: CI/CD Pipeline Enhancements

This plan outlines the enhancements to the project's CI/CD pipeline to ensure code quality across both Backend and Frontend, and enforce Pull Request formatting guidelines to reject invalid submissions automatically.

## User Review Required

> [!IMPORTANT]
> The PR format validation will run on every Pull Request targeting the `main` and `dev` branches. PRs that do not follow Conventional Commits for their titles or omit mandatory sections from the PR template in their description will be blocked/failed automatically.

## Open Questions

- None. (Previous questions on branch triggers, scope, and secrets have been resolved).

## Proposed Phases

The work is split into two phases:

- [Phase 1: Frontend Verification Integration](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260612-1127-cicd-pipeline-enhancements/phase-01-frontend-ci.md)
  - Configure caching and lint/build checks for Next.js frontend in `ci.yml`.
- [Phase 2: PR Title and Body Validator](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260612-1127-cicd-pipeline-enhancements/phase-02-pr-validator.md)
  - Implement a Python validation script (`scripts/validate_pr.py`) to verify PR Title (Conventional Commits) and PR Body (Template completion).
  - Configure Github Actions workflow `pr-format-validator.yml` to run the validation script and fail/reject invalid PRs.

## Verification Plan

### Automated Tests
- Trigger GitHub Action workflow manually or via mock pull request.
- Run Python PR validation script locally with valid and invalid inputs.

### Manual Verification
- Verify that the workflow runs successfully and blocks PRs with invalid titles (e.g. `update files`) or incomplete bodies.
