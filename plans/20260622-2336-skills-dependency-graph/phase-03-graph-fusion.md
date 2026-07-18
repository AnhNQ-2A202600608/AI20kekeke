# Phase 3: Dung hợp Đồ thị và Giải quyết Xung đột (Graph Fusion & Conflict Resolution)

## Context Links
- **Paper guidance on Knowledge Graph Fusion**: [graphusion_paper.md#L150-L184](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/literature/graphusion_paper.md#L150-L184)
- **Candidate Triplets Output**: `outputs/candidate_triplets.json` (Đầu ra từ Phase 2)

## Overview
- **Priority**: High
- **Current Status**: Todo
- Pha này triển khai trái tim của thuật toán Graphusion: **Step 3: Knowledge Graph Fusion**. Chúng ta sẽ giải quyết ba bài toán chính:
  1. **Entity Merging**: Hợp nhất các concept bị trùng lặp hoặc viết khác nhau nhưng cùng một nghĩa (ví dụ: `neural-machine-translation` và `nmt`).
  2. **Conflict Resolution**: Giải quyết các xung đột quan hệ (ví dụ: một cặp concept có nhiều quan hệ mâu thuẫn hoặc tạo thành chu trình vô hạn).
  3. **Novel Triplet Inference**: Suy luận các mối quan hệ mới dựa trên tài liệu bài học làm nền tảng ngữ cảnh.
  4. **Enforcing DAG (Directed Acyclic Graph)**: Đảm bảo đồ thị phụ thuộc (`Prerequisite_of`) không có chu trình (cycle-free), một yêu cầu bắt buộc để chạy thuật toán học tập thích ứng.

## Key Insights từ Paper & Codebase
- **Hợp nhất thực thể**: Khi gộp các thực thể đồng nghĩa, LLM cần giữ lại tên cụ thể và có ý nghĩa rõ ràng nhất làm tên chính thức, các tên khác sẽ được mapping về tên chính thức này.
- **Giải quyết xung đột cạnh**: Chỉ cho phép tối đa **1 quan hệ** duy nhất giữa 2 concept. Nếu có nhiều hơn, LLM phải dựa vào Background Text (nội dung slide gốc) để giữ lại quan hệ đúng nhất.
- **DAG Enforcement (Cấm chu trình)**: Quan hệ tiên quyết (`Prerequisite_of`) bắt buộc phải là một Đồ thị hướng không chu trình (DAG). Nếu A là tiên quyết của B, và B là tiên quyết của C, thì C không thể là tiên quyết của A. Chúng ta cần triển khai thuật toán phát hiện chu trình (Cycle Detection bằng DFS hoặc Topological Sort) trong script để tự động phát hiện và loại bỏ các cạnh gây ra chu trình.

## Requirements
- Viết script Python chạy quy trình fusion đồ thị.
- Thiết kế Fusion Prompt của Graphusion tích hợp Background Text từ slides.
- Viết hàm kiểm tra và phá vỡ chu trình (Cycle Breaker) cho quan hệ `Prerequisite_of`.
- Đầu ra của pha này: `outputs/fused_graph.json` chứa danh sách concept sạch và quan hệ sạch.

## Related Code Files
- [NEW] `src/pipeline/graphusion/fuse_graphs.py` (Script dung hợp đồ thị & kiểm tra chu trình)

## Implementation Steps
1. Khởi tạo cấu trúc file script tại `src/pipeline/graphusion/fuse_graphs.py`.
2. Đọc file `outputs/candidate_triplets.json` và `outputs/seed_concepts.json`.
3. Nhóm các quan hệ theo cặp thực thể (hoặc theo nhóm concept liên quan) để chuẩn bị dung hợp.
4. Với mỗi nhóm, gửi lên LLM cùng với Background context trích xuất từ tài liệu markdown để:
   - Hợp nhất các concept tương tự (tạo mapping dict từ concept cũ sang concept mới hợp nhất).
   - Chọn quan hệ duy nhất và chính xác nhất cho mỗi cặp concept.
   - Thêm các quan hệ suy luận mới nếu cần.
5. Sau khi nhận được đồ thị dung hợp thô từ LLM, thực hiện chạy thuật toán kiểm tra chu trình:
   - Xây dựng danh sách kề (adjacency list) của các quan hệ `Prerequisite_of`.
   - Chạy DFS phát hiện chu trình. Nếu phát hiện chu trình (ví dụ: $A \rightarrow B \rightarrow C \rightarrow A$), log cảnh báo và tự động loại bỏ cạnh có trọng số/độ tin cậy thấp nhất (hoặc do LLM quyết định loại bỏ).
6. Lưu đồ thị sạch cuối cùng vào `outputs/fused_graph.json`.

## Todo List
- [ ] Thiết kế logic hợp nhất concept và chuẩn hóa mã code.
- [ ] Thiết kế Fusion Prompt của Graphusion kèm Background context.
- [ ] Viết thuật toán phát hiện chu trình (DFS Cycle Detection) để đảm bảo tính DAG cho quan hệ Prerequisite.
- [ ] Chạy script fusion và lưu kết quả cuối cùng vào `outputs/fused_graph.json`.

## Success Criteria
- Đồ thị đầu ra không còn các concept trùng lặp (ví dụ: chỉ còn `nmt` làm khóa chính, `neural-machine-translation` được map về `nmt`).
- Đồ thị con của quan hệ `Prerequisite_of` là một DAG hoàn chỉnh, không chứa bất kỳ chu trình nào.
- File `outputs/fused_graph.json` được tạo thành công với cấu trúc sạch.

## Risk Assessment
- **LLM làm mất thông tin quan trọng**: Cần cấu hình temperature thấp (0.1 - 0.2) cho bước fusion để LLM hành xử ổn định và chính xác, tránh tự ý bịa thêm thông tin không có trong tài liệu gốc.
