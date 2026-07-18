"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import { AppShell } from "./AppShell";
import { MathText } from "./MathText";
import { examWorkflowRepository, examWorkflowSession, type ExamAnswerSubmission, type ExamQuestion } from "../on-thi/exam-workflow";
import styles from "../on-thi/exam.module.css";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return minutes + ":" + seconds;
}

function difficultyLabel(question: ExamQuestion) {
  if (question.difficulty === "recognition") return "Nhận biết";
  if (question.difficulty === "understanding") return "Thông hiểu";
  return "Vận dụng";
}

function resultHref(assignmentId: string) {
  return "/on-thi/ket-qua?assignment=" + assignmentId;
}

export function ExamExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignment") || searchParams.get("exam") || "";
  const studentId = examWorkflowSession.getCurrentStudentId();
  const workspace = useMemo(() => assignmentId ? examWorkflowRepository.getWorkspace(assignmentId, studentId) : null, [assignmentId, studentId]);
  const [stage, setStage] = useState<"opening" | "exam" | "grading">("opening");
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(workspace?.assignment.assessment.durationSeconds || 0);
  const [submitNotice, setSubmitNotice] = useState("");
  const startedAtRef = useRef("");

  useEffect(() => {
    if (!workspace || !workspace.access.canStart) return;
    startedAtRef.current = new Date().toISOString();
    const timeout = window.setTimeout(() => setStage("exam"), 550);
    return () => window.clearTimeout(timeout);
  }, [workspace]);

  useEffect(() => {
    if (stage !== "exam" || !workspace) return;
    const interval = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [stage, workspace]);

  if (!workspace) {
    return (
      <AppShell compact>
        <main className={styles.examStatePage}>
          <section className={styles.examStateCard}>
            <WarningCircle size={28} weight="regular" />
            <h1>Không tìm thấy đề thi</h1>
            <p>Đề có thể đã bị gỡ hoặc đường dẫn không còn hợp lệ.</p>
            <Link className={styles.primaryLink} href="/on-thi">Quay lại danh sách đề <ArrowRight size={16} weight="bold" /></Link>
          </section>
        </main>
      </AppShell>
    );
  }

  const { assignment, questions, access } = workspace;
  const activeQuestion = questions[activeIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  if (!access.canStart) {
    const isCompleted = access.lifecycle === "completed";
    return (
      <AppShell compact>
        <main className={styles.examStatePage}>
          <section className={styles.examStateCard}>
            <WarningCircle size={28} weight="regular" />
            <span>{access.label}</span>
            <h1>{assignment.title}</h1>
            <p>{access.message || "Bạn chưa thể mở đề này ở thời điểm hiện tại."}</p>
            {isCompleted ? <Link className={styles.primaryLink} href={resultHref(assignment.id)}>Xem kết quả <ArrowRight size={16} weight="bold" /></Link> : <Link className={styles.primaryLink} href="/on-thi">Quay lại danh sách đề <ArrowRight size={16} weight="bold" /></Link>}
          </section>
        </main>
      </AppShell>
    );
  }

  const submitExam = async () => {
    if (answeredCount === 0) {
      setSubmitNotice("Hãy chọn ít nhất một đáp án trước khi nộp bài.");
      return;
    }

    const payload: ExamAnswerSubmission = {
      assignmentId: assignment.id,
      studentId,
      startedAt: startedAtRef.current || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      answers: questions.map((question) => ({ questionId: question.id, choiceIndex: answers[question.id] ?? null })),
    };

    setSubmitNotice("");
    setStage("grading");

    try {
      await examWorkflowRepository.submitAttempt(payload);
      window.setTimeout(() => router.push(resultHref(assignment.id)), 1100);
    } catch {
      setStage("exam");
      setSubmitNotice("Chưa thể gửi bài. Kiểm tra kết nối rồi thử nộp lại.");
    }
  };

  if (stage === "opening" || stage === "grading") {
    const isGrading = stage === "grading";
    return (
      <AppShell compact>
        <main className={styles.examStatePage}>
          <section className={styles.examStateCard + " " + styles.examStateLoading} aria-live="polite">
            <span className={styles.examStateMark}>{isGrading ? <CheckCircle size={26} weight="fill" /> : <Clock size={26} weight="regular" />}</span>
            <span>{isGrading ? "ĐANG CHẤM BÀI" : "ĐANG MỞ ĐỀ ĐƯỢC GIAO"}</span>
            <h1>{isGrading ? "Đang phân tích bài làm" : assignment.title}</h1>
            <p>{isGrading ? "AI đang đối chiếu câu trả lời, xác định lỗi cần sửa và chuẩn bị đề cải thiện phù hợp." : "Đang tải câu hỏi, thời lượng và điều kiện làm bài từ đề giáo viên giao."}</p>
            <div className={styles.examStateSteps}>
              <span><CheckCircle size={15} weight="fill" />{isGrading ? "Đối chiếu đáp án" : "Xác nhận thời hạn"}</span>
              <span><CheckCircle size={15} weight="fill" />{isGrading ? "Phân tích kỹ năng" : "Tải danh sách câu hỏi"}</span>
              <span><Clock size={15} weight="regular" />{isGrading ? "Chuẩn bị kết quả" : "Mở không gian làm bài"}</span>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell compact>
      <main className={styles.examFocusPage}>
        <header className={styles.examFocusHeader}>
          <Link className={styles.examBack} href="/on-thi"><ArrowLeft size={16} weight="bold" /> Danh sách đề</Link>
          <div className={styles.examIdentity}>
            <span>Đề do {assignment.teacher.name} giao</span>
            <h1>{assignment.title}</h1>
          </div>
          <div className={styles.examClock}>
            <span><Clock size={15} weight="regular" /> Thời gian còn lại</span>
            <strong>{formatTime(secondsLeft)}</strong>
          </div>
        </header>

        <section className={styles.examFocusWorkspace}>
          <article className={styles.examQuestionPanel}>
            <div className={styles.examQuestionMeta}>
              <span>Câu {activeQuestion.order} / {questions.length}</span>
              <span>{difficultyLabel(activeQuestion)}</span>
            </div>
            <h2><MathText value={activeQuestion.prompt} /></h2>
            <div className={styles.examAnswerStack}>
              {activeQuestion.choices.map((choice, index) => (
                <button key={choice} type="button" className={styles.examAnswerOption + (answers[activeQuestion.id] === index ? " " + styles.examAnswerOptionSelected : "")} onClick={() => setAnswers((current) => ({ ...current, [activeQuestion.id]: index }))}>
                  <span>{String.fromCharCode(65 + index)}</span>
                  <strong><MathText value={choice} /></strong>
                </button>
              ))}
            </div>
            <footer className={styles.examQuestionActions}>
              <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}><ArrowLeft size={16} weight="bold" /> Câu trước</button>
              {activeIndex < questions.length - 1 ? <button type="button" onClick={() => setActiveIndex((index) => Math.min(questions.length - 1, index + 1))}>Câu tiếp <ArrowRight size={16} weight="bold" /></button> : <span>Đã đến câu cuối</span>}
            </footer>
          </article>

          <aside className={styles.examNavigator}>
            <div className={styles.examNavigatorHead}>
              <div><span>TIẾN ĐỘ</span><strong>{answeredCount}/{questions.length} câu</strong></div>
              <small>{unansweredCount > 0 ? "Còn " + unansweredCount + " câu chưa chọn" : "Đã trả lời tất cả câu"}</small>
            </div>
            <div className={styles.examQuestionGrid}>
              {questions.map((question, index) => {
                const selected = activeIndex === index;
                const answered = answers[question.id] !== undefined;
                return <button type="button" key={question.id} className={styles.examQuestionIndex + (selected ? " " + styles.examQuestionIndexActive : "") + (answered ? " " + styles.examQuestionIndexAnswered : "")} onClick={() => setActiveIndex(index)} aria-label={"Chuyển đến câu " + question.order}>{question.order}</button>;
              })}
            </div>
            <div className={styles.examNavigatorNote}><WarningCircle size={19} weight="regular" /><span>Bạn vẫn có thể nộp bài khi còn câu chưa trả lời. Các câu đó sẽ được phản ánh trong gợi ý học tiếp theo.</span></div>
            {submitNotice && <p className={styles.examSubmitNotice} role="alert">{submitNotice}</p>}
            <button className={styles.examSubmitButton} type="button" onClick={submitExam}>Nộp bài để chấm <ArrowRight size={17} weight="bold" /></button>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
