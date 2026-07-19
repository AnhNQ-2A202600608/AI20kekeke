# CI/CD Gates & Security Scanners Configured - F-2b

This document logs the configuration of CI gates and security scanning tools inside Mentora's repository.

## 1. Pytest Coverage Gates
- We ran a full coverage audit using standard Python `coverage` package to avoid stdout/stderr redirect/capture issues.
- **Baseline total coverage achieved**: **70%** (passing the gate requirement `>= 65%`).
- **Enforced Coverage Gates**:
  - Global project coverage: `>= 65%`
  - `src/services/adaptive/` coverage: `>= 42%`
  - `src/services/auth/` coverage: `>= 48%`
- In `ci-backend.yml`, we configure the CI to enforce these boundaries during pull request and push:
  ```bash
  uv run coverage report --include="src/*" --fail-under=65
  uv run coverage report --include="src/services/adaptive/*" --fail-under=42
  uv run coverage report --include="src/services/auth/*" --fail-under=48
  ```

## 2. Backend Security Scanners
The backend CI pipeline (`ci-backend.yml`) has been updated to run security checks on push/pull-request:
1. **Gitleaks**: Scans git history for committed secrets, tokens, or credentials.
2. **Semgrep**: Scans Python codebase for security vulnerabilities and dangerous patterns (using the `auto` ruleset).
3. **pip-audit**: Automatically audits lockfile dependencies for published CVEs.
4. **Trivy**: Scans files and folders in the workspace filesystem for common vulnerabilities.

No warnings/scans run with `continue-on-error` or `|| true`, meaning any security failure will immediately block the PR.

## 3. Frontend Security Scanners
The frontend CI pipeline (`ci-frontend.yml`) has been updated to run dependency checks:
1. **pnpm audit**: Performs a dependency security audit verifying no high/critical vulnerabilities exist.
   ```bash
   pnpm audit --audit-level=high
   ```

All gates are fully active and configured on the `dev` and `main` branches.
