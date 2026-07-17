"""Trích xuất concept + relation THẬT bằng LLM structured-output từ Markdown Toán.

Khác với extract_seed_concepts.py/extract_candidate_triplets.py (REAL_CONCEPTS/
REAL_TRIPLETS hard-code cho 24 ngày bootcamp AI, không đọc nội dung thật - xem
docs/domain-knowledge/PDF_to_Knowledge_Graph.md), script này gọi LLM thật, đọc
đúng nội dung Markdown đã trích xuất từ PDF (có <!-- page: N --> marker).

Gộp bước trích concept và relation vào MỘT lệnh gọi LLM/lesson package (theo
đúng khuyến nghị "one aligned lesson package per LLM call" - tránh tách 2 lệnh
gọi như bootcamp cũ, giảm chi phí, giữ ngữ cảnh nhất quán giữa concept và
relation trong cùng bài học).
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

from pydantic import BaseModel, Field

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

SUPPORTED_RELATIONS = ["Prerequisite_of", "Used_for", "Compare", "Conjunction", "Hyponym_of", "Evaluate_for", "Part_of"]

PAGE_MARKER_RE = re.compile(r"<!--\s*page:\s*(\d+)\s*-->")


class ConceptCandidate(BaseModel):
    code: str = Field(description="Mã concept kebab-case, duy nhất trong bài, vd: 'don-thuc-cung-mau'")
    name: str = Field(description="Tên concept/kỹ năng bằng tiếng Việt, đúng thuật ngữ SGK")
    description: str = Field(
        description="Mô tả 1-2 câu, nêu rõ đây là khái niệm (concept) hay kỹ năng quan sát được (skill)"
    )
    grade: int | None = Field(default=None, description="Lớp giới thiệu concept này, nếu xác định được từ ngữ cảnh")
    source_page: int | None = Field(default=None, description="Số trang gần nhất chứa concept này (từ marker page:N)")


class RelationCandidate(BaseModel):
    source: str = Field(description="code của concept nguồn, phải khớp với 1 code trong danh sách concepts đã trích")
    relation: str = Field(description=f"Bắt buộc thuộc: {', '.join(SUPPORTED_RELATIONS)}")
    target: str = Field(description="code của concept đích, phải khớp với 1 code trong danh sách concepts đã trích")
    evidence: str = Field(
        description="Trích dẫn ngắn từ văn bản làm bằng chứng cho quan hệ này - không được bịa nếu không có căn cứ trong văn bản"
    )
    source_page: int | None = Field(default=None, description="Số trang chứa bằng chứng cho quan hệ này")


class LessonKnowledge(BaseModel):
    concepts: list[ConceptCandidate]
    relations: list[RelationCandidate]


SYSTEM_PROMPT = """Bạn là chuyên gia phân tích chương trình Toán phổ thông Việt Nam (Kết Nối Tri Thức).
Nhiệm vụ: đọc nội dung Markdown trích xuất từ SGK/SGV, tách ra danh sách concept/skill toán học nguyên tử
và các quan hệ có căn cứ giữa chúng.

Quy tắc bắt buộc:
- Chỉ dùng nội dung được cung cấp, không suy đoán ngoài văn bản.
- Concept phải nguyên tử (atomic): một khái niệm/kỹ năng cụ thể, có thể kiểm tra độc lập bằng 1 câu hỏi.
  KHÔNG dùng tên bài học chung chung (vd: không dùng "Đơn thức" cho cả bài, mà tách thành các concept nhỏ
  như "Định nghĩa đơn thức", "Hệ số của đơn thức", "Bậc của đơn thức", "Đơn thức đồng dạng").
- Mỗi relation PHẢI có evidence trích từ văn bản. Không tạo Prerequisite_of nếu không có căn cứ rõ ràng
  trong nội dung (ví dụ văn bản nói "học sinh cần nắm X trước khi học Y").
- relation chỉ được nhận 1 trong 7 giá trị đã liệt kê, không tự tạo loại quan hệ mới.
- source_page lấy từ marker "<!-- page: N -->" gần nhất phía trước đoạn văn bản chứa concept/evidence đó.
- Không merge 2 concept độc lập làm một; không tách 1 concept nguyên tử thành nhiều concept trùng lặp."""


def extract_lesson_knowledge(markdown_text: str, model: str, api_key: str) -> LessonKnowledge:
    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.parse(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": markdown_text},
        ],
        response_format=LessonKnowledge,
        temperature=0.0,
    )
    return response.choices[0].message.parsed


def load_markdown_files(paths: list[Path]) -> str:
    chunks = []
    for p in paths:
        with open(p, encoding="utf-8") as f:
            chunks.append(f.read())
    return "\n\n".join(chunks)


def validate_and_clean(knowledge: LessonKnowledge) -> LessonKnowledge:
    """Loại quan hệ tham chiếu concept không tồn tại, loại relation type không hợp lệ,
    loại self-relation - phòng thủ chống LLM hallucination trước khi ghi ra file."""
    concept_codes = {c.code for c in knowledge.concepts}
    clean_relations = []
    for r in knowledge.relations:
        if r.relation not in SUPPORTED_RELATIONS:
            print(f"  [!] Bỏ qua relation type không hợp lệ: {r.relation}")
            continue
        if r.source not in concept_codes or r.target not in concept_codes:
            print(f"  [!] Bỏ qua relation tham chiếu concept không tồn tại: {r.source} -> {r.target}")
            continue
        if r.source == r.target:
            print(f"  [!] Bỏ qua self-relation: {r.source}")
            continue
        clean_relations.append(r)
    return LessonKnowledge(concepts=knowledge.concepts, relations=clean_relations)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("markdown_files", nargs="+", help="1 hoặc nhiều file .md đầu vào (1 bài/lesson package)")
    parser.add_argument("--model", default="gpt-4o", help="Model OpenAI dùng để trích xuất")
    parser.add_argument("--out", default="outputs/math_lesson_knowledge.json", help="File JSON output")
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        print("[!] Không tìm thấy OPENAI_API_KEY trong environment.")
        sys.exit(1)

    paths = [Path(p) for p in args.markdown_files]
    for p in paths:
        if not p.exists():
            print(f"[!] Không tìm thấy file: {p}")
            sys.exit(1)

    markdown_text = load_markdown_files(paths)
    print(f"[*] Đã đọc {len(paths)} file markdown ({len(markdown_text)} ký tự). Đang gọi LLM trích xuất...")

    knowledge = extract_lesson_knowledge(markdown_text, args.model, api_key)
    print(f"[+] LLM trích xuất thô: {len(knowledge.concepts)} concepts, {len(knowledge.relations)} relations.")

    knowledge = validate_and_clean(knowledge)
    print(f"[+] Sau khi validate: {len(knowledge.concepts)} concepts, {len(knowledge.relations)} relations hợp lệ.")

    out_path = Path(project_root) / args.out if not os.path.isabs(args.out) else Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(knowledge.model_dump(), f, ensure_ascii=False, indent=2)

    print(f"[+] Đã lưu tại: {out_path}")


if __name__ == "__main__":
    main()
