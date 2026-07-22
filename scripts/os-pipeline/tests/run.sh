#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_MANIFEST="$PIPELINE_DIR/../../docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

pass=0
fail() { echo "FAIL: $*" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "$3 (expected $2, got $1)"; pass=$((pass + 1)); }
fresh() {
  jq '
    # The generic state-machine fixture exercises the original product-task
    # lifecycle. U3A/U3ADR/U3B use real Git/GitHub evidence and are covered by
    # governance-dispatch-gate.sh; do not manufacture their blocked gate here.
    .waves |= map(if .id == "W3" then
      .tasks |= map(select(.id != "U3A" and .id != "U3ADR" and .id != "U3B")) |
      .tasks |= map(if .id == "E3A" then .depends_on = ["U3"] else . end)
    else . end) |
    .waves |= map(
      .status="pending" | .start_sha=null |
      .tasks |= map(
        if .status == "blocked" then
          .verification=null | .evidence=null
        else
          .status="pending" | .verification=null | .evidence=null
        end
      ) |
      .checkpoint.status="pending" |
      .checkpoint.requested_end_sha=null |
      .checkpoint.reviewed_sha=null |
      .checkpoint.remediation_attempts=0 |
      .checkpoint.active_remediation=null |
      .checkpoint.remediation_block=null |
      if .human_gate then
        .human_gate.status="pending" |
        .human_gate.approved_by=null |
        .human_gate.approved_at=null |
        .human_gate.approved_reviewed_sha=null
      else . end
    ) |
    .final_audit.status="pending" |
    .final_audit.requested_product_sha=null |
    .final_audit.requested_at=null |
    .final_audit.reviewed_sha=null |
    .final_audit.completed_at=null |
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
    del(
      .release_gate.approval_sha256,
      .release_gate.readiness_evidence_sha256,
      .release_gate.approved_release_sha,
      .release_gate.approved_by,
      .release_gate.approved_at,
      .release_gate.review_id
    )
  ' "$SOURCE_MANIFEST" >"$TMP_DIR/manifest.json"
  rm -f "$TMP_DIR"/*ARCHITECTURE_REVIEW_*.md "$TMP_DIR"/STEVEN_IA_APPROVAL.md "$TMP_DIR"/OS38_FINAL_CODE_REVIEW_REQUEST.md "$TMP_DIR"/OS38_FINAL_CODE_REVIEW_REPORT.md
}
run() { PIPELINE_TEST_MODE=1 "$PIPELINE_DIR/run-pipeline.sh" --manifest "$TMP_DIR/manifest.json" "$@"; }
action() { run --plan | jq -r '.action'; }
task() { run --plan | jq -r '.task // empty'; }
set_task() {
  local id="$1" status="$2" tmp="$TMP_DIR/state.json"
  jq --arg id "$id" --arg status "$status" '
    .base_branch as $base |
    .waves |= map(.tasks |= map(if .id == $id then
      .status = $status |
      if $status == "completed" then
        .verification={
          status:"passed",
          repository:"fixture/NextShift-OS-2.0",
          base_branch:$base,
          task_branch:("fixture-" + $id),
          pr_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/1",
          verified_head_sha:"0123456789012345678901234567890123456789",
          implementation_report:("docs/fixture-" + $id + ".md"),
          dispatch_artifact:("docs/nextshift-os-3/os-3-8/runs/" + $id + "_DISPATCH.json"),
          report_exists_at_exact_head:true,
          report_in_pr_diff:true,
          checks:"passed",
          verified_at:"2026-07-15T12:00:00Z"
        } |
        .evidence={
          pr_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/1",
          merge_sha:"0123456789012345678901234567890123456789",
          implementation_report:("docs/fixture-" + $id + ".md"),
          verification:.verification,
          validation:{checks:"passed",head_sha:"0123456789012345678901234567890123456789"},
          recovered:false,
          merged_at:"2026-07-15T12:00:00Z"
        }
      else .verification=null | .evidence=null end
    else . end))
  ' "$TMP_DIR/manifest.json" >"$tmp" && mv "$tmp" "$TMP_DIR/manifest.json"
}
set_checkpoint() {
  local id="$1" status="$2" tmp="$TMP_DIR/state.json"
  jq --arg id "$id" --arg status "$status" '
    .waves |= map(if .checkpoint.id == $id then
      .checkpoint.status = $status |
      if $status == "passed" then
        .checkpoint.requested_end_sha="0123456789012345678901234567890123456789" |
        .checkpoint.reviewed_sha="0123456789012345678901234567890123456789"
      else . end
    else . end)
  ' "$TMP_DIR/manifest.json" >"$tmp" && mv "$tmp" "$TMP_DIR/manifest.json"
}
set_gate() {
  local id="$1" status="$2" tmp="$TMP_DIR/state.json"
  jq --arg id "$id" --arg status "$status" '
    .waves |= map(if .human_gate?.id == $id then
      .human_gate.status = $status |
      if $status == "approved" then
        .human_gate.approved_by="fixture" |
        .human_gate.approved_at="2026-07-15T12:00:00Z" |
        .human_gate.approved_reviewed_sha="0123456789012345678901234567890123456789"
      else . end
    else . end)
  ' "$TMP_DIR/manifest.json" >"$tmp" && mv "$tmp" "$TMP_DIR/manifest.json"
  if [[ "$id" == "STEVEN-IA" && "$status" == "approved" ]]; then
    printf '%s\n' \
      'HUMAN_GATE=STEVEN-IA' \
      'DECISION=APPROVED' \
      'APPROVED_BY=fixture' \
      'APPROVED_AT=2026-07-15T12:00:00Z' \
      'AR_W2_REVIEWED_SHA=0123456789012345678901234567890123456789' \
      >"$TMP_DIR/STEVEN_IA_APPROVAL.md"
  fi
}
complete_wave_tasks() { local wave="$1"; local id; while IFS= read -r id; do set_task "$id" completed; done < <(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .tasks[].id' "$TMP_DIR/manifest.json"); }
prepare_final_ready() {
  local tmp="$TMP_DIR/state.json"
  FINAL_TEST_SHA="$(git -C "$PIPELINE_DIR/../.." rev-parse HEAD)"
  complete_wave_tasks W1; complete_wave_tasks W2; complete_wave_tasks W3
  set_checkpoint AR-W1 passed; set_checkpoint AR-W2 passed; set_checkpoint AR-W3 passed; set_gate STEVEN-IA approved
  jq --arg sha "$FINAL_TEST_SHA" '
    .waves |= map(
      .start_sha=$sha |
      .checkpoint.requested_end_sha=$sha |
      .checkpoint.reviewed_sha=$sha |
      if .human_gate then .human_gate.approved_reviewed_sha=$sha else . end
    )
  ' "$TMP_DIR/manifest.json" >"$tmp" && mv "$tmp" "$TMP_DIR/manifest.json"
  sed -i.bak "s/^AR_W2_REVIEWED_SHA=.*/AR_W2_REVIEWED_SHA=$FINAL_TEST_SHA/" "$TMP_DIR/STEVEN_IA_APPROVAL.md"
  rm -f "$TMP_DIR/STEVEN_IA_APPROVAL.md.bak"
}
valid_evidence() {
  jq -n --arg n "${1:-1}" '{
    pr_url:("https://github.com/sohoteam88/NextShift-OS-2.0/pull/" + $n),
    merge_sha:"0123456789012345678901234567890123456789",
    implementation_report:"docs/report.md",
    verification:{
      status:"passed",repository:"fixture/NextShift-OS-2.0",base_branch:"planning/os-3.8-product-usability",
      task_branch:"fixture-E1",pr_url:("https://github.com/sohoteam88/NextShift-OS-2.0/pull/" + $n),
      verified_head_sha:"0123456789012345678901234567890123456789",implementation_report:"docs/report.md",
      dispatch_artifact:"docs/nextshift-os-3/os-3-8/runs/E1_DISPATCH.json",
      report_exists_at_exact_head:true,report_in_pr_diff:true,checks:"passed",verified_at:"2026-07-15T12:00:00Z"
    },
    validation:{checks:"passed",head_sha:"0123456789012345678901234567890123456789"},
    recovered:false,merged_at:"2026-07-15T12:00:00Z"
  }'
}
review_result() { printf 'VERDICT=%s\nREVIEWED_SHA=0123456789012345678901234567890123456789\n' "$1" >"$TMP_DIR/review-result.md"; }

"$PIPELINE_DIR/validate-manifest.sh" --manifest "$SOURCE_MANIFEST" >/dev/null
pass=$((pass + 1))
printf '{not json\n' >"$TMP_DIR/bad.json"
if "$PIPELINE_DIR/validate-manifest.sh" --manifest "$TMP_DIR/bad.json" >/dev/null 2>&1; then fail "invalid manifest accepted"; fi
pass=$((pass + 1))
fresh
jq '.execution_policy.auto_release = true' "$TMP_DIR/manifest.json" >"$TMP_DIR/bad-policy.json"
if "$PIPELINE_DIR/validate-manifest.sh" --manifest "$TMP_DIR/bad-policy.json" >/dev/null 2>&1; then fail "auto-release manifest accepted"; fi
pass=$((pass + 1))
if AUTO_RELEASE=1 run --plan >/dev/null 2>&1; then fail "AUTO_RELEASE override accepted"; fi
pass=$((pass + 1))

# Exact normal-task verification/evidence schema fails closed.
fresh
set_task E1 completed
jq 'del(.waves[0].tasks[0].verification)' "$TMP_DIR/manifest.json" >"$TMP_DIR/bad-task-verification.json"
if "$PIPELINE_DIR/validate-manifest.sh" --manifest "$TMP_DIR/bad-task-verification.json" >/dev/null 2>&1; then fail "completed task without persisted verification accepted"; fi
pass=$((pass + 1))
jq '.waves[0].tasks[0].verification.dispatch_artifact="docs/nextshift-os-3/os-3-8/runs/E2_DISPATCH.json" | .waves[0].tasks[0].evidence.verification=.waves[0].tasks[0].verification' "$TMP_DIR/manifest.json" >"$TMP_DIR/bad-dispatch-identity.json"
if "$PIPELINE_DIR/validate-manifest.sh" --manifest "$TMP_DIR/bad-dispatch-identity.json" >/dev/null 2>&1; then fail "non-canonical task dispatch artifact accepted"; fi
pass=$((pass + 1))
jq '.waves[0].tasks[0].evidence.recovered=true | del(.waves[0].tasks[0].evidence.merged_at,.waves[0].tasks[0].evidence.recovered_at)' "$TMP_DIR/manifest.json" >"$TMP_DIR/bad-recovery-timestamp.json"
if "$PIPELINE_DIR/validate-manifest.sh" --manifest "$TMP_DIR/bad-recovery-timestamp.json" >/dev/null 2>&1; then fail "recovered task without recovery timestamp accepted"; fi
pass=$((pass + 1))

# Lifecycle dependency states are validated independently of action selection.
fresh
set_task E2 completed
if "$PIPELINE_DIR/validate-manifest.sh" --manifest "$TMP_DIR/manifest.json" >/dev/null 2>&1; then fail "completed task with incomplete task dependency accepted"; fi
pass=$((pass + 1))
fresh
set_task E2 running
if "$PIPELINE_DIR/validate-manifest.sh" --manifest "$TMP_DIR/manifest.json" >/dev/null 2>&1; then fail "running task with incomplete task dependency accepted"; fi
pass=$((pass + 1))

# Initial selection and restart-safe task transition.
fresh
assert_eq "$(task)" E1 "initial selection"
run --record-task-start E1
TASK_EVIDENCE_JSON="$(valid_evidence 1)" run --record-task-completed E1
assert_eq "$(task)" E2 "E1 completion unlocks E2"
if TASK_EVIDENCE_JSON='{}' run --record-task-completed E1 >/dev/null 2>&1; then fail "completed task repeated"; fi
assert_eq "$(task)" E2 "restart does not repeat E1"

# Wave end creates a human review wait; a PASS unlocks W2.
set_task E2 completed
assert_eq "$(action)" checkpoint "W1 completed requires checkpoint"
run --checkpoint
assert_eq "$(action)" awaiting_review "checkpoint blocks W2"
if ! grep -Fq 'Checkpoint: AR-W1' "$TMP_DIR/W1_ARCHITECTURE_REVIEW_REQUEST.md"; then fail "review request artifact is incomplete"; fi
pass=$((pass + 1))
review_result PASS
run --record-review-result AR-W1 PASS "$TMP_DIR/review-result.md"
assert_eq "$(task)" U1A "AR-W1 PASS unlocks U1A"
assert_eq "$(jq -r '.waves[0].checkpoint.reviewed_sha' "$TMP_DIR/manifest.json")" 0123456789012345678901234567890123456789 "review result stores reviewed SHA"

# W2 cannot unlock W3 without the explicit human IA decision.
complete_wave_tasks W2
set_checkpoint AR-W2 passed
assert_eq "$(action)" awaiting_human_gate "W2 requires STEVEN-IA"
run --record-steven-ia steven 2026-07-15T12:00:00Z
grep -Fqx 'DECISION=APPROVED' "$TMP_DIR/STEVEN_IA_APPROVAL.md" || fail "STEVEN-IA approval artifact missing decision"
grep -Fqx 'AR_W2_REVIEWED_SHA=0123456789012345678901234567890123456789' "$TMP_DIR/STEVEN_IA_APPROVAL.md" || fail "STEVEN-IA approval artifact missing reviewed SHA"
pass=$((pass + 2))
run --record-steven-ia steven 2026-07-15T12:00:00Z
if run --record-steven-ia another-user 2026-07-15T12:00:00Z >/dev/null 2>&1; then fail "conflicting STEVEN-IA approval accepted"; fi
pass=$((pass + 1))
assert_eq "$(task)" U1B "approved STEVEN-IA unlocks W3"

# Remediation is bounded and never self-approves.
fresh
complete_wave_tasks W1
set_checkpoint AR-W1 awaiting_review
jq '.waves |= map(if .checkpoint.id == "AR-W1" then .checkpoint.requested_end_sha="0123456789012345678901234567890123456789" else . end)' "$TMP_DIR/manifest.json" >"$TMP_DIR/state.json" && mv "$TMP_DIR/state.json" "$TMP_DIR/manifest.json"
review_result CHANGES_REQUESTED
run --record-review-result AR-W1 CHANGES_REQUESTED "$TMP_DIR/review-result.md"
assert_eq "$(action)" remediation "changes requested selects remediation"
jq '.waves |= map(if .checkpoint.id == "AR-W1" then .checkpoint.active_remediation={status:"running",run_id:"fixture-r1",attempt:1,branch:"fixture-remediation",artifact:"docs/nextshift-os-3/os-3-8/runs/fixture-r1.json"} else . end)' "$TMP_DIR/manifest.json" >"$TMP_DIR/state.json" && mv "$TMP_DIR/state.json" "$TMP_DIR/manifest.json"
assert_eq "$(action)" remediation_recovery "active remediation selects recovery instead of duplicate dispatch"
jq '.waves |= map(if .checkpoint.id == "AR-W1" then .checkpoint.active_remediation=null else . end)' "$TMP_DIR/manifest.json" >"$TMP_DIR/state.json" && mv "$TMP_DIR/state.json" "$TMP_DIR/manifest.json"
jq '.waves |= map(if .checkpoint.id == "AR-W1" then .checkpoint.remediation_attempts=1 else . end)' "$TMP_DIR/manifest.json" >"$TMP_DIR/state.json" && mv "$TMP_DIR/state.json" "$TMP_DIR/manifest.json"
assert_eq "$(action)" remediation "one failed remediation remains available"
jq '.waves |= map(if .checkpoint.id == "AR-W1" then .checkpoint.remediation_attempts=2 else . end)' "$TMP_DIR/manifest.json" >"$TMP_DIR/state.json" && mv "$TMP_DIR/state.json" "$TMP_DIR/manifest.json"
assert_eq "$(action)" needs_human "two failed remediations need human"
if run --record-remediation-result AR-W1 FAIL >/dev/null 2>&1; then fail "removed production remediation result shortcut remains callable"; fi
pass=$((pass + 1))

# A second reviewed remediation failure transitions directly to needs_human.
fresh
complete_wave_tasks W1
set_checkpoint AR-W1 awaiting_review
jq '.waves |= map(if .checkpoint.id == "AR-W1" then .checkpoint.requested_end_sha="0123456789012345678901234567890123456789" | .checkpoint.remediation_attempts=2 else . end)' "$TMP_DIR/manifest.json" >"$TMP_DIR/state.json" && mv "$TMP_DIR/state.json" "$TMP_DIR/manifest.json"
review_result CHANGES_REQUESTED
run --record-review-result AR-W1 CHANGES_REQUESTED "$TMP_DIR/review-result.md"
assert_eq "$(action)" needs_human "reviewed failure at max attempts blocks a third remediation"

# The final audit runs only once after all human controls pass and never opens release.
fresh
prepare_final_ready
assert_eq "$(action)" final_audit "all waves select the final audit once"
run --cycle
assert_eq "$(action)" awaiting_final_audit "running final audit is a clean wait"
grep -Fqx "REQUESTED_PRODUCT_SHA=$FINAL_TEST_SHA" "$TMP_DIR/OS38_FINAL_CODE_REVIEW_REQUEST.md" || fail "final audit request did not pin current repository SHA"
pass=$((pass + 1))
printf 'VERDICT=PASS_WITH_CONDITION\nREVIEWED_SHA=%s\n' "$FINAL_TEST_SHA" >"$TMP_DIR/conditional-audit-result.md"
if run --record-final-audit PASS "$TMP_DIR/conditional-audit-result.md" >/dev/null 2>&1; then fail "PASS_WITH_CONDITION was accepted as PASS"; fi
pass=$((pass + 1))
printf 'VERDICT=PASS\nREVIEWED_SHA=%s\n' "$FINAL_TEST_SHA" >"$TMP_DIR/final-audit-source.md"
run --record-final-audit PASS "$TMP_DIR/final-audit-source.md"
assert_eq "$(action)" complete "final audit PASS completes state"
assert_eq "$(jq -r '.release_gate.status' "$TMP_DIR/manifest.json")" blocked "final audit cannot release"
run --record-final-audit PASS "$TMP_DIR/final-audit-source.md"
fresh
prepare_final_ready
run --cycle
if run --record-final-audit PASS "$TMP_DIR/missing-audit-result.md" >/dev/null 2>&1; then fail "missing external final audit result accepted"; fi
pass=$((pass + 1))

# Out-of-order and insufficient completion paths fail closed.
fresh
if run --record-task-start E3A >/dev/null 2>&1; then fail "out-of-order E3A start accepted"; fi
pass=$((pass + 1))
run --record-task-start E1
if TASK_EVIDENCE_JSON='{}' run --record-task-completed E1 >/dev/null 2>&1; then fail "insufficient evidence accepted"; fi
pass=$((pass + 1))

# Dispatch invokes the explicit Codex command and a failure cannot advance state.
fresh
printf '%s\n' '#!/usr/bin/env bash' "printf '%s\\n' '{\"pr_url\":\"https://github.com/sohoteam88/NextShift-OS-2.0/pull/99\",\"implementation_report\":\"docs/report.md\"}' > \"\$PIPELINE_TASK_OUTCOME\"" >"$TMP_DIR/fake-codex.sh"
chmod +x "$TMP_DIR/fake-codex.sh"
PIPELINE_ALLOW_PRODUCT_DISPATCH=1 CODEX_CMD="\"$TMP_DIR/fake-codex.sh\"" run --dispatch
assert_eq "$(jq -r '.waves[0].tasks[0].status' "$TMP_DIR/manifest.json")" running "successful dispatch invokes CODEX_CMD before state start"
assert_eq "$(jq -r '.task_id' "$TMP_DIR/E1_DISPATCH.json")" E1 "dispatch outcome artifact captured"
fresh
if PIPELINE_ALLOW_PRODUCT_DISPATCH=1 CODEX_CMD='false' run --dispatch >/dev/null 2>&1; then fail "failed CODEX_CMD dispatch accepted"; fi
assert_eq "$(jq -r '.waves[0].tasks[0].status' "$TMP_DIR/manifest.json")" pending "failed dispatch cannot advance state"

# PR metadata mismatches fail before local verification can run against a wrong checkout.
fresh
mkdir -p "$TMP_DIR/fake-bin"
printf '%s\n' '#!/usr/bin/env bash' "printf '%s\\n' \"\${FAKE_PR_JSON:?}\"" >"$TMP_DIR/fake-bin/gh"
chmod +x "$TMP_DIR/fake-bin/gh"
bad_base='{"repository":{"nameWithOwner":"sohoteam88/NextShift-OS-2.0"},"baseRefName":"wrong-base","headRefName":"test-task","headRefOid":"deadbeef","url":"https://github.com/sohoteam88/NextShift-OS-2.0/pull/99"}'
if PATH="$TMP_DIR/fake-bin:$PATH" FAKE_PR_JSON="$bad_base" TASK_BRANCH=test-task run --verify-pr E1 https://github.com/sohoteam88/NextShift-OS-2.0/pull/99 >/dev/null 2>&1; then fail "wrong PR base accepted"; fi
pass=$((pass + 1))
bad_head='{"repository":{"nameWithOwner":"sohoteam88/NextShift-OS-2.0"},"baseRefName":"planning/os-3.8-product-usability","headRefName":"test-task","headRefOid":"deadbeef","url":"https://github.com/sohoteam88/NextShift-OS-2.0/pull/99"}'
if PATH="$TMP_DIR/fake-bin:$PATH" FAKE_PR_JSON="$bad_head" TASK_BRANCH=test-task run --verify-pr E1 https://github.com/sohoteam88/NextShift-OS-2.0/pull/99 >/dev/null 2>&1; then fail "wrong PR head accepted"; fi
pass=$((pass + 1))

echo "PASS: $pass pipeline state assertions"
