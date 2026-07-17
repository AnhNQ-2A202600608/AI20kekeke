"""OCR backend: render a PDF page to an image and run Tesseract over it.

Isolated from `pdf_ingest.py` so tests can monkeypatch `ocr_pdf_page` (or the
lower-level functions) without needing a real Tesseract binary installed —
CI must never run real OCR over the 800+ page SGK PDFs.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import TYPE_CHECKING

from src.core.logging import get_logger

if TYPE_CHECKING:
    from PIL.Image import Image

logger = get_logger("modules.rag.ocr")


class OCRUnavailableError(RuntimeError):
    """Raised when PyMuPDF/pytesseract/the Tesseract binary can't be used."""


def render_page_to_image(pdf_path: Path, page_number: int, dpi: int = 300) -> "Image":
    """Render a single 1-indexed PDF page to a PIL Image using PyMuPDF (no external binary)."""
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise OCRUnavailableError("PyMuPDF ('fitz') is not installed") from exc
    try:
        from PIL import Image
    except ImportError as exc:
        raise OCRUnavailableError("Pillow ('PIL') is not installed") from exc

    with fitz.open(pdf_path) as doc:
        page = doc[page_number - 1]
        zoom = dpi / 72
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        return Image.open(io.BytesIO(pix.tobytes("png"))).copy()


def ocr_image(image: "Image", lang: str = "vie", tesseract_cmd: str | None = None) -> str:
    """Run Tesseract OCR over a rendered page image."""
    try:
        import pytesseract
    except ImportError as exc:
        raise OCRUnavailableError("pytesseract is not installed") from exc

    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    try:
        return pytesseract.image_to_string(image, lang=lang)
    except Exception as exc:  # TesseractNotFoundError, missing language pack, etc.
        raise OCRUnavailableError(f"Tesseract OCR failed: {exc}") from exc


def ocr_pdf_page(
    pdf_path: Path,
    page_number: int,
    *,
    dpi: int = 300,
    lang: str = "vie",
    tesseract_cmd: str | None = None,
) -> str:
    """Render + OCR a single page. Raises OCRUnavailableError if the backend can't run."""
    image = render_page_to_image(pdf_path, page_number, dpi=dpi)
    return ocr_image(image, lang=lang, tesseract_cmd=tesseract_cmd)
