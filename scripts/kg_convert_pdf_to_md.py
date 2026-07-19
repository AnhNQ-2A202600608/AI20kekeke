"""CLI: chuyển 1 file PDF sang Markdown có provenance bằng vision-LLM (GPT-4o-mini),
phục vụ bước 2 của pipeline PDF-to-Knowledge-Graph — xem
docs/domain-knowledge/PDF_to_Knowledge_Graph.md.

Dùng chung cho mọi domain (Toán, Sử-Địa, ...), không hard-code môn học.
Chỉ gọi lại convert_pdf_to_markdown_openai_vision() đã có trong
src/pipeline/transform/doc_converter.py — không viết lại logic OCR.

Usage:
    python scripts/kg_convert_pdf_to_md.py "data/Math/....pdf" outputs/kg_source_md/math/toan-6-tap-2.md
    python scripts/kg_convert_pdf_to_md.py "data/his&geo/....pdf" outputs/kg_source_md/history_geo/su-dia-8.md --start-page 1 --end-page 20
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(_PROJECT_ROOT))

from dotenv import load_dotenv  # noqa: E402

from src.pipeline.transform.doc_converter import convert_pdf_to_markdown_openai_vision  # noqa: E402

load_dotenv(_PROJECT_ROOT / ".env")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pdf_path", help="Đường dẫn file PDF nguồn")
    parser.add_argument("md_path", help="Đường dẫn file Markdown output")
    parser.add_argument("--start-page", type=int, default=None, help="1-indexed, trang bắt đầu (inclusive)")
    parser.add_argument("--end-page", type=int, default=None, help="1-indexed, trang kết thúc (inclusive)")
    parser.add_argument("--model", default="gpt-4o-mini")
    parser.add_argument("--batch-size", type=int, default=3)
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise SystemExit("[!] Không tìm thấy OPENAI_API_KEY trong environment.")

    page_range = None
    if args.start_page is not None or args.end_page is not None:
        start0 = (args.start_page - 1) if args.start_page else 0
        end0 = args.end_page if args.end_page else None
        page_range = (start0, end0 if end0 is not None else 10**9)

    md_path = Path(args.md_path)
    md_path.parent.mkdir(parents=True, exist_ok=True)

    t0 = time.perf_counter()
    ok = convert_pdf_to_markdown_openai_vision(
        args.pdf_path, str(md_path), api_key, model=args.model, batch_size=args.batch_size, page_range=page_range
    )
    elapsed = time.perf_counter() - t0
    if not ok:
        raise SystemExit("[!] Chuyển đổi thất bại.")
    print(f"[+] Xong trong {elapsed:.1f}s -> {md_path}")


if __name__ == "__main__":
    main()
