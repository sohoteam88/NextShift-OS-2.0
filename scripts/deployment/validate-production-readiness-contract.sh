#!/usr/bin/env bash
# shellcheck disable=SC2016 # GitHub expressions are validated as inert literal contract data.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
ci_workflow="${1:-$repo_root/.github/workflows/ci.yml}"
deploy_workflow="${2:-$repo_root/.github/workflows/deploy.yml}"
migration_runner="${3:-$repo_root/scripts/deployment/run-os38-production-migrations.sh}"
migration_dockerfile="${4:-$repo_root/scripts/deployment/Dockerfile.migrations}"
approval_validator="$repo_root/scripts/deployment/validate-final-release-approval.sh"
review_validator="$repo_root/scripts/deployment/validate-final-release-review-request.sh"
request_creator="$repo_root/scripts/deployment/request-final-release-review.sh"
manual_validator="$repo_root/scripts/deployment/validate-manual-production-workflow.sh"
image_runtime_validator="$repo_root/scripts/deployment/validate-migration-image-runtime.sh"
application_dockerfile="$repo_root/Dockerfile"
application_healthcheck="$repo_root/scripts/container-healthcheck.sh"
application_image_validator="$repo_root/scripts/deployment/validate-application-image-healthcheck.sh"
deploy_smoke="$repo_root/scripts/deploy-smoke.sh"
feedback_reconciliation_migration="$repo_root/supabase/migrations/20260721074302_feedback_catalog_reconciliation.sql"
feedback_authority_migration="$repo_root/supabase/migrations/20260721085431_feedback_catalog_authority_hardening.sql"

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

for contract_file in "$ci_workflow" "$deploy_workflow" "$migration_runner" "$migration_dockerfile" "$approval_validator" "$review_validator" "$request_creator" "$image_runtime_validator" "$application_dockerfile" "$application_healthcheck" "$application_image_validator" "$deploy_smoke" "$feedback_reconciliation_migration" "$feedback_authority_migration"; do
  [[ -f "$contract_file" && ! -L "$contract_file" ]] || \
    fail "contract input must be a regular, non-symlink file: $contract_file"
done

pnpm exec prettier "$ci_workflow" "$deploy_workflow" >/dev/null
"$manual_validator" "$deploy_workflow" "$repo_root/scripts/deployment/validate-production-request.sh" "$approval_validator" >/dev/null

require_count "$ci_workflow" 1 "    branches: [main, develop, 'planning/**']" 'push branch contract'
require_count "$ci_workflow" 2 "github.event_name == 'push' && github.ref == 'refs/heads/main'" 'main E2E job contract'
require_count "$ci_workflow" 2 "github.event_name == 'pull_request'" 'pull-request E2E job contract'
require_count "$ci_workflow" 1 '  contents: read' 'CI read-only token authority'
grep -Eq '^[[:space:]]+[A-Za-z0-9_-]+: write$' "$ci_workflow" && \
  fail 'CI must not grant write permission to a non-main push'
require_count "$ci_workflow" 1 'A main push may not skip the required E2E gate.' 'main E2E fail-closed guard'
require_count "$ci_workflow" 1 'scripts/deployment/tests/final-release-review.sh' 'Final Release review contract CI gate'
require_count "$review_validator" 1 ".final_release_review.reviewer_policy" 'canonical Final Release reviewer policy'
require_count "$review_validator" 1 'parse_review_controls "$body" "$release_sha"' 'strict Final Release review control parser'
require_count "$review_validator" 1 'unexpected Final Release review authority control:' 'unknown Final Release review control rejection'
require_count "$request_creator" 1 'rev-parse --path-format=absolute --git-common-dir' 'Final Release common-dir lock authority'
require_count "$request_creator" 1 'write_started=1' 'Final Release write-set rollback boundary'
require_count "$request_creator" 1 'duplicate request release differs from canonical release target' 'duplicate request release binding'
require_count "$ci_workflow" 1 '              exit 1' 'main E2E fail-closed exit'
require_count "$ci_workflow" 1 'Untrusted pull requests retain the no-secrets boundary.' 'fork secret boundary'
for required_job in 'Type Check + Lint + Build' 'Tests' 'E2E Secret Check' 'E2E Tests'; do
  require_count "$ci_workflow" 1 "    name: $required_job" 'required CI jobs'
done

grep -Fq 'workflow_run:' "$deploy_workflow" && fail 'CI success must not trigger production deployment'
grep -Fq 'github.event.workflow_run' "$deploy_workflow" && fail 'workflow_run state must not authorize production deployment'

for inventory_path in \
  'prisma/migrations/20260715220949_add_content_updated_at/migration.sql' \
  'supabase/migrations/20260721074302_feedback_catalog_reconciliation.sql' \
  'supabase/migrations/20260721085431_feedback_catalog_authority_hardening.sql' \
  'supabase/migrations/20260717135456_u3b_three_space_audit.sql' \
  'supabase/migrations/20260720134506_harden_audit_internal_tables_rls.sql' \
  'scripts/u3b-admin-migration/install-audit-idempotency-authority.sql' \
  'prisma/schema.prisma'; do
  require_count "$migration_runner" 1 "$inventory_path" 'OS 3.8 migration inventory'
done

require_count "$migration_runner" 1 'pg_try_advisory_lock' 'advisory migration lock'
require_count "$migration_runner" 4 "-v ON_ERROR_STOP=1 \"\$psql_url\" -f" 'transactional Supabase migrations'
require_count "$migration_runner" 1 'Prisma migration ledger is incomplete or has checksum drift' 'Prisma ledger drift guard'
require_count "$migration_runner" 1 'Supabase migration ledger authority is missing or incompatible' 'Supabase ledger drift guard'
require_count "$migration_runner" 0 "version = '202606140001'" 'historical Feedback Supabase ledger must not be required'
require_count "$migration_runner" 0 "VALUES ('202606140001'" 'historical Feedback Supabase ledger must not be fabricated'
require_count "$migration_runner" 1 'feedback-reconciliation-apply.sql' 'Feedback catalog/ledger reconciliation transaction'
require_count "$migration_runner" 1 'feedback-authority-apply.sql' 'additive Feedback authority-hardening transaction'
require_count "$migration_runner" 1 'Feedback reconciliation migration ledger/catalog binding drift detected' 'Feedback ledger/catalog binding gate'
require_count "$migration_runner" 1 'Feedback catalog binding exists without its ledger authority' 'Feedback partial-state rejection'
require_count "$migration_runner" 1 "version='20260721074302' AND name='feedback_catalog_reconciliation'" 'Feedback post-migration ledger assertion'
require_count "$migration_runner" 1 "version='20260721085431' AND name='feedback_catalog_authority_hardening'" 'Feedback authority post-migration ledger assertion'
require_count "$migration_runner" 2 "tablename='feedback'" 'Feedback policy catalog assertions'
require_count "$migration_runner" 1 "tgname='trg_feedback_updated_at'" 'Feedback trigger assertion'
require_count "$feedback_reconciliation_migration" 1 'feedback catalog column signature drift' 'Feedback source-catalog signature guard'
require_count "$feedback_reconciliation_migration" 1 'feedback reconciliation rejects unreviewed client-facing policies' 'Feedback policy drift guard'
require_count "$feedback_reconciliation_migration" 1 'REVOKE ALL PRIVILEGES ON TABLE public.feedback FROM PUBLIC, anon, authenticated;' 'Feedback server-only privilege posture'
require_count "$feedback_authority_migration" 1 'feedback canonical column/default definition drift' 'Feedback exact default guard'
require_count "$feedback_authority_migration" 1 'feedback canonical foreign-key definition drift' 'Feedback exact foreign-key guard'
require_count "$feedback_authority_migration" 1 'feedback canonical check-constraint definition drift' 'Feedback exact check guard'
require_count "$feedback_authority_migration" 1 'feedback canonical index definition drift' 'Feedback exact index guard'
require_count "$feedback_authority_migration" 1 'feedback canonical trigger definition drift' 'Feedback exact trigger guard'
require_count "$feedback_authority_migration" 1 'feedback effective client privilege drift' 'Feedback effective table/column privilege guard'
require_count "$migration_runner" 3 'feedback_catalog_state)' 'Feedback exact pre/post catalog verification'
require_count "$migration_runner" 1 'partial-index installer skipped because the Supabase migration owns the index' 'partial-index single authority'
require_count "$migration_runner" 1 'post-migration catalog assertions failed' 'catalog assertion gate'
require_count "$migration_runner" 1 'audit-table RLS migration ledger/catalog drift detected' 'audit RLS ledger/catalog gate'
require_count "$migration_runner" 1 'u3b-and-rls-apply.sql' 'fresh U3B and RLS atomic transaction'
require_count "$migration_runner" 1 'partial U3B/RLS ledger state detected before fresh installation' 'partial fresh-install ledger rejection'
require_order "$migration_runner" \
  'cat "$u3b_migration"' \
  'cat "$audit_rls_migration"' \
  'fresh U3B/RLS migration order'
require_count "$migration_runner" 2 "c.relname IN ('audit_event_outbox','audit_operational_alerts') AND c.relrowsecurity" 'audit-table RLS catalog assertions'
require_count "$migration_runner" 3 "grantee IN ('anon','authenticated')" 'audit-table direct privilege catalog assertions'
require_count "$migration_runner" 2 "tablename IN ('audit_event_outbox','audit_operational_alerts')" 'no client-facing audit policy assertions'
require_count "$migration_runner" 1 'fixture mode rejects non-local database connections' 'fixture production isolation'
require_count "$migration_runner" 1 'release marker does not match the requested release SHA' 'exact release marker binding'
require_order "$migration_runner" \
  'migrate deploy --schema' \
  'feedback_ledger_count=' \
  'Prisma/Feedback reconciliation migration order'
require_order "$migration_runner" \
  'feedback_ledger_count=' \
  'u3b_ledger_count=' \
  'Feedback/U3B migration order'
grep -Eq '(psql|prisma db execute).*partial_index_installer' "$migration_runner" && \
  fail 'partial-index installer must not be executed after the authoritative Supabase migration'
grep -Eq '(psql|prisma db execute).*install-audit-idempotency-authority\.sql' "$migration_runner" && \
  fail 'partial-index installer must not be executed after the authoritative Supabase migration'
grep -Eq '(^|[[:space:]])npx([[:space:]]|$)' "$migration_runner" && \
  fail 'production migration runner must not download Prisma through npx'

for readiness_control in \
  PRODUCTION_ENVIRONMENT \
  REQUIRED_REVIEWER \
  ENVIRONMENT_PROTECTION \
  ENVIRONMENT_VERIFICATION_ID \
  ENVIRONMENT_VERIFIED_AT \
  MIGRATION_IMAGE_REHEARSAL \
  MIGRATION_IMAGE_DIGEST \
  MIGRATION_IMAGE_REVISION; do
  require_count "$approval_validator" 2 "$readiness_control" 'immutable Production Readiness evidence control'
done
require_count "$approval_validator" 1 'rollback target is not the exact image authorized by readiness evidence' 'rollback evidence binding'
require_count "$approval_validator" 1 'Production Environment protection evidence is stale' 'environment freshness binding'

require_count "$migration_dockerfile" 1 'node:22.23.1-alpine3.23@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2' 'digest-pinned Node migration base'
require_count "$migration_dockerfile" 1 'bash=5.3.9-r1' 'pinned Bash migration runtime'
require_count "$migration_dockerfile" 1 'postgresql17-client=17.10-r0' 'pinned psql migration runtime'
require_count "$migration_dockerfile" 1 'corepack prepare pnpm@10.24.0 --activate' 'pinned pnpm migration runtime'
require_count "$migration_dockerfile" 1 'pnpm install --frozen-lockfile --prod' 'lockfile-resolved Prisma migration runtime'
require_count "$migration_dockerfile" 1 'org.opencontainers.image.revision="${RELEASE_SHA}"' 'migration OCI revision label'
require_count "$migration_dockerfile" 1 'com.nextshift.migration.prisma="6.19.3"' 'migration Prisma version label'
require_count "$migration_dockerfile" 1 'com.nextshift.migration.bash="5.3.9-r1"' 'migration Bash version label'
require_count "$migration_dockerfile" 1 'com.nextshift.migration.psql="17.10-r0"' 'migration psql version label'
require_count "$migration_dockerfile" 1 'test "$(apk info -v | grep -Fx '\''bash-5.3.9-r1'\'')" = "bash-5.3.9-r1"' 'installed Bash exact-version build assertion'
require_count "$migration_dockerfile" 1 'test "$(apk info -v | grep -Fx '\''postgresql17-client-17.10-r0'\'')" = "postgresql17-client-17.10-r0"' 'installed psql package exact-version build assertion'
require_count "$migration_dockerfile" 1 'test "$(psql --version)" = "psql (PostgreSQL) 17.10"' 'installed psql runtime build assertion'
require_count "$migration_dockerfile" 1 'ENTRYPOINT ["/usr/bin/env", "bash", "/app/scripts/deployment/run-os38-production-migrations.sh"]' 'complete migration entrypoint'

require_count "$ci_workflow" 1 '    name: Migration Image Build' 'required migration-image CI job'
require_count "$ci_workflow" 1 '    name: Application Image Healthcheck Contract' 'required final application-image CI job'
require_count "$ci_workflow" 2 'github.event.pull_request.head.sha || github.sha' 'exact PR-head image binding'
require_count "$ci_workflow" 1 '--file scripts/deployment/Dockerfile.migrations' 'CI migration image build'
require_count "$ci_workflow" 1 'scripts/deployment/validate-migration-image-runtime.sh' 'CI migration image runtime validation'
require_count "$ci_workflow" 1 '            --target production' 'CI final application image build'
require_count "$ci_workflow" 1 'scripts/deployment/validate-application-image-healthcheck.sh' 'CI final image healthcheck integration'
require_count "$ci_workflow" 2 'unset DATABASE_URL DIRECT_URL SOURCE_DB_URL SUPABASE_DB_URL PGPASSWORD' 'CI database-secret isolation'
require_count "$application_dockerfile" 1 'COPY scripts/container-healthcheck.sh /usr/local/bin/nextshift-container-healthcheck' 'final image healthcheck authority'
require_count "$application_dockerfile" 1 'HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD ["/usr/local/bin/nextshift-container-healthcheck"]' 'final image canonical Healthcheck metadata'
require_count "$application_healthcheck" 1 "CANONICAL_URL='http://127.0.0.1:3000/api/v1/health'" 'immutable container readiness target'
require_count "$application_healthcheck" 1 "CANONICAL_TIMEOUT_SECONDS='8'" 'immutable container readiness timeout'
require_count "$application_healthcheck" 0 'HEALTHCHECK_BASE_URL' 'mutable container healthcheck target rejection'
require_count "$application_healthcheck" 0 'HEALTHCHECK_TIMEOUT_SECONDS' 'mutable container healthcheck timeout rejection'
require_count "$application_image_validator" 1 'PASS: exact_head_application_image_healthcheck_contract' 'real final image healthcheck scenarios'
grep -Eq '(^|[[:space:];|&])(node|npm|npx|pnpm|python|python3|jq)([[:space:];|&]|$)' "$deploy_smoke" && \
  fail 'VPS deploy smoke must not require an unfrozen host runtime'
grep -Eq 'alpine/(edge|latest-stable)|/edge/' "$migration_dockerfile" && \
  fail 'migration runtime must not use Alpine edge repositories'

require_count "$deploy_workflow" 1 '          printf '\''%s\n'\'' "$IMAGE_TAG" > os38-release-sha.txt' 'exact release marker creation'
require_count "$deploy_workflow" 1 '-e OS38_MIGRATION_MODE=production' 'production migration mode'
require_count "$deploy_workflow" 1 '--file scripts/deployment/Dockerfile.migrations' 'immutable migration image build'
require_count "$deploy_workflow" 1 '    name: Build exact migration deployment artifact' 'single migration artifact build job'
require_count "$deploy_workflow" 1 'uses: actions/upload-artifact@v4' 'migration artifact upload'
require_count "$deploy_workflow" 1 'uses: actions/download-artifact@v4' 'migration artifact download'
require_count "$deploy_workflow" 1 '    needs: [validate-request, build-migration-artifact]' 'deploy waits for migration artifact'
require_count "$deploy_workflow" 1 'printf '\''%s\n'\'' "$migration_image_digest" > migration-image-digest.txt' 'migration image digest evidence'
require_count "$deploy_workflow" 1 'sha256sum --check migration-image.tar.gz.sha256' 'migration archive checksum verification'
require_count "$deploy_workflow" 1 'migration_tar_config="$(tar -xzOf migration-image.tar.gz manifest.json | jq -r '\''.[0].Config'\'')"' 'migration archive Config extraction'
require_count "$deploy_workflow" 1 'migration_tar_config_digest="sha256:$(tar -xzOf migration-image.tar.gz "$migration_tar_config" | sha256sum | awk '\''{print $1}'\'')"' 'migration archive Config digest calculation'
require_count "$deploy_workflow" 1 "assert_equal 'migration artifact config digest' \"\$expected_migration_digest\" \"\$migration_tar_config_digest\"" 'migration archive Config digest verification'
require_count "$deploy_workflow" 0 "assert_equal 'migration image ID' \"\$expected_migration_digest\" \"\$actual_migration_digest\"" 'cross-engine migration image ID equality is forbidden'
require_count "$deploy_workflow" 1 "assert_equal 'migration OCI revision' \"\${{ env.IMAGE_TAG }}\" \"\$migration_revision\"" 'migration image revision verification'
require_count "$deploy_workflow" 1 'com.nextshift.migration.bash" }}' 'deploy-time Bash label verification'
require_count "$deploy_workflow" 1 'docker run --rm --network none --entrypoint bash "$migration_image" -ceu' 'deploy-time migration runtime check uses Bash'
require_count "$deploy_workflow" 1 'assert_equal "migration runtime Bash package" "bash-5.3.9-r1"' 'deploy-time installed Bash verification'
grep -Eq 'node:22-alpine|apk add|npx --yes|npm install|pnpm install' "$deploy_workflow" && \
  fail 'production VPS migration runtime must not install or download tooling'
grep -Fq 'migrate deploy --schema /app/prisma/schema.prisma' "$deploy_workflow" && \
  fail 'deploy workflow must not bypass the complete migration entrypoint'
require_order "$deploy_workflow" \
  "            if ! docker run --rm \\" \
  'docker compose --env-file .env.production -f docker-compose.prod.yml up -d app' \
  'migration failure must prevent application deployment'

printf 'PASS: main CI E2E and OS 3.8 migration/deployment contracts are fail closed\n'
