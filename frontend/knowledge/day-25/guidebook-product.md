# Day 25 - Kế hoạch & Thực thi AI Startup (AI Startup Roadmap & Execution)

> **Câu hỏi trung tâm:** *"Có tiền rồi – đi đâu trước? Làm gì trước?"*

---

### 🗺️ 1. Bản đồ Kiến thức Kế hoạch Thực thi (Execution Roadmap Knowledge Map)

Để tối ưu hóa việc thực thi kế hoạch cho AI startup, cần nắm vững các khái niệm và framework sau:

#### 1.1. Output vs Outcome
- **Output:** Đo lường bằng số lượng tính năng, dòng code, hoặc độ chính xác của mô hình.
- **Outcome:** Đo lường giá trị thực tế mà sản phẩm mang lại cho người dùng, như tiết kiệm thời gian, tăng doanh thu, hoặc giảm tỷ lệ rời bỏ.

> **Insight:** Outcome = ngôn ngữ của business.

#### 1.2. RICE Framework
Công thức RICE giúp quyết định tính năng nào nên được ưu tiên dựa trên:
$$
\text{RICE Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}
$$

| Yếu tố      | Câu hỏi                                     | Đơn vị                                                        |
| :---------- | :------------------------------------------ | :------------------------------------------------------------ |
| **R — Reach**   | Bao nhiêu user sẽ đụng tính năng này / quý? | Số người                                                     |
| **I — Impact**  | Tác động đến user mạnh cỡ nào?               | 0.25 (tiny) / 0.5 (low) / 1 (medium) / 2 (high) / 3 (massive) |
| **C — Confidence** | Bạn tự tin về số R, I bao nhiêu %?           | 50% / 80% / 100%                                             |
| **E — Effort**  | Tốn bao nhiêu person-month?               | Person-month                                                 |

#### 1.3. Now/Next/Later Framework
Phân loại các tính năng theo thứ tự ưu tiên mà không cần ngày tháng cụ thể:

| NOW                       | NEXT                            | LATER                           |
| :------------------------ | :------------------------------ | :------------------------------ |
| Đang làm hôm nay          | Sẽ làm sau Now                  | Tầm nhìn dài hạn                |
| Chi tiết: cao             | Chi tiết: medium                | Chi tiết: mơ hồ                 |
| Rủi ro: thấp             | Rủi ro: trung bình              | Rủi ro: cao                     |

---

### 📌 2. Khái niệm Cơ bản & Từ khóa Nền tảng (Core Concepts & Glossary)

| Thuật ngữ | Khái niệm Kỹ thuật & Bản chất | Tại sao cần quan tâm? |
| :--- | :--- | :--- |
| **Output** | Đo lường số lượng tính năng, dòng code, hoặc độ chính xác của mô hình. | Không phản ánh giá trị thực tế cho người dùng. |
| **Outcome** | Đo lường giá trị thực tế mà sản phẩm mang lại cho người dùng. | Là ngôn ngữ của business, cần thiết để thu hút nhà đầu tư. |
| **RICE Framework** | Công thức giúp quyết định tính năng ưu tiên dựa trên Reach, Impact, Confidence, và Effort. | Giúp giảm thiểu cãi vã và đưa ra quyết định dựa trên dữ liệu. |
| **Now/Next/Later** | Phân loại các tính năng theo thứ tự ưu tiên mà không cần ngày tháng cụ thể. | Tạo ra sự linh hoạt và tập trung vào vấn đề cần giải quyết. |

---

### 📐 3. Quy tắc, Công thức & Tham số Kỹ thuật (Hard Rules & Formulas)

#### 3.1. RICE Score Tính toán
$$
\text{RICE Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}
$$

#### 3.2. Ví dụ Tính toán RICE
| Tính năng                    | R    | I   | C   | E | Score |
| :--------------------------- | :--- | :-- | :-- | :- | :---- |
| Auto-reply trên Shopee      | 5000 | 2.0 | 0.8 | 2 | 4000  |
| A/B test message templates   | 3000 | 1.0 | 0.9 | 1 | 2700  |

---

### 💻 4. Hành trang Kỹ thuật & Mã nguồn (Technical Hands-on)

#### 4.1. Đặt cột mốc với OKRs
Cấu trúc OKR:
- **Objective:** Định tính, ngắn, truyền cảm hứng.
- **Key Results:** Định lượng, có số, đo lường được.

|              | Objective (O)                                | Key Results (KRs)                           |
| :----------- | :------------------------------------------- | :------------------------------------------ |
| **Đặc điểm** | Định tính, ngắn, nhớ được                     | Định lượng, có số                          |
| **Số lượng** | 1 per quarter                                | 3 per Objective                             |

---

### ⚠️ 5. Cạm bẫy Ký sinh & Rủi ro (Dependency Mapping)

#### 5.1. Nền Kinh tế Ký sinh
- **Sản phẩm ký sinh:** Không sở hữu tài sản gì, phụ thuộc vào API bên ngoài.
- **Rủi ro:** Mỗi external dependency là một cái dao treo trên đầu.

#### 5.2. Dependency Map
| Lớp              | Ai?                         | Họ có thể làm gì?                     | Mitigation                          |
| :--------------- | :-------------------------- | :------------------------------------ | :---------------------------------- |
| Tier 1 — Critical | OpenAI/Anthropic API        | Khóa account, tăng giá 5x, rate limit | Multi-vendor fallback               |

---

### 🧠 6. Tư duy Chuyển dịch: Từ Ý tưởng đến Gọi vốn

> “Vision without execution is just hallucination.” — Thomas Edison

Sau 5 ngày từ ý tưởng đến Investor Package, bạn đã chuẩn bị đầy đủ hành trang để gọi vốn cho AI startup của mình. Hãy tự tin thực hiện kế hoạch và điều chỉnh khi cần thiết để đạt được thành công.