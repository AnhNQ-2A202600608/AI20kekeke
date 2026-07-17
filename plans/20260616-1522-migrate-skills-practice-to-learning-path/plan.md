# Kế hoạch tích hợp Luyện kỹ năng thích ứng vào Lộ trình học tập (Serpentine Path) - Cập nhật Sơ đồ Kỹ năng

## Tổng quan & Bối cảnh

Theo phản hồi từ người dùng:
1. **Không hiển thị Step-by-step tuyến tính các bài học:** Thay vì mỗi concept/set là một hình tròn độc lập trên bản đồ Serpentine Path, mỗi ngày/tuần sẽ hiển thị **1 node hình tròn đại diện cho 1 kỹ năng chính** (ví dụ: *Transformer & LLM Foundations* cho Ngày 1).
2. **Mở rộng các kỹ năng con:** Khi click vào node kỹ năng chính này, Tooltip sẽ mở ra hiển thị danh sách các **Concepts con** cấu thành (ví dụ: *Khái niệm cơ bản*, *Tokenization*, *Kiến trúc LLM*...) kèm nút **Luyện riêng** cho từng concept.
3. **Tiến độ vòng tròn (Circular Progress Ring):** Vòng tròn bao quanh node kỹ năng chính sẽ được fill màu theo tỷ lệ độ thành thạo (`skill.masteryScore` từ 0% đến 100%) của kỹ năng đó, thay vì trạng thái ACTIVE/COMPLETE tĩnh.
4. **Bổ sung các kỹ năng còn thiếu:** Cấu trúc thêm các kỹ năng cho Ngày 6 (Hackathon), Ngày 9 (Multi-Agent), Ngày 10 (Data Pipeline) vào `skills-manifest.json` để đồng bộ toàn bộ chương trình học 12 ngày.

---

## Các thay đổi đề xuất

### 1. Cập nhật dữ liệu Kỹ năng (`skills-manifest.json`)
- **File:** [skills-manifest.json](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/public/skills-manifest.json)
- **Thay đổi:** Bổ sung các kỹ năng còn thiếu cho Ngày 6, Ngày 9, Ngày 10 để bản đồ Serpentine có thể render đầy đủ lộ trình:
  - `hackathon-prototyping` (Ngày 6)
  - `multi-agent-systems` (Ngày 9)
  - `data-pipeline-observability` (Ngày 10)

### 2. Sửa đổi Serpentine Path để render theo Kỹ năng
- **File:** [LearningPath.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx)
- **Thay đổi:**
  - Nhận `skills` và `onStartPractice` làm props mới.
  - Thay vì map theo `topicSets` (các bài học đơn lẻ), map theo `topicSkills = skills.filter(s => s.dayId === topic.id)`.
  - Định nghĩa trạng thái mở khóa của kỹ năng dựa trên độ thành thạo của kỹ năng trước đó (`prevSkill.masteryScore >= 75`) hoặc tất cả bài học trước đã hoàn thành.
  - Vẽ vòng tròn tiến độ xung quanh node dựa trên `skill.masteryScore` bằng một SVG Progress Ring động sử dụng `strokeDasharray="289"` và `strokeDashoffset` tính toán theo tỷ lệ %.

### 3. Cập nhật Tooltip để hiển thị danh sách kỹ năng con
- **File:** [TileTooltip.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/TileTooltip.tsx)
- **Thay đổi:**
  - Nhận `skill`, `sets` và `completedSets` làm props mới.
  - Chiều rộng tooltip mở rộng lên `w-[320px]` để hiển thị chi tiết.
  - Nếu kỹ năng không bị khóa, hiển thị danh sách các concepts con tương ứng (`skill.associatedSets`).
  - Mỗi dòng concept con gồm: Tên concept, Icon trạng thái (hoàn thành hay chưa) và nút **Luyện riêng** (Targeted Practice).
  - Ở dưới cùng là nút lớn **Luyện Thích Ứng (All) +15 XP** để trộn toàn bộ câu hỏi và bắt đầu phiên học thích ứng LinUCB.

### 4. Logic khởi tạo và định tuyến tại page.tsx
- **File:** [page.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/page.tsx)
- **Thay đổi:**
  - Định nghĩa hàm `handleStartPractice(skill, targetSetId)` để tải câu hỏi và kích hoạt `PracticeWorkspace` với `targetSetId` tùy chọn.
  - Truyền `skills`, `data.sets`, và `handleStartPractice` vào `<LearningPath>`.

---

## Kế hoạch kiểm thử & Xác thực

### Kiểm thử thủ công
1. **Kiểm tra Giao diện Serpentine Map:**
   - Ngày 1 chỉ còn đúng 1 node đại diện duy nhất (LLM Foundations) thay vì 5 node như trước.
   - Vòng tròn bao quanh node hiển thị tỷ lệ fill màu tương ứng với chỉ số Mastery Score (0% lúc đầu).
2. **Kiểm tra Tooltip Chi tiết:**
   - Click vào node Ngày 1, Tooltip hiển thị đầy đủ 5 concepts con kèm nút **Luyện riêng**.
   - Bấm **Luyện riêng** ở concept *Tokenization*, verify chỉ tải câu hỏi của set đó.
   - Bấm **Luyện thích ứng (All)**, verify tải toàn bộ câu hỏi của kỹ năng.
