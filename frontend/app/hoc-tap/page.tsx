"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell, ProgressBar } from "../components/AppShell";
import { chapterLessonPreviews, subjectPrograms, subjects } from "../data";
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
  const chapterLessons = chapterLessonPreviews[activeChapter.number] || [];
  const currentLesson = chapterLessons.find((lesson) => lesson.state === "current") || chapterLessons[0];
  const completedLessonCount = chapterLessons.filter((lesson) => lesson.state === "completed").length;
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
            Hoàn thành các bài học theo thứ tự để mở bài kiểm tra chương.
            Mỗi bài tập trung vào một kỹ năng và được mở theo tiến độ của bạn.
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
            <Link className="primary-action" href={currentLesson?.href || `/chuong/phan-so?subject=${selectedSubject.code}`}>
              {currentLesson ? `Tiếp tục bài ${currentLesson.order}` : "Vào chương đang học"} <span>→</span>
            </Link>
            <Link className="secondary-action" href={`/hoi-dap-ai?subject=${selectedSubject.code}`}>Hỏi đáp AI về chương</Link>
          </div>
        </div>

        <aside className="chapter-lessons-preview hero-focus" aria-label="Bài học trong chương">
          <div className="chapter-lessons-heading">
            <div>
              <span>Chương {Number(activeChapter.number)}</span>
              <strong>Bài học trong chương</strong>
            </div>
            <small>{completedLessonCount} / {chapterLessons.length} hoàn thành</small>
          </div>
          <ol className="chapter-lesson-list">
            {chapterLessons.map((lesson) => (
              <li className={`chapter-lesson-item ${lesson.state}`} key={lesson.id}>
                {lesson.href ? (
                  <Link className="chapter-lesson-link" href={lesson.href}>
                    <span className="chapter-lesson-order">{lesson.order}</span>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.stateLabel}</small>
                  </Link>
                ) : (
                  <div className="chapter-lesson-link" aria-disabled="true">
                    <span className="chapter-lesson-order">{lesson.order}</span>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.stateLabel}</small>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="chapter-lessons-goal">
            <span>Mục tiêu hôm nay</span>
            <strong>{currentLesson ? `Hoàn thành bài ${currentLesson.order}: ${currentLesson.title}` : program.goal}</strong>
          </div>
        </aside>
      </section>

      <section className={`section-block learning-path learning-path-focused ${showFullRoute ? "learning-path-full" : ""}`}>
        <div className="section-title">
          <div>
            <h2>Lộ trình {program.title} {currentGrade.toLowerCase()}</h2>
            <p className="route-current-context">
              <span>Đang học</span>
              <strong>Chương {Number(activeChapter.number)}: {activeChapter.title}</strong>
              <b>{learningLevel.progress}% hoàn thành</b>
            </p>
          </div>
          <div className="route-title-actions">
            {isMathProgram && (
              <button className="route-toggle" onClick={() => setShowFullRoute((value) => !value)} type="button">
                {showFullRoute ? "Thu gọn lộ trình" : "Xem toàn bộ lộ trình"}
              </button>
            )}
          </div>
        </div>
        <div className="chapter-browser">
          {routeChapters.filter((chapter) => !chapter.active).map((chapter) => (
            <article className="chapter-card locked upcoming-chapter" key={chapter.number}>
              <div className="chapter-card-number">{chapter.number}</div>
              <div className="chapter-card-copy">
                <h3>{chapter.title}</h3>
                <div className="chapter-card-meta">
                  <span>{chapter.types} dạng bài</span>
                  <span>{chapter.xp.toLocaleString("vi-VN")} XP</span>
                </div>
              </div>
              <span className="chapter-locked">{chapter.unlock}</span>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
