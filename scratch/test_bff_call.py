import httpx
import sys

# Setup output encoding for Windows terminal
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

def test_bff():
    url = "http://localhost:3000/api/v1/quiz/report"
    payload = {
        "question_id": "00000000-0000-0000-0000-000000000201",
        "question_text": "Kiến thức Transformer giới thiệu cơ chế nào giúp xử lý song song thay thế RNN?",
        "selected_option": "C",
        "error_type": "Sai kiến thức chuyên môn",
        "detail": "sai kiens thuoc",
        "student_id": "00000000-0000-0000-0000-2a2026000000",
        "course_id": "00000000-0000-0000-0000-000000000001"
    }
    
    print("Sending POST request to BFF:", url)
    try:
        response = httpx.post(url, json=payload, timeout=60.0)
        print("Status Code:", response.status_code)
        print("Response headers:", dict(response.headers))
        print("Response body:", response.text)
    except Exception as e:
        print("Connection failed:", e)

if __name__ == "__main__":
    test_bff()
