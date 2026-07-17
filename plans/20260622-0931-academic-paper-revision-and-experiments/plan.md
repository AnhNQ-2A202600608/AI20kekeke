# Plan: Academic Paper Revision and Experimental Alignment

This plan outlines the phases to address the peer review critique of the **EduGap Adaptive Learning Engine** technical paper, align statistical metrics, implement concurrency load tests, and compile the final camera-ready PDF.

## Phases

### [Phase 1: Metric Alignment & Bibliography Clean-up](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-0931-academic-paper-revision-and-experiments/phase-01-align-metrics-and-bib.md)
- **Status**: [ ] Todo
- **Target**: Align simulated metrics (BKT AUC, Spaced Repetition calibration), update `references.bib` formatting, and insert citations in body text.

### [Phase 2: Concurrency & Load Benchmarking](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-0931-academic-paper-revision-and-experiments/phase-02-concurrency-load-test.md)
- **Status**: [ ] Todo
- **Target**: Create `eval/exp6_concurrency_benchmark.py` and benchmark sync `FOR UPDATE` vs Async Outbox throughput/latency.

### [Phase 3: Bandit Significance & Ablation Study](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-0931-academic-paper-revision-and-experiments/phase-03-bandit-and-ablation.md)
- **Status**: [ ] Todo
- **Target**: Upgrade LinUCB significance tests to paired t-tests and analyze ZPD hit rate mismatch vs Greedy.

### [Phase 4: LaTeX Compilation & Formatting](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-0931-academic-paper-revision-and-experiments/phase-04-latex-compile.md)
- **Status**: [ ] Todo
- **Target**: Correct LaTeX list structures, compile final PDF, and verify layout margins.

## Key Dependencies
- **Supabase Local Emulator**: Needed in Phase 2 for database benchmarking.
- **Python pytinytex / scipy**: Needed for compilation and paired t-tests.
