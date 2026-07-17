import React from 'react';
import { 
  Paperclip, 
  ArrowRight, 
  Check,
  Loader2,
} from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';

interface ChatInputBarProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  isTyping: boolean;
  setToastMessage: (val: string | null) => void;
  handleSendMessage: (e?: React.FormEvent, customText?: string) => Promise<void>;
  isSlidePanelOpen: boolean;
  setIsSlidePanelOpen: (open: boolean) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputValue,
  setInputValue,
  isTyping,
  setToastMessage,
  handleSendMessage,
  isSlidePanelOpen,
  setIsSlidePanelOpen,
}) => {
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (window.innerWidth < 1024 && isSlidePanelOpen) {
      setIsSlidePanelOpen(false);
    }
  };

  const handleTextareaFocus = () => {
    if (window.innerWidth < 1024 && isSlidePanelOpen) {
      setIsSlidePanelOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachClick = () => {
    setToastMessage('Bạn có thể hỏi Sofi bằng nội dung bài học ngay tại ô chat. Tải tài liệu riêng sẽ được mở khi lớp học bật quyền nộp học liệu.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div 
      className="shrink-0 border-t border-gray-border/60 bg-white/40 px-3 py-2.5 backdrop-blur-md md:px-4"
      style={{
        maskImage: 'linear-gradient(to right, black calc(100% - 120px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 120px), transparent 100%)',
      }}
    >
      <div className="mx-auto max-w-4xl">
        <form 
          onSubmit={handleSendMessage} 
          className="relative flex items-end gap-2 rounded-2xl border border-gray-border bg-white p-1.5 transition-colors focus-within:border-primary-green focus-within:ring-2 focus-within:ring-primary-green/15"
        >
          <div className="flex items-center">
            <button 
              type="button" 
              onClick={handleAttachClick}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-stone-50 hover:text-primary-green active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-green"
              title="Đính kèm tài liệu"
              aria-label="Đính kèm tài liệu"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </div>
          
          <textarea
            value={inputValue}
            onChange={handleTextareaChange}
            onFocus={handleTextareaFocus}
            onKeyDown={handleKeyDown}
            placeholder="Nêu bối cảnh, điểm kẹt, đầu ra bạn muốn..."
            rows={1}
            aria-label="Nhập câu hỏi cho trợ lý AI"
            className="max-h-24 min-h-10 flex-1 resize-none border-none bg-transparent px-2 py-2 text-base font-semibold leading-relaxed text-on-background outline-none placeholder:text-stone-400 md:text-sm custom-scrollbar"
          />
          
          <ActionButton 
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            variant="primary"
            size="icon-md"
            className="shrink-0"
            aria-label={isTyping ? 'Đang tạo câu trả lời' : 'Gửi câu hỏi'}
          >
            {isTyping ? (
              <Loader2 className="h-5 w-5 animate-spin stroke-[2.5]" />
            ) : (
              <ArrowRight className="h-5 w-5 stroke-[2.5]" />
            )}
          </ActionButton>
        </form>

        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-bold text-stone-400">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 shrink-0 text-primary-green" />
            Trích nguồn khi tìm thấy học liệu
          </span>
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 shrink-0 text-primary-green" />
            Hỏi lại khi thiếu bối cảnh
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            Enter để gửi, Shift Enter để xuống dòng
          </span>
        </div>
      </div>
    </div>
  );
};
