import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import katex from 'katex';
import { createTraceId, diagnosticsLog } from '@/lib/diagnostics/logger';

export const dynamic = 'force-dynamic';

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
    calloutClass = "border-l-4 border-indigo-500 bg-indigo-50/30 text-stone-850";
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
  let inBlockquote = false;
  let blockquoteContent: string[] = [];
  
  const placeholders: { [key: string]: string } = {};
  let placeholderCount = 0;

  function addPlaceholder(content: string): string {
    const id = `___PLACEHOLDER_${placeholderCount++}___`;
    placeholders[id] = content;
    return id;
  }

  // === PASS 1: Extract code blocks from RAW markdown (before any escaping) ===
  // This is critical: Mermaid arrows like --> must NOT be converted to --&gt;
  let mdWithCodeExtracted = md;
  const codeBlockRegex = /^```(\w*)\n([\s\S]*?)^```/gm;
  const asyncCodeReplacements: Array<{ id: string; promise: Promise<string> }> = [];

  mdWithCodeExtracted = md.replace(codeBlockRegex, (_, lang, code) => {
    const langName = lang.trim().toLowerCase();
    const rawCode = code.trimEnd(); // preserve inner indentation, just trim trailing newline

    if (langName === 'mermaid') {
      const id = addPlaceholder(''); // reserve slot
      asyncCodeReplacements.push({
        id,
        promise: getMermaidBase64DataUri(rawCode).then(dataUri => {
          return `<div class="flex flex-col items-center justify-center my-6 p-4 border border-stone-200 rounded-2xl bg-white shadow-sm max-w-full overflow-x-auto">
            <img src="${dataUri}" alt="Mermaid Diagram" class="max-w-full h-auto" />
            <span class="text-[10px] text-stone-400 mt-2 font-mono">📊 Sơ đồ kiến trúc tự động</span>
          </div>`;
        }).catch(() => {
          return `<div class="p-3 bg-stone-100 rounded text-xs text-stone-500 font-mono">[Mermaid diagram - failed to render]</div>`;
        }),
      });
      return id;
    } else {
      // Escape HTML inside non-mermaid code blocks for display
      const escapedCode = rawCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const preTag = `<div class="relative my-6 rounded-xl overflow-hidden border border-stone-850 bg-stone-950 text-stone-100 shadow-md">
        <div class="flex items-center justify-between px-4 py-1.5 bg-stone-900 border-b border-stone-850 text-[10px] font-mono uppercase tracking-wider text-stone-450">
          <span>${langName || 'code'}</span>
        </div>
        <pre class="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-stone-200"><code>${escapedCode}</code></pre>
      </div>`;
      return addPlaceholder(preTag);
    }
  });

  // Resolve all async Mermaid renderings in parallel
  if (asyncCodeReplacements.length > 0) {
    const results = await Promise.all(asyncCodeReplacements.map(r => r.promise));
    asyncCodeReplacements.forEach((r, i) => {
      placeholders[r.id] = results[i];
    });
  }

  // === PASS 2: HTML-escape the remaining text and process math/inline ===
  let escapedMd = mdWithCodeExtracted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process math blocks: $$ ... $$
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

  // Process inline math: $ ... $
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

    // Skip lines that are already placeholders (code blocks extracted in pass 1)
    if (trimmedLine.startsWith('___PLACEHOLDER_') && trimmedLine.endsWith('___')) {
      processedLines.push(trimmedLine);
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
    if (trimmedLine.startsWith('&gt;')) {
      if (inList) { processedLines.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      inBlockquote = true;
      blockquoteContent.push(parseInline(trimmedLine.slice(4).trim()));
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const traceId = createTraceId();
  try {
    const { slug } = await params;
    const normalizedSlug = slug.toLowerCase();
    
    const filePaths = GUIDEBOOK_FILES[normalizedSlug];
    if (!filePaths) {
      return NextResponse.json({ error: 'guidebook_not_found', trace_id: traceId }, { status: 404 });
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
              <div class="mb-10 border-b border-stone-100 pb-6 last:border-b-0">
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-amber-700 uppercase tracking-wider font-mono mb-2">
                  📄 Hướng dẫn: ${path.basename(relativeFilePath)}
                </div>
                ${parsed}
              </div>
            `;
          }
          return '';
        })
      );
      contentHtml = contents.join('\n');
    }

    if (!contentHtml.trim()) {
      return NextResponse.json({ error: 'guidebook_empty', trace_id: traceId }, { status: 404 });
    }

    return NextResponse.json({ html: contentHtml, trace_id: traceId });
  } catch (error) {
    diagnosticsLog('error', 'guidebook.failed', { traceId, error });
    return NextResponse.json({ error: 'guidebook_unavailable', trace_id: traceId }, { status: 503 });
  }
}
