CREATE TABLE IF NOT EXISTS public.quiz_admins (
  email text PRIMARY KEY CHECK (email = lower(email))
);

CREATE OR REPLACE FUNCTION public.is_quiz_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quiz_admins
    WHERE email = lower(coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'email',
      ''
    ))
  )
$$;

REVOKE ALL ON public.quiz_admins FROM PUBLIC, anonymous, authenticated;
REVOKE ALL ON FUNCTION public.is_quiz_admin() FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.is_quiz_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  usn text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'disqualified')),
  current_question smallint NOT NULL DEFAULT 1
    CHECK (current_question BETWEEN 1 AND 30),
  answered_count smallint NOT NULL DEFAULT 0
    CHECK (answered_count BETWEEN 0 AND 30),
  remaining_seconds smallint NOT NULL DEFAULT 1800
    CHECK (remaining_seconds BETWEEN 0 AND 1800),
  score smallint NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 30),
  percentage numeric(5, 1) NOT NULL DEFAULT 0
    CHECK (percentage BETWEEN 0 AND 100),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  is_disqualified boolean NOT NULL DEFAULT false,
  time_taken text,
  verdict_title text,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  visited_questions jsonb NOT NULL DEFAULT '[1]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_attempts_user_started_idx
  ON public.quiz_attempts (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS quiz_attempts_updated_idx
  ON public.quiz_attempts (updated_at DESC);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
REVOKE ALL ON public.quiz_attempts FROM anonymous, PUBLIC;

DROP POLICY IF EXISTS quiz_attempts_read_owner_or_admin ON public.quiz_attempts;
CREATE POLICY quiz_attempts_read_owner_or_admin
  ON public.quiz_attempts FOR SELECT TO authenticated
  USING (user_id = auth.user_id() OR public.is_quiz_admin());

DROP POLICY IF EXISTS quiz_attempts_insert_owner ON public.quiz_attempts;
CREATE POLICY quiz_attempts_insert_owner
  ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.user_id());

DROP POLICY IF EXISTS quiz_attempts_update_owner_or_admin ON public.quiz_attempts;
CREATE POLICY quiz_attempts_update_owner_or_admin
  ON public.quiz_attempts FOR UPDATE TO authenticated
  USING (user_id = auth.user_id() OR public.is_quiz_admin())
  WITH CHECK (user_id = auth.user_id() OR public.is_quiz_admin());

DROP POLICY IF EXISTS quiz_attempts_delete_admin ON public.quiz_attempts;
CREATE POLICY quiz_attempts_delete_admin
  ON public.quiz_attempts FOR DELETE TO authenticated
  USING (public.is_quiz_admin());
