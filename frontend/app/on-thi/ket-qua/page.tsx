"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ArrowRight, CheckCircle, ClipboardText, Sparkle, Target, TrendUp, WarningCircle } from "@phosphor-icons/react";
import { AppShell } from "../../components/AppShell";
import { MathText } from "../../components/MathText";
import { examWorkflowRepository, examWorkflowSession } from "../exam-workflow";
import styles from "../exam.module.css";

function scoreLabel(score: number) {
  return String(score).replace(".", ",");
}

function ExamResultPageContent() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignment") || searchParams.get("exam") || "";
  const studentId = examWorkflowSession.getCurrentStudentId();
  const workspace = assignmentId ? examWorkflowRepository.getWorkspace(assignmentId, studentId) : null;
  const result = assignmentId ? examWorkflowRepository.getResult(assignmentId, studentId) : null;
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedWrongId, setSelectedWrongId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  if (!workspace || !result) {
    return (
      <main className={styles.examStatePage}>
        <section className={styles.examStateCard}>
          <WarningCircle size={28} weight="regular" />
          <h1>Chưa có kết quả để hiển thị</h1>
          <p>Kết quả sẽ xuất hiện sau khi bài làm được gửi và hệ thống hoàn tất chấm điểm.</p>
          <Link className={styles.primaryLink} href="/on-thi">Quay lại danh sách đề <ArrowRight size={16} weight="bold" /></Link>
        </section>
      </main>
    );
  }

  const wrongQuestions = result.reviewItems.filter((item) => !item.isCorrect);
  const activeWrong = wrongQuestions.find((item) => item.questionId === selectedWrongId) || null;
  const allWrongReviewed = wrongQuestions.length > 0 && wrongQuestions.every((item) => reviewedIds.includes(item.questionId));
  const isOriginalAssignment = !workspace.assignment.parentAssignmentId;
  const generatedChildren = isOriginalAssignment ? examWorkflowRepository.getChildAssignments(workspace.assignment.id, studentId) : [];

  const openReview = () => {
    const firstWrong = wrongQuestions[0];
    if (!firstWrong) return;
    setReviewOpen(true);
    setSelectedWrongId(firstWrong.questionId);
    setReviewedIds([firstWrong.questionId]);
  };

  const selectWrongQuestion = (questionId: string) => {
    setSelectedWrongId(questionId);
    setReviewedIds((current) => current.includes(questionId) ? current : [...current, questionId]);
  };

  return (
    <main className={styles.page}>
        <section className={styles.resultHero}>
          <div>
            <span className={styles.eyebrow}>KẾT QUẢ ĐÃ CHẤM</span>
            <h1>{workspace.assignment.title}</h1>
            <p>AI đã chấm bài, xác định kỹ năng làm tốt và những lỗi cần sửa trước lần ôn tiếp theo.</p>
            <div className={styles.resultMetrics}>
              <div><span>Câu đúng</span><strong>{result.correctAnswers} / {result.totalQuestions}</strong></div>
              <div><span>Điểm mạnh</span><strong>{result.strength}</strong></div>
              <div><span>Cần cải thiện</span><strong>{result.improvementFocus}</strong></div>
            </div>
          </div>
          <div className={styles.scoreMedallion}><strong>{scoreLabel(result.score)}</strong><small>/ 10 điểm</small></div>
        </section>

        {isOriginalAssignment && generatedChildren.length > 0 && (
          <section className={styles.aiSuggestion}>
            <div>
              <span><Sparkle size={21} weight="fill" /></span>
              <div><p>ĐỀ CON ĐÃ ĐƯỢC TẠO</p><h2>AI đã chuẩn bị {generatedChildren.length} đề theo điểm cần cải thiện</h2><small>Đề mới tập trung vào những câu bạn làm sai và các câu cùng dạng. Chúng sẽ chỉ xuất hiện trong danh sách đề sau khi bạn quay lại.</small></div>
            </div>
            <Link className={styles.primaryLink} href="/on-thi">Hoàn thành <ArrowRight size={16} weight="bold" /></Link>
          </section>
        )}

        <section className={styles.resultBody}>
          <article className={styles.analysisPanel}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Câu sai cần xem lại</h2>
                <p>Chọn từng lỗi để xem đáp án và cách làm. Khi đã xem hết, AI sẽ đánh giá đề luyện nào phù hợp để làm tiếp.</p>
              </div>
              <ClipboardText size={24} weight="regular" />
            </div>

            {wrongQuestions.length === 0 ? (
              <div className={styles.reviewPrompt}>
                <span className={styles.reviewStatus}><CheckCircle size={20} weight="fill" /></span>
                <div><strong>Bạn đã làm đúng tất cả câu hỏi</strong><p>AI sẽ dùng kết quả này để chọn đề có mức độ cao hơn ở lần học tiếp theo.</p></div>
              </div>
            ) : !reviewOpen ? (
              <div className={styles.reviewPrompt}>
                <span className={styles.reviewStatus}><WarningCircle size={20} weight="bold" /></span>
                <div><strong>Bạn có {wrongQuestions.length} câu cần xem lại</strong><p>Mỗi câu có đáp án đúng, kỹ năng liên quan và lời giải cụ thể.</p></div>
                <button className={styles.continueButton} type="button" onClick={openReview}>Xem câu sai <ArrowRight size={16} weight="bold" /></button>
              </div>
            ) : (
              <div className={styles.wrongReviewList}>
                {wrongQuestions.map((question, index) => {
                  const selected = question.questionId === selectedWrongId;
                  const reviewed = reviewedIds.includes(question.questionId);
                  return (
                    <button className={styles.wrongReviewItem + (selected ? " " + styles.wrongReviewItemActive : "")} type="button" key={question.questionId} onClick={() => selectWrongQuestion(question.questionId)}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>Câu {question.order}. <MathText value={question.prompt} /></strong><small>{reviewed ? "Đã xem lời giải" : "Chưa xem lời giải"}</small></div>
                      {reviewed ? <CheckCircle size={18} weight="fill" /> : <ArrowRight size={17} weight="bold" />}
                    </button>
                  );
                })}
              </div>
            )}
          </article>

          <aside className={styles.explanationPanel}>
            {!activeWrong ? (
              <div className={styles.explanationEmpty}>
                <span><Target size={24} weight="regular" /></span>
                <h2>Lời giải theo từng lỗi</h2>
                <p>{wrongQuestions.length ? "Bấm “Xem câu sai” để mở lời giải và cách cải thiện cho từng câu." : "Không có lỗi cần xem lại trong bài làm này."}</p>
              </div>
            ) : (
              <div className={styles.explanationContent}>
                <span className={styles.explanationQuestion}>CÂU {activeWrong.order}</span>
                <h2><MathText value={activeWrong.prompt} /></h2>
                <div className={styles.explanationFacts}>
                  <div><span>Đáp án bạn chọn</span><strong><MathText value={activeWrong.selectedChoice} /></strong></div>
                  <div><span>Đáp án đúng</span><strong><MathText value={activeWrong.correctChoice} /></strong></div>
                  <div><span>Kỹ năng cần sửa</span><strong>{activeWrong.skill.label}</strong></div>
                </div>
                <div className={styles.explanationReason}>
                  <strong>Vì sao đáp án này đúng</strong>
                  <p><MathText value={activeWrong.explanation} /></p>
                </div>
                <p className={styles.reviewProgress}>{reviewedIds.length}/{wrongQuestions.length} lỗi đã xem</p>
              </div>
            )}
          </aside>
        </section>

        {allWrongReviewed && !isOriginalAssignment && (
          <section className={styles.aiSuggestion}>
            <div>
              <span><CheckCircle size={21} weight="fill" /></span>
              <div><p>ĐÃ XEM XONG LỖI SAI</p><h2>Hoàn thành lượt ôn này</h2><small>Kết quả đã được lưu để AI và giáo viên theo dõi mức độ cải thiện ở những lần làm tiếp theo.</small></div>
            </div>
            <Link className={styles.primaryLink} href="/on-thi">Hoàn thành <ArrowRight size={16} weight="bold" /></Link>
          </section>
        )}

        <section className={styles.historySection}>
          <div className={styles.sectionHead}>
            <div><h2>Ghi nhận từ bài làm</h2><p>Kết quả này được lưu theo từng lượt làm để giáo viên và AI theo dõi mức cải thiện.</p></div>
            <TrendUp size={24} weight="regular" />
          </div>
          <article className={styles.historyItem}>
            <span className={styles.resultSignal}><CheckCircle size={20} weight="bold" /></span>
            <div><strong>Điểm mạnh: {result.strength}</strong><small>AI sẽ giữ kỹ năng này trong lịch sử học tập khi tạo đề tiếp theo.</small></div>
            <Link href="/hoc-tap?subject=TO">Ôn kiến thức <ArrowRight size={15} weight="bold" /></Link>
          </article>
        </section>
      </main>
  );
}

export default function ExamResultPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải kết quả thi...</div>}>
      <AppShell compact>
        <ExamResultPageContent />
      </AppShell>
    </Suspense>
  );
}
