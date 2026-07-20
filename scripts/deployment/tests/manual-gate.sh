#!/usr/bin/env bash
# shellcheck disable=SC2016 # The injection fixture must remain inert literal text.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
validator="$repo_root/scripts/deployment/validate-manual-production-workflow.sh"
canonical="$repo_root/.github/workflows/deploy.yml"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/nextshift-deploy-contract.XXXXXX")"
pass_count=0

cleanup() {
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
  local target="$fixture_root/$name.yml"
  cp "$canonical" "$target"
  printf '%s\n' "$target"
}

expect_accept() {
  local name="$1"
  local fixture="$2"
  "$validator" "$fixture" >/dev/null || fail "$name should be accepted"
  pass "$name"
}

expect_reject() {
  local name="$1"
  local fixture="$2"
  if "$validator" "$fixture" >/dev/null 2>&1; then
    fail "$name should be rejected"
  fi
  pass "$name"
}

fixture="$(new_fixture canonical)"
expect_accept manual_only_deploy_and_rollback_accepted "$fixture"

fixture="$(new_fixture workflow_run)"
perl -0pi -e 's/on:\n/on:\n  workflow_run:\n    workflows: [CI]\n    types: [completed]\n/' "$fixture"
expect_reject workflow_run_trigger_rejected "$fixture"

fixture="$(new_fixture push)"
perl -0pi -e 's/on:\n/on:\n  push:\n    branches: [main]\n/' "$fixture"
expect_reject push_trigger_rejected "$fixture"

fixture="$(new_fixture pull_request)"
perl -0pi -e 's/on:\n/on:\n  pull_request:\n    branches: [main]\n/' "$fixture"
expect_reject pull_request_trigger_rejected "$fixture"

fixture="$(new_fixture schedule)"
perl -0pi -e "s/on:\n/on:\n  schedule:\n    - cron: '0 0 * * *'\n/" "$fixture"
expect_reject schedule_trigger_rejected "$fixture"

fixture="$(new_fixture deploy_confirmation)"
perl -0pi -e "s/deploy\) expected_confirmation='DEPLOY_PRODUCTION'/deploy) expected_confirmation='DEPLOY'/" "$fixture"
expect_reject deploy_without_exact_confirmation_rejected "$fixture"

fixture="$(new_fixture rollback_confirmation)"
perl -0pi -e "s/rollback\) expected_confirmation='ROLLBACK_PRODUCTION'/rollback) expected_confirmation='ROLLBACK'/" "$fixture"
expect_reject rollback_without_exact_confirmation_rejected "$fixture"

fixture="$(new_fixture malformed_sha)"
perl -0pi -e 's/\{40\}/+/' "$fixture"
expect_reject malformed_or_short_sha_guard_required "$fixture"

fixture="$(new_fixture main_membership)"
perl -0pi -e 's/^\s*git merge-base --is-ancestor.*\n//mg' "$fixture"
expect_reject release_sha_outside_origin_main_rejected "$fixture"

fixture="$(new_fixture environment)"
perl -0pi -e 's/environment: production/environment: staging/' "$fixture"
expect_reject production_environment_required "$fixture"

fixture="$(new_fixture exact_checkout)"
perl -0pi -e 's/^\s*ref: \$\{\{ needs\.validate-request\.outputs\.release_sha \}\}\n//mg' "$fixture"
expect_reject exact_release_sha_checkout_required "$fixture"

fixture="$(new_fixture ci_success)"
perl -0pi -e "s/on:\n/on:\n  workflow_run:\n    workflows: ['CI']\n    types: [completed]\n/" "$fixture"
expect_reject ci_success_cannot_trigger_production "$fixture"

fixture="$(new_fixture release_sha_required)"
perl -0pi -e 's/(release_sha:.*?required:) true/$1 false/s' "$fixture"
expect_reject release_sha_input_must_be_required "$fixture"

fixture="$(new_fixture permissions)"
perl -0pi -e 's/contents: read/contents: write/' "$fixture"
expect_reject minimum_read_only_token_permissions_required "$fixture"

fixture="$(new_fixture static_only)"
marker="$fixture_root/workflow-command-was-executed"
printf '# $(touch "%s")\n' "$marker" >> "$fixture"
expect_accept static_validation_never_executes_workflow_commands "$fixture"
[[ ! -e "$marker" ]] || fail 'static validator executed workflow content'

[[ "$pass_count" == 15 ]] || fail "expected 15 named fixtures, got $pass_count"
printf 'PASS: %s production deployment manual-gate fixtures\n' "$pass_count"
