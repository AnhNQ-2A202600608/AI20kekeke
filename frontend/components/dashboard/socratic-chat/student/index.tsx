'use client';

import React from 'react';
import {
  BookOpen,
  Check,
  Menu,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SofiExpressionAvatar } from '@/components/mascot';
import { useBoundStore } from '@/hooks/useBoundStore';
import type { TabType } from '@/lib/dashboard-tabs';
import { useSocraticChat } from './hooks/useSocraticChat';
import { ChatSidebar } from './components/chat-sidebar';
import { ChatInputBar } from './components/chat-input-bar';
import { AIMessageItem } from './components/ai-message-item';
import { SlideViewer } from './components/slide-viewer';

interface StudentChatTabProps {
  setActiveTab: (tab: TabType) => void;
  loggedIn: boolean;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  activeTab?: string;
}

export const StudentChatTab: React.FC<StudentChatTabProps> = ({
  setActiveTab,
  loggedIn,
  onOpenAuth,
  activeTab,
}) => {
  const { selectedPersona } = useBoundStore();

  const {
    activeConcept,
    inputValue,
    setInputValue,
    isTyping,
    toastMessage,
    setToastMessage,
    retrievedSlides,
    setRetrievedSlides,
    activeSlideIndex,
    setActiveSlideIndex,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isSlidePanelOpen,
    setIsSlidePanelOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isHistoryPopoverOpen,
    setIsHistoryPopoverOpen,
    concepts,
    messages,
    recentHistory,
    chatScrollRef,
    handleNewChat,
    handleLoadHistory,
    handleDeleteHistory,
    handleSendMessage,
    handleFeedback,
    handleTabClick,
    activeSessionId,
  } = useSocraticChat({
    setActiveTab,
    loggedIn,
    onOpenAuth,
    activeTab,
  });

  const activeConceptObj = concepts.find((c) => c.id === activeConcept);
  const activeTitle = activeConceptObj?.id === 'general' ? 'Sofi học cùng bạn' : activeConceptObj?.name || 'Sofi học cùng bạn';

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent font-be-vietnam-pro lg:-mr-20 lg:w-[calc(100%+5rem)]">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed left-1/2 top-5 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/90 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <Check className="h-3.5 w-3.5 shrink-0 text-primary-green" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 flex-row overflow-hidden bg-transparent">
        <ChatSidebar
          recentHistory={recentHistory}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          isHistoryPopoverOpen={isHistoryPopoverOpen}
          setIsHistoryPopoverOpen={setIsHistoryPopoverOpen}
          handleNewChat={handleNewChat}
          handleLoadHistory={handleLoadHistory}
          handleDeleteHistory={handleDeleteHistory}
          activeSessionId={activeSessionId}
          selectedPersona={selectedPersona}
          onTabClick={handleTabClick}
        />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
          <div
            className="shrink-0 border-b border-gray-border/60 bg-white/50 px-3 py-2.5 shadow-sm backdrop-blur-md md:px-4"
            style={{
              maskImage: 'linear-gradient(to right, black calc(100% - 120px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 120px), transparent 100%)',
            }}
          >
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-green md:hidden"
                    aria-label="Mở thanh điều hướng"
                  >
                    <Menu className="h-4.5 w-4.5" />
                  </button>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-green/25 bg-primary-green/10">
                    <SofiExpressionAvatar expression="calm" size={36} className="border-0 bg-transparent shadow-none" priority />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-fraunces text-base font-bold text-on-background">
                      {activeTitle}
                    </h2>
                    <p className="mt-1 truncate text-[12px] font-bold text-stone-500">
                      Đưa bối cảnh, điểm kẹt và đầu ra bạn muốn nhận.
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
                  {retrievedSlides.length > 0 && (
                    <button
                      onClick={() => setIsSlidePanelOpen(true)}
                      className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-primary-green/20 bg-primary-green/10 px-3 text-[13px] font-black text-primary-green-dark transition-colors hover:bg-primary-green/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-green lg:hidden"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Học liệu ({retrievedSlides.length})</span>
                    </button>
                  )}

                </div>
              </div>
            </div>

            <div
              ref={chatScrollRef}
              onClick={() => {
                if (window.innerWidth < 1024 && isSlidePanelOpen) {
                  setIsSlidePanelOpen(false);
                }
              }}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 custom-scrollbar md:p-4 lg:pr-20"
            >
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <AIMessageItem
                      key={msg.id}
                      msg={msg}
                      setRetrievedSlides={setRetrievedSlides}
                      setActiveSlideIndex={setActiveSlideIndex}
                      setIsSlidePanelOpen={setIsSlidePanelOpen}
                      handleSendMessage={handleSendMessage}
                      handleFeedback={handleFeedback}
                      setToastMessage={setToastMessage}
                    />
                  ))}
                </AnimatePresence>

                {isTyping && messages[messages.length - 1]?.sender !== 'ai' && (
                  <div className="flex max-w-[85%] gap-3">
                    <SofiExpressionAvatar expression="thinking" size={36} />
                    <div className="flex min-h-16 w-full max-w-sm items-center gap-3 rounded-2xl rounded-tl-none border border-gray-border bg-white p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-green/10">
                        <Sparkles className="h-5 w-5 animate-pulse text-primary-green" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-extrabold text-on-background">Đang chuẩn bị câu trả lời</p>
                        <p className="mt-0.5 text-[11px] font-bold uppercase text-stone-400">
                          Kiểm tra lộ trình và học liệu liên quan
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ChatInputBar
              inputValue={inputValue}
              setInputValue={setInputValue}
              isTyping={isTyping}
              setToastMessage={setToastMessage}
              handleSendMessage={handleSendMessage}
              isSlidePanelOpen={isSlidePanelOpen}
              setIsSlidePanelOpen={setIsSlidePanelOpen}
            />

          </main>

          <SlideViewer
            retrievedSlides={retrievedSlides}
            activeSlideIndex={activeSlideIndex}
            setActiveSlideIndex={setActiveSlideIndex}
            isSlidePanelOpen={isSlidePanelOpen}
            setIsSlidePanelOpen={setIsSlidePanelOpen}
            isMobile={false}
          />
      </div>

      <SlideViewer
        retrievedSlides={retrievedSlides}
        activeSlideIndex={activeSlideIndex}
        setActiveSlideIndex={setActiveSlideIndex}
        isSlidePanelOpen={isSlidePanelOpen}
        setIsSlidePanelOpen={setIsSlidePanelOpen}
        isMobile={true}
      />
    </div>
  );
};

export default StudentChatTab;
