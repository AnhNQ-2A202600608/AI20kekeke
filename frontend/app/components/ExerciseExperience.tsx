"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppShell, ProgressBar } from "./AppShell";
import { chapterLessonPreviews } from "../data";
import { completeLesson } from "../hooks/useLessonProgress";
import { updateSubjectLearningProgress, useOnboardingProfile } from "../hooks/useOnboardingProfile";

type PracticeQuestion = {
  prompt: string;
  points: number;
  answers: string[];
  correctIndex: number;
  explanation: string;
  skill: string;
};

type PracticeSet = {
  title: string;
  questions: PracticeQuestion[];
};

const practiceSets: Record<string, PracticeSet> = {
  "fraction-concept": {
    title: "Khái niệm phân số",
    questions: [
      { prompt: "Một chiếc bánh được chia đều thành 8 phần. Nam ăn 3 phần. Phân số nào biểu thị phần bánh Nam đã ăn?", points: 10, answers: ["3/8", "5/8", "8/3", "3/5"], correctIndex: 0, explanation: "Tử số là 3 phần Nam đã ăn, mẫu số là 8 phần bằng nhau của cả chiếc bánh.", skill: "Nhận biết tử số và mẫu số" },
      { prompt: "Trong phân số 5/7, số 7 cho biết điều gì?", points: 10, answers: ["Số phần được lấy", "Số phần đơn vị được chia đều", "Số phân số bằng nhau", "Kết quả phép chia"], correctIndex: 1, explanation: "Mẫu số 7 cho biết đơn vị được chia thành 7 phần bằng nhau.", skill: "Ý nghĩa mẫu số" },
      { prompt: "Phân số nào bằng với 1/2?", points: 10, answers: ["1/4", "2/3", "2/4", "3/4"], correctIndex: 2, explanation: "Nhân cả tử và mẫu của 1/2 với 2, ta được 2/4.", skill: "Phân số bằng nhau" },
    ],
  },
  "fraction-common-denominator": {
    title: "Quy đồng mẫu số",
    questions: [
      { prompt: "Mẫu số chung nhỏ nhất của 1/3 và 1/4 là bao nhiêu?", points: 10, answers: ["7", "12", "24", "1"], correctIndex: 1, explanation: "12 là bội chung nhỏ nhất của 3 và 4.", skill: "Tìm mẫu số chung" },
      { prompt: "Sau khi quy đồng 2/3 về mẫu số 12, ta được phân số nào?", points: 10, answers: ["6/12", "8/12", "9/12", "10/12"], correctIndex: 1, explanation: "Nhân cả tử và mẫu của 2/3 với 4 để được 8/12.", skill: "Quy đồng phân số" },
      { prompt: "Kết quả đúng của 2/3 + 1/4 sau khi quy đồng là gì?", points: 10, answers: ["3/7", "9/12", "11/12", "8/12"], correctIndex: 2, explanation: "2/3 = 8/12 và 1/4 = 3/12, nên tổng bằng 11/12.", skill: "Cộng sau quy đồng" },
    ],
  },
  "fraction-add-subtract": {
    title: "Cộng trừ phân số",
    questions: [
      { prompt: "Kết quả của 3/8 + 2/8 là gì?", points: 10, answers: ["5/16", "5/8", "1/8", "6/8"], correctIndex: 1, explanation: "Hai phân số cùng mẫu 8 nên chỉ cộng các tử số: 3 + 2 = 5.", skill: "Cộng phân số cùng mẫu" },
      { prompt: "Kết quả của 5/6 - 1/6 là gì?", points: 10, answers: ["4/6", "2/3", "1/6", "4/12"], correctIndex: 1, explanation: "5/6 - 1/6 = 4/6 và rút gọn được 2/3.", skill: "Rút gọn kết quả" },
      { prompt: "Bước đầu tiên khi cộng 1/2 và 1/3 là gì?", points: 10, answers: ["Cộng hai mẫu số", "Quy đồng mẫu số", "Nhân hai tử số", "Trừ hai tử số"], correctIndex: 1, explanation: "Hai mẫu khác nhau nên cần quy đồng về mẫu số 6 trước.", skill: "Nhận biết quy trình" },
    ],
  },
  "fraction-multiply-apply": {
    title: "Nhân chia và vận dụng",
    questions: [
      { prompt: "Kết quả của 2/3 × 3/5 là gì?", points: 10, answers: ["6/15", "2/5", "5/2", "1/5"], correctIndex: 1, explanation: "Có thể rút gọn 3 ở tử và mẫu trước, sau đó nhận được 2/5.", skill: "Nhân phân số" },
      { prompt: "Khi chia 3/4 cho 2/5, ta cần làm gì với 2/5?", points: 10, answers: ["Giữ nguyên", "Cộng với 3/4", "Đảo thành 5/2", "Đổi thành 4/3"], correctIndex: 2, explanation: "Chia cho một phân số là nhân với phân số nghịch đảo của nó.", skill: "Chia phân số" },
      { prompt: "Một công thức dùng 3/4 cốc sữa. Nếu làm gấp đôi, cần bao nhiêu cốc?", points: 10, answers: ["3/8", "3/2", "6/8", "1/2"], correctIndex: 1, explanation: "Gấp đôi 3/4 là 2 × 3/4 = 6/4 = 3/2.", skill: "Vận dụng phân số" },
    ],
  },
  "ratio-concept": {
    title: "Khái niệm tỉ lệ thức",
    questions: [
      { prompt: "Cặp tỉ số nào tạo thành tỉ lệ thức?", points: 10, answers: ["2/3 và 4/6", "1/2 và 3/4", "2/5 và 3/5", "4/7 và 2/7"], correctIndex: 0, explanation: "2/3 và 4/6 có giá trị bằng nhau.", skill: "Nhận biết tỉ lệ thức" },
      { prompt: "Trong a/b = c/d, điều kiện cần có là gì?", points: 10, answers: ["a và c khác 0", "b và d khác 0", "a bằng c", "b bằng d"], correctIndex: 1, explanation: "Mẫu số trong mỗi tỉ số phải khác 0.", skill: "Điều kiện tỉ số" },
      { prompt: "Tích chéo của 2/3 = 4/6 có bằng nhau không?", points: 10, answers: ["Không", "Có, đều bằng 12", "Có, đều bằng 10", "Không xác định"], correctIndex: 1, explanation: "2 × 6 = 3 × 4 = 12.", skill: "Kiểm tra bằng tích chéo" },
    ],
  },
  "ratio-property": {
    title: "Tính chất tỉ lệ thức",
    questions: [
      { prompt: "Nếu x/5 = 6/15, x bằng bao nhiêu?", points: 10, answers: ["1", "2", "3", "5"], correctIndex: 1, explanation: "Nhân chéo: 15x = 5 × 6, suy ra x = 2.", skill: "Tìm số chưa biết" },
      { prompt: "Tính chất nào giúp kiểm tra a/b = c/d?", points: 10, answers: ["a + b = c + d", "a × d = b × c", "a - b = c - d", "a = b = c = d"], correctIndex: 1, explanation: "Đây là tính chất cơ bản của tỉ lệ thức.", skill: "Tích chéo" },
      { prompt: "Khi lập tỉ lệ từ bài toán thực tế, điều quan trọng nhất là gì?", points: 10, answers: ["Đổi chỗ bất kỳ", "Giữ các đại lượng tương ứng và cùng đơn vị", "Chỉ dùng số nguyên", "Luôn rút gọn trước"], correctIndex: 1, explanation: "Các đại lượng tương ứng và đơn vị nhất quán giúp tỉ lệ đúng.", skill: "Lập tỉ lệ thức" },
    ],
  },
};

const testQuestion: PracticeQuestion = {
  prompt: "Lan đã đọc 2/3 cuốn sách vào buổi sáng và 1/4 cuốn sách vào buổi chiều. Lan đã đọc tổng cộng bao nhiêu phần cuốn sách?",
  points: 20,
  answers: ["5/12", "11/12", "3/7", "8/12"],
  correctIndex: 1,
  explanation: "Quy đồng về mẫu số 12 rồi cộng hai tử số.",
  skill: "Quy đồng và cộng phân số",
};

export function ExerciseExperience({ mode }: { mode: "practice" | "test" }) {
  const searchParams = useSearchParams();
  const subjectCode = searchParams.get("subject") || "TO";
  const chapterNumber = searchParams.get("chapter") || "01";
  const lessonId = searchParams.get("lesson") || "fraction-concept";
  const learningLevel = useOnboardingProfile(subjectCode);
  const isPractice = mode === "practice";
  const practiceSet = practiceSets[lessonId] || practiceSets["fraction-concept"];
  const questions = isPractice ? practiceSet.questions : [testQuestion];
  const lessonTitle = isPractice ? practiceSet.title : "Bài kiểm tra tổng kết";
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savedTestProgress, setSavedTestProgress] = useState(false);
  const question = questions[questionIndex];
  const correct = selected === question.correctIndex;
  const chapterLessons = chapterLessonPreviews[chapterNumber] || chapterLessonPreviews["01"];
  const lessonIndex = chapterLessons.findIndex((lesson) => lesson.id === lessonId);
  const nextLesson = lessonIndex >= 0 ? chapterLessons[lessonIndex + 1] : undefined;
  const isLastLesson = lessonIndex === chapterLessons.length - 1;
  const exerciseProgress = Math.round(((questionIndex + (checked ? 1 : 0)) / questions.length) * 100);

  const backToLessonHref = `/bai-hoc/phan-so?subject=${subjectCode}&chapter=${chapterNumber}&lesson=${lessonId}`;

  const handleCheckPractice = () => {
    if (selected === null || checked) return;
    setChecked(true);
  };

  const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      setSelected(null);
      setChecked(false);
      return;
    }

    completeLesson(subjectCode, chapterNumber, lessonId);
    updateSubjectLearningProgress(subjectCode, { xp: 60, progress: 8 });
    setCompleted(true);
  };

  const handleSaveTest = () => {
    if (selected === null || savedTestProgress) return;
    setSavedTestProgress(true);
    updateSubjectLearningProgress(subjectCode, { xp: 20, progress: 3 });
  };

  if (isPractice && completed) {
    return (
      <AppShell compact>
        <section className="exercise-page lesson-completion-page">
          <span className="completion-mark">✓</span>
          <span className="overline">Bài học đã hoàn thành</span>
          <h1>Bạn đã hoàn thành Bài {lessonIndex + 1}: {lessonTitle}</h1>
          <p>{isLastLesson ? "Bạn đã hoàn thành toàn bộ Chương 1. Chương 2: Tỉ lệ thức đã được mở trong lộ trình học." : "Tiến độ đã được ghi nhận. Bài tiếp theo đã sẵn sàng để bạn tiếp tục theo đúng thứ tự."}</p>
          <div className="completion-actions">
            {nextLesson ? (
              <Link className="primary-action" href={`/bai-hoc/phan-so?subject=${subjectCode}&chapter=${chapterNumber}&lesson=${nextLesson.id}`}>Chuyển sang Bài {nextLesson.order} <span>→</span></Link>
            ) : (
              <Link className="primary-action" href={`/hoc-tap?subject=${subjectCode}`}>Mở Chương 2 <span>→</span></Link>
            )}
            <Link className="secondary-action" href={`/hoc-tap?subject=${subjectCode}`}>Quay về trang chủ</Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell compact>
      <div className={`exercise-page ${isPractice ? "practice-mode" : "test-mode"}`}>
        <header className="exercise-header">
          <Link className="back-link" href={isPractice ? backToLessonHref : `/hoc-tap?subject=${subjectCode}`}>← {isPractice ? "Quay lại lý thuyết" : "Rời bài kiểm tra"}</Link>
          <div>
            <strong>{isPractice ? `Bài ${Math.max(lessonIndex + 1, 1)}: ${lessonTitle}` : lessonTitle}</strong>
            <span>Câu {questionIndex + 1} / {questions.length}</span>
          </div>
          <div className="timer"><span>{isPractice ? "Tiến độ bài tập" : "Thời gian còn lại"}</span><strong>{isPractice ? `${exerciseProgress}%` : "08:42"}</strong></div>
        </header>
        <div className="exercise-progress"><ProgressBar value={isPractice ? exerciseProgress : 47} /></div>

        <div className="exercise-layout">
          <section className="question-panel">
            <div className="question-meta"><span>{question.skill}</span><span>{question.points} điểm</span></div>
            <h1>{question.prompt}</h1>
            <div className="answer-list">
              {question.answers.map((answer, index) => {
                const showFeedback = isPractice && checked;
                const state = showFeedback && index === question.correctIndex ? "correct" : showFeedback && selected === index ? "wrong" : selected === index ? "selected" : "";
                return (
                  <button className={state} key={answer} onClick={() => !checked && setSelected(index)} type="button">
                    <span>{String.fromCharCode(65 + index)}</span><strong>{answer}</strong>
                    {showFeedback && index === question.correctIndex && <em>Đáp án đúng</em>}
                    {showFeedback && selected === index && index !== question.correctIndex && <em>Bạn đã chọn</em>}
                  </button>
                );
              })}
            </div>
            <div className="question-actions">
              {isPractice ? (
                <>
                  {!checked ? (
                    <button className="primary-action button-reset" disabled={selected === null} onClick={handleCheckPractice} type="button">Kiểm tra đáp án <span>→</span></button>
                  ) : (
                    <button className="primary-action button-reset" onClick={handleNextQuestion} type="button">{questionIndex === questions.length - 1 ? "Hoàn thành bài" : "Câu tiếp theo"} <span>→</span></button>
                  )}
                </>
              ) : (
                <Link aria-disabled={selected === null} className={`primary-action ${selected === null ? "action-disabled" : ""}`} href={selected === null ? `/kiem-tra?subject=${subjectCode}` : `/ket-qua?subject=${subjectCode}`} onClick={handleSaveTest}>Lưu và tiếp tục <span>→</span></Link>
              )}
            </div>
          </section>

          {isPractice && (
            <aside className={`feedback-panel ${checked ? (correct ? "feedback-correct" : "feedback-wrong") : ""}`}>
              {!checked && <><span className="feedback-symbol">?</span><h2>Nhận xét sẽ hiện sau khi kiểm tra</h2><p>Chọn một đáp án, sau đó kiểm tra để xem cách làm và lỗi cần sửa cho câu này.</p><div className="feedback-skills"><span>Kỹ năng: {question.skill}</span><span>Level: {learningLevel.name}</span></div></>}
              {checked && correct && <><span className="feedback-symbol">✓</span><h2>Chính xác</h2><p>{question.explanation}</p><div className="feedback-reward"><strong>Tiếp tục phát huy</strong><span>Nhấn “Câu tiếp theo” để hoàn thành toàn bộ bài tập.</span></div></>}
              {checked && !correct && <><span className="feedback-symbol">!</span><h2>Chưa chính xác</h2><p>{question.explanation}</p><div className="error-breakdown"><span>Kỹ năng cần ôn</span><strong>{question.skill}</strong><span>Gợi ý</span><strong>Đọc lại ví dụ ở trang lý thuyết trước khi sang câu tiếp theo.</strong></div><button className="coach-button" type="button">Nhờ AI giải thích lỗi này</button></>}
            </aside>
          )}
        </div>
      </div>
    </AppShell>
  );
}