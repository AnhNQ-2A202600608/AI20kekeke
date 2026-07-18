-- Compatibility prerequisites for replaying the imported C2 migration chain.
-- The original environment had these objects/data before the checked-in migrations.

-- Commit the enum value before 20260616_add_dev_role_and_mssv.sql uses it.
ALTER TYPE app.course_role ADD VALUE IF NOT EXISTS 'dev';

ALTER TABLE public.slide_embeddings
    ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.slide_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS slide_embeddings_service_role_policy
    ON public.slide_embeddings;
CREATE POLICY slide_embeddings_service_role_policy
    ON public.slide_embeddings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.surveys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id text NOT NULL,
    rating_pre smallint CHECK (rating_pre BETWEEN 1 AND 5),
    comment_pre text,
    email text,
    rating_understanding smallint CHECK (rating_understanding BETWEEN 1 AND 5),
    rating_utility smallint CHECK (rating_utility BETWEEN 1 AND 5),
    rating_personalized smallint CHECK (rating_personalized BETWEEN 1 AND 5),
    comment_post text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS surveys_service_role_policy ON public.surveys;
CREATE POLICY surveys_service_role_policy
    ON public.surveys
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_surveys_set_created_at
    ON public.surveys (set_id, created_at DESC);

INSERT INTO app.courses (id, code, title, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'AI20-EDUGAP',
    'EduGap Adaptive AI Tutor',
    'active'
)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    updated_at = now();
