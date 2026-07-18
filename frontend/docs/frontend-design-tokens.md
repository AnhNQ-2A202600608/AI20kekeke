# Frontend Design Tokens

## Overview

The current frontend uses a warm amber/stone palette and rounded, gamified EdTech components. The root product design guideline suggests a more academic blue/purple system. For consistency, the frontend should keep the current warm language for EduGap unless product leadership chooses a visual reset. If reset happens, map current semantic tokens to the root academic palette instead of changing components ad hoc.

## Semantic Token Model

Use semantic names in design docs and components even when Tailwind classes are utility-based.

| Token | Current frontend value | Target purpose |
| --- | --- | --- |
| `surface.app` | `#FDFBF7` | Main warm study background. |
| `surface.card` | `white` | Cards, panels, quiz containers. |
| `surface.subtle` | `amber-50`, `stone-50` | Light emphasis and grouped content. |
| `border.default` | `amber-100`, `stone-200` | Soft separation. |
| `text.primary` | `amber-950`, `stone-850` | Main headings/content. |
| `text.secondary` | `stone-500`, `stone-600` | Supporting labels/body. |
| `brand.primary` | `amber-500` | Main CTA, active navigation, progress bars. |
| `brand.primary-hover` | `amber-600` | CTA hover state. |
| `brand.accent` | `yellow-500` | XP, reward, gradients, celebration. |
| `state.success` | `emerald-500` | Correct answer, mastered, success messages. |
| `state.danger` | `rose-500` | Incorrect answer, weak concept, error. |
| `state.warning` | `orange-500`, `amber-600` | Streak, attention, review needed. |
| `state.neutral` | `stone-300`, `stone-400` | Disabled or not-started. |

## Current Color Usage

| Area | Color pattern | Notes |
| --- | --- | --- |
| App background | `bg-[#FDFBF7]` | Used in root and focused quiz mode. |
| Active nav | `bg-amber-500/10`, `text-amber-950`, `border-amber-500` | Used for sidebar and mobile nav. |
| Primary CTA | `bg-amber-500 hover:bg-amber-600 text-white` | Used for quiz, login, waitlist. |
| Progress | `from-amber-400 to-yellow-500` | Used in quiz and completion bars. |
| Success | `emerald-*` | Correct answers, submitted messages. |
| Error/incorrect | `rose-*` | Wrong answers and failed state. |
| Cards | `bg-white border border-amber-100 rounded-2xl shadow-sm` | Primary panel pattern. |

## Typography

| Token | Current pattern | Use |
| --- | --- | --- |
| `font.heading` | Tailwind sans, heavy weights | Page titles, card titles, CTA labels. |
| `font.body` | Tailwind sans | Learning content and descriptions. |
| `font.mono` | `font-mono` | Metrics, counters, small uppercase labels. |
| `text.xs-label` | `text-[9px]` to `text-xs`, uppercase, bold | Badges and metadata. |
| `text.body` | `text-xs md:text-sm`, comfortable leading | Quiz body, guidebook excerpts. |
| `text.title` | `text-md md:text-lg`, `font-bold/black` | Card and section headings. |

## Spacing and Shape

| Token | Current pattern | Use |
| --- | --- | --- |
| `radius.control` | `rounded-xl` | Buttons, inputs, badges. |
| `radius.panel` | `rounded-2xl` | Cards, modals, containers. |
| `space.card` | `p-5`, `p-6` | Standard panels. |
| `space.stack` | `space-y-4`, `space-y-6` | Vertical layout. |
| `shadow.soft` | `shadow-sm` | Cards and controls. |
| `shadow.brand` | `shadow-amber-500/10` | CTA emphasis. |

## Component State Tokens

### Buttons

| State | Visual rule |
| --- | --- |
| Default primary | Amber background, white text, bold label. |
| Hover | Darker amber or subtle brightness. |
| Active | Slight vertical translate and reduced bottom border when 3D style exists. |
| Disabled | `stone-50`, `stone-200`, `stone-400`, no pointer intent. |
| Secondary | `stone-100` or white with border. |

### Quiz options

| State | Visual rule |
| --- | --- |
| Unanswered | Warm light background, amber border, stone text. |
| Selected before submit | Amber tint, amber border, bold text. |
| Correct | Emerald tint, emerald border, check icon. |
| Incorrect selected | Rose tint, rose border, X icon. |
| Non-answer after submit | Reduced opacity and neutral color. |

### Mastery states

| State | Color | Required label |
| --- | --- | --- |
| Mastered | Emerald/success | `Thành thạo` |
| Learning | Amber/primary | `Đang học` or `Khá` |
| Weak | Rose/warning | `Cần ôn tập` |
| Not started | Stone/neutral | `Chưa học` |

## Accessibility Rules

- Do not encode mastery by color alone; include text label or icon.
- Keep focus rings visible on buttons, links, inputs, and tab controls.
- Quiz feedback must include text such as `Chuẩn xác` or `Chưa chính xác`.
- Citation cards must remain near answer text and readable on mobile.
- Motion should be short and non-blocking.

## Future Palette Decision

If the product shifts to the root academic palette:

| Current warm token | Academic replacement |
| --- | --- |
| `brand.primary` amber | Blue primary `hsl(220, 90%, 56%)` |
| AI accent yellow | Purple secondary `hsl(262, 80%, 50%)` |
| Weak rose | Warning red `hsl(350, 80%, 55%)` |
| Success emerald | Success green `hsl(142, 70%, 45%)` |
| Warm app bg | Light background `hsl(210, 40%, 98%)` |

Make this as a deliberate redesign, not mixed incremental drift.
