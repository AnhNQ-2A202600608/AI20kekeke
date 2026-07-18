# Design Guidelines & Interface Specification (Sapia AI)

## Overview

The product should feel like a premium EdTech tutor: calm, clear, trustworthy, and adaptive. Design choices must help students understand their learning state and help lecturers identify class gaps quickly.

The interface system is split into two distinct sub-systems: **Student Portal** (Cổng Học Viên) and **Teacher Portal** (Cổng Giảng Viên), utilizing the **Sapia AI - Vibrant Learning** style (Tactile / Skeuomorphic Modern, Duolingo-style).

---

## Visual Direction

- Academic, modern, and focused.
- Use visual hierarchy to separate source-grounded tutor answers, practice prompts, feedback, and progress.
- Avoid cluttered LMS-style management screens unless they directly support tutoring or adaptive learning.
- Use skeuomorphic / tactile elements to create a lively, engaging, and dynamic learning environment.

---

## Color System & Design System Tokens

Hộp chứa nổi (Card/Panels) sử dụng nền trắng (`#ffffff`) hoặc xanh lá nhạt (`#eef7e3` / `#e9f1dd`), kết hợp viền xám nổi (`border: 2px solid #e5e5e5; border-bottom: 5px solid #e5e5e5;`) để tạo chiều sâu 3D chân thực.

| Token | Hex Color | Vietnamese Name | Purpose / Custom Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Primary Green** | `#58cc02` (Base) <br> `#46a302` (3D Border) | Xanh bơ học thuật | Academic intelligence, main CTA, primary actions. (`bg-primary-green`) |
| **Secondary Green/Teal** | `#00cd9c` (Base) <br> `#00a47d` (3D Border) | Xanh Teal | AI/technology accents, specialized learning tiles. (`bg-secondary-green`) |
| **Tertiary Yellow** | `#ffc800` (Base) <br> `#cc9600` (3D Border) | Vàng tinh tú | Mastered concepts, completed path nodes, XP badges. (`bg-tertiary-yellow`) |
| **Accent Orange** | `#ff9600` (Base) <br> `#cc7000` (3D Border) | Cam ngọn lửa | Fire streak counters, warnings, priority alerts. (`bg-accent-orange`) |
| **Error Red** | `#ff4b4b` (Base) <br> `#ea2b2b` (3D Border) | Đỏ cảnh báo | Incorrect answers, quiz failures, critical errors. (`bg-error-red`) |
| **Info Blue** | `#1cb0f6` (Base) <br> `#1899d6` (3D Border) | Xanh thông tin / Active | Chat explanations, selected card state. (`bg-primary-blue`) |
| **Active Light Blue** | `#ddf4ff` (Bg) <br> `#84d8ff` (Border) | Nền thẻ chọn hoạt động | Active selection card backgrounds and borders. |
| **Background** | `#f4fce8` | Xanh kem dịu mát | Cozy light avocado background. (`bg-background`) |
| **On-Background** | `#171e12` | Charcoal thẫm | Dark charcoal text color. (`text-on-background`) |
| **Gray Border** | `#e5e5e5` (Base) <br> `#b7b7b7` (3D Border) | Xám vô hiệu hóa & viền | Outlines, locked state paths, disabled buttons. (`border-gray-border`) |

---

## Typography

- **Headings (Tiêu đề):** Sử dụng font **Fraunces** qua token `--font-fraunces` cho các tiêu đề có tính thương hiệu, trạng thái học tập, và điểm nhấn editorial nhỏ.
- **Body & Labels (Nội dung & Nhãn):** Sử dụng **Be Vietnam Pro** qua token `--font-be-vietnam-pro` cho giao diện học tập tiếng Việt, nội dung app, form, dashboard, nút, và metadata.
- Không scale font theo viewport width. Dùng các cấp Tailwind cố định (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `md:text-4xl` cho hero thật sự).
- Letter spacing mặc định là `0`. Chỉ dùng uppercase tracking nhẹ cho micro-label nếu cần phân tách metadata.
- Line-height cần đủ đọc trong tiếng Việt nhưng không quá rộng: app/workspace ưu tiên mật độ quét nhanh thay vì cảm giác landing page lớn.

---

## Runtime App Sizing Baseline

Use the active App workspace as the source of truth for sizing. Marketing, onboarding, auth, and documentation surfaces must scale down to this density unless a specific workflow needs more space.

Measured baseline from `/app` at `1707x960`:

| Element | Current App Range | Guideline |
| :--- | :--- | :--- |
| Page height | `scrollHeight=960`, `clientHeight=960` | Prefer one-viewport workspace layouts. Avoid unnecessary full-page vertical scrolling on primary app-like screens. |
| Primary workspace heading | `20-24px` | Use `text-xl` to `text-2xl`; avoid `md:text-5xl` or `md:text-6xl` outside true marketing/editorial pages. |
| Section/card heading | `16-20px` | Use `text-base`, `text-lg`, or compact `font-fraunces text-lg`. |
| Body copy | `14-16px` | Use `text-sm` or `text-base`; keep line-height readable but not spacious. |
| Micro labels and metadata | `9-11px` | Use `text-[9px]`, `text-[10px]`, `text-[11px]`, usually uppercase and bold. |
| Metric buttons/pills | `41px` height, `13.5px` font, `14px` horizontal padding | Use `min-h-9` to `min-h-10`, `text-xs`, `px-3`. |
| Primary action buttons | `45-50px` normal, up to `67px` only for dense day cards | Use `min-h-10` or `min-h-11`, `text-xs`/`text-sm`, `px-3`/`px-4`. Avoid defaulting to `min-h-12`. |
| Icon-only nav buttons | `40-45px` square | Use `h-10 w-10` or `h-11 w-11`; icon size `h-4` to `h-5`. |
| Panels/cards | `p-3`/`p-4`, measured median padding `11px`, p80 `18px` | Default to `p-3`, `p-4`, `px-3`, `py-2.5`; reserve `p-5` for major summary panels. |
| Radius | `rounded-xl`/`rounded-2xl`, occasional `24px` tactile cards | Default `rounded-xl` or `rounded-2xl`. Avoid widespread `rounded-[28px]` or larger. |
| Section spacing | App sections use tight `gap-2` to `gap-4` and `py-2` to `py-4` | Landing/product sections should start at `py-8 md:py-10`, not `py-16 md:py-20`, unless intentionally editorial. |
| Content width | App workspace uses dense bounded shells like `max-w-[82rem]` with inner `p-3` | Prefer constrained, workspace-like previews over wide marketing compositions. |

Landing and public entry pages should follow the App scale:

- Header height: `56-64px`.
- Hero title: max `text-2xl md:text-4xl`.
- Hero/body copy: `text-sm md:text-base`.
- CTA buttons: `min-h-10` or `min-h-11`, `text-xs`/`text-sm`, `px-3`/`px-4`.
- Cards: `rounded-2xl`, `border border-gray-border`, `p-3 md:p-4`.
- First viewport should feel like a compact product workspace preview, not a large marketing hero.
- Do not use oversized stacks such as `md:text-6xl`, `py-16 md:py-20`, `rounded-[28px]`, and repeated `p-5/p-6` unless explicitly approved for a campaign page.

---

## Concept Mastery Visualization (Sơ đồ màu hóa năng lực)

| State | Rule | Design Token Color |
| :--- | :--- | :--- |
| **Mastered** | Elo/mastery high, e.g. `>= 1400` | Tertiary Yellow (`#ffc800`) |
| **Learning** | Between weak and mastered | Primary Green (`#58cc02`) |
| **Weak** | Elo/mastery low, e.g. `<= 1000` | Error Red (`#ff4b4b`) |
| **Not started** | No attempts/data | Neutral Gray (`#e5e5e5`) |

---

## Interaction Guidelines & Tactile Physics

- **Tactile 3D Click:** Tất cả các thành phần tương tác (nút bấm, thẻ lựa chọn, node hành trình) đều được thiết kế dạng khối 3D với viền dưới dày 5px (depth border). Khi click hoặc chạm (`:active`), phần tử sẽ dịch chuyển đi xuống 4px và độ rộng viền dưới giảm về 0-1px (`transform: translateY(4px); border-bottom-width: 0px/1px;`), tạo hiệu ứng nút bấm vật lý lún xuống.
- **Purple Ban:** Cấm sử dụng màu tím, tím violet, chàm (indigo) hoặc cánh sen (magenta) làm màu thương hiệu hoặc điểm nhấn giao diện dưới mọi hình thức nhằm tránh rập khuôn thẩm mỹ AI đại trà.
- **Mascot (Linh vật):** Sử dụng hình ảnh **Cáo Sofi (Sofi the Fox)** tò mò, đeo kính tròn học giả và đội mũ tốt nghiệp màu xanh lá thẫm (`#46a302`), biểu thị sự uyên bác, nhanh nhạy và thông thái. Cáo Sofi sẽ xuất hiện tại các thẻ hướng dẫn, thông báo nộp bài, hoặc bảng trượt phản hồi để động viên học sinh.

---

## Accessibility (Khả năng tiếp cận)

- Đảm bảo độ tương phản màu sắc đạt tiêu chuẩn WCAG AA cho toàn bộ văn bản.
- Cung cấp trạng thái hiển thị rõ ràng khi điều hướng bằng bàn phím (focus states).
- Trực quan hóa tiến độ thông qua nhãn chữ, icon kết hợp với màu sắc, tránh mã hóa duy nhất bằng màu.
- Hiệu ứng trượt thông báo nộp bài (bottom slide-in banner) phải mượt mà và không che khuất hành động quan trọng mà không có nút bỏ qua.

---

## Asset, Icon, and Mask Code Guidelines

- Brand assets live under `frontend/public/brand/mentora/`. Keep `logo.png`, `logo-cropped.png`, `icon-192x192.png`, `icon-512x512.png`, `maskable-icon-512x512.png`, favicons, and `apple-touch-icon.png` aligned as one brand package.
- Public app visuals should reuse project-owned assets before generating new artwork:
  - `frontend/public/app-backgrounds/` for app/profile shell atmosphere.
  - `frontend/public/learning-scenery/` for landing, onboarding, RAG, mentor, product-loop, safety, and evaluation scenes.
  - `frontend/public/learning-seeds/` and `frontend/public/learning-soils/` for mastery/progress states.
  - `frontend/public/mascot/` for tutor/coach reactions.
- Maskable app icons must keep safe padding around the mark so browser/PWA masks do not crop the subject. Use `maskable-icon-512x512.png` for manifest maskable purpose and keep regular icons separate.
- Do not replace real product/workspace imagery with abstract gradients or decorative blobs. Landing/public pages should preview the actual learning system, app shell, or project-owned educational scenes.
- When adding new assets, update the relevant `index.json` or asset manifest if one exists so components can discover them consistently.
- Prefer `next/image` for known public assets in UI code. Provide meaningful `alt` text for informative images and empty `alt` only for purely decorative visuals.
- Icon buttons should use `lucide-react` where an icon exists. Keep app icon sizes in the `h-4` to `h-5` range for dense controls.

---

## Định nghĩa các trang màn hình (Page Definition)

Hệ thống bao gồm 4 trang màn hình cốt lõi:

| STT | Tên Trang | Phân Hệ | Chức năng chính |
| :--- | :--- | :--- | :--- |
| 1 | **Student Dashboard** | Học viên | Trực quan hóa năng lực (Radar chart), biểu đồ hoạt động (Heatmap), và widget gợi ý học tập trong vùng ZPD. |
| 2 | **Adaptive Quiz Interface** | Học viên | Làm bài trắc nghiệm thích ứng, tích hợp sidebar hội thoại gợi mở Socratic với AI Tutor. |
| 3 | **Socratic Chat RAG Portal** | Học viên | Hỏi đáp Socratic theo 5 mode, cá nhân hóa giải thích theo điểm Elo, xem citation cards và phản hồi feedback. |
| 4 | **Teacher Ingestion & Audit Portal** | Giảng viên | Tải PDF môn học, auto-generation quiz questions, test nhanh RAG, và class-level dashboard xem điểm yếu của học viên. |

---

## Sơ đồ bố cục (Wireframe Schematics)

### Màn hình 1: Student Dashboard (Tổng quan năng lực học viên)

Trang chủ của học viên hiển thị trạng thái làm chủ kiến thức đa chiều và biểu đồ heatmap đóng góp học tập.

```text
+---------------------------------------------------------------------------------------+
|  [Logo] SAPIA AI ADAPTIVE                             [Student: Nguyễn Văn A] [Elo: 1280] |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  +-------------------------------------+   +---------------------------------------+  |
|  | RADAR CHART - BẢN ĐỒ NĂNG LỰC       |   | GỢI Ý HỌC TẬP (ZPD RECOMMENDATION)     |  |
|  | (Trực quan hóa mức Elo từng Concept)|   | (Ưu tiên các Concept ở mức 2 và 3)    |  |
|  |                                     |   |                                       |  |
|  |                 Concept A           |   | [Concept: Docker Compose]             |  |
|  |                 /       \           |   | Elo: 1050 (Learning)                  |  |
|  |         Concept E        Concept B  |   | -> Kỹ năng yếu nhất tuần này          |  |
|  |             |     (Elo)      |      |   | [ Luyện Quiz ngay ]  [ Hỏi Socratic RAG ]|  |
|  |         Concept D--------Concept C  |   |                                       |  |
|  |                                     |   | [Concept: REST API Call]              |  |
|  |                                     |   | Elo: 950 (Weak)                       |  |
|  |                                     |   | -> Cần ôn lý thuyết cơ bản            |  |
|  |                                     |   | [ Luyện Quiz ngay ]  [ Hỏi Socratic RAG ]|  |
|  +-------------------------------------+   +---------------------------------------+  |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  | LEARNING HEATMAP - NHẬT KÝ HOẠT ĐỘNG CHUYÊN CẦN                                 |  |
|  | (Contribution Graph hiển thị số câu hỏi/lượt tương tác hàng ngày)               |  |
|  |                                                                                 |  |
|  | Jan [ ][ ][x][x][ ][ ]                                                          |  |
|  | Feb [x][ ][ ][x][x][x]   (Màu xanh bơ đậm hiển thị ngày hoạt động nhiều)         |  |
|  +---------------------------------------------------------------------------------+  |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

### Màn hình 2: Adaptive Quiz Interface (Giao diện làm Quiz có Socratic Sidebar)

Giao diện chia đôi màn hình (Split-screen) giúp học sinh làm trắc nghiệm thích ứng kèm thanh chat AI Hint gợi ý Socratic bên cạnh.

```text
+---------------------------------------------------------------------------------------+
|  < Quay lại Dashboard           [Concept: Docker Compose]          Tiến trình: [=======] |
+---------------------------------------------------------------------------------------+
|                                           |                                           |
|  KHUNG CÂU HỎI TRẮC NGHIỆM (70% Màn hình) |  TRỢ LÝ SOCRATIC AI HINT (30% Màn hình)   |
|                                           |  (Khung cam Terracotta)                   |
|  +-------------------------------------+  |  +-------------------------------------+  |
|  | Độ khó hiện tại: 1100 Elo (Calibrated)|  |  | Socratic AI Tutor:                 |  |
|  |                                     |  |  | "Em hãy nhìn vào file compose cấu  |  |
|  | Câu 3: Để chạy các container ở nền  |  |  | hình, tham số nào cho phép chạy    |  |
|  | (detached mode), ta dùng cờ nào?   |  |  | detached?"                         |  |
|  |                                     |  |  |                                    |  |
|  |  ( ) A. -d                          |  |  | [Học sinh]: dùng -d phải không ạ?  |  |
|  |  ( ) B. -p                          |  |  |                                    |  |
|  |  ( ) C. -v                          |  |  | Socratic AI Tutor:                 |  |
|  |  ( ) D. -it                         |  |  | "Chính xác! d là viết tắt của      |  |
|  |                                     |  |  | detached."                         |  |
|  |  [ Nộp bài ]       [ Hỏi AI Gợi Ý ] |  |  +-------------------------------------+  |
|  +-------------------------------------+  |  | Nhập câu hỏi gợi ý...       [ Gửi ] |  |
|                                           |  | (Số lần hỏi: 1 | Bị giảm 30% Elo)   |  |
|                                           |  +-------------------------------------+  |
|                                           |                                           |
+---------------------------------------------------------------------------------------+
```

### Màn hình 3: Socratic Chat RAG Portal (Cổng tra cứu tài liệu)

Giao diện chat thích ứng, tự động điều chỉnh văn văn phong giải thích theo Elo của học viên.

```text
+---------------------------------------------------------------------------------------+
|  [Logo] SAPIA AI CHAT RAG                             [Student: Nguyễn Văn A] [Role]   |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  [ CHỌN CHẾ ĐỘ HỌC TẬP (MODE SELECTOR) ]                                               |
|  [ (o) Giải thích ]  [ ( ) Gợi ý từng bước ]  [ ( ) Debug ]  [ ( ) Luyện tập ]  [ ( ) Review ]|
|  (AI tự chọn dựa trên Elo: 780 - Feynman Style)                                       |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  | KHUNG HỘI THOẠI (CHAT WINDOW)                                                   |  |
|  |                                                                                 |  |
|  | [Student]: Docker Compose hoạt động thế nào thế AI?                             |  |
|  |                                                                                 |  |
|  | [AI Tutor] (Phong cách: Feynman - Dễ hiểu):                                     |  |
|  | "Hãy tưởng tượng em là một nhạc trưởng. Thay vì chỉ đạo từng nhạc công (Docker   |  |
|  | container) khởi động riêng lẻ, em dùng một bản nhạc tổng phổ (file yaml)..."   |  |
|  |                                                                                 |  |
|  | +-----------------------------------------------------------------------------+ |  |
|  | | NGUỒN TRÍCH DẪN (CITATION CARD)                                             | |  |
|  | | • Slide Bài 3 - Trang 12 (Composer Introduction)                            | |  |
|  | |   Excerpt: "...defines and runs multi-container Docker applications..."     | |  |
|  | +-----------------------------------------------------------------------------+ |  |
|  | [ Hữu ích 👍 ] [ Không hữu ích 👎 ] [ Báo lỗi trích dẫn ⚠️ ]                    |  |
|  +---------------------------------------------------------------------------------+  |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  | [ Nhập câu hỏi của bạn tại đây...                                     ] [ Gửi ] |  |
|  +---------------------------------------------------------------------------------+  |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

### Màn hình 4: Teacher Ingestion & Audit Portal (Bảng điều khiển Giảng viên)

Màn hình quản lý tài liệu, tự động sinh quiz và xem thống kê lỗ hổng kiến thức của sinh viên.

```text
+---------------------------------------------------------------------------------------+
|  [Logo Admin] SAPIA AI CONTROLLER                     [Giảng viên: Trần Văn B]        |
+---------------------------------------------------------------------------------------+
|                               |                                                       |
|  COL 1: PDF/SLIDE INGESTION   | COL 2: CLASS INSIGHTS & AUDIT DASHBOARD               |
|  +--------------------------+ | +---------------------------------------------------+ |
|  | [ Kéo thả file PDF/PPTX ]| | | CLASS INSIGHTS (Thống kê năng lực lớp)            | |
|  |                          | | | • Concept yếu nhất: Docker Compose (TB Elo: 650)  | |
|  | Tên tài liệu:            | | | • Số SV cần can thiệp hỗ trợ: 5 học viên          | |
|  | [ Slide_Lecture_03     ] | | |---------------------------------------------------| |
|  | Trạng thái:              | | | RAG QUICK TEST PANEL                              | |
|  | (o) Draft  ( ) Published | | | [ Nhập câu hỏi test...                 ] [ Test ] | |
|  |                          | | |                                                   | |
|  | [X] Tự động sinh Quiz    | | | AUDIT DASHBOARD (Review log lỗi)                  | |
|  |                          | | | • 3 ca RAG low-confidence                         | |
|  | [ Upload & Indexing ]    | | | • 2 ca feedback unhelpful                         | |
|  +--------------------------+ | +---------------------------------------------------+ |
|                               |                                                       |
+---------------------------------------------------------------------------------------+
```

---

## Bản hướng dẫn tương tác chi tiết (Interaction Matrix)

Các tương tác trên giao diện phải tuân thủ nghiêm ngặt các quy tắc sau:

### 1. Tương tác làm bài Quiz Thích ứng:
- Khi học viên bấm nộp bài trắc nghiệm:
  - Nếu **Đúng**: Viền đáp án chuyển sang xanh bơ. Điểm Elo học viên tăng lên (+delta Elo) hiển thị hiệu ứng pháo hoa nhẹ.
  - Nếu **Sai**: Nền đáp án đã chọn chuyển sang Terracotta Coral. Điểm Elo giảm (-delta Elo).
- Trợ lý Socratic Sidebar bên phải cho phép trượt vào (slide-in) khi click nút "Hỏi AI Gợi Ý". Số lần hỏi hint được hiển thị rõ kèm dòng chữ cảnh báo: *"Mỗi lượt gợi ý sẽ làm giảm lượng điểm Elo nhận được khi trả lời đúng (Phạt Elo 30% / 60%)"*.

### 2. Tự động cá nhân hóa RAG Chat theo điểm Elo:
- Khi học sinh đặt câu hỏi trong Chat RAG, hệ thống ngầm đối chiếu điểm Elo của học sinh đối với concept tương ứng để tự động gán System Prompt thích hợp (Feynman / Deep / Challenge) mà học sinh không cần tự chỉnh.

### 3. Tương tác Đồ thị Radar:
- Học viên có thể hover vào các đỉnh của Radar chart để xem điểm số Elo thực tế, số lượng quiz đã làm, và nút "Ôn tập ngay" để mở nhanh Quiz của Concept đó.

### 4. Quy trình Ingestion & In-place Quiz Approval:
- Khi Giảng viên tick vào "Tự động sinh Quiz" và bấm Upload:
  - Backend ingestion/RAG pipeline xử lý trích xuất tài liệu đồng thời tạo 5-10 câu hỏi trắc nghiệm thô cùng 3 mức hint.
  - Các câu hỏi thô này hiển thị ở trạng thái "Draft Quiz" để giảng viên chỉnh sửa, click "Approve" để chuyển sang "Published Quiz" dùng cho sinh viên.
