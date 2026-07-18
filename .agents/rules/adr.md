---
trigger: model_decision
description: - **When:** The user asks questions, proposes changes, or makes technical decisions impacting architecture, databases, or algorithms.
globs: "**/*"
---

# ADR (Architecture Decision Record) Rules

## 1. Proactive Trigger
- **When:** The user asks questions, proposes changes, or makes technical decisions impacting architecture, databases, or algorithms.
- **Action:** Proactively ask and suggest creating or updating an ADR. Propose setting its initial status to `Reviewed`.

## 2. Core Writing Rules (Target: `ADR/*.md`)
- **Brevity:** Keep it extremely concise (3-5 mins read). Avoid essays.
- **Trade-offs:** Show pros/cons clearly. Highlight that it is the best fit for the context, not a perfect solution.
- **Immutability:** Do not delete or overwrite old ADRs. Mark the old ADR as `Superseded by ADR-XXX` and create a new one with `Accepted` status.