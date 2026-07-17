# Day 20 - Kế hoạch & Thực thi AI Startup (AI Startup Roadmap & Execution)

> **Câu hỏi trung tâm:** *"Có tiền rồi – đi đâu trước? Làm gì trước?"*

---

### 🗺️ 1. Bản đồ Kiến thức Hệ thống (Knowledge Map)

Để tối ưu hóa việc thực thi kế hoạch cho AI startup, chúng ta sẽ sử dụng 4 framework chính:

#### 1.1. RICE Framework
RICE giúp biến cảm tính thành quyết định dựa trên toán học:

$$\text{RICE Score} = \frac{R \times I \times C}{E}$$

| Yếu tố         | Câu hỏi                           | Đơn vị                                                       |
| :------------- | :-------------------------------- | :----------------------------------------------------------- |
| **R - Reach**  | Bao nhiêu user sẽ đụng tính năng này / quý? | Số người                                                     |
| **I - Impact** | Tác động đến user mạnh cỡ nào?     | 0.25 (tiny) / 0.5 (low) / 1 (medium) / 2 (high) / 3 (massive) |
| **C - Confidence** | Bạn tự tin về số R, I bao nhiêu %? | 50% / 80% / 100%                                             |
| **E - Effort** | Tốn bao nhiêu person-month?       | Person-month                                                 |

#### 1.2. Now/Next/Later Framework
Sắp xếp các tính năng theo thứ tự ưu tiên mà không cần ngày tháng cụ thể:

| **NOW**                       | **NEXT**                                             | **LATER**                                        |
| :---------------------------- | :--------------------------------------------------- | :----------------------------------------------- |
| Đang làm hôm nay              | Sẽ làm sau Now                                       | Tầm nhìn dài hạn                                 |
| **Chi tiết:** cao             | **Chi tiết:** medium                                 | **Chi tiết:** mơ hồ                              |
| **Rủi ro:** thấp              | **Rủi ro:** trung bình                               | **Rủi ro:** cao                                  |
| **Thời gian:** 1–3 tháng       | **Thời gian:** 3–6 tháng                             | **Thời gian:** 6–18 tháng                        |

#### 1.3. OKRs (Objectives and Key Results)
Cấu trúc OKR giúp đo lường tiến độ và kết quả:

|                       | **Objective (O)**                                    | **Key Results (KRs)**                               |
| :-------------------- | :--------------------------------------------------- | :-------------------------------------------------- |
| **Đặc điểm**          | Định tính, ngắn, nhớ được                            | Định lượng, có số                                   |
| **Số lượng**          | 1 per quarter                                        | 3 per Objective                                     |
| **Câu hỏi**           | "Chúng ta đi đâu?”                                   | "Làm sao biết đã đến?”                              |

#### 1.4. Dependency Mapping
Xác định các rủi ro từ các phụ thuộc bên ngoài:

| Lớp              | Ai?                         | Họ có thể làm gì?                   | Mitigation                                  |
| :--------------- | :-------------------------- | :---------------------------------- | :------------------------------------------ |
| **Tier 1 — Critical** | OpenAI/Anthropic API        | Khóa account, tăng giá 5x, rate limit | Multi-vendor fallback                        |
| **Tier 2 — Important** | Apple/Google Play           | Reject submission, ban app          | Web app fallback                            |
| **Tier 3 — Watch** | Browser extension stores    | Đổi policy                          | Direct download fallback                    |

---

### 📌 2. Khái niệm Cơ bản & Từ khóa Nền tảng (Core Concepts & Glossary)

| Thuật ngữ | Khái niệm Kỹ thuật & Bản chất | Tại sao cần quan tâm? |
| :--- | :--- | :--- |
| **RICE** | Framework giúp đánh giá và ưu tiên các tính năng dựa trên Reach, Impact, Confidence và Effort. | Giúp founder đưa ra quyết định dựa trên dữ liệu thay vì cảm tính. |
| **Now/Next/Later** | Phương pháp sắp xếp các tính năng theo thứ tự ưu tiên mà không cần ngày tháng cụ thể. | Giúp tránh việc cam kết với các mốc thời gian không thực tế. |
| **OKRs** | Cấu trúc mục tiêu và kết quả chính giúp đo lường tiến độ và kết quả. | Giúp align roadmap với outcome thực tế. |
| **Dependency Mapping** | Xác định các phụ thuộc bên ngoài có thể ảnh hưởng đến dự án. | Giúp chuẩn bị cho các tình huống xấu và có kế hoạch ứng phó. |

---

### 📐 3. Quy tắc, Công thức & Tham số Kỹ thuật (Hard Rules & Formulas)

#### 3.1. RICE Framework
- **Công thức:** $$\text{RICE Score} = \frac{R \times I \times C}{E}$$
- **Lưu ý:** Confidence là yếu tố quan trọng nhất, cần phải có dữ liệu thực tế để đánh giá.

#### 3.2. OKRs
- **Cấu trúc:** 1 Objective + 3 Key Results
- **Quy tắc 70%:** Nếu hoàn thành 100% KR, cần đặt mục tiêu cao hơn cho lần sau.

---

### 💻 4. Hành trang Kỹ thuật & Mã nguồn (Technical Hands-on)

#### 4.1. Workshop 1: Chấm RICE cho startup của bạn
1. Chọn 5 tính năng cốt lõi từ PRD.
2. Đánh giá từng tính năng theo RICE.
3. Tính Score và vẽ 2x2 Value-Effort Matrix.

#### 4.2. Workshop 2: Vẽ la bàn cho startup
1. Sắp xếp 5 tính năng vào Now/Next/Later.
2. Không ghi ngày tháng, chỉ ghi vấn đề cần giải quyết.

#### 4.3. Workshop 3: Viết OKR cho cột NOW
1. Viết 1 Objective cho cột NOW.
2. Viết 3 Key Results theo cấu trúc đã nêu.

#### 4.4. Workshop 4: Vẽ Dependency Map
1. Liệt kê 3 external dependencies có thể giết dự án.
2. Viết Plan B cho từng dependency và vẽ Critical Path.

---

### 🧠 5. Tư duy Chuyển dịch: Từ Ý tưởng đến Gọi vốn

> **Cảnh báo quan trọng:** *Vision without execution is just hallucination.*  
> Sau 5 ngày, từ ý tưởng đến Investor Package, bạn đã chuẩn bị đầy đủ để gọi vốn cho AI startup của mình.

---

### 📅 6. Milestone 1: Gói Hồ sơ Gọi vốn (Investor-Ready Package)

Gói hồ sơ bao gồm:
1. Market Analysis + PRD
2. Financial Model + Unit Economics
3. Investor Pitch Deck
4. Roadmap Now/Next/Later + OKRs
5. Dependency Map + Critical Path

---

### 🎉 7. Wrap-up

**Day 20 đã trả lời:**
- Làm gì trước? — RICE Framework & 2x2 Value-Effort Matrix
- Sắp xếp thế nào? — Now/Next/Later thay cho Gantt Chart
- Đo bằng gì? — OKRs với Outcome (không Output)
- Rủi ro ở đâu? — Dependency Map + Critical Path

Chúc các bạn execute không hallucinate!