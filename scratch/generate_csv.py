import csv

# Define the columns and rows matching the spreadsheet template (Modern Style + Expanded AI Assistant)
headers = [
    "STT", 
    "Thời lượng", 
    "Cảnh", 
    "Mục tiêu", 
    "Hình ảnh chính", 
    "Góc quay / Máy quay", 
    "Lời thoại / Voiceover", 
    "Chữ trên màn hình", 
    "Ghi chú dựng", 
    "Âm thanh / SFX", 
    "Tài nguyên / Đạo cụ"
]

rows = [
    [
        "1",
        "0:00-0:08",
        "Hook - Học khuya",
        "Cho thấy học viên bị quá tải ngay từ 3 giây đầu.",
        "Cận mặt học viên lúc khuya; ánh sáng laptop chiếu lên mặt; màn hình có nhiều tab slide, lab, deadline.",
        "Cận mặt; cắt nhanh sang màn hình laptop; thêm chi tiết đồng hồ khuya hoặc góc bàn học.",
        "Trong một lớp học AI cường độ cao tại VinUniversity, vấn đề không phải là thiếu tài liệu...",
        "Quá nhiều tài liệu.\nThiếu sự rõ ràng.",
        "Mở nhanh, hơi căng; màu hơi tối; cắt trong 2 giây đầu để giữ nhịp.",
        "Nhạc căng nhẹ; tiếng gõ phím; notification nhỏ.",
        "Laptop, đèn bàn, màn hình slide/lab/deadline."
    ],
    [
        "2",
        "0:08-0:22",
        "Vấn đề - Knowledge debt",
        "Làm rõ nỗi đau: học không kịp, nợ kiến thức tăng dần, ngại hỏi.",
        "Học viên lướt slide dài, mở lab, nhìn deadline; gõ câu hỏi vào chat rồi xóa.",
        "Quay qua vai nhìn slide/lab; cận tay gõ rồi xóa câu hỏi; cận notebook có nhiều dấu hỏi.",
        "Vấn đề là mỗi ngày học không hiểu kịp, nợ kiến thức lại dày thêm. Muốn hỏi, nhưng lại sợ câu hỏi của mình quá cơ bản.",
        "Slide dài.\nDeadline gần.\nMuốn hỏi nhưng ngại.",
        "Dựng montage 3-4 shot nhanh; nhấn khoảnh khắc gõ rồi xóa câu hỏi.",
        "Tiếng gõ phím, phím xóa, notification nhẹ; nhạc căng hơn một chút.",
        "Notebook, bút, màn hình chat giả lập, màn hình lab deadline."
    ],
    [
        "3",
        "0:22-0:35",
        "Cách cũ - AI tổng quát",
        "Cho thấy AI tổng quát hữu ích nhưng không đủ để giúp học viên hiểu bài.",
        "Học viên hỏi AI tổng quát bằng slide/lab; nhận câu trả lời dài; đọc xong vẫn bối rối.",
        "Quay màn hình AI tổng quát hoặc giao diện giả lập; quay qua vai học viên đọc; cận mặt vẫn chưa hiểu.",
        "AI tổng quát có thể trả lời rất nhanh. Nhưng nhiều khi câu trả lời quá dài, không bám đúng bài học, và đưa đáp án trước khi mình thực sự hiểu.",
        "AI trả lời nhanh.\nNhưng vẫn chưa hiểu.",
        "Cho thấy câu trả lời dài phải kéo màn hình; crop hoặc làm mờ nếu có dữ liệu nhạy cảm.",
        "Hiệu ứng chữ sinh ra nhanh; nhạc vẫn căng.",
        "Màn hình AI tổng quát hoặc mock screen."
    ],
    [
        "4",
        "0:35-0:55",
        "EduGap xuất hiện",
        "Chuyển cảm xúc từ rối sang rõ.",
        "Học viên mở EduGap; giao diện sáng, sạch, rõ ràng. Đặc biệt: Cáo Sofi 3D hoạt họa bay ra từ màn hình laptop, lượn một vòng lấp lánh quanh học viên A rồi đáp nhẹ lên bàn học, nháy mắt mỉm cười.",
        "Quay qua vai lúc mở EduGap; chèn screen recording dashboard/trang học. Quay cận cảnh Cáo Sofi bay lượn và biểu cảm thích thú của học viên.",
        "Cho đến khi tôi biết tới EduGap – hệ thống gia sư AI cá nhân hóa thiết kế riêng cho bài học của lớp. Và đây là Sofi – trợ lý AI đồng hành thông thái, người sẽ không để tôi cô độc trên con đường học tập.",
        "EduGap\nHọc từ tài liệu chính thức",
        "Màu sáng hơn; giảm nhịp cắt; tạo cảm giác có đường đi.",
        "Nhạc chuyển sang sáng, rõ, nhẹ hơn; SFX chuyển cảnh mềm; SFX lấp lánh khi Sofi bay.",
        "Dashboard/trang học EduGap, logo, mô hình Cáo Sofi 3D."
    ],
    [
        "5",
        "0:55-1:18",
        "Hỏi bài - Gợi ý, không làm hộ",
        "Show điểm khác biệt lớn nhất: gợi ý Socratic có citation.",
        "EduGap chat: học viên hỏi một khái niệm trong bài; EduGap trả lời bằng gợi ý từng bước và citation.",
        "Quay màn hình chat; zoom/callout vào citation card; cắt nhẹ sang học viên ghi note.",
        "Khác biệt hoàn toàn với những AI chỉ biết làm hộ bài tập, trợ lý Sofi hoạt động theo phương pháp Socratic gợi mở. Sofi không cho đáp án ăn sẵn, mà chia nhỏ kiến thức, đặt câu hỏi định hướng để tôi tự tìm câu trả lời, giống như có một Mentor thực thụ kiên nhẫn gỡ rối tư duy cho tôi 24/7.",
        "Gợi ý, không làm hộ.\nCó nguồn từ tài liệu học.",
        "Highlight citation card; đảm bảo chữ đọc được; browser zoom 100-110%.",
        "Nhạc rõ hơn; tiếng click UI nhẹ.",
        "EduGap chat, câu hỏi ngắn, câu trả lời dạng hint, citation card."
    ],
    [
        "6",
        "1:18-1:35",
        "Luyện tập - Học bằng làm bài",
        "Show EduGap không chỉ là chat, mà có vòng luyện tập.",
        "Học viên làm quiz, chọn đáp án, nhận feedback/hint, rồi tiếp tục làm bài.",
        "Screen recording quiz; cận chuột chọn đáp án; feedback sau khi trả lời; cắt sang mặt học viên tập trung.",
        "Không chỉ ôn luyện ngẫu nhiên, hệ thống adaptive learning của EduGap sử dụng các thuật toán Elo và BKT để hiệu chuẩn chính xác mức độ thành thạo và độ khó bài tập, kết hợp cùng thuật toán LinUCB Bandit tự động gợi ý những thử thách nằm đúng trong vùng phát triển gần nhất ZPD với tỷ lệ thành công mục tiêu 75%.",
        "Luyện tập đúng trình độ.\nBiết phần cần ôn tiếp.",
        "Show rõ click đáp án và feedback; không để màn hình quá nhiều chữ.",
        "SFX click; nhạc chuyển sang có động lực hơn.",
        "Màn hình quiz, đáp án, feedback, hint/explanation, mastery update."
    ],
    [
        "7",
        "1:35-1:50",
        "Tiến bộ - Biết đi đâu tiếp",
        "Payoff cảm xúc: từ panic sang có next step.",
        "Màn hình progress/mastery/next review; học viên ghi lại phần cần ôn rồi bình tĩnh học tiếp.",
        "Screen recording progress; cận notebook ghi phần cần ôn; medium shot học viên tập trung lại.",
        "Toàn bộ tiến trình năng lực được trực quan hóa qua biểu đồ Radar đa chiều và Heatmap hoạt động. Từ kết quả phân tích của thuật toán, tôi biết chính xác mình đang vững kiến thức nào, còn hổng mảnh ghép nào, và bước đi tiếp theo là gì.",
        "Từ hoang mang\nđến rõ bước tiếp theo.",
        "Giảm nhịp; màu sáng hơn; giữ shot học viên nhẹ nhõm 1-2 giây.",
        "Nhạc dịu và sáng; có thể có tiếng thở ra/tiếng bút nếu tự nhiên.",
        "Màn hình progress/mastery, next review/learning path."
    ],
    [
        "8",
        "1:50-2:00",
        "Kết",
        "Chốt thương hiệu và CTA.",
        "Logo EduGap; học viên tiếp tục học bình tĩnh; có thể overlay UI đẹp nhất hoặc Sofi nhỏ.",
        "Medium shot học viên; end card logo; có QR placeholder nếu cần.",
        "EduGap giúp tôi học cùng AI mà không đi đường tắt, thực sự tự tin làm chủ con đường học tập của chính mình.",
        "EduGap\nHọc để hiểu, không phải để copy.\nQuét QR để thử demo",
        "End card sạch, đồng bộ với slide đầu của pitch deck.",
        "Nhạc resolve, không cắt cụt.",
        "Logo, screenshot UI đẹp nhất, QR placeholder, Sofi tùy chọn."
    ]
]

# Write to CSV with UTF-8 BOM so Excel displays Vietnamese correctly
output_path = "video_script_production_plan.csv"
with open(output_path, mode="w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(rows)

print(f"Successfully generated {output_path}")
