import { BookOpen, ChevronLeft, Sparkles } from 'lucide-react';
import { TOPICS } from '@/lib/quiz/constants';
import { MascotLoadingBlock } from '@/components/mascot';
import { getProgramDay } from '@/lib/quiz/program-curriculum';

interface GuidebookViewProps {
  activeGuidebookDayId: string;
  guidebookHtml: string;
  isLoadingGuidebook: boolean;
  onClose: () => void;
}

export function GuidebookView({
  activeGuidebookDayId,
  guidebookHtml,
  isLoadingGuidebook,
  onClose,
}: GuidebookViewProps) {
  const topic = TOPICS.find(t => t.id === activeGuidebookDayId);
  const programDay = getProgramDay(activeGuidebookDayId);

  let heading = activeGuidebookDayId;
  let subHeading = '';

  if (programDay) {
    if (programDay.title.includes(':')) {
      const parts = programDay.title.split(':');
      heading = parts[0].trim();
      subHeading = parts[1].trim();
    } else {
      heading = `Day ${programDay.dayNumber}`;
      subHeading = programDay.title;
    }
  } else if (topic) {
    if (topic.title.includes(':')) {
      const parts = topic.title.split(':');
      heading = parts[0].trim();
      subHeading = parts[1].trim();
    } else {
      heading = topic.title;
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 md:py-6 px-4 space-y-6">
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors py-1 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4 stroke-[3]" />
        <span>Trở về</span>
      </button>

      <hr className="border-stone-200" />

      <div className="flex flex-col gap-4 rounded-2xl border-2 border-primary-green/15 border-b-[5px] bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-green text-white">
          <BookOpen className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-md font-fraunces font-black uppercase tracking-tight text-on-background md:text-lg">
            Hướng dẫn {heading}
          </h3>
          <p className="text-xs font-semibold leading-relaxed text-stone-600">
            {subHeading}
          </p>
        </div>
      </div>

      {isLoadingGuidebook ? (
        <MascotLoadingBlock
          title="Sofi đang mở tài liệu hướng dẫn..."
          description="Đang tải guidebook cho ngày học này"
          className="border-2 border-b-[5px] p-12"
        />
      ) : guidebookHtml ? (
        <div
          className="prose max-w-none overflow-hidden rounded-2xl border-2 border-primary-green/15 border-b-[5px] bg-white p-6 text-stone-800 shadow-sm prose-headings:font-fraunces prose-headings:text-on-background prose-strong:text-stone-900 prose-code:text-primary-green-dark md:p-8"
          dangerouslySetInnerHTML={{ __html: guidebookHtml }}
        />
      ) : (
        <div className="space-y-6 rounded-2xl border-2 border-primary-green/15 border-b-[5px] bg-white p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-green/10 text-primary-green">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-base font-black text-on-background">Tài liệu học tập đang được soạn thảo</h3>
            <p className="text-xs leading-relaxed text-stone-600">
              Tài liệu tóm tắt kiến thức cho ngày học này đang được chuẩn bị. Bạn có thể tiến hành làm các bộ đề trắc nghiệm và tự luận để củng cố và kiểm tra tri thức ngay bây giờ!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
