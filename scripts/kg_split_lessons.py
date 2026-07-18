"""CLI: tách 1 file Markdown sách giáo khoa (có marker <!-- page: N --> từ
kg_convert_pdf_to_md.py) thành nhiều file nhỏ theo từng "Bài" học, để đưa vào
extract_math_knowledge.py / extract_history_geo_knowledge.py theo đúng khuyến
nghị "one aligned lesson package per LLM call".

Nhận diện ranh giới bài học bằng heading Markdown dạng "# Bài N", "## Bài N",
"### Bài N" (không phân biệt hoa/thường, có hoặc không có tiêu đề phụ theo sau).
Nội dung trước "Bài" đầu tiên (bìa, mục lục, lời nói đầu) bị bỏ qua vì không
chứa concept học thuật.

Usage:
    python scripts/kg_split_lessons.py outputs/kg_source_md/history_geo/su-dia-8.md outputs/kg_source_md/history_geo/lessons
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

LESSON_HEADING_RE = re.compile(r"^#{1,3}\s*Bài\s*(\d+)\b.*$", re.IGNORECASE | re.MULTILINE)


def split_into_lessons(markdown_text: str) -> list[tuple[str, str]]:
    """Trả về list (slug, nội_dung) theo thứ tự xuất hiện trong sách. Vì sách
    Sử-Địa có 2 phần đánh số "Bài" độc lập (Lịch sử và Địa lí), slug dùng số
    thứ tự xuất hiện (seq) chứ không chỉ số "Bài" để tránh trùng file."""
    matches = list(LESSON_HEADING_RE.finditer(markdown_text))
    lessons = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown_text)
        bai_num = m.group(1)
        slug = f"{i + 1:02d}-bai-{bai_num}"
        lessons.append((slug, markdown_text[start:end].strip()))
    return lessons


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("md_path", help="File Markdown nguồn (cả sách)")
    parser.add_argument("out_dir", help="Thư mục ghi các file lesson riêng lẻ")
    args = parser.parse_args()

    md_path = Path(args.md_path)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    text = md_path.read_text(encoding="utf-8")
    lessons = split_into_lessons(text)

    if not lessons:
        raise SystemExit("[!] Không tìm thấy heading 'Bài N' nào trong file. Kiểm tra lại format markdown.")

    for slug, content in lessons:
        out_path = out_dir / f"{slug}.md"
        out_path.write_text(content, encoding="utf-8")
        print(f"[+] {out_path} ({len(content)} ký tự)")

    print(f"\n[+] Đã tách {len(lessons)} bài vào {out_dir}")


if __name__ == "__main__":
    main()
