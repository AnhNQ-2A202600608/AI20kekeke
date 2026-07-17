"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell, ProgressBar } from "./AppShell";

const answers = [
  { label: "A", value: "5/12" },
  { label: "B", value: "11/12" },
  { label: "C", value: "3/7" },
  { label: "D", value: "8/12" },
];

export function ExerciseExperience({ mode }: { mode: "practice" | "test" }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const isPractice = mode === "practice";
  const correct = selected === 1;

  return (
    <AppShell compact>
      <div className={`exercise-page ${isPractice ? "practice-mode" : "test-mode"}`}>
        <header className="exercise-header">
          <Link className="back-link" href={isPractice ? "/bai-hoc/phan-so" : "/hoc-tap"}>← {isPractice ? "Quay lại bài học" : "Rời bài kiểm tra"}</Link>
          <div><strong>{isPractice ? "Luyện tập: Cộng phân số" : "Bài kiểm tra tổng kết dạng 1"}</strong><span>{isPractice ? "Câu 3 / 8" : "Câu 7 / 15"}</span></div>
          <div className="timer"><span>{isPractice ? "Điểm hiện tại" : "Thời gian còn lại"}</span><strong>{isPractice ? "240 XP" : "08:42"}</strong></div>
        </header>
        <div className="exercise-progress"><ProgressBar value={isPractice ? 38 : 47}/></div>

        <div className="exercise-layout">
          <section className="question-panel">
            <div className="question-meta"><span>Mức Explorer</span><span>20 điểm</span></div>
            <h1>Lan đã đọc <b>2/3</b> cuốn sách vào buổi sáng và <b>1/4</b> cuốn sách vào buổi chiều. Lan đã đọc tổng cộng bao nhiêu phần cuốn sách?</h1>
            <div className="answer-list">
              {answers.map((answer, index) => {
                const showFeedback = isPractice && checked;
                const state = showFeedback && index === 1 ? "correct" : showFeedback && selected === index ? "wrong" : selected === index ? "selected" : "";
                return <button className={state} key={answer.label} onClick={() => !checked && setSelected(index)} type="button"><span>{answer.label}</span><strong>{answer.value}</strong>{showFeedback && index === 1 && <em>Đáp án đúng</em>}{showFeedback && selected === index && index !== 1 && <em>Bạn đã chọn</em>}</button>;
              })}
            </div>
            <div className="question-actions">
              <button className="hint-button" type="button">Gợi ý một bước</button>
              {isPractice && !checked && <button className="primary-action button-reset" disabled={selected === null} onClick={() => setChecked(true)} type="button">Kiểm tra đáp án<span>→</span></button>}
              {isPractice && checked && <Link className="primary-action" href="/kiem-tra">Đến bài kiểm tra<span>→</span></Link>}
              {!isPractice && <Link aria-disabled={selected === null} className={`primary-action ${selected === null ? "action-disabled" : ""}`} href={selected === null ? "#" : "/ket-qua"}>Lưu và tiếp tục<span>→</span></Link>}
            </div>
          </section>

          <aside className={`feedback-panel ${checked ? (correct ? "feedback-correct" : "feedback-wrong") : ""}`}>
            {!checked && <><span className="feedback-symbol">?</span><h2>{isPractice ? "Nhận xét sẽ xuất hiện tại đây" : "Tập trung hoàn thành bài"}</h2><p>{isPractice ? "Chọn một đáp án để nhận phân tích ngay về cách làm và lỗi sai." : "Trong chế độ kiểm tra, đáp án và nhận xét chỉ hiển thị sau khi nộp bài."}</p><div className="feedback-skills"><span>Kỹ năng: Quy đồng</span><span>Độ khó: Explorer</span><span>Điểm: 20</span></div></>}
            {checked && correct && <><span className="feedback-symbol">✓</span><h2>Chính xác!</h2><p>Bạn đã tìm đúng mẫu số chung là 12 và cộng hai tử số sau khi quy đồng.</p><div className="feedback-reward"><strong>+20 XP</strong><span>Chuỗi đúng: 4 câu</span></div></>}
            {checked && !correct && <><span className="feedback-symbol">!</span><h2>Chưa chính xác</h2><p>Bạn đã cộng hai tử số đúng, nhưng chưa quy đồng mẫu số trước khi cộng.</p><div className="error-breakdown"><span>Bước sai</span><strong>2/3 + 1/4 ≠ 3/7</strong><span>Cách sửa</span><strong>8/12 + 3/12 = 11/12</strong></div><button className="coach-button" type="button">Nhờ AI giải thích lỗi này</button></>}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
