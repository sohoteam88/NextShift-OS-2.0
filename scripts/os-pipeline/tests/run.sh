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
fresh() { cp "$SOURCE_MANIFEST" "$TMP_DIR/manifest.json"; }
run() { PIPELINE_TEST_MODE=1 "$PIPELINE_DIR/run-pipeline.sh" --manifest "$TMP_DIR/manifest.json" "$@"; }
action() { run --plan | jq -r '.action'; }
task() { run --plan | jq -r '.task // empty'; }
set_task() {
  local id="$1" status="$2" tmp="$TMP_DIR/state.json"
  jq --arg id "$id" --arg status "$status" '.waves |= map(.tasks |= map(if .id == $id then .status = $status else . end))' "$TMP_DIR/manifest.json" >"$tmp" && mv "$tmp" "$TMP_DIR/manifest.json"
}
set_checkpoint() {
  local id="$1" status="$2" tmp="$TMP_DIR/state.json"
  jq --arg id "$id" --arg status "$status" '.waves |= map(if .checkpoint.id == $id then .checkpoint.status = $status else . end)' "$TMP_DIR/manifest.json" >"$tmp" && mv "$tmp" "$TMP_DIR/manifest.json"
}
set_gate() {
  local id="$1" status="$2" tmp="$TMP_DIR/state.json"
  jq --arg id "$id" --arg status "$status" '.waves |= map(if .human_gate?.id == $id then .human_gate.status = $status else . end)' "$TMP_DIR/manifest.json" >"$tmp" && mv "$tmp" "$TMP_DIR/manifest.json"
}
complete_wave_tasks() { local wave="$1"; local id; while IFS= read -r id; do set_task "$id" completed; done < <(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .tasks[].id' "$TMP_DIR/manifest.json"); }

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

# Initial selection and restart-safe task transition.
fresh
assert_eq "$(task)" E1 "initial selection"
run --record-task-start E1
TASK_EVIDENCE_JSON='{"test":"E1"}' run --record-task-completed E1
assert_eq "$(task)" E2 "E1 completion unlocks E2"
if TASK_EVIDENCE_JSON='{}' run --record-task-completed E1 >/dev/null 2>&1; then fail "completed task repeated"; fi
assert_eq "$(task)" E2 "restart does not repeat E1"

# Wave end creates a human review wait; a PASS unlocks W2.
set_task E2 completed
assert_eq "$(action)" checkpoint "W1 completed requires checkpoint"
run --checkpoint
assert_eq "$(action)" awaiting_review "checkpoint blocks W2"
run --record-review-result AR-W1 PASS
assert_eq "$(task)" U1A "AR-W1 PASS unlocks U1A"

# W2 cannot unlock W3 without the explicit human IA decision.
complete_wave_tasks W2
set_checkpoint AR-W2 passed
assert_eq "$(action)" awaiting_human_gate "W2 requires STEVEN-IA"
run --record-steven-ia steven 2026-07-15T12:00:00Z
assert_eq "$(task)" U1B "approved STEVEN-IA unlocks W3"

# Remediation is bounded and never self-approves.
fresh
complete_wave_tasks W1
set_checkpoint AR-W1 awaiting_review
run --record-review-result AR-W1 CHANGES_REQUESTED
assert_eq "$(action)" remediation "changes requested selects remediation"
run --record-remediation-result AR-W1 FAIL
assert_eq "$(action)" remediation "one failed remediation remains available"
run --record-remediation-result AR-W1 FAIL
assert_eq "$(action)" needs_human "two failed remediations need human"

# The final audit runs only once after all human controls pass and never opens release.
fresh
complete_wave_tasks W1; complete_wave_tasks W2; complete_wave_tasks W3
set_checkpoint AR-W1 passed; set_checkpoint AR-W2 passed; set_checkpoint AR-W3 passed; set_gate STEVEN-IA approved
assert_eq "$(action)" final_audit "all waves select the final audit once"
run --record-final-audit PASS
assert_eq "$(action)" complete "final audit PASS completes state"
assert_eq "$(jq -r '.release_gate.status' "$TMP_DIR/manifest.json")" blocked "final audit cannot release"

echo "PASS: $pass pipeline state assertions"
