#!/usr/bin/env bash
# Validate the OS 3.8 pipeline manifest before any state read or write.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_PATH="${MANIFEST_PATH:-$SCRIPT_DIR/../../docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json}"

if [[ "${1:-}" == "--manifest" ]]; then
  MANIFEST_PATH="${2:?--manifest requires a path}"
fi

command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required" >&2; exit 1; }
[[ -f "$MANIFEST_PATH" ]] || { echo "ERROR: manifest not found: $MANIFEST_PATH" >&2; exit 1; }
jq empty "$MANIFEST_PATH" || { echo "ERROR: invalid JSON manifest" >&2; exit 1; }

jq -e '
  .schema_version == 1 and
  (.release | type == "string" and length > 0) and
  (.base_branch | type == "string" and length > 0) and
  (.main_branch | type == "string" and length > 0) and
  (.execution_policy.auto_release == false) and
  (.execution_policy.auto_deploy == false) and
  (.execution_policy.max_architecture_remediation_attempts | type == "number" and . >= 1 and floor == .) and
  (.waves | type == "array" and length > 0) and
  (.final_audit.status | IN("pending", "running", "pass", "fail")) and
  (.final_audit.request | type == "string" and length > 0 and (startswith("/") | not) and (contains("..") | not)) and
  (.final_audit.report | type == "string" and length > 0 and (startswith("/") | not) and (contains("..") | not)) and
  (if .final_audit.status == "pending" then
    .final_audit.requested_product_sha == null and .final_audit.requested_at == null and
    .final_audit.reviewed_sha == null and .final_audit.completed_at == null
   elif .final_audit.status == "running" then
    (.final_audit.requested_product_sha | type == "string" and test("^[0-9a-f]{40}$")) and
    (.final_audit.requested_at | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")) and
    .final_audit.reviewed_sha == null and .final_audit.completed_at == null
   else
    (.final_audit.requested_product_sha | type == "string" and test("^[0-9a-f]{40}$")) and
    (.final_audit.requested_at | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")) and
    .final_audit.reviewed_sha == .final_audit.requested_product_sha and
    (.final_audit.completed_at | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"))
   end) and
  (.release_gate.status == "blocked") and
  (.release_gate.auto_tag == false) and
  (.release_gate.auto_deploy == false)
' "$MANIFEST_PATH" >/dev/null || {
  echo "ERROR: manifest has an invalid top-level policy or release gate" >&2
  exit 1
}

ids="$(jq -r '.waves[] | .tasks[]?.id, .checkpoint.id, .human_gate?.id // empty' "$MANIFEST_PATH" | sed '/^$/d')"
if [[ -n "$ids" ]] && [[ "$(printf '%s\n' "$ids" | sort | uniq -d)" ]]; then
  echo "ERROR: manifest contains duplicate task, checkpoint, or gate IDs" >&2
  exit 1
fi

jq -e '
  def task_status: IN("pending", "running", "completed", "blocked", "superseded");
  def checkpoint_status: IN("pending", "awaiting_review", "changes_requested", "needs_human", "passed");
  all(.waves[];
    (.tasks | type == "array") and
    all(.tasks[]; (.id | type == "string" and length > 0) and (.status | task_status)) and
    (.checkpoint.id | type == "string" and length > 0) and (.checkpoint.status | checkpoint_status) and
    (if .human_gate then
      (.human_gate.status | IN("pending", "approved", "rejected")) and
      (.human_gate.approval_artifact | type == "string" and length > 0 and (startswith("/") | not) and (contains("..") | not)) and
      (if .human_gate.status == "pending" then
        .human_gate.approved_by == null and .human_gate.approved_at == null and (.human_gate.approved_reviewed_sha // null) == null
       elif .human_gate.status == "approved" then
        (.human_gate.approved_by | type == "string" and length > 0) and
        (.human_gate.approved_at | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")) and
        (.human_gate.approved_reviewed_sha | type == "string" and test("^[0-9a-f]{40}$")) and
        .checkpoint.status == "passed" and .human_gate.approved_reviewed_sha == .checkpoint.reviewed_sha
       else true end)
    else true end)
  )
' "$MANIFEST_PATH" >/dev/null || {
  echo "ERROR: manifest contains an invalid wave state" >&2
  exit 1
}

jq -e '
  def sha40: type == "string" and test("^[0-9a-f]{40}$");
  def utc: type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$");
  def rel:
    type == "string" and length > 0 and
    (startswith("/") | not) and (startswith("-") | not) and (endswith("/") | not) and
    (contains("//") | not) and (contains("\\") | not) and
    (test("(^|/)\\.\\.?(/|$)") | not) and (test("(^|/)\\.git(/|$)") | not) and
    (test("[\\x00-\\x1f\\x7f]") | not);
  def uint: type == "number" and . >= 0 and floor == .;
  def ghpr: type == "string" and test("^https://github\\.com/[^/]+/[^/]+/pull/[0-9]+$");
  def task_verification($base; $id):
    type == "object" and .status == "passed" and .checks == "passed" and
    (.repository | type == "string" and length > 0) and .base_branch == $base and
    (.task_branch | type == "string" and length > 0) and (.pr_url | ghpr) and
    (.verified_head_sha | sha40) and (.implementation_report | rel) and
    .dispatch_artifact == ("docs/nextshift-os-3/os-3-8/runs/" + $id + "_DISPATCH.json") and
    (.dispatch_artifact | rel) and .report_exists_at_exact_head == true and
    .report_in_pr_diff == true and (.verified_at | utc);
  def task_evidence($base; $id):
    type == "object" and
    (.pr_url | type == "string" and test("^https://github\\.com/sohoteam88/NextShift-OS-2\\.0/pull/[0-9]+$")) and
    (.merge_sha | sha40) and (.implementation_report | rel) and
    (.recovered | type == "boolean") and
    (.validation | type == "object" and .checks == "passed" and (.head_sha | sha40)) and
    (.verification | task_verification($base; $id)) and
    .verification.pr_url == .pr_url and
    .verification.implementation_report == .implementation_report and
    .verification.verified_head_sha == .validation.head_sha and
    (if .recovered then
      ((.merged_at? // null) == null) and (.recovered_at | utc)
     else
      (.merged_at | utc) and ((.recovered_at? // null) == null)
     end);
  def active_ok($attempts; $max; $base):
    . as $active |
    type == "object" and .status == "running" and
    (.run_id | type == "string" and length > 0) and
    (.attempt | uint) and .attempt == ($attempts + 1) and .attempt <= $max and
    (.branch | type == "string" and length > 0) and (.artifact | rel) and
    (if (($active.pr_url? // null) == null and ($active.implementation_report? // null) == null) then
      (($active.verification? // null) == null)
    else
      ($active.pr_url | ghpr) and ($active.implementation_report | rel) and
      ((($active.verification? // null) == null) or ($active.verification |
        type == "object" and .status == "passed" and .checks == "passed" and
        (.repository | type == "string" and length > 0) and .base == $base and .head == $active.branch and
        (.head_sha | sha40) and .pr_url == $active.pr_url and
        .implementation_report == $active.implementation_report and (.verified_at | utc)))
    end);
  def block_ok:
    type == "object" and (.run_id | type == "string" and length > 0) and
    (.artifact | rel) and (.reason | type == "string" and length > 0);
  .execution_policy.max_architecture_remediation_attempts as $max |
  .base_branch as $base |
  all(.waves[];
    all(.tasks[];
      . as $task |
      if .status == "completed" then
        (.verification | task_verification($base; $task.id)) and (.evidence | task_evidence($base; $task.id)) and .verification == .evidence.verification
      elif .status == "running" then
        ((.evidence? // null) == null) and (((.verification? // null) == null) or (.verification | task_verification($base; $task.id)))
      else
        ((.evidence? // null) == null) and ((.verification? // null) == null)
      end
    ) and
    (.checkpoint as $checkpoint |
      ($checkpoint.remediation_attempts // 0) as $attempts |
      ($checkpoint.active_remediation? // null) as $active |
      ($checkpoint.remediation_block? // null) as $block |
      ($attempts | uint) and $attempts <= $max and
      ($checkpoint.request_artifact | rel) and ($checkpoint.result_artifact | rel) and
      $checkpoint.request_artifact != $checkpoint.result_artifact and
      (if $checkpoint.status == "pending" then
        (($checkpoint.requested_end_sha? // null) == null) and
        (($checkpoint.reviewed_sha? // null) == null) and
        $attempts == 0 and $active == null and $block == null
      elif $checkpoint.status == "awaiting_review" then
        ($checkpoint.requested_end_sha | sha40) and
        (($checkpoint.reviewed_sha? // null) == null) and $active == null and $block == null
      elif $checkpoint.status == "changes_requested" then
        ($checkpoint.requested_end_sha | sha40) and
        (($checkpoint.reviewed_sha? // null) == null) and $block == null and
        ($active == null or ($active | active_ok($attempts; $max; $base)))
      elif $checkpoint.status == "needs_human" then
        ($checkpoint.requested_end_sha | sha40) and
        (($checkpoint.reviewed_sha? // null) == null) and $active == null and
        (($block == null or ($block | block_ok)) and ($attempts == $max or $block != null))
      else
        ($checkpoint.requested_end_sha | sha40) and ($checkpoint.reviewed_sha | sha40) and
        $checkpoint.requested_end_sha == $checkpoint.reviewed_sha and $active == null and $block == null
      end)
    )
  ) and
  ([.waves[].tasks[] | select(.status == "running")] | length <= 1) and
  (if .final_audit.status == "pending" then true
   else
    all(.waves[];
      all(.tasks[]; .status == "completed" or .status == "superseded") and
      .checkpoint.status == "passed" and
      (if .human_gate then .human_gate.status == "approved" else true end)
    )
   end)
' "$MANIFEST_PATH" >/dev/null || {
  echo "ERROR: manifest contains invalid task evidence or checkpoint/remediation state" >&2
  exit 1
}

all_ids="$(jq -r '[.waves[] | .tasks[]?.id, .checkpoint.id, .human_gate?.id] | .[]? // empty' "$MANIFEST_PATH" | sort -u)"
while IFS= read -r dependency; do
  [[ -z "$dependency" ]] && continue
  if ! grep -Fxq "$dependency" <<<"$all_ids"; then
    echo "ERROR: dependency references unknown ID: $dependency" >&2
    exit 1
  fi
done < <(jq -r '.waves[] | .tasks[]?.depends_on[]?' "$MANIFEST_PATH")

echo "manifest valid: $MANIFEST_PATH"
