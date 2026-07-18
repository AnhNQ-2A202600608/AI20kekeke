"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Brain,
  ChatsCircle,
  PaperPlaneTilt,
  Plus,
  ChatCircle,
  Trash,
} from "@phosphor-icons/react";
import { Check, GraduationCap } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useSocraticChat } from "@/components/dashboard/socratic-chat/student/hooks/useSocraticChat";
import { useBoundStore } from "@/hooks/useBoundStore";
import { subjects } from "../data";
import { parseQuizData, parseThinkingProcess } from "@/components/dashboard/socratic-chat/student/utils/parser";

interface ChatGPTMessageContentProps {
  message: any;
  onSelectOption: (option: { key: string; text: string }) => void;
}

function ChatGPTMessageContent({ message, onSelectOption }: ChatGPTMessageContentProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { response } = useMemo(
    () => parseThinkingProcess(message.text),
    [message.text]
  );
  
  const quiz = useMemo(() => parseQuizData(response || message.text), [response, message.text]);

  const handleChoiceClick = (key: string, text: string) => {
    if (selectedKey) return;
    setSelectedKey(key);
    onSelectOption({ key, text });
  };

  if (quiz) {
    const textToSearch = response || message.text;
    const matchOption = textToSearch.match(/(?:^|\n)\s*[-*]?\s*(?:\*\*)?([A-E])[.)\:]/i);
    const firstOptionIndex = matchOption ? textToSearch.indexOf(matchOption[0]) : -1;
    const textBeforeOptions = firstOptionIndex !== -1 ? textToSearch.substring(0, firstOptionIndex).trim() : textToSearch.trim();
    const lines = textBeforeOptions.split('\n');
    const introText = lines.slice(0, -1).join('\n').trim();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
        {introText && (
          <span className="chatgpt-message-text" style={{ whiteSpace: "pre-line" }}>
            {introText}
          </span>
        )}
        <div 
          style={{ 
            width: "100%", 
            display: "flex", 
            flexDirection: "column", 
            gap: "16px", 
            borderRadius: "16px", 
            border: "1px solid var(--line-strong)", 
            backgroundColor: "var(--surface-soft)", 
            padding: "18px",
            marginTop: "4px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-dark)", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <GraduationCap size={16} />
            <span>Câu hỏi củng cố kiến thức</span>
          </div>
          <h4 style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.5, margin: 0 }}>
            {quiz.question}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {quiz.options.map((opt) => {
              const isSelected = selectedKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={selectedKey !== null}
                  onClick={() => handleChoiceClick(opt.key, opt.text)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: isSelected ? "2px solid var(--accent)" : "1px solid var(--line-strong)",
                    backgroundColor: isSelected ? "var(--accent-soft)" : "#ffffff",
                    color: isSelected ? "var(--accent-dark)" : "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: selectedKey !== null ? "default" : "pointer",
                    opacity: selectedKey !== null && !isSelected ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span 
                      style={{ 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "8px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: "0.75rem", 
                        fontWeight: 800,
                        backgroundColor: isSelected ? "var(--accent)" : "var(--surface-soft)",
                        color: isSelected ? "#ffffff" : "var(--muted)",
                      }}
                    >
                      {opt.key}
                    </span>
                    <span style={{ lineHeight: 1.4 }}>{opt.text}</span>
                  </span>
                  {isSelected && <Check size={14} style={{ color: "var(--accent-dark)", strokeWidth: 3 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <span className="chatgpt-message-text">{response || message.text}</span>;
}


function AiQuestionPageContent() {
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  
  const loggedIn = useBoundStore((state) => state.loggedIn);

  const {
    messages,
    recentHistory,
    activeSessionId,
    inputValue,
    setInputValue,
    isTyping,
    handleNewChat,
    handleLoadHistory,
    handleDeleteHistory,
    handleSendMessage,
    chatScrollRef,
  } = useSocraticChat({
    setActiveTab: () => {},
    loggedIn,
    onOpenAuth: () => {},
    activeTab: "chat",
    courseId: selectedSubject.courseId,
  });

  return (
    <div className="chatgpt-layout">
        {/* Left History Sidebar */}
        <aside className="chatgpt-sidebar">
          <button className="chatgpt-new-chat" onClick={handleNewChat}>
            <Plus size={16} weight="bold" />
            <span>Đoạn chat mới</span>
          </button>
          
          <div className="chatgpt-history-title">Lịch sử trò chuyện</div>
          
          <div className="chatgpt-history-list">
            {recentHistory.map((session) => (
              <div
                key={session.id}
                className={`chatgpt-history-item-container ${session.id === activeSessionId ? "active" : ""}`}
              >
                <button
                  className="chatgpt-history-item"
                  onClick={() => handleLoadHistory(session.id)}
                  style={{ flex: 1, border: "none", background: "transparent", padding: 0 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <ChatCircle size={14} weight={session.id === activeSessionId ? "fill" : "regular"} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {session.title}
                    </span>
                  </div>
                </button>
                <button
                  className="chatgpt-history-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteHistory(session.id);
                  }}
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Main Chat Area */}
        <main className="chatgpt-main">
          {/* Header */}
          <div className="chatgpt-header">
            <span className="chatgpt-header-title">Lucy · Trợ lý giải đáp</span>
            <span className="mode-pill" style={{ margin: 0 }}>
              {isTyping ? "Lucy đang suy nghĩ..." : "AI sẵn sàng"}
            </span>
          </div>

          {/* Messages Thread */}
          <div className="chatgpt-thread-container" ref={chatScrollRef}>
            <div className="chatgpt-thread">
              {messages.map((message, index) => {
                const { thought, response } = parseThinkingProcess(message.text);
                const displayThinking = message.thinkingText || thought;
                return (
                  <div className="chatgpt-message" key={message.id || index}>
                    <div className={`chatgpt-avatar ${message.sender === "user" ? "user" : ""}`}>
                      {message.sender === "user" ? "U" : "AI"}
                    </div>
                    <div className="chatgpt-message-content">
                      <span className="chatgpt-message-sender">
                        {message.sender === "user" ? "Bạn" : "Lucy"}
                      </span>
                      {message.sender === "ai" && displayThinking && (
                        <details className="chatgpt-message-thinking-details">
                          <summary className="chatgpt-message-thinking-summary">
                            💡 Xem tiến trình suy nghĩ của Lucy
                          </summary>
                          <div className="chatgpt-message-thinking">
                            {displayThinking}
                          </div>
                        </details>
                      )}
                      {message.sender === "ai" ? (
                        <ChatGPTMessageContent 
                          message={message} 
                          onSelectOption={(option) => {
                            handleSendMessage(
                              undefined,
                              `Mình chọn đáp án ${option.key}: ${option.text}`,
                              { type: 'quiz_option_select', optionKey: option.key, optionText: option.text }
                            );
                          }}
                        />
                      ) : (
                        <span className="chatgpt-message-text">{message.text}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer & Input */}
          <div className="chatgpt-footer">
            {/* Quick Suggestions */}
            <div className="chatgpt-quick-prompts">
              {(
                selectedSubjectCode === "history-geography"
                  ? ["Đặc điểm địa hình Việt Nam là gì?", "Hãy giải thích sự hình thành mưa đá", "Khí hậu nhiệt đới có đặc điểm gì?"]
                  : ["Vì sao phải quy đồng mẫu số?", "Đặc điểm địa hình Việt Nam là gì?", "Số hữu tỉ là gì?"]
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chatgpt-quick-prompt-btn"
                  onClick={() => handleSendMessage(undefined, item)}
                  disabled={isTyping}
                >
                  <ChatsCircle size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                  {item}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form className="chatgpt-input-container" onSubmit={(e) => handleSendMessage(e)}>
              <input
                className="chatgpt-input"
                aria-label="Nhập câu hỏi học tập"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi về bài học..."
                disabled={isTyping}
              />
              <button className="chatgpt-submit-btn" type="submit" aria-label="Gửi câu hỏi" disabled={isTyping}>
                <PaperPlaneTilt size={16} weight="fill" />
              </button>
            </form>
          </div>
        </main>
      </div>
  );
}

export default function AiQuestionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải Lucy AI...</div>}>
      <AppShell>
        <AiQuestionPageContent />
      </AppShell>
    </Suspense>
  );
}
