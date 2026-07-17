# Day 28 - Từ sản phẩm chạy được đến sản phẩm bán được

> **Câu hỏi cốt lõi:** *"Làm thế nào để biến một sản phẩm AI từ khả năng hoạt động thành khả năng thương mại?"*

---

### 🗺️ 1. Bản đồ Kiến thức về AI Pricing, GTM và Evidence

Để tối ưu hóa việc thương mại hóa sản phẩm AI, cần hiểu rõ các khía cạnh sau:

#### 1.1. Sự khác biệt giữa sản phẩm chạy được và sản phẩm bán được
- **Chạy được:** Bài toán kỹ thuật.
- **Bán được:** Bài toán sinh tồn, bắt đầu từ 3 câu hỏi:
  1. Ai trả tiền?
  2. Trả theo đơn vị gì?
  3. Qua kênh nào?

#### 1.2. Chi phí biên của AI so với SaaS
- **SaaS Truyền Thống:** Chi phí biên gần như bằng 0.
- **Sản phẩm AI:** Chi phí biên tăng theo usage (mỗi câu hỏi, mỗi phút gọi, mỗi lần AI sai).

#### 1.3. Dòng chảy giá trị AI
- Giá trị đang chảy về 2 lớp cuối: Compute (GPU) → Model → Tooling → Application → Services.

---

### 📌 2. Khái niệm Cơ bản & Từ khóa Nền tảng (Core Concepts & Glossary)

| Thuật ngữ | Khái niệm Kỹ thuật & Bản chất | Tại sao cần quan tâm? |
| :--- | :--- | :--- |
| **Value Metric** | Đơn vị tính tiền cho sản phẩm AI (Seat, Usage, Outcome, Hybrid). | Quyết định cách khách hàng trả tiền và ảnh hưởng đến doanh thu. |
| **Attribution** | Đo lường giá trị mà sản phẩm AI mang lại cho khách hàng. | Cần thiết để xác định giá trị thực sự của sản phẩm. |
| **Autonomy** | Mức độ tự động hóa của sản phẩm AI. | Ảnh hưởng đến cách tính phí và mô hình kinh doanh. |
| **Cost/Job** | Chi phí để AI hoàn thành một công việc. | Giúp xác định giá bán và đảm bảo lợi nhuận. |

---

### 📐 3. Quy tắc, Công thức & Tham số Kỹ thuật (Hard Rules & Formulas)

#### 3.1. Khung quyết định chọn Value Metric
- Sử dụng ma trận Attribution × Autonomy để chọn đơn vị tính tiền phù hợp.

| ATTRIBUTION | AUTONOMY THẤP | AUTONOMY CAO |
| :---------- | :------------- | :----------- |
| **CAO**     | Usage          | Outcome      |
| **THẤP**    | Seat           | Usage        |

#### 3.2. Giá sàn và neo giá
- **Giá sàn:** Cost/Job ≥ 3x giá bán.
- **Neo giá:** Dựa trên giá trị tiết kiệm cho khách hàng hoặc chi phí nhân công.

#### 3.3. Pricing là giả thuyết
- Pricing không cố định, cần thử nghiệm và điều chỉnh liên tục.

---

### 💻 4. Hành trang Kỹ thuật & Mã nguồn (Technical Hands-on)

#### 4.1. Micro-Assignment 1: Chọn Value Metric & tính Cost/Job
1. **Value Metric:** ☐ Seat ☐ Usage ☐ Outcome ☐ Hybrid
2. **Lý do chọn:** 
3. **Cost/Job:** API + HITL + Khác = TỔNG Giá bán ≥ 3x
4. **Rủi ro lớn nhất:**

#### 4.2. Micro-Assignment 2: The Beachhead Channel
1. **Kênh đầu tiên:** ☐ PLG ☐ Sales-Led ☐ Partner-Led
2. **Tại sao kênh này:**
3. **Pain Moment:** 
4. **Nhúng vào thói quen nào:**

---

### 🧠 5. Tư duy Chuyển dịch: Từ Demo đến Evidence

- **Bán bằng Evidence:** Chứng minh giá trị sản phẩm qua số liệu thực tế, không chỉ qua demo.
- **The Evidence Pack:** Bao gồm Eval Results, Risk Checklist, và Pilot Report để tạo niềm tin cho khách hàng.

---

### 🔑 6. Tổng kết và Hành động

1. **Giá là Value Metric, không phải con số.**
2. **Kênh phân phối = Thói quen.**
3. **Bán bằng Evidence, không bằng Demo.**

> [!IMPORTANT]  
> **Hãy nhớ:** Đừng bán AI. Hãy bán kết quả. Khách hàng quan tâm đến lợi ích thực tế mà sản phẩm mang lại cho họ.