-- Bind the reconciled Feedback catalog to exact PostgreSQL definitions.
-- This additive authority deliberately does not manufacture the historical
-- 202606140001 Supabase ledger row.

DO $$
DECLARE
  column_signature text;
  exact_fk_count integer;
  exact_check_count integer;
  exact_index_count integer;
  exact_trigger_count integer;
  exact_function_count integer;
  actual_function_source text;
  feedback_policy_count integer;
BEGIN
  IF to_regclass('public.feedback') IS NULL THEN
    RAISE EXCEPTION 'feedback authority hardening requires the canonical feedback table';
  END IF;

  SELECT string_agg(
    a.attname || ':' || format_type(a.atttypid, a.atttypmod) || ':' ||
    a.attnotnull::text || ':' ||
    COALESCE(pg_get_expr(d.adbin, d.adrelid), '<none>'),
    '|' ORDER BY a.attnum
  )
  INTO column_signature
  FROM pg_attribute a
  LEFT JOIN pg_attrdef d
    ON d.adrelid = a.attrelid
   AND d.adnum = a.attnum
  WHERE a.attrelid = 'public.feedback'::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF column_signature <> 'id:uuid:true:gen_random_uuid()|tenant_id:uuid:true:<none>|user_id:uuid:true:<none>|type:text:true:<none>|severity:text:false:<none>|message:text:true:<none>|route:text:false:<none>|metadata:jsonb:false:''{}''::jsonb|status:text:true:''open''::text|created_at:timestamp with time zone:true:CURRENT_TIMESTAMP|updated_at:timestamp with time zone:true:CURRENT_TIMESTAMP' THEN
    RAISE EXCEPTION 'feedback canonical column/default definition drift: %', column_signature;
  END IF;

  SELECT count(*)
  INTO exact_fk_count
  FROM pg_constraint c
  WHERE c.conrelid = 'public.feedback'::regclass
    AND c.convalidated
    AND (
      (
        c.conname = 'feedback_tenant_id_fkey'
        AND c.contype = 'f'
        AND c.conkey::text = '{2}'
        AND c.confrelid = 'public.tenants'::regclass
        AND c.confkey::text = '{1}'
        AND c.confupdtype = 'a'
        AND c.confdeltype = 'a'
        AND c.confmatchtype = 's'
      )
      OR
      (
        c.conname = 'feedback_user_id_fkey'
        AND c.contype = 'f'
        AND c.conkey::text = '{3}'
        AND c.confrelid = 'public.users'::regclass
        AND c.confkey::text = '{1}'
        AND c.confupdtype = 'a'
        AND c.confdeltype = 'a'
        AND c.confmatchtype = 's'
      )
    );

  IF exact_fk_count <> 2 THEN
    RAISE EXCEPTION 'feedback canonical foreign-key definition drift';
  END IF;

  SELECT count(*)
  INTO exact_check_count
  FROM pg_constraint c
  WHERE c.conrelid = 'public.feedback'::regclass
    AND c.contype = 'c'
    AND c.convalidated
    AND (
      (c.conname = 'feedback_type_check' AND pg_get_expr(c.conbin, c.conrelid, true) = 'type = ANY (ARRAY[''bug''::text, ''feature''::text, ''ux''::text, ''general''::text])')
      OR
      (c.conname = 'feedback_severity_check' AND pg_get_expr(c.conbin, c.conrelid, true) = 'severity IS NULL OR (severity = ANY (ARRAY[''critical''::text, ''major''::text, ''minor''::text, ''suggestion''::text]))')
      OR
      (c.conname = 'feedback_status_check' AND pg_get_expr(c.conbin, c.conrelid, true) = 'status = ANY (ARRAY[''open''::text, ''acknowledged''::text, ''in_progress''::text, ''resolved''::text, ''closed''::text])')
    );

  IF exact_check_count <> 3 THEN
    RAISE EXCEPTION 'feedback canonical check-constraint definition drift';
  END IF;

  SELECT count(*)
  INTO exact_index_count
  FROM pg_index i
  JOIN pg_class idx ON idx.oid = i.indexrelid
  JOIN pg_am am ON am.oid = idx.relam
  WHERE i.indrelid = 'public.feedback'::regclass
    AND i.indisvalid
    AND i.indisready
    AND i.indnkeyatts = 1
    AND i.indnatts = 1
    AND i.indexprs IS NULL
    AND i.indpred IS NULL
    AND am.amname = 'btree'
    AND (
      (idx.relname = 'feedback_pkey' AND i.indisunique AND i.indisprimary AND i.indkey::text = '1' AND i.indoption::text = '0')
      OR
      (idx.relname = 'feedback_tenant_id_idx' AND NOT i.indisunique AND NOT i.indisprimary AND i.indkey::text = '2' AND i.indoption::text = '0')
      OR
      (idx.relname = 'feedback_type_idx' AND NOT i.indisunique AND NOT i.indisprimary AND i.indkey::text = '4' AND i.indoption::text = '0')
      OR
      (idx.relname = 'feedback_status_idx' AND NOT i.indisunique AND NOT i.indisprimary AND i.indkey::text = '9' AND i.indoption::text = '0')
      OR
      (idx.relname = 'feedback_created_at_idx' AND NOT i.indisunique AND NOT i.indisprimary AND i.indkey::text = '10' AND i.indoption::text = '3')
    );

  IF exact_index_count <> 5 THEN
    RAISE EXCEPTION 'feedback canonical index definition drift';
  END IF;

  SELECT count(*)
  INTO exact_trigger_count
  FROM pg_trigger t
  WHERE t.tgrelid = 'public.feedback'::regclass
    AND t.tgname = 'trg_feedback_updated_at'
    AND NOT t.tgisinternal
    AND t.tgenabled = 'O'
    AND t.tgtype = 19
    AND t.tgattr::text = ''
    AND t.tgqual IS NULL
    AND t.tgfoid = to_regprocedure('public.update_feedback_updated_at()')
    AND pg_get_triggerdef(t.oid, true) = 'CREATE TRIGGER trg_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at()';

  IF exact_trigger_count <> 1 THEN
    RAISE EXCEPTION 'feedback canonical trigger definition drift';
  END IF;

  SELECT count(*)
  INTO exact_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'public'
    AND p.proname = 'update_feedback_updated_at'
    AND p.pronargs = 0
    AND p.prorettype = 'trigger'::regtype
    AND l.lanname = 'plpgsql'
    AND NOT p.prosecdef
    AND btrim(regexp_replace(p.prosrc, '[[:space:]]+', ' ', 'g')) =
      'BEGIN NEW.updated_at := now(); RETURN NEW; END;';

  IF exact_function_count <> 1 THEN
    SELECT btrim(regexp_replace(p.prosrc, '[[:space:]]+', ' ', 'g'))
    INTO actual_function_source
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_feedback_updated_at'
      AND p.pronargs = 0;
    RAISE EXCEPTION 'feedback canonical trigger-function definition drift: %', actual_function_source;
  END IF;

  SELECT count(*) INTO feedback_policy_count
  FROM pg_policy
  WHERE polrelid = 'public.feedback'::regclass;

  IF feedback_policy_count <> 0 THEN
    RAISE EXCEPTION 'feedback authority hardening rejects client-facing policies';
  END IF;
END;
$$;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.feedback FROM PUBLIC, anon, authenticated;
REVOKE SELECT (id, tenant_id, user_id, type, severity, message, route, metadata, status, created_at, updated_at),
       INSERT (id, tenant_id, user_id, type, severity, message, route, metadata, status, created_at, updated_at),
       UPDATE (id, tenant_id, user_id, type, severity, message, route, metadata, status, created_at, updated_at),
       REFERENCES (id, tenant_id, user_id, type, severity, message, route, metadata, status, created_at, updated_at)
ON TABLE public.feedback FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  effective_table_privilege_count integer;
  effective_column_privilege_count integer;
BEGIN
  SELECT count(*)
  INTO effective_table_privilege_count
  FROM (VALUES ('anon'), ('authenticated')) AS roles(role_name)
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS privileges(privilege_name)
  WHERE has_table_privilege(roles.role_name, 'public.feedback', privileges.privilege_name);

  SELECT count(*)
  INTO effective_column_privilege_count
  FROM (VALUES ('anon'), ('authenticated')) AS roles(role_name)
  CROSS JOIN pg_attribute a
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('REFERENCES')) AS privileges(privilege_name)
  WHERE a.attrelid = 'public.feedback'::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND has_column_privilege(roles.role_name, 'public.feedback', a.attname, privileges.privilege_name);

  IF effective_table_privilege_count <> 0 OR effective_column_privilege_count <> 0 THEN
    RAISE EXCEPTION 'feedback effective client privilege drift';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.feedback'::regclass) THEN
    RAISE EXCEPTION 'feedback row-level security is not enabled';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.feedback'::regclass) THEN
    RAISE EXCEPTION 'feedback client-facing policy drift';
  END IF;
END;
$$;
