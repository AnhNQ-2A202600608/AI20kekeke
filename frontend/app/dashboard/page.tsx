"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties, Suspense } from "react";
import { ArrowRight, BookOpenText, ChartLineUp, Lightning, Target, TrendUp } from "@phosphor-icons/react";
import { AppShell, ProgressBar } from "../components/AppShell";
import { leaderboard, skills, subjectPrograms, subjects, weeklyScores } from "../data";
import { useOnboardingProfile } from "../hooks/useOnboardingProfile";

function scoreTone(value: number) {
  if (value >= 80) return "strong";
  if (value >= 65) return "good";
  return "review";
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timeRange, setTimeRange] = useState<"7" | "30">("7");
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const activeChapter = program.chapters.find((chapter) => chapter.active) || program.chapters[0];
  const learningLevel = useOnboardingProfile(selectedSubject.code);
  const masteryScore = selectedSubject.progress;
  const levelNumber = learningLevel.title.match(/Level\s+(\d+)/)?.[1] || "0";
  const trendScores = timeRange === "7" ? weeklyScores : [46, 54, 61, 68, 74];
  const trendLabels = timeRange === "7" ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] : ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4", "Hiện tại"];
  const nextLessonHref = selectedSubject.code === "TO" ? "/bai-hoc/phan-so" : `/hoc-tap?subject=${selectedSubject.code}`;

  return (
    <AppShell>
      <section className="dashboard-heading dashboard-hero">
        <div>
          <span className="overline">Tổng quan {program.title}</span>
          <h1>Dashboard của <span>Hoàng Nam</span></h1>
          <p>Dữ liệu đổi theo môn học, xếp loại và chương trình hiện tại để bạn thấy rõ phần đang làm tốt.</p>
        </div>
        <div className="dashboard-side-stack">
          <div className="dashboard-filters">
            <label>Môn học<select value={selectedSubject.code} onChange={(event) => router.push(`/dashboard?subject=${event.target.value}`)} aria-label="Chọn môn học cho dashboard">{subjects.map((subject) => <option key={subject.code} value={subject.code}>{subject.name}</option>)}</select></label>
            <label>Khoảng thời gian<select value={timeRange} onChange={(event) => setTimeRange(event.target.value as "7" | "30")}><option value="7">7 ngày qua</option><option value="30">30 ngày qua</option></select></label>
          </div>
          <div className="dashboard-rank-highlight">
            <span className="rank-icon"><TrendUp size={22} weight="bold" /></span>
            <div><small>So với bạn cùng trình độ</small><strong>Vượt 82% người học</strong></div>
            <span className="rank-change">+28 điểm</span>
          </div>
        </div>
      </section>

      <section className="dashboard-insight-grid" aria-label="Tổng quan học tập">
        <article className="mastery-insight-card">
          <div className="mastery-insight-copy">
            <span className="metric-eyebrow"><ChartLineUp size={17} weight="bold" /> Mức độ thông hiểu</span>
            <h2>Bạn đang nắm khá chắc kiến thức</h2>
            <p>Tăng 6% trong tuần này. Phần vận dụng thực tế vẫn cần thêm một lượt luyện tập.</p>
            <Link href="#nang-luc">Xem chi tiết năng lực <ArrowRight size={16} weight="bold" /></Link>
          </div>
          <div className="mastery-ring" style={{ "--mastery-angle": `${masteryScore * 3.6}deg` } as CSSProperties} aria-label={`Mức độ thông hiểu ${masteryScore}%`}>
            <div><strong>{masteryScore}%</strong><small>Thông hiểu</small></div>
          </div>
        </article>

        <article className="dashboard-compact-card subject-summary-card">
          <span className="compact-card-icon"><BookOpenText size={20} weight="bold" /></span>
          <small>Môn hiện tại</small>
          <strong>{program.title}</strong>
          <p>{program.grade} · {activeChapter.title}</p>
        </article>

        <article className="dashboard-compact-card level-summary-card">
          <span className="compact-card-icon"><Lightning size={20} weight="fill" /></span>
          <small>Trình độ hiện tại</small>
          <strong>{learningLevel.name} · Level {levelNumber}</strong>
          <p>{learningLevel.progress}% tới cấp tiếp theo</p>
          <ProgressBar value={learningLevel.progress} />
        </article>

        <article className="review-action-card">
          <span className="compact-card-icon"><Target size={21} weight="bold" /></span>
          <div><small>Cần ôn ngay</small><strong>Vận dụng thực tế</strong><p>1 kỹ năng đang dưới mức mục tiêu</p></div>
          <Link href={`/luyen-tap?subject=${selectedSubject.code}`}>Luyện tập ngay <ArrowRight size={16} weight="bold" /></Link>
        </article>
      </section>

      <section className="next-best-action">
        <span className="next-action-index">Tiếp theo</span>
        <div><small>Gợi ý học phù hợp nhất</small><h2>{activeChapter.title}</h2><p>{program.title} · 18 phút · Có hướng dẫn từng bước</p></div>
        <Link href={nextLessonHref}>Tiếp tục học <ArrowRight size={17} weight="bold" /></Link>
      </section>

      <section className="dashboard-visuals">
        <article className="performance-chart success-panel">
          <div className="panel-heading"><div><h2>Xu hướng học tập</h2><p>Điểm thông hiểu trong {timeRange === "7" ? "7 ngày" : "30 ngày"} gần nhất</p></div><span className="trend-summary"><TrendUp size={16} weight="bold" /> +28 điểm</span></div>
          <div className={`bars bars-${timeRange}`} aria-label="Biểu đồ điểm thông hiểu theo thời gian">
            {trendScores.map((score, index) => (
              <div className={`bar-item ${scoreTone(score)}`} key={`${score}-${index}`}>
                <span style={{ height: `${score}%` }}><b>{score}</b></span>
                <small>{trendLabels[index]}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="skill-overview" id="nang-luc">
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
