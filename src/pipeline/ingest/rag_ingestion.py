import os
import sys
import urllib.parse

import fitz
import requests
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings

# Reconfigure stdout/stderr to use UTF-8 for Windows console
# Thêm parent dir vào sys.path để import src
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.services.supabase_config import get_backend_supabase_config  # noqa: E402

# Load env
load_dotenv(os.path.join(project_root, ".env"))


def parse_pdf_slides(file_path):
    """
    Phân tích file PDF thành các slide bằng cách render trang thành ảnh
    và trích xuất text từng trang.
    Trả về danh sách dict: {slide_number, content, image_bytes}
    """
    doc = fitz.open(file_path)
    slides = []
    doc_name = os.path.basename(file_path)

    for page_num in range(len(doc)):
        page = doc[page_num]

        # 1. Trích xuất text để làm embedding & context
        text = page.get_text().strip()
        if not text:
            # Fallback nếu trang không có text (ví dụ PDF scan chỉ có ảnh)
            text = f"Slide {page_num + 1} của tài liệu {doc_name}"

        # 2. Render ảnh trang PDF
        # Zoom x2 để tăng chất lượng hiển thị (dpi=150-180)
        zoom = 2
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")

        slides.append({"slide_number": page_num + 1, "content": text, "image_bytes": img_bytes})

    return slides


def ingest_slides(target_filter: str | None = None):
    # Lấy các biến cấu hình từ env
    supabase_config = get_backend_supabase_config(allow_stub=True)
    supabase_url = supabase_config.url
    supabase_api_key = supabase_config.secret_key
    openai_key = os.getenv("OPENAI_API_KEY")

    if supabase_config.is_stub:
        raise ValueError("Chưa cấu hình SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong file .env")

    if not openai_key or "your-key" in openai_key:
        raise ValueError("Chưa cấu hình OPENAI_API_KEY trong file .env")

    # Khởi tạo OpenAI Embeddings
    print("[*] Đang khởi tạo OpenAI Embeddings (text-embedding-3-small)...")
    embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small", api_key=openai_key)

    # Quét thư mục src/pipeline/data/pdf
    data_dir = os.path.join(project_root, "src", "pipeline", "data", "pdf")
    if not os.path.exists(data_dir):
        raise FileNotFoundError(f"Không tìm thấy thư mục dữ liệu tại {data_dir}")

    print(f"[*] Bắt đầu quét các file PDF trong thư mục: {data_dir}")
    pdf_files = []
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            if file.endswith(".pdf"):
                if target_filter:
                    if target_filter.lower() in file.lower():
                        pdf_files.append(os.path.join(root, file))
                else:
                    pdf_files.append(os.path.join(root, file))

    if not pdf_files:
        raise FileNotFoundError(
            "Không tìm thấy file PDF nào trong thư mục data"
            + (f" khớp với '{target_filter}'." if target_filter else ".")
        )

    print(f"[+] Tìm thấy {len(pdf_files)} file PDF để xử lý.")

    total_chunks_inserted = 0

    headers = {
        "apikey": supabase_api_key,
        "Authorization": f"Bearer {supabase_api_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    for file_path in pdf_files:
        doc_name = os.path.basename(file_path)
        print(f"\n[*] Đang xử lý file: {doc_name}...")

        try:
            slides = parse_pdf_slides(file_path)
        except Exception as e:
            print(f"[!] Lỗi khi đọc và parse file PDF {doc_name}: {e}")
            continue

        if not slides:
            print(f"[-] Không trích xuất được slide nào từ file PDF {doc_name}. Bỏ qua.")
            continue

        print(f"[+] Trích xuất thành công {len(slides)} trang slides.")

        # Xóa các slide cũ của tài liệu này để tránh trùng lặp
        delete_url = f"{supabase_url}/rest/v1/slide_embeddings?document_name=eq.{urllib.parse.quote(doc_name)}"
        try:
            del_resp = requests.delete(delete_url, headers=headers)
            if del_resp.status_code in [200, 204]:
                print(f"[-] Đã dọn dẹp các slide cũ của file {doc_name} trong DB.")
            else:
                print(f"[!] Lỗi khi dọn dẹp slide cũ: {del_resp.status_code} - {del_resp.text}")
        except Exception as e:
            print(f"[!] Lỗi kết nối khi dọn dẹp slide cũ: {e}")
            continue

        # Tạo vector cho từng slide, upload ảnh, và insert DB theo bulk
        bulk_data = []
        for slide in slides:
            slide_num = slide["slide_number"]
            content = slide["content"]
            img_bytes = slide["image_bytes"]

            print(f"  -> Đang xử lý Slide {slide_num}/{len(slides)}...")

            try:
                # 1. Upload ảnh slide lên Supabase Storage
                dest_path = f"{doc_name}/page_{slide_num}.png"
                upload_url = f"{supabase_url}/storage/v1/object/slide-images/{urllib.parse.quote(dest_path)}"

                upload_headers = {
                    "apikey": supabase_api_key,
                    "Authorization": f"Bearer {supabase_api_key}",
                    "Content-Type": "image/png",
                    "x-upsert": "true",
                }

                up_resp = requests.post(upload_url, headers=upload_headers, data=img_bytes)
                if up_resp.status_code not in [200, 201]:
                    print(f"    [!] Lỗi khi upload ảnh slide {slide_num}: {up_resp.status_code} - {up_resp.text}")
                    image_url = None
                else:
                    safe_doc_path = urllib.parse.quote(f"{doc_name}/page_{slide_num}.png")
                    image_url = f"{supabase_url}/storage/v1/object/public/slide-images/{safe_doc_path}"

                # 2. Gọi OpenAI Embedding API
                embedding = embeddings_model.embed_query(content)

                bulk_data.append(
                    {
                        "document_name": doc_name,
                        "slide_number": slide_num,
                        "content": content,
                        "embedding": embedding,
                        "image_url": image_url,
                    }
                )
            except Exception as e:
                print(f"  [!] Lỗi khi sinh embedding/upload ảnh cho slide {slide_num} trong file {doc_name}: {e}")

        if bulk_data:
            print(f"[*] Đang nạp {len(bulk_data)} slides vào database...")
            insert_url = f"{supabase_url}/rest/v1/slide_embeddings"
            try:
                ins_resp = requests.post(insert_url, headers=headers, json=bulk_data)
                if ins_resp.status_code in [200, 201]:
                    print(f"[+] Đã nạp thành công {len(bulk_data)} slides vào DB.")
                    total_chunks_inserted += len(bulk_data)
                else:
                    print(f"[!] Lỗi khi nạp slides vào DB: {ins_resp.status_code} - {ins_resp.text}")
            except Exception as e:
                print(f"[!] Lỗi kết nối khi nạp slides vào DB: {e}")

    print("\n[+] ĐÃ HOÀN THÀNH INGESTION!")
    print(f"    Tổng số chunks (slides) đã nạp: {total_chunks_inserted}")


if __name__ == "__main__":
    filter_arg = sys.argv[1] if len(sys.argv) > 1 else None
    try:
        ingest_slides(filter_arg)
    except Exception as e:
        print(f"[!] Lỗi khi chạy: {e}")
        sys.exit(1)
