# Plan: Implement Python Adaptive Learning Engine (BKT + Elo + LinUCB)

This plan outlines the design and implementation steps for integrating Bayesian Knowledge Tracing (BKT), Elo ratings, and Contextual Bandit (LinUCB) into the FastAPI backend of C2-App-125.

## Context & Requirements

The system must recommend questions within the student's Zone of Proximal Development (ZPD) (target success rate $\approx 75\%$) and dynamically estimate student concept mastery.
- **BKT**: Estimates mastery probability $P(L_t)$ on each concept node.
- **Elo**: Estimates general competency score ($\theta$) and question difficulty ($b$).
- **Contextual Bandit (LinUCB)**: Selects next question based on student context (BKT + Elo) and updates decision policy weights.

## Proposed Submodules

1. `src/services/adaptive/elo.py`: Elo tracking, expected success formulas, and Socratic hint discount logic.
2. `src/services/adaptive/bkt.py`: BKT state updates, expected accuracy computation.
3. `src/services/adaptive/bandit.py`: Custom LinUCB matrix calculations using NumPy.
4. `src/models/adaptive_schemas.py`: Pydantic request/response models.
5. `src/api/routes/adaptive.py`: Router for `/recommend` and `/submit` APIs.
6. `tests/services/test_adaptive.py`: Unit tests.
7. `eval/simulation_adaptive.py`: Simulation evaluation script.

## Implementation Steps

1. **Add Dependencies**: Add `numpy` to `requirements.txt`.
2. **Implement Core Math**:
   - Write unit-testable Elo, BKT, and LinUCB mathematical functions.
3. **Repository/Database Integration**:
   - Write repository functions to load/save state from Supabase schema.
4. **FastAPI Routes**:
   - Implement recommendation and submission controllers.
5. **Verify**:
   - Add unit tests and run simulation.
