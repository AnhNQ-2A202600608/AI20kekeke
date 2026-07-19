# Weekly Journal Index

This is the canonical journal index for the Mentora project. Detailed entries are stored in the [`docs/journals/`](docs/journals/) directory.

## Weekly Entries

- **[2026-07-18 20:30]** — [Isolate Chat Sessions per Student Account](docs/journals/260718-2030-chat-session-isolation.md)
  - Switched conversation storage to use student-specific keys in localStorage to prevent cross-account chat leaks.
- **[2026-07-18 20:45]** — [Fix Next.js Static Prerendering Suspense Bailout Errors](docs/journals/260718-2045-fix-suspense-prerendering-errors.md)
  - Wrapped searchParams-using page components in `<Suspense>` boundaries to enable successful compilation of all 71 static pages via Turbopack.
- **[2026-07-18 21:17]** — [Update Development Team List in README.md](docs/journals/260718-2117-update-team-readme.md)
  - Updated the official team member table in `README.md` with new roles and contact emails.
- **[2026-07-18 21:20]** — [Project and Document Integrity Audit](docs/journals/260718-2120-document-integrity-check.md)
  - Audited all docs to ensure all references (such as `btc-heatmap` and `mooclet`) are aligned with the Mentora repository.
- **[2026-07-19 10:00]** — [Sửa lỗi khởi động Backend & Gitleaks CI](docs/journals/260719-1000-fix-backend-startup-and-ci-gitleaks.md)
  - Thêm slowapi vào requirements.txt và cấu hình fetch-depth cho Gitleaks CI.

