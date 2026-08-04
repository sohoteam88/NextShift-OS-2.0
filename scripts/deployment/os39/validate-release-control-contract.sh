#!/usr/bin/env bash
# Static, non-deploying contract checks for the OS 3.9 release control plane.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
workflow="$repo_root/.github/workflows/deploy.yml"
manifest="$repo_root/docs/nextshift-os-3/os-3-9/PIPELINE_MANIFEST.json"
manifest_validator="$repo_root/scripts/os-pipeline/os39/validate-manifest.sh"
readiness_validator="$repo_root/scripts/deployment/os39/validate-production-readiness-evidence.sh"
review_validator="$repo_root/scripts/deployment/os39/validate-final-release-review-request.sh"
request_creator="$repo_root/scripts/deployment/os39/request-final-release-review.sh"
approval_validator="$repo_root/scripts/deployment/os39/validate-final-release-approval.sh"
request_validator="$repo_root/scripts/deployment/os39/validate-production-request.sh"
preflight="$repo_root/scripts/deployment/os39/preflight-migration-image.sh"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
count() { grep -Fc -- "$2" "$1" || true; }
require_count() {
  local actual
  actual="$(count "$1" "$3")"
  [[ "$actual" == "$2" ]] || fail "$4: expected $2 occurrence(s), found $actual"
}

for path in "$workflow" "$manifest" "$manifest_validator" "$readiness_validator" "$review_validator" "$request_creator" "$approval_validator" "$request_validator" "$preflight"; do
  [[ -f "$path" && ! -L "$path" ]] || fail "release-control input must be a regular file: $path"
done

pnpm exec prettier "$workflow" >/dev/null
"$manifest_validator" --manifest "$manifest" >/dev/null

require_count "$workflow" 1 '  workflow_dispatch:' 'manual-only deployment trigger'
for forbidden in '  push:' '  pull_request:' '  workflow_run:' '  schedule:'; do
  require_count "$workflow" 0 "$forbidden" 'automatic production trigger'
done
require_count "$workflow" 3 'scripts/deployment/os39/validate-production-request.sh' 'OS 3.9 production request validation'
require_count "$workflow" 1 'scripts/deployment/os39/validate-production-readiness-evidence.sh' 'OS 3.9 readiness validation'
require_count "$workflow" 0 'EXPECTED_MIGRATION_IMAGE_DIGEST' 'cross-build digest expectation forbidden'
require_count "$workflow" 0 'migration image digest preflight mismatch' 'cross-build digest comparison forbidden'
require_count "$workflow" 0 'migration artifact digest preflight' 'cross-build artifact comparison forbidden'
require_count "$workflow" 1 "printf 'MIGRATION_RUNNER_IMAGE_ID=%s\\n' \"\$migration_image_digest\"" 'runner image ID log record'
require_count "$workflow" 1 "assert_equal 'migration artifact config digest' \"\$expected_migration_digest\" \"\$migration_tar_config_digest\"" 'transport artifact digest equality'
require_count "$workflow" 1 "printf 'MIGRATION_VPS_ARTIFACT_CONFIG_DIGEST=%s\\n' \"\$migration_tar_config_digest\"" 'VPS Config digest log record'
require_count "$workflow" 0 'PENDING_STAGE_4' 'obsolete delayed-digest semantics'
require_count "$workflow" 0 'finalize-production-readiness-stage4.sh' 'obsolete Stage 4 evidence finalizer'
require_count "$workflow" 1 'ROLLBACK_IMAGE_TAG: ${{ needs.validate-request.outputs.release_sha }}' 'rollback image tag binding'
require_count "$workflow" 1 'ROLLBACK_IMAGE_ID: ${{ needs.validate-request.outputs.rollback_image_id }}' 'rollback image ID binding'
require_count "$workflow" 1 'target_image="${{ env.ROLLBACK_IMAGE_TAG }}"' 'rollback target tag'
require_count "$workflow" 1 'image_id="$(docker image inspect --format' 'rollback local image ID measurement'
require_count "$workflow" 1 'test "$image_id" = "${{ env.ROLLBACK_IMAGE_ID }}"' 'rollback local image ID equality'
require_count "$workflow" 1 'image_revision="$(docker image inspect' 'application OCI revision check only'
require_count "$workflow" 0 'appleboy/' 'third-party SSH/SCP actions are forbidden'
require_count "$workflow" 2 '169.58.116.102 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPj4eqBtG5Oyx3ulN4rwVBqnM0NL+Sx0TpWqZlp8JsYJ' 'pinned VPS host key'
require_count "$workflow" 3 'VPS_HOST: ${{ secrets.VPS_HOST }}' 'deployment host must come from the VPS_HOST secret'
require_count "$workflow" 3 'UserKnownHostsFile="$RUNNER_TEMP/known_hosts"' 'pinned known_hosts must be used for every native SSH connection'
require_count "$workflow" 3 'StrictHostKeyChecking=yes' 'native SSH host-key checking must fail closed'
require_count "$workflow" 0 'StrictHostKeyChecking=no' 'insecure SSH host-key bypass is forbidden'
require_count "$workflow" 0 'StrictHostKeyChecking=accept-new' 'TOFU SSH host-key acceptance is forbidden'
require_count "$workflow" 2 'scp -O' 'runner-native legacy SCP transport'
require_count "$workflow" 2 'printf '\''%s\n'\'' "$VPS_SSH_KEY" > "$RUNNER_TEMP/id"' 'private key must be written with a trailing newline'
require_count "$workflow" 0 'echo "$VPS_SSH_KEY"' 'private key logging is forbidden'

require_count "$readiness_validator" 0 'PENDING_STAGE_4' 'OS 3.9 readiness validator rejects deferred state'
require_count "$readiness_validator" 0 'MIGRATION_IMAGE_DIGEST' 'pre-dispatch migration image digest forbidden'
require_count "$readiness_validator" 2 'REHEARSAL_IMAGE_ID' 'engine-local rehearsal image ID required'
require_count "$readiness_validator" 1 'ENGINE_LOCAL_REHEARSAL_ONLY_NO_CROSS_BUILD_COMPARISON' 'rehearsal image ID scope required'
require_count "$request_creator" 1 '"ROLLBACK_IMAGE_TAG=$rollback_tag"' 'request binds rollback tag'
require_count "$request_creator" 1 '"ROLLBACK_IMAGE_ID=$rollback_id"' 'request binds rollback image ID'
require_count "$request_creator" 1 '"ROLLBACK_IMAGE_SCOPE=$rollback_scope"' 'request binds rollback image scope'
require_count "$request_creator" 1 'scripts/os-pipeline/os39/validate-manifest.sh' 'OS 3.9 manifest request validation'
require_count "$approval_validator" 1 'ENGINE_LOCAL_DOCKER_ID_NO_CROSS_ENGINE_COMPARISON' 'engine-local rollback ID semantics'
require_count "$approval_validator" 1 'rollback target is not the exact image tag authorized by readiness evidence' 'rollback tag authority'
require_count "$approval_validator" 2 'ROLLBACK_IMAGE_ID' 'rollback image ID evidence field'
require_count "$request_validator" 1 'scripts/deployment/os39/validate-final-release-approval.sh' 'OS 3.9 approval gate'
require_count "$request_validator" 1 "[[ \"\$control_plane_ref\" == 'refs/heads/main' ]]" 'main-only control plane'
require_count "$preflight" 1 'preflight must run from the exact release SHA checkout' 'exact release rehearsal checkout'
require_count "$preflight" 1 'validate-migration-image-runtime.sh' 'rehearsal migration runtime validation'
require_count "$preflight" 1 'REHEARSAL_IMAGE_ID_SCOPE=ENGINE_LOCAL_REHEARSAL_ONLY_NO_CROSS_BUILD_COMPARISON' 'rehearsal output scope'

printf 'PASS: OS 3.9 release control is manual-only, exact-head reviewed, transport-digest-bound, and image-tag rollback-bound\n'
