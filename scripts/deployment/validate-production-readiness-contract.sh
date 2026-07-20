#!/usr/bin/env bash
# shellcheck disable=SC2016 # GitHub expressions are validated as inert literal contract data.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
ci_workflow="${1:-$repo_root/.github/workflows/ci.yml}"
deploy_workflow="${2:-$repo_root/.github/workflows/deploy.yml}"
migration_runner="${3:-$repo_root/scripts/deployment/run-os38-production-migrations.sh}"
manual_validator="$repo_root/scripts/deployment/validate-manual-production-workflow.sh"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

literal_count() {
  local file="$1"
  local needle="$2"
  grep -Fc -- "$needle" "$file" || true
}

require_count() {
  local file="$1"
  local expected="$2"
  local needle="$3"
  local label="$4"
  local actual
  actual="$(literal_count "$file" "$needle")"
  [[ "$actual" == "$expected" ]] || \
    fail "$label: expected $expected occurrence(s) of '$needle', found $actual"
}

require_order() {
  local file="$1"
  local before="$2"
  local after="$3"
  local label="$4"
  local before_line after_line
  before_line="$(grep -nF -- "$before" "$file" | head -1 | cut -d: -f1 || true)"
  after_line="$(grep -nF -- "$after" "$file" | head -1 | cut -d: -f1 || true)"
  [[ -n "$before_line" && -n "$after_line" && "$before_line" -lt "$after_line" ]] || \
    fail "$label: '$before' must precede '$after'"
}

for contract_file in "$ci_workflow" "$deploy_workflow" "$migration_runner"; do
  [[ -f "$contract_file" && ! -L "$contract_file" ]] || \
    fail "contract input must be a regular, non-symlink file: $contract_file"
done

pnpm exec prettier "$ci_workflow" "$deploy_workflow" >/dev/null
"$manual_validator" "$deploy_workflow" >/dev/null

require_count "$ci_workflow" 1 "    branches: [main, develop, 'planning/**']" 'push branch contract'
require_count "$ci_workflow" 2 "github.event_name == 'push' && github.ref == 'refs/heads/main'" 'main E2E job contract'
require_count "$ci_workflow" 2 "github.event_name == 'pull_request'" 'pull-request E2E job contract'
require_count "$ci_workflow" 1 '  contents: read' 'CI read-only token authority'
grep -Eq '^[[:space:]]+[A-Za-z0-9_-]+: write$' "$ci_workflow" && \
  fail 'CI must not grant write permission to a non-main push'
require_count "$ci_workflow" 1 'A main push may not skip the required E2E gate.' 'main E2E fail-closed guard'
require_count "$ci_workflow" 1 '              exit 1' 'main E2E fail-closed exit'
require_count "$ci_workflow" 1 'Untrusted pull requests retain the no-secrets boundary.' 'fork secret boundary'
for required_job in 'Type Check + Lint + Build' 'Tests' 'E2E Secret Check' 'E2E Tests'; do
  require_count "$ci_workflow" 1 "    name: $required_job" 'required CI jobs'
done

grep -Fq 'workflow_run:' "$deploy_workflow" && fail 'CI success must not trigger production deployment'
grep -Fq 'github.event.workflow_run' "$deploy_workflow" && fail 'workflow_run state must not authorize production deployment'

for inventory_path in \
  'prisma/migrations/20260715220949_add_content_updated_at/migration.sql' \
  'supabase/migrations/20260717135456_u3b_three_space_audit.sql' \
  'scripts/u3b-admin-migration/install-audit-idempotency-authority.sql' \
  'prisma/schema.prisma'; do
  require_count "$migration_runner" 1 "$inventory_path" 'OS 3.8 migration inventory'
done

require_count "$migration_runner" 1 'pg_try_advisory_lock' 'advisory migration lock'
require_count "$migration_runner" 1 "-v ON_ERROR_STOP=1 \"\$psql_url\" -f" 'transactional Supabase migration'
require_count "$migration_runner" 1 'Prisma migration ledger is incomplete or has checksum drift' 'Prisma ledger drift guard'
require_count "$migration_runner" 1 'Supabase migration ledger authority is missing or incompatible' 'Supabase ledger drift guard'
require_count "$migration_runner" 1 'partial-index installer skipped because the Supabase migration owns the index' 'partial-index single authority'
require_count "$migration_runner" 1 'post-migration catalog assertions failed' 'catalog assertion gate'
require_count "$migration_runner" 1 'fixture mode rejects non-local database connections' 'fixture production isolation'
require_count "$migration_runner" 1 'release marker does not match the requested release SHA' 'exact release marker binding'
require_order "$migration_runner" \
  'migrate deploy --schema' \
  'u3b_ledger_count=' \
  'Prisma/Supabase migration order'
grep -Eq '(psql|prisma db execute).*partial_index_installer' "$migration_runner" && \
  fail 'partial-index installer must not be executed after the authoritative Supabase migration'
grep -Eq '(psql|prisma db execute).*install-audit-idempotency-authority\.sql' "$migration_runner" && \
  fail 'partial-index installer must not be executed after the authoritative Supabase migration'

require_count "$deploy_workflow" 1 'scripts/deployment/run-os38-production-migrations.sh' 'complete migration entrypoint invocation'
require_count "$deploy_workflow" 1 '          printf '\''%s\n'\'' "$IMAGE_TAG" > os38-release-sha.txt' 'exact release marker creation'
require_count "$deploy_workflow" 1 '-e OS38_MIGRATION_MODE=production' 'production migration mode'
grep -Fq 'migrate deploy --schema /app/prisma/schema.prisma' "$deploy_workflow" && \
  fail 'deploy workflow must not bypass the complete migration entrypoint'
require_order "$deploy_workflow" \
  'run-os38-production-migrations.sh' \
  'docker compose --env-file .env.production -f docker-compose.prod.yml up -d app' \
  'migration failure must prevent application deployment'

printf 'PASS: main CI E2E and OS 3.8 migration/deployment contracts are fail closed\n'
