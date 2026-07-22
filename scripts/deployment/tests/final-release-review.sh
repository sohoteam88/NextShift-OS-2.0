#!/usr/bin/env bash
# shellcheck disable=SC2016 # Quoted fixture command is intentionally evaluated by bash -c.
set -euo pipefail

source_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/os38-final-release-review.XXXXXX")"
pass_count=0
trap 'rm -rf "$fixture_root"' EXIT

pass() { pass_count=$((pass_count + 1)); printf 'PASS: %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
expect_reject() {
  local name="$1" before_head before_status before_manifest before_approval='absent'
  shift
  before_head="$(git -C "$repo" rev-parse HEAD)"; before_status="$(git -C "$repo" status --porcelain)"; before_manifest="$(sha256_file "$manifest")"
  [[ -f "${approval:-}" && ! -L "${approval:-}" ]] && before_approval="$(sha256_file "$approval")"
  if "$@" >/dev/null 2>&1; then fail "$name should reject"; fi
  [[ "$(git -C "$repo" rev-parse HEAD)" == "$before_head" && "$(git -C "$repo" status --porcelain)" == "$before_status" && "$(sha256_file "$manifest")" == "$before_manifest" ]] || fail "$name mutated repository state"
  if [[ "$before_approval" == absent ]]; then [[ ! -e "${approval:-/nonexistent}" ]] || fail "$name created an approval artifact";
  else [[ "$(sha256_file "$approval")" == "$before_approval" ]] || fail "$name changed approval evidence"; fi
  for marker in codex-invoked pr-created workflow-dispatched migration-ran deploy-ran tag-created release-created; do
    [[ ! -e "$repo/$marker" ]] || fail "$name produced forbidden side effect: $marker"
  done
  pass "$name"
}
expect_accept() { local name="$1"; shift; "$@" >/dev/null || fail "$name should pass"; pass "$name"; }
expect_reject_message() {
  local name="$1" expected="$2" output
  shift 2
  if output="$("$@" 2>&1)"; then fail "$name should reject"; fi
  grep -Fq "$expected" <<<"$output" || fail "$name rejected for the wrong reason"
  pass "$name"
}
sha256_file() { shasum -a 256 "$1" | awk '{print $1}'; }
sha256_stdin() { shasum -a 256 | awk '{print $1}'; }

copy_contract_tree() {
  local repo="$1"
  mkdir -p "$repo/scripts/deployment/tests" "$repo/scripts/os-pipeline" "$repo/docs/nextshift-os-3/os-3-8" "$repo/audit"
  cp "$source_root/scripts/deployment/validate-final-release-review-request.sh" "$repo/scripts/deployment/"
  cp "$source_root/scripts/deployment/request-final-release-review.sh" "$repo/scripts/deployment/"
  cp "$source_root/scripts/deployment/validate-final-release-approval.sh" "$repo/scripts/deployment/"
  cp "$source_root/scripts/deployment/validate-production-request.sh" "$repo/scripts/deployment/"
  cp "$source_root/scripts/os-pipeline/validate-manifest.sh" "$repo/scripts/os-pipeline/"
  cp -R "$source_root/docs/nextshift-os-3/os-3-8/." "$repo/docs/nextshift-os-3/os-3-8/"
  cp "$source_root/audit/OS38_FINAL_CODE_REVIEW_REPORT.md" "$repo/audit/"
  chmod +x "$repo/scripts/deployment/"*.sh "$repo/scripts/os-pipeline/validate-manifest.sh"
}

setup_pending_repository() {
  local name="$1"
  repo="$fixture_root/$name-repo"; remote="$fixture_root/$name-origin.git"
  git init --bare --quiet "$remote"
  git init --quiet -b main "$repo"
  git -C "$repo" config user.name 'Final Release Fixture'
  git -C "$repo" config user.email 'final-release-fixture@example.invalid'
  printf 'release\n' >"$repo/release.txt"
  git -C "$repo" add release.txt && git -C "$repo" commit --quiet -m release
  release_sha="$(git -C "$repo" rev-parse HEAD)"
  copy_contract_tree "$repo"
  manifest="$repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
  readiness="$repo/docs/nextshift-os-3/os-3-8/releases/OS38_PRODUCTION_READINESS_EVIDENCE.md"
  request_artifact="$repo/$(jq -r '.final_release_review.request_artifact' "$manifest")"
  approval="$repo/$(jq -r '.release_gate.approval_artifact' "$manifest")"
  perl -pi -e "s/^RELEASE_SHA=.*/RELEASE_SHA=$release_sha/; s/^MIGRATION_IMAGE_REVISION=.*/MIGRATION_IMAGE_REVISION=$release_sha/" "$readiness"
  jq --arg release "$release_sha" '
    .final_release_review.release_sha=$release |
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
    del(
      .final_release_review.reviewed_post_request_drift,
      .final_release_review.reviewed_post_request_remediation
    ) |
    .release_gate.status="blocked" |
    del(
      .release_gate.approval_sha256,
      .release_gate.readiness_evidence_sha256,
      .release_gate.approved_release_sha,
      .release_gate.approved_by,
      .release_gate.approved_at,
      .release_gate.review_id
    )
  ' "$manifest" >"$manifest.tmp" && mv "$manifest.tmp" "$manifest"
  rm -f "$request_artifact" "$approval"
  git -C "$repo" add scripts docs audit
  git -C "$repo" commit --quiet -m 'fixture contract baseline'
  pre_main_sha="$(git -C "$repo" rev-parse HEAD)"
  git -C "$repo" remote add origin "$remote"
  git -C "$repo" push --quiet -u origin main
  git -C "$repo" switch --quiet -c final-release-request
}

make_gh_stub() {
  gh_dir="$fixture_root/gh-bin"; gh_data="$fixture_root/gh-data"
  mkdir -p "$gh_dir" "$gh_data"
  cat >"$gh_dir/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == api ]] || exit 2
shift
[[ "${1:-}" == --paginate ]] && shift
case "$1" in
  repos/sohoteam88/NextShift-OS-2.0/pulls/42) cat "$GH_FIXTURE_DIR/pr.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/42/files) cat "$GH_FIXTURE_DIR/files.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/42/reviews) cat "$GH_FIXTURE_DIR/reviews.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/120) cat "$GH_FIXTURE_DIR/drift-pr.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/120/files) cat "$GH_FIXTURE_DIR/drift-files.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/120/reviews) cat "$GH_FIXTURE_DIR/drift-reviews.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/121) cat "$GH_FIXTURE_DIR/remediation-pr.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/121/files) cat "$GH_FIXTURE_DIR/remediation-files.json" ;;
  repos/sohoteam88/NextShift-OS-2.0/pulls/121/reviews) cat "$GH_FIXTURE_DIR/remediation-reviews.json" ;;
  *) exit 1 ;;
esac
EOF
  chmod +x "$gh_dir/gh"
}

write_review_data() {
  jq -n --arg base "$pre_main_sha" --arg head "$request_head" --arg merge "$request_merge" '{base:{ref:"main",sha:$base,repo:{full_name:"sohoteam88/NextShift-OS-2.0"}},head:{sha:$head},merged:true,merge_commit_sha:$merge}' >"$gh_data/pr.json"
  jq -n --arg request 'docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md' '[{filename:"docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"},{filename:$request}]' >"$gh_data/files.json"
  jq -n --arg head "$request_head" --arg release "$release_sha" '[{id:4242,state:"COMMENTED",commit_id:$head,submitted_at:"2026-07-21T15:00:00Z",user:{login:"sohoteam88"},author_association:"OWNER",body:("CHECKPOINT: FINAL-RELEASE\nVERDICT: PASS\nREVIEWED_RELEASE_SHA="+$release)}]' >"$gh_data/reviews.json"
}

set_review_body() {
  local body="$1"
  jq --arg body "$body" '.[0].body=$body' "$gh_data/reviews.valid.json" >"$gh_data/reviews.json"
}

run_review_validator() { (cd "$repo" && PATH="$gh_dir:$PATH" GH_FIXTURE_DIR="$gh_data" scripts/deployment/validate-final-release-review-request.sh --verify-pr "${1:-https://github.com/sohoteam88/NextShift-OS-2.0/pull/42}"); }
run_approval_validator() { (cd "$repo" && PATH="$gh_dir:$PATH" GH_FIXTURE_DIR="$gh_data" scripts/deployment/validate-final-release-approval.sh deploy "$release_sha"); }

assert_transaction_rollback() {
  local fixture_name="$1" failure_point="$2" before_head before_manifest before_index before_remote common_dir
  setup_pending_repository "$fixture_name"
  before_head="$(git -C "$repo" rev-parse HEAD)"
  before_manifest="$(sha256_file "$manifest")"
  before_index="$(git -C "$repo" write-tree)"
  before_remote="$(git -C "$repo" ls-remote --heads origin "refs/heads/final-release-request" | awk 'NR==1 {print $1}')"
  common_dir="$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)"
  if OS38_FINAL_RELEASE_TEST_MODE=1 OS38_FINAL_RELEASE_TEST_FAIL_AT="$failure_point" \
    "$repo/scripts/deployment/request-final-release-review.sh" "$release_sha" >/dev/null 2>&1; then
    fail "$fixture_name unexpectedly succeeded"
  fi
  [[ "$(git -C "$repo" rev-parse HEAD)" == "$before_head" ]] || fail "$fixture_name changed HEAD"
  [[ "$(sha256_file "$manifest")" == "$before_manifest" ]] || fail "$fixture_name changed Manifest bytes"
  [[ "$(git -C "$repo" write-tree)" == "$before_index" ]] || fail "$fixture_name changed index"
  [[ ! -e "$repo/docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md" ]] || fail "$fixture_name left request artifact"
  [[ -z "$(git -C "$repo" status --porcelain)" ]] || fail "$fixture_name left a dirty worktree"
  [[ ! -e "$common_dir/os38-final-release-review-request.lock" ]] || fail "$fixture_name left its owned lock"
  [[ "$(git -C "$repo" ls-remote --heads origin "refs/heads/final-release-request" | awk 'NR==1 {print $1}')" == "$before_remote" ]] || fail "$fixture_name changed remote request branch"
  pass "$fixture_name"
}

setup_pending_repository primary
expect_accept blocked_gate_without_approval_identity_is_valid "$repo/scripts/os-pipeline/validate-manifest.sh" --manifest "$manifest"
pass terminal_final_release_state_normalized_for_review_fixture
git -C "$repo" status --porcelain | grep -q . && fail 'pending fixture is dirty'

"$repo/scripts/deployment/request-final-release-review.sh" "$release_sha" >/dev/null
request_head="$(git -C "$repo" rev-parse HEAD)"
request_artifact="$repo/docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md"
common_dir="$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)"
[[ ! -e "$common_dir/os38-final-release-review-request.lock" ]] || fail 'successful request left its owned lock'
pass owner_releases_own_lock
[[ "$(grep -Ec '^REVIEW_ID=|^REVIEWED_SHA=|^REVIEWED_RELEASE_SHA=|^REQUEST_PR_HEAD=' "$request_artifact" || true)" == 0 ]] || fail 'request contains future review/head authority'
pass blocked_gate_can_create_review_request_without_review_id
pass review_request_cannot_contain_future_review_id
[[ "$(jq -r '.release_gate.status' "$manifest")" == blocked ]] || fail 'request unlocked release gate'
pass review_request_keeps_release_gate_blocked
[[ "$(jq -r '[.release_gate.auto_tag,.release_gate.auto_deploy,.release_gate.auto_release,.execution_policy.auto_release,.execution_policy.auto_deploy] | all(. == false)' "$manifest")" == true ]] || fail 'request enabled auto actions'
pass review_request_cannot_enable_auto_actions
expect_reject production_dispatch_rejected_while_review_awaiting "$repo/scripts/deployment/validate-final-release-approval.sh" deploy "$release_sha"

# A duplicate clean-stop is authorized only for the exact canonical release.
before_duplicate="$(git -C "$repo" rev-parse HEAD):$(sha256_file "$manifest"):$(sha256_file "$request_artifact"):$(git -C "$repo" write-tree)"
"$repo/scripts/deployment/request-final-release-review.sh" "$release_sha" | grep -q '^CLEAN_STOP:' || fail 'duplicate request did not clean-stop'
after_duplicate="$(git -C "$repo" rev-parse HEAD):$(sha256_file "$manifest"):$(sha256_file "$request_artifact"):$(git -C "$repo" write-tree)"
[[ "$before_duplicate" == "$after_duplicate" && -z "$(git -C "$repo" status --porcelain)" ]] || fail 'duplicate request mutated state'
pass duplicate_same_release_clean_stop

wrong_release='1111111111111111111111111111111111111111'
before_wrong_duplicate="$before_duplicate"
expect_reject_message duplicate_wrong_release_rejected \
  'duplicate request release differs from canonical release target' \
  "$repo/scripts/deployment/request-final-release-review.sh" "$wrong_release"
after_wrong_duplicate="$(git -C "$repo" rev-parse HEAD):$(sha256_file "$manifest"):$(sha256_file "$request_artifact"):$(git -C "$repo" write-tree)"
[[ "$before_wrong_duplicate" == "$after_wrong_duplicate" ]] || fail 'wrong-release duplicate changed HEAD, Manifest, artifact, or index'
[[ -z "$(git -C "$repo" status --porcelain)" ]] || fail 'wrong-release duplicate dirtied worktree'
[[ ! -e "$common_dir/os38-final-release-review-request.lock" ]] || fail 'wrong-release duplicate left lock'
pass duplicate_wrong_release_preserves_head_manifest_artifact_index_and_lock

# Pending also cannot authorize production dispatch.
pending_manifest="$fixture_root/pending.json"
jq '.final_release_review.status="pending" | .final_release_review.pre_request_main_sha=null | .final_release_review.requested_at=null | .final_release_review.request_artifact_sha256=null' "$manifest" >"$pending_manifest"
cp "$manifest" "$fixture_root/awaiting.json"; cp "$pending_manifest" "$manifest"
expect_reject production_dispatch_rejected_while_review_pending "$repo/scripts/deployment/validate-final-release-approval.sh" deploy "$release_sha"
cp "$fixture_root/awaiting.json" "$manifest"

# Simulate the request PR merge to main, then verify exact GitHub evidence.
git -C "$repo" switch --quiet main
git -C "$repo" merge --quiet --no-ff final-release-request -m 'merge final release request'
request_merge="$(git -C "$repo" rev-parse HEAD)"
git -C "$repo" push --quiet origin main
git -C "$repo" switch --quiet -c final-release-approval
make_gh_stub; write_review_data
expect_accept exact_merged_request_review_verified run_review_validator

cp "$gh_data/reviews.json" "$gh_data/reviews.valid.json"; cp "$gh_data/pr.json" "$gh_data/pr.valid.json"
expect_accept authorized_reviewer_accepted run_review_validator
jq '.[0].user.login="outside-reviewer"' "$gh_data/reviews.valid.json" >"$gh_data/reviews.json"
expect_reject outsider_reviewer_rejected run_review_validator
jq 'del(.[0].user)' "$gh_data/reviews.valid.json" >"$gh_data/reviews.json"
expect_reject missing_reviewer_identity_rejected run_review_validator
jq '.[0].author_association="CONTRIBUTOR"' "$gh_data/reviews.valid.json" >"$gh_data/reviews.json"
expect_reject wrong_author_association_rejected run_review_validator
jq '.[0].user.login="outside-reviewer" | .[0].transport_reviewer="sohoteam88" | .[0].body += "\nREVIEWER=sohoteam88"' "$gh_data/reviews.valid.json" >"$gh_data/reviews.json"
expect_reject transport_supplied_reviewer_cannot_override_policy run_review_validator

valid_body="CHECKPOINT: FINAL-RELEASE
VERDICT: PASS
REVIEWED_RELEASE_SHA=$release_sha"
set_review_body "$valid_body
REVIEWER=sohoteam88"
expect_reject_message authorized_reviewer_with_reviewer_control_rejected \
  'unexpected Final Release review authority control: REVIEWER' run_review_validator
set_review_body "$valid_body
APPROVER=Steven"
expect_reject_message authorized_reviewer_with_approver_control_rejected \
  'unexpected Final Release review authority control: APPROVER' run_review_validator
set_review_body "$valid_body
REVIEW_ID=4242"
expect_reject_message authorized_reviewer_with_review_id_control_rejected \
  'unexpected Final Release review authority control: REVIEW_ID' run_review_validator
set_review_body "$valid_body
REQUEST_PR_HEAD=$request_head"
expect_reject_message authorized_reviewer_with_request_pr_head_control_rejected \
  'unexpected Final Release review authority control: REQUEST_PR_HEAD' run_review_validator
set_review_body "$valid_body
REQUEST_MERGE_SHA=$request_head"
expect_reject_message authorized_reviewer_with_request_merge_sha_control_rejected \
  'unexpected Final Release review authority control: REQUEST_MERGE_SHA' run_review_validator
set_review_body "$valid_body
RELEASE_GATE=APPROVED"
expect_reject_message authorized_reviewer_with_release_gate_control_rejected \
  'unexpected Final Release review authority control: RELEASE_GATE' run_review_validator
set_review_body "$valid_body
FUTURE_AUTHORITY=forged"
expect_reject_message authorized_reviewer_with_unknown_uppercase_control_rejected \
  'unexpected Final Release review authority control: FUTURE_AUTHORITY' run_review_validator
set_review_body "Architecture Review evidence follows.

$valid_body

The authorized reviewer confirms only the exact release architecture."
expect_accept authorized_reviewer_with_valid_controls_and_prose_accepted run_review_validator
set_review_body "$valid_body
CHECKPOINT: FINAL-RELEASE"
expect_reject duplicate_checkpoint_rejected run_review_validator
set_review_body "$valid_body
CHECKPOINT: PRODUCTION-READINESS"
expect_reject conflicting_checkpoint_rejected run_review_validator
set_review_body "$valid_body
VERDICT: PASS"
expect_reject duplicate_verdict_rejected run_review_validator
set_review_body "$valid_body
VERDICT: FAIL"
expect_reject conflicting_verdict_rejected run_review_validator
set_review_body "$valid_body
REVIEWED_RELEASE_SHA=$release_sha"
expect_reject duplicate_reviewed_release_sha_rejected run_review_validator
set_review_body "$valid_body
REVIEWED_RELEASE_SHA=1111111111111111111111111111111111111111"
expect_reject mixed_correct_and_wrong_release_sha_rejected run_review_validator
set_review_body "CHECKPOINT: FINAL-RELEASE
 verdict: PASS
REVIEWED_RELEASE_SHA=$release_sha"
expect_reject malformed_authority_control_rejected run_review_validator
set_review_body "Architecture Review evidence follows.

$valid_body

No production execution is authorized by this review."
expect_accept prose_with_single_valid_control_set_accepted run_review_validator
cp "$gh_data/reviews.valid.json" "$gh_data/reviews.json"

jq --arg head "$pre_main_sha" '.[0].commit_id=$head' "$gh_data/reviews.valid.json" >"$gh_data/reviews.json"
expect_reject review_commit_not_exact_request_head_rejected run_review_validator
cp "$gh_data/reviews.valid.json" "$gh_data/reviews.json"
jq '.[0].body="CHECKPOINT: FINAL-RELEASE\nVERDICT: PASS\nREVIEWED_RELEASE_SHA=1111111111111111111111111111111111111111"' "$gh_data/reviews.json" >"$gh_data/reviews.tmp" && mv "$gh_data/reviews.tmp" "$gh_data/reviews.json"
expect_reject wrong_reviewed_release_sha_rejected run_review_validator
cp "$gh_data/reviews.valid.json" "$gh_data/reviews.json"
jq '.[0].body="CHECKPOINT: PRODUCTION-READINESS\nVERDICT: PASS\nREVIEWED_RELEASE_SHA=" + (.[0].body | capture("REVIEWED_RELEASE_SHA=(?<s>[0-9a-f]+)").s)' "$gh_data/reviews.json" >"$gh_data/reviews.tmp" && mv "$gh_data/reviews.tmp" "$gh_data/reviews.json"
expect_reject readiness_review_cannot_be_reused_as_final_release_review run_review_validator
cp "$gh_data/reviews.valid.json" "$gh_data/reviews.json"
jq '. + [.[0]]' "$gh_data/reviews.json" >"$gh_data/reviews.tmp" && mv "$gh_data/reviews.tmp" "$gh_data/reviews.json"
expect_reject duplicate_or_conflicting_pass_review_rejected run_review_validator
cp "$gh_data/reviews.valid.json" "$gh_data/reviews.json"
jq '.merged=false' "$gh_data/pr.valid.json" >"$gh_data/pr.json"
expect_reject unmerged_request_pr_rejected run_review_validator
cp "$gh_data/pr.valid.json" "$gh_data/pr.json"
jq --arg head "$pre_main_sha" '.head.sha=$head' "$gh_data/pr.json" >"$gh_data/pr.tmp" && mv "$gh_data/pr.tmp" "$gh_data/pr.json"
expect_reject wrong_request_head_rejected run_review_validator
cp "$gh_data/pr.valid.json" "$gh_data/pr.json"
expect_reject wrong_request_pr_rejected run_review_validator 'https://github.com/sohoteam88/NextShift-OS-2.0/pull/43'

# Build the later, independently reviewed approval state. Request PR identity
# comes from GitHub; only this later artifact persists it.
cp "$gh_data/reviews.valid.json" "$gh_data/reviews.json"
approval="$repo/docs/nextshift-os-3/os-3-8/approvals/STEVEN_FINAL_RELEASE_APPROVAL.md"
readiness_sha="$(sha256_file "$readiness")"; request_sha="$(sha256_file "$request_artifact")"
printf '%s\n' \
  'APPROVAL_ID=OS3.8-FINAL-RELEASE-APPROVAL' 'RELEASE_GATE=OS3.8-FINAL-RELEASE' 'DECISION=APPROVED' 'APPROVER=Steven' \
  'APPROVED_AT=2026-07-21T15:05:00Z' "RELEASE_SHA=$release_sha" \
  'REQUEST_PR_URL=https://github.com/sohoteam88/NextShift-OS-2.0/pull/42' 'REQUEST_PR_NUMBER=42' \
  "REQUEST_PR_HEAD=$request_head" "REQUEST_MERGE_SHA=$request_merge" \
  'REQUEST_ARTIFACT=docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md' \
  "REQUEST_ARTIFACT_SHA256=$request_sha" 'REVIEW_ID=4242' "REVIEW_COMMIT_ID=$request_head" "REVIEWED_RELEASE_SHA=$release_sha" \
  'PRODUCTION_READINESS_EVIDENCE=docs/nextshift-os-3/os-3-8/releases/OS38_PRODUCTION_READINESS_EVIDENCE.md' \
  "PRODUCTION_READINESS_EVIDENCE_SHA256=$readiness_sha" 'PRODUCTION_READINESS_VERIFICATION_ID=OS38-PR-20260721T142928Z' >"$approval"
approval_sha="$(sha256_file "$approval")"
jq --arg release "$release_sha" --arg head "$request_head" --arg merge "$request_merge" --arg request_sha "$request_sha" --arg approval_sha "$approval_sha" --arg readiness_sha "$readiness_sha" '
  .final_release_review.status="passed" |
  .final_release_review.request_pr_url="https://github.com/sohoteam88/NextShift-OS-2.0/pull/42" |
  .final_release_review.request_pr_number=42 |
  .final_release_review.request_pr_head=$head |
  .final_release_review.request_merge_sha=$merge |
  .final_release_review.review_id=4242 |
  .final_release_review.review_commit_id=$head |
  .final_release_review.reviewed_release_sha=$release |
  .final_release_review.reviewed_at="2026-07-21T15:00:00Z" |
  .release_gate.status="approved" |
  .release_gate.approval_sha256=$approval_sha |
  .release_gate.readiness_evidence_sha256=$readiness_sha |
  .release_gate.approved_release_sha=$release |
  .release_gate.approved_by="Steven" |
  .release_gate.approved_at="2026-07-21T15:05:00Z" |
  .release_gate.review_id=4242
' "$manifest" >"$manifest.tmp" && mv "$manifest.tmp" "$manifest"
git -C "$repo" add docs && git -C "$repo" commit --quiet -m 'fixture: approve reviewed final release'
expect_accept final_approval_with_exact_merged_request_review_accepted run_approval_validator
jq '.[0].user.login="outside-reviewer"' "$gh_data/reviews.valid.json" >"$gh_data/reviews.json"
expect_reject final_approval_revalidates_canonical_reviewer_identity run_approval_validator
cp "$gh_data/reviews.valid.json" "$gh_data/reviews.json"

cp "$gh_data/reviews.json" "$gh_data/reviews.saved.json"; printf '[]\n' >"$gh_data/reviews.json"
expect_reject final_approval_without_pass_review_rejected run_approval_validator
cp "$gh_data/reviews.saved.json" "$gh_data/reviews.json"
expect_reject approved_gate_still_requires_separate_production_execution_authorization \
  bash -c 'cd "$1" && PATH="$2:$PATH" GH_FIXTURE_DIR="$3" scripts/deployment/validate-production-request.sh deploy WRONG "$4" refs/heads/main "$5"' _ "$repo" "$gh_dir" "$gh_data" "$release_sha" "$request_merge"

# Model a reviewed, merged governance-only PR after the Final Release request.
# Its immutable evidence is persisted in a later commit so the evidence cannot
# self-authorize or self-hash its own Manifest bytes.
reviewed_drift_path='scripts/deployment/tests/final-release-review.sh'
mkdir -p "$repo/$(dirname "$reviewed_drift_path")"
printf '%s\n' '#!/usr/bin/env bash' '# exact PR 120 bytes' 'exit 0' >"$repo/$reviewed_drift_path"
chmod +x "$repo/$reviewed_drift_path"
git -C "$repo" add "$reviewed_drift_path"
git -C "$repo" commit --quiet -m 'fixture: reviewed PR 120 drift'
reviewed_drift_head="$(git -C "$repo" rev-parse HEAD)"
reviewed_drift_sha="$(sha256_file "$repo/$reviewed_drift_path")"
git -C "$repo" switch --quiet main
git -C "$repo" merge --quiet --no-ff final-release-approval -m 'merge reviewed PR 120 drift'
reviewed_drift_merge="$(git -C "$repo" rev-parse HEAD)"
git -C "$repo" push --quiet origin main
git -C "$repo" switch --quiet -c reviewed-drift-evidence

jq \
  --arg head "$reviewed_drift_head" \
  --arg merge "$reviewed_drift_merge" \
  --arg release "$release_sha" \
  --arg path "$reviewed_drift_path" \
  --arg digest "$reviewed_drift_sha" '
  .final_release_review.reviewed_post_request_drift = {
    evidence_id: "OS38-PR120-REVIEWED-POST-REQUEST-DRIFT",
    pr_url: "https://github.com/sohoteam88/NextShift-OS-2.0/pull/120",
    pr_number: 120,
    reviewed_head_sha: $head,
    merge_sha: $merge,
    review_id: 5120,
    review_commit_id: $head,
    reviewer_login: "sohoteam88",
    reviewer_author_association: "OWNER",
    verdict: "PASS",
    release_sha: $release,
    reviewed_at: "2026-07-22T06:25:27Z",
    files: [{path: $path, sha256: $digest}]
  }
' "$manifest" >"$manifest.tmp" && mv "$manifest.tmp" "$manifest"
git -C "$repo" add "$manifest"
git -C "$repo" commit --quiet -m 'fixture: persist reviewed PR 120 drift evidence'

jq -n --arg head "$reviewed_drift_head" --arg merge "$reviewed_drift_merge" \
  '{base:{ref:"main",repo:{full_name:"sohoteam88/NextShift-OS-2.0"}},head:{sha:$head,repo:{full_name:"sohoteam88/NextShift-OS-2.0"}},merged:true,merge_commit_sha:$merge}' \
  >"$gh_data/drift-pr.json"
jq -n --arg path "$reviewed_drift_path" '[
  {filename:"docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"},
  {filename:"docs/nextshift-os-3/os-3-8/approvals/STEVEN_FINAL_RELEASE_APPROVAL.md"},
  {filename:$path}
]' >"$gh_data/drift-files.json"
jq -n --arg head "$reviewed_drift_head" --arg release "$release_sha" '[{
  id:5120,
  state:"COMMENTED",
  commit_id:$head,
  submitted_at:"2026-07-22T06:25:27Z",
  user:{login:"sohoteam88"},
  author_association:"OWNER",
  body:("VERDICT: PASS\nREVIEWED_SHA: "+$head+"\nRELEASE_SHA: "+$release)
}]' >"$gh_data/drift-reviews.json"

expect_accept exact_reviewed_pr120_drift_accepted run_review_validator
[[ "$(git -C "$repo" show "$reviewed_drift_head:$reviewed_drift_path" | sha256_stdin)" == "$reviewed_drift_sha" && \
   "$(git -C "$repo" show "$reviewed_drift_merge:$reviewed_drift_path" | sha256_stdin)" == "$reviewed_drift_sha" ]] || \
  fail 'PR 120 original head/merge bytes no longer match immutable evidence'
pass pr120_original_head_digest_still_verified

cp "$manifest" "$fixture_root/reviewed-drift.valid.json"
jq '.final_release_review.reviewed_post_request_drift.files[0].sha256 = ("0" * 64)' \
  "$fixture_root/reviewed-drift.valid.json" >"$manifest"
expect_reject listed_path_hash_mismatch_rejected run_review_validator
cp "$fixture_root/reviewed-drift.valid.json" "$manifest"

jq '.final_release_review.reviewed_post_request_drift.files[0].path = "scripts/os-pipeline/tests/*"' \
  "$fixture_root/reviewed-drift.valid.json" >"$manifest"
if run_review_validator >/dev/null 2>&1; then fail 'wildcard drift allowlist unexpectedly passed'; fi
jq '.final_release_review.reviewed_post_request_drift.files[0].path = "scripts/os-pipeline/tests/"' \
  "$fixture_root/reviewed-drift.valid.json" >"$manifest"
if run_review_validator >/dev/null 2>&1; then fail 'directory drift allowlist unexpectedly passed'; fi
cp "$fixture_root/reviewed-drift.valid.json" "$manifest"
pass wildcard_and_directory_authority_rejected

# Model PR 121 replacing only the two reviewed contract files. Its Manifest
# stores exact final bytes, while exact head/merge/review identity is obtained
# from GitHub after merge so the PR does not self-reference its own commit SHA.
remediation_validator_path='scripts/deployment/validate-final-release-review-request.sh'
remediation_test_path='scripts/deployment/tests/final-release-review.sh'
printf '%s\n' '# exact PR 121 verifier bytes' >>"$repo/$remediation_validator_path"
printf '%s\n' '#!/usr/bin/env bash' '# exact PR 121 test bytes' 'exit 0' >"$repo/$remediation_test_path"
chmod +x "$repo/$remediation_validator_path" "$repo/$remediation_test_path"
remediation_validator_sha="$(sha256_file "$repo/$remediation_validator_path")"
remediation_test_sha="$(sha256_file "$repo/$remediation_test_path")"
jq \
  --arg validator_path "$remediation_validator_path" \
  --arg validator_sha "$remediation_validator_sha" \
  --arg test_path "$remediation_test_path" \
  --arg test_sha "$remediation_test_sha" '
  .final_release_review.reviewed_post_request_remediation = {
    evidence_id: "OS38-PR121-FINAL-RELEASE-DRIFT-REMEDIATION",
    pr_url: "https://github.com/sohoteam88/NextShift-OS-2.0/pull/121",
    pr_number: 121,
    files: [
      {path: $validator_path, sha256: $validator_sha},
      {path: $test_path, sha256: $test_sha}
    ]
  }
' "$manifest" >"$manifest.tmp" && mv "$manifest.tmp" "$manifest"
git -C "$repo" add "$manifest" "$remediation_validator_path" "$remediation_test_path"
git -C "$repo" commit --quiet -m 'fixture: reviewed PR 121 remediation'
remediation_head="$(git -C "$repo" rev-parse HEAD)"

git -C "$repo" switch --quiet main
git -C "$repo" merge --quiet --no-ff reviewed-drift-evidence -m 'merge reviewed PR 121 remediation'
remediation_merge="$(git -C "$repo" rev-parse HEAD)"
git -C "$repo" push --quiet origin main

jq -n --arg head "$remediation_head" --arg merge "$remediation_merge" \
  '{base:{ref:"main",repo:{full_name:"sohoteam88/NextShift-OS-2.0"}},head:{sha:$head,repo:{full_name:"sohoteam88/NextShift-OS-2.0"}},merged:true,merge_commit_sha:$merge}' \
  >"$gh_data/remediation-pr.json"
jq -n --arg validator "$remediation_validator_path" --arg test "$remediation_test_path" '[
  {filename:"docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"},
  {filename:$validator},
  {filename:$test}
]' >"$gh_data/remediation-files.json"
jq -n --arg head "$remediation_head" '[{
  id:5121,
  state:"COMMENTED",
  commit_id:$head,
  submitted_at:"2026-07-22T07:30:00Z",
  user:{login:"sohoteam88"},
  author_association:"OWNER",
  body:("VERDICT: PASS\nREVIEWED_SHA: "+$head)
}]' >"$gh_data/remediation-reviews.json"

expect_accept pr121_merged_main_self_stable run_review_validator

printf ' ' >>"$repo/$remediation_validator_path"
git -C "$repo" add "$remediation_validator_path"
git -C "$repo" commit --quiet -m 'fixture: drift PR 121 validator'
git -C "$repo" push --quiet origin main
expect_reject pr121_validator_one_byte_drift_rejected run_review_validator
git -C "$repo" show "$remediation_merge:$remediation_validator_path" >"$repo/$remediation_validator_path"
chmod +x "$repo/$remediation_validator_path"
git -C "$repo" add "$remediation_validator_path"
git -C "$repo" commit --quiet -m 'fixture: restore PR 121 validator'
git -C "$repo" push --quiet origin main

printf '%s' x >>"$repo/$remediation_test_path"
git -C "$repo" add "$remediation_test_path"
git -C "$repo" commit --quiet -m 'fixture: one-byte PR 121 test drift'
git -C "$repo" push --quiet origin main
expect_reject pr121_test_one_byte_drift_rejected run_review_validator
git -C "$repo" show "$remediation_merge:$remediation_test_path" >"$repo/$remediation_test_path"
chmod +x "$repo/$remediation_test_path"
git -C "$repo" add "$remediation_test_path"
git -C "$repo" commit --quiet -m 'fixture: restore PR 121 test'
git -C "$repo" push --quiet origin main

# Every path introduced after the reviewed evidence must be rejected. Cleanup
# commits restore the exact reviewed tree without rewriting fixture history.
mkdir -p "$repo/docs"
printf '%s\n' 'unlisted governance drift' >"$repo/docs/unlisted-post-request.md"
git -C "$repo" add docs/unlisted-post-request.md
git -C "$repo" commit --quiet -m 'fixture: unlisted post-request drift'
git -C "$repo" push --quiet origin main
expect_reject pr121_unlisted_path_rejected run_review_validator
git -C "$repo" rm --quiet docs/unlisted-post-request.md
git -C "$repo" commit --quiet -m 'fixture: remove unlisted post-request drift'
git -C "$repo" push --quiet origin main

mkdir -p "$repo/prisma/migrations/20990101000000_unreviewed"
printf '%s\n' 'SELECT 1;' >"$repo/prisma/migrations/20990101000000_unreviewed/migration.sql"
git -C "$repo" add prisma/migrations/20990101000000_unreviewed/migration.sql
git -C "$repo" commit --quiet -m 'fixture: unreviewed migration drift'
git -C "$repo" push --quiet origin main
expect_reject product_or_migration_drift_rejected run_review_validator
git -C "$repo" rm --quiet prisma/migrations/20990101000000_unreviewed/migration.sql
git -C "$repo" commit --quiet -m 'fixture: remove unreviewed migration drift'
git -C "$repo" push --quiet origin main

# Product drift after the reviewed request is rejected.
printf 'unreviewed drift\n' >"$repo/product-drift.txt"
git -C "$repo" add product-drift.txt && git -C "$repo" commit --quiet -m drift && git -C "$repo" push --quiet origin main
expect_reject stale_request_after_release_drift_rejected run_review_validator

# Every failure after the first repository-owned write restores HEAD, bytes,
# artifact state, index, worktree, remote branch and the owned common-dir lock.
assert_transaction_rollback post_write_validator_failure_rolls_back post_write_validator
pass failed_transaction_releases_owned_lock
assert_transaction_rollback git_add_failure_rolls_back git_add
assert_transaction_rollback staged_path_failure_rolls_back staged_path
assert_transaction_rollback commit_failure_rolls_back commit
assert_transaction_rollback injected_push_failure_rolls_back push
assert_transaction_rollback post_push_exact_verification_failure_rolls_back post_push

# A real receive-side push rejection has the same atomic rollback guarantee.
setup_pending_repository push-failure
cat >"$remote/hooks/pre-receive" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "$remote/hooks/pre-receive"
before_head="$(git -C "$repo" rev-parse HEAD)"; before_manifest="$(sha256_file "$manifest")"; before_index="$(git -C "$repo" write-tree)"
common_dir="$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)"
if "$repo/scripts/deployment/request-final-release-review.sh" "$release_sha" >/dev/null 2>&1; then fail 'push failure fixture unexpectedly succeeded'; fi
[[ "$(git -C "$repo" rev-parse HEAD)" == "$before_head" && "$(sha256_file "$manifest")" == "$before_manifest" ]] || fail 'push failure changed HEAD or Manifest'
[[ "$(git -C "$repo" write-tree)" == "$before_index" ]] || fail 'push failure changed index'
[[ ! -e "$repo/docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md" ]] || fail 'push failure left request artifact'
[[ -z "$(git -C "$repo" status --porcelain)" && ! -e "$common_dir/os38-final-release-review-request.lock" ]] || fail 'push failure left worktree or lock state'
pass push_failure_rolls_back

# Existing/foreign lock ownership is immutable and never auto-cleaned.
setup_pending_repository foreign-lock
common_dir="$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)"
foreign_lock="$common_dir/os38-final-release-review-request.lock"
mkdir "$foreign_lock"
printf '%s\n' 'PID=999999' 'HOST=foreign-host' 'TIMESTAMP=2026-07-22T00:00:00Z' \
  'COMMAND=request-final-release-review.sh' 'BRANCH=foreign-branch' 'TRANSACTION_ID=foreign-owner' >"$foreign_lock/owner"
foreign_lock_sha="$(sha256_file "$foreign_lock/owner")"
expect_reject foreign_lock_not_removed "$repo/scripts/deployment/request-final-release-review.sh" "$release_sha"
[[ "$(sha256_file "$foreign_lock/owner")" == "$foreign_lock_sha" ]] || fail 'foreign lock owner metadata changed'
rm -f "$foreign_lock/owner" && rmdir "$foreign_lock"

# A linked worktree uses the exact same canonical Git common-dir lock.
setup_pending_repository linked-worktree
linked_path="$fixture_root/linked-request-worktree"
git -C "$repo" worktree add --quiet -b linked-final-release "$linked_path" "$pre_main_sha"
linked_common="$(git -C "$linked_path" rev-parse --path-format=absolute --git-common-dir)"
primary_common="$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)"
[[ "$(cd "$linked_common" && pwd -P)" == "$(cd "$primary_common" && pwd -P)" ]] || fail 'linked worktree did not share Git common-dir'
"$linked_path/scripts/deployment/request-final-release-review.sh" "$release_sha" >/dev/null
[[ ! -e "$primary_common/os38-final-release-review-request.lock" ]] || fail 'linked worktree request left common-dir lock'
[[ "$(git -C "$linked_path" rev-parse HEAD)" == "$(git -C "$linked_path" ls-remote --heads origin refs/heads/linked-final-release | awk 'NR==1 {print $1}')" ]] || fail 'linked worktree request did not synchronize remote'
pass linked_worktree_request_uses_common_dir_lock

# A lock acquired through the primary checkout blocks the linked worktree too.
setup_pending_repository concurrent-worktree
linked_path="$fixture_root/concurrent-request-worktree"
git -C "$repo" worktree add --quiet -b concurrent-final-release "$linked_path" "$pre_main_sha"
common_dir="$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)"
concurrent_lock="$common_dir/os38-final-release-review-request.lock"
mkdir "$concurrent_lock"
printf '%s\n' "PID=$$" "HOST=$(hostname)" "TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  'COMMAND=request-final-release-review.sh' 'BRANCH=final-release-request' 'TRANSACTION_ID=primary-owner' >"$concurrent_lock/owner"
concurrent_lock_sha="$(sha256_file "$concurrent_lock/owner")"
if "$linked_path/scripts/deployment/request-final-release-review.sh" "$release_sha" >/dev/null 2>&1; then fail 'linked concurrent request bypassed common-dir lock'; fi
[[ "$(sha256_file "$concurrent_lock/owner")" == "$concurrent_lock_sha" ]] || fail 'concurrent request changed primary lock'
[[ -z "$(git -C "$linked_path" status --porcelain)" ]] || fail 'rejected linked request changed worktree'
pass concurrent_main_and_worktree_request_rejected
rm -f "$concurrent_lock/owner" && rmdir "$concurrent_lock"

printf 'PASS: Final Release review request contract fixtures (%d total)\n' "$pass_count"
