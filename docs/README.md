# Project Documentation

## Overview

Tài liệu dự án được tổ chức theo mục đích sử dụng để các thành viên và AI Agent dễ dàng tra cứu nhanh chóng, tương tự như cấu trúc chuẩn của **C2 125**.

## Cấu trúc thư mục

```text
docs/
├── domain-knowledge/      # Tri thức nghiệp vụ và thông tin cuộc thi/đề thi
├── engineering/           # Thiết kế hệ thống, luồng dữ liệu, quy chuẩn code và CI/CD
├── product/               # Định nghĩa tính năng sản phẩm và tài liệu chuẩn bị demo
├── d-day/                 # Kịch bản và tài liệu chuẩn bị cho ngày thi
├── superpowers/           # Hướng dẫn sử dụng các tính năng đặc biệt (superpowers)
└── CHANGE_SUMMARY_VI.md   # Tóm tắt lịch sử thay đổi lớn
```

---

## 1. Tri thức Nghiệp vụ & Đề thi (Domain Knowledge)

- [Challenge Adaptation Guide](domain-knowledge/challenge-adaptation-guide.md): Hướng dẫn cấu hình và thích ứng với đề bài thi.
- [Evaluation Guide](domain-knowledge/evaluation-guide.md): Quy trình và tiêu chí đánh giá hiệu năng bài thi.

---

## 2. Kỹ thuật & Kiến trúc (Engineering)

- [System Overview](engineering/system-overview.md): Tổng quan kiến trúc hệ thống fullstack.
- [Data Flow](engineering/data-flow.md): Luồng đi của dữ liệu giữa Frontend, Backend và các Module Capability.
- [Module System](engineering/module-system.md): Cơ chế quản lý, kích hoạt/vô hiệu hóa các module mở rộng.
- [Threat Model](engineering/threat-model.md): Mô hình phân tích các mối đe dọa bảo mật và giải pháp phòng chống.
- [Deployment Spec](engineering/deployment.md): Cấu hình môi trường triển khai Production và Staging.
- [Deployment Guide](engineering/deployment_guide.md): Hướng dẫn chi tiết các bước cấu hình Render & Vercel.
- [Module Development Guide](engineering/module-development-guide.md): Hướng dẫn viết thêm module capability mới cho Backend.
- [Spec Kit Setup Guide](engineering/spec-kit-setup-vi.md): Hướng dẫn thiết lập và sử dụng Spec Kit với AI Agent.

---

## 3. Sản phẩm & Demo (Product)

- [Demo Readiness Checklist](product/demo-readiness.md): Danh sách các hạng mục cần chuẩn bị trước khi demo sản phẩm.

---

## 4. Tài liệu khác (Others)

- [Change Summary](CHANGE_SUMMARY_VI.md): Tổng hợp các thay đổi chính của dự án qua các phiên bản.
- [D-Day Scripts](d-day/): Kịch bản vận hành và xử lý sự cố trong ngày thi.
- [Superpowers Guide](superpowers/): Hướng dẫn kích hoạt các siêu năng lực (tính năng nâng cao) của hệ thống.
