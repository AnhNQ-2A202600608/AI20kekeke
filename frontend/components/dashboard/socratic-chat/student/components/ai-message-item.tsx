import React, { useMemo, useState } from 'react';
import {
  Brain,
  ChevronRight, 
  Check, 
  GraduationCap, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown,
  Database,
  Wrench,
  Loader2,
  CircleCheck,
  CircleAlert,
  Clock3,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SofiExpressionAvatar } from '@/components/mascot';
import { ChatAction, Message, ReasoningStep, Slide } from '../hooks/useSocraticChat';
import { parseThinkingProcess, parseQuizData } from '../utils/parser';

// ==========================================
// SocraticMarkdown Component (Lightweight Markdown Parser)
// ==========================================
interface SocraticMarkdownProps {
  text: string;
  className?: string;
}

export const SocraticMarkdown: React.FC<SocraticMarkdownProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  const parseInlineStyles = (lineText: string, keyPrefix: string) => {
    const parts = lineText.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, idx) => {
      const key = `${keyPrefix}-${idx}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-extrabold text-stone-900 dark:text-stone-850">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={key} className="bg-stone-100/90 text-rose-600 px-1.5 py-0.5 rounded font-mono text-[11px] border border-stone-200/40">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // 1. Code block detection
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre 
            key={`codeblock-${lineIdx}`} 
            className="bg-stone-900 text-stone-200 p-3.5 rounded-xl border border-stone-800 font-mono text-[11px] overflow-x-auto whitespace-pre my-3 max-w-full shadow-inner leading-relaxed"
          >
            <code className={codeBlockLang ? `language-${codeBlockLang}` : ''}>
              {codeBlockLines.join('\n')}
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

    // 2. Unordered List Item detection
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(
        <li key={`li-${lineIdx}`} className="ml-4 list-disc pl-1 leading-relaxed text-stone-800">
          {parseInlineStyles(trimmed.substring(2), `li-inline-${lineIdx}`)}
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

    // 3. Regular paragraph or spacer
    if (trimmed.length === 0) {
      elements.push(<div key={`space-${lineIdx}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${lineIdx}`} className={`leading-relaxed text-stone-800 ${className}`}>
          {parseInlineStyles(line, `p-inline-${lineIdx}`)}
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

  return <div className="space-y-2">{elements}</div>;
};

const formatToolPayload = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const getToolSummary = (toolName: string) => {
  const normalized = toolName.toLowerCase();
  if (normalized.includes('rag') || normalized.includes('slide') || normalized.includes('match')) {
    return 'Tra cứu học liệu';
  }
  if (normalized.includes('sandbox') || normalized.includes('python') || normalized.includes('code')) {
    return 'Kiểm tra đoạn mã';
  }
  return 'Kiểm tra thông tin';
};

const renderTraceValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  return formatToolPayload(value);
};

const JsonTraceBlock: React.FC<{
  label: string;
  value: unknown;
  tone?: 'input' | 'output' | 'error';
  icon?: React.ReactNode;
}> = ({ label, value, tone = 'output', icon }) => {
  const toneClass =
    tone === 'error'
      ? 'text-rose-700 bg-rose-50/70'
      : tone === 'input'
      ? 'text-amber-700 bg-amber-50/70'
      : 'text-stone-700 bg-warm-cream-light';

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-3 py-2 font-mono text-[11px] font-black uppercase text-stone-500">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <Copy className="h-3.5 w-3.5 text-stone-300" />
      </div>
      <pre className={`max-h-56 overflow-auto p-3 text-[11px] leading-relaxed custom-scrollbar ${toneClass}`}>
        <code>{renderTraceValue(value)}</code>
      </pre>
    </div>
  );
};

interface MessageAuditTrailProps {
  msg: Message;
  thought: string;
  isThinking: boolean;
  isGeneratingMainText: boolean;
}

const normalizeTraceSteps = (msg: Message, thought: string): ReasoningStep[] => {
  if (msg.traceSteps && msg.traceSteps.length > 0) {
    const hasRagTrace = msg.traceSteps.some((step) => {
      const normalized = `${step.toolName || ''} ${step.title}`.toLowerCase();
      return normalized.includes('rag') || normalized.includes('slide') || normalized.includes('match');
    });

    return [
      ...msg.traceSteps,
      ...(!hasRagTrace && msg.slides?.length
        ? [
            {
              id: `slides-${msg.id}`,
              kind: 'observation' as const,
              title: 'Nguồn học liệu đã chọn',
              content: `Tìm thấy ${msg.slides.length} slide liên quan để grounding phản hồi.`,
              status: 'completed' as const,
              output: msg.slides.map((slide) => ({
                document_name: slide.document_name,
                slide_number: slide.slide_number,
                similarity: slide.similarity,
              })),
            },
          ]
        : []),
      ...(msg.sandboxRun
        ? [
            {
              id: `sandbox-${msg.id}`,
              kind: 'tool' as const,
              title: 'Kiểm tra đoạn mã',
              content: msg.sandboxRun.status === 'failed' ? 'Đoạn mã trả về lỗi khi chạy thử.' : 'Đoạn mã đã chạy xong.',
              status: msg.sandboxRun.status === 'failed' ? 'error' as const : 'completed' as const,
              toolName: 'python_sandbox',
              input: { code: msg.sandboxRun.code },
              output: msg.sandboxRun.output,
              durationMs: msg.sandboxRun.execution_time_ms,
            },
          ]
        : []),
    ];
  }

  const thoughtSteps: ReasoningStep[] = (msg.thinkingSteps && msg.thinkingSteps.length > 0
    ? msg.thinkingSteps
    : thought
      ? [thought]
      : []
  ).map((step, index) => ({
    id: `legacy-thought-${msg.id}-${index}`,
    kind: 'thought',
    title: step.replace(/\.+$/, ''),
    content: step,
    status: 'completed',
  }));

  const toolSteps: ReasoningStep[] = (msg.toolRuns || []).map((run, index) => ({
    id: `legacy-tool-${msg.id}-${index}`,
    kind: 'tool',
    title: run.toolName,
    content: run.status === 'running' ? 'Đang kiểm tra thông tin...' : run.status === 'error' ? 'Chưa kiểm tra được thông tin.' : 'Đã nhận kết quả kiểm tra.',
    status: run.status === 'running' ? 'running' : run.status === 'error' ? 'error' : 'completed',
    toolName: run.toolName,
    input: run.args,
    output: run.result,
    startedAt: run.startedAt,
    durationMs: run.durationMs,
  }));

  const slideStep: ReasoningStep[] = msg.slides?.length
    ? [
        {
          id: `legacy-slides-${msg.id}`,
          kind: 'observation',
          title: 'Nguồn học liệu đã chọn',
          content: `Tìm thấy ${msg.slides.length} slide liên quan để grounding phản hồi.`,
          status: 'completed',
          output: msg.slides.map((slide) => ({
            document_name: slide.document_name,
            slide_number: slide.slide_number,
            similarity: slide.similarity,
          })),
        },
      ]
    : [];

  const sandboxStep: ReasoningStep[] = msg.sandboxRun
    ? [
        {
          id: `legacy-sandbox-${msg.id}`,
          kind: 'tool',
          title: 'Kiểm tra đoạn mã',
          content: msg.sandboxRun.status === 'failed' ? 'Đoạn mã trả về lỗi khi chạy thử.' : 'Đoạn mã đã chạy xong.',
          status: msg.sandboxRun.status === 'failed' ? 'error' : 'completed',
          toolName: 'python_sandbox',
          input: { code: msg.sandboxRun.code },
          output: msg.sandboxRun.output,
          durationMs: msg.sandboxRun.execution_time_ms,
        },
      ]
    : [];

  return [...thoughtSteps, ...toolSteps, ...slideStep, ...sandboxStep];
};

const StepStatusIcon: React.FC<{ step: ReasoningStep }> = ({ step }) => {
  if (step.status === 'running' || step.status === 'pending') {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />;
  }
  if (step.status === 'error') {
    return <CircleAlert className="h-3.5 w-3.5 text-rose-700" />;
  }
  if (step.kind === 'tool') {
    return <Wrench className="h-3.5 w-3.5 text-primary-green-dark" />;
  }
  if (step.kind === 'observation') {
    return <Database className="h-3.5 w-3.5 text-primary-green-dark" />;
  }
  return <CircleCheck className="h-3.5 w-3.5 text-primary-green" />;
};

const TraceStepItem: React.FC<{ step: ReasoningStep; index: number }> = ({ step, index }) => {
  const [open, setOpen] = useState(step.status === 'running');
  const isToolLike = step.kind === 'tool' || step.input !== undefined || step.output !== undefined;
  const statusLabel =
    step.status === 'running' || step.status === 'pending'
      ? 'executing'
      : step.status === 'error'
        ? 'error'
        : 'done';

  if (!isToolLike) {
    return (
      <div className="flex gap-3 rounded-xl border border-stone-100 bg-white px-3 py-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-100 bg-warm-cream-light">
          <StepStatusIcon step={step} />
        </span>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-black uppercase text-stone-500">{step.kind}</span>
            <span className="text-xs font-extrabold text-stone-700">{step.title || `Bước ${index + 1}`}</span>
          </div>
          <p className="text-[11px] font-semibold leading-relaxed text-stone-500">{step.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-stone-50/80"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
            step.status === 'running' || step.status === 'pending'
              ? 'border-amber-200 bg-amber-50'
              : step.status === 'error'
                ? 'border-rose-200 bg-rose-50'
                : 'border-primary-green/20 bg-primary-green/10'
          }`}>
            <StepStatusIcon step={step} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-extrabold text-stone-700">
              {getToolSummary(step.toolName || step.title)}
            </span>
            <span className="block truncate font-mono text-[11px] font-bold uppercase text-stone-500">
              {getToolSummary(step.toolName || step.title)}{step.durationMs ? ` · ${(step.durationMs / 1000).toFixed(1)}s` : ''}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black uppercase ${
            step.status === 'running' || step.status === 'pending'
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : step.status === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {statusLabel}
          </span>
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.16 }}>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-stone-100 bg-warm-cream-light/70"
          >
            <div className="grid gap-3 p-3 md:grid-cols-2">
              {step.input !== undefined && <JsonTraceBlock label="Dữ liệu kiểm tra" value={step.input} tone="input" />}
              {step.output !== undefined && (
                <JsonTraceBlock
                  label="Kết quả đối chiếu"
                  value={step.output}
                  tone={step.status === 'error' ? 'error' : 'output'}
                />
              )}
              {step.input === undefined && step.output === undefined && (
                <p className="text-[11px] font-semibold text-stone-500">{step.content}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MessageAuditTrail: React.FC<MessageAuditTrailProps> = ({
  msg,
  thought,
  isThinking: _isThinking,
  isGeneratingMainText: _isGeneratingMainText,
}) => {
  const steps = useMemo(() => normalizeTraceSteps(msg, thought), [msg, thought]);
  const isComplete = !!msg.latencyMs;
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const isExpanded = manualExpanded ?? false;

  if (steps.length === 0) return null;

  const isRunning = steps.some((step) => step.status === 'running' || step.status === 'pending') || !isComplete;
  const toolCount = steps.filter((step) => step.kind === 'tool').length;
  const sourceCount = msg.slides?.length || 0;
  const completedCount = steps.filter((step) => step.status === 'completed').length;
  const summaryItems = [
    isRunning ? 'Đang suy nghĩ' : 'Đã suy nghĩ',
    `${steps.length} bước`,
    toolCount ? `${toolCount} lượt kiểm tra` : null,
    sourceCount ? `${sourceCount} nguồn` : null,
    msg.latencyMs ? `${(msg.latencyMs / 1000).toFixed(1)}s` : null,
  ].filter(Boolean);

  return (
    <div className="max-w-4xl overflow-hidden rounded-2xl border border-stone-200 bg-[#fffcf6] text-xs shadow-sm">
      <button
        type="button"
        onClick={() => setManualExpanded((current) => !(current ?? !isComplete))}
        className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-stone-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-green"
        aria-expanded={isExpanded}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-primary-green-dark">
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-stone-700">
              <span className="font-mono text-xs uppercase text-stone-600">Cách Sofi kiểm tra câu trả lời</span>
              {msg.latencyMs && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary-green/20 bg-primary-green/10 px-2 py-0.5 text-[11px] font-black text-primary-green-dark">
                  <Clock3 className="h-3 w-3" />
                  {(msg.latencyMs / 1000).toFixed(1)}s
                </span>
              )}
            </span>
            <span className="block truncate text-[11px] font-bold uppercase text-stone-500">
              {summaryItems.join(' · ') || `${completedCount} bước đã ghi nhận`}
            </span>
          </span>
        </span>
        <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.16 }} className="shrink-0 text-stone-400">
          <ChevronRight className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-stone-200"
          >
            <div className="space-y-2.5 bg-[#fefcf5] p-3">
              {steps.map((step, index) => (
                <TraceStepItem key={step.id} step={step} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// AIMessageContent Component
// ==========================================
interface AIMessageContentProps {
  msg: Message;
  onSelectOption: (option: { key: string; text: string }) => void;
}

const AIMessageContent: React.FC<AIMessageContentProps> = React.memo(({ msg, onSelectOption }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { thought, response, isThinking } = useMemo(
    () => parseThinkingProcess(msg.text),
    [msg.text],
  );
  const quiz = useMemo(() => parseQuizData(response || msg.text), [response, msg.text]);

  const hasThinking = !!msg.traceSteps?.length || !!msg.thinkingText || !!thought || isThinking || (msg.toolRuns && msg.toolRuns.length > 0) || (msg.slides && msg.slides.length > 0) || !!msg.sandboxRun;
  const isGeneratingMainText = !!response || (!!msg.text && !msg.thinkingText && msg.text.trim().length > 0);
  const hasMainResponse = !!response.trim();

  const handleChoiceClick = (key: string, text: string) => {
    if (selectedKey) return;
    setSelectedKey(key);
    onSelectOption({ key, text });
  };

  return (
    <div className="space-y-3.5 max-w-full">
      {quiz ? (
          <div className="max-w-full space-y-4 rounded-2xl border border-gray-border bg-white p-4.5">
          <div className="flex items-center gap-2 text-primary-green font-black text-[11px] uppercase tracking-wider font-mono">
            <GraduationCap className="w-4.5 h-4.5" />
            <span>Câu hỏi củng cố kiến thức</span>
          </div>
          <h4 className="font-fraunces font-bold text-sm text-on-background leading-relaxed">
            {quiz.question}
          </h4>
          <div className="flex flex-col gap-2.5">
            {quiz.options.map((opt) => {
              const isSelected = selectedKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={selectedKey !== null}
                  onClick={() => handleChoiceClick(opt.key, opt.text)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-semibold text-[13px] md:text-sm flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-primary-green/10 border-primary-green text-primary-green-dark shadow-sm'
                      : selectedKey !== null
                      ? 'bg-white border-gray-border text-stone-400 opacity-60'
                      : 'bg-white border-gray-border text-stone-600 hover:bg-stone-50 hover:border-stone-400 cursor-pointer active:translate-y-[1px]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      isSelected ? 'bg-primary-green text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="leading-snug">{opt.text}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-primary-green shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        hasMainResponse && (
          <div className="text-xs md:text-sm font-semibold leading-relaxed text-stone-850">
            <SocraticMarkdown text={response} />
          </div>
        )
      )}

      {hasThinking && (
        <MessageAuditTrail
          msg={msg}
          thought={thought}
          isThinking={isThinking}
          isGeneratingMainText={isGeneratingMainText}
        />
      )}
    </div>
  );
});
AIMessageContent.displayName = 'AIMessageContent';

// ==========================================
// AIMessageItem Component
// ==========================================
interface AIMessageItemProps {
  msg: Message;
  setRetrievedSlides: (slides: Slide[]) => void;
  setActiveSlideIndex: (idx: number) => void;
  setIsSlidePanelOpen: (open: boolean) => void;
  handleSendMessage: (e?: React.FormEvent, customText?: string, action?: ChatAction) => Promise<void>;
  handleFeedback: (messageId: string, type: 'up' | 'down') => void;
  setToastMessage: (val: string | null) => void;
}

export const AIMessageItem: React.FC<AIMessageItemProps> = ({
  msg,
  setRetrievedSlides,
  setActiveSlideIndex,
  setIsSlidePanelOpen,
  handleSendMessage,
  handleFeedback,
  setToastMessage,
}) => {
  const isAI = msg.sender === 'ai';

  const handleCitationClick = (e: React.MouseEvent, cit: any) => {
    e.stopPropagation();
    setIsSlidePanelOpen(true);
    if (msg.slides && msg.slides.length > 0) {
      setRetrievedSlides(msg.slides);
      const matchedIdx = msg.slides.findIndex((s: Slide) => 
        s.slide_number === cit.page && 
        cit.source &&
        s.document_name.toLowerCase().includes(cit.source.toLowerCase())
      );
      if (matchedIdx !== -1) {
        setActiveSlideIndex(matchedIdx);
      } else {
        setActiveSlideIndex(0);
      }
    }
  };

  const handleThumbsUpClick = () => {
    handleFeedback(msg.id, 'up');
    setToastMessage('Đã ghi nhận đánh giá hữu ích. Hệ thống sẽ tối ưu phong cách Socratic.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleThumbsDownClick = () => {
    handleFeedback(msg.id, 'down');
    setToastMessage('Đã ghi nhận phản hồi. Sofi sẽ điều chỉnh phong cách giải thích.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReportCitationError = () => {
    setToastMessage('Sofi sẽ ghi nhận nguồn cần kiểm tra để mentor đối chiếu lại học liệu.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex max-w-[90%] gap-2.5 ${!isAI ? 'flex-row-reverse ml-auto' : ''}`}
    >
      {/* Avatar */}
      {isAI ? (
        <SofiExpressionAvatar
          expression={msg.isGuardrail || msg.isFallback ? 'worried' : 'happy'}
          size={32}
        />
      ) : (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs border shadow-sm shrink-0 bg-tertiary-yellow/20 border-tertiary-yellow-dark text-tertiary-yellow-dark font-extrabold font-mono">
          HS
        </div>
      )}

      {/* Speech Bubble */}
      <div className="flex flex-col gap-1.5 max-w-full">
        {msg.isGuardrail ? (
          <div className="relative rounded-2xl rounded-tl-none border border-error-red/30 bg-error-red-light/40 p-4 text-error-red-dark">
            <div className="flex items-center gap-1.5 text-error-red font-black text-[11px] uppercase tracking-wider mb-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-error-red shrink-0" />
              Cảnh báo: Vi phạm tính trung thực học thuật
            </div>
            <div className="text-xs md:text-sm font-semibold leading-relaxed">
              <SocraticMarkdown text={msg.text} />
            </div>
          </div>
        ) : msg.isFallback ? (
          <div className="relative rounded-2xl rounded-tl-none border border-accent-orange/30 bg-accent-orange-light/10 p-4 text-accent-orange-dark">
            <div className="flex items-center gap-1.5 text-accent-orange font-black text-[11px] uppercase tracking-wider mb-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-accent-orange shrink-0" />
              Cần kiểm chứng thêm
            </div>
            <div className="text-xs md:text-sm font-semibold leading-relaxed">
              <SocraticMarkdown text={msg.text} />
            </div>
          </div>
        ) : (
          <div 
            className={`relative rounded-2xl border p-3.5 transition-colors ${
              isAI 
                ? 'bg-white border-gray-border rounded-tl-none text-stone-800' 
                : 'bg-primary-green border-primary-green/70 text-white rounded-tr-none'
            }`}
          >
            {isAI ? (
              <AIMessageContent 
                msg={msg} 
                onSelectOption={(option) => {
                  handleSendMessage(
                    undefined,
                    `Mình chọn đáp án ${option.key}: ${option.text}`,
                    { type: 'quiz_option_select', optionKey: option.key, optionText: option.text },
                  );
                }}
              />
            ) : (
              <p className="text-xs md:text-sm font-semibold leading-relaxed whitespace-pre-line">
                {msg.text}
              </p>
            )}

            {/* Confidence score */}
            {isAI && msg.confidence_score !== undefined && msg.confidence_score < 0.8 && (
              (() => {
                const pct = Math.round(msg.confidence_score * 100);
                let confStyle = 'text-rose-700 bg-rose-50 border-rose-200/50';
                let confText = `Cần kiểm chứng thêm (${pct}%)`;
                if (msg.confidence_score >= 0.5) {
                  confStyle = 'text-amber-700 bg-amber-50 border-amber-200/50';
                  confText = `Nên đối chiếu nguồn (${pct}%)`;
                }
                return (
                  <div className={`mt-2 flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-black ${confStyle}`}>
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    <span>{confText}</span>
                  </div>
                );
              })()
            )}

            {/* Citation Badges */}
            {isAI && msg.citations && msg.citations.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-stone-200/60 space-y-1.5">
                <p className="text-[11px] text-stone-400 font-black uppercase tracking-wider">Nguồn đã dùng</p>
                <div className="flex flex-wrap gap-1.5">
                  {msg.citations.map((cit, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleCitationClick(e, cit)}
                      className="flex items-center gap-1.5 rounded-lg border border-primary-green/20 bg-white px-2.5 py-1.5 text-xs font-bold text-primary-green-dark transition-colors hover:bg-primary-green/5 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span>{cit.source} {cit.page ? `(Slide ${cit.page})` : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Bubble Footer Actions */}
        {isAI && (
          <div className="flex items-center gap-3.5 ml-2 text-stone-400 opacity-45 hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={handleThumbsUpClick}
              className={`p-1 hover:text-primary-green transition-all cursor-pointer rounded hover:scale-115 active:scale-95 ${
                msg.isFeedbackGiven === 'up' ? 'text-primary-green font-bold' : ''
              }`}
              title="Hữu ích"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleThumbsDownClick}
              className={`p-1 hover:text-error-red transition-all cursor-pointer rounded hover:scale-115 active:scale-95 ${
                msg.isFeedbackGiven === 'down' ? 'text-error-red font-bold' : ''
              }`}
              title="Chưa tốt"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleReportCitationError}
              className="p-1 hover:text-accent-orange transition-all cursor-pointer rounded flex items-center gap-1.5 text-[11px] font-extrabold hover:scale-105 active:scale-95"
              title="Kiểm tra lại nguồn học liệu"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Kiểm tra nguồn</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
