import base64
import os
from datetime import datetime

# Prompt dùng cho vision-LLM đọc trang scan (Gemini/OpenRouter đọc nguyên PDF;
# GPT-4o/Groq vision đọc từng ảnh trang - xem convert_pdf_to_markdown_openai_vision).
# Đã test và tinh chỉnh trên SGV Toán 8 KNTT (xem docs/domain-knowledge/PDF_to_Knowledge_Graph.md
# mục 2.3): việc chèn <!-- page: N --> và yêu cầu giữ nguyên số dòng bảng rowspan là bắt buộc,
# thiếu 2 yêu cầu này sẽ làm mất nội dung ở bảng phức tạp và mất khả năng trace provenance.
VISION_PAGE_PROMPT = """Convert these scanned textbook pages to clean, well-formatted Markdown.
Each image is one page, given in order with a label "[Image below is page N]" before it.

Requirements:
- For each page, start with an HTML comment marker exactly like: <!-- page: N -->
- Preserve ALL content faithfully. Do not summarize, paraphrase, translate, or normalize any text or symbol.
- Maintain the original Vietnamese language and diacritics EXACTLY as shown. Double-check tone marks carefully
  (e.g. "dễ" vs "để" are different words with different tone marks - read the diacritic shape precisely).
- Convert math formulas to LaTeX using $...$ or $$...$$, transcribing symbols exactly as printed
  (e.g. if the page shows "N*" keep it as N^{*} or \\mathbb{N}^{*}, do NOT change it to \\mathbb{N}^{+} or any
  other "equivalent" form).
- TABLES ARE CRITICAL - many pages have tables with merged/spanning cells (a label in the left column
  applies to multiple rows below it). For these tables:
  - Output ONE markdown table row for EACH visual row in the original table, even if a left-column
    cell visually spans multiple rows.
  - Never drop a cell's text content when reconstructing merged cells. If unsure which row content
    belongs to, keep it in its own row rather than merging it with an adjacent row.
- If a page contains a worked math problem with both an equation and a final numeric answer, keep both
  the full equation and the final answer verbatim - downstream code will use them for automated verification.
- Convert tables to markdown table format, maintain heading hierarchy (# ## ### etc), preserve lists,
  code blocks, and quotes.
Output only the markdown content for all pages concatenated, without any preamble or explanation."""


def _render_pdf_pages_to_base64_png(pdf_path, page_indices, zoom=2.0):
    """Render các trang PDF (0-indexed) thành ảnh PNG base64 bằng PyMuPDF."""
    import fitz

    doc = fitz.open(pdf_path)
    mat = fitz.Matrix(zoom, zoom)
    images = {}
    for p in page_indices:
        pix = doc[p].get_pixmap(matrix=mat)
        images[p] = base64.b64encode(pix.tobytes("png")).decode("utf-8")
    return images


def convert_pdf_to_markdown_openai_vision(
    pdf_path,
    md_path,
    api_key,
    model="gpt-4o",
    batch_size=3,
    page_range=None,
    base_url=None,
):
    """
    Chuyển PDF (đặc biệt là scan, không có text layer) sang Markdown bằng vision-LLM
    tương thích OpenAI API (GPT-4o mặc định; truyền base_url trỏ sang Groq +
    model vision của Groq, vd "meta-llama/llama-4-scout-17b-16e-instruct", để
    dùng Groq thay OpenAI khi hết quota - cùng client OpenAI SDK, chỉ đổi
    base_url/api_key, giống pattern GroqKnowledgeExtractor trong extractor.py).
    Xử lý theo batch trang vì API vision chỉ nhận ảnh, không nhận file PDF
    trực tiếp như Gemini.

    page_range: tuple (start, end) 0-indexed, inclusive-exclusive, để test/chạy
    một phần tài liệu thay vì toàn bộ. None = toàn bộ tài liệu.

    Đã kiểm chứng: model có thể transcribe sai công thức toán dù đã yêu cầu
    "transcribe faithfully" (xem docs/domain-knowledge/PDF_to_Knowledge_Graph.md
    mục 2.2). Riêng model vision của Groq (llama-4-scout) đã được test và xác
    nhận LÀM HỎNG bảng có ô gộp nhiều dòng (rowspan) - xem mục 2.1 cùng tài
    liệu. Output của hàm này KHÔNG được coi là publish-ready - phải qua bước
    verify (src/pipeline/graphusion/formula_verifier.py) và review trước khi
    đưa vào Knowledge Graph/Content KB.
    """
    print(f"[*] Đang sử dụng {'Groq' if base_url else 'OpenAI'} API (model {model}) để chuyển đổi PDF (vision, theo batch trang)...")
    try:
        from openai import OpenAI
    except ImportError:
        print("[!] Không tìm thấy thư viện openai. Fallback về pypdf...")
        return False

    if not os.path.exists(pdf_path):
        print(f"[!] File PDF đầu vào không tồn tại: {pdf_path}")
        return False

    try:
        import fitz

        doc = fitz.open(pdf_path)
        n_pages = len(doc)
        start, end = page_range if page_range else (0, n_pages)
        end = min(end, n_pages)
        page_indices = list(range(start, end))

        client = OpenAI(api_key=api_key, base_url=base_url)
        all_markdown = []

        for batch_start in range(0, len(page_indices), batch_size):
            batch = page_indices[batch_start : batch_start + batch_size]
            print(f"[*] Đang xử lý trang {batch[0] + 1}-{batch[-1] + 1}/{n_pages}...")
            images = _render_pdf_pages_to_base64_png(pdf_path, batch)

            content = [{"type": "text", "text": VISION_PAGE_PROMPT}]
            for p in batch:
                page_num = p + 1
                content.append({"type": "text", "text": f"[Image below is page {page_num}]"})
                content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{images[p]}"}})

            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": content}],
                temperature=0.0,
            )
            batch_markdown = response.choices[0].message.content or ""
            all_markdown.append(batch_markdown)

        markdown_text = "\n\n".join(all_markdown)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(markdown_text)

        print(f"[+] Chuyển đổi bằng OpenAI vision thành công! File lưu tại: {md_path}")
        return True
    except Exception as e:
        print(f"[!] Lỗi khi gọi {'Groq' if base_url else 'OpenAI'} vision API: {str(e)}")
        return False


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
