import { AppShell, LevelBadge, ProgressBar } from "../components/AppShell";
import { activeLearningLevel, leaderboard } from "../data";

const badges = [
  { code: "12", title: "Chuỗi học 12 ngày", desc: "Học ít nhất một bài mỗi ngày", earned: true },
  { code: "90", title: "Độ chính xác xuất sắc", desc: "Đạt trên 90% trong một bài kiểm tra", earned: true },
  { code: "XP", title: "Intermediate bền bỉ", desc: "Tích lũy 1.500 XP ở level Intermediate", earned: true },
  { code: "15", title: "Bền bỉ", desc: "Hoàn thành 15 bài luyện tập", earned: false },
];

export default function AchievementsPage() {
  return (
    <AppShell>
      <section className="achievement-head"><div><span className="overline">Hồ sơ thành tích</span><h1>Mỗi bước tiến đều đáng được ghi nhận.</h1><p>Điểm kinh nghiệm, huy hiệu và thứ hạng của bạn trong nhóm cùng trình độ.</p></div><div className="achievement-level level-intermediate-bg"><LevelBadge level={activeLearningLevel.key}/><strong>Cấp 8</strong><span>1.840 / 2.400 XP</span><ProgressBar value={77}/></div></section>
      <section className="badge-section"><div className="section-title"><div><h2>Huy hiệu gần đây</h2><p>3 trong 4 huy hiệu đã đạt được.</p></div></div><div className="badge-grid">{badges.map((badge) => <article className={badge.earned ? "earned" : "locked"} key={badge.title}><span className="badge-mark">{badge.code}</span><div><strong>{badge.title}</strong><p>{badge.desc}</p></div><small>{badge.earned ? "Đã nhận" : "Còn 3 bài"}</small></article>)}</div></section>
      <section className="full-leaderboard"><div className="section-title"><div><h2>Bảng xếp hạng {activeLearningLevel.name}</h2><p>So sánh công bằng với học sinh cùng lớp và cùng cấp độ.</p></div><span className="status-note">Tuần 29</span></div><div className="leader-table"><div className="leader-table-head"><span>Hạng</span><span>Học sinh</span><span>Độ chính xác</span><span>Kinh nghiệm</span></div>{leaderboard.map((student) => <div className={student.isUser ? "leader-table-row user" : "leader-table-row"} key={student.name}><span>#{student.rank}</span><strong>{student.name}{student.isUser && <small>Bạn</small>}</strong><span>{student.accuracy}%</span><b>{student.xp.toLocaleString("vi-VN")} XP</b></div>)}</div></section>
    </AppShell>
  );
}
