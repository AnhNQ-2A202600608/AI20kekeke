# Feature Specification: EduGap Primary Multi-Subject Tutor

**Feature Branch**: `001-adaptive-gap-tutoring`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "Revise EduGap for the VAIC 2026 AI-native 48-hour hackathon: design an adaptive tutoring system for primary education across subjects, diagnose root-cause learning gaps, generate personalized remediation paths, give teachers automatic groups and intervention priorities, work offline or on low bandwidth, and align with the 2018 General Education Program."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chẩn đoán khoảng hổng kiến thức gốc (Priority: P1)

Là một học sinh tiểu học, em thực hiện một bài chẩn đoán ngắn theo môn và năng lực hiện tại. Khi gặp khó ở Toán, Tiếng Việt, Khoa học hoặc một môn khác, hệ thống kiểm tra có chọn lọc các năng lực nền tảng liên quan từ lớp trước để tìm nguyên nhân có khả năng nhất, thay vì chỉ báo đúng hoặc sai.

**Why this priority**: Chẩn đoán nguyên nhân là nền tảng cho mọi quyết định cá nhân hóa tiếp theo và là điểm khác biệt cốt lõi so với lộ trình bài học cố định.

**Independent Test**: Dùng ba hồ sơ học sinh giả lập: một em lớp 5 gặp khó với số thập phân do chưa vững giá trị hàng, một em lớp 4 đọc hiểu kém do thiếu vốn từ theo ngữ cảnh, và một em lớp 5 chưa hiểu chuỗi thức ăn do hổng quan hệ sinh vật–môi trường; xác nhận mỗi kết quả dùng đúng loại bằng chứng của môn, nêu khoảng hổng gốc, mức tin cậy và mục tiêu hiện tại bị ảnh hưởng.

**Acceptance Scenarios**:

1. **Given** học sinh lớp 5 đang làm sai nhiều câu về số thập phân, **When** các câu kiểm tra nền tảng cho thấy em chưa hiểu chắc giá trị hàng ở lớp trước, **Then** hệ thống xác định giá trị hàng là khoảng hổng gốc có khả năng cao và giải thích mối liên hệ với mục tiêu lớp 5.
2. **Given** học sinh trả lời sai nhưng bằng chứng chưa đủ để phân biệt giữa hai kiến thức tiên quyết, **When** hệ thống kết thúc lượt chẩn đoán, **Then** kết quả ghi rõ mức tin cậy thấp và đề xuất kiểm tra bổ sung thay vì khẳng định một nguyên nhân duy nhất.
3. **Given** học sinh thể hiện đã làm chủ một kiến thức tiên quyết, **When** hệ thống chọn câu tiếp theo, **Then** hệ thống không tiếp tục hỏi dàn trải về kiến thức đó và chuyển sang nhánh tiên quyết còn nghi vấn.
4. **Given** học sinh làm một nhiệm vụ Tiếng Việt hoặc Khoa học, **When** hệ thống đánh giá bằng chứng, **Then** hệ thống dùng tiêu chí phù hợp với môn đó và không áp cùng một cách chấm của câu hỏi Toán cho mọi môn.

---

### User Story 2 - Luyện tập đúng khoảng hổng và quay lại bài học hiện tại (Priority: P1)

Là một học sinh, em nhận một lộ trình luyện tập ngắn, vừa sức và có giải thích, bắt đầu từ khoảng hổng gốc đã chẩn đoán. Sau khi chứng minh đã nắm kiến thức nền, em được nối lại với mục tiêu của lớp hiện tại thay vì bị giữ trong một chuỗi bài cố định.

**Why this priority**: Chẩn đoán chỉ tạo giá trị khi dẫn đến một lộ trình khắc phục cụ thể, ngắn nhất có thể và phản ứng với tiến bộ thực tế của học sinh.

**Independent Test**: Bắt đầu từ một hồ sơ lớp 5 có khoảng hổng giá trị hàng, hoàn tất các hoạt động khắc phục và bài kiểm tra lại; xác nhận lộ trình thay đổi theo kết quả và kết thúc bằng một hoạt động nối lại mục tiêu số thập phân lớp 5.

**Acceptance Scenarios**:

1. **Given** hệ thống đã xác định một khoảng hổng gốc có độ tin cậy đủ cao, **When** học sinh bắt đầu luyện tập, **Then** các hoạt động đầu tiên tập trung vào đúng khoảng hổng và các bước tiên quyết trực tiếp của nó.
2. **Given** học sinh trả lời đúng liên tiếp mà không cần trợ giúp, **When** mức làm chủ đạt ngưỡng kiểm tra lại, **Then** hệ thống rút ngắn phần luyện tập lặp lại và đưa ra hoạt động kết nối với bài học hiện tại.
3. **Given** học sinh tiếp tục gặp khó khăn, **When** hệ thống quan sát lỗi lặp lại, **Then** lộ trình chuyển sang bước nhỏ hơn hoặc một cách biểu diễn khác và cung cấp gợi ý theo tầng, không đưa ngay lời giải hoàn chỉnh.
4. **Given** học sinh đã hoàn thành lộ trình khắc phục, **When** làm bài kiểm tra chuyển tiếp, **Then** hệ thống ghi nhận liệu khoảng hổng đã được lấp và liệu em đã sẵn sàng quay lại mục tiêu lớp hiện tại.

---

### User Story 3 - Giáo viên biết cần giúp ai và dạy lại điều gì (Priority: P1)

Là giáo viên phụ trách một lớp đông, tôi xem một bảng tổng hợp có thể hành động ngay: học sinh được nhóm theo nhu cầu chung, những em cần hỗ trợ trước được xếp ưu tiên kèm lý do, và các khoảng hổng phổ biến toàn lớp được nêu để tôi quyết định dạy lại.

**Why this priority**: Vai trò giáo viên là bắt buộc; cá nhân hóa chỉ có ý nghĩa trong lớp học thực tế khi giúp giáo viên phân bổ thời gian can thiệp hữu hạn.

**Independent Test**: Nạp dữ liệu chẩn đoán của một lớp 40 học sinh với ba mẫu khoảng hổng; xác nhận giáo viên có thể thấy nhóm nhu cầu, danh sách ưu tiên, bằng chứng, cảnh báo khoảng hổng toàn lớp và có thể điều chỉnh đề xuất.

**Acceptance Scenarios**:

1. **Given** nhiều học sinh có cùng khoảng hổng tiên quyết, **When** giáo viên mở tổng quan lớp, **Then** hệ thống tạo nhóm theo nhu cầu, hiển thị quy mô nhóm và gợi ý một hoạt động can thiệp phù hợp.
2. **Given** một số học sinh có nguy cơ bị bỏ lại cao hơn, **When** giáo viên xem danh sách ưu tiên, **Then** mỗi thứ hạng có lý do dễ hiểu dựa trên mức độ khoảng hổng, độ tin cậy, tiến độ gần đây và thời gian chờ hỗ trợ.
3. **Given** một khoảng hổng xuất hiện ở tỷ lệ đáng kể trong lớp, **When** ngưỡng cảnh báo được đạt, **Then** hệ thống đánh dấu đây là khoảng hổng toàn lớp và đề xuất nội dung cần dạy lại.
4. **Given** giáo viên biết thêm bối cảnh mà hệ thống không quan sát được, **When** giáo viên thay đổi nhóm, mức ưu tiên hoặc lộ trình đề xuất, **Then** quyết định của giáo viên được tôn trọng và được ghi lại cùng lý do tùy chọn.
5. **Given** dữ liệu của một học sinh chưa đủ hoặc đã cũ, **When** giáo viên xem bảng tổng hợp, **Then** hệ thống phân biệt rõ “chưa đủ bằng chứng” với “đang yếu” và không xếp hạng chắc chắn sai lệch.
6. **Given** lớp đang học nhiều môn, **When** giáo viên đổi bộ lọc từ Toán sang Tiếng Việt hoặc Khoa học, **Then** nhóm nhu cầu, thứ tự ưu tiên và khoảng hổng toàn lớp cập nhật theo môn mà không làm mất tổng quan liên môn của từng học sinh.

---

### User Story 4 - Tiếp tục học khi mất mạng hoặc băng thông thấp (Priority: P2)

Là học sinh ở khu vực kết nối không ổn định, em có thể tải trước gói học tập nhỏ, làm chẩn đoán và luyện tập khi không có mạng, rồi đồng bộ tiến độ khi kết nối trở lại mà không mất bài làm.

**Why this priority**: Khả năng dùng trong điều kiện hạ tầng yếu là ràng buộc tiếp cận cốt lõi của nhóm trường mục tiêu, không phải tiện ích bổ sung.

**Independent Test**: Tải một gói học tập, ngắt hoàn toàn kết nối, hoàn thành một lộ trình, khởi động lại thiết bị và kết nối lại; xác nhận mọi câu trả lời được giữ lại, đồng bộ một lần và bảng giáo viên phản ánh trạng thái mới.

**Acceptance Scenarios**:

1. **Given** thiết bị đã có gói học tập phù hợp, **When** mất kết nối, **Then** học sinh vẫn có thể tiếp tục các hoạt động chẩn đoán, luyện tập, gợi ý và kiểm tra lại đã được chuẩn bị.
2. **Given** học sinh đã hoàn thành hoạt động ngoại tuyến, **When** kết nối trở lại, **Then** hệ thống đồng bộ toàn bộ bài làm mà không tạo bản ghi trùng hoặc mất thứ tự học tập.
3. **Given** cùng một hồ sơ có thay đổi ở nhiều nơi trước khi đồng bộ, **When** phát hiện xung đột, **Then** hệ thống bảo toàn lịch sử bài làm, đánh dấu trạng thái cần đối chiếu và không âm thầm ghi đè dữ liệu.
4. **Given** giáo viên đang dùng kết nối yếu, **When** mở bảng tổng hợp lớp, **Then** thông tin ưu tiên tải trước, dữ liệu chi tiết tải theo yêu cầu và thời điểm cập nhật gần nhất luôn hiển thị rõ.

---

### User Story 5 - Bảo đảm học liệu bám Chương trình GDPT 2018 (Priority: P3)

Là giáo viên hoặc người phụ trách học liệu, tôi có thể kiểm tra mỗi mục tiêu, câu hỏi, rubric quan sát và hoạt động đang phục vụ yêu cầu cần đạt nào của Chương trình GDPT 2018, thuộc môn và lớp nào, và dựa trên quan hệ nền tảng nào trước khi nội dung được dùng cho học sinh.

**Why this priority**: Chẩn đoán xuyên lớp chỉ đáng tin khi bản đồ kiến thức và nội dung đều có nguồn, phiên bản và sự phê duyệt chuyên môn.

**Independent Test**: Duyệt ba gói minh chứng VAIC cho Toán lớp 3–5, Tiếng Việt lớp 2–4 và Tự nhiên & Xã hội/Khoa học lớp 2–5; xác nhận mọi nội dung được xuất bản đều có ánh xạ yêu cầu cần đạt, môn, lớp, chủ đề, nguồn, quan hệ nền tảng và trạng thái phê duyệt.

**Acceptance Scenarios**:

1. **Given** một hoạt động chưa có ánh xạ đầy đủ tới Chương trình GDPT 2018, **When** người phụ trách cố gắng xuất bản, **Then** hệ thống chặn việc đưa hoạt động đó vào lộ trình chính thức và nêu trường thông tin còn thiếu.
2. **Given** một quan hệ tiên quyết được đề xuất hoặc thay đổi, **When** người phụ trách duyệt nội dung, **Then** họ có thể xem nguồn, lý do và phạm vi ảnh hưởng trước khi chấp thuận hoặc từ chối.
3. **Given** chương trình hoặc học liệu được cập nhật, **When** phiên bản mới được duyệt, **Then** các lộ trình mới dùng phiên bản hiện hành trong khi lịch sử học tập cũ vẫn truy nguyên được phiên bản đã sử dụng.

### Edge Cases

- Học sinh đoán đúng nhiều câu nhưng thời gian phản hồi, chuỗi lỗi và nhu cầu gợi ý cho thấy chưa làm chủ chắc chắn.
- Một câu sai có thể do đọc hiểu, nhập nhầm, thiếu kiến thức tiên quyết hoặc chưa hiểu kiến thức hiện tại; hệ thống không được mặc định mọi lỗi đều là khoảng hổng kiến thức.
- Bản đồ tiên quyết có vòng lặp, quan hệ mâu thuẫn hoặc thiếu mắt xích giữa hai lớp.
- Không có đủ câu hỏi đã duyệt cho một nhánh chẩn đoán hoặc một lộ trình ngoại tuyến.
- Học sinh đã làm chủ kiến thức nền nhưng vẫn sai mục tiêu hiện tại; lộ trình phải tập trung vào mục tiêu hiện tại thay vì ép quay lại lớp dưới.
- Học sinh tiến bộ nhanh hơn hoặc chậm hơn dự kiến, bỏ dở nhiều ngày, hoặc dùng nhiều gợi ý.
- Nhiều học sinh dùng chung thiết bị; bài làm và tiến độ của từng em phải được tách biệt rõ.
- Thiết bị hết dung lượng, mất nguồn hoặc đóng ứng dụng giữa lúc lưu bài.
- Kết nối chập chờn làm một lượt đồng bộ bị gửi lại nhiều lần.
- Giáo viên có lớp mới chưa đủ dữ liệu, học sinh chuyển lớp, hoặc danh sách lớp thay đổi giữa kỳ.
- Một nhóm có quá ít học sinh hoặc một học sinh phù hợp với nhiều nhóm nhu cầu.
- Khoảng hổng toàn lớp bắt nguồn từ câu hỏi lỗi hoặc nội dung dạy chưa được bao phủ, không phải do học sinh.
- Nội dung đã tải xuống bị thu hồi hoặc thay phiên bản trước lần đồng bộ kế tiếp.
- Học sinh cần hỗ trợ tiếp cận, cỡ chữ lớn hoặc thao tác không phụ thuộc âm thanh và màu sắc.
- Một năng lực đọc hiểu yếu làm ảnh hưởng kết quả ở Khoa học nhưng chưa đủ bằng chứng để kết luận đó là quan hệ nhân quả liên môn.
- Nhiệm vụ Nghệ thuật, Giáo dục thể chất hoặc Hoạt động trải nghiệm cần quan sát của giáo viên và không phù hợp với chấm đúng/sai tự động.
- Học sinh lớp 1 chưa đọc thành thạo hoặc dùng thiết bị chung với sự hỗ trợ của người lớn.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST duy trì hồ sơ học tập riêng cho từng học sinh trong từng lớp/môn, bao gồm bằng chứng chẩn đoán, trạng thái làm chủ, lịch sử luyện tập và lần cập nhật gần nhất.
- **FR-002**: Hệ thống MUST biểu diễn được mục tiêu học tập hiện tại và các năng lực nền tảng trực tiếp hoặc gián tiếp qua lớp 1–5, trong phạm vi từng môn và khi có bằng chứng rõ cho quan hệ liên môn.
- **FR-003**: Hệ thống MUST bắt đầu chẩn đoán từ mục tiêu học sinh đang gặp khó và chọn câu hỏi tiếp theo dựa trên bằng chứng đã quan sát, không chạy một danh sách cố định giống nhau cho mọi học sinh.
- **FR-004**: Hệ thống MUST phân biệt kết quả đúng/sai với chẩn đoán nguyên nhân và chỉ nêu khoảng hổng gốc khi có đủ bằng chứng theo ngưỡng đã công bố.
- **FR-005**: Mỗi kết luận chẩn đoán MUST gồm khoảng hổng nghi vấn, mục tiêu hiện tại bị ảnh hưởng, bằng chứng liên quan, mức tin cậy và hành động tiếp theo được đề xuất.
- **FR-006**: Khi bằng chứng không đủ hoặc mâu thuẫn, hệ thống MUST ghi nhận trạng thái chưa chắc chắn và yêu cầu thêm bằng chứng hoặc giáo viên xem xét.
- **FR-007**: Hệ thống MUST tránh kiểm tra lại không cần thiết các kiến thức mà học sinh vừa thể hiện đã làm chủ, trừ khi cần xác minh độ bền ghi nhớ.
- **FR-008**: Hệ thống MUST tạo lộ trình cá nhân hóa ngắn nhất hợp lý từ khoảng hổng gốc đến mục tiêu hiện tại, gồm học lại, luyện tập, gợi ý theo tầng, kiểm tra lại và hoạt động chuyển tiếp.
- **FR-009**: Lộ trình MUST thay đổi theo kết quả mới, mức sử dụng gợi ý và sự tiến bộ của học sinh; học sinh tiến bộ nhanh được bỏ qua phần lặp không cần thiết, còn học sinh tiếp tục khó khăn được chia nhỏ bước học.
- **FR-010**: Hệ thống MUST không đưa lời giải hoàn chỉnh ngay trong hoạt động đang đánh giá; trợ giúp phải ưu tiên gợi mở và cho phép học sinh tự thực hiện bước tiếp theo.
- **FR-011**: Hệ thống MUST kiểm tra lại khoảng hổng sau luyện tập và chỉ đánh dấu đã khắc phục khi học sinh thể hiện được năng lực trên các câu hỏi phù hợp mà không phụ thuộc quá mức vào gợi ý.
- **FR-012**: Sau khi khoảng hổng được khắc phục, hệ thống MUST đưa học sinh trở lại mục tiêu của lớp hiện tại bằng ít nhất một hoạt động kết nối rõ ràng.
- **FR-013**: Hệ thống MUST cung cấp cho giáo viên một tổng quan lớp có thể xử lý ít nhất 40 học sinh mà không bỏ sót hồ sơ hoặc trộn dữ liệu giữa học sinh.
- **FR-014**: Hệ thống MUST tự động nhóm học sinh theo nhu cầu học tập chung và cho biết tiêu chí, quy mô, mức tin cậy và hoạt động can thiệp gợi ý của từng nhóm.
- **FR-015**: Hệ thống MUST xếp ưu tiên học sinh cần hỗ trợ và giải thích thứ hạng bằng các tín hiệu học tập có thể hiểu được, bao gồm mức nghiêm trọng, độ tin cậy, xu hướng gần đây và thời gian chưa được hỗ trợ.
- **FR-016**: Hệ thống MUST phát hiện khoảng hổng toàn lớp theo ngưỡng có thể điều chỉnh, phân biệt tín hiệu thật với dữ liệu thiếu hoặc câu hỏi có dấu hiệu lỗi, và gợi ý nội dung cần dạy lại.
- **FR-017**: Giáo viên MUST có thể xem bằng chứng cấp học sinh, lọc theo môn, lớp, khoảng hổng hoặc nhóm, và chuyển từ tổng quan lớp tới chi tiết cần thiết mà không lộ dữ liệu của lớp khác.
- **FR-018**: Giáo viên MUST có thể sửa nhóm, mức ưu tiên hoặc lộ trình đề xuất; hệ thống MUST tôn trọng quyết định đó, giữ lý do tùy chọn và cho phép truy nguyên thay đổi.
- **FR-019**: Hệ thống MUST phân biệt rõ “đang yếu”, “chưa đủ dữ liệu”, “dữ liệu đã cũ”, “đang tiến bộ” và “đã làm chủ” trên mọi bề mặt dành cho giáo viên.
- **FR-020**: Mỗi nội dung được xuất bản MUST ánh xạ tới môn hoặc hoạt động giáo dục, lớp, chủ đề và yêu cầu cần đạt của Chương trình GDPT 2018, đồng thời có nguồn, phiên bản, trạng thái duyệt và quan hệ nền tảng liên quan.
- **FR-021**: Chỉ nội dung và quan hệ tiên quyết đã được người có thẩm quyền chuyên môn phê duyệt MUST được dùng trong chẩn đoán hoặc lộ trình chính thức; nội dung đề xuất tự động phải ở trạng thái bản nháp cho tới khi được duyệt.
- **FR-022**: Hệ thống MUST lưu được phiên bản nội dung đã dùng cho mỗi lượt học để kết quả cũ vẫn có thể được giải thích sau khi học liệu thay đổi.
- **FR-023**: Học sinh MUST có thể tải trước một gói học tập giới hạn theo môn, lớp, mục tiêu và thời gian sử dụng dự kiến, với thông tin rõ về dung lượng và độ mới.
- **FR-024**: Sau khi đã tải gói phù hợp, học sinh MUST có thể tiếp tục chẩn đoán, luyện tập, nhận gợi ý đã chuẩn bị và làm kiểm tra lại khi hoàn toàn ngoại tuyến.
- **FR-025**: Hệ thống MUST lưu bền vững mọi bài làm ngoại tuyến qua việc đóng/mở lại ứng dụng hoặc mất nguồn ngoài ý muốn, trong phạm vi thiết bị còn dung lượng hoạt động.
- **FR-026**: Khi có kết nối trở lại, hệ thống MUST đồng bộ bài làm theo cách không tạo trùng, không mất lịch sử và không âm thầm ghi đè khi có xung đột.
- **FR-027**: Trong điều kiện băng thông thấp, hệ thống MUST ưu tiên trạng thái học tập và hành động thiết yếu; nội dung nặng là tùy chọn và thời điểm cập nhật dữ liệu luôn phải hiển thị.
- **FR-028**: Hệ thống MUST cung cấp giao diện chính bằng tiếng Việt phù hợp khả năng đọc và thao tác của học sinh lớp 1–5 và giáo viên, đồng thời không dùng màu sắc hoặc âm thanh làm tín hiệu duy nhất.
- **FR-029**: Hệ thống MUST bảo vệ dữ liệu trẻ em bằng cách chỉ thu thập dữ liệu cần cho học tập, giới hạn quyền xem theo vai trò/lớp, và ghi lại các lần truy cập hoặc thay đổi nhạy cảm cần truy nguyên.
- **FR-030**: Hệ thống MUST giữ ranh giới rõ giữa dữ liệu thật, dữ liệu mẫu và dữ liệu chưa đồng bộ; không được hiển thị dữ liệu giả như kết quả lớp học thật.
- **FR-031**: Hệ thống MUST cho phép giáo viên hoặc người phụ trách đánh dấu câu hỏi, nội dung hay quan hệ tiên quyết có vấn đề; các tín hiệu liên quan phải được loại khỏi kết luận chắc chắn cho tới khi được xem xét.
- **FR-032**: Hệ thống MUST cung cấp lịch sử giải thích được cho mỗi thay đổi lớn trong chẩn đoán, lộ trình, nhóm và mức ưu tiên, bao gồm bằng chứng đầu vào và quyết định của giáo viên nếu có.
- **FR-033**: Hệ thống MUST hỗ trợ hồ sơ môn học cho các môn và hoạt động giáo dục cấp tiểu học trong Chương trình GDPT 2018, nhưng chỉ bật chẩn đoán tự động khi môn đó có mục tiêu, bằng chứng và tiêu chí đánh giá đã được duyệt.
- **FR-034**: Hệ thống MUST hỗ trợ ít nhất ba loại bằng chứng: câu trả lời có kết quả xác định; sản phẩm đọc, viết hoặc giải thích theo tiêu chí; và quan sát/rubric do giáo viên ghi nhận.
- **FR-035**: Hệ thống MUST áp dụng tiêu chí làm chủ phù hợp từng môn; không được dùng một ngưỡng đúng/sai duy nhất cho Toán, Tiếng Việt, Khoa học, Nghệ thuật, Giáo dục thể chất và Hoạt động trải nghiệm.
- **FR-036**: Giáo viên MUST có thể xem tổng quan từng môn và tổng quan liên môn, trong đó mọi quan hệ liên môn chỉ được trình bày như giả thuyết có bằng chứng và mức tin cậy.
- **FR-037**: Trong bản demo VAIC, hệ thống MUST chứng minh rằng câu hỏi chẩn đoán, lộ trình và nhóm giáo viên thay đổi ngay khi có bằng chứng học tập mới ở ít nhất ba môn đại diện.

### Key Entities

- **Học sinh**: Người học có hồ sơ riêng, thuộc một hoặc nhiều lớp/môn và tạo ra bằng chứng qua các lượt chẩn đoán, luyện tập và kiểm tra lại.
- **Giáo viên**: Người phụ trách lớp, xem tổng quan và bằng chứng, thực hiện can thiệp, điều chỉnh đề xuất và giám sát chất lượng nội dung.
- **Lớp học**: Tập học sinh theo môn và giai đoạn học, là phạm vi của nhóm nhu cầu, thứ tự ưu tiên và khoảng hổng toàn lớp.
- **Mục tiêu học tập**: Một yêu cầu cần đạt cụ thể của Chương trình GDPT 2018, gắn với môn, lớp, chủ đề, nguồn và phiên bản.
- **Khái niệm/kiến thức tiên quyết**: Đơn vị kiến thức có quan hệ phụ thuộc với mục tiêu khác và tạo thành đường giải thích từ khoảng hổng gốc tới nội dung hiện tại.
- **Hồ sơ môn học**: Quy tắc về loại bằng chứng, tiêu chí làm chủ, hình thức trợ giúp và giới hạn tự động hóa phù hợp với từng môn hoặc hoạt động giáo dục.
- **Rubric đánh giá**: Tập tiêu chí đã duyệt để giáo viên hoặc hệ thống xem xét sản phẩm không thể chấm bằng đúng/sai đơn giản.
- **Nội dung học tập**: Câu hỏi, bài giải thích, ví dụ, gợi ý hoặc hoạt động luyện tập đã được ánh xạ chương trình và có trạng thái phê duyệt.
- **Phiên chẩn đoán**: Chuỗi câu hỏi thích ứng cùng bằng chứng, kết luận khoảng hổng, mức tin cậy và trạng thái hoàn tất.
- **Trạng thái làm chủ**: Nhận định có thời điểm về mức độ học sinh nắm một mục tiêu, kèm bằng chứng và độ mới.
- **Lộ trình khắc phục**: Chuỗi hoạt động cá nhân hóa từ khoảng hổng gốc qua kiểm tra lại tới mục tiêu lớp hiện tại, có thể thay đổi theo tiến bộ.
- **Nhóm nhu cầu**: Tập học sinh có nhu cầu can thiệp tương đồng, kèm tiêu chí, mức tin cậy, quy mô và gợi ý hành động.
- **Tín hiệu ưu tiên**: Bằng chứng giúp giáo viên quyết định hỗ trợ ai trước, không phải nhãn cố định về năng lực của học sinh.
- **Gói học tập ngoại tuyến**: Tập nội dung đã duyệt và trạng thái cần thiết cho một phạm vi học, có phiên bản, dung lượng và thời hạn cập nhật.
- **Lượt làm bài**: Câu trả lời, thời điểm, mức trợ giúp, kết quả và trạng thái đồng bộ; là bằng chứng chứ không tự nó quyết định toàn bộ năng lực.
- **Quyết định/điều chỉnh của giáo viên**: Thay đổi có chủ đích đối với nhóm, ưu tiên, lộ trình hoặc nội dung, được lưu để truy nguyên.

### Scope Boundaries

**Product scope for primary education**:

- Học sinh lớp 1–5 và giáo viên tiểu học là người dùng trung tâm.
- Danh mục hệ thống bao quát các môn và hoạt động giáo dục tiểu học trong Chương trình GDPT 2018: Tiếng Việt, Toán, Đạo đức, Ngoại ngữ 1, Tự nhiên và Xã hội, Lịch sử và Địa lí, Khoa học, Tin học và Công nghệ, Giáo dục thể chất, Nghệ thuật, Hoạt động trải nghiệm và nội dung giáo dục địa phương.
- Các môn có bằng chứng nhận thức rõ ràng có thể dùng chẩn đoán và lộ trình thích ứng; các môn thiên về thực hành, vận động, nghệ thuật hoặc trải nghiệm ưu tiên rubric và quan sát của giáo viên, không ép thành bài trắc nghiệm đúng/sai.
- Giáo viên có tổng quan từng môn và liên môn, nhưng hệ thống không khẳng định quan hệ nguyên nhân liên môn khi chưa đủ bằng chứng.

**VAIC 2026 build scope — 48-hour MVP**:

- Ba gói nội dung chạy được, đại diện cho ba kiểu năng lực: Toán lớp 3–5, Tiếng Việt lớp 2–4 và Tự nhiên & Xã hội/Khoa học lớp 2–5.
- Mỗi gói có tối thiểu hai chuỗi khoảng hổng xuyên lớp; toàn demo có ít nhất 24 mục tiêu học tập đã duyệt và 48 hoạt động chẩn đoán/luyện tập có ánh xạ CTGDPT 2018.
- Một luồng học sinh hoàn chỉnh: nhận nhiệm vụ → chẩn đoán thích ứng → giải thích khoảng hổng gốc → lộ trình khắc phục thay đổi theo câu trả lời → kiểm tra lại → quay về mục tiêu hiện tại.
- Một lớp demo 40 hồ sơ học sinh tổng hợp, được gắn nhãn rõ là dữ liệu mô phỏng, để chứng minh nhóm nhu cầu, danh sách hỗ trợ trước, cảnh báo khoảng hổng toàn lớp và bộ lọc ba môn.
- Một minh chứng ngoại tuyến hoàn chỉnh: tải trước gói nhỏ, mất mạng, tiếp tục học, khởi động lại, kết nối lại và thấy dashboard giáo viên cập nhật mà không mất hoặc nhân đôi bài làm.
- Một demo end-to-end tối đa 8 phút, trong đó quyết định chẩn đoán, lộ trình và gợi ý giáo viên đều hiển thị bằng chứng và thay đổi trước dữ liệu mới; đây là bằng chứng AI-native cốt lõi thay vì một chatbot gắn thêm vào sản phẩm.

**MVP acceptance gate**: Bản dự thi chỉ được coi là đạt phạm vi khi đồng thời chạy được ba gói môn, chẩn đoán được ít nhất một khoảng hổng xuyên lớp, thay đổi lộ trình theo câu trả lời, cung cấp dashboard giáo viên cho lớp 40 học sinh, hoàn thành một vòng ngoại tuyến–đồng bộ và chứng minh 100% nội dung demo đã được ánh xạ, duyệt theo CTGDPT 2018.

**Out of scope for MVP**:

- Số hóa đầy đủ mọi yêu cầu cần đạt và học liệu của toàn bộ lớp 1–5 trong 48 giờ.
- Cung cấp nội dung chạy thật cho các môn ngoài ba gói demo; các môn này chỉ cần có hồ sơ phạm vi và cách đánh giá dự kiến trong MVP.
- Dạy học trực tiếp qua video, thay thế giáo viên, hoặc tự động đưa ra quyết định kỷ luật/xếp loại học sinh.
- Dùng kết quả này như điểm thi chính thức hoặc căn cứ duy nhất cho quyết định có hệ quả cao.
- Tạo và xuất bản nội dung tự động mà không có bước phê duyệt chuyên môn.
- Phân tích cảm xúc, nhận diện khuôn mặt, giám sát camera hoặc thu thập dữ liệu không cần thiết cho mục tiêu học tập.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Demo chạy liền mạch trong tối đa 8 phút và thể hiện đủ ba bề mặt: học sinh chẩn đoán–luyện tập, giáo viên ra quyết định và học ngoại tuyến–đồng bộ.
- **SC-002**: Cả ba gói Toán, Tiếng Việt và Tự nhiên & Xã hội/Khoa học đều có ít nhất hai chuỗi khoảng hổng xuyên lớp chạy được; tổng cộng có tối thiểu 24 mục tiêu và 48 hoạt động đã duyệt.
- **SC-003**: Trên ít nhất 12 tình huống kiểm thử có khoảng hổng gốc đã biết, ít nhất 10 tình huống xếp đúng khoảng hổng vào ba chẩn đoán có mức tin cậy cao nhất; 100% trường hợp thiếu bằng chứng được gắn nhãn chưa chắc chắn.
- **SC-004**: Với mỗi môn demo, ít nhất hai chuỗi câu trả lời khác nhau từ cùng một điểm bắt đầu tạo ra câu hỏi chẩn đoán hoặc bước luyện tập tiếp theo khác nhau và có lời giải thích bằng chứng.
- **SC-005**: Ít nhất 90% hoạt động trong mỗi lộ trình khắc phục nhắm trực tiếp vào khoảng hổng đã chẩn đoán, năng lực nền tảng cần thiết hoặc bước chuyển tiếp về mục tiêu hiện tại; không có bước chỉ xuất hiện vì thứ tự bài học cố định.
- **SC-006**: Với lớp mô phỏng 40 học sinh, giáo viên có thể xác định năm học sinh cần hỗ trợ trước, lý do của từng em, nhóm nhu cầu lớn nhất và một khoảng hổng toàn lớp trong không quá 2 phút.
- **SC-007**: Giáo viên chuyển được giữa tổng quan Toán, Tiếng Việt, Tự nhiên & Xã hội/Khoa học và liên môn trong không quá 2 thao tác chính; không học sinh nào bị bỏ khỏi tổng quan hoặc trộn dữ liệu giữa môn.
- **SC-008**: 100% nhóm, thứ tự ưu tiên và cảnh báo lớp trong demo hiển thị bằng chứng, độ mới dữ liệu và mức tin cậy; giáo viên sửa hoặc bác bỏ đề xuất trong không quá 3 thao tác chính.
- **SC-009**: Sau khi tải trước, học sinh hoàn thành ít nhất 20 hoạt động khi không có mạng; 100% bài làm còn nguyên sau khi khởi động lại và được đồng bộ không mất hoặc nhân đôi khi kết nối trở lại.
- **SC-010**: Sau lần tải gói ban đầu, một phiên 20 hoạt động ở chế độ băng thông thấp sử dụng không quá 2 MB dữ liệu, không tính nội dung đa phương tiện mà người dùng chủ động chọn.
- **SC-011**: 100% nội dung demo có ánh xạ tới yêu cầu cần đạt CTGDPT 2018, môn, lớp, chủ đề, nguồn, phiên bản và trạng thái phê duyệt; nội dung nháp không xuất hiện trong lộ trình chính thức.
- **SC-012**: Trong ít nhất ba lượt đánh giá khả dụng nhanh với giáo viên hoặc người đóng vai giáo viên, tất cả đều hoàn thành được hai nhiệm vụ “giúp ai trước” và “dạy lại nội dung gì”; ít nhất hai người đánh giá lời giải thích là dễ hiểu.
- **SC-013**: Không có sự cố nghiêm trọng trong demo liên quan đến lộ dữ liệu sang sai lớp, mất bài làm ngoại tuyến, hiển thị dữ liệu mô phỏng như dữ liệu thật, áp sai tiêu chí giữa các môn hoặc xuất bản nội dung chưa duyệt.

## Assumptions

- Cuộc thi VAIC 2026 yêu cầu một sản phẩm AI-native chạy được trong 48 giờ; vì vậy phạm vi nội dung được cố ý giới hạn nhưng luồng demo phải hoàn chỉnh và có bằng chứng thay đổi thích ứng.
- Phạm vi sản phẩm là lớp 1–5 và các môn/hoạt động giáo dục tiểu học; phạm vi nội dung chạy thật tại hackathon là ba gói đại diện, không được tuyên bố là đã phủ toàn bộ chương trình.
- “Khoảng hổng gốc” là giả thuyết dựa trên bằng chứng và bản đồ tiên quyết đã duyệt, không phải chẩn đoán bất biến về năng lực của học sinh.
- Trường có thể cung cấp ít nhất một lần kết nối định kỳ để tải gói học tập và đồng bộ tiến độ; học sinh không cần kết nối liên tục trong lúc học.
- Mỗi học sinh có định danh riêng ngay cả khi nhiều em dùng chung thiết bị; danh sách lớp và quyền giáo viên đã có hoặc được nhập trước khi thử nghiệm.
- Nội dung chính thức hoặc được cấp quyền sử dụng theo Chương trình GDPT 2018 có sẵn cho nhóm phụ trách học liệu.
- Giáo viên giữ quyền quyết định cuối cùng đối với can thiệp lớp, nhóm học sinh, mức ưu tiên và việc dùng nội dung đề xuất.
- Ngưỡng làm chủ, cảnh báo toàn lớp và độ cũ dữ liệu có giá trị mặc định phù hợp cho thí điểm nhưng có thể được người phụ trách chuyên môn điều chỉnh và xem lại.
- Nội dung đa phương tiện nặng không bắt buộc cho luồng học cốt lõi; trải nghiệm ngoại tuyến vẫn hoàn chỉnh bằng nội dung văn bản và hình ảnh nhẹ đã tải trước.
- Hệ thống hỗ trợ quyết định sư phạm, không thay thế đánh giá chuyên môn của giáo viên và không dùng đơn lẻ cho xếp loại có hệ quả cao.
- Các hồ sơ học sinh dùng để chứng minh lớp 40 em trong Demo Day là dữ liệu tổng hợp và phải được gắn nhãn rõ; nếu có thử nghiệm người thật, dữ liệu phải được tối thiểu hóa và có sự đồng ý phù hợp.
- Với Nghệ thuật, Giáo dục thể chất, Hoạt động trải nghiệm và nội dung địa phương, MVP chỉ xác định hồ sơ môn học và luồng giáo viên ghi nhận bằng chứng, không tự động chấm năng lực.

## Dependencies

- Có ma trận yêu cầu cần đạt và nguồn học liệu được phép sử dụng cho ba gói Toán, Tiếng Việt và Tự nhiên & Xã hội/Khoa học trong phạm vi lớp đã chọn.
- Có ít nhất một giáo viên tiểu học hoặc chuyên gia môn học duyệt câu hỏi, hoạt động, đáp án, rubric, gợi ý và quan hệ nền tảng trước Demo Day.
- Có ngân hàng nội dung tối thiểu đủ phủ các nhánh chẩn đoán và lộ trình ngoại tuyến được chọn cho MVP.
- Có danh sách lớp, định danh học sinh và quan hệ giáo viên–lớp chính xác trước khi chạy thử nghiệm.
- Có thiết bị đủ dung lượng cho gói học tập và ít nhất một điểm kết nối định kỳ để tải mới hoặc đồng bộ.
