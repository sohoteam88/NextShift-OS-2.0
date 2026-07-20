#!/usr/bin/env bash
# shellcheck disable=SC2016 # GitHub expressions and injection strings are inert fixture data.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
contract_validator="$repo_root/scripts/deployment/validate-manual-production-workflow.sh"
request_validator="$repo_root/scripts/deployment/validate-production-request.sh"
canonical_workflow="$repo_root/.github/workflows/deploy.yml"
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

new_contract_fixture() {
  local name="$1"
  local directory="$fixture_root/$name"
  mkdir -p "$directory"
  cp "$canonical_workflow" "$directory/deploy.yml"
  cp "$request_validator" "$directory/validate-production-request.sh"
  printf '%s\t%s\n' "$directory/deploy.yml" "$directory/validate-production-request.sh"
}

expect_contract_accept() {
  local name="$1"
  local workflow="$2"
  local helper="$3"
  "$contract_validator" "$workflow" "$helper" >/dev/null || fail "$name should be accepted"
  pass "$name"
}

expect_contract_reject() {
  local name="$1"
  local workflow="$2"
  local helper="$3"
  if "$contract_validator" "$workflow" "$helper" >/dev/null 2>&1; then
    fail "$name should be rejected"
  fi
  pass "$name"
}

read_fixture_paths() {
  local name="$1"
  local paths
  paths="$(new_contract_fixture "$name")"
  fixture_workflow="${paths%%$'\t'*}"
  fixture_helper="${paths#*$'\t'}"
}

setup_request_repository() {
  request_remote="$fixture_root/request-origin.git"
  request_repo="$fixture_root/request-repository"
  git init --bare --quiet "$request_remote"
  git init --quiet -b main "$request_repo"
  git -C "$request_repo" config user.name 'Pipeline Fixture'
  git -C "$request_repo" config user.email 'pipeline-fixture@example.invalid'
  printf 'initial\n' >"$request_repo/release.txt"
  git -C "$request_repo" add release.txt
  git -C "$request_repo" commit --quiet -m initial
  git -C "$request_repo" remote add origin "$request_remote"
  git -C "$request_repo" push --quiet -u origin main
  request_main_sha="$(git -C "$request_repo" rev-parse HEAD)"
}

advance_request_main() {
  local label="$1"
  printf '%s\n' "$label" >>"$request_repo/release.txt"
  git -C "$request_repo" add release.txt
  git -C "$request_repo" commit --quiet -m "$label"
  git -C "$request_repo" push --quiet origin main
  request_main_sha="$(git -C "$request_repo" rev-parse HEAD)"
}

expect_request_accept() {
  local name="$1"
  shift
  (cd "$request_repo" && "$request_validator" "$@") >/dev/null || fail "$name should be accepted"
  pass "$name"
}

expect_request_reject() {
  local name="$1"
  shift
  if (cd "$request_repo" && "$request_validator" "$@") >/dev/null 2>&1; then
    fail "$name should be rejected"
  fi
  pass "$name"
}

# Original manual-only contract coverage.
read_fixture_paths canonical
expect_contract_accept manual_only_deploy_and_rollback_accepted "$fixture_workflow" "$fixture_helper"

read_fixture_paths workflow_run
perl -0pi -e 's/on:\n/on:\n  workflow_run:\n    workflows: [CI]\n    types: [completed]\n/' "$fixture_workflow"
expect_contract_reject workflow_run_trigger_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths push
perl -0pi -e 's/on:\n/on:\n  push:\n    branches: [main]\n/' "$fixture_workflow"
expect_contract_reject push_trigger_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths pull_request
perl -0pi -e 's/on:\n/on:\n  pull_request:\n    branches: [main]\n/' "$fixture_workflow"
expect_contract_reject pull_request_trigger_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths schedule
perl -0pi -e "s/on:\n/on:\n  schedule:\n    - cron: '0 0 * * *'\n/" "$fixture_workflow"
expect_contract_reject schedule_trigger_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths deploy_confirmation
perl -0pi -e "s/DEPLOY_PRODUCTION' \}\}/DEPLOY' }}/" "$fixture_workflow"
expect_contract_reject deploy_without_exact_confirmation_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths rollback_confirmation
perl -0pi -e "s/ROLLBACK_PRODUCTION' \}\}/ROLLBACK' }}/" "$fixture_workflow"
expect_contract_reject rollback_without_exact_confirmation_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths malformed_sha
perl -0pi -e 's/\Q^[0-9a-f]{40}\E\$/^[0-9a-f]+\$/' "$fixture_helper"
expect_contract_reject malformed_or_short_sha_guard_required "$fixture_workflow" "$fixture_helper"

read_fixture_paths main_membership
perl -0pi -e 's/^git merge-base --is-ancestor.*\n//mg' "$fixture_helper"
expect_contract_reject release_sha_outside_origin_main_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths environment
perl -0pi -e 's/environment: production/environment: staging/' "$fixture_workflow"
expect_contract_reject production_environment_required "$fixture_workflow" "$fixture_helper"

read_fixture_paths exact_checkout
perl -0pi -e 's/^          ref: \$\{\{ needs\.validate-request\.outputs\.release_sha \}\}\n//mg' "$fixture_workflow"
expect_contract_reject exact_release_sha_checkout_required "$fixture_workflow" "$fixture_helper"

read_fixture_paths ci_success
perl -0pi -e "s/on:\n/on:\n  workflow_run:\n    workflows: ['CI']\n    types: [completed]\n/" "$fixture_workflow"
expect_contract_reject ci_success_cannot_trigger_production "$fixture_workflow" "$fixture_helper"

read_fixture_paths release_sha_required
perl -0pi -e 's/(release_sha:.*?required:) true/$1 false/s' "$fixture_workflow"
expect_contract_reject release_sha_input_must_be_required "$fixture_workflow" "$fixture_helper"

read_fixture_paths permissions
perl -0pi -e 's/contents: read/contents: write/' "$fixture_workflow"
expect_contract_reject minimum_read_only_token_permissions_required "$fixture_workflow" "$fixture_helper"

read_fixture_paths static_only
marker="$fixture_root/workflow-command-was-executed"
printf '# $(touch "%s")\n' "$marker" >>"$fixture_workflow"
expect_contract_accept static_validation_never_executes_workflow_commands "$fixture_workflow" "$fixture_helper"
[[ ! -e "$marker" ]] || fail 'static validator executed workflow content'

# B1: one immutable production transaction lock for every action pairing.
for fixture_name in \
  deploy_and_deploy_share_one_lock \
  rollback_and_rollback_share_one_lock \
  deploy_and_rollback_share_one_lock; do
  read_fixture_paths "$fixture_name"
  expect_contract_accept "$fixture_name" "$fixture_workflow" "$fixture_helper"
done

read_fixture_paths action_lock
perl -0pi -e 's/group: nextshift-production/group: nextshift-production-\$\{\{ inputs.action \}\}/' "$fixture_workflow"
expect_contract_reject action_derived_concurrency_group_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths cancel_lock
perl -0pi -e 's/cancel-in-progress: false/cancel-in-progress: true/' "$fixture_workflow"
expect_contract_reject cancel_in_progress_true_rejected "$fixture_workflow" "$fixture_helper"

# B2: the dispatched workflow control plane is exact, current main.
setup_request_repository
expect_request_accept main_control_plane_exact_sha_accepted \
  deploy DEPLOY_PRODUCTION "$request_main_sha" refs/heads/main "$request_main_sha"
expect_request_reject branch_dispatch_ref_rejected \
  deploy DEPLOY_PRODUCTION "$request_main_sha" refs/heads/release "$request_main_sha"
expect_request_reject tag_dispatch_ref_rejected \
  deploy DEPLOY_PRODUCTION "$request_main_sha" refs/tags/v3.8.0 "$request_main_sha"
expect_request_reject pull_request_ref_rejected \
  deploy DEPLOY_PRODUCTION "$request_main_sha" refs/pull/111/merge "$request_main_sha"
expect_request_reject malformed_control_plane_sha_rejected \
  deploy DEPLOY_PRODUCTION "$request_main_sha" refs/heads/main deadbeef

stale_control_plane_sha="$request_main_sha"
advance_request_main main-advanced
expect_request_reject stale_main_control_plane_sha_rejected \
  deploy DEPLOY_PRODUCTION "$request_main_sha" refs/heads/main "$stale_control_plane_sha"

environment_wait_sha="$request_main_sha"
(cd "$request_repo" && "$request_validator" \
  rollback ROLLBACK_PRODUCTION "$request_main_sha" refs/heads/main "$environment_wait_sha") >/dev/null || \
  fail 'control plane should be valid before environment-wait drift'
advance_request_main environment-wait-drift
expect_request_reject main_drift_after_environment_wait_rejected \
  rollback ROLLBACK_PRODUCTION "$environment_wait_sha" refs/heads/main "$environment_wait_sha"

production_marker="$fixture_root/production-job-entered"
if (cd "$request_repo" && "$request_validator" deploy DEPLOY_PRODUCTION "$request_main_sha" refs/heads/feature "$request_main_sha" && touch "$production_marker") >/dev/null 2>&1; then
  fail 'invalid control-plane request unexpectedly succeeded'
fi
[[ ! -e "$production_marker" ]] || fail 'failed control-plane validation entered production job'
pass failed_control_plane_validation_cannot_enter_production_job

# M1: build, load, and rollback all use the exact SHA and OCI revision label.
read_fixture_paths deploy_label
expect_contract_accept deploy_image_contains_exact_revision_label "$fixture_workflow" "$fixture_helper"

read_fixture_paths loaded_label
expect_contract_accept loaded_deploy_image_label_revalidated "$fixture_workflow" "$fixture_helper"

read_fixture_paths rollback_exact
expect_contract_accept rollback_uses_exact_sha_image "$fixture_workflow" "$fixture_helper"

read_fixture_paths previous_auxiliary
expect_contract_accept mutable_previous_not_authoritative "$fixture_workflow" "$fixture_helper"

read_fixture_paths rollback_missing
perl -0pi -e 's/^            docker image inspect "\$target_image".*\n//m' "$fixture_workflow"
expect_contract_reject rollback_missing_target_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths rollback_unlabelled
perl -0pi -e 's/^            test -n "\$image_revision"\n//m' "$fixture_workflow"
expect_contract_reject rollback_unlabelled_target_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths rollback_mismatch
perl -0pi -e 's/test "\$image_revision" = "\$\{\{ env\.RELEASE_SHA \}\}"/test "$image_revision" = "wrong"/' "$fixture_workflow"
expect_contract_reject rollback_mismatched_target_rejected "$fixture_workflow" "$fixture_helper"

read_fixture_paths rollback_correct
expect_contract_accept rollback_correct_exact_target_accepted "$fixture_workflow" "$fixture_helper"

# Path authority and injection regressions.
workflow_symlink="$fixture_root/workflow-symlink.yml"
ln -s "$canonical_workflow" "$workflow_symlink"
expect_contract_reject workflow_symlink_rejected "$workflow_symlink" "$request_validator"

helper_symlink="$fixture_root/helper-symlink.sh"
ln -s "$request_validator" "$helper_symlink"
expect_contract_reject fixture_symlink_rejected "$canonical_workflow" "$helper_symlink"

[[ "$pass_count" == 38 ]] || fail "expected 38 named fixtures, got $pass_count"
printf 'PASS: %s production deployment manual-gate fixtures\n' "$pass_count"
