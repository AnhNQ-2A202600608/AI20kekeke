# BKT Parameter Management & Optimization System

Bản kế hoạch thiết kế và triển khai hệ thống lưu trữ, tích hợp dịch vụ và tối ưu hóa (re-fitting) các tham số Bayesian Knowledge Tracing (BKT) dựa trên dữ liệu làm bài thực tế của học sinh thay vì sử dụng các giá trị hardcode cố định.

## User Review Required

> [!NOTE]
> 1. Thiết kế này yêu cầu tạo thêm bảng mới `bkt_concept_parameters` trong schema `app` để lưu các tham số BKT theo từng concept.
> 2. Quy trình huấn luyện lại tham số (re-fitting) sẽ được thực hiện bất đồng bộ dưới dạng Cron Job hàng tuần để tránh ảnh hưởng đến hiệu năng thời gian thực của FastAPI.

## Proposed Phases

- **Phase 01: Database Schema & Backend Service Integration**: Khởi tạo bảng dữ liệu lưu trữ tham số BKT trong Supabase và cập nhật các lớp Service (`SupabaseAdaptiveDatabase`, `BKTParameters`) để truy xuất động từ DB.
  - Chi tiết tại: [phase-01-database-and-services.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260613-2150-bkt-parameter-optimization/phase-01-database-and-services.md)
- **Phase 02: Offline ML Fitting Pipeline**: Phát triển script ML định kỳ sử dụng `scipy.optimize` để khớp dữ liệu chuỗi lịch sử làm bài của học sinh và tính toán ra các tham số BKT tối ưu mới.
  - Chi tiết tại: [phase-02-offline-ml-fitting-pipeline.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260613-2150-bkt-parameter-optimization/phase-02-offline-ml-fitting-pipeline.md)

## Proposed Changes

### [Database & Services Component]

#### [NEW] [bkt_concept_parameters SQL Migration](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/supabase/migrations/20260613_create_bkt_params_table.sql)
Migration script để khởi tạo bảng dữ liệu lưu trữ tham số BKT cho concept.

#### [MODIFY] [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)
Bổ sung hàm truy vấn tham số BKT của từng Concept từ Supabase DB.

### [Machine Learning Pipeline Component]

#### [NEW] [bkt_parameter_fitter.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/pipeline/ml/bkt_parameter_fitter.py)
Script chạy offline thu thập tương tác lịch sử và thực hiện tối ưu hóa fit tham số BKT mới.

## Verification Plan

### Automated Tests
- Viết unit test trong `tests/services/test_bkt_db.py` kiểm tra xem khi query một concept chưa được cấu hình, service tự động trả về cấu hình mặc định (0.25, 0.1, 0.2, 0.1) mà không bị lỗi.
- Viết unit test cho hàm fit tối ưu hóa đảm bảo trả về các tham số nằm đúng biên ràng buộc sư phạm (ràng buộc Guess $\le 0.3$, Slip $\le 0.3$).
