#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
release_sha="${1:-}"
release_marker="${2:-}"
migration_mode="${OS38_MIGRATION_MODE:-production}"
direct_url="${DIRECT_URL:-}"
lock_key=38003820260717

content_migration="$repo_root/prisma/migrations/20260715220949_add_content_updated_at/migration.sql"
feedback_reconciliation_migration="$repo_root/supabase/migrations/20260721074302_feedback_catalog_reconciliation.sql"
u3b_migration="$repo_root/supabase/migrations/20260717135456_u3b_three_space_audit.sql"
audit_rls_migration="$repo_root/supabase/migrations/20260720134506_harden_audit_internal_tables_rls.sql"
partial_index_installer="$repo_root/scripts/u3b-admin-migration/install-audit-idempotency-authority.sql"
prisma_schema="$repo_root/prisma/schema.prisma"

content_sha='31ca2c16224aee4184d4cb787428ae365bb5f1bafbac74196fb9f367738ffa5a'
feedback_reconciliation_sha='385923f9172652cea404ff6c6ddbe802941a3072b911877ac632436b57b36dc6'
u3b_sha='cbce822033bb3ced502f2e6f104e275a064dd8516a98190dd8e2d4403622ae66'
audit_rls_sha='f560a101bc912500cf924a6972b9abe6720b2a248785a4bf7c96ecaeb0521264'
installer_sha='a97cee2918c934be7a3951732e210ee73365d18320740b98af7d8ff96fd92246'
schema_sha='e5625065f2462cb6dfd631e327981eb62993b5cc8875fa05fe785810ffbdece5'

lock_directory=''
lock_fifo=''
lock_status=''
lock_pid=''
lock_fd_open=false

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

sha256_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print $1}'
  else
    shasum -a 256 "$path" | awk '{print $1}'
  fi
}

cleanup() {
  if [[ "$lock_fd_open" == true ]]; then
    printf '%s\n' "SELECT pg_advisory_unlock($lock_key);" '\q' >&9 2>/dev/null || true
    exec 9>&- || true
    lock_fd_open=false
  fi
  if [[ -n "$lock_pid" ]]; then
    wait "$lock_pid" 2>/dev/null || true
  fi
  if [[ -n "$lock_fifo" && -p "$lock_fifo" ]]; then
    rm -f "$lock_fifo"
  fi
  if [[ -n "$lock_status" && -f "$lock_status" ]]; then
    rm -f "$lock_status"
  fi
  if [[ -n "$lock_directory" && -d "$lock_directory" ]]; then
    rm -rf "$lock_directory"
  fi
}
trap cleanup EXIT INT TERM

[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'release SHA must be a full lowercase 40-character Git SHA'
[[ -n "$release_marker" && -f "$release_marker" && ! -L "$release_marker" ]] || \
  fail 'release marker must be a regular, non-symlink file'
[[ "$(wc -l <"$release_marker" | tr -d ' ')" == 1 ]] || fail 'release marker must contain exactly one line'
[[ "$(cat "$release_marker")" == "$release_sha" ]] || fail 'release marker does not match the requested release SHA'
[[ -n "$direct_url" ]] || fail 'DIRECT_URL is required'

for inventory_item in \
  "$content_migration" \
  "$feedback_reconciliation_migration" \
  "$u3b_migration" \
  "$audit_rls_migration" \
  "$partial_index_installer" \
  "$prisma_schema"; do
  [[ -f "$inventory_item" && ! -L "$inventory_item" ]] || \
    fail "migration inventory item must be a regular, non-symlink file: $inventory_item"
done

[[ "$(sha256_file "$content_migration")" == "$content_sha" ]] || fail 'Content migration checksum drift'
[[ "$(sha256_file "$feedback_reconciliation_migration")" == "$feedback_reconciliation_sha" ]] || \
  fail 'Feedback reconciliation migration checksum drift'
[[ "$(sha256_file "$u3b_migration")" == "$u3b_sha" ]] || fail 'U3B Supabase migration checksum drift'
[[ "$(sha256_file "$audit_rls_migration")" == "$audit_rls_sha" ]] || fail 'audit-table RLS migration checksum drift'
[[ "$(sha256_file "$partial_index_installer")" == "$installer_sha" ]] || fail 'partial-index installer checksum drift'
[[ "$(sha256_file "$prisma_schema")" == "$schema_sha" ]] || fail 'Prisma schema checksum drift'

if git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  [[ "$(git -C "$repo_root" rev-parse HEAD)" == "$release_sha" ]] || \
    fail 'repository checkout does not match the requested release SHA'
fi

psql_url="$(DIRECT_URL="$direct_url" node -e '
  const url = new URL(process.env.DIRECT_URL);
  url.searchParams.delete("schema");
  process.stdout.write(url.toString());
')"

if [[ "$migration_mode" == fixture ]]; then
  fixture_host="$(PSQL_URL="$psql_url" node -e 'process.stdout.write(new URL(process.env.PSQL_URL).hostname)')"
  case "$fixture_host" in
    localhost | 127.0.0.1 | ::1) ;;
    *) fail 'fixture mode rejects non-local database connections' ;;
  esac
elif [[ "$migration_mode" != production ]]; then
  fail "unsupported migration mode: $migration_mode"
fi

command -v psql >/dev/null 2>&1 || fail 'psql is required'
command -v node >/dev/null 2>&1 || fail 'node is required'
[[ -x "$repo_root/node_modules/.bin/prisma" ]] || fail 'lockfile-installed Prisma CLI is required'

lock_directory="$(mktemp -d "${TMPDIR:-/tmp}/nextshift-os38-migration-lock.XXXXXX")"
lock_fifo="$lock_directory/input"
lock_status="$lock_directory/status"
mkfifo "$lock_fifo"
psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" >"$lock_status" <"$lock_fifo" 2>&1 &
lock_pid=$!
exec 9>"$lock_fifo"
lock_fd_open=true
printf '%s\n' '\set ON_ERROR_STOP on' \
  "SELECT CASE WHEN pg_try_advisory_lock($lock_key) THEN 'LOCK_ACQUIRED' ELSE 'LOCK_BUSY' END;" >&9

for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  grep -q '^LOCK_' "$lock_status" 2>/dev/null && break
  kill -0 "$lock_pid" 2>/dev/null || break
  sleep 0.1
done
grep -q '^LOCK_ACQUIRED$' "$lock_status" 2>/dev/null || fail 'production migration advisory lock is already held or unavailable'

expected_prisma_ledger="$(cat <<'SQL'
20260612110000_mission_engine_core|e10b6041c43c0e0b9c1c7155fa6b35744d5623cfa38ae2fe524e9bb3045039ca
20260612130000_video_project_engine|d65e193330143e8ecd2ad619d7251599f160e980415a02ba990acad4f06188a7
20260612190000_brand_profile_canonical|977da9754f41b749e462a1aee140e51ef123246cdb14e39f76dd5f9ea6383166
20260619154500_feedback|3aa2efd1fae083e921e5e3d1e89dd09e40967f41bbee904f3ac07a44974d8e36
20260621180939_add_invite_codes_updated_at|43907143725ca6662d66e52f4b3b22996c452d5790159dfafe949a61dff1ba65
20260625045100_lock_down_public_rls|c1ec22c315348c7e8e2ff669edf8b989642b64460aa2ab3d310bbbe632f98d97
SQL
)"

actual_prisma_ledger="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" <<'SQL'
SELECT migration_name || '|' || checksum
FROM public._prisma_migrations
WHERE migration_name IN (
  '20260612110000_mission_engine_core',
  '20260612130000_video_project_engine',
  '20260612190000_brand_profile_canonical',
  '20260619154500_feedback',
  '20260621180939_add_invite_codes_updated_at',
  '20260625045100_lock_down_public_rls'
)
  AND finished_at IS NOT NULL
  AND rolled_back_at IS NULL
ORDER BY migration_name;
SQL
)"
[[ "$actual_prisma_ledger" == "$expected_prisma_ledger" ]] || fail 'Prisma migration ledger is incomplete or has checksum drift'

failed_prisma_count="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
  'SELECT count(*) FROM public._prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL;')"
[[ "$failed_prisma_count" == 0 ]] || fail 'Prisma migration ledger contains an unresolved failed migration'

supabase_ledger_shape="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" <<'SQL'
SELECT count(*)
FROM information_schema.columns
WHERE table_schema = 'supabase_migrations'
  AND table_name = 'schema_migrations'
  AND column_name IN ('version', 'statements', 'name');
SQL
)"
[[ "$supabase_ledger_shape" == 3 ]] || fail 'Supabase migration ledger authority is missing or incompatible'

"$repo_root/node_modules/.bin/prisma" migrate deploy --schema "$prisma_schema"

applied_content_sha="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
  "SELECT checksum FROM public._prisma_migrations WHERE migration_name = '20260715220949_add_content_updated_at' AND finished_at IS NOT NULL AND rolled_back_at IS NULL;")"
[[ "$applied_content_sha" == "$content_sha" ]] || fail 'Content migration was not recorded with the exact repository checksum'

feedback_ledger_count="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
  "SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20260721074302';")"
feedback_ledger_binding_count="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
  "SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20260721074302' AND name = 'feedback_catalog_reconciliation' AND statements = ARRAY['nextshift sha256=$feedback_reconciliation_sha'];")"
feedback_catalog_binding_count="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
  "SELECT count(*) FROM pg_description d JOIN pg_class c ON c.oid=d.objoid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='feedback' AND d.objsubid=0 AND d.description='nextshift:supabase-migration:20260721074302:sha256=$feedback_reconciliation_sha';")"
feedback_catalog_state="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" <<'SQL'
SELECT concat_ws('|',
  (SELECT count(*) FROM pg_constraint WHERE conrelid='public.feedback'::regclass AND conname IN ('feedback_tenant_id_fkey','feedback_user_id_fkey','feedback_type_check','feedback_severity_check','feedback_status_check') AND convalidated),
  (SELECT count(*) FROM pg_class WHERE oid='public.feedback'::regclass AND relrowsecurity),
  (SELECT count(*) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='feedback' AND grantee IN ('anon','authenticated')),
  (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='feedback'),
  (SELECT count(*) FROM pg_trigger WHERE tgrelid='public.feedback'::regclass AND tgname='trg_feedback_updated_at' AND NOT tgisinternal AND tgfoid=to_regprocedure('public.update_feedback_updated_at()')),
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='update_feedback_updated_at' AND p.pronargs=0 AND NOT p.prosecdef),
  (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND tablename='feedback' AND indexname IN ('feedback_pkey','feedback_tenant_id_idx','feedback_type_idx','feedback_status_idx','feedback_created_at_idx'))
);
SQL
)"

if [[ "$feedback_ledger_count" == 0 ]]; then
  [[ "$feedback_catalog_binding_count" == 0 ]] || \
    fail 'Feedback reconciliation catalog binding exists without its ledger authority'
  feedback_apply_sql="$lock_directory/feedback-reconciliation-apply.sql"
  {
    printf '%s\n' '\set ON_ERROR_STOP on' 'BEGIN;'
    cat "$feedback_reconciliation_migration"
    printf '%s\n' \
      "COMMENT ON TABLE public.feedback IS 'nextshift:supabase-migration:20260721074302:sha256=$feedback_reconciliation_sha';" \
      "INSERT INTO supabase_migrations.schema_migrations(version, statements, name) VALUES ('20260721074302', ARRAY['nextshift sha256=$feedback_reconciliation_sha'], 'feedback_catalog_reconciliation');" \
      'COMMIT;'
  } >"$feedback_apply_sql"
  psql -X -q -v ON_ERROR_STOP=1 "$psql_url" -f "$feedback_apply_sql"
  rm -f "$feedback_apply_sql"
  feedback_ledger_count=1
  feedback_ledger_binding_count=1
  feedback_catalog_binding_count=1
  feedback_catalog_state='5|1|0|0|1|1|5'
elif [[ "$feedback_ledger_count" != 1 || "$feedback_ledger_binding_count" != 1 || "$feedback_catalog_binding_count" != 1 || "$feedback_catalog_state" != '5|1|0|0|1|1|5' ]]; then
  fail 'Feedback reconciliation migration ledger/catalog binding drift detected'
fi

u3b_ledger_count="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
  "SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20260717135456';")"
u3b_catalog_count="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" <<'SQL'
SELECT
  (CASE WHEN to_regtype('public."AuditScope"') IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN to_regclass('public.audit_event_outbox') IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN to_regclass('public.audit_operational_alerts') IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN to_regclass('public.audit_logs_idempotency_key_unique') IS NOT NULL THEN 1 ELSE 0 END);
SQL
)"

audit_rls_ledger_count="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
  "SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20260720134506';")"
audit_rls_catalog_state="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" <<'SQL'
SELECT concat_ws('|',
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname IN ('audit_event_outbox','audit_operational_alerts') AND c.relrowsecurity),
  (SELECT count(*) FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name IN ('audit_event_outbox','audit_operational_alerts')
     AND grantee IN ('anon','authenticated')),
  (SELECT count(*) FROM pg_policies
   WHERE schemaname='public' AND tablename IN ('audit_event_outbox','audit_operational_alerts'))
);
SQL
)"

if [[ "$u3b_ledger_count" == 0 && "$u3b_catalog_count" == 0 ]]; then
  [[ "$audit_rls_ledger_count" == 0 && "$audit_rls_catalog_state" == '0|0|0' ]] || \
    fail 'partial U3B/RLS ledger state detected before fresh installation'
  u3b_apply_sql="$lock_directory/u3b-and-rls-apply.sql"
  {
    printf '%s\n' '\set ON_ERROR_STOP on' 'BEGIN;'
    cat "$u3b_migration"
    printf '%s\n' \
      "COMMENT ON TYPE \"AuditScope\" IS 'nextshift:supabase-migration:20260717135456:sha256=$u3b_sha';" \
      "INSERT INTO supabase_migrations.schema_migrations(version, statements, name) VALUES ('20260717135456', ARRAY['nextshift sha256=$u3b_sha'], 'u3b_three_space_audit');"
    cat "$audit_rls_migration"
    printf '%s\n' \
      "COMMENT ON TABLE audit_event_outbox IS 'nextshift:supabase-migration:20260720134506:sha256=$audit_rls_sha';" \
      "COMMENT ON TABLE audit_operational_alerts IS 'nextshift:supabase-migration:20260720134506:sha256=$audit_rls_sha';" \
      "INSERT INTO supabase_migrations.schema_migrations(version, statements, name) VALUES ('20260720134506', ARRAY['nextshift sha256=$audit_rls_sha'], 'harden_audit_internal_tables_rls');" \
      'COMMIT;'
  } >"$u3b_apply_sql"
  psql -X -q -v ON_ERROR_STOP=1 "$psql_url" -f "$u3b_apply_sql"
  rm -f "$u3b_apply_sql"
  u3b_ledger_count=1
  u3b_catalog_count=4
  audit_rls_ledger_count=1
  audit_rls_catalog_state='2|0|0'
elif [[ "$u3b_ledger_count" != 1 || "$u3b_catalog_count" != 4 ]]; then
  fail 'U3B migration ledger/catalog drift detected'
fi

if [[ "$audit_rls_ledger_count" == 0 ]]; then
  [[ "$audit_rls_catalog_state" =~ ^[0-2]\|[0-9]+\|0$ ]] || \
    fail 'audit-table RLS pre-migration catalog state is invalid'
  audit_rls_apply_sql="$lock_directory/audit-rls-apply.sql"
  {
    printf '%s\n' '\set ON_ERROR_STOP on' 'BEGIN;'
    cat "$audit_rls_migration"
    printf '%s\n' \
      "COMMENT ON TABLE audit_event_outbox IS 'nextshift:supabase-migration:20260720134506:sha256=$audit_rls_sha';" \
      "COMMENT ON TABLE audit_operational_alerts IS 'nextshift:supabase-migration:20260720134506:sha256=$audit_rls_sha';" \
      "INSERT INTO supabase_migrations.schema_migrations(version, statements, name) VALUES ('20260720134506', ARRAY['nextshift sha256=$audit_rls_sha'], 'harden_audit_internal_tables_rls');" \
      'COMMIT;'
  } >"$audit_rls_apply_sql"
  psql -X -q -v ON_ERROR_STOP=1 "$psql_url" -f "$audit_rls_apply_sql"
  rm -f "$audit_rls_apply_sql"
elif [[ "$audit_rls_ledger_count" != 1 || "$audit_rls_catalog_state" != '2|0|0' ]]; then
  fail 'audit-table RLS migration ledger/catalog drift detected'
fi

post_assertions="$(psql -X -qAt -v ON_ERROR_STOP=1 "$psql_url" <<SQL
SELECT concat_ws('|',
  (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='contents' AND column_name='updated_at' AND is_nullable='NO'),
  (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('contents_tenant_id_owner_id_updated_at_id_idx','contents_tenant_id_updated_at_id_idx')),
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20260721074302' AND name='feedback_catalog_reconciliation' AND statements=ARRAY['nextshift sha256=$feedback_reconciliation_sha']),
  (SELECT count(*) FROM pg_description d JOIN pg_class c ON c.oid=d.objoid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='feedback' AND d.objsubid=0 AND d.description='nextshift:supabase-migration:20260721074302:sha256=$feedback_reconciliation_sha'),
  (SELECT count(*) FROM pg_constraint WHERE conrelid='public.feedback'::regclass AND conname IN ('feedback_tenant_id_fkey','feedback_user_id_fkey','feedback_type_check','feedback_severity_check','feedback_status_check') AND convalidated),
  (SELECT count(*) FROM pg_class WHERE oid='public.feedback'::regclass AND relrowsecurity),
  (SELECT count(*) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='feedback' AND grantee IN ('anon','authenticated')),
  (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='feedback'),
  (SELECT count(*) FROM pg_trigger WHERE tgrelid='public.feedback'::regclass AND tgname='trg_feedback_updated_at' AND NOT tgisinternal AND tgfoid=to_regprocedure('public.update_feedback_updated_at()')),
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='update_feedback_updated_at' AND p.pronargs=0 AND NOT p.prosecdef),
  (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND tablename='feedback' AND indexname IN ('feedback_pkey','feedback_tenant_id_idx','feedback_type_idx','feedback_status_idx','feedback_created_at_idx')),
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20260717135456'),
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20260720134506'),
  (SELECT obj_description('public."AuditScope"'::regtype::oid, 'pg_type')),
  (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname='audit_logs_idempotency_key_unique' AND indexdef LIKE '%WHERE (idempotency_key IS NOT NULL)%'),
  (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('audit_event_outbox','audit_operational_alerts')),
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('audit_event_outbox','audit_operational_alerts') AND c.relrowsecurity),
  (SELECT count(*) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('audit_event_outbox','audit_operational_alerts') AND grantee IN ('anon','authenticated')),
  (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('audit_event_outbox','audit_operational_alerts')),
  (SELECT count(*) FROM pg_description d JOIN pg_class c ON c.oid=d.objoid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('audit_event_outbox','audit_operational_alerts') AND d.objsubid=0 AND d.description='nextshift:supabase-migration:20260720134506:sha256=$audit_rls_sha'),
  (SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('audit_event_outbox_append_only','platform_audit_append_only','platform_audit_retention_guard','audit_outbox_retention_guard','audit_operational_alert_retention_guard'))
);
SQL
)"
expected_post_assertions="1|2|1|1|5|1|0|0|1|1|5|1|1|nextshift:supabase-migration:20260717135456:sha256=$u3b_sha|1|2|2|0|0|2|5"
[[ "$post_assertions" == "$expected_post_assertions" ]] || fail 'post-migration catalog assertions failed'

printf 'PASS: OS 3.8 migrations applied for exact release %s; partial-index installer skipped because the Supabase migration owns the index\n' "$release_sha"
