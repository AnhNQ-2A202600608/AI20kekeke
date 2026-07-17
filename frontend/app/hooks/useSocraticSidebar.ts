'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { buildChatArtifacts, streamChatRequest } from '@/lib/chat/stream';

interface SidebarMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: any[];
  confidence_score?: number;
}

export function useSocraticSidebar(
  currentQuestion: any,
  currentQuestionIdx: number,
  activeSetId: string,
  answersHistory: any
) {
  const [sidebarMessages, setSidebarMessages] = useState<SidebarMessage[]>([]);
  const [quizHintCount, setQuizHintCount] = useState<number>(0);
  const [isSidebarTyping, setIsSidebarTyping] = useState<boolean>(false);
  const [sidebarInputValue, setSidebarInputValue] = useState<string>('');
  const [lastWelcomedIdx, setLastWelcomedIdx] = useState<number>(-1);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSocraticOpen, setIsSocraticOpen] = useState<boolean>(false);

  // Sidebar auto-scroll refs
  const sidebarEndRef = useRef<HTMLDivElement>(null);
  const mobileSidebarEndRef = useRef<HTMLDivElement>(null);

  // Socratic Sidebar Desktop auto-scroll
  const scrollToSidebarBottom = useCallback(() => {
    sidebarEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToSidebarBottom();
  }, [sidebarMessages, isSidebarTyping, scrollToSidebarBottom]);

  // Socratic Sidebar Mobile Drawer auto-scroll
  const scrollToMobileSidebarBottom = useCallback(() => {
    mobileSidebarEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      const timer = setTimeout(scrollToMobileSidebarBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [sidebarMessages, isSidebarTyping, isMobileSidebarOpen, scrollToMobileSidebarBottom]);

  // Reset hint count only when the question or set changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuizHintCount(0);
  }, [currentQuestionIdx, activeSetId]);

  // Persist Socratic sidebar chat on question change (without transition welcome prompts)
  useEffect(() => {
    if (currentQuestion) {
      const timer = setTimeout(() => {
        if (sidebarMessages.length === 0) {
          setSidebarMessages([
            {
              id: 'quiz-init-1',
              sender: 'ai',
              text: `Chào bạn! Mình là Trợ lý Socratic. Cùng giải câu hỏi số ${currentQuestionIdx + 1} nhé. Em cần gợi ý gì không? Hãy bấm nút "AI Hint" bên dưới hoặc trò chuyện cùng mình ở đây nhé! 😉`
            }
          ]);
          setLastWelcomedIdx(currentQuestionIdx);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIdx, activeSetId, currentQuestion, sidebarMessages.length]);

  // Handle requesting a Socratic hint during quiz (decoupled from sidebar)
  const handleRequestQuizHint = useCallback(() => {
    if (!currentQuestion) return;
    const nextHintCount = Math.min(3, quizHintCount + 1);
    setQuizHintCount(nextHintCount);
  }, [currentQuestion, quizHintCount]);

  // Automatically close sidebar when moving to a new unanswered question
  useEffect(() => {
    if (currentQuestion && activeSetId) {
      const history = answersHistory[activeSetId]?.[currentQuestion.id];
      if (!history) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsSocraticOpen(false);
      }
    }
  }, [currentQuestionIdx, activeSetId, answersHistory, currentQuestion]);

  const openSocraticWithDraft = useCallback((draft: string) => {
    setSidebarInputValue(draft);
    setIsSocraticOpen(true);
    setIsMobileSidebarOpen(true);
  }, []);

  // Handle custom Socratic sidebar questions from the student
  const handleSendQuizSidebarMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentQuestion || isSidebarTyping) return;

    setSidebarMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text }
    ]);
    setIsSidebarTyping(true);

    try {
      const contextMessage = `[Bối cảnh bài kiểm tra - Câu hỏi hiện tại: "${currentQuestion.question}". Học sinh đang chọn đáp án và hỏi:] ${text}`;
      
      const data = await streamChatRequest({
        message: contextMessage,
        mode: 'Explain',
      });
      const { slides, citations, confidenceScore } = buildChatArtifacts(data);
      
      const enrichedCitations = citations.map(cit => {
        const matched = slides.find(s => 
          s.slide_number === cit.page && 
          cit.source &&
          s.document_name.toLowerCase().includes(cit.source.toLowerCase())
        );
        return {
          ...cit,
          image_url: matched?.image_url || null
        };
      });

      setSidebarMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.response || 'Mình đang suy nghĩ, bạn thử đặt câu hỏi khác xem sao nhé.',
          citations: enrichedCitations,
          slides: slides,
          confidence_score: confidenceScore
        }
      ]);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Có lỗi khi kết nối tới trợ lý AI.';
      setSidebarMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `${errorMessage} Hãy thử hỏi lại hoặc bấm nút AI Hint nhé!`
        }
      ]);
    } finally {
      setIsSidebarTyping(false);
    }
  }, [currentQuestion, isSidebarTyping]);

  const resetSidebar = useCallback(() => {
    setSidebarMessages([]);
    setQuizHintCount(0);
    setLastWelcomedIdx(-1);
    setIsMobileSidebarOpen(false);
    setIsSocraticOpen(false);
  }, []);

  return {
    sidebarMessages,
    setSidebarMessages,
    quizHintCount,
    setQuizHintCount,
    isSidebarTyping,
    setIsSidebarTyping,
    sidebarInputValue,
    setSidebarInputValue,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSocraticOpen,
    setIsSocraticOpen,
    openSocraticWithDraft,
    sidebarEndRef,
    mobileSidebarEndRef,
    handleRequestQuizHint,
    handleSendQuizSidebarMessage,
    resetSidebar
  };
}
