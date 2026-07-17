'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Sparkles, BookOpen, Send } from 'lucide-react';
import { useSocraticSidebar } from '../../app/hooks/useSocraticSidebar';
import { SofiExpressionAvatar } from '@/components/mascot';
import { SocraticMarkdown } from '../dashboard/socratic-chat/student/components/ai-message-item';

const CitationsBlock = ({
  citations,
  onZoom,
  onReportCitation,
}: {
  citations: any[];
  onZoom?: (url: string) => void;
  onReportCitation?: () => void;
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div data-quiz-tour-id="citation-list" className="mt-2 pt-2 border-t border-stone-200/60 space-y-1.5">
      <p className="text-kicker-micro text-stone-400 font-black uppercase tracking-wider">
        Tài liệu tham khảo (Bấm để xem slide)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((cit: any, idx: number) => {
          const isActive = activeIdx === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (isActive) {
                  setActiveIdx(null);
                } else {
                  setActiveIdx(idx);
                  if (cit.image_url && onZoom) {
                    onZoom(cit.image_url);
                  }
                }
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-caption-tight font-bold cursor-pointer transition-colors ${
                isActive
                    ? 'border-primary-green/45 bg-primary-green/10 text-primary-green-dark'
                    : cit.image_url
                      ? 'border-primary-green/20 bg-white hover:bg-primary-green/5 text-primary-green-dark'
                      : 'border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100'
              }`}
              title={cit.image_url && onZoom ? 'Mở slide trích dẫn' : 'Xem thông tin trích dẫn'}
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              <span>{cit.source} {cit.page ? `(Slide ${cit.page})` : ''}</span>
            </button>
          );
        })}
      </div>
      {activeIdx !== null && citations[activeIdx] && (
        <div className="relative p-2.5 text-helper-micro text-stone-500 italic leading-relaxed border border-gray-border bg-stone-50/50 rounded-lg pr-6">
          <button
            type="button"
            onClick={() => setActiveIdx(null)}
            className="absolute top-1.5 right-1.5 p-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
          &ldquo;{citations[activeIdx].context_snippet}&rdquo;
        </div>
      )}
      {onReportCitation && (
        <button
          type="button"
          onClick={onReportCitation}
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-kicker-micro font-black uppercase text-stone-400 transition-colors hover:text-accent-orange"
        >
          <AlertTriangle className="h-3 w-3" />
          Báo lỗi trích dẫn
        </button>
      )}
    </div>
  );
};

interface SocraticSidebarViewProps {
  aiSidebar: ReturnType<typeof useSocraticSidebar>;
  showSidebar: boolean;
}

export function SocraticSidebarView({ aiSidebar, showSidebar }: SocraticSidebarViewProps) {
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const {
    sidebarMessages,
    quizHintCount,
    isSidebarTyping,
    sidebarInputValue,
    setSidebarInputValue,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSocraticOpen,
    setIsSocraticOpen,
    sidebarEndRef,
    mobileSidebarEndRef,
    handleSendQuizSidebarMessage,
  } = aiSidebar;

  const isSheetOpen = showSidebar && (isSocraticOpen || isMobileSidebarOpen);
  const sheetEndRef = isMobileSidebarOpen ? mobileSidebarEndRef : sidebarEndRef;
  const closeSheet = () => {
    setIsMobileSidebarOpen(false);
    setIsSocraticOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.42 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 bg-stone-900/60 z-40 lg:hidden"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              data-quiz-tour-id="sofi-panel"
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-[82dvh] max-h-[620px] w-full max-w-4xl flex-col rounded-t-2xl border-t border-gray-border bg-white shadow-2xl font-be-vietnam-pro lg:hidden"
            >
              {/* Header / Pull Bar */}
              <div className="p-2.5 sm:p-4 border-b border-gray-border flex flex-col gap-1.5 sm:gap-2 relative shrink-0">
                {/* Pull indicator */}
                <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1 sm:mb-2 cursor-pointer" onClick={closeSheet} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SofiExpressionAvatar expression="happy" size={32} priority />
                    <div>
                      <h3 className="font-extrabold text-sm text-on-background leading-none">Sofi · Trợ lý học tập</h3>
                      <span className="hidden text-kicker-micro text-primary-green font-black uppercase tracking-wider mt-0.5 sm:block">Socratic Focus</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeSheet}
                    className="h-8 w-8 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 text-caption-tight font-bold cursor-pointer flex items-center justify-center"
                    title="Đóng AI Tutor"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-2 py-1.5 sm:p-2.5 bg-surface-container-low rounded-xl border border-gray-border flex flex-wrap justify-between items-center gap-1.5 text-caption-tight mt-0.5 sm:mt-1">
                  <span className="font-bold text-stone-500">Gợi ý đã dùng: {quizHintCount}/3</span>
                  {quizHintCount > 0 && (
                    <span className="text-badge-micro text-error-red font-black uppercase flex items-center gap-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-error-red" />
                      Phạt Elo: -{quizHintCount === 1 ? '30' : quizHintCount === 2 ? '60' : '90'}%
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Body */}
              <SocraticChatBody
                messages={sidebarMessages}
                isTyping={isSidebarTyping}
                scrollRef={sheetEndRef}
                inputValue={sidebarInputValue}
                setInputValue={setSidebarInputValue}
                onSubmit={handleSendQuizSidebarMessage}
                isMobile
                onZoom={setZoomedImageUrl}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Zoomed Slide */}
      <AnimatePresence>
        {zoomedImageUrl && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImageUrl(null)}
              className="fixed inset-0 bg-stone-950/85 z-[9999] cursor-zoom-out"
            />

            {/* Zoomed Content Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-4 md:inset-10 z-[10000] flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="relative max-w-full max-h-[85vh] p-2 bg-white rounded-2xl border-2 border-stone-100 shadow-2xl pointer-events-auto flex items-center justify-center overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={() => setZoomedImageUrl(null)}
                  className="absolute top-3 right-3 p-2 bg-stone-900/80 text-white rounded-full hover:bg-stone-900 transition-all cursor-pointer z-10 shadow-md"
                  title="Đóng xem lớn"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomedImageUrl}
                  alt="Slide bài học bổ trợ"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// -------------------------------------------------------------
// Reusable sub-component to dry out Desktop & Mobile Drawer JSX
// -------------------------------------------------------------
interface SocraticChatBodyProps {
  messages: any[];
  isTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputValue: string;
  setInputValue: (val: string) => void;
  onSubmit: (val: string) => void;
  isMobile: boolean;
  onZoom?: (url: string) => void;
  onReportCitation?: () => void;
}

export function SocraticChatBody({
  messages,
  isTyping,
  scrollRef,
  inputValue,
  setInputValue,
  onSubmit,
  isMobile,
  onZoom,
  onReportCitation,
}: SocraticChatBodyProps) {
  // Helper to get styled confidence label
  const getConfidenceInfo = (score: number) => {
    const pct = Math.round(score * 100);
    if (score >= 0.8) {
      return {
        text: `Độ tin cậy: Cao (${pct}%)`,
        style: 'text-emerald-700 bg-emerald-50 border-emerald-200/50'
      };
    }
    if (score >= 0.5) {
      return {
        text: `Độ tin cậy: Trung bình (${pct}%)`,
        style: 'text-accent-orange-dark bg-accent-orange-light/20 border-accent-orange/30'
      };
    }
    return {
      text: `Độ tin cậy: Thấp (${pct}%)`,
      style: 'text-rose-700 bg-rose-50 border-rose-200/50'
    };
  };

  return (
    <>
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-3 custom-scrollbar ${isMobile ? 'bg-background/10 p-3 sm:p-4 sm:space-y-4' : 'bg-[#fbfff4] p-4'}`}>
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`flex max-w-[96%] items-start gap-2.5 ${!isAI ? 'flex-row-reverse ml-auto' : ''}`}
            >
              {isAI ? (
                <SofiExpressionAvatar expression="calm" size={28} />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-caption-tight border shadow-sm shrink-0 bg-tertiary-yellow/20 border-tertiary-yellow-dark text-tertiary-yellow-dark font-bold">
                  HS
                </div>
              )}
              <div className={`min-w-0 p-3 rounded-xl text-xs md:text-sm leading-relaxed flex flex-col gap-2 ${
                isAI 
                  ? 'bg-white border border-primary-green/10 rounded-tl-none text-stone-700 shadow-sm' 
                  : 'bg-primary-green border-primary-green-dark text-white rounded-tr-none'
                }`}>
                {isAI ? (
                  <SocraticMarkdown text={msg.text} />
                ) : (
                  <p className="font-semibold whitespace-pre-line">{msg.text}</p>
                )}

                {isAI && msg.confidence_score !== undefined && (
                  (() => {
                    const conf = getConfidenceInfo(msg.confidence_score);
                    return (
                      <div className={`flex items-center gap-1 text-kicker-micro font-black uppercase tracking-wider border rounded-md px-1.5 py-0.5 w-fit ${conf.style}`}>
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        <span>{conf.text}</span>
                      </div>
                    );
                  })()
                )}

                {isAI && msg.citations && msg.citations.length > 0 && (
                  <CitationsBlock citations={msg.citations} onZoom={onZoom} onReportCitation={onReportCitation} />
                )}
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5 max-w-[90%]">
            <SofiExpressionAvatar expression="thinking" size={28} />
            <div className="bg-white border border-primary-green/10 p-3 rounded-xl rounded-tl-none shadow-sm flex items-center gap-0.5 h-9">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Form */}
      <div className={`border-t border-primary-green/10 bg-white p-3 sm:p-4 ${isMobile ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom))] shrink-0' : 'shrink-0'}`}>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!inputValue.trim()) return;
          onSubmit(inputValue);
          setInputValue('');
        }} className="relative">
          <textarea
            rows={2}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!inputValue.trim() || isTyping) return;
                onSubmit(inputValue);
                setInputValue('');
              }
            }}
            placeholder="Hỏi trợ lý Socratic..."
            className="max-h-28 min-h-[52px] w-full resize-none bg-surface-container-low border border-gray-border rounded-xl py-2.5 pl-4 pr-11 focus:border-primary-green outline-none text-xs font-semibold leading-relaxed custom-scrollbar"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute bottom-2 right-2 h-8 w-8 bg-primary-green text-white rounded-lg flex items-center justify-center border-b-2 border-primary-green-dark hover:brightness-105 active:translate-y-[1px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 transition-opacity duration-150"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </>
  );
}
