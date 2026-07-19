"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpenText,
  Books,
  ChartBar,
  ChatCircleDots,
  CheckCircle,
  Graph,
  PaperPlaneTilt,
  Plus,
  Sparkle,
  Target,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react";

// Teacher workspace view state.
type TeacherSection =
  | "dashboard"
  | "classes"
  | "analytics"
  | "content"
  | "quiz"
  | "assignments"
  | "grading"
  | "knowledge"
  | "rag"
  | "assistant"
  | "settings";

const teacherSections: Array<{ id: TeacherSection; label: string; description: string; icon: typeof ChartBar }> = [
  { id: "dashboard", label: "Dashboard", description: "Tổng quan lớp", icon: ChartBar },
  { id: "classes", label: "Lớp & học sinh", description: "Hồ sơ và lịch sử làm bài", icon: UsersThree },
  { id: "analytics", label: "Phân tích học tập", description: "Điểm, kỹ năng, lỗi phổ biến", icon: Trophy },
  { id: "content", label: "Nội dung ôn tập", description: "Chương, bài học, tài liệu", icon: Books },
  { id: "quiz", label: "Ngân hàng câu hỏi", description: "Tạo và quản lý câu hỏi", icon: BookOpenText },
  { id: "assignments", label: "Giao bài", description: "Lịch học và hạn nộp", icon: Target },
  { id: "grading", label: "Chấm & phản hồi", description: "4 bài đang chờ chấm", icon: CheckCircle },
  { id: "knowledge", label: "Nguồn tài liệu AI", description: "Tài liệu AI học từ", icon: Graph },
  { id: "rag", label: "Duyệt câu trả lời AI", description: "3 nội dung cần duyệt", icon: Sparkle },
  { id: "assistant", label: "Hỏi insight lớp", description: "Trợ lý theo dữ liệu lớp", icon: ChatCircleDots },
  { id: "settings", label: "Hồ sơ & cài đặt", description: "Môn, lớp và bảo mật", icon: UsersThree },
];

const teacherNavGroups: Array<{ label: string; isFooter?: boolean; items: Array<{ id: TeacherSection; badge?: number; tone?: "alert" | "queue" }> }> = [
  { label: "Tổng quan", items: [{ id: "dashboard", badge: 2, tone: "alert" }] },
  { label: "Lớp học", items: [{ id: "classes" }, { id: "analytics" }] },
  { label: "Giảng dạy", items: [{ id: "content" }, { id: "quiz" }, { id: "assignments" }, { id: "grading", badge: 4, tone: "queue" }] },
  { label: "Trợ lý AI", items: [{ id: "assistant" }, { id: "rag", badge: 3, tone: "queue" }, { id: "knowledge" }] },
  { label: "Hồ sơ & cài đặt", isFooter: true, items: [{ id: "settings" }] },
];

const classes = [
  { id: "6A", name: "Lớp 6A", subject: "Toán học", students: 34, completion: 72, average: 8.1, risk: 5 },
  { id: "6B", name: "Lớp 6B", subject: "Toán học", students: 31, completion: 64, average: 7.4, risk: 8 },
];

const students = [
  { name: "Minh Anh", status: "Ổn định", mastery: 88, last: "Hoàn thành Quy đồng mẫu", flag: "strong" },
  { name: "Hoàng Nam", status: "Cần hỗ trợ", mastery: 61, last: "Sai dạng rút gọn phân số", flag: "risk" },
  { name: "Bảo Trân", status: "Tăng tốc", mastery: 76, last: "Luyện tập cộng trừ phân số", flag: "good" },
  { name: "Gia Huy", status: "Tụt tiến độ", mastery: 48, last: "Bỏ lỡ bài kiểm tra ngắn", flag: "risk" },
];

const upcoming = [
  { title: "Quiz phân số", due: "Thứ 3", scope: "6A · toàn lớp", status: "Đã lên lịch" },
  { title: "Ôn tập phép tính số tự nhiên", due: "Thứ 5", scope: "Nhóm cần hỗ trợ", status: "Nháp" },
  { title: "Bài tự luận vận dụng", due: "Thứ 6", scope: "6B · cá nhân hóa", status: "Cần duyệt" },
];

const weakSkills = [
  { label: "Quy đồng mẫu", value: 62 },
  { label: "Rút gọn phân số", value: 54 },
  { label: "Vận dụng thực tế", value: 47 },
  { label: "Tốc độ làm bài", value: 69 },
];

const contentItems = [
  { title: "Chương: Phân số", meta: "5 bài học · 3 mức độ khó · mở khóa tuần này" },
  { title: "Tài liệu: Quy đồng và so sánh", meta: "Đã gắn 8 kỹ năng · dùng cho AI tutor" },
  { title: "Bài tập: Vận dụng phân số", meta: "24 câu · 3 mức độ khó" },
];

const reviewItems = [
  { question: "Vì sao phải rút gọn phân số?", source: "Tài liệu Phân số · trang 4", quality: "Đúng nguồn" },
  { question: "Cách so sánh hai phân số?", source: "Manifest chương 6 · node 04", quality: "Cần sửa ví dụ" },
  { question: "Tóm tắt lỗi lớp 6B", source: "Lịch sử làm bài 7 ngày", quality: "Tốt" },
];

export default function TeacherWorkspace() {
  const [activeSection, setActiveSection] = useState<TeacherSection>("dashboard");
  const [selectedClassId, setSelectedClassId] = useState("6A");
  const currentClass = useMemo(() => classes.find((item) => item.id === selectedClassId) || classes[0], [selectedClassId]);
  const section = teacherSections.find((item) => item.id === activeSection) || teacherSections[0];

  return (
    <main className="teacher-shell">
      <aside className="teacher-sidebar">
        <Link className="brand teacher-brand" href="/giao-vien"><span className="brand-symbol">OL</span><span>Teacher</span></Link>
        <nav aria-label="Chức năng giảng viên">
          {teacherNavGroups.map((group) => (
            <section className={`teacher-nav-group${group.isFooter ? " is-footer" : ""}`} key={group.label}>
              <p>{group.label}</p>
              {group.items.map((navItem) => {
                const item = teacherSections.find((sectionItem) => sectionItem.id === navItem.id);
                if (!item) return null;
                const Icon = item.icon;
                return <button className={item.id === activeSection ? "active" : ""} key={item.id} onClick={() => setActiveSection(item.id)} type="button">
                  <Icon size={18} weight={item.id === activeSection ? "fill" : "regular"} />
                  <span><strong>{item.label}</strong><small>{item.description}</small></span>
                  {navItem.badge && <b className={`teacher-nav-badge ${navItem.tone ?? ""}`}>{navItem.badge}</b>}
                </button>;
              })}
            </section>
          ))}
        </nav>
      </aside>

      <section className="teacher-main">
        <header className="teacher-header">
          <div>
            <span className="overline">Giảng viên · {currentClass.subject}</span>
            <h1>{section.label}</h1>
            <p>Chọn lớp, nhận diện nhóm cần hỗ trợ và giao đúng hoạt động tiếp theo.</p>
          </div>
          <div className="teacher-header-actions">
            <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} aria-label="Chọn lớp">
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.subject}</option>)}
            </select>
            <Link className="teacher-profile-chip" href="/auth"><span>NP</span><strong>Nguyễn Phương Nam</strong></Link>
            <Link className="logout-action teacher-logout" href="/dang-xuat">Đăng xuất</Link>
          </div>
        </header>

        {activeSection === "dashboard" && <TeacherDashboard currentClass={currentClass} />}

        {activeSection === "classes" && (
          <TwoColumnPage
            leftTitle="Danh sách lớp"
            left={<StackList items={classes.map((item) => ({ title: item.name, meta: `${item.students} học sinh · ${item.subject}`, tag: `${item.completion}%` }))} />}
            rightTitle="Hồ sơ học sinh"
            right={<StudentTable />}
          />
        )}

        {activeSection === "analytics" && (
          <TwoColumnPage
            leftTitle="Mức độ thông hiểu theo kỹ năng"
            left={<><TeacherScoreSplit /><SkillBars /></>}
            rightTitle="Lỗi phổ biến và nguy cơ tụt tiến độ"
            right={<StackList items={weakSkills.map((item) => ({ title: item.label, meta: `${item.value}% thông hiểu · cần bài luyện bổ sung`, tag: item.value < 60 ? "Rủi ro" : "Theo dõi" }))} />}
          />
        )}

        {activeSection === "content" && (
          <TwoColumnPage
            leftTitle="Quản lý nội dung"
            left={<StackList items={contentItems.map((item) => ({ title: item.title, meta: item.meta, tag: "Đang dùng" }))} />}
            rightTitle="Điều kiện mở khóa"
            right={<WorkflowCards labels={["Hoàn thành bài học", "Đạt quiz 70%", "Mở kỹ năng kế tiếp", "Gợi ý ôn tập"]} />}
          />
        )}

        {activeSection === "quiz" && (
          <TwoColumnPage
            leftTitle="Quiz editor"
            left={<><TeacherExamWorkflow /><EditorMock /></>}
            rightTitle="Ngân hàng câu hỏi"
            right={<StackList items={["Nhận biết phân số", "Quy đồng mẫu", "Cộng trừ phân số", "Vận dụng thực tế"].map((title, index) => ({ title, meta: `${18 + index * 6} câu · ${index + 1} mức độ`, tag: index === 1 ? "Đang sửa" : "Sẵn sàng" }))} />}
          />
        )}

        {activeSection === "assignments" && <TeacherAssignmentBoard currentClass={currentClass} />}

        {activeSection === "grading" && (
          <TwoColumnPage
            leftTitle="Chấm và phản hồi"
            left={<StackList items={students.map((item) => ({ title: item.name, meta: item.last, tag: item.status }))} />}
            rightTitle="Mẫu nhận xét"
            right={<><TeacherAiReport /><FeedbackMock /></>}
          />
        )}

        {activeSection === "knowledge" && (
          <TwoColumnPage
            leftTitle="Knowledge graph / tài liệu"
            left={<StackList items={contentItems.map((item) => ({ title: item.title, meta: item.meta, tag: "Indexed" }))} />}
            rightTitle="Trạng thái xử lý"
            right={<WorkflowCards labels={["Upload tài liệu", "Tách chủ đề", "Gắn skill node", "Dùng làm nguồn AI"]} />}
          />
        )}

        {activeSection === "rag" && (
          <TwoColumnPage
            leftTitle="RAG/AI review"
            left={<><TeacherRiskBoard /><StackList items={reviewItems.map((item) => ({ title: item.question, meta: item.source, tag: item.quality }))} /></>}
            rightTitle="Đánh dấu chất lượng"
            right={<FeedbackMock />}
          />
        )}

        {activeSection === "assistant" && (
          <section className="teacher-panel teacher-chat-page">
            <PanelTitle title="Chatbot giảng viên" action="Tạo đề luyện" />
            <div className="teacher-chat-layout">
              <div className="teacher-chat-thread">
                <p className="bot">Lớp {currentClass.name} đang yếu nhất ở Quy đồng mẫu và Vận dụng thực tế. Mình gợi ý tạo một bài luyện 12 câu cho nhóm {currentClass.risk} học sinh cần hỗ trợ.</p>
                <p className="user">Tạo giúp tôi kế hoạch ôn tập 20 phút.</p>
                <p className="bot">Gợi ý: 5 phút nhắc lại mẫu chung, 10 phút bài phân tầng, 5 phút chữa lỗi sai phổ biến.</p>
              </div>
              <form className="teacher-chat-input">
                <input placeholder="Hỏi về tình hình lớp, tạo đề luyện, tóm tắt lỗi phổ biến..." />
                <button type="button"><PaperPlaneTilt size={18} weight="fill" /></button>
              </form>
            </div>
          </section>
        )}

        {activeSection === "settings" && (
          <TwoColumnPage
            leftTitle="Hồ sơ giảng viên"
            left={<StackList items={[{ title: "Nguyễn Phương Nam", meta: "Toán học · Lớp 7A, 7B", tag: "Giảng viên" }, { title: "Thông báo", meta: "Nhắc hạn nộp, lớp có rủi ro, RAG cần duyệt", tag: "Bật" }, { title: "Bảo mật", meta: "Mật khẩu, thiết bị, quyền riêng tư", tag: "Ổn định" }]} />}
            rightTitle="Quyền truy cập"
            right={<WorkflowCards labels={["Quản lý lớp phụ trách", "Duyệt nội dung AI", "Xuất báo cáo", "Ẩn dữ liệu nhạy cảm"]} />}
          />
        )}
      </section>
    </main>
  );
}

type AssignmentKind = "chapter" | "midterm" | "final";

function TeacherAssignmentBoard({ currentClass }: { currentClass: (typeof classes)[number] }) {
  const [kind, setKind] = useState<AssignmentKind>("chapter");
  const [chapter, setChapter] = useState("Phân số và số hữu tỉ");
  const [published, setPublished] = useState(false);

  const plans: Record<
    AssignmentKind,
    {
      label: string;
      description: string;
      title: string;
      duration: string;
      coverage: string;
      followUp: string;
    }
  > = {
    chapter: {
      label: "Ôn luyện theo chương",
      description: "Củng cố kiến thức của một chương đang học trước khi chuyển sang nội dung mới.",
      title: "Luyện chương: " + chapter,
      duration: "12 câu · 35 phút",
      coverage: "Khái niệm, dạng bài trọng tâm và bài vận dụng của chương đã chọn.",
      followUp: "Sau khi nộp, học sinh nhận đề luyện lại với các câu đã sai và câu cùng dạng.",
    },
    midterm: {
      label: "Ôn tập giữa kỳ",
      description: "Đề tổng hợp các chương đã học trong nửa đầu học kỳ.",
      title: "Đề ôn tập giữa kỳ I",
      duration: "16 câu · 45 phút",
      coverage: "Chương 1 - 2, phân bổ theo ma trận giữa kỳ và mức độ nhận biết đến vận dụng.",
      followUp: "AI tổng hợp điểm mạnh, điểm yếu và gợi ý lộ trình ôn tập sau khi chấm.",
    },
    final: {
      label: "Ôn tập cuối kỳ",
      description: "Đề tổng hợp toàn bộ kiến thức học kỳ để học sinh tự đánh giá trước kỳ thi.",
      title: "Đề ôn tập cuối kỳ I",
      duration: "20 câu · 60 phút",
      coverage: "Toàn bộ chương trong học kỳ, có phần câu hỏi vận dụng và phân hóa.",
      followUp: "Mỗi lỗi sai sẽ được đưa vào đề con để học sinh luyện lại cho đến khi đạt chuẩn.",
    },
  };
  const plan = plans[kind];

  return (
    <div className="teacher-assignment-board">
      <section className="teacher-assignment-intro">
        <div>
          <p>GIAO ĐỀ ÔN TẬP</p>
          <h2>Chọn đúng mục tiêu trước khi giao bài</h2>
          <span>Đề theo chương phục vụ luyện nền tảng; đề giữa kỳ và cuối kỳ giúp học sinh làm quen với phạm vi kiểm tra thực tế.</span>
        </div>
        <div className="teacher-assignment-tabs" role="tablist" aria-label="Loại đề cần giao">
          {(Object.keys(plans) as AssignmentKind[]).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={kind === item}
              className={kind === item ? "is-active" : ""}
              onClick={() => {
                setKind(item);
                setPublished(false);
              }}
            >
              {plans[item].label}
            </button>
          ))}
        </div>
      </section>

      <div className="teacher-assignment-grid">
        <section className="teacher-assignment-config">
          <div className="teacher-assignment-heading">
            <div>
              <p>THIẾT LẬP</p>
              <h3>{plan.label}</h3>
            </div>
            <span>{plan.duration}</span>
          </div>

          <label>
            Lớp nhận đề
            <select defaultValue={currentClass.name}>
              <option>{currentClass.name}</option>
              <option>8B</option>
              <option>8C</option>
            </select>
          </label>

          {kind === "chapter" && (
            <label>
              Chương ôn luyện
              <select value={chapter} onChange={(event) => setChapter(event.target.value)}>
                <option>Phân số và số hữu tỉ</option>
                <option>Tỉ lệ thức</option>
                <option>Biểu thức đại số</option>
              </select>
            </label>
          )}

          <label>
            Mức độ đề
            <select defaultValue="Theo ma trận ôn tập">
              <option>Theo ma trận ôn tập</option>
              <option>Củng cố kiến thức cơ bản</option>
              <option>Tăng cường câu vận dụng</option>
            </select>
          </label>

          <label>
            Hạn nộp bài
            <input type="date" defaultValue="2026-07-25" />
          </label>

          <button className="teacher-assignment-submit" type="button" onClick={() => setPublished(true)}>
            Giao đề cho lớp <ArrowRight size={18} weight="bold" />
          </button>
          {published && <p className="teacher-assignment-confirmation" aria-live="polite">{"Đề đã được lên lịch giao cho " + currentClass.name + ". Học sinh sẽ nhận được nhắc nhở trong không gian ôn thi."}</p>}
        </section>

        <aside className="teacher-assignment-preview">
          <p>BẢN XEM TRƯỚC</p>
          <h3>{plan.title}</h3>
          <span>{plan.description}</span>
          <dl>
            <div><dt>Cấu trúc</dt><dd>{plan.duration}</dd></div>
            <div><dt>Phạm vi</dt><dd>{plan.coverage}</dd></div>
            <div><dt>Sau khi chấm</dt><dd>{plan.followUp}</dd></div>
          </dl>
          <div className="teacher-assignment-preview-note">
            <strong>AI chấm và phản hồi</strong>
            <span>Học sinh xem đáp án, lời giải từng câu và nhận lộ trình ôn tập cá nhân ngay sau khi có kết quả.</span>
          </div>
        </aside>
      </div>

      <section className="teacher-assignment-history">
        <div>
          <p>ĐÃ LÊN LỊCH</p>
          <h3>Đề đang theo dõi</h3>
        </div>
        <div className="teacher-assignment-history-list">
          {upcoming.map((item) => (
            <article key={item.title}>
              <span>{item.scope}</span>
              <strong>{item.title}</strong>
              <small>Hạn {item.due}</small>
              <b>{item.status}</b>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeacherDashboard({ currentClass }: { currentClass: (typeof classes)[number] }) {
  const [criterion, setCriterion] = useState("progress");
  const [intervention, setIntervention] = useState<"none" | "group" | "individual">("none");
  const roster = [
    { name: "Minh Anh", initials: "MA", progress: 88, practice: 8.9, mock: 8.4, change: 15, weak: "Bài toán có lời văn", trend: "Tăng đều ở ba lượt gần nhất" },
    { name: "Bảo Trân", initials: "BT", progress: 76, practice: 8.1, mock: 7.5, change: 9, weak: "Rút gọn phân số", trend: "Ổn định sau bài luyện có gợi ý" },
    { name: "Hoàng Nam", initials: "HN", progress: 61, practice: 6.5, mock: 5.8, change: -18, weak: "Quy đồng mẫu số", trend: "Tụt 18% so với tuần trước" },
    { name: "Gia Huy", initials: "GH", progress: 48, practice: 5.9, mock: 5.2, change: -12, weak: "Cộng trừ phân số", trend: "Bỏ lỡ bài kiểm tra ngắn" },
  ];
  const leaderboard = [...roster].sort((left, right) => {
    const key = criterion === "practice" ? "practice" : criterion === "mock" ? "mock" : criterion === "change" ? "change" : "progress";
    return right[key] - left[key];
  });
  const retakeProgress = [
    { student: "Hoàng Nam", first: "5,8", retryOne: "6,0", retryTwo: "6,1", change: "+0,3", status: "Chưa cải thiện" },
    { student: "Gia Huy", first: "5,2", retryOne: "5,0", retryTwo: "5,4", change: "+0,2", status: "Chưa cải thiện" },
    { student: "Bảo Trân", first: "6,7", retryOne: "7,5", retryTwo: "8,1", change: "+1,4", status: "Tiến bộ tốt" },
    { student: "Minh Anh", first: "7,4", retryOne: "8,2", retryTwo: "8,9", change: "+1,5", status: "Tiến bộ tốt" },
  ];

  return <div className="teacher-command-center">
    <section className="teacher-class-summary">
      <div className="teacher-summary-primary"><span className="overline">Lớp đang theo dõi</span><strong>{currentClass.name}</strong><p>{currentClass.completion}% lộ trình đã hoàn thành</p><span className="teacher-summary-progress"><i style={{ width: `${currentClass.completion}%` }} /></span></div>
      <div className="teacher-summary-metric"><span>Điểm ôn tập</span><strong>7,8</strong><small>+0,6 điểm trong 4 tuần</small></div>
      <div className="teacher-summary-metric"><span>Điểm thi thử</span><strong>7,1</strong><small>+0,8 điểm trong 4 tuần</small></div>
      <div className="teacher-summary-metric risk"><span>Nguy cơ cao</span><strong>2</strong><small>cần can thiệp trong tuần</small></div>
    </section>

    <div className="teacher-command-grid">
      <section className="teacher-panel teacher-performance-panel">
        <div className="teacher-panel-title"><div><span className="overline">Ưu tiên xử lý</span><h2>Học sinh cần hỗ trợ</h2><p>Hành động ngay tại dòng dữ liệu, không cần chuyển sang màn khác.</p></div><button type="button" onClick={() => setIntervention("group")}>Tạo nhóm ôn tập</button></div>
        <div className="teacher-performance-head"><span>Học sinh</span><span>Thay đổi</span><span>Điểm gần nhất</span><span>Trọng tâm</span><span /></div>
        {roster.filter((student) => student.change < 0).map((student) => <article className="teacher-performance-row" key={student.name}><div className="teacher-student-cell"><span className="teacher-avatar">{student.initials}</span><span><strong>{student.name}</strong><small>{student.trend}</small></span></div><b className="teacher-negative">{student.change}%</b><span>{student.practice.toFixed(1)} ôn tập · {student.mock.toFixed(1)} thi thử</span><span>{student.weak}</span><button type="button" onClick={() => setIntervention("individual")}>Giao bài riêng</button></article>)}
        <div className="teacher-performance-footer"><span>{intervention === "none" ? "Chưa có can thiệp nào được tạo trong phiên này." : intervention === "group" ? "Nhóm ôn tập đã được tạo cho 2 học sinh nguy cơ cao." : "Bài riêng đã được giao theo lỗi sai gần nhất."}</span><button type="button">Xem toàn bộ học sinh <ArrowRight size={15} weight="bold" /></button></div>
      </section>

      <aside className="teacher-insight-stack">
        <section className="teacher-panel teacher-ai-improvement"><div className="teacher-panel-title"><div><span className="overline">Báo cáo AI</span><h2>Mức độ cải thiện</h2></div><Sparkle size={19} weight="fill" /></div><article><span className="teacher-avatar">MA</span><div><strong>Minh Anh <b className="teacher-positive">+15%</b></strong><p>Đã ổn định quy đồng; chuyển sang bài toán vận dụng.</p></div></article><article className="decline"><span className="teacher-avatar">HN</span><div><strong>Hoàng Nam <b className="teacher-negative">-18%</b></strong><p>Lỗi rút gọn lặp lại sau phép cộng phân số.</p></div></article><button type="button">Mở báo cáo AI đầy đủ <ArrowRight size={15} weight="bold" /></button></section>

        <section className="teacher-panel teacher-filtered-ranking"><div className="teacher-panel-title"><div><span className="overline">So sánh trong lớp</span><h2>Bảng xếp hạng</h2></div><select value={criterion} onChange={(event) => setCriterion(event.target.value)} aria-label="Lọc bảng xếp hạng"><option value="progress">Tiến độ</option><option value="practice">Điểm ôn tập</option><option value="mock">Điểm thi thử</option><option value="change">Mức cải thiện</option></select></div><div>{leaderboard.slice(0, 3).map((student, index) => <article key={student.name}><b>{index + 1}</b><span className="teacher-avatar">{student.initials}</span><strong>{student.name}</strong><em>{criterion === "practice" ? student.practice.toFixed(1) : criterion === "mock" ? student.mock.toFixed(1) : criterion === "change" ? `${student.change > 0 ? "+" : ""}${student.change}%` : `${student.progress}%`}</em></article>)}</div></section>
      </aside>
    </div>

    <section className="teacher-dashboard-data-grid" aria-label="Bảng theo dõi kết quả học tập">
      <section className="teacher-panel teacher-score-register">
        <div className="teacher-panel-title">
          <div><span className="overline">Bảng điểm theo loại bài</span><h2>Ôn luyện và kiểm tra</h2><p>So sánh điểm gần nhất của từng học sinh trước khi giao bài tiếp theo.</p></div>
          <span className="teacher-table-label">4 học sinh</span>
        </div>
        <div className="teacher-table-scroll">
          <table>
            <thead><tr><th>Học sinh</th><th>Ôn luyện</th><th>Kiểm tra</th><th>Thay đổi</th></tr></thead>
            <tbody>
              {roster.map((student) => (
                <tr key={student.name}>
                  <td><span className="teacher-table-student"><i>{student.initials}</i>{student.name}</span></td>
                  <td>{student.practice.toFixed(1)}</td>
                  <td>{student.mock.toFixed(1)}</td>
                  <td className={student.change >= 0 ? "teacher-positive" : "teacher-negative"}>{(student.change > 0 ? "+" : "") + student.change + "%"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="teacher-panel teacher-retake-register">
        <div className="teacher-panel-title">
          <div><span className="overline">Theo dõi sau mỗi lần làm lại</span><h2>Mức độ cải thiện đề kiểm tra</h2><p>Ưu tiên xu hướng qua từng lượt thay vì chỉ nhìn một điểm số.</p></div>
          <span className="teacher-table-label">3 lượt gần nhất</span>
        </div>
        <div className="teacher-table-scroll">
          <table>
            <thead><tr><th>Học sinh</th><th>Đề gốc</th><th>Lần 1</th><th>Lần 2</th><th>Tổng</th></tr></thead>
            <tbody>
              {retakeProgress.map((student) => (
                <tr key={student.student}>
                  <td>{student.student}<small>{student.status}</small></td>
                  <td>{student.first}</td>
                  <td>{student.retryOne}</td>
                  <td>{student.retryTwo}</td>
                  <td className={student.status === "Tiến bộ tốt" ? "teacher-positive" : "teacher-negative"}>{student.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section className="teacher-panel teacher-no-progress-panel">
      <div className="teacher-panel-title">
        <div><span className="overline">Cảnh báo cần xử lý</span><h2>Học sinh chưa có cải thiện rõ sau khi làm lại</h2><p>Hai học sinh vẫn dưới mức tiến bộ tối thiểu sau hai đề con. Nên giao bài ngắn theo đúng lỗi sai thay vì lặp lại đề tổng hợp.</p></div>
        <button type="button" onClick={() => setIntervention("group")}>Tạo nhóm ôn tập <ArrowRight size={15} weight="bold" /></button>
      </div>
      <div className="teacher-no-progress-list">
        {retakeProgress.filter((student) => student.status === "Chưa cải thiện").map((student) => (
          <article key={student.student}>
            <span className="teacher-avatar">{student.student.split(" ").map((part) => part[0]).join("")}</span>
            <div><strong>{student.student}</strong><small>{student.first} → {student.retryOne} → {student.retryTwo} · chỉ tăng {student.change} sau 2 lần làm lại</small></div>
            <button type="button" onClick={() => setIntervention("individual")}>Giao bài riêng</button>
          </article>
        ))}
      </div>
    </section>
  </div>;
}

function TeacherExamSnapshot() {
  return (
    <section className="teacher-panel teacher-exam-snapshot">
      <div><span className="overline">Ôn tập và thi thử</span><h2>Điểm cần được nhìn theo hai đường riêng</h2><p>Ôn tập 7,8/10 · Thi thử 7,1/10 · 6 học sinh đang có tiến bộ rõ rệt.</p></div>
      <div className="teacher-snapshot-actions"><button type="button">Xem điểm ôn tập</button><button type="button">Xem điểm thi thử</button></div>
    </section>
  );
}

function TeacherScoreSplit() {
  return <div className="teacher-score-split"><div><span>Điểm ôn tập</span><strong>7,8</strong><small>+0,6 điểm trong 4 tuần</small></div><div><span>Điểm thi thử</span><strong>7,1</strong><small>+0,8 điểm trong 4 tuần</small></div><p>82% học sinh đã có ít nhất một lượt làm đề.</p></div>;
}

function TeacherExamWorkflow() {
  return <div className="teacher-exam-workflow"><span className="overline">AI tạo sinh đề</span><strong>Đề chính → chấm AI → đề con theo lỗi sai</strong><p>Đề con tập trung vào câu sai và các dạng bài liên quan, sẵn sàng giao sau khi học sinh nộp bài.</p><button type="button">Tạo đề ôn giữa kỳ <ArrowRight size={15} weight="bold" /></button></div>;
}

function TeacherAiReport() {
  return <div className="teacher-ai-report"><span className="overline">Báo cáo cải thiện AI</span><strong>Hoàng Nam: +8 điểm sau 3 lượt ôn tập</strong><p>Đã hiểu quy tắc quy đồng, nhưng vẫn mất điểm ở bước rút gọn cuối.</p><button type="button">Mở lộ trình đề xuất <ArrowRight size={15} weight="bold" /></button></div>;
}

function TeacherRiskBoard() {
  return <div className="teacher-risk-board"><span className="overline">Cảnh báo sớm</span><strong>2 học sinh cần can thiệp trong tuần này</strong><p>Độ đều học tập thấp và điểm thi thử chưa cải thiện sau ba lượt làm bài.</p><button type="button">Giao lộ trình củng cố <ArrowRight size={15} weight="bold" /></button></div>;
}

function TeacherLeaderboard() {
  return <section className="teacher-panel teacher-leaderboard"><div className="teacher-panel-title"><div><h2>Bảng xếp hạng lớp</h2><p>Lọc theo tiến độ, điểm ôn tập, điểm thi thử hoặc mức cải thiện.</p></div><select defaultValue="Tiến độ" aria-label="Tiêu chí xếp hạng"><option>Tiến độ</option><option>Điểm ôn tập</option><option>Điểm thi thử</option><option>Mức cải thiện</option></select></div><div className="teacher-rank-list"><article><b>1</b><strong>Minh Anh</strong><span>82% tiến độ</span></article><article><b>2</b><strong>Bảo Trân</strong><span>76% tiến độ</span></article><article><b>3</b><strong>Hoàng Nam</strong><span>61% tiến độ</span></article></div></section>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "neutral" | "good" | "risk" }) {
  return <article className={`teacher-panel teacher-metric ${tone}`}><span>{label}</span><strong>{value}</strong></article>;
}

function PanelTitle({ title, action }: { title: string; action: string }) {
  return <div className="teacher-panel-title"><h2>{title}</h2><button type="button"><Plus size={15} />{action}</button></div>;
}

function TwoColumnPage({ leftTitle, left, rightTitle, right }: { leftTitle: string; left: ReactNode; rightTitle: string; right: ReactNode }) {
  return (
    <div className="teacher-two-column">
      <section className="teacher-panel">
        <PanelTitle title={leftTitle} action="Thêm mới" />
        {left}
      </section>
      <section className="teacher-panel">
        <PanelTitle title={rightTitle} action="Xem tất cả" />
        {right}
      </section>
    </div>
  );
}

function StudentTable() {
  return (
    <div className="teacher-table">
      {students.map((student) => (
        <div className={student.flag} key={student.name}>
          <strong>{student.name}</strong>
          <span>{student.last}</span>
          <b>{student.mastery}%</b>
          <em>{student.status}</em>
        </div>
      ))}
    </div>
  );
}

function StackList({ items }: { items: Array<{ title: string; meta: string; tag: string }> }) {
  return <div className="teacher-stack-list">{items.map((item) => <article key={`${item.title}-${item.tag}`}><div><strong>{item.title}</strong><span>{item.meta}</span></div><em>{item.tag}</em></article>)}</div>;
}

function SkillBars() {
  return <div className="teacher-skill-bars">{weakSkills.map((skill) => <div key={skill.label}><span>{skill.label}<b>{skill.value}%</b></span><div><i style={{ width: `${skill.value}%` }} /></div></div>)}</div>;
}

function WorkflowCards({ labels }: { labels: string[] }) {
  return <div className="teacher-workflow">{labels.map((label, index) => <article key={label}><span>{index + 1}</span><strong>{label}</strong></article>)}</div>;
}

function EditorMock() {
  return (
    <div className="teacher-editor-mock">
      <label>Tiêu đề quiz<input defaultValue="Quiz phân số - mức cơ bản" /></label>
      <div className="form-row"><label>Thời gian<select defaultValue="20"><option>15</option><option>20</option><option>30</option></select></label><label>Tiêu chí đạt<select defaultValue="70"><option>60%</option><option>70%</option><option>80%</option></select></label></div>
      <article><strong>Câu 1</strong><span>Rút gọn phân số 12/18. Độ khó: dễ · đáp án: 2/3</span></article>
    </div>
  );
}

function FeedbackMock() {
  return (
    <div className="teacher-feedback-mock">
      <textarea defaultValue="Em đã hiểu hướng làm, nhưng cần trình bày rõ bước quy đồng mẫu trước khi cộng hai phân số." />
      <div><button type="button">Gửi cá nhân</button><button type="button">Gửi cả lớp</button></div>
    </div>
  );
}
