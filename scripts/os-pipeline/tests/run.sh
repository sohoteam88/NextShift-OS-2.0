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
valid_evidence() { jq -n --arg n "${1:-1}" '{pr_url:("https://github.com/sohoteam88/NextShift-OS-2.0/pull/" + $n),merge_sha:"0123456789012345678901234567890123456789",implementation_report:"docs/report.md",validation:{checks:"passed"}}'; }
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
assert_eq "$(task)" U1B "approved STEVEN-IA unlocks W3"

# Remediation is bounded and never self-approves.
fresh
complete_wave_tasks W1
set_checkpoint AR-W1 awaiting_review
jq '.waves |= map(if .checkpoint.id == "AR-W1" then .checkpoint.requested_end_sha="0123456789012345678901234567890123456789" else . end)' "$TMP_DIR/manifest.json" >"$TMP_DIR/state.json" && mv "$TMP_DIR/state.json" "$TMP_DIR/manifest.json"
review_result CHANGES_REQUESTED
run --record-review-result AR-W1 CHANGES_REQUESTED "$TMP_DIR/review-result.md"
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
mkdir -p "$TMP_DIR/audit"
printf 'VERDICT=PASS\nREVIEWED_SHA=0123456789012345678901234567890123456789\n' >"$TMP_DIR/audit/OS38_FINAL_CODE_REVIEW_REPORT.md"
jq --arg report "$TMP_DIR/audit/OS38_FINAL_CODE_REVIEW_REPORT.md" '.final_audit.report=$report | .waves |= map(if .checkpoint.id == "AR-W3" then .checkpoint.reviewed_sha="0123456789012345678901234567890123456789" else . end)' "$TMP_DIR/manifest.json" >"$TMP_DIR/state.json" && mv "$TMP_DIR/state.json" "$TMP_DIR/manifest.json"
run --record-final-audit PASS
assert_eq "$(action)" complete "final audit PASS completes state"
assert_eq "$(jq -r '.release_gate.status' "$TMP_DIR/manifest.json")" blocked "final audit cannot release"
fresh
complete_wave_tasks W1; complete_wave_tasks W2; complete_wave_tasks W3
set_checkpoint AR-W1 passed; set_checkpoint AR-W2 passed; set_checkpoint AR-W3 passed; set_gate STEVEN-IA approved
if run --record-final-audit PASS >/dev/null 2>&1; then fail "final audit PASS without report accepted"; fi
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
if PATH="$TMP_DIR/fake-bin:$PATH" FAKE_PR_JSON="$bad_base" TASK_BRANCH=test-task run --verify-pr https://github.com/sohoteam88/NextShift-OS-2.0/pull/99 >/dev/null 2>&1; then fail "wrong PR base accepted"; fi
pass=$((pass + 1))
bad_head='{"repository":{"nameWithOwner":"sohoteam88/NextShift-OS-2.0"},"baseRefName":"planning/os-3.8-product-usability","headRefName":"test-task","headRefOid":"deadbeef","url":"https://github.com/sohoteam88/NextShift-OS-2.0/pull/99"}'
if PATH="$TMP_DIR/fake-bin:$PATH" FAKE_PR_JSON="$bad_head" TASK_BRANCH=test-task run --verify-pr https://github.com/sohoteam88/NextShift-OS-2.0/pull/99 >/dev/null 2>&1; then fail "wrong PR head accepted"; fi
pass=$((pass + 1))

echo "PASS: $pass pipeline state assertions"
