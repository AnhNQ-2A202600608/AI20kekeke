'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  AlertTriangle,
  ListTodo,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Loader2,
  Maximize2,
  Minimize2,
  MessageCircle,
  LockKeyhole,
  ArrowUpRight,
  Route,
  BookOpen,
  Gauge
} from 'lucide-react';
import { useQuizSession } from '../../app/hooks/useQuizSession';
import { useSocraticSidebar } from '../../app/hooks/useSocraticSidebar';
import { useSurveyHandlers } from '../../app/hooks/useSurveyHandlers';
import { useBoundStore } from '@/hooks/useBoundStore';
import { SocraticMarkdown } from '../dashboard/socratic-chat/student/components/ai-message-item';
import { SocraticChatBody } from './socratic-sidebar-view';
import { SofiExpressionAvatar } from '@/components/mascot';
import { DEFAULT_ADAPTIVE_COURSE_ID, logAdaptiveHintUsage } from '@/lib/adaptive/api-client';
import { getRequestAuthToken } from '@/lib/auth-token';
import { AdaptiveChallengeInfo } from './adaptive-challenge-info';

interface QuizQuestionViewProps {
  quiz: ReturnType<typeof useQuizSession>;
  aiSidebar: ReturnType<typeof useSocraticSidebar>;
  surveys: ReturnType<typeof useSurveyHandlers>;
}

async function parseQuizReportError(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === 'string') return payload.detail;
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
  } catch {
    // Fall through to the generic status message.
  }

  return `Gửi báo cáo thất bại với mã ${response.status}.`;
}

function adaptiveDifficultyBand(expectedSuccess?: number | null, elo?: number | null): { label: string; rank: number } {
  if (typeof expectedSuccess === 'number' && Number.isFinite(expectedSuccess)) {
    if (expectedSuccess >= 0.85) return { label: 'dễ hơn', rank: 0 };
    if (expectedSuccess >= 0.62) return { label: 'vừa sức', rank: 1 };
    return { label: 'thử thách', rank: 2 };
  }

  if (typeof elo !== 'number' || !Number.isFinite(elo)) return { label: 'vừa sức', rank: 1 };
  if (elo < 1150) return { label: 'dễ hơn', rank: 0 };
  if (elo < 1300) return { label: 'vừa sức', rank: 1 };
  return { label: 'thử thách', rank: 2 };
}

function QuizMetaChip({
  icon,
  label,
  tone = 'neutral',
  children,
  tourId,
}: {
  icon: ReactNode;
  label: string;
  tone?: 'neutral' | 'green';
  children?: ReactNode;
  tourId?: string;
}) {
  return (
    <span
      data-quiz-tour-id={tourId}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1 text-caption-tight font-black ${
        tone === 'green'
          ? 'border-primary-green/20 bg-primary-green-light/70 text-primary-green-dark'
          : 'border-stone-200 bg-white text-stone-600'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
      {children}
    </span>
  );
}

export function QuizQuestionView({ quiz, aiSidebar }: QuizQuestionViewProps) {
  const { conceptMasteries, userId, activePracticeSession, token, setToken } = useBoundStore();

  // Report error states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportErrorType, setReportErrorType] = useState('Sai kiến thức chuyên môn');
  const [reportDetail, setReportDetail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const [hintPopoverQuestionId, setHintPopoverQuestionId] = useState<string | number | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    questionId: string | number;
    optionKey: string;
  } | null>(null);
  const [isTutorExpanded, setIsTutorExpanded] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'hints' | 'chat'>('hints');
  const [isLoggingHint, setIsLoggingHint] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitReport = async () => {
    if (!reportDetail.trim() || !currentQuestion) return;
    setIsSubmittingReport(true);
    try {
      const { authToken, usedExpiredToken, rejectedDemoToken } = getRequestAuthToken(token);
      if (usedExpiredToken || rejectedDemoToken) setToken('');
      if (!authToken) {
        showToast('❌ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để gửi báo cáo.');
        return;
      }
      const reportedQuestionId = currentQuestion.adaptive?.questionId ?? currentQuestion.id;
      const response = await fetch('/api/v1/quiz/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          question_id: String(reportedQuestionId),
          question_text: currentQuestion.question || '',
          selected_option: selectedOption ? String(selectedOption) : null,
          error_type: reportErrorType,
          detail: reportDetail,
          student_id: userId ? String(userId) : null,
          course_id: DEFAULT_ADAPTIVE_COURSE_ID
        }),
      });

      if (response.ok) {
        showToast('Đã ghi nhận báo lỗi quiz. Mentor sẽ kiểm tra trong hộp thư báo lỗi và cập nhật câu hỏi nếu cần.');
        setIsReportModalOpen(false);
        setReportDetail('');
      } else {
        showToast(`❌ ${await parseQuizReportError(response)}`);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('❌ Đã xảy ra lỗi kết nối khi gửi báo cáo.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const {
    activeSetId,
    activeSet,
    questionsList,
    currentQuestionIdx,
    totalQuestions,
    currentQuestion,
    currentHistory,
    selectedOption,
    isSubmitted,
    isEssayCompleted,
    essayInput,
    setEssayInput,
    handleSelectOption,
    handleSubmitEssay,
    handleGradeEssay,
    handleToggleEvaluationPoint,
    handleNextQuestion,
    setCurrentQuestionIdx,
    handleExitQuiz,
    adaptiveError,
    isLoadingNextQuestion,
    isSubmittingAnswer
  } = quiz;
  const {
    quizHintCount,
    setIsMobileSidebarOpen,
    isSocraticOpen,
    setIsSocraticOpen,
    isSidebarTyping,
    handleRequestQuizHint,
    openSocraticWithDraft,
    sidebarMessages,
    setSidebarMessages,
    sidebarInputValue,
    setSidebarInputValue,
    sidebarEndRef,
    handleSendQuizSidebarMessage
  } = aiSidebar;

  // 3. 2-Part Explanation Heuristic Parser
  const parsedExplanation = useMemo(() => {
    if (!currentQuestion?.explanation) return { correct: '', incorrect: null };
    const text = currentQuestion.explanation;
    const splitKeywords = [
      /trong khi đó/i,
      /tuy nhiên/i,
      /ngược lại/i,
      /còn lại/i,
      /phương án khác/i,
      /đáp án khác/i
    ];
    for (const regex of splitKeywords) {
      const match = text.match(regex);
      if (match && match.index !== undefined) {
        return {
          correct: text.substring(0, match.index).trim(),
          incorrect: text.substring(match.index).trim()
        };
      }
    }
    return {
      correct: text,
      incorrect: "Các phương án khác không mô tả chính xác bản chất hoặc cơ chế hoạt động của khái niệm này."
    };
  }, [currentQuestion]);

  const isAdaptiveQuestion = activePracticeSession?.mode === 'adaptive' && !!currentQuestion?.adaptive;

  // 5. Unlocked Socratic hints rendered inline pre-submission
  const unlockedHints = useMemo(() => {
    if (quizHintCount === 0 || !currentQuestion) return [];
    const dbHints = (currentQuestion.hints || [])
      .slice(0, quizHintCount)
      .map((hint: any, index: number) => {
        const content = typeof hint === 'string' ? hint : hint.content || hint.hint_text || '';
        return `**Gợi ý ${index + 1}**: ${content}`;
      })
      .filter(Boolean);
    if (dbHints.length > 0) return dbHints;

    const hints: string[] = [];
    if (quizHintCount >= 1) {
      hints.push(`**Gợi ý 1**: Tập trung vào yêu cầu chính của câu hỏi. Từ khóa cốt lõi đang hỏi về vai trò hay kết quả của khái niệm?`);
    }
    if (quizHintCount >= 2) {
      const expl = currentQuestion.explanation || '';
      const clue = expl.length > 50 ? expl.substring(0, 80) + '...' : expl;
      hints.push(`**Gợi ý 2**: Manh mối quan trọng: "${clue}". Lựa chọn nào khớp trực tiếp nhất với mô tả này?`);
    }
    if (quizHintCount >= 3) {
      hints.push(currentQuestion.answer
        ? `**Gợi ý 3**: Đây là gợi ý cuối. Hãy xem xét kỹ đáp án **${currentQuestion.answer}**.`
        : '**Gợi ý 3**: Loại trừ phương án không khớp bản chất khái niệm, rồi chọn đáp án còn lại hợp lý nhất.'
      );
    }
    return hints;
  }, [quizHintCount, currentQuestion]);
  const selectedHintIndex = unlockedHints.length > 0
    ? Math.min(activeHintIndex, unlockedHints.length - 1)
    : 0;
  const selectedHint = unlockedHints[selectedHintIndex] ?? null;
  const shouldShowHintPanel = !!selectedHint && hintPopoverQuestionId === currentQuestion.id;
  const canSkipAfterHints = quizHintCount >= 2;
  const pendingSelectedOption = currentQuestion && pendingSelection && !isSubmitted && pendingSelection.questionId === currentQuestion.id
    ? pendingSelection.optionKey
    : null;

  useEffect(() => {
    if (!currentQuestion?.options || isSubmitted || isSubmittingAnswer) return;

    const optionKeys = Object.keys(currentQuestion.options);
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;

      const numericIndex = Number(event.key) - 1;
      if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < optionKeys.length) {
        event.preventDefault();
        setPendingSelection({
          questionId: currentQuestion.id,
          optionKey: optionKeys[numericIndex],
        });
        return;
      }

      if (event.key === 'Enter' && pendingSelectedOption) {
        event.preventDefault();
        handleSelectOption(pendingSelectedOption, quizHintCount);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, handleSelectOption, isSubmitted, isSubmittingAnswer, pendingSelectedOption, quizHintCount]);

  // 5. Random feedback copy (Seed-based to remain consistent for the same question)
  const feedbackCopy = useMemo(() => {
    if (!isSubmitted || !currentQuestion) return '';
    if (currentHistory?.selected === 'essay_submitted') return '';
    const isCorrect = currentHistory?.isCorrect;
    const correctOptions = [
      "Tuyệt vời! Bạn nắm kiến thức rất vững.",
      "Chuẩn xác! Lập luận của bạn rất xuất sắc.",
      "Chính xác! Câu trả lời rất thuyết phục.",
      "Tuyệt cú mèo! Bạn tư duy rất nhạy bén.",
      "Quá đỉnh! Không thể sai được.",
      "Lựa chọn tuyệt vời! Bạn đang làm rất tốt."
    ];
    const incorrectOptions = [
      "Không sao cả, sai sót là bước đệm để học tập!",
      "Chưa chính xác, hãy đọc kỹ phần giải thích bên dưới nhé.",
      "Tiếc quá! Xem giải thích để lấp đầy EduGap này nhé.",
      "Đừng nản lòng, câu tiếp theo bạn sẽ làm tốt hơn!",
      "Thử thách này hơi khó, hãy ôn lại kiến thức này nhé.",
      "Chưa đúng rồi, hãy cùng AI Tutor phân tích lại nhé."
    ];
    const options = isCorrect ? correctOptions : incorrectOptions;
    const numericId = Number(currentQuestion.id);
    const seed = (Number.isFinite(numericId) ? numericId : currentQuestion.question.length) + (isCorrect ? 100 : 200);
    return options[seed % options.length];
  }, [isSubmitted, currentQuestion, currentHistory]);

  // Framer motion variants for staggered entry
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring' as const, damping: 20, stiffness: 150 } 
    }
  } as const;
  const [zoomedTutorImageUrl, setZoomedTutorImageUrl] = useState<string | null>(null);
  const [wrongPromptDraftState, setWrongPromptDraftState] = useState<{
    questionId: string | number | null;
    used: boolean;
  }>({ questionId: null, used: false });
  const [dismissedTransitionKey, setDismissedTransitionKey] = useState<string | null>(null);

  const hasMcqOptions = Boolean(
    currentQuestion.options &&
    Object.values(currentQuestion.options).some((option) => typeof option === 'string' && option.trim().length > 0)
  );
  const isEssayQuestion = currentQuestion.type === 'short_answer' || !hasMcqOptions || Boolean(currentQuestion.expected_answer);
  const essayReferenceAnswer = currentQuestion.expected_answer?.trim() || currentQuestion.explanation?.trim() || '';

  const quizViewState = (() => {
    if (isEssayQuestion) {
      if (!isSubmitted) return 'essay-input';
      return isEssayCompleted ? 'essay-graded' : 'essay-review';
    }
    if (!isSubmitted) {
      if (pendingSelectedOption) return 'mcq-selected';
      return selectedHint ? 'mcq-hint-open' : 'mcq-answering';
    }
    return currentHistory?.isCorrect ? 'mcq-correct' : 'mcq-wrong';
  })();
  const isWrongSubmitted = quizViewState === 'mcq-wrong';
  const explanationSummary = parsedExplanation.correct.length > 220
    ? `${parsedExplanation.correct.slice(0, 220).trim()}...`
    : parsedExplanation.correct;
  const correctAnswerText = currentQuestion.answer && currentQuestion.options?.[currentQuestion.answer]
    ? `${currentQuestion.answer}. ${currentQuestion.options[currentQuestion.answer]}`
    : currentQuestion.answer;
  const progressPct = totalQuestions > 0
    ? Math.round(((currentQuestionIdx + 1) / totalQuestions) * 100)
    : 0;
  const contextLabel = activeSet?.topic_title || activeSet?.title || activeSetId;
  const currentDifficultyBand = adaptiveDifficultyBand(
    currentQuestion.adaptive?.expectedSuccess,
    currentQuestion.adaptive?.questionDifficultyElo
  );
  const difficultyLabel = isAdaptiveQuestion
    ? currentDifficultyBand.label
    : currentQuestion.difficulty || activeSet?.difficulty || 'bình thường';
  const challengeLabel = isEssayQuestion ? 'Tự luận / rubric' : difficultyLabel;
  const essayEvaluationPoints = Array.isArray(currentQuestion.evaluation_points)
    ? currentQuestion.evaluation_points
    : [];
  const checkedEssayPoints = essayEvaluationPoints.filter((point: string) => currentHistory?.checkedPoints?.includes(point)).length;
  const showEssayReviewPanel = isEssayQuestion && isSubmitted && !isEssayCompleted;
  const adaptiveTransition = useMemo(() => {
    if (!currentQuestion) return null;
    const previousQuestion = questionsList[currentQuestionIdx - 1];
    const previousExpectedSuccess = previousQuestion?.adaptive?.expectedSuccess;
    const currentExpectedSuccess = currentQuestion.adaptive?.expectedSuccess;
    const previousDifficulty = previousQuestion?.adaptive?.questionDifficultyElo;
    const currentDifficulty = currentQuestion.adaptive?.questionDifficultyElo;
    if (
      currentQuestionIdx > 0 &&
      (previousExpectedSuccess !== undefined || previousDifficulty !== undefined) &&
      (currentExpectedSuccess !== undefined || currentDifficulty !== undefined)
    ) {
      const before = adaptiveDifficultyBand(previousExpectedSuccess, previousDifficulty);
      const after = adaptiveDifficultyBand(currentExpectedSuccess, currentDifficulty);
      if (after.rank !== before.rank) {
        const increased = after.rank > before.rank;
        return {
          key: `${currentQuestion.id}:difficulty:${before.label}-${after.label}`,
          type: 'difficulty' as const,
          eyebrow: increased ? 'Độ khó đã tăng' : 'Độ khó đã giảm',
          title: `${before.label} -> ${after.label}`,
          body: increased
            ? 'Bạn vừa trả lời đủ tốt để EduGap nâng mức thử thách tiếp theo.'
            : 'EduGap đang giảm độ khó để củng cố nền tảng trước khi tăng tốc lại.',
        };
      }
    }

    const previousConceptId = previousQuestion?.adaptive?.conceptId;
    const currentConceptId = currentQuestion.adaptive?.conceptId;
    if (currentQuestionIdx > 0 && previousConceptId && currentConceptId && previousConceptId !== currentConceptId) {
      return {
        key: `${currentQuestion.id}:concept:${previousConceptId}-${currentConceptId}`,
        type: 'concept' as const,
        eyebrow: 'Đổi chủ đề luyện tập',
        title: 'Sang vùng kiến thức mới',
        body: 'EduGap đang chuyển câu hỏi sang concept khác để kiểm tra độ phủ, không chỉ lặp lại một mảng kiến thức.',
      };
    }

    return null;
  }, [currentQuestion, currentQuestionIdx, questionsList]);

  const showAdaptiveTransition = adaptiveTransition && dismissedTransitionKey !== adaptiveTransition.key;

  if (!currentQuestion) return null;
  const showWrongAnswerNudge = !!(
    isSubmitted &&
    currentHistory &&
    !currentHistory.isCorrect
  );
  const wrongAnswerPrompt = showWrongAnswerNudge ? (() => {
    const selected = currentHistory?.selected;
    const selectedText = selected && currentQuestion.options?.[selected]
      ? `\nĐáp án em đã chọn: ${selected}. ${currentQuestion.options[selected]}`
      : selected === 'unknown'
        ? '\nEm đã chọn chưa biết hoặc bỏ qua câu này.'
        : currentHistory?.essayAnswer
          ? `\nBài tự luận em đã viết: ${currentHistory.essayAnswer}`
          : '';
    const correctText = currentQuestion.answer && currentQuestion.options?.[currentQuestion.answer]
      ? `\nĐáp án đúng là: ${currentQuestion.answer}. ${currentQuestion.options[currentQuestion.answer]}`
      : currentQuestion.expected_answer
        ? `\nĐáp án tham chiếu: ${currentQuestion.expected_answer}`
        : '';

    return `Em vừa làm sai câu này. Hãy giải thích theo kiểu Socratic: vì sao cách nghĩ của em chưa đúng, gợi ý từng bước để hiểu bản chất, và nếu có thể hãy chỉ ra tài liệu/slide nên ôn lại.\n\nCâu hỏi: ${currentQuestion.question}${selectedText}${correctText}`;
  })() : '';
  const essayTutorPrompt = isEssayQuestion ? (() => {
    const studentAnswer = currentHistory?.essayAnswer || essayInput || '';
    const checklistText = essayEvaluationPoints.length
      ? `\nTiêu chí tự kiểm tra:\n${essayEvaluationPoints.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n')}`
      : '';

    return `Hãy giúp em đối chiếu bài tự luận theo kiểu Socratic. Không chấm thay tuyệt đối; hãy chỉ ra điểm đã khớp rubric, điểm còn thiếu, và đặt 1-2 câu hỏi gợi mở để em tự sửa.\n\nCâu hỏi: ${currentQuestion.question}\n\nBài làm của em: ${studentAnswer || '(em chưa nhập bài làm)'}\n\nĐáp án tham chiếu: ${essayReferenceAnswer || '(chưa có đáp án tham chiếu)'}${checklistText}`;
  })() : '';

  const handleRequestNextHint = async () => {
    if (isLoggingHint) return;
    if (quizHintCount < 3) {
      const nextHintLevel = Math.min(quizHintCount + 1, 3);
      if (currentQuestion.adaptive && userId) {
        setIsLoggingHint(true);
        try {
          await logAdaptiveHintUsage({
            token,
            setToken,
            studentId: userId,
            courseId: DEFAULT_ADAPTIVE_COURSE_ID,
            questionId: currentQuestion.adaptive.questionId,
            decisionId: currentQuestion.adaptive.decisionId,
            hintLevel: nextHintLevel,
          });
        } catch (error) {
          console.error('Adaptive hint log failed:', error);
          showToast('Không ghi nhận được lượt dùng hint. Hãy thử lại trước khi nộp bài.');
          setIsLoggingHint(false);
          return;
        }
        setIsLoggingHint(false);
      }
      handleRequestQuizHint();
      setActiveHintIndex(Math.min(quizHintCount, 2));
    } else {
      setActiveHintIndex(Math.min(unlockedHints.length - 1, 2));
    }
    setHintPopoverQuestionId(currentQuestion.id);
    setIsSocraticOpen(true);
    setSidebarTab('hints');
  };

  const handlePickOption = (optionKey: string) => {
    if (isSubmitted || isSubmittingAnswer || !currentQuestion) return;
    setPendingSelection({
      questionId: currentQuestion.id,
      optionKey,
    });
  };

  const handleClearPendingOption = () => {
    if (isSubmittingAnswer) return;
    setPendingSelection(null);
  };

  const handleCheckPendingOption = () => {
    if (!pendingSelectedOption || isSubmittingAnswer) return;
    handleSelectOption(pendingSelectedOption, quizHintCount);
  };

  const handleSkipAfterHints = () => {
    if (!canSkipAfterHints || isSubmittingAnswer) return;
    handleSelectOption('unknown', quizHintCount);
  };

  const hasUsedWrongPromptDraft = wrongPromptDraftState.questionId === currentQuestion.id && wrongPromptDraftState.used;
  const tutorInputValue = showWrongAnswerNudge && !hasUsedWrongPromptDraft && !sidebarInputValue.trim()
    ? wrongAnswerPrompt
    : sidebarInputValue;

  const handleSubmitTutorMessage = (text: string) => {
    setWrongPromptDraftState({ questionId: currentQuestion.id, used: true });
    handleSendQuizSidebarMessage(text);
  };

  const handleOpenTutorChat = (draft?: string) => {
    if (draft) {
      setSidebarInputValue(draft);
    }
    setIsMobileSidebarOpen(true);
    setIsSocraticOpen(true);
    setSidebarTab('chat');
  };

  const handleAskTutorAboutCurrentAnswer = () => {
    if (isEssayQuestion) {
      handleOpenTutorChat(essayTutorPrompt);
      setIsTutorExpanded(true);
      return;
    }

    handleShowDetailedExplanation();
  };

  const handleShowDetailedExplanation = () => {
    if (!currentQuestion || !correctAnswerText) return;

    const explanationId = `explanation-${currentQuestion.id}`;
    
    setSidebarMessages(prev => {
      if (prev.some(m => m.id === explanationId)) return prev;
      return [
        ...prev,
        {
          id: explanationId,
          sender: 'ai',
          text: `**🦊 Giải thích chi tiết đáp án**\n\n**Đáp án đúng:** **${correctAnswerText}**\n\n${explanationSummary || 'Không có giải thích tóm tắt cho câu hỏi này.'}\n\n*Bạn có câu hỏi hay thắc mắc gì thêm về phần kiến thức này không? Hãy trò chuyện cùng mình ở dưới nhé!*`
        }
      ];
    });

    setIsSocraticOpen(true);
    setIsTutorExpanded(true);
    setSidebarTab('chat');
  };

  return (
    <motion.div
      key={`${activeSetId}-${currentQuestion.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-primary-green/15 border-b-[4px] bg-[#fbfff4] shadow-[0_12px_28px_rgba(70,163,2,0.08)] font-be-vietnam-pro"
    >
      <AnimatePresence>
        {showAdaptiveTransition ? (
          <motion.div
            key={adaptiveTransition.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[90] grid place-items-center bg-[#fbfff4]/95 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: -10 }}
              transition={{ type: 'spring', damping: 18, stiffness: 170 }}
              className="w-full max-w-md rounded-3xl border border-primary-green/25 border-b-[6px] bg-white p-5 text-center shadow-[0_24px_70px_rgba(70,163,2,0.18)]"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary-green/25 bg-primary-green-light text-primary-green-dark">
                {adaptiveTransition.type === 'difficulty' ? (
                  <ArrowUpRight className="h-7 w-7" aria-hidden="true" />
                ) : (
                  <Route className="h-7 w-7" aria-hidden="true" />
                )}
              </div>
              <p className="mt-4 text-label-tight font-black uppercase text-primary-green-dark">
                {adaptiveTransition.eyebrow}
              </p>
              <h2 className="mt-2 font-fraunces text-question-title-lg font-black leading-tight text-on-background">
                {adaptiveTransition.title}
              </h2>
              <p className="mt-2 text-control-label font-semibold leading-relaxed text-stone-600">
                {adaptiveTransition.body}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-green-light">
                <motion.div
                  className="h-full rounded-full bg-primary-green"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.25, ease: 'easeOut' }}
                />
              </div>
              <button
                type="button"
                onClick={() => setDismissedTransitionKey(adaptiveTransition.key)}
                className="mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-gray-border bg-white px-4 text-label-tight font-black uppercase text-on-background shadow-sm transition hover:bg-surface-container-low"
              >
                Tiếp tục
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex h-full min-h-0 flex-col p-2 md:p-2.5">
        <div className={`flex-1 min-h-0 overflow-hidden ${
          isSocraticOpen ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_320px]' : ''
        }`}>
        <div className="min-w-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-4 xl:p-5">
          <div
            data-quiz-tour-id="question-card"
            className="relative rounded-2xl border border-[#e8dec5] border-b-[4px] bg-[#fffdf7] p-4 shadow-sm sm:p-5"
          >
            <div className="pointer-events-none absolute left-0 top-8 hidden -translate-x-1/2 flex-col gap-7 sm:flex">
              <span className="h-4 w-4 rounded-full border border-primary-green/25 bg-[#f4fce8] shadow-sm" />
              <span className="h-4 w-4 rounded-full border border-primary-green/25 bg-[#f4fce8] shadow-sm" />
              <span className="h-4 w-4 rounded-full border border-primary-green/25 bg-[#f4fce8] shadow-sm" />
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-green/10 px-2.5 py-1 text-label-tight font-black uppercase tracking-normal text-primary-green-dark">
                  Q{currentQuestionIdx + 1}/{totalQuestions}
                </span>
                <QuizMetaChip
                  icon={<BookOpen className="h-3.5 w-3.5" aria-hidden="true" />}
                  label={contextLabel}
                />
                <QuizMetaChip
                  icon={<Gauge className="h-3.5 w-3.5" aria-hidden="true" />}
                  label={challengeLabel}
                  tone="green"
                  tourId="difficulty-chip"
                >
                  {isAdaptiveQuestion ? <AdaptiveChallengeInfo /> : null}
                </QuizMetaChip>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex min-w-[132px] items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-primary-green transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="w-8 text-right text-caption-tight font-extrabold text-stone-500">{progressPct}%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 shadow-sm transition-colors hover:bg-red-50 cursor-pointer"
                  title="Báo lỗi câu hỏi"
                  aria-label="Báo lỗi câu hỏi"
                >
                  <AlertTriangle className="h-4 w-4" />
                </button>
              </div>
            </div>

          <div className="flex items-start">
            <h3 className="max-w-[820px] font-fraunces text-xl font-black leading-[1.25] tracking-normal text-on-background sm:text-question-title-sm lg:text-question-title-lg">
              {currentQuestion.question}
            </h3>
          </div>

        {/* Question Type Rendering: Essay or MCQ */}
        {isEssayQuestion ? (
          /* ESSAY QUESTION LAYOUT */
          <div className="mt-4 grid gap-4 rounded-2xl border border-accent-orange/20 bg-white/85 p-4 shadow-sm">
            {(currentQuestion.sfia_level || currentQuestion.competency) && (
              <div className="flex flex-wrap gap-2 items-center">
                {currentQuestion.sfia_level && (
                  <span className="px-2 py-0.5 bg-accent-orange-light/25 border border-accent-orange/25 text-accent-orange-dark text-kicker-micro uppercase font-bold tracking-wider font-mono rounded">
                    {currentQuestion.sfia_level}
                  </span>
                )}
                {currentQuestion.competency && (
                  <span className="text-caption-tight text-stone-500 italic">
                    Năng lực: {currentQuestion.competency}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-caption-tight font-bold text-accent-orange-dark/65 uppercase tracking-wider font-mono">
                Bài làm tự luận ngắn của bạn:
              </label>
              <textarea
                disabled={isSubmitted}
                value={essayInput}
                onChange={(e) => setEssayInput(e.target.value)}
                placeholder="Trình bày giải pháp của bạn cho tình huống trên..."
                className="w-full min-h-[180px] resize-y p-3 text-xs md:text-sm text-stone-850 bg-warm-cream border border-stone-200 focus:border-tertiary-yellow focus:ring-1 focus:ring-tertiary-yellow/20 rounded-xl focus:outline-none transition-all leading-relaxed shadow-sm"
              />
            </div>

            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-1"
              >
                {/* Encouraging Feedback Text */}
                {feedbackCopy && (
                  currentHistory?.isCorrect === false ? (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setIsMobileSidebarOpen(true);
                        setIsSocraticOpen(true);
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-primary-blue/25 bg-primary-blue-light/70 p-2.5 text-xs font-semibold text-primary-blue-dark shadow-sm transition-all duration-200 hover:bg-primary-blue-light md:text-sm group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="animate-bounce text-sm">🦊</span>
                        <span className="italic">AI Tutor: &ldquo;{feedbackCopy}&rdquo;</span>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-1 text-caption-tight font-bold text-primary-blue-dark transition-transform group-hover:translate-x-0.5 md:text-xs">
                        <span>
                          {isSidebarTyping 
                            ? "Đang tìm slide gợi ý... 🔄" 
                            : "Học tiếp"}
                        </span>
                        {!isSidebarTyping && <ArrowRight className="w-3.5 h-3.5" />}
                      </div>
                    </motion.div>
                  ) : (
                    <p className="text-xs font-bold italic text-primary-green-dark">
                      🦊 AI Tutor: &ldquo;{feedbackCopy}&rdquo;
                    </p>
                  )
                )}

                <div className="space-y-2 rounded-xl border border-primary-blue/25 bg-primary-blue-light/60 p-4">
                  <div className="flex items-center gap-1 text-caption-tight font-bold uppercase tracking-wider text-primary-blue-dark font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-primary-blue" />
                    Đáp án tham chiếu đề xuất
                  </div>
                  {essayReferenceAnswer ? (
                    <p className="text-stone-800 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                      {essayReferenceAnswer}
                    </p>
                  ) : (
                    <p className="text-xs font-semibold italic leading-relaxed text-primary-blue-dark/70">
                      Câu hỏi này chưa có đáp án tham chiếu trong dữ liệu hiện tại. Vui lòng báo lỗi câu hỏi để đội học liệu bổ sung rubric.
                    </p>
                  )}
                </div>

                {/* Evaluation Checklist */}
                {currentQuestion.evaluation_points && currentQuestion.evaluation_points.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-stone-650 text-caption-tight font-bold uppercase tracking-wider font-mono">
                      <ListTodo className="w-3.5 h-3.5 text-accent-orange" />
                      Tự kiểm tra tiêu chí đạt được (Checklist):
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {currentQuestion.evaluation_points.map((point: string, idx: number) => {
                        const isChecked = currentHistory?.checkedPoints?.includes(point);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleToggleEvaluationPoint(point)}
                            className={`flex items-start text-left gap-2.5 p-2 rounded-lg border transition-all duration-100 cursor-pointer active:scale-[0.98] active:translate-y-[1px] ${
                              isChecked
                                ? 'bg-accent-orange-light/20 border-accent-orange/50 text-accent-orange-dark font-medium'
                                : 'bg-stone-50/50 border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <span className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border text-kicker-micro mt-0.5 ${
                              isChecked ? 'bg-accent-orange border-accent-orange text-white' : 'border-stone-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-label-tight leading-normal">{point}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </div>
        ) : (
          /* MCQ OPTIONS LAYOUT */
          <div className="space-y-3 sm:space-y-3.5">
            {/* MCQ Options with Staggered Framer Motion */}
            <motion.div
              data-quiz-tour-id="answer-options"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-2.5 pt-3 md:grid-cols-2 lg:gap-3"
            >
              {(Object.keys(currentQuestion.options!) as Array<'A' | 'B' | 'C' | 'D'>).map(key => {
                const optionText = currentQuestion.options![key];
                const isSelected = selectedOption === key;
                const isPendingSelected = pendingSelectedOption === key;
                const isAnswerCorrectKey = currentQuestion.answer === key;
                
                let buttonStyle = 'bg-warm-cream border-tertiary-yellow/30 text-stone-750 hover:bg-warm-cream-light hover:border-tertiary-yellow/60 shadow-sm';
                let badgeStyle = 'bg-tertiary-yellow/10 text-tertiary-yellow-dark border-tertiary-yellow/20';
                let indicatorIcon = null;

                if (!isSubmitted) {
                  if (isPendingSelected) {
                    buttonStyle = 'bg-primary-green-light/30 border-primary-green text-primary-green-dark font-bold ring-2 ring-primary-green/10 shadow-[0_8px_22px_rgba(88,204,2,0.12)]';
                    badgeStyle = 'bg-primary-green-light text-primary-green-dark border-primary-green/25';
                    indicatorIcon = <span className="ml-auto h-7 w-7 rounded-full border-4 border-primary-green/10 bg-primary-green/5" />;
                  }
                } else {
                  if (isSelected) {
                    if (currentQuestion.answer ? isAnswerCorrectKey : Boolean(currentHistory?.isCorrect)) {
                      buttonStyle = 'bg-primary-green-light/40 border-primary-green text-primary-green-dark font-semibold ring-1 ring-primary-green/20';
                      badgeStyle = 'bg-primary-green text-white border-primary-green';
                      indicatorIcon = <Check className="w-4 h-4 text-primary-green-dark ml-auto" />;
                    } else {
                      buttonStyle = 'bg-error-red-light/40 border-error-red text-error-red-dark font-semibold ring-1 ring-error-red/20';
                      badgeStyle = 'bg-error-red text-white border-error-red';
                      indicatorIcon = <X className="w-4 h-4 text-error-red-dark ml-auto" />;
                    }
                  } else {
                    if (isAnswerCorrectKey) {
                      buttonStyle = 'bg-primary-green-light/20 border-primary-green text-primary-green-dark font-medium';
                      badgeStyle = 'bg-primary-green text-white border-primary-green';
                      indicatorIcon = <Check className="w-4 h-4 text-primary-green-dark ml-auto" />;
                    } else {
                      buttonStyle = 'opacity-40 bg-stone-100/30 border-transparent text-stone-400 cursor-not-allowed';
                      badgeStyle = 'bg-stone-200/50 text-stone-500 border-transparent';
                    }
                  }
                }

                return (
                  <motion.div key={key} variants={itemVariants} className="space-y-2">
                    <button
                      disabled={isSubmitted || isSubmittingAnswer}
                      onClick={() => handlePickOption(key)}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-2xl border flex items-center gap-3 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                        isSubmitted ? 'min-h-[56px] sm:min-h-[60px]' : 'min-h-[64px] sm:min-h-[72px]'
                      } ${buttonStyle}`}
                    >
                      <span className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center font-mono text-body-dense border font-black transition-colors ${badgeStyle}`}>
                        {key}
                      </span>
                      <span className="flex-1 text-body-dense leading-relaxed md:text-sm">{optionText}</span>
                      {indicatorIcon}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
 
            {isSubmitted && currentQuestion.options && correctAnswerText && !isSocraticOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-primary-green/15 bg-primary-green-light/10 p-4 space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-primary-green-dark uppercase tracking-wide">
                  <MessageCircle className="w-4 h-4 text-primary-green" />
                  <span>Giải thích chi tiết</span>
                </div>
                
                <div className="rounded-lg border border-primary-green/15 bg-white p-3">
                  <span className="text-caption-tight font-black text-stone-500 uppercase tracking-wider font-mono">Đáp án đúng:</span>
                  <p className="mt-1.5 text-xs sm:text-sm font-black text-primary-green-dark leading-relaxed">
                    {correctAnswerText}
                  </p>
                </div>

                {explanationSummary ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-caption-tight font-bold text-stone-500 uppercase tracking-wider font-mono">Vì sao đúng?</span>
                    <p className="mt-1 text-xs text-stone-700 font-medium leading-relaxed whitespace-pre-line">
                      {explanationSummary}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">Không có giải thích tóm tắt cho câu hỏi này.</p>
                )}
              </motion.div>
            )}

            {adaptiveError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                {adaptiveError}
              </div>
            )}

            {/* Skip is available only after the learner has tried hints first. */}
            {!isSubmitted && canSkipAfterHints && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-center">
                <button
                  disabled={isSubmittingAnswer}
                  onClick={handleSkipAfterHints}
                  className="mt-0.5 cursor-pointer rounded-xl border border-dashed border-stone-300 bg-white px-3 py-1.5 text-label-tight font-semibold text-stone-500 shadow-sm transition-colors hover:border-primary-blue/40 hover:text-primary-blue-dark sm:px-4 sm:py-2 sm:text-xs"
                >
                  Bỏ qua & xem giải thích
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* AI Hint Deck */}
        {shouldShowHintPanel && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 8, x: '-50%' }}
            className="fixed bottom-[82px] left-1/2 z-[80] w-[calc(100vw-2rem)] max-w-[480px] rounded-2xl border-2 border-primary-blue/20 border-b-[5px] bg-white p-3 shadow-[0_22px_60px_rgba(11,120,176,0.16)] sm:bottom-[88px] sm:p-4 lg:hidden"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-caption-tight font-bold uppercase tracking-wider text-primary-blue-dark font-mono md:text-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary-blue" />
                <span>Gợi ý AI Tutor</span>
                <span className="rounded-full bg-primary-blue-light px-2 py-0.5 text-primary-blue-dark">
                  {selectedHintIndex + 1}/{unlockedHints.length}
                </span>
              </div>
              {unlockedHints.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedHintIndex === 0}
                    onClick={() => setActiveHintIndex(prev => Math.max(prev - 1, 0))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-primary-blue/25 bg-white/80 text-primary-blue-dark transition-colors hover:bg-primary-blue-light/60 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Xem gợi ý trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={selectedHintIndex >= unlockedHints.length - 1}
                    onClick={() => setActiveHintIndex(prev => Math.min(prev + 1, unlockedHints.length - 1))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-primary-blue/25 bg-white/80 text-primary-blue-dark transition-colors hover:bg-primary-blue-light/60 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Xem gợi ý tiếp theo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setHintPopoverQuestionId(null);
                }}
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-primary-blue/25 bg-primary-blue-light/60 text-primary-blue-dark transition-colors hover:bg-primary-blue-light sm:right-3 sm:top-3"
                title="Đóng gợi ý"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="custom-scrollbar mt-3 max-h-[38dvh] overflow-y-auto border-l-2 border-primary-blue/30 pl-2.5 pr-1 text-xs leading-relaxed text-stone-700 md:text-sm">
              <SocraticMarkdown text={selectedHint} />
            </div>
          </motion.div>
        )}

        {/* 7. Algorithmic Dev Mode details */}
        {quiz.devMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-stone-900/5 border border-stone-900/10 rounded-xl space-y-2 mt-4 text-caption-tight text-stone-600 font-mono"
          >
            <div className="font-extrabold uppercase text-stone-700 tracking-wider">
              📊 DEV MODE: Thông số thuật toán (Elo, MAB, BKT)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold text-stone-800">Concept ID:</span> {activeSetId}
              </div>
              <div>
                <span className="font-bold text-stone-800">Độ khó đề:</span> {activeSet?.difficulty || 'bình thường'}
              </div>
              <div>
                <span className="font-bold text-stone-800">Student Concept Elo:</span> {conceptMasteries[activeSetId]?.elo || 1200}
              </div>
              <div>
                <span className="font-bold text-stone-800">BKT Mastery Prob:</span> {conceptMasteries[activeSetId]?.bkt !== undefined ? (conceptMasteries[activeSetId].bkt * 100).toFixed(1) + '%' : '25.0%'}
              </div>
            </div>
            <div className="pt-1.5 border-t border-stone-200/50 leading-relaxed">
              <span className="font-bold text-stone-700">Nguồn cập nhật:</span><br />
              Adaptive backend trả về old/new Elo và old/new BKT sau mỗi lượt submit.
            </div>
          </motion.div>
        )}
        </div>
        </div>

        {isSocraticOpen && (
          <aside
            data-quiz-tour-id="sofi-panel"
            className="hidden min-h-0 overflow-hidden rounded-2xl border border-primary-green/15 border-b-[4px] bg-[#fbfff4] shadow-[0_12px_28px_rgba(70,163,2,0.08)] lg:flex lg:flex-col"
          >
            <div className="flex flex-col shrink-0 border-b border-primary-green/10 bg-white/95 px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                {/* Left: Avatar + Title */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <SofiExpressionAvatar expression="happy" size={26} />
                  <span className="text-xs font-black text-on-background leading-none">Trợ lý Sofi</span>
                </div>

                {/* Middle: Tab Pill Selector */}
                <div className="flex rounded-lg bg-stone-100 p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('hints')}
                    className={`rounded-md px-3 py-1 text-caption-tight font-black transition cursor-pointer ${
                      sidebarTab === 'hints'
                        ? 'bg-white text-primary-green-dark shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    Gợi ý
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('chat')}
                    className={`rounded-md px-3 py-1 text-caption-tight font-black transition cursor-pointer ${
                      sidebarTab === 'chat'
                        ? 'bg-white text-primary-green-dark shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    Hỏi đáp
                  </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsTutorExpanded(true)}
                    className="flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100 transition cursor-pointer"
                    title="Mở rộng"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSocraticOpen(false);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100 transition cursor-pointer"
                    title="Đóng"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white/95">
              {sidebarTab === 'hints' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3">
                  {!isSubmitted && (
                    <div className="pb-2.5 border-b border-stone-100 flex justify-center">
                      <button
                        type="button"
                        disabled={quizHintCount >= 3 || isLoggingHint}
                        onClick={handleRequestNextHint}
                        className="flex min-h-9 px-4 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#d89b00] bg-[#ffc800] text-xs font-black text-[#6f4c00] shadow-[0_2px_0_#d89b00] transition hover:brightness-105 active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoggingHint ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {isLoggingHint ? 'Đang ghi nhận' : quizHintCount >= 3 ? 'Đã mở hết gợi ý' : `Gợi ý từ AI ${quizHintCount}/3`}
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {[
                      {
                        title: 'Xác định yêu cầu câu hỏi.',
                        helper: 'Nhận diện câu đang hỏi kỹ thuật hay kết quả.',
                      },
                      {
                        title: 'Tìm từ khóa quan trọng.',
                        helper: 'Đối chiếu manh mối với từng đáp án.',
                      },
                      {
                        title: 'Loại đáp án gây nhiễu.',
                        helper: 'Chốt lựa chọn khớp trực tiếp nhất.',
                      },
                    ].map((hint, index) => {
                      const isUnlocked = index < quizHintCount;
                      const isActive = isUnlocked && selectedHintIndex === index && shouldShowHintPanel;

                      return (
                        <button
                          key={hint.title}
                          type="button"
                          disabled={!isUnlocked}
                          onClick={() => {
                            if (isActive) {
                              setHintPopoverQuestionId(null);
                            } else {
                              setActiveHintIndex(index);
                              setHintPopoverQuestionId(currentQuestion.id);
                            }
                          }}
                          className={`flex min-h-12 w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition duration-200 cursor-pointer active:scale-[0.98] ${
                            isActive
                              ? 'border-primary-green bg-white text-primary-green-dark ring-2 ring-primary-green/15 shadow-sm font-semibold'
                              : isUnlocked
                                ? 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-50'
                                : 'border-stone-100 bg-[#fafafa]/40 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          <span className={`grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full text-caption-tight font-black ${
                            isUnlocked ? 'bg-primary-green text-white' : 'bg-stone-200 text-stone-400'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-card-title-micro font-black leading-tight">{hint.title}</span>
                            <span className="block truncate text-badge-micro font-bold opacity-60 mt-0.5">{hint.helper}</span>
                          </div>
                          {isUnlocked ? (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary-green/70" />
                          ) : (
                            <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {shouldShowHintPanel && selectedHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="relative rounded-xl border border-primary-blue/20 bg-primary-blue-light/35 p-3 text-xs leading-relaxed text-stone-700 shadow-sm mt-3"
                      >
                        <button
                          type="button"
                          onClick={() => setHintPopoverQuestionId(null)}
                          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-md border border-primary-blue/25 bg-white text-primary-blue-dark transition hover:bg-primary-blue-light/60 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="pr-5 font-semibold">
                          <SocraticMarkdown text={selectedHint} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : isTutorExpanded ? (
                <div className="flex flex-1 items-center justify-center p-4 text-center text-label-tight font-bold leading-relaxed text-stone-500">
                  Sofi đang mở ở chế độ toàn màn hình. Hội thoại vẫn được giữ nguyên ở đây.
                </div>
              ) : (
                <SocraticChatBody
                  messages={sidebarMessages}
                  isTyping={isSidebarTyping}
                  scrollRef={sidebarEndRef}
                  inputValue={tutorInputValue}
                  setInputValue={setSidebarInputValue}
                  onSubmit={handleSubmitTutorMessage}
                  isMobile={false}
                  onZoom={setZoomedTutorImageUrl}
                  onReportCitation={() => showToast('Đã ghi nhận báo lỗi trích dẫn. Team học liệu sẽ kiểm tra lại nguồn này.')}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Sticky Action Footer Row */}
      <div className={`rounded-b-[20px] border-x border-b border-primary-green/10 bg-white px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-5 md:px-6 flex flex-col sm:flex-row gap-2 justify-between z-10 shrink-0 ${
        showEssayReviewPanel ? 'items-stretch' : 'items-center'
      }`}>
        <div className={`w-full min-w-0 ${showEssayReviewPanel ? 'sm:flex-1' : 'sm:w-auto'}`}>
          {showEssayReviewPanel ? (
            <div className="grid gap-2 rounded-2xl border border-primary-blue/20 bg-primary-blue-light/35 p-3 text-xs text-stone-700 shadow-sm lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2 font-black uppercase tracking-wider text-primary-blue-dark">
                  <Sparkles className="h-3.5 w-3.5" />
                  Đối chiếu đáp án
                </div>
                <p className="line-clamp-3 leading-relaxed">
                  {essayReferenceAnswer || 'Câu hỏi này chưa có đáp án tham chiếu. Hãy báo lỗi để đội học liệu bổ sung rubric.'}
                </p>
              </div>
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-black uppercase tracking-wider text-stone-650">Checklist tự chấm</span>
                  {essayEvaluationPoints.length > 0 && (
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-kicker-micro font-black text-primary-green-dark">
                      {checkedEssayPoints}/{essayEvaluationPoints.length}
                    </span>
                  )}
                </div>
                {essayEvaluationPoints.length > 0 ? (
                  <div className="flex max-h-24 flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
                    {essayEvaluationPoints.map((point: string, idx: number) => {
                      const isChecked = currentHistory?.checkedPoints?.includes(point);
                      return (
                        <button
                          key={`${point}-${idx}`}
                          type="button"
                          onClick={() => handleToggleEvaluationPoint(point)}
                          className={`flex min-h-8 items-start gap-2 rounded-lg border px-2 py-1.5 text-left text-caption-tight font-semibold transition active:translate-y-[1px] cursor-pointer ${
                            isChecked
                              ? 'border-accent-orange/50 bg-white text-accent-orange-dark'
                              : 'border-stone-200 bg-white/70 text-stone-600 hover:bg-white'
                          }`}
                        >
                          <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
                            isChecked ? 'border-accent-orange bg-accent-orange text-white' : 'border-stone-300 bg-white'
                          }`}>
                            {isChecked ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                          </span>
                          <span>{point}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-caption-tight font-semibold italic text-stone-500">Chưa có checklist rubric cho câu này.</p>
                )}
              </div>
            </div>
          ) : quizViewState === 'mcq-selected' ? (
            <div className="flex items-center gap-2">
              <SofiExpressionAvatar expression="thinking" size={32} />
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-650 shadow-sm">
                Bạn chọn rồi - kiểm tra đáp án nhé!
              </div>
            </div>
          ) : isEssayQuestion ? (
            <div className="flex items-center gap-2">
              <SofiExpressionAvatar expression="thinking" size={32} />
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-650 shadow-sm">
                {isSubmitted ? 'Đối chiếu đáp án rồi tự chấm mức đạt.' : 'Nhập câu trả lời tự luận ngắn.'}
              </div>
            </div>
          ) : (
            <span className="hidden sm:block" aria-hidden="true" />
          )}
        </div>

        <div data-quiz-tour-id="answer-actions" className="w-full sm:w-auto flex flex-wrap gap-2 justify-end">
          {!isSubmitted && (
            <button
              data-quiz-tour-id="hint-button"
              type="button"
              disabled={isLoggingHint}
              onClick={() => {
                if (isSocraticOpen) {
                  setIsSocraticOpen(false);
                  setIsMobileSidebarOpen(false);
                  return;
                }
                handleRequestNextHint();
                setIsMobileSidebarOpen(true);
              }}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d89b00] bg-[#ffc800] px-3.5 py-1.5 text-xs font-extrabold text-[#6f4c00] shadow-[0_2px_0_#d89b00] transition hover:brightness-105 active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer w-full sm:w-auto sm:flex-none"
            >
              <SofiExpressionAvatar expression="happy" size={24} />
              <span>{isLoggingHint ? 'Đang ghi nhận' : quizHintCount > 0 ? `Gợi ý Sofi ${quizHintCount}/3` : 'Gợi ý Sofi'}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-[#6f4c00]/70 transition-transform duration-200 ${isSocraticOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

          {isEssayQuestion && !isSubmitted && (
            <button
              type="button"
              disabled={!essayInput.trim()}
              onClick={handleSubmitEssay}
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-black uppercase shadow-sm transition w-full sm:w-auto sm:flex-none ${
                essayInput.trim()
                  ? 'cursor-pointer border border-accent-orange bg-accent-orange text-white hover:bg-accent-orange-dark active:translate-y-[1px]'
                  : 'cursor-not-allowed border border-stone-200 bg-stone-50 text-stone-400'
              }`}
            >
              <span>Nộp bài</span>
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          )}

          {isEssayQuestion && isSubmitted && !isEssayCompleted && (
            <>
              <button
                type="button"
                onClick={() => handleGradeEssay(true, quizHintCount)}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-500 bg-emerald-500 px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm transition hover:bg-emerald-600 active:translate-y-[1px] w-full sm:w-auto sm:flex-none cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Đạt</span>
              </button>
              <button
                type="button"
                onClick={() => handleGradeEssay(false, quizHintCount)}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-500 bg-rose-500 px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm transition hover:bg-rose-600 active:translate-y-[1px] w-full sm:w-auto sm:flex-none cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Chưa đạt</span>
              </button>
            </>
          )}

          {isSubmitted && (correctAnswerText || isEssayQuestion) && (
            <button
              type="button"
              onClick={handleAskTutorAboutCurrentAnswer}
              className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary-green/20 bg-primary-green-light/45 px-3 py-1.5 text-xs font-black uppercase text-primary-green-dark shadow-sm transition hover:bg-primary-green-light/70 active:translate-y-[1px] sm:flex-none cursor-pointer"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{isEssayQuestion ? 'Hỏi Sofi đối chiếu' : 'Hỏi Sofi giải thích'}</span>
            </button>
          )}

          {quizViewState === 'mcq-selected' && (
            <button
              type="button"
              disabled={!pendingSelectedOption || isSubmittingAnswer}
              onClick={handleCheckPendingOption}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-primary-green-dark bg-primary-green px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm transition hover:brightness-105 active:translate-y-[1px] w-full sm:w-auto sm:flex-none cursor-pointer"
            >
              <span>{isSubmittingAnswer ? 'Đang kiểm tra...' : 'Kiểm tra đáp án'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Next Button */}
          {isSubmitted && isEssayCompleted && (
            <button
              onClick={() => {
                setIsTutorExpanded(false);
                handleNextQuestion();
              }}
              disabled={isLoadingNextQuestion}
              className="order-first flex min-h-10 w-full cursor-pointer animate-in items-center justify-center gap-1.5 rounded-xl border border-primary-green-dark bg-primary-green px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm transition duration-200 hover:brightness-105 active:translate-y-[1px] zoom-in-95 disabled:cursor-wait disabled:opacity-75 sm:order-none sm:w-auto sm:flex-none"
            >
              {isLoadingNextQuestion ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>
                {isLoadingNextQuestion
                  ? 'Đang lấy câu tiếp...'
                  : currentQuestionIdx === totalQuestions - 1
                    ? 'Xem kết quả'
                    : `Tiếp tục câu ${currentQuestionIdx + 2}`}
              </span>
            </button>
          )}

          {/* Back button */}
          {currentQuestionIdx > 0 && (
            <button
              onClick={() => {
                setIsTutorExpanded(false);
                setCurrentQuestionIdx(currentQuestionIdx - 1);
              }}
              className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-label-tight font-semibold text-stone-700 transition-all hover:bg-stone-100 cursor-pointer sm:text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Lùi lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Modal Overlay */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-stone-200 rounded-2xl w-full max-w-md p-5 shadow-2xl relative flex flex-col gap-4 font-be-vietnam-pro"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h4 className="text-sm font-extrabold text-stone-850 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Báo cáo lỗi câu hỏi Quiz
                </h4>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Question Context */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex flex-col gap-1">
                <span className="text-caption-tight font-bold text-stone-400 uppercase tracking-wider font-mono">Nội dung câu hỏi:</span>
                <p className="text-xs text-stone-700 font-medium line-clamp-2 leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Form fields */}
              <div className="flex flex-col gap-3">
                {/* Error Type Selector */}
                <div className="flex flex-col gap-1">
                  <span className="text-caption-tight font-bold text-stone-500 uppercase tracking-wider font-mono">Loại lỗi phát hiện:</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      'Sai kiến thức chuyên môn',
                      'Đáp án bị cấu hình sai',
                      'Giải thích chưa chuẩn xác',
                      'Lỗi khác'
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setReportErrorType(type)}
                        className={`p-2.5 rounded-xl border text-label-tight font-bold text-left cursor-pointer transition-all ${
                          reportErrorType === type
                            ? 'bg-red-50 border-red-500 text-red-755 font-extrabold'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description details */}
                <div className="flex flex-col gap-1">
                  <span className="text-caption-tight font-bold text-stone-500 uppercase tracking-wider font-mono">Mô tả chi tiết lỗi kiến thức:</span>
                  <textarea
                    value={reportDetail}
                    onChange={(e) => setReportDetail(e.target.value)}
                    placeholder="Mô tả cụ thể lỗi kiến thức hoặc sai sót bạn phát hiện..."
                    className="w-full min-h-[90px] p-2.5 text-xs text-stone-855 bg-stone-50 border border-stone-200 focus:border-red-400 focus:ring-1 focus:ring-red-400/20 rounded-xl focus:outline-none transition-all leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t border-stone-100 mt-1">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!reportDetail.trim() || isSubmittingReport}
                  onClick={handleSubmitReport}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    reportDetail.trim() && !isSubmittingReport
                      ? 'bg-red-500 hover:bg-red-650 text-white shadow-md shadow-red-500/10 active:scale-95'
                      : 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Explanation Modal Overlay removed, merged into expanded Socratic AI chat */}

      <AnimatePresence>
        {zoomedTutorImageUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedTutorImageUrl(null)}
              className="fixed inset-0 z-[9999] bg-stone-950/85"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 z-[10000] flex pointer-events-none items-center justify-center md:inset-10"
            >
              <div className="relative flex max-h-[85vh] max-w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-stone-100 bg-white p-2 shadow-2xl pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setZoomedTutorImageUrl(null)}
                  className="absolute right-3 top-3 z-10 rounded-full bg-stone-900/80 p-2 text-white shadow-md transition-colors hover:bg-stone-900"
                  title="Đóng xem lớn"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomedTutorImageUrl}
                  alt="Slide bài học bổ trợ"
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTutorExpanded && isSocraticOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.58 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTutorExpanded(false)}
              className="fixed inset-0 z-[9990] bg-stone-950"
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-3 z-[9991] flex flex-col overflow-hidden rounded-2xl border border-primary-green/20 bg-[#fbfff4] shadow-2xl md:inset-8"
            >
              <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-primary-green/10 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <SofiExpressionAvatar expression="happy" size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-on-background">Sofi giải thích</p>
                    <p className="text-caption-tight font-bold uppercase tracking-wide text-stone-400">
                      Hội thoại được giữ nguyên khi thu nhỏ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTutorExpanded(false)}
                  className="flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 text-label-tight font-black text-stone-650 transition hover:bg-stone-100"
                  aria-label="Thu nhỏ khung Sofi giải thích"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                  Thu nhỏ
                </button>
              </div>
              <SocraticChatBody
                messages={sidebarMessages}
                isTyping={isSidebarTyping}
                scrollRef={sidebarEndRef}
                inputValue={tutorInputValue}
                setInputValue={setSidebarInputValue}
                onSubmit={handleSubmitTutorMessage}
                isMobile={false}
                onZoom={setZoomedTutorImageUrl}
                onReportCitation={() => showToast('Đã ghi nhận báo lỗi trích dẫn. Team học liệu sẽ kiểm tra lại nguồn này.')}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-stone-850 text-xs font-bold font-be-vietnam-pro"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
  );
}
