'use client';

interface TokenizerMiniPreviewProps {
  conceptTitle?: string;
  eyebrow?: string;
}

const previewSentence = 'I love AI';
const previewTokens = [
  { token: 'I', bars: [42, 78, 56, 68] },
  { token: 'love', bars: [86, 48, 64, 36] },
  { token: 'AI', bars: [58, 74, 88, 52] },
] as const;

export function TokenizerMiniPreview({ conceptTitle, eyebrow = 'Static Preview' }: TokenizerMiniPreviewProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-primary-green/20 bg-white p-4 shadow-sm"
      aria-labelledby="tokenizer-mini-preview-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-green-dark">
            {eyebrow}
          </p>
          <h3
            id="tokenizer-mini-preview-title"
            className="mt-1 font-fraunces text-lg font-black leading-tight text-on-background"
          >
            Từ câu ngắn thành token rồi thành vector
          </h3>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-600">
            Mini demo này giải thích cách <span className="font-black">{conceptTitle ?? 'concept'}</span> biến văn bản thành biểu diễn mà máy có thể xử lý.
          </p>
        </div>
        <span className="rounded-full border border-primary-green/20 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-primary-green-dark">
          Không tương tác
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-border bg-surface-container-low p-3">
        <p className="text-[11px] font-black uppercase tracking-wide text-stone-500">Input</p>
        <div className="mt-2 rounded-2xl border border-gray-border bg-surface-container-low px-3 py-2 font-mono text-sm font-bold text-on-background">
          {previewSentence}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-gray-border bg-white p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-stone-500">Tokens</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {previewTokens.map(({ token }) => (
              <span
                key={token}
                className="rounded-2xl border border-primary-green/20 bg-primary-green/10 px-3 py-2 font-mono text-sm font-black text-primary-green-dark"
              >
                {token}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-stone-500">
            Mỗi token là một đơn vị nhỏ hơn để mô hình đọc, so sánh và dự đoán.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-border bg-white p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-stone-500">Vector Snapshot</p>
          <div className="mt-3 space-y-3">
            {previewTokens.map(({ token, bars }) => (
              <div key={token} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
                <span className="truncate font-mono text-xs font-black uppercase text-stone-500">{token}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {bars.map((height, index) => (
                    <span
                      key={`${token}-${index}`}
                      className="flex h-12 items-end overflow-hidden rounded-full bg-stone-100"
                    >
                      <span
                        className="block w-full rounded-full bg-gradient-to-t from-primary-green via-primary-green to-tertiary-yellow motion-safe:animate-pulse motion-reduce:animate-none"
                        style={{ height: `${height}%`, animationDelay: `${index * 120}ms` }}
                        aria-hidden="true"
                      />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-stone-500">
            Các cột chỉ là minh họa cho vector đặc trưng, không phải giá trị thật của mô hình.
          </p>
        </div>
      </div>
    </section>
  );
}
