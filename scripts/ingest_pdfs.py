"""CLI: OCR the SGK PDFs in data/ into Markdown under data/processed/<book_slug>/.

Runs the pdf -> page image -> Vietnamese OCR -> Markdown pipeline OFFLINE, outside
any HTTP request, because OCR-ing an 800+ page textbook set is far too slow for a
synchronous POST /runs call. Requires the `rag-ocr` extras (PyMuPDF, pytesseract,
Pillow) plus a system Tesseract install with the Vietnamese language pack — see
docs/engineering/ocr-pipeline.md for setup instructions.

Usage:
    python scripts/ingest_pdfs.py                       # OCR every PDF in data/
    python scripts/ingest_pdfs.py --book "SGK ... 6 KNTT.pdf"
    python scripts/ingest_pdfs.py --start-page 1 --end-page 100 --book "...9...pdf"
    python scripts/ingest_pdfs.py --force                # re-OCR even if a manifest exists
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

# Windows console codepages (cp1252/cp932/...) frequently can't print Vietnamese book
# titles; force UTF-8 stdout so this script never crashes on a print() call.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(_PROJECT_ROOT / "backend"))

from src.core.config import get_settings  # noqa: E402
from src.modules.rag.ocr import OCRUnavailableError  # noqa: E402
from src.modules.rag.pdf_ingest import ingest_pdf  # noqa: E402


def _discover_pdfs(raw_dir: Path, book_filter: str | None) -> list[Path]:
    pdfs = sorted(raw_dir.glob("*.pdf"))
    if book_filter:
        pdfs = [p for p in pdfs if p.name == book_filter or p.stem == book_filter]
        if not pdfs:
            raise SystemExit(f"No PDF matching '{book_filter}' found under {raw_dir}")
    return pdfs


def _check_ocr_backend_available() -> None:
    missing = []
    for module_name in ("fitz", "pytesseract", "PIL"):
        try:
            __import__(module_name)
        except ImportError:
            missing.append(module_name)
    if missing:
        raise SystemExit(
            "Missing OCR dependencies: "
            + ", ".join(missing)
            + ". Install with: pip install -e '.[rag-ocr]' (run inside backend/), "
            "then install the Tesseract binary + Vietnamese language pack. "
            "See docs/engineering/ocr-pipeline.md."
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--book", help="Only process this filename (or stem) under data/")
    parser.add_argument(
        "--start-page", type=int, default=None, help="1-indexed first page (inclusive)"
    )
    parser.add_argument(
        "--end-page", type=int, default=None, help="1-indexed last page (inclusive)"
    )
    parser.add_argument(
        "--force", action="store_true", help="Re-OCR pages even if already processed"
    )
    parser.add_argument("--dpi", type=int, default=None, help="Override OCR render DPI")
    parser.add_argument(
        "--lang", default=None, help="Override Tesseract language code (default: vie)"
    )
    args = parser.parse_args()

    _check_ocr_backend_available()

    settings = get_settings()
    pdfs = _discover_pdfs(settings.raw_pdf_dir, args.book)
    if not pdfs:
        print(f"No PDF files found under {settings.raw_pdf_dir}. Nothing to do.")
        return

    dpi = args.dpi or settings.ocr_dpi
    lang = args.lang or settings.ocr_lang
    tesseract_cmd = settings.tesseract_cmd or None

    for pdf_path in pdfs:
        print(f"\n=== {pdf_path.name} ===")
        t0 = time.perf_counter()

        def _progress(page_number: int, total_pages: int, _pdf_name: str = pdf_path.name) -> None:
            print(f"  [{_pdf_name}] page {page_number}/{total_pages}", end="\r")

        try:
            manifest = ingest_pdf(
                pdf_path,
                settings.processed_dir,
                min_chars=settings.ocr_min_chars_per_page,
                ocr_lang=lang,
                ocr_dpi=dpi,
                tesseract_cmd=tesseract_cmd,
                start_page=args.start_page,
                end_page=args.end_page,
                force=args.force,
                progress=_progress,
            )
        except OCRUnavailableError as exc:
            raise SystemExit(f"OCR backend unavailable: {exc}") from exc

        elapsed = time.perf_counter() - t0
        print(
            f"\n  done in {elapsed:.1f}s — {manifest['pages_processed']} pages "
            f"(text_layer={manifest['text_layer_pages']}, ocr={manifest['ocr_pages']}, "
            f"empty={manifest['empty_pages']})"
        )
        print(f"  output: {settings.processed_dir}")

    print(
        "\nAll done. Run 'python scripts/project_tasks.py ingest-index' "
        "(or the rag capability's action=ingest_index) to build the query index."
    )


if __name__ == "__main__":
    main()
