---
trigger: model_decision
description: Before creating a PR or pushing, check `git diff` for JOURNAL.md changes.
---

# Journal Rule

Before creating a PR or pushing, check `git diff` for JOURNAL.md changes.

If meaningful work has no journal entry, briefly suggest one of two options:
- The user writes a short journal entry themselves.
- You draft a concise journal entry for them.

Keep the reminder short. Do not block PR/push unless the user chooses to add a journal entry.

Format:
## YYYY-MM-DD — Short title

- **Why:** ...
- **What changed:** ...
- **Validation:** ...
- **Follow-up:** ...