# Phase 2: Trích xuất Cạnh Quan hệ Ứng viên (Candidate Triplet Extraction)

## Context Links
- **Paper guidance on Candidate Triplet Extraction**: [graphusion_paper.md#L123-L127](file:///d:/CODE/AITHUCCHIEN\PROJECT\C2-App-125\docs\research\literature\graphusion_paper.md#L123-L127)
- **Extracted concepts manifest**: `outputs/seed_concepts.json` (Đầu ra từ Phase 1)
- **Database schema of relation types**: [20260618_concept_relations.sql#L13-L22](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260618_concept_relations.sql#L13-L22)

## Overview
- **Priority**: High
- **Current Status**: Todo
- Pha này thực hiện **Step 2: Candidate Triplet Extraction** của Graphusion. Sử dụng danh sách các Seed Concept $Q$ thu được từ Phase 1 làm anchor. Với mỗi concept $q \in Q$, script sẽ tìm kiếm các đoạn văn bản/slide có chứa concept này trong các file markdown để làm ngữ cảnh nền (context), sau đó gọi LLM với prompt Chain-of-Thought (CoT) để trích xuất các mối quan hệ (triplets) định dạng `(head_concept, relation, tail_concept)`.

## Key Insights từ Paper & Codebase
- **Định hướng Quan hệ (Directional Constraints)**: Một số quan hệ có tính hướng rất nghiêm ngặt, đặc biệt là `Prerequisite_of` (A là tiền đề của B) và `Part_of` (A là một phần của B). Trong EduGap, nếu A là tiền đề của B, thì:
  - `source_concept_id` = Concept A (Node cha/tiên quyết)
  - `target_concept_id` = Concept B (Node con)
- Lan truyền đồ thị (`graph_propagation.py`) phụ thuộc vào việc cấu hình đúng chiều của quan hệ `Prerequisite_of` để thực hiện lan truyền xuôi/ngược (BETA/GAMMA).
- Các quan hệ được hỗ trợ trong DB gồm: `Prerequisite_of`, `Used_for`, `Compare`, `Conjunction`, `Hyponym_of`, `Evaluate_for`, `Part_of`.

## Requirements
- Viết script Python quét qua danh sách seed concepts.
- Xây dựng công cụ search đơn giản (Keyword search hoặc Vector search) để thu thập các slide liên quan đến concept đó từ file markdown gốc làm ngữ cảnh.
- Thiết kế CoT Prompt yêu cầu LLM xác định quan hệ giữa concept đang xét và các concept khác trong hệ thống.
- Đầu ra của pha này: `outputs/candidate_triplets.json`.

## Related Code Files
- [NEW] `src/pipeline/graphusion/extract_candidate_triplets.py` (Script trích xuất quan hệ ứng viên)

## Implementation Steps
1. Khởi tạo cấu trúc file script tại `src/pipeline/graphusion/extract_candidate_triplets.py`.
2. Đọc file `outputs/seed_concepts.json` và tải danh sách code của các concept.
3. Với mỗi concept, thực hiện tìm kiếm (string match hoặc fuzzy match) trong 24 ngày học để lấy ra các đoạn text/slide chứa từ khóa đó (ngữ cảnh $C$).
4. Gọi LLM API với prompt chuyên biệt:
   - Cho trước ngữ cảnh $C$ và concept truy vấn $q$.
   - Tìm tất cả các mối quan hệ giữa $q$ và các concept khác cũng xuất hiện trong ngữ cảnh $C$.
   - Chỉ được sử dụng 7 loại quan hệ đã định nghĩa trong DB enum.
   - Định nghĩa rõ ràng ý nghĩa của từng quan hệ trong prompt để LLM phân biệt (ví dụ: `Used_for` vs `Prerequisite_of`).
   - Yêu cầu xuất định dạng JSON: `[{"source": "concept_a", "relation": "Prerequisite_of", "target": "concept_b", "evidence": "đoạn text trích dẫn làm bằng chứng"}]`.
5. Tổng hợp tất cả các triplets ứng viên thu được và lưu vào `outputs/candidate_triplets.json`.

## Todo List
- [ ] Xây dựng bộ lọc/truy xuất ngữ cảnh từ các file markdown cho mỗi concept.
- [ ] Thiết kế CoT prompt trích xuất triplet kèm định nghĩa quan hệ.
- [ ] Chạy script gọi LLM song song hoặc tuần tự để tạo ra danh sách triplet.
- [ ] Lưu kết quả vào `outputs/candidate_triplets.json`.

## Success Criteria
- Trích xuất được các mối quan hệ thô có đầy đủ bằng chứng (evidence) và phân loại quan hệ đúng theo 7 loại enum trong DB.
- File `outputs/candidate_triplets.json` chứa các bản ghi đúng schema mong muốn.

## Risk Assessment
- **Lỗi đảo ngược chiều quan hệ**: LLM đôi khi bị nhầm lẫn giữa "A cần biết trước B" và "B cần biết trước A". Do đó, trong prompt cần đưa ra ví dụ cụ thể (ví dụ: `Python Programming` -> Prerequisite_of -> `Web Development with Django`).
