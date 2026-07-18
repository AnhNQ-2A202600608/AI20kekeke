# BÁO CÁO ĐÁNH GIÁ CHẤT LƯỢNG SƯ PHẠM & HALLUCINATION (P0-3)

## 1. Kết quả Chẩn đoán Điểm yếu (Diagnostic Engine)
* **Độ chính xác chung (Overall Accuracy):** 100.0% (Ngưỡng yêu cầu: >= 85%)
* **Chi tiết theo loại ca thử nghiệm:**
  * **Ca Happy Path (Đường thuận lợi):** 100.0%
  * **Ca Noise (Sơ suất ngẫu nhiên):** 100.0%
  * **Ca Adversarial (Đối kháng/Trace-back):** 100.0%

## 2. Kết quả RAG & Citation Hallucination theo Model Provider
### Đầu ra qua Provider: **CLOUD**
* **Tổng số câu hỏi đánh giá:** 1
* **Tỉ lệ sót trích dẫn (Citation Miss Rate):** 0.00% (Ngưỡng yêu cầu: < 1.0% ở Production)
* **Tỉ lệ ảo tưởng (Hallucination Rate):** 0.00%
* **Tỉ lệ rò rỉ đáp án (Pedagogical Leak Rate):** 0.00%

## 3. Phân tích chất lượng Đồ thị tri thức (Graph Analysis)
* **Loại đồ thị:** ĐỒ THỊ MẪU KIỂM THỬ (MOCK GRAPH)
* **Tổng số nút (YCCĐ):** 4
* **Tổng số cạnh tiên quyết:** 3
* **Phân bố theo khối lớp:** {"7": 1, "6": 1, "5": 1, "4": 1}
* **Phân bố theo môn học:** {"Toán": 4}
* **Phân bố theo mạch nội dung:** {"Số và Đại số": 4}
