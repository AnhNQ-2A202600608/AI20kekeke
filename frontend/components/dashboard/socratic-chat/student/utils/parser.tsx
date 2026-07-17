import React from 'react';

export interface QuizOption {
  key: string;
  text: string;
}

export interface QuizData {
  question: string;
  options: QuizOption[];
}

export const parseThinkingProcess = (text: string) => {
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    const thought = thinkMatch[1].trim();
    const response = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return { thought, response, isThinking: false };
  }
  
  if (text.includes('<think>')) {
    const parts = text.split('<think>');
    const thought = parts[1] || '';
    return { thought: thought.trim(), response: parts[0]?.trim() || '', isThinking: true };
  }
  
  return { thought: '', response: text, isThinking: false };
};

export const parseQuizData = (text: string): QuizData | null => {
  // Anchored regex: option must start at the beginning of a line (or after a newline),
  // optionally preceded by spaces, list markers (- or *), and bold markers (**).
  const optionRegex = /(?:^|\n)\s*[-*]?\s*(?:\*\*)?([A-E])[.)\:]\s*(?:\*\*)?\s*(.+)/gi;
  const matches = [...text.matchAll(optionRegex)];
  
  if (matches.length >= 2 && matches.length <= 5) {
    const options = matches.map(m => ({
      key: m[1].toUpperCase(),
      text: m[2].trim()
    }));
    
    // Validate that options have sequential keys starting from A (e.g. A, B, C...)
    const keys = options.map(o => o.key);
    const expectedKeys = ['A', 'B', 'C', 'D', 'E'];
    const isSequential = keys.every((key, idx) => key === expectedKeys[idx]);
    if (!isSequential) {
      return null;
    }
    
    const firstOptionIndex = text.indexOf(matches[0][0]);
    let question = text.substring(0, firstOptionIndex).trim();
    
    question = question.replace(/(Câu hỏi|Trắc nghiệm|Question)\s*:\s*/gi, '').trim();
    
    const lines = question.split('\n');
    const lastLine = lines[lines.length - 1];
    
    return {
      question: lastLine || question,
      options
    };
  }
  
  return null;
};


export const parseInlineMarkdown = (text: string) => {
  const segments = text.split(/(\*\*.*?\*\*|`.*?`)/);
  return segments.map((seg, sIdx) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <strong key={sIdx} className="font-extrabold text-on-background">
          {seg.substring(2, seg.length - 2)}
        </strong>
      );
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code key={sIdx} className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-rose-600 rounded text-[11px] font-mono">
          {seg.substring(1, seg.length - 1)}
        </code>
      );
    }
    return seg;
  });
};

export const renderMarkdown = (text: string) => {
  if (!text) return null;
  
  const parts = [];
  let currentIdx = 0;
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.substring(currentIdx, match.index);
    if (textBefore) {
      parts.push({ type: 'text', content: textBefore });
    }
    parts.push({ type: 'code', lang: match[1], content: match[2] });
    currentIdx = codeBlockRegex.lastIndex;
  }
  
  const remainingText = text.substring(currentIdx);
  if (remainingText) {
    parts.push({ type: 'text', content: remainingText });
  }
  
  return parts.map((part, pIdx) => {
    if (part.type === 'code') {
      return (
        <pre key={pIdx} className="my-3 p-3 bg-stone-900 text-stone-100 rounded-xl overflow-x-auto text-[11px] font-mono border-2 border-stone-800">
          <code className="block leading-relaxed">{part.content.trim()}</code>
        </pre>
      );
    }

    const lines = part.content.split('\n');
    return (
      <React.Fragment key={pIdx}>
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} className="h-1.5" />;

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={lIdx} className="text-xs md:text-sm font-fraunces font-bold text-on-background mt-4 mb-1.5">
                {trimmed.substring(4)}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={lIdx} className="text-sm md:text-base font-fraunces font-bold text-on-background mt-5 mb-2">
                {trimmed.substring(3)}
              </h3>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={lIdx} className="text-base md:text-lg font-fraunces font-bold text-on-background mt-6 mb-3">
                {trimmed.substring(2)}
              </h2>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={lIdx} className="flex gap-2 ml-4 mb-1.5 items-start">
                <span className="text-primary-green shrink-0 mt-1">•</span>
                <span className="text-xs text-stone-600 font-semibold leading-relaxed">
                  {parseInlineMarkdown(trimmed.substring(2))}
                </span>
              </div>
            );
          }

          return (
            <p key={lIdx} className="text-xs text-stone-600 font-semibold mb-2 leading-relaxed">
              {parseInlineMarkdown(trimmed)}
            </p>
          );
        })}
      </React.Fragment>
    );
  });
};
