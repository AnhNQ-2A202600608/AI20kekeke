import json
import uuid
from pathlib import Path

root_dir = Path(__file__).parent.parent
quizzes_dir = root_dir / "frontend" / "public" / "quizzes" / "day1"
output_sql = root_dir / "db" / "seed" / "seed-day1.sql"

COURSE_UUID = "00000000-0000-0000-0000-000000000001"  # AI & LLM Bootcamp
DEFAULT_USER_UUID = "d3b07384-d113-4ec5-a58e-0f2d87e07661"  # Default creator

MCQ_ELO_MAP = {"dễ": 900.0, "bình thường": 1100.0, "trung bình": 1100.0, "khó": 1300.0}

SFIA_ELO_MAP = {"SFIA L3": 1000.0, "SFIA L4": 1200.0, "SFIA L5": 1400.0}

EXISTING_CONCEPT_MAP = {
    "day1-basics": "00000000-0000-0000-0000-000000000101",
    "day2-basics": "00000000-0000-0000-0000-000000000102",
    "react-loop-basics": "00000000-0000-0000-0000-000000000103",
    "prompt-context-foundations": "00000000-0000-0000-0000-000000000104",
    "ai-product-uncertainty-foundations": "00000000-0000-0000-0000-000000000105",
    "hackathon-day-preview": "00000000-0000-0000-0000-000000000106",
    "day7-basics": "00000000-0000-0000-0000-000000000107",
    "day8-basics": "00000000-0000-0000-0000-000000000108",
    "day9-basics": "00000000-0000-0000-0000-000000000109",
    "day10-basics": "00000000-0000-0000-0000-000000000110",
}


def get_concept_uuid(set_id: str) -> str:
    if set_id in EXISTING_CONCEPT_MAP:
        return EXISTING_CONCEPT_MAP[set_id]
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"concept.{set_id}"))


def get_question_uuid(set_id: str, index: int) -> str:

    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"question.{set_id}.{index}"))


def escape_sql_string(val: str) -> str:
    if val is None:
        return "NULL"
    # Escape single quotes for PostgreSQL
    return val.replace("'", "''")


def main():
    quiz_files = [
        "day1-basics.json",
        "day1-tokenization.json",
        "day1-llm-architecture.json",
        "day1-inference-decoding.json",
        "day1-short-answer.json",
    ]

    sql_lines = [
        "-- ============================================",
        "-- DAY 1 CONCEPTS & QUESTIONS SEED DATA",
        "-- ============================================",
        "BEGIN;",
        "",
    ]

    for filename in quiz_files:
        file_path = quizzes_dir / filename
        if not file_path.exists():
            print(f"[ERROR] {filename} does not exist at {file_path}")
            continue

        with open(file_path, encoding="utf-8") as f:
            data = json.load(f)

        set_id = data.get("id")
        title = data.get("title")
        difficulty_str = data.get("difficulty", "trung bình").lower()

        concept_uuid = get_concept_uuid(set_id)

        # Concept insert
        sql_lines.append(f"-- Concept: {set_id} ({title})")
        sql_lines.append(
            f"INSERT INTO app.concepts (id, course_id, code, name, status) "
            f"VALUES ('{concept_uuid}', '{COURSE_UUID}', '{set_id}', '{escape_sql_string(title)}', 'active') "
            f"ON CONFLICT (course_id, code) DO UPDATE SET name = EXCLUDED.name;"
        )

        # Questions insert
        questions = data.get("questions", [])
        for q_idx, q in enumerate(questions):
            question_uuid = get_question_uuid(set_id, q_idx)
            prompt = q.get("question")
            options = q.get("options")
            correct = q.get("answer")
            explanation = q.get("explanation")

            # Short answer fields
            expected_answer = q.get("expected_answer")
            evaluation_points = q.get("evaluation_points")
            sfia_level = q.get("sfia_level")
            competency = q.get("competency")

            is_mcq = options is not None

            if is_mcq:
                q_type = "mcq"
                difficulty_elo = MCQ_ELO_MAP.get(difficulty_str, 1100.0)
                answer_key = {"options": options, "correct": correct, "explanation": explanation}
            else:
                q_type = "short_answer"
                difficulty_elo = SFIA_ELO_MAP.get(sfia_level, 1200.0)
                answer_key = {
                    "expected_answer": expected_answer,
                    "evaluation_points": evaluation_points,
                    "sfia_level": sfia_level,
                    "competency": competency,
                }

            answer_key_json = json.dumps(answer_key, ensure_ascii=False)

            sql_lines.append(
                f"INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status) "
                f"VALUES ("
                f"  '{question_uuid}', "
                f"  '{COURSE_UUID}', "
                f"  '{concept_uuid}', "
                f"  '{q_type}', "
                f"  '{escape_sql_string(prompt)}', "
                f"  '{escape_sql_string(answer_key_json)}'::jsonb, "
                f"  {difficulty_elo}, "
                f"  'published'"
                f") "
                f"ON CONFLICT (id) DO UPDATE SET "
                f"  prompt = EXCLUDED.prompt, "
                f"  answer_key = EXCLUDED.answer_key, "
                f"  difficulty_elo = EXCLUDED.difficulty_elo;"
            )
        sql_lines.append("")

    sql_lines.append("COMMIT;")

    with open(output_sql, "w", encoding="utf-8") as out:
        out.write("\n".join(sql_lines))
    print(f"[SUCCESS] Generated SQL seed file at: {output_sql}")


if __name__ == "__main__":
    main()
