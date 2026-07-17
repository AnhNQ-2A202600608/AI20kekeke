# Phase 2: Concurrency & Load Benchmarking

## Context Links
- Critique: [gpt-report.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/gpt-report.md#L309-L330)
- Database SQL Schema: [20260621_dynamic_elo_calibration.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260621_dynamic_elo_calibration.sql)

## Overview
- **Priority**: High
- **Current Status**: Todo
- This phase implements a load testing script `eval/exp6_concurrency_benchmark.py` to compare synchronous database row locking (`FOR UPDATE` contention) against the Asynchronous Outbox model. This provides empirical proof of the "concurrency-safe" claims made in the paper.

## Key Insights
- The title promises a "Concurrency-Safe" engine. Reviewers expect hard numbers showing throughput (attempts/sec) and latency percentiles under concurrent workloads.
- We will simulate concurrent threads submitting student answers to the database and record latency percentiles (P50/P95/P99) and lock wait times.

## Requirements
- Support 10, 50, 100, and 200 concurrent user simulation levels.
- Benchmark:
  1. **Synchronous Mode**: Immediate ELO/BKT recalculation inside transaction using `SELECT FOR UPDATE` on question rows.
  2. **Asynchronous Mode**: Outbox insertion (which only appends records without locking questions or arms).
- Print a summary table in stdout and output a CSV file `eval/results/exp6_concurrency_benchmark.csv`.

## Related Code Files
- [exp6_concurrency_benchmark.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp6_concurrency_benchmark.py) [NEW]
- [eval_suite.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/eval_suite.py) [MODIFY]

## Implementation Steps
1. Create [exp6_concurrency_benchmark.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp6_concurrency_benchmark.py) importing `threading`, `time`, and the database client helper.
2. Implement `run_sync_benchmark(concurrency_level)` which sends concurrent updates directly.
3. Implement `run_async_benchmark(concurrency_level)` which appends to `app.calibration_outbox` and runs the calibration worker in batch mode.
4. Execute both benchmarks for different concurrency scales and capture latency percentiles (P50, P95, P99) and throughput.
5. Save the statistics to `eval/results/exp6_concurrency_benchmark.csv`.
6. Modify `eval_suite.py` to call `exp6_concurrency_benchmark` and append its results to `REPORT.txt`.

## Todo List
- [ ] Implement concurrency load test logic.
- [ ] Configure local Supabase test database connections.
- [ ] Measure latency and throughput differences.
- [ ] Output csv reports and format summary table.
- [ ] Integrate with `eval_suite.py`.

## Success Criteria
- Benchmark completes successfully against local Supabase emulator.
- Table showing clear latency improvements (e.g. lower P99/lock wait times for Async Outbox under high concurrency).
- Concurrency data successfully saved to CSV.

## Risk Assessment
- Database connection pool exhaustion during load tests. *Mitigation*: Ensure thread pool size is matched to Supabase connections or keep pooled connections active.
