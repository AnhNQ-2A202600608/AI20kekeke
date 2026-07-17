# Streamlit Dashboard for Adaptive Simulation

Bản kế hoạch xây dựng dashboard trực quan hóa quá trình mô phỏng học tập thích ứng (Adaptive Learning) sử dụng Streamlit để theo dõi sự biến động của Student Elo, Question Difficulty Elo, BKT Mastery Probability và LinUCB Arm Recommendation.

## User Review Required

> [!NOTE]
> 1. Dashboard này phục vụ mục đích kiểm thử, tối ưu hóa tham số (Hyperparameter tuning) và demo hoạt động của hệ thống gợi ý thích ứng.
> 2. Dashboard sẽ được đặt tại `src/dashboard/simulation_app.py` hoặc chạy độc lập dưới dạng một app Streamlit.

## Proposed Phases

- **Phase 01: Thiết lập Dashboard & Vẽ đồ thị tương tác**: Triển khai app Streamlit hiển thị các thông số mô phỏng, cho phép điều chỉnh qua Slider và biểu diễn kết quả bằng đồ thị trực quan (Plotly/Matplotlib).
  - Chi tiết tại: [phase-01-streamlit-dashboard.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260613-2127-streamlit-visualization-simulation/phase-01-streamlit-dashboard.md)
- **Phase 02: Giao diện Tương tác Người dùng (Interactive User Mode)**: Cho phép người dùng thật đóng vai trò học sinh để trả lời Đúng/Sai các câu hỏi thực tế và theo dõi các chỉ số thuật toán cập nhật lập tức trên UI.
  - Chi tiết tại: [phase-02-interactive-user-mode.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260613-2127-streamlit-visualization-simulation/phase-02-interactive-user-mode.md)


## Proposed Changes

### [Streamlit Dashboard Component]

#### [NEW] [simulation_app.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/dashboard/simulation_app.py)
Tạo file chính chứa code Streamlit UI, load logic giả lập thích ứng từ `eval/simulation_adaptive.py` (hoặc tái cấu trúc logic đó thành helper dùng chung).

## Verification Plan

### Manual Verification
- Chạy dashboard tại local: `uv run streamlit run src/dashboard/simulation_app.py`
- Thay đổi các tham số trên Sidebar (True Student Elo, BKT params, LinUCB $\alpha$) và kiểm tra xem đồ thị cập nhật chính xác và mượt mà.
- Kiểm thử các trường hợp cực đoan (ví dụ: học sinh siêu giỏi Elo = 2400 trả lời câu hỏi siêu dễ Elo = 800 và ngược lại).
