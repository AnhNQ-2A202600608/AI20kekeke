import re

text = """ETL (Extract, Transform, Load) và ELT (Extract, Load, Transform) là hai quy trình chính trong việc quản lý và xử lý dữ liệu, đặc biệt là trong các hệ thống kho dữ liệu (data warehousing).

1. **ETL (Extract, Transform, Load)**:
   - **Extract (Truy xuất)**: Dữ liệu được thu thập từ nhiều nguồn khác nhau như cơ sở dữ liệu, file, API, v.v.
   - **Transform (Chuyển đổi)**: Dữ liệu được xử lý và chuyển đổi thành định dạng phù hợp để phân tích. Giai đoạn này có thể bao gồm làm sạch dữ liệu, chuẩn hóa, và tổng hợp.
   - **Load (Tải lên)**: Dữ liệu đã được chuyển đổi sau đó được tải vào hệ thống kho dữ liệu để phục vụ cho các truy vấn và phân tích.

2. **ELT (Extract, Load, Transform)**:
   - **Extract (Truy xuất)**: Tương tự như ETL, dữ liệu được thu thập từ các nguồn khác nhau.
   - **Load (Tải lên)**: Dữ liệu được tải trực tiếp vào kho dữ liệu mà không cần chuyển đổi ngay lập tức.
   - **Transform (Chuyển đổi)**: Sau khi dữ liệu đã được tải lên, các phép biến đổi diễn ra trong kho dữ liệu, thường tận dụng khả năng xử lý mạnh mẽ của hệ thống dữ liệu để thực hiện các phép phân tích phức tạp.

Sự khác biệt chính giữa ETL và ELT nằm ở giai đoạn nào diễn ra việc chuyển đổi dữ liệu. ETL thực hiện chuyển đổi trước khi tải lên kho dữ liệu, trong khi ELT thực hiện chuyển đổi sau khi dữ liệu đã được tải lên.

Bạn có thể phân tích tình huống nào sẽ phù hợp hơn với ETL và tình huống nào sẽ phù hợp hơn với ELT không?"""

option_regex = re.compile(r'([A-E])[.)\:]\s*(.+)', re.IGNORECASE)
for idx, m in enumerate(option_regex.finditer(text)):
    print(f"Match {idx + 1}: Group 1: '{m.group(1)}', Group 2: '{m.group(2)}'")
