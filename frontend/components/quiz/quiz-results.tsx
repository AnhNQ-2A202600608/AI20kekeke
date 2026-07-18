'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Share2,
  Award,
  Star,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  X
} from 'lucide-react';
import { useQuizSession } from '../../app/hooks/useQuizSession';
import { useSurveyHandlers } from '../../app/hooks/useSurveyHandlers';
import { useBoundStore } from '@/hooks/useBoundStore';
import { getAggregateLearningEloDetails } from '@/lib/adaptive/elo';

interface QuizResultsProps {
  quiz: ReturnType<typeof useQuizSession>;
  surveys: ReturnType<typeof useSurveyHandlers>;
}

export function QuizResults({ quiz, surveys }: QuizResultsProps) {
  const { conceptMasteries } = useBoundStore();

  const {
    activeSetId,
    activeSet,
    totalQuestions,
    handleRestart,
    handleExitQuiz,
    getActiveSetCorrectCount,
    getIncorrectQuestions,
    answersHistory,
    activePracticeSession,
    devMode
  } = quiz;

  const {
    copiedShareLink,
    handleCopyShareLink,
    postQuizSubmitted,
    postRatings,
    postQuizComments,
    setPostRatings,
    setPostQuizComments,
    handlePostQuizSubmit
  } = surveys;

  const aggregateEloInfo = useMemo(() => {
    const aggregateDetails = getAggregateLearningEloDetails(conceptMasteries);
    const oldElo = activePracticeSession?.startAggregateElo ?? aggregateDetails.elo;
    return {
      oldElo: Math.round(oldElo),
      newElo: aggregateDetails.elo,
      delta: Math.round((aggregateDetails.elo - oldElo) * 10) / 10,
      conceptCount: aggregateDetails.conceptCount
    };
  }, [conceptMasteries, activePracticeSession?.startAggregateElo]);

  const correctCount = getActiveSetCorrectCount();
  const incorrectQuestions = getIncorrectQuestions();

  return (
    <motion.div
      key="result-dashboard"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex h-full min-h-0 flex-grow flex-col overflow-hidden rounded-2xl border-2 border-primary-green/15 border-b-[5px] bg-white p-5 shadow-sm font-be-vietnam-pro md:p-6"
    >
      <button
        onClick={handleExitQuiz}
        className="absolute left-4 top-4 z-10 flex cursor-pointer items-center justify-center rounded-lg border border-gray-border bg-white p-2 text-stone-500 shadow-sm transition-colors hover:bg-surface-container-low hover:text-on-background"
        title="Quay lại lộ trình"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => handleCopyShareLink('results')}
        className="absolute right-4 top-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary-green/20 bg-white p-2 text-label-tight font-semibold text-primary-green-dark shadow-sm transition-colors hover:bg-primary-green/10"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>{copiedShareLink ? 'Đã copy' : 'Chia sẻ'}</span>
      </button>

      <div className="flex-grow flex flex-col justify-start space-y-6 py-4 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary-green/15 border-b-[5px] bg-primary-green/10 shadow-sm">
            <Award className="h-8 w-8 animate-pulse text-primary-green-dark" />
          </div>
          <div>
            <h2 className="font-fraunces text-xl font-black tracking-tight text-on-background md:text-2xl">Ghi Nhận Tiến Độ</h2>
            <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">
              Bạn đã học xong bộ đề <span className="font-bold text-primary-green-dark">{activeSet?.title}</span>! +XP đã được ghi nhận.
            </p>
          </div>
        </div>

        {/* Stats and ELO Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto w-full">
          <div className="flex flex-col items-center justify-center rounded-xl border border-primary-green/15 bg-primary-green/5 p-4 text-center">
            <span className="mb-1 text-caption-tight font-bold uppercase tracking-wider text-primary-green-dark/70">Điểm số</span>
            <span className="text-2xl font-black tracking-tight text-primary-green-dark">
              {correctCount} / {totalQuestions}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-primary-blue/20 bg-primary-blue-light/60 p-4 text-center">
            <span className="mb-1 text-caption-tight font-bold uppercase tracking-wider text-primary-blue-dark/70">Độ chính xác</span>
            <span className="text-2xl font-black text-tertiary-yellow-dark tracking-tight">
              {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
            </span>
          </div>

          {/* 8. Aggregate Elo compact badge */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-tertiary-yellow/30 bg-tertiary-yellow/10 p-4 text-center">
            <span className="mb-1 text-caption-tight font-bold uppercase tracking-wider text-tertiary-yellow-dark/70">Elo tổng</span>
            <span className="text-sm font-black text-stone-800 tracking-tight mt-1">
              {aggregateEloInfo.oldElo} → {aggregateEloInfo.newElo}
            </span>
            <span className={`text-caption-tight font-bold mt-0.5 ${aggregateEloInfo.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ({aggregateEloInfo.delta >= 0 ? '+' : ''}{aggregateEloInfo.delta})
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut', delay: 0.08 }}
          className="mx-auto w-full max-w-xl rounded-xl border border-primary-blue/20 bg-primary-blue-light/50 p-4 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-caption-tight font-black uppercase tracking-wider text-primary-blue-dark/70">Tính lại Elo tổng</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-stone-600">
                Concept trong bài đã được cập nhật theo từng câu. Sau khi hoàn thành, Elo tổng lấy trung bình các concept đã luyện để phản ánh tiến độ toàn khóa.
              </p>
            </div>
            <motion.div
              key={`${aggregateEloInfo.oldElo}-${aggregateEloInfo.newElo}`}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="shrink-0 rounded-lg border border-white/70 bg-white px-3 py-2 text-right shadow-sm"
            >
              <p className="font-mono text-sm font-black text-on-background">{aggregateEloInfo.newElo}</p>
              <p className={`font-mono text-caption-tight font-black ${aggregateEloInfo.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {aggregateEloInfo.delta >= 0 ? '+' : ''}{aggregateEloInfo.delta}
              </p>
            </motion.div>
          </div>
          <p className="mt-2 text-caption-tight font-bold text-stone-500">
            Công thức: Elo tổng = trung bình Elo của {aggregateEloInfo.conceptCount || 0} concept đã luyện.
          </p>
        </motion.div>

        {/* Feedback Survey */}
        <div className="mx-auto w-full max-w-xl space-y-4 rounded-xl border border-primary-green/15 bg-primary-green/5 p-5 text-left">
          <div className="flex items-center gap-1.5 border-b border-primary-green/10 pb-2">
            <Star className="w-4 h-4 fill-tertiary-yellow text-tertiary-yellow-dark" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-green-dark font-mono">
              Khảo Sát Đánh Giá Đề Bài
            </h3>
          </div>

          {!postQuizSubmitted[activeSetId] ? (
            <div className="space-y-4">
              {/* Survey Questions */}
              {[
                { key: 'understanding', label: '1. Bạn hiểu nội dung đề này ở mức độ nào?' },
                { key: 'utility', label: '2. Quy trình làm bài trắc nghiệm hữu ích thế nào?' },
                { key: 'personalized', label: '3. Bạn muốn học các câu hỏi cá nhân hóa tiếp theo?' }
              ].map((q) => {
                const val = (postRatings[activeSetId] as any)?.[q.key] || 0;
                return (
                  <div key={q.key} className="space-y-1.5">
                    <label className="text-label-tight font-semibold text-stone-850 block">{q.label}</label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 rounded-lg border border-primary-green/15 bg-white p-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setPostRatings(prev => ({
                              ...prev,
                              [activeSetId]: {
                                ...(prev[activeSetId] || { understanding: 0, utility: 0, personalized: 0 }),
                                [q.key]: star
                              }
                            }))}
                            className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 transition-colors ${
                              star <= val ? 'fill-tertiary-yellow text-tertiary-yellow' : 'text-stone-300'
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Qualitative Comment */}
              <div className="space-y-1.5">
                <label className="text-label-tight font-semibold text-stone-850 block">Góp ý cải thiện (không bắt buộc):</label>
                <textarea
                  value={postQuizComments[activeSetId] || ''}
                  onChange={(e) => setPostQuizComments(prev => ({ ...prev, [activeSetId]: e.target.value }))}
                  placeholder="Nhập cảm nhận của bạn để tụi mình cải tiến đề tốt hơn..."
                  className="min-h-[60px] w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-green/25"
                />
              </div>

              <button
                disabled={
                  !(
                    postRatings[activeSetId]?.understanding > 0 &&
                    postRatings[activeSetId]?.utility > 0 &&
                    postRatings[activeSetId]?.personalized > 0
                  )
                }
                onClick={handlePostQuizSubmit}
                className="cursor-pointer rounded-xl border border-primary-green-dark bg-primary-green px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-105 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
              >
                Gửi khảo sát phản hồi
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 rounded-lg text-center text-xs font-semibold leading-relaxed animate-in fade-in">
              Cực kỳ cảm ơn những đóng góp hữu ích của bạn để cải tiến chất lượng học thuật và lộ trình! 🌟
            </div>
          )}
        </div>

        {/* Incorrect Questions Listing */}
        <div className="space-y-3 text-left max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 border-b border-primary-blue/15 pb-2 text-xs font-bold uppercase tracking-wider text-primary-blue-dark/70">
            <AlertTriangle className="w-4 h-4 text-primary-blue" />
            Câu hỏi cần ôn tập thêm ({incorrectQuestions.length})
          </div>

          {incorrectQuestions.length > 0 ? (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {incorrectQuestions.map((q: any) => {
                const history = answersHistory[activeSetId]?.[q.id];
                const wrongChoice = history?.selected;
                const hasMcqOptions = Boolean(
                  q.options &&
                  Object.values(q.options).some((option) => typeof option === 'string' && option.trim().length > 0)
                );
                const isEssay = q.type === 'short_answer' || !hasMcqOptions || q.expected_answer;
                
                return (
                  <div key={q.id} className="space-y-2 rounded-xl border border-primary-blue/15 bg-primary-blue-light/45 p-3.5 text-xs">
                    <p className="font-bold text-stone-850 leading-relaxed">#{q.id} {"->"} {q.question}</p>
                    
                    {isEssay ? (
                      <div className="space-y-1.5 pl-2">
                        <p className="text-caption-tight text-stone-500">Bài làm của bạn: <span className="italic">&quot;{history?.essayAnswer}&quot;</span></p>
                        <p className="text-caption-tight text-emerald-800 font-semibold font-mono">Đáp án mẫu: {q.expected_answer}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <span className="text-caption-tight text-rose-800 bg-rose-50 border border-rose-100 rounded px-2 py-0.5">Lựa chọn: {wrongChoice === 'unknown' ? 'Chưa biết' : wrongChoice}</span>
                        {q.answer && (
                          <span className="text-caption-tight text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">Đáp án đúng: {q.answer}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center text-stone-500 text-xs">
              Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi.
            </div>
          )}
        </div>

        {/* 7. Algorithmic Dev Mode details */}
        {devMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-stone-900/5 border border-stone-900/10 rounded-xl space-y-2 max-w-xl mx-auto w-full text-caption-tight text-stone-600 font-mono"
          >
            <div className="font-extrabold uppercase text-stone-700 tracking-wider">
              📊 DEV MODE: Thuật toán và Chỉ số tổng kết
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold text-stone-800">Concept ID:</span> {activeSetId}
              </div>
              <div>
                <span className="font-bold text-stone-800">Độ khó đề:</span> {activeSet?.difficulty || 'bình thường'}
              </div>
              <div>
                <span className="font-bold text-stone-800">Elo cuối:</span> {conceptMasteries[activeSetId]?.elo || 1200}
              </div>
              <div>
                <span className="font-bold text-stone-800">BKT Mastery Prob:</span> {conceptMasteries[activeSetId]?.bkt !== undefined ? (conceptMasteries[activeSetId].bkt * 100).toFixed(1) + '%' : '25.0%'}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Row */}
      <div className="flex shrink-0 justify-center gap-3 border-t border-primary-green/10 pt-4">
        <button
          onClick={handleRestart}
          className="px-5 py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm lại đề</span>
        </button>

        <button
          onClick={handleExitQuiz}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary-green-dark bg-primary-green px-6 py-2.5 text-xs font-black uppercase text-white shadow-sm transition hover:brightness-105 active:translate-y-[1px]"
        >
          <span>Quay lại lộ trình</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
