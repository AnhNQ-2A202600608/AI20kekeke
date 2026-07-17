import React, { useState, useEffect, useRef, useCallback } from 'react';
import { buildChatArtifacts, streamChatRequest } from '@/lib/chat/stream';
import {
  deleteSofiConversation,
  getSofiConversation,
  listSofiConversations,
  upsertSofiConversation,
} from '@/lib/chat/sofi-conversation-store';
import type { TabType } from '@/lib/dashboard-tabs';
import { isDemoMode } from '@/lib/demo-mode';
import { useBoundStore } from '@/hooks/useBoundStore';
import { parseQuizData } from '../utils/parser';

export interface Slide {
  document_name: string;
  slide_number: number;
  content: string;
  similarity: number;
  image_url?: string;
}

export interface ReasoningStep {
  id: string;
  kind: 'thought' | 'tool' | 'observation' | 'final' | 'error';
  title: string;
  content: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  toolName?: string;
  input?: unknown;
  output?: unknown;
  startedAt?: number;
  durationMs?: number;
  errorCode?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  mode?: string;
  citations?: Array<{ source?: string; title?: string; excerpt?: string; page?: number | string; context_snippet?: string }>;
  confidence_score?: number;
  isFeedbackGiven?: 'up' | 'down' | null;
  isGuardrail?: boolean;
  isFallback?: boolean;
  slides?: Slide[];
  startedAt?: number;
  latencyMs?: number;
  traceSteps?: ReasoningStep[];
  thinkingText?: string;
  thinkingSteps?: string[];
  toolRuns?: Array<{
    toolName: string;
    args: any;
    result: any;
    status: 'running' | 'success' | 'error';
    startedAt?: number;
    durationMs?: number;
  }>;
  sandboxRun?: {
    status: 'running' | 'success' | 'failed';
    code: string;
    output: string;
    execution_time_ms: number;
  };
}

export interface Concept {
  id: string;
  name: string;
  status: 'MASTERED' | 'LEARNING' | 'WEAK' | 'NOT_STARTED';
  elo: number;
}

export interface ChatSessionMeta {
  id: string;
  title: string;
  timestamp: number;
}

export type ChatAction =
  | {
      type: 'quiz_option_select';
      optionKey: string;
      optionText: string;
    };

const CONCEPT_UUID_MAP: { [key: string]: string } = {};

const COURSE_UUID = '00000000-0000-0000-0000-000000000001';

const generateMsgId = (prefix: string): string => {
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${Date.now()}-${randomStr}`;
};

const generateTraceId = (kind: ReasoningStep['kind']): string => {
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${kind}-${Date.now()}-${randomStr}`;
};

const createThoughtStep = (content: string): ReasoningStep => ({
  id: generateTraceId('thought'),
  kind: 'thought',
  title: content.replace(/\.+$/, ''),
  content,
  status: 'completed',
  startedAt: Date.now(),
});

const createToolStep = (toolName: string, input: unknown): ReasoningStep => ({
  id: generateTraceId('tool'),
  kind: 'tool',
  title: toolName,
  content: 'Đang thực thi công cụ...',
  toolName,
  input,
  status: 'running',
  startedAt: Date.now(),
});

const createObservationStep = (
  title: string,
  content: string,
  output: unknown,
  durationMs?: number,
): ReasoningStep => ({
  id: generateTraceId('observation'),
  kind: 'observation',
  title,
  content,
  output,
  status: 'completed',
  startedAt: Date.now(),
  durationMs,
});

const saveSessionData = (
  sessionId: string,
  currentMessages: Message[],
  currentSlides: Slide[],
  setRecentHistory: React.Dispatch<React.SetStateAction<ChatSessionMeta[]>>,
  options: {
    studentId?: string | null;
    surface?: 'global_chat' | 'quiz' | 'skill_graph' | 'learning_path';
    conceptId?: string;
    sourceRef?: { type: 'node' | 'quiz_question' | 'day' | 'general'; id: string; label: string };
  } = {},
) => {
  if (!sessionId) return;

  const hasUserMessages = currentMessages.some(m => m.sender === 'user');
  if (!hasUserMessages) return;

  localStorage.setItem(`student_socratic_chat_session_${sessionId}`, JSON.stringify(currentMessages));
  localStorage.setItem(`student_socratic_chat_slides_${sessionId}`, JSON.stringify(currentSlides));

  const firstUserMsg = currentMessages.find(m => m.sender === 'user')?.text || '';
  const title = firstUserMsg.length > 35 ? firstUserMsg.substring(0, 35) + '...' : firstUserMsg;

  const storedHistory = localStorage.getItem('student_socratic_chat_history_meta');
  let historyList: ChatSessionMeta[] = [];
  if (storedHistory) {
    try {
      historyList = JSON.parse(storedHistory);
    } catch (e) {
      console.error(e);
    }
  }

  const existingIdx = historyList.findIndex(item => item.id === sessionId);
  if (existingIdx !== -1) {
    historyList[existingIdx] = {
      ...historyList[existingIdx],
      title,
      timestamp: Date.now()
    };
  } else {
    historyList = [{
      id: sessionId,
      title,
      timestamp: Date.now()
    }, ...historyList];
  }

  localStorage.setItem('student_socratic_chat_history_meta', JSON.stringify(historyList));
  upsertSofiConversation<Message, Slide>({
    id: sessionId,
    title,
    surface: options.surface || 'global_chat',
    studentId: options.studentId,
    courseId: COURSE_UUID,
    conceptId: options.conceptId,
    sourceRef: options.sourceRef || { type: 'general', id: 'global-chat', label: 'Sofi Chat' },
    messages: currentMessages,
    slides: currentSlides,
  });
  setRecentHistory(historyList);
};

export interface UseSocraticChatProps {
  setActiveTab: (tab: TabType) => void;
  loggedIn: boolean;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  activeTab?: string;
}

export const useSocraticChat = ({
  setActiveTab,
  loggedIn,
  onOpenAuth,
  activeTab
}: UseSocraticChatProps) => {
  const studentId = useBoundStore(state => state.userId);
  const [activeConcept, setActiveConcept] = useState<string>('general');
  const [activeMode, setActiveMode] = useState<string>('explain');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [savedMessages, setSavedMessages] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [retrievedSlides, setRetrievedSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isHistoryPopoverOpen, setIsHistoryPopoverOpen] = useState<boolean>(false);

  const [concepts] = useState<Concept[]>([
    { id: 'general', name: 'Sofi học cùng bạn', status: 'MASTERED', elo: 1200 },
    { id: 'docker-basics', name: 'Docker Basics', status: 'MASTERED', elo: 1420 },
    { id: 'docker-compose', name: 'Docker Compose', status: 'LEARNING', elo: 1100 },
    { id: 'rest-api', name: 'REST API Call', status: 'WEAK', elo: 850 },
    { id: 'nextjs-rsc', name: 'Next.js RSC', status: 'NOT_STARTED', elo: 1000 },
  ]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [recentHistory, setRecentHistory] = useState<ChatSessionMeta[]>([]);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef<boolean>(false);

  const getInitialMessage = useCallback((conceptId: string, mode: string = 'explain') => {
    const welcomeMessages: { [key: string]: string } = {
      'general': "Mình là Sofi. Để nhận câu trả lời hữu ích hơn, hãy gửi theo 3 ý: **bối cảnh đang học**, **điểm đang kẹt**, **đầu ra bạn muốn**.\n\nVí dụ: “Mình đang học ReAct, chưa rõ Observation khác log thường thế nào. Hãy hỏi gợi mở rồi cho ví dụ từ học liệu nếu có.”",
      'docker-basics': "Mình sẽ giúp bạn tự kiểm tra **Docker Basics** thay vì đưa đáp án sẵn. Hãy nói rõ lệnh hoặc lỗi bạn đang gặp, rồi mình sẽ hỏi gợi mở và đối chiếu học liệu khi có nguồn.",
      'docker-compose': "Với **Docker Compose**, hãy đưa bối cảnh hệ thống, service đang kẹt và điều bạn muốn hiểu. Mình sẽ tách vấn đề từng bước để bạn tự dựng được mô hình đúng.",
      'rest-api': "Với **REST API Call**, hãy gửi endpoint hoặc tình huống bạn đang phân vân. Mình sẽ giúp bạn phân biệt method, status code và dữ liệu vào/ra bằng câu hỏi ngắn.",
      'nextjs-rsc': "Với **Next.js RSC**, hãy nêu component hoặc luồng data bạn đang so sánh. Mình sẽ giúp bạn tự xác định phần nào chạy server, phần nào cần client."
    };
    return {
      id: `msg-init-${conceptId}-${Date.now()}`,
      sender: 'ai' as const,
      text: welcomeMessages[conceptId] || `Chào bạn! Hãy cùng thảo luận về khái niệm này.`,
      mode: mode
    };
  }, []);

  useEffect(() => {
    const storedHistory = localStorage.getItem('student_socratic_chat_history_meta');
    let parsedHistory: ChatSessionMeta[] = [];
    if (storedHistory) {
      try {
        parsedHistory = JSON.parse(storedHistory);
      } catch (e) {
        console.error('Error loading history meta:', e);
      }
    }
    const unifiedHistory = listSofiConversations<Message, Slide>({ studentId }).map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      timestamp: conversation.updatedAt,
    }));
    const historyById = new Map<string, ChatSessionMeta>();
    [...unifiedHistory, ...parsedHistory].forEach((item) => {
      const existing = historyById.get(item.id);
      if (!existing || item.timestamp > existing.timestamp) {
        historyById.set(item.id, item);
      }
    });
    const mergedHistory = [...historyById.values()].sort((a, b) => b.timestamp - a.timestamp);
    setTimeout(() => setRecentHistory(mergedHistory), 0);

    const storedSaved = localStorage.getItem('student_socratic_saved_msg_ids');
    if (storedSaved) {
      try {
        const parsed = JSON.parse(storedSaved);
        setTimeout(() => setSavedMessages(parsed), 0);
      } catch (e) {
        console.error('Error loading saved message IDs:', e);
      }
    }

    const sessionActiveId = sessionStorage.getItem('student_socratic_active_session_id');
    if (sessionActiveId && !sessionActiveId.startsWith('session-')) {
      const savedSession = localStorage.getItem(`student_socratic_chat_session_${sessionActiveId}`);
      if (savedSession) {
        try {
          const parsedMessages = JSON.parse(savedSession);
          setTimeout(() => {
            setMessages(parsedMessages);
            setActiveSessionId(sessionActiveId);
          }, 0);

          const savedSlides = localStorage.getItem(`student_socratic_chat_slides_${sessionActiveId}`);
          if (savedSlides) {
            setTimeout(() => setRetrievedSlides(JSON.parse(savedSlides)), 0);
          } else {
            setTimeout(() => setRetrievedSlides([]), 0);
          }
          return;
        } catch (e) {
          console.error('Error loading active session:', e);
        }
      }
    }

    sessionStorage.removeItem('student_socratic_active_session_id');
    setTimeout(() => {
      setActiveSessionId(null);
      setMessages([getInitialMessage(activeConcept, activeMode)]);
      setRetrievedSlides([]);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = useCallback((instant = false) => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom > 120 && !instant) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: isStreamingRef.current ? 'instant' : 'smooth',
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Automatically scroll down when the user switches to the chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, scrollToBottom]);

  // Unconditionally scroll down when active session changes (opening a historical conversation)
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeSessionId, scrollToBottom]);

  const persistCurrentSession = useCallback((sessionId: string, currentMessages: Message[], currentSlides: Slide[]) => {
    saveSessionData(sessionId, currentMessages, currentSlides, setRecentHistory, { studentId });
  }, [studentId]);

  const handleNewChat = () => {
    sessionStorage.removeItem('student_socratic_active_session_id');
    setActiveSessionId(null);
    setMessages([getInitialMessage(activeConcept, activeMode)]);
    setRetrievedSlides([]);
    setActiveSlideIndex(0);
    setIsSlidePanelOpen(false);

    setToastMessage('Bắt đầu cuộc hội thoại mới!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleLoadHistory = (sessionId: string) => {
    const savedSession = localStorage.getItem(`student_socratic_chat_session_${sessionId}`);
    const unifiedSession = getSofiConversation<Message, Slide>(sessionId);
    if (savedSession || unifiedSession) {
      try {
        const parsedMessages = savedSession ? JSON.parse(savedSession) : unifiedSession?.messages || [];
        
        sessionStorage.setItem('student_socratic_active_session_id', sessionId);
        setActiveSessionId(sessionId);
        setMessages(parsedMessages);
        
        let hasSlides = false;
        const savedSlides = localStorage.getItem(`student_socratic_chat_slides_${sessionId}`);
        if (savedSlides) {
          const parsedSlides = JSON.parse(savedSlides);
          setRetrievedSlides(parsedSlides);
          hasSlides = parsedSlides.length > 0;
        } else if (unifiedSession?.slides?.length) {
          setRetrievedSlides(unifiedSession.slides);
          hasSlides = unifiedSession.slides.length > 0;
        } else {
          const lastAiMsg = [...parsedMessages].reverse().find(m => m.sender === 'ai' && m.slides);
          if (lastAiMsg && lastAiMsg.slides) {
            setRetrievedSlides(lastAiMsg.slides);
            hasSlides = lastAiMsg.slides.length > 0;
          } else {
            setRetrievedSlides([]);
          }
        }
        setActiveSlideIndex(0);
        setIsSlidePanelOpen(false);
        
        setToastMessage('Đã tải cuộc hội thoại từ lịch sử!');
        setTimeout(() => setToastMessage(null), 2000);
      } catch (e) {
        console.error('Error loading saved session:', e);
      }
    }
  };

  const handleDeleteHistory = (sessionId: string) => {
    const updatedHistory = recentHistory.filter(h => h.id !== sessionId);
    setRecentHistory(updatedHistory);
    localStorage.setItem('student_socratic_chat_history_meta', JSON.stringify(updatedHistory));
    localStorage.removeItem(`student_socratic_chat_session_${sessionId}`);
    localStorage.removeItem(`student_socratic_chat_slides_${sessionId}`);
    deleteSofiConversation(sessionId);
    
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string, action?: ChatAction) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isTyping) return;

    const userText = textToSend;
    const aiStartedAt = Date.now();
    if (!customText) {
      setInputValue('');
    }

    const userMsgId = generateMsgId('user');
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: userText,
    };
    setMessages(prev => {
      const next = [...prev, userMsg];
      setTimeout(() => persistCurrentSession(activeSessionId || '', next, retrievedSlides), 0);
      return next;
    });

    const aiMsgId = generateMsgId('ai');
    setIsTyping(true);
    isStreamingRef.current = true;

    const simulateStream = async (
      fullText: string,
      metadataProps?: Partial<Message>
    ) => {
      setMessages(prev => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: '',
          mode: activeMode,
          startedAt: aiStartedAt,
          ...metadataProps
        }
      ]);
      setIsTyping(false);

      const chunkSize = 8;
      let currentText = '';
      for (let i = 0; i < fullText.length; i += chunkSize) {
        await new Promise(resolve => setTimeout(resolve, 20));
        currentText += fullText.slice(i, i + chunkSize);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMsgId ? { ...msg, text: currentText } : msg
          )
        );
      }

      setMessages(prev => {
        const final = prev.map(msg =>
          msg.id === aiMsgId ? { ...msg, text: fullText, latencyMs: Date.now() - (msg.startedAt || aiStartedAt) } : msg
        );
        setTimeout(() => {
          persistCurrentSession(activeSessionId || '', final, metadataProps?.slides || retrievedSlides);
        }, 0);
        return final;
      });
    };

    try {
      if (action?.type === 'quiz_option_select') {
        const previousQuizMessage = [...messages]
          .reverse()
          .find((msg) => msg.sender === 'ai' && parseQuizData(msg.text));
        const quiz = previousQuizMessage ? parseQuizData(previousQuizMessage.text) : null;
        const selectedOption = quiz?.options.find((option) => option.key === action.optionKey);
        const responseText = [
          `Mình đã ghi nhận lựa chọn ${action.optionKey}: ${selectedOption?.text || action.optionText}.`,
          'Trước khi mình kết luận đúng/sai, bạn thử giải thích ngắn gọn vì sao bạn chọn đáp án này nhé.',
          quiz?.question ? `Gợi ý tự kiểm tra: câu hỏi đang hỏi về "${quiz.question}".` : null,
        ]
          .filter(Boolean)
          .join('\n\n');

        const aiMsg: Message = {
          id: aiMsgId,
          sender: 'ai',
          text: responseText,
          mode: activeMode,
          startedAt: aiStartedAt,
          latencyMs: Date.now() - aiStartedAt,
        };
        setMessages(prev => {
          const next = [...prev, aiMsg];
          setTimeout(() => persistCurrentSession(activeSessionId || '', next, retrievedSlides), 0);
          return next;
        });
        return;
      }

      const queryLower = userText.toLowerCase();

      const demoMode = isDemoMode();

      if (demoMode && ((queryLower.includes('đáp án') && !queryLower.includes('chọn đáp án')) || queryLower.includes('giải hộ') || queryLower.includes('bài lab') || queryLower.includes('bài tập'))) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const responseText = "Mình phát hiện câu hỏi này yêu cầu giải hộ bài tập hoặc lab assignment trực tiếp. Trợ lý Socratic không thể cung cấp đáp án trực tiếp cho bạn để đảm bảo tính trung thực học thuật.\n\nTuy nhiên, mình có thể gợi ý để bạn tự làm! Hãy bắt đầu bằng cách trả lời câu hỏi: Bạn đã biết cách cấu hình cổng (ports) để kết nối container ra ngoài máy vật lý chưa?";
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: responseText,
          mode: activeMode,
          isGuardrail: true,
          startedAt: aiStartedAt,
          latencyMs: Date.now() - aiStartedAt,
        };
        setMessages(prev => {
          const next = [...prev, aiMsg];
          setTimeout(() => persistCurrentSession(activeSessionId || '', next, retrievedSlides), 0);
          return next;
        });
      } else if (demoMode && (queryLower.includes('độ tin cậy') || queryLower.includes('tối ưu hiệu năng rag') || queryLower.includes('low confidence') || queryLower.includes('ngoài phạm vi'))) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const responseText = "Hệ thống RAG tìm kiếm không thấy đủ tài liệu chính thống trong Slide bài giảng để trả lời chính xác câu hỏi này.\n\nĐể đảm bảo tính chính xác học thuật, mình khuyên bạn nên tập trung hỏi về các chủ đề đã được định nghĩa trong học liệu môn học (ví dụ: Docker Basics, Docker Compose, REST API).";
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: responseText,
          mode: activeMode,
          isFallback: true,
          startedAt: aiStartedAt,
          latencyMs: Date.now() - aiStartedAt,
        };
        setMessages(prev => {
          const next = [...prev, aiMsg];
          setTimeout(() => persistCurrentSession(activeSessionId || '', next, retrievedSlides), 0);
          return next;
        });
      } else if (demoMode && (queryLower.includes('docker compose và xem slide') || queryLower.includes('docker compose & slide retrieval'))) {
        await new Promise(resolve => setTimeout(resolve, 850));
        const mockSlides = [
          {
            document_name: "batch02-day12-cloud-services-and-deployment.pdf",
            slide_number: 14,
            content: "## Docker Compose Overview\n- Compose is a tool for defining and running multi-container Docker applications.\n- Use a YAML file to configure application services.\n- Run `docker-compose up` to start all services.\n- Great for local development, staging environments, and CI/CD pipelines.",
            similarity: 0.94
          },
          {
            document_name: "batch02-day12-cloud-services-and-deployment.pdf",
            slide_number: 16,
            content: "## Docker Compose Services & Networking\n- Each container in a compose file is defined as a 'service'.\n- Compose sets up a single default network for all containers.\n- Each container can reach other containers on the network using their service name as the hostname.\n- Port mapping: map host ports to container ports dynamically.",
            similarity: 0.88
          }
        ];
        const mockCitations = [
          { source: "batch02-day12-cloud-services-and-deployment", page: 14, context_snippet: "Compose is a tool for defining and running multi-container Docker applications..." },
          { source: "batch02-day12-cloud-services-and-deployment", page: 16, context_snippet: "Each container in a compose file is defined as a 'service'..." }
        ];

        setRetrievedSlides(mockSlides);
        setActiveSlideIndex(0);

        const responseText = "<think>\n1. Phân tích yêu cầu: Sinh viên muốn giải thích về Docker Compose và xem slide bài giảng tương ứng.\n2. Mục tiêu sư phạm: Giải thích cơ chế chạy nhiều container bằng Socratic ladder (đặt câu hỏi bậc thang), không đưa cấu hình file compose hoàn chỉnh mà gợi ý từng phần.\n3. RAG Search: Truy xuất tài liệu `batch02-day12-cloud-services-and-deployment` trang 14 và 16.\n4. Triển khai: Gợi ý cho sinh viên hiểu Docker Compose hoạt động như một nhạc trưởng điều phối các container.\n</think>\nDocker Compose là một công cụ mạnh mẽ giúp bạn định nghĩa và chạy các ứng dụng Docker gồm nhiều container (multi-container Docker applications) chỉ bằng một file cấu hình duy nhất.\n\nThay vì phải chạy hàng chục lệnh `docker run` thủ công với các cấu hình mạng (networks) và ổ đĩa (volumes) phức tạp, Docker Compose cho phép bạn mô tả toàn bộ hệ thống của mình trong một file định dạng YAML (thường đặt tên là `docker-compose.yml`).\n\nĐể giúp bạn hiểu sâu hơn, hãy tưởng tượng ứng dụng của bạn có hai dịch vụ:\n1. Một Web App viết bằng Next.js.\n2. Một Cơ sở dữ liệu PostgreSQL.\n\n**Câu hỏi dành cho bạn:** Theo bạn, làm thế nào để hai container này có thể tự động nhận biết và giao tiếp được với nhau khi chúng ta khởi chạy bằng Docker Compose? Hãy chú ý tới khái niệm \"Services\" và \"Mạng nội bộ\" ở slide học liệu mình vừa mở bên phải nhé! 🦊";

        await simulateStream(responseText, {
          slides: mockSlides,
          citations: mockCitations,
          confidence_score: 0.96
        });
      } else if (demoMode && (queryLower.includes('giai thừa bằng đệ quy') || queryLower.includes('python sandbox execution'))) {
        await new Promise(resolve => setTimeout(resolve, 850));
        const responseText = "<think>\n1. Phân tích: Học sinh muốn chạy thử code Python tính giai thừa bằng đệ quy và phân tích lỗi.\n2. Sư phạm:\n   - Viết code Python tính giai thừa nhưng cố tình để đệ quy vô hạn (thiếu Base Case) để AI chạy Sandbox lỗi (RecursionError) và dẫn dắt học sinh tự tìm cách sửa.\n3. Kích hoạt Sandbox tool: Chạy đoạn mã python lỗi đệ quy.\n</think>\nMình đã chạy thử mã nguồn Python tính giai thừa của bạn trong môi trường Sandbox của Edu Gap.\n\nNhư bạn có thể thấy ở log chạy code phía dưới, hệ thống báo lỗi **`RecursionError: maximum recursion depth exceeded`** (Vượt quá giới hạn độ sâu đệ quy).\n\nHãy quan sát đoạn mã Python mình đã chạy thử:\n```python\ndef factorial(n):\n    # Bạn có nhận ra hàm này thiếu phần điều kiện dừng quan trọng nào không?\n    return n * factorial(n - 1)\n\nprint(factorial(5)) \n```\n\n**Câu hỏi dành cho bạn:** Tại sao chương trình không thể dừng lại mà cứ liên tục gọi chính nó? Chúng ta cần bổ sung thêm điều kiện gì (Base Case) cho biến `n` để dừng việc gọi đệ quy khi `n` giảm dần? 🦊";

        await simulateStream(responseText, {
          confidence_score: 0.92,
          sandboxRun: {
            status: 'failed',
            code: 'def factorial(n):\n    return n * factorial(n - 1)\n\nprint(factorial(5))',
            output: 'Traceback (most recent call last):\n  File "sandbox.py", line 4, in <module>\n    print(factorial(5))\n  File "sandbox.py", line 2, in factorial\n    return n * factorial(n - 1)\n  [Previous line repeated 996 times]\nRecursionError: maximum recursion depth exceeded in comparison',
            execution_time_ms: 120
          }
        });

      } else {
        const mappedConceptId = CONCEPT_UUID_MAP[activeConcept] || undefined;
        const formattedMode = activeMode.charAt(0).toUpperCase() + activeMode.slice(1);
        let finalPayload: any = null;

        setMessages(prev => {
          if (prev.some(msg => msg.id === aiMsgId)) return prev;
          return [
            ...prev,
            {
              id: aiMsgId,
              sender: 'ai',
              text: '',
              thinkingSteps: ['Đang kết nối luồng trả lời...'],
              traceSteps: [createThoughtStep('Đang kết nối luồng trả lời...')],
              mode: activeMode,
              startedAt: aiStartedAt,
            }
          ];
        });

        await streamChatRequest(
          {
            message: userText,
            student_id: studentId || undefined,
            course_id: COURSE_UUID,
            concept_id: mappedConceptId,
            mode: formattedMode,
            session_id: activeSessionId || undefined,
          },
          {
            onThinking: (text) => {
              if (!text) return;
              setMessages(prev => {
                const messageExists = prev.some(msg => msg.id === aiMsgId);
                if (messageExists) {
                  return prev.map(msg => {
                    if (msg.id !== aiMsgId) return msg;
                    const steps = msg.thinkingSteps || [];
                    if (steps[steps.length - 1] === text) {
                      return msg;
                    }
                    const traceSteps = msg.traceSteps || [];
                    return { 
                      ...msg, 
                      thinkingSteps: [...steps, text],
                      thinkingText: (msg.thinkingText || '') + text + '\n',
                      traceSteps: [...traceSteps, createThoughtStep(text)],
                      startedAt: msg.startedAt || aiStartedAt,
                    };
                  });
                } else {
                  const traceStep = createThoughtStep(text);
                  return [
                    ...prev,
                    {
                      id: aiMsgId,
                      sender: 'ai',
                      text: '',
                      thinkingSteps: [text],
                      thinkingText: text + '\n',
                      traceSteps: [traceStep],
                      mode: activeMode,
                      startedAt: aiStartedAt,
                    }
                  ];
                }
              });
            },
            onToolCall: ({ toolName, args }) => {
              if (!toolName) return;
              setMessages(prev => {
                const messageExists = prev.some(msg => msg.id === aiMsgId);
                const newToolRun = {
                  toolName,
                  args,
                  result: null,
                  status: 'running' as const,
                  startedAt: Date.now(),
                };
                const newTraceStep = createToolStep(toolName, args);
                if (messageExists) {
                  return prev.map(msg => {
                    if (msg.id !== aiMsgId) return msg;
                    const toolRuns = msg.toolRuns ? [...msg.toolRuns, newToolRun] : [newToolRun];
                    const traceSteps = msg.traceSteps ? [...msg.traceSteps, newTraceStep] : [newTraceStep];
                    return { ...msg, toolRuns, traceSteps };
                  });
                } else {
                  return [
                    ...prev,
                    {
                      id: aiMsgId,
                      sender: 'ai',
                      text: '',
                      toolRuns: [newToolRun],
                      traceSteps: [newTraceStep],
                      mode: activeMode,
                      startedAt: aiStartedAt,
                    }
                  ];
                }
              });
            },
            onToolResult: ({ toolName, output, durationMs }) => {
              if (!toolName) return;
              setMessages(prev => {
                const messageExists = prev.some(msg => msg.id === aiMsgId);
                if (messageExists) {
                  return prev.map(msg => {
                    if (msg.id !== aiMsgId) return msg;
                    const isErrorOutput =
                      typeof output === 'object' &&
                      output !== null &&
                      'error' in output;
                    const toolRuns = msg.toolRuns
                      ? msg.toolRuns.map(run =>
                          run.toolName === toolName && run.status === 'running'
                            ? {
                                ...run,
                                result: output,
                                status: isErrorOutput ? 'error' as const : 'success' as const,
                                durationMs: durationMs ?? Date.now() - (run.startedAt || aiStartedAt),
                              }
                            : run
                        )
                      : [];
                    let matchedTool = false;
                    const traceSteps = (msg.traceSteps || []).map((step) => {
                      if (
                        !matchedTool &&
                        step.kind === 'tool' &&
                        step.toolName === toolName &&
                        step.status === 'running'
                      ) {
                        matchedTool = true;
                        const resolvedDurationMs =
                          durationMs ?? Date.now() - (step.startedAt || aiStartedAt);
                        return {
                          ...step,
                          content: isErrorOutput ? 'Công cụ trả về lỗi.' : 'Đã nhận kết quả từ công cụ.',
                          output,
                          durationMs: resolvedDurationMs,
                          status: isErrorOutput ? 'error' as const : 'completed' as const,
                          errorCode: isErrorOutput ? 'tool_result_error' : undefined,
                        };
                      }
                      return step;
                    });
                    const nextTraceSteps = matchedTool
                      ? traceSteps
                      : [
                          ...traceSteps,
                          createObservationStep(
                            toolName,
                            isErrorOutput ? 'Công cụ trả về lỗi.' : 'Đã nhận kết quả từ công cụ.',
                            output,
                            durationMs,
                          ),
                        ];
                    return { ...msg, toolRuns, traceSteps: nextTraceSteps };
                  });
                }
                return prev;
              });
            },
            onDelta: (delta) => {
              if (!delta) return;
              setMessages(prev =>
                prev.some(msg => msg.id === aiMsgId)
                  ? prev.map(msg =>
                      msg.id === aiMsgId ? { ...msg, text: (msg.text || '') + delta } : msg,
                    )
                  : [...prev, { id: aiMsgId, sender: 'ai', text: delta, mode: activeMode }],
              );
            },
            onDone: (payload) => {
              finalPayload = payload;
            },
          },
        );

        const data = finalPayload || { response: '' };
        const sessionUuid = data.session_id || activeSessionId;

        if (sessionUuid && sessionUuid !== activeSessionId) {
          sessionStorage.setItem('student_socratic_active_session_id', sessionUuid);
          setActiveSessionId(sessionUuid);
        }

        const { slides, citations, confidenceScore } = buildChatArtifacts(data);

        if (slides.length > 0) {
          setRetrievedSlides(slides);
          setActiveSlideIndex(0);
        }

        const finalSlides = slides.length > 0 ? slides : retrievedSlides;
        setMessages(prev => {
          const next = prev.map(msg => {
            if (msg.id !== aiMsgId) return msg;
            return {
              ...msg,
              text: data.response || msg.text || 'Mình đang phân tích câu hỏi của bạn. Bạn có thể làm rõ hơn không?',
              mode: activeMode,
                  citations: citations.length > 0 ? citations : undefined,
                  confidence_score: confidenceScore,
                  slides: slides.length > 0 ? slides : undefined,
                  startedAt: msg.startedAt || aiStartedAt,
                  latencyMs: Date.now() - (msg.startedAt || aiStartedAt),
                };
          });
          setTimeout(() => saveSessionData(sessionUuid || '', next, finalSlides, setRecentHistory, {
            studentId,
            conceptId: mappedConceptId,
            sourceRef: { type: mappedConceptId ? 'node' : 'general', id: mappedConceptId || activeConcept, label: activeConcept },
          }), 0);
          return next;
        });
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      isStreamingRef.current = false;
      const errorMsg: Message = {
        id: generateMsgId('ai-err'),
        sender: 'ai',
        text: 'Hệ thống gặp sự cố khi xử lý dữ liệu RAG. Vui lòng đảm bảo backend FastAPI server đã chạy và thử lại nhé! 🦊',
        mode: activeMode,
        startedAt: aiStartedAt,
        latencyMs: Date.now() - aiStartedAt,
      };
      setMessages(prev => {
        const next = [...prev.filter(msg => msg.id !== aiMsgId), errorMsg];
        setTimeout(() => saveSessionData(activeSessionId || '', next, retrievedSlides, setRecentHistory, { studentId }), 0);
        return next;
      });
    } finally {
      isStreamingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setMessages(prev => {
      const next = prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isFeedbackGiven: msg.isFeedbackGiven === type ? null : type } 
          : msg
      );
      setTimeout(() => saveSessionData(activeSessionId || '', next, retrievedSlides, setRecentHistory, { studentId }), 0);
      return next;
    });
  };

  const handleSelectConcept = (concept: Concept) => {
    setActiveConcept(concept.id);
    
    sessionStorage.removeItem('student_socratic_active_session_id');
    setActiveSessionId(null);
    
    setMessages([getInitialMessage(concept.id, activeMode)]);
    setRetrievedSlides([]);
    setActiveSlideIndex(0);
  };

  const handleTabClick = (tabId: TabType) => {
    if (tabId === 'profile' && !loggedIn) {
      onOpenAuth('signup');
    } else {
      setActiveTab(tabId);
    }
  };

  return {
    activeConcept,
    setActiveConcept,
    activeMode,
    setActiveMode,
    searchQuery,
    setSearchQuery,
    inputValue,
    setInputValue,
    isTyping,
    savedMessages,
    toastMessage,
    setToastMessage,
    activeSessionId,
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
    handleSelectConcept,
    handleTabClick,
    scrollToBottom
  };
};
