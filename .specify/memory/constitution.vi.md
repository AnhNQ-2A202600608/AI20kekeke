# Hiến Pháp Dự Án VAIC Universal Starter

> Bản tiếng Việt này là bản diễn giải cho team. File canonical để Spec Kit đọc vẫn là
> `.specify/memory/constitution.md`.

## Nguyên Tắc Cốt Lõi

### I. Ưu Tiên MVP Có Thể Demo

Mọi tính năng PHẢI được lập kế hoạch như một lát cắt dọc có thể demo trước khi được xem
là hoàn thành. Đặc tả PHẢI ưu tiên user story theo giá trị demo, kế hoạch PHẢI chỉ ra
mốc MVP, và danh sách task PHẢI giữ ít nhất một story có thể kiểm thử độc lập và trình
diễn được trong khung thời gian hackathon 24-48 giờ. Những việc chỉ làm đẹp hoặc tối ưu
nhưng làm chậm demo đầu tiên PHẢI được hoãn lại, trừ khi chúng gỡ một blocker nghiêm trọng.

### II. Quy Trình Chạy Lại Được Trên Nhiều Nền Tảng

Việc phát triển, kiểm thử, đóng gói và chuẩn bị demo PHẢI đi qua các entrypoint đã được
commit và có tài liệu rõ ràng. Với repo này, `python scripts/project_tasks.py <command>`
là bề mặt thao tác mặc định; `Makefile` chỉ là lớp tiện ích tùy chọn. Bất kỳ bước thủ công
phụ thuộc hệ điều hành, công cụ local, hoặc Docker-only path nào cũng PHẢI được ghi trong
tài liệu trước khi team dựa vào nó.

### III. An Toàn Mặc Định Khi Bàn Giao

Tính năng mới PHẢI giữ các mặc định an toàn của starter: secret không được vào version
control hoặc archive nộp bài, dữ liệu runtime sinh ra phải có thể xóa được, và workspace
challenge phải được tách khỏi framework dùng chung. Những capability mới đụng tới upload,
archive, log hoặc dịch vụ bên ngoài PHẢI mô tả hành vi lỗi, ranh giới dữ liệu, và đường
tắt hoặc fallback trước khi được coi là sẵn sàng.

### IV. Thay Đổi Phải Có Bằng Chứng Kiểm Chứng

Mọi thay đổi không tầm thường PHẢI có bằng chứng kiểm chứng tương xứng với mức rủi ro.
Tối thiểu, contributor PHẢI chạy lint, type check, test, build, hoặc kịch bản manual
validation liên quan tới phần đã sửa. Không được coi một việc là "xong", "đã fix", hoặc
"sẵn sàng demo" nếu chưa ghi lại lệnh kiểm tra đã chạy, hoặc lý do vì sao chưa thể chạy.

### V. Độ Phức Tạp Là Tùy Chọn, Không Phải Mặc Định

Module nặng, provider bên ngoài, runtime chuyên biệt và hạ tầng nâng cao PHẢI giữ ở trạng
thái tùy chọn cho tới khi active feature spec chứng minh là cần thiết. Đường chạy mặc định
sau khi clone repo PHẢI tiếp tục hoạt động với baseline stack. Capability tùy chọn PHẢI
nêu rõ dependency, biến môi trường và bước kích hoạt. Nếu cách đơn giản hơn đáp ứng được
acceptance criteria, cách đó PHẢI được ưu tiên.

## Ràng Buộc Vận Hành

Repo này tồn tại để tăng tốc triển khai hackathon, không phải để tối đa hóa abstraction.
Tài liệu cho team, artifact lập kế hoạch và handoff note NÊN viết bằng tiếng Việt, trừ khi
bài nộp bên ngoài yêu cầu ngôn ngữ khác. Stack hiện tại gồm Next.js frontend, FastAPI
backend, local challenge workspace và các lifecycle command qua script là mô hình vận hành
mặc định. Mọi hướng đi lệch khỏi mô hình này PHẢI được giải thích trong implementation plan.

`challenges/` là work product được bảo vệ và KHÔNG ĐƯỢC xem như cache có thể xóa tùy tiện.
Gói nộp bài PHẢI bao gồm source của active challenge, đồng thời loại bỏ secret, dependency,
cache và dữ liệu runtime sinh ra.

## Quy Trình Bàn Giao

Với mọi feature quan trọng, team PHẢI dùng chuỗi Spec Kit:
`constitution -> specify -> plan -> tasks -> implement`.

Các bước `clarify`, `checklist`, `analyze` và `converge` được dùng khi còn mơ hồ, thiếu
coverage hoặc còn khoảng cách giữa tài liệu và code. Mỗi thư mục feature sinh ra trong
`specs/` PHẢI tương ứng với một mục tiêu feature duy nhất và giữ đường MVP rõ ràng.

Plan PHẢI ghi rõ đường validation, command entrypoint, công tắc bật/tắt dependency tùy chọn
và tác động an toàn nếu có. Tasks PHẢI được nhóm sao cho teammate có thể chia việc với ít
đụng file nhất, đồng thời vẫn kiểm thử từng story độc lập.

## Quản Trị

Hiến pháp này có quyền ưu tiên hơn các thói quen ad hoc nếu có xung đột. Khi sửa hiến pháp,
người sửa PHẢI:

1. giải thích lý do amendment,
2. cập nhật các Spec Kit template hoặc runtime guidance bị ảnh hưởng trong cùng thay đổi,
3. cập nhật Sync Impact Report ở đầu file canonical `.specify/memory/constitution.md`.

Quy tắc version là bắt buộc:

- MAJOR: khi xóa hoặc định nghĩa lại một nguyên tắc theo cách không tương thích ngược.
- MINOR: khi thêm nguyên tắc mới hoặc mở rộng đáng kể phạm vi enforcement.
- PATCH: khi chỉ làm rõ câu chữ mà không đổi nghĩa vụ của team.

Mỗi thay đổi đáng kể PHẢI được review theo các điểm sau:

- công việc vẫn giữ được đường MVP có thể demo,
- command flow được tài liệu hóa và chạy lại được,
- hành vi an toàn mặc định vẫn còn nguyên,
- bằng chứng kiểm chứng có mặt hoặc được defer với lý do rõ ràng.

**Phiên bản**: 1.0.0 | **Phê chuẩn**: 2026-07-16 | **Sửa đổi gần nhất**: 2026-07-16
