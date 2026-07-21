-- Reconcile the Feedback catalog without manufacturing the historical
-- 202606140001 Supabase ledger entry. Production already records the canonical
-- Prisma feedback migration, so this migration owns only the missing database
-- constraints, server-only Data API posture, and updated_at trigger.

DO $$
DECLARE
  column_signature text;
  feedback_policy_count integer;
BEGIN
  IF to_regclass('public.feedback') IS NULL THEN
    RAISE EXCEPTION 'feedback reconciliation requires the canonical feedback table';
  END IF;

  SELECT string_agg(
    column_name || ':' || data_type || ':' || is_nullable,
    '|' ORDER BY ordinal_position
  )
  INTO column_signature
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'feedback';

  IF column_signature <> 'id:uuid:NO|tenant_id:uuid:NO|user_id:uuid:NO|type:text:NO|severity:text:YES|message:text:NO|route:text:YES|metadata:jsonb:YES|status:text:NO|created_at:timestamp with time zone:NO|updated_at:timestamp with time zone:NO' THEN
    RAISE EXCEPTION 'feedback catalog column signature drift';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.feedback f
    LEFT JOIN public.tenants t ON t.id = f.tenant_id
    LEFT JOIN public.users u ON u.id = f.user_id
    WHERE t.id IS NULL OR u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'feedback catalog contains orphan tenant/user references';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.feedback
    WHERE type NOT IN ('bug', 'feature', 'ux', 'general')
       OR (severity IS NOT NULL AND severity NOT IN ('critical', 'major', 'minor', 'suggestion'))
       OR status NOT IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed')
  ) THEN
    RAISE EXCEPTION 'feedback catalog contains values outside the approved enums';
  END IF;

  SELECT count(*) INTO feedback_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'feedback';

  IF feedback_policy_count <> 0 THEN
    RAISE EXCEPTION 'feedback reconciliation rejects unreviewed client-facing policies';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.feedback'::regclass AND conname = 'feedback_tenant_id_fkey') THEN
    ALTER TABLE public.feedback
      ADD CONSTRAINT feedback_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.feedback'::regclass AND conname = 'feedback_user_id_fkey') THEN
    ALTER TABLE public.feedback
      ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.feedback'::regclass AND conname = 'feedback_type_check') THEN
    ALTER TABLE public.feedback
      ADD CONSTRAINT feedback_type_check CHECK (type IN ('bug', 'feature', 'ux', 'general'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.feedback'::regclass AND conname = 'feedback_severity_check') THEN
    ALTER TABLE public.feedback
      ADD CONSTRAINT feedback_severity_check CHECK (severity IS NULL OR severity IN ('critical', 'major', 'minor', 'suggestion'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.feedback'::regclass AND conname = 'feedback_status_check') THEN
    ALTER TABLE public.feedback
      ADD CONSTRAINT feedback_status_check CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed'));
  END IF;
END;
$$;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.feedback FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.feedback'::regclass
      AND tgname = 'trg_feedback_updated_at'
      AND NOT tgisinternal
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.feedback'::regclass
      AND tgname = 'trg_feedback_updated_at'
      AND NOT tgisinternal
      AND tgfoid = 'public.update_feedback_updated_at()'::regprocedure
  ) THEN
    RAISE EXCEPTION 'feedback updated_at trigger authority drift';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.feedback'::regclass
      AND tgname = 'trg_feedback_updated_at'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER trg_feedback_updated_at
      BEFORE UPDATE ON public.feedback
      FOR EACH ROW EXECUTE FUNCTION public.update_feedback_updated_at();
  END IF;
END;
$$;

DO $$
DECLARE
  constraint_count integer;
BEGIN
  SELECT count(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'public.feedback'::regclass
    AND conname IN (
      'feedback_tenant_id_fkey',
      'feedback_user_id_fkey',
      'feedback_type_check',
      'feedback_severity_check',
      'feedback_status_check'
    )
    AND convalidated;

  IF constraint_count <> 5 THEN
    RAISE EXCEPTION 'feedback reconciliation constraint catalog mismatch';
  END IF;
END;
$$;
