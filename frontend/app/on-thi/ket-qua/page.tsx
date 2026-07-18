"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle, ClipboardText, Lock, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { AppShell } from "../../components/AppShell";
import { MathText } from "../../components/MathText";
import { examWorkflowRepository, examWorkflowSession, type ExamReviewItem } from "../exam-workflow";
import styles from "../exam.module.css";

function scoreLabel(score: number) {
  return String(score).replace(".", ",");
}

function WrongQuestionExplanation({
  item,
  reviewed,
  reviewedCount,
  total,
  onMarkReviewed,
}: {
  item: ExamReviewItem;
  reviewed: boolean;
  reviewedCount: number;
  total: number;
  onMarkReviewed: () => void;
}) {
  return (
    <div className={styles.explanationContent}>
      <span className={styles.explanationQuestion}>CÂU {item.order}</span>
      <h2><MathText value={item.prompt} /></h2>
      <div className={styles.explanationFacts}>
        <div><span>Đáp án bạn chọn</span><strong><MathText value={item.selectedChoice} /></strong></div>
        <div><span>Đáp án đúng</span><strong><MathText value={item.correctChoice} /></strong></div>
        <div><span>Kỹ năng cần sửa</span><strong>{item.skill.label}</strong></div>
      </div>
      <div className={styles.explanationReason}>
        <strong>Vì sao đáp án này đúng</strong>
        <p><MathText value={item.explanation} /></p>
      </div>
      <div className={styles.explanationFooter}>
        <p className={styles.reviewProgress}>{reviewedCount}/{total} lỗi đã xem</p>
        <button className={styles.reviewAcknowledge} type="button" onClick={onMarkReviewed} disabled={reviewed}>
          <CheckCircle size={16} weight={reviewed ? "fill" : "regular"} />
          {reviewed ? "Đã xem lời giải" : "Đánh dấu đã xem"}
        </button>
      </div>
    </div>
  );
}

export default function ExamResultPage() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignment") || searchParams.get("exam") || "";
  const studentId = examWorkflowSession.getCurrentStudentId();
  const workspace = assignmentId ? examWorkflowRepository.getWorkspace(assignmentId, studentId) : null;
  const result = assignmentId ? examWorkflowRepository.getResult(assignmentId, studentId) : null;
  const [selectedWrongId, setSelectedWrongId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  if (!workspace || !result) {
    return (
      <AppShell compact>
        <main className={styles.examStatePage}>
          <section className={styles.examStateCard}>
            <WarningCircle size={28} weight="regular" />
            <h1>Chưa có kết quả để hiển thị</h1>
            <p>Kết quả sẽ xuất hiện sau khi bài làm được gửi và hệ thống hoàn tất chấm điểm.</p>
            <Link className={styles.primaryLink} href="/on-thi">Quay lại danh sách đề <ArrowRight size={16} weight="bold" /></Link>
          </section>
        </main>
      </AppShell>
    );
  }

  const wrongQuestions = result.reviewItems.filter((item) => !item.isCorrect);
  const activeWrong = wrongQuestions.find((item) => item.questionId === selectedWrongId) || wrongQuestions[0] || null;
  const allWrongReviewed = wrongQuestions.length === 0 || wrongQuestions.every((item) => reviewedIds.includes(item.questionId));
  const isOriginalAssignment = !workspace.assignment.parentAssignmentId;
  const generatedChildren = isOriginalAssignment ? examWorkflowRepository.getChildAssignments(workspace.assignment.id, studentId) : [];

  const selectWrongQuestion = (questionId: string) => {
    setSelectedWrongId(questionId);
  };

  const markWrongAsReviewed = (questionId: string) => {
    setReviewedIds((current) => current.includes(questionId) ? current : [...current, questionId]);
  };

  return (
    <AppShell compact>
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

        <section className={styles.analysisPanel}>
          <div className={styles.sectionHead}>
            <div>
              <h2>Câu sai và lời giải</h2>
              <p>Chọn từng câu để xem đáp án và cách làm. Xem hết các lỗi để mở đề luyện cá nhân hóa.</p>
            </div>
            <ClipboardText size={24} weight="regular" />
          </div>

          {wrongQuestions.length === 0 ? (
            <div className={styles.reviewPrompt}>
              <span className={styles.reviewStatus}><CheckCircle size={20} weight="fill" /></span>
              <div>
                <strong>Bạn đã làm đúng tất cả câu hỏi</strong>
                <p>AI sẽ dùng kết quả này để chọn đề có mức độ cao hơn ở lần học tiếp theo.</p>
              </div>
            </div>
          ) : activeWrong ? (
            <div className={styles.reviewWorkspace}>
              <div className={styles.wrongReviewList}>
                {wrongQuestions.map((question, index) => {
                  const selected = question.questionId === activeWrong.questionId;
                  const reviewed = reviewedIds.includes(question.questionId);
                  return (
                    <div key={question.questionId}>
                      <button className={styles.wrongReviewItem + (selected ? " " + styles.wrongReviewItemActive : "")} type="button" onClick={() => selectWrongQuestion(question.questionId)}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div><strong>Câu {question.order}. <MathText value={question.prompt} /></strong><small>{reviewed ? "Đã xem lời giải" : selected ? "Đang xem lời giải" : "Chưa xem lời giải"}</small></div>
                        {reviewed ? <CheckCircle size={18} weight="fill" /> : <ArrowRight size={17} weight="bold" />}
                      </button>
                      {selected && (
                        <div className={styles.mobileExplanation}>
                          <WrongQuestionExplanation
                            item={question}
                            reviewed={reviewed}
                            reviewedCount={reviewedIds.length}
                            total={wrongQuestions.length}
                            onMarkReviewed={() => markWrongAsReviewed(question.questionId)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <aside className={styles.explanationPanel}>
                <WrongQuestionExplanation
                  item={activeWrong}
                  reviewed={reviewedIds.includes(activeWrong.questionId)}
                  reviewedCount={reviewedIds.length}
                  total={wrongQuestions.length}
                  onMarkReviewed={() => markWrongAsReviewed(activeWrong.questionId)}
                />
              </aside>
            </div>
          ) : null}
        </section>

        {isOriginalAssignment && generatedChildren.length > 0 && (
          <section className={styles.aiSuggestion + (allWrongReviewed ? "" : " " + styles.aiSuggestionLocked)}>
            <div>
              <span>{allWrongReviewed ? <Sparkle size={21} weight="fill" /> : <Lock size={21} weight="bold" />}</span>
              <div>
                <p>{allWrongReviewed ? "ĐỀ CON ĐÃ SẴN SÀNG" : "ĐỀ CON ĐANG CHỜ MỞ"}</p>
                <h2>{allWrongReviewed ? "AI đã chuẩn bị " + generatedChildren.length + " đề theo điểm cần cải thiện" : "Xem hết " + wrongQuestions.length + " câu sai để mở đề luyện cá nhân hóa"}</h2>
                <small>{allWrongReviewed ? "Đề mới tập trung vào những câu bạn làm sai và các câu cùng dạng. Chúng sẽ xuất hiện trong danh sách đề sau khi bạn quay lại." : "Mỗi lời giải đã xem giúp AI xác nhận đúng kỹ năng cần củng cố trước khi mở đề mới."}</small>
              </div>
            </div>
            {allWrongReviewed ? (
              <Link className={styles.primaryLink} href="/on-thi">Hoàn thành <ArrowRight size={16} weight="bold" /></Link>
            ) : (
              <span className={styles.aiSuggestionStatus}><Lock size={15} weight="bold" /> {reviewedIds.length}/{wrongQuestions.length} lỗi đã xem</span>
            )}
          </section>
        )}

        {allWrongReviewed && !isOriginalAssignment && (
          <section className={styles.aiSuggestion}>
            <div>
              <span><CheckCircle size={21} weight="fill" /></span>
              <div><p>ĐÃ XEM XONG LỖI SAI</p><h2>Hoàn thành lượt ôn này</h2><small>Kết quả đã được lưu để AI và giáo viên theo dõi mức độ cải thiện ở những lần làm tiếp theo.</small></div>
            </div>
            <Link className={styles.primaryLink} href="/on-thi">Hoàn thành <ArrowRight size={16} weight="bold" /></Link>
          </section>
        )}
      </main>
    </AppShell>
  );
}
