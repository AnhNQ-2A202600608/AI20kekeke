# Plan: Document System Algorithms, LaTeX Rendering, and Default Light Mode

Tài liệu hóa chi tiết toàn bộ thuật toán trong hệ thống học tập thích ứng (Elo, BKT, Bandit, Graph Propagation, Memory Decay/Spaced Repetition, Question Generation) trên trang Docs, tích hợp khả năng hiển thị các công thức toán học LaTeX (KaTeX) qua MDX compiler, và cấu hình giao diện Docs mặc định ở chế độ sáng (Light Mode).

## User Review Required

> [!IMPORTANT]
> - Chúng ta sẽ cài đặt thêm 3 package npm mới trong thư mục `frontend`: `remark-math`, `rehype-katex`, và `katex` để biên dịch các công thức toán học dạng LaTeX.
> - Cấu hình `defaultTheme: 'light'` riêng cho `RootProvider` của `/docs` để trang tài liệu luôn khởi động với giao diện Sáng (Light Mode), không ảnh hưởng đến giao diện chính của Dashboard.
> - Cấu trúc thư mục tài liệu sẽ được tổ chức chuyên nghiệp dưới dạng một thư mục con `content/docs/algorithms/` với trang tổng quan `index.mdx` và 6 trang chi tiết tương ứng với các nhóm thuật toán cốt lõi.

## Proposed Changes

---

### Component: LaTeX & UI Theme Configuration

#### [MODIFY] [package.json](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/package.json)
- Thêm `remark-math`, `rehype-katex`, và `katex` vào danh sách `dependencies`.

#### [MODIFY] [source.config.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/source.config.ts)
- Import `remarkMath` từ `remark-math`.
- Import `rehypeKatex` từ `rehype-katex`.
- Đăng ký `remarkMath` vào `remarkPlugins` và `rehypeKatex` vào `rehypePlugins` trong `defineConfig`.

#### [MODIFY] [layout.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/docs/layout.tsx)
- Import stylesheet của KaTeX (`import 'katex/dist/katex.css'`).
- Cấu hình prop `theme={{ defaultTheme: 'light' }}` cho `<RootProvider>` để bắt buộc dùng giao diện sáng cho `/docs`.

---

### Component: Algorithms Documentation Content (MDX)

Tổ chức cấu trúc trang `/docs/algorithms` thành một chuyên mục (section) lớn với các trang thành phần:

#### [NEW] [index.mdx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/content/docs/algorithms/index.mdx)
- Giới thiệu tổng quan về lõi thích ứng (Adaptive Learning Core).
- Sơ đồ tương tác (Mermaid DAG) giữa các module thuật toán trong hệ thống.
- Bảng tóm tắt chức năng và vai trò của từng thuật toán trong quy trình học tập.

#### [NEW] [elo.mdx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/content/docs/algorithms/elo.mdx)
- Lý thuyết Educational Elo Rating System.
- Công thức xác suất kỳ vọng làm đúng: $P(\text{correct}) = \frac{1}{1 + 10^{(E_Q - E_S)/400}}$.
- Logic cập nhật song song (Dual Elo Update) cho học sinh và câu hỏi.
- Cơ chế Hint Discounting: giảm thưởng/phạt dựa trên `hint_count`: $\text{discount} = \max(0.1, 1.0 - 0.3 \cdot H)$.
- Cơ chế đóng băng điểm năng lực học sinh khi dùng AI trợ giúp (`used_ai_help = true`) nhưng vẫn hiệu chuẩn câu hỏi.

#### [NEW] [bkt.mdx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/content/docs/algorithms/bkt.mdx)
- Giới thiệu mô hình Bayesian Knowledge Tracing (BKT) dạng Hidden Markov Model.
- 4 tham số xác suất: $P(L_0)$ (Prior), $P(T)$ (Transition), $P(G)$ (Guess), $P(S)$ (Slip).
- Công thức cập nhật xác suất hậu nghiệm Bayesian khi làm Đúng/Sai.
- Logic nội suy tuyến tính (Linear Interpolation) để hỗ trợ điểm số một phần (Partial Credit).
- Cơ chế bảo vệ khỏi "Mastery Trap" (capping xác suất tại $[0.0001, 0.9999]$).
- Ánh xạ xác suất nắm vững kiến thức thành các trạng thái: Weak ($P(L) < 0.30$), Learning ($0.30 \le P(L) < 0.85$), Mastered ($P(L) \ge 0.85$).

#### [NEW] [bandit.mdx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/content/docs/algorithms/bandit.mdx)
- Lý thuyết Contextual Bandit trong gợi ý bài tập cá nhân hóa vùng phát triển gần nhất (ZPD).
- Vector ngữ cảnh 3 chiều ($x = [1.0, P(L), \sigma(E_S)]^T$).
- Thuật toán LinUCB với điểm kỳ vọng và cận trên sai số.
- Công thức Sherman-Morrison cập nhật ma trận hiệp biến nghịch đảo $A_{\text{inv}}$ thời gian thực không cần phép nghịch đảo ma trận $O(d^3)$.
- Cơ chế bảo vệ Numerical Stability: Enforce đối xứng ma trận $A_{\text{inv}}$.
- Hàm phần thưởng ZPD (Reward Y) định hướng tới $75\%$ tỷ lệ làm đúng.

#### [NEW] [graph.mdx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/content/docs/algorithms/graph.mdx)
- Quy trình định vị lỗi sai khi câu hỏi kiểm tra nhiều kỹ năng (Credit & Blame Assignment / DINA Model).
- Thuật toán phạt trách nhiệm Heuristic (Heuristic Blame Assignment) tỷ lệ nghịch với độ thông thạo hiện tại của từng kỹ năng.
- Thuật toán lan truyền đồ thị 1-bước (Local 1-Step Propagation): lan truyền ngược (Backward Propagation) khi giảm điểm và lan truyền xuôi (Forward Propagation) khi tăng điểm.
- Cơ chế chống lặp đệ quy vô hạn trong đồ thị có chu kỳ (Cycle Protection).

#### [NEW] [mem-recall.mdx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/content/docs/algorithms/mem-recall.mdx)
- Mô hình đường cong quên lãng (Memory Decay Curve) và thuật toán lặp quãng SM-2.
- Các thuộc tính SM-2: `repetitions`, `interval`, `easeFactor`, `dueDate`, `lastScore`.
- Quy trình ôn tập thẻ ghi nhớ (Flashcard Review Flow) dựa trên Active Recall (gõ câu trả lời tự luận).
- Tích hợp AI Bounded Grading chấm điểm tự luận ngắn quy đổi về thang điểm $0-5$.
- Các giải pháp kiểm soát độ trễ và chi phí gọi LLM.

#### [NEW] [question-gen.mdx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/content/docs/algorithms/question-gen.mdx)
- Tiêu chí sinh câu hỏi tự động (Question Generation Criteria) từ tài liệu slide/PDF.
- Thang gợi ý Socratic 4 bậc (Hint Ladder Level 1 to 4) hỗ trợ tư duy tự giải bài.
- Quy trình kiểm duyệt có con người tham gia (Human-in-the-loop - HITL Gate) của giáo viên trước khi phát hành đề.
- Giải pháp lưu trữ hint tĩnh ngoại tuyến để tối ưu chi phí token LLM.

---

## Verification Plan

### Automated Tests
- Chạy `pnpm build` tại thư mục `frontend` để kiểm tra lỗi cú pháp biên dịch MDX và các plugin LaTeX, cũng như đảm bảo toàn bộ project Next.js compile thành công.

### Manual Verification
- Chạy server phát triển `pnpm dev`.
- Mở trình duyệt truy cập vào các đường dẫn:
  - `/docs/algorithms`
  - `/docs/algorithms/elo`
  - `/docs/algorithms/bkt`
  - `/docs/algorithms/bandit`
  - `/docs/algorithms/graph`
  - `/docs/algorithms/mem-recall`
  - `/docs/algorithms/question-gen`
- Xác nhận:
  1. Giao diện trang Docs hiển thị với theme Sáng (Light Mode) theo cấu hình mặc định.
  2. Các công thức toán học toán học viết bằng ký tự LaTeX (như $P(L_t)$, matrix, phân số) được render sắc nét qua KaTeX.
  3. Sơ đồ Mermaid được hiển thị chính xác.
