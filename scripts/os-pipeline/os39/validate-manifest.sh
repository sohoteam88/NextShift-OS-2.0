#!/usr/bin/env bash
# Validate the independent OS 3.9 Batch 1 release-control plane.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
manifest_path="${MANIFEST_PATH:-$script_dir/../../../docs/nextshift-os-3/os-3-9/PIPELINE_MANIFEST.json}"

if [[ "${1:-}" == --manifest ]]; then
  manifest_path="${2:?--manifest requires a path}"
fi

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || fail 'jq is required'
[[ -f "$manifest_path" && ! -L "$manifest_path" ]] || fail 'manifest must be a regular file'
jq empty "$manifest_path" || fail 'manifest is not valid JSON'

jq -e '
  .schema_version == 1 and
  .release == "OS 3.9 Batch 1" and
  .base_branch == "main" and .main_branch == "main" and
  .execution_policy == {
    "auto_release": false,
    "auto_deploy": false,
    "require_exact_head_comment_review": true,
    "request_pr_merge_method": "merge"
  } and
  .final_audit == {
    "status": "pass",
    "report": "audit/OS38_FINAL_CODE_REVIEW_REPORT.md",
    "inherited_from": "OS3.8"
  } and
  .final_release_review.id == "AR-OS3.9-FINAL-RELEASE" and
  .final_release_review.reviewer_policy == {
    "allowed_logins": ["sohoteam88"],
    "allowed_author_associations": ["OWNER"]
  } and
  (.final_release_review.status | IN("pending", "awaiting_review", "passed")) and
  .final_release_review.request_artifact == "docs/nextshift-os-3/os-3-9/releases/OS39_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md" and
  (.final_release_review.release_sha | type == "string" and test("^[0-9a-f]{40}$")) and
  (if .final_release_review.status == "pending" then
    ([.final_release_review.pre_request_main_sha, .final_release_review.requested_at,
     .final_release_review.request_artifact_sha256, .final_release_review.request_pr_url,
     .final_release_review.request_pr_number, .final_release_review.request_pr_head,
     .final_release_review.request_merge_sha, .final_release_review.review_id,
     .final_release_review.review_commit_id, .final_release_review.reviewed_release_sha,
     .final_release_review.reviewed_at] | all(. == null))
   elif .final_release_review.status == "awaiting_review" then
    (.final_release_review.pre_request_main_sha | type == "string" and test("^[0-9a-f]{40}$")) and
    (.final_release_review.requested_at | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")) and
    (.final_release_review.request_artifact_sha256 | type == "string" and test("^[0-9a-f]{64}$")) and
    ([.final_release_review.request_pr_url, .final_release_review.request_pr_number,
     .final_release_review.request_pr_head, .final_release_review.request_merge_sha,
     .final_release_review.review_id, .final_release_review.review_commit_id,
     .final_release_review.reviewed_release_sha, .final_release_review.reviewed_at] | all(. == null))
   else
    (.final_release_review.pre_request_main_sha | type == "string" and test("^[0-9a-f]{40}$")) and
    (.final_release_review.requested_at | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")) and
    (.final_release_review.request_artifact_sha256 | type == "string" and test("^[0-9a-f]{64}$")) and
    (.final_release_review.request_pr_url | type == "string" and test("^https://github\\.com/sohoteam88/NextShift-OS-2\\.0/pull/[1-9][0-9]*$")) and
    (.final_release_review.request_pr_number | type == "number" and . > 0 and floor == .) and
    (.final_release_review.request_pr_head | type == "string" and test("^[0-9a-f]{40}$")) and
    (.final_release_review.request_merge_sha | type == "string" and test("^[0-9a-f]{40}$")) and
    (.final_release_review.review_id | type == "number" and . > 0 and floor == .) and
    .final_release_review.review_commit_id == .final_release_review.request_pr_head and
    .final_release_review.reviewed_release_sha == .final_release_review.release_sha and
    (.final_release_review.reviewed_at | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"))
   end) and
  .release_gate.id == "OS3.9-FINAL-RELEASE" and
  (.release_gate.status | IN("blocked", "approved")) and
  .release_gate.approval_artifact == "docs/nextshift-os-3/os-3-9/approvals/STEVEN_FINAL_RELEASE_APPROVAL.md" and
  .release_gate.readiness_evidence == "docs/nextshift-os-3/os-3-9/releases/OS39_PRODUCTION_READINESS_EVIDENCE.md" and
  .release_gate.requires == ["AUDIT-OS3.8:PASS", "Steven release approval"] and
  .release_gate.auto_tag == false and .release_gate.auto_deploy == false and .release_gate.auto_release == false and
  (if .release_gate.status == "blocked" then
    ([.release_gate.approval_sha256, .release_gate.readiness_evidence_sha256,
     .release_gate.approved_release_sha, .release_gate.approved_by,
     .release_gate.approved_at, .release_gate.review_id] | all(. == null)) and
    .final_release_review.status != "passed"
   else
    .final_release_review.status == "passed" and
    (.release_gate.approval_sha256 | type == "string" and test("^[0-9a-f]{64}$")) and
    (.release_gate.readiness_evidence_sha256 | type == "string" and test("^[0-9a-f]{64}$")) and
    .release_gate.approved_release_sha == .final_release_review.release_sha and
    .release_gate.approved_by == "Steven" and
    (.release_gate.approved_at | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")) and
    .release_gate.review_id == .final_release_review.review_id
   end)
' "$manifest_path" >/dev/null || fail 'manifest violates the OS 3.9 release-control schema'

printf 'PASS: OS 3.9 release-control manifest is valid\n'
