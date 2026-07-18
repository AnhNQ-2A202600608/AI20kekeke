# Phase 1: RNG Calibration and BKT Conflation Resolution

This phase focuses on making the simulator outputs reproducible, deterministic, and scientifically accurate.

## Requirements

1. **RNG Seeding**: 
   - Seed all random draws in the experiments.
   - Replace the python global `random` module in `synthetic_students.py` and experiment scripts with seeded `random.Random(seed)` instances to ensure separate runs are identical.
2. **Box-Muller Polar Protection**:
   - Prevent `ValueError` in Box-Muller polar formula when `u1 = 0.0`.
   - Clamp `u1` to `max(random.random(), 1e-12)`.
3. **BKT Response Resolution**:
   - In `exp2_bkt_validation.py` and `exp3_bandit_comparison.py`, call `simulate_student_response` with `use_bkt=False` for pure Elo, or update the response model to use pure BKT emission logic where appropriate to avoid conflating student ability with slip/guess.

## Implementation Steps

1. Update `eval/synthetic_students.py` to accept random seeds.
2. Modify `eval/exp1_elo_convergence.py` to seed student/question generators.
3. Update `eval/exp2_bkt_validation.py` to fix the `use_bkt` flag usage.
4. Update `eval/exp3_bandit_comparison.py` to update BKT states concurrently with seeded transitions.
5. Update `eval/exp4_graph_propagation.py` to assert BETA/GAMMA decay rates.
6. Verify all tests pass deterministically on local machine.
