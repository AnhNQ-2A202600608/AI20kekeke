# Landing Page Specification (EduGap)

## Goal

Design a landing page for EduGap (an Adaptive-first AI Tutor for Higher Education). 
The page must convince university decision-makers, faculty leads, and lecturers that this is not a generic chatbot. It is a secure, grounded, and adaptive learning system that helps students learn via Socratic guidance and provides lecturers with classroom-level gap diagnosis.

## Audience

- **Primary:** University deans, department heads, faculty leads, and lecturers (B2B buyers).
- **Secondary:** Students (end-users) seeking personalized support.

## Core Positioning

> A personalized AI tutor that measures mastery, teaches with Socratic guidance, cites official course materials, and gives lecturers actionable class insights while preventing AI-assisted homework cheating.

Avoid:
- “AI that solves homework instantly”
- Generic chatbot or general LMS platform positioning
- Overpromising full teaching automation (AI does not replace lecturers; it scales their support)

---

## Visual Direction (Sapia Design System)

- **Colors:**
  - Background: Cozy light avocado (`#f4fce8`)
  - Primary text: Dark charcoal (`#171e12`)
  - Action elements: Primary Green (`#58cc02`), Secondary Green/Teal (`#00cd9c`), Info Blue (`#1cb0f6`)
  - Highlighting/Warning states: Tertiary Yellow (`#ffc800`), Accent Orange (`#ff9600`), Error Red (`#ff4b4b`)
  - **Purple Ban:** strictly NO purple, violet, magenta, or indigo colors.
- **Tactile 3D Click:** Interactive components (buttons, tab selectors) must have a thick 3D depth border (5px border-bottom). Clicking them triggers a Y-axis translation downwards (`translateY(4px)`) to simulate physical physics.
- **Mascot (Cáo Sofi):** Mascot is "Sofi the Fox Scholar", depicted with scholarly round glasses and a graduation cap.

---

## Page Structure

### 1. Hero & Interactive Simulator Sandbox (Key Component)

The Hero section utilizes a **2-column layout** on desktop:
- **Left Column:** Copy and CTAs targeting faculty and deans.
  - Eyebrow: "Adaptive-first AI Tutor for Higher Education"
  - Title (H1): "Gia sư AI Thích ứng cá nhân hóa cho từng Sinh viên"
  - CTAs: "Đăng ký Thử nghiệm (Pilot)" (Primary 3D button), "Chạy thử Simulator" (Secondary 3D button).
- **Right Column (Interactive Simulator Hub):** A glassmorphic container containing a **3D Tab Switcher** (🦊 Màn hình Sinh viên vs. 📊 Góc Giảng viên) allowing live simulation of the platform's core mechanics.

#### 🦊 Tab A: Student Simulation Flow (Interactive Steps)
1. **ZPD Diagnosis:** Shows a Calculus recursion problem. ELO indicators are active (Student ELO: 1200, Question Difficulty: 1250). Expected success probability is set to ~72% (optimal Zone of Proximal Development).
2. **Socratic Guidance & Citations:** Clicking "Ask for Hint" displays Cáo Sofi's guiding message (does not reveal the answer) and a Grounded Citation tag: `📄 Slide Bài giảng 3 - Trang 12`.
3. **Cheating vs. Socratic Choice:**
   - **Socratic Path:** Student answers with the hint (`if n == 0: return 1`). ELO rolls up: `1200 ➔ 1215 (+15 Elo, discounted by 30% for 1 hint)`. BKT mastery probability jumps from `25% (Weak)` to `48% (Learning)`.
   - **Cheating Path:** Student copies/pastes code from external AI. The system triggers the **Academic Integrity Guardrail**, freezing ELO (+0 ELO) and displaying a warning message.

#### 📊 Tab B: Lecturer Dashboard Flow
1. **Concept Gap Analysis:** Displays a horizontal bar chart ranking class concepts. `Recursion` is flagged at the top in red (`32% Mastery - Weak`).
2. **AI Action Plan (Labor Illusion):** A button "AI Tự động Tạo Slide Reteach bổ trợ". Clicking it displays a progress loader for 1.8 seconds simulating AI analyzing student error logs (Labor Illusion). Once finished, it reveals a downloadable PDF slide preview focusing on recursion base case errors.
3. **Integrity Sentinel:** Shows statistics on ELO freezing due to copy-pasting and highlights students requiring immediate 1-on-1 support.

### 2. Problem Framing ("Why Not Another Chatbot")
Uses a 3-column layout highlighting current higher-education challenges:
1. Students cannot self-diagnose conceptual gaps.
2. Lecturers receive averages and grades too late to change course.
3. Generic AI tools provide answers directly, bypassing the learning process and breaking academic integrity.

### 3. Adaptive learning loop
Highlights the 4-step circle:
1. **Diagnose:** Collect BKT mastery and Elo indices.
2. **Guide:** Provide Socratic hint ladders and lecture citations.
3. **Practice:** Recommend quiz items at ZPD levels.
4. **Intervene:** Feed classroom analytical reports back to instructors.

### 4. Student & Lecturer Detail Previews
Provides close-up views of the Student workspace (Socratic chat examples) and Lecturer analytics (intervention indicators, risk lists).

### 5. Pilot Call to Action (CTA)
A centralized B2B-focused card promoting a pilot setup: "Pilot one course with one PDF slide and one lecturer dashboard."

---

## Technical Considerations

- The mockup is structured as a **self-contained HTML file** (`mockup-landing-page.html`) using raw Vanilla CSS and inline Vanilla JavaScript to run the interactive simulator state.
- No external libraries (except Google Fonts) are required, facilitating immediate local browser loading.
