# Plan: Liquid Water Progress Redesign for Learning Path Nodes

This plan proposes the visual redesign of the active skill nodes in the [LearningPath.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx) to use a **Liquid/Water Filling Progress Animation** (phần nước đầy theo %). 

Instead of a solid colored button, active nodes will appear as "glass bubbles" containing animated colored liquid that fills up to the exact mastery percentage of the skill.

---

## Proposed Changes

### 1. New Reusable UI Component

#### [NEW] [wave-progress.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/ui/wave-progress.tsx)
- Create a reusable React component `WaveProgress` accepting:
  - `percent`: number (0 to 100, representing the fill height)
  - `color`: string (the wave color, matching the topic's theme color)
- The component will render:
  - A container `absolute inset-0 overflow-hidden rounded-full pointer-events-none z-0`
  - A base filled layer at the bottom matching `height: ${percent}%`.
  - Two overlay SVG sine-wave layers shifted vertically to sit on top of the water level.
  - A local `<style>` tag defining `@keyframes wave-flow` (seamless horizontal offset from `0` to `-50%` of width) and `@keyframes wave-flow-reverse` (moving in the opposite direction at a different speed) to create a parallax liquid effect.

---

### 2. Learning Path Integration

#### [MODIFY] [LearningPath.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx)
- **Import** `WaveProgress` from `@/components/ui/wave-progress`.
- **Update Active Node Background**:
  - In `getTileColors`, when `status === 'ACTIVE'`, instead of rendering the solid default background color (`style.bg`), render the light background color (`style.lightBg`) (e.g. `bg-emerald-50` instead of `bg-emerald-500`).
  - This turns the button into a light/hollow glass bubble, allowing the liquid inside to be clearly visible.
- **Render Water Progress**:
  - Inside the main skill button, if `status === 'ACTIVE'` or `status === 'COMPLETE'` (optionally), render `<WaveProgress percent={skill.masteryScore} color={getProgressStrokeColor(style.bg)} />`.
  - Add `overflow-hidden` to the button's class list to clip the wave.
  - Wrap the `TileIcon` inside a wrapper or add `z-10 relative` so it renders on top of the water layer.
- **Progress Ring Outer Sync**:
  - The outer progress ring around the button (concentric circle SVG) will remain intact, serving as a clean high-contrast visual outline of progress.

---

## Verification Plan

### Automated Tests
- Run `pnpm exec tsc --noEmit` to verify type-safety.

### Manual Verification
- View `localhost:3000` to inspect the learning path.
- Verify the active node has its inner circle partially filled with water (e.g. 56%).
- Verify that the wave moves continuously and seamlessly without jarring jumps.
- Verify the icon (book, star, etc.) is centered and sits cleanly on top of the liquid.
