-- Repeated textbook text may legitimately produce identical chunks on one page.
-- Idempotency is already guaranteed by UNIQUE (material_id, chunk_index).
DROP INDEX IF EXISTS app.idx_material_chunks_page_checksum;

CREATE INDEX IF NOT EXISTS idx_material_chunks_page_checksum
    ON app.material_chunks (page_id, chunk_checksum)
    WHERE page_id IS NOT NULL AND chunk_checksum IS NOT NULL;
