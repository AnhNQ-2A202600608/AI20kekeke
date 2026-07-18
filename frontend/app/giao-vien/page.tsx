"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
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
  { id: "dashboard", label: "Dashboard lớp", description: "Tổng quan tiến độ", icon: ChartBar },
  { id: "classes", label: "Lớp & học sinh", description: "Hồ sơ, lịch sử làm bài", icon: UsersThree },
  { id: "analytics", label: "Phân tích học tập", description: "Điểm, kỹ năng, lỗi phổ biến", icon: Trophy },
  { id: "content", label: "Nội dung", description: "Chương, bài học, tài liệu", icon: Books },
  { id: "quiz", label: "Quiz editor", description: "Ngân hàng câu hỏi", icon: BookOpenText },
  { id: "assignments", label: "Giao bài", description: "Lịch học và hạn nộp", icon: Target },
  { id: "grading", label: "Chấm & phản hồi", description: "Nhận xét cá nhân", icon: CheckCircle },
  { id: "knowledge", label: "Knowledge graph", description: "Tài liệu và nguồn AI", icon: Graph },
  { id: "rag", label: "RAG/AI review", description: "Duyệt câu trả lời AI", icon: Sparkle },
  { id: "assistant", label: "Chatbot giảng viên", description: "Hỏi insight lớp", icon: ChatCircleDots },
  { id: "settings", label: "Hồ sơ & cài đặt", description: "Môn, lớp, bảo mật", icon: UsersThree },
];

const classes = [
  { id: "7A", name: "Lớp 7A", subject: "Toán học", students: 34, completion: 72, average: 8.1, risk: 5 },
  { id: "7B", name: "Lớp 7B", subject: "Toán học", students: 31, completion: 64, average: 7.4, risk: 8 },
  { id: "8A", name: "Lớp 8A", subject: "Khoa học", students: 29, completion: 69, average: 7.8, risk: 4 },
];

const students = [
  { name: "Minh Anh", status: "Ổn định", mastery: 88, last: "Hoàn thành Quy đồng mẫu", flag: "strong" },
  { name: "Hoàng Nam", status: "Cần hỗ trợ", mastery: 61, last: "Sai dạng rút gọn phân số", flag: "risk" },
  { name: "Bảo Trân", status: "Tăng tốc", mastery: 76, last: "Luyện tập cộng trừ phân số", flag: "good" },
  { name: "Gia Huy", status: "Tụt tiến độ", mastery: 48, last: "Bỏ lỡ bài kiểm tra ngắn", flag: "risk" },
];

const upcoming = [
  { title: "Quiz phân số", due: "Thứ 3", scope: "7A · toàn lớp", status: "Đã lên lịch" },
  { title: "Ôn tỉ lệ thức", due: "Thứ 5", scope: "Nhóm cần hỗ trợ", status: "Nháp" },
  { title: "Bài tự luận vận dụng", due: "Thứ 6", scope: "7B · cá nhân hóa", status: "Cần duyệt" },
];

const weakSkills = [
  { label: "Quy đồng mẫu", value: 62 },
  { label: "Rút gọn phân số", value: 54 },
  { label: "Vận dụng thực tế", value: 47 },
  { label: "Tốc độ làm bài", value: 69 },
];

const contentItems = [
  { title: "Chương: Phân số và số hữu tỉ", meta: "6 bài học · 4 dạng bài · mở khóa tuần này" },
  { title: "Tài liệu: Quy đồng mẫu số", meta: "Đã gắn 8 kỹ năng · dùng cho AI tutor" },
  { title: "Bài tập: Vận dụng phân số", meta: "24 câu · 3 mức độ khó" },
];

const reviewItems = [
  { question: "Vì sao phải quy đồng mẫu?", source: "Tài liệu Quy đồng mẫu số · trang 2", quality: "Đúng nguồn" },
  { question: "Cách nhận biết tỉ lệ thức?", source: "Manifest chương 2 · node 04", quality: "Cần sửa ví dụ" },
  { question: "Tóm tắt lỗi lớp 7B", source: "Lịch sử làm bài 7 ngày", quality: "Tốt" },
];

export default function TeacherWorkspace() {
  const [activeSection, setActiveSection] = useState<TeacherSection>("dashboard");
  const [selectedClassId, setSelectedClassId] = useState("7A");
  const currentClass = useMemo(() => classes.find((item) => item.id === selectedClassId) || classes[0], [selectedClassId]);
  const section = teacherSections.find((item) => item.id === activeSection) || teacherSections[0];

  return (
    <main className="teacher-shell">
      <aside className="teacher-sidebar">
        <Link className="brand teacher-brand" href="/giao-vien"><span className="brand-symbol">OL</span><span>Teacher</span></Link>
        <nav aria-label="Chức năng giảng viên">
          {teacherSections.map((item) => {
            const Icon = item.icon;
            return (
              <button className={item.id === activeSection ? "active" : ""} key={item.id} onClick={() => setActiveSection(item.id)} type="button">
                <Icon size={18} weight={item.id === activeSection ? "fill" : "regular"} />
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="teacher-main">
        <header className="teacher-header">
          <div>
            <span className="overline">Giảng viên · {currentClass.subject}</span>
            <h1>{section.label}</h1>
            <p>Luồng chính: chọn lớp → xem insight → xác định nhóm cần hỗ trợ → giao/tạo nội dung hoặc quiz → theo dõi kết quả → phản hồi.</p>
          </div>
          <div className="teacher-header-actions">
            <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} aria-label="Chọn lớp">
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.subject}</option>)}
            </select>
            <Link className="teacher-profile-chip" href="/auth"><span>NP</span><strong>Nguyễn Phương Nam</strong></Link>
            <Link className="logout-action teacher-logout" href="/dang-xuat">Đăng xuất</Link>
          </div>
        </header>

        {activeSection === "dashboard" && (
          <div className="teacher-grid">
            <section className="teacher-panel teacher-hero-panel">
              <div>
                <span className="overline">Dashboard lớp học</span>
                <h2>{currentClass.name}: {currentClass.completion}% hoàn thành lộ trình</h2>
                <p>Điểm trung bình {currentClass.average}/10. Có {currentClass.risk} học sinh cần hỗ trợ trong tuần này.</p>
              </div>
              <div className="teacher-ring"><strong>{currentClass.completion}%</strong><span>Hoàn thành</span></div>
            </section>
            <Metric label="Học sinh" value={currentClass.students.toString()} tone="neutral" />
            <Metric label="Điểm TB" value={currentClass.average.toString()} tone="good" />
            <Metric label="Cần hỗ trợ" value={currentClass.risk.toString()} tone="risk" />
            <section className="teacher-panel wide">
              <PanelTitle title="Học sinh cần hỗ trợ" action="Tạo nhóm ôn tập" />
              <StudentTable />
            </section>
            <section className="teacher-panel">
              <PanelTitle title="Bài kiểm tra sắp tới" action="Giao bài" />
              <StackList items={upcoming.map((item) => ({ title: item.title, meta: `${item.due} · ${item.scope}`, tag: item.status }))} />
            </section>
          </div>
        )}

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
            left={<SkillBars />}
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
            left={<EditorMock />}
            rightTitle="Ngân hàng câu hỏi"
            right={<StackList items={["Nhận biết phân số", "Quy đồng mẫu", "Cộng trừ phân số", "Vận dụng thực tế"].map((title, index) => ({ title, meta: `${18 + index * 6} câu · ${index + 1} mức độ`, tag: index === 1 ? "Đang sửa" : "Sẵn sàng" }))} />}
          />
        )}

        {activeSection === "assignments" && (
          <TwoColumnPage
            leftTitle="Giao bài và lịch học"
            left={<StackList items={upcoming.map((item) => ({ title: item.title, meta: `${item.scope} · hạn ${item.due}`, tag: item.status }))} />}
            rightTitle="Nhắc nhở"
            right={<WorkflowCards labels={["Chọn lớp/nhóm", "Đặt hạn nộp", "Tự động nhắc", "Theo dõi nộp bài"]} />}
          />
        )}

        {activeSection === "grading" && (
          <TwoColumnPage
            leftTitle="Chấm và phản hồi"
            left={<StackList items={students.map((item) => ({ title: item.name, meta: item.last, tag: item.status }))} />}
            rightTitle="Mẫu nhận xét"
            right={<FeedbackMock />}
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
            left={<StackList items={reviewItems.map((item) => ({ title: item.question, meta: item.source, tag: item.quality }))} />}
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
