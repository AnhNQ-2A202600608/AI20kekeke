# Research Report: AI Quiz Tutor UI Patterns

---
created: "2026-07-01 01:40 +07:00"
scope: "student POV quiz screen with AI chatbot, hints, answer explanation, MCQ flow"
sources: 10
---

## Executive Summary

The current EduGap quiz screen is doing too many jobs at once: answering MCQ, showing correctness, exposing AI chat, hint state, system notices, mascot, sharing/reporting, and next action. Comparable products avoid this by separating the learning moment into phases: answer first, hint only when requested, explanation after submission, full AI chat only as a secondary surface.

Best pattern for EduGap: make the quiz canvas dominant, keep AI as a contextual coach panel, and use progressive disclosure. Desktop should default to about `70/30` or `72/28` quiz-to-AI when AI is open, and `100% quiz + small coach rail` when closed. Mobile should never show quiz and full chat side-by-side; use a bottom sheet for hints/explanations/chat.

The AI assistant should not behave like a persistent generic chat while the learner is answering. It should behave like a state machine: `Need hint?` before answer, `Why was this wrong?` after wrong answer, `Why is this right?` after correct answer, and `Ask follow-up` only after the short explanation.

## Research Methodology

Sources consulted:

- Khanmigo/Khan Academy official pages
- Duolingo Max / Explain My Answer official blog
- Quizlet Q-Chat official blog/content
- Socratic by Google official page
- Slack split view docs as a mature side-by-side AI/workflow pattern
- Nielsen Norman Group AI chatbot/progressive disclosure guidelines
- IxDF progressive disclosure reference
- IBM chatbot design overview

Key terms:

- AI tutor UI
- explain my answer
- quiz hint UX
- progressive disclosure
- chatbot sidebar
- split view AI assistant
- cognitive load in learning UI

## Key Findings

### 1. AI Tutor Should Guide, Not Replace The Exercise

Khanmigo frames AI tutoring as guiding learners to discover answers rather than giving final answers. This maps directly to EduGap: AI should not be a full open chat by default during MCQ answering. The default AI affordance should be a guided help action.

Recommended EduGap behavior:

- Before submission: show `Gợi ý 1`, `Gợi ý 2`, `Gợi ý 3`, not a freeform chat first.
- Do not show long AI message history while the learner is choosing.
- If learner opens full chat, preserve context but move it into a separate panel/sheet.

Source: https://www.khanmigo.ai/

### 2. Explain My Answer Is Post-Answer Feedback, Not A Permanent Sidebar

Duolingo's Explain My Answer is an in-lesson feedback feature. It is triggered by the answer event and explains the specific mistake/pattern. It is not the main exercise surface.

Recommended EduGap behavior:

- After wrong answer: primary AI CTA = `Giải thích vì sao sai`.
- After correct answer: secondary AI CTA = `Vì sao đáp án này đúng?`.
- Explanation opens as a compact card with:
  - one-line verdict
  - the rule/concept
  - one follow-up CTA
- Full chat only after this card, not before.

Sources:

- https://blog.duolingo.com/duolingo-max/
- https://blog.duolingo.com/explain-my-answer-now-free/

### 3. AI Chat Needs Progressive Disclosure

NN/g recommends progressive disclosure in AI chat responses and suggested prompts as buttons, not raw instructional text. IxDF also frames progressive disclosure as a way to reduce cognitive overload.

Current EduGap issue from screenshot:

- The AI panel shows header, mascot, greeting, generated prompt, message bubble, input area, and next action all at once.
- The right panel visually competes with the question.
- Chat input is visible even when the next best action is simply `Tiếp tục câu 2`.

Recommended:

- Hide chat composer until learner clicks `Hỏi thêm`.
- Use suggested prompt chips:
  - `Gợi ý nhẹ`
  - `Giải thích vì sao sai`
  - `Cho ví dụ tương tự`
  - `Rút gọn 1 câu`
- Keep AI answer collapsed to summary first; expand for details.

Sources:

- https://www.nngroup.com/articles/ai-chatbots-design-guidelines/
- https://www.nngroup.com/articles/progressive-disclosure/
- https://ixdf.org/literature/topics/progressive-disclosure

### 4. Split View Works Only When The Secondary Pane Is Truly Secondary

Slack split view is useful because the side pane supports the main work without forcing navigation away. But it is explicitly side-by-side, not two primary workspaces competing.

For EduGap:

- Desktop can use split view.
- The quiz pane must remain the dominant workspace.
- The AI pane should be collapsible, narrow, and context-bound.
- The AI pane should not include large mascot/art inside the already constrained right panel.

Source: https://docs.slack.dev/surfaces/split-view

### 5. Socratic/Google Pattern: Search/Explainers Are Result Cards

Socratic by Google positions help as step-by-step explainers, videos, and results, not as a persistent chatbot competing with the problem.

EduGap implication:

- Use AI output as explanation cards tied to the selected answer.
- Source/citation slide viewer should be a secondary drawer, not inside the main AI message body by default.

Source: https://socratic.org/

## Comparative Pattern Matrix

| Product | Main pattern | What EduGap should copy | What not to copy |
| --- | --- | --- | --- |
| Khanmigo | Guided tutor, avoids direct answer-first behavior | Hint ladder and Socratic prompts | Full chat visible at all times during MCQ |
| Duolingo Explain My Answer | Feedback after answer event | `Explain why wrong/right` as post-answer CTA | Turning explanation into a long chat thread |
| Quizlet Q-Chat | Study chat around known materials | Prompt chips like `Teach me`, `Quiz me`, `Apply` | Generic chat as the main quiz UI |
| Socratic/Google | Step-by-step explainers/results | Explanation cards and source cards | Search-result overload inside the answer screen |
| Slack split view | Secondary pane beside main work | Collapsible AI side pane | Equal-width panes for primary task and assistant |

Sources:

- https://quizlet.com/blog/meet-q-chat
- https://quizlet.com/content/brainpower
- https://slack.com/help/articles/47144721728275-Use-split-view-in-Slack

## Recommended Layout Ratios

### Desktop Wide: `>= 1200px`

Default answering state:

```text
Top bar: 56-64px

Quiz canvas: 100%
AI: collapsed coach rail, 48-64px wide, or hidden behind "Sofi" button
Bottom action: 64-76px
```

When AI is open:

```text
Quiz pane: 68-72%
AI coach pane: 28-32%
Gutter: 12-16px
```

Hard rule: quiz question + options must fit without feeling compressed. If answer option text wraps beyond 2-3 lines, AI should auto-collapse.

### Desktop Medium: `1024-1199px`

```text
Quiz pane: 100%
AI: right drawer overlay, max-width 360px
```

Do not permanently reserve 35-40% width for AI at this breakpoint.

### Tablet: `768-1023px`

```text
Quiz pane: 100%
AI: bottom sheet, 60-75vh
```

### Mobile: `< 768px`

```text
Quiz only.
Hint/explanation/chat opens as bottom sheet.
Bottom sheet states:
  compact: 36-44vh
  expanded: 72-82vh
```

## Recommended Interaction Flow

### State A: Reading Question

Visible:

- question
- answer choices
- progress
- compact status pills
- `Hint` button
- `Sofi` button as secondary

Hidden:

- chat history
- chat composer
- citation/source panels
- explanation cards

### State B: Learner Requests Hint

Show a small inline or bottom card:

```text
Hint 1/3
One concise nudge, max 2 lines.
Actions: More hint, Ask Sofi
```

Do not open full chat automatically.

### State C: Learner Answers Wrong

Show:

- selected wrong answer
- correct answer
- one-line feedback
- primary CTA: `Giải thích vì sao sai`
- secondary CTA: `Tiếp tục`

If learner clicks explanation:

```text
Why it is wrong
1. misconception
2. rule/concept
3. how to recognize next time
CTA: Ask follow-up
```

### State D: Learner Answers Correct

Show:

- correctness
- quick reinforcement
- optional CTA: `Vì sao đúng?`
- primary CTA: `Tiếp tục`

### State E: Full AI Chat

Only after learner asks follow-up.

Chat panel should include:

- current question context chip
- suggested prompts
- answer thread
- composer

Avoid showing greeting messages repeatedly.

## Diagnosis Of Current Screenshot

Main problems:

1. Right AI panel competes with the quiz instead of supporting it.
2. The mascot/avatar is too visually dominant for a narrow pane.
3. Chat greeting is redundant after a wrong answer; the learner needs targeted feedback.
4. Composer is visible while next best action is continuing or asking why wrong.
5. The left pane has disabled/washed options plus error notice plus answer state plus right chat, causing split attention.
6. CTA hierarchy is unclear: `Tiếp tục`, `Hỏi AI vì sao sai`, chat input send, report, share are all visible together.

## Recommended EduGap Redesign Direction

### Structural Change

Use a `QuizWorkspace` with three display modes:

```text
answering:
  quiz full width
  AI collapsed

review:
  quiz 70%
  explanation card 30% OR inline feedback card

chat:
  quiz 70%
  AI chat 30%
```

### Component Split

Recommended component boundaries:

```text
QuizQuestionCanvas
QuizFeedbackCard
HintLadderCard
SofiCoachPanel
SofiCoachBottomSheet
QuizActionBar
```

### CTA Priority

Before answer:

1. Submit answer
2. Hint
3. Sofi

After wrong:

1. Continue
2. Explain why wrong
3. Report issue

After correct:

1. Continue
2. Explain why right

Share should move to result screen, not question screen.

## Implementation Recommendations

1. Collapse AI by default during MCQ answering.
2. Replace always-visible chat with a compact `SofiCoachPanel`.
3. Move hint into a ladder card, not full chat.
4. Convert wrong-answer explanation into a targeted post-answer panel.
5. Hide chat composer until `Ask follow-up`.
6. Remove large mascot from narrow AI pane; use small avatar only.
7. Use a responsive breakpoint:
   - `>=1200`: side panel allowed
   - `<1200`: drawer/bottom sheet
8. Keep only one primary CTA visible per state.

## References

- Khanmigo: https://www.khanmigo.ai/
- Khanmigo Parents: https://www.khanmigo.ai/parents
- Duolingo Max: https://blog.duolingo.com/duolingo-max/
- Duolingo Explain My Answer: https://blog.duolingo.com/explain-my-answer-now-free/
- Quizlet Q-Chat: https://quizlet.com/blog/meet-q-chat
- Quizlet Brainpower/Q-Chat prompts: https://quizlet.com/content/brainpower
- Socratic by Google: https://socratic.org/
- NN/g AI chatbot guidelines: https://www.nngroup.com/articles/ai-chatbots-design-guidelines/
- NN/g Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- IxDF Progressive Disclosure: https://ixdf.org/literature/topics/progressive-disclosure
- Slack Split View: https://docs.slack.dev/surfaces/split-view

## Unresolved Questions

- Should EduGap allow AI chat before the learner attempts an answer, or only hints?
- Should hints cost Elo/score, or only be tracked for analytics?
- Should `Explain why wrong` be generated immediately after wrong answer or only on click?
- Does the teacher/BTC POV need to inspect AI hint/chat history later?
