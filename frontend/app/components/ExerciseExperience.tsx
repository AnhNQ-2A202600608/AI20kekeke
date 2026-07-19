"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppShell, ProgressBar } from "./AppShell";
import { updateSubjectLearningProgress, useOnboardingProfile } from "../hooks/useOnboardingProfile";

const answers = [
  { label: "A", value: "5/12" },
  { label: "B", value: "11/12" },
  { label: "C", value: "3/7" },
  { label: "D", value: "8/12" },
];

export function ExerciseExperience({ mode }: { mode: "practice" | "test" }) {
  const searchParams = useSearchParams();
  const subjectCode = searchParams.get("subject") || "TO";
  const learningLevel = useOnboardingProfile(subjectCode);
  const chapterId = searchParams.get("id") || "06";
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [savedTestProgress, setSavedTestProgress] = useState(false);
  const isPractice = mode === "practice";
  const correct = selected === 1;

  const handleCheckPractice = () => {
    if (selected === null || checked) return;
    setChecked(true);
    updateSubjectLearningProgress(subjectCode, {
      xp: correct ? 60 : 20,
      progress: correct ? 8 : 3,
    });
  };

  const handleSaveTest = () => {
    if (selected === null || savedTestProgress) return;
    setSavedTestProgress(true);
    updateSubjectLearningProgress(subjectCode, {
      xp: 20,
      progress: 3,
    });
  };

  return (
    <AppShell compact>
      <div className={`exercise-page ${isPractice ? "practice-mode" : "test-mode"}`}>
        <header className="exercise-header">
          <Link className="back-link" href={isPractice ? `/chuong?subject=${subjectCode}&id=${chapterId}` : `/hoc-tap?subject=${subjectCode}`}>
            ← {isPractice ? "Quay lại bài học" : "Rời bài kiểm tra"}
          </Link>
          <div>
            <strong>{isPractice ? "Luyện tập: Cộng phân số" : "Bài kiểm tra tổng kết dạng 1"}</strong>
            <span>{isPractice ? "Câu 3 / 8" : "Câu 7 / 15"}</span>
          </div>
          <div className="timer">
            <span>{isPractice ? "Tiến độ môn này" : "Thời gian còn lại"}</span>
            <strong>{isPractice ? `${learningLevel.progress}%` : "08:42"}</strong>
          </div>
        </header>
        <div className="exercise-progress"><ProgressBar value={isPractice ? learningLevel.progress : 47} /></div>

        <div className="exercise-layout">
          <section className="question-panel">
            <div className="question-meta">
              <span>{learningLevel.name}</span>
              <span>20 điểm</span>
            </div>
            <h1>Lan đã đọc <b>2/3</b> cuốn sách vào buổi sáng và <b>1/4</b> cuốn sách vào buổi chiều. Lan đã đọc tổng cộng bao nhiêu phần cuốn sách?</h1>
            <div className="answer-list">
              {answers.map((answer, index) => {
                const showFeedback = isPractice && checked;
                const state = showFeedback && index === 1 ? "correct" : showFeedback && selected === index ? "wrong" : selected === index ? "selected" : "";
                return (
                  <button className={state} key={answer.label} onClick={() => !checked && setSelected(index)} type="button">
                    <span>{answer.label}</span>
                    <strong>{answer.value}</strong>
                    {showFeedback && index === 1 && <em>Đáp án đúng</em>}
                    {showFeedback && selected === index && index !== 1 && <em>Bạn đã chọn</em>}
                  </button>
                );
              })}
            </div>
            <div className="question-actions">
              {isPractice ? (
                <>
                  <button className="hint-button" type="button">Gợi ý một bước</button>
                  {!checked && (
                    <button className="primary-action button-reset" disabled={selected === null} onClick={handleCheckPractice} type="button">
                      Kiểm tra đáp án<span>→</span>
                    </button>
                  )}
                  {checked && <Link className="primary-action" href={`/kiem-tra?subject=${subjectCode}`}>Đến bài kiểm tra<span>→</span></Link>}
                </>
              ) : (
                <>
                  <span className="test-save-note">Chọn một đáp án để lưu câu này.</span>
                  <Link
                    aria-disabled={selected === null}
                    className={`primary-action ${selected === null ? "action-disabled" : ""}`}
                    href={selected === null ? `/kiem-tra?subject=${subjectCode}` : `/ket-qua?subject=${subjectCode}`}
                    onClick={handleSaveTest}
                  >
                    Lưu và tiếp tục<span>→</span>
                  </Link>
                </>
              )}
            </div>
          </section>

          {isPractice && (
            <aside className={`feedback-panel ${checked ? (correct ? "feedback-correct" : "feedback-wrong") : ""}`}>
              {!checked && (
                <>
                  <span className="feedback-symbol">?</span>
                  <h2>Nhận xét sẽ xuất hiện tại đây</h2>
                  <p>Chọn một đáp án để nhận phân tích ngay về cách làm và lỗi sai.</p>
                  <div className="feedback-skills">
                    <span>Kỹ năng: Quy đồng</span>
                    <span>Level: {learningLevel.name}</span>
                    <span>Tiến độ: {learningLevel.progress}%</span>
                  </div>
                </>
              )}
              {checked && correct && (
                <>
                  <span className="feedback-symbol">✓</span>
                  <h2>Chính xác</h2>
                  <p>Bạn đã tìm đúng mẫu số chung là 12 và cộng hai tử số sau khi quy đồng.</p>
                  <div className="feedback-reward">
                    <strong>+60 XP</strong>
                    <span>Tiến độ môn học sẽ tăng trong workspace.</span>
                  </div>
                </>
              )}
              {checked && !correct && (
                <>
                  <span className="feedback-symbol">!</span>
                  <h2>Chưa chính xác</h2>
                  <p>Bạn đã cộng hai tử số đúng, nhưng chưa quy đồng mẫu số trước khi cộng.</p>
                  <div className="error-breakdown">
                    <span>Bước sai</span>
                    <strong>2/3 + 1/4 ≠ 3/7</strong>
                    <span>Cách sửa</span>
                    <strong>8/12 + 3/12 = 11/12</strong>
                  </div>
                  <button className="coach-button" type="button">Nhờ AI giải thích lỗi này</button>
                </>
              )}
            </aside>
          )}
        </div>
      </div>
    </AppShell>
  );
}
