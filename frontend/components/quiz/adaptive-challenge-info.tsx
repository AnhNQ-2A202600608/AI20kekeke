'use client';

import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

export function AdaptiveChallengeInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Vì sao hệ thống chọn câu này?"
        title="Vì sao hệ thống chọn câu này?"
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-5 w-5 place-items-center rounded-full border border-primary-blue/25 bg-primary-blue-light/60 text-primary-blue shadow-sm transition-colors hover:bg-primary-blue-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-blue/15"
      >
        <Info className="h-3 w-3" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.45rem)] z-[95] w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-primary-blue/15 bg-white p-3 text-left text-[11px] font-bold leading-relaxed text-stone-650 shadow-2xl shadow-stone-950/15">
          <div className="flex items-start justify-between gap-2">
            <p className="font-black text-stone-850">Vì sao là câu này?</p>
            <button
              type="button"
              aria-label="Đóng giải thích"
              onClick={() => setIsOpen(false)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1.5">
            Hệ thống chọn câu này vì nó đang vừa sức với phần bạn đang luyện.
            Nếu bạn làm đúng, bài sau có thể khó hơn một chút. Nếu bạn gặp khó,
            hệ thống sẽ chọn câu củng cố nền tảng hơn.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default AdaptiveChallengeInfo;
