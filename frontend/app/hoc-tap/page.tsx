"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell, ProgressBar } from "../components/AppShell";
import { chapterLessonPreviews, subjectPrograms, subjects } from "../data";
import { useLessonProgress } from "../hooks/useLessonProgress";
import { useOnboardingProfile } from "../hooks/useOnboardingProfile";

const mathFullRoute = [
  { number: "01", title: "Phân số và số hữu tỉ", summary: "Khái niệm phân số, quy đồng, phép tính và bài toán vận dụng.", types: 4, xp: 1640 },
  { number: "02", title: "Tỉ lệ thức", summary: "Tỉ số, tính chất tỉ lệ thức và các bài toán thực tế.", types: 2, xp: 1320 },
  { number: "03", title: "Biểu thức đại số", summary: "Biến, biểu thức đại số và các phép biến đổi cơ bản.", types: 3, xp: 1480 },
  { number: "04", title: "Đa thức một biến", summary: "Cộng, trừ, nhân đa thức và nhận diện bậc của đa thức.", types: 3, xp: 1420 },
  { number: "05", title: "Tam giác", summary: "Các yếu tố của tam giác, quan hệ cạnh góc và bài toán chứng minh.", types: 4, xp: 1560 },
  { number: "06", title: "Đường thẳng song song", summary: "Góc so le trong, đồng vị và cách suy luận khi có hai đường thẳng song song.", types: 3, xp: 1360 },
  { number: "07", title: "Xác suất và thống kê", summary: "Thu thập dữ liệu, biểu đồ, biến cố và xác suất đơn giản.", types: 3, xp: 1280 },
  { number: "08", title: "Ôn tập tổng hợp cuối năm", summary: "Tổng hợp các mạch kiến thức, luyện đề và sửa lỗi thường gặp.", types: 5, xp: 1800 },
];

function chapterEntryHref(subjectCode: string, chapterNumber: string) {
  const firstLesson = chapterLessonPreviews[chapterNumber]?.[0];
  return firstLesson ? `/bai-hoc/phan-so?subject=${subjectCode}&chapter=${chapterNumber}&lesson=${firstLesson.id}` : undefined;
}

export default function LearningWorkspace() {
  const [showFullRoute, setShowFullRoute] = useState(false);
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const learningLevel = useOnboardingProfile(selectedSubject.code);
  const currentGrade = learningLevel.grade || program.grade;
  const isMathProgram = selectedSubject.code === "TO";

  const chapterOneLessonIds = (chapterLessonPreviews["01"] || []).map((lesson) => lesson.id);
  const chapterTwoLessonIds = (chapterLessonPreviews["02"] || []).map((lesson) => lesson.id);
  const chapterOneProgress = useLessonProgress(selectedSubject.code, "01", chapterOneLessonIds);
  const chapterTwoProgress = useLessonProgress(selectedSubject.code, "02", chapterTwoLessonIds);
  const activeChapterNumber = isMathProgram && chapterOneProgress.isChapterComplete ? "02" : "01";
  const activeLessonIds = activeChapterNumber === "02" ? chapterTwoLessonIds : chapterOneLessonIds;
  const activeLessonProgress = useLessonProgress(selectedSubject.code, activeChapterNumber, activeLessonIds);
  const activeChapter = (isMathProgram ? mathFullRoute : program.chapters).find((chapter) => chapter.number === activeChapterNumber) || program.chapters[0];
  const chapterLessons = (chapterLessonPreviews[activeChapterNumber] || []).map((lesson, index) => {
    const isComplete = activeLessonProgress.isLessonComplete(lesson.id);
    const isCurrent = !isComplete && index === activeLessonProgress.nextLessonIndex;
    return {
      ...lesson,
      state: isComplete ? "completed" : isCurrent ? "current" : "locked",
      stateLabel: isComplete ? "Đã hoàn thành" : isCurrent ? "Đang học" : "Chưa mở",
      href: isComplete || isCurrent
        ? `/bai-hoc/phan-so?subject=${selectedSubject.code}&chapter=${activeChapterNumber}&lesson=${lesson.id}`
        : undefined,
    };
  });
  const currentLesson = chapterLessons.find((lesson) => lesson.state === "current") || chapterLessons[chapterLessons.length - 1];
  const completedLessonCount = chapterLessons.filter((lesson) => lesson.state === "completed").length;
  const activeChapterProgress = activeLessonProgress.isChapterComplete ? 100 : Math.round((activeLessonProgress.completedCount / Math.max(activeLessonIds.length, 1)) * 100);

  const routeChapters = (isMathProgram ? mathFullRoute : program.chapters).map((chapter, index) => {
    const activeIndex = (isMathProgram ? mathFullRoute : program.chapters).findIndex((entry) => entry.number === activeChapterNumber);
    const isActive = chapter.number === activeChapterNumber;
    const isComplete = index < activeIndex;
    const isNext = index === activeIndex + 1;
    return {
      ...chapter,
      status: isActive ? "active" : isComplete ? "completed" : "locked",
      progress: isActive ? activeChapterProgress : isComplete ? 100 : 0,
      unlock: isActive ? "Đang học" : isComplete ? "Đã hoàn thành" : isNext ? `Hoàn thành Chương ${Number(activeChapterNumber)} để mở khóa` : "Khóa theo tiến độ",
    };
  });
  const visibleRouteChapters = showFullRoute ? routeChapters : routeChapters.filter((chapter) => Number(chapter.number) > Number(activeChapterNumber));

  return (
    <AppShell>
      <section className="learning-hero">
        <div className="learning-hero-copy">
          <span className="overline">{currentGrade} · {program.title}</span>
          <h1>{activeChapter.title}</h1>
          <p>{activeChapter.summary} Hoàn thành bài học và bài tập theo thứ tự để mở bài tiếp theo.</p>
          <div className="hero-xp-strip">
            <div><span>{learningLevel.title}</span><strong>{learningLevel.xp.toLocaleString("vi-VN")} / {learningLevel.nextXp.toLocaleString("vi-VN")} XP</strong></div>
            <ProgressBar value={learningLevel.progress} label="Tiến độ kinh nghiệm hiện tại" />
          </div>
          <div className="hero-meta-line" aria-label="Thông tin học tập hiện tại"><span>{program.title}</span><span>{learningLevel.name}</span><strong>{activeChapterProgress}% hoàn thành chương</strong></div>
          <div className="hero-actions">
            <Link className="primary-action" href={currentLesson?.href || chapterEntryHref(selectedSubject.code, activeChapterNumber) || `/hoc-tap?subject=${selectedSubject.code}`}>{currentLesson ? `Học Bài ${currentLesson.order}` : "Vào chương đang học"} <span>→</span></Link>
          </div>
        </div>

        <aside className="chapter-lessons-preview hero-focus" aria-label="Bài học trong chương">
          <div className="chapter-lessons-heading"><div><span>Chương {Number(activeChapter.number)}</span><strong>Bài học trong chương</strong></div><small>{completedLessonCount} / {chapterLessons.length} hoàn thành</small></div>
          <ol className="chapter-lesson-list">
            {chapterLessons.map((lesson) => (
              <li className={`chapter-lesson-item ${lesson.state}`} key={lesson.id}>
                {lesson.href ? <Link className="chapter-lesson-link" href={lesson.href}><span className="chapter-lesson-order">{lesson.order}</span><strong>{lesson.title}</strong><small>{lesson.stateLabel}</small></Link> : <div className="chapter-lesson-link" aria-disabled="true"><span className="chapter-lesson-order">{lesson.order}</span><strong>{lesson.title}</strong><small>{lesson.stateLabel}</small></div>}
              </li>
            ))}
          </ol>
          <div className="chapter-lessons-goal"><span>Mục tiêu hiện tại</span><strong>{currentLesson ? `Hoàn thành Bài ${currentLesson.order}: ${currentLesson.title}` : "Hoàn thành chương để mở khóa lộ trình tiếp theo"}</strong></div>
        </aside>
      </section>

      <section className={`section-block learning-path learning-path-focused ${showFullRoute ? "learning-path-full" : ""}`}>
        <div className="section-title">
          <div><h2>Lộ trình {program.title} {currentGrade.toLowerCase()}</h2><p>{showFullRoute ? "Toàn bộ chương học của năm." : `Các chương sẽ mở theo kết quả hoàn thành Chương ${Number(activeChapterNumber)}.`}</p></div>
          {isMathProgram && <button className="route-toggle" onClick={() => setShowFullRoute((value) => !value)} type="button">{showFullRoute ? "Thu gọn lộ trình" : "Xem toàn bộ lộ trình"}</button>}
        </div>
        <div className="chapter-browser">
          {visibleRouteChapters.map((chapter) => {
            const href = chapter.status !== "locked" ? chapterEntryHref(selectedSubject.code, chapter.number) : undefined;
            return (
              <article className={`chapter-card ${chapter.status} upcoming-chapter`} key={chapter.number}>
                <div className="chapter-card-number">{chapter.number}</div>
                <div className="chapter-card-copy"><h3>{chapter.title}</h3><p>{chapter.summary}</p><div className="chapter-card-meta"><span>{chapter.types} dạng bài</span><span>{chapter.xp.toLocaleString("vi-VN")} XP</span>{chapter.status !== "locked" && <span>{chapter.progress}% hoàn thành</span>}</div></div>
                {href ? <Link className="chapter-open" href={href}>{chapter.status === "active" ? "Vào chương" : "Ôn lại"} <span>→</span></Link> : <span className="chapter-locked">{chapter.unlock}</span>}
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}