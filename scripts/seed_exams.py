import json
import os
import sys
import uuid

# Thêm root path vào PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.services.adaptive.supabase_database import SupabaseAdaptiveDatabase
from src.services.supabase_config import get_backend_supabase_config

# Bản đồ ánh xạ các concept từ file JSON sang concept code thực tế trên DB
CONCEPT_MAPPING = {
    # Midterm Common
    "midterm-rag": "d8-rag-pipeline",
    "midterm-grounding": "d8-rag-pipeline",
    "midterm-react": "d3-agentic-react",
    "midterm-agent-patterns": "d3-agentic-react",
    "midterm-context-engineering": "d4-tool-calling",
    "midterm-security": "d11-guardrails-safety",
    "midterm-prompt-engineering": "d4-prompt-engineering",
    "midterm-observability": "d13-monitoring-observability",
    # Business track
    "midterm-business-product": "d16-t1-product-strategy",
    "midterm-business-roi": "d18-t1-financial-roi",
    "midterm-business-governance": "d21-t1-governance-risk",
    "midterm-business-compliance": "d22-t1-compliance",
    "midterm-business-change": "d23-t1-change-adoption",
    # Infrastructure track
    "midterm-lakehouse": "d18-t2-data-lakehouse",
    "midterm-gpu-finops": "d16-t2-cloud-infra",
    "midterm-model-serving": "d20-t2-model-serving",
    "midterm-observability": "d23-t2-observability-stack",  # noqa: F601
    "midterm-serving-cost": "d20-t2-model-serving",
    "midterm-ai-cicd": "d21-t2-cicd",
    "midterm-ai-security": "d24-t2-data-governance",
    # App Build track
    "midterm-advanced-agents": "d16-t3-advanced-agents",
    "midterm-production-rag": "d18-t3-production-rag",
    "midterm-lora": "d21-t3-finetuning-lora",
    "midterm-ragas-eval": "d24-t3-ragas-guardrails",
    "midterm-code-challenge": "d23-t3-langgraph",
}

FALLBACK_CONCEPT = "d1-ai-llm-foundations"
COURSE_ID = "00000000-0000-0000-0000-000000000001"  # AI20-EDUGAP Course ID


def main():
    print("=== BẮT ĐẦU SEED BỘ ĐỀ THI GIỮA KỲ / CUỐI KỲ ===")

    config = get_backend_supabase_config()
    if not config.url or not config.secret_key:
        print("Lỗi: Không tìm thấy Supabase credentials. Hãy kiểm tra file .env")
        sys.exit(1)

    db = SupabaseAdaptiveDatabase(config.url, config.secret_key)

    # 1. Lấy map concept_code -> concept_id từ database
    print("Đang tải danh sách Concepts từ database...")
    concepts_resp = db.app_client.table("concepts").select("id, code").execute()
    db_concepts = {row["code"]: row["id"] for row in (concepts_resp.data or [])}
    print(f"Đã tải {len(db_concepts)} concepts từ DB.")

    # 2. Đọc file quiz-manifest.json
    manifest_path = os.path.join("frontend", "public", "quiz-manifest.json")
    if not os.path.exists(manifest_path):
        print(f"Lỗi: Không tìm thấy file {manifest_path}")
        sys.exit(1)

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    exam_sets = [
        s
        for s in manifest.get("sets", [])
        if s.get("parent_id") == "midterm-review" and "short-answer" not in s.get("id", "")
    ]
    print(f"Tìm thấy {len(exam_sets)} bộ đề MCQ trong manifest.")

    for es in exam_sets:
        set_id = es["id"]
        title = es["title"]
        description = es.get("description", "")
        difficulty = es.get("difficulty", "bình thường")

        print(f"\n--- Đang xử lý bộ đề: {set_id} ({title}) ---")

        # 2.1. Thêm bộ đề vào app.exam_sets
        exam_set_data = {
            "course_id": COURSE_ID,
            "code": set_id,
            "title": title,
            "description": description,
            "exam_type": "midterm",
            "difficulty": difficulty,
            "duration_minutes": 45,
            "max_score": 10.0,
            "status": "published",
        }

        # Tìm xem bộ đề đã có chưa
        exists_resp = db.app_client.table("exam_sets").select("id").eq("code", set_id).execute()
        if exists_resp.data:
            exam_set_uuid = exists_resp.data[0]["id"]
            print(f"Bộ đề đã tồn tại (id={exam_set_uuid}). Đang cập nhật...")
            db.app_client.table("exam_sets").update(exam_set_data).eq("id", exam_set_uuid).execute()
        else:
            insert_resp = db.app_client.table("exam_sets").insert(exam_set_data).execute()
            exam_set_uuid = insert_resp.data[0]["id"]
            print(f"Đã tạo bộ đề mới (id={exam_set_uuid}).")

        # 2.2. Đọc file câu hỏi chi tiết
        quiz_file_path = os.path.join("frontend", "public", "quizzes", "midterm-review", f"{set_id}.json")
        if not os.path.exists(quiz_file_path):
            print(f"Cảnh báo: Không tìm thấy file câu hỏi {quiz_file_path}. Bỏ qua.")
            continue

        with open(quiz_file_path, encoding="utf-8") as f:
            quiz_data = json.load(f)

        questions = quiz_data.get("questions", [])
        print(f"Đọc thành công {len(questions)} câu hỏi từ file JSON.")

        for idx, q in enumerate(questions):
            prompt = q["question"]
            options = q["options"]
            correct = q["answer"]
            explanation = q.get("explanation", "")
            hints = q.get("hints", [])
            concepts = q.get("concepts", [])

            # Phân giải concept chính và danh sách concept phụ
            resolved_concept_ids = []
            for c_name in concepts:
                mapped_code = CONCEPT_MAPPING.get(c_name, c_name)
                cid = db_concepts.get(mapped_code)
                if cid:
                    resolved_concept_ids.append(cid)

            if not resolved_concept_ids:
                # Dùng fallback concept nếu không khớp concept nào
                fallback_cid = db_concepts.get(FALLBACK_CONCEPT)
                if fallback_cid:
                    resolved_concept_ids.append(fallback_cid)

            primary_concept_id = resolved_concept_ids[0] if resolved_concept_ids else None
            if not primary_concept_id:
                print(f"Cảnh báo: Không thể giải quyết concept cho câu hỏi {idx + 1}. Bỏ qua.")
                continue

            # Đắp đáp án vào answer_key jsonb
            answer_key = {"options": options, "correct": correct, "explanation": explanation}

            # Tạo UUID ngẫu nhiên cho câu hỏi hoặc dùng ID cố định nếu cần
            # Để tránh duplicate khi chạy script nhiều lần, ta tạo UUID5 dựa trên đề bài
            q_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, prompt))

            question_data = {
                "id": q_uuid,
                "course_id": COURSE_ID,
                "concept_id": primary_concept_id,
                "type": "mcq",
                "prompt": prompt,
                "answer_key": answer_key,
                "difficulty_elo": 1200.0,
                "calibration_status": "published",
            }

            # Chèn hoặc cập nhật câu hỏi
            db.app_client.table("questions").upsert(question_data).execute()

            # Gán liên kết Nhiều-Nhiều concept trong app.question_concepts
            for cid in resolved_concept_ids:
                qc_data = {"question_id": q_uuid, "concept_id": cid}
                db.app_client.table("question_concepts").upsert(qc_data).execute()

            # Thêm gợi ý hints
            for h_idx, hint_text in enumerate(hints[:3]):  # Giới hạn tối đa 3 level hint
                hint_data = {"question_id": q_uuid, "level": h_idx + 1, "hint_text": hint_text}
                db.app_client.table("question_hints").upsert(hint_data).execute()

            # Tạo liên kết exam_questions
            eq_data = {"exam_set_id": exam_set_uuid, "question_id": q_uuid, "sort_order": idx + 1, "weight": 1.0}
            db.app_client.table("exam_questions").upsert(eq_data).execute()

        print(f"Đã seed xong các câu hỏi cho bộ đề {set_id}.")

    print("\n=== HOÀN THÀNH SEED DỮ LIỆU ===")


if __name__ == "__main__":
    main()
