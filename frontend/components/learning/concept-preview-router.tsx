'use client';

import Image from 'next/image';
import type { DetailConceptItem } from '@/components/learning/day-detail-card';
import { TokenizerMiniPreview } from '@/components/learning/tokenizer-mini-preview';
import { getLearningSceneryAsset } from './learning-visual-asset-map';

interface ConceptPreviewRouterProps {
  item?: DetailConceptItem | null;
  eyebrow?: string;
}

const TOKENIZER_KEYWORDS = [
  'token',
  'tokenizer',
  'tokenization',
  'embedding',
  'embeddings',
  'vector',
  'vectors',
  'tach token',
  'tách token',
  'nhúng',
  'bieu dien vector',
  'biểu diễn vector',
  'word piece',
];

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function isTokenizerConcept(title?: string, description?: string): boolean {
  const haystack = normalizeText(`${title ?? ''} ${description ?? ''}`);
  return TOKENIZER_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function ConceptPreviewRouter({ item, eyebrow = 'Static Preview' }: ConceptPreviewRouterProps) {
  if (!item) return null;
  if (isTokenizerConcept(item.concept.title, item.concept.description)) {
    return <TokenizerMiniPreview conceptTitle={item.concept.title} eyebrow={eyebrow} />;
  }

  const asset = getLearningSceneryAsset(item.concept.title, item.concept.description);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-primary-green/15 bg-white p-4 shadow-sm"
      aria-labelledby="concept-visual-preview-title"
    >
      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-green-dark">
            {eyebrow}
          </p>
          <h3
            id="concept-visual-preview-title"
            className="mt-1 font-fraunces text-lg font-black leading-tight text-on-background"
          >
            {item.concept.title}
          </h3>
          <p className="mt-1 line-clamp-3 text-sm font-semibold leading-relaxed text-stone-600">
            {item.concept.description}
          </p>
        </div>
        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl bg-primary-green-light/20 sm:block" aria-hidden="true">
          <Image
            src={asset.src320}
            alt=""
            fill
            sizes="192px"
            className="object-contain p-2"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
