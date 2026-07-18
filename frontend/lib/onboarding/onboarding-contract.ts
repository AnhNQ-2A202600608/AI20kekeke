export const ONBOARDING_PROFILE_VERSION = 'onboarding_v1' as const;

export const CONCEPT_LABELS = {
  ai_foundation: 'Nền tảng AI',
  api_calling: 'Gọi API',
  prompt_engineering: 'Prompt Engineering',
  embeddings: 'Embeddings',
  vector_search: 'Vector Search',
  rag_retrieval: 'RAG Retrieval',
  citation_grounding: 'Citation Grounding',
  docker_deploy: 'Docker Deploy',
  evaluation_guardrails: 'Evaluation & Guardrails',
  debugging: 'Debugging',
  'd1-ai-llm-foundations': 'AI & LLM Foundations',
  'd4-tool-calling': 'Tool Calling',
  'd4-prompt-engineering': 'Prompt Engineering',
  'd7-embedding-vector': 'Embeddings & Vector Search',
  'd8-rag-pipeline': 'RAG Pipeline',
  'd10-data-pipeline-observability': 'Debugging & Observability',
  'd12-cloud-deployment': 'Cloud Deployment',
  'd14-ai-evaluation': 'AI Evaluation',
} as const;

export type OnboardingConceptId = keyof typeof CONCEPT_LABELS;
export type WeeklyPracticeMinutes = 60 | 120 | 180 | 300;
export type LearningGoal = 'foundation' | 'lab' | 'interview' | 'catch_up';
export type DiagnosticQuestionCount = 8 | 15 | 20;
export type SupportStyle = 'explain' | 'step_hint' | 'socratic' | 'practice';
export type LearningCadence = 'daily_short' | 'weekend_block' | 'deadline_based' | 'unsure';

export type DiagnosticAnswer = {
  questionId: string;
  conceptId?: string;
  selectedOptionId: string;
  responseTimeMs?: number;
  prompt?: string;
  options?: DiagnosticQuestionPublic['options'];
  correct?: boolean;
  feedbackMessage?: string;
  explanation?: string | null;
  bloomLevel?: string;
  difficultyElo?: number;
};

export type DiagnosticQuestionPublic = {
  id: string;
  concept_id: string;
  bloom_level: 'understand' | 'apply' | 'analyze' | string;
  difficulty_elo: number;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
  }>;
};

export type DiagnosticSessionState = {
  session_id: string;
  current_question: DiagnosticQuestionPublic | null;
  answered_count: number;
  required_count: number;
  max_count: number;
  can_complete: boolean;
  can_continue: boolean;
  summary?: OnboardingSummary | null;
};

export type DiagnosticAnswerResponse = DiagnosticSessionState & {
  feedback: {
    correct: boolean;
    message: string;
    explanation?: string | null;
  };
};

export type OnboardingDraft = {
  profileVersion: typeof ONBOARDING_PROFILE_VERSION;
  currentStep: number;
  weeklyPracticeMinutes?: WeeklyPracticeMinutes;
  learningGoal?: LearningGoal;
  targetQuestionCount?: DiagnosticQuestionCount;
  strengthConceptIds: OnboardingConceptId[];
  weaknessConceptIds: OnboardingConceptId[];
  supportStyle?: SupportStyle;
  learningCadence?: LearningCadence;
  diagnosticSessionId?: string;
  currentQuestion?: DiagnosticQuestionPublic | null;
  pendingQuestion?: DiagnosticQuestionPublic | null;
  diagnosticSummary?: OnboardingSummary | null;
  lastFeedback?: DiagnosticAnswerResponse['feedback'] | null;
  diagnosticAnswers: DiagnosticAnswer[];
  syncPending?: boolean;
};

export type OnboardingContextPayload = {
  weekly_practice_minutes: WeeklyPracticeMinutes;
  learning_goal: LearningGoal;
  target_question_count?: DiagnosticQuestionCount;
  strength_concept_ids: OnboardingConceptId[];
  weakness_concept_ids: OnboardingConceptId[];
  support_style?: SupportStyle;
  learning_cadence?: LearningCadence;
};

export type OnboardingSubmitPayload = OnboardingContextPayload & {
  session_id: string;
};

export type OnboardingSummary = {
  weekly_practice_minutes: number;
  learning_goal?: LearningGoal;
  target_question_count?: DiagnosticQuestionCount;
  support_style?: SupportStyle;
  learning_cadence?: LearningCadence;
  strongest_concepts: OnboardingConceptId[];
  weakest_concepts: OnboardingConceptId[];
  recommended_concept_id: OnboardingConceptId;
  confidence: 'low' | 'medium' | 'high';
  diagnostic_correct: number;
  diagnostic_total: number;
  diagnostic_required_total?: number;
  optional_diagnostic_available?: boolean;
  seeded_concepts?: Array<{
    concept_id: OnboardingConceptId;
    db_concept_code?: string;
    elo_score: number;
    bkt_mastery_probability: number;
    mastery_state: 'not_started' | 'weak' | 'learning' | 'mastered' | string;
    weakness_flag: boolean;
    evidence_count: number;
  }>;
};

export type OnboardingStatusResponse = {
  completed: boolean;
  profile_version: typeof ONBOARDING_PROFILE_VERSION;
  source: 'database' | 'stub' | string;
  fallback_allowed: boolean;
  sync_pending?: boolean;
  summary?: OnboardingSummary | null;
};

export type OnboardingCompleteResponse = {
  completed: boolean;
  profile_id: string | null;
  profile_version: typeof ONBOARDING_PROFILE_VERSION;
  recommended_concept_id: OnboardingConceptId | null;
  summary: OnboardingSummary;
};

export const WEEKLY_TIME_OPTIONS: Array<{
  id: WeeklyPracticeMinutes;
  label: string;
  detail: string;
}> = [
  { id: 60, label: '1 giờ / tuần', detail: 'Giữ nhịp nhẹ, phù hợp khi lịch học dày.' },
  { id: 120, label: '2 giờ / tuần', detail: 'Đủ để luyện đều và không quá tải.' },
  { id: 180, label: '3 giờ / tuần', detail: 'Nhịp tốt để tiến bộ rõ sau mỗi tuần.' },
  { id: 300, label: '5 giờ / tuần', detail: 'Tăng tốc cho lab, project hoặc phỏng vấn.' },
];

export const GOAL_OPTIONS: Array<{ id: LearningGoal; label: string; detail: string }> = [
  { id: 'lab', label: 'Làm tốt lab thực chiến', detail: 'Ưu tiên bài tập, debug và triển khai.' },
  { id: 'foundation', label: 'Nắm chắc nền tảng', detail: 'Đi từ khái niệm lõi đến ví dụ ngắn.' },
  { id: 'interview', label: 'Chuẩn bị phỏng vấn', detail: 'Tập giải thích rõ ràng và có ví dụ.' },
  { id: 'catch_up', label: 'Bắt kịp lớp', detail: 'Tập trung các lỗ hổng kiến thức trước.' },
];

export const DIAGNOSTIC_COUNT_OPTIONS: Array<{
  id: DiagnosticQuestionCount;
  label: string;
  detail: string;
  note: string;
  recommended?: boolean;
}> = [
  {
    id: 8,
    label: '8 câu',
    detail: 'Nhanh gọn để vào học ngay.',
    note: 'Phù hợp khi bạn đã biết mình cần học gì hoặc chỉ muốn mở hồ sơ ban đầu.',
  },
  {
    id: 15,
    label: '15 câu',
    detail: 'Đủ sâu mà không quá dài.',
    note: 'Khuyến nghị cho hầu hết học viên: đủ dữ liệu để gợi ý bài luyện sát hơn.',
    recommended: true,
  },
  {
    id: 20,
    label: '20 câu',
    detail: 'Kỹ hơn khi bạn chưa rõ điểm yếu.',
    note: 'Phù hợp nếu bạn muốn báo cáo ban đầu chi tiết hơn trước khi bắt đầu luyện.',
  },
];

export const SUPPORT_STYLE_OPTIONS: Array<{ id: SupportStyle; label: string; detail: string }> = [
  { id: 'socratic', label: 'Hỏi gợi mở', detail: 'Sofi đặt câu hỏi để bạn tự suy luận.' },
  { id: 'step_hint', label: 'Gợi ý từng bước', detail: 'Mở khóa từng hint khi bạn cần.' },
  { id: 'explain', label: 'Giải thích thẳng', detail: 'Đi nhanh vào bản chất và ví dụ.' },
  { id: 'practice', label: 'Luyện tập nhiều', detail: 'Ưu tiên câu hỏi ngắn và phản hồi nhanh.' },
];

export const CADENCE_OPTIONS: Array<{ id: LearningCadence; label: string; detail: string }> = [
  { id: 'daily_short', label: 'Mỗi ngày một ít', detail: 'Phiên 10-20 phút để giữ streak.' },
  { id: 'weekend_block', label: 'Cuối tuần học sâu', detail: 'Một block dài để làm lab.' },
  { id: 'deadline_based', label: 'Theo deadline', detail: 'Ưu tiên phần sắp phải nộp.' },
  { id: 'unsure', label: 'Chưa chắc', detail: 'Để EduGap đề xuất lịch dễ theo.' },
];

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  profileVersion: ONBOARDING_PROFILE_VERSION,
  currentStep: 0,
  targetQuestionCount: 15,
  strengthConceptIds: [],
  weaknessConceptIds: [],
  diagnosticAnswers: [],
};

export function toSubmitPayload(draft: OnboardingDraft): OnboardingSubmitPayload | null {
  if (
    !draft.weeklyPracticeMinutes ||
    !draft.learningGoal ||
    !draft.diagnosticSessionId ||
    draft.diagnosticAnswers.length < 5
  ) {
    return null;
  }

  return {
    weekly_practice_minutes: draft.weeklyPracticeMinutes,
    learning_goal: draft.learningGoal,
    target_question_count: draft.targetQuestionCount ?? 15,
    strength_concept_ids: draft.strengthConceptIds,
    weakness_concept_ids: draft.weaknessConceptIds,
    support_style: draft.supportStyle,
    learning_cadence: draft.learningCadence,
    session_id: draft.diagnosticSessionId,
  };
}
