#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
manifest_rel='docs/nextshift-os-3/os-3-9/PIPELINE_MANIFEST.json'
manifest="$repo_root/$manifest_rel"
release_sha="${1:-}"
request_path='docs/nextshift-os-3/os-3-9/releases/OS39_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md'
lock_dir=''
lock_owner_file=''
lock_owner_sha=''
lock_owned=0
tmp_dir=''
pre_head=''
branch=''
commit_sha=''
write_started=0
push_completed=0
remote_branch_existed=0
pre_remote_branch_sha=''

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
sha256_file() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'; else shasum -a 256 "$1" | awk '{print $1}'; fi; }
control_value() { local c; c="$(grep -Ec "^$2=" "$1" || true)"; [[ "$c" == 1 ]] || fail "$2 must occur exactly once"; grep -E "^$2=" "$1" | cut -d= -f2-; }
test_fail_at() {
  [[ "${OS39_FINAL_RELEASE_TEST_MODE:-0}" == 1 && "${OS39_FINAL_RELEASE_TEST_FAIL_AT:-}" == "$1" ]] || return 0
  fail "injected Final Release request transaction failure at $1"
}

rollback() {
  local rc=$?
  trap - EXIT
  set +e
  if [[ "$rc" != 0 && "$write_started" == 1 && -n "$pre_head" && -n "$branch" ]]; then
    if [[ "$push_completed" == 1 && -n "$commit_sha" ]]; then
      remote_now="$(git -C "$repo_root" ls-remote --heads origin "refs/heads/$branch" 2>/dev/null | awk 'NR==1 {print $1}')"
      if [[ "$remote_now" == "$commit_sha" ]]; then
        if [[ "$remote_branch_existed" == 1 ]]; then
          git -C "$repo_root" push --force-with-lease="refs/heads/$branch:$commit_sha" origin \
            "$pre_remote_branch_sha:refs/heads/$branch" >/dev/null 2>&1 || true
        else
          git -C "$repo_root" push --force-with-lease="refs/heads/$branch:$commit_sha" origin \
            ":refs/heads/$branch" >/dev/null 2>&1 || true
        fi
      fi
    fi
    current_branch_sha="$(git -C "$repo_root" rev-parse "refs/heads/$branch" 2>/dev/null || true)"
    if [[ -n "$commit_sha" && "$current_branch_sha" == "$commit_sha" ]]; then
      git -C "$repo_root" update-ref "refs/heads/$branch" "$pre_head" "$commit_sha" || true
    fi
    git -C "$repo_root" restore --source="$pre_head" --staged --worktree -- "$manifest_rel" || true
    if git -C "$repo_root" cat-file -e "$pre_head:$request_path" 2>/dev/null; then
      git -C "$repo_root" restore --source="$pre_head" --staged --worktree -- "$request_path" || true
    else
      git -C "$repo_root" rm --cached -f --ignore-unmatch -- "$request_path" >/dev/null 2>&1 || true
      rm -f "$repo_root/$request_path"
    fi
  fi
  [[ -n "$tmp_dir" ]] && rm -rf "$tmp_dir"
  if [[ "$lock_owned" == 1 && -f "$lock_owner_file" && ! -L "$lock_owner_file" && \
        "$(sha256_file "$lock_owner_file" 2>/dev/null)" == "$lock_owner_sha" ]]; then
    rm -f "$lock_owner_file"
    rmdir "$lock_dir" 2>/dev/null || true
  fi
  exit "$rc"
}
trap rollback EXIT

[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'release SHA must be a full lowercase Git SHA'
[[ -z "$(git -C "$repo_root" status --porcelain)" ]] || fail 'request transaction requires a clean worktree'
branch="$(git -C "$repo_root" branch --show-current)"
[[ -n "$branch" && "$branch" != main ]] || fail 'request transaction must run on a dedicated request branch'
git_common_dir="$(git -C "$repo_root" rev-parse --path-format=absolute --git-common-dir)"
git_common_dir="$(cd "$git_common_dir" && pwd -P)"
lock_dir="$git_common_dir/os39-final-release-review-request.lock"
lock_owner_file="$lock_dir/owner"
mkdir "$lock_dir" 2>/dev/null || fail 'Final Release request transaction is already locked'
lock_owned=1
owner_timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
owner_host="$(hostname)"
owner_token="$$:$owner_host:$owner_timestamp:$branch:${RANDOM:-0}"
printf '%s\n' \
  "PID=$$" \
  "HOST=$owner_host" \
  "TIMESTAMP=$owner_timestamp" \
  'COMMAND=request-final-release-review.sh' \
  "BRANCH=$branch" \
  "TRANSACTION_ID=$owner_token" >"$lock_owner_file"
chmod 600 "$lock_owner_file"
lock_owner_sha="$(sha256_file "$lock_owner_file")"

git -C "$repo_root" fetch --no-tags origin '+refs/heads/main:refs/remotes/origin/main'
pre_head="$(git -C "$repo_root" rev-parse HEAD)"
main_head="$(git -C "$repo_root" rev-parse refs/remotes/origin/main)"
status="$(jq -r '.final_release_review.status' "$manifest")"
if [[ "$status" == awaiting_review ]]; then
  canonical_release_sha="$(jq -r '.final_release_review.release_sha' "$manifest")"
  [[ "$release_sha" == "$canonical_release_sha" ]] || fail 'duplicate request release differs from canonical release target'
  "$repo_root/scripts/deployment/os39/validate-final-release-review-request.sh" --manifest-only >/dev/null
  existing_request="$repo_root/$(jq -r '.final_release_review.request_artifact' "$manifest")"
  [[ "$(control_value "$existing_request" RELEASE_SHA)" == "$release_sha" ]] || fail 'existing request artifact release SHA mismatch'
  printf 'CLEAN_STOP: an identical Final Release Architecture Review request already exists\n'
  exit 0
fi
[[ "$pre_head" == "$main_head" ]] || fail 'request branch must start at synchronized origin/main'
[[ "$(git -C "$repo_root" rev-parse "$release_sha^{commit}" 2>/dev/null || true)" == "$release_sha" ]] || fail 'release SHA is unavailable'
git -C "$repo_root" merge-base --is-ancestor "$release_sha" "$main_head" || fail 'release SHA is not in current main history'
[[ "$status" == pending ]] || fail "Final Release review state does not permit a request: $status"
[[ "$(jq -r '.final_release_review.release_sha' "$manifest")" == "$release_sha" ]] || fail 'requested release differs from canonical release target'
[[ "$(jq -r '.release_gate.status' "$manifest")" == blocked ]] || fail 'release gate must remain blocked'
[[ ! -e "$repo_root/$request_path" && ! -L "$repo_root/$request_path" ]] || fail 'pending request artifact path already exists'

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/os39-final-release-request.XXXXXX")"
cp "$manifest" "$tmp_dir/original-manifest.json"
original_manifest_sha="$(sha256_file "$tmp_dir/original-manifest.json")"
candidate_manifest="$tmp_dir/PIPELINE_MANIFEST.json"
candidate_request="$tmp_dir/REQUEST.md"
requested_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
readiness_path="$(jq -r '.release_gate.readiness_evidence' "$manifest")"
readiness_evidence_validator="$repo_root/scripts/deployment/os39/validate-production-readiness-evidence.sh"
[[ -f "$readiness_evidence_validator" && ! -L "$readiness_evidence_validator" && -x "$readiness_evidence_validator" ]] || \
  fail 'Production Readiness evidence stage validator is unavailable or unsafe'
"$readiness_evidence_validator" stage-1-3 "$repo_root/$readiness_path" >/dev/null
readiness_sha="$(sha256_file "$repo_root/$readiness_path")"
verification_id="$(control_value "$repo_root/$readiness_path" VERIFICATION_ID)"
rollback_tag="$(control_value "$repo_root/$readiness_path" ROLLBACK_IMAGE_TAG)"
rollback_id="$(control_value "$repo_root/$readiness_path" ROLLBACK_IMAGE_ID)"
rollback_scope="$(control_value "$repo_root/$readiness_path" ROLLBACK_IMAGE_SCOPE)"
audit_sha="$(sha256_file "$repo_root/$(jq -r '.final_audit.report' "$manifest")")"
printf '%s\n' \
  '# OS 3.8 Final Release Architecture Review Request' '' \
  'DRAFT GOVERNANCE REQUEST — NO PRODUCTION AUTHORIZATION' '' \
  'REQUEST_ID=OS3.9-FINAL-RELEASE-ARCHITECTURE-REVIEW' \
  "RELEASE_SHA=$release_sha" \
  "PRE_REQUEST_MAIN_SHA=$pre_head" \
  "REQUESTED_AT=$requested_at" \
  "PRODUCTION_READINESS_EVIDENCE=$readiness_path" \
  "PRODUCTION_READINESS_EVIDENCE_SHA256=$readiness_sha" \
  "PRODUCTION_READINESS_VERIFICATION_ID=$verification_id" \
  "FINAL_AUDIT_REPORT_SHA256=$audit_sha" \
  "ROLLBACK_IMAGE_TAG=$rollback_tag" \
  "ROLLBACK_IMAGE_ID=$rollback_id" \
  "ROLLBACK_IMAGE_SCOPE=$rollback_scope" \
  'RELEASE_GATE=BLOCKED' '' \
  'The exact request head is authoritative only from GitHub PR metadata and the exact-head Architecture Review.' \
  'This request does not approve migration, deployment, rollback, tag, release, or production access.' >"$candidate_request"
request_sha="$(sha256_file "$candidate_request")"
jq --arg pre "$pre_head" --arg at "$requested_at" --arg digest "$request_sha" '
  .final_release_review.status="awaiting_review" |
  .final_release_review.pre_request_main_sha=$pre |
  .final_release_review.requested_at=$at |
  .final_release_review.request_artifact_sha256=$digest
' "$manifest" >"$candidate_manifest"
PIPELINE_VALIDATION_ROOT="$repo_root" "$repo_root/scripts/os-pipeline/os39/validate-manifest.sh" --manifest "$candidate_manifest" >/dev/null

# Lock-held TOCTOU revalidation immediately before the owned write set.
git -C "$repo_root" fetch --no-tags origin '+refs/heads/main:refs/remotes/origin/main'
[[ "$(git -C "$repo_root" rev-parse refs/remotes/origin/main)" == "$pre_head" ]] || fail 'main changed during request transaction'
[[ -z "$(git -C "$repo_root" status --porcelain)" ]] || fail 'worktree changed during request transaction'
remote_branch_line="$(git -C "$repo_root" ls-remote --heads origin "refs/heads/$branch")"
if [[ -n "$remote_branch_line" ]]; then
  remote_branch_existed=1
  pre_remote_branch_sha="$(awk 'NR==1 {print $1}' <<<"$remote_branch_line")"
fi
write_started=1
cp "$candidate_manifest" "$manifest"
cp "$candidate_request" "$repo_root/$request_path"
test_fail_at post_write_validator
"$repo_root/scripts/deployment/os39/validate-final-release-review-request.sh" --manifest-only >/dev/null
git -C "$repo_root" add -- "$manifest" "$repo_root/$request_path"
test_fail_at git_add
test_fail_at staged_path
[[ "$(git -C "$repo_root" diff --cached --name-only)" == $'docs/nextshift-os-3/os-3-9/PIPELINE_MANIFEST.json\ndocs/nextshift-os-3/os-3-9/releases/OS39_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md' ]] || fail 'request transaction staged an unauthorized path'
test_fail_at commit
git -C "$repo_root" commit -m 'docs(release): request OS 3.8 final release architecture review' >/dev/null
commit_sha="$(git -C "$repo_root" rev-parse HEAD)"
test_fail_at push
git -C "$repo_root" push -u origin "HEAD:refs/heads/$branch" >/dev/null
push_completed=1
test_fail_at post_push
[[ "$(git -C "$repo_root" ls-remote --heads origin "refs/heads/$branch" | awk 'NR==1 {print $1}')" == "$commit_sha" ]] || \
  fail 'remote request branch did not reach exact request commit'
[[ "$(sha256_file "$manifest")" != "$original_manifest_sha" ]] || fail 'request transaction did not persist its candidate Manifest'
printf 'PASS: Final Release Architecture Review request committed and pushed at %s\n' "$commit_sha"
