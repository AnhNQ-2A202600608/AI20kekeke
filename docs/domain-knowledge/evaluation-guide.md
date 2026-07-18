# Evaluation Guide

This guide details how to track and score run metrics dynamically.

## Evaluation Pipeline
The system includes an `EvaluationRunner` which scans execution histories to compute:
- Success rate
- Error rate
- Runtime duration statistics

## Trigger Evaluation
Run via Makefile task:
```bash
make eval
```
This creates metrics summary output under `data/evals/` containing both a JSON report `eval_report.json` and a Markdown summary `eval_report.md`.
