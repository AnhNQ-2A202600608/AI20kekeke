import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle2, XCircle, Award, ArrowRight } from 'lucide-react';
import { MascotLoadingBlock } from '@/components/mascot';
import { useBoundStore } from '@/hooks/useBoundStore';
import {
  DEFAULT_ADAPTIVE_COURSE_ID,
  recommendAdaptiveQuestion,
  submitAdaptiveAnswer,
  type AdaptiveRecommendation,
  type AdaptiveSubmitResult,
} from '@/lib/adaptive/api-client';
import { ADAPTIVE_CONCEPT_ID_BY_SET_ID, isUsableAdaptiveConceptId } from '@/lib/adaptive/concept-map';
import { buildMcqStudentAnswer } from '@/lib/adaptive/quiz-question';

type ResolvedAdaptiveRecommendation = AdaptiveRecommendation & {
  concept_id: string;
};

interface ZpdWidgetProps {
  onViewLearningPath?: () => void;
}

export default function ZpdWidget({ onViewLearningPath }: ZpdWidgetProps) {
  const { addXp, loggedIn, userId, token, setToken, conceptMasteries } = useBoundStore();
  const [recommendation, setRecommendation] = useState<ResolvedAdaptiveRecommendation | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<AdaptiveSubmitResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  const fetchRecommendation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedOption(null);
    setSubmitResult(null);
    try {
      if (!loggedIn || !userId || !token) {
        setError('Bạn cần đăng nhập lại để nhận thử thách ZPD.');
        setRecommendation(null);
        return;
      }
      const weakestConcept = Object.values(conceptMasteries || {})
        .filter((mastery) => mastery.conceptId)
        .sort((a, b) => {
          if (a.weaknessFlag !== b.weaknessFlag) return a.weaknessFlag ? -1 : 1;
          return a.bkt - b.bkt;
        })[0];
      const candidateConceptIds = Array.from(new Set([
        weakestConcept?.conceptId,
        ...Object.values(ADAPTIVE_CONCEPT_ID_BY_SET_ID),
      ].filter(isUsableAdaptiveConceptId)));

      let data: AdaptiveRecommendation | null = null;
      let targetConceptId = candidateConceptIds[0];
      let lastError: unknown = null;

      for (const conceptId of candidateConceptIds) {
        try {
          data = await recommendAdaptiveQuestion({
            token,
            setToken,
            studentId: userId,
            courseId: DEFAULT_ADAPTIVE_COURSE_ID,
            conceptId,
          });
          targetConceptId = conceptId;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!data) {
        throw lastError || new Error('No adaptive recommendation available');
      }

      if (data && data.question_id) {
        setRecommendation({ ...data, concept_id: targetConceptId });
        setQuestionStartTime(Date.now());
      } else {
        setRecommendation(null);
      }
    } catch (err) {
      console.error('Error fetching ZPD recommendation:', err);
      setError('Could not load recommendation');
      setRecommendation(null);
    } finally {
      setIsLoading(false);
    }
  }, [loggedIn, userId, token, setToken, conceptMasteries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendation();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRecommendation]);

  const handleSubmit = async () => {
    if (!selectedOption || !recommendation || isSubmitting) return;

    setIsSubmitting(true);
    const responseTimeMs = questionStartTime ? Date.now() - questionStartTime : 0;
    try {
      if (!loggedIn || !userId || !token) {
        setError('Bạn cần đăng nhập lại để gửi câu trả lời ZPD.');
        return;
      }
      const data = await submitAdaptiveAnswer({
        token,
        setToken,
        studentId: userId,
        courseId: DEFAULT_ADAPTIVE_COURSE_ID,
        conceptId: recommendation.concept_id,
        questionId: recommendation.question_id,
        decisionId: recommendation.decision_id,
        studentAnswer: buildMcqStudentAnswer(selectedOption),
        responseTimeMs,
      });

      setSubmitResult(data);
      if (data.is_correct) {
        addXp(15);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <MascotLoadingBlock
        title="Sofi đang chọn câu hỏi ZPD..."
        description="Đang tìm câu vừa sức nhất cho bạn"
        className="min-h-[13rem]"
        mascotClassName="scale-[0.78]"
      />
    );
  }

  // 2. Empty or unavailable state
  if (error || !recommendation) {
    const title = error ? 'Chưa tải được thử thách ZPD' : 'Chưa có thử thách ZPD mới';
    const description = error
      ? error
      : 'Hiện chưa có gợi ý thích ứng phù hợp. Hãy tiếp tục rèn luyện thêm tại Lộ trình học nhé.';

    return (
      <div className="rounded-2xl border border-gray-border bg-surface-container-low p-5 shadow-sm space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-green/10 border border-primary-green/20 rounded-full flex items-center justify-center text-primary-green-dark">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-on-background uppercase tracking-wider">
            {title}
          </h4>
          <p className="text-caption-tight text-stone-600 leading-relaxed font-be-vietnam-pro">
            {description}
          </p>
        </div>
        <button
          onClick={onViewLearningPath}
          className="btn-3d btn-green w-full text-caption-tight py-2.5 font-bold tracking-wider uppercase cursor-pointer"
        >
          <span>Xem Lộ Trình</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    );
  }

  // 3. Active Recommendation Quiz Card
  const expectedSuccessPercent = Math.round(recommendation.expected_success * 100);

  return (
    <div className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4 text-left">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-green/15 text-primary-green-dark border border-primary-green/25 text-kicker-micro font-bold uppercase tracking-wider font-mono">
          <Sparkles className="h-3 w-3 text-primary-green animate-pulse" />
          Thử thách ZPD Hàng Ngày
        </div>
        <span className="text-kicker-micro bg-tertiary-yellow/10 border border-tertiary-yellow/20 text-tertiary-yellow-dark font-extrabold px-1.5 py-0.5 rounded">
          {expectedSuccessPercent}% Cơ Hội Thành Công
        </span>
      </div>

      {/* Question Prompt */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-on-background leading-normal font-fraunces">
          {recommendation.prompt}
        </h4>
      </div>

      {/* Answer Options */}
      {!submitResult ? (
        <div className="space-y-2 pt-1">
          {Object.entries(recommendation.options || {}).map(([key, value]) => {
            const isSelected = selectedOption === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedOption(key)}
                className={`w-full text-left p-3 rounded-xl border text-label-tight font-bold transition-all duration-150 flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-primary-green bg-primary-green/5 text-primary-green-dark'
                    : 'border-gray-border bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span>{key}. {value}</span>
                {isSelected && <span className="text-kicker-micro font-black text-primary-green-dark">CHỌN</span>}
              </button>
            );
          })}

          <button
            onClick={handleSubmit}
            disabled={!selectedOption || isSubmitting}
            className={`btn-3d btn-green w-full text-caption-tight py-2.5 font-bold tracking-wider uppercase cursor-pointer mt-2 ${
              !selectedOption || isSubmitting ? 'btn-disabled' : ''
            }`}
          >
            {isSubmitting ? 'Đang gửi...' : 'Nộp Bài'}
          </button>
        </div>
      ) : (
        // Feedback State
        <div className="space-y-4 pt-1 animate-in fade-in duration-300">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            submitResult.is_correct
              ? 'bg-primary-green/5 border-primary-green/20 text-primary-green-dark'
              : 'bg-error-red/5 border-error-red/20 text-error-red-dark'
          }`}>
            {submitResult.is_correct ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h5 className="text-label-tight font-extrabold uppercase tracking-wide">
                {submitResult.is_correct ? 'Hoàn toàn chính xác!' : 'Chưa chính xác rồi!'}
              </h5>
              <p className="text-caption-tight leading-relaxed text-stone-600 font-medium">
                {submitResult.is_correct
                  ? 'Tuyệt vời! Bạn đã vượt qua câu hỏi thích ứng này một cách xuất sắc.'
                  : 'Đừng nản chí! Sai sót là cơ hội để học hỏi. Hãy thử lại xem sao nhé.'}
              </p>
            </div>
          </div>

          {/* ELO & XP Progression */}
          <div className="grid grid-cols-2 gap-3 bg-stone-50 border border-gray-border p-3 rounded-xl font-mono text-caption-tight">
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-500 font-bold uppercase">Thay đổi ELO</span>
              <span className="font-extrabold text-on-background flex items-center gap-1">
                {submitResult.old_elo} → {submitResult.new_elo}
                <span className={`text-kicker-micro font-black ${submitResult.is_correct ? 'text-primary-green-dark' : 'text-error-red-dark'}`}>
                  ({submitResult.is_correct ? `+${submitResult.new_elo - submitResult.old_elo}` : `${submitResult.new_elo - submitResult.old_elo}`})
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-500 font-bold uppercase">Điểm nhận được</span>
              <span className="font-extrabold text-primary-green-dark flex items-center gap-1">
                {submitResult.is_correct ? '+15 XP' : '0 XP'}
                <Award className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <button
            onClick={fetchRecommendation}
            className="btn-3d btn-green w-full text-caption-tight py-2.5 font-bold tracking-wider uppercase cursor-pointer"
          >
            <span>Tiếp Tục Luyện Tập</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
