export type ExamKind = "chapter_practice" | "midterm_review" | "final_review" | "remedial";
export type ExamSource = "teacher_assigned" | "ai_remedial";
export type AssignmentLifecycle = "scheduled" | "available" | "completed" | "locked" | "expired";
export type AttemptStatus = "in_progress" | "submitted" | "graded";

export type ExamAudience = {
  type: "class" | "student_group" | "student";
  ids: string[];
};

export type ExamSchedule = {
  opensAt: string;
  dueAt?: string;
  allowLateSubmission: boolean;
};

export type ExamUnlockCondition =
  | { type: "parent_graded"; parentAssignmentId: string }
  | { type: "parent_score"; parentAssignmentId: string; minimumScore: number }
  | { type: "child_completed"; childAssignmentId: string; minimumScore: number };

export type ExamAssignment = {
  id: string;
  parentAssignmentId?: string;
  kind: ExamKind;
  source: ExamSource;
  title: string;
  teacher: { id: string; name: string };
  audience: ExamAudience;
  curriculum: {
    subjectCode: string;
    gradeId: string;
    chapterId?: string;
    termId?: string;
    targetSkillIds: string[];
  };
  schedule: ExamSchedule;
  assessment: {
    questionCount: number;
    durationSeconds: number;
    attemptLimit: number;
    passingScore?: number;
  };
  unlockCondition?: ExamUnlockCondition;
};

export type ExamQuestion = {
  id: string;
  order: number;
  skillIds: string[];
  difficulty: "recognition" | "understanding" | "application";
  prompt: string;
  choices: string[];
};

export type ExamAnswerSubmission = {
  assignmentId: string;
  studentId: string;
  startedAt: string;
  submittedAt: string;
  answers: Array<{ questionId: string; choiceIndex: number | null }>;
};

export type ExamAttempt = {
  id: string;
  assignmentId: string;
  studentId: string;
  status: AttemptStatus;
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  submittedAt?: string;
  resultId?: string;
};

export type ExamReviewItem = {
  questionId: string;
  order: number;
  prompt: string;
  selectedChoice: string;
  correctChoice: string;
  isCorrect: boolean;
  skill: { id: string; label: string };
  explanation: string;
};

export type ExamAttemptResult = {
  id: string;
  assignmentId: string;
  attemptId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  strength: string;
  improvementFocus: string;
  reviewItems: ExamReviewItem[];
  recommendedAssignmentId?: string;
};

export type ExamAccess = {
  lifecycle: AssignmentLifecycle;
  canStart: boolean;
  label: string;
  message?: string;
};

export type StudentExamAssignment = {
  assignment: ExamAssignment;
  access: ExamAccess;
  latestAttempt?: ExamAttempt;
};

export type ExamWorkspace = {
  assignment: ExamAssignment;
  access: ExamAccess;
  questions: ExamQuestion[];
};

export type ExamWorkflowRepository = {
  getRootAssignments(studentId: string): StudentExamAssignment[];
  getChildAssignments(parentAssignmentId: string, studentId: string): StudentExamAssignment[];
  getWorkspace(assignmentId: string, studentId: string): ExamWorkspace | null;
  getResult(assignmentId: string, studentId: string): ExamAttemptResult | null;
  submitAttempt(payload: ExamAnswerSubmission): Promise<{ attemptId: string; status: "submitted" }>;
};

export const DEMO_STUDENT_ID = "student-hoang-nam";

export const examWorkflowSession = {
  getCurrentStudentId() {
    return DEMO_STUDENT_ID;
  },
};

const assignments: ExamAssignment[] = [
  {
    id: "chapter-1",
    kind: "chapter_practice",
    source: "teacher_assigned",
    title: "Luyện chương 1: Phân số và số hữu tỉ",
    teacher: { id: "teacher-nam", name: "Cô Nguyễn Phương Nam" },
    audience: { type: "class", ids: ["class-7a"] },
    curriculum: { subjectCode: "TO", gradeId: "grade-7", chapterId: "chapter-1", targetSkillIds: ["fraction-equivalence", "common-denominator", "fraction-comparison"] },
    schedule: { opensAt: "2026-07-10T00:00:00.000Z", dueAt: "2026-07-28T16:59:59.000Z", allowLateSubmission: false },
    assessment: { questionCount: 12, durationSeconds: 2100, attemptLimit: 1, passingScore: 8 },
  },
  {
    id: "chapter-1-a",
    parentAssignmentId: "chapter-1",
    kind: "remedial",
    source: "ai_remedial",
    title: "Quy đồng đúng mẫu",
    teacher: { id: "teacher-nam", name: "Cô Nguyễn Phương Nam" },
    audience: { type: "student", ids: [DEMO_STUDENT_ID] },
    curriculum: { subjectCode: "TO", gradeId: "grade-7", chapterId: "chapter-1", targetSkillIds: ["common-denominator"] },
    schedule: { opensAt: "2026-07-10T00:00:00.000Z", dueAt: "2026-07-30T16:59:59.000Z", allowLateSubmission: false },
    assessment: { questionCount: 8, durationSeconds: 900, attemptLimit: 2, passingScore: 8 },
    unlockCondition: { type: "parent_graded", parentAssignmentId: "chapter-1" },
  },
  {
    id: "chapter-1-b",
    parentAssignmentId: "chapter-1",
    kind: "remedial",
    source: "ai_remedial",
    title: "So sánh hai phân số",
    teacher: { id: "teacher-nam", name: "Cô Nguyễn Phương Nam" },
    audience: { type: "student", ids: [DEMO_STUDENT_ID] },
    curriculum: { subjectCode: "TO", gradeId: "grade-7", chapterId: "chapter-1", targetSkillIds: ["fraction-comparison"] },
    schedule: { opensAt: "2026-07-10T00:00:00.000Z", dueAt: "2026-07-30T16:59:59.000Z", allowLateSubmission: false },
    assessment: { questionCount: 8, durationSeconds: 900, attemptLimit: 2, passingScore: 8 },
    unlockCondition: { type: "child_completed", childAssignmentId: "chapter-1-a", minimumScore: 8 },
  },
  {
    id: "chapter-1-c",
    parentAssignmentId: "chapter-1",
    kind: "remedial",
    source: "ai_remedial",
    title: "Bài toán phân số thực tế",
    teacher: { id: "teacher-nam", name: "Cô Nguyễn Phương Nam" },
    audience: { type: "student", ids: [DEMO_STUDENT_ID] },
    curriculum: { subjectCode: "TO", gradeId: "grade-7", chapterId: "chapter-1", targetSkillIds: ["fraction-application"] },
    schedule: { opensAt: "2026-07-10T00:00:00.000Z", dueAt: "2026-07-30T16:59:59.000Z", allowLateSubmission: false },
    assessment: { questionCount: 8, durationSeconds: 900, attemptLimit: 2, passingScore: 8 },
    unlockCondition: { type: "child_completed", childAssignmentId: "chapter-1-b", minimumScore: 8 },
  },
  {
    id: "midterm-1",
    kind: "midterm_review",
    source: "teacher_assigned",
    title: "Đề ôn tập giữa kỳ I",
    teacher: { id: "teacher-nam", name: "Cô Nguyễn Phương Nam" },
    audience: { type: "class", ids: ["class-7a"] },
    curriculum: { subjectCode: "TO", gradeId: "grade-7", termId: "term-1-midterm", targetSkillIds: ["fraction-equivalence", "common-denominator", "fraction-comparison", "fraction-application"] },
    schedule: { opensAt: "2026-07-15T00:00:00.000Z", dueAt: "2026-07-25T16:59:59.000Z", allowLateSubmission: false },
    assessment: { questionCount: 16, durationSeconds: 2700, attemptLimit: 1, passingScore: 5 },
  },
  {
    id: "midterm-1-a",
    parentAssignmentId: "midterm-1",
    kind: "remedial",
    source: "ai_remedial",
    title: "Củng cố quy đồng mẫu số",
    teacher: { id: "teacher-nam", name: "Cô Nguyễn Phương Nam" },
    audience: { type: "student", ids: [DEMO_STUDENT_ID] },
    curriculum: { subjectCode: "TO", gradeId: "grade-7", termId: "term-1-midterm", targetSkillIds: ["common-denominator"] },
    schedule: { opensAt: "2026-07-15T00:00:00.000Z", dueAt: "2026-07-30T16:59:59.000Z", allowLateSubmission: false },
    assessment: { questionCount: 8, durationSeconds: 900, attemptLimit: 2, passingScore: 8 },
    unlockCondition: { type: "parent_graded", parentAssignmentId: "midterm-1" },
  },
  {
    id: "midterm-1-b",
    parentAssignmentId: "midterm-1",
    kind: "remedial",
    source: "ai_remedial",
    title: "So sánh phân số sau quy đồng",
    teacher: { id: "teacher-nam", name: "Cô Nguyễn Phương Nam" },
    audience: { type: "student", ids: [DEMO_STUDENT_ID] },
    curriculum: { subjectCode: "TO", gradeId: "grade-7", termId: "term-1-midterm", targetSkillIds: ["fraction-comparison"] },
    schedule: { opensAt: "2026-07-15T00:00:00.000Z", dueAt: "2026-07-30T16:59:59.000Z", allowLateSubmission: false },
    assessment: { questionCount: 8, durationSeconds: 900, attemptLimit: 2, passingScore: 8 },
    unlockCondition: { type: "child_completed", childAssignmentId: "midterm-1-a", minimumScore: 8 },
  },
  {
    id: "final-1",
    kind: "final_review",
    source: "teacher_assigned",
    title: "Đề ôn tập cuối kỳ I",
    teacher: { id: "teacher-nam", name: "Cô Nguyễn Phương Nam" },
    audience: { type: "class", ids: ["class-7a"] },
    curriculum: { subjectCode: "TO", gradeId: "grade-7", termId: "term-1-final", targetSkillIds: ["fraction-equivalence", "common-denominator", "fraction-comparison", "fraction-application"] },
    schedule: { opensAt: "2026-07-30T01:00:00.000Z", dueAt: "2026-08-08T16:59:59.000Z", allowLateSubmission: false },
    assessment: { questionCount: 20, durationSeconds: 3600, attemptLimit: 1, passingScore: 5 },
  },
];

const attempts: ExamAttempt[] = [];
const generatedAssignments: ExamAssignment[] = [];

const standardQuestions: ExamQuestion[] = [
  { id: "q-1", order: 1, skillIds: ["fraction-equivalence"], difficulty: "recognition", prompt: "Phân số nào bằng phân số 3/4?", choices: ["6/8", "5/8", "9/16", "12/20"] },
  { id: "q-2", order: 2, skillIds: ["common-denominator"], difficulty: "understanding", prompt: "Mẫu số chung nhỏ nhất của 3/4 và 5/6 là bao nhiêu?", choices: ["10", "12", "18", "24"] },
  { id: "q-3", order: 3, skillIds: ["fraction-application"], difficulty: "application", prompt: "Một lớp có 3/5 số học sinh tham gia câu lạc bộ Toán. Nếu lớp có 35 học sinh, có bao nhiêu bạn tham gia?", choices: ["18", "20", "21", "24"] },
  { id: "q-4", order: 4, skillIds: ["fraction-comparison"], difficulty: "application", prompt: "So sánh hai phân số 7/12 và 5/8. Kết luận nào đúng?", choices: ["7/12 > 5/8", "7/12 < 5/8", "7/12 = 5/8", "Không thể so sánh"] },
];

const remedialQuestions: ExamQuestion[] = [
  { id: "r-1", order: 1, skillIds: ["common-denominator"], difficulty: "recognition", prompt: "Quy đồng hai phân số 2/3 và 5/8 với mẫu số chung nhỏ nhất.", choices: ["16/24 và 15/24", "8/24 và 15/24", "16/24 và 20/24", "6/24 và 5/24"] },
  { id: "r-2", order: 2, skillIds: ["fraction-comparison"], difficulty: "understanding", prompt: "Phân số nào lớn hơn 7/9?", choices: ["3/4", "5/7", "14/18", "28/36"] },
  { id: "r-3", order: 3, skillIds: ["common-denominator"], difficulty: "understanding", prompt: "Tính 5/6 - 1/4 sau khi quy đồng mẫu số.", choices: ["7/12", "4/12", "3/12", "11/12"] },
  { id: "r-4", order: 4, skillIds: ["fraction-application"], difficulty: "application", prompt: "Lan đã đọc 2/5 quyển sách vào thứ Hai và 1/4 vào thứ Ba. Lan đã đọc bao nhiêu quyển sách?", choices: ["3/9", "13/20", "3/20", "7/10"] },
];

const results: ExamAttemptResult[] = [
  {
    id: "result-chapter-1",
    assignmentId: "chapter-1",
    attemptId: "attempt-chapter-1",
    score: 7.5,
    correctAnswers: 9,
    totalQuestions: 12,
    strength: "Đưa phân số vào bài toán thực tế",
    improvementFocus: "Quy đồng và so sánh phân số",
    recommendedAssignmentId: "chapter-1-a",
    reviewItems: [
      { questionId: "q-1", order: 1, prompt: "Phân số nào bằng 3/4?", selectedChoice: "6/8", correctChoice: "6/8", isCorrect: true, skill: { id: "fraction-equivalence", label: "Nhận biết phân số bằng nhau" }, explanation: "Nhân cả tử và mẫu của 3/4 với 2, ta được 6/8." },
      { questionId: "q-2", order: 2, prompt: "Mẫu số chung nhỏ nhất của 3/4 và 5/6", selectedChoice: "24", correctChoice: "12", isCorrect: false, skill: { id: "common-denominator", label: "Tìm mẫu số chung nhỏ nhất" }, explanation: "12 là bội chung nhỏ nhất của 4 và 6. Chọn 24 vẫn quy đồng được nhưng không phải mẫu số chung nhỏ nhất." },
      { questionId: "q-3", order: 3, prompt: "Bài toán 3/5 của 35 học sinh", selectedChoice: "21", correctChoice: "21", isCorrect: true, skill: { id: "fraction-application", label: "Vận dụng phân số vào bài toán" }, explanation: "Tính 35 × 3/5 = 7 × 3 = 21." },
      { questionId: "q-4", order: 4, prompt: "So sánh 7/12 và 5/8", selectedChoice: "7/12 > 5/8", correctChoice: "7/12 < 5/8", isCorrect: false, skill: { id: "fraction-comparison", label: "So sánh phân số sau quy đồng" }, explanation: "Quy đồng được 14/24 và 15/24. Vì 14 nhỏ hơn 15 nên 7/12 nhỏ hơn 5/8." },
    ],
  },
];

function currentTime() {
  return Date.now();
}

function getAttempts(assignmentId: string, studentId: string) {
  return attempts.filter((attempt) => attempt.assignmentId === assignmentId && attempt.studentId === studentId);
}

function getLatestAttempt(assignmentId: string, studentId: string) {
  return getAttempts(assignmentId, studentId).at(-1);
}

function getAssignment(assignmentId: string) {
  return assignments.find((assignment) => assignment.id === assignmentId && !assignment.parentAssignmentId)
    || generatedAssignments.find((assignment) => assignment.id === assignmentId);
}

const remedialTitles: Record<string, string> = {
  "common-denominator": "Quy đồng đúng mẫu",
  "fraction-comparison": "So sánh hai phân số",
  "fraction-application": "Bài toán phân số thực tế",
  "fraction-equivalence": "Nhận biết phân số bằng nhau",
};

function generateRemedialAssignments(parent: ExamAssignment, studentId: string, result: ExamAttemptResult) {
  const existing = generatedAssignments.filter((assignment) => assignment.parentAssignmentId === parent.id && assignment.audience.ids.includes(studentId));
  if (existing.length > 0 || parent.parentAssignmentId) return existing;

  const missedSkills = result.reviewItems
    .filter((item) => !item.isCorrect)
    .map((item) => item.skill)
    .filter((skill, index, list) => list.findIndex((item) => item.id === skill.id) === index);
  const focusSkills = missedSkills.length > 0
    ? missedSkills.slice(0, 3)
    : [{ id: parent.curriculum.targetSkillIds[0] || "core-review", label: "Củng cố kiến thức trọng tâm" }];
  const now = new Date();
  const dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  return focusSkills.map((skill, index) => {
    const assignment: ExamAssignment = {
      id: parent.id + "-ai-" + skill.id,
      parentAssignmentId: parent.id,
      kind: "remedial",
      source: "ai_remedial",
      title: remedialTitles[skill.id] || "Luyện lại: " + skill.label,
      teacher: parent.teacher,
      audience: { type: "student", ids: [studentId] },
      curriculum: { ...parent.curriculum, targetSkillIds: [skill.id] },
      schedule: { opensAt: now.toISOString(), dueAt, allowLateSubmission: false },
      assessment: { questionCount: 8, durationSeconds: 900, attemptLimit: 1, passingScore: 0 },
      unlockCondition: index === 0 ? undefined : {
        type: "child_completed",
        childAssignmentId: parent.id + "-ai-" + focusSkills[index - 1].id,
        minimumScore: 0,
      },
    };

    generatedAssignments.push(assignment);
    return assignment;
  });
}

function evaluateAccess(assignment: ExamAssignment, studentId: string): ExamAccess {
  const now = currentTime();
  const opensAt = new Date(assignment.schedule.opensAt).getTime();
  const dueAt = assignment.schedule.dueAt ? new Date(assignment.schedule.dueAt).getTime() : undefined;
  const attempt = getLatestAttempt(assignment.id, studentId);

  if (opensAt > now) {
    return { lifecycle: "scheduled", canStart: false, label: "Sắp giao", message: "Đề sẽ mở theo lịch giáo viên đã đặt." };
  }

  if (dueAt && dueAt < now && !assignment.schedule.allowLateSubmission) {
    return { lifecycle: "expired", canStart: false, label: "Đã hết hạn", message: "Đề đã đóng theo hạn nộp." };
  }

  if (assignment.unlockCondition) {
    const condition = assignment.unlockCondition;
    const targetAssignmentId = condition.type === "child_completed" ? condition.childAssignmentId : condition.parentAssignmentId;
    const targetAttempt = getLatestAttempt(targetAssignmentId, studentId);

    if (!targetAttempt || targetAttempt.status !== "graded") {
      return { lifecycle: "locked", canStart: false, label: "Chưa mở khóa", message: "Cần hoàn thành và được chấm bài trước đó." };
    }

    if ("minimumScore" in condition && (targetAttempt.score === undefined || targetAttempt.score < condition.minimumScore)) {
      return { lifecycle: "locked", canStart: false, label: "Chưa đạt ngưỡng", message: "Cần đạt mức điểm yêu cầu ở đề trước." };
    }
  }

  if (attempt?.status === "graded" && getAttempts(assignment.id, studentId).length >= assignment.assessment.attemptLimit) {
    return { lifecycle: "completed", canStart: false, label: "Đã chấm", message: "Bạn đã dùng hết lượt làm bài được giao." };
  }

  return { lifecycle: "available", canStart: true, label: assignment.source === "ai_remedial" ? "Đề cải thiện" : "Đang mở" };
}

function toStudentAssignment(assignment: ExamAssignment, studentId: string): StudentExamAssignment {
  return {
    assignment,
    access: evaluateAccess(assignment, studentId),
    latestAttempt: getLatestAttempt(assignment.id, studentId),
  };
}

export const examWorkflowRepository: ExamWorkflowRepository = {
  getRootAssignments(studentId) {
    return assignments.filter((assignment) => !assignment.parentAssignmentId).map((assignment) => toStudentAssignment(assignment, studentId));
  },
  getChildAssignments(parentAssignmentId, studentId) {
    return generatedAssignments
      .filter((assignment) => assignment.parentAssignmentId === parentAssignmentId && assignment.audience.ids.includes(studentId))
      .map((assignment) => toStudentAssignment(assignment, studentId));
  },
  getWorkspace(assignmentId, studentId) {
    const assignment = getAssignment(assignmentId);
    if (!assignment) return null;
    const access = evaluateAccess(assignment, studentId);
    const questionSource = assignment.kind === "remedial" ? remedialQuestions : standardQuestions;
    const questions = assignment.kind === "remedial"
      ? questionSource.filter((question) => question.skillIds.some((skillId) => assignment.curriculum.targetSkillIds.includes(skillId)))
      : questionSource;
    return { assignment, access, questions: questions.length > 0 ? questions : questionSource };
  },
  getResult(assignmentId, studentId) {
    const attempt = getLatestAttempt(assignmentId, studentId);
    if (!attempt?.resultId) return null;
    return results.find((result) => result.id === attempt.resultId) || null;
  },
  submitAttempt(payload) {
    const assignment = getAssignment(payload.assignmentId);
    if (!assignment) return Promise.reject(new Error("Assignment not found"));

    const isRemedial = assignment.kind === "remedial";
    const attemptId = "attempt-" + payload.assignmentId + "-" + (attempts.length + 1);
    const resultId = "result-" + payload.assignmentId + "-" + (results.length + 1);
    const reviewItems = (results[0]?.reviewItems || []).map((item) => ({ ...item, skill: { ...item.skill } }));
    const result: ExamAttemptResult = {
      id: resultId,
      assignmentId: assignment.id,
      attemptId,
      score: isRemedial ? 8.5 : 7.5,
      correctAnswers: isRemedial ? 7 : 9,
      totalQuestions: assignment.assessment.questionCount,
      strength: isRemedial ? "Quy đồng hai phân số" : "Đưa phân số vào bài toán thực tế",
      improvementFocus: isRemedial ? "So sánh phân số sau quy đồng" : "Quy đồng và so sánh phân số",
      reviewItems,
    };

    results.push(result);
    attempts.push({
      id: attemptId,
      assignmentId: assignment.id,
      studentId: payload.studentId,
      status: "graded",
      score: result.score,
      correctAnswers: result.correctAnswers,
      totalQuestions: assignment.assessment.questionCount || payload.answers.length,
      submittedAt: payload.submittedAt,
      resultId,
    });

    if (!assignment.parentAssignmentId) {
      const generated = generateRemedialAssignments(assignment, payload.studentId, result);
      result.recommendedAssignmentId = generated[0]?.id;
    }

    return Promise.resolve({ attemptId, status: "submitted" });
  },
};
