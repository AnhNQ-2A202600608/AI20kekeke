# GTM và Monetization One-Pager

Last updated: 2026-07-06

## Scout Report

### Tài liệu đã đọc

- `docs/product/project-overview-pdr.md`: định nghĩa EduGap/Sapia là Adaptive-first AI Tutor cho đại học, với người dùng Student, Mentor, BTC/Admin.
- `docs/product/project-roadmap.md`: trạng thái sản phẩm đã có core app, auth, onboarding, adaptive engine, RAG chat; phần Mentor/BTC và production/evidence còn đang hoàn thiện.
- `docs/engineering/system-architecture.md`: kiến trúc Next.js, FastAPI, Supabase, pgvector, Redis, LangGraph, Braintrust; có RBAC, citation, guardrail, audit.
- `docs/guide/cost-management.md`: có hướng dẫn cost LLM cho development nhưng chưa phải mô hình pricing thương mại.
- `docs/research/adaptive-engine-evaluation-methodology.md`: có nền tảng evidence kỹ thuật cho Elo, BKT, LinUCB, ZPD, CI equivalence.
- `README.md`: có problem/solution, evidence mẫu, deliverables checklist; pitch deck và eval results vẫn chưa hoàn tất.

### Nhận định nhanh

Repo đã mạnh về kỹ thuật, kiến trúc, adaptive learning và evidence thuật toán. Điểm thiếu chính không nằm ở product spec, mà nằm ở tài liệu thương mại: ICP, GTM, pricing hypothesis, pilot measurement, procurement evidence, ROI và sales collateral.

## GTM Proposal

### Định vị

Không bán như "chatbot AI cho học sinh". Định vị nên là:

> Sapia/EduGap là hệ thống Learning Ops cho cohort AI/lập trình: chẩn đoán lỗ hổng khái niệm, luyện tập thích ứng theo ZPD, và giúp mentor biết chính xác ai đang kẹt ở đâu trước buổi học tiếp theo.

Lý do: repo đã có RAG chat, adaptive quiz, Elo/BKT, mentor dashboard, citation, guardrail. Nếu định vị như chatbot, sản phẩm bị so trực tiếp với ChatGPT/NotebookLM. Nếu định vị theo "cohort weak-concept intelligence + adaptive practice", lợi thế nằm ở dữ liệu lớp học, workflow mentor và nội dung khóa học riêng.

### ICP ban đầu

ICP tốt nhất trong 90 ngày đầu:

- Đơn vị đào tạo AI/lập trình theo cohort, có mentor hỗ trợ học viên ngoài giờ.
- Lớp đại học hoặc bootcamp có 50-300 học viên, nhiều nội dung PDF/slides/lab.
- Người mua hoặc người duyệt ngân sách là Program Director, Head of Learning, giảng viên phụ trách môn, hoặc BTC chương trình.
- Người dùng hằng ngày là student và mentor.

Không nên bắt đầu với thị trường học sinh phổ thông đại trà hoặc self-serve B2C, vì sản phẩm hiện phụ thuộc mạnh vào course material, RBAC, mentor workflow và evidence theo lớp.

### Pain Moment

Pain moment sắc nhất:

- Sau mỗi buổi học, mentor không biết concept nào đang làm cả lớp kẹt.
- Trước deadline lab/project, học viên hỏi lặp lại trong group chat nhưng mentor không có dashboard ưu tiên.
- Trước quiz/exam, bài luyện tập đại trà không khớp trình độ từng người.
- Khi dùng AI ngoài như ChatGPT, sinh viên dễ xin lời giải trực tiếp, làm yếu năng lực tự học.

Thông điệp bán hàng nên bám vào pain này:

> Biết lớp đang kẹt ở đâu trước khi mentor bước vào buổi tiếp theo.

### Kênh GTM 90 ngày

Chọn Sales-Led + Pilot-Led, không chọn PLG ở giai đoạn đầu.

Lý do:

- Sản phẩm cần dữ liệu khóa học, ingestion, mentor dashboard, RBAC và niềm tin về học thuật.
- Giá trị nằm ở lớp/cohort, không chỉ ở từng học viên tự đăng ký.
- Người mua cần evidence về learning outcome, mentor time saved, guardrail và data handling.

Kế hoạch 90 ngày:

| Giai đoạn | Mục tiêu | Output |
| --- | --- | --- |
| Ngày 1-30 | Chạy pilot với một cohort thật hoặc gần thật | Baseline, weekly weak-concept report, mentor feedback |
| Ngày 31-60 | Mở thêm 2 pilot với lớp AI/lập trình khác | Case study ngắn, before/after, cost/job thực tế |
| Ngày 61-90 | Chuyển pilot thành gói trả phí theo cohort | Paid LOI, pricing validated, evidence pack v1 |

### Wedge

Wedge sản phẩm nên là "Mentor Insight + Adaptive Practice", không phải full LMS.

Gói bán đầu tiên:

- Upload/tổ chức course materials.
- RAG chat có citation và guardrail học thuật.
- Adaptive quiz theo concept với Elo/BKT.
- Mentor dashboard: weak concepts, students needing support, low-confidence queries.
- Weekly cohort insight report.

Tạm hoãn:

- LMS integration sâu.
- Outcome-based pricing.
- Fully automated learning plan generator.
- B2C app store/self-serve acquisition.

## Monetization One-Pager

### Customer

Khách hàng trả tiền ban đầu là tổ chức vận hành cohort, không phải từng sinh viên lẻ:

- AI/lập trình bootcamp.
- Trung tâm đào tạo nội bộ doanh nghiệp.
- Khoa/môn học đại học có lớp đông và mentor/TA.
- Chương trình đào tạo ngắn hạn cần đo năng lực theo concept.

### Value Proposition

Sapia/EduGap giúp tổ chức đào tạo:

- Giảm tải câu hỏi lặp lại cho mentor.
- Phát hiện weak concepts theo lớp và theo học viên.
- Tăng chất lượng luyện tập nhờ câu hỏi đúng vùng ZPD.
- Giữ sinh viên trong workflow học thuật có citation và guardrail, thay vì để họ dùng AI ngoài để chép đáp án.
- Tạo evidence cho giảng viên/BTC: mastery, citation quality, low-confidence queries, adaptive decisions.

### Pricing Hypothesis

Pricing nên là hybrid theo cohort + active learner.

Đề xuất v1 để test:

| Gói | Giá giả định | Phù hợp |
| --- | --- | --- |
| Pilot 4 tuần | 500-1,000 USD / cohort | Chứng minh value, tối đa 100 active learners |
| Cohort Standard | 300-500 USD / cohort / tháng + 3-8 USD / active learner / tháng | Lớp 50-300 học viên |
| Institution | Custom, theo số cohort + SLA + data/security review | Trường/đơn vị đào tạo nhiều lớp |

Đây là giả thuyết, chưa phải bảng giá chính thức. Cần thay bằng số sau khi có cost/job thật, willingness-to-pay và ngân sách khách hàng.

### Value Metric

Value metric chính:

- Active learner per month.
- Cohort per month.

Metric phụ để giới hạn cost:

- Số RAG/chat sessions.
- Số quiz attempts.
- Số tài liệu/course sources.
- Số mentor/admin seats.

Không dùng outcome-based pricing ở v1 vì attribution học tập còn khó chứng minh. Outcome-based có thể thử sau khi có dữ liệu pilot đủ mạnh.

### Cost/Job Model

Định nghĩa job:

- Student learning session: một phiên chat hoặc luyện tập có RAG/quiz.
- Mentor insight job: một lượt tổng hợp weak concepts/class insight.

Công thức cần đo:

```text
Cost/Job = LLM tokens + embedding/retrieval + database/cache + observability + HITL review + retry/fallback + overhead
```

Ngưỡng thương mại:

- Gross margin mục tiêu: tối thiểu 60%.
- Giá/job nên lớn hơn hoặc bằng 3 lần cost/job cho giai đoạn đầu.
- Với cohort pricing, cần quy đổi usage thực tế về cost/cohort/tháng.

Hiện repo đã có nền tảng để đo LLM/cost/latency qua Braintrust và tài liệu cost-management, nhưng chưa có bảng cost/job thương mại.

### Evidence Pack Cần Bán Được

Một khách hàng giáo dục sẽ hỏi ba nhóm bằng chứng:

| Nhóm bằng chứng | Nội dung cần có | Trạng thái hiện tại |
| --- | --- | --- |
| Eval Results | RAG citation quality, guardrail pass rate, Elo/BKT/LinUCB quality, latency/cost | Có nền tảng kỹ thuật, cần gom thành report thương mại |
| Risk Checklist | Data privacy, no training on student data without consent, academic-integrity guardrails, RBAC, data retention | Có kiến trúc bảo mật, thiếu one-pager procurement |
| Pilot Report | WAU, quiz completion, weak concepts found, mentor time saved, learning gain/proxy, satisfaction | Chưa thấy tài liệu pilot report chuẩn |

### 90-Day Commercial KPI

- 3 pilot cohorts được onboard.
- 1 paid conversion hoặc paid LOI.
- 70% weekly active learner trong cohort pilot.
- Mentor dùng dashboard ít nhất 2 lần/tuần.
- 30% câu hỏi lặp lại được xử lý qua tutor/RAG thay vì mentor group chat.
- 1-2 case studies có số liệu: weak concepts surfaced, quiz attempts, citation quality, mentor time saved.

## Tài Liệu Còn Thiếu

### Thiếu quan trọng nhất

1. `docs/product/icp-and-buyer-personas.md`: ICP, buyer, champion, user, blocker, procurement owner.
2. `docs/product/pilot-plan-and-metrics.md`: kế hoạch pilot 4 tuần, baseline, weekly report, success criteria.
3. `docs/product/pricing-cost-model.md`: cost/job, gross margin, usage assumptions, packaging.
4. `docs/product/evidence-pack.md`: index cho eval results, risk checklist, pilot report, demo evidence.
5. `docs/product/procurement-security-one-pager.md`: dữ liệu nào lưu, dữ liệu nào không dùng train model, retention/export/delete, RBAC, secrets boundary.

### Thiếu để bán hàng mượt hơn

6. `docs/product/competitive-positioning.md`: so sánh với ChatGPT, NotebookLM, LMS quiz, Khanmigo/MagicSchool-style tutor theo trục course-grounded, adaptive mastery, mentor workflow.
7. `docs/product/sales-narrative.md`: one-liner, problem story, demo script, objection handling.
8. `docs/product/roi-calculator.md`: mentor hours saved, support tickets reduced, quiz personalization impact.
9. `docs/product/customer-onboarding-guide.md`: checklist ingest tài liệu, tạo course, mời student/mentor, chạy RAG test.
10. `docs/pitch-deck.pdf`: deck nộp chính thức đã được đóng gói; tiếp tục tinh chỉnh visual/story trong `presentation/` nếu cần.
11. `docs/evaluation.md`: evidence entry point đã trỏ về artifacts chi tiết trong `eval/results/`.

## Quyết Định Đề Xuất

Trong tuần tiếp theo, ưu tiên không phải thêm feature. Ưu tiên là biến evidence kỹ thuật thành evidence bán hàng:

1. Chốt ICP: cohort AI/lập trình có mentor.
2. Chạy hoặc mô phỏng một pilot report theo format thật.
3. Đo cost/job từ logs thực tế.
4. Tạo procurement/security one-pager.
5. Hoàn thiện pitch deck với GTM, pricing hypothesis và evidence pack.
