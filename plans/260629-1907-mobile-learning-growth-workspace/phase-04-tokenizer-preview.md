---
phase: 4
title: "Tokenizer Preview"
status: completed
priority: P2
dependencies: [3]
---

# Phase 4: Tokenizer Preview

## Overview

Add a lightweight contextual preview that makes AI/LLM concepts feel interactive without turning the page into a full playground. The first implementation should be static and conditional: show tokenizer/embedding preview only when the active concept title or metadata matches tokenization/embedding.

## Requirements

- Functional: preview appears only for relevant concepts.
- Functional: preview is educational but non-blocking; it does not change quiz data.
- Non-functional: no backend/API call.
- Non-functional: animation must be minimal and respect reduced motion.
- Non-functional: preview must be hidden or compact when it would push CTA too far down.

## Architecture

```text
MobileLearningWorkspace
  selectedItem
  ConceptPreviewRouter
    if tokenization/embedding -> TokenizerMiniPreview
    else -> WhyThisMattersCard or null
```

Use deterministic local matching initially. Later, curriculum metadata can provide `previewType`.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/concept-preview-router.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/tokenizer-mini-preview.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Optional modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/program-curriculum.ts`

## Implementation Steps

1. Create `ConceptPreviewRouter`:
   - input: selected `DetailConceptItem`.
   - helper: `isTokenizerConcept(title, description)`.
2. Create `TokenizerMiniPreview`:
   - input text: `I love AI`.
   - tokens: `"I"`, `"love"`, `"AI"`.
   - vector bars as CSS rectangles.
   - no editable input in first version.
3. Add `WhyThisMattersCard` fallback only if it helps; otherwise render nothing for non-token concepts.
4. Keep preview visually bounded:
   - one card.
   - compact grid on mobile.
   - no large arrows that create horizontal overflow.
5. Add accessible names:
   - cards are read as explanatory content, not controls unless clickable.
   - any link/button such as `Hiểu thêm` uses real button/link semantics.
6. Consider future metadata:
   - do not hardcode many string branches.
   - leave a clear TODO in plan/code only if metadata is intentionally deferred.

## Success Criteria

- [x] Tokenizer preview appears for Tokenization/Embedding concepts.
- [x] Preview does not appear for unrelated concepts unless a fallback is intentionally enabled.
- [x] No interactive fake input unless it actually changes output.
- [x] Reduced-motion users see a static preview.
- [x] No horizontal overflow on mobile.

## Completion Notes

- Implemented `ConceptPreviewRouter` with deterministic token/embedding/vector matching.
- Implemented static `TokenizerMiniPreview` with non-editable demo copy and reduced-motion-safe styling.

## Risk Assessment

- Risk: fake playground looks interactive but is not.
  - Mitigation: label it as preview/demo, or implement real local input later.
- Risk: string matching misses Vietnamese titles.
  - Mitigation: match `token`, `embedding`, `vector`, and Vietnamese description keywords; later replace with metadata.
- Risk: card distracts from skill list.
  - Mitigation: render after selected skill list and before sticky CTA only when relevant.
