#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
validator="$repo_root/scripts/deployment/validate-production-readiness-contract.sh"
runner="$repo_root/scripts/deployment/run-os38-production-migrations.sh"
canonical_ci="$repo_root/.github/workflows/ci.yml"
canonical_deploy="$repo_root/.github/workflows/deploy.yml"
canonical_migration_dockerfile="$repo_root/scripts/deployment/Dockerfile.migrations"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/nextshift-production-readiness.XXXXXX")"
pass_count=0
postgres_started=false

cleanup() {
  if [[ "$postgres_started" == true ]]; then
    "$pg_ctl_bin" -D "$fixture_root/postgres" -m immediate stop >/dev/null 2>&1 || true
  fi
  rm -rf "$fixture_root"
}
trap cleanup EXIT

pass() {
  pass_count=$((pass_count + 1))
  printf 'PASS: %s\n' "$1"
}

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

new_fixture() {
  local name="$1"
  fixture_directory="$fixture_root/$name"
  mkdir -p "$fixture_directory"
  fixture_ci="$fixture_directory/ci.yml"
  fixture_deploy="$fixture_directory/deploy.yml"
  fixture_runner="$fixture_directory/run-os38-production-migrations.sh"
  fixture_migration_dockerfile="$fixture_directory/Dockerfile.migrations"
  cp "$canonical_ci" "$fixture_ci"
  cp "$canonical_deploy" "$fixture_deploy"
  cp "$runner" "$fixture_runner"
  cp "$canonical_migration_dockerfile" "$fixture_migration_dockerfile"
}

expect_accept() {
  local name="$1"
  "$validator" "$fixture_ci" "$fixture_deploy" "$fixture_runner" "$fixture_migration_dockerfile" >/dev/null || \
    fail "$name should be accepted"
  pass "$name"
}

expect_reject() {
  local name="$1"
  if "$validator" "$fixture_ci" "$fixture_deploy" "$fixture_runner" "$fixture_migration_dockerfile" >/dev/null 2>&1; then
    fail "$name should be rejected"
  fi
  pass "$name"
}

new_fixture main_push
expect_accept main_push_runs_all_four_required_jobs

new_fixture pull_request
expect_accept pull_request_runs_all_four_required_jobs

new_fixture main_push_skip
perl -0pi -e 's/              exit 1\n/              exit 0\n/' "$fixture_ci"
expect_reject main_push_e2e_cannot_be_skipped

new_fixture ci_dispatch
perl -0pi -e "s/on:\n/on:\n  workflow_run:\n    workflows: ['CI']\n    types: [completed]\n/" "$fixture_deploy"
expect_reject ci_success_cannot_dispatch_production

new_fixture non_main_permissions
perl -0pi -e 's/contents: read/contents: write/' "$fixture_ci"
expect_reject non_main_push_cannot_gain_production_authority

new_fixture complete_inventory
expect_accept complete_os38_migration_inventory_required

new_fixture missing_supabase
perl -0pi -e 's#supabase/migrations/20260717135456_u3b_three_space_audit\.sql#supabase/migrations/missing.sql#' "$fixture_runner"
expect_reject missing_supabase_migration_rejected

new_fixture deterministic_order
expect_accept migration_order_is_deterministic

new_fixture fresh_atomic
expect_accept fresh_u3b_and_rls_install_is_atomic

new_fixture default_grants
expect_accept supabase_default_grants_removed_before_first_commit

new_fixture additive_existing
expect_accept existing_u3b_without_rls_is_hardened_additively

new_fixture partial_ledger
perl -0pi -e 's/partial U3B\/RLS ledger state detected before fresh installation/partial state accepted/' "$fixture_runner"
expect_reject partial_u3b_rls_ledger_state_rejected

new_fixture failure_order
perl -0pi -e 's#(            docker run --rm \\\n)#            docker compose --env-file .env.production -f docker-compose.prod.yml up -d app\n$1#' "$fixture_deploy"
expect_reject migration_failure_prevents_deploy

new_fixture double_index
perl -0pi -e 's#printf '\''PASS: OS 3\.8 migrations#psql "postgresql://fixture" -f "scripts/u3b-admin-migration/install-audit-idempotency-authority.sql"\nprintf '\''PASS: OS 3.8 migrations#' "$fixture_runner"
expect_reject partial_index_installer_not_double_applied

new_fixture no_catalog_assertion
perl -0pi -e 's/post-migration catalog assertions failed/post-migration catalog check omitted/' "$fixture_runner"
expect_reject post_migration_catalog_assertions_required

new_fixture unbound_release
perl -ni -e 'print unless /release marker does not match the requested release SHA/' "$fixture_runner"
expect_reject exact_release_sha_bound_to_migration

new_fixture immutable_runtime
expect_accept production_migration_runtime_has_no_network_install

new_fixture migration_revision
perl -0pi -e 's/org\.opencontainers\.image\.revision="\$\{RELEASE_SHA\}"/org.opencontainers.image.revision="wrong"/' "$fixture_migration_dockerfile"
expect_reject migration_image_revision_must_match_release_sha

new_fixture migration_digest
perl -ni -e 'print unless /test "\$actual_migration_digest" = "\$expected_migration_digest"/' "$fixture_deploy"
expect_reject migration_image_digest_mismatch_rejected

new_fixture additive_rls_inventory
perl -0pi -e 's#supabase/migrations/20260720134506_harden_audit_internal_tables_rls\.sql#supabase/migrations/missing-audit-rls.sql#' "$fixture_runner"
expect_reject additive_rls_migration_inventory_required

new_fixture rls_catalog_drift
perl -0pi -e 's/ AND c\.relrowsecurity//g' "$fixture_runner"
expect_reject rls_catalog_drift_rejected

release_sha="$(git -C "$repo_root" rev-parse HEAD)"
external_marker="$fixture_root/external-release-sha.txt"
printf '%s\n' "$release_sha" >"$external_marker"
if OS38_MIGRATION_MODE=fixture \
  DIRECT_URL='postgresql://fixture:fixture@example.com:5432/not-production?schema=public' \
  DATABASE_URL='postgresql://fixture:fixture@example.com:5432/not-production?schema=public' \
  "$runner" "$release_sha" "$external_marker" >/dev/null 2>&1; then
  fail 'fixture mode accepted a non-local database connection'
fi
pass production_connection_rejected_in_fixture_mode

# Real PostgreSQL rehearsal. The fixture starts from a current Prisma schema,
# rolls back only the two OS 3.8 change groups, and installs truthful historical
# ledger rows so the production entrypoint exercises incremental recovery.
postgres_bindir="$(pg_config --bindir 2>/dev/null || true)"
initdb_bin="$(command -v initdb || true)"
pg_ctl_bin="$(command -v pg_ctl || true)"
createdb_bin="$(command -v createdb || true)"
psql_bin="$(command -v psql || true)"
[[ -n "$initdb_bin" || -z "$postgres_bindir" ]] || initdb_bin="$postgres_bindir/initdb"
[[ -n "$pg_ctl_bin" || -z "$postgres_bindir" ]] || pg_ctl_bin="$postgres_bindir/pg_ctl"
[[ -n "$createdb_bin" || -z "$postgres_bindir" ]] || createdb_bin="$postgres_bindir/createdb"
[[ -n "$psql_bin" || -z "$postgres_bindir" ]] || psql_bin="$postgres_bindir/psql"
[[ -n "$initdb_bin" && -n "$pg_ctl_bin" && -n "$createdb_bin" && -n "$psql_bin" ]] || \
  fail 'PostgreSQL client/server binaries are required for the real migration rehearsal'

"$initdb_bin" -D "$fixture_root/postgres" -A trust -U postgres >/dev/null
postgres_port=$((52000 + ($$ % 5000)))
postgres_log="$fixture_root/postgres.log"
if ! "$pg_ctl_bin" -D "$fixture_root/postgres" \
  -l "$postgres_log" \
  -o "-h 127.0.0.1 -k $fixture_root -p $postgres_port" \
  -w start >/dev/null; then
  sed -n '1,120p' "$postgres_log" >&2
  fail 'disposable PostgreSQL server failed to start'
fi
postgres_started=true
"$createdb_bin" -h 127.0.0.1 -p "$postgres_port" -U postgres os38_readiness
fixture_url="postgresql://postgres@127.0.0.1:$postgres_port/os38_readiness?schema=public"

DATABASE_URL="$fixture_url" DIRECT_URL="$fixture_url" \
  "$repo_root/node_modules/.bin/prisma" db push --skip-generate --schema "$repo_root/prisma/schema.prisma" >/dev/null

psql_url="postgresql://postgres@127.0.0.1:$postgres_port/os38_readiness"
"$psql_bin" -X -q -v ON_ERROR_STOP=1 "$psql_url" <<'SQL'
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO anon, authenticated;
DROP TABLE IF EXISTS "audit_operational_alerts" CASCADE;
DROP TABLE IF EXISTS "audit_event_outbox" CASCADE;
DROP FUNCTION IF EXISTS enforce_audit_operational_alert_retention() CASCADE;
DROP FUNCTION IF EXISTS prevent_audit_outbox_payload_mutation() CASCADE;
DROP FUNCTION IF EXISTS prevent_platform_audit_mutation() CASCADE;
DROP FUNCTION IF EXISTS enforce_platform_audit_retention() CASCADE;
DROP FUNCTION IF EXISTS enforce_audit_outbox_retention() CASCADE;
DROP INDEX IF EXISTS "audit_logs_idempotency_key_unique";
ALTER TABLE "audit_logs"
  DROP COLUMN IF EXISTS "scope" CASCADE,
  DROP COLUMN IF EXISTS "idempotency_key" CASCADE,
  DROP COLUMN IF EXISTS "payload_digest" CASCADE,
  DROP COLUMN IF EXISTS "retention_until" CASCADE,
  DROP COLUMN IF EXISTS "legal_hold" CASCADE,
  ALTER COLUMN "tenant_id" SET NOT NULL;
DROP TYPE IF EXISTS "AuditScope" CASCADE;
ALTER TABLE "contents" DROP COLUMN IF EXISTS "updated_at" CASCADE;

CREATE TABLE public._prisma_migrations (
  id varchar(36) PRIMARY KEY,
  checksum varchar(64) NOT NULL,
  finished_at timestamptz,
  migration_name varchar(255) NOT NULL,
  logs text,
  rolled_back_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0
);
INSERT INTO public._prisma_migrations(id, checksum, finished_at, migration_name, applied_steps_count) VALUES
  ('00000000-0000-0000-0000-000000000001','e10b6041c43c0e0b9c1c7155fa6b35744d5623cfa38ae2fe524e9bb3045039ca',now(),'20260612110000_mission_engine_core',1),
  ('00000000-0000-0000-0000-000000000002','d65e193330143e8ecd2ad619d7251599f160e980415a02ba990acad4f06188a7',now(),'20260612130000_video_project_engine',1),
  ('00000000-0000-0000-0000-000000000003','977da9754f41b749e462a1aee140e51ef123246cdb14e39f76dd5f9ea6383166',now(),'20260612190000_brand_profile_canonical',1),
  ('00000000-0000-0000-0000-000000000004','3aa2efd1fae083e921e5e3d1e89dd09e40967f41bbee904f3ac07a44974d8e36',now(),'20260619154500_feedback',1),
  ('00000000-0000-0000-0000-000000000005','43907143725ca6662d66e52f4b3b22996c452d5790159dfafe949a61dff1ba65',now(),'20260621180939_add_invite_codes_updated_at',1),
  ('00000000-0000-0000-0000-000000000006','c1ec22c315348c7e8e2ff669edf8b989642b64460aa2ab3d310bbbe632f98d97',now(),'20260625045100_lock_down_public_rls',1);

CREATE SCHEMA supabase_migrations;
CREATE TABLE supabase_migrations.schema_migrations (
  version text PRIMARY KEY,
  statements text[] NOT NULL DEFAULT '{}',
  name text
);
INSERT INTO supabase_migrations.schema_migrations(version, name) VALUES
  ('202606060001','initial_nextshift_schema'),
  ('202606060002','add_lead_score_reasons'),
  ('202606080001','fix_voice_profile_status_check'),
  ('202606140001','feedback_system');
SQL

fixture_marker="$fixture_root/release-sha.txt"
printf '%s\n' "$release_sha" >"$fixture_marker"
OS38_MIGRATION_MODE=fixture DATABASE_URL="$fixture_url" DIRECT_URL="$fixture_url" \
  "$runner" "$release_sha" "$fixture_marker" >/dev/null

fresh_ledger_xmin_count="$("$psql_bin" -X -qAt "$psql_url" -c \
  "SELECT count(DISTINCT xmin::text) FROM supabase_migrations.schema_migrations WHERE version IN ('20260717135456','20260720134506');")"
[[ "$fresh_ledger_xmin_count" == 1 ]] || fail 'fresh U3B and RLS ledger rows were not committed by one transaction'
pass fresh_u3b_and_rls_install_is_atomic

fresh_privilege_count="$("$psql_bin" -X -qAt "$psql_url" -c \
  "SELECT count(*) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('audit_event_outbox','audit_operational_alerts') AND grantee IN ('anon','authenticated');")"
[[ "$fresh_privilege_count" == 0 ]] || fail 'Supabase-style default table grants survived the first U3B/RLS commit'
pass supabase_default_grants_removed_before_first_commit

index_oid_before="$("$psql_bin" -X -qAt "$psql_url" -c \
  "SELECT 'public.audit_logs_idempotency_key_unique'::regclass::oid;")"
OS38_MIGRATION_MODE=fixture DATABASE_URL="$fixture_url" DIRECT_URL="$fixture_url" \
  "$runner" "$release_sha" "$fixture_marker" >/dev/null
index_oid_after="$("$psql_bin" -X -qAt "$psql_url" -c \
  "SELECT 'public.audit_logs_idempotency_key_unique'::regclass::oid;")"
[[ "$index_oid_before" == "$index_oid_after" ]] || fail 'idempotent restart recreated the partial index'

catalog_result="$("$psql_bin" -X -qAt "$psql_url" <<'SQL'
SELECT concat_ws('|',
  (SELECT count(*) FROM public._prisma_migrations WHERE migration_name='20260715220949_add_content_updated_at' AND finished_at IS NOT NULL),
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20260717135456'),
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20260720134506'),
  (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname='audit_logs_idempotency_key_unique' AND indexdef LIKE '%WHERE (idempotency_key IS NOT NULL)%'),
  (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('audit_event_outbox','audit_operational_alerts')),
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('audit_event_outbox','audit_operational_alerts') AND c.relrowsecurity),
  (SELECT count(*) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('audit_event_outbox','audit_operational_alerts') AND grantee IN ('anon','authenticated')),
  (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('audit_event_outbox','audit_operational_alerts'))
);
SQL
)"
[[ "$catalog_result" == '1|1|1|1|2|2|0|0' ]] || fail "unexpected post-migration catalog: $catalog_result"
pass disposable_postgresql_migration_rehearsal

[[ "$("$psql_bin" -X -qAt "$psql_url" -c "SELECT relrowsecurity FROM pg_class WHERE oid='public.audit_event_outbox'::regclass;")" == t ]] || \
  fail 'audit_event_outbox RLS is not enabled'
pass audit_outbox_rls_enabled

[[ "$("$psql_bin" -X -qAt "$psql_url" -c "SELECT relrowsecurity FROM pg_class WHERE oid='public.audit_operational_alerts'::regclass;")" == t ]] || \
  fail 'audit_operational_alerts RLS is not enabled'
pass audit_alerts_rls_enabled

for role in anon authenticated; do
  if "$psql_bin" -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
    "SET ROLE $role; SELECT count(*) FROM public.audit_event_outbox;" >/dev/null 2>&1; then
    fail "$role unexpectedly accessed audit_event_outbox"
  fi
  if "$psql_bin" -X -qAt -v ON_ERROR_STOP=1 "$psql_url" -c \
    "SET ROLE $role; SELECT count(*) FROM public.audit_operational_alerts;" >/dev/null 2>&1; then
    fail "$role unexpectedly accessed audit_operational_alerts"
  fi
done
pass audit_tables_anon_authenticated_access_rejected

# Exercise the supported upgrade path where U3B is already committed but the
# additive RLS migration has not yet been applied.
"$psql_bin" -X -q -v ON_ERROR_STOP=1 "$psql_url" <<'SQL'
DELETE FROM supabase_migrations.schema_migrations WHERE version='20260720134506';
COMMENT ON TABLE public.audit_event_outbox IS NULL;
COMMENT ON TABLE public.audit_operational_alerts IS NULL;
ALTER TABLE public.audit_event_outbox DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_operational_alerts DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.audit_event_outbox, public.audit_operational_alerts TO anon, authenticated;
SQL
OS38_MIGRATION_MODE=fixture DATABASE_URL="$fixture_url" DIRECT_URL="$fixture_url" \
  "$runner" "$release_sha" "$fixture_marker" >/dev/null
additive_state="$("$psql_bin" -X -qAt "$psql_url" <<'SQL'
SELECT concat_ws('|',
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20260717135456'),
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20260720134506'),
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('audit_event_outbox','audit_operational_alerts') AND c.relrowsecurity),
  (SELECT count(*) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('audit_event_outbox','audit_operational_alerts') AND grantee IN ('anon','authenticated'))
);
SQL
)"
[[ "$additive_state" == '1|1|2|0' ]] || fail "existing U3B additive RLS hardening failed: $additive_state"
pass existing_u3b_without_rls_is_hardened_additively

# A ledger/catalog combination from different lifecycle points must never be
# repaired by guessing which migration succeeded.
"$psql_bin" -X -q -v ON_ERROR_STOP=1 "$psql_url" -c \
  "DELETE FROM supabase_migrations.schema_migrations WHERE version='20260717135456';"
if OS38_MIGRATION_MODE=fixture DATABASE_URL="$fixture_url" DIRECT_URL="$fixture_url" \
  "$runner" "$release_sha" "$fixture_marker" >/dev/null 2>&1; then
  fail 'partial U3B/RLS ledger state was accepted'
fi
pass partial_u3b_rls_ledger_state_rejected

[[ "$pass_count" == 30 ]] || fail "expected 30 named fixtures, got $pass_count"
printf 'PASS: %s production-readiness fixtures\n' "$pass_count"
