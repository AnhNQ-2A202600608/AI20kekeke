import React from 'react';
import { 
  BookMarked, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles,
  Maximize2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Slide } from '../hooks/useSocraticChat';
import { renderMarkdown } from '../utils/parser';

interface SlideViewerProps {
  retrievedSlides: Slide[];
  activeSlideIndex: number;
  setActiveSlideIndex: React.Dispatch<React.SetStateAction<number>> | ((idx: number) => void);
  isSlidePanelOpen: boolean;
  setIsSlidePanelOpen: (open: boolean) => void;
  isMobile: boolean;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  retrievedSlides,
  activeSlideIndex,
  setActiveSlideIndex,
  isSlidePanelOpen,
  setIsSlidePanelOpen,
  isMobile,
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);
  const currentSlide = retrievedSlides[activeSlideIndex];
  const docDisplayName = currentSlide ? currentSlide.document_name.replace(/\.(md|pdf)$/i, '') : '';

  React.useEffect(() => {
    if (!isZoomed || retrievedSlides.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (activeSlideIndex > 0) {
          setActiveSlideIndex(activeSlideIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (activeSlideIndex < retrievedSlides.length - 1) {
          setActiveSlideIndex(activeSlideIndex + 1);
        }
      } else if (e.key === 'Escape') {
        setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZoomed, activeSlideIndex, retrievedSlides.length, setActiveSlideIndex]);

  const renderContent = () => {
    return (
      <div className="w-full h-full flex flex-col relative">
        {/* Header Panel */}
        <div className="px-5 py-4 bg-[#F7FDEB] border-b-2 border-gray-border flex items-center justify-between shrink-0 lg:pr-20">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4.5 h-4.5 text-primary-green" />
            <h3 className="font-fraunces font-bold text-sm text-on-background">Trình chiếu học liệu</h3>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Pagination Controls */}
            {retrievedSlides.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Chuyển về slide trước"
                  disabled={activeSlideIndex === 0}
                  onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                  className={`p-1.5 border-2 border-gray-border rounded-lg bg-white transition-colors ${
                    activeSlideIndex === 0 
                      ? 'text-stone-300 cursor-not-allowed opacity-60' 
                      : 'text-stone-600 hover:bg-stone-50 cursor-pointer active:translate-y-[1px]'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-extrabold text-stone-500 tracking-wider">
                  Slide {activeSlideIndex + 1} / {retrievedSlides.length}
                </span>
                <button
                  type="button"
                  aria-label="Chuyển sang slide tiếp theo"
                  disabled={activeSlideIndex === retrievedSlides.length - 1}
                  onClick={() => setActiveSlideIndex(Math.min(retrievedSlides.length - 1, activeSlideIndex + 1))}
                  className={`p-1.5 border-2 border-gray-border rounded-lg bg-white transition-colors ${
                    activeSlideIndex === retrievedSlides.length - 1 
                      ? 'text-stone-300 cursor-not-allowed opacity-60' 
                      : 'text-stone-600 hover:bg-stone-50 cursor-pointer active:translate-y-[1px]'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Zoom Button */}
            {currentSlide && currentSlide.image_url && (
              <button
                type="button"
                onClick={() => setIsZoomed(true)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors cursor-pointer active:translate-y-[1px]"
                title="Phóng to hình ảnh slide"
                aria-label="Phóng to hình ảnh slide"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Button X */}
            <button
              type="button"
              onClick={() => setIsSlidePanelOpen(false)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              title="Đóng slide học liệu"
              aria-label="Đóng slide học liệu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col">
          {retrievedSlides.length === 0 ? (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-warm-cream">
              <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-36 h-36">
                  <rect x="35" y="45" width="130" height="110" rx="12" fill="#e2dcd0" />
                  <rect x="30" y="40" width="130" height="110" rx="12" fill="#58cc02" stroke="#46a302" strokeWidth="4" />
                  <path d="M 25 55 L 35 55 M 25 75 L 35 75 M 25 95 L 35 95 M 25 115 L 35 115 M 25 135 L 35 135" stroke="#b7b7b7" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 40 45 L 155 45 A 8 8 0 0 1 163 53 L 163 137 A 8 8 0 0 1 155 145 L 40 145 Z" fill="#ffffff" stroke="#e5e5e5" strokeWidth="2" />
                  <path d="M 120 40 L 120 120 L 130 110 L 140 120 L 140 40 Z" fill="#ffc800" />
                  <line x1="55" y1="65" x2="145" y2="65" stroke="#e5e5e5" strokeWidth="3" strokeLinecap="round" />
                  <line x1="55" y1="85" x2="145" y2="85" stroke="#e5e5e5" strokeWidth="3" strokeLinecap="round" />
                  <line x1="55" y1="105" x2="145" y2="105" stroke="#e5e5e5" strokeWidth="3" strokeLinecap="round" />
                  <line x1="55" y1="125" x2="110" y2="125" stroke="#e5e5e5" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 160 30 L 165 20 L 170 30 L 180 35 L 170 40 L 165 50 L 160 40 L 150 35 Z" fill="#ffc800" opacity="0.8" />
                  <path d="M 15 110 L 18 102 L 22 110 L 30 113 L 22 116 L 18 124 L 15 116 L 7 113 Z" fill="#ff9600" opacity="0.8" />
                </svg>
              </div>
              <h3 className="font-fraunces font-bold text-base text-on-background mb-2">Chưa có Slide trích dẫn</h3>
              <p className="text-[13px] text-stone-500 font-semibold max-w-xs leading-relaxed px-4">
                Hãy trao đổi với trợ lý Sofi ở khung chat bên cạnh để tìm kiếm và trình chiếu các slide học liệu tương ứng tại đây.
              </p>
            </div>
          ) : (
            // Active Slide Presentation Layout
            currentSlide && (
              <div className={`p-5 flex-1 flex flex-col ${isMobile ? 'gap-4 overflow-y-auto overscroll-contain' : 'gap-5 overflow-hidden h-full'}`}>
                {/* Main slide frame */}
                <div className={`${isMobile ? 'h-64 shrink-0' : 'flex-1'} flex flex-col overflow-hidden`}>
                  <div className="flex h-full w-full items-center justify-center overflow-y-auto overscroll-contain rounded-2xl border border-gray-border bg-white p-4 custom-scrollbar">
                    {currentSlide.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentSlide.image_url}
                        alt={`Slide ${currentSlide.slide_number}`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm cursor-zoom-in hover:opacity-95 transition-opacity"
                        onClick={() => setIsZoomed(true)}
                        title="Click để phóng to slide"
                      />
                    ) : (
                      <div className="w-full h-full overflow-y-auto overscroll-contain custom-scrollbar">
                        {renderMarkdown(currentSlide.content)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Slide Meta & Highlighting Note */}
                <div className={`${isMobile ? 'flex flex-col gap-4' : 'w-full flex flex-col gap-4 shrink-0 mt-auto'}`}>
                  {/* Top Slide Meta */}
                  <div className="space-y-3 rounded-xl border border-gray-border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-primary-green-dark tracking-wider px-2 py-0.5 bg-primary-green/10 border border-primary-green/20 rounded-md">
                        Slide {currentSlide.slide_number}
                      </span>
                      
                      {/* Similarity Badge */}
                      <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 bg-tertiary-yellow/15 text-tertiary-yellow-dark border border-tertiary-yellow/20 rounded-md">
                        Khớp: {Math.round(currentSlide.similarity * 100)}%
                      </span>
                    </div>
                    <h4 className="font-fraunces font-bold text-sm text-on-background leading-snug">
                      {docDisplayName}
                    </h4>
                  </div>

                  {/* Grounded snippet highlighting note */}
                  <div className="p-4 rounded-xl border border-tertiary-yellow/30 bg-warm-cream-light flex gap-2.5 items-start">
                    <Sparkles className="w-4 h-4 text-tertiary-yellow fill-tertiary-yellow shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider leading-none">Nội dung được đối chiếu từ RAG</p>
                      <p className="text-[13px] text-stone-600 font-medium italic leading-relaxed">
                        &ldquo;Sofi đã định vị chính xác vị trí bài giảng này trên trang {currentSlide.slide_number} của tài liệu học tập để đưa ra giải thích Socratic trên.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <AnimatePresence>
        {isSlidePanelOpen && (
          <>
            {/* Mobile slide panel backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSlidePanelOpen(false)}
              className="fixed inset-0 bg-black/45 z-[998] lg:hidden"
            />
            {/* Mobile bottom drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 h-[75vh] bg-[#F7FDEB] z-[999] rounded-t-2xl shadow-2xl border-t-2 border-gray-border flex flex-col overflow-hidden lg:hidden"
            >
              {/* Drag handle / Close trigger area */}
              <button
                type="button"
                aria-label="Đóng trình chiếu học liệu"
                className="w-full py-2.5 flex items-center justify-center cursor-pointer hover:bg-stone-50 border-b border-stone-100 shrink-0"
                onClick={() => setIsSlidePanelOpen(false)}
              >
                <div className="w-12 h-1.5 rounded-full bg-stone-300" />
              </button>
              
              {/* Slide Viewer Content */}
              <div className="flex-1 overflow-hidden">
                {renderContent()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop side-panel
  return (
    <>
      <AnimatePresence>
        {isSlidePanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '480px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="hidden lg:flex flex-col h-full bg-[#F7FDEB] border-l-2 border-gray-border overflow-hidden shrink-0"
          >
            {renderContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Zoomed Slide */}
      <AnimatePresence>
        {isZoomed && currentSlide && currentSlide.image_url && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsZoomed(false)}
              className="fixed inset-0 bg-stone-950/85 z-[1000] cursor-zoom-out"
            />
            
            {/* Zoomed Content Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-4 md:inset-10 z-[1001] flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Left Navigation Arrow */}
              <button
                type="button"
                aria-label="Slide trước"
                disabled={activeSlideIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlideIndex(activeSlideIndex - 1);
                }}
                className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 p-3 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full transition-transform transition-colors cursor-pointer z-10 shadow-lg pointer-events-auto hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 hidden md:flex"
                title="Slide trước (Phím mũi tên Trái)"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>

              {/* Right Navigation Arrow */}
              <button
                type="button"
                aria-label="Slide tiếp theo"
                disabled={activeSlideIndex === retrievedSlides.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlideIndex(activeSlideIndex + 1);
                }}
                className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 p-3 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full transition-transform transition-colors cursor-pointer z-10 shadow-lg pointer-events-auto hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 hidden md:flex"
                title="Slide tiếp theo (Phím mũi tên Phải)"
              >
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              </button>

              <div className="relative max-w-full max-h-[85vh] p-2 bg-white rounded-2xl border-2 border-stone-100 shadow-2xl pointer-events-auto flex items-center justify-center overflow-hidden">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="absolute top-3 right-3 p-2 bg-stone-900/80 text-white rounded-full hover:bg-stone-900 transition-colors cursor-pointer z-10 shadow-md"
                  title="Đóng xem lớn"
                  aria-label="Đóng xem lớn"
                >
                  <X className="w-4.5 h-4.5 stroke-[2.5]" />
                </button>
                
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentSlide.image_url}
                  alt={`Slide ${currentSlide.slide_number} Zoomed`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
              
              {/* Meta overlay below image */}
              <div className="mt-4 px-5 py-2.5 bg-stone-900/90 text-white rounded-full border border-stone-850 text-xs font-semibold shadow-lg pointer-events-auto flex items-center gap-4">
                <span>Slide {currentSlide.slide_number} / {retrievedSlides.length}</span>
                <span className="w-px h-3.5 bg-stone-700" />
                <span>{docDisplayName}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
