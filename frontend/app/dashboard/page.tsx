import Link from "next/link";
import { AppShell, LevelBadge, ProgressBar } from "../components/AppShell";
import { leaderboard, skills, weeklyScores } from "../data";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="dashboard-heading"><div><span className="overline">Tổng quan học tập</span><h1>Dashboard của Hoàng Nam</h1><p>Dữ liệu được cập nhật sau mỗi bài học và bài kiểm tra.</p></div><div className="dashboard-side-stack"><div className="dashboard-filters"><label>Môn học<select defaultValue="Toán học"><option>Toán học</option><option>Ngữ văn</option><option>Tiếng Anh</option></select></label><label>Khoảng thời gian<select defaultValue="7 ngày qua"><option>7 ngày qua</option><option>30 ngày qua</option></select></label></div><div className="dashboard-pulse"><span>Nhịp học tuần này</span><strong>+28 điểm</strong><small>Tiến bộ tốt hơn 82% bạn cùng level</small></div></div></section>

      <section className="profile-metrics">
        <article><span>Lớp hiện tại</span><strong>7A</strong><small>Chương trình cơ bản</small></article>
        <article><span>Trình độ</span><LevelBadge level="explorer"/><small>Cấp 8 · 1.840 XP</small></article>
        <article><span>Mức độ thông hiểu</span><strong>78%</strong><small>Tăng 6% trong tuần</small></article>
        <article><span>Thời gian học</span><strong>4h 26p</strong><small>Tuần này</small></article>
      </section>

      <section className="dashboard-visuals">
        <article className="performance-chart">
          <div className="panel-heading"><div><h2>Quá trình học</h2><p>Điểm thông hiểu trong 7 ngày gần nhất</p></div><strong>+28 điểm</strong></div>
          <div className="bars" aria-label="Biểu đồ điểm thông hiểu theo ngày">{weeklyScores.map((score,index) => <div key={`${score}-${index}`}><span style={{ height: `${score}%` }}><b>{score}</b></span><small>{["T2","T3","T4","T5","T6","T7","CN"][index]}</small></div>)}</div>
        </article>
        <article className="skill-overview"><div className="panel-heading"><div><h2>Năng lực theo kỹ năng</h2><p>So với chuẩn Explorer</p></div></div>{skills.map((skill) => <div className="mastery-row" key={skill.label}><span>{skill.label}</span><ProgressBar value={skill.value}/><strong>{skill.value}%</strong></div>)}</article>
      </section>

      <section className="dashboard-bottom">
        <article className="upcoming-lessons"><div className="panel-heading"><div><h2>Bài học sắp tới</h2><p>Ưu tiên dựa trên kết quả gần nhất</p></div><Link href="/hoc-tap">Xem lộ trình</Link></div><div className="upcoming-list"><Link href="/bai-hoc/phan-so"><span className="subject-code">TO</span><div><strong>Cộng phân số khác mẫu</strong><small>Toán học · 18 phút</small></div><b>Hôm nay</b></Link><Link href="/hoc-tap"><span className="subject-code warm">TA</span><div><strong>Thì hiện tại hoàn thành</strong><small>Tiếng Anh · 22 phút</small></div><b>Ngày mai</b></Link><Link href="/hoc-tap"><span className="subject-code rose">NV</span><div><strong>Đọc hiểu văn bản nghị luận</strong><small>Ngữ văn · 25 phút</small></div><b>Thứ Hai</b></Link></div></article>
        <article className="leaderboard-panel"><div className="panel-heading"><div><h2>Bảng xếp hạng</h2><p>Nhóm Explorer · Lớp 7</p></div><Link href="/thanh-tich">Tất cả</Link></div><div className="leader-list">{leaderboard.map((student) => <div className={student.isUser ? "leader-entry user" : "leader-entry"} key={student.name}><span>{student.rank}</span><div><strong>{student.name}</strong><small>{student.accuracy}% chính xác</small></div><b>{student.xp.toLocaleString("vi-VN")} XP</b></div>)}</div></article>
      </section>
    </AppShell>
  );
}
