import pytest
from unittest.mock import patch, MagicMock
from uuid import UUID

from src.api.adaptive_routes import allow_dev_tokens, allow_service_role_bypass, submit_attempt
from src.agents.nodes.respond_node import respond_node
from src.api.placement_routes import PlacementSubmitRequest, submit_placement_result
from src.api.sync_routes import trigger_sync, get_sync_status


class TestSecurityProdBypass:
    """Task 1: Verify dev tokens bypass is strictly disabled on production."""

    @patch("src.config.get_settings")
    @patch("os.environ.get")
    def test_allow_dev_tokens_on_prod_is_disabled(self, mock_env, mock_get_settings):
        # Even if environment variable is set to true
        mock_env.return_value = "true"
        # If app_env is production, bypass must be disabled
        mock_get_settings.return_value.app_env = "production"
        assert allow_dev_tokens() is False

    @patch("src.config.get_settings")
    @patch("os.environ.get")
    def test_allow_dev_tokens_on_dev_is_enabled(self, mock_env, mock_get_settings):
        mock_env.return_value = "true"
        mock_get_settings.return_value.app_env = "development"
        assert allow_dev_tokens() is True

    @patch("src.config.get_settings")
    @patch("os.environ.get")
    def test_allow_service_role_bypass_on_prod_is_disabled(self, mock_env, mock_get_settings):
        mock_env.return_value = "true"
        mock_get_settings.return_value.app_env = "production"
        assert allow_service_role_bypass() is False


class TestPromptInjectionProtection:
    """Task 4: Verify query wrapping in XML tags in respond_node."""

    @pytest.mark.asyncio
    @patch("src.agents.nodes.respond_node.get_llm")
    async def test_respond_node_wraps_query_in_xml_tags(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.astream = MagicMock()
        
        async def mock_astream(messages):
            # Assert that the last message has query wrapped in <student_query> tags
            last_msg = messages[-1]
            assert "<student_query>" in last_msg.content
            assert "</student_query>" in last_msg.content
            # Yield a mock chunk
            yield MagicMock(content="Mocked response")

        mock_llm.astream.side_effect = mock_astream
        mock_get_llm.return_value = mock_llm

        state = {
            "query": "giải bài này hộ em",
            "context": "Context",
            "metadata": {
                "intent": "academic",
                "diagnostic": None,
            },
        }
        await respond_node(state)


class TestInvalidCitationReflectionTrigger:
    """Task 5: Verify invalid citation validation triggers reflection loop."""

    @pytest.mark.asyncio
    @patch("src.agents.nodes.respond_node.get_llm")
    @patch("src.agents.nodes.respond_node.CitationValidator.validate_citations")
    async def test_invalid_citations_set_reflection_feedback(self, mock_validate, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.astream = MagicMock()
        
        async def mock_astream(messages):
            yield MagicMock(content="Citations [Doc, Slide 99]")

        mock_llm.astream.side_effect = mock_astream
        mock_get_llm.return_value = mock_llm

        # Mock validator to report invalid citations
        mock_validate.return_value = {
            "is_valid": False,
            "invalid_citations": ["[Doc, Slide 99]"],
            "valid_citations": [],
            "cleaned_text": "Cleaned response",
        }

        state = {
            "query": "giải thích bài này",
            "context": "Context",
            "metadata": {
                "intent": "academic",
            },
            "reflection_attempts": 0,
        }
        res = await respond_node(state)
        assert res["reflection_feedback"] is not None
        assert "invalid citations" in res["reflection_feedback"]
        assert res["reflection_attempts"] == 1


class TestPlacementTestCalibration:
    """Task 7: Verify placement submit updates scores according to calibration mapping."""

    @patch("src.config.get_settings")
    def test_submit_placement_result_offline(self, mock_get_settings):
        # Mock database client stub mode
        db = MagicMock()
        db._stub_mode = True
        db.app_client = None

        auth_user = MagicMock()
        auth_user.id = UUID("d3b07384-d113-4ec5-a58e-0f2d87e07661")
        auth_user.role = "student"

        req = PlacementSubmitRequest(
            student_id=UUID("d3b07384-d113-4ec5-a58e-0f2d87e07661"),
            course_id=UUID("00000000-0000-0000-0000-000000000001"),
            concept_id=UUID("11111111-1111-1111-1111-111111111111"),
            correct_count=3
        )

        res = submit_placement_result(req, auth_user, db)
        assert res["status"] == "success"
        assert res["initialized_elo"] == 1400.0
        assert res["initialized_bkt"] == 0.65
        assert res["mastery_state"] == "mastered"
        assert res["weakness_flag"] is False


class TestOfflineOutboxSync:
    """Task 2 & 3: Verify outbox queueing and synchronization flow."""

    def test_offline_outbox_flow(self, monkeypatch, tmp_path):
        from src.config import Settings
        settings = Settings()
        settings.sgk_data_dir = str(tmp_path)
        settings.database_url = f"sqlite:///{tmp_path.as_posix()}/mastery.db"

        import src.services.diagnostic_engine
        import src.api.sync_routes
        import src.api.placement_routes

        monkeypatch.setattr(src.services.diagnostic_engine, "get_settings", lambda: settings)
        monkeypatch.setattr(src.api.sync_routes, "get_settings", lambda: settings)
        import src.config
        monkeypatch.setattr(src.config, "get_settings", lambda: settings)

        # 1. Initialize DB and Outbox
        from src.services.diagnostic_engine import DiagnosticEngine
        engine = DiagnosticEngine()
        # Mock questions dict to avoid loading questions.json from empty temp dir
        engine.questions = {
            "q_m7_1": {
                "yccd": ["M7.SDS.05"],
                "text": "Câu hỏi test"
            }
        }
        
        # Verify db file is created
        db_path = tmp_path / "mastery.db"
        print(f"DEBUG: engine.db_path is '{engine.db_path}' (type: {type(engine.db_path)}), db_path is '{db_path}'")
        assert engine.db_path.resolve() == db_path.resolve()
        assert engine.db_path.exists()

        # 2. Queue offline attempt
        payload = {
            "p_decision_id": "00000000-0000-0000-0000-000000000001",
            "p_student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661",
            "p_course_id": "00000000-0000-0000-0000-000000000001",
            "p_concept_id": "M7.SDS.05",
            "p_question_id": "q_m7_1",
            "p_actual_score": 1.0,
        }
        engine.queue_offline_attempt(payload)

        # 3. Check outbox status
        auth_user = MagicMock(role="dev")
        status_res = get_sync_status(auth_user)
        assert status_res["pending_sync_count"] == 1

        # 4. Trigger sync (fails when stub mode is active)
        db = MagicMock(_stub_mode=True)
        with pytest.raises(Exception):
            trigger_sync(auth_user, db)

        # 5. Trigger sync with active online database
        db_online = MagicMock(_stub_mode=False)
        db_online.app_client = MagicMock()
        sync_res = trigger_sync(auth_user, db_online)
        assert sync_res["status"] == "success"
        assert sync_res["synced_count"] == 1

        # Check outbox is empty now
        status_res_after = get_sync_status(auth_user)
        assert status_res_after["pending_sync_count"] == 0
