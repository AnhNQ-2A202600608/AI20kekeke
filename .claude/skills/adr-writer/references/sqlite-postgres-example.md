# ADR-002: Chọn SQLite cho Development, PostgreSQL cho Production

**Ngày:** 2024-11-15
**Trạng thái:** Accepted

## Bối cảnh

Agent cần lưu lịch sử hội thoại để hỗ trợ multi-turn conversation.
Cần chọn database phù hợp cho cả development và production.

## Các lựa chọn

1. SQLite cho cả dev và prod — Đơn giản nhưng không scale.
2. PostgreSQL cho cả dev và prod — Mạnh nhưng setup phức tạp cho dev.
3. SQLite cho dev, PostgreSQL cho prod — Linh hoạt, best of both worlds.

## Quyết định

Lựa chọn 3: SQLite cho development, PostgreSQL cho production.

## Lý do

- Developer không cần cài PostgreSQL local, tiết kiệm thời gian setup.
- SQLAlchemy ORM abstract database差异, code gần như giống nhau.
- Chỉ cần thay đổi DATABASE_URL khi deploy.
- SQLite đủ cho 1-2 developers, PostgreSQL cần khi có real users.

## Hệ quả

- Cần test trên cả SQLite và PostgreSQL để đảm bảo compatibility.
- Migration scripts phải compatible với cả hai.
