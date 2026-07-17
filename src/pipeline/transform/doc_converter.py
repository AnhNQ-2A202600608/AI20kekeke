import os
from datetime import datetime


def convert_pdf_to_markdown_gemini(pdf_path, md_path, api_key):
    """
    Sử dụng Gemini API (thông qua google-genai) để chuyển đổi PDF sang Markdown chất lượng cao (vision OCR).
    """
    print("[*] Đang sử dụng Gemini API (model gemini-2.5-flash) để chuyển đổi PDF...")
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("[!] Không tìm thấy thư viện google-genai. Fallback về pypdf...")
        return False

    try:
        client = genai.Client(api_key=api_key)

        file_size = os.path.getsize(pdf_path)
        use_file_api = file_size > 20 * 1024 * 1024  # > 20MB

        prompt = """Convert this document to clean, well-formatted Markdown.
Requirements:
- Preserve all content, structure, and formatting
- Convert tables to markdown table format
- Maintain heading hierarchy (# ## ### etc)
- Preserve lists, code blocks, and quotes
- Extract text from images/slides if present
- Keep formatting consistent and readable. Maintain the original language of the slides.
Output only the markdown content without any preamble or explanation."""

        if use_file_api:
            print("[*] File lớn hơn 20MB. Đang tải file lên Gemini File API...")
            myfile = client.files.upload(file=pdf_path)

            import time

            max_wait = 300
            elapsed = 0
            while myfile.state.name == "PROCESSING" and elapsed < max_wait:
                time.sleep(2)
                myfile = client.files.get(name=myfile.name)
                elapsed += 2

            if myfile.state.name == "FAILED":
                raise ValueError("Xử lý file trên Gemini File API thất bại.")

            content = [prompt, myfile]
        else:
            with open(pdf_path, "rb") as f:
                file_bytes = f.read()
            content = [prompt, types.Part.from_bytes(data=file_bytes, mime_type="application/pdf")]

        response = client.models.generate_content(model="gemini-2.5-flash", contents=content)

        markdown_text = response.text if hasattr(response, "text") else ""

        with open(md_path, "w", encoding="utf-8") as f:
            f.write(markdown_text)

        print(f"[+] Chuyển đổi bằng Gemini thành công! File lưu tại: {md_path}")
        return True
    except Exception as e:
        print(f"[!] Lỗi khi gọi Gemini API: {str(e)}")
        return False


def convert_pdf_to_markdown_openrouter(pdf_path, md_path, api_key):
    """
    Sử dụng OpenRouter API với model gemini-2.5-flash để chuyển đổi PDF sang Markdown (OCR).
    """
    import base64

    import requests

    print("[*] Đang sử dụng OpenRouter API (model google/gemini-2.5-flash) để chuyển đổi PDF...")
    if not os.path.exists(pdf_path):
        print(f"[!] File PDF đầu vào không tồn tại: {pdf_path}")
        return False

    try:
        # 1. Đọc và mã hóa file PDF sang base64
        with open(pdf_path, "rb") as pdf_file:
            encoded_string = base64.b64encode(pdf_file.read()).decode("utf-8")

        data_url = f"data:application/pdf;base64,{encoded_string}"

        # 2. Cấu hình request gửi đến OpenRouter
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/VinUni-AI-Cohort-2",
            "X-Title": "LMS Slide Pipeline",
        }

        prompt = """Convert this document to clean, well-formatted Markdown.
Requirements:
- Preserve all content, structure, and formatting
- Convert tables to markdown table format
- Maintain heading hierarchy (# ## ### etc)
- Preserve lists, code blocks, and quotes
- Extract text from images/slides if present
- Keep formatting consistent and readable. Maintain the original language of the slides.
Output only the markdown content without any preamble or explanation."""

        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "file", "file": {"filename": os.path.basename(pdf_path), "file_data": data_url}},
                    ],
                }
            ],
        }

        # 3. Gửi POST request
        response = requests.post(url, headers=headers, json=payload, timeout=120)

        if response.status_code != 200:
            print(f"[!] Lỗi HTTP {response.status_code} từ OpenRouter API: {response.text}")
            return False

        res_json = response.json()

        if "error" in res_json:
            print(f"[!] Lỗi từ OpenRouter API: {res_json['error']}")
            return False

        # Parse kết quả trả về
        if "choices" in res_json and len(res_json["choices"]) > 0:
            message = res_json["choices"][0].get("message", {})
            markdown_text = message.get("content", "")
            if not markdown_text:
                print(f"[!] Phản hồi rỗng từ OpenRouter: {res_json}")
                return False

            with open(md_path, "w", encoding="utf-8") as f:
                f.write(markdown_text)

            print(f"[+] Chuyển đổi bằng OpenRouter thành công! File lưu tại: {md_path}")
            return True
        else:
            print(f"[!] Phản hồi từ OpenRouter không hợp lệ hoặc lỗi API: {res_json}")
            return False

    except Exception as e:
        print(f"[!] Lỗi khi gọi OpenRouter API: {str(e)}")
        return False


def convert_pdf_to_markdown_pypdf(pdf_path, md_path):
    """
    Fallback: Đọc file PDF bằng thư viện pypdf và trích xuất text đơn giản sang Markdown.
    """
    print("[*] Đang trích xuất văn bản từ PDF bằng pypdf (không cần API Key)...")
    try:
        import pypdf
    except ImportError:
        print("[!] Không tìm thấy thư viện pypdf. Vui lòng cài đặt để chuyển đổi PDF.")
        return False

    if not os.path.exists(pdf_path):
        print(f"[!] File PDF đầu vào không tồn tại: {pdf_path}")
        return False

    try:
        reader = pypdf.PdfReader(pdf_path)
        markdown_content = []

        title = os.path.basename(pdf_path).replace(".pdf", "")
        markdown_content.append(f"# {title}\n")
        markdown_content.append(
            f"_Tài liệu được trích xuất tự động bằng pypdf vào: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_\n\n---\n"
        )

        for i, page in enumerate(reader.pages):
            page_num = i + 1
            text = page.extract_text()

            markdown_content.append(f"## Page {page_num}\n")
            if text and text.strip():
                markdown_content.append(f"{text.strip()}\n")
            else:
                markdown_content.append("_[Trang này không có văn bản hoặc chỉ chứa hình ảnh]_\n")
            markdown_content.append("\n---\n")

        with open(md_path, "w", encoding="utf-8") as f:
            f.write("\n".join(markdown_content))

        print(f"[+] Đã xuất file Markdown bằng pypdf thành công: {md_path}")
        return True
    except Exception as e:
        print(f"[!] Lỗi trong quá trình chuyển đổi PDF sang MD bằng pypdf: {str(e)}")
        return False
