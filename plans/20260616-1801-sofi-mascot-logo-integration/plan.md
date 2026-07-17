# Plan: Sofi Mascot Logo & Chatbot Avatar Integration

This plan outlines the integration of "Cáo Sofi" (Sofi the Fox)—our official academic mascot—as the primary brand logo and chatbot avatar across the Sapia AI frontend application. This replaces the generic `Sparkles` icon and emoji placeholders with the vector art and interactive micro-animations.

---

## Proposed Changes

### 1. Brand Component

#### [NEW] [sofi-mascot.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/brand/sofi-mascot.tsx)
- Create a reusable React component `SofiMascot` that accepts the following props:
  - `size`: number (default: `40`, controls width & height)
  - `animated`: boolean (default: `true`, enables ambient bobbing)
  - `isTyping`: boolean (default: `false`, triggers faster searching/thinking bobbing)
  - `className`: string (optional additional styles)
- Use Framer Motion (`motion.svg`, `motion.path`, etc.) to implement premium interactive animations:
  - **Ear Twitching**: Slight rotation of ears on hover (`whileHover`).
  - **Ambient Breathing**: Smooth, slow up-down translation of the face (`y: [0, -2, 0]`) at idle.
  - **Typing State**: Energetic bobbing animation (`y: [0, -4, 0]`) to signal AI thinking.
  - **Blinking Glasses**: Periodic brief scaling/opacity pulse of the eyes.
- Use the exact brand vector colors (#ff9600 for orange, #ffc800 for yellow, #ffffff, and theme green for graduation cap).

---

### 2. Application Logo & Navigation

#### [MODIFY] [LeftBar.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LeftBar.tsx)
- Replace the `Sparkles` icon in the desktop sidebar header with the `<SofiMascot size={40} />` component.
- Ensure the hover state on the header triggers the ear-twitching micro-animation.

#### [MODIFY] [LoginScreen.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LoginScreen.tsx)
- Replace the `Sparkles` icon in the modal's header badge with `<SofiMascot size={28} />`.

#### [MODIFY] [login/page.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/login/page.tsx)
- Replace the `Sparkles` icon in the card's top badge with `<SofiMascot size={32} />`.

---

### 3. Chatbot Avatar

#### [MODIFY] [socratic-chat-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx)
- Replace the `🦊` emoji inside the header avatar container with `<SofiMascot size={32} animated={false} />`.
- Replace the `🦊` emoji inside AI response message bubbles with `<SofiMascot size={36} />`.
- Replace the static `🦊` emoji in the typing indicator (searching slide) with `<SofiMascot size={36} isTyping={true} />`.
  - *Note:* We will preserve the existing custom "Miniature Fox with Magnifying Glass SVG" on the searching card since it represents a highly specialized concept search visual.

#### [MODIFY] [practice-workspace.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/practice/practice-workspace.tsx)
- Replace the `🦊` emoji in the Socratic AI drawer header with `<SofiMascot size={32} animated={false} />`.
- Replace the `🦊` emoji in Socratic AI chat message bubbles with `<SofiMascot size={32} />`.
- Replace the `🦊` emoji inside the typing bubble with `<SofiMascot size={32} isTyping={true} />`.

---

## Verification Plan

### Automated Tests
- Run `pnpm exec tsc --noEmit` to verify type-safety of the new component and its integration points.

### Manual Verification
- **App Logo**: Verify that the sidebar header now displays the vector fox head with a graduation cap. Hover over it to trigger ear-twitch.
- **Login screen**: Verify the logo displays cleanly.
- **Chat & Drawer**: Verify chatbot bubbles display the fox avatar. Check that during bot typing states, the avatar displays the bobbing thinking animation.
- Check accessibility tags (`aria-hidden="true"` on SVGs when appropriate).
