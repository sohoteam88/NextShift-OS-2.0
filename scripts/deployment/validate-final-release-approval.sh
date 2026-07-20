#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
release_sha="${1:-}"
manifest="$repo_root/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"

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

[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'release SHA must be a full lowercase 40-character Git SHA'
[[ -f "$manifest" && ! -L "$manifest" ]] || fail 'canonical Pipeline Manifest must be a regular, non-symlink file'
"$repo_root/scripts/os-pipeline/validate-manifest.sh" --manifest "$manifest" >/dev/null

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

[[ "$gate_id" == 'OS3.8-FINAL-RELEASE' ]] || fail 'unexpected Final Release gate identity'
[[ "$gate_status" == 'approved' ]] || fail 'canonical Final Release gate is not approved'
[[ "$approved_release_sha" == "$release_sha" ]] || fail 'Manifest Final Release approval is stale or bound to a different release SHA'
[[ "$approved_by" == 'Steven' ]] || fail 'Manifest Final Release approver must be Steven'
[[ "$approved_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'Manifest Final Release approval timestamp is invalid'
[[ "$review_id" =~ ^[1-9][0-9]*$ ]] || fail 'Manifest Final Release review identity is invalid'
[[ "$approval_sha" =~ ^[0-9a-f]{64}$ && "$evidence_sha" =~ ^[0-9a-f]{64}$ ]] || fail 'Manifest Final Release evidence digests are invalid'

require_regular_repository_file "$approval_path" 'Final Release Approval artifact'
require_regular_repository_file "$evidence_path" 'Production Readiness evidence artifact'
approval="$repo_root/$approval_path"
evidence="$repo_root/$evidence_path"
[[ "$(sha256_file "$approval")" == "$approval_sha" ]] || fail 'Final Release Approval artifact digest mismatch'
[[ "$(sha256_file "$evidence")" == "$evidence_sha" ]] || fail 'Production Readiness evidence artifact digest mismatch'

approval_fields=$'APPROVAL_ID\nRELEASE_GATE\nDECISION\nAPPROVER\nAPPROVED_AT\nRELEASE_SHA\nREVIEW_ID\nREVIEWED_SHA\nPRODUCTION_READINESS_EVIDENCE\nPRODUCTION_READINESS_EVIDENCE_SHA256\nPRODUCTION_READINESS_VERIFICATION_ID'
reject_unknown_controls "$approval" "$approval_fields"
[[ "$(control_value "$approval" APPROVAL_ID)" == 'OS3.8-FINAL-RELEASE-APPROVAL' ]] || fail 'Final Release Approval identity mismatch'
[[ "$(control_value "$approval" RELEASE_GATE)" == "$gate_id" ]] || fail 'Final Release Approval gate mismatch'
[[ "$(control_value "$approval" DECISION)" == 'APPROVED' ]] || fail 'Final Release decision is not APPROVED'
[[ "$(control_value "$approval" APPROVER)" == 'Steven' ]] || fail 'Final Release Approval approver mismatch'
[[ "$(control_value "$approval" APPROVED_AT)" == "$approved_at" ]] || fail 'Final Release Approval timestamp mismatch'
[[ "$(control_value "$approval" RELEASE_SHA)" == "$release_sha" ]] || fail 'Final Release Approval release SHA mismatch'
[[ "$(control_value "$approval" REVIEW_ID)" == "$review_id" ]] || fail 'Final Release Approval review identity mismatch'
[[ "$(control_value "$approval" REVIEWED_SHA)" == "$release_sha" ]] || fail 'Final Release Approval reviewed SHA mismatch'
[[ "$(control_value "$approval" PRODUCTION_READINESS_EVIDENCE)" == "$evidence_path" ]] || fail 'Final Release Approval readiness path mismatch'
[[ "$(control_value "$approval" PRODUCTION_READINESS_EVIDENCE_SHA256)" == "$evidence_sha" ]] || fail 'Final Release Approval readiness digest mismatch'
verification_id="$(control_value "$approval" PRODUCTION_READINESS_VERIFICATION_ID)"
[[ "$verification_id" =~ ^OS38-PR-[0-9]{8}T[0-9]{6}Z$ ]] || fail 'Production Readiness verification identity is invalid'

evidence_fields=$'EVIDENCE_ID\nSTATUS\nRELEASE_SHA\nVERIFICATION_ID\nVERIFIED_AT\nMIGRATION_REHEARSAL\nBACKUP_SHA256\nRESTORE_VERIFIED_AT\nROLLBACK_IMAGE_SHA'
reject_unknown_controls "$evidence" "$evidence_fields"
[[ "$(control_value "$evidence" EVIDENCE_ID)" == 'OS3.8-PRODUCTION-READINESS' ]] || fail 'Production Readiness evidence identity mismatch'
[[ "$(control_value "$evidence" STATUS)" == 'READY' ]] || fail 'Production Readiness evidence is not READY'
[[ "$(control_value "$evidence" RELEASE_SHA)" == "$release_sha" ]] || fail 'Production Readiness evidence release SHA mismatch'
[[ "$(control_value "$evidence" VERIFICATION_ID)" == "$verification_id" ]] || fail 'Production Readiness verification identity mismatch'
[[ "$(control_value "$evidence" VERIFIED_AT)" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'Production Readiness verification timestamp is invalid'
[[ "$(control_value "$evidence" MIGRATION_REHEARSAL)" == 'PASS' ]] || fail 'Production migration rehearsal evidence is not PASS'
[[ "$(control_value "$evidence" BACKUP_SHA256)" =~ ^[0-9a-f]{64}$ ]] || fail 'logical backup checksum evidence is invalid'
[[ "$(control_value "$evidence" RESTORE_VERIFIED_AT)" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'isolated restore verification timestamp is invalid'
[[ "$(control_value "$evidence" ROLLBACK_IMAGE_SHA)" =~ ^[0-9a-f]{40}$ ]] || fail 'rollback image evidence is invalid'

printf 'PASS: Final Release Approval and Production Readiness evidence authorize exact release %s\n' "$release_sha"
