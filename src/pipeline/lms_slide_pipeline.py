# ruff: noqa: E402
import os
import sys
import urllib.parse
from datetime import datetime

# Tự động cấu hình sys.path để nhận diện thư mục 'src' chứa package 'pipeline'
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import cấu hình và các module con trong pipeline
from pipeline import config
from pipeline.ingest.lms_fetcher import download_pdf
from pipeline.transform.doc_converter import (
    convert_pdf_to_markdown_gemini,
    convert_pdf_to_markdown_openrouter,
    convert_pdf_to_markdown_pypdf,
)


def run_pipeline(viewer_url, custom_filename=None):
    """
    Hàm điều phối pipeline chính: Nhận URL Viewer -> Tải PDF -> Convert MD -> Lưu theo ngày.
    """
    parsed_url = urllib.parse.urlparse(viewer_url)
    query_params = urllib.parse.parse_qs(parsed_url.query)

    if "file" in query_params:
        pdf_url = query_params["file"][0]
    else:
        # Nếu không có tham số 'file', coi như URL truyền vào đã là link PDF trực tiếp
        pdf_url = viewer_url

    # Xác định tên file cơ sở
    if not custom_filename:
        path_segments = urllib.parse.urlparse(pdf_url).path.split("/")
        last_segment = path_segments[-1] if path_segments else ""
        base_name = urllib.parse.unquote(last_segment)
        if base_name.lower().endswith(".pdf"):
            base_name = base_name[:-4]
        else:
            base_name = "slide_download"
    else:
        base_name = custom_filename.replace(".pdf", "").replace(".md", "")

    # Xác định thư mục con dạng day-xx
    # Mặc định lấy ngày hiện tại của tháng (ví dụ: ngày 10 -> day-10)
    day_str = f"day-{datetime.now().strftime('%d')}"

    # Thử trích xuất số ngày từ tên file (ví dụ "Day 10 ..." -> "day-10")
    base_name_lower = base_name.lower().strip()
    if base_name_lower.startswith("day"):
        parts = base_name_lower.split()
        if len(parts) > 1:
            day_num_str = parts[1].strip()
            day_num = "".join(c for c in day_num_str if c.isdigit())
            if day_num:
                day_str = f"day-{int(day_num):02d}"

    # Sử dụng thư mục con 'data' nằm cùng cấp với file script này (trong src/pipeline)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_dir = os.path.join(script_dir, "data", "pdf", day_str)
    md_dir = os.path.join(script_dir, "data", "md", day_str)

    os.makedirs(pdf_dir, exist_ok=True)
    os.makedirs(md_dir, exist_ok=True)

    pdf_path = os.path.join(pdf_dir, f"{base_name}.pdf")
    md_path = os.path.join(md_dir, f"{base_name}.md")

    # Tải file PDF
    if download_pdf(pdf_url, pdf_path):
        gemini_key = config.GEMINI_API_KEY
        openrouter_key = config.OPENROUTER_API_KEY

        # 1. Thử sử dụng Gemini API nếu có key
        if gemini_key and gemini_key.strip():
            success = convert_pdf_to_markdown_gemini(pdf_path, md_path, gemini_key)
            if success:
                return True
            print("[*] Gemini thất bại. Chuyển sang fallback OpenRouter...")
        else:
            print("[*] Không phát hiện GEMINI_API_KEY trong cấu hình. Chuyển sang fallback OpenRouter...")

        # 2. Thử sử dụng OpenRouter API nếu có key
        if openrouter_key and openrouter_key.strip():
            success = convert_pdf_to_markdown_openrouter(pdf_path, md_path, openrouter_key)
            if success:
                return True
            print("[*] OpenRouter thất bại. Chuyển sang fallback pypdf...")
        else:
            print("[*] Không phát hiện OPENROUTER_API_KEY trong cấu hình. Chuyển sang fallback pypdf...")

        # 3. Fallback cuối cùng về pypdf
        return convert_pdf_to_markdown_pypdf(pdf_path, md_path)
    return False


if __name__ == "__main__":
    # Đọc URL từ file cấu hình config (.env)
    url = config.URL
    name = None

    if len(sys.argv) >= 2:
        url = sys.argv[1]
        if len(sys.argv) > 2:
            name = sys.argv[2]

    if not url or not url.strip():
        print("=================================================================")
        print("Tự động tải PDF Slide từ LMS - VinUni (Firefox Emulation)")
        print("=================================================================")
        print("[*] Không tìm thấy URL trong file .env")
        url = input("Nhập URL Viewer (viewer.html?file=...): ").strip()
        if not url:
            print("[!] URL không được để trống.")
            sys.exit(1)

    run_pipeline(url, name)
