import Link from "next/link";
import { AppShell, LevelBadge, ProgressBar } from "../components/AppShell";

const chapters = [
  { number: "01", title: "Phân số và số hữu tỉ", summary: "Khái niệm phân số, quy đồng, phép tính và bài toán vận dụng.", progress: 62, types: 4, xp: 1640, active: true, unlock: "Đang học" },
  { number: "02", title: "Tỉ lệ thức", summary: "Tỉ số, tính chất tỉ lệ thức và các bài toán thực tế.", progress: 0, types: 2, xp: 1320, active: false, unlock: "Hoàn thành Chương 1 để mở khóa" },
  { number: "03", title: "Biểu thức đại số", summary: "Biến, biểu thức đại số và các phép biến đổi cơ bản.", progress: 0, types: 3, xp: 1480, active: false, unlock: "Hoàn thành Chương 2 để mở khóa" },
];

export default function LearningWorkspace() {
  return (
    <AppShell>
      <section className="workspace-topline">
        <div><span className="overline">Thứ Sáu, 17 tháng 7</span><h1>Chào buổi chiều, Nam.</h1><p>Hôm nay bạn chỉ cần 28 phút để hoàn thành mục tiêu.</p></div>
        <aside className="today-focus"><div><span>Mục tiêu hôm nay</span><strong>2 / 3</strong></div><p>Hoàn thành dạng Quy đồng mẫu số</p><div className="progress-track"><span style={{ width: "67%" }} /></div></aside>
      </section>

      <section className="xp-banner level-explorer-bg">
        <div className="xp-level"><LevelBadge level="explorer"/><div><strong>Cấp 8 · Nhà thám hiểm</strong><span>Còn 560 XP để lên Challenger</span></div></div>
        <div className="xp-progress"><div><span>Kinh nghiệm hiện tại</span><strong>1.840 / 2.400 XP</strong></div><ProgressBar value={77} /></div>
        <div className="xp-stats"><div><strong>+320</strong><span>XP tuần này</span></div><div><strong>12</strong><span>Ngày liên tiếp</span></div></div>
      </section>

      <section className="learning-context" aria-label="Bộ lọc lộ trình học">
        <article className="context-card"><span>Môn đang học</span><strong>Toán học</strong><small>Lớp 7 · học theo thứ tự chương</small></article>
        <div className="context-selectors"><label>Lớp<select defaultValue="Lớp 7"><option>Lớp 6</option><option>Lớp 7</option><option>Lớp 8</option></select></label><label>Trình độ<select defaultValue="Explorer"><option>Beginner</option><option>Explorer</option><option>Challenger</option><option>Expert</option><option>Master</option></select></label></div>
        <article className="context-card compact"><span>Bài kiểm tra mở khóa</span><strong>86 / 100</strong><small>Đạt chuẩn Explorer</small></article>
      </section>

      <section className="section-block learning-path">
        <div className="section-title"><div><h2>Lộ trình Toán học lớp 7</h2><p>Hoàn thành bài kiểm tra cuối chương để mở chương kế tiếp.</p></div><span className="status-note">Đang học · Chương 1</span></div>
        <div className="chapter-browser">
          {chapters.map((chapter) => (
            <article className={`chapter-card ${chapter.active ? "active" : "locked"}`} key={chapter.number}>
              <div className="chapter-card-number">{chapter.active ? chapter.number : "K"}</div>
              <div className="chapter-card-copy"><span className="hierarchy-label">Chương {Number(chapter.number)} · {chapter.unlock}</span><h3>{chapter.title}</h3><p>{chapter.summary}</p><div className="chapter-card-meta"><span>{chapter.types} dạng bài</span><span>{chapter.xp.toLocaleString("vi-VN")} XP</span>{chapter.active && <span>{chapter.progress}% hoàn thành</span>}</div>{chapter.active && <ProgressBar value={chapter.progress} />}</div>
              {chapter.active ? <Link className="chapter-open" href="/chuong/phan-so">Chi tiết chương <span>→</span></Link> : <span className="chapter-locked">{chapter.unlock}</span>}
            </article>
          ))}
        </div>
      </section>

    </AppShell>
  );
}
