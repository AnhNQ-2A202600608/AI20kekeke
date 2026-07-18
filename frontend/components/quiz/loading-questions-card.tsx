import { MascotLoadingBlock } from '@/components/mascot';

export function LoadingQuestionsCard() {
  return (
    <MascotLoadingBlock
      title="Sofi đang chuẩn bị câu hỏi..."
      description="Hệ thống đang nạp dữ liệu bài học"
      className="min-h-[350px] p-8 md:p-12"
    />
  );
}
