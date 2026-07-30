#!/usr/bin/env bash
# shellcheck disable=SC2016 # GitHub expressions and embedded shell are intentional literal contract data.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
workflow="${1:-$repo_root/.github/workflows/deploy.yml}"
request_validator="${2:-$repo_root/scripts/deployment/validate-production-request.sh}"
approval_validator="${3:-$repo_root/scripts/deployment/validate-final-release-approval.sh}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

literal_count() {
  local text="$1"
  local needle="$2"
  grep -Fc -- "$needle" <<<"$text" || true
}

require_block_count() {
  local text="$1"
  local expected="$2"
  local needle="$3"
  local label="$4"
  local actual
  actual="$(literal_count "$text" "$needle")"
  [[ "$actual" == "$expected" ]] || \
    fail "$label: expected $expected occurrence(s) of '$needle', found $actual"
}

require_order() {
  local text="$1"
  local before="$2"
  local after="$3"
  local label="$4"
  local before_line after_line
  before_line="$(grep -nF -- "$before" <<<"$text" | head -1 | cut -d: -f1 || true)"
  after_line="$(grep -nF -- "$after" <<<"$text" | head -1 | cut -d: -f1 || true)"
  [[ -n "$before_line" && -n "$after_line" && "$before_line" -lt "$after_line" ]] || \
    fail "$label: '$before' must precede '$after'"
}

extract_top_level_block() {
  local name="$1"
  awk -v header="$name:" '
    $0 == header { active = 1; print; next }
    active && /^[^[:space:]#]/ { exit }
    active { print }
  ' "$workflow"
}

extract_job_block() {
  local name="$1"
  awk -v header="  $name:" '
    $0 == header { active = 1; print; next }
    active && /^  [A-Za-z0-9_-]+:$/ { exit }
    active { print }
  ' "$workflow"
}

[[ -f "$workflow" && ! -L "$workflow" ]] || \
  fail "workflow must be a regular, non-symlink file: $workflow"
[[ -f "$request_validator" && ! -L "$request_validator" ]] || \
  fail "request validator must be a regular, non-symlink file: $request_validator"
[[ -f "$approval_validator" && ! -L "$approval_validator" ]] || \
  fail "approval validator must be a regular, non-symlink file: $approval_validator"

# Parse as YAML without writing. Neither this validator nor its fixtures execute
# GitHub Actions, Docker, SSH, Prisma, migrations, or production commands.
pnpm exec prettier "$workflow" >/dev/null

trigger_block="$(extract_top_level_block on)"
permissions_block="$(extract_top_level_block permissions)"
concurrency_block="$(extract_top_level_block concurrency)"
validate_job="$(extract_job_block validate-request)"
migration_artifact_job="$(extract_job_block build-migration-artifact)"
deploy_job="$(extract_job_block deploy)"
rollback_job="$(extract_job_block rollback)"

[[ -n "$trigger_block" && -n "$permissions_block" && -n "$concurrency_block" ]] || \
  fail 'required top-level workflow blocks are missing'
[[ -n "$validate_job" && -n "$migration_artifact_job" && -n "$deploy_job" && -n "$rollback_job" ]] || \
  fail 'validate-request, build-migration-artifact, deploy, and rollback jobs must all exist'

top_level_triggers="$(printf '%s\n' "$trigger_block" | awk '/^  [A-Za-z0-9_-]+:$/ { sub(/^  /, ""); sub(/:$/, ""); print }')"
[[ "$top_level_triggers" == 'workflow_dispatch' ]] || \
  fail 'workflow_dispatch must be the only trigger'
for forbidden_trigger in workflow_run push pull_request schedule; do
  grep -Eq "^  ${forbidden_trigger}:" <<<"$trigger_block" && \
    fail "automatic trigger is forbidden: $forbidden_trigger"
done

require_block_count "$trigger_block" 1 '  workflow_dispatch:' 'trigger contract'
for required_input in action release_sha confirmation; do
  require_block_count "$trigger_block" 1 "      ${required_input}:" 'workflow_dispatch inputs'
done
require_block_count "$trigger_block" 3 '        required: true' 'workflow_dispatch inputs'
require_block_count "$trigger_block" 1 '          - deploy' 'action choices'
require_block_count "$trigger_block" 1 '          - rollback' 'action choices'

require_block_count "$permissions_block" 1 '  contents: read' 'token permissions'
grep -Eq '^  [A-Za-z0-9_-]+: write$' <<<"$permissions_block" && \
  fail 'top-level write permission is forbidden'

require_block_count "$concurrency_block" 1 '  group: nextshift-production' 'production concurrency'
require_block_count "$concurrency_block" 1 '  cancel-in-progress: false' 'production concurrency'
grep -Fq '${{' <<<"$concurrency_block" && \
  fail 'production concurrency group must be immutable and input-independent'

require_block_count "$validate_job" 1 '      release_sha: ${{ steps.request.outputs.release_sha }}' 'validate outputs'
require_block_count "$validate_job" 1 '      control_plane_sha: ${{ steps.request.outputs.control_plane_sha }}' 'validate outputs'
require_block_count "$validate_job" 1 '          ref: ${{ github.sha }}' 'validate exact workflow checkout'
require_block_count "$validate_job" 1 '          CONTROL_PLANE_REF: ${{ github.ref }}' 'validate control-plane input'
require_block_count "$validate_job" 1 '          CONTROL_PLANE_SHA: ${{ github.sha }}' 'validate control-plane input'
require_block_count "$validate_job" 1 '          scripts/deployment/validate-production-request.sh' 'validate helper invocation'
require_block_count "$validate_job" 1 "          printf 'control_plane_sha=%s\\n' \"\$CONTROL_PLANE_SHA\" >> \"\$GITHUB_OUTPUT\"" 'control-plane output'

require_block_count "$migration_artifact_job" 1 "    if: \${{ inputs.action == 'deploy' && inputs.confirmation == 'DEPLOY_PRODUCTION' }}" 'migration artifact confirmation'
require_block_count "$migration_artifact_job" 1 '    needs: validate-request' 'migration artifact dependency'
require_block_count "$migration_artifact_job" 0 '    environment: production' 'migration artifact must not obtain production environment authority'
require_block_count "$migration_artifact_job" 1 '      IMAGE_TAG: ${{ needs.validate-request.outputs.release_sha }}' 'migration artifact release SHA'
require_block_count "$migration_artifact_job" 1 '          ref: ${{ needs.validate-request.outputs.release_sha }}' 'migration artifact exact release checkout'
require_block_count "$migration_artifact_job" 1 '--file scripts/deployment/Dockerfile.migrations' 'one migration image build'
require_block_count "$migration_artifact_job" 1 'docker save "$migration_image" | gzip -n > migration-image.tar.gz' 'migration image archive from built image'
require_block_count "$migration_artifact_job" 1 "printf '%s\\n' \"\$migration_image_digest\" > migration-image-digest.txt" 'migration image ID from built image'
require_block_count "$migration_artifact_job" 1 'sha256sum migration-image.tar.gz > migration-image.tar.gz.sha256' 'migration archive checksum creation'
require_block_count "$migration_artifact_job" 1 'uses: actions/upload-artifact@v4' 'migration artifact upload'
require_block_count "$migration_artifact_job" 1 'name: nextshift-migration-${{ env.IMAGE_TAG }}' 'migration artifact exact name'
require_block_count "$migration_artifact_job" 1 'scripts/deployment/validate-migration-image-runtime.sh "$migration_image" "$IMAGE_TAG"' 'migration artifact runtime validation'

for job_name in deploy rollback; do
  if [[ "$job_name" == deploy ]]; then
    job_block="$deploy_job"
    release_env='      IMAGE_TAG: ${{ needs.validate-request.outputs.release_sha }}'
    expected_needs='    needs: [validate-request, build-migration-artifact]'
  else
    job_block="$rollback_job"
    release_env='      RELEASE_SHA: ${{ needs.validate-request.outputs.release_sha }}'
    expected_needs='    needs: validate-request'
  fi
  require_block_count "$job_block" 1 "$expected_needs" "$job_name dependency"
  require_block_count "$job_block" 1 '    environment: production' "$job_name environment"
  require_block_count "$job_block" 1 '      CONTROL_PLANE_REF: ${{ github.ref }}' "$job_name control-plane ref"
  require_block_count "$job_block" 1 '      CONTROL_PLANE_SHA: ${{ needs.validate-request.outputs.control_plane_sha }}' "$job_name control-plane SHA"
  require_block_count "$job_block" 1 "$release_env" "$job_name release SHA"
  require_block_count "$job_block" 1 '          ref: ${{ needs.validate-request.outputs.control_plane_sha }}' "$job_name exact control-plane checkout"
  require_block_count "$job_block" 1 '          ref: ${{ needs.validate-request.outputs.release_sha }}' "$job_name exact checkout"
  require_block_count "$job_block" 1 '          scripts/deployment/validate-production-request.sh' "$job_name post-environment revalidation"
  require_block_count "$job_block" 1 'test "$(git rev-parse HEAD)" = "$CONTROL_PLANE_SHA"' "$job_name control-plane checkout verification"
  require_order "$job_block" \
    '          ref: ${{ needs.validate-request.outputs.control_plane_sha }}' \
    '          scripts/deployment/validate-production-request.sh' \
    "$job_name control-plane checkout/revalidation order"
  require_order "$job_block" \
    '          scripts/deployment/validate-production-request.sh' \
    '          ref: ${{ needs.validate-request.outputs.release_sha }}' \
    "$job_name control-plane/release checkout order"
done

require_order "$deploy_job" \
  '          ref: ${{ needs.validate-request.outputs.release_sha }}' \
  '      - name: Build exact application image' \
  'deploy release checkout/build order'
require_order "$rollback_job" \
  '          ref: ${{ needs.validate-request.outputs.release_sha }}' \
  '      - name: Rollback on VPS' \
  'rollback release checkout/production order'

require_block_count "$deploy_job" 1 "    if: \${{ inputs.action == 'deploy' && inputs.confirmation == 'DEPLOY_PRODUCTION' }}" 'deploy confirmation'
require_block_count "$rollback_job" 1 "    if: \${{ inputs.action == 'rollback' && inputs.confirmation == 'ROLLBACK_PRODUCTION' }}" 'rollback confirmation'

require_block_count "$deploy_job" 1 '--label "org.opencontainers.image.revision=$IMAGE_TAG"' 'application OCI revision label'
require_block_count "$deploy_job" 1 '--build-arg NEXT_PUBLIC_COMMIT_SHA="$IMAGE_TAG"' 'deploy build SHA'
require_block_count "$deploy_job" 1 '-t nextshift-app:$IMAGE_TAG .' 'deploy immutable image tag'
require_block_count "$deploy_job" 1 'uses: actions/download-artifact@v4' 'migration artifact download'
require_block_count "$deploy_job" 1 'name: nextshift-migration-${{ env.IMAGE_TAG }}' 'download exact migration artifact'
require_block_count "$deploy_job" 0 '--file scripts/deployment/Dockerfile.migrations' 'deploy must not rebuild migration image'
require_block_count "$deploy_job" 1 'docker run --rm --network none --entrypoint bash "$migration_image" -ceu' 'offline migration runtime check must use Bash'
require_block_count "$deploy_job" 1 "require_image 'application image after archive load' nextshift-app:\${{ env.IMAGE_TAG }}" 'loaded deploy image existence diagnostic'
require_block_count "$deploy_job" 1 "image_revision=\"\$(docker image inspect --format '{{ index .Config.Labels \"org.opencontainers.image.revision\" }}' nextshift-app:\${{ env.IMAGE_TAG }})\"" 'loaded deploy image revision'
require_block_count "$deploy_job" 1 "assert_equal 'application OCI revision' \"\${{ env.IMAGE_TAG }}\" \"\$image_revision\"" 'loaded deploy image revision diagnostic'
require_block_count "$deploy_job" 1 "migration_tar_config=\"\$(tar -xzOf migration-image.tar.gz manifest.json | jq -r '.[0].Config')\"" 'migration archive Config extraction'
require_block_count "$deploy_job" 1 "migration_tar_config_digest=\"sha256:\$(tar -xzOf migration-image.tar.gz \"\$migration_tar_config\" | sha256sum | awk '{print \$1}')\"" 'migration archive Config digest calculation'
require_block_count "$deploy_job" 1 "assert_equal 'migration artifact config digest' \"\$expected_migration_digest\" \"\$migration_tar_config_digest\"" 'migration archive Config digest verification'
require_block_count "$deploy_job" 0 "assert_equal 'migration image ID' \"\$expected_migration_digest\" \"\$actual_migration_digest\"" 'cross-engine migration image ID equality is forbidden'

require_block_count "$rollback_job" 1 'target_image="nextshift-app:${{ env.RELEASE_SHA }}"' 'rollback exact target'
require_block_count "$rollback_job" 1 'docker image inspect "$target_image" >/dev/null 2>&1' 'rollback target existence'
require_block_count "$rollback_job" 1 "image_revision=\"\$(docker image inspect --format '{{ index .Config.Labels \"org.opencontainers.image.revision\" }}' \"\$target_image\")\"" 'rollback revision label'
require_block_count "$rollback_job" 1 'test -n "$image_revision"' 'rollback labelled target'
require_block_count "$rollback_job" 1 'test "$image_revision" = "${{ env.RELEASE_SHA }}"' 'rollback revision match'
require_block_count "$rollback_job" 1 'docker tag "$target_image" nextshift-app:latest' 'rollback exact retag'
grep -Fq 'nextshift-app:previous' <<<"$rollback_job" && \
  fail 'mutable previous tag must not be authoritative for rollback'
grep -Eq 'docker build|nextshift-migrations:|run-os38-production-migrations|migrate deploy|docker run' <<<"$rollback_job" && \
  fail 'rollback must never build an image or execute a migration'

require_block_count "$(cat "$request_validator")" 1 "[[ \"\$control_plane_ref\" == 'refs/heads/main' ]]" 'main-only control plane'
require_block_count "$(cat "$request_validator")" 1 '[[ "$control_plane_sha" =~ ^[0-9a-f]{40}$ ]]' 'control-plane SHA format'
require_block_count "$(cat "$request_validator")" 1 "git fetch --no-tags origin '+refs/heads/main:refs/remotes/origin/main'" 'deterministic main fetch'
require_block_count "$(cat "$request_validator")" 1 '[[ "$current_main_sha" == "$control_plane_sha" ]]' 'control-plane freshness'
require_block_count "$(cat "$request_validator")" 1 'git merge-base --is-ancestor "$release_sha" refs/remotes/origin/main' 'release main ancestry'
require_block_count "$(cat "$request_validator")" 1 'validate-final-release-approval.sh' 'Final Release Approval gate invocation'
require_block_count "$(cat "$request_validator")" 2 "evidence_stage='stage-1-3'" 'immutable pre-dispatch evidence stage'
require_block_count "$(cat "$request_validator")" 1 '"$approval_validator" "$action" "$release_sha" "$evidence_stage"' 'stage-bound Final Release Approval invocation'
require_block_count "$permissions_block" 1 '  pull-requests: read' 'read-only Final Release review metadata permission'
require_block_count "$(cat "$workflow")" 3 'GH_TOKEN: ${{ github.token }}' 'exact-head review verifier token binding'
require_block_count "$(cat "$approval_validator")" 1 "[[ \"\$gate_status\" == 'approved' ]]" 'Manifest approved terminal release gate'
require_block_count "$(cat "$approval_validator")" 1 'validate-final-release-review-request.sh' 'Final Release exact PR review verifier invocation'
require_block_count "$(cat "$approval_validator")" 1 '"$review_validator" --verify-pr "$request_pr_url"' 'live exact-head Final Release review revalidation'
require_block_count "$(cat "$approval_validator")" 1 "[[ \"\$approved_by\" == 'Steven' ]]" 'Steven Final Release authority'
require_block_count "$(cat "$approval_validator")" 1 "[[ \"\$(control_value \"\$approval\" DECISION)\" == 'APPROVED' ]]" 'Final Release APPROVED decision'
require_block_count "$(cat "$approval_validator")" 1 'Final Release Approval artifact digest mismatch' 'approval artifact digest binding'
require_block_count "$(cat "$approval_validator")" 1 'Production Readiness evidence artifact digest mismatch' 'readiness evidence digest binding'
require_block_count "$(cat "$approval_validator")" 1 '[[ "$requested_sha" == "$rollback_image_sha" ]]' 'rollback readiness image binding'

grep -Eq 'github\.event_name|github\.event\.workflow_run|workflows:[[:space:]]*\[' "$workflow" && \
  fail 'CI or another GitHub event must not trigger production deployment'

printf 'PASS: production workflow is manual-only, serialized, main-bound, and exact-image bound\n'
