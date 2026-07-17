import React from 'react';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import katex from 'katex';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, ChevronLeft } from 'lucide-react';
import { getProgramDay } from '@/lib/quiz/program-curriculum';

const TOPICS_MAP: { [key: string]: string } = {
  day1: 'Day 1: AI & LLM Foundation',
  day2: 'Day 2: Xác định Bài toán cho AI',
  day3: 'Day 3: Design Pattern ReAct',
  day4: 'Day 4: Prompt Engineering & Tool Calling',
  day5: 'Day 5: Thiết kế sản phẩm AI cho sự không chắc chắn',
  day6: 'Day 6: Hackathon Day & Prototyping',
  day7: 'Day 7: Data Foundations - Embedding & Vector Store',
  week1: 'Week 1: Ôn Tập Tổng Hợp'
};

const GUIDEBOOK_FILES: { [slug: string]: string[] } = {
  'day1': [
    'day-01/guidebook.md'
  ],
  'day2': [
    'day-02/guidebook-xac-dinh-bai-toan.md'
  ],
  'day3': [
    'day-03/guidebook-react-pattern.md'
  ],
  'day4': [
    'day-04-prompt-tool-calling/guidebook-prompt-tool-calling.md'
  ],
  'day5': [
    'day-05/guidebook-co-ban-llm.md'
  ],
  'day6': [
    'day-06/guidebook-prompt-engineering.md'
  ],
  'day7': [
    'day-07/guidebook-embedding-vector-store.md',
    'day-07/guidebook-lecture-slides.md'
  ],
  'day8': [
    'day-08/guidebook-rag-pipeline.md'
  ],
  'day9': [
    'day-09/guidebook-multi-agent-system.md'
  ],
  'day10': [
    'day-10/guidebook-data-pipeline.md'
  ],
  'day11': [
    'day-11/guidebook-guardrails-ai-safety.md'
  ],
  'day12': [
    'day-12/guidebook-cloud-infrastructure.md'
  ],
  'day13': [
    'day-13/guidebook-monitoring-logging.md'
  ],
  'day14': [
    'day-14/guidebook-ai-evaluation.md'
  ],
  'day15': [
    'day-15/guidebook-trien-khai-thuc-te.md'
  ],
  'day16-ai-product': [
    'day-16/guidebook-product.md'
  ],
  'day17-ai-product': [
    'day-17/guidebook-product.md'
  ],
  'day18-ai-product': [
    'day-18/guidebook-product.md'
  ],
  'day19-ai-product': [
    'day-19/guidebook-product.md'
  ],
  'day20-ai-product': [
    'day-20/guidebook-product.md'
  ],
  'day21-ai-product': [
    'day-21/guidebook-product.md'
  ],
  'day22-ai-product': [
    'day-22/guidebook-product.md'
  ],
  'day23-ai-product': [
    'day-23/guidebook-product.md'
  ],
  'day24-ai-product': [
    'day-24/guidebook-product.md'
  ],
  'day25-ai-product': [
    'day-25/guidebook-product.md'
  ],
  'day26-ai-product': [
    'day-26/guidebook-product.md'
  ],
  'day27-ai-product': [
    'day-27/guidebook-product.md'
  ],
  'day28-ai-product': [
    'day-28/guidebook-product.md'
  ],
  'day16-rag-data': [
    'day-16/guidebook-rag-data.md'
  ],
  'day17-rag-data': [
    'day-17/guidebook-rag-data.md'
  ],
  'day18-rag-data': [
    'day-18/guidebook-rag-data.md'
  ],
  'day19-rag-data': [
    'day-19/guidebook-rag-data.md'
  ],
  'day20-rag-data': [
    'day-20/guidebook-rag-data.md'
  ],
  'day21-rag-data': [
    'day-21/guidebook-rag-data.md'
  ],
  'day22-rag-data': [
    'day-22/guidebook-rag-data.md'
  ],
  'day23-rag-data': [
    'day-23/guidebook-rag-data.md'
  ],
  'day24-rag-data': [
    'day-24/guidebook-rag-data.md'
  ],
  'day25-rag-data': [
    'day-25/guidebook-rag-data.md'
  ],
  'day26-rag-data': [
    'day-26/guidebook-rag-data.md'
  ],
  'day27-rag-data': [
    'day-27/guidebook-rag-data.md'
  ],
  'day28-rag-data': [
    'day-28/guidebook-rag-data.md'
  ],
  'day16-agent-builder': [
    'day-16/guidebook-agent-builder.md'
  ],
  'day17-agent-builder': [
    'day-17/guidebook-agent-builder.md'
  ],
  'day18-agent-builder': [
    'day-18/guidebook-agent-builder.md'
  ],
  'day19-agent-builder': [
    'day-19/guidebook-agent-builder.md'
  ],
  'day20-agent-builder': [
    'day-20/guidebook-agent-builder.md'
  ],
  'day21-agent-builder': [
    'day-21/guidebook-agent-builder.md'
  ],
  'day22-agent-builder': [
    'day-22/guidebook-agent-builder.md'
  ],
  'day23-agent-builder': [
    'day-23/guidebook-agent-builder.md'
  ],
  'day24-agent-builder': [
    'day-24/guidebook-agent-builder.md'
  ],
  'day25-agent-builder': [
    'day-25/guidebook-agent-builder.md'
  ],
  'day26-agent-builder': [
    'day-26/guidebook-agent-builder.md'
  ],
  'day27-agent-builder': [
    'day-27/guidebook-agent-builder.md'
  ],
  'day28-agent-builder': [
    'day-28/guidebook-agent-builder.md'
  ],
};

async function getMermaidBase64DataUri(code: string): Promise<string> {
  const trimmedCode = code.trim();
  const state = { code: trimmedCode, mermaid: { theme: 'default' } };
  const jsonStr = JSON.stringify(state);
  const compressed = zlib.deflateSync(Buffer.from(jsonStr, 'utf8'), { level: 9 });
  const base64 = compressed.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const url = `https://mermaid.ink/svg/pako:${base64}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const svgContent = await response.text();
      const base64Svg = Buffer.from(svgContent, 'utf8').toString('base64');
      return `data:image/svg+xml;base64,${base64Svg}`;
    }
    console.error(`Failed to fetch Mermaid SVG: ${response.status}`);
    return url;
  } catch (err) {
    console.error('Error fetching/encoding Mermaid SVG:', err);
    return url;
  }
}

// Inline formatting helper
function parseInline(text: string): string {
  return text
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-extrabold text-stone-900">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-xs font-mono text-primary-green-dark">$1</code>');
}

function renderTableHtml(headers: string[], rows: string[][]): string {
  return `<div class="overflow-x-auto my-6 border border-stone-200 rounded-xl shadow-sm bg-white">
    <table class="min-w-full divide-y divide-stone-200 text-sm">
      <thead class="bg-stone-50">
        <tr>
          ${headers.map(h => `<th class="px-4 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">${parseInline(h)}</th>`).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-200">
        ${rows.map(row => `
          <tr class="hover:bg-stone-50/50 transition-colors">
            ${row.map(cell => `<td class="px-4 py-3 text-stone-800 leading-relaxed">${parseInline(cell)}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderBlockquoteHtml(content: string[]): string {
  const text = content.join('<br/>');
  const lowerText = text.toLowerCase();
  
  let calloutClass = "border-l-4 border-primary-green bg-primary-green/5 text-stone-700";
  let icon = "💡";
  let title = "Ghi chú";

  if (lowerText.includes('cảnh báo') || lowerText.includes('quan trọng') || lowerText.includes('lưu ý quan trọng') || lowerText.includes('caution') || lowerText.includes('warning')) {
    calloutClass = "border-l-4 border-amber-500 bg-amber-50/50 text-stone-800";
    icon = "⚠️";
    title = "Lưu ý quan trọng";
  } else if (lowerText.includes('công thức') || lowerText.includes('định nghĩa') || lowerText.includes('quy tắc')) {
    calloutClass = "border-l-4 border-indigo-500 bg-indigo-50/30 text-stone-855";
    icon = "🧠";
    title = "Kiến thức cốt lõi";
  }

  return `<div class="flex gap-3 my-5 p-4 rounded-r-xl ${calloutClass}">
    <span class="text-lg leading-none shrink-0 select-none">${icon}</span>
    <div class="space-y-0.5">
      <span class="text-[10px] font-bold uppercase tracking-wider block opacity-70">${title}</span>
      <div class="text-xs md:text-sm leading-relaxed">${text}</div>
    </div>
  </div>`;
}

async function parseMarkdown(md: string): Promise<string> {
  const processedLines: string[] = [];
  
  let inList: 'ul' | 'ol' | null = null;
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];
  let inBlockquote = false;
  let blockquoteContent: string[] = [];
  
  const placeholders: { [key: string]: string } = {};
  let placeholderCount = 0;

  function addPlaceholder(content: string): string {
    const id = `___PLACEHOLDER_${placeholderCount++}___`;
    placeholders[id] = content;
    return id;
  }

  // Pre-process math to protect it from line-by-line parsing
  let escapedMd = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Process math blocks: $$ ... $$
  escapedMd = escapedMd.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const rawMath = math
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    try {
      const rendered = katex.renderToString(rawMath.trim(), { displayMode: true, throwOnError: false });
      return addPlaceholder(`<div class="flex justify-center my-6 overflow-x-auto max-w-full">${rendered}</div>`);
    } catch (err) {
      return addPlaceholder(`<div class="text-error-red p-2 border border-error-red/20 rounded">Math Error: ${math}</div>`);
    }
  });

  // 2. Process inline math: $ ... $
  escapedMd = escapedMd.replace(/\$([^$\s][^$\n]*?[^$\s])\$/g, (_, math) => {
    const rawMath = math
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    try {
      const rendered = katex.renderToString(rawMath.trim(), { displayMode: false, throwOnError: false });
      return addPlaceholder(rendered);
    } catch (err) {
      return addPlaceholder(`$${math}$`);
    }
  });

  const parsedLines = escapedMd.split('\n');
  
  for (let i = 0; i < parsedLines.length; i++) {
    const line = parsedLines[i];
    const trimmedLine = line.trim();
    
    // --- 1. HANDLE CODE BLOCKS ---
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const rawCode = codeBlockContent.join('\n');
        
        if (codeBlockLang === 'mermaid') {
          const localUrl = await getMermaidBase64DataUri(rawCode);
          const imgTag = `<div class="flex flex-col items-center justify-center my-6 p-4 border border-stone-200 rounded-2xl bg-white shadow-sm max-w-full">
            <img src="${localUrl}" alt="Mermaid Diagram" class="max-w-full h-auto" />
            <span class="text-[10px] text-stone-400 mt-2 font-mono">📊 Sơ đồ kiến trúc tự động</span>
          </div>`;
          processedLines.push(addPlaceholder(imgTag));
        } else {
          const preTag = `<div class="relative my-6 rounded-xl overflow-hidden border border-stone-850 bg-stone-950 text-stone-100 shadow-md">
            <div class="flex items-center justify-between px-4 py-1.5 bg-stone-900 border-b border-stone-850 text-[10px] font-mono uppercase tracking-wider text-stone-450">
              <span>${codeBlockLang || 'code'}</span>
            </div>
            <pre class="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-stone-200"><code>${rawCode}</code></pre>
          </div>`;
          processedLines.push(addPlaceholder(preTag));
        }
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmedLine.slice(3).trim().toLowerCase();
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // --- 2. CLOSE OTHER BLOCKS IF EMPTY LINE ---
    if (trimmedLine === '') {
      if (inList) {
        processedLines.push(inList === 'ul' ? '</ul>' : '</ol>');
        inList = null;
      }
      if (inBlockquote) {
        processedLines.push(renderBlockquoteHtml(blockquoteContent));
        inBlockquote = false;
        blockquoteContent = [];
      }
      if (inTable) {
        processedLines.push(renderTableHtml(tableHeaders, tableRows));
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }
      processedLines.push('');
      continue;
    }

    // --- 3. HANDLE TABLES ---
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      if (inList) { processedLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      if (inBlockquote) { processedLines.push(renderBlockquoteHtml(blockquoteContent)); inBlockquote = false; blockquoteContent = []; }
      
      const cells = trimmedLine.split('|').slice(1, -1).map(c => c.trim());
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        const isSeparator = cells.every(c => c.replace(/[:\-\s]/g, '') === '');
        if (!isSeparator) {
          tableRows.push(cells);
        }
      }
      continue;
    } else if (inTable) {
      processedLines.push(renderTableHtml(tableHeaders, tableRows));
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    // --- 4. HANDLE HEADERS ---
    if (trimmedLine.startsWith('# ')) {
      processedLines.push(`<h1 class="text-2xl font-black text-on-background font-fraunces mt-8 mb-4 border-b border-gray-border pb-2">${parseInline(trimmedLine.slice(2))}</h1>`);
      continue;
    }
    if (trimmedLine.startsWith('## ')) {
      processedLines.push(`<h2 class="text-xl font-black text-on-background font-fraunces mt-6 mb-3">${parseInline(trimmedLine.slice(3))}</h2>`);
      continue;
    }
    if (trimmedLine.startsWith('### ')) {
      processedLines.push(`<h3 class="text-md font-bold text-on-background font-fraunces mt-5 mb-2">${parseInline(trimmedLine.slice(4))}</h3>`);
      continue;
    }

    // --- 5. HANDLE BLOCKQUOTES ---
    if (trimmedLine.startsWith('>')) {
      if (inList) { processedLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      inBlockquote = true;
      blockquoteContent.push(parseInline(trimmedLine.slice(1).trim()));
      continue;
    } else if (inBlockquote) {
      processedLines.push(renderBlockquoteHtml(blockquoteContent));
      inBlockquote = false;
      blockquoteContent = [];
    }

    // --- 6. HANDLE LISTS ---
    const bulletMatch = line.match(/^(\s*)([\*\-])\s+(.*)$/);
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    
    if (bulletMatch) {
      if (inList !== 'ul') {
        if (inList) { processedLines.push('</ol>'); }
        processedLines.push('<ul class="list-disc pl-6 my-2 space-y-1">');
        inList = 'ul';
      }
      processedLines.push(`<li class="text-stone-850 leading-relaxed">${parseInline(bulletMatch[3])}</li>`);
      continue;
    }
    
    if (numberedMatch) {
      if (inList !== 'ol') {
        if (inList) { processedLines.push('</ul>'); }
        processedLines.push('<ol class="list-decimal pl-6 my-2 space-y-1">');
        inList = 'ol';
      }
      processedLines.push(`<li class="text-stone-850 leading-relaxed">${parseInline(numberedMatch[3])}</li>`);
      continue;
    }

    if (inList) {
      processedLines.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }

    // --- 7. HANDLE PARAGRAPHS ---
    processedLines.push(`<p class="leading-relaxed text-stone-850 text-xs md:text-sm my-3.5">${parseInline(trimmedLine)}</p>`);
  }

  if (inList) processedLines.push(inList === 'ul' ? '</ul>' : '</ol>');
  if (inTable) processedLines.push(renderTableHtml(tableHeaders, tableRows));
  if (inBlockquote) processedLines.push(renderBlockquoteHtml(blockquoteContent));

  let finalHtml = processedLines.join('\n');

  for (const id in placeholders) {
    finalHtml = finalHtml.replace(new RegExp(id, 'g'), placeholders[id]);
  }

  return finalHtml;
}

export default async function GuidebookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  
  const programDay = getProgramDay(normalizedSlug);
  const title = programDay ? programDay.title : TOPICS_MAP[normalizedSlug];
  const filePaths = GUIDEBOOK_FILES[normalizedSlug];
  if (!title || !filePaths) {
    notFound();
  }

  let contentHtml = '';
  let knowledgeRoot = path.join(process.cwd(), 'knowledge');
  if (!fs.existsSync(knowledgeRoot)) {
    const altPath = path.join(process.cwd(), 'frontend', 'knowledge');
    if (fs.existsSync(altPath)) {
      knowledgeRoot = altPath;
    }
  }

  if (filePaths.length > 0) {
    try {
      const contents = await Promise.all(
        filePaths.map(async (relativeFilePath) => {
          const absolutePath = path.resolve(knowledgeRoot, relativeFilePath);
          if (!absolutePath.startsWith(knowledgeRoot)) {
            return '';
          }
          if (fs.existsSync(absolutePath)) {
            const fileContent = await fs.promises.readFile(absolutePath, 'utf8');
            const parsed = await parseMarkdown(fileContent);
            return `
              <div class="mb-12 border-b border-gray-border pb-8 last:border-b-0">
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-primary-green-dark uppercase tracking-wider font-mono mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Nội dung: ${path.basename(relativeFilePath)}
                </div>
                ${parsed}
              </div>
            `;
          }
          return '';
        })
      );
      contentHtml = contents.join('\n');
    } catch (e) {
      console.error('Error reading guidebook files:', e);
    }
  }

  if (!contentHtml.trim()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-be-vietnam-pro selection:bg-primary-green/20">
      {/* Top Header */}
      <header className="sticky top-0 bg-surface-container-lowest/95 backdrop-blur-md border-b border-gray-border z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-850 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Lộ trình học</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-green">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-black text-on-background uppercase tracking-wider font-fraunces">Edu Gap Guidebook</h1>
          </div>

          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 md:py-10">
        {/* Title Card */}
        <div className="bg-gradient-to-tr from-primary-green to-tertiary-yellow rounded-2xl p-6 md:p-8 text-white shadow-md mb-8">
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-80 font-mono">
            Tài liệu hướng dẫn & Tóm tắt kiến thức
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-1.5 tracking-wide font-fraunces">{title}</h2>
        </div>

        {/* Notes Content */}
        <div 
          className="bg-white border border-gray-border p-6 md:p-10 rounded-2xl shadow-sm prose max-w-none text-stone-850"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low/30 border-t border-gray-border/50 py-4 text-center text-[10px] font-mono text-stone-400 mt-auto">
        Edu Gap &copy; 2026
      </footer>
    </div>
  );
}
