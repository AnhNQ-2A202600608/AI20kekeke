"""Unit tests for src.modules.rag.text_clean: watermark removal, normalization,
the OCR-fallback decision heuristic, and slugify."""

from __future__ import annotations

from src.modules.rag.text_clean import (
    clean_page_text,
    is_text_sufficient,
    normalize_vietnamese_text,
    remove_watermarks,
    slugify,
)


class TestRemoveWatermarks:
    def test_removes_blogtailieu_watermark_line(self):
        text = "Bài 1: Lịch sử Việt Nam\nblogtailieu.com - Tải tài liệu miễn phí\nNội dung bài học."
        cleaned = remove_watermarks(text)
        assert "blogtailieu.com" not in cleaned
        assert "Nội dung bài học." in cleaned

    def test_removes_sachgiaokhoa_watermark(self):
        text = "Trang bìa\nsach-giao-khoa.vn\nChương 1"
        cleaned = remove_watermarks(text)
        assert "sach-giao-khoa" not in cleaned
        assert "Chương 1" in cleaned

    def test_removes_tai_lieu_ad_line(self):
        text = "Tải tài liệu miễn phí tại: blogtailieu.com\nBài học chính thức bắt đầu ở đây."
        cleaned = remove_watermarks(text)
        assert "Tải tài liệu" not in cleaned
        assert "Bài học chính thức" in cleaned

    def test_removes_page_number_footer(self):
        text = "Nội dung chính\n--- Trang 12 ---\nTiếp theo"
        cleaned = remove_watermarks(text)
        assert "Trang 12" not in cleaned

    def test_leaves_real_content_untouched(self):
        text = "Lịch sử và Địa lí lớp 6\nChương I: Vì sao cần học Lịch sử?"
        assert remove_watermarks(text) == text


class TestNormalizeVietnameseText:
    def test_normalizes_unicode_nfc(self):
        # "ệ" tổ hợp dựng sẵn (NFC) so với "ệ" ghép từ "e" + dấu mũ + dấu nặng (NFD).
        nfd = "Việt Nam"
        result = normalize_vietnamese_text(nfd)
        assert result == "Việt Nam"

    def test_collapses_multiple_blank_lines(self):
        text = "Đoạn 1\n\n\n\n\nĐoạn 2"
        assert normalize_vietnamese_text(text) == "Đoạn 1\n\nĐoạn 2"

    def test_joins_hyphenated_line_break(self):
        text = "lịch-\nsử"
        assert normalize_vietnamese_text(text) == "lịch sử"

    def test_collapses_repeated_spaces(self):
        text = "Việt   Nam    là    quê   hương"
        assert normalize_vietnamese_text(text) == "Việt Nam là quê hương"

    def test_strips_trailing_whitespace_per_line(self):
        text = "Dòng một   \nDòng hai\t\n"
        result = normalize_vietnamese_text(text)
        assert result == "Dòng một\nDòng hai"


class TestCleanPageText:
    def test_combines_watermark_removal_and_normalization(self):
        text = "blogtailieu.com\n\n\nBài   học    chính"
        cleaned = clean_page_text(text)
        assert "blogtailieu" not in cleaned
        assert cleaned == "Bài học chính"


class TestIsTextSufficient:
    def test_real_paragraph_is_sufficient(self):
        text = "Chương I: Vì sao phải học Lịch sử? Đây là nội dung đầy đủ của một trang sách."
        assert is_text_sufficient(text, min_chars=40) is True

    def test_empty_text_is_not_sufficient(self):
        assert is_text_sufficient("", min_chars=40) is False

    def test_watermark_only_text_is_not_sufficient(self):
        text = "blogtailieu.com\nsach-giao-khoa.vn"
        assert is_text_sufficient(text, min_chars=40) is False

    def test_short_text_below_threshold_is_not_sufficient(self):
        assert is_text_sufficient("Trang 5", min_chars=40) is False

    def test_threshold_is_configurable(self):
        text = "Chương I"
        assert is_text_sufficient(text, min_chars=5) is True
        assert is_text_sufficient(text, min_chars=50) is False


class TestSlugify:
    def test_slugifies_vietnamese_title(self):
        assert slugify("SGK Lịch sử và địa lí 6 KNTT") == "sgk-lich-su-va-dia-li-6-kntt"

    def test_slugifies_uppercase_title(self):
        assert slugify("SGK LỊCH SỬ VÀ ĐỊA LÍ 8 KNTT") == "sgk-lich-su-va-dia-li-8-kntt"

    def test_empty_string_falls_back_to_book(self):
        assert slugify("") == "book"
