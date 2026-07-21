#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
manifest="$repo_root/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
release_sha="${1:-}"
request_path='docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md'
lock_dir="$repo_root/.git/os38-final-release-review-request.lock"
tmp_dir=''
pre_head=''
commit_sha=''

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
sha256_file() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'; else shasum -a 256 "$1" | awk '{print $1}'; fi; }
control_value() { local c; c="$(grep -Ec "^$2=" "$1" || true)"; [[ "$c" == 1 ]] || fail "$2 must occur exactly once"; grep -E "^$2=" "$1" | cut -d= -f2-; }

rollback() {
  local rc=$?
  if [[ "$rc" != 0 && -n "$commit_sha" && -n "$pre_head" ]]; then
    git -C "$repo_root" update-ref "refs/heads/$(git -C "$repo_root" branch --show-current)" "$pre_head" "$commit_sha" || true
    git -C "$repo_root" restore --source="$pre_head" --staged --worktree -- docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json || true
    git -C "$repo_root" rm --cached -f --ignore-unmatch -- "$request_path" >/dev/null 2>&1 || true
    rm -f "$repo_root/$request_path"
  fi
  [[ -n "$tmp_dir" ]] && rm -rf "$tmp_dir"
  rmdir "$lock_dir" 2>/dev/null || true
  exit "$rc"
}
trap rollback EXIT

[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'release SHA must be a full lowercase Git SHA'
[[ -z "$(git -C "$repo_root" status --porcelain)" ]] || fail 'request transaction requires a clean worktree'
branch="$(git -C "$repo_root" branch --show-current)"
[[ -n "$branch" && "$branch" != main ]] || fail 'request transaction must run on a dedicated request branch'
mkdir "$lock_dir" 2>/dev/null || fail 'Final Release request transaction is already locked'

git -C "$repo_root" fetch --no-tags origin '+refs/heads/main:refs/remotes/origin/main'
pre_head="$(git -C "$repo_root" rev-parse HEAD)"
main_head="$(git -C "$repo_root" rev-parse refs/remotes/origin/main)"
status="$(jq -r '.final_release_review.status' "$manifest")"
if [[ "$status" == awaiting_review ]]; then
  "$repo_root/scripts/deployment/validate-final-release-review-request.sh" --manifest-only >/dev/null
  printf 'CLEAN_STOP: an identical Final Release Architecture Review request already exists\n'
  exit 0
fi
[[ "$pre_head" == "$main_head" ]] || fail 'request branch must start at synchronized origin/main'
[[ "$(git -C "$repo_root" rev-parse "$release_sha^{commit}" 2>/dev/null || true)" == "$release_sha" ]] || fail 'release SHA is unavailable'
git -C "$repo_root" merge-base --is-ancestor "$release_sha" "$main_head" || fail 'release SHA is not in current main history'
[[ "$status" == pending ]] || fail "Final Release review state does not permit a request: $status"
[[ "$(jq -r '.final_release_review.release_sha' "$manifest")" == "$release_sha" ]] || fail 'requested release differs from canonical release target'
[[ "$(jq -r '.release_gate.status' "$manifest")" == blocked ]] || fail 'release gate must remain blocked'

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/os38-final-release-request.XXXXXX")"
candidate_manifest="$tmp_dir/PIPELINE_MANIFEST.json"
candidate_request="$tmp_dir/REQUEST.md"
requested_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
readiness_path="$(jq -r '.release_gate.readiness_evidence' "$manifest")"
readiness_sha="$(sha256_file "$repo_root/$readiness_path")"
verification_id="$(control_value "$repo_root/$readiness_path" VERIFICATION_ID)"
rollback_sha="$(control_value "$repo_root/$readiness_path" ROLLBACK_IMAGE_SHA)"
audit_sha="$(sha256_file "$repo_root/$(jq -r '.final_audit.report' "$manifest")")"
printf '%s\n' \
  '# OS 3.8 Final Release Architecture Review Request' '' \
  'DRAFT GOVERNANCE REQUEST — NO PRODUCTION AUTHORIZATION' '' \
  'REQUEST_ID=OS3.8-FINAL-RELEASE-ARCHITECTURE-REVIEW' \
  "RELEASE_SHA=$release_sha" \
  "PRE_REQUEST_MAIN_SHA=$pre_head" \
  "REQUESTED_AT=$requested_at" \
  "PRODUCTION_READINESS_EVIDENCE=$readiness_path" \
  "PRODUCTION_READINESS_EVIDENCE_SHA256=$readiness_sha" \
  "PRODUCTION_READINESS_VERIFICATION_ID=$verification_id" \
  "FINAL_AUDIT_REPORT_SHA256=$audit_sha" \
  "ROLLBACK_IMAGE_SHA=$rollback_sha" \
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
PIPELINE_VALIDATION_ROOT="$repo_root" "$repo_root/scripts/os-pipeline/validate-manifest.sh" --manifest "$candidate_manifest" >/dev/null

# Lock-held TOCTOU revalidation immediately before the owned write set.
git -C "$repo_root" fetch --no-tags origin '+refs/heads/main:refs/remotes/origin/main'
[[ "$(git -C "$repo_root" rev-parse refs/remotes/origin/main)" == "$pre_head" ]] || fail 'main changed during request transaction'
[[ -z "$(git -C "$repo_root" status --porcelain)" ]] || fail 'worktree changed during request transaction'
cp "$candidate_manifest" "$manifest"
cp "$candidate_request" "$repo_root/$request_path"
"$repo_root/scripts/deployment/validate-final-release-review-request.sh" --manifest-only >/dev/null
git -C "$repo_root" add -- "$manifest" "$repo_root/$request_path"
[[ "$(git -C "$repo_root" diff --cached --name-only)" == $'docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json\ndocs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md' ]] || fail 'request transaction staged an unauthorized path'
git -C "$repo_root" commit -m 'docs(release): request OS 3.8 final release architecture review' >/dev/null
commit_sha="$(git -C "$repo_root" rev-parse HEAD)"
git -C "$repo_root" push -u origin "HEAD:refs/heads/$branch" >/dev/null
[[ "$(git -C "$repo_root" rev-parse "refs/remotes/origin/$branch")" == "$commit_sha" ]] || fail 'remote request branch did not reach exact request commit'
printf 'PASS: Final Release Architecture Review request committed and pushed at %s\n' "$commit_sha"
commit_sha=''
