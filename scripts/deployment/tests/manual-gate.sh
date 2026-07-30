#!/usr/bin/env bash
# shellcheck disable=SC2016 # GitHub expressions and injection strings are inert fixture data.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
contract_validator="$repo_root/scripts/deployment/validate-manual-production-workflow.sh"
request_validator="$repo_root/scripts/deployment/validate-production-request.sh"
approval_validator="$repo_root/scripts/deployment/validate-final-release-approval.sh"
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
  local validator_output
  if ! validator_output="$("$contract_validator" "$workflow" "$helper" 2>&1)"; then
    printf '%s\n' "$validator_output" >&2
    fail "$name should be accepted"
  fi
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
  local name="${1:-control-plane}"
  request_remote="$fixture_root/${name}-origin.git"
  request_repo="$fixture_root/${name}-repository"
  git init --bare --quiet "$request_remote"
  git init --quiet -b main "$request_repo"
  git -C "$request_repo" config user.name 'Pipeline Fixture'
  git -C "$request_repo" config user.email 'pipeline-fixture@example.invalid'
  printf 'initial\n' >"$request_repo/release.txt"
  git -C "$request_repo" add release.txt
  git -C "$request_repo" commit --quiet -m initial
  request_rollback_sha="$(git -C "$request_repo" rev-parse HEAD)"
  printf 'approved release\n' >>"$request_repo/release.txt"
  git -C "$request_repo" add release.txt
  git -C "$request_repo" commit --quiet -m 'approved release'
  request_release_sha="$(git -C "$request_repo" rev-parse HEAD)"
  git -C "$request_repo" remote add origin "$request_remote"
  mkdir -p \
    "$request_repo/scripts/deployment" \
    "$request_repo/scripts/os-pipeline" \
    "$request_repo/docs/nextshift-os-3/os-3-8" \
    "$request_repo/audit"
  cp "$repo_root/scripts/deployment/validate-production-request.sh" "$request_repo/scripts/deployment/validate-production-request.sh"
  cp "$approval_validator" "$request_repo/scripts/deployment/validate-final-release-approval.sh"
  cp "$repo_root/scripts/deployment/validate-production-readiness-evidence.sh" "$request_repo/scripts/deployment/validate-production-readiness-evidence.sh"
  cp "$repo_root/scripts/deployment/validate-final-release-review-request.sh" "$request_repo/scripts/deployment/validate-final-release-review-request.sh"
  cp "$repo_root/scripts/os-pipeline/validate-manifest.sh" "$request_repo/scripts/os-pipeline/validate-manifest.sh"
  cp "$repo_root/audit/OS38_FINAL_CODE_REVIEW_REPORT.md" "$request_repo/audit/OS38_FINAL_CODE_REVIEW_REPORT.md"
  chmod +x \
    "$request_repo/scripts/deployment/validate-production-request.sh" \
    "$request_repo/scripts/deployment/validate-final-release-approval.sh" \
    "$request_repo/scripts/deployment/validate-production-readiness-evidence.sh" \
    "$request_repo/scripts/deployment/validate-final-release-review-request.sh" \
    "$request_repo/scripts/os-pipeline/validate-manifest.sh"
  cp -R "$repo_root/docs/nextshift-os-3/os-3-8/." \
    "$request_repo/docs/nextshift-os-3/os-3-8/"
  mkdir -p \
    "$request_repo/docs/nextshift-os-3/os-3-8/approvals" \
    "$request_repo/docs/nextshift-os-3/os-3-8/releases"
  request_evidence="$request_repo/docs/nextshift-os-3/os-3-8/releases/OS38_PRODUCTION_READINESS_EVIDENCE.md"
  request_approval="$request_repo/docs/nextshift-os-3/os-3-8/approvals/STEVEN_FINAL_RELEASE_APPROVAL.md"
  printf '%s\n' \
    'EVIDENCE_ID=OS3.8-PRODUCTION-READINESS' \
    'STATUS=READY' \
    "RELEASE_SHA=$request_release_sha" \
    'VERIFICATION_ID=OS38-PR-20260720T120000Z' \
    'VERIFIED_AT=2026-07-20T12:00:00Z' \
    'MIGRATION_REHEARSAL=PENDING_STAGE_4' \
    'MIGRATION_IMAGE_REHEARSAL=PENDING_STAGE_4' \
    'MIGRATION_IMAGE_DIGEST=PENDING_STAGE_4' \
    "MIGRATION_IMAGE_REVISION=$request_release_sha" \
    'BACKUP_SHA256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RESTORE_VERIFIED_AT=2026-07-20T11:30:00Z' \
    "ROLLBACK_IMAGE_SHA=$request_rollback_sha" \
    'PRODUCTION_ENVIRONMENT=production' \
    'REQUIRED_REVIEWER=Steven' \
    'ENVIRONMENT_PROTECTION=PASS' \
    'ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260720T120000Z' >"$request_evidence"
  request_verified_at="$(grep -E '^VERIFIED_AT=' "$request_evidence" | cut -d= -f2-)"
  printf 'ENVIRONMENT_VERIFIED_AT=%s\n' "$request_verified_at" >>"$request_evidence"
  request_evidence_sha="$(shasum -a 256 "$request_evidence" | awk '{print $1}')"
  request_manifest="$request_repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
  jq --arg release_sha "$request_release_sha" '
    .final_release_review.release_sha=$release_sha |
    .final_release_review.status="pending" |
    .final_release_review.pre_request_main_sha=null |
    .final_release_review.requested_at=null |
    .final_release_review.request_artifact_sha256=null |
    .final_release_review.request_pr_url=null |
    .final_release_review.request_pr_number=null |
    .final_release_review.request_pr_head=null |
    .final_release_review.request_merge_sha=null |
    .final_release_review.review_id=null |
    .final_release_review.review_commit_id=null |
    .final_release_review.reviewed_release_sha=null |
    .final_release_review.reviewed_at=null
  ' "$request_manifest" >"$request_manifest.tmp"
  mv "$request_manifest.tmp" "$request_manifest"
  git -C "$request_repo" add scripts docs audit
  git -C "$request_repo" commit --quiet -m 'fixture: Final Release contract baseline'
  request_pre_main_sha="$(git -C "$request_repo" rev-parse HEAD)"

  request_artifact="$request_repo/docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md"
  request_audit_sha="$(shasum -a 256 "$request_repo/audit/OS38_FINAL_CODE_REVIEW_REPORT.md" | awk '{print $1}')"
  printf '%s\n' \
    'REQUEST_ID=OS3.8-FINAL-RELEASE-ARCHITECTURE-REVIEW' \
    "RELEASE_SHA=$request_release_sha" \
    "PRE_REQUEST_MAIN_SHA=$request_pre_main_sha" \
    'REQUESTED_AT=2026-07-20T12:01:00Z' \
    'PRODUCTION_READINESS_EVIDENCE=docs/nextshift-os-3/os-3-8/releases/OS38_PRODUCTION_READINESS_EVIDENCE.md' \
    "PRODUCTION_READINESS_EVIDENCE_SHA256=$request_evidence_sha" \
    'PRODUCTION_READINESS_VERIFICATION_ID=OS38-PR-20260720T120000Z' \
    "FINAL_AUDIT_REPORT_SHA256=$request_audit_sha" \
    "ROLLBACK_IMAGE_SHA=$request_rollback_sha" \
    'RELEASE_GATE=BLOCKED' >"$request_artifact"
  request_artifact_sha="$(shasum -a 256 "$request_artifact" | awk '{print $1}')"
  jq --arg pre "$request_pre_main_sha" --arg digest "$request_artifact_sha" '
    .final_release_review.status="awaiting_review" |
    .final_release_review.pre_request_main_sha=$pre |
    .final_release_review.requested_at="2026-07-20T12:01:00Z" |
    .final_release_review.request_artifact_sha256=$digest
  ' "$request_manifest" >"$request_manifest.tmp"
  mv "$request_manifest.tmp" "$request_manifest"
  git -C "$request_repo" add docs
  git -C "$request_repo" commit --quiet -m 'fixture: request Final Release review'
  request_pr_head="$(git -C "$request_repo" rev-parse HEAD)"
  request_merge_sha="$request_pr_head"

  printf '%s\n' \
    'APPROVAL_ID=OS3.8-FINAL-RELEASE-APPROVAL' \
    'RELEASE_GATE=OS3.8-FINAL-RELEASE' \
    'DECISION=APPROVED' \
    'APPROVER=Steven' \
    'APPROVED_AT=2026-07-20T12:05:00Z' \
    "RELEASE_SHA=$request_release_sha" \
    'REQUEST_PR_URL=https://github.com/sohoteam88/NextShift-OS-2.0/pull/42' \
    'REQUEST_PR_NUMBER=42' \
    "REQUEST_PR_HEAD=$request_pr_head" \
    "REQUEST_MERGE_SHA=$request_merge_sha" \
    'REQUEST_ARTIFACT=docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md' \
    "REQUEST_ARTIFACT_SHA256=$request_artifact_sha" \
    'REVIEW_ID=123456789' \
    "REVIEW_COMMIT_ID=$request_pr_head" \
    "REVIEWED_RELEASE_SHA=$request_release_sha" \
    'PRODUCTION_READINESS_EVIDENCE=docs/nextshift-os-3/os-3-8/releases/OS38_PRODUCTION_READINESS_EVIDENCE.md' \
    "PRODUCTION_READINESS_EVIDENCE_SHA256=$request_evidence_sha" \
    'PRODUCTION_READINESS_VERIFICATION_ID=OS38-PR-20260720T120000Z' >"$request_approval"
  request_approval_sha="$(shasum -a 256 "$request_approval" | awk '{print $1}')"
  jq \
    --arg release_sha "$request_release_sha" \
    --arg request_head "$request_pr_head" \
    --arg merge_sha "$request_merge_sha" \
    --arg approval_sha "$request_approval_sha" \
    --arg evidence_sha "$request_evidence_sha" '
      .final_release_review.status="passed" |
      .final_release_review.request_pr_url="https://github.com/sohoteam88/NextShift-OS-2.0/pull/42" |
      .final_release_review.request_pr_number=42 |
      .final_release_review.request_pr_head=$request_head |
      .final_release_review.request_merge_sha=$merge_sha |
      .final_release_review.review_id=123456789 |
      .final_release_review.review_commit_id=$request_head |
      .final_release_review.reviewed_release_sha=$release_sha |
      .final_release_review.reviewed_at="2026-07-20T12:03:00Z" |
      .release_gate.id="OS3.8-FINAL-RELEASE" |
      .release_gate.status="approved" |
      .release_gate.approval_artifact="docs/nextshift-os-3/os-3-8/approvals/STEVEN_FINAL_RELEASE_APPROVAL.md" |
      .release_gate.approval_sha256=$approval_sha |
      .release_gate.readiness_evidence="docs/nextshift-os-3/os-3-8/releases/OS38_PRODUCTION_READINESS_EVIDENCE.md" |
      .release_gate.readiness_evidence_sha256=$evidence_sha |
      .release_gate.approved_release_sha=$release_sha |
      .release_gate.approved_by="Steven" |
      .release_gate.approved_at="2026-07-20T12:05:00Z" |
      .release_gate.review_id=123456789
    ' "$request_manifest" >"$request_manifest.tmp"
  mv "$request_manifest.tmp" "$request_manifest"
  git -C "$request_repo" add docs
  git -C "$request_repo" commit --quiet -m 'fixture: approve exact release'
  git -C "$request_repo" push --quiet -u origin main
  request_main_sha="$(git -C "$request_repo" rev-parse HEAD)"
  request_validator="$request_repo/scripts/deployment/validate-production-request.sh"
  request_gh_bin="$fixture_root/${name}-gh-bin"
  request_gh_data="$fixture_root/${name}-gh-data"
  mkdir -p "$request_gh_bin" "$request_gh_data"
  cat >"$request_gh_bin/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == api ]] || exit 2
shift
[[ "${1:-}" == --paginate ]] && shift
case "$1" in
  repos/sohoteam88/NextShift-OS-2.0/pulls/42) cat "$GH_FIXTURE_DIR/pr.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/42/files) cat "$GH_FIXTURE_DIR/files.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/42/reviews) cat "$GH_FIXTURE_DIR/reviews.json" ;;
  *) exit 1 ;;
esac
EOF
  chmod +x "$request_gh_bin/gh"
  jq -n --arg base "$request_pre_main_sha" --arg head "$request_pr_head" --arg merge "$request_merge_sha" \
    '{base:{ref:"main",sha:$base,repo:{full_name:"sohoteam88/NextShift-OS-2.0"}},head:{sha:$head},merged:true,merge_commit_sha:$merge}' >"$request_gh_data/pr.json"
  jq -n '[{filename:"docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"},{filename:"docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md"}]' >"$request_gh_data/files.json"
  jq -n --arg head "$request_pr_head" --arg release "$request_release_sha" \
    '[{id:123456789,state:"COMMENTED",commit_id:$head,submitted_at:"2026-07-20T12:03:00Z",user:{login:"sohoteam88"},author_association:"OWNER",body:("CHECKPOINT: FINAL-RELEASE\nVERDICT: PASS\nREVIEWED_RELEASE_SHA="+$release)}]' >"$request_gh_data/reviews.json"
}

commit_request_fixture() {
  local message="$1"
  git -C "$request_repo" add -A
  git -C "$request_repo" commit --quiet -m "$message"
  git -C "$request_repo" push --quiet origin main
  request_main_sha="$(git -C "$request_repo" rev-parse HEAD)"
}

refresh_request_approval_digest() {
  request_approval_sha="$(shasum -a 256 "$request_approval" | awk '{print $1}')"
  jq --arg approval_sha "$request_approval_sha" \
    '.release_gate.approval_sha256=$approval_sha' "$request_manifest" >"$request_manifest.tmp"
  mv "$request_manifest.tmp" "$request_manifest"
}

refresh_request_evidence_and_approval_digests() {
  request_evidence_sha="$(shasum -a 256 "$request_evidence" | awk '{print $1}')"
  perl -pi -e "s/^PRODUCTION_READINESS_EVIDENCE_SHA256=.*/PRODUCTION_READINESS_EVIDENCE_SHA256=$request_evidence_sha/" \
    "$request_approval"
  jq --arg evidence_sha "$request_evidence_sha" \
    '.release_gate.readiness_evidence_sha256=$evidence_sha' "$request_manifest" >"$request_manifest.tmp"
  mv "$request_manifest.tmp" "$request_manifest"
  refresh_request_approval_digest
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
  (cd "$request_repo" && PATH="$request_gh_bin:$PATH" GH_FIXTURE_DIR="$request_gh_data" "$request_validator" "$@") >/dev/null || fail "$name should be accepted"
  pass "$name"
}

expect_request_reject() {
  local name="$1"
  shift
  if (cd "$request_repo" && PATH="$request_gh_bin:$PATH" GH_FIXTURE_DIR="$request_gh_data" "$request_validator" "$@") >/dev/null 2>&1; then
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
setup_request_repository control-plane
expect_request_accept main_control_plane_exact_sha_accepted \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"
expect_request_reject branch_dispatch_ref_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/release "$request_main_sha"
expect_request_reject tag_dispatch_ref_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/tags/v3.8.0 "$request_main_sha"
expect_request_reject pull_request_ref_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/pull/111/merge "$request_main_sha"
expect_request_reject malformed_control_plane_sha_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main deadbeef

stale_control_plane_sha="$request_main_sha"
advance_request_main main-advanced
expect_request_reject stale_main_control_plane_sha_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$stale_control_plane_sha"

setup_request_repository environment-wait
environment_wait_sha="$request_main_sha"
(cd "$request_repo" && PATH="$request_gh_bin:$PATH" GH_FIXTURE_DIR="$request_gh_data" "$request_validator" \
  rollback ROLLBACK_PRODUCTION "$request_rollback_sha" refs/heads/main "$environment_wait_sha") >/dev/null || \
  fail 'control plane should be valid before environment-wait drift'
advance_request_main environment-wait-drift
expect_request_reject main_drift_after_environment_wait_rejected \
  rollback ROLLBACK_PRODUCTION "$request_rollback_sha" refs/heads/main "$environment_wait_sha"

production_marker="$fixture_root/production-job-entered"
if (cd "$request_repo" && "$request_validator" deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/feature "$request_main_sha" && touch "$production_marker") >/dev/null 2>&1; then
  fail 'invalid control-plane request unexpectedly succeeded'
fi
[[ ! -e "$production_marker" ]] || fail 'failed control-plane validation entered production job'
pass failed_control_plane_validation_cannot_enter_production_job

# Executable Final Release gate. Every negative case uses an isolated Git
# repository and proves the request validator fails before any production step.
setup_request_repository blocked-gate
jq '
  .final_release_review.status="pending" |
  .final_release_review.pre_request_main_sha=null |
  .final_release_review.requested_at=null |
  .final_release_review.request_artifact_sha256=null |
  .final_release_review.request_pr_url=null |
  .final_release_review.request_pr_number=null |
  .final_release_review.request_pr_head=null |
  .final_release_review.request_merge_sha=null |
  .final_release_review.review_id=null |
  .final_release_review.review_commit_id=null |
  .final_release_review.reviewed_release_sha=null |
  .final_release_review.reviewed_at=null |
  .release_gate.status="blocked" |
  .release_gate.approval_sha256=null |
  .release_gate.readiness_evidence_sha256=null |
  .release_gate.approved_release_sha=null |
  .release_gate.approved_by=null |
  .release_gate.approved_at=null |
  .release_gate.review_id=null
' "$request_manifest" >"$request_manifest.tmp"
mv "$request_manifest.tmp" "$request_manifest"
commit_request_fixture 'fixture: block release gate'
expect_request_reject blocked_release_gate_rejected_before_build \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository missing-approval
rm "$request_approval"
commit_request_fixture 'fixture: remove approval'
expect_request_reject missing_release_approval_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository stale-approval
jq '.release_gate.approved_release_sha="1111111111111111111111111111111111111111"' \
  "$request_manifest" >"$request_manifest.tmp"
mv "$request_manifest.tmp" "$request_manifest"
commit_request_fixture 'fixture: stale approval state'
expect_request_reject stale_release_approval_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository mismatched-release
perl -pi -e 's/^RELEASE_SHA=.*/RELEASE_SHA=2222222222222222222222222222222222222222/' "$request_approval"
refresh_request_approval_digest
commit_request_fixture 'fixture: mismatch approval release SHA'
expect_request_reject mismatched_release_sha_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository duplicate-authority
printf '%s\n' 'DECISION=APPROVED' >>"$request_approval"
refresh_request_approval_digest
commit_request_fixture 'fixture: duplicate approval authority'
expect_request_reject duplicate_release_authority_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository symlink-approval
rm "$request_approval"
ln -s ../releases/OS38_PRODUCTION_READINESS_EVIDENCE.md "$request_approval"
jq --arg approval_sha "$(shasum -a 256 "$request_approval" | awk '{print $1}')" \
  '.release_gate.approval_sha256=$approval_sha' "$request_manifest" >"$request_manifest.tmp"
mv "$request_manifest.tmp" "$request_manifest"
commit_request_fixture 'fixture: symlink approval artifact'
expect_request_reject symlink_release_approval_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository no-production-side-effects
jq '
  .final_release_review.status="pending" |
  .final_release_review.pre_request_main_sha=null |
  .final_release_review.requested_at=null |
  .final_release_review.request_artifact_sha256=null |
  .final_release_review.request_pr_url=null |
  .final_release_review.request_pr_number=null |
  .final_release_review.request_pr_head=null |
  .final_release_review.request_merge_sha=null |
  .final_release_review.review_id=null |
  .final_release_review.review_commit_id=null |
  .final_release_review.reviewed_release_sha=null |
  .final_release_review.reviewed_at=null |
  .release_gate.status="blocked" |
  .release_gate.approval_sha256=null |
  .release_gate.readiness_evidence_sha256=null |
  .release_gate.approved_release_sha=null |
  .release_gate.approved_by=null |
  .release_gate.approved_at=null |
  .release_gate.review_id=null
' "$request_manifest" >"$request_manifest.tmp"
mv "$request_manifest.tmp" "$request_manifest"
commit_request_fixture 'fixture: block all production side effects'
for effect in build scp ssh migration; do
  rm -f "$fixture_root/$effect-entered"
done
if (cd "$request_repo" && "$request_validator" \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha" && \
  touch "$fixture_root/build-entered" "$fixture_root/scp-entered" "$fixture_root/ssh-entered" "$fixture_root/migration-entered") >/dev/null 2>&1; then
  fail 'blocked Final Release gate unexpectedly entered production operations'
fi
for effect in build scp ssh migration; do
  [[ ! -e "$fixture_root/$effect-entered" ]] || fail "blocked gate entered $effect"
done
pass no_build_scp_ssh_or_migration_without_approval

# Round 2 B1: approval remains bound to the approved release while rollback is
# restricted to the exact rollback image frozen in readiness evidence.
setup_request_repository rollback-approved
expect_request_accept approved_release_can_rollback_to_evidenced_exact_image \
  rollback ROLLBACK_PRODUCTION "$request_rollback_sha" refs/heads/main "$request_main_sha"
[[ "$(grep '^RELEASE_SHA=' "$request_approval")" == "RELEASE_SHA=$request_release_sha" ]] || \
  fail 'rollback fixture rebound Final Release Approval to the old release'
pass rollback_does_not_require_approval_rebound_to_old_release
expect_request_reject rollback_target_not_in_readiness_evidence_rejected \
  rollback ROLLBACK_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

read_fixture_paths rollback_migration
perl -0pi -e 's/(      - name: Rollback on VPS)/      - name: Build migration image\n        run: docker build -t nextshift-migrations:test .\n$1/' "$fixture_workflow"
expect_contract_reject rollback_never_builds_or_runs_migration "$fixture_workflow" "$fixture_helper"

# Round 2 M2: READY evidence must freeze the protected production Environment
# and its required reviewer in the same immutable, digest-bound artifact.
setup_request_repository missing-environment
perl -ni -e 'print unless /^PRODUCTION_ENVIRONMENT=/' "$request_evidence"
refresh_request_evidence_and_approval_digests
commit_request_fixture 'fixture: remove production environment evidence'
expect_request_reject missing_production_environment_evidence_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository missing-reviewer
perl -ni -e 'print unless /^REQUIRED_REVIEWER=/' "$request_evidence"
refresh_request_evidence_and_approval_digests
commit_request_fixture 'fixture: remove environment reviewer evidence'
expect_request_reject missing_required_reviewer_evidence_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository wrong-environment
perl -pi -e 's/^PRODUCTION_ENVIRONMENT=.*/PRODUCTION_ENVIRONMENT=staging/' "$request_evidence"
refresh_request_evidence_and_approval_digests
commit_request_fixture 'fixture: wrong production environment name'
expect_request_reject wrong_environment_name_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository stale-environment
perl -pi -e 's/^ENVIRONMENT_VERIFIED_AT=.*/ENVIRONMENT_VERIFIED_AT=2026-07-19T12:00:00Z/' "$request_evidence"
refresh_request_evidence_and_approval_digests
commit_request_fixture 'fixture: stale environment protection evidence'
expect_request_reject stale_environment_protection_evidence_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

setup_request_repository duplicate-environment
printf '%s\n' 'ENVIRONMENT_PROTECTION=PASS' >>"$request_evidence"
refresh_request_evidence_and_approval_digests
commit_request_fixture 'fixture: duplicate environment protection authority'
expect_request_reject duplicate_environment_protection_evidence_rejected \
  deploy DEPLOY_PRODUCTION "$request_release_sha" refs/heads/main "$request_main_sha"

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

[[ "$pass_count" == 54 ]] || fail "expected 54 named fixtures, got $pass_count"
printf 'PASS: %s production deployment manual-gate fixtures\n' "$pass_count"
