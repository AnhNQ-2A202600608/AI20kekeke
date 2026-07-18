# Day 22 - DPO, ORPO & Alignment — Từ SFT đến Preference Learning

> **Câu hỏi cốt lõi:** *"RLHF tốn kém — DPO làm được điều tương tự mà không cần reward model?"*

---

### 🗺️ 1. Bản đồ Kiến thức Hệ thống (Structured Knowledge Map)

#### 1.1. Tại sao SFT chưa đủ?
- **SFT (Supervised Fine-Tuning)** dạy “nói gì” nhưng không dạy “nói như thế nào”.
- **Alignment** giúp mô hình phân biệt giữa câu trả lời tốt và xấu.

#### 1.2. RLHF — Bức tranh toàn cảnh
- **RLHF (Reinforcement Learning from Human Feedback)** là quy trình phức tạp với 3 mô hình và nhiều tham số.
- Chi phí cao do cần nhiều mô hình và giai đoạn huấn luyện.

#### 1.3. DPO — Direct Preference Optimization
- **DPO** loại bỏ mô hình thưởng và huấn luyện trực tiếp trên cặp tốt/xấu.
- **DPO loss** sử dụng binary cross-entropy trên log-ratio giữa xác suất chọn và từ chối.

#### 1.4. ORPO, SimPO & Alternatives
- **ORPO** (One-Stage Reinforcement Preference Optimization) kết hợp SFT loss và preference loss trong một mục tiêu.
- **SimPO** (Simple Preference Optimization) không cần mô hình tham chiếu.

---

### 📌 2. Khái niệm Cơ bản & Từ khóa Nền tảng (Core Concepts & Glossary)

| Thuật ngữ | Khái niệm Kỹ thuật & Bản chất | Tại sao cần quan tâm? |
| :--- | :--- | :--- |
| **SFT** | Huấn luyện mô hình theo hướng dẫn từ dữ liệu đã gán nhãn. | Cung cấp kiến thức cơ bản cho mô hình. |
| **RLHF** | Huấn luyện mô hình dựa trên phản hồi từ con người. | Tạo ra mô hình có khả năng tương tác tốt hơn. |
| **DPO** | Huấn luyện mô hình trực tiếp trên cặp tốt/xấu mà không cần mô hình thưởng. | Giảm chi phí và tăng hiệu quả huấn luyện. |
| **ORPO** | Kết hợp SFT và preference loss trong một giai đoạn. | Đơn giản hóa quy trình huấn luyện. |
| **SimPO** | Huấn luyện mà không cần mô hình tham chiếu. | Giảm yêu cầu về tài nguyên. |

---

### 📐 3. Quy tắc, Công thức & Tham số Kỹ thuật (Hard Rules & Formulas)

#### 3.1. DPO Loss
Công thức cho DPO loss được định nghĩa như sau:

$$L_{DPO} = - \log \left( \sigma\left(\beta \log \left(\frac{\pi_\theta(y_w)}{\pi_{ref}(y_w)}\right) - \beta \log \left(\frac{\pi_\theta(y_l)}{\pi_{ref}(y_l)}\right)\right)\right)$$

Trong đó:
- $y_w$: câu trả lời tốt.
- $y_l$: câu trả lời xấu.
- $\beta$: tham số điều chỉnh mức độ alignment.

#### 3.2. DPO Hyperparameter: β
- **β (KL penalty)** điều chỉnh mức độ gần gũi của mô hình với mô hình tham chiếu.
- Bắt đầu với β = 0.1, điều chỉnh tùy theo hiệu suất của mô hình.

---

### 💻 4. Hành trang Kỹ thuật & Mã nguồn (Technical Hands-on)

#### 4.1. Triển khai DPO với TRL
Mã nguồn dưới đây mô tả cách triển khai DPO:

```python
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("path/to/sft-model")
ref_model = AutoModelForCausalLM.from_pretrained("path/to/sft-model") # frozen

config = DPOConfig(
    beta=0.1,
    learning_rate=5e-7,
    max_length=1024,
    max_prompt_length=512,
)

trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    args=config,
    train_dataset=pref_data,
)
trainer.train()
```

#### 4.2. Theo dõi quá trình huấn luyện
- **Chosen rewards**: phải tăng qua các epoch.
- **Rejected rewards**: phải giảm qua các epoch.

---

### 🧠 5. Tư duy Chuyển dịch: Từ SFT đến DPO

Sự chuyển dịch từ SFT sang DPO cho phép mô hình học cách phân biệt giữa các câu trả lời tốt và xấu một cách hiệu quả hơn, giảm thiểu chi phí và thời gian huấn luyện.

---

### 🔍 6. Đánh giá Alignment — LLM Benchmarks

#### 6.1. Static benchmarks
| Benchmark  | Đo gì                  | Format               | Score   |
|------------|------------------------|----------------------|---------|
| MMLU       | Kiến thức nền 57 subjects | MCQ 4-choice         | 0–100%  |
| GSM8K      | Math grade-school      | Gen + match ####     | 0–100%  |

#### 6.2. Judge-based benchmarks
| Benchmark     | # prompts          | Format                 | Judge        |
|---------------|--------------------|------------------------|--------------|
| MT-Bench      | 80 multi-turn      | Score 1-10             | GPT-4        |
| AlpacaEval 2 LC | 805 single-turn    | Win-rate vs gpt-4-1106 | GPT-4        |

---

### 📊 7. Tổng kết — Key Takeaways

1. **DPO** là phương pháp chính cho giai đoạn 2025-2026.
2. **Watch failure modes**: likelihood displacement, length hacking.
3. **ORPO** cho phép huấn luyện một giai đoạn từ base đến aligned.
4. **SimPO** khi length bias là vấn đề; **KTO** khi chỉ có +1/-1.
5. **VN-first models** dừng ở SFT — cơ hội cho mô hình DPO-aligned VN.

---

### 📅 8. Tiếp theo & Bài tập

**Ngày 23: LangGraph & Agentic Orchestration**
- Hoàn thành Lab 22: DPO alignment + deploy aligned model.
- Đọc: LangGraph documentation — State, Nodes, Edges.

---

### ❓ 9. Hỏi & Đáp

DPO hay ORPO – bạn sẽ chọn phương pháp nào cho dự án của mình và tại sao?