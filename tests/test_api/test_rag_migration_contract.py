from pathlib import Path

MIGRATION = Path("db/supabase/migrations/20260718082128_mentora_rag_materials.sql")


def _sql() -> str:
    rag_migrations = sorted(MIGRATION.parent.glob("*mentora_rag*.sql"))
    return "\n".join(path.read_text(encoding="utf-8") for path in rag_migrations).lower()


def test_rag_migration_creates_normalized_tables_and_indexes():
    sql = _sql()

    assert "create table app.rag_scopes" in sql
    assert "create table app.material_pages" in sql
    assert "create table app.rag_ingestion_jobs" in sql
    assert "vector(1536)" in sql
    assert "using hnsw" in sql
    assert "unique (material_id, page_number)" in sql


def test_rag_match_rpc_is_scope_and_publish_filtered():
    sql = _sql()

    assert "function app.match_material_chunks" in sql
    assert "p_rag_scope_id uuid" in sql
    assert "published_status = 'published'" in sql
    assert "rag_scope_id = p_rag_scope_id" in sql
    assert "revoke all on function app.match_material_chunks" in sql
    assert "grant execute on function app.match_material_chunks" in sql
    assert "to service_role" in sql


def test_rag_tables_and_storage_are_not_publicly_readable():
    sql = _sql()

    assert "revoke all on app.course_materials from anon, authenticated" in sql
    assert "revoke all on app.material_chunks from anon, authenticated" in sql
    assert "alter table app.course_materials enable row level security" in sql
    assert "'rag-materials'" in sql
    assert "false" in sql
