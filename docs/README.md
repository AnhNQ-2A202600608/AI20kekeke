# Project Documentation

## Overview

Docs are split by purpose so agents and contributors can find the right context quickly.

## Structure

```text
docs/
├── domain-knowledge/    # Product algorithms and learning-science behavior
├── engineering/         # Architecture, code standards, CI/CD, repo summary
├── product/             # PDR, roadmap, design guidelines
├── research/            # Algorithmic research (Contextual Bandit, BKT, Cold Start)
└── notion-address-registry.md # Notion page/database ID index for fast tooling
```

## Domain Knowledge

- [`domain-knowledge/adaptive-learning.md`](domain-knowledge/adaptive-learning.md): Elo-style mastery tracking and adaptive practice rules.
- [`domain-knowledge/spaced-repetition.md`](domain-knowledge/spaced-repetition.md): active recall, SM-2-style scheduling, AI grading constraints.

## Engineering

- [`engineering/system-architecture.md`](engineering/system-architecture.md): target service boundaries, data stores, and core flows.
- [`engineering/code-standards.md`](engineering/code-standards.md): implementation, testing, documentation, Git, AI/RAG standards.
- [`engineering/deployment-guide.md`](engineering/deployment-guide.md): CI/CD baseline, branch flow, deployment roadmap.
- [`engineering/codebase-summary.md`](engineering/codebase-summary.md): current repo structure and next engineering decisions.

## Product

- [`product/project-overview-pdr.md`](product/project-overview-pdr.md): product definition, MVP users, features, safety scope.
- [`product/project-roadmap.md`](product/project-roadmap.md): phase roadmap from repo foundation to release.
- [`product/design-guidelines.md`](product/design-guidelines.md): visual direction, color states, UX/accessibility rules.
- [`product/gtm-monetization-one-pager.md`](product/gtm-monetization-one-pager.md): GTM proposal, monetization hypothesis, evidence needs, and missing commercial docs.

## Research

- [`research/contextual-bandit.md`](research/contextual-bandit.md): Research on balancing exploration and exploitation for question recommendation.
- [`research/bayesian-knowledge-tracing.md`](research/bayesian-knowledge-tracing.md): Research on tracking mastery probability using Hidden Markov Models.
- [`research/mooclet-framework.md`](research/mooclet-framework.md): Research on the MOOClet architecture (Modular Experimentation and Personalization) for adaptive learning.
- [`research/adaptive-learning-and-cold-start.md`](research/adaptive-learning-and-cold-start.md): Synthesis of industry architectures and strategies to mitigate the cold start problem.
- [`research/item-response-theory.md`](research/item-response-theory.md): Research on psychometric models (1PL/2PL/3PL) for item difficulty and student latent trait estimation.
- [`research/design-based-research.md`](research/design-based-research.md): Research on Design-Based Research methodology for student cohort testing.

## Notion Integration

- [`notion-address-registry.md`](notion-address-registry.md): central repository of Notion root, hub, database, and data source IDs. Use this registry to quickly resolve target IDs for command-line tooling (`ntn`) or Notion MCP queries.

## Maintenance Rules

- Update `domain-knowledge/` when adaptive algorithms, mastery rules, spaced repetition, or AI grading behavior changes.
- Update `engineering/` when architecture, stack, repo commands, CI/CD, deployment, or code standards change.
- Update `product/` when MVP scope, roadmap, personas, design direction, or user-facing product behavior changes.
- Update `research/` when new learning-science models, adaptive research papers, or algorithmic evaluations are completed.
