# Phase 2: PR Title and Body Validator

This phase implements automated validation for PR titles and descriptions, rejecting PRs that do not comply with the repository formatting rules.

## Overview
- **Priority**: High
- **Status**: Pending Approval
- **Goal**: Reject/fail PR checks automatically if the title does not follow Conventional Commits or if the body does not contain the required sections from the PR template.

## Proposed Changes

### [NEW] [validate_pr.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/scripts/validate_pr.py)
A Python script that reads the PR title and body from environment variables and validates:
- **Title**: Must start with a Conventional Commit prefix (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`).
- **Body**: Must contain all mandatory headings from `PULL_REQUEST_TEMPLATE.md` (`## Summary`, `## Problem`, `## Solution`, `## AI Tutor Scope Check`, `## Submission Checklist`, `## Validation`) and check that default placeholders are updated.

### [NEW] [pr-format-validator.yml](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/.github/workflows/pr-format-validator.yml)
A GitHub Actions workflow that triggers on Pull Requests to `main` and `dev` branches. It passes the PR title and body as environment variables to `scripts/validate_pr.py`.

---

## Detailed Implementation

### 1. Verification Script: `scripts/validate_pr.py`

```python
import os
import re
import sys

def main():
    title = os.environ.get("PR_TITLE", "").strip()
    body = os.environ.get("PR_BODY", "").strip()

    print(f"Validating PR Title: {title}")
    
    # 1. Validate PR Title (Conventional Commits format)
    # Allows types like: feat, fix, docs, refactor, test, chore, ci, style, perf, build, revert
    title_pattern = r"^(feat|fix|docs|refactor|test|chore|ci|style|perf|build|revert)(\(.+\))?: .+$"
    if not re.match(title_pattern, title, re.IGNORECASE):
        print("::error::PR title does not follow Conventional Commit format.")
        print("Expected formats: 'feat: add database lock' or 'fix(auth): resolve login bug'")
        print("Allowed prefixes: feat, fix, docs, refactor, test, chore, ci, style, perf, build, revert")
        sys.exit(1)

    print("✓ PR Title validation passed.")

    # 2. Validate PR Body (Check required sections)
    required_sections = [
        "## Summary",
        "## Problem",
        "## Solution",
        "## AI Tutor Scope Check",
        "## Submission Checklist",
        "## Validation"
    ]

    missing_sections = []
    for section in required_sections:
        if section not in body:
            missing_sections.append(section)

    if missing_sections:
        print("::error::PR body is missing mandatory sections from PULL_REQUEST_TEMPLATE.md.")
        for section in missing_sections:
            print(f"  Missing: {section}")
        sys.exit(1)

    # 3. Check for unmodified template placeholders
    if "Yes / No / N/A — reason:" in body:
        print("::error::Please replace the placeholder 'Yes / No / N/A — reason:' with your actual selection and rationale in the 'AI Tutor Scope Check' section.")
        sys.exit(1)

    print("✓ PR Body validation passed.")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

### 2. Workflow File: `.github/workflows/pr-format-validator.yml`

```yaml
name: Validate PR Format

on:
  pull_request:
    branches: [main, dev]
    types: [opened, edited, synchronize, reopened]

jobs:
  validate:
    name: Validate Title and Description
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Run PR Validation Script
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_BODY: ${{ github.event.pull_request.body }}
        run: python scripts/validate_pr.py
```

---

## Verification Plan

1. Run the script locally with mock environment variables representing valid/invalid titles and bodies.
2. Verify that invalid titles (e.g. `minor changes`, `fixed the bug`) cause a non-zero exit code.
3. Verify that incomplete descriptions cause a non-zero exit code.
4. Verify that complete, standard PR formats exit with 0.
