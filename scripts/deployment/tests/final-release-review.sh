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
sha256_file() { shasum -a 256 "$1" | awk '{print $1}'; }

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
    .release_gate.status="blocked" |
    .release_gate.approval_sha256=null |
    .release_gate.readiness_evidence_sha256=null |
    .release_gate.approved_release_sha=null |
    .release_gate.approved_by=null |
    .release_gate.approved_at=null |
    .release_gate.review_id=null
  ' "$manifest" >"$manifest.tmp" && mv "$manifest.tmp" "$manifest"
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
  *) exit 1 ;;
esac
EOF
  chmod +x "$gh_dir/gh"
}

write_review_data() {
  jq -n --arg base "$pre_main_sha" --arg head "$request_head" --arg merge "$request_merge" '{base:{ref:"main",sha:$base,repo:{full_name:"sohoteam88/NextShift-OS-2.0"}},head:{sha:$head},merged:true,merge_commit_sha:$merge}' >"$gh_data/pr.json"
  jq -n --arg request 'docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md' '[{filename:"docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"},{filename:$request}]' >"$gh_data/files.json"
  jq -n --arg head "$request_head" --arg release "$release_sha" '[{id:4242,state:"COMMENTED",commit_id:$head,submitted_at:"2026-07-21T15:00:00Z",body:("CHECKPOINT: FINAL-RELEASE\nVERDICT: PASS\nREVIEWED_RELEASE_SHA="+$release)}]' >"$gh_data/reviews.json"
}

run_review_validator() { (cd "$repo" && PATH="$gh_dir:$PATH" GH_FIXTURE_DIR="$gh_data" scripts/deployment/validate-final-release-review-request.sh --verify-pr "${1:-https://github.com/sohoteam88/NextShift-OS-2.0/pull/42}"); }
run_approval_validator() { (cd "$repo" && PATH="$gh_dir:$PATH" GH_FIXTURE_DIR="$gh_data" scripts/deployment/validate-final-release-approval.sh deploy "$release_sha"); }

setup_pending_repository primary
expect_accept blocked_gate_without_approval_identity_is_valid "$repo/scripts/os-pipeline/validate-manifest.sh" --manifest "$manifest"
git -C "$repo" status --porcelain | grep -q . && fail 'pending fixture is dirty'

"$repo/scripts/deployment/request-final-release-review.sh" "$release_sha" >/dev/null
request_head="$(git -C "$repo" rev-parse HEAD)"
request_artifact="$repo/docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md"
[[ "$(grep -Ec '^REVIEW_ID=|^REVIEWED_SHA=|^REVIEWED_RELEASE_SHA=|^REQUEST_PR_HEAD=' "$request_artifact" || true)" == 0 ]] || fail 'request contains future review/head authority'
pass blocked_gate_can_create_review_request_without_review_id
pass review_request_cannot_contain_future_review_id
[[ "$(jq -r '.release_gate.status' "$manifest")" == blocked ]] || fail 'request unlocked release gate'
pass review_request_keeps_release_gate_blocked
[[ "$(jq -r '[.release_gate.auto_tag,.release_gate.auto_deploy,.release_gate.auto_release,.execution_policy.auto_release,.execution_policy.auto_deploy] | all(. == false)' "$manifest")" == true ]] || fail 'request enabled auto actions'
pass review_request_cannot_enable_auto_actions
expect_reject production_dispatch_rejected_while_review_awaiting "$repo/scripts/deployment/validate-final-release-approval.sh" deploy "$release_sha"

# Duplicate invocation is a clean stop with no new commit or mutation.
before_duplicate="$(git -C "$repo" rev-parse HEAD):$(sha256_file "$manifest"):$(sha256_file "$request_artifact")"
"$repo/scripts/deployment/request-final-release-review.sh" "$release_sha" | grep -q '^CLEAN_STOP:' || fail 'duplicate request did not clean-stop'
after_duplicate="$(git -C "$repo" rev-parse HEAD):$(sha256_file "$manifest"):$(sha256_file "$request_artifact")"
[[ "$before_duplicate" == "$after_duplicate" && -z "$(git -C "$repo" status --porcelain)" ]] || fail 'duplicate request mutated state'
pass duplicate_request_clean_stop_or_fail_closed

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

cp "$gh_data/reviews.json" "$gh_data/reviews.saved.json"; printf '[]\n' >"$gh_data/reviews.json"
expect_reject final_approval_without_pass_review_rejected run_approval_validator
cp "$gh_data/reviews.saved.json" "$gh_data/reviews.json"
expect_reject approved_gate_still_requires_separate_production_execution_authorization \
  bash -c 'cd "$1" && PATH="$2:$PATH" GH_FIXTURE_DIR="$3" scripts/deployment/validate-production-request.sh deploy WRONG "$4" refs/heads/main "$5"' _ "$repo" "$gh_dir" "$gh_data" "$release_sha" "$request_merge"

# Product drift after the reviewed request is rejected.
git -C "$repo" switch --quiet main
printf 'unreviewed drift\n' >"$repo/product-drift.txt"
git -C "$repo" add product-drift.txt && git -C "$repo" commit --quiet -m drift && git -C "$repo" push --quiet origin main
git -C "$repo" switch --quiet final-release-approval
expect_reject stale_request_after_release_drift_rejected run_review_validator

# A remote push failure rolls the owned transaction back byte-for-byte.
setup_pending_repository push-failure
cat >"$remote/hooks/pre-receive" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "$remote/hooks/pre-receive"
before_head="$(git -C "$repo" rev-parse HEAD)"; before_manifest="$(sha256_file "$manifest")"
if "$repo/scripts/deployment/request-final-release-review.sh" "$release_sha" >/dev/null 2>&1; then fail 'push failure fixture unexpectedly succeeded'; fi
[[ "$(git -C "$repo" rev-parse HEAD)" == "$before_head" && "$(sha256_file "$manifest")" == "$before_manifest" ]] || fail 'push failure changed HEAD or Manifest'
[[ ! -e "$repo/docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md" ]] || fail 'push failure left request artifact'
[[ -z "$(git -C "$repo" status --porcelain)" && ! -e "$repo/.git/os38-final-release-review-request.lock" ]] || fail 'push failure left worktree or lock state'
pass request_push_failure_rolls_back_without_manifest_drift

printf 'PASS: Final Release review request contract fixtures (%d total; 20 required named fixtures plus exact merged evidence)\n' "$pass_count"
