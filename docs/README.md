# Tài liệu Dự án (Project Documentation)

Tài liệu dự án được tổ chức theo mục đích sử dụng để các thành viên và AI Agent dễ dàng tra cứu nhanh chóng, tương tự như cấu trúc chuẩn của **C2 125**.

## Cấu trúc thư mục (Directory Structure)

```text
docs/
├── domain-knowledge/      # Tri thức nghiệp vụ, thuật toán thích ứng (Elo, Mastery) và tài liệu đề thi
├── engineering/           # Thiết kế hệ thống, luồng dữ liệu, quy chuẩn code, CI/CD và deployment
├── product/               # Định nghĩa tính năng sản phẩm, roadmap, thiết kế UI/UX và tài liệu demo
├── research/              # Nghiên cứu thuật toán giáo dục thích ứng (Contextual Bandit, BKT, IRT, DBR)
├── d-day/                 # Kịch bản vận hành và xử lý sự cố trong ngày thi
├── superpowers/           # Hướng dẫn sử dụng các tính năng đặc biệt (superpowers)
├── notion-address-registry.md # Danh sách ID trang/database của Notion
└── CHANGE_SUMMARY_VI.md   # Tóm tắt lịch sử thay đổi lớn
```

---

## 1. Tri thức Nghiệp vụ & Đề thi (Domain Knowledge)

- [Challenge Adaptation Guide](domain-knowledge/challenge-adaptation-guide.md): Hướng dẫn cấu hình và thích ứng với đề bài thi.
- [Evaluation Guide](domain-knowledge/evaluation-guide.md): Quy trình và tiêu chí đánh giá hiệu năng bài thi.
- [Adaptive Learning Mastery](domain-knowledge/adaptive-learning.md): Quy tắc tính Elo và mức độ thành thạo của học sinh.
- [Spaced Repetition](domain-knowledge/spaced-repetition.md): Thuật toán lặp lại ngắt quãng, chấm điểm AI.

---

## 2. Kỹ thuật & Kiến trúc (Engineering)

- [System Architecture](engineering/system-architecture.md): Tổng quan kiến trúc hệ thống, ranh giới dịch vụ và cơ sở dữ liệu.
- [Code Standards](engineering/code-standards.md): Quy chuẩn lập trình, kiểm thử và tích hợp AI/RAG.
- [Deployment Spec](engineering/deployment.md): Cấu hình môi trường triển khai Production và Staging.
- [Deployment Guide](engineering/deployment_guide.md): Hướng dẫn chi tiết các bước cấu hình Render & Vercel.
- [System Overview](engineering/system-overview.md): Tổng quan kiến trúc hệ thống fullstack.
- [Data Flow](engineering/data-flow.md): Luồng đi của dữ liệu giữa các thành phần.
- [Module System](engineering/module-system.md): Cơ chế quản lý, kích hoạt/vô hiệu hóa các capability.
- [Threat Model](engineering/threat-model.md): Mô hình phân tích các mối đe dọa bảo mật và giải pháp.
- [Module Development Guide](engineering/module-development-guide.md): Hướng dẫn viết thêm module capability mới.
- [Spec Kit Setup Guide](engineering/spec-kit-setup-vi.md): Hướng dẫn thiết lập và sử dụng Spec Kit với AI Agent.

---

## 3. Sản phẩm & Demo (Product)

- [Project Overview PDR](product/project-overview-pdr.md): Định nghĩa sản phẩm, tính năng MVP, phạm vi an toàn.
- [Project Roadmap](product/project-roadmap.md): Lộ trình phát triển sản phẩm.
- [Design Guidelines](product/design-guidelines.md): Phong cách thiết kế, UX và khả năng tiếp cận.
- [GTM & Monetization](product/gtm-monetization-one-pager.md): Kế hoạch kinh doanh và đưa sản phẩm ra thị trường.
- [Demo Readiness Checklist](product/demo-readiness.md): Danh sách các hạng mục cần chuẩn bị trước khi demo sản phẩm.

---

## 4. Nghiên cứu Thuật toán (Research)

- [Contextual Bandit](research/contextual-bandit.md): Nghiên cứu thuật toán khuyến nghị câu hỏi.
- [Bayesian Knowledge Tracing](research/bayesian-knowledge-tracing.md): Ước lượng xác suất thành thạo bằng HMM.
- [Mooclet Framework](research/mooclet-framework.md): Khung thực nghiệm mô đun hóa thích ứng.
- [Cold Start Problem](research/adaptive-learning-and-cold-start.md): Các chiến lược giải quyết vấn đề khởi đầu lạnh.
- [Item Response Theory](research/item-response-theory.md): Mô hình lý thuyết ứng đáp câu hỏi (IRT).
- [Design-Based Research](research/design-based-research.md): Phương pháp nghiên cứu thử nghiệm trên lớp học.

---

## 5. Tài liệu khác (Others)

- [Notion Address Registry](notion-address-registry.md): Danh sách ID trang/database kết nối với công cụ Notion.
- [Change Summary](CHANGE_SUMMARY_VI.md): Tổng hợp các thay đổi chính của dự án qua các phiên bản.
- [D-Day Scripts](d-day/): Kịch bản vận hành và xử lý sự cố trong ngày thi.
- [Superpowers Guide](superpowers/): Hướng dẫn kích hoạt các tính năng đặc biệt.
