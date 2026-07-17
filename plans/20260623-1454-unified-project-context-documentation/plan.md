# Plan: Unified Project Context and Documentation Index for AI Agents

## Overview
This plan defines the creation of a single consolidated context file (`PROJECT-CONTEXT.md`) and a standard `llms.txt` file at the root. These files serve as the "Single Source of Truth" (SSoT) for any AI Agent (Web AI like ChatGPT/Claude, or IDE CLI like Claude Code/Antigravity) to fully grasp the idea, architecture, algorithms, research background, and file indexing of the EduGap project.

## Proposed Changes

### [New Files]

#### [NEW] [PROJECT-CONTEXT.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/PROJECT-CONTEXT.md)
This file will contain:
1. **Core Concept & Value Proposition**: Description of EduGap, primary user roles, vibrant Cozy Avocado design styles, and Socratic pedagogical tone.
2. **AS-IS Architecture**: Sequence flow (Next.js FE -> Next.js BFF -> FastAPI BE -> Supabase DB) and Supabase database entity mapping.
3. **Algorithm Specs (Mathematics & Logic)**: Complete mathematical formulations for Elo (Dual update, hints deduction, AI fraud freeze), BKT (Posterior calculation, transition, absorption prevention), Contextual Bandit (LinUCB context vector, Sherman-Morrison optimization, ZPD reward), and Graphusion (PREREQUISITE propagation, Graph BKT).
4. **Research & Literature Synthesis**: Comprehensive summaries of the 10+ research topics (BKT, Contextual Bandit, IRT, DBR, Mooclet, Cold Start, Multi-skill Knowledge Tracing, Graphusion).
5. **Document Directory Index**: A detailed catalog of every single fragmented file in the `docs/` folder with 1-2 sentence summaries. This helps CLI agents navigate specific docs easily.
6. **Architectural Decisions (ADR) Summary**: Summary of all 18 ADR files (from ADR-002 to ADR-013) detailing choices like pgvector, pessimistic locking (`SELECT FOR UPDATE`), mssv auth, etc.
7. **Writing Guidelines**: Instructions for AI on how to write architectural and project documents for this repo.

#### [NEW] [llms.txt](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/llms.txt)
A standard-compliant index file at the root of the repository following the [llmstxt.org](https://llmstxt.org) specification, pointing to `PROJECT-CONTEXT.md` as the primary guide.

## Implementation Steps

1. **Step 1**: Compile and summarize all research papers in `docs/research/` (e.g. `contextual-bandit.md`, `bayesian-knowledge-tracing.md`, `item-response-theory.md`, `mooclet-framework.md`, `design-based-research.md`, `adaptive-learning-and-cold-start.md`, `multi-skill-knowledge-tracing-propagation.md`, `graphusion-research.md`).
2. **Step 2**: Extract and summarize key information from `docs/domain-knowledge/`, `docs/product/`, and `docs/engineering/`.
3. **Step 3**: Summarize all 18 ADR files in the `ADR/` directory.
4. **Step 4**: Write the comprehensive `PROJECT-CONTEXT.md` file in Vietnamese for maximum clarity, maintaining mathematical formulas in LaTeX format.
5. **Step 5**: Write `llms.txt` in English.
