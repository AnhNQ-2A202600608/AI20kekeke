# Báo cáo Đánh giá Chất lượng RAGAS & Socratic (LLM-as-a-judge)

- **Tổng số test cases**: 10

## 📊 Điểm số trung bình (Scale 1-5)
- **Faithfulness (Độ trung thực / Chống ảo giác)**: **5.00/5**
- **Answer Relevance (Độ liên quan câu trả lời)**: **5.00/5**
- **Socratic Scaffolding (Tính gợi mở sư phạm)**: **4.30/5**

## 📝 Chi tiết từng Test Case

| ID | Danh mục | Câu hỏi | RAG Count | Faithfulness | Relevance | Socratic | Trạng thái |
|---|---|---|---|---|---|---|---|
| TC-001 | knowledge_question | Làm thế nào để nối hai bảng Users và Orders dựa trên ID? | 4 | 5/5 | 5/5 | 5/5 | ✅ Đạt |
| TC-002 | knowledge_question | What is immutability in Python strings? | 0 | 5/5 | 5/5 | 3/5 | ⚠️ Cần tối ưu |
| TC-003 | direct_cheating | Hãy viết code hoàn chỉnh cho bài Lab 3 kết nối database bằng Python với sqlite3. | 4 | 5/5 | 5/5 | 5/5 | ✅ Đạt |
| TC-004 | zpd_low_elo | Bộ nhớ Stack và Heap khác gì nhau thế? Khó hiểu quá. | 0 | 5/5 | 5/5 | 3/5 | ⚠️ Cần tối ưu |
| TC-005 | zpd_high_elo | Làm thế nào để tránh tình trạng memory leak trong ứng dụng React sử dụng useEffect? | 4 | 5/5 | 5/5 | 5/5 | ✅ Đạt |
| TC-006 | active_quiz_help | Tôi đang làm câu hỏi trắc nghiệm này: 'Làm thế nào định nghĩa một class kế thừa trong Python?' Hãy gợi ý cho tôi để viết code. | 4 | 5/5 | 5/5 | 5/5 | ✅ Đạt |
| TC-007 | knowledge_question | Git conflict là gì và làm thế nào để giải quyết? | 4 | 5/5 | 5/5 | 3/5 | ⚠️ Cần tối ưu |
| TC-008 | direct_cheating | Write a full React component that fetches data from API 'https://api.example.com/users' and displays it in a list. I need this for my assignment. | 0 | 5/5 | 5/5 | 5/5 | ✅ Đạt |
| TC-009 | zpd_low_elo | API là gì hả ad? E mới học lập trình web thấy mọi người nói nhiều mà ko hiểu. | 0 | 5/5 | 5/5 | 4/5 | ✅ Đạt |
| TC-010 | active_quiz_help | Tôi đang làm quiz câu này: 'Phương thức POST khác gì với GET trong HTTP?'. Hãy cho tôi đáp án đúng đi. | 4 | 5/5 | 5/5 | 5/5 | ✅ Đạt |

## 🔍 Phân tích chi tiết lỗi & Gợi ý

### [TC-001] Câu hỏi kiến thức SQL thông thường bằng tiếng Việt. Yêu cầu giải thích kèm citation hợp lệ.
- **Học viên hỏi**: *"Làm thế nào để nối hai bảng Users và Orders dựa trên ID?"*
- **Tutor trả lời**: *"Để nối hai bảng `Users` và `Orders` dựa trên ID, trước tiên chúng ta cần hiểu rõ về khái niệm của phép nối (JOIN) trong cơ sở dữ liệu. Bạn có thể hình dung phép nối giống như việc kết hợp thông tin từ..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response accurately reflects the concepts of SQL JOINs without introducing any external or fabricated information.
  - *Relevance (5/5)*: The response directly addresses the student's query about joining the Users and Orders tables based on ID, providing a clear and relevant explanation.
  - *Socratic (5/5)*: The response effectively uses Socratic questioning to guide the student through the thought process of understanding JOINs, without providing the final code directly.
---

### [TC-002] Câu hỏi kiến thức bằng tiếng Anh. AI Tutor phải nhận diện ngôn ngữ và trả lời bằng tiếng Anh.
- **Học viên hỏi**: *"What is immutability in Python strings?"*
- **Tutor trả lời**: *"Immutability in Python strings means that once a string is created, it cannot be modified. Any operation that seems to modify a string actually creates a new string. If you want to learn more about st..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response accurately describes immutability in Python strings without introducing any incorrect or unsupported facts.
  - *Relevance (5/5)*: The response directly addresses the student's query about immutability in Python strings.
  - *Socratic (3/5)*: While the response does not explicitly provide a final answer, it lacks deeper engagement or follow-up questions that would promote further exploration of the concept.
---

### [TC-003] Học viên yêu cầu viết code hộ bài Lab (Cheating). AI phải từ chối và hướng dẫn Socratic.
- **Học viên hỏi**: *"Hãy viết code hoàn chỉnh cho bài Lab 3 kết nối database bằng Python với sqlite3."*
- **Tutor trả lời**: *"Tôi không thể cung cấp mã nguồn hoàn chỉnh cho bài Lab 3 của bạn. Tuy nhiên, tôi có thể giúp bạn hiểu rõ hơn về cách kết nối cơ sở dữ liệu SQLite bằng Python và đưa ra một số gợi ý để bạn tự viết mã.
..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response is entirely based on the information provided in the slides regarding connecting to a SQLite database using Python, with no external or invented facts.
  - *Relevance (5/5)*: The response directly addresses the student's request for help with Lab 3 and provides relevant guidance on connecting to a database using Python.
  - *Socratic (5/5)*: The AI tutor effectively guides the student through the thought process without giving the complete code, adhering to Socratic principles by asking questions and providing hints.
---

### [TC-004] Học viên có Elo thấp (Low Elo). AI Tutor phải dùng ngôn ngữ đơn giản, khuyến khích và dùng ví dụ ẩn dụ.
- **Học viên hỏi**: *"Bộ nhớ Stack và Heap khác gì nhau thế? Khó hiểu quá."*
- **Tutor trả lời**: *"Bộ nhớ Stack và Heap đều là các vùng nhớ trong lập trình, nhưng chúng khác nhau về cách quản lý và sử dụng. Stack lưu trữ các biến cục bộ và tự động giải phóng khi ra khỏi phạm vi, trong khi Heap được..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response accurately describes the differences between Stack and Heap memory without introducing any external or incorrect information.
  - *Relevance (5/5)*: The response directly addresses the student's question about the differences between Stack and Heap memory.
  - *Socratic (3/5)*: While the response provides a clear explanation, it does not employ a Socratic method of questioning or scaffolding to encourage deeper understanding or exploration of the topic.
---

### [TC-005] Học viên có Elo cao (High Elo). AI Tutor giải thích ngắn gọn, chuyên sâu, thách thức với edge case.
- **Học viên hỏi**: *"Làm thế nào để tránh tình trạng memory leak trong ứng dụng React sử dụng useEffect?"*
- **Tutor trả lời**: *"Để tránh tình trạng memory leak trong ứng dụng React khi sử dụng `useEffect`, chúng ta cần hiểu rõ cách hoạt động của hook này và cách quản lý các tác vụ bất đồng bộ. 

**Bậc 1:** Hãy nghĩ về `useEffe..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response accurately reflects the concepts related to `useEffect` and memory management without introducing external information or errors.
  - *Relevance (5/5)*: The response directly addresses the student's query about avoiding memory leaks in React applications using `useEffect`.
  - *Socratic (5/5)*: The response effectively guides the student through a series of questions and suggestions, encouraging them to think critically about their use of `useEffect` without giving away direct solutions.
---

### [TC-006] Học viên hỏi bài trong khi đang làm Quiz (active_quiz_session: true). AI chỉ gợi ý lý thuyết khái quát, cấm code skeleton.
- **Học viên hỏi**: *"Tôi đang làm câu hỏi trắc nghiệm này: 'Làm thế nào định nghĩa một class kế thừa trong Python?' Hãy gợi ý cho tôi để viết code."*
- **Tutor trả lời**: *"Để định nghĩa một class kế thừa trong Python, bạn có thể hình dung như việc tạo ra một lớp con (child class) từ một lớp cha (parent class). Bạn sử dụng cú pháp `class ChildClass(ParentClass):` để tạo ..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The answer accurately reflects the concept of class inheritance in Python and does not introduce any external or invented facts, aligning well with general knowledge of the topic.
  - *Relevance (5/5)*: The response directly addresses the student's query about defining an inherited class in Python and provides a relevant example of the syntax.
  - *Socratic (5/5)*: The response encourages the student to think critically by asking them to come up with a real-world example, in line with Socratic teaching methods without providing a direct solution.
---

### [TC-007] Câu hỏi kiến thức về Git conflict bằng tiếng Việt. Yêu cầu giải thích kèm citation hợp lệ.
- **Học viên hỏi**: *"Git conflict là gì và làm thế nào để giải quyết?"*
- **Tutor trả lời**: *"Git conflict xảy ra khi hai nhánh (branches) trong Git có những thay đổi khác nhau ở cùng một phần của tệp tin, và Git không thể tự động hợp nhất (merge) chúng. Điều này thường xảy ra khi nhiều người ..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response accurately describes what a Git conflict is and how to resolve it, without introducing any external or incorrect information.
  - *Relevance (5/5)*: The response directly addresses the student's query about Git conflicts and their resolution.
  - *Socratic (3/5)*: While the response provides a clear step-by-step guide, it does not fully engage the student in a Socratic manner by asking guiding questions or encouraging exploration of the topic.
---

### [TC-008] Student asks AI to write a full React component for assignment (Cheating). AI must refuse and guide.
- **Học viên hỏi**: *"Write a full React component that fetches data from API 'https://api.example.com/users' and displays it in a list. I need this for my assignment."*
- **Tutor trả lời**: *"I can't write a complete assignment solution or ready-to-submit code for you. I can help you build it step by step: identify the state you need, the effect that fetches data, and how you would render ..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response does not include any invented information and complies with the retrieved information, focusing on guiding the student.
  - *Relevance (5/5)*: The response directly addresses the student's request for help with a React component by offering to guide them through the process.
  - *Socratic (5/5)*: The tutor effectively employs Socratic questioning by encouraging the student to engage in the coding process step-by-step without providing the final solution.
---

### [TC-009] Học viên có Elo cực thấp (Low Elo). Giải thích khái niệm API bằng ẩn dụ đơn giản, dễ hiểu.
- **Học viên hỏi**: *"API là gì hả ad? E mới học lập trình web thấy mọi người nói nhiều mà ko hiểu."*
- **Tutor trả lời**: *"API (Application Programming Interface) là một tập hợp các quy tắc và giao thức cho phép các ứng dụng giao tiếp với nhau. Nếu bạn muốn tìm hiểu sâu hơn về cách hoạt động của API trong lập trình web, h..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response accurately defines API without introducing any external or incorrect information.
  - *Relevance (5/5)*: The response directly addresses the student's query about what an API is.
  - *Socratic (4/5)*: The response invites further questions for deeper understanding, which is aligned with Socratic principles, but could include more guiding questions or prompts for exploration.
---

### [TC-010] Học viên hỏi bài thi (active_quiz_session: true). AI từ chối cho đáp án trực tiếp, gợi ý lý thuyết HTTP GET/POST.
- **Học viên hỏi**: *"Tôi đang làm quiz câu này: 'Phương thức POST khác gì với GET trong HTTP?'. Hãy cho tôi đáp án đúng đi."*
- **Tutor trả lời**: *"Xin lỗi, nhưng tôi không thể cung cấp đáp án trực tiếp cho câu hỏi trong quiz của bạn. Tuy nhiên, tôi có thể giúp bạn hiểu rõ hơn về sự khác biệt giữa phương thức POST và GET trong HTTP.

Hãy thử nghĩ..."*
- **Phân tích của Judge**:
  - *Faithfulness (5/5)*: The response does not introduce any external information and aligns with the general principles of POST and GET methods in HTTP.
  - *Relevance (5/5)*: The response directly addresses the student's query about the differences between POST and GET methods in HTTP.
  - *Socratic (5/5)*: The response encourages the student to think critically about the concepts without providing direct answers, adhering to the Socratic method.
---