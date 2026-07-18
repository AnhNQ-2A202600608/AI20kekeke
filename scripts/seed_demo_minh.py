"""Seed the golden "happy-case" personalization demo for student *Trần Minh* (lớp 7).

Kịch bản demo:
    Minh tự tin làm bài **Tỉ lệ thức** (bề mặt lớp 7) nhưng sai có hệ thống.
    DiagnosticEngine dò ngược chuỗi tiền quyết:
        ti-le-thuc (7) → ti-so (6) → tinh-chat-co-ban-cua-phan-so (5) → phan-so (5)
    Minh vẫn VỮNG "khái niệm phân số" (lớp 5) nên engine dừng sạch và kết luận
    gốc rễ lỗ hổng là **Tính chất cơ bản của phân số (lớp 5)**.
    Chatbot chỉ diễn đạt lại kết quả engine (không tự chẩn đoán).

Script này là *nguồn dữ liệu duy nhất* (DRY) cho cả hai tầng:
    1. Engine local  -> data/knowledge_graph.json, data/questions.json,
                        data/chat/profiles/hs-lop7-minh.json, data/mastery.db
    2. Supabase SQL  -> db/seed/seed-demo-minh.sql (idempotent)

Chạy:  uv run python scripts/seed_demo_minh.py
"""

from __future__ import annotations

import json
import sqlite3
import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

DATA_DIR = ROOT / "data"
COURSE_UUID = "00000000-0000-0000-0000-000000000001"  # AI & LLM / EduGap course
STUDENT_KEY = "hs-lop7-minh"  # khoá học sinh cho engine local
STUDENT_UUID = "d3b07384-d113-4ec5-a58e-0f2d87e07777"  # học sinh Minh cho Supabase
STUDENT_NAME = "Trần Minh"
STUDENT_EMAIL = "minh.demo@edugap.vn"
STUDENT_MSSV = "2A202600777"
ROOT_CAUSE = "tinh-chat-co-ban-cua-phan-so"
SURFACE = "ti-le-thuc"

# ---------------------------------------------------------------------------
# 1. Đồ thị tri thức (DAG). Chuỗi chẩn đoán để single-parent cho tất định.
#    Các node "richness" (con của node trên chuỗi) làm dày đồ thị mà không
#    ảnh hưởng tới thứ tự đi xuống của engine.
# ---------------------------------------------------------------------------
NODES: list[dict] = [
    {
        "id": "ti-le-thuc",
        "lop": 7,
        "mon": "Toán",
        "mach_noi_dung": "Số và Đại số",
        "mo_ta": "Vận dụng tính chất tỉ lệ thức và đại lượng tỉ lệ thuận",
        "tien_quyet": ["ti-so"],
    },
    {
        "id": "ti-so",
        "lop": 6,
        "mon": "Toán",
        "mach_noi_dung": "Số và Đại số",
        "mo_ta": "Hiểu và tính tỉ số của hai đại lượng",
        "tien_quyet": [ROOT_CAUSE],
    },
    {
        "id": ROOT_CAUSE,
        "lop": 5,
        "mon": "Toán",
        "mach_noi_dung": "Số và Đại số",
        "mo_ta": "Tính chất cơ bản của phân số (nhân/chia cả tử và mẫu cho cùng một số khác 0)",
        "tien_quyet": ["phan-so"],
    },
    {
        "id": "phan-so",
        "lop": 5,
        "mon": "Toán",
        "mach_noi_dung": "Số và Đại số",
        "mo_ta": "Khái niệm phân số: tử số, mẫu số, mẫu khác 0",
        "tien_quyet": [],
    },
    # --- node làm dày đồ thị (không nằm trên chuỗi tiền quyết của node bề mặt) ---
    {
        "id": "rut-gon-phan-so",
        "lop": 5,
        "mon": "Toán",
        "mach_noi_dung": "Số và Đại số",
        "mo_ta": "Rút gọn phân số về phân số tối giản",
        "tien_quyet": [ROOT_CAUSE],
    },
    {
        "id": "phan-so-bang-nhau",
        "lop": 6,
        "mon": "Toán",
        "mach_noi_dung": "Số và Đại số",
        "mo_ta": "Nhận biết hai phân số bằng nhau bằng quy tắc tích chéo",
        "tien_quyet": [ROOT_CAUSE],
    },
    {
        "id": "ti-so-phan-tram",
        "lop": 6,
        "mon": "Toán",
        "mach_noi_dung": "Số và Đại số",
        "mo_ta": "Tính tỉ số phần trăm của hai đại lượng",
        "tien_quyet": ["ti-so"],
    },
    {
        "id": "quy-dong-mau-nhieu-phan-so",
        "lop": 6,
        "mon": "Toán",
        "mach_noi_dung": "Số và Đại số",
        "mo_ta": "Quy đồng mẫu nhiều phân số",
        "tien_quyet": ["phan-so"],
    },
]

NODE_NAME = {
    "ti-le-thuc": "Tỉ lệ thức",
    "ti-so": "Tỉ số",
    ROOT_CAUSE: "Tính chất cơ bản của phân số",
    "phan-so": "Phân số",
    "rut-gon-phan-so": "Rút gọn phân số",
    "phan-so-bang-nhau": "Phân số bằng nhau",
    "ti-so-phan-tram": "Tỉ số phần trăm",
    "quy-dong-mau-nhieu-phan-so": "Quy đồng mẫu nhiều phân số",
}

# ---------------------------------------------------------------------------
# 2. Bộ câu hỏi. Node trên chuỗi cần đủ câu bề mặt / thăm dò cho engine.
# ---------------------------------------------------------------------------
QUESTIONS: list[dict] = [
    # --- ti-le-thuc: 2 câu bề mặt lớp 7 (Minh làm SAI) ---
    {
        "question_id": "q_tlt_1",
        "yccd": ["ti-le-thuc"],
        "do_kho": 2,
        "text": "Tìm x trong tỉ lệ thức x/4 = 9/12.",
        "options": {"A": "2", "B": "3", "C": "4", "D": "5"},
        "dap_an": "B",
        "la_cau_tham_do": False,
        "socratic_hints": [
            "Gợi ý bậc 1: Tỉ lệ thức a/b = c/d có tính chất tích chéo a·d = b·c.",
            "Gợi ý bậc 2: Ta có x·12 = 4·9 = 36. Vậy x bằng bao nhiêu?",
            "Gợi ý bậc 3: Chia hai vế cho 12: x = 36/12 = 3, chọn B.",
        ],
    },
    {
        "question_id": "q_tlt_2",
        "yccd": ["ti-le-thuc"],
        "do_kho": 3,
        "text": "Biết x và y tỉ lệ thuận, khi x = 2 thì y = 6. Tìm hệ số tỉ lệ k của y theo x.",
        "options": {"A": "1/3", "B": "2", "C": "3", "D": "4"},
        "dap_an": "C",
        "la_cau_tham_do": False,
        "socratic_hints": [
            "Gợi ý bậc 1: Hai đại lượng tỉ lệ thuận liên hệ theo y = k·x.",
            "Gợi ý bậc 2: Thay x = 2, y = 6 vào y = k·x ta được 6 = k·2.",
            "Gợi ý bậc 3: k = 6/2 = 3, chọn C.",
        ],
    },
    # --- ti-so: 2 câu thăm dò lớp 6 (Minh làm SAI) ---
    {
        "question_id": "q_tiso_p1",
        "yccd": ["ti-so"],
        "do_kho": 1,
        "text": "Tỉ số của 6 và 8 (viết dạng phân số tối giản) là bao nhiêu?",
        "options": {"A": "6/8", "B": "3/4", "C": "4/3", "D": "8/6"},
        "dap_an": "B",
        "la_cau_tham_do": True,
        "socratic_hints": [
            "Gợi ý bậc 1: Tỉ số của a và b là a/b, sau đó rút gọn.",
            "Gợi ý bậc 2: 6/8, chia cả tử và mẫu cho 2.",
        ],
    },
    {
        "question_id": "q_tiso_p2",
        "yccd": ["ti-so"],
        "do_kho": 1,
        "text": "Tỉ số của hai đại lượng cùng đơn vị 15 cm và 20 cm bằng?",
        "options": {"A": "3/4", "B": "4/3", "C": "15/20", "D": "5/4"},
        "dap_an": "A",
        "la_cau_tham_do": True,
        "socratic_hints": [
            "Gợi ý bậc 1: Lập tỉ số 15/20 rồi rút gọn.",
            "Gợi ý bậc 2: Chia cả tử và mẫu cho 5 được 3/4.",
        ],
    },
    # --- tinh-chat-co-ban-cua-phan-so: 2 câu thăm dò lớp 5 (Minh làm SAI = GỐC RỄ) ---
    {
        "question_id": "q_tccb_p1",
        "yccd": [ROOT_CAUSE],
        "do_kho": 1,
        "text": "Nhân cả tử và mẫu của 2/3 với 4 ta được phân số nào bằng 2/3?",
        "options": {"A": "6/7", "B": "8/12", "C": "2/12", "D": "8/3"},
        "dap_an": "B",
        "la_cau_tham_do": True,
        "socratic_hints": [
            "Gợi ý bậc 1: Nhân CẢ tử và mẫu với cùng một số khác 0 thì được phân số bằng nó.",
            "Gợi ý bậc 2: 2·4 = 8 và 3·4 = 12, vậy được 8/12.",
        ],
    },
    {
        "question_id": "q_tccb_p2",
        "yccd": [ROOT_CAUSE],
        "do_kho": 2,
        "text": "Phân số nào sau đây KHÔNG bằng 3/5?",
        "options": {"A": "6/10", "B": "9/15", "C": "12/20", "D": "3/10"},
        "dap_an": "D",
        "la_cau_tham_do": True,
        "socratic_hints": [
            "Gợi ý bậc 1: Nhân tử và mẫu của 3/5 với cùng một số để so sánh.",
            "Gợi ý bậc 2: 3/10 có mẫu gấp đôi nhưng tử không đổi nên khác 3/5.",
        ],
    },
    # --- phan-so: 2 câu thăm dò lớp 5 (Minh làm ĐÚNG = nền vững) ---
    {
        "question_id": "q_ps_p1",
        "yccd": ["phan-so"],
        "do_kho": 1,
        "text": "Trong phân số 7/9, số 9 được gọi là gì?",
        "options": {"A": "Tử số", "B": "Mẫu số", "C": "Thương", "D": "Hiệu"},
        "dap_an": "B",
        "la_cau_tham_do": True,
        "socratic_hints": [
            "Gợi ý bậc 1: Số nằm dưới dấu gạch ngang của phân số gọi là gì?",
        ],
    },
    {
        "question_id": "q_ps_p2",
        "yccd": ["phan-so"],
        "do_kho": 1,
        "text": "Phân số nào sau đây KHÔNG hợp lệ?",
        "options": {"A": "3/4", "B": "0/5", "C": "5/0", "D": "9/2"},
        "dap_an": "C",
        "la_cau_tham_do": True,
        "socratic_hints": [
            "Gợi ý bậc 1: Mẫu số của phân số phải khác 0.",
        ],
    },
    # --- câu luyện tập cho các node làm dày (không thuộc chuỗi chẩn đoán) ---
    {
        "question_id": "q_rgps_1",
        "yccd": ["rut-gon-phan-so"],
        "do_kho": 1,
        "text": "Rút gọn phân số 12/18 về tối giản.",
        "options": {"A": "6/9", "B": "2/3", "C": "3/4", "D": "4/6"},
        "dap_an": "B",
        "la_cau_tham_do": False,
        "socratic_hints": ["Gợi ý bậc 1: Chia cả tử và mẫu cho ước chung lớn nhất là 6."],
    },
    {
        "question_id": "q_psbn_1",
        "yccd": ["phan-so-bang-nhau"],
        "do_kho": 2,
        "text": "Hai phân số 4/6 và 6/9 có bằng nhau không?",
        "options": {"A": "Bằng nhau", "B": "Không bằng nhau"},
        "dap_an": "A",
        "la_cau_tham_do": False,
        "socratic_hints": ["Gợi ý bậc 1: Dùng tích chéo: 4·9 và 6·6 có bằng nhau không?"],
    },
    {
        "question_id": "q_tspt_1",
        "yccd": ["ti-so-phan-tram"],
        "do_kho": 2,
        "text": "Tỉ số phần trăm của 3 và 4 là bao nhiêu?",
        "options": {"A": "43%", "B": "75%", "C": "34%", "D": "133%"},
        "dap_an": "B",
        "la_cau_tham_do": False,
        "socratic_hints": ["Gợi ý bậc 1: Tính 3/4 · 100%."],
    },
]

# ---------------------------------------------------------------------------
# 3. Chuỗi trả lời của Minh (thứ tự quan trọng cho luồng chẩn đoán).
#    (question_id, is_correct)
# ---------------------------------------------------------------------------
MINH_ANSWERS: list[tuple[str, bool]] = [
    ("q_tlt_1", False),
    ("q_tlt_2", False),  # 2 sai bề mặt -> engine đòi thăm dò ti-so
    ("q_tiso_p1", False),
    ("q_tiso_p2", False),  # ti-so hổng -> đi xuống tinh-chat-co-ban
    ("q_tccb_p1", False),
    ("q_tccb_p2", False),  # tinh-chat-co-ban hổng -> đi xuống phan-so
    ("q_ps_p1", True),
    ("q_ps_p2", True),  # phan-so VỮNG -> dừng, gốc rễ = tinh-chat-co-ban
]

# Mastery cho tầng Supabase (mirror kết quả engine). state ∈ enum app.mastery_state.
MASTERY_SEED = [
    # code, elo, bkt, state, weakness, attempts, correct
    ("phan-so", 1180.0, 0.9500, "mastered", False, 2, 2),
    (ROOT_CAUSE, 1075.0, 0.1690, "weak", True, 2, 0),
    ("ti-so", 1100.0, 0.2000, "weak", True, 2, 0),
    ("ti-le-thuc", 1150.0, 0.2200, "learning", True, 2, 0),
]


def concept_uuid(code: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"concept.demo-minh.{code}"))


def relation_uuid(src: str, tgt: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"relation.demo-minh.{src}.{tgt}"))


def sql_str(val: str) -> str:
    return val.replace("'", "''")


# ---------------------------------------------------------------------------
# Emitters
# ---------------------------------------------------------------------------
def write_knowledge_graph() -> None:
    payload = {"version": "2.0.0-demo-minh", "nodes": NODES}
    (DATA_DIR / "knowledge_graph.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def write_questions() -> None:
    (DATA_DIR / "questions.json").write_text(
        json.dumps(QUESTIONS, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def write_chat_profile() -> None:
    now = datetime.now(UTC).isoformat()
    profile = {
        "student_id": STUDENT_KEY,
        "full_name": STUDENT_NAME,
        "grade": 7,
        "asked_topics": {"Tỉ lệ thức": 4, "Tỉ số": 2, "Phân số": 2},
        "subjects": {"Toán": 8},
        "weak_areas": [
            {
                "topic": "Tính chất cơ bản của phân số",
                "note": "Engine xác định là lỗ hổng gốc rễ (lớp 5), confidence cao.",
                "concept_id": ROOT_CAUSE,
                "grade": 5,
                "updated_at": now,
            },
            {
                "topic": "Tỉ số",
                "note": "Sai dây chuyền do hổng tính chất cơ bản của phân số.",
                "concept_id": "ti-so",
                "grade": 6,
                "updated_at": now,
            },
        ],
        "strengths": [
            {"topic": "Phân số", "note": "Nắm chắc khái niệm tử/mẫu.", "concept_id": "phan-so", "grade": 5},
        ],
        "interaction_count": 8,
        "first_seen": now,
        "last_seen": now,
    }
    out = DATA_DIR / "chat" / "profiles" / f"{STUDENT_KEY}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_sql() -> None:
    lines: list[str] = []
    a = lines.append
    a("-- ============================================================================")
    a("-- Golden happy-case demo seed | Học sinh Trần Minh (lớp 7)")
    a("-- Sinh tự động bởi scripts/seed_demo_minh.py — KHÔNG sửa tay.")
    a("-- Target: Supabase PostgreSQL. Re-run safe: YES (idempotent).")
    a("-- Kịch bản: hổng gốc rễ 'Tính chất cơ bản của phân số' (lớp 5).")
    a("-- ============================================================================")
    a("")
    a("BEGIN;")
    a("")
    a("-- 1. Học sinh demo -------------------------------------------------------------")
    a(
        "INSERT INTO app.users (id, email, full_name, status, mssv) VALUES\n"
        f"  ('{STUDENT_UUID}', '{STUDENT_EMAIL}', '{sql_str(STUDENT_NAME)}', 'active', '{STUDENT_MSSV}')\n"
        "ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, mssv = EXCLUDED.mssv;"
    )
    a("")
    a(f"UPDATE app.users SET is_demo_account = true, demo_profile_key = 'full_flow_v1'\n WHERE id = '{STUDENT_UUID}';")
    a("")
    a(
        "INSERT INTO app.course_members (course_id, user_id, role_code, status) VALUES\n"
        f"  ('{COURSE_UUID}', '{STUDENT_UUID}', 'student', 'active')\n"
        "ON CONFLICT (course_id, user_id, role_code) DO NOTHING;"
    )
    a("")
    a("-- 2. Concepts (nodes của đồ thị tri thức) --------------------------------------")
    a("INSERT INTO app.concepts (id, course_id, code, name, description, status) VALUES")
    rows = []
    for n in NODES:
        code = n["id"]
        rows.append(
            f"  ('{concept_uuid(code)}', '{COURSE_UUID}', '{code}', "
            f"'{sql_str(NODE_NAME[code])}', '{sql_str(n['mo_ta'])}', 'active'::app.concept_status)"
        )
    a(",\n".join(rows))
    a("ON CONFLICT (course_id, code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;")
    a("")
    a("-- 3. Quan hệ tiền quyết (source Prerequisite_of target) ------------------------")
    a(
        "INSERT INTO app.concept_relations\n"
        "  (id, course_id, source_concept_id, target_concept_id, relation_type, weight, status) VALUES"
    )
    rel_specs = []  # (value_sql, comment)
    for n in NODES:
        tgt = n["id"]
        for prereq in n["tien_quyet"]:
            value = (
                f"  ('{relation_uuid(prereq, tgt)}', '{COURSE_UUID}', "
                f"'{concept_uuid(prereq)}', '{concept_uuid(tgt)}', "
                f"'Prerequisite_of'::app.concept_relation_type, 1.0, 'approved'::app.concept_relation_status)"
            )
            rel_specs.append((value, f"{prereq} -[Prerequisite_of]-> {tgt}"))
    # Dấu phẩy phải đứng TRƯỚC comment, nếu không comment sẽ nuốt mất dấu phẩy phân tách.
    for i, (value, comment) in enumerate(rel_specs):
        sep = "," if i < len(rel_specs) - 1 else ""
        a(f"{value}{sep}  -- {comment}")
    a("ON CONFLICT (id) DO NOTHING;")
    a("")
    a("-- 4. Mastery của Minh (mirror kết quả DiagnosticEngine) ------------------------")
    a(
        "INSERT INTO app.student_concept_mastery\n"
        "  (student_id, course_id, concept_id, elo_score, bkt_mastery_probability,\n"
        "   mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at, updated_at) VALUES"
    )
    m_rows = []
    for code, elo, bkt, state, weak, att, cor in MASTERY_SEED:
        m_rows.append(
            f"  ('{STUDENT_UUID}', '{COURSE_UUID}', '{concept_uuid(code)}', {elo}, {bkt},\n"
            f"   '{state}'::app.mastery_state, {str(weak).lower()}, {att}, {cor}, now(), now())"
        )
    a(",\n".join(m_rows))
    a(
        "ON CONFLICT (student_id, course_id, concept_id) DO UPDATE SET\n"
        "  elo_score = EXCLUDED.elo_score,\n"
        "  bkt_mastery_probability = EXCLUDED.bkt_mastery_probability,\n"
        "  mastery_state = EXCLUDED.mastery_state,\n"
        "  weakness_flag = EXCLUDED.weakness_flag,\n"
        "  attempt_count = EXCLUDED.attempt_count,\n"
        "  correct_count = EXCLUDED.correct_count,\n"
        "  last_practiced_at = EXCLUDED.last_practiced_at,\n"
        "  updated_at = EXCLUDED.updated_at;"
    )
    a("")
    a("COMMIT;")
    a("")
    out = ROOT / "db" / "seed" / "seed-demo-minh.sql"
    out.write_text("\n".join(lines), encoding="utf-8")


def seed_engine_and_verify() -> dict:
    """Nạp chuỗi trả lời của Minh vào data/mastery.db rồi xác minh chẩn đoán."""
    from src.services.diagnostic_engine import DiagnosticEngine

    engine = DiagnosticEngine()  # dùng data/mastery.db + JSON vừa ghi

    # Idempotent: xoá dữ liệu cũ của Minh
    conn = sqlite3.connect(str(engine.db_path))
    cur = conn.cursor()
    cur.execute("DELETE FROM learning_events WHERE student_id = ?", (STUDENT_KEY,))
    cur.execute("DELETE FROM mastery WHERE student_id = ?", (STUDENT_KEY,))
    conn.commit()
    conn.close()

    for qid, correct in MINH_ANSWERS:
        engine.record_answer(STUDENT_KEY, qid, is_correct=correct)

    result = engine.diagnose(STUDENT_KEY, SURFACE)
    return result or {}


def main() -> int:
    write_knowledge_graph()
    write_questions()
    write_chat_profile()
    write_sql()

    result = seed_engine_and_verify()

    ok = (
        result.get("status") == "DIAGNOSIS_COMPLETE"
        and result.get("root_cause", {}).get("id") == ROOT_CAUSE
        and result.get("root_cause", {}).get("lop") == 5
    )

    def out(msg: str) -> None:
        sys.stdout.buffer.write((msg + "\n").encode("utf-8"))

    out("=" * 68)
    out("  SEED DEMO HAPPY-CASE — Học sinh Trần Minh (lớp 7)")
    out("=" * 68)
    out("Đã ghi:")
    out("  - data/knowledge_graph.json         (8 node DAG Toán)")
    out("  - data/questions.json               (13 câu hỏi + gợi ý Socratic)")
    out(f"  - data/chat/profiles/{STUDENT_KEY}.json")
    out("  - data/mastery.db                   (lịch sử trả lời của Minh)")
    out("  - db/seed/seed-demo-minh.sql        (concepts + relations + mastery)")
    out("")
    out("KẾT QUẢ CHẨN ĐOÁN TỪ ENGINE:")
    out(json.dumps(result, indent=2, ensure_ascii=False))
    out("")
    if ok:
        rc = result["root_cause"]
        path = " → ".join(result.get("suggested_path", []))
        out(f"✔ HAPPY-CASE OK: gốc rễ = {rc['id']} (lớp {rc['lop']}) — {rc['mo_ta']}")
        out(f"  Độ tin cậy: {result.get('confidence'):.0%} | Đường ôn tập: {path}")
        return 0
    out("✘ FAIL: chẩn đoán không khớp kịch bản kỳ vọng. Kiểm tra lại DAG/answers.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
