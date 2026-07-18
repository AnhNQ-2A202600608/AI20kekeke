"use client";

import Link from "next/link";
import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  ChatsCircle,
  FileText,
  PaperPlaneTilt,
  Sparkle,
  CircleNotch,
} from "@phosphor-icons/react";
import { AppShell } from "../components/AppShell";
import { subjectPrograms, subjects } from "../data";

// Import KaTeX styles for formula rendering
import katex from "katex";
import "katex/dist/katex.min.css";

type SpeakerMode = "ai" | "user";
type RegionId = "concept" | "method" | "example";

const regionLayout: Record<RegionId, { left: string; top: string; width: string; height: string }> = {
  concept: { left: "8%", top: "47%", width: "38%", height: "23%" },
  method: { left: "53%", top: "31%", width: "38%", height: "31%" },
  example: { left: "8%", top: "75%", width: "83%", height: "16%" },
};

const aiSubjectContent = {
  TO: {
    signals: ["phân số", "hữu tỉ", "quy đồng", "mẫu số", "tỉ lệ", "biểu thức", "đại số"],
    quickQuestions: ["Vì sao phải quy đồng mẫu số?", "Giải giúp em ví dụ 2/3 + 1/4", "Bài này thuộc phần kiến thức nào?"],
    regions: [
      { id: "concept", label: "Khái niệm", title: "Điểm cần nhớ", detail: "Xác định mẫu số, tử số và điều kiện để hai phân số có thể so sánh hoặc tính toán." },
      { id: "method", label: "Cách làm", title: "Quy đồng mẫu", detail: "Tìm mẫu chung, đổi tử số theo cùng hệ số, rồi mới thực hiện phép tính." },
      { id: "example", label: "Ví dụ", title: "2/3 + 1/4", detail: "Mẫu chung là 12, nên 2/3 = 8/12 và 1/4 = 3/12." },
    ],
  },
  NV: {
    signals: ["đọc hiểu", "chủ đề", "luận điểm", "dẫn chứng", "nghị luận", "biện pháp tu từ"],
    quickQuestions: ["Làm sao tìm chủ đề văn bản?", "Giúp em lập luận điểm cho đoạn văn", "Dẫn chứng này dùng thế nào?"],
    regions: [
      { id: "concept", label: "Ý chính", title: "Chủ đề văn bản", detail: "Tìm chi tiết lặp lại, thái độ người viết và thông điệp được nhấn mạnh." },
      { id: "method", label: "Cách làm", title: "Luận điểm - dẫn chứng", detail: "Nêu ý chính trước, chọn dẫn chứng sát ý, rồi giải thích vì sao dẫn chứng đó thuyết phục." },
      { id: "example", label: "Ví dụ", title: "Đoạn nghị luận ngắn", detail: "Một câu nêu luận điểm, hai câu triển khai dẫn chứng, một câu kết lại nhận xét." },
    ],
  },
  TA: {
    signals: ["present perfect", "tense", "reading", "skimming", "scanning", "speaking", "grammar"],
    quickQuestions: ["When do I use Present Perfect?", "Help me scan this reading question", "Fix this grammar mistake"],
    regions: [
      { id: "concept", label: "Grammar", title: "Tense signal", detail: "Look for time markers, finished/unfinished actions, and the speaker's intent." },
      { id: "method", label: "Strategy", title: "Read the context", detail: "Underline keywords, identify the question type, then choose the matching sentence." },
      { id: "example", label: "Example", title: "have / has + V3", detail: "I have finished the task. She has visited this place before." },
    ],
  },
  KH: {
    signals: ["lực", "chuyển động", "vận tốc", "năng lượng", "thí nghiệm", "hệ sinh thái"],
    quickQuestions: ["Vì sao vật thay đổi chuyển động?", "Giải thích lực trong ví dụ này", "Thí nghiệm này kết luận gì?"],
    regions: [
      { id: "concept", label: "Hiện tượng", title: "Quan sát chính", detail: "Xác định vật đang chịu tác dụng gì và đại lượng nào thay đổi." },
      { id: "method", label: "Mô hình", title: "Lực và chuyển động", detail: "Mô tả hướng lực, độ lớn tương đối và kết quả quan sát được." },
      { id: "example", label: "Thí nghiệm", title: "Kéo xe nhỏ", detail: "Lực kéo lớn hơn làm xe tăng tốc rõ hơn nếu các điều kiện khác giữ nguyên." },
    ],
  },
} as const;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

// Helper to render Math (LaTeX) and basic inline markdown (bold, code)
function renderMathAndText(text: string): React.ReactNode[] {
  if (!text) return [];

  // Split by LaTeX block math \[...\] and inline math \(...\)
  const regex = /(\\\[[\s\S]*?\\\]|\\\(.*?\\\))/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    // Render block math \[ ... \]
    if (part.startsWith("\\[") && part.endsWith("\\]")) {
      const math = part.slice(2, -2).trim();
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        return <div key={idx} dangerouslySetInnerHTML={{ __html: html }} className="my-3 overflow-x-auto text-center" />;
      } catch {
        return <pre key={idx} className="text-rose-500 whitespace-pre-wrap">{math}</pre>;
      }
    }
    // Render inline math \( ... \)
    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      const math = part.slice(2, -2).trim();
      try {
        const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <code key={idx} className="text-rose-500">{math}</code>;
      }
    }

    // Parse standard inline markdown segments: **bold** and `code`
    const segments = part.split(/(\*\*.*?\*\*|`.*?`)/g);
    return (
      <React.Fragment key={idx}>
        {segments.map((seg, sIdx) => {
          if (seg.startsWith("**") && seg.endsWith("**")) {
            return (
              <strong key={sIdx} className="font-extrabold text-stone-900">
                {seg.slice(2, -2)}
              </strong>
            );
          }
          if (seg.startsWith("`") && seg.endsWith("`")) {
            return (
              <code key={sIdx} className="bg-stone-100 text-rose-600 px-1.5 py-0.5 rounded font-mono text-[11px] border border-stone-200">
                {seg.slice(1, -1)}
              </code>
            );
          }
          return seg;
        })}
      </React.Fragment>
    );
  });
}

// Lightweight Markdown block-level renderer that parses lists, paragraphs and headers
const SocraticMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Code block detection
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre 
            key={`codeblock-${lineIdx}`} 
            className="bg-stone-900 text-stone-200 p-3.5 rounded-xl border border-stone-800 font-mono text-[11px] overflow-x-auto whitespace-pre my-3 max-w-full shadow-inner leading-relaxed"
          >
            <code className={codeBlockLang ? `language-${codeBlockLang}` : ""}>
              {codeBlockLines.join("\n")}
            </code>
          </pre>
        );
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // List item detection
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(
        <li key={`li-${lineIdx}`} className="ml-4 list-disc pl-1 leading-relaxed text-stone-850">
          {renderMathAndText(trimmed.substring(2))}
        </li>
      );
      return;
    }

    if (inList) {
      elements.push(
        <ul key={`ul-${lineIdx}`} className="space-y-1.5 my-2.5">
          {[...listItems]}
        </ul>
      );
      listItems = [];
      inList = false;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${lineIdx}`} className="text-xs md:text-sm font-bold text-stone-900 mt-4 mb-1.5">
          {renderMathAndText(trimmed.substring(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${lineIdx}`} className="text-sm md:text-base font-bold text-stone-900 mt-5 mb-2">
          {renderMathAndText(trimmed.substring(3))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${lineIdx}`} className="text-base md:text-lg font-bold text-stone-900 mt-6 mb-3">
          {renderMathAndText(trimmed.substring(2))}
        </h2>
      );
      return;
    }

    // Standalone block math
    if (trimmed.startsWith("\\[") && trimmed.endsWith("\\]")) {
      const math = trimmed.slice(2, -2).trim();
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        elements.push(<div key={`mathblock-${lineIdx}`} dangerouslySetInnerHTML={{ __html: html }} className="my-4 overflow-x-auto text-center" />);
      } catch {
        elements.push(<pre key={`mathblock-${lineIdx}`} className="text-rose-500 whitespace-pre-wrap">{math}</pre>);
      }
      return;
    }

    // Spacer or normal paragraph
    if (trimmed.length === 0) {
      elements.push(<div key={`space-${lineIdx}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${lineIdx}`} className="leading-relaxed text-stone-850 mb-2">
          {renderMathAndText(line)}
        </p>
      );
    }
  });

  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="ul-end" className="space-y-1.5 my-2.5">
        {listItems}
      </ul>
    );
  }

  return <div className="space-y-1">{elements}</div>;
};

interface MCQOption {
  key: string;
  text: string;
}

function parseMCQOptions(text: string): MCQOption[] {
  if (!text) return [];
  const lines = text.split("\n");
  const options: MCQOption[] = [];
  const optionRegex = /^\s*([A-F])\s*[\u0029\u002e\uFF09]\s*(.*)$/i;

  for (const line of lines) {
    const match = line.match(optionRegex);
    if (match) {
      options.push({
        key: match[1].toUpperCase(),
        text: match[2].trim()
      });
    }
  }

  if (options.length >= 2) {
    const keys = options.map(o => o.key);
    if (keys.includes("A") && keys.includes("B")) {
      return options;
    }
  }
  return [];
}

const BACKEND_URL = "http://127.0.0.1:8000";

function AiQuestionContent() {
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const aiContent = aiSubjectContent[selectedSubject.code as keyof typeof aiSubjectContent] || aiSubjectContent.TO;
  const slideRegions = aiContent.regions.map((region) => ({ ...region, style: regionLayout[region.id] }));
  const ProgramChapter = program.chapters.find((chapter) => chapter.active) || program.chapters[0];
  const [speakerMode, setSpeakerMode] = useState<SpeakerMode>("ai");
  const [question, setQuestion] = useState("");
  const [activeRegion, setActiveRegion] = useState<RegionId>("method");
  const [matchedChapterNumber, setMatchedChapterNumber] = useState<string>(ProgramChapter.number);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Mình đang mở dữ liệu ${program.title} - ${ProgramChapter.title}. Hỏi bài ở đây, mình sẽ dùng AI Socratic để hướng dẫn em từng bước.`,
    },
  ]);

  useEffect(() => {
    setMatchedChapterNumber(ProgramChapter.number);
    setActiveRegion("method");
    setQuestion("");
    setSpeakerMode("ai");
    setIsLoading(false);
    setSessionId(null);
    setMessages([
      {
        role: "ai",
        text: `Mình đang mở dữ liệu ${program.title} - ${ProgramChapter.title}. Hỏi bài ở đây, mình sẽ dùng AI Socratic để hướng dẫn em từng bước.`,
      },
    ]);
  }, [ProgramChapter.number, ProgramChapter.title, program.title, selectedSubject.code]);

  const matchedChapter = useMemo(
    () => program.chapters.find((chapter) => chapter.number === matchedChapterNumber) || ProgramChapter,
    [ProgramChapter, matchedChapterNumber, program.chapters],
  );

  const detectedSignal = useMemo(() => {
    const haystack = normalizeText(`${question} ${matchedChapter.title} ${matchedChapter.summary}`);
    return aiContent.signals.find((signal) => haystack.includes(normalizeText(signal))) || matchedChapter.title;
  }, [aiContent.signals, matchedChapter.summary, matchedChapter.title, question]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const callBackendChat = useCallback(async (userMessage: string) => {
    setIsLoading(true);

    try {
      // Call backend API directly with dev token (mock student UUID)
      const MOCK_STUDENT_ID = "d3b07384-d113-4ec5-a58e-0f2d87e07661";
      const MOCK_COURSE_ID = "00000000-0000-0000-0000-000000000001";
      
      const payload: any = {
        message: userMessage,
        student_id: MOCK_STUDENT_ID,
        course_id: MOCK_COURSE_ID,
        mode: "Explain",
        concept_id: selectedSubject.code === "TO" ? "ti-le-thuc" : "general",
        stream: false,
      };

      if (sessionId) {
        payload.session_id = sessionId;
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer fake-jwt-token-${MOCK_STUDENT_ID}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const aiText = data.response || "Xin lỗi, mình không nhận được phản hồi từ hệ thống.";

      if (data.session_id) {
        setSessionId(data.session_id);
      }

      setMessages((prev) => [...prev, { role: "ai", text: aiText }]);
    } catch (error: any) {
      console.error("Chat API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `⚠️ Lỗi kết nối backend: ${error.message}. Hãy kiểm tra backend đang chạy tại ${BACKEND_URL}.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject.code, sessionId]);

  const handleAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    // Update slide matching (keep existing UX)
    const normalizedQuestion = normalizeText(trimmedQuestion);
    const nextChapter =
      program.chapters.find((chapter) =>
        normalizeText(`${chapter.title} ${chapter.summary}`).split(" ").some((word) => word.length > 3 && normalizedQuestion.includes(word)),
      ) || matchedChapter;
    const nextRegion = normalizedQuestion.includes("vi du") || normalizedQuestion.includes("giai")
      ? "example"
      : normalizedQuestion.includes("vi sao") || normalizedQuestion.includes("khai niem")
        ? "concept"
        : "method";

    setMatchedChapterNumber(nextChapter.number);
    setActiveRegion(nextRegion);
    setSpeakerMode("ai");

    // Add user message
    setMessages((currentMessages) => [...currentMessages, { role: "user", text: trimmedQuestion }]);
    setQuestion("");

    // Call real backend API
    callBackendChat(trimmedQuestion);
  };

  const handleSelectOption = useCallback((optionKey: string) => {
    if (isLoading) return;
    const userMsg = `Em chọn ${optionKey}`;
    setSpeakerMode("ai");
    
    // Add user message
    setMessages((currentMessages) => [...currentMessages, { role: "user", text: userMsg }]);
    setQuestion("");

    // Call real backend API
    callBackendChat(userMsg);
  }, [isLoading, callBackendChat]);

  return (
    <AppShell>
      <section className={`ai-study-room ${speakerMode === "user" ? "user-speaking" : "ai-speaking"}`}>
        <aside className="ai-outline" aria-label="Outline bài học">
          <div className="outline-mark active"><BookOpenText size={17} weight="fill" /><span>{program.title}</span></div>
          {program.chapters.map((chapter) => (
            <button
              className={chapter.number === matchedChapter.number ? "active" : ""}
              key={chapter.number}
              type="button"
              onClick={() => {
                setMatchedChapterNumber(chapter.number);
                setSpeakerMode("ai");
              }}
              title={chapter.title}
            >
              <span>{Number(chapter.number)}</span>
              <small>{chapter.title}</small>
            </button>
          ))}
        </aside>

        <main className="ai-slide-zone">
          <div className="ai-room-head">
            <div>
              <span className="overline">{program.grade} · Hỏi đáp với AI</span>
              <h1>{matchedChapter.title}</h1>
            </div>
            <div className="ai-subject-switcher" aria-label="Đổi môn hỏi đáp">
              {subjects.map((subject) => (
                <Link
                  className={subject.code === selectedSubject.code ? "active" : ""}
                  href={`/hoi-dap-ai?subject=${subject.code}`}
                  key={subject.code}
                >
                  {subject.name}
                </Link>
              ))}
            </div>
            <div className="ai-source-pill">
              <FileText size={17} weight="bold" />
              <span>Dữ liệu: Chương {Number(matchedChapter.number)} · {detectedSignal}</span>
            </div>
          </div>

          <div className="slide-frame" aria-label="Slide bài học đang được AI đối chiếu">
            <div className="slide-canvas">
              <div className="slide-kicker">{program.title} · {program.grade}</div>
              <h2>{matchedChapter.title}</h2>
              <p>{matchedChapter.summary}</p>
              {slideRegions.map((region) => (
                <div
                  className={`slide-region ${activeRegion === region.id ? "active" : ""}`}
                  key={region.id}
                  style={region.style}
                >
                  <span>{region.label}</span>
                  <strong>{region.title}</strong>
                  <small>{region.detail}</small>
                </div>
              ))}
              <div className={`ai-pointer point-${activeRegion}`}>
                <Sparkle size={15} weight="fill" />
              </div>
            </div>
          </div>
        </main>

        <aside className="ai-chat-workbench" aria-label="Chat hỏi đáp với AI">
          <div className="ai-chat-header">
            <div>
              <span><Brain size={18} weight="fill" /></span>
              <div><strong>{program.assistantName}</strong><small>Kết nối API Socratic AI</small></div>
            </div>
            <span className="mode-pill">
              {isLoading ? (
                <><CircleNotch size={12} className="animate-spin" style={{ display: "inline", marginRight: 4 }} />Đang trả lời...</>
              ) : speakerMode === "ai" ? "AI Socratic" : "Bạn đang hỏi"}
            </span>
          </div>

          <div className="ai-chat-thread" ref={chatScrollRef}>
            {messages.map((message, index) => {
              if (message.role === "ai") {
                const options = parseMCQOptions(message.text);
                const hasOptions = options.length > 0;
                const isLatest = index === messages.length - 1;
                const shouldShowButtons = hasOptions && isLatest;
                const cleanText = hasOptions
                  ? message.text
                      .split("\n")
                      .filter((line) => !line.match(/^\s*([A-F])\s*[\u0029\u002e\uFF09]/i))
                      .join("\n")
                      .replace(/\n{3,}/g, "\n\n")
                      .trim()
                  : message.text;

                return (
                  <div className="ai-room-message ai" key={`${message.role}-${index}`}>
                    <SocraticMarkdown text={cleanText} />
                    {shouldShowButtons && (
                      <div className="ai-option-list">
                        {options.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            className="ai-option-button"
                            disabled={isLoading}
                            onClick={() => handleSelectOption(option.key)}
                          >
                            <span className="ai-option-badge">{option.key}</span>
                            <span className="ai-option-content">
                              {renderMathAndText(option.text)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div className={`ai-room-message ${message.role}`} key={`${message.role}-${index}`}>
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {renderMathAndText(message.text)}
                    </div>
                  </div>
                );
              }
            })}
          </div>

          <div className="quick-question-row">
            {aiContent.quickQuestions.map((item) => (
              <button
                key={item}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setQuestion(item);
                  setSpeakerMode("user");
                }}
              >
                <ChatsCircle size={15} />
                {item}
              </button>
            ))}
          </div>

          <form className="ai-room-input" onSubmit={handleAsk}>
            <input
              aria-label="Nhập câu hỏi bài học"
              onBlur={() => {
                if (!question.trim()) setSpeakerMode("ai");
              }}
              onChange={(event) => {
                setQuestion(event.target.value);
                setSpeakerMode("user");
              }}
              onFocus={() => setSpeakerMode("user")}
              placeholder={`Hỏi về ${matchedChapter.title.toLowerCase()}...`}
              value={question}
              disabled={isLoading}
            />
            <button type="submit" aria-label="Gửi câu hỏi" disabled={isLoading}>
              {isLoading ? <CircleNotch size={18} className="animate-spin" /> : <PaperPlaneTilt size={18} weight="fill" />}
              <span>{isLoading ? "Đang xử lý..." : "Gửi"}</span>
            </button>
          </form>

          <div className="ai-layout-hint">
            <ArrowRight size={15} />
            <span>{speakerMode === "ai" ? "Slide đang chiếm ưu tiên để trình bày bằng chứng." : "Chat đang mở rộng để bạn nhập và đọc phản hồi."}</span>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

export default function AiQuestionPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <AiQuestionContent />
    </Suspense>
  );
}
