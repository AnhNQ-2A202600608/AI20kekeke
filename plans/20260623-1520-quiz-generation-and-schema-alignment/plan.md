# Plan: Quiz Schema Alignment and Hint Generation Ingestion

This plan outlines the steps to align the MCQ and short-answer JSON schemas with the actual database structures, update the validator script, generate 3 tiers of Socratic hints for all existing Day 1 to Day 10 quizzes using LLMs, and update the migration script to sync these hints to Supabase.

## Proposed Changes

### [mcq-generator]

#### [MODIFY] [SKILL.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/.agents/skills/mcq-generator/SKILL.md)
Update the MCQ and short-answer schemas to include the `"hints"` key in each question (list of 3 Socratic hint levels: light, medium, deep) and root-level `"difficulty"`.

#### [MODIFY] [validate-quiz-schema.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/.agents/skills/mcq-generator/scripts/validate-quiz-schema.py)
Update validation logic to enforce:
1. Every question must have a `"hints"` field.
2. The `"hints"` field must be a list containing exactly 3 non-empty strings.
3. Check and report on these constraints.

### [Scripts]

#### [NEW] [convert-existing-quizzes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/scripts/convert-existing-quizzes.py)
A Python script that:
1. Iterates over all JSON files in `frontend/public/quizzes/` (Day 1 - Day 10).
2. For each quiz, if questions do not have hints, calls OpenAI/OpenRouter (using `get_llm()` from `src/services/llm.py`) to generate 3 tiers of Socratic hints (light, medium, deep) in a single batch call per file.
3. Automatically updates the JSON files in place.

#### [MODIFY] [migrate_quizzes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/scripts/migrate_quizzes.py)
Update the migration script to extract `"hints"` from each question in the JSON files and upsert them into the `app.question_hints` table on Supabase.

## Implementation Steps

1. **Step 1**: Update `.agents/skills/mcq-generator/SKILL.md` to document the new schema fields (`difficulty` at root, `hints` in questions).
2. **Step 2**: Update `.agents/skills/mcq-generator/scripts/validate-quiz-schema.py` to enforce the new schema rules.
3. **Step 3**: Create the script `scripts/convert-existing-quizzes.py` to automate the hint generation process for existing files in `frontend/public/quizzes/`.
4. **Step 4**: Update `scripts/migrate_quizzes.py` to support `question_hints` database ingestion.
5. **Step 5**: Run the convert script to generate hints for Day 1 to Day 10 quizzes.
6. **Step 6**: Run the validators to verify that all JSON files pass the new schema gates.

## Verification Plan

### Automated Tests
- Run `python .agents/skills/mcq-generator/scripts/validate-quiz-schema.py frontend/public/quizzes/` to ensure all converted files pass.
- Run `pytest` to make sure backend APIs still pass.
