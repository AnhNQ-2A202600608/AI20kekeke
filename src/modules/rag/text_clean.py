"""Text cleanup helpers for the PDF → Markdown OCR pipeline.

Kept dependency-free (stdlib only) so it can be unit tested without pulling in
PyMuPDF/pytesseract, and reused both by the OCR fallback path and the text-layer path.
"""

from __future__ import annotations

import re
import unicodedata

# Các mẫu watermark/quảng cáo thường gặp trên bản scan SGK trôi nổi trên mạng
# (vd. blogtailieu.com, sachgiaokhoa..., "tải tài liệu miễn phí", số trang lặp lại do OCR).
# Giữ dạng regex để dễ mở rộng khi gặp nguồn watermark khác.
_WATERMARK_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"(?im)^.*blogtailieu\.com.*$"),
    re.compile(r"(?im)^.*sach-?giao-?khoa.*$"),
    re.compile(r"(?im)^.*sachgiaokhoa\.\S*.*$"),
    re.compile(r"(?im)^.*t[aả]i\s+t[aà]i\s+li[eệ]u\s+(mi[eễ]n\s+ph[ií]\s+)?t[aạ]i.*$"),
    re.compile(r"(?im)^.*(www\.)?[a-z0-9-]+\.(com|vn|net)\s*$"),
    re.compile(r"(?im)^\s*-{0,3}\s*trang\s+\d+\s*-{0,3}\s*$"),
]

_MULTI_BLANK_LINES = re.compile(r"\n{3,}")
_TRAILING_SPACES = re.compile(r"[ \t]+\n")
_MULTI_SPACES = re.compile(r"[ \t]{2,}")
# Cụm từ bị ngắt dòng do dàn trang, ví dụ "lịch-\nsử" -> "lịch sử".
_HYPHEN_LINEBREAK = re.compile(r"(\w)-\n(\w)")


def remove_watermarks(text: str) -> str:
    """Strip known watermark/ad lines (blogtailieu.com and friends) from OCR/text-layer output."""
    cleaned = text
    for pattern in _WATERMARK_PATTERNS:
        cleaned = pattern.sub("", cleaned)
    return cleaned


def normalize_vietnamese_text(text: str) -> str:
    """Normalize Unicode (NFC), whitespace and line breaks for Vietnamese OCR/text output."""
    # NFC vì font PDF/OCR tiếng Việt hay lẫn tổ hợp dựng sẵn (NFC) và tổ hợp rời (NFD).
    normalized = unicodedata.normalize("NFC", text)
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
    normalized = _HYPHEN_LINEBREAK.sub(r"\1 \2", normalized)
    normalized = _TRAILING_SPACES.sub("\n", normalized)
    normalized = _MULTI_SPACES.sub(" ", normalized)
    lines = [line.strip() for line in normalized.split("\n")]
    normalized = "\n".join(lines)
    normalized = _MULTI_BLANK_LINES.sub("\n\n", normalized)
    return normalized.strip()


def clean_page_text(raw_text: str) -> str:
    """Full cleanup pipeline applied to a single page: watermark removal + normalization."""
    return normalize_vietnamese_text(remove_watermarks(raw_text))


def is_text_sufficient(text: str, min_chars: int = 40) -> bool:
    """Decide whether an extracted text layer is usable, or whether OCR fallback is needed.

    A page counts as "insufficient" when, after stripping watermarks and whitespace,
    fewer than `min_chars` meaningful characters remain (covers blank/near-blank scans
    and pages that are watermark-only).
    """
    cleaned = clean_page_text(text)
    # Chỉ đếm ký tự chữ/số để tránh trang toàn dấu câu/khoảng trắng bị tính là "đủ text".
    meaningful = re.sub(r"[^\w]", "", cleaned, flags=re.UNICODE)
    return len(meaningful) >= min_chars


def slugify(value: str) -> str:
    """Convert a book title/filename into a filesystem-safe slug (ASCII, kebab-case)."""
    # "Đ"/"đ" (U+0110/U+0111) don't canonically decompose under NFKD (they're atomic
    # Latin letters, not precomposed accents), so NFKD+ascii-ignore would silently drop
    # them entirely (-> "d?a l?" losing the "d"). Transliterate explicitly first.
    value = value.replace("Đ", "D").replace("đ", "d")
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_value = decomposed.encode("ascii", "ignore").decode("ascii")
    ascii_value = ascii_value.lower()
    ascii_value = re.sub(r"[^a-z0-9]+", "-", ascii_value)
    return ascii_value.strip("-") or "book"
