# Research Report: Edtech Auth Page Patterns

---
created_at: 2026-07-01 10:29 Asia/Bangkok
scope: EduGap login/signup redesign
---

## Summary

EduGap auth page currently looks overbuilt: huge split hero, heavy feature cards, nested panels, large mascot, and a segmented login/signup switch that reads like a dashboard control rather than an entry point.

Edtech auth patterns trend simpler. Coursera and Quizlet emphasize a focused account form. Khan Academy first asks for user role and supports multiple auth methods. Duolingo keeps strong mascot personality, but the auth moment is still tightly focused and not feature-card heavy.

Recommendation: redesign EduGap auth as a calm two-column auth surface: compact form on one side, contextual learning preview on the other. Avoid nested card-inside-card. Use one mascot moment. Login and signup should be adjacent links or two clear mode tabs, but visually lighter than the primary CTA.

## Sources Consulted

| Source | Relevant evidence |
| --- | --- |
| Coursera login/signup | Login and signup are direct account-entry flows; signup page copy says users can learn on their own time and continue with email/Google. |
| Quizlet login/signup | Account pages focus on study tools and goal completion, with direct login/signup paths. |
| Khan Academy help center | Signup starts by choosing role: Learner, Teacher, or Parent; then auth method: Google, Facebook, Apple, Microsoft, or Email. |
| Khan Academy signup pages | Role-specific signup exists, including parent flow and password requirements. |
| Duolingo UI references | Duolingo has multiple signup/onboarding screens, plus mascot/personality; UI references list signup, onboarding, signin separately. |
| General 2025/2026 auth UX guides | Common advice: keep form short, reduce fields, provide alternative sign-in, clear CTA, brand identity, avoid overloaded signup. |

## Patterns

### 1. Auth Is A Utility Screen, Not A Landing Page

Coursera/Quizlet-style auth pages do not re-sell the whole product. They give just enough reminder copy and then prioritize account access.

For EduGap: remove or shrink the left feature-card stack. Keep one short promise: "Đồng bộ tiến độ, mở lộ trình cá nhân, lưu mastery."

### 2. Signup Needs Role/Intent More Than Marketing

Khan Academy explicitly separates signup by role: learner, teacher, parent. That matters in education because permissions and expectations differ.

For EduGap: signup should ask "Bạn là học viên / giảng viên / BTC?" only if backend supports role onboarding. If not, keep default student and explain "Giảng viên/BTC dùng tài khoản được cấp."

### 3. One Visual Anchor Is Enough

Duolingo wins with mascot/personality, but not by placing many decorative elements in the auth form. Mascot should orient the user or communicate state.

For EduGap: use Sofi once, either as a small side illustration or header avatar. Do not put mascot, badge, hero, and multiple cards all competing.

### 4. Signup Should Be Short

General SaaS/auth UX research consistently warns that every extra field increases drop-off. Email/password/full name is acceptable; optional MSSV should be visually secondary or moved after signup/onboarding.

For EduGap: login = 2 fields. Signup = full name, email, password. MSSV optional should be a collapsed "Thêm MSSV" detail or onboarding step.

### 5. CTA Hierarchy Must Be Obvious

Current EduGap primary CTA is good, but the surrounding segmented control, nested header card, and demo button make the form feel cramped.

For EduGap: primary CTA should be the only saturated green block. Mode switch should be text-link or thin tabs. Demo should be secondary inline row, not another big button unless demo is the main product mode.

## Recommended Redesign Direction

Use "Focused Learning Passport":

- Layout: centered 920-980px shell, 2 columns on desktop, single column on mobile.
- Left panel: soft illustration/progress preview, not feature cards. Show one mini learning path snapshot or "Day 1 ready" tile.
- Right panel: compact auth form, white surface, 1 border, no nested card header.
- Header: small EduGap logo top-left, back link top-right.
- Form width: 340-380px.
- Input height: 44px, text 16px.
- Labels: 11-12px uppercase, no letter spacing overuse.
- Login/signup: two text tabs or top inline sentence, not giant segmented control.
- Signup fields: Full name, email, password. Optional MSSV hidden behind a small secondary affordance.
- Demo: quiet secondary link/button below divider.

## Anti-Patterns To Avoid

- Huge hero headline beside a tiny utility form.
- Cards inside cards.
- Three feature cards on an auth page.
- Heavy segmented control that looks like dashboard navigation.
- Mascot larger than form labels or competing with h2.
- Multiple CTAs with the same visual weight.
- Copy that repeats "dashboard/onboarding/mastery" in multiple places.

## Next Steps

1. Replace current split hero with a compact auth shell.
2. Move "Elo/BKT / Socratic / giảng viên" proof into one subtle left preview.
3. Change login/signup switch to lighter tabs.
4. Make signup MSSV optional disclosure.
5. Verify desktop at 1280x720 and mobile at 390x844.

## References

- Coursera login: https://www.coursera.org/login
- Coursera signup: https://www.coursera.org/signup
- Quizlet login: https://quizlet.com/login
- Quizlet signup: https://quizlet.com/sign-up
- Khan Academy account setup: https://support.khanacademy.org/hc/en-us/articles/202487450-How-do-I-set-up-a-new-user-account
- Khan Academy signup: https://www.khanacademy.org/signup
- Duolingo login: https://www.duolingo.com/log-in
- Duolingo UI reference: https://nicelydone.club/apps/duolingo
- Auth UX guide: https://www.authgear.com/post/login-signup-ux-guide/
- Signup flow UX: https://beyondthepixel.studio/saas-signup-flows/
