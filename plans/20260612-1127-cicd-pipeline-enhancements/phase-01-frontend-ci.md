# Phase 1: Frontend Verification Integration

This phase integrates verification steps for the Next.js/React frontend into the CI workflow.

## Overview
- **Priority**: High
- **Status**: Pending Approval
- **Goal**: Ensure that all changes to the frontend do not introduce build or linting errors.

## Proposed Changes

### [MODIFY] [ci.yml](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/.github/workflows/ci.yml)

We will modify `.github/workflows/ci.yml` to split backend and frontend checks into two parallel jobs for faster execution:

1. **`backend`**:
   - Set up Python.
   - Install dependencies.
   - Run `ruff` lint check and `pytest` test suite.
2. **`frontend`**:
   - Set up Node.js (v22).
   - Install `pnpm` (v10).
   - Restore pnpm/Next.js cache to optimize build times.
   - Run `pnpm lint` and `pnpm build`.

## Implementation Steps

1. Edit `.github/workflows/ci.yml` to add the `frontend` job:
   ```yaml
   name: CI

   on:
     push:
       branches: [main, dev]
     pull_request:
       branches: [main, dev]

   jobs:
     backend:
       name: Backend (Python)
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Set up Python
           uses: actions/setup-python@v5
           with:
             python-version: "3.11"
             cache: pip
         - name: Install dependencies
           run: pip install -r requirements.txt
         - name: Lint with ruff
           run: ruff check src/ tests/
         - name: Run tests
           run: pytest tests/ -v --tb=short
           env:
             APP_ENV: test
             OPENAI_API_KEY: test-key

     frontend:
       name: Frontend (Next.js)
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Install pnpm
           uses: pnpm/action-setup@v4
           with:
             version: 10
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: 22
             cache: 'pnpm'
             cache-dependency-path: 'frontend/pnpm-lock.yaml'
         - name: Install dependencies
           working-directory: ./frontend
           run: pnpm install --frozen-lockfile
         - name: Lint with ESLint
           working-directory: ./frontend
           run: pnpm lint
         - name: Build verification
           working-directory: ./frontend
           run: pnpm build
   ```

## Success Criteria
- The GitHub Actions workflow is triggered on push/PR to `dev` and `main` branches.
- Both the `backend` and `frontend` jobs execute successfully and run in parallel.
