---
name: adr-writer
description: Write or update Architecture Decision Records (ADR) for this project. Use this skill whenever the user asks to create an ADR, record an architecture decision, compare technical options, supersede an old ADR, validate ADR content, or output a complete ADR file in the ADR/ folder.
---

# ADR Writer

## Scope

This skill creates and updates concise Architecture Decision Records in `ADR/` using the project ADR template and rules.

Use for:
- New architecture or technology decisions.
- Comparing technical alternatives and trade-offs.
- Superseding an existing ADR with a new decision.
- Validating user-provided ADR information before writing.

Do not use for generic documentation, implementation plans, changelogs, or decisions that do not affect architecture/technology direction.

## Required Context

Before writing, read:
1. `ADR/template.md`
2. `.claude/rules/adr.md`
3. Existing `ADR/adr-*.md` files to determine the next ADR number and whether an old ADR must be superseded.

If the user references `.claude/adr`, inspect it only if it exists. Treat `ADR/` as the output folder unless the user explicitly chooses another path.

## Workflow

### 1. Collect decision input

Get enough information to fill a complete ADR:
- Decision title.
- Problem/context that forces the decision.
- Alternatives considered.
- Pros and cons for each alternative.
- Selected alternative.
- Rationale for selection.
- Consequences and risks.
- Status: usually `Accepted`; use `Superseded by ADR-XXX` only for older ADRs being replaced.

If information is missing, ask concise onboarding questions in batches of 3-6. Keep asking until the ADR can be written without guessing.

### 2. Validate if user supplied enough info

If the user already supplied all core details, do not ask the full onboarding flow. Instead summarize the interpreted decision and ask one validation question:

"Mình hiểu ADR sẽ ghi nhận: [summary]. Có đúng để mình xuất file ADR không?"

Proceed after confirmation or correction.

### 3. Handle superseded decisions

When the new decision replaces an accepted ADR:
1. Identify the old ADR file.
2. Create the new ADR with status `Accepted`.
3. Update the old ADR status line to `Superseded by ADR-XXX`.
4. Do not rewrite old rationale/history except the status.

### 4. Write the ADR

Output path:
`ADR/adr-XXX-kebab-case-title.md`

Numbering:
- Scan existing ADR files.
- Use the next numeric ADR ID.
- Preserve 3-digit format.

Generate the base ADR structure with:

```powershell
& "~\.claude\skills\.venv\Scripts\python.exe" ".\.claude\skills\adr-writer\scripts\render-adr-template.py" --id XXX --title "Decision title" --date YYYY-MM-DD
```

Then replace placeholders with validated decision content. Use `references/sqlite-postgres-example.md` as the style example when needed.

## Writing Rules

- Write in Vietnamese unless user requests another language.
- Keep ADR readable in 3-5 minutes.
- Show trade-offs clearly; no perfect-solution framing.
- Prefer short bullets over long paragraphs.
- Do not invent alternatives, constraints, dates, or rationale. Ask instead.
- Use today's date from context.
- Keep title specific and decision-oriented.
- Mention project scope impact when relevant to Adaptive-first AI Tutor direction.

## Security and Privacy

Do not include secrets, private keys, credentials, tokens, or confidential vendor terms in ADR content. If the user provides sensitive values, replace with generic names and warn briefly.

## Completion Checklist

Before reporting done:
- ADR file created under `ADR/`.
- Filename matches ADR number and kebab-case title.
- Status line correct.
- Alternatives include pros and cons.
- Decision and rationale align with context.
- Consequences include at least one cost/risk.
- Superseded old ADR status updated if applicable.
