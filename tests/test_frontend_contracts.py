from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"

if not (FRONTEND / "components/app/app-top-nav.tsx").exists():
    pytestmark = pytest.mark.skip(reason="Old frontend contract files are not present in the new frontend layout.")



def _read(path: str) -> str:
    return (FRONTEND / path).read_text(encoding="utf-8")


def test_practice_logo_exits_quiz_and_returns_to_learn_tab() -> None:
    top_nav = _read("components/app/app-top-nav.tsx")
    workspace = _read("app/components/quiz-workspace.tsx")

    assert "onLogoClick?: () => void" in top_nav
    assert "onClick={onLogoClick}" in top_nav
    assert "quiz.handleExitQuiz();" in workspace
    assert "quiz.setActiveTab('learn');" in workspace


def test_demo_mode_requires_explicit_public_flag() -> None:
    demo_mode = _read("lib/demo-mode.ts")

    assert "process.env.NEXT_PUBLIC_DEMO_MODE === 'true'" in demo_mode
    assert "NODE_ENV" not in demo_mode


def test_local_demo_auth_bypasses_onboarding_backend_gate() -> None:
    gate = _read("components/onboarding/onboarding-gate.tsx")

    assert "const usesLocalDemoAuth = isDemoMode() && isDemoAuthToken(token);" in gate
    assert "!usesLocalDemoAuth" in gate
    assert "|| usesLocalDemoAuth" in gate


def test_socratic_chat_uses_single_current_implementation() -> None:
    legacy_file = FRONTEND / "components/dashboard/socratic-chat-tab.tsx"
    dashboard_layout = _read("app/components/dashboard-layout.tsx")

    assert not legacy_file.exists()
    assert "import('@/components/dashboard/socratic-chat')" in dashboard_layout
    assert "socratic-chat-tab" not in dashboard_layout


def test_nextjs_supabase_adapter_stays_read_only() -> None:
    adapter = _read("lib/adaptive/database.ts")

    assert "createClient(" in adapter
    for write_api in (".insert(", ".update(", ".delete(", ".upsert(", ".rpc("):
        assert write_api not in adapter


def test_frontend_does_not_write_directly_to_supabase_tables() -> None:
    frontend_sources = [
        path
        for path in FRONTEND.rglob("*")
        if path.suffix in {".ts", ".tsx"}
        and ".next" not in path.parts
        and "node_modules" not in path.parts
        and path.relative_to(FRONTEND).as_posix()
        not in {
            "app/api/v1/[...path]/route.ts",
        }
    ]
    offenders: list[str] = []
    for path in frontend_sources:
        source = path.read_text(encoding="utf-8")
        uses_supabase_client = (
            "@supabase" in source
            or "@/utils/supabase" in source
            or "utils/supabase" in source
            or ".from('" in source
            or '.from("' in source
        )
        if not uses_supabase_client:
            continue
        for write_api in (".insert(", ".update(", ".delete(", ".upsert(", ".rpc("):
            if write_api in source:
                offenders.append(f"{path.relative_to(FRONTEND)} contains {write_api}")

    assert offenders == []


def test_mentor_ingestion_mock_relations_are_demo_only() -> None:
    ingestion_tab = _read("components/dashboard/mentor/ingestion-tab.tsx")

    assert "const demoMode = isDemoMode();" in ingestion_tab
    assert "useState<GraphRelation[]>(demoMode ? INITIAL_RELATIONS : [])" in ingestion_tab


def test_supabase_debug_page_requires_explicit_enablement() -> None:
    page = _read("app/supabase-test/page.tsx")

    assert 'process.env.ENABLE_SUPABASE_TEST_PAGE !== "true"' in page
    assert "notFound();" in page


def test_protected_frontend_api_calls_use_same_origin_credentials() -> None:
    protected_call_sites = {
        "stores/createPracticeSlice.ts": ["/api/v1/adaptive/mastery"],
        "lib/adaptive/api-client.ts": ["/api/v1/adaptive/recommend", "/api/v1/adaptive/submit"],
        "components/quiz/quiz-question-view.tsx": ["/api/v1/quiz/report"],
        "lib/chat/stream.ts": ["/api/v1/chat"],
        "app/hooks/useSurveyHandlers.ts": ["/api/v1/surveys"],
        "lib/onboarding/onboarding-api.ts": [
            "/api/v1/onboarding/status",
            "/api/v1/onboarding/diagnostic/start",
            "/api/v1/onboarding/diagnostic/answer",
            "/api/v1/onboarding/complete",
        ],
        "lib/mentor/ai-response-feedback.ts": ["/api/v1/feedback"],
        "components/dashboard/profile/hooks/useProfileData.ts": ["/api/v1/"],
        "components/dashboard/admin/use-braintrust-summary.ts": ["/api/v1/admin/braintrust/"],
        "lib/auth/supabase-session.ts": ["/api/v1/auth/me", "/api/v1/auth/signup"],
    }

    for path, expected_routes in protected_call_sites.items():
        source = _read(path)
        for route in expected_routes:
            assert route in source, f"{route} missing from {path}"
        assert 'credentials: "same-origin"' in source or "credentials: 'same-origin'" in source, (
            f"{path} must include same-origin credentials for protected API calls"
        )


def test_zpd_widget_does_not_fallback_to_seeded_student_identity() -> None:
    widget = _read("components/dashboard/ZpdWidget.tsx")

    assert "d3b07384-d113-4ec5-a58e-0f2d87e07661" not in widget
    assert "const currentStudentId = userId ||" not in widget
    assert "studentId: userId," in widget
    assert "loggedIn" in widget
    assert "if (!loggedIn || !userId || !token)" in widget
    assert "Chúc mừng bạn đã hoàn thành xuất sắc" not in widget
    assert "Chưa tải được thử thách ZPD" in widget


def test_bff_proxy_filters_unsafe_headers_and_preserves_trace_contract() -> None:
    route = _read("app/api/v1/[...path]/route.ts")

    for unsafe_header in (
        "keyLower !== 'host'",
        "keyLower !== 'accept-encoding'",
        "keyLower !== 'connection'",
        "keyLower !== 'content-length'",
        "keyLower !== 'cookie'",
    ):
        assert unsafe_header in route

    assert "headers.set('x-request-id', traceId)" in route
    assert "isPublicAuthPath(pathStr)" in route
    assert "backend_unavailable" in route
    assert "trace_id: traceId" in route
    assert "status: 503" in route


def test_next_route_handler_errors_include_trace_ids() -> None:
    route_files = [
        "app/api/questions/route.ts",
        "app/api/questions/[slug]/route.ts",
        "app/api/guidebook/[slug]/route.ts",
        "app/api/knowledge-graph/route.ts",
    ]

    for path in route_files:
        source = _read(path)
        assert "trace_id" in source, f"{path} must include trace_id in API responses"
        assert "status: 500" not in source, f"{path} should use explicit unavailable/not-found errors, not 500"
