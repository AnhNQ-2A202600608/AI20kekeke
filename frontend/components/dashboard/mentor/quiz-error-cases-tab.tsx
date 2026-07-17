'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock3,
  FileEdit,
  Inbox,
  Loader2,
  MessageSquareWarning,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useBoundStore } from '@/hooks/useBoundStore';
import { isDemoMode } from '@/lib/demo-mode';
import {
  fetchQuizErrorCaseDetail,
  fetchQuizErrorCases,
  normalizeQuizErrorCaseDetail,
  QuizErrorCaseApiError,
  QuizErrorCaseDetail,
  QuizErrorCaseDetailNormalized,
  QuizErrorCaseListItem,
  QuizErrorCaseListParams,
  QuizErrorCaseQuestionResponse,
  QuizErrorCaseStatus,
  QuizErrorCaseStatusResponse,
  QuizErrorQuestion,
  QuizErrorQuestionPayload,
  QuizErrorReport,
  updateQuizErrorCaseQuestion,
  updateQuizErrorCaseStatus,
} from '@/lib/mentor/quiz-error-cases';

type OptionKey = 'A' | 'B' | 'C' | 'D';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type EditorOptions = Record<OptionKey, string>;
type FeedbackTone = 'progress' | 'success' | 'error';

interface QuestionEditorState {
  questionText: string;
  options: EditorOptions;
  correctAnswer: OptionKey;
  explanation: string;
  difficulty: string;
}

interface HintDisplayItem {
  label: string;
  content: string;
}

interface StatusFeedback {
  message: string;
  tone: FeedbackTone;
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];
const STATUS_ORDER: QuizErrorCaseStatus[] = ['new', 'in_progress', 'resolved', 'rejected'];
const STATUS_FILTER_OPTIONS: Array<{
  id: StatusFilter;
  label: string;
  statuses: QuizErrorCaseStatus[];
}> = [
  { id: 'all', label: 'Tất cả', statuses: STATUS_ORDER },
  { id: 'pending', label: 'Chờ duyệt', statuses: ['new', 'in_progress'] },
  { id: 'approved', label: 'Đã duyệt', statuses: ['resolved'] },
  { id: 'rejected', label: 'Từ chối', statuses: ['rejected'] },
];

const EMPTY_OPTIONS: EditorOptions = {
  A: '',
  B: '',
  C: '',
  D: '',
};

const EMPTY_EDITOR_STATE: QuestionEditorState = {
  questionText: '',
  options: EMPTY_OPTIONS,
  correctAnswer: 'A',
  explanation: '',
  difficulty: '',
};

const STATUS_META: Record<
  QuizErrorCaseStatus,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    badgeClass: string;
    cardClass: string;
    dotClass: string;
  }
> = {
  new: {
    label: 'Mới',
    description: 'Chờ mentor mở ca xử lý',
    icon: Inbox,
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    cardClass: 'border-amber-200 bg-amber-50/60',
    dotClass: 'bg-amber-400',
  },
  in_progress: {
    label: 'Đang sửa',
    description: 'Đã nhận và đang chỉnh câu hỏi',
    icon: Wrench,
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
    cardClass: 'border-blue-200 bg-blue-50/60',
    dotClass: 'bg-blue-500',
  },
  resolved: {
    label: 'Đã xử lý',
    description: 'Đã lưu bản sửa và đóng ca',
    icon: CheckCircle,
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cardClass: 'border-emerald-200 bg-emerald-50/60',
    dotClass: 'bg-emerald-500',
  },
  rejected: {
    label: 'Từ chối',
    description: 'Không phải lỗi cần sửa quiz',
    icon: XCircle,
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    cardClass: 'border-rose-200 bg-rose-50/60',
    dotClass: 'bg-rose-500',
  },
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  wrong_answer: 'Đáp án sai',
  ambiguous_question: 'Câu hỏi mơ hồ',
  unclear_explanation: 'Giải thích chưa rõ',
  typo: 'Lỗi chính tả',
  missing_context: 'Thiếu ngữ cảnh',
  duplicate_question: 'Câu hỏi trùng',
  other: 'Khác',
};

const ERROR_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại lỗi' },
  { value: 'wrong_answer', label: ERROR_TYPE_LABELS.wrong_answer },
  { value: 'ambiguous_question', label: ERROR_TYPE_LABELS.ambiguous_question },
  { value: 'unclear_explanation', label: ERROR_TYPE_LABELS.unclear_explanation },
  { value: 'typo', label: ERROR_TYPE_LABELS.typo },
  { value: 'missing_context', label: ERROR_TYPE_LABELS.missing_context },
  { value: 'duplicate_question', label: ERROR_TYPE_LABELS.duplicate_question },
  { value: 'other', label: ERROR_TYPE_LABELS.other },
];

const MOCK_ERROR_CASE_DETAILS: QuizErrorCaseDetailNormalized[] = [
  {
    id: 'case-rag-filter-001',
    course_id: 'ai-tutor-c2',
    question_id: 'q-rag-301',
    status: 'new',
    report_count: 3,
    last_reported_at: '2026-06-30T09:20:00+07:00',
    resolution_note: null,
    most_common_error_type: 'wrong_answer',
    question: {
      id: 'q-rag-301',
      question_text:
        'Trong hệ RAG production, bước nào giúp giới hạn tài liệu truy hồi theo ngữ cảnh phù hợp nhất?',
      options: {
        A: 'Tăng nhiệt độ của mô hình LLM để tự động lọc.',
        B: 'Metadata filtering trước khi tiến hành retrieval.',
        C: 'Chỉ sử dụng prompt dài hơn để chứa toàn bộ ngữ cảnh.',
        D: 'Tắt chunking để giữ nguyên cấu trúc tài liệu gốc.',
      },
      correct_answer: 'B',
      explanation:
        'Metadata filtering giúp thu hẹp không gian tìm kiếm trước khi semantic retrieval chạy, từ đó giảm nhiễu và tăng độ chính xác.',
      difficulty: 'bình thường',
      hints: [
        { level: 'light', content: 'Hãy nghĩ đến bước lọc diễn ra trước khi truy vấn vector.' },
        { level: 'medium', content: 'Bộ lọc thường dựa trên metadata như ngày học hoặc chủ đề.' },
      ],
    },
    reports: [
      {
        id: 'report-rag-filter-1',
        case_id: 'case-rag-filter-001',
        student_id: 'student-042',
        selected_option: 'C',
        error_type: 'wrong_answer',
        detail:
          'Em chọn C vì nghĩ prompt dài sẽ chứa đủ tài liệu, nhưng phần giải thích lại nói metadata mới là bước đúng.',
        created_at: '2026-06-30T09:20:00+07:00',
      },
      {
        id: 'report-rag-filter-2',
        case_id: 'case-rag-filter-001',
        student_id: 'student-018',
        selected_option: 'A',
        error_type: 'wrong_answer',
        detail: 'Đáp án đúng có vẻ là B, nhưng hệ thống đang chấm em sai khi chọn B ở lượt trước.',
        created_at: '2026-06-29T21:12:00+07:00',
      },
      {
        id: 'report-rag-filter-3',
        case_id: 'case-rag-filter-001',
        student_id: 'student-077',
        selected_option: 'B',
        error_type: 'unclear_explanation',
        detail: 'Giải thích nên nói rõ metadata filtering xảy ra trước retrieval để tránh nhầm với reranking.',
        created_at: '2026-06-29T17:44:00+07:00',
      },
    ],
  },
  {
    id: 'case-tool-schema-002',
    course_id: 'ai-tutor-c2',
    question_id: 'q-tool-144',
    status: 'in_progress',
    report_count: 2,
    last_reported_at: '2026-06-28T14:05:00+07:00',
    resolution_note: 'Đang kiểm tra lại wording của distractor C.',
    most_common_error_type: 'ambiguous_question',
    question: {
      id: 'q-tool-144',
      prompt: 'Khi thiết kế tool calling, mô hình cần biết điều gì để chọn đúng công cụ?',
      answer_key: {
        options: [
          'Màu giao diện của sản phẩm phần mềm.',
          'Schema đầu vào/đầu ra và mô tả rõ khi nào nên dùng tool.',
          'Chỉ cần đặt tên công cụ thật ngắn gọn.',
          'Không cần truyền tham số vì mô hình tự gọi API bằng tên.',
        ],
        correct: 'B',
        explanation:
          'Tool schema và mô tả điều kiện sử dụng giúp mô hình hiểu công dụng, cấu trúc tham số và thời điểm gọi tool phù hợp.',
        hints: {
          light: 'Đừng chỉ nhìn vào tên tool.',
          deep: 'Schema giúp mô hình biết tham số nào bắt buộc và kiểu dữ liệu cần trả về.',
        },
      },
      difficulty_elo: 520,
    },
    reports: [
      {
        id: 'report-tool-schema-1',
        case_id: 'case-tool-schema-002',
        student_id: 'student-011',
        selected_option: 'C',
        error_type: 'ambiguous_question',
        detail: 'Cụm "biết điều gì" hơi rộng, dễ hiểu là chỉ cần tên tool cũng được.',
        created_at: '2026-06-28T14:05:00+07:00',
      },
      {
        id: 'report-tool-schema-2',
        case_id: 'case-tool-schema-002',
        student_id: 'student-062',
        selected_option: 'B',
        error_type: 'unclear_explanation',
        detail: 'Nên thêm ví dụ về JSON schema để giải thích dễ hiểu hơn.',
        created_at: '2026-06-28T08:31:00+07:00',
      },
    ],
  },
  {
    id: 'case-observe-trace-003',
    course_id: 'ai-tutor-c2',
    question_id: 'q-observe-210',
    status: 'resolved',
    report_count: 1,
    last_reported_at: '2026-06-27T19:16:00+07:00',
    resolution_note: 'Đã sửa distractor A để phân biệt trace với lịch sử Git.',
    most_common_error_type: 'typo',
    question: {
      id: 'q-observe-210',
      question:
        'Trong giám sát hệ thống LLM, một trace đại diện cho điều gì?',
      options: {
        A: 'Lịch sử thay đổi code trên kho Git.',
        B: 'Chuỗi các spans của một yêu cầu, ghi lại thời gian chạy và lỗi.',
        C: 'Bản đồ kết nối vật lý giữa các máy chủ database.',
        D: 'Lịch sử thanh toán phí API hằng tháng.',
      },
      answer: 'B',
      explanation:
        'Trace mô tả vòng đời xử lý một yêu cầu thông qua các span lồng nhau, giúp mentor tìm nguyên nhân lỗi và độ trễ.',
      difficulty: 'khó',
    },
    reports: [
      {
        id: 'report-observe-trace-1',
        case_id: 'case-observe-trace-003',
        student_id: 'student-025',
        selected_option: 'A',
        error_type: 'typo',
        detail: 'Trước đó đáp án A có chữ "Git trace" nên gây nhầm. Bản hiện tại đã rõ hơn.',
        created_at: '2026-06-27T19:16:00+07:00',
      },
    ],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function formatErrorType(errorType?: string | null): string {
  if (!errorType) return 'Chưa phân loại';
  return ERROR_TYPE_LABELS[errorType] ?? errorType.replace(/_/g, ' ');
}

function formatDate(value?: string | null): string {
  if (!value) return 'Chưa có thời gian';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string): { message: string; shouldClearToken: boolean } {
  if (error instanceof QuizErrorCaseApiError) {
    return {
      message:
        error.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục xử lý báo lỗi.'
          : error.message || fallback,
      shouldClearToken: error.status === 401,
    };
  }

  return {
    message: error instanceof Error ? error.message : fallback,
    shouldClearToken: false,
  };
}

function normalizeDetail(
  detail: QuizErrorCaseDetail | QuizErrorCaseStatusResponse | QuizErrorCaseQuestionResponse,
): QuizErrorCaseDetailNormalized {
  return normalizeQuizErrorCaseDetail(detail);
}

function extractQuestionText(question?: QuizErrorQuestion | null): string {
  if (!question) return '';
  return (
    toText(question.question_text).trim() ||
    toText(question.prompt).trim() ||
    toText(question.question).trim()
  );
}

function extractOptions(question?: QuizErrorQuestion | null): EditorOptions {
  if (!question) return { ...EMPTY_OPTIONS };

  const sources: unknown[] = [
    question.options,
    question.answer_key?.options,
    question.answer_key?.choices,
  ];

  for (const source of sources) {
    const options = { ...EMPTY_OPTIONS };

    if (Array.isArray(source)) {
      OPTION_KEYS.forEach((key, index) => {
        options[key] = toText(source[index]).trim();
      });

      if (OPTION_KEYS.some((key) => options[key])) return options;
    }

    if (isRecord(source)) {
      OPTION_KEYS.forEach((key) => {
        const directValue = source[key] ?? source[key.toLowerCase()];
        options[key] = toText(directValue).trim();
      });

      if (!OPTION_KEYS.some((key) => options[key])) {
        Object.values(source)
          .slice(0, OPTION_KEYS.length)
          .forEach((value, index) => {
            options[OPTION_KEYS[index]] = toText(value).trim();
          });
      }

      if (OPTION_KEYS.some((key) => options[key])) return options;
    }
  }

  return { ...EMPTY_OPTIONS };
}

function extractCorrectAnswer(question?: QuizErrorQuestion | null): OptionKey {
  if (!question) return 'A';

  const candidates = [
    question.correct_answer,
    question.answer,
    question.answer_key?.correct_answer,
    question.answer_key?.correct,
    question.answer_key?.answer,
  ];

  for (const candidate of candidates) {
    const normalized = toText(candidate).trim().toUpperCase();
    if (OPTION_KEYS.includes(normalized as OptionKey)) return normalized as OptionKey;
  }

  return 'A';
}

function extractExplanation(question?: QuizErrorQuestion | null): string {
  if (!question) return '';
  return (
    toText(question.explanation).trim() ||
    toText(question.answer_key?.explanation).trim()
  );
}

function extractDifficulty(question?: QuizErrorQuestion | null): string {
  if (!question) return '';
  return (
    toText(question.difficulty).trim() ||
    toText(question.difficulty_elo).trim()
  );
}

function extractHints(question?: QuizErrorQuestion | null): HintDisplayItem[] {
  if (!question) return [];

  const sources = [question.hints, question.answer_key?.hints];

  for (const source of sources) {
    if (Array.isArray(source)) {
      const hints = source
        .map((item, index) => {
          if (typeof item === 'string') {
            return { label: `Gợi ý ${index + 1}`, content: item.trim() };
          }

          if (isRecord(item)) {
            return {
              label:
                toText(item.level).trim() ||
                toText(item.label).trim() ||
                `Gợi ý ${index + 1}`,
              content:
                toText(item.content).trim() ||
                toText(item.hint).trim() ||
                toText(item.text).trim(),
            };
          }

          return { label: `Gợi ý ${index + 1}`, content: '' };
        })
        .filter((hint) => hint.content);

      if (hints.length) return hints;
    }

    if (isRecord(source)) {
      const hints = Object.entries(source)
        .map(([key, value]) => ({
          label: key,
          content: isRecord(value)
            ? toText(value.content).trim() || toText(value.hint).trim() || toText(value.text).trim()
            : toText(value).trim(),
        }))
        .filter((hint) => hint.content);

      if (hints.length) return hints;
    }
  }

  return [];
}

function normalizeDifficulty(val: string): string {
  const norm = val.trim().toLowerCase();
  if (norm === 'dễ' || norm === 'easy' || norm === '1') return 'dễ';
  if (norm === 'khó' || norm === 'hard' || norm === '3') return 'khó';

  const num = Number(norm);
  if (!Number.isNaN(num)) {
    if (num < 400) return 'dễ';
    if (num > 600) return 'khó';
    return 'bình thường';
  }

  return 'bình thường';
}

function createEditorState(question?: QuizErrorQuestion | null): QuestionEditorState {
  return {
    questionText: extractQuestionText(question),
    options: extractOptions(question),
    correctAnswer: extractCorrectAnswer(question),
    explanation: extractExplanation(question),
    difficulty: normalizeDifficulty(extractDifficulty(question)),
  };
}

function detailToListItem(detail: QuizErrorCaseDetailNormalized): QuizErrorCaseListItem {
  return {
    id: detail.id,
    course_id: detail.course_id,
    question_id: detail.question_id,
    status: detail.status,
    report_count: detail.report_count,
    last_reported_at: detail.last_reported_at,
    resolution_note: detail.resolution_note,
    question: detail.question,
    reports: detail.reports,
    most_common_error_type: detail.most_common_error_type,
  };
}

function caseMatchesFilters(
  item: QuizErrorCaseListItem,
  statusFilter: StatusFilter,
  searchQuery: string,
  errorTypeFilter: string,
): boolean {
  const matchingStatuses =
    STATUS_FILTER_OPTIONS.find((option) => option.id === statusFilter)?.statuses ?? [];
  if (!matchingStatuses.includes(item.status)) return false;

  if (
    errorTypeFilter !== 'all' &&
    item.most_common_error_type !== errorTypeFilter &&
    !(item.reports ?? []).some((report) => report.error_type === errorTypeFilter)
  ) {
    return false;
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  if (!normalizedSearch) return true;

  const searchableText = [
    item.id,
    item.question_id,
    item.course_id,
    item.most_common_error_type,
    extractQuestionText(item.question),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

function mergeCaseIntoDetail(
  detail: QuizErrorCaseDetailNormalized,
  updatedCase: QuizErrorCaseListItem,
): QuizErrorCaseDetailNormalized {
  return {
    ...detail,
    ...updatedCase,
    question: updatedCase.question ?? detail.question,
    reports: updatedCase.reports ?? detail.reports,
  };
}

function patchCaseList(items: QuizErrorCaseListItem[], updatedCase: QuizErrorCaseListItem): QuizErrorCaseListItem[] {
  return items.map((item) =>
    item.id === updatedCase.id
      ? {
          ...item,
          ...updatedCase,
          question: updatedCase.question ?? item.question,
          reports: updatedCase.reports ?? item.reports,
        }
      : item,
  );
}

function upsertCaseList(items: QuizErrorCaseListItem[], updatedCase: QuizErrorCaseListItem): QuizErrorCaseListItem[] {
  if (items.some((item) => item.id === updatedCase.id)) {
    return patchCaseList(items, updatedCase);
  }

  return [updatedCase, ...items];
}

function getFallbackVisibleCaseId(
  previousCases: QuizErrorCaseListItem[],
  filteredCases: QuizErrorCaseListItem[],
  hiddenCaseId: string,
): string | null {
  if (!filteredCases.length) return null;

  const previousIndex = previousCases.findIndex((item) => item.id === hiddenCaseId);
  if (previousIndex === -1) return filteredCases[0].id;

  const nextCase = filteredCases.find((item) => {
    const itemPreviousIndex = previousCases.findIndex((previousItem) => previousItem.id === item.id);
    return itemPreviousIndex > previousIndex;
  });

  return nextCase?.id ?? filteredCases[filteredCases.length - 1].id;
}

function sortReportsByCreatedAt(reports: QuizErrorReport[]): QuizErrorReport[] {
  return [...reports].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });
}

function getDifficultyPayload(value: string): string | number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

export const QuizErrorCasesTab: React.FC = () => {
  const token = useBoundStore((s) => s.token);
  const setToken = useBoundStore((s) => s.setToken);
  const inDemoMode = isDemoMode();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [errorTypeFilter, setErrorTypeFilter] = useState('all');
  const [cases, setCases] = useState<QuizErrorCaseListItem[]>([]);
  const [statsCases, setStatsCases] = useState<QuizErrorCaseListItem[]>(
    MOCK_ERROR_CASE_DETAILS.map(detailToListItem),
  );
  const [mockDetails, setMockDetails] = useState<QuizErrorCaseDetailNormalized[]>(MOCK_ERROR_CASE_DETAILS);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<QuizErrorCaseDetailNormalized | null>(null);
  const [editor, setEditor] = useState<QuestionEditorState>(EMPTY_EDITOR_STATE);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<StatusFeedback | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const selectedCaseIdRef = useRef<string | null>(null);
  const lastLoadedCaseIdRef = useRef<string | null>(null);

  const isSaving = savingAction !== null;

  function showFeedback(message: string, tone: FeedbackTone) {
    setStatusFeedback({ message, tone });
  }

  function clearSelectionState() {
    selectedCaseIdRef.current = null;
    lastLoadedCaseIdRef.current = null;
    setSelectedCaseId(null);
    setSelectedDetail(null);
    setEditor(EMPTY_EDITOR_STATE);
    setResolutionNote('');
    setDetailError(null);
    setStatusFeedback(null);
  }

  function switchSelection(nextCaseId: string | null) {
    if (!nextCaseId) {
      clearSelectionState();
      return;
    }

    selectedCaseIdRef.current = nextCaseId;
    lastLoadedCaseIdRef.current = null;
    setSelectedCaseId(nextCaseId);
    setSelectedDetail(null);
    setEditor(EMPTY_EDITOR_STATE);
    setResolutionNote('');
    setDetailError(null);
    setStatusFeedback(null);
  }

  useEffect(() => {
    selectedCaseIdRef.current = selectedCaseId;
  }, [selectedCaseId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      if (inDemoMode) {
        const allMockCases = mockDetails.map(detailToListItem);
        if (!ignore) setStatsCases(allMockCases);
        return;
      }

      try {
        const statsResponse = await fetchQuizErrorCases({ limit: 100 }, token);
        if (!ignore) setStatsCases(statsResponse.items);
      } catch (error) {
        const { shouldClearToken } = getErrorMessage(error, 'Không thể tải thống kê báo lỗi quiz.');
        if (shouldClearToken) setToken('');
      }
    }

    loadStats();

    return () => {
      ignore = true;
    };
  }, [inDemoMode, mockDetails, setToken, statsRefreshKey, token]);

  useEffect(() => {
    let ignore = false;

    async function loadCases() {
      setIsLoadingList(true);
      setListError(null);

      function reconcileLoadedList(nextCases: QuizErrorCaseListItem[]) {
        const currentCaseId = selectedCaseIdRef.current;

        if (!nextCases.length) {
          selectedCaseIdRef.current = null;
          lastLoadedCaseIdRef.current = null;
          setSelectedCaseId(null);
          setSelectedDetail(null);
          setEditor(EMPTY_EDITOR_STATE);
          setResolutionNote('');
          setDetailError(null);
          setStatusFeedback(null);
          return;
        }

        if (currentCaseId && nextCases.some((item) => item.id === currentCaseId)) {
          return;
        }

        const nextCaseId = nextCases[0].id;
        selectedCaseIdRef.current = nextCaseId;
        lastLoadedCaseIdRef.current = null;
        setSelectedCaseId(nextCaseId);
        setSelectedDetail(null);
        setEditor(EMPTY_EDITOR_STATE);
        setResolutionNote('');
        setDetailError(null);
        setStatusFeedback(null);
      }

      if (inDemoMode) {
        const allMockCases = mockDetails.map(detailToListItem);
        const filteredMockCases = allMockCases.filter((item) =>
          caseMatchesFilters(item, statusFilter, debouncedSearchQuery, errorTypeFilter),
        );

        if (!ignore) {
          setCases(filteredMockCases);
          reconcileLoadedList(filteredMockCases);
          setIsLoadingList(false);
        }

        return;
      }

      try {
        const listParams: QuizErrorCaseListParams = {
          status:
            statusFilter === 'approved'
              ? 'resolved'
              : statusFilter === 'rejected'
                ? 'rejected'
                : undefined,
          search: debouncedSearchQuery.trim() || undefined,
          error_type: errorTypeFilter === 'all' ? undefined : errorTypeFilter,
          limit: 50,
        };

        const listResponse = await fetchQuizErrorCases(listParams, token);
        const visibleItems = listResponse.items.filter((item) =>
          caseMatchesFilters(item, statusFilter, debouncedSearchQuery, errorTypeFilter),
        );

        if (!ignore) {
          setCases(visibleItems);
          reconcileLoadedList(visibleItems);
        }
      } catch (error) {
        const { message, shouldClearToken } = getErrorMessage(
          error,
          'Không thể tải danh sách báo lỗi quiz.',
        );

        if (shouldClearToken) setToken('');
        if (!ignore) {
          setListError(message);
          setCases([]);
          clearSelectionState();
        }
      } finally {
        if (!ignore) setIsLoadingList(false);
      }
    }

    loadCases();

    return () => {
      ignore = true;
    };
  }, [debouncedSearchQuery, errorTypeFilter, inDemoMode, mockDetails, setToken, statusFilter, token]);

  useEffect(() => {
    let ignore = false;

    async function loadDetail(caseId: string) {
      setIsLoadingDetail(true);
      setDetailError(null);

      const shouldResetEditor = lastLoadedCaseIdRef.current !== caseId;

      if (inDemoMode) {
        const detail = mockDetails.find((item) => item.id === caseId) ?? null;

        if (!ignore) {
          setSelectedDetail(detail);
          if (detail && shouldResetEditor) {
            setEditor(createEditorState(detail.question));
            setResolutionNote(detail.resolution_note ?? '');
            setStatusFeedback(null);
            lastLoadedCaseIdRef.current = caseId;
          }
          if (!detail) lastLoadedCaseIdRef.current = null;
          setIsLoadingDetail(false);
        }

        return;
      }

      try {
        const response = await fetchQuizErrorCaseDetail(caseId, token);
        const detail = normalizeDetail(response);

        if (!ignore) {
          setSelectedDetail(detail);
          if (shouldResetEditor) {
            setEditor(createEditorState(detail.question));
            setResolutionNote(detail.resolution_note ?? '');
            setStatusFeedback(null);
            lastLoadedCaseIdRef.current = caseId;
          }
        }
      } catch (error) {
        const { message, shouldClearToken } = getErrorMessage(error, 'Không thể tải chi tiết ca báo lỗi.');

        if (shouldClearToken) setToken('');
        if (!ignore) {
          setDetailError(message);
          setSelectedDetail(null);
        }
      } finally {
        if (!ignore) setIsLoadingDetail(false);
      }
    }

    if (!selectedCaseId) {
      lastLoadedCaseIdRef.current = null;
      return;
    }

    loadDetail(selectedCaseId);

    return () => {
      ignore = true;
    };
  }, [inDemoMode, mockDetails, selectedCaseId, setToken, token]);

  const groupedCases = STATUS_ORDER.map((status) => ({
    status,
    items: cases.filter((item) => item.status === status),
  })).filter((group) => group.items.length > 0);
  const statusCounts = useMemo<Record<StatusFilter, number>>(
    () => ({
      all: statsCases.length,
      pending: statsCases.filter((item) => item.status === 'new' || item.status === 'in_progress').length,
      approved: statsCases.filter((item) => item.status === 'resolved').length,
      rejected: statsCases.filter((item) => item.status === 'rejected').length,
    }),
    [statsCases],
  );

  const recentReports = selectedDetail ? sortReportsByCreatedAt(selectedDetail.reports) : [];
  const selectedHints = selectedDetail ? extractHints(selectedDetail.question) : [];
  const selectedQuestionPreview = selectedDetail
    ? extractQuestionText(selectedDetail.question) || 'Câu hỏi chưa có nội dung.'
    : '';

  const canResolve =
    Boolean(selectedDetail) &&
    selectedDetail?.status !== 'resolved' &&
    selectedDetail?.status !== 'rejected' &&
    resolutionNote.trim().length > 0 &&
    !isSaving;
  const canReject =
    Boolean(selectedDetail) &&
    selectedDetail?.status !== 'resolved' &&
    selectedDetail?.status !== 'rejected' &&
    resolutionNote.trim().length > 0 &&
    !isSaving;

  function patchVisibleCases(updatedCase: QuizErrorCaseListItem): boolean {
    const patchedCases = patchCaseList(cases, updatedCase);
    const filteredCases = patchedCases.filter((item) =>
      caseMatchesFilters(item, statusFilter, debouncedSearchQuery, errorTypeFilter),
    );
    const updatedCaseRemainsVisible = filteredCases.some((item) => item.id === updatedCase.id);

    setCases(filteredCases);
    setStatsCases((previousCases) => upsertCaseList(previousCases, updatedCase));

    if (selectedCaseIdRef.current === updatedCase.id && !updatedCaseRemainsVisible) {
      switchSelection(getFallbackVisibleCaseId(cases, filteredCases, updatedCase.id));
      return false;
    }

    return true;
  }

  function updateMockDetail(updatedDetail: QuizErrorCaseDetailNormalized) {
    setMockDetails((previousDetails) =>
      previousDetails.map((detail) => (detail.id === updatedDetail.id ? updatedDetail : detail)),
    );
  }

  async function handleStatusChange(nextStatus: QuizErrorCaseStatus) {
    if (!selectedDetail) return;

    const trimmedResolutionNote = resolutionNote.trim();
    if ((nextStatus === 'resolved' || nextStatus === 'rejected') && !trimmedResolutionNote) {
      showFeedback('Vui lòng nhập ghi chú xử lý trước khi đóng hoặc từ chối báo lỗi.', 'error');
      return;
    }

    setSavingAction(`status-${nextStatus}`);
    showFeedback('Đang cập nhật trạng thái báo lỗi...', 'progress');

    try {
      let updatedCaseRemainsVisible = true;

      if (inDemoMode) {
        const updatedCase: QuizErrorCaseListItem = {
          ...detailToListItem(selectedDetail),
          status: nextStatus,
          resolution_note:
            nextStatus === 'in_progress'
              ? selectedDetail.resolution_note ?? null
              : trimmedResolutionNote,
        };
        const updatedDetail = mergeCaseIntoDetail(selectedDetail, updatedCase);

        setSelectedDetail(updatedDetail);
        updateMockDetail(updatedDetail);
        updatedCaseRemainsVisible = patchVisibleCases(updatedCase);
      } else {
        const response = await updateQuizErrorCaseStatus(
          selectedDetail.id,
          {
            status: nextStatus,
            ...(trimmedResolutionNote ? { resolution_note: trimmedResolutionNote } : {}),
          },
          token,
        );
        const updatedCase = response.case;

        setSelectedDetail((currentDetail) =>
          currentDetail && currentDetail.id === updatedCase.id
            ? mergeCaseIntoDetail(currentDetail, updatedCase)
            : currentDetail,
        );
        updatedCaseRemainsVisible = patchVisibleCases(updatedCase);
        setStatsRefreshKey((currentKey) => currentKey + 1);
      }

      if (updatedCaseRemainsVisible) {
        showFeedback(`Đã chuyển trạng thái sang "${STATUS_META[nextStatus].label}".`, 'success');
      }
    } catch (error) {
      const { message, shouldClearToken } = getErrorMessage(error, 'Không thể cập nhật trạng thái.');
      if (shouldClearToken) setToken('');
      showFeedback(message, 'error');
    } finally {
      setSavingAction(null);
    }
  }

  async function handleSaveQuestion() {
    if (!selectedDetail) return;

    const questionText = editor.questionText.trim();
    const options: EditorOptions = {
      A: editor.options.A.trim(),
      B: editor.options.B.trim(),
      C: editor.options.C.trim(),
      D: editor.options.D.trim(),
    };

    if (!questionText || OPTION_KEYS.some((key) => !options[key])) {
      showFeedback('Vui lòng nhập đầy đủ nội dung câu hỏi và 4 lựa chọn A-D trước khi lưu.', 'error');
      return;
    }

    const payload: QuizErrorQuestionPayload = {
      question_text: questionText,
      options,
      correct_answer: editor.correctAnswer,
      explanation: editor.explanation.trim(),
    };
    const difficulty = getDifficultyPayload(editor.difficulty);
    if (difficulty !== undefined) payload.difficulty = difficulty;

    setSavingAction('question');
    showFeedback('Đang lưu thay đổi câu hỏi...', 'progress');

    try {
      let updatedCaseRemainsVisible = true;

      if (inDemoMode) {
        const updatedQuestion: QuizErrorQuestion = {
          ...(selectedDetail.question ?? { id: selectedDetail.question_id }),
          question_text: payload.question_text,
          options: payload.options,
          correct_answer: payload.correct_answer,
          explanation: payload.explanation,
          difficulty: payload.difficulty,
        };
        const updatedDetail: QuizErrorCaseDetailNormalized = {
          ...selectedDetail,
          question: updatedQuestion,
        };
        const updatedCase = detailToListItem(updatedDetail);

        setSelectedDetail(updatedDetail);
        setEditor(createEditorState(updatedQuestion));
        updateMockDetail(updatedDetail);
        updatedCaseRemainsVisible = patchVisibleCases(updatedCase);
      } else {
        const response = await updateQuizErrorCaseQuestion(selectedDetail.id, payload, token);
        const mergedQuestion: QuizErrorQuestion = {
          ...(selectedDetail.question ?? { id: selectedDetail.question_id }),
          ...response.question,
        };
        const updatedCase: QuizErrorCaseListItem = {
          ...response.case,
          question: response.case.question ?? mergedQuestion,
        };

        setSelectedDetail((currentDetail) =>
          currentDetail && currentDetail.id === selectedDetail.id
            ? {
                ...currentDetail,
                ...response.case,
                question: mergedQuestion,
                reports: currentDetail.reports,
              }
            : currentDetail,
        );
        setEditor(createEditorState(mergedQuestion));
        updatedCaseRemainsVisible = patchVisibleCases(updatedCase);
        setStatsRefreshKey((currentKey) => currentKey + 1);
      }

      if (updatedCaseRemainsVisible) {
        showFeedback('Đã lưu thay đổi câu hỏi.', 'success');
      }
    } catch (error) {
      const { message, shouldClearToken } = getErrorMessage(error, 'Không thể lưu thay đổi câu hỏi.');
      if (shouldClearToken) setToken('');
      showFeedback(message, 'error');
    } finally {
      setSavingAction(null);
    }
  }

  function handleResetEditor() {
    if (!selectedDetail) return;
    setEditor(createEditorState(selectedDetail.question));
    setResolutionNote(selectedDetail.resolution_note ?? '');
    showFeedback('Đã khôi phục nội dung đang xem từ ca được chọn.', 'success');
  }

  function updateEditorOption(key: OptionKey, value: string) {
    setEditor((previousEditor) => ({
      ...previousEditor,
      options: {
        ...previousEditor.options,
        [key]: value,
      },
    }));
  }

  return (
    <div className="font-be-vietnam-pro">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="h-fit space-y-4 rounded-3xl border-2 border-gray-border bg-white p-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">
              Hàng chờ báo lỗi
            </p>
            <h3 className="font-fraunces text-base font-black text-on-background">
              Ca cần mentor xử lý
            </h3>
            <p className="text-[11px] font-semibold leading-relaxed text-stone-400">
              Lọc theo trạng thái, nội dung câu hỏi hoặc loại lỗi phổ biến nhất.
            </p>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-stone-100 pb-3">
            {STATUS_FILTER_OPTIONS.map((option) => {
              const isActive = statusFilter === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatusFilter(option.id)}
                  className={`rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide transition-all ${
                    isActive
                      ? 'border border-primary-green/20 bg-primary-green/10 text-primary-green-dark'
                      : 'bg-white text-stone-500 hover:bg-stone-50'
                  }`}
                  aria-label={`Lọc trạng thái ${option.label}`}
                >
                  {option.label} ({statusCounts[option.id]})
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo câu hỏi, case ID..."
                className="w-full rounded-xl border border-gray-border bg-stone-50/30 py-2.5 pl-9 pr-4 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                aria-label="Tìm kiếm ca báo lỗi quiz"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quiz-error-type-filter" className="text-[9px] font-black uppercase text-stone-400">
                Loại lỗi
              </label>
              <div className="relative">
                <select
                  id="quiz-error-type-filter"
                  value={errorTypeFilter}
                  onChange={(event) => setErrorTypeFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-border bg-white px-3 py-2 pr-8 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                  aria-label="Lọc theo loại lỗi"
                >
                  {ERROR_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              </div>
            </div>
          </div>

          <div className="max-h-[640px] space-y-4 overflow-y-auto border-t border-stone-100 pt-3 pr-1 custom-scrollbar">
            {isLoadingList ? (
              <div className="space-y-2" aria-live="polite">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3">
                    <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
                    <div className="mt-3 h-4 w-full animate-pulse rounded bg-stone-200" />
                    <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-stone-200" />
                  </div>
                ))}
              </div>
            ) : listError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-rose-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">{listError}</p>
                </div>
              </div>
            ) : cases.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-gray-border bg-stone-50/50 px-5 py-10 text-center">
                <FileEdit className="mx-auto h-9 w-9 text-stone-300" />
                <p className="mt-3 text-xs font-black text-stone-400">
                  Không có ca báo lỗi nào khớp bộ lọc hiện tại.
                </p>
              </div>
            ) : (
              groupedCases.map((group) => (
                <div key={group.status} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400">
                    <span className={`h-2 w-2 rounded-full ${STATUS_META[group.status].dotClass}`} />
                    <span>{STATUS_META[group.status].label}</span>
                    <span className="rounded-full bg-stone-100 px-1.5 py-0.5 font-mono text-stone-500">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const isActive = selectedCaseId === item.id;
                      const questionPreview = extractQuestionText(item.question) || 'Câu hỏi chưa có nội dung.';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedCaseId(item.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition-all ${
                            isActive
                              ? 'border-primary-green bg-primary-green/5 ring-1 ring-primary-green/10'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                          aria-pressed={isActive}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 space-y-1">
                              <p className="font-mono text-[9px] font-black uppercase text-stone-400">
                                #{item.question_id}
                              </p>
                              <p className="line-clamp-2 text-xs font-extrabold leading-relaxed text-stone-700">
                                {questionPreview}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase ${STATUS_META[item.status].badgeClass}`}
                            >
                              {STATUS_META[item.status].label}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-stone-500">
                            <span className="rounded-xl bg-stone-50 px-2 py-1">
                              {item.report_count} báo cáo
                            </span>
                            <span className="rounded-xl bg-stone-50 px-2 py-1">
                              {formatErrorType(item.most_common_error_type)}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-stone-400">
                            <Clock3 className="h-3 w-3" />
                            <span>Báo cáo gần nhất: {formatDate(item.last_reported_at)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="min-h-[560px] rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6">
          {!selectedCaseId ? (
            <div className="rounded-3xl border-2 border-dashed border-gray-border bg-stone-50/50 px-6 py-20 text-center">
              <Inbox className="mx-auto h-10 w-10 text-stone-300" />
              <p className="mt-3 text-xs font-black text-stone-400">
                Chọn một ca trong hàng chờ để xem báo cáo và chỉnh câu hỏi.
              </p>
            </div>
          ) : isLoadingDetail ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border-2 border-dashed border-gray-border bg-stone-50/50">
              <div className="text-center">
                <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-green" />
                <p className="mt-3 text-xs font-black uppercase tracking-widest text-stone-400">
                  Đang tải chi tiết ca báo lỗi
                </p>
              </div>
            </div>
          ) : detailError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-rose-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase">Không thể tải chi tiết</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed">{detailError}</p>
                </div>
              </div>
            </div>
          ) : selectedDetail ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[10px] font-black uppercase text-stone-500">
                      Case #{selectedDetail.id}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[10px] font-black uppercase text-stone-500">
                      Question #{selectedDetail.question_id}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${STATUS_META[selectedDetail.status].badgeClass}`}
                    >
                      {STATUS_META[selectedDetail.status].label}
                    </span>
                  </div>
                  <h3 className="font-fraunces text-lg font-black leading-snug text-stone-800">
                    {selectedQuestionPreview}
                  </h3>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 px-4 py-3 text-blue-700">
                  <p className="text-[9px] font-black uppercase tracking-widest">Tổng báo cáo</p>
                  <p className="mt-1 text-2xl font-black">{selectedDetail.report_count}</p>
                </div>
              </div>

              {statusFeedback && (
                <div
                  className={`rounded-2xl border p-3 ${
                    statusFeedback.tone === 'error'
                      ? 'border-rose-200 bg-rose-50/60 text-rose-700'
                      : statusFeedback.tone === 'progress'
                        ? 'border-blue-200 bg-blue-50/60 text-blue-700'
                        : 'border-primary-green/20 bg-primary-green/5 text-primary-green-dark'
                  }`}
                  role={statusFeedback.tone === 'error' ? 'alert' : 'status'}
                  aria-live={statusFeedback.tone === 'error' ? 'assertive' : 'polite'}
                  aria-atomic="true"
                >
                  <div className="flex items-start gap-2">
                    {statusFeedback.tone === 'progress' ? (
                      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                    ) : statusFeedback.tone === 'error' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <p className="text-xs font-bold leading-relaxed">{statusFeedback.message}</p>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border-2 border-gray-border bg-stone-50/50 p-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <MessageSquareWarning className="h-4 w-4 text-amber-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    Insight từ báo cáo gần đây
                  </h4>
                </div>

                <div className="mt-3 space-y-2">
                  {recentReports.length ? (
                    recentReports.map((report) => (
                      <article key={report.id} className="rounded-2xl border border-stone-200 bg-white p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">
                            {formatErrorType(report.error_type)}
                          </span>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-[9px] font-bold text-stone-500">
                            Chọn: {report.selected_option || 'Không có'}
                          </span>
                          <span className="ml-auto text-[9px] font-bold text-stone-400">
                            {formatDate(report.created_at)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-stone-600">
                          {report.detail || 'Học viên không nhập mô tả chi tiết.'}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-4 text-xs font-bold text-stone-400">
                      Chưa có báo cáo chi tiết trong ca này.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border-2 border-gray-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">
                      Inline question editor
                    </p>
                    <h4 className="font-fraunces text-base font-black text-stone-800">
                      Sửa nội dung câu hỏi
                    </h4>
                  </div>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[9px] font-black uppercase text-stone-500">
                    Chỉ sửa câu hỏi, đáp án và độ khó
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="quiz-error-question-text" className="text-[9px] font-black uppercase text-stone-400">
                    Nội dung câu hỏi
                  </label>
                  <textarea
                    id="quiz-error-question-text"
                    value={editor.questionText}
                    onChange={(event) =>
                      setEditor((previousEditor) => ({
                        ...previousEditor,
                        questionText: event.target.value,
                      }))
                    }
                    className="min-h-24 w-full rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-xs font-semibold leading-relaxed text-stone-700 focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green/10"
                    aria-label="Nội dung câu hỏi cần sửa"
                  />
                </div>

                <fieldset className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <legend className="sr-only">Các lựa chọn và đáp án đúng</legend>
                  {OPTION_KEYS.map((key) => {
                    const isCorrect = editor.correctAnswer === key;
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <label
                            htmlFor={`quiz-error-option-${key}`}
                            className={`text-[10px] font-black uppercase font-mono ${
                              isCorrect ? 'text-primary-green-dark font-black' : 'text-stone-400'
                            }`}
                          >
                            Lựa chọn {key}
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditor((previousEditor) => ({
                                ...previousEditor,
                                correctAnswer: key,
                              }))
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                              isCorrect
                                ? 'bg-primary-green/10 border-primary-green/30 text-primary-green-dark'
                                : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600'
                            }`}
                            aria-label={`Đặt lựa chọn ${key} là đáp án đúng`}
                          >
                            <span className={`h-2 w-2 rounded-full ${isCorrect ? 'bg-primary-green-dark animate-pulse' : 'bg-stone-300'}`} />
                            Đúng
                          </button>
                        </div>
                        <textarea
                          id={`quiz-error-option-${key}`}
                          value={editor.options[key]}
                          onChange={(event) => updateEditorOption(key, event.target.value)}
                          className={`min-h-[70px] w-full rounded-2xl border-2 px-4 py-3 text-xs font-semibold leading-relaxed focus:outline-none transition-all ${
                            isCorrect
                              ? 'border-primary-green bg-primary-green/5 text-stone-800 focus:border-primary-green-dark'
                              : 'border-gray-border bg-white text-stone-700 focus:border-primary-green'
                          }`}
                          aria-label={`Nội dung lựa chọn ${key}`}
                        />
                      </div>
                    );
                  })}
                </fieldset>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-1.5">
                    <label htmlFor="quiz-error-explanation" className="text-[9px] font-black uppercase text-stone-400">
                      Giải thích
                    </label>
                    <textarea
                      id="quiz-error-explanation"
                      value={editor.explanation}
                      onChange={(event) =>
                        setEditor((previousEditor) => ({
                          ...previousEditor,
                          explanation: event.target.value,
                        }))
                      }
                      className="min-h-28 w-full rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-xs font-semibold leading-relaxed text-stone-700 focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green/10"
                      aria-label="Giải thích đáp án"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="quiz-error-difficulty" className="text-[9px] font-black uppercase text-stone-400">
                      Độ khó
                    </label>
                    <div className="relative">
                      <select
                        id="quiz-error-difficulty"
                        value={editor.difficulty}
                        onChange={(event) =>
                          setEditor((previousEditor) => ({
                            ...previousEditor,
                            difficulty: event.target.value,
                          }))
                        }
                        className="w-full appearance-none rounded-xl border-2 border-gray-border bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none pr-8"
                        aria-label="Độ khó câu hỏi"
                      >
                        <option value="dễ">Dễ</option>
                        <option value="bình thường">Bình thường</option>
                        <option value="khó">Khó</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-stone-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-gray-border bg-stone-50/50 p-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    Gợi ý hiện có
                  </h4>
                </div>

                {selectedHints.length ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {selectedHints.map((hint, index) => (
                      <div key={`${hint.label}-${index}`} className="rounded-2xl border border-blue-100 bg-white p-3">
                        <p className="text-[9px] font-black uppercase text-blue-700">{hint.label}</p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-stone-600">
                          {hint.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl border border-dashed border-stone-200 bg-white p-4 text-xs font-bold leading-relaxed text-stone-500">
                    Câu hỏi này chưa có gợi ý trong dữ liệu hiện tại. Việc chỉnh sửa hint nằm ngoài phạm vi
                    workflow xử lý báo lỗi quiz này.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                <label htmlFor="quiz-error-resolution-note" className="text-[10px] font-black uppercase text-amber-700">
                  Ghi chú xử lý
                </label>
                <textarea
                  id="quiz-error-resolution-note"
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  placeholder="Ví dụ: Đã sửa đáp án đúng từ C sang B và bổ sung giải thích về metadata filtering."
                  className="mt-2 min-h-20 w-full rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-xs font-semibold leading-relaxed text-stone-700 focus:border-amber-500 focus:outline-none"
                  aria-label="Ghi chú xử lý báo lỗi"
                />
                <p className="mt-2 text-[10px] font-semibold leading-relaxed text-amber-700">
                  Bắt buộc khi đóng là đã xử lý hoặc từ chối báo lỗi.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  disabled={!selectedDetail || isSaving}
                  className="btn-3d btn-green flex items-center gap-1 px-4 py-2 text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Lưu thay đổi câu hỏi"
                >
                  {savingAction === 'question' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>{savingAction === 'question' ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('resolved')}
                  disabled={!canResolve}
                  className="btn-3d btn-green flex items-center gap-1 px-4 py-2 text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Đóng báo lỗi là đã xử lý"
                >
                  {savingAction === 'status-resolved' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Đóng là đã xử lý</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('rejected')}
                  disabled={!canReject}
                  className="btn-3d btn-red flex items-center gap-1 px-4 py-2 text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Từ chối báo lỗi"
                >
                  {savingAction === 'status-rejected' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Từ chối báo lỗi</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetEditor}
                  disabled={!selectedDetail || isSaving}
                  className="btn-3d btn-white ml-auto flex items-center gap-1 px-4 py-2 text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Bỏ qua thay đổi và khôi phục nội dung ca đang chọn"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  <span>Bỏ qua</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-gray-border bg-stone-50/50 px-6 py-20 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-stone-300" />
              <p className="mt-3 text-xs font-black text-stone-400">
                Không tìm thấy chi tiết cho ca đã chọn.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
