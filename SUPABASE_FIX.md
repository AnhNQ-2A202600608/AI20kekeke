# Hướng Dẫn Sửa Lỗi PGRST106 ("Invalid schema: app") trên Supabase

Lỗi `PGRST106` xảy ra do PostgREST API của Supabase chưa được cấu hình để cho phép truy cập (expose) vào các schema tùy biến là `app` và `audit`. Để khắc phục dứt điểm lỗi này và thông suốt mạch dữ liệu thật, vui lòng thực hiện các bước sau:

---

## Bước 1: Cấp quyền truy cập Schema trong SQL Editor
Mở **SQL Editor** trong Supabase Dashboard của bạn và chạy đoạn script SQL sau đây để cấp quyền sử dụng cho vai trò kết nối API (`authenticator`):

```sql
-- 1. Cấp quyền truy cập (USAGE) trên các schema cho các role API
GRANT USAGE ON SCHEMA app TO authenticator, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA audit TO authenticator, anon, authenticated, service_role;

-- 2. Cấp toàn bộ quyền trên bảng, function, sequence thuộc schema app
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO service_role, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA app TO service_role, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO service_role, authenticated;

-- 3. Cấp toàn bộ quyền trên bảng, function, sequence thuộc schema audit
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO service_role, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA audit TO service_role, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO service_role, authenticated;
```

---

## Bước 2: Expose Schema qua cài đặt API trên Dashboard
Sau khi chạy SQL, bạn cần cấu hình trên giao diện quản trị của Supabase để PostgREST nhận diện các schema mới:

1. Truy cập vào **Settings** (biểu tượng bánh răng ở góc dưới bên trái).
2. Chọn mục **API** ở thanh điều hướng phụ.
3. Cuộn xuống phần **Exposed schemas** (danh sách các schema được hiển thị).
4. Thêm `app` và `audit` vào danh sách (bên cạnh schema `public` mặc định).
5. Click **Save** để lưu cấu hình.

---

## Bước 3: Reload Schema Cache của PostgREST
Để các thay đổi có hiệu lực ngay lập tức mà không cần khởi động lại container, hãy chạy lệnh SQL này trong **SQL Editor**:

```sql
NOTIFY pgrst, 'reload schema';
```

Sau khi hoàn tất 3 bước trên, mạch gọi API thật từ Frontend/Backend đến Supabase thông qua schema `app` sẽ thông suốt hoàn toàn.
