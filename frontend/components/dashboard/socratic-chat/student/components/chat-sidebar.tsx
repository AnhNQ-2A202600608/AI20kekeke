import React from 'react';
import {
  Menu, 
  History, 
  Plus, 
  X, 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActionButton } from '@/components/ui/action-button';
import { ChatSessionMeta } from '../hooks/useSocraticChat';

interface ChatSidebarProps {
  recentHistory: ChatSessionMeta[];
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isHistoryPopoverOpen: boolean;
  setIsHistoryPopoverOpen: (open: boolean) => void;
  handleNewChat: () => void;
  handleLoadHistory: (id: string) => void;
  handleDeleteHistory: (id: string) => void;
  activeSessionId: string | null;
  selectedPersona?: string;
  onTabClick?: (tabId: any) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  recentHistory,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isHistoryPopoverOpen,
  setIsHistoryPopoverOpen,
  handleNewChat,
  handleLoadHistory,
  handleDeleteHistory,
  activeSessionId,
}) => {
  return (
    <>
      {/* Mobile Sidebar Drawer overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/45 z-[999] md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-surface-container-lowest/95 backdrop-blur-md z-[1000] p-5 flex flex-col border-r border-gray-border md:hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-black text-stone-500 uppercase tracking-wider">Trợ lý Socratic</span>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  aria-label="Đóng thanh bên"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              
              <ActionButton
                type="button"
                onClick={() => {
                  handleNewChat();
                  setIsMobileSidebarOpen(false);
                }}
                variant="green"
                size="md"
                className="mb-4 w-full"
              >
                <Plus className="w-4.5 h-4.5 stroke-[3]" />
                <span>Cuộc hội thoại mới</span>
              </ActionButton>

              <div className="flex-1 flex flex-col overflow-hidden">
                <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-3">Lịch sử hỏi đáp</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                  {recentHistory.map((session) => (
                    <div key={session.id} className="group relative flex items-center justify-between rounded-lg hover:bg-surface-container-low transition-all">
                      <button
                        type="button"
                        onClick={() => {
                          handleLoadHistory(session.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className="flex-1 text-left p-2.5 text-[13px] font-bold text-stone-500 hover:text-on-background transition-all flex items-center gap-2 cursor-pointer truncate"
                      >
                        <History className="w-3.5 h-3.5 text-stone-400 group-hover:text-primary-green shrink-0" />
                        <span className="truncate">{session.title}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHistory(session.id);
                        }}
                        className="p-2 text-stone-400 hover:text-error-red transition-colors cursor-pointer rounded-lg"
                        aria-label={`Xóa lịch sử ${session.title}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Left Sidebar inside Chat */}
      {isSidebarCollapsed ? (
        /* Collapsed Sidebar */
        <aside className="hidden md:flex flex-col w-16 h-full py-4 px-2 bg-surface-container-lowest/50 backdrop-blur-md border-r border-gray-border overflow-hidden shrink-0 items-center justify-between">
          <div className="w-full flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors cursor-pointer flex items-center justify-center"
              title="Mở rộng thanh bên"
              aria-label="Mở rộng thanh bên"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Socratic Chat items (Icons only) */}
            <div className="w-full pt-4 flex flex-col items-center gap-2">
              <ActionButton
                type="button"
                onClick={handleNewChat}
                variant="green"
                size="icon-md"
                title="Cuộc hội thoại mới"
                aria-label="Cuộc hội thoại mới"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </ActionButton>
            </div>
          </div>

          {/* History Popover Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsHistoryPopoverOpen(!isHistoryPopoverOpen)}
              onMouseEnter={() => setIsHistoryPopoverOpen(true)}
              className="p-2.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-all cursor-pointer flex items-center justify-center"
              title="Lịch sử hỏi đáp"
              aria-label="Lịch sử hỏi đáp"
            >
              <History className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {isHistoryPopoverOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onMouseLeave={() => setIsHistoryPopoverOpen(false)}
                  className="absolute bottom-0 left-14 z-50 w-64 bg-white border border-gray-border rounded-xl shadow-xl p-3 flex flex-col max-h-[300px]"
                >
                  <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1 text-left">Lịch sử hỏi đáp</h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                    {recentHistory.length === 0 ? (
                      <p className="text-[12px] text-stone-400 font-medium p-2 text-center">Chưa có lịch sử</p>
                    ) : (
                      recentHistory.map((session) => (
                        <div key={session.id} className="group relative flex items-center justify-between rounded-lg hover:bg-surface-container-low transition-all">
                          <button
                            type="button"
                            onClick={() => {
                              handleLoadHistory(session.id);
                              setIsHistoryPopoverOpen(false);
                            }}
                            className="flex-1 text-left p-2 text-xs font-bold text-stone-500 hover:text-on-background transition-all flex items-center gap-2 cursor-pointer truncate"
                          >
                            <History className="w-3.5 h-3.5 text-stone-400 group-hover:text-primary-green shrink-0" />
                            <span className="truncate">{session.title}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistory(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-error-red transition-all cursor-pointer rounded"
                            title="Xóa lịch sử"
                            aria-label={`Xóa lịch sử ${session.title}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      ) : (
        /* Expanded Sidebar */
        <aside className="hidden md:flex flex-col w-64 h-full p-5 bg-surface-container-lowest/50 backdrop-blur-md border-r border-gray-border overflow-hidden shrink-0">
          <div className="mb-6 flex items-center justify-between px-2 py-3 shrink-0">
            <h2 className="text-sm font-black text-on-background uppercase tracking-wider font-fraunces">Hội thoại</h2>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              title="Thu gọn thanh bên"
              aria-label="Thu gọn thanh bên"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          </div>

          <ActionButton
            type="button"
            onClick={handleNewChat}
            variant="green"
            size="md"
            className="mb-4 w-full shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cuộc hội thoại mới</span>
          </ActionButton>

          <div className="flex-grow flex flex-col overflow-hidden">
            <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-3 shrink-0">Lịch sử hỏi đáp</h3>
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1">
              {recentHistory.map((session) => (
                <div key={session.id} className="group relative flex items-center justify-between rounded-lg hover:bg-surface-container-low transition-all">
                  <button
                    type="button"
                    onClick={() => handleLoadHistory(session.id)}
                    className="flex-1 text-left p-2.5 text-[13px] font-bold text-stone-500 hover:text-on-background transition-all flex items-center gap-2 cursor-pointer truncate"
                  >
                    <History className="w-3.5 h-3.5 text-stone-400 group-hover:text-primary-green shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-error-red transition-all cursor-pointer rounded-lg"
                    title="Xóa lịch sử"
                    aria-label={`Xóa lịch sử ${session.title}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
