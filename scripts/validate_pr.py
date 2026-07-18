import os
import re
import sys


def main():
    title = os.environ.get("PR_TITLE", "").strip()
    body = os.environ.get("PR_BODY", "").strip()

    print(f"Validating PR Title: {title}")

    # 1. Validate PR Title (Conventional Commits format)
    # Allowed types: feat, fix, docs, refactor, test, chore, ci, style, perf, build, revert
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
        "## Validation",
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
        print(
            "::error::Please replace the placeholder 'Yes / No / N/A — reason:' with your actual selection and rationale in the 'AI Tutor Scope Check' section."
        )
        sys.exit(1)

    print("✓ PR Body validation passed.")
    sys.exit(0)


if __name__ == "__main__":
    main()
