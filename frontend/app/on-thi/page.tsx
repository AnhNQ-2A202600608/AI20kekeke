"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle, Clock, Sparkle } from "@phosphor-icons/react";
import { AppShell } from "../components/AppShell";
import { Suspense } from "react";
import { examWorkflowRepository, examWorkflowSession, type ExamKind, type StudentExamAssignment } from "./exam-workflow";
import styles from "./exam.module.css";

function formatDate(value?: string) {
  if (!value) return "Không giới hạn hạn nộp";
  return value.split("T")[0].split("-").reverse().join("/");
}

function formatDuration(seconds: number) {
  return Math.ceil(seconds / 60) + " phút";
}

function kindLabel(kind: ExamKind) {
  if (kind === "chapter_practice") return "Đề ôn luyện theo chương";
  if (kind === "midterm_review") return "Đề tổng hợp giữa kỳ";
  if (kind === "final_review") return "Đề tổng hợp cuối kỳ";
  return "Đề cải thiện theo lỗi sai";
}

function lifecycleClass(lifecycle: StudentExamAssignment["access"]["lifecycle"]) {
  return styles["assignmentStatus" + lifecycle[0].toUpperCase() + lifecycle.slice(1)];
}

function examHref(assignmentId: string) {
  return "/on-thi/de-thi?assignment=" + assignmentId;
}

function resultHref(assignmentId: string) {
  return "/on-thi/ket-qua?assignment=" + assignmentId;
}

function AssignedExamCard({ item, number, studentId }: { item: StudentExamAssignment; number: number; studentId: string }) {
  const children = examWorkflowRepository.getChildAssignments(item.assignment.id, studentId);
  const { assignment, access, latestAttempt } = item;

  return (
    <article className={styles.assignedExam + " " + styles["assignedExam" + access.lifecycle[0].toUpperCase() + access.lifecycle.slice(1)]}>
      <div className={styles.assignmentNumber}>{String(number).padStart(2, "0")}</div>
      <div className={styles.assignmentMain}>
        <header className={styles.assignmentHeader}>
          <div>
            <span className={styles.assignmentType}>{kindLabel(assignment.kind)}</span>
            <h3>{assignment.title}</h3>
            <p>{assignment.teacher.name} · {assignment.assessment.questionCount} câu · {formatDuration(assignment.assessment.durationSeconds)}</p>
          </div>
          <div className={styles.assignmentAction}>
            <span className={styles.assignmentStatus + " " + lifecycleClass(access.lifecycle)}>{access.label}</span>
            {access.canStart ? (
              <Link className={styles.primaryLink} href={examHref(assignment.id)}>Làm đề <ArrowRight size={16} weight="bold" /></Link>
            ) : latestAttempt?.resultId || access.lifecycle === "completed" ? (
              <Link className={styles.assignmentTextLink} href={resultHref(assignment.id)}>Xem kết quả <ArrowRight size={15} weight="bold" /></Link>
            ) : (
              <span className={styles.assignmentDue}><Clock size={15} weight="regular" /> {access.message || formatDate(assignment.schedule.opensAt)}</span>
            )}
          </div>
        </header>

        <div className={styles.assignmentSchedule}>
          <span>Hạn nộp</span>
          <strong>{formatDate(assignment.schedule.dueAt)}</strong>
          <span>Lượt làm</span>
          <strong>{assignment.assessment.attemptLimit}</strong>
        </div>

        {children.length > 0 && (
          <div className={styles.childAssignmentArea}>
            <div className={styles.childAssignmentLead}><Sparkle size={17} weight="fill" /><span>Đề con được tạo từ lỗi sai và các câu cùng dạng</span></div>
            <div className={styles.childAssignmentList}>
              {children.map((child, childIndex) => (
                <article className={styles.assignedChild + " " + styles["assignedChild" + child.access.lifecycle[0].toUpperCase() + child.access.lifecycle.slice(1)]} key={child.assignment.id}>
                  <span>Đề con {String(childIndex + 1).padStart(2, "0")}</span>
                  <strong>{child.assignment.title}</strong>
                  <p>{child.assignment.assessment.questionCount} câu · {formatDuration(child.assignment.assessment.durationSeconds)}</p>
                  {child.access.canStart ? (
                    <Link href={examHref(child.assignment.id)}>Làm đề con <ArrowRight size={14} weight="bold" /></Link>
                  ) : child.access.lifecycle === "completed" ? (
                    <Link href={resultHref(child.assignment.id)}>Xem kết quả <ArrowRight size={14} weight="bold" /></Link>
                  ) : (
                    <small>{child.access.message || child.access.label}</small>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function ExamPreparationPageContent() {
  const studentId = examWorkflowSession.getCurrentStudentId();
  const rootAssignments = examWorkflowRepository.getRootAssignments(studentId);
  const chapterAssignments = rootAssignments.filter((item) => item.assignment.kind === "chapter_practice");
  const termAssignments = rootAssignments.filter((item) => item.assignment.kind === "midterm_review" || item.assignment.kind === "final_review");
  const availableCount = rootAssignments.filter((item) => item.access.canStart).length;
  const availableChildCount = rootAssignments.flatMap((item) => examWorkflowRepository.getChildAssignments(item.assignment.id, studentId)).filter((item) => item.access.canStart).length;

  return (
    <main className={styles.page}>
        <section className={styles.intro + " " + styles.assignedHero}>
          <div>
            <span className={styles.eyebrow}>ÔN THI THEO ĐỀ ĐƯỢC GIAO</span>
            <h1>Đề của giáo viên, lộ trình dành riêng cho bạn</h1>
            <p>Đề ôn theo chương củng cố kiến thức nền. Đề giữa kỳ và cuối kỳ kiểm tra khả năng tổng hợp theo đúng phạm vi được giao.</p>
          </div>
          <aside className={styles.readinessCard}>
            <div><span>Đề đang có thể làm</span><strong>{availableCount}</strong></div>
            <div className={styles.metricTrack}><i style={{ width: Math.min(100, (availableCount + availableChildCount) * 25) + "%" }} /></div>
            <div className={styles.metricRow}><span>Đề lớn đang mở</span><strong>{availableCount}</strong></div>
            <div className={styles.metricRow}><span>Đề con đã mở</span><strong>{availableChildCount}</strong></div>
          </aside>
        </section>

        <section className={styles.assignmentBoard} aria-labelledby="assigned-exams-title">
          <header className={styles.sectionHead}>
            <div>
              <h2 id="assigned-exams-title">Đề giáo viên đã giao</h2>
              <p>Trạng thái của mỗi đề được xác định từ lịch mở, hạn nộp, lượt làm và điều kiện hoàn thành đề trước.</p>
            </div>
            <BookOpenText size={25} weight="regular" />
          </header>

          <div className={styles.assignmentGroups}>
            <section className={styles.assignmentGroup}>
              <header className={styles.assignmentGroupHead}>
                <div><span>ÔN LUYỆN THEO CHƯƠNG</span><h3>Chọn một chương để luyện đúng phần đang học</h3><p>Đề con chỉ xuất hiện sau khi đề gốc đã được chấm; AI tạo đề theo đúng kỹ năng cần cải thiện.</p></div>
                <strong>{chapterAssignments.length} chương</strong>
              </header>
              <div className={styles.assignedExamList}>{chapterAssignments.map((item, index) => <AssignedExamCard item={item} key={item.assignment.id} number={index + 1} studentId={studentId} />)}</div>
            </section>

            <section className={styles.assignmentGroup + " " + styles.assignmentGroupTerm}>
              <header className={styles.assignmentGroupHead}>
                <div><span>ĐỀ KIỂM TRA THEO KỲ</span><h3>Đề ôn tập giữa kỳ và cuối kỳ</h3><p>Đề tổng hợp nhiều chương theo lịch và phạm vi mà giáo viên đã giao cho lớp.</p></div>
                <strong>{termAssignments.length} đề</strong>
              </header>
              <div className={styles.assignedExamList}>{termAssignments.map((item, index) => <AssignedExamCard item={item} key={item.assignment.id} number={index + 1} studentId={studentId} />)}</div>
            </section>
          </div>
        </section>

        <p className={styles.assignmentHint}><CheckCircle size={16} weight="fill" /> Sau khi nộp đề gốc, AI tạo đề con từ lỗi sai và câu cùng dạng. Hoàn thành để quay lại đây xem các đề mới.</p>
      </main>
  );
}

export default function ExamPreparationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải danh sách đề ôn...</div>}>
      <AppShell compact>
        <ExamPreparationPageContent />
      </AppShell>
    </Suspense>
  );
}
