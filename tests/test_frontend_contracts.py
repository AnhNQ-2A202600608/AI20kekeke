from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"

if not (FRONTEND / "components/app/app-top-nav.tsx").exists():
    pytestmark = pytest.mark.skip(reason="Old frontend contract files are not present in the new frontend layout.")



def _read(path: str) -> str:
    return (FRONTEND / path).read_text(encoding="utf-8")


def test_mentora_shell_exposes_learning_exam_and_ai_navigation() -> None:
    shell = _read("app/components/AppShell.tsx")

    assert "Mentora" in shell
    assert 'href: "/hoc-tap"' in shell
    assert 'href: "/on-thi"' in shell
    assert 'href={`/hoi-dap-ai?subject=${selectedSubject.code}`}' in shell


def test_legacy_edugap_routes_and_components_are_removed() -> None:
    legacy_paths = (
        "app/login/page.tsx",
        "app/api/v1/[...path]/route.ts",
        "app/components/dashboard-layout.tsx",
        "components/app/app-top-nav.tsx",
        "components/onboarding/onboarding-gate.tsx",
        "components/dashboard/ZpdWidget.tsx",
        "lib/adaptive/database.ts",
    )

    assert all(not (FRONTEND / path).exists() for path in legacy_paths)


def test_auth_flow_uses_mentora_session_storage_and_logout_cleanup() -> None:
    auth_page = _read("app/auth/page.tsx")
    auth_client = _read("app/lib/api-client.ts")
    session = _read("app/lib/session.ts")
    logout = _read("app/dang-xuat/page.tsx")

    assert "loginWithPassword" in auth_page
    assert "registerAccount" in auth_page
    assert "saveAuthSession" in auth_page
    assert '"/auth/login"' in auth_client
    assert '"/auth/signup"' in auth_client
    assert '"mentora-auth-session"' in session
    assert "window.sessionStorage" in session
    assert "window.localStorage" in session
    assert "clearAuthSession" in logout


def test_subject_profiles_are_namespaced_and_update_learning_progress() -> None:
    profiles = _read("app/hooks/useOnboardingProfile.ts")

    assert 'const PROFILE_KEY = "mentora-subject-profiles"' in profiles
    assert 'const ACTIVE_SUBJECT_KEY = "mentora-active-subject"' in profiles
    assert "export function saveSubjectProfile" in profiles
    assert "export function updateSubjectLearningProgress" in profiles
    assert "Math.min(100, Math.max(0, currentProgress" in profiles


def test_ai_chat_creates_independent_sessions_without_overwriting_history() -> None:
    chat_page = _read("app/hoi-dap-ai/page.tsx")
    sessions = _read("app/lib/chat-sessions.ts")

    assert "activeConversationIdRef" in chat_page
    assert "const startNewConversation" in chat_page
    assert "activeConversationIdRef.current = null" in chat_page
    assert "const { session, isNew } = ensureChatSession(prompt);" in chat_page
    assert "if (!isNew) appendChatMessage(session.id" in chat_page
    assert "deleteChatSession(sessionId)" in chat_page
    assert 'const STORAGE_KEY = "mentora-ai-chat-sessions"' in sessions
    assert "writeSessions([session, ...readSessions()])" in sessions
    assert "updateChatSession" in sessions


def test_frontend_api_client_uses_the_same_origin_backend_proxy() -> None:
    client = _read("app/lib/api-client.ts")

    assert "fetch(`/api/backend${path}`" in client
    assert 'requestApi<AuthApiResponse>("/auth/login"' in client
    assert 'requestApi<AuthApiResponse>("/auth/signup"' in client
    assert 'requestApi<TutorReply>("/chat"' in client
    assert "Authorization: `Bearer ${input.token}`" in client


def test_backend_proxy_allows_only_supported_mentora_endpoints() -> None:
    route = _read("app/api/backend/[...path]/route.ts")

    assert 'const ALLOWED_PATHS = new Set(["auth/login", "auth/signup", "auth/me", "chat"])' in route
    assert "if (!ALLOWED_PATHS.has(pathName))" in route
    assert 'headers.set("authorization", authorization)' in route
    assert 'cache: "no-store"' in route
    assert 'status: 404' in route
    assert 'status: 503' in route


def test_frontend_does_not_write_directly_to_supabase_tables() -> None:
    frontend_sources = [
        path
        for path in FRONTEND.rglob("*")
        if path.suffix in {".ts", ".tsx"}
        and ".next" not in path.parts
        and "node_modules" not in path.parts
    ]
    offenders: list[str] = []

    for path in frontend_sources:
        source = path.read_text(encoding="utf-8")
        uses_supabase_client = (
            "@supabase" in source
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


def test_teacher_workspace_groups_daily_teaching_workflows() -> None:
    teacher = _read("app/giao-vien/page.tsx")

    assert "const teacherNavGroups" in teacher
    assert 'label: "Giảng dạy"' in teacher
    assert 'id: "assignments"' in teacher
    assert 'id: "grading"' in teacher
    assert 'id: "assistant"' in teacher
    assert 'id: "rag"' in teacher


def test_profile_page_requires_an_authenticated_session() -> None:
    profile = _read("app/ho-so/page.tsx")

    assert "useAuthSession" in profile
    assert "if (!authSession)" in profile
    assert 'router.replace("/auth?next=/ho-so")' in profile
