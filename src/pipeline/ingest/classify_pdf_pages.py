"""Phân loại từng file PDF thành lane 'direct_text' (có text layer thật) hoặc
'vision' (scan, cần vision-LLM). Xem docs/domain-knowledge/PDF_to_Knowledge_Graph.md
mục 1 để biết lý do tại sao cần bước này (đã đo thật trên data/Math: 23/27 file
là scan hoàn toàn, 4/27 có text layer).

Sample thay vì đọc toàn bộ file (đủ chính xác, nhanh hơn nhiều trên file 200-300 trang).
"""

import argparse
import json
import os
import sys
from pathlib import Path

import fitz

TEXT_PAGE_MIN_CHARS = 20
TEXT_PAGE_PCT_THRESHOLD = 0.5
SAMPLE_MAX_PAGES = 40


def classify_file(pdf_path: Path) -> dict:
    doc = fitz.open(pdf_path)
    n = len(doc)
    step = max(1, n // SAMPLE_MAX_PAGES)
    sampled = 0
    text_pages = 0
    for p in range(0, n, step):
        text = doc[p].get_text().strip()
        sampled += 1
        if len(text) > TEXT_PAGE_MIN_CHARS:
            text_pages += 1
    pct = text_pages / sampled if sampled else 0.0
    lane = "direct_text" if pct >= TEXT_PAGE_PCT_THRESHOLD else "vision"
    return {
        "file": pdf_path.name,
        "path": str(pdf_path),
        "page_count": n,
        "sampled_pages": sampled,
        "text_page_pct": round(pct, 3),
        "lane": lane,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("data_dir", nargs="?", default="data/Math", help="Thư mục chứa PDF cần phân loại")
    parser.add_argument("--out", default="outputs/pdf_classification.json", help="File JSON output")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[3]
    data_dir = (project_root / args.data_dir) if not os.path.isabs(args.data_dir) else Path(args.data_dir)
    out_path = (project_root / args.out) if not os.path.isabs(args.out) else Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    pdf_files = sorted(data_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"[!] Không tìm thấy file PDF nào tại: {data_dir}")
        sys.exit(1)

    results = []
    for f in pdf_files:
        try:
            info = classify_file(f)
        except Exception as e:
            print(f"[!] Lỗi khi phân loại {f.name}: {e}")
            info = {"file": f.name, "path": str(f), "error": str(e), "lane": "error"}
        results.append(info)
        print(f"  {info['file']:<70s} lane={info.get('lane'):<12s} text_pct={info.get('text_page_pct', 'n/a')}")

    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(results, fh, ensure_ascii=False, indent=2)

    direct = sum(1 for r in results if r.get("lane") == "direct_text")
    vision = sum(1 for r in results if r.get("lane") == "vision")
    print(f"\n[+] Đã phân loại {len(results)} file: {direct} direct_text, {vision} vision.")
    print(f"[+] Kết quả lưu tại: {out_path}")


if __name__ == "__main__":
    main()
