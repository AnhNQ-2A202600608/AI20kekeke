"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell, ProgressBar } from "../components/AppShell";
import { subjectPrograms, subjects } from "../data";
import { useOnboardingProfile } from "../hooks/useOnboardingProfile";

const mathFullRoute = [
  { number: "01", title: "Phân số và số hữu tỉ", summary: "Khái niệm phân số, quy đồng, phép tính và bài toán vận dụng.", progress: 62, types: 4, xp: 1640, active: true, unlock: "Đang học" },
  { number: "02", title: "Tỉ lệ thức", summary: "Tỉ số, tính chất tỉ lệ thức và các bài toán thực tế.", progress: 0, types: 2, xp: 1320, active: false, unlock: "Hoàn thành Chương 1 để mở khóa" },
  { number: "03", title: "Biểu thức đại số", summary: "Biến, biểu thức đại số và các phép biến đổi cơ bản.", progress: 0, types: 3, xp: 1480, active: false, unlock: "Hoàn thành Chương 2 để mở khóa" },
  { number: "04", title: "Đa thức một biến", summary: "Cộng, trừ, nhân đa thức và nhận diện bậc của đa thức.", progress: 0, types: 3, xp: 1420, active: false, unlock: "Khóa theo tiến độ" },
  { number: "05", title: "Tam giác", summary: "Các yếu tố của tam giác, quan hệ cạnh góc và bài toán chứng minh.", progress: 0, types: 4, xp: 1560, active: false, unlock: "Khóa theo tiến độ" },
  { number: "06", title: "Đường thẳng song song", summary: "Góc so le trong, đồng vị và cách suy luận khi có hai đường thẳng song song.", progress: 0, types: 3, xp: 1360, active: false, unlock: "Khóa theo tiến độ" },
  { number: "07", title: "Xác suất và thống kê", summary: "Thu thập dữ liệu, biểu đồ, biến cố và xác suất đơn giản.", progress: 0, types: 3, xp: 1280, active: false, unlock: "Khóa theo tiến độ" },
  { number: "08", title: "Ôn tập tổng hợp cuối năm", summary: "Tổng hợp các mạch kiến thức, luyện đề và sửa lỗi thường gặp.", progress: 0, types: 5, xp: 1800, active: false, unlock: "Chương cuối" },
];

export default function LearningWorkspace() {
  const [showFullRoute, setShowFullRoute] = useState(false);
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const activeChapter = program.chapters.find((chapter) => chapter.active) || program.chapters[0];
  const learningLevel = useOnboardingProfile(selectedSubject.code);
  const currentGrade = learningLevel.grade || program.grade;
  const isMathProgram = selectedSubject.code === "TO";
  const baseRouteChapters = isMathProgram && showFullRoute ? mathFullRoute : program.chapters;
  const routeChapters = baseRouteChapters.map((chapter) => (
    chapter.active ? { ...chapter, progress: learningLevel.progress } : chapter
  ));

  return (
    <AppShell>
      <section className="learning-hero">
        <div className="learning-hero-copy">
          <span className="overline">{currentGrade} · {program.title}</span>
          <h1>{activeChapter.title}</h1>
          <p>
            Lộ trình {program.title.toLowerCase()} đang ưu tiên {activeChapter.title.toLowerCase()}.
            Hoàn thành mục tiêu hôm nay để mở nhịp luyện tập tiếp theo.
          </p>
          <div className="hero-xp-strip">
            <div>
              <span>{learningLevel.title}</span>
              <strong>{learningLevel.xp.toLocaleString("vi-VN")} / {learningLevel.nextXp.toLocaleString("vi-VN")} XP</strong>
            </div>
            <ProgressBar value={learningLevel.progress} label="Tiến độ kinh nghiệm hiện tại" />
          </div>
          <div className="hero-meta-line" aria-label="Thông tin học tập hiện tại">
            <span>{program.title}</span>
            <span>{learningLevel.name}</span>
            <strong>{learningLevel.placementScore ? `Test xếp level ${learningLevel.placementScore}` : "Kiểm tra mở khóa 86 / 100"}</strong>
          </div>
          <div className="hero-actions">
            <Link className="primary-action" href={`/chuong/phan-so?subject=${selectedSubject.code}`}>Vào chương đang học <span>→</span></Link>
            <Link className="secondary-action" href={`/hoi-dap-ai?subject=${selectedSubject.code}`}>Hỏi đáp AI về chương</Link>
          </div>
        </div>

        <aside className="today-focus hero-focus">
          <div>
            <span>Mục tiêu hôm nay</span>
            <strong>2 / 3</strong>
          </div>
          <p>{program.goal}</p>
          <div className="goal-highlight">
            <span>{activeChapter.title}</span>
            <strong>{learningLevel.progress}%</strong>
          </div>
          <ProgressBar value={learningLevel.progress} label="Tiến độ mục tiêu hôm nay" />
        </aside>
      </section>

      <section className={`section-block learning-path learning-path-focused ${showFullRoute ? "learning-path-full" : ""}`}>
        <div className="section-title">
          <div>
            <h2>Lộ trình {program.title} {currentGrade.toLowerCase()}</h2>
            <p>{showFullRoute ? "Toàn bộ chương trình từ chương đầu đến chương cuối. Chương đang học vẫn được giữ nổi bật để bạn không mất trọng tâm." : "Chương đang học được highlight rõ hơn; các chương sau mở theo kết quả cuối chương."}</p>
          </div>
          <div className="route-title-actions">
            <span className="status-note">{showFullRoute ? `${routeChapters.length} chương` : `Đang học · Chương ${Number(activeChapter.number)}`}</span>
            {isMathProgram && (
              <button className="route-toggle" onClick={() => setShowFullRoute((value) => !value)} type="button">
                {showFullRoute ? "Thu gọn lộ trình" : "Xem toàn bộ lộ trình"}
              </button>
            )}
          </div>
        </div>
        <div className="chapter-browser">
          {routeChapters.map((chapter) => (
            <article className={`chapter-card ${chapter.active ? "active current-chapter" : showFullRoute ? "route-upcoming" : "locked collapsed"}`} key={chapter.number}>
              <div className="chapter-card-number">{chapter.number}</div>
              <div className="chapter-card-copy">
                <span className="hierarchy-label">Chương {Number(chapter.number)} · {chapter.unlock}</span>
                <h3>{chapter.title}</h3>
                <p>{chapter.summary}</p>
                <div className="chapter-card-meta">
                  <span>{chapter.types} dạng bài</span>
                  <span>{chapter.xp.toLocaleString("vi-VN")} XP</span>
                  {chapter.active && <span>{chapter.progress}% hoàn thành</span>}
                </div>
                {chapter.active && <ProgressBar value={chapter.progress} />}
              </div>
              {chapter.active ? (
                <Link className="chapter-open" href={`/chuong/phan-so?subject=${selectedSubject.code}`}>Chi tiết chương <span>→</span></Link>
              ) : (
                <span className="chapter-locked">{chapter.unlock}</span>
              )}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
