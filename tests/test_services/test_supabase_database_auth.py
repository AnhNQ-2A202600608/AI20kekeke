from types import SimpleNamespace

from src.services.adaptive.supabase_database import SupabaseAdaptiveDatabase


class DummyClient:
    def __init__(self):
        self.options = SimpleNamespace(headers={"Authorization": "Bearer user-token"})
        self.auth = SimpleNamespace(_headers={"Authorization": "Bearer user-token"})
        self._postgrest = object()
        self._storage = object()
        self._functions = object()


def test_reset_service_auth_restores_backend_authorization_headers():
    db = SupabaseAdaptiveDatabase.__new__(SupabaseAdaptiveDatabase)
    db._stub_mode = False
    db._service_key = "sb_secret_test"
    db.app_client = DummyClient()
    db.audit_client = DummyClient()

    db.reset_service_auth()

    for client in (db.app_client, db.audit_client):
        assert client.options.headers["Authorization"] == "Bearer sb_secret_test"
        assert client.auth._headers["Authorization"] == "Bearer sb_secret_test"
        assert client._postgrest is None
        assert client._storage is None
        assert client._functions is None
