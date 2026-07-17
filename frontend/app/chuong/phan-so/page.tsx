import Link from "next/link";
import { AppShell, LevelBadge, ProgressBar } from "../../components/AppShell";

const types = [
  { id: "D1", title: "Khái niệm phân số", level: "explorer" as const, progress: 100, state: "done", lessons: [] },
  { id: "D2", title: "Quy đồng mẫu số", level: "explorer" as const, progress: 60, state: "active", lessons: [
    { marker: "✓", title: "Bài học 1: Mẫu số chung", detail: "Đã hoàn thành", state: "done" },
    { marker: "2", title: "Bài học 2: Quy đồng hai phân số", detail: "Bài học đang tiếp tục", state: "current" },
    { marker: "3", title: "Luyện tập có gợi ý", detail: "Chưa học", state: "pending" },
    { marker: "KT", title: "Kiểm tra dạng quy đồng", detail: "Mở dạng tiếp theo khi đạt chuẩn", state: "pending" },
  ] },
  { id: "D3", title: "Cộng trừ phân số", level: "explorer" as const, progress: 0, state: "locked", lessons: [] },
  { id: "D4", title: "Nhân chia phân số", level: "challenger" as const, progress: 0, state: "locked", lessons: [] },
];

export default function FractionChapterPage() {
  return (
    <AppShell>
      <section className="chapter-page-head">
        <Link className="back-link" href="/hoc-tap">← Lộ trình học</Link>
        <div><span className="overline">Toán học lớp 7 · Chương 1</span><h1>Phân số và số hữu tỉ</h1><p>4 dạng bài · 16 bài học và bài kiểm tra · tối đa 1.640 XP</p></div>
        <aside><span>Tiến độ chương</span><strong>62%</strong><ProgressBar value={62}/></aside>
      </section>

      <section className="chapter-detail" aria-label="Các dạng bài trong chương 1">
        <div className="chapter-detail-intro"><p>Chương này gồm các dạng bài về khái niệm phân số, quy đồng, phép tính và bài toán vận dụng.</p><ProgressBar value={62}/></div>
        <div className="chapter-type-stack">
          {types.map((type) => (
            <details className={`chapter-type ${type.state}`} open={type.state === "active"} key={type.id}>
              <summary><span className="chapter-type-index">{type.id}</span><div className="chapter-type-title"><LevelBadge level={type.level}/><strong>{type.title}</strong></div><span className="chapter-type-progress">{type.lessons.length || 4} bài học · {type.progress}%</span><span className="type-toggle">{type.state === "locked" ? "Khóa" : "Chi tiết"}</span></summary>
              {type.lessons.length > 0 && <div className="chapter-lesson-grid">{type.lessons.map((lesson) => <Link className={`chapter-lesson ${lesson.state}`} href="/bai-hoc/phan-so" key={lesson.title}><span>{lesson.marker}</span><div><strong>{lesson.title}</strong><small>{lesson.detail}</small></div></Link>)}</div>}
            </details>
          ))}
        </div>
        <footer className="chapter-detail-footer"><span>62% hoàn thành chương</span><Link href="/bai-hoc/phan-so">Tiếp tục bài học hiện tại →</Link></footer>
      </section>
    </AppShell>
  );
}
