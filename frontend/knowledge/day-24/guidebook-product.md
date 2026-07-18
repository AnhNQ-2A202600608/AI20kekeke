# Day 24 - Responsible AI: Map the Failure

> **Câu hỏi cốt lõi:** *"AI có thể sai ở đâu, gây hại cho ai, kiểm thử thế nào, và chặn ở đâu trước khi ra mắt?"*

---

### 🗺️ 1. Bản đồ Kiến thức Rủi ro AI (AI Risk Knowledge Map)

Để hiểu rõ về trách nhiệm trong AI, chúng ta cần phân tích các khái niệm cốt lõi và quy trình kiểm thử:

#### 1.1. Khung Responsible AI
- **AI Ethics (Đạo đức AI):** AI nên hoặc không nên làm gì? Ai được lợi, ai bị hại?
- **Responsible AI (AI có trách nhiệm):** Vận hành AI bằng quy trình, review và người chịu trách nhiệm như thế nào?
- **AI Safety Evaluation (Đánh giá an toàn AI):** AI có thể sai ở đâu, với ai, kiểm thử thế nào, chặn ở đâu?

#### 1.2. Lộ trình Kiểm thử Trước khi Ra mắt
| Phần | Nội dung chính | Sản phẩm tạo ra |
|---|---|---|
| **Khung Responsible AI** | Phân biệt đạo đức, trách nhiệm, đánh giá an toàn. | Ngôn ngữ chung để đánh giá rủi ro. |
| **6 câu hỏi trước khi ra mắt** | Quản lý sản phẩm cần hỏi gì trước khi chatbot gặp người dùng. | 6 câu hỏi trước khi ra mắt cho chatbot. |
| **8 kiểu lỗi** | Nhìn trước các kiểu lỗi phổ biến. | Từ vựng để gọi tên rủi ro. |
| **Risk Map** | Mô tả tình huống, chọn lỗi, gắn vào tầng và liệt kê tác hại. | `worksheet/01-risk-map.md` |
| **Test + Eval** | Viết câu hỏi an toàn, bộ kiểm thử và cách chấm điểm. | `worksheet/02-test-eval-plan.md` |

---

### 📌 2. Khái niệm Cơ bản & Từ khóa Nền tảng (Core Concepts & Glossary)

| Khái niệm | Câu hỏi chính | Vai trò trong Day 24 |
|---|---|---|
| **AI Ethics** | AI nên hoặc không nên làm gì? | Lớp giá trị: quan tâm đến công bằng, minh bạch, tác hại và trách nhiệm. |
| **Responsible AI** | Vận hành AI bằng quy trình như thế nào? | Mục tiêu biến giá trị thành quy trình trước và sau khi ra mắt. |
| **AI Safety Evaluation** | AI có thể sai ở đâu? | Tìm lỗi, viết kiểm thử, định nghĩa cách chấm. |

---

### 📐 3. Quy tắc, Công thức & Tham số Kỹ thuật (Hard Rules & Formulas)

#### 3.1. 6 Câu hỏi Trước khi Ra mắt
1. Chatbot được phép trả lời gì?
2. Khi không biết thì sao?
3. Ai bị hại nếu nó bịa?
4. Bộ kiểm thử có bao quát trường hợp ngoài lề không?
5. Có đường chuyển người thật không?
6. User có biết đây là AI không?

---

### 🔍 4. Các Kiểu Lỗi Thường Gặp (Common Failure Modes)

| Mode | AI sai kiểu gì? | Trigger thường gặp | Ví dụ bad behavior | Layer chính → layer phụ |
|---|---|---|---|---|
| **Hallucination** | Bịa thông tin | Thiếu RAG, chính sách mơ hồ | Bot bịa chính sách hoàn tiền. | Input/RAG → UI + Human-in-loop |
| **Bias / fairness** | Đối xử khác nhau | Dữ liệu lệch | Score risk cao hơn cho một nhóm. | Input data + Model → Monitoring |
| **Sycophancy** | Đồng ý với người dùng | Câu hỏi đầy cảm xúc | User nói "tôi đúng chứ?", AI đồng ý. | Model + Prompt → UI evidence |
| **Over-reliance** | Tin AI quá mức | Giao diện thiếu báo hiệu | Người dùng tin output như quyết định chính thức. | UI → Monitoring |
| **Harmful advice** | Đưa lời khuyên gây hại | Lĩnh vực rủi ro cao | AI đưa lời khuyên y tế nguy hiểm. | STAT |
| **Privacy leak** | Rò dữ liệu | Phân quyền công cụ lỗi | AI lộ thông tin định danh. | Tool/RAG + Input → Logging/audit |
| **Escalation failure** | Không chuyển người thật | Không có quy tắc | AI xử lý trường hợp ngoại lệ. | System rule → Human-in-loop |
| **Misuse / jailbreak** | Bị lạm dụng | Tiêm prompt | Người dùng ép AI làm việc bị cấm. | Input đối kháng + Rào chắn của model → Giám sát |

---

### 🧠 5. Định Nghĩa AI Safety

**AI Safety** là vận hành đáng tin cậy, không chỉ là bảo mật. Nó bao gồm:
- **Không chỉ là bảo mật:** Không xử lý được hallucination, bias, over-reliance.
- **Không chỉ là kỹ thuật:** Cần giám sát, chính sách, rà soát.
- **Không chỉ chống lạm dụng:** AI vô ý sai vẫn có thể gây hại.

---

### 💻 6. Hành trang Kỹ thuật & Mã nguồn (Technical Hands-on)

#### 6.1. Risk Map
Tạo bản đồ rủi ro bằng cách chọn track, mô tả tình huống, chọn lỗi và gắn vào tầng.

#### 6.2. Test + Eval Plan
Viết câu hỏi an toàn, bộ kiểm thử và kế hoạch đánh giá.

```markdown
## 1. Safety Question
[1 câu]

## 2. Test Set v0
ID | User input | Expected safe behavior | Fail if | Severity | Eval level
---|---|---|---|---|---
T1 | ... | ... | ... | ... | ...

## 3. Eval Plan v0
Pass criteria:
Fail criteria:
Unclear criteria:
Severity rules:
Reviewer plan:
```

---

### 🔄 7. Vòng lặp Đánh giá (Iterative Eval Loop)

Đánh giá không phải một lần; mỗi lần phát hiện lỗi mới sẽ cập nhật bộ kiểm thử.

```mermaid
graph LR
    A[1. PREDICT\nDự đoán failure] --> B[2. DESIGN\nViết test case];
    B --> C[3. DEFINE\nPass / Fail / Unclear\n+ severity];
    C --> D[4. DISCOVER\nFailure mới\n(red-team)];
    D --> E[5. UPDATE\nCập nhật test set];
    E --> F[LOOP BACK];
```

---

### 📅 8. Từ Day 24 sang Day 25

| DAY 24 (HÔM NAY) <br> **Map the Failure** | DAY 25 (MAI) <br> **Design Solution** | SAU RA MẮT <br> **Vòng lặp sau ra mắt** |
|---|---|---|
| 1. AI được trả lời gì? | 5. Có đường chuyển người thật? | Giám sát câu hỏi người dùng thật. |
| 2. Khi không biết thì sao? | 6. Người dùng có biết đây là AI? | Vòng lặp không bao giờ dừng. |
| 3. Ai bị hại nếu nó bịa? | + Kiểm thử tấn công v1. | Công cụ: bảng giám sát + cảnh báo. |
| 4. Bộ kiểm thử có bao quát trường hợp ngoài lề không? | + Định nghĩa cổng chặn trước ra mắt. | |

---

### 📑 9. Bộ bài nộp Day 24

Chỉ nộp 2 file chính:

| File | Nội dung bắt buộc |
|---|---|
| `01-risk-map.md` | Chọn track, tình huống, 3 ứng viên lỗi, đào sâu lỗi chính, Harm Map. |
| `02-test-eval-plan.md` | Câu hỏi an toàn, bộ kiểm thử v0, kế hoạch đánh giá v0. |

---

> [!IMPORTANT]  
> **Lưu ý:** Hai file trên là gói chính để Day 25 tiếp tục kiểm thử tấn công và thiết kế giải pháp.