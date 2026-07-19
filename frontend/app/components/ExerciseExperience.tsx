"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AppShell, ProgressBar } from "./AppShell";
import { updateSubjectLearningProgress, useOnboardingProfile } from "../hooks/useOnboardingProfile";
import { useBoundStore } from "@/hooks/useBoundStore";
import { recommendAdaptiveQuestion, submitAdaptiveAnswer, logAdaptiveHintUsage } from "@/lib/adaptive/api-client";
import { subjects } from "../data";

const CHAPTER_TO_CONCEPT_MAP: Record<string, { conceptId: string; setId: string }> = {
  "01": { conceptId: "ab17c195-7f0c-5e6d-8df1-d281ea313768", setId: "math-ch1-basics" }, // Tập hợp
  "02": { conceptId: "2982ab90-c7c8-53ad-8ca1-2cf97bdfc69f", setId: "math-ch2-basics" }, // Chia hết
  "03": { conceptId: "7a80d73c-c742-50c3-aa99-1aa9ced54b53", setId: "math-ch3-basics" }, // Số nguyên
  "04": { conceptId: "d20ec774-c011-52fa-807c-61f40fefa868", setId: "math-ch4-basics" }, // Hình tam giác đều
  "05": { conceptId: "34d3040f-f28b-5d42-9dca-04069d2cc8bb", setId: "math-ch5-basics" }, // Tâm đối xứng
  "06": { conceptId: "67f5affc-64a9-54f5-b51f-82f3a856ce6c", setId: "math-ch6-basics" }, // Phân số
  "07": { conceptId: "ac56ec4a-2c4b-5325-993b-c51dc9dbcd35", setId: "math-ch7-basics" }, // Số thập phân dương
  "08": { conceptId: "c1ee6b4b-4727-55e3-ae37-34635737546b", setId: "math-ch8-basics" }, // Đoạn thẳng
  "09": { conceptId: "55ffa636-9b27-5273-a435-15007dd61cd9", setId: "math-ch9-basics" }, // Dữ liệu
};

export function ExerciseExperience({ mode }: { mode: "practice" | "test" }) {
  const searchParams = useSearchParams();
  const subjectCode = searchParams.get("subject") || "TO";
  const learningLevel = useOnboardingProfile(subjectCode);
  const chapterId = searchParams.get("id") || "06";

  const { token, userId, setToken } = useBoundStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [answers, setAnswers] = useState<{ label: string; value: string }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [savedTestProgress, setSavedTestProgress] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionCounter, setQuestionCounter] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);

  const isPractice = mode === "practice";
  const currentChapter = CHAPTER_TO_CONCEPT_MAP[chapterId] || CHAPTER_TO_CONCEPT_MAP["06"];

  const currentSubject = subjects.find((s) => s.code === subjectCode);
  const courseId = currentSubject?.courseId;

  useEffect(() => {
    let active = true;
    async function loadQuestion() {
      setLoading(true);
      setError(null);
      setSelected(null);
      setChecked(false);
      setSubmitResult(null);
      setQuestionData(null);
      setAnswers([]);
      setHintLevel(0);

      try {
        const data = await recommendAdaptiveQuestion({
          token,
          studentId: userId,
          setToken,
          courseId,
          conceptId: currentChapter.conceptId,
          setId: currentChapter.setId,
        });

        if (active) {
          setQuestionData(data);
          const mappedAnswers = Object.entries(data.options || {}).map(([label, value]) => ({
            label,
            value: String(value)
          }));
          mappedAnswers.sort((a, b) => a.label.localeCompare(b.label));
          setAnswers(mappedAnswers);
          setStartTime(Date.now());
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Không thể tải câu hỏi. Hãy đảm bảo bạn đã đăng nhập và backend hoạt động.");
          setLoading(false);
        }
      }
    }

    if (userId && token) {
      loadQuestion();
    } else {
      setError("Vui lòng đăng nhập để tải câu hỏi luyện tập thích ứng.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [chapterId, userId, token, setToken, questionCounter, currentChapter.conceptId, currentChapter.setId, courseId]);

  const handleCheckPractice = async () => {
    if (selected === null || checked || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const selectedAnswerLabel = answers[selected].label;
      const responseTimeMs = Date.now() - startTime;

      const response = await submitAdaptiveAnswer({
        token,
        studentId: userId,
        setToken,
        courseId,
        conceptId: currentChapter.conceptId,
        questionId: questionData.question_id,
        decisionId: questionData.decision_id,
        studentAnswer: { selected_option: selectedAnswerLabel },
        responseTimeMs: responseTimeMs,
        hintCount: hintLevel,
      });

      setSubmitResult(response);
      setChecked(true);

      updateSubjectLearningProgress(subjectCode, {
        xp: response.is_correct ? 60 : 20,
        progress: response.is_correct ? 8 : 3,
      });
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi nộp câu trả lời.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setQuestionCounter(prev => prev + 1);
  };

  const handleShowHint = () => {
    if (!questionData?.hints || hintLevel >= questionData.hints.length) return;
    const nextLevel = hintLevel + 1;
    setHintLevel(nextLevel);

    logAdaptiveHintUsage({
      token,
      studentId: userId,
      setToken,
      courseId,
      questionId: questionData.question_id,
      decisionId: questionData.decision_id,
      hintLevel: nextLevel,
    }).catch(err => console.error("Failed to log hint:", err));
  };

  const handleSaveTest = () => {
    if (selected === null || savedTestProgress) return;
    setSavedTestProgress(true);
    updateSubjectLearningProgress(subjectCode, {
      xp: 20,
      progress: 3,
    });
  };

  const isCorrect = submitResult ? submitResult.is_correct : (selected !== null && answers[selected]?.label === questionData?.answer);

  return (
    <AppShell compact>
      <div className={`exercise-page ${isPractice ? "practice-mode" : "test-mode"}`}>
        <header className="exercise-header">
          <Link className="back-link" href={isPractice ? `/chuong?subject=${subjectCode}&id=${chapterId}` : `/hoc-tap?subject=${subjectCode}`}>
            ← {isPractice ? "Quay lại bài học" : "Rời bài kiểm tra"}
          </Link>
          <div>
            <strong>{isPractice ? `Luyện tập: ${learningLevel.name}` : "Bài kiểm tra tổng kết"}</strong>
            <span>{isPractice ? `Dạng bài ${chapterId}` : "Câu 1 / 1"}</span>
          </div>
          <div className="timer">
            <span>{isPractice ? "Tiến độ môn này" : "Thời gian còn lại"}</span>
            <strong>{isPractice ? `${learningLevel.progress}%` : "08:42"}</strong>
          </div>
        </header>
        <div className="exercise-progress"><ProgressBar value={isPractice ? learningLevel.progress : 47} /></div>

        <div className="exercise-layout">
          {loading ? (
            <div className="w-full flex flex-col items-center justify-center p-12 bg-white/80 rounded-3xl border border-primary-green/10 shadow-sm text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#58cc02] mb-4"></div>
              <p className="text-stone-600 font-bold">Sofi đang chuẩn bị câu hỏi thích ứng...</p>
            </div>
          ) : error ? (
            <div className="w-full p-8 bg-white/80 rounded-3xl border border-red-200 shadow-sm text-center">
              <p className="text-red-500 font-bold mb-4">{error}</p>
              <button className="primary-action" onClick={handleNextQuestion}>Thử lại</button>
            </div>
          ) : (
            <>
              <section className="question-panel">
                <div className="question-meta">
                  <span>{learningLevel.name}</span>
                  <span>{questionData?.question_difficulty_elo ? `Elo: ${Math.round(questionData.question_difficulty_elo)}` : "20 điểm"}</span>
                </div>
                <h1 className="text-xl font-bold leading-relaxed mb-6 text-stone-800">{questionData?.prompt}</h1>
                
                {hintLevel > 0 && questionData?.hints && (
                  <div className="mb-4 p-4 bg-yellow-50/80 border border-yellow-200 rounded-2xl text-stone-700 text-sm font-semibold">
                    <strong className="text-yellow-700 block mb-1">💡 Gợi ý (Bước {hintLevel}/{questionData.hints.length}):</strong>
                    <p>
                      {typeof questionData.hints[hintLevel - 1] === 'string'
                        ? questionData.hints[hintLevel - 1]
                        : questionData.hints[hintLevel - 1]?.content || ''}
                    </p>
                  </div>
                )}

                <div className="answer-list">
                  {answers.map((answer, index) => {
                    const showFeedback = isPractice && checked;
                    const isCorrectChoice = answer.label === questionData?.answer;
                    const isSelectedChoice = selected === index;
                    const state = showFeedback
                      ? (isCorrectChoice ? "correct" : (isSelectedChoice ? "wrong" : ""))
                      : (isSelectedChoice ? "selected" : "");
                    
                    return (
                      <button 
                        className={state} 
                        key={answer.label} 
                        onClick={() => !checked && !isSubmitting && setSelected(index)} 
                        type="button"
                      >
                        <span>{answer.label}</span>
                        <strong>{answer.value}</strong>
                        {showFeedback && isCorrectChoice && <em>Đáp án đúng</em>}
                        {showFeedback && isSelectedChoice && !isCorrectChoice && <em>Bạn đã chọn</em>}
                      </button>
                    );
                  })}
                </div>
                <div className="question-actions">
                  {isPractice ? (
                    <>
                      <button 
                        className="hint-button" 
                        type="button"
                        onClick={handleShowHint}
                        disabled={checked || !questionData?.hints || hintLevel >= questionData.hints.length}
                      >
                        Gợi ý một bước
                      </button>
                      {!checked ? (
                        <button 
                          className="primary-action button-reset" 
                          disabled={selected === null || isSubmitting} 
                          onClick={handleCheckPractice} 
                          type="button"
                        >
                          {isSubmitting ? "Đang gửi..." : "Kiểm tra đáp án"}<span>→</span>
                        </button>
                      ) : (
                        <button className="primary-action" onClick={handleNextQuestion}>
                          Câu tiếp theo<span>→</span>
                        </button>
                      )}
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
                <aside className={`feedback-panel ${checked ? (isCorrect ? "feedback-correct" : "feedback-wrong") : ""}`}>
                  {!checked ? (
                    <>
                      <span className="feedback-symbol">?</span>
                      <h2>Nhận xét sẽ xuất hiện tại đây</h2>
                      <p>Chọn một đáp án để nhận phân tích ngay về cách làm và lỗi sai.</p>
                      <div className="feedback-skills">
                        <span>Dạng bài: {chapterId}</span>
                        <span>Level: {learningLevel.name}</span>
                        <span>Tiến độ: {learningLevel.progress}%</span>
                      </div>
                    </>
                  ) : isCorrect ? (
                    <>
                      <span className="feedback-symbol">✓</span>
                      <h2>Chính xác</h2>
                      <p>{questionData?.explanation || "Bạn đã thực hiện phép tính và chọn đáp án chính xác."}</p>
                      <div className="feedback-reward">
                        <strong>+60 XP</strong>
                        {submitResult && (
                          <span className="block mt-1 text-[11px] text-stone-500">
                            Elo: {Math.round(submitResult.old_elo)} → <strong>{Math.round(submitResult.new_elo)}</strong> (+{Math.round(submitResult.new_elo - submitResult.old_elo)})
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="feedback-symbol">!</span>
                      <h2>Chưa chính xác</h2>
                      <p>{questionData?.explanation || "Đáp án bạn chọn chưa chính xác. Hãy xem kỹ gợi ý giải thích bên dưới."}</p>
                      <div className="error-breakdown">
                        <span>Kết quả ELO</span>
                        {submitResult ? (
                          <strong>
                            Elo: {Math.round(submitResult.old_elo)} → {Math.round(submitResult.new_elo)} ({Math.round(submitResult.new_elo - submitResult.old_elo)})
                          </strong>
                        ) : (
                          <strong>0 Elo</strong>
                        )}
                        <span>Đáp án đúng là</span>
                        <strong>{questionData?.answer}</strong>
                      </div>
                      <Link 
                        className="coach-button block text-center mt-4 p-2 bg-[#ffc800] hover:bg-[#ffb000] text-black font-bold rounded-xl border border-b-4 border-black transition-all active:translate-y-1 active:border-b-0"
                        href={`/hoi-dap-ai?subject=${subjectCode}&prompt=${encodeURIComponent(`Lucy ơi, giải thích giúp mình lỗi sai này với: câu hỏi "${questionData?.prompt}" có đáp án đúng là ${questionData?.answer} nhưng mình chọn ${answers[selected || 0]?.label}`)}`}
                      >
                        Nhờ AI giải thích lỗi này
                      </Link>
                    </>
                  )}
                </aside>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
