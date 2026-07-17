# EduGap C2 App 125 - QA Report

**Bao cao kiem thu chat luong tong hop**  
EduGap - production/staging Vercel

| Truong | Gia tri |
|--------|---------|
| URL kiem thu | https://edugap-c2-app-125.vercel.app/ |
| Ngay test | 06/07/2026 |
| Moi truong | Vercel deployment |
| Tai khoan | demo.flow@edugap.vn / password da an |
| Role quan sat | HOC VIEN / Demo Account |
| Che do | HEADLESS, report-only, khong screenshot |
| Pham vi | Landing, login, student app, learning path, skill garden, Socratic chat, profile/progress, desktop 1280x720, mobile 390x844 |

## Diem tong

| Truc | Diem | Chi tiet severity |
|------|------|--------------------|
| PHAN A - QA he thong | 78/100 | 0 CRIT - 1 HIGH - 2 MED - 0 LOW |
| PHAN B - Do chinh xac chatbot | 5.5/10 | 0 DUNG - 2 MOT PHAN - 1 LOI/SAI |

Tom tat: he thong dang nhap duoc, cac tab chinh cua student app render duoc va khong ghi nhan console error trong cac luong da test. Rui ro lon nhat nam o routing/deep-link: URL co the hien `chat` hoac `profile` nhung UI hien noi dung `learn`, gay sai trang khi reload/share link. Chatbot co citation va tra loi nhanh, nhung truy xuat profile/learning path ca nhan chua dung va co dau hieu retrieval lech nguon.

## A1. Phuong phap va pham vi

Kiem thu bang browser automation headless, mo URL that, dang nhap bang demo account, click cac luong chinh va doc console warning/error sau moi nhom thao tac. Da test desktop mac dinh va mobile viewport 390x844.

| Khu vuc | Da kiem thu |
|---------|-------------|
| Landing | Render public page, CTA login, noi dung value proposition |
| Auth | Login bang credential hop le |
| Student learning | Tab Hoc tap, roadmap 28 ngay, Day 1-7, skill detail |
| Practice garden | Tab Luyen tap, danh sach ky nang, phien dang mo |
| Socratic chat | Mo chat qua UI, gui 3 cau hoi accuracy |
| Profile/progress | Tab Tien do, profile garden, stats, skill graph |
| Responsive | Mobile 390x844 reload tren student app |

Gioi han da tranh: khong lam bai/submit dap an quiz, khong bam cac nut co kha nang ghi tien do nhu `Tuoi lai`, `Bat dau ngay`, `Luyen ky nang nay`, khong xoa/suspend/gui thong bao that.

## A2. Bang tong hop loi he thong

| ID | Muc do | Van de | Khu vuc |
|----|--------|--------|---------|
| A-01 | HIGH | Deep link/query `?tab=chat` hien URL chat nhung noi dung van la Hoc tap | Routing student app |
| A-02 | MEDIUM | Mobile reload o route profile hien noi dung learning path, khong hien profile/progress | Responsive routing |
| A-03 | MEDIUM | Chatbot khong truy xuat duoc learning path ca nhan du co du lieu visible trong UI | AI integration / personalization |

Severity scale: CRITICAL chan luong chinh; HIGH gay sai trang/chuc nang quan trong; MEDIUM lam giam chat luong hoac workflow co workaround; LOW cosmetic/UX nho.

## A3. Bug card chi tiet

### A-01 - HIGH - Deep link chat khong render dung tab

**HIEN TUONG**  
Mo truc tiep `https://edugap-c2-app-125.vercel.app/app/learn?tab=chat` sau khi da dang nhap: URL hien `tab=chat`, nhung noi dung trang van la `Lộ trình học tập` cua tab Hoc tap. Textarea chat `Nhập câu hỏi cho trợ lý AI` khong ton tai. Khi click tab `Trợ lý AI` trong UI, app moi chuyen dung sang `/app/chat` va render Socratic chat.

**KICH BAN TAI HIEN**
1. Dang nhap bang demo account.
2. Mo truc tiep `/app/learn?tab=chat`.
3. Quan sat URL co `tab=chat`.
4. Quan sat body text van la `Lộ trình học tập`, `Day 1`, `Day 2`, khong co chat input.
5. Click `Trợ lý AI`; URL doi sang `/app/chat` va chat render dung.

**NGUYEN NHAN GOC**  
Routing dang co hai co che song song: `TAB_ROUTE.chat = '/app/chat'` trong `frontend/lib/dashboard-routes.ts:6`, trong khi `useQuizSession` van doc `tab` query o `frontend/app/hooks/useQuizSession.ts:262-280`. Dong bo initial URL bi race voi default tab: `setActiveTab(initialTab)` chay theo timeout tai `frontend/app/hooks/useQuizSession.ts:42`, va component chat chi render khi `quiz.hasOpenedChat` true tai `frontend/app/components/dashboard-layout.tsx:288`. Ket qua la query URL co the khong kich hoat dung active tab/chat mount.

**GHI CHU DEV**
1. Chon mot source of truth cho student navigation: route path (`/app/chat`, `/app/profile`) hoac query `?tab=...`, khong dung nua voi behavior khac nhau.
2. Khi pathname/query resolve ra `chat`, set `activeTab='chat'` truoc khi sync URL va dam bao `hasOpenedChat` true.
3. Them regression test cho direct load `/app/chat`, `/app/profile`, `/app/learn?tab=chat`, reload va back/forward.

**ANH CHUNG CU**  
Khong co screenshot vi user chon HEADLESS. Evidence text: URL `/app/learn?tab=chat` nhung body text bat dau bang `Lộ trình học tập...`; sau click UI, URL `/app/chat` va body co `TRỢ LÝ SOCRATIC`, textarea `Nhập câu hỏi cho trợ lý AI`.

### A-02 - MEDIUM - Mobile reload profile hien sai noi dung

**HIEN TUONG**  
Khi dang o flow profile/progress va set viewport 390x844, reload app cho thay URL van o ngu canh profile/query truoc do, nhung noi dung visible la learning path mobile: `Lộ trình học tập`, Day 1-28, Daily Skills. Profile content nhu `Hồ sơ học tập`, skill garden, core stats khong con hien tren mobile sau reload.

**KICH BAN TAI HIEN**
1. Dang nhap.
2. Click tab `Tiến độ`; desktop hien `Hồ sơ học tập`, skill garden, core stats.
3. Set viewport 390x844.
4. Reload trang.
5. Quan sat noi dung hien `Lộ trình học tập` thay vi profile/progress.

**NGUYEN NHAN GOC**  
Cung nhom root cause voi A-01: route state va tab state khong duoc hydrate on-load nhat quan. `getTabForRoute('/app/profile')` co mapping profile tai `frontend/lib/dashboard-routes.ts:8`, nhung effect default tab trong `useQuizSession` va dieu kien render `isStudentWorkspaceTab = learn || skills` trong `frontend/app/components/dashboard-layout.tsx:113` co the dua UI ve learn trong luc URL van la profile/query. Mobile con co duplicate nav/compact surfaces nen loi de thay hon.

**GHI CHU DEV**
1. Viet test responsive reload cho `/app/profile` o viewport 390x844.
2. Dam bao initial route resolution hoan tat truoc khi render default `learn`.
3. Giam duplicate mobile/desktop nav trong DOM neu khong can, hoac dam bao aria/current state ro rang.

**ANH CHUNG CU**  
Khong co screenshot. Evidence text mobile 390x844: URL context sau profile reload nhung visible text bat dau `0 ngày streak`, `Lộ trình học tập`, `Day 1 Text -> Tokens`, khong phai `Hồ sơ học tập`.

### A-03 - MEDIUM - Chatbot khong doc duoc learning path ca nhan

**HIEN TUONG**  
Trong app, learning path visible co Day 8 la `Retrieval`; aria label chi tiet noi `RAG Pipeline - Retrieval — Augmentation — Generation`. Khi hoi chatbot: `Trong lộ trình học của tôi, Day 8 là chủ đề gì?`, chatbot tra loi chung chung rang can kiem tra tai lieu/hướng dẫn học tập, khong neu duoc Day 8.

**KICH BAN TAI HIEN**
1. Dang nhap demo account.
2. Mo learning path, xac nhan Day 8 visible/aria la Retrieval/RAG Pipeline.
3. Mo `Trợ lý AI`.
4. Gui cau hoi `Trong lộ trình học của tôi, Day 8 là chủ đề gì?`.
5. Quan sat chatbot khong tra loi du lieu ca nhan dang co trong UI.

**NGUYEN NHAN GOC**  
Socratic chat co RAG tren hoc lieu, nhung khong co context injection hoac tool/read model cho learning path/profile hien tai cua hoc vien. Chat response chi dua vao retrieved slides; voi cau hoi ca nhan, retrieval khong tim thay nguon va fallback thanh cau tra loi chung chung.

**GHI CHU DEV**
1. Truyen student route context/current curriculum map vao chat request, toi thieu: active course, day map, current profile/mastery.
2. Phan loai intent `student_profile_or_curriculum_lookup` de tra loi tu app state/API thay vi RAG slide-only.
3. Khi khong co context ca nhan, chatbot nen noi ro `mình chưa truy cập được lộ trình cá nhân` thay vi tra loi mo ho.

**ANH CHUNG CU**  
Khong co screenshot. Evidence text: visible UI co `Day 8 Retrieval`; chatbot response: `Trong lộ trình học của bạn, Day 8 thường liên quan... bạn có thể kiểm tra tài liệu hoặc hướng dẫn học tập...`

## A4. Phan he thong hoat dong tot

- Landing page render day du noi dung san pham, FAQ, student/mentor value proposition.
- Login bang credential demo thanh cong, redirect vao `/app`.
- Student tabs `Học tập`, `Luyện tập`, `Trợ lý AI`, `Tiến độ` deu mo duoc qua UI click.
- Console warning/error khong ghi nhan trong cac buoc landing, login, tab switch, chat, profile.
- Chat UI co textarea, send button disabled khi rong, enabled khi co input.
- Chat response co citation panel, reasoning metadata, thoi gian xu ly va confidence.
- Profile/progress desktop hien du skill garden, BKT/Elo, timeline, suggested next actions.

## B1. Phuong phap va nguon doi chieu

Chay 3 hoi thoai that voi chatbot sau khi dang nhap. Ground truth lay tu:

| Nguon doi chieu | Du kien xac minh |
|-----------------|------------------|
| Landing page public | Quiz thich ung dung Elo, BKT va lich su lam bai; mentor co heatmap mastery, nhom can ho tro, RAG audit, concept yeu |
| Student app UI | Day 8 visible/aria la Retrieval / RAG Pipeline - Retrieval - Augmentation - Generation |
| Docs repo | `docs/engineering/system-architecture.md` mo ta adaptive learning gom Elo, BKT, LinUCB, graph propagation, stability days |

## B2. Bang diem accuracy

| KB | Chu de | Ket luan | Ghi chu doi chieu |
|----|--------|----------|-------------------|
| B-1 | Quiz thich ung dung tin hieu nao | MOT PHAN | Dung y chung ve mastery/do kho/feedback nhung bo sot Elo, BKT, lich su lam bai la claim public cua landing |
| B-2 | Tin hieu giup mentor thay gi | MOT PHAN | Giu context cau truoc va noi duoc hoc sinh gap kho, nhung bo sot heatmap mastery, nhom can ho tro, RAG audit, concept dang yeu |
| B-3 | Day 8 trong lo trinh ca nhan | LOI/SAI | UI co Day 8 Retrieval/RAG Pipeline, chatbot khong truy xuat duoc va tra loi chung chung |

## B3. Kich ban hoi thoai

### KICH BAN 1 - MOT PHAN - Adaptive quiz signals

User: `Theo EduGap, quiz thích ứng chọn câu hỏi dựa trên những tín hiệu nào? Trả lời ngắn và nêu nguồn nếu có.`

Bot: `Quiz thích ứng của EduGap chọn câu hỏi dựa trên các tín hiệu như khả năng làm chủ kiến thức của người học, độ khó của câu hỏi, và phản hồi từ người dùng...`

**CHUAN DOI CHIEU**  
Landing public noi EduGap dung `Elo, BKT và lịch sử làm bài` de chon cau hoi gan vung phat trien hien tai. Docs architecture them LinUCB/graph propagation/stability days o backend.

**KET LUAN**  
Mot phan dung ve mastery/do kho, nhung thieu 2 keyword san pham quan trong la Elo va BKT, va citation lay slide Day 4 khong phai nguon product/adaptive architecture gan nhat.

**GHI CHU DEV**  
Can boost/re-rank product ground truth cho cau hoi ve co che EduGap; them synonym mapping `quiz thích ứng` -> adaptive engine/Elo/BKT/ZPD.

### KICH BAN 2 - MOT PHAN - Coreference follow-up ve mentor

User: `Vậy những tín hiệu đó giúp mentor thấy điều gì trong lớp?`

Bot: tra loi mentor thay muc do hieu biet, hoc sinh gap kho, dieu chinh giang day, do kho cau hoi, feedback.

**CHUAN DOI CHIEU**  
Landing noi mentor co `heatmap mastery`, `nhóm học viên cần hỗ trợ`, `RAG audit`, `quiz editor`, `tín hiệu concept đang yếu`.

**KET LUAN**  
Bot giu duoc coreference `những tín hiệu đó`, nhung tra loi generic, khong bam vao cac artifact san pham cu the cua EduGap. Citation bi lech sang slide multi-agent/MCP, khong ro lien quan mentor dashboard.

**GHI CHU DEV**  
Them product feature KB/routing cho cau hoi ve mentor dashboard, uu tien nguon landing/docs product hon slide ky thuat khong lien quan.

### KICH BAN 3 - LOI/SAI - Learning path ca nhan

User: `Trong lộ trình học của tôi, Day 8 là chủ đề gì?`

Bot: `Day 8 thường liên quan đến việc tìm hiểu về các khái niệm và kỹ thuật trong lĩnh vực bạn đang theo học... bạn có thể kiểm tra tài liệu...`

**CHUAN DOI CHIEU**  
UI visible/aria: `Day 8 Retrieval`; aria label chi tiet: `RAG Pipeline - Retrieval — Augmentation — Generation`.

**KET LUAN**  
Sai voi ngu canh app. Chatbot khong co tool/context de doc learning path ca nhan, du thong tin dang co tren cung ung dung.

**GHI CHU DEV**  
Can API/tool context cho user curriculum/profile hoac explicit fallback trung thuc.

## B4. Tong hop phat hien AI/RAG

| Muc | Phat hien | Khuyen nghi dev |
|-----|-----------|-----------------|
| HIGH | Chat khong tra loi duoc cau hoi ca nhan ve learning path | Inject profile/curriculum context hoac tool call |
| HIGH | Retrieval cho cau hoi product/adaptive lech sang slide khong dung ngu canh | Re-rank product docs/landing/docs architecture |
| MEDIUM | Cau tra loi co confidence cao 92% du thieu Elo/BKT | Calibration confidence theo coverage cua ground truth |
| MEDIUM | Citation co nhung khong phai nguon chuan cho claim product | Hien citation source type va uu tien source chinh thuc |

**Diem manh da xac nhan**
- Chat UI hoat dong qua UI click.
- Bot co response metadata, citation panel, thoi gian xu ly.
- Bot giu duoc context follow-up o muc ngon ngu trong kich ban 2.

**Diem yeu cot loi**
- Retrieval khong gan voi ground truth san pham.
- Chat khong co context ca nhan cua hoc vien.
- Confidence cao trong cau tra loi thieu du kien quan trong.

## Khuyen nghi uu tien

1. Sua routing/deep-link cho `/app/chat`, `/app/profile` va `?tab=...`; day la loi anh huong share link, reload, mobile va browser back/forward.
2. Them regression tests Playwright cho direct load, reload va mobile viewport 390x844.
3. Noi Socratic chat voi context profile/curriculum cua user hoac tra loi fallback trung thuc khi khong co access.
4. Cai thien RAG routing cho cau hoi product/adaptive: query rewrite, source priority, re-rank, va confidence calibration.
5. Neu tiep tuc QA lan sau, chay SCREENSHOT mode de tao bug card co anh evidence day du.

## Cleanup

- Khong tao/xoa record hoc tap hay submit quiz.
- Co gui 3 tin nhan chat test vao tai khoan demo; day la thao tac safe theo scope QA chatbot.
- Da tim control logout trong profile nhung khong thay nut logout ro rang trong pham vi headless. Session browser co the van dang dang nhap.
- Khong co screenshot folder vi mode HEADLESS.

## Addendum 2026-07-06 - Fix verification

Da xu ly cac finding uu tien cao trong worktree hien tai theo plan
`plans/20260706-1505-student-routing-chat-context-fix/`.

**Finding da resolve**

- A-01 HIGH: `/app/chat` va legacy query `?tab=chat` hien thi dung chat tab, khong bi fallback ve learning path.
- A-02 MEDIUM: reload `/app/profile` trong viewport mobile/responsive giu dung man hinh ho so.
- A-03 MEDIUM: cau hoi `Trong lộ trình học của tôi, Day 8 là chủ đề gì?` duoc tra loi tu curriculum context trong app; ket qua verify tra ve `Day 8 là RAG Pipelines & Hybrid Search`.
- B-1 MOT PHAN: cau hoi ve quiz thich ung tra loi du `Elo`, `BKT`, `Lịch sử làm bài`, kem nguon product/docs.
- B-2 MOT PHAN: follow-up ve mentor tra loi du `Heatmap mastery`, `Nhóm học viên cần hỗ trợ`, `Concept đang yếu`, `RAG audit` va quiz editor.

**Diem sau fix tren pham vi retest**

| Truc | Diem sau fix | Bang chung |
|------|--------------|------------|
| PHAN A - QA he thong | 100/100 | A-01, A-02, A-03 deu pass trong browser smoke test local |
| PHAN B - Do chinh xac chatbot | 10/10 | 3/3 kich ban chatbot retest tra loi dung ground truth |

**Bang chung verify**

- `pnpm lint` trong `frontend`: pass.
- `pnpm exec tsc --noEmit --pretty false` trong `frontend`: pass.
- `pnpm build` trong `frontend`: pass.
- Browser local demo mode (`NEXT_PUBLIC_DEMO_MODE=true`, `http://localhost:3002`):
  - `/app/chat`: co chat input, khong hien learning path.
  - `/app/learn?tab=chat`: co chat input, khong hien learning path.
  - `/app/profile`: hien `HỒ SƠ HỌC TẬP`, khong hien learning path; reload van giu profile.
  - Chat adaptive quiz signals tra loi du Elo/BKT/lich su lam bai.
  - Chat mentor follow-up tra loi du heatmap mastery/RAG audit/concept yeu.
  - Chat Day 8 tra loi dung chu de `RAG Pipelines & Hybrid Search`.

**Rui ro con lai**

- Product-context guardrail hien xu ly cac intent QA da phat hien; neu mo rong cau hoi san pham khac, nen dua ground truth product vao backend retriever/reranker thay vi chi xu ly frontend.
- Local login thu nghiem dung demo mode vi backend local khong san sang; profile API local tra 503 nhung UI fallback van render. Production/staging nen duoc smoke test lai sau khi deploy.
