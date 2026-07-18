"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppShell, ProgressBar } from "../../components/AppShell";

type LessonContent = {
  order: number;
  title: string;
  progress: number;
  remaining: string;
  xp: string;
  sections: string[];
  headline: string;
  lead: string;
  steps: Array<{ title: string; copy: string }>;
  remember: string;
  example: string;
  exampleNote: string;
};

const lessonCatalog: Record<string, LessonContent> = {
  "fraction-concept": {
    order: 1,
    title: "Khái niệm phân số",
    progress: 100,
    remaining: "Đã hoàn thành",
    xp: "+40 XP",
    sections: ["Phân số là gì?", "Tử số và mẫu số", "Ví dụ minh họa", "Ghi nhớ"],
    headline: "Phân số giúp biểu thị một phần của một đơn vị được chia đều.",
    lead: "Khi một đơn vị được chia thành các phần bằng nhau, phân số cho biết ta đang lấy bao nhiêu phần trong tổng số phần đó.",
    steps: [
      { title: "Đọc phân số", copy: "Trong phân số 3/4, số 3 là tử số và số 4 là mẫu số." },
      { title: "Hiểu ý nghĩa", copy: "Phân số 3/4 biểu thị ba phần trong bốn phần bằng nhau của một đơn vị." },
    ],
    remember: "Mẫu số luôn cho biết đơn vị được chia thành bao nhiêu phần bằng nhau. Mẫu số khác 0.",
    example: "3/4",
    exampleNote: "Ba phần trong bốn phần bằng nhau.",
  },
  "fraction-common-denominator": {
    order: 2,
    title: "Quy đồng mẫu số",
    progress: 60,
    remaining: "5 phút",
    xp: "+60 XP",
    sections: ["Mục tiêu dạng bài", "Quy đồng mẫu số", "Ví dụ minh họa", "Ghi nhớ"],
    headline: "Quy đồng để đưa hai phân số về cùng một đơn vị.",
    lead: "Khi hai phân số có mẫu khác nhau, ta chưa thể cộng trực tiếp tử số. Hãy biến đổi chúng thành hai phân số bằng nhau có cùng mẫu.",
    steps: [
      { title: "Tìm mẫu số chung", copy: "Bội chung nhỏ nhất của 3 và 4 là 12. Đây sẽ là mẫu số chung." },
      { title: "Biến đổi từng phân số", copy: "Nhân cả tử và mẫu của 2/3 với 4; nhân cả tử và mẫu của 1/4 với 3." },
    ],
    remember: "Chỉ cộng tử số sau khi hai mẫu số đã giống nhau. Không cộng trực tiếp hai mẫu số.",
    example: "11/12",
    exampleNote: "Sau khi quy đồng: 2/3 + 1/4 = 8/12 + 3/12.",
  },
};

export default function LessonPage() {
  const searchParams = useSearchParams();
  const subjectCode = searchParams.get("subject") || "TO";
  const lessonId = searchParams.get("lesson") || "fraction-common-denominator";
  const lesson = lessonCatalog[lessonId] || lessonCatalog["fraction-common-denominator"];
  const [active, setActive] = useState(0);

  return (
    <AppShell compact>
      <div className="lesson-page">
        <aside className="lesson-outline">
          <Link className="back-link" href={`/hoc-tap?subject=${subjectCode}`}>← Lộ trình học</Link>
          <div>
            <span className="overline">Chương 1 · Bài học {lesson.order}</span>
            <h2>{lesson.title}</h2>
          </div>
          <div className="lesson-progress">
            <div><span>Tiến độ bài học</span><strong>{lesson.progress}%</strong></div>
            <ProgressBar value={lesson.progress} />
          </div>
          <nav>
            {lesson.sections.map((section, index) => (
              <button className={active === index ? "active" : ""} onClick={() => setActive(index)} type="button" key={section}>
                <span>{index + 1}</span>{section}
              </button>
            ))}
          </nav>
          <div className="lesson-meta"><span>Thời lượng</span><strong>{lesson.remaining}</strong><span>Phần thưởng</span><strong>{lesson.xp}</strong></div>
        </aside>
        <article className="lesson-content">
          <div className="lesson-content-head">
            <div>
              <span className="overline">Kiến thức trọng tâm · Chương 1 / Bài học {lesson.order}</span>
              <h1>{lesson.headline}</h1>
            </div>
            <span className="page-count">{String(active + 1).padStart(2, "0")} / {String(lesson.sections.length).padStart(2, "0")}</span>
          </div>
          <p className="lesson-lead">{lesson.lead}</p>
          {lessonId === "fraction-common-denominator" ? (
            <div className="formula-stage">
              <div className="fraction"><span>2</span><span>3</span></div><strong>+</strong><div className="fraction"><span>1</span><span>4</span></div><strong>=</strong><div className="fraction accent"><span>8 + 3</span><span>12</span></div><strong>=</strong><div className="fraction result"><span>11</span><span>12</span></div>
            </div>
          ) : (
            <div className="lesson-concept-stage"><span>Ví dụ</span><strong>{lesson.example}</strong><p>{lesson.exampleNote}</p></div>
          )}
          <div className="explanation-grid">
            {lesson.steps.map((step, index) => (
              <section key={step.title}><span className="step-number">{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.copy}</p></section>
            ))}
          </div>
          <aside className="remember-note"><strong>Điểm cần nhớ</strong><p>{lesson.remember}</p></aside>
          <div className="lesson-actions">
            <button type="button" onClick={() => setActive(Math.max(0, active - 1))}>← Phần trước</button>
            <Link className="primary-action" href={`/luyen-tap?subject=${subjectCode}&lesson=${lessonId}`}>Luyện tập bài học này<span>→</span></Link>
          </div>
        </article>
      </div>
    </AppShell>
  );
}