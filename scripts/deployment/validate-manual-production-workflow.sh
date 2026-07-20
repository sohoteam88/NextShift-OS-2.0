#!/usr/bin/env bash
# shellcheck disable=SC2016 # GitHub expressions and shell snippets are intentional literal test data.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
workflow="${1:-$repo_root/.github/workflows/deploy.yml}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_literal() {
  local needle="$1"
  grep -Fq -- "$needle" "$workflow" || fail "missing required workflow contract: $needle"
}

require_count() {
  local expected="$1"
  local needle="$2"
  local actual
  actual="$(grep -Fc -- "$needle" "$workflow" || true)"
  [[ "$actual" == "$expected" ]] || fail "expected $expected occurrence(s) of '$needle', found $actual"
}

[[ -f "$workflow" && ! -L "$workflow" ]] || fail "workflow must be a regular, non-symlink file: $workflow"

# Prettier parses the workflow as YAML without writing it. This validator never
# invokes GitHub Actions, SSH, a migration, or any deployment command.
pnpm exec prettier "$workflow" >/dev/null

trigger_block="$(awk '
  /^on:$/ { active = 1; next }
  active && /^[^[:space:]#]/ { exit }
  active { print }
' "$workflow")"

top_level_triggers="$(printf '%s\n' "$trigger_block" | awk '/^  [A-Za-z0-9_-]+:$/ { sub(/^  /, ""); sub(/:$/, ""); print }')"
[[ "$top_level_triggers" == 'workflow_dispatch' ]] || fail "workflow_dispatch must be the only trigger"

for forbidden_trigger in workflow_run push pull_request schedule; do
  if grep -Eq "^  ${forbidden_trigger}:" <<<"$trigger_block"; then
    fail "automatic trigger is forbidden: $forbidden_trigger"
  fi
done

require_count 1 '  workflow_dispatch:'
for required_input in action release_sha confirmation; do
  input_count="$(grep -Fc -- "      ${required_input}:" <<<"$trigger_block" || true)"
  [[ "$input_count" == 1 ]] || fail "workflow_dispatch input must appear exactly once: $required_input"
done
required_input_count="$(grep -Fc -- '        required: true' <<<"$trigger_block" || true)"
[[ "$required_input_count" == 3 ]] || fail 'all three workflow_dispatch inputs must be required'
require_literal "          - deploy"
require_literal "          - rollback"
require_literal "  contents: read"
if grep -Eq '^  [A-Za-z0-9_-]+: write$' "$workflow"; then
  fail 'top-level write permission is forbidden'
fi

require_literal "deploy) expected_confirmation='DEPLOY_PRODUCTION' ;;"
require_literal "rollback) expected_confirmation='ROLLBACK_PRODUCTION' ;;"
require_literal "if: \${{ inputs.action == 'deploy' && inputs.confirmation == 'DEPLOY_PRODUCTION' }}"
require_literal "if: \${{ inputs.action == 'rollback' && inputs.confirmation == 'ROLLBACK_PRODUCTION' }}"
require_literal 'if [[ ! "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]; then'
require_literal 'resolved_sha="$(git rev-parse "$RELEASE_SHA^{commit}")"'
require_count 3 'git fetch --no-tags origin main'
require_count 3 'git merge-base --is-ancestor'

require_count 2 '    environment: production'
require_count 2 '          ref: ${{ needs.validate-request.outputs.release_sha }}'
require_literal 'IMAGE_TAG: ${{ needs.validate-request.outputs.release_sha }}'
require_literal 'test "$(git rev-parse HEAD)" = "$IMAGE_TAG"'
require_literal '--build-arg NEXT_PUBLIC_COMMIT_SHA="$IMAGE_TAG"'
require_literal '-t nextshift-app:$IMAGE_TAG .'
require_literal 'docker image inspect nextshift-app:${{ env.IMAGE_TAG }} >/dev/null'
require_literal 'docker tag nextshift-app:${{ env.IMAGE_TAG }} nextshift-app:latest'
require_literal 'test "$(git rev-parse HEAD)" = "$RELEASE_SHA"'

if grep -Eq 'github\.event_name|github\.event\.workflow_run|workflows:[[:space:]]*\[' "$workflow"; then
  fail 'CI or another GitHub event must not be able to trigger production deployment'
fi

printf 'PASS: production deployment workflow is manual-only and exact-SHA bound\n'
