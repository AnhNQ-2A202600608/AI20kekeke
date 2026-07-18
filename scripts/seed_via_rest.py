import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client
from supabase.client import ClientOptions

# Reconfigure stdout/stderr to support Vietnamese Unicode printing on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Set project root path
project_root = Path(__file__).parent.parent
load_dotenv(project_root / ".env")


def seed_data():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY")

    if not url or not key or "supabase.co" not in url:
        print("[!] Lỗi: Chưa cấu hình SUPABASE_URL hoặc SUPABASE_SECRET_KEY hợp lệ trong file .env")
        sys.exit(1)

    print(f"[*] Kết nối tới Supabase REST API tại: {url}")

    # Khởi tạo client cho schema 'app'
    app_client = create_client(url, key, options=ClientOptions(schema="app"))

    # 1. Seed Course
    print("[*] Đang seed khóa học mẫu...")
    course = {
        "id": "00000000-0000-0000-0000-000000000001",
        "code": "ai-bootcamp",
        "title": "AI & LLM Bootcamp",
        "status": "active",
    }
    app_client.table("courses").upsert(course, on_conflict="code").execute()
    print("[+] Seed khóa học thành công!")

    # 2. Seed Concepts, Questions, and Hints
    concepts = [
        ("00000000-0000-0000-0000-000000000101", "day1-basics", "Day 1: AI & LLM Foundation"),
        ("00000000-0000-0000-0000-000000000102", "day2-basics", "Day 2: Xác định Bài toán cho AI"),
        ("00000000-0000-0000-0000-000000000103", "react-loop-basics", "Day 3: Design Pattern ReAct"),
        (
            "00000000-0000-0000-0000-000000000104",
            "prompt-context-foundations",
            "Day 4: Prompt Engineering & Tool Calling",
        ),
        (
            "00000000-0000-0000-0000-000000000105",
            "ai-product-uncertainty-foundations",
            "Day 5: Thiết kế sản phẩm AI cho sự không chắc chắn",
        ),
        ("00000000-0000-0000-0000-000000000106", "hackathon-day-preview", "Day 6: Hackathon Day"),
        ("00000000-0000-0000-0000-000000000107", "day7-basics", "Day 7: Data Foundations - Embedding & Vector Store"),
        (
            "00000000-0000-0000-0000-000000000108",
            "day8-basics",
            "Day 8: RAG Pipeline - Retrieval — Augmentation — Generation",
        ),
        ("00000000-0000-0000-0000-000000000109", "day9-basics", "Day 9: Multi-Agent & Kết Nối Hệ Thống"),
        ("00000000-0000-0000-0000-000000000110", "day10-basics", "Day 10: Data Pipeline & Data Observability"),
    ]

    questions = [
        {
            "id": "00000000-0000-0000-0000-000000000201",
            "concept_id": "00000000-0000-0000-0000-000000000101",
            "type": "mcq",
            "prompt": "Kiến trúc Transformer giới thiệu cơ chế nào giúp xử lý song song thay thế RNN?",
            "answer_key": {
                "options": {
                    "A": "Cơ chế Convolutional Pooling.",
                    "B": "Cơ chế Recurrent Gate.",
                    "C": "Cơ chế Self Attention.",
                    "D": "Cơ chế Feed Forward.",
                },
                "correct": "C",
                "explanation": "Cơ chế Self Attention cho phép các token trong chuỗi tương tác đồng thời với nhau, loại bỏ tính tuần tự của RNN/LSTM và tăng tốc độ tính toán song song.",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000202",
            "concept_id": "00000000-0000-0000-0000-000000000102",
            "type": "mcq",
            "prompt": "Khi bắt đầu một dự án AI, bước nào cần được ưu tiên thực hiện trước nhất để định hình bài toán?",
            "answer_key": {
                "options": {
                    "A": "Lựa chọn dòng card đồ họa GPU đắt tiền nhất để chạy.",
                    "B": "Xác định rõ vấn đề kinh doanh, mục tiêu và nguồn dữ liệu.",
                    "C": "Viết code huấn luyện các mô hình học sâu phức tạp ngay.",
                    "D": "Thiết kế giao diện người dùng frontend thật bắt mắt cho app.",
                },
                "correct": "B",
                "explanation": "Định nghĩa rõ ràng mục tiêu kinh doanh và chuẩn bị dữ liệu sạch là bước quyết định sự thành bại của bất kỳ dự án AI nào trước khi chọn mô hình hoặc hạ tầng phần cứng.",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000203",
            "concept_id": "00000000-0000-0000-0000-000000000103",
            "type": "mcq",
            "prompt": "Một chatbot FAQ trả lời sai khi người dùng hỏi tồn kho hiện tại. Khi nào nên chuyển bài toán này sang ReAct Agent?",
            "answer_key": {
                "options": {
                    "A": "Khi câu trả lời cần đọc tồn kho mới nhất rồi quyết định phản hồi.",
                    "B": "Khi câu trả lời cần văn văn phong tự nhiên hơn và dài hơn bình thường.",
                    "C": "Khi câu trả lời chỉ lấy từ danh sách FAQ đã duyệt sẵn.",
                    "D": "Khi câu trả lời cần dịch sang nhiều ngôn ngữ khác nhau ngay.",
                },
                "correct": "A",
                "explanation": "ReAct Agent phù hợp khi câu trả lời phụ thuộc dữ liệu động từ công cụ, không chỉ kiến thức tĩnh trong prompt.",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000204",
            "concept_id": "00000000-0000-0000-0000-000000000104",
            "type": "mcq",
            "prompt": "Khác biệt cốt lõi giữa prompt engineering và context engineering là gì?",
            "answer_key": {
                "options": {
                    "A": "Prompt engineering chỉ tối ưu câu lệnh, còn context engineering quản lý toàn bộ thông tin trong lượt suy luận.",
                    "B": "Prompt engineering luôn dùng công cụ ngoài, còn context engineering chỉ dùng văn bản trong system prompt.",
                    "C": "Prompt engineering chỉ dành cho mô hình nhỏ, còn context engineering chỉ dành cho mô hình chạy offline.",
                    "D": "Prompt engineering xử lý bảo mật mạng, còn context engineering chỉ kiểm tra cú pháp JSON đầu ra.",
                },
                "correct": "A",
                "explanation": "Prompt là một phần của context. Context engineering quản lý system prompt, history, tool definitions, dữ liệu ngoài và kết quả công cụ trong từng lượt gọi.",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000205",
            "concept_id": "00000000-0000-0000-0000-000000000105",
            "type": "mcq",
            "prompt": "Điểm khác biệt cốt lõi giữa phần mềm truyền thống và sản phẩm AI là gì?",
            "answer_key": {
                "options": {
                    "A": "Phần mềm truyền thống xử lý logic xác định, còn AI dự đoán theo xác suất và luôn có sai số.",
                    "B": "Phần mềm truyền thống không cần yêu cầu, còn AI chỉ cần giao diện đẹp để hoạt động đúng.",
                    "C": "Phần mềm truyền thống luôn chạy offline, còn AI chỉ chạy được khi có dữ liệu mạng xã hội.",
                    "D": "Phần mềm truyền thống không thể có bug, còn AI chỉ sai khi lập trình viên viết thiếu code.",
                },
                "correct": "A",
                "explanation": "AI không vận hành theo đúng/sai tuyệt đối như phần mềm xác định. Nó tạo dự đoán xác suất nên sản phẩm phải thiết kế cho sai số và độ tin cậy.",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000206",
            "concept_id": "00000000-0000-0000-0000-000000000106",
            "type": "mcq",
            "prompt": "Trong một sự kiện Hackathon Day của sản phẩm AI, mục tiêu quan trọng nhất khi xây dựng sản phẩm mẫu (Prototype) là gì?",
            "answer_key": {
                "options": {
                    "A": "Tập trung hoàn thiện một luồng trải nghiệm cốt lõi (core flow) bằng dữ liệu thực tế.",
                    "B": "Xây dựng toàn bộ tất cả các tính năng phụ của ứng dụng để người dùng dùng thử.",
                    "C": "Viết báo cáo chi tiết về kế hoạch phát triển sản phẩm trong vòng năm năm tới.",
                    "D": "Thiết kế giao diện đồ họa đẹp mắt và bóng bẩy nhất có thể mà không cần chạy được.",
                },
                "correct": "A",
                "explanation": "Trong Hackathon, thời gian có hạn nên việc tập trung hoàn thành một luồng cốt lõi (core flow) chạy được là điều tối quan trọng để chứng minh tính khả thi.",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000207",
            "concept_id": "00000000-0000-0000-0000-000000000107",
            "type": "mcq",
            "prompt": "Khi một Agent trả lời sai hoặc gặp hiện tượng ảo giác (hallucination) do dữ liệu đầu vào bị lỗi hoặc chưa được làm sạch, giải pháp nào dưới đây là hiệu quả và đúng đắn nhất?",
            "answer_key": {
                "options": {
                    "A": "Chuyển sang sử dụng một mô hình ngôn ngữ lớn (LLM) khác đắt tiền và mạnh mẽ hơn.",
                    "B": "Tăng độ dài của Context Window và nạp thêm toàn bộ tài liệu thô vào prompt.",
                    "C": "Tiến hành lọc sạch, chuẩn hóa và xử lý chất lượng của nguồn dữ liệu đầu vào.",
                    "D": "Thiết lập nhiệt độ (temperature) của mô hình về giá trị cao nhất để tăng tính sáng tạo.",
                },
                "correct": "C",
                "explanation": "Theo nguyên tắc 'Garbage In, Garbage Out', chất lượng dữ liệu đầu vào quyết định tính chính xác của Agent. Việc nâng cấp mô hình đắt tiền hơn không giải quyết được vấn đề nếu dữ liệu bị lỗi.",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000208",
            "concept_id": "00000000-0000-0000-0000-000000000108",
            "type": "mcq",
            "prompt": "Vấn đề cốt lõi nào dưới đây mà kỹ thuật RAG (Retrieval-Augmented Generation) được thiết kế để giải quyết cho mô hình ngôn ngữ lớn?",
            "answer_key": {
                "options": {
                    "A": "Cung cấp chứng cứ thực tế từ kho dữ liệu ngoài để hạn chế ảo giác và cập nhật kiến thức mới.",
                    "B": "Huấn luyện lại toàn bộ tham số của mô hình ngôn ngữ lớn để ghi nhớ thêm các tri thức mới.",
                    "C": "Mở rộng kích thước cửa sổ ngữ cảnh của mô hình ngôn ngữ lớn để nạp toàn bộ tài liệu thô.",
                    "D": "Điều chỉnh các tham số giải mã của mô hình ngôn ngữ lớn để tăng tính sáng tạo khi sinh.",
                },
                "correct": "A",
                "explanation": "RAG cung cấp thông tin thực tế từ bên ngoài để giúp LLM trả lời chính xác, tránh ảo giác và vượt qua giới hạn ngày đóng băng kiến thức (knowledge cutoff).",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000209",
            "concept_id": "00000000-0000-0000-0000-000000000109",
            "type": "mcq",
            "prompt": "Nguyên nhân chính dẫn đến hiện tượng 'God Agent' trong thiết kế hệ thống trợ lý AI là gì?",
            "answer_key": {
                "options": {
                    "A": "Do sử dụng một mô hình ngôn ngữ có kích thước cực lớn.",
                    "B": "Do thiết kế một tác tử duy nhất gánh vác quá nhiều vai trò.",
                    "C": "Do tích hợp quá nhiều cơ sở dữ liệu vector vào hệ thống.",
                    "D": "Do giới hạn tốc độ xử lý của hệ thống phần cứng máy.",
                },
                "correct": "B",
                "explanation": "Hiện tượng God Agent xảy ra khi một agent duy nhất phải đảm nhận quá nhiều trách nhiệm như lập kế hoạch, truy xuất, thực thi và tổng hợp.",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
        {
            "id": "00000000-0000-0000-0000-000000000210",
            "concept_id": "00000000-0000-0000-0000-000000000110",
            "type": "mcq",
            "prompt": "Theo thống kê thực tế, phần lớn thời gian trong một dự án AI được dành cho nhiệm vụ nào sau đây?",
            "answer_key": {
                "options": {
                    "A": "Huấn luyện và tinh chỉnh các siêu tham số mô hình.",
                    "B": "Thu thập, làm sạch và giám sát chất lượng dữ liệu.",
                    "C": "Thiết kế giao diện người dùng và triển khai ứng dụng.",
                    "D": "Tối ưu hóa hệ thống máy chủ và hạ tầng mạng.",
                },
                "correct": "B",
                "explanation": "60-80% thời gian của dự án AI thực tế dành cho công việc chuẩn bị, làm sạch và giám sát dữ liệu (data work).",
            },
            "difficulty_elo": 1200.0,
            "calibration_status": "published",
        },
    ]

    hints = {
        "00000000-0000-0000-0000-000000000201": [
            "Kiến trúc Transformer loại bỏ hoàn toàn việc xử lý tuần tự (RNN) để xử lý song song. Hãy nghĩ về cơ chế giúp kết nối trực tiếp các từ.",
            "Cơ chế này tính toán độ tương đồng giữa các từ thông qua phép nhân ma trận Query và Key.",
            "Đây chính là cơ chế 'Tự chú ý' (Self Attention), trái tim của mạng Transformer.",
        ],
        "00000000-0000-0000-0000-000000000202": [
            "Trước khi chọn mô hình hay viết code, chúng ta cần hiểu rõ mục tiêu mình muốn đạt được và tài nguyên đang có.",
            "Hãy nghĩ đến việc thu thập dữ liệu và xác định các yêu vụ thực tế.",
            "Việc xác định rõ vấn đề kinh doanh, mục tiêu và nguồn dữ liệu là nền tảng bắt buộc trước khi bắt tay vào kỹ thuật.",
        ],
        "00000000-0000-0000-0000-000000000203": [
            "ReAct Agent khác biệt ở chỗ nó có khả năng suy nghĩ (Thought) và hành động (Action) thông qua việc gọi các công cụ ngoài.",
            "Dữ liệu tĩnh như FAQ không cần cập nhật liên tục, nhưng dữ liệu động như số lượng hàng tồn kho trong kho thì cần gọi API/Tool.",
            "Khi câu trả lời cần truy vấn thông tin tồn kho mới nhất theo thời gian thực từ cơ sở dữ liệu.",
        ],
        "00000000-0000-0000-0000-000000000204": [
            "Prompt chỉ là câu lệnh đơn lẻ mà bạn gửi cho mô hình. Hãy nghĩ về bức tranh toàn cảnh rộng lớn hơn trong một cuộc hội thoại.",
            "Context (ngữ cảnh) bao gồm lịch sử trò chuyện, biến hệ thống, kết quả gọi công cụ và toàn bộ bộ nhớ đệm.",
            "Sự khác biệt nằm ở chỗ prompt chỉ là câu lệnh tối ưu, còn context engineering quản lý toàn bộ vòng đời và luồng thông tin.",
        ],
        "00000000-0000-0000-0000-000000000205": [
            "Phần mềm truyền thống chạy theo các quy tắc logic cứng (If-Else) nên kết quả luôn cố định. AI học từ dữ liệu nên hoạt động thế nào?",
            "Mô hình AI đưa ra các kết quả dựa trên xác suất, do đó không thể tránh khỏi các sai số hoặc ảo giác.",
            "Khác biệt cốt lõi là phần mềm truyền thống xử lý logic xác định (deterministic), còn AI dự đoán theo xác suất (probabilistic).",
        ],
        "00000000-0000-0000-0000-000000000206": [
            "Một cuộc thi Hackathon diễn ra trong thời gian rất ngắn (thường chỉ 24-48 giờ). Bạn có nên cố xây dựng toàn bộ hệ thống không?",
            "Mục tiêu hàng đầu là chứng minh ý tưởng cốt lõi của bạn hoạt động được và mang lại giá trị.",
            "Tập trung hoàn thiện một luồng trải nghiệm cốt lõi (core flow) chạy được và ổn định bằng dữ liệu thực tế.",
        ],
        "00000000-0000-0000-0000-000000000207": [
            "Nguyên tắc vàng trong khoa học dữ liệu là 'Garbage In, Garbage Out'.",
            "Nếu dữ liệu đầu vào bị sai lệch hoặc chứa rác, việc đổi mô hình đắt tiền hơn cũng chỉ tạo ra câu trả lời sai bóng bẩy hơn.",
            "Bạn cần tập trung vào việc lọc sạch, chuẩn hóa cấu trúc và xử lý chất lượng của nguồn dữ liệu đầu vào.",
        ],
        "00000000-0000-0000-0000-000000000208": [
            "Mô hình ngôn ngữ lớn bị giới hạn bởi ngày đóng băng kiến thức và không có quyền truy cập vào tài liệu nội bộ của doanh nghiệp.",
            "RAG giúp 'cắm' thêm một thư viện tài liệu bên ngoài để LLM tra cứu thông tin trước khi trả lời.",
            "RAG cung cấp chứng cứ thực tế từ kho dữ liệu ngoài để hạn chế ảo giác và cập nhật các thông tin mới nhất.",
        ],
        "00000000-0000-0000-0000-000000000209": [
            "Thuật ngữ 'God Agent' ám chỉ một tác tử cố gắng làm tất cả mọi việc một mình trong hệ thống.",
            "Khi một Agent phải gánh vác quá nhiều task từ lập kế hoạch, code, dịch, truy vấn DB, nó sẽ dễ bị quá tải context.",
            "Hiện tượng này xảy ra do thiết kế một tác tử duy nhất gánh vác quá nhiều vai trò và trách nhiệm thay vì chia nhỏ.",
        ],
        "00000000-0000-0000-0000-000000000210": [
            "Huấn luyện mô hình thực chất chỉ chiếm một phần nhỏ trong toàn bộ vòng đời sản xuất của dự án AI.",
            "Phần lớn thời gian của các kỹ sư dữ liệu và AI được dành cho việc xử lý dữ liệu thô.",
            "60-80% thời gian thực tế của dự án được dành cho việc thu thập, làm sạch và giám sát chất lượng dữ liệu.",
        ],
    }

    # Seed Concepts
    print("[*] Đang seed các concept (chủ đề)...")
    for cid, code, name in concepts:
        payload = {
            "id": cid,
            "course_id": "00000000-0000-0000-0000-000000000001",
            "code": code,
            "name": name,
            "status": "active",
        }
        app_client.table("concepts").upsert(payload, on_conflict="course_id,code").execute()

    # Seed Questions & Hints
    print("[*] Đang seed ngân hàng câu hỏi & gợi ý...")
    for q in questions:
        # Upsert Question
        q_payload = {
            "id": q["id"],
            "course_id": "00000000-0000-0000-0000-000000000001",
            "concept_id": q["concept_id"],
            "type": q["type"],
            "prompt": q["prompt"],
            "answer_key": q["answer_key"],
            "difficulty_elo": q["difficulty_elo"],
            "calibration_status": q["calibration_status"],
        }
        app_client.table("questions").upsert(q_payload, on_conflict="id").execute()

        # Seed Question Concepts mapping
        qc_payload = {"question_id": q["id"], "concept_id": q["concept_id"]}
        app_client.table("question_concepts").upsert(qc_payload, on_conflict="question_id,concept_id").execute()

        # Seed Question Hints
        q_hints = hints[q["id"]]
        for i, text in enumerate(q_hints):
            hint_payload = {"question_id": q["id"], "level": i + 1, "hint_text": text}
            app_client.table("question_hints").upsert(hint_payload, on_conflict="question_id,level").execute()

    print("[+] Hoàn tất seed toàn bộ dữ liệu mẫu thành công!")


if __name__ == "__main__":
    seed_data()
