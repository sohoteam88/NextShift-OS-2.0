#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
action="${1:-}"
requested_target="${2:-}"
evidence_stage="${3:-}"
manifest="$repo_root/docs/nextshift-os-3/os-3-9/PIPELINE_MANIFEST.json"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

sha256_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print $1}'
  else
    shasum -a 256 "$path" | awk '{print $1}'
  fi
}

safe_relative_path() {
  local path="$1" component
  [[ -n "$path" && "$path" != /* && "$path" != -* && "$path" != *$'\n'* && "$path" != *$'\r'* ]] || return 1
  [[ ! "$path" =~ [[:cntrl:]] ]] || return 1
  IFS='/' read -r -a components <<<"$path"
  for component in "${components[@]}"; do
    [[ -n "$component" && "$component" != '.' && "$component" != '..' ]] || return 1
  done
}

require_regular_repository_file() {
  local relative_path="$1" label="$2" absolute_path parent_path
  safe_relative_path "$relative_path" || fail "$label path is not a safe repository-relative path"
  absolute_path="$repo_root/$relative_path"
  [[ -f "$absolute_path" && ! -L "$absolute_path" ]] || fail "$label must be a regular, non-symlink file"
  parent_path="$(cd "$(dirname "$absolute_path")" && pwd -P)"
  [[ "$parent_path" == "$repo_root" || "$parent_path" == "$repo_root/"* ]] || fail "$label escapes the repository"
  [[ "$(git -C "$repo_root" ls-tree -r --format='%(objectmode) %(path)' HEAD -- "$relative_path")" == "100644 $relative_path" ]] || \
    fail "$label must be a regular file in the exact control-plane Git tree"
}

control_value() {
  local file="$1" key="$2" count
  count="$(grep -Ec "^${key}=" "$file" || true)"
  [[ "$count" == 1 ]] || fail "$key must occur exactly once"
  grep -E "^${key}=" "$file" | cut -d= -f2-
}

reject_unknown_controls() {
  local file="$1" allowed="$2" line key
  while IFS= read -r line; do
    [[ "$line" =~ ^([A-Z][A-Z0-9_]*)= ]] || continue
    key="${BASH_REMATCH[1]}"
    grep -Fqx "$key" <<<"$allowed" || fail "unexpected authority control field: $key"
  done <"$file"
}

case "$action" in
  deploy | rollback) ;;
  *) fail "unsupported production action: $action" ;;
esac
[[ "$evidence_stage" == 'stage-1-3' ]] || \
  fail 'Final Release Approval must validate its immutable Stage 1-3 readiness evidence'
case "$action" in
  deploy) [[ "$requested_target" =~ ^[0-9a-f]{40}$ ]] || fail 'deploy target must be a full lowercase 40-character Git SHA' ;;
  rollback) [[ "$requested_target" =~ ^nextshift-app:[a-z0-9][a-z0-9._-]{0,127}$ ]] || fail 'rollback target must be a canonical nextshift-app tag' ;;
esac
[[ -f "$manifest" && ! -L "$manifest" ]] || fail 'canonical Pipeline Manifest must be a regular, non-symlink file'
"$repo_root/scripts/os-pipeline/os39/validate-manifest.sh" --manifest "$manifest" >/dev/null

gate_id="$(jq -r '.release_gate.id' "$manifest")"
gate_status="$(jq -r '.release_gate.status' "$manifest")"
approval_path="$(jq -r '.release_gate.approval_artifact' "$manifest")"
approval_sha="$(jq -r '.release_gate.approval_sha256 // empty' "$manifest")"
evidence_path="$(jq -r '.release_gate.readiness_evidence' "$manifest")"
evidence_sha="$(jq -r '.release_gate.readiness_evidence_sha256 // empty' "$manifest")"
approved_release_sha="$(jq -r '.release_gate.approved_release_sha // empty' "$manifest")"
approved_by="$(jq -r '.release_gate.approved_by // empty' "$manifest")"
approved_at="$(jq -r '.release_gate.approved_at // empty' "$manifest")"
review_id="$(jq -r '.release_gate.review_id // empty' "$manifest")"
review_status="$(jq -r '.final_release_review.status' "$manifest")"
request_pr_url="$(jq -r '.final_release_review.request_pr_url // empty' "$manifest")"
request_pr_number="$(jq -r '.final_release_review.request_pr_number // empty' "$manifest")"
request_pr_head="$(jq -r '.final_release_review.request_pr_head // empty' "$manifest")"
request_merge_sha="$(jq -r '.final_release_review.request_merge_sha // empty' "$manifest")"
request_artifact="$(jq -r '.final_release_review.request_artifact' "$manifest")"
request_artifact_sha="$(jq -r '.final_release_review.request_artifact_sha256 // empty' "$manifest")"
review_commit_id="$(jq -r '.final_release_review.review_commit_id // empty' "$manifest")"
reviewed_release_sha="$(jq -r '.final_release_review.reviewed_release_sha // empty' "$manifest")"

[[ "$gate_id" == 'OS3.9-FINAL-RELEASE' ]] || fail 'unexpected Final Release gate identity'
[[ "$gate_status" == 'approved' ]] || fail 'canonical Final Release gate is not approved'
[[ "$review_status" == 'passed' ]] || fail 'Final Release Architecture Review has not passed'
[[ "$approved_release_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'Manifest approved release SHA is invalid'
[[ "$(git -C "$repo_root" rev-parse "$approved_release_sha^{commit}" 2>/dev/null || true)" == "$approved_release_sha" ]] || \
  fail 'Manifest approved release SHA does not resolve exactly'
git -C "$repo_root" merge-base --is-ancestor "$approved_release_sha" refs/remotes/origin/main || \
  fail 'Manifest approved release SHA is not contained in origin/main'
[[ "$approved_by" == 'Steven' ]] || fail 'Manifest Final Release approver must be Steven'
[[ "$approved_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'Manifest Final Release approval timestamp is invalid'
[[ "$review_id" =~ ^[1-9][0-9]*$ ]] || fail 'Manifest Final Release review identity is invalid'
[[ "$request_pr_number" =~ ^[1-9][0-9]*$ && "$request_pr_head" =~ ^[0-9a-f]{40}$ && "$request_merge_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'Manifest request PR identity is invalid'
[[ "$review_commit_id" == "$request_pr_head" && "$reviewed_release_sha" == "$approved_release_sha" ]] || fail 'Manifest exact-head Final Release review binding is invalid'
[[ "$approval_sha" =~ ^[0-9a-f]{64}$ && "$evidence_sha" =~ ^[0-9a-f]{64}$ ]] || fail 'Manifest Final Release evidence digests are invalid'
[[ "$request_artifact_sha" =~ ^[0-9a-f]{64}$ ]] || fail 'Manifest request artifact digest is invalid'

review_validator="$repo_root/scripts/deployment/os39/validate-final-release-review-request.sh"
[[ -f "$review_validator" && ! -L "$review_validator" && -x "$review_validator" ]] || fail 'Final Release review verifier is unavailable or unsafe'
"$review_validator" --verify-pr "$request_pr_url" >/dev/null

require_regular_repository_file "$approval_path" 'Final Release Approval artifact'
require_regular_repository_file "$evidence_path" 'Production Readiness evidence artifact'
approval="$repo_root/$approval_path"
evidence="$repo_root/$evidence_path"
[[ "$(sha256_file "$approval")" == "$approval_sha" ]] || fail 'Final Release Approval artifact digest mismatch'
[[ "$(sha256_file "$evidence")" == "$evidence_sha" ]] || fail 'Production Readiness evidence artifact digest mismatch'

approval_fields=$'APPROVAL_ID\nRELEASE_GATE\nDECISION\nAPPROVER\nAPPROVED_AT\nRELEASE_SHA\nREQUEST_PR_URL\nREQUEST_PR_NUMBER\nREQUEST_PR_HEAD\nREQUEST_MERGE_SHA\nREQUEST_ARTIFACT\nREQUEST_ARTIFACT_SHA256\nREVIEW_ID\nREVIEW_COMMIT_ID\nREVIEWED_RELEASE_SHA\nPRODUCTION_READINESS_EVIDENCE\nPRODUCTION_READINESS_EVIDENCE_SHA256\nPRODUCTION_READINESS_VERIFICATION_ID'
reject_unknown_controls "$approval" "$approval_fields"
[[ "$(control_value "$approval" APPROVAL_ID)" == 'OS3.9-FINAL-RELEASE-APPROVAL' ]] || fail 'Final Release Approval identity mismatch'
[[ "$(control_value "$approval" RELEASE_GATE)" == "$gate_id" ]] || fail 'Final Release Approval gate mismatch'
[[ "$(control_value "$approval" DECISION)" == 'APPROVED' ]] || fail 'Final Release decision is not APPROVED'
[[ "$(control_value "$approval" APPROVER)" == 'Steven' ]] || fail 'Final Release Approval approver mismatch'
[[ "$(control_value "$approval" APPROVED_AT)" == "$approved_at" ]] || fail 'Final Release Approval timestamp mismatch'
[[ "$(control_value "$approval" RELEASE_SHA)" == "$approved_release_sha" ]] || fail 'Final Release Approval release SHA mismatch'
[[ "$(control_value "$approval" REQUEST_PR_URL)" == "$request_pr_url" ]] || fail 'Final Release Approval request PR URL mismatch'
[[ "$(control_value "$approval" REQUEST_PR_NUMBER)" == "$request_pr_number" ]] || fail 'Final Release Approval request PR number mismatch'
[[ "$(control_value "$approval" REQUEST_PR_HEAD)" == "$request_pr_head" ]] || fail 'Final Release Approval request PR head mismatch'
[[ "$(control_value "$approval" REQUEST_MERGE_SHA)" == "$request_merge_sha" ]] || fail 'Final Release Approval request merge SHA mismatch'
[[ "$(control_value "$approval" REQUEST_ARTIFACT)" == "$request_artifact" ]] || fail 'Final Release Approval request artifact path mismatch'
[[ "$(control_value "$approval" REQUEST_ARTIFACT_SHA256)" == "$request_artifact_sha" ]] || fail 'Final Release Approval request artifact digest mismatch'
[[ "$(control_value "$approval" REVIEW_ID)" == "$review_id" ]] || fail 'Final Release Approval review identity mismatch'
[[ "$(control_value "$approval" REVIEW_COMMIT_ID)" == "$review_commit_id" ]] || fail 'Final Release Approval review commit mismatch'
[[ "$(control_value "$approval" REVIEWED_RELEASE_SHA)" == "$reviewed_release_sha" ]] || fail 'Final Release Approval reviewed release SHA mismatch'
[[ "$(control_value "$approval" PRODUCTION_READINESS_EVIDENCE)" == "$evidence_path" ]] || fail 'Final Release Approval readiness path mismatch'
[[ "$(control_value "$approval" PRODUCTION_READINESS_EVIDENCE_SHA256)" == "$evidence_sha" ]] || fail 'Final Release Approval readiness digest mismatch'
verification_id="$(control_value "$approval" PRODUCTION_READINESS_VERIFICATION_ID)"
[[ "$verification_id" =~ ^OS39-PR-[0-9]{8}T[0-9]{6}Z$ ]] || fail 'Production Readiness verification identity is invalid'

evidence_fields=$'EVIDENCE_ID\nSTATUS\nRELEASE_SHA\nVERIFICATION_ID\nVERIFIED_AT\nMIGRATION_REHEARSAL\nMIGRATION_IMAGE_REHEARSAL\nMIGRATION_IMAGE_DIGEST\nMIGRATION_IMAGE_REVISION\nBACKUP_SHA256\nRESTORE_VERIFIED_AT\nROLLBACK_IMAGE_TAG\nROLLBACK_IMAGE_ID\nROLLBACK_IMAGE_SCOPE\nPRODUCTION_ENVIRONMENT\nREQUIRED_REVIEWER\nENVIRONMENT_PROTECTION\nENVIRONMENT_VERIFICATION_ID\nENVIRONMENT_VERIFIED_AT'
reject_unknown_controls "$evidence" "$evidence_fields"
[[ "$(control_value "$evidence" EVIDENCE_ID)" == 'OS3.9-PRODUCTION-READINESS' ]] || fail 'Production Readiness evidence identity mismatch'
[[ "$(control_value "$evidence" STATUS)" == 'READY' ]] || fail 'Production Readiness evidence is not READY'
[[ "$(control_value "$evidence" RELEASE_SHA)" == "$approved_release_sha" ]] || fail 'Production Readiness evidence release SHA mismatch'
[[ "$(control_value "$evidence" VERIFICATION_ID)" == "$verification_id" ]] || fail 'Production Readiness verification identity mismatch'
verified_at="$(control_value "$evidence" VERIFIED_AT)"
[[ "$verified_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'Production Readiness verification timestamp is invalid'
readiness_evidence_validator="$repo_root/scripts/deployment/os39/validate-production-readiness-evidence.sh"
[[ -f "$readiness_evidence_validator" && ! -L "$readiness_evidence_validator" && -x "$readiness_evidence_validator" ]] || \
  fail 'Production Readiness evidence stage validator is unavailable or unsafe'
"$readiness_evidence_validator" "$evidence_stage" "$evidence" >/dev/null
[[ "$(control_value "$evidence" MIGRATION_IMAGE_REVISION)" == "$approved_release_sha" ]] || fail 'migration image revision evidence does not match the approved release'
[[ "$(control_value "$evidence" BACKUP_SHA256)" =~ ^[0-9a-f]{64}$ ]] || fail 'logical backup checksum evidence is invalid'
[[ "$(control_value "$evidence" RESTORE_VERIFIED_AT)" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'isolated restore verification timestamp is invalid'
rollback_image_tag="$(control_value "$evidence" ROLLBACK_IMAGE_TAG)"
rollback_image_id="$(control_value "$evidence" ROLLBACK_IMAGE_ID)"
rollback_image_scope="$(control_value "$evidence" ROLLBACK_IMAGE_SCOPE)"
[[ "$rollback_image_tag" =~ ^nextshift-app:[a-z0-9][a-z0-9._-]{0,127}$ ]] || fail 'rollback image tag is invalid'
[[ "$rollback_image_id" =~ ^sha256:[0-9a-f]{64}$ ]] || fail 'rollback image ID is invalid'
[[ "$rollback_image_scope" == 'ENGINE_LOCAL_DOCKER_ID_NO_CROSS_ENGINE_COMPARISON' ]] || \
  fail 'rollback image ID must be explicitly engine-local with cross-engine comparison prohibited'
[[ "$(control_value "$evidence" PRODUCTION_ENVIRONMENT)" == 'production' ]] || fail 'Production Environment evidence must name production'
[[ "$(control_value "$evidence" REQUIRED_REVIEWER)" == 'Steven' ]] || fail 'Production Environment required reviewer evidence mismatch'
[[ "$(control_value "$evidence" ENVIRONMENT_PROTECTION)" == 'PASS' ]] || fail 'Production Environment protection evidence is not PASS'
environment_verification_id="$(control_value "$evidence" ENVIRONMENT_VERIFICATION_ID)"
[[ "$environment_verification_id" =~ ^OS39-ENV-[0-9]{8}T[0-9]{6}Z$ ]] || fail 'Production Environment verification identity is invalid'
environment_verified_at="$(control_value "$evidence" ENVIRONMENT_VERIFIED_AT)"
[[ "$environment_verified_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'Production Environment verification timestamp is invalid'
[[ "$environment_verified_at" == "$verified_at" ]] || fail 'Production Environment protection evidence is stale'

case "$action" in
  deploy)
    [[ "$requested_target" == "$approved_release_sha" ]] || fail 'deploy SHA does not match the approved release SHA'
    ;;
  rollback)
    [[ "$requested_target" == "$rollback_image_tag" ]] || fail 'rollback target is not the exact image tag authorized by readiness evidence'
    ;;
esac

printf 'PASS: Final Release Approval authorizes %s target %s for approved release %s\n' \
  "$action" "$requested_target" "$approved_release_sha"
