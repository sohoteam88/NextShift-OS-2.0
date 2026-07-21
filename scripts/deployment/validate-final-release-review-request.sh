#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
manifest="$repo_root/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
mode="${1:---manifest-only}"
pr_url="${2:-}"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
  else shasum -a 256 "$1" | awk '{print $1}'; fi
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
    grep -Fqx "$key" <<<"$allowed" || fail "unexpected request authority field: $key"
  done <"$file"
}

safe_relative_path() {
  local path="$1" component
  [[ -n "$path" && "$path" != /* && "$path" != -* && ! "$path" =~ [[:cntrl:]] ]] || return 1
  IFS='/' read -r -a components <<<"$path"
  for component in "${components[@]}"; do
    [[ -n "$component" && "$component" != . && "$component" != .. ]] || return 1
  done
}

validate_request_artifact() {
  local file="$1" expected_digest="$2" release_sha pre_main request_path readiness_path readiness_sha
  local verification_id final_audit_path final_audit_sha rollback_sha requested_at allowed
  [[ -f "$file" && ! -L "$file" ]] || fail 'Final Release review request must be a regular, non-symlink file'
  release_sha="$(jq -r '.final_release_review.release_sha' "$manifest")"
  pre_main="$(jq -r '.final_release_review.pre_request_main_sha' "$manifest")"
  request_path="$(jq -r '.final_release_review.request_artifact' "$manifest")"
  readiness_path="$(jq -r '.release_gate.readiness_evidence' "$manifest")"
  [[ -f "$repo_root/$readiness_path" && ! -L "$repo_root/$readiness_path" ]] || fail 'Production Readiness evidence is missing or unsafe'
  readiness_sha="$(sha256_file "$repo_root/$readiness_path")"
  [[ "$(control_value "$repo_root/$readiness_path" STATUS)" == READY ]] || fail 'Production Readiness evidence is not READY'
  [[ "$(control_value "$repo_root/$readiness_path" RELEASE_SHA)" == "$release_sha" ]] || fail 'Production Readiness release SHA mismatch'
  verification_id="$(control_value "$repo_root/$readiness_path" VERIFICATION_ID)"
  rollback_sha="$(control_value "$repo_root/$readiness_path" ROLLBACK_IMAGE_SHA)"
  final_audit_path="$(jq -r '.final_audit.report' "$manifest")"
  final_audit_sha="$(sha256_file "$repo_root/$final_audit_path")"
  requested_at="$(jq -r '.final_release_review.requested_at' "$manifest")"
  allowed=$'REQUEST_ID\nRELEASE_SHA\nPRE_REQUEST_MAIN_SHA\nREQUESTED_AT\nPRODUCTION_READINESS_EVIDENCE\nPRODUCTION_READINESS_EVIDENCE_SHA256\nPRODUCTION_READINESS_VERIFICATION_ID\nFINAL_AUDIT_REPORT_SHA256\nROLLBACK_IMAGE_SHA\nRELEASE_GATE'
  reject_unknown_controls "$file" "$allowed"
  [[ "$(control_value "$file" REQUEST_ID)" == 'OS3.8-FINAL-RELEASE-ARCHITECTURE-REVIEW' ]] || fail 'request identity mismatch'
  [[ "$(control_value "$file" RELEASE_SHA)" == "$release_sha" ]] || fail 'request release SHA mismatch'
  [[ "$(control_value "$file" PRE_REQUEST_MAIN_SHA)" == "$pre_main" ]] || fail 'request pre-request main SHA mismatch'
  [[ "$(control_value "$file" REQUESTED_AT)" == "$requested_at" ]] || fail 'request timestamp mismatch'
  [[ "$requested_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'request timestamp is invalid'
  [[ "$(control_value "$file" PRODUCTION_READINESS_EVIDENCE)" == "$readiness_path" ]] || fail 'request readiness path mismatch'
  [[ "$(control_value "$file" PRODUCTION_READINESS_EVIDENCE_SHA256)" == "$readiness_sha" ]] || fail 'request readiness digest mismatch'
  [[ "$(control_value "$file" PRODUCTION_READINESS_VERIFICATION_ID)" == "$verification_id" ]] || fail 'request readiness verification identity mismatch'
  [[ "$(control_value "$file" FINAL_AUDIT_REPORT_SHA256)" == "$final_audit_sha" ]] || fail 'request Final Audit report digest mismatch'
  [[ "$(control_value "$file" ROLLBACK_IMAGE_SHA)" == "$rollback_sha" ]] || fail 'request rollback image SHA mismatch'
  [[ "$(control_value "$file" RELEASE_GATE)" == 'BLOCKED' ]] || fail 'request must keep the release gate BLOCKED'
  [[ "$(sha256_file "$file")" == "$expected_digest" ]] || fail 'request artifact digest mismatch'
  [[ "$request_path" == 'docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md' ]] || fail 'non-canonical request path'
}

[[ -f "$manifest" && ! -L "$manifest" ]] || fail 'canonical Manifest is missing or unsafe'
"$repo_root/scripts/os-pipeline/validate-manifest.sh" --manifest "$manifest" >/dev/null
status="$(jq -r '.final_release_review.status' "$manifest")"
gate_status="$(jq -r '.release_gate.status' "$manifest")"
[[ "$gate_status" == blocked ]] || [[ "$status" == passed ]] || fail 'review request state must keep release gate blocked'

case "$mode" in
  --manifest-only)
    if [[ "$status" == awaiting_review ]]; then
      request_path="$(jq -r '.final_release_review.request_artifact' "$manifest")"
      safe_relative_path "$request_path" || fail 'request path is unsafe'
      validate_request_artifact "$repo_root/$request_path" "$(jq -r '.final_release_review.request_artifact_sha256' "$manifest")"
    fi
    printf 'PASS: Final Release review contract state is %s\n' "$status"
    ;;
  --verify-pr)
    [[ "$status" == awaiting_review || "$status" == passed ]] || fail 'no review request is awaiting verification'
    [[ "$pr_url" =~ ^https://github\.com/sohoteam88/NextShift-OS-2\.0/pull/([1-9][0-9]*)$ ]] || fail 'request PR URL is invalid'
    command -v gh >/dev/null 2>&1 || fail 'gh is required for exact PR review verification'
    pr_number="${BASH_REMATCH[1]}"
    pr_json="$(gh api "repos/sohoteam88/NextShift-OS-2.0/pulls/$pr_number")"
    [[ "$(jq -r '.base.repo.full_name' <<<"$pr_json")" == 'sohoteam88/NextShift-OS-2.0' ]] || fail 'wrong request repository'
    [[ "$(jq -r '.head.repo.full_name // .base.repo.full_name' <<<"$pr_json")" == 'sohoteam88/NextShift-OS-2.0' ]] || fail 'request head repository mismatch'
    [[ "$(jq -r '.base.ref' <<<"$pr_json")" == main ]] || fail 'request PR base must be main'
    pre_main="$(jq -r '.final_release_review.pre_request_main_sha' "$manifest")"
    [[ "$(jq -r '.base.sha' <<<"$pr_json")" == "$pre_main" ]] || fail 'request PR base SHA mismatch'
    [[ "$(jq -r '.merged' <<<"$pr_json")" == true ]] || fail 'request PR is not merged'
    head_sha="$(jq -r '.head.sha' <<<"$pr_json")"
    merge_sha="$(jq -r '.merge_commit_sha' <<<"$pr_json")"
    [[ "$head_sha" =~ ^[0-9a-f]{40}$ && "$merge_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'request PR Git identity is invalid'
    release_sha="$(jq -r '.final_release_review.release_sha' "$manifest")"
    git -C "$repo_root" cat-file -e "$head_sha^{commit}" 2>/dev/null || fail 'exact request PR head is unavailable locally'
    [[ "$(git -C "$repo_root" rev-parse "$release_sha^{commit}" 2>/dev/null || true)" == "$release_sha" ]] || fail 'authorized release SHA is unavailable'
    git -C "$repo_root" merge-base --is-ancestor "$release_sha" "$pre_main" || fail 'authorized release was not contained in the pre-request main state'
    git -C "$repo_root" merge-base --is-ancestor "$pre_main" "$head_sha" || fail 'request head does not descend from its exact main baseline'
    git -C "$repo_root" merge-base --is-ancestor "$head_sha" "$merge_sha" || fail 'request head is not contained in request merge commit'
    git -C "$repo_root" merge-base --is-ancestor "$merge_sha" refs/remotes/origin/main || fail 'request merge is not in current main history'

    request_path="$(jq -r '.final_release_review.request_artifact' "$manifest")"
    files_json="$(gh api --paginate "repos/sohoteam88/NextShift-OS-2.0/pulls/$pr_number/files")"
    [[ "$(jq --arg p "$request_path" '[.[] | select(.filename == $p)] | length' <<<"$files_json")" == 1 ]] || fail 'request artifact is not uniquely present in PR diff'
    unknown_files="$(jq -r --arg request "$request_path" '.[] | .filename | select(. != $request and . != "docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json")' <<<"$files_json")"
    [[ -z "$unknown_files" ]] || fail 'request PR contains non-governance files'
    tmp_artifact="$(mktemp "${TMPDIR:-/tmp}/os38-final-release-request.XXXXXX")"
    trap 'rm -f "${tmp_artifact:-}"' EXIT
    git -C "$repo_root" show "$head_sha:$request_path" >"$tmp_artifact" || fail 'request artifact is absent from exact request head'
    validate_request_artifact "$tmp_artifact" "$(jq -r '.final_release_review.request_artifact_sha256' "$manifest")"

    reviews_json="$(gh api --paginate "repos/sohoteam88/NextShift-OS-2.0/pulls/$pr_number/reviews")"
    valid_count=0; review_id=''; reviewed_at=''
    while IFS= read -r review; do
      [[ -n "$review" ]] || continue
      [[ "$(jq -r '.commit_id // empty' <<<"$review")" == "$head_sha" ]] || continue
      body="$(jq -r '.body // empty' <<<"$review")"
      grep -Eq '^(CHECKPOINT:|VERDICT:|REVIEWED_RELEASE_SHA=)' <<<"$body" || continue
      review_state="$(jq -r '.state // empty' <<<"$review")"
      [[ "$review_state" == APPROVED || "$review_state" == COMMENTED ]] || fail 'exact-head authority review is dismissed or invalid'
      verdict_lines="$(grep -Ec '^VERDICT: (PASS|FAIL|CHANGES_REQUESTED)$' <<<"$body" || true)"
      pass_lines="$(grep -Ec '^VERDICT: PASS$' <<<"$body" || true)"
      checkpoint_lines="$(grep -Ec '^CHECKPOINT: FINAL-RELEASE$' <<<"$body" || true)"
      release_lines="$(grep -Ec "^REVIEWED_RELEASE_SHA=$(jq -r '.final_release_review.release_sha' "$manifest")$" <<<"$body" || true)"
      if [[ "$verdict_lines" != 1 ]]; then fail 'duplicate or conflicting exact-head review verdict'; fi
      if [[ "$pass_lines" == 1 && "$checkpoint_lines" == 1 && "$release_lines" == 1 ]]; then
        valid_count=$((valid_count + 1)); review_id="$(jq -r '.id' <<<"$review")"; reviewed_at="$(jq -r '.submitted_at' <<<"$review")"
      elif [[ "$pass_lines" == 1 ]]; then fail 'exact-head PASS review has the wrong checkpoint or release SHA';
      else fail 'exact-head Final Release review is not PASS'; fi
    done < <(jq -c '.[]' <<<"$reviews_json")
    [[ "$valid_count" == 1 && "$review_id" =~ ^[1-9][0-9]*$ ]] || fail 'exactly one exact-head Final Release PASS review is required'
    [[ "$reviewed_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || fail 'exact-head review timestamp is invalid'

    pr_json_after="$(gh api "repos/sohoteam88/NextShift-OS-2.0/pulls/$pr_number")"
    [[ "$(jq -r '.head.sha' <<<"$pr_json_after")" == "$head_sha" && "$(jq -r '.merge_commit_sha' <<<"$pr_json_after")" == "$merge_sha" && "$(jq -r '.base.sha' <<<"$pr_json_after")" == "$pre_main" && "$(jq -r '.merged' <<<"$pr_json_after")" == true ]] || fail 'request PR identity changed during verification'

    allowed_paths=$'docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json\ndocs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md\ndocs/nextshift-os-3/os-3-8/approvals/STEVEN_FINAL_RELEASE_APPROVAL.md'
    while IFS= read -r changed; do
      [[ -z "$changed" ]] && continue
      grep -Fqx "$changed" <<<"$allowed_paths" || fail "release drift after request baseline: $changed"
    done < <(git -C "$repo_root" diff --name-only "$pre_main..refs/remotes/origin/main")

    if [[ "$status" == passed ]]; then
      [[ "$(jq -r '.final_release_review.request_pr_url' "$manifest")" == "$pr_url" ]] || fail 'persisted request PR URL mismatch'
      [[ "$(jq -r '.final_release_review.request_pr_number' "$manifest")" == "$pr_number" ]] || fail 'persisted request PR number mismatch'
      [[ "$(jq -r '.final_release_review.request_pr_head' "$manifest")" == "$head_sha" ]] || fail 'persisted request PR head mismatch'
      [[ "$(jq -r '.final_release_review.request_merge_sha' "$manifest")" == "$merge_sha" ]] || fail 'persisted request merge SHA mismatch'
      [[ "$(jq -r '.final_release_review.review_id' "$manifest")" == "$review_id" ]] || fail 'persisted review ID mismatch'
      [[ "$(jq -r '.final_release_review.review_commit_id' "$manifest")" == "$head_sha" ]] || fail 'persisted review commit mismatch'
      [[ "$(jq -r '.final_release_review.reviewed_release_sha' "$manifest")" == "$(jq -r '.final_release_review.release_sha' "$manifest")" ]] || fail 'persisted reviewed release mismatch'
      [[ "$(jq -r '.final_release_review.reviewed_at' "$manifest")" == "$reviewed_at" ]] || fail 'persisted review timestamp mismatch'
    fi
    jq -n --argjson pr "$pr_number" --arg url "$pr_url" --arg head "$head_sha" --arg merge "$merge_sha" \
      --argjson review "$review_id" --arg reviewed_at "$reviewed_at" --arg release "$(jq -r '.final_release_review.release_sha' "$manifest")" \
      '{request_pr_number:$pr,request_pr_url:$url,request_pr_head:$head,request_merge_sha:$merge,review_id:$review,review_commit_id:$head,reviewed_release_sha:$release,reviewed_at:$reviewed_at}'
    ;;
  *) fail 'usage: validate-final-release-review-request.sh [--manifest-only | --verify-pr PR_URL]' ;;
esac
