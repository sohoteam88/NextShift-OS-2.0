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
  def ignored_ci_path:
    ((startswith("src/") or startswith("tests/") or startswith("scripts/") or
     startswith("prisma/") or startswith(".github/workflows/")) | not) and
    (startswith("docs/") or startswith("audit/") or endswith(".md") or . == "platform/status.md");
  def zero_check_evidence($verification; $id; $policy):
    type == "object" and
    .decision == "not_required_paths_ignored" and
    .task_id == $id and .task_verification_policy == $policy and
    $policy == "paths_ignored_zero_checks_allowed" and
    .repository == $verification.repository and .pr_url == $verification.pr_url and
    .base_branch == $verification.base_branch and (.base_sha | sha40) and
    .head_sha == $verification.verified_head_sha and
    .workflow_path == ".github/workflows/ci.yml" and (.workflow_blob_sha | sha40) and
    (.changed_files | type == "array" and length > 0 and length == (unique | length) and
      all(.[]; (rel and ignored_ci_path))) and
    .github_check_runs == 0 and .ignored_paths_verified == true and (.verified_at | utc);
  def task_verification($base; $id; $policy):
    . as $verification |
    type == "object" and .status == "passed" and
    (.checks | IN("passed", "not_required_paths_ignored")) and
    (.repository | type == "string" and length > 0) and .base_branch == $base and
    (.task_branch | type == "string" and length > 0) and (.pr_url | ghpr) and
    (.verified_head_sha | sha40) and (.implementation_report | rel) and
    .dispatch_artifact == ("docs/nextshift-os-3/os-3-8/runs/" + $id + "_DISPATCH.json") and
    (.dispatch_artifact | rel) and .report_exists_at_exact_head == true and
    .report_in_pr_diff == true and (.verified_at | utc) and
    (if .checks == "passed" then
     ((.checks_evidence? // null) == null)
     else
      $policy == "paths_ignored_zero_checks_allowed" and
      (.checks_evidence | zero_check_evidence($verification; $id; $policy)) and
      .checks_evidence.verified_at == .verified_at
     end);
  def task_evidence($base; $id; $policy):
    type == "object" and
    (.pr_url | type == "string" and test("^https://github\\.com/sohoteam88/NextShift-OS-2\\.0/pull/[0-9]+$")) and
    (.merge_sha | sha40) and (.implementation_report | rel) and
    (.recovered | type == "boolean") and
    (.validation | type == "object" and
      (.checks | IN("passed", "not_required_paths_ignored")) and (.head_sha | sha40)) and
    (.verification | task_verification($base; $id; $policy)) and
    .verification.pr_url == .pr_url and
    .verification.implementation_report == .implementation_report and
    .verification.verified_head_sha == .validation.head_sha and
    .verification.checks == .validation.checks and
    (if .verification.checks == "passed" then
      ((.validation.checks_evidence? // null) == null)
     else
      .validation.checks_evidence == .verification.checks_evidence
     end) and
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
      (.verification_policy | IN("actual_checks_required", "paths_ignored_zero_checks_allowed")) and
      if .status == "completed" then
        (.verification | task_verification($base; $task.id; $task.verification_policy)) and (.evidence | task_evidence($base; $task.id; $task.verification_policy)) and .verification == .evidence.verification
      elif .status == "running" then
        ((.evidence? // null) == null) and (((.verification? // null) == null) or (.verification | task_verification($base; $task.id; $task.verification_policy)))
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

# Generic governance/dispatch-gate schema and dependency invariants. Gate names
# and task IDs are data; the validator does not special-case U3ADR or U3B.
jq -e '
  def rel:
    type == "string" and length > 0 and
    (startswith("/") | not) and (startswith("-") | not) and (endswith("/") | not) and
    (contains("//") | not) and (contains("\\") | not) and
    (test("(^|/)\\.\\.?(/|$)") | not) and (test("(^|/)\\.git(/|$)") | not) and
    (test("[\\x00-\\x1f\\x7f]") | not);
  def governance_contract:
    type == "object" and
    ((keys_unsorted - ["gate_id","artifact","required_status","required_verdict","reviewed_sha_must_equal_decision_sha","required_freshness_state","option_c_proof_required"]) | length == 0) and
    (.gate_id | type == "string" and length > 0) and (.artifact | rel) and .required_status == "approved" and .required_verdict == "PASS" and
    .reviewed_sha_must_equal_decision_sha == true and .required_freshness_state == "fresh" and
    .option_c_proof_required == true;
  def dispatch_contract:
    type == "object" and
    ((keys_unsorted - ["gate_id","task_id","artifact","required_status","required_verdict","reviewed_sha_must_equal_decision_sha","required_freshness_state","option_c_proof_required","blocked_reason"]) | length == 0) and
    (.gate_id | type == "string" and length > 0) and (.task_id | type == "string" and length > 0) and (.artifact | rel) and
    .required_status == "approved" and .required_verdict == "PASS" and
    .reviewed_sha_must_equal_decision_sha == true and .required_freshness_state == "fresh" and
    .option_c_proof_required == true and
    (((.blocked_reason? // null) == null) or (.blocked_reason | type == "string" and length > 0));
  [.waves[].tasks[]] as $tasks |
  all($tasks[];
    ((has("governance_gate") | not) or (.governance_gate | governance_contract)) and
    ((has("dispatch_gate") | not) or (.dispatch_gate | dispatch_contract)) and
    (if .status == "blocked" then has("dispatch_gate") else true end) and
    (if has("dispatch_gate") then
      . as $consumer |
      ([ $tasks[] | select(.id == $consumer.dispatch_gate.task_id) ] | length) == 1 and
      ([ $tasks[] | select(.id == $consumer.dispatch_gate.task_id) ][0]) as $dependency |
      ($consumer.depends_on | index($dependency.id) != null) and
      ($dependency.governance_gate | governance_contract) and
      $consumer.dispatch_gate.gate_id == $dependency.governance_gate.gate_id and
      $consumer.dispatch_gate.artifact == $dependency.governance_gate.artifact and
      (if $consumer.status == "blocked" then $dependency.status != "completed" else $dependency.status == "completed" end)
     else true end)
  )
' "$MANIFEST_PATH" >/dev/null || {
  echo "ERROR: manifest contains an invalid governance/dispatch gate contract" >&2
  exit 1
}

manifest_repo="$(git -C "$(dirname "$MANIFEST_PATH")" rev-parse --show-toplevel 2>/dev/null || true)"
while IFS=$'\t' read -r gate_task gate_status artifact_relative; do
  [[ -n "$gate_task" ]] || continue
  [[ -n "$manifest_repo" ]] || { echo "ERROR: gated manifest must live in a Git repository" >&2; exit 1; }
  artifact="$manifest_repo/$artifact_relative"
  [[ -f "$artifact" && ! -L "$artifact" ]] || { echo "ERROR: governance gate artifact missing or unsafe: $artifact_relative" >&2; exit 1; }
  artifact_parent="$(cd "$(dirname "$artifact")" && pwd -P)"
  [[ "$artifact_parent" == "$manifest_repo" || "$artifact_parent" == "$manifest_repo/"* ]] || { echo "ERROR: governance gate artifact escapes repository: $artifact_relative" >&2; exit 1; }
  expected_gate_id="$(jq -r --arg id "$gate_task" '.waves[].tasks[] | select(.id == $id) | .governance_gate.gate_id' "$MANIFEST_PATH")"
  jq -e --arg task "$gate_task" --arg status "$gate_status" --arg expected_gate_id "$expected_gate_id" '
    . as $gate |
    .schema_version == 1 and .gate_id == $expected_gate_id and .task_id == $task and
    (.decision_artifact | type == "string" and length > 0 and (startswith("/") | not) and (contains("..") | not)) and
    (.completion_contract.allowed_selected_options | type == "array" and length > 0 and length == (unique | length)) and
    all(.completion_contract.allowed_selected_options[]; type == "string" and length > 0) and
    .completion_contract.required_status == "approved" and
    .completion_contract.required_review_verdict == "PASS" and
    .completion_contract.reviewed_sha_must_equal_decision_sha == true and
    .completion_contract.required_approval_state == "approved" and
    .completion_contract.required_freshness_state == "fresh" and
    .completion_contract.option_c_requires_proof_artifact_at_reviewed_sha == true and
    .completion_contract.u3b_dispatch_authorized_must_be_true == true and
    (if $status == "completed" then
      .status == "approved" and (.selected_option | type == "string") and
      (.completion_contract.allowed_selected_options | index($gate.selected_option) != null) and
      .approval_state == "approved" and .architecture_review.verdict == "PASS" and
      (.architecture_review.review_id | type == "number" and . > 0 and floor == .) and
      (.decision_sha | type == "string" and test("^[0-9a-f]{40}$")) and
      .architecture_review.reviewed_sha == .decision_sha and .freshness.state == "fresh" and
      .freshness.verified_against_planning_sha == .decision_sha and
      (.freshness.protected_paths | type == "array" and length > 0 and length == (unique | length)) and
      all(.freshness.protected_paths[]; type == "string" and length > 0 and (startswith("/") | not) and (contains("..") | not)) and
      (if .selected_option == "C_NO_PLATFORM_GLOBAL_MUTATIONS" then
        (.option_c_proof_artifact | type == "string" and length > 0 and (startswith("/") | not) and (contains("..") | not)) and
        (.option_c_proof_sha256 | type == "string" and test("^[0-9a-f]{64}$"))
       else true end) and
      .u3b_dispatch_authorized == true
     else
      .status == "pending" and .selected_option == null and .decision_sha == null and
      .architecture_review.verdict == null and .architecture_review.reviewed_sha == null and
      .architecture_review.review_id == null and .approval_state == "pending" and
      .freshness.state == "unverified" and .freshness.verified_against_planning_sha == null and
      .u3b_dispatch_authorized == false
     end)
  ' "$artifact" >/dev/null || { echo "ERROR: governance gate artifact does not match task state: $gate_task" >&2; exit 1; }
  if [[ "$gate_status" == completed ]]; then
    expected_digest="$(jq -r --arg id "$gate_task" '.waves[].tasks[] | select(.id == $id) | .evidence.governance_gate_digest // empty' "$MANIFEST_PATH")"
    actual_digest="$(shasum -a 256 "$artifact" | awk '{print $1}')"
    [[ "$expected_digest" =~ ^[0-9a-f]{64}$ && "$expected_digest" == "$actual_digest" ]] || { echo "ERROR: completed governance gate digest is missing or mismatched: $gate_task" >&2; exit 1; }
  fi
done < <(jq -r '.waves[].tasks[] | select(has("governance_gate")) | [.id,.status,.governance_gate.artifact] | @tsv' "$MANIFEST_PATH")

all_ids="$(jq -r '[.waves[] | .tasks[]?.id, .checkpoint.id, .human_gate?.id] | .[]? // empty' "$MANIFEST_PATH" | sort -u)"
while IFS= read -r dependency; do
  [[ -z "$dependency" ]] && continue
  if ! grep -Fxq "$dependency" <<<"$all_ids"; then
    echo "ERROR: dependency references unknown ID: $dependency" >&2
    exit 1
  fi
done < <(jq -r '.waves[] | .tasks[]?.depends_on[]?' "$MANIFEST_PATH")

echo "manifest valid: $MANIFEST_PATH"
