"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpenText, Brain, ChatCircleDots, ClockCounterClockwise, PaperPlaneTilt, Plus, Sparkle, X } from "@phosphor-icons/react";
import { AppShell } from "../components/AppShell";
import { ApiClientError, askTutor } from "../lib/api-client";
import {
  appendChatMessage,
  createChatSession,
  deleteChatSession,
  saveBackendChatSessionId,
  StoredChatMessage,
  StoredChatSession,
  useChatSessions,
} from "../lib/chat-sessions";
import { useAuthSession } from "../lib/session";
import { subjectPrograms, subjects } from "../data";

function openingMessage(chapterTitle: string): StoredChatMessage {
  return {
    role: "ai",
    text: `Mình là Trợ lý AI. Bạn đang học ${chapterTitle}. Hãy gửi câu hỏi, mình sẽ giải thích từng bước và gợi ý phần cần ôn tiếp theo.`,
  };
}

function sessionPreview(session: StoredChatSession) {
  return [...session.messages].reverse().find((message) => message.role === "user")?.text
    || session.messages.at(-1)?.text
    || "Cuộc trò chuyện mới";
}

function sessionMeta(updatedAt: string) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "Đã lưu";
  const now = new Date();
  return date.toDateString() === now.toDateString() ? "Hôm nay" : `${date.getDate()}/${date.getMonth() + 1}`;
}

export default function AiQuestionPage() {
  const searchParams = useSearchParams();
  const authSession = useAuthSession();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const activeChapter = program.chapters.find((chapter) => chapter.active) || program.chapters[0];
  const chatSessions = useChatSessions(selectedSubject.code);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const [question, setQuestion] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const openingMessages = useMemo(() => [openingMessage(activeChapter.title)], [activeChapter.title]);
  const activeSession = chatSessions.find((session) => session.id === activeConversationId) || null;
  const messages = activeSession?.messages || openingMessages;

  const selectConversation = (sessionId: string) => {
    activeConversationIdRef.current = sessionId;
    setActiveConversationId(sessionId);
    setQuestion("");
  };

  const startNewConversation = () => {
    activeConversationIdRef.current = null;
    setActiveConversationId(null);
    setQuestion("");
  };

  const removeConversation = (sessionId: string) => {
    deleteChatSession(sessionId);
    if (activeConversationIdRef.current === sessionId) startNewConversation();
  };

  const ensureChatSession = (prompt: string) => {
    const currentSessionId = activeConversationIdRef.current;
    const currentSession = currentSessionId ? chatSessions.find((session) => session.id === currentSessionId) : null;
    if (currentSession) return { session: currentSession, isNew: false };

    const session = createChatSession({
      subjectCode: selectedSubject.code,
      chapterTitle: activeChapter.title,
      firstUserMessage: prompt,
      initialMessages: [...openingMessages, { role: "user", text: prompt }],
    });
    activeConversationIdRef.current = session.id;
    setActiveConversationId(session.id);
    return { session, isNew: true };
  };

  const handleAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || isReplying) return;

    setQuestion("");
    const { session, isNew } = ensureChatSession(prompt);
    if (!isNew) appendChatMessage(session.id, { role: "user", text: prompt });

    if (!authSession) {
      appendChatMessage(session.id, {
        role: "ai",
        text: "Hãy đăng nhập để mình có thể dùng tiến độ học của bạn và lưu cuộc trò chuyện này vào phiên học.",
      });
      return;
    }

    setIsReplying(true);
    try {
      const reply = await askTutor({
        token: authSession.token,
        studentId: authSession.user.id,
        message: prompt,
        sessionId: session.backendSessionId,
        mode: "Explain",
      });
      saveBackendChatSessionId(session.id, reply.session_id);
      
      const valCit = reply.metadata?.citation_validation as { valid_citations?: [string, number][] } | undefined;
      const citations = (valCit?.valid_citations && Array.isArray(valCit.valid_citations))
        ? valCit.valid_citations.map(([source, page]) => ({ source, page }))
        : [];
        
      appendChatMessage(session.id, { role: "ai", text: reply.response, citations });
    } catch (requestError) {
      const message = requestError instanceof ApiClientError
        ? requestError.message
        : "Trợ lý AI chưa thể phản hồi lúc này. Vui lòng thử lại.";
      appendChatMessage(session.id, { role: "ai", text: message });
    } finally {
      setIsReplying(false);
    }
  };

  const suggestions = [
    "Giải thích bằng ví dụ đơn giản",
    "Chỉ ra lỗi sai thường gặp",
    "Tạo 3 câu luyện tập ngắn",
  ];

  return (
    <AppShell compact>
      <main className="ai-chat-page">
        <aside className="ai-history-panel" aria-label="Lịch sử trò chuyện">
          <div className="ai-history-head">
            <div><span>Lịch sử chat</span><strong>Trợ lý AI</strong></div>
            <button type="button" onClick={startNewConversation} aria-label="Tạo cuộc trò chuyện mới" title="Cuộc trò chuyện mới"><Plus size={17} weight="bold" /></button>
          </div>
          <div className="ai-history-list">
            {chatSessions.length === 0 ? (
              <div className="ai-history-empty"><ChatCircleDots size={20} weight="regular" /><strong>Chưa có cuộc trò chuyện</strong><span>Gửi câu hỏi đầu tiên để lưu phiên học tại đây.</span></div>
            ) : chatSessions.map((session) => (
              <div className="ai-history-item" key={session.id}>
                <button className={`ai-history-session ${activeConversationId === session.id ? "active" : ""}`} type="button" onClick={() => selectConversation(session.id)}>
                  <ChatCircleDots size={17} weight={activeConversationId === session.id ? "fill" : "regular"} />
                  <span><strong>{session.title}</strong><small>{sessionPreview(session)}</small><em>{sessionMeta(session.updatedAt)}</em></span>
                </button>
                <button className="ai-history-delete" type="button" onClick={() => removeConversation(session.id)} aria-label={`Xóa cuộc trò chuyện ${session.title}`} title="Xóa cuộc trò chuyện"><X size={14} weight="bold" /></button>
              </div>
            ))}
          </div>
          <div className="ai-history-note"><ClockCounterClockwise size={16} /><span>{authSession ? "Các cuộc trò chuyện được lưu theo từng phiên học của bạn." : "Đăng nhập để đồng bộ cuộc trò chuyện với phiên học."}</span></div>
        </aside>

        <section className="ai-chat-surface" aria-label="Bảng chat với Trợ lý AI">
          <header className="ai-chat-titlebar">
            <div className="ai-assistant-mark"><Brain size={23} weight="fill" /></div>
            <div><span>Trợ lý học tập</span><h1>{program.assistantName}</h1><p>{selectedSubject.name} · {activeChapter.title}</p></div>
            <span className={`ai-online-status ${authSession ? "" : "preview"}`}><Sparkle size={14} weight="fill" />{authSession ? "Đã kết nối" : "Chế độ xem trước"}</span>
          </header>

          <div className="ai-chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`ai-message ${message.role}`} key={`${message.role}-${index}`}>
                <div className="message-text">{message.text}</div>
                {message.role === "ai" && message.citations && message.citations.length > 0 && (
                  <div className="ai-citations-list">
                    <span className="ai-citations-title">Nguồn tài liệu tham khảo:</span>
                    <div className="ai-citations-container">
                      {message.citations.map((cit, cIdx) => (
                        <span key={cIdx} className="ai-citation-item">
                          📄 {cit.source} (Trang {cit.page})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isReplying && <div className="ai-message ai pending">Trợ lý AI đang chuẩn bị lời giải...</div>}
          </div>

          <div className="ai-suggestion-row" aria-label="Gợi ý câu hỏi">
            {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}
          </div>

          <form className="ai-chat-composer" onSubmit={handleAsk}>
            <BookOpenText size={19} weight="regular" />
            <input aria-label="Nhập câu hỏi cho Trợ lý AI" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={`Hỏi về ${activeChapter.title.toLowerCase()}...`} />
            <button type="submit" disabled={!question.trim() || isReplying} aria-label="Gửi câu hỏi"><PaperPlaneTilt size={18} weight="fill" /><span>Gửi</span></button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}