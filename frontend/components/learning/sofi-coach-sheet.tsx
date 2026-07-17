'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BookOpen, Brain, MessageSquare, Sparkles, Target, X } from 'lucide-react';
import { SofiStateMascot } from '@/components/mascot';
import { cn } from '@/lib/utils';

export type SofiCoachConceptState = 'mastered' | 'learning' | 'weak' | 'not-started' | 'empty';

export interface SofiCoachContext {
  conceptId?: string;
  conceptTitle: string;
  conceptDescription?: string;
  conceptState?: SofiCoachConceptState;
  dayTitle?: string;
  dayNumber?: number;
  dayLabel?: string;
  progressPercent?: number;
}

interface SofiCoachSheetProps {
  isOpen: boolean;
  context: SofiCoachContext | null;
  onClose: () => void;
  onAskAi?: (context: SofiCoachContext) => void;
  className?: string;
}

type SofiCoachView = 'overview' | 'explain' | 'example';

const stateBadgeCopy: Record<SofiCoachConceptState, { label: string; className: string }> = {
  mastered: {
    label: 'Ổn định',
    className: 'border-tertiary-yellow-dark bg-tertiary-yellow text-stone-950',
  },
  learning: {
    label: 'Đang học',
    className: 'border-primary-green-dark bg-primary-green text-white',
  },
  weak: {
    label: 'Cần vá',
    className: 'border-error-red-dark bg-error-red text-white',
  },
  'not-started': {
    label: 'Chưa học',
    className: 'border-gray-border-dark bg-white text-stone-500',
  },
  empty: {
    label: 'Sắp mở',
    className: 'border-gray-border-dark bg-stone-100 text-stone-400',
  },
};

const normalizeSentence = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const matchesConcept = (context: SofiCoachContext | null, patterns: string[]) => {
  const haystack = `${context?.conceptTitle || ''} ${context?.conceptDescription || ''}`.toLowerCase();
  return patterns.some((pattern) => haystack.includes(pattern));
};

const getOverviewCopy = (context: SofiCoachContext | null) => {
  if (!context) {
    return {
      eyebrow: 'Coach sẵn sàng',
      body: 'Chọn một concept đang học, rồi mở Sofi để nhận gợi ý ngắn trước khi vào bài luyện.',
      footnote: 'Sofi không mở chat giả lập ở đây. Nút Hỏi AI chỉ chuyển sang luồng chat có sẵn.',
    };
  }

  if (matchesConcept(context, ['tokenization', 'tokenize', 'token'])) {
    return {
      eyebrow: 'Điểm neo hôm nay',
      body: 'Tokenization là cách text được chia thành mảnh trước khi vào LLM.',
      footnote: 'Hiểu mảnh đầu vào sẽ giúp em đọc prompt, giới hạn ngữ cảnh, và lỗi cắt câu rõ hơn.',
    };
  }

  if (context.conceptState === 'weak') {
    return {
      eyebrow: 'Ôn lại nhẹ thôi',
      body: `Phần ${context.conceptTitle} đang hơi lỏng. Mình sẽ giúp em chốt lại ý chính, dấu hiệu nhận biết, rồi mới vào luyện tập.`,
      footnote: 'Không cần học lại cả chương. Chỉ cần vá đúng chỗ đang hở.',
    };
  }

  if (context.conceptState === 'mastered') {
    return {
      eyebrow: 'Giữ nhịp rất tốt',
      body: `Bạn đang xây nền tảng rất vững. Mình có thể giúp bạn hiểu concept ${context.conceptTitle} bằng ví dụ ngắn để nhớ chắc hơn.`,
      footnote: 'Dùng sheet này như một lần nhắc lại nhanh trước khi Start.',
    };
  }

  return {
    eyebrow: 'Coach theo concept hiện tại',
    body: `Bạn đang xây nền tảng rất vững. Mình có thể giúp bạn hiểu concept ${context.conceptTitle} bằng ví dụ ngắn.`,
    footnote: 'Mục tiêu ở đây là làm rõ khái niệm, không thay thế chat AI.',
  };
};

const getExplainCopy = (context: SofiCoachContext | null) => {
  if (!context) {
    return {
      eyebrow: 'Giải thích dễ hiểu',
      body: 'Sofi sẽ giải thích theo concept mà em đang chọn. Hãy mở sheet này sau khi có concept active.',
      footnote: 'Khi parent truyền context thật, phần này sẽ dùng đúng concept đó.',
    };
  }

  if (matchesConcept(context, ['tokenization', 'tokenize', 'token'])) {
    return {
      eyebrow: 'Giải thích dễ hiểu',
      body: 'Hãy xem tokenization như bước cắt một câu dài thành từng mảnh nhỏ để mô hình xử lý. LLM không nhìn nguyên văn bản một lần, mà đọc qua các mảnh đó.',
      footnote: 'Nếu cách cắt thay đổi, chi phí và chất lượng hiểu ngữ cảnh cũng thay đổi.',
    };
  }

  const description = normalizeSentence(context.conceptDescription);
  return {
    eyebrow: 'Giải thích dễ hiểu',
    body: description || `${context.conceptTitle} là một viên gạch của bài hôm nay. Em chỉ cần nắm nó dùng để làm gì, đầu vào là gì, và kết quả mong đợi thay đổi ra sao.`,
    footnote: 'Cách học nhanh nhất là gắn khái niệm vào một tình huống cụ thể ngay sau khi đọc.',
  };
};

const getExampleCopy = (context: SofiCoachContext | null) => {
  if (!context) {
    return {
      eyebrow: 'Ví dụ ngắn',
      body: 'Chưa có concept nào được truyền vào nên Sofi chưa thể tạo ví dụ đúng ngữ cảnh.',
      footnote: 'Parent chỉ cần truyền `conceptTitle` và mô tả ngắn là đủ cho ví dụ tĩnh.',
    };
  }

  if (matchesConcept(context, ['tokenization', 'tokenize', 'token'])) {
    return {
      eyebrow: 'Ví dụ ngắn',
      body: 'Ví dụ: câu "Sofi giúp mình học AI" có thể bị tách thành các mảnh như "Sofi", " giúp", " mình", " học", " AI". Mô hình sẽ suy nghĩ trên chuỗi mảnh đó, nên số lượng và cách tách đều quan trọng.',
      footnote: 'Khi prompt dài hơn, số token tăng lên và vùng ngữ cảnh bị tiêu hao nhanh hơn.',
    };
  }

  if (matchesConcept(context, ['embedding'])) {
    return {
      eyebrow: 'Ví dụ ngắn',
      body: 'Ví dụ: hai câu "học nhanh hơn" và "tăng tốc việc học" có thể nằm gần nhau trong không gian vector, nên hệ thống vẫn tìm được tài liệu liên quan dù từ không trùng hẳn.',
      footnote: 'Đây là trực giác cốt lõi để hiểu vì sao semantic search hoạt động.',
    };
  }

  if (matchesConcept(context, ['prompt'])) {
    return {
      eyebrow: 'Ví dụ ngắn',
      body: 'Ví dụ: thay vì hỏi "giải thích RAG", hãy hỏi "giải thích RAG cho người mới, kèm 1 ví dụ tìm tài liệu nội bộ". Prompt rõ hơn thì đầu ra bớt lan man hơn.',
      footnote: 'Một prompt tốt thường nêu rõ vai trò, nhiệm vụ, ngữ cảnh và định dạng đầu ra.',
    };
  }

  return {
    eyebrow: 'Ví dụ ngắn',
    body: `Ví dụ với ${context.conceptTitle}: sau khi đọc xong, em hãy tự nói lại bằng 1 câu "khái niệm này giúp mình làm gì" rồi nối nó với 1 thao tác thật trong bài luyện.`,
    footnote: 'Nếu tự nói lại không trơn tru, đó là dấu hiệu nên bấm Hỏi AI hoặc xem guidebook.',
  };
};

const getCoachCopy = (context: SofiCoachContext | null, view: SofiCoachView) => {
  if (view === 'explain') return getExplainCopy(context);
  if (view === 'example') return getExampleCopy(context);
  return getOverviewCopy(context);
};

export function SofiCoachSheet({
  isOpen,
  context,
  onClose,
  onAskAi,
  className,
}: SofiCoachSheetProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [activeView, setActiveView] = useState<SofiCoachView>('overview');
  const sheetInstanceKey = `${context?.conceptId ?? context?.conceptTitle ?? 'generic'}:${isOpen ? 'open' : 'closed'}`;

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onClose]);

  const coachCopy = useMemo(() => getCoachCopy(context, activeView), [activeView, context]);
  const stateCopy = context?.conceptState ? stateBadgeCopy[context.conceptState] : null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="absolute inset-0 bg-stone-950/55 backdrop-blur-[2px]"
            onMouseDown={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: 'easeOut' }}
          />

          <motion.aside
            key={sheetInstanceKey}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={
              reduceMotion
                ? { duration: 0.01 }
                : { type: 'spring', damping: 28, stiffness: 260, mass: 0.9 }
            }
            onMouseDown={(event) => event.stopPropagation()}
            className={cn(
              'relative z-[81] flex max-h-[min(86dvh,46rem)] w-[min(92vw,52rem)] flex-col overflow-hidden rounded-[28px] border border-gray-border bg-white shadow-2xl shadow-stone-950/25 sm:rounded-[32px]',
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-gray-border px-4 pb-3 pt-4 md:px-5 md:pt-5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-green-dark">
                  Sofi Coach
                </p>
                <h2 id={titleId} className="mt-1 font-fraunces text-2xl font-black leading-none text-on-background">
                  Gỡ concept nhanh
                </h2>
                <p className="mt-1 text-xs font-semibold text-stone-500">
                  Tóm ý chính, cho ví dụ ngắn, rồi mở luồng AI khi em cần đi sâu hơn.
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="ml-3 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-gray-border bg-white text-stone-500 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 active:translate-y-[1px]"
                aria-label="Đóng Sofi coach"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 md:px-5 md:pb-6">
              <div className="rounded-[26px] border border-primary-green/15 bg-[#f6fde9] p-4 shadow-sm">
                <div className="grid items-center gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
                  <div className="flex min-h-36 items-center justify-center rounded-[22px] bg-white/45">
                    <SofiStateMascot state="coach" size="md" className="shrink-0" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-green-dark">
                      Hôm nay mình đi cùng em
                    </p>
                    <p className="mt-1 text-lg font-black leading-tight text-on-background">
                      {context?.dayTitle
                        ? `${context.dayLabel || `Day ${context.dayNumber ?? '•'}`} · ${context.dayTitle}`
                        : 'Mở theo concept đang active'}
                    </p>
                    {stateCopy ? (
                      <span
                        className={cn(
                          'mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
                          stateCopy.className,
                        )}
                      >
                        {stateCopy.label}
                        {typeof context?.progressPercent === 'number' ? ` · ${context.progressPercent}%` : ''}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <section className="mt-4 rounded-[24px] border border-gray-border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary-green/15 bg-primary-green/10 text-primary-green-dark">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                      Concept đang active
                    </p>
                    <p className="mt-1 text-base font-black leading-tight text-on-background">
                      {context?.conceptTitle || 'Chưa có concept'}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-600">
                      {normalizeSentence(context?.conceptDescription) || 'Sheet này chỉ dùng microcopy tĩnh theo concept parent truyền vào.'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-4 rounded-[24px] border border-gray-border bg-surface-container-lowest p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                      {coachCopy.eyebrow}
                    </p>
                    <p className="mt-1 text-lg font-black text-on-background">Coach note</p>
                  </div>
                  <span className="rounded-full border border-primary-green/20 bg-primary-green/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-primary-green-dark">
                    {activeView === 'overview' ? 'Bức tranh nhanh' : activeView === 'explain' ? 'Nói dễ hiểu' : 'Ví dụ thực tế'}
                  </span>
                </div>
                <p id={descriptionId} className="mt-3 text-sm font-semibold leading-7 text-stone-700">
                  {coachCopy.body}
                </p>
                <p className="mt-3 rounded-2xl border border-stone-200/80 bg-white px-3 py-2 text-xs font-bold leading-6 text-stone-500">
                  {coachCopy.footnote}
                </p>
              </section>

              <section className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Quick actions</p>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setActiveView('explain')}
                    className={cn(
                      'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 text-center text-xs font-black uppercase transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 active:translate-y-[1px]',
                      activeView === 'explain'
                        ? 'border-primary-green-dark bg-primary-green text-white'
                        : 'border-gray-border bg-white text-on-background hover:bg-surface-container-low',
                    )}
                  >
                    <BookOpen className="h-4 w-4" />
                    Giải thích dễ hiểu
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('example')}
                    className={cn(
                      'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 text-center text-xs font-black uppercase transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 active:translate-y-[1px]',
                      activeView === 'example'
                        ? 'border-primary-green-dark bg-primary-green text-white'
                        : 'border-gray-border bg-white text-on-background hover:bg-surface-container-low',
                    )}
                  >
                    <Target className="h-4 w-4" />
                    Cho ví dụ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!context || !onAskAi) return;
                      onAskAi(context);
                      onClose();
                    }}
                    disabled={!context || !onAskAi}
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-primary-green-dark bg-primary-green px-3 text-center text-xs font-black uppercase text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 active:translate-y-[1px] disabled:cursor-not-allowed disabled:border-gray-border-dark disabled:bg-gray-border disabled:text-stone-400 disabled:hover:brightness-100"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Hỏi AI
                  </button>
                </div>
              </section>

              <section className="mt-4 rounded-[24px] border border-dashed border-primary-green/25 bg-primary-green/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-green-dark shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-on-background">Sheet này không giả làm chat</p>
                    <p className="mt-1 text-xs font-semibold leading-6 text-stone-600">
                      Các nút ở đây chỉ đổi microcopy tĩnh theo context. Muốn hỏi sâu hơn, dùng nút Hỏi AI để parent chuyển sang tab hoặc drawer chat hiện có.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
