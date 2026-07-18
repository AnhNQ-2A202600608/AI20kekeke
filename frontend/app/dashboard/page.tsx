"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell, LevelBadge, ProgressBar } from "../components/AppShell";
import { leaderboard, skills, subjectPrograms, subjects, weeklyScores } from "../data";
import { useOnboardingProfile } from "../hooks/useOnboardingProfile";

function scoreTone(value: number) {
  if (value >= 80) return "strong";
  if (value >= 65) return "good";
  return "review";
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const activeChapter = program.chapters.find((chapter) => chapter.active) || program.chapters[0];
  const learningLevel = useOnboardingProfile(selectedSubject.code);

  return (
    <AppShell>
      <section className="dashboard-heading dashboard-hero">
        <div>
          <span className="overline">Tổng quan {program.title}</span>
          <h1>Dashboard của Hoàng Nam</h1>
          <p>Dữ liệu đổi theo môn học, xếp loại và chương trình hiện tại để bạn thấy rõ phần đang làm tốt.</p>
        </div>
        <div className="dashboard-side-stack">
          <div className="dashboard-filters">
            <label>Môn học<select defaultValue={program.title}>{subjects.map((subject) => <option key={subject.code}>{subject.name}</option>)}</select></label>
            <label>Khoảng thời gian<select defaultValue="7 ngày qua"><option>7 ngày qua</option><option>30 ngày qua</option></select></label>
          </div>
          <div className="dashboard-pulse success-pulse"><span>Nhịp học tuần này</span><strong>+28 điểm</strong><small>Làm tốt hơn 82% bạn cùng level</small></div>
        </div>
      </section>

      <section className="profile-metrics colored-metrics">
        <article className="metric-card good"><span>Môn hiện tại</span><strong>{program.title}</strong><small>{program.grade} · {activeChapter.title}</small></article>
        <article className="metric-card good"><span>Trình độ</span><LevelBadge level={learningLevel.key} /><small>{learningLevel.title}</small></article>
        <article className="metric-card strong"><span>Mức độ thông hiểu</span><strong>78%</strong><small>Tăng 6% trong tuần</small></article>
        <article className="metric-card review"><span>Cần ôn</span><strong>1 kỹ năng</strong><small>Vận dụng thực tế</small></article>
      </section>

      <section className="dashboard-visuals">
        <article className="performance-chart success-panel">
          <div className="panel-heading"><div><h2>Quá trình học</h2><p>Điểm thông hiểu trong 7 ngày gần nhất</p></div><strong>+28 điểm</strong></div>
          <div className="bars" aria-label="Biểu đồ điểm thông hiểu theo ngày">
            {weeklyScores.map((score, index) => (
              <div className={`bar-item ${scoreTone(score)}`} key={`${score}-${index}`}>
                <span style={{ height: `${score}%` }}><b>{score}</b></span>
                <small>{["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index]}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="skill-overview">
          <div className="panel-heading"><div><h2>Năng lực theo kỹ năng</h2><p>So với chuẩn {learningLevel.name}</p></div></div>
          {skills.map((skill) => (
            <div className={`mastery-row ${scoreTone(skill.value)}`} key={skill.label}>
              <span>{skill.label}</span>
              <ProgressBar value={skill.value} />
              <strong>{skill.value}%</strong>
            </div>
          ))}
        </article>
      </section>

      <section className="dashboard-bottom">
        <article className="upcoming-lessons">
          <div className="panel-heading"><div><h2>Bài học sắp tới</h2><p>Ưu tiên theo kết quả gần nhất của {program.title}</p></div><Link href={`/hoc-tap?subject=${selectedSubject.code}`}>Xem lộ trình</Link></div>
          <div className="upcoming-list">
            <Link href="/bai-hoc/phan-so"><span className="subject-code">01</span><div><strong>{activeChapter.title}</strong><small>{program.title} · 18 phút</small></div><b>Hôm nay</b></Link>
            {program.chapters.slice(1).map((chapter) => (
              <Link href={`/hoc-tap?subject=${selectedSubject.code}`} key={chapter.number}>
                <span className="subject-code warm">{chapter.number}</span>
                <div><strong>{chapter.title}</strong><small>{program.title} · đang khóa</small></div>
                <b>Sau</b>
              </Link>
            ))}
          </div>
        </article>
        <article className="leaderboard-panel">
          <div className="panel-heading"><div><h2>Bảng xếp hạng</h2><p>Nhóm {learningLevel.name} · {program.grade}</p></div><Link href="/thanh-tich">Tất cả</Link></div>
          <div className="leader-list">{leaderboard.map((student) => <div className={student.isUser ? "leader-entry user" : "leader-entry"} key={student.name}><span>{student.rank}</span><div><strong>{student.name}</strong><small>{student.accuracy}% chính xác</small></div><b>{student.xp.toLocaleString("vi-VN")} XP</b></div>)}</div>
        </article>
      </section>
    </AppShell>
  );
}
