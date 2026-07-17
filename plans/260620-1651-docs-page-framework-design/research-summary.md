# Research Summary — Docs Framework Choice

## Summary

Recommended framework: **Fumadocs**.

Reason: best fit for embedding a documentation experience into the existing Next.js app while keeping customization and MDX-based authoring simple.

## Comparison

| Framework | Fit | Notes |
|---|---:|---|
| Fumadocs | High | Best fit for Next.js app, flexible docs shell, MDX/content-first |
| Nextra | Medium-high | Simpler but less flexible for custom AI Tutor design |
| Mintlify | Medium | Polished hosted docs, but platform-oriented and less integrated |
| Docusaurus | Medium | Strong standalone docs platform, heavier for this repo |
| Astro Starlight | Medium-low | Excellent static docs, but adds Astro stack |

## Decision

Use Fumadocs for MVP docs shell.

## Scope Guard

Do not migrate all existing `docs/` content yet. Keep root `docs/` as source-of-truth until content migration is explicitly requested.

## Unresolved Questions

- Should final docs content be duplicated, migrated, or generated from root `docs/` later?
- Should docs be public or internal-only before MVP release?
