"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  ChatsCircle,
  FileText,
  PaperPlaneTilt,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import { AppShell } from "../components/AppShell";
import { subjectPrograms, subjects } from "../data";

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

export default function AiQuestionPage() {
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const aiContent = aiSubjectContent[selectedSubject.code as keyof typeof aiSubjectContent] || aiSubjectContent.TO;
  const slideRegions = aiContent.regions.map((region) => ({ ...region, style: regionLayout[region.id] }));
  const initialChapter = program.chapters.find((chapter) => chapter.active) || program.chapters[0];
  const [speakerMode, setSpeakerMode] = useState<SpeakerMode>("ai");
  const [question, setQuestion] = useState("");
  const [activeRegion, setActiveRegion] = useState<RegionId>("method");
  const [matchedChapterNumber, setMatchedChapterNumber] = useState<string>(initialChapter.number);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Mình đang mở dữ liệu ${program.title} - ${initialChapter.title}. Hỏi bài ở đây, mình sẽ tìm đúng phần kiến thức và đánh dấu vùng liên quan trên slide.`,
    },
  ]);

  useEffect(() => {
    setMatchedChapterNumber(initialChapter.number);
    setActiveRegion("method");
    setQuestion("");
    setSpeakerMode("ai");
    setMessages([
      {
        role: "ai",
        text: `Mình đang mở dữ liệu ${program.title} - ${initialChapter.title}. Hỏi bài ở đây, mình sẽ tìm đúng phần kiến thức và đánh dấu vùng liên quan trên slide.`,
      },
    ]);
  }, [initialChapter.number, initialChapter.title, program.title, selectedSubject.code]);

  const matchedChapter = useMemo(
    () => program.chapters.find((chapter) => chapter.number === matchedChapterNumber) || initialChapter,
    [initialChapter, matchedChapterNumber, program.chapters],
  );

  const detectedSignal = useMemo(() => {
    const haystack = normalizeText(`${question} ${matchedChapter.title} ${matchedChapter.summary}`);
    return aiContent.signals.find((signal) => haystack.includes(normalizeText(signal))) || matchedChapter.title;
  }, [aiContent.signals, matchedChapter.summary, matchedChapter.title, question]);

  const handleAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

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
    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", text: trimmedQuestion },
      {
        role: "ai",
        text: `Câu này khớp với dữ liệu Chương ${Number(nextChapter.number)} - ${nextChapter.title}. Mình đang highlight vùng ${
          slideRegions.find((region) => region.id === nextRegion)?.label.toLowerCase()
        } để em đối chiếu khi đọc lời giải.`,
      },
    ]);
    setQuestion("");
  };

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
              <div><strong>{program.assistantName}</strong><small>Đồng bộ với slide đang mở</small></div>
            </div>
            <span className="mode-pill">{speakerMode === "ai" ? "AI đang giải thích" : "Bạn đang hỏi"}</span>
          </div>

          <div className="ai-chat-thread">
            {messages.map((message, index) => (
              <div className={`ai-room-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="ai-evidence-card">
            <Target size={18} weight="fill" />
            <div>
              <strong>Auto-highlight</strong>
              <span>Vùng “{slideRegions.find((region) => region.id === activeRegion)?.label}” trên slide đang nối với câu trả lời mới nhất.</span>
            </div>
          </div>

          <div className="quick-question-row">
            {aiContent.quickQuestions.map((item) => (
              <button
                key={item}
                type="button"
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
            />
            <button type="submit" aria-label="Gửi câu hỏi">
              <PaperPlaneTilt size={18} weight="fill" />
              <span>Gửi</span>
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
