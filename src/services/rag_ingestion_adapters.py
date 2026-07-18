from __future__ import annotations

import io
from pathlib import Path

from langchain_openai import OpenAIEmbeddings

from src.modules.rag.ocr import ocr_pdf_page, render_page_to_image


class OpenAIEmbeddingProvider:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required for Supabase ingestion")
        self.client = OpenAIEmbeddings(
            model="text-embedding-3-small",
            dimensions=1536,
            api_key=api_key,
        )

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.client.embed_documents(texts)


def extract_page_with_ocr(
    pdf_path: Path,
    page_number: int,
    *,
    dpi: int = 300,
    lang: str = "vie",
    tesseract_cmd: str | None = None,
) -> str:
    return ocr_pdf_page(
        pdf_path,
        page_number,
        dpi=dpi,
        lang=lang,
        tesseract_cmd=tesseract_cmd,
    )


def render_page_preview(
    pdf_path: Path,
    page_number: int,
    *,
    max_width: int = 1280,
    quality: int = 72,
) -> bytes:
    image = render_page_to_image(pdf_path, page_number, dpi=144)
    if image.width > max_width:
        target_height = max(1, round(image.height * max_width / image.width))
        image.thumbnail((max_width, target_height))
    output = io.BytesIO()
    image.save(output, format="WEBP", quality=quality, method=4)
    return output.getvalue()
