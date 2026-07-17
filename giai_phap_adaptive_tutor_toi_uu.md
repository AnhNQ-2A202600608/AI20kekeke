# Evidence-Guided Adaptive Tutoring System
## Giải pháp tối ưu cho hệ thống học tập thích ứng chẩn đoán lỗ hổng kiến thức gốc rễ

---

## 1. Tóm tắt bài toán

Trong một lớp học phổ thông, đặc biệt ở khu vực có điều kiện hạn chế, một giáo viên có thể phải phụ trách khoảng 40 học sinh với trình độ nền tảng rất khác nhau.

Các vấn đề chính:

- Học sinh yếu dễ bị bỏ lại phía sau.
- Học sinh khá, giỏi phải học theo tốc độ chung.
- Giáo viên khó biết chính xác từng học sinh đang thiếu kiến thức nào.
- Các ứng dụng học hiện tại thường chỉ:
  - chấm đúng hoặc sai;
  - tăng giảm độ khó;
  - cho học sinh học theo lộ trình cố định;
  - không xác định được nguyên nhân gốc của lỗi;
  - chưa hỗ trợ đầy đủ vai trò của giáo viên.

Hệ thống cần giải quyết bốn bài toán:

1. Xác định lỗ hổng kiến thức gốc rễ của từng học sinh.
2. Sinh lộ trình học tập cá nhân hóa để khắc phục đúng lỗ hổng.
3. Tự động nhóm học sinh và đề xuất giáo viên nên hỗ trợ ai trước.
4. Phát hiện lỗ hổng phổ biến toàn lớp để giáo viên tổ chức dạy lại.

Ràng buộc:

- Có thể hoạt động offline hoặc trong điều kiện băng thông thấp.
- Nội dung được ánh xạ với Chương trình Giáo dục phổ thông 2018.
- Có chatbot hỗ trợ học sinh và giáo viên.
- Kết quả chẩn đoán phải giải thích được bằng bằng chứng.

---

# 2. Tên kiến trúc đề xuất

## Evidence-Guided Adaptive Tutoring System

Đây là hệ thống học tập thích ứng dựa trên bằng chứng, kết hợp:

- Prerequisite Knowledge Graph.
- Q-matrix.
- Misconception và Error Pattern Library.
- Root-Cause Backtracking.
- Adaptive Diagnostic Probes.
- Bayesian Knowledge Tracing.
- Elo Item Difficulty.
- Zone of Proximal Development.
- Subgraph Extraction.
- Topological Sort.
- Personalized Learning Path.
- Teacher Intelligence Dashboard.
- Tool-based AI Chatbot.
- Offline-first Web Application.

Nguyên tắc cốt lõi:

> Hệ thống không kết luận học sinh yếu một kiến thức chỉ từ một câu sai. Hệ thống tạo các giả thuyết, đưa câu hỏi đối chứng, thu thập bằng chứng, rồi mới xác nhận lỗ hổng gốc.

---

# 3. Kiến trúc tổng thể

```text
Chương trình GDPT 2018
          ↓
Atomic Skill Knowledge Graph
          ↓
Question Bank + Q-matrix
          ↓
Misconception / Error Pattern Library
          ↓
Student Response Analyzer
          ↓
Hypothesis Generator
          ↓
Adaptive Diagnostic Probe Selector
    ├── Prerequisite Backtracking
    ├── Information Gain
    ├── Elo Difficulty Matching
    └── ZPD Constraints
          ↓
BKT Mastery Update
          ↓
Root-Gap Confirmation
          ↓
Subgraph Extraction + Topological Sort
          ↓
Personalized Learning Path
    ├── Micro Lesson
    ├── Guided Practice
    ├── Independent Practice
    ├── Transfer Test
    └── Spaced Review
          ↓
Teacher Intelligence Dashboard
    ├── Intervention Groups
    ├── Help-First Ranking
    ├── Class-Wide Gap Detection
    └── Evidence Explanation

Chatbot
    └── Gọi các engine thông qua tool, không tự chẩn đoán
```

---

# 4. Các thành phần cốt lõi

## 4.1. Atomic Skill Knowledge Graph

Đồ thị kiến thức được biểu diễn dưới dạng DAG — Directed Acyclic Graph.

### Node

Mỗi node phải là một kiến thức hoặc kỹ năng nguyên tử có thể kiểm tra độc lập.

Không nên dùng:

```text
Bài 1: Phân số
Bài 2: Đạo hàm
Ngày học 1
Ngày học 2
```

Nên dùng:

```text
Cộng số tự nhiên
Hiểu tử số và mẫu số
Cộng phân số cùng mẫu
Tìm bội chung
Quy đồng mẫu số
Cộng phân số khác mẫu
Nhận diện hàm hợp
Quy tắc đạo hàm lũy thừa
Quy tắc dây chuyền
Thu gọn biểu thức đại số
```

### Edge

Mỗi cạnh thể hiện một quan hệ tiên quyết.

Ví dụ:

```text
Cộng số tự nhiên
      ↓
Cộng tử số
      ↓
Cộng phân số cùng mẫu
      ↓
Quy đồng mẫu số
      ↓
Cộng phân số khác mẫu
```

Hoặc:

```text
Hàm bậc nhất
      ↓
Đạo hàm hàm bậc nhất
      ↓
Nhận diện hàm hợp
      ↓
Quy tắc dây chuyền
```

### Dữ liệu node tối thiểu

```json
{
  "skill_id": "FRAC_ADD_SAME_DENOMINATOR",
  "name": "Cộng hai phân số cùng mẫu",
  "subject": "math",
  "grade_introduced": 4,
  "grade_expected": 5,
  "domain": "fractions",
  "skill_type": "procedure",
  "mastery_threshold": 0.8,
  "curriculum_outcome_id": "MATH_G5_OUTCOME_03"
}
```

### Dữ liệu edge tối thiểu

```json
{
  "source_skill_id": "NATURAL_NUMBER_ADDITION",
  "target_skill_id": "FRAC_ADD_SAME_DENOMINATOR",
  "edge_type": "required",
  "strength": 0.8,
  "minimum_mastery": 0.7,
  "rationale": "Học sinh cần cộng được tử số."
}
```

---

## 4.2. Q-matrix

Q-matrix mô tả mỗi câu hỏi đang đo những kỹ năng nào.

Ví dụ câu:

```text
Tính: 1/2 + 1/3
```

Câu này có thể yêu cầu:

- Nhận biết hai phân số khác mẫu.
- Tìm mẫu số chung.
- Tạo phân số tương đương.
- Quy đồng.
- Cộng tử số.
- Rút gọn kết quả.

Q-matrix minh họa:

| Question | Cộng số tự nhiên | Phân số tương đương | Bội chung | Quy đồng | Cộng phân số |
|---|---:|---:|---:|---:|---:|
| Q01 | 1 | 0 | 0 | 0 | 0 |
| Q02 | 1 | 1 | 0 | 0 | 0 |
| Q03 | 1 | 1 | 1 | 1 | 1 |

Một câu hỏi có thể có:

- `target_skill`: kỹ năng chính cần đo.
- `prerequisite_skill`: kỹ năng nền bắt buộc.
- `supporting_skill`: kỹ năng hỗ trợ.
- `confounder_skill`: yếu tố có thể gây nhiễu.

Nếu Q-matrix sai, thuật toán sẽ chẩn đoán sai dù mô hình tính toán chính xác.

---

## 4.3. Misconception và Error Pattern Library

Hệ thống phải lưu kiểu sai, không chỉ lưu đúng hoặc sai.

Ví dụ:

```text
2/5 + 1/5 = 3/10
```

Có thể ánh xạ tới lỗi:

```text
ADD_NUMERATOR_AND_DENOMINATOR
```

Ví dụ đạo hàm:

```text
[(2x + 1)^3]' = 3(2x + 1)^2
```

Có thể ánh xạ tới:

```text
CHAIN_RULE_MISSING_INNER_DERIVATIVE
```

Các error pattern toán học phổ biến:

```text
ADD_NUMERATOR_AND_DENOMINATOR
KEEP_NUMERATOR_CHANGE_DENOMINATOR
FAIL_TO_FIND_COMMON_DENOMINATOR
EQUIVALENT_FRACTION_ERROR
POWER_EXPONENT_NOT_REDUCED
PRODUCT_AS_PRODUCT_OF_DERIVATIVES
QUOTIENT_AS_QUOTIENT_OF_DERIVATIVES
CHAIN_RULE_MISSING_INNER
ALGEBRA_SIMPLIFICATION_ERROR
FAILED_SUBSTITUTION_AT_POINT
```

Lưu ý:

> Một error pattern chỉ là giả thuyết ban đầu. Không được kết luận lỗ hổng chỉ từ một lần xuất hiện.

---

# 5. Root-Cause Diagnostic Engine

## 5.1. Quy trình chẩn đoán

```text
Học sinh trả lời sai
        ↓
Phân tích đáp án hoặc từng bước giải
        ↓
Sinh nhiều giả thuyết nguyên nhân
        ↓
Chọn câu hỏi đối chứng
        ↓
Cập nhật mức thành thạo
        ↓
Truy ngược Knowledge Graph
        ↓
Xác nhận lỗ hổng gốc bằng nhiều bằng chứng
```

## 5.2. Ví dụ cộng phân số

Câu gốc:

```text
2/5 + 1/5 = ?
```

Học sinh trả lời:

```text
3/10
```

Các giả thuyết:

```text
H1: Không biết cộng số tự nhiên
H2: Chưa hiểu tử số và mẫu số
H3: Chưa hiểu đơn vị phân số
H4: Áp dụng sai quy tắc cộng phân số cùng mẫu
H5: Sơ suất
```

Câu hỏi đối chứng:

1. `2 + 1 = ?`
2. Chọn hình biểu diễn `2/5`.
3. Hai phần năm cộng một phần năm bằng bao nhiêu phần năm?
4. `3/8 + 2/8 = ?`
5. `6/9 - 4/9 = ?`

Kết quả có thể là:

```text
Cộng số tự nhiên: đúng
Hiểu hình phân số: đúng
Cộng bằng hình: đúng
Cộng bằng ký hiệu: sai
Trừ bằng ký hiệu: sai
```

Kết luận:

```text
Root gap:
Quy tắc cộng/trừ phân số cùng mẫu

Misconception:
Cộng hoặc trừ cả tử số và mẫu số
```

## 5.3. Ví dụ đạo hàm

Câu gốc:

```text
y = (2x + 1)^3
```

Học sinh trả lời:

```text
y' = 3(2x + 1)^2
```

Giả thuyết:

```text
H1: Không biết quy tắc lũy thừa
H2: Không biết đạo hàm hàm bậc nhất
H3: Không nhận diện được hàm hợp
H4: Bỏ đạo hàm hàm bên trong
H5: Sơ suất
```

Câu hỏi đối chứng:

```text
(x^3)' = ?
(2x + 1)' = ?
[(x + 1)^3]' = ?
[(3x - 2)^2]' = ?
```

Nếu học sinh:

- làm đúng đạo hàm `x^3`;
- làm đúng đạo hàm `2x + 1`;
- làm đúng `(x + 1)^3`;
- tiếp tục bỏ hệ số trong `(3x - 2)^2`;

thì kết luận:

```text
Root gap:
Không nhân với đạo hàm hàm bên trong khi áp dụng quy tắc dây chuyền
```

---

# 6. Prerequisite Backtracking

Duyệt ngược không có nghĩa là cứ sai thì lùi xuống toàn bộ lớp dưới.

Thuật toán chỉ truy theo các nhánh liên quan trong Q-matrix.

Pseudo-code:

```python
def diagnose(skill, student_state):
    if mastery(skill) >= 0.75:
        return "mastered"

    if evidence_count(skill) < 2:
        return select_diagnostic_probe(skill)

    weak_parents = [
        parent
        for parent in prerequisites(skill)
        if mastery(parent) < 0.65
    ]

    if not weak_parents:
        return confirm_root_gap(skill)

    next_parent = select_parent_by_information_gain(weak_parents)
    return diagnose(next_parent, student_state)
```

Điều kiện dừng:

```text
Có ít nhất hai bằng chứng độc lập
Độ tin cậy vượt ngưỡng
Kỹ năng tiền đề ngay phía dưới đã vững
Không vượt quá số câu chẩn đoán tối đa
```

Gợi ý MVP:

```text
Tối đa 4–7 câu chẩn đoán trong một phiên
```

---

# 7. Bayesian Knowledge Tracing

BKT theo dõi xác suất học sinh đã biết một kỹ năng.

Các tham số chính:

```text
P(L0): xác suất đã biết ban đầu
P(T): xác suất học được sau một lần luyện
P(S): xác suất biết nhưng sơ suất
P(G): xác suất chưa biết nhưng đoán đúng
```

Ví dụ trạng thái:

```json
{
  "student_id": "STU_019",
  "skill_id": "CHAIN_RULE",
  "mastery_probability": 0.31,
  "confidence": 0.88,
  "evidence_count": 5,
  "trend": "stagnating"
}
```

Vai trò của BKT:

- Không phản ứng quá mức với một câu sai.
- Phân biệt sơ suất với lỗ hổng lặp lại.
- Theo dõi tiến bộ theo thời gian.
- Xác định khi nào học sinh đã sẵn sàng chuyển sang kỹ năng tiếp theo.

BKT không tự tìm được nguyên nhân gốc. Nó cần:

- Knowledge Graph.
- Q-matrix.
- Error Pattern.
- Diagnostic Probe.

---

# 8. Elo và độ khó câu hỏi

Elo được dùng để ước lượng:

- Năng lực học sinh.
- Độ khó câu hỏi.
- Xác suất học sinh làm đúng.

Elo phù hợp để chọn câu hỏi vừa sức.

Ví dụ:

```text
Student Elo: 1150
Item Elo: 1180
```

Câu hỏi có độ khó gần năng lực học sinh.

Nhưng Elo không trả lời được:

```text
Tại sao học sinh sai?
```

Hai học sinh cùng Elo có thể có lỗ hổng hoàn toàn khác nhau.

Do đó:

> Elo chỉ tạo adaptive difficulty, không tạo root-cause adaptation.

---

# 9. Zone of Proximal Development

ZPD là chính sách chọn hoạt động học phù hợp sau khi đã biết trạng thái kỹ năng.

Nguyên tắc:

- Không quá dễ.
- Không quá khó.
- Nằm ngay trên khả năng hiện tại.
- Có thể hoàn thành với một lượng hỗ trợ hợp lý.

Ví dụ với đạo hàm:

```text
Đã biết:
(x^3)' và (2x + 1)'

Đang học:
[(2x + 1)^3]'

Chưa nên đưa:
sin((x^2 + 1)^5)/(3x - 2)
```

Có thể đặt mục tiêu xác suất làm đúng khoảng:

```text
65%–85%
```

Elo hỗ trợ ước lượng độ khó, còn ZPD quyết định phạm vi phù hợp về mặt sư phạm.

---

# 10. Adaptive Diagnostic Probe Selection

Câu hỏi tiếp theo không được chọn ngẫu nhiên.

Có thể tính:

```text
NextItemScore =
InformationGain
+ SkillRelevance
+ ErrorDiscrimination
+ ZPDFit
- ReadingCost
- RepetitionPenalty
- TimeCost
```

Trong đó:

- `InformationGain`: câu hỏi giúp giảm bất định bao nhiêu.
- `SkillRelevance`: mức liên quan với giả thuyết đang kiểm tra.
- `ErrorDiscrimination`: phân biệt được các lỗi nào.
- `ZPDFit`: có vừa sức không.
- `ReadingCost`: tải đọc hiểu.
- `RepetitionPenalty`: tránh lặp câu tương tự.
- `TimeCost`: thời gian dự kiến.

---

# 11. Root-Gap Confirmation

Một lỗ hổng chỉ được xác nhận khi:

```text
Mastery thấp
+ Có đủ số bằng chứng
+ Error pattern lặp lại
+ Các kỹ năng tiền đề gần nhất đã được kiểm tra
+ Một giả thuyết vượt rõ các giả thuyết còn lại
```

Ví dụ đầu ra:

```json
{
  "student_id": "STU_019",
  "surface_error": "Sai đạo hàm hàm hợp",
  "root_gap": "CHAIN_RULE_INNER_DERIVATIVE",
  "misconception": "MISSING_INNER_DERIVATIVE",
  "mastery_probability": 0.29,
  "diagnosis_confidence": 0.89,
  "evidence": [
    "Đúng quy tắc lũy thừa",
    "Đúng đạo hàm hàm bậc nhất",
    "Đúng hàm hợp khi đạo hàm trong bằng 1",
    "Bỏ đạo hàm trong ở hai câu có hệ số khác 1"
  ]
}
```

Nếu chưa đủ dữ liệu:

```text
Chưa đủ bằng chứng để kết luận.
Cần thêm một câu chẩn đoán hoặc giáo viên quan sát.
```

---

# 12. Personalized Learning Path

Sau khi xác định root gap:

1. Trích xuất đồ thị con từ root gap đến kỹ năng mục tiêu.
2. Loại các node đã thành thạo.
3. Sắp xếp topo.
4. Gắn nội dung học cho từng node.
5. Chọn độ khó theo Elo và ZPD.
6. Thêm bài chuyển giao và ôn lặp lại.

Ví dụ:

```text
Đạo hàm hàm bậc nhất — đã vững
        ↓
Nhận diện hàm trong và hàm ngoài — củng cố
        ↓
Quy tắc dây chuyền — lỗ hổng chính
        ↓
Hàm hợp đa thức
        ↓
Bài chuyển giao
```

Cấu trúc mỗi node:

```text
Micro Lesson
→ Worked Example
→ Guided Practice
→ Independent Practice
→ Transfer Test
→ Spaced Review
```

Không công nhận thành thạo chỉ vì học sinh làm đúng lại câu vừa luyện.

Phải có câu chuyển giao:

```text
Khác số liệu
Khác biểu diễn
Khác ngữ cảnh
Nhưng dùng cùng kỹ năng
```

---

# 13. Teacher Intelligence Engine

## 13.1. Tự động nhóm học sinh

Không nhóm theo:

```text
Tổng điểm
Elo tổng
Cùng sai một câu
```

Nhóm theo intervention signature:

```json
{
  "root_gap": "CHAIN_RULE_INNER_DERIVATIVE",
  "misconception": "MISSING_INNER_DERIVATIVE",
  "severity": "FOUNDATION",
  "intervention_id": "CHAIN_RULE_VISUAL_10M"
}
```

Điều kiện nhóm:

```text
Cùng root gap
+ cùng misconception hoặc error family
+ mức hỗ trợ tương đương
+ có thể dùng cùng một hoạt động can thiệp
```

Ví dụ:

```text
Nhóm A — 7 học sinh
Lỗ hổng: Bỏ đạo hàm hàm bên trong
Đã biết: Đạo hàm lũy thừa, đạo hàm hàm bậc nhất
Can thiệp: Sơ đồ hàm ngoài → hàm trong → nhân hai đạo hàm
Thời gian: 10 phút
```

## 13.2. Xếp hạng học sinh cần giúp trước

```text
Priority =
Confidence ×
(
0.30 × Blocking
+ 0.25 × Severity
+ 0.20 × Persistence
+ 0.15 × Stagnation
+ 0.10 × Urgency
)
```

Trong đó:

- `Blocking`: lỗ hổng chặn bao nhiêu kiến thức tiếp theo.
- `Severity`: mức độ thiếu hụt.
- `Persistence`: lỗi có lặp lại không.
- `Stagnation`: đã luyện nhưng không tiến bộ.
- `Urgency`: có liên quan bài sắp học không.
- `Confidence`: độ tin cậy của chẩn đoán.

## 13.3. Phát hiện lỗ hổng toàn lớp

```text
ClassGap =
AffectedRate
× MeanSeverity
× MeanConfidence
× UpcomingRelevance
```

Quy tắc hành động:

```text
≥ 35% lớp và cùng misconception
→ Dạy lại cả lớp

10%–35%
→ Can thiệp nhóm nhỏ

< 10%
→ Hỗ trợ cá nhân

Confidence thấp
→ Thu thập thêm bằng chứng
```

Ví dụ:

```text
18/40 học sinh chưa phân biệt được tăng thêm và tăng gấp nhiều lần.
14 học sinh chọn cùng một kiểu đáp án sai.
Đề xuất ôn chung bằng bảng số lượng–giá tiền trước bài tiếp theo.
```

---

# 14. Vai trò của Chatbot

Chatbot là lớp giao tiếp, không phải Diagnostic Engine.

## Chatbot được phép

- Giải thích vì sao học sinh sai.
- Đưa gợi ý theo từng mức.
- Trình bày lại bằng ví dụ hoặc hình ảnh.
- Hỏi câu chẩn đoán do engine chọn.
- Tóm tắt trạng thái học tập.
- Giải thích cho giáo viên vì sao một nhóm được ưu tiên.
- Truy vấn dashboard qua tool.

## Chatbot không được

- Tự thay đổi mastery.
- Tự xác nhận root gap.
- Bịa bằng chứng.
- Tự nhóm học sinh.
- Tự đánh dấu đã thành thạo.
- Dùng từ tiêu cực như “mất gốc”, “kém”, “chậm”.
- Đưa ngay đáp án khi đang trong phiên chẩn đoán.

## Tool dành cho chatbot

```text
get_student_mastery(student_id)
get_current_diagnosis(student_id)
get_diagnosis_evidence(student_id)
get_next_diagnostic_question(student_id)
submit_student_response(student_id, item_id, response)
get_learning_path(student_id)
get_intervention_explanation(intervention_id)
get_class_gap_summary(class_id)
get_priority_students(class_id)
```

## Ví dụ chatbot học sinh

Học sinh hỏi:

```text
Vì sao em sai?
```

Chatbot gọi:

```text
get_current_diagnosis
get_diagnosis_evidence
```

Phản hồi:

```text
Em đã đạo hàm đúng phần lũy thừa bên ngoài.
Phần còn thiếu là đạo hàm của 2x + 1, bằng 2.
Vì vậy kết quả cần nhân thêm 2.
Bây giờ em thử một câu có hệ số khác để kiểm tra lại nhé.
```

## Ví dụ chatbot giáo viên

Giáo viên hỏi:

```text
Hôm nay tôi nên hỗ trợ nhóm nào trước?
```

Chatbot gọi:

```text
get_priority_students
get_class_gap_summary
```

Phản hồi:

```text
Nên ưu tiên nhóm 6 học sinh đang bỏ đạo hàm hàm bên trong.
Lỗi xuất hiện lặp lại ở ít nhất ba câu và chặn trực tiếp phần hàm hợp nâng cao.
Hoạt động đề xuất kéo dài khoảng 10 phút.
```

---

# 15. Offline-first Architecture

Phần bắt buộc chạy offline:

- Hiển thị câu hỏi.
- Chấm đáp án đóng.
- Kiểm tra biểu thức tương đương.
- Phát hiện error pattern đã định nghĩa.
- Cập nhật mastery cục bộ.
- Chọn câu hỏi tiếp theo.
- Truy ngược graph.
- Sinh lộ trình từ nội dung đóng gói.
- Lưu response event.
- Hiển thị chatbot theo template.

## Chatbot offline

Khi không có mạng:

```text
Em muốn:
[Giải thích vì sao sai]
[Xem ví dụ dễ hơn]
[Xem hình minh họa]
[Làm một câu tương tự]
[Xem lại quy tắc]
```

Phản hồi được lấy từ template và dữ liệu chẩn đoán.

## Chatbot online

Khi có mạng, LLM được dùng để:

- Giải thích linh hoạt.
- Đổi cách diễn đạt.
- Tương tác hội thoại.
- Tóm tắt lớp học.
- Sinh nháp câu hỏi để chuyên gia duyệt.

LLM không nằm trong vòng lặp quyết định bắt buộc.

## Đồng bộ

```text
Local event log
→ Queue
→ Sync khi có mạng
→ Conflict resolution
→ Teacher dashboard
```

Có thể hỗ trợ:

- Internet.
- Mạng LAN tại trường.
- Hotspot của giáo viên.
- Local server trên laptop hoặc thiết bị nhỏ.

---

# 16. Kiến trúc Web Application

## Frontend

```text
Next.js
TypeScript
PWA
IndexedDB
Tailwind CSS
MathJax hoặc KaTeX
```

## Backend

```text
FastAPI
Python
PostgreSQL
Redis tùy chọn
```

## Symbolic Math Engine

```text
SymPy
```

SymPy dùng để:

- Kiểm tra hai biểu thức có tương đương không.
- Phân tích từng bước.
- Nhận diện một số lỗi đại số.
- Sinh đáp án chuẩn.

SymPy không tự chẩn đoán lỗ hổng. Nó chỉ hỗ trợ Response Analyzer.

## Module đề xuất

```text
adaptive-tutor/
├── frontend/
│   ├── student-app/
│   ├── teacher-dashboard/
│   ├── chatbot-ui/
│   └── offline-store/
│
├── backend/
│   ├── api/
│   ├── auth/
│   ├── content/
│   ├── assessments/
│   ├── diagnostics/
│   │   ├── graph.py
│   │   ├── q_matrix.py
│   │   ├── response_analyzer.py
│   │   ├── error_rules.py
│   │   ├── hypothesis.py
│   │   ├── probe_selector.py
│   │   ├── bkt.py
│   │   └── diagnosis.py
│   ├── learning_paths/
│   │   ├── subgraph.py
│   │   ├── topological_sort.py
│   │   ├── elo.py
│   │   ├── zpd.py
│   │   └── scheduler.py
│   ├── teacher_analytics/
│   │   ├── grouping.py
│   │   ├── priority.py
│   │   └── class_gap.py
│   └── chatbot/
│       ├── orchestrator.py
│       ├── tools.py
│       ├── student_prompt.py
│       └── teacher_prompt.py
│
├── content/
│   ├── skills.json
│   ├── prerequisite_edges.json
│   ├── questions.json
│   ├── q_matrix.json
│   ├── misconceptions.json
│   └── interventions.json
│
└── tests/
    ├── diagnostic_cases/
    ├── error_rules/
    ├── grouping/
    └── learning_paths/
```

---

# 17. API đề xuất

## Bắt đầu phiên học

```http
POST /api/sessions
```

## Lấy câu tiếp theo

```http
GET /api/students/{student_id}/next-item
```

## Gửi câu trả lời

```http
POST /api/responses
```

## Xem chẩn đoán

```http
GET /api/students/{student_id}/diagnosis
```

## Xem bằng chứng

```http
GET /api/students/{student_id}/diagnosis/evidence
```

## Xem lộ trình

```http
GET /api/students/{student_id}/learning-path
```

## Xem nhóm can thiệp

```http
GET /api/classes/{class_id}/intervention-groups
```

## Xem học sinh ưu tiên

```http
GET /api/classes/{class_id}/priority-students
```

## Xem lỗ hổng toàn lớp

```http
GET /api/classes/{class_id}/class-gaps
```

## Chatbot

```http
POST /api/chat
```

---

# 18. Dữ liệu cần chuẩn bị

## 18.1. Curriculum Outcomes

```text
Yêu cầu cần đạt
Môn
Lớp
Mạch kiến thức
Phiên bản chương trình
Nguồn tham chiếu
```

## 18.2. Skills

```text
Skill ID
Tên kỹ năng
Lớp giới thiệu
Lớp cần thành thạo
Loại kỹ năng
Mastery threshold
Leverage score
```

## 18.3. Prerequisite Edges

```text
Source skill
Target skill
Edge type
Strength
Minimum mastery
Rationale
```

## 18.4. Questions

```text
Question ID
Prompt
Answer
Question type
Difficulty
Representation
Reading load
Expected time
Target skill
Required skills
Hints
Solution
```

## 18.5. Q-matrix

```text
Question ID
Skill ID
Role
Weight
Is required
```

## 18.6. Misconceptions

```text
Misconception ID
Description
Observable pattern
Related skills
Confirmation items
Intervention ID
Minimum evidence
```

## 18.7. Interventions

```text
Intervention ID
Target skill
Misconception
Duration
Group size
Teacher instruction
Student activity
Exit items
Transfer items
```

## 18.8. Student Response Events

```text
Student ID
Item ID
Response
Correct/Incorrect
Response time
Attempt number
Hint level
Intermediate steps
Detected error
Timestamp
Sync status
```

## 18.9. Mastery State

```text
Student ID
Skill ID
Mastery probability
Confidence
Evidence count
Trend
Root-gap status
Model version
```

---

# 19. Chứng minh hệ thống thực sự adaptive

Có thể đánh giá theo năm tầng.

## Tầng 1 — Adaptive Difficulty

```text
Câu hỏi tăng hoặc giảm độ khó theo Elo.
```

Đây mới là thích ứng mức cơ bản.

## Tầng 2 — Adaptive Content

```text
Học sinh khác nhau nhận câu hỏi ở kỹ năng khác nhau.
```

## Tầng 3 — Adaptive Diagnosis

```text
Học sinh sai cùng một câu nhưng nhận các câu đối chứng khác nhau.
```

## Tầng 4 — Adaptive Remediation

```text
Mỗi root gap tạo ra lộ trình và nội dung can thiệp khác nhau.
```

## Tầng 5 — Classroom Adaptation

```text
Hệ thống tự nhóm học sinh, đề xuất ưu tiên và phát hiện lỗ hổng toàn lớp.
```

Kết luận:

```text
Elo + tăng giảm độ khó
→ chỉ đạt tầng 1

Knowledge Graph + Backtracking
→ đạt một phần tầng 2 và 3

Knowledge Graph
+ Q-matrix
+ Error Pattern
+ Adaptive Probe
+ BKT
+ Learning Path
+ Teacher Dashboard
→ đạt đầy đủ hệ thống adaptive
```

---

# 20. Phạm vi MVP đề xuất

Không nên làm toàn bộ chương trình ngay từ đầu.

## Phương án MVP tốt nhất

Chọn một chuỗi kỹ năng có quan hệ tiên quyết rõ.

Ví dụ:

```text
Cộng/trừ số tự nhiên
→ Ý nghĩa phân số
→ Phân số cùng mẫu
→ Phân số tương đương
→ Quy đồng
→ Cộng/trừ phân số khác mẫu
```

Hoặc:

```text
Hàm số
→ Đạo hàm hàm cơ bản
→ Quy tắc tổng
→ Quy tắc tích
→ Nhận diện hàm hợp
→ Quy tắc dây chuyền
```

## Quy mô MVP

```text
15–20 skill node
20–30 prerequisite edge
10–15 misconception
80–120 câu hỏi
20–30 câu đối chứng
8–10 intervention
2–4 lớp pilot
```

## MVP phải phân biệt được ít nhất

Ví dụ với phân số:

```text
Không biết cộng/trừ cơ bản
Chưa hiểu tử số và mẫu số
Sai quy tắc cùng mẫu
Không hiểu phân số tương đương
Không biết quy đồng
Có khả năng sơ suất
```

Ví dụ với đạo hàm:

```text
Yếu đại số nền
Sai quy tắc lũy thừa
Sai quy tắc tích
Bỏ đạo hàm hàm trong
Không hiểu f'(a)
Sai bước rút gọn
```

---

# 21. Lộ trình triển khai

## Giai đoạn 1 — Content Model

- Chọn phạm vi môn và chủ đề.
- Xây skill graph.
- Xây Q-matrix.
- Xây error pattern.
- Xây câu hỏi đối chứng.
- Xây intervention.

## Giai đoạn 2 — Diagnostic Engine

- Response analyzer.
- Error rule engine.
- Hypothesis tracker.
- Backtracking.
- Probe selector.
- Mastery update.
- Root-gap confirmation.

## Giai đoạn 3 — Student Web App

- Làm bài từng bước.
- Nhập biểu thức.
- Gợi ý nhiều cấp.
- Lộ trình cá nhân.
- Offline cache.

## Giai đoạn 4 — Teacher Dashboard

- Skill heatmap.
- Intervention groups.
- Priority ranking.
- Class-wide gaps.
- Evidence view.
- Teacher override.

## Giai đoạn 5 — Chatbot

- Tool calling.
- Student tutor.
- Teacher assistant.
- Offline template mode.
- Online LLM mode.

## Giai đoạn 6 — Pilot và hiệu chỉnh

- Pre-test.
- Diagnosis.
- Intervention.
- Post-test.
- Transfer test.
- Teacher validation.
- Điều chỉnh graph, Q-matrix và threshold.

---

# 22. Tiêu chí thành công

## Chất lượng chẩn đoán

- Tỉ lệ giáo viên đồng ý với root gap.
- Tỉ lệ lỗ hổng được xác nhận bằng ít nhất hai bằng chứng.
- Tỉ lệ chẩn đoán “chưa đủ dữ liệu” hợp lý.

## Hiệu quả học tập

- Kết quả post-test.
- Kết quả transfer test.
- Khả năng duy trì sau ôn lặp lại.

## Giá trị cho giáo viên

- Giảm thời gian phân tích lớp.
- Nhóm đề xuất có thể dạy chung.
- Thứ tự ưu tiên phù hợp.
- Gợi ý can thiệp có thể sử dụng ngay.

## Khả năng vận hành

- Hoạt động khi mất mạng.
- Dữ liệu đồng bộ thành công.
- Gói nội dung nhẹ.
- Chatbot không bịa kết quả chẩn đoán.

---

# 23. Rủi ro và cách giảm thiểu

## Knowledge Graph sai

Giảm thiểu:

- Giáo viên và chuyên gia duyệt.
- Lưu confidence của edge.
- Cho phép teacher override.
- Cập nhật từ dữ liệu pilot.

## Q-matrix sai

Giảm thiểu:

- Mỗi câu được ít nhất hai người review.
- So sánh kết quả thực tế với dự kiến.
- Loại câu có khả năng đo nhiều kỹ năng không tách được.

## Chẩn đoán quá sớm

Giảm thiểu:

- Yêu cầu nhiều bằng chứng.
- Có confidence threshold.
- Có trạng thái “chưa đủ dữ liệu”.

## Chatbot bịa

Giảm thiểu:

- Tool calling.
- Structured output.
- Không cho chatbot tự cập nhật mastery.
- Chỉ cung cấp evidence đã có.

## Nội dung quá lớn

Giảm thiểu:

- Làm một lát cắt nhỏ.
- Tái sử dụng template câu hỏi.
- Ưu tiên skill có leverage cao.

---

# 24. Kết luận

Giải pháp tối ưu không phải là chỉ dùng một thuật toán.

Hệ thống cần kết hợp:

```text
Knowledge Graph
+ Q-matrix
+ Misconception Library
+ Root-Cause Backtracking
+ Adaptive Diagnostic Probes
+ BKT
+ Elo
+ ZPD
+ Subgraph Extraction
+ Topological Sort
+ Teacher Intelligence
+ Tool-based Chatbot
+ Offline-first Architecture
```

Vai trò của từng thành phần:

| Thành phần | Vai trò |
|---|---|
| Knowledge Graph | Mô tả quan hệ tiên quyết |
| Q-matrix | Xác định câu hỏi đo kỹ năng nào |
| Error Pattern | Sinh giả thuyết nguyên nhân |
| Diagnostic Probe | Phân biệt các giả thuyết |
| Backtracking | Truy ngược tới kiến thức nền |
| BKT | Theo dõi mastery theo thời gian |
| Elo | Chọn độ khó phù hợp |
| ZPD | Chọn hoạt động vừa sức |
| Topological Sort | Sắp xếp lộ trình |
| Teacher Dashboard | Nhóm, ưu tiên và phát hiện gap lớp |
| Chatbot | Giao tiếp và giải thích |
| Offline Engine | Bảo đảm hệ thống luôn hoạt động |

Giá trị khác biệt của sản phẩm:

> Cùng sai một câu, các học sinh có thể nhận chẩn đoán khác nhau, lộ trình khác nhau và được xếp vào nhóm can thiệp khác nhau dựa trên bằng chứng cụ thể.

Đó mới là một hệ thống adaptive tutoring thực sự.
