import os

import requests


def download_pdf(pdf_url, output_path):
    """
    Tải file PDF từ URL trực tiếp với Header giả lập Firefox để vượt anti-bot.
    """
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print(f"[+] Phát hiện file PDF đã tồn tại cục bộ: {output_path}. Bỏ qua tải.")
        return True

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://aithucchien.vinuni.edu.vn/",
        "Connection": "keep-alive",
    }

    print("[*] Đang tải PDF từ link gốc...")
    try:
        response = requests.get(pdf_url, headers=headers, stream=True, timeout=30)

        if response.status_code == 200:
            with open(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            print(f"[+] Đã tải xong PDF: {output_path}")
            return True
        elif response.status_code == 401:
            print("[!] Lỗi 401 (Unauthorized): Token JWT của bạn đã hết hạn.")
            print("[!] Vui lòng F5 trang LMS để nhận link Viewer mới chứa Token mới.")
            return False
        else:
            print(f"[!] Lỗi HTTP {response.status_code} khi kết nối tải PDF.")
            print(f"Chi tiết: {response.text[:300]}")
            return False
    except Exception as e:
        print(f"[!] Đã xảy ra lỗi kết nối tải PDF: {str(e)}")
        return False
