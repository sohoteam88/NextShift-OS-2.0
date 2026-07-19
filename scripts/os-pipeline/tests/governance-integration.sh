#!/usr/bin/env bash
# Group D real-Git fixtures: STEVEN-IA and final-audit state transactions.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PIPELINE="$ROOT/scripts/os-pipeline/run-pipeline.sh"
SOURCE_MANIFEST="$ROOT/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
MANIFEST_REL="docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
EXPECTED_REPOSITORY="fixture/NextShift-OS-2.0"
APPROVER="stevenmacmini"
APPROVED_AT="2026-07-15T12:00:00Z"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass() { printf 'PASS: %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "$3 (expected $2, got $1)"; }

write_fake_gh() {
  # The expansion below belongs to the generated fixture script.
  # shellcheck disable=SC2016
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\n" "$*" >>"${FIXTURE_GH_CALLS:?}"' \
    'exit 99' >"$BIN/gh"
  chmod +x "$BIN/gh"
}

reset_manifest() {
  local source="$1" target="$2"
  jq '
    .base_branch="planning" |
    .main_branch="main" |
    .waves |= map(if .id == "W3" then
      .tasks |= map(select(.id != "U3A" and .id != "U3ADR" and .id != "U3B")) |
      .tasks |= map(if .id == "E3A" then .depends_on = ["U3"] else . end)
    else . end) |
    .waves |= map(
      .status="pending" |
      .start_sha=null |
      .tasks |= map(.status="pending" | .verification=null | .evidence=null) |
      .checkpoint.status="pending" |
      .checkpoint.reviewed_sha=null |
      del(
        .checkpoint.requested_end_sha,
        .checkpoint.remediation_attempts,
        .checkpoint.active_remediation,
        .checkpoint.remediation_block
      ) |
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
    .release_gate.status="blocked" |
    .release_gate.auto_tag=false |
    .release_gate.auto_deploy=false
  ' "$source" >"$target"
}

write_approval_artifact() {
  local root="$1" reviewed_sha="$2" artifact_relative
  artifact_relative="$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approval_artifact' "$root/$MANIFEST_REL")"
  mkdir -p "$root/$(dirname "$artifact_relative")"
  printf '%s\n' \
    'GATE=STEVEN-IA' \
    'DECISION=APPROVED' \
    "APPROVER=$APPROVER" \
    "APPROVED_AT=$APPROVED_AT" \
    "AR_W2_REVIEWED_SHA=$reviewed_sha" >"$root/$artifact_relative"
}

seed_steven_ready() {
  local tmp="$SEED/manifest.tmp"
  jq --arg sha "$PRODUCT_SHA" '
    .waves |= map(
      if .id == "W1" or .id == "W2" then
        .status="completed" |
        .start_sha=$sha |
        .tasks |= map(
          .id as $task_id |
          .status="completed" |
          .verification={
            status:"passed",repository:"fixture/NextShift-OS-2.0",base_branch:"planning",
            task_branch:("fixture-" + $task_id),pr_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/1",
            verified_head_sha:$sha,implementation_report:"docs/fixture-task-report.md",
            dispatch_artifact:("docs/nextshift-os-3/os-3-8/runs/" + $task_id + "_DISPATCH.json"),
            report_exists_at_exact_head:true,report_in_pr_diff:true,checks:"passed",verified_at:"2026-07-15T12:00:00Z"
          } |
          .evidence={
            pr_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/1",
            merge_sha:$sha,
            implementation_report:"docs/fixture-task-report.md",
            verification:.verification,
            validation:{checks:"passed",head_sha:$sha},
            recovered:false,
            merged_at:"2026-07-15T12:00:00Z"
          }
        ) |
        .checkpoint.status="passed" |
        .checkpoint.requested_end_sha=$sha |
        .checkpoint.reviewed_sha=$sha
      else . end
    )
  ' "$SEED/$MANIFEST_REL" >"$tmp"
  mv "$tmp" "$SEED/$MANIFEST_REL"
}

seed_final_ready() {
  local tmp="$SEED/manifest.tmp"
  jq --arg sha "$PRODUCT_SHA" --arg approver "$APPROVER" --arg approved_at "$APPROVED_AT" '
    .waves |= map(
      .status="completed" |
      .start_sha=$sha |
      .tasks |= map(
        .id as $task_id |
        .status="completed" |
        .verification={
          status:"passed",repository:"fixture/NextShift-OS-2.0",base_branch:"planning",
          task_branch:("fixture-" + $task_id),pr_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/1",
          verified_head_sha:$sha,implementation_report:"docs/fixture-task-report.md",
          dispatch_artifact:("docs/nextshift-os-3/os-3-8/runs/" + $task_id + "_DISPATCH.json"),
          report_exists_at_exact_head:true,report_in_pr_diff:true,checks:"passed",verified_at:"2026-07-15T12:00:00Z"
        } |
        .evidence={
          pr_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/1",
          merge_sha:$sha,
          implementation_report:"docs/fixture-task-report.md",
          verification:.verification,
          validation:{checks:"passed",head_sha:$sha},
          recovered:false,
          merged_at:"2026-07-15T12:00:00Z"
        }
      ) |
      .checkpoint.status="passed" |
      .checkpoint.requested_end_sha=$sha |
      .checkpoint.reviewed_sha=$sha |
      if .human_gate then
        .human_gate.status="approved" |
        .human_gate.approved_by=$approver |
        .human_gate.approved_at=$approved_at |
        .human_gate.approved_reviewed_sha=$sha
      else . end
    ) |
    .final_audit.status="pending" |
    .final_audit.requested_product_sha=null |
    .final_audit.requested_at=null |
    .final_audit.reviewed_sha=null |
    .final_audit.completed_at=null |
    .release_gate.status="blocked"
  ' "$SEED/$MANIFEST_REL" >"$tmp"
  mv "$tmp" "$SEED/$MANIFEST_REL"
  write_approval_artifact "$SEED" "$PRODUCT_SHA"
}

create_case() {
  local name="$1" stage="$2"
  CASE_DIR="$TMP/$name"
  REMOTE="$CASE_DIR/origin.git"
  SEED="$CASE_DIR/seed"
  STATE="$CASE_DIR/state"
  CONTROL="$CASE_DIR/control"
  BIN="$CASE_DIR/bin"
  GH_CALLS="$CASE_DIR/gh-calls.log"
  MANIFEST="$STATE/$MANIFEST_REL"
  mkdir -p "$CASE_DIR" "$BIN" "$CONTROL"
  : >"$GH_CALLS"

  git init --bare "$REMOTE" >/dev/null
  git init -b planning "$SEED" >/dev/null
  git -C "$SEED" config user.email fixture@example.test
  git -C "$SEED" config user.name fixture
  mkdir -p "$SEED/$(dirname "$MANIFEST_REL")" "$SEED/src"
  reset_manifest "$SOURCE_MANIFEST" "$SEED/$MANIFEST_REL"
  printf 'fixture product baseline\n' >"$SEED/src/fixture-product.txt"
  git -C "$SEED" add .
  git -C "$SEED" commit -m 'fixture product baseline' >/dev/null
  PRODUCT_SHA="$(git -C "$SEED" rev-parse HEAD)"

  case "$stage" in
    steven) seed_steven_ready ;;
    final)
      seed_final_ready
      mkdir -p "$SEED/scripts/os-pipeline"
      printf '# reviewed Pipeline change after the final wave checkpoint\n' >"$SEED/scripts/os-pipeline/fixture-reviewed-change.sh"
      ;;
    *) fail "unknown fixture stage: $stage" ;;
  esac
  git -C "$SEED" add .
  git -C "$SEED" commit -m "fixture $stage governance state" >/dev/null
  PRE_REQUEST_SHA="$(git -C "$SEED" rev-parse HEAD)"
  git -C "$SEED" remote add origin "$REMOTE"
  git -C "$SEED" push -u origin planning >/dev/null

  git clone -b planning "$REMOTE" "$STATE" >/dev/null
  git -C "$STATE" config user.email fixture@example.test
  git -C "$STATE" config user.name fixture
  write_fake_gh
  APPROVAL_REL="$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approval_artifact' "$MANIFEST")"
  REQUEST_REL="$(jq -r '.final_audit.request' "$MANIFEST")"
  REPORT_REL="$(jq -r '.final_audit.report' "$MANIFEST")"
}

pipeline() {
  PATH="$BIN:$PATH" \
  FIXTURE_GH_CALLS="$GH_CALLS" \
  PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 \
  PIPELINE_EXPECTED_REPOSITORY="$EXPECTED_REPOSITORY" \
  REPO_DIR="$STATE" \
  MANIFEST_PATH="$MANIFEST" \
  CONTROL_ROOT="$CONTROL" \
  "$PIPELINE" "$@"
}

assert_atomic_commit() {
  local before="$1" message="$2" actual expected
  shift 2
  assert_eq "$(git -C "$STATE" rev-parse HEAD^)" "$before" "$message parent"
  actual="$(git -C "$STATE" diff-tree --no-commit-id --name-only -r HEAD | LC_ALL=C sort)"
  expected="$(printf '%s\n' "$@" | LC_ALL=C sort)"
  assert_eq "$actual" "$expected" "$message paths"
}

assert_synced_clean() {
  local local_head tracking_head bare_head counts lock_dir
  local_head="$(git -C "$STATE" rev-parse HEAD)"
  tracking_head="$(git -C "$STATE" rev-parse origin/planning)"
  bare_head="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  counts="$(git -C "$STATE" rev-list --left-right --count 'origin/planning...HEAD')"
  assert_eq "$local_head" "$tracking_head" 'local/tracking planning synchronization'
  assert_eq "$local_head" "$bare_head" 'local/bare planning synchronization'
  assert_eq "$counts" $'0\t0' 'planning ahead/behind'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'fixture state worktree is dirty'
  lock_dir="$(git -C "$STATE" rev-parse --git-common-dir)/os-pipeline-state.lock"
  [[ "$lock_dir" = /* ]] || lock_dir="$STATE/$lock_dir"
  [[ ! -e "$lock_dir" ]] || fail 'state transaction lock was not released'
}

assert_no_release_side_effects() {
  local tags
  [[ ! -s "$GH_CALLS" ]] || fail 'Final Audit contract invoked gh/release operations'
  tags="$(git --git-dir="$REMOTE" for-each-ref --format='%(refname)' refs/tags)"
  [[ -z "$tags" ]] || fail 'Final Audit contract created a tag'
  if git --git-dir="$REMOTE" show-ref --verify --quiet refs/heads/main; then
    fail 'Final Audit contract changed or created main'
  fi
}

snapshot_rejected_request() {
  REJECTED_LOCAL_HEAD="$(git -C "$STATE" rev-parse HEAD)"
  REJECTED_REMOTE_HEAD="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  REJECTED_MANIFEST_SHA="$(shasum -a 256 "$MANIFEST" | awk '{print $1}')"
  [[ ! -e "$STATE/$REQUEST_REL" ]] || fail 'rejected-request fixture began with a request artifact'
}

assert_rejected_request_unchanged() {
  assert_eq "$(shasum -a 256 "$MANIFEST" | awk '{print $1}')" "$REJECTED_MANIFEST_SHA" 'rejected request Manifest bytes'
  [[ ! -e "$STATE/$REQUEST_REL" ]] || fail 'rejected request left a request artifact'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$REJECTED_LOCAL_HEAD" 'rejected request local HEAD'
  assert_eq "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" "$REJECTED_REMOTE_HEAD" 'rejected request remote HEAD'
  assert_synced_clean
  assert_no_release_side_effects
}

assert_rejected_result_unchanged() {
  local before_head="$1" before_manifest_sha="$2" before_request_sha="$3"
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before_head" 'rejected result local HEAD'
  assert_eq "$(shasum -a 256 "$MANIFEST" | awk '{print $1}')" "$before_manifest_sha" 'rejected result Manifest bytes'
  assert_eq "$(shasum -a 256 "$STATE/$REQUEST_REL" | awk '{print $1}')" "$before_request_sha" 'rejected result request artifact bytes'
  [[ ! -e "$STATE/$REPORT_REL" ]] || fail 'rejected result created the canonical report'
  assert_synced_clean
  assert_no_release_side_effects
}

write_audit_result() {
  local target="$1" verdict="$2" sha="$3"
  [[ "$target" != "$STATE" && "$target" != "$STATE/"* ]] || fail 'audit source is inside the repository'
  printf 'VERDICT=%s\nREVIEWED_SHA=%s\n' "$verdict" "$sha" >"$target"
}

request_final_audit() {
  pipeline --cycle >"$CONTROL/request.log" 2>&1 || {
    sed -n '1,240p' "$CONTROL/request.log" >&2
    fail 'final audit request cycle failed'
  }
  assert_eq "$(jq -r '.final_audit.status' "$MANIFEST")" running 'final audit request status'
}

fixture_steven_ia_transaction() {
  local before artifact expected
  create_case steven_ia_transaction steven
  before="$(git -C "$STATE" rev-parse HEAD)"
  pipeline --record-steven-ia "$APPROVER" "$APPROVED_AT" >"$CONTROL/approval.log" 2>&1 || {
    sed -n '1,200p' "$CONTROL/approval.log" >&2
    fail 'STEVEN-IA approval transaction failed'
  }
  artifact="$STATE/$APPROVAL_REL"
  expected="$(printf '%s\n' \
    'GATE=STEVEN-IA' \
    'DECISION=APPROVED' \
    "APPROVER=$APPROVER" \
    "APPROVED_AT=$APPROVED_AT" \
    "AR_W2_REVIEWED_SHA=$PRODUCT_SHA")"
  assert_eq "$(cat "$artifact")" "$expected" 'canonical STEVEN-IA approval artifact'
  assert_eq "$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.status' "$MANIFEST")" approved 'STEVEN-IA status'
  assert_eq "$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approved_by' "$MANIFEST")" "$APPROVER" 'STEVEN-IA approver'
  assert_eq "$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approved_at' "$MANIFEST")" "$APPROVED_AT" 'STEVEN-IA timestamp'
  assert_eq "$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approved_reviewed_sha' "$MANIFEST")" "$PRODUCT_SHA" 'STEVEN-IA reviewed SHA'
  assert_atomic_commit "$before" 'STEVEN-IA atomic transaction' "$MANIFEST_REL" "$APPROVAL_REL"
  assert_synced_clean
  pass steven_ia_transaction
}

fixture_steven_ia_duplicate_rejected() {
  local approved_head artifact_hash rc
  create_case steven_ia_duplicate_rejected steven
  pipeline --record-steven-ia "$APPROVER" "$APPROVED_AT" >/dev/null 2>&1 || fail 'initial STEVEN-IA approval failed'
  approved_head="$(git -C "$STATE" rev-parse HEAD)"
  artifact_hash="$(shasum -a 256 "$STATE/$APPROVAL_REL" | awk '{print $1}')"
  pipeline --record-steven-ia "$APPROVER" "$APPROVED_AT" >"$CONTROL/identical.log" 2>&1 || fail 'identical STEVEN-IA replay was not idempotent'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$approved_head" 'identical approval replay commit'
  assert_eq "$(shasum -a 256 "$STATE/$APPROVAL_REL" | awk '{print $1}')" "$artifact_hash" 'identical approval replay artifact'

  set +e
  pipeline --record-steven-ia different-approver 2026-07-15T12:01:00Z >"$CONTROL/conflict.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'conflicting STEVEN-IA approval was accepted'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$approved_head" 'conflicting approval commit'
  assert_eq "$(shasum -a 256 "$STATE/$APPROVAL_REL" | awk '{print $1}')" "$artifact_hash" 'conflicting approval artifact'
  assert_synced_clean
  pass steven_ia_duplicate_rejected
}

fixture_final_audit_request_once() {
  local before requested_head request_hash request_commits
  create_case final_audit_request_once final
  before="$(git -C "$STATE" rev-parse HEAD)"
  request_final_audit
  requested_head="$(git -C "$STATE" rev-parse HEAD)"
  assert_eq "$(jq -r '.final_audit.requested_product_sha' "$MANIFEST")" "$PRE_REQUEST_SHA" 'final audit requested product SHA'
  grep -Fqx "LAST_CHECKPOINT_REVIEWED_SHA=$PRODUCT_SHA" "$STATE/$REQUEST_REL" || fail 'final audit request has the wrong checkpoint SHA'
  grep -Fqx "REQUESTED_PRODUCT_SHA=$PRE_REQUEST_SHA" "$STATE/$REQUEST_REL" || fail 'final audit request has the wrong planning SHA'
  assert_atomic_commit "$before" 'final audit request atomic transaction' "$MANIFEST_REL" "$REQUEST_REL"
  request_hash="$(shasum -a 256 "$STATE/$REQUEST_REL" | awk '{print $1}')"
  pipeline --cycle >"$CONTROL/restart.log" 2>&1 || fail 'running final audit did not cleanly wait'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$requested_head" 'duplicate final audit request commit'
  assert_eq "$(shasum -a 256 "$STATE/$REQUEST_REL" | awk '{print $1}')" "$request_hash" 'duplicate final audit request artifact'
  request_commits="$(git -C "$STATE" log --format='%H' --grep='^chore(pipeline): request OS 3.8 final audit$' | wc -l | tr -d ' ')"
  assert_eq "$request_commits" 1 'final audit request commit count'
  assert_synced_clean
  pass final_audit_request_once
}

fixture_final_audit_running_clean_wait() {
  local before action
  create_case final_audit_running_clean_wait final
  request_final_audit
  before="$(git -C "$STATE" rev-parse HEAD)"
  action="$(pipeline --plan | jq -r '.action')"
  assert_eq "$action" awaiting_final_audit 'running final audit action'
  pipeline --cycle >"$CONTROL/wait.log" 2>&1 || fail 'awaiting final audit cycle failed'
  grep -Fq 'clean stop: awaiting_final_audit' "$CONTROL/wait.log" || fail 'running final audit did not report a clean wait'
  assert_eq "$(jq -r '.final_audit.status' "$MANIFEST")" running 'running final audit status after restart'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'running final audit restart commit'
  assert_synced_clean
  pass final_audit_running_clean_wait
}

fixture_final_audit_pass_persistence() {
  local before result report_hash passed_head conflict rc
  create_case final_audit_pass_persistence final
  request_final_audit
  result="$CONTROL/final-pass.md"
  write_audit_result "$result" PASS "$PRE_REQUEST_SHA"
  before="$(git -C "$STATE" rev-parse HEAD)"
  pipeline --record-final-audit PASS "$result" >"$CONTROL/pass.log" 2>&1 || {
    sed -n '1,200p' "$CONTROL/pass.log" >&2
    fail 'final audit PASS transaction failed'
  }
  assert_eq "$(jq -r '.final_audit.status' "$MANIFEST")" pass 'persisted final audit status'
  assert_eq "$(jq -r '.final_audit.reviewed_sha' "$MANIFEST")" "$PRE_REQUEST_SHA" 'persisted final audit reviewed SHA'
  assert_eq "$(jq -r '.release_gate.status' "$MANIFEST")" blocked 'release gate after final audit PASS'
  assert_eq "$(shasum -a 256 "$STATE/$REPORT_REL" | awk '{print $1}')" "$(shasum -a 256 "$result" | awk '{print $1}')" 'canonical final audit report'
  assert_atomic_commit "$before" 'final audit result atomic transaction' "$MANIFEST_REL" "$REPORT_REL"
  passed_head="$(git -C "$STATE" rev-parse HEAD)"
  report_hash="$(shasum -a 256 "$STATE/$REPORT_REL" | awk '{print $1}')"
  pipeline --record-final-audit PASS "$result" >"$CONTROL/identical-result.log" 2>&1 || fail 'identical final audit replay was not idempotent'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$passed_head" 'identical final audit replay commit'

  conflict="$CONTROL/final-pass-conflict.md"
  write_audit_result "$conflict" PASS "$PRE_REQUEST_SHA"
  printf 'DETAIL=conflicting-content\n' >>"$conflict"
  set +e
  pipeline --record-final-audit PASS "$conflict" >"$CONTROL/conflicting-result.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'different terminal audit result overwrote the canonical report'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$passed_head" 'different final audit result commit'
  assert_eq "$(shasum -a 256 "$STATE/$REPORT_REL" | awk '{print $1}')" "$report_hash" 'different final audit result report'
  assert_synced_clean
  pass final_audit_pass_persistence
}

fixture_final_audit_wrong_sha_rejected() {
  local before result conditional rc wrong_sha
  create_case final_audit_wrong_sha_rejected final
  request_final_audit
  before="$(git -C "$STATE" rev-parse HEAD)"
  wrong_sha="0000000000000000000000000000000000000000"
  [[ "$wrong_sha" != "$PRE_REQUEST_SHA" ]] || wrong_sha="1111111111111111111111111111111111111111"
  result="$CONTROL/final-wrong-sha.md"
  write_audit_result "$result" PASS "$wrong_sha"
  set +e
  pipeline --record-final-audit PASS "$result" >"$CONTROL/wrong-sha.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'wrong final audit reviewed SHA was accepted'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'wrong-SHA audit result commit'
  assert_eq "$(jq -r '.final_audit.status' "$MANIFEST")" running 'wrong-SHA audit status'
  [[ ! -e "$STATE/$REPORT_REL" ]] || fail 'wrong-SHA audit result created the canonical report'

  conditional="$CONTROL/final-conditional.md"
  write_audit_result "$conditional" PASS_WITH_CONDITION "$PRODUCT_SHA"
  set +e
  pipeline --record-final-audit PASS_WITH_CONDITION "$conditional" >"$CONTROL/conditional.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'PASS_WITH_CONDITION was accepted as PASS'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'conditional audit result commit'
  assert_synced_clean
  pass final_audit_wrong_sha_rejected
}

fixture_final_audit_product_change_rejected() {
  local before result rc
  create_case final_audit_product_change_rejected final
  request_final_audit
  printf 'unauthorized post-review product change\n' >>"$STATE/src/fixture-product.txt"
  git -C "$STATE" add src/fixture-product.txt
  git -C "$STATE" commit -m 'fixture unauthorized post-review product change' >/dev/null
  git -C "$STATE" push origin planning >/dev/null
  before="$(git -C "$STATE" rev-parse HEAD)"
  result="$CONTROL/final-stale.md"
  write_audit_result "$result" PASS "$PRE_REQUEST_SHA"
  set +e
  pipeline --record-final-audit PASS "$result" >"$CONTROL/stale.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'final audit accepted a post-request product change'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'stale final audit result commit'
  assert_eq "$(jq -r '.final_audit.status' "$MANIFEST")" running 'stale final audit status'
  [[ ! -e "$STATE/$REPORT_REL" ]] || fail 'stale final audit result created the canonical report'
  grep -Fq 'repository state changed after the canonical request commit' "$CONTROL/stale.log" || fail 'stale final audit rejection did not identify post-request change'
  assert_synced_clean
  pass final_audit_product_change_rejected
}

fixture_final_audit_cannot_release() {
  local result completed_head action tags
  create_case final_audit_cannot_release final
  request_final_audit
  result="$CONTROL/final-pass.md"
  write_audit_result "$result" PASS "$PRE_REQUEST_SHA"
  pipeline --record-final-audit PASS "$result" >/dev/null 2>&1 || fail 'final audit PASS failed in release-gate fixture'
  completed_head="$(git -C "$STATE" rev-parse HEAD)"
  assert_eq "$(jq -r '.release_gate.status' "$MANIFEST")" blocked 'release gate terminal status'
  assert_eq "$(jq -r '.release_gate.auto_tag' "$MANIFEST")" false 'release gate auto_tag'
  assert_eq "$(jq -r '.release_gate.auto_deploy' "$MANIFEST")" false 'release gate auto_deploy'
  action="$(pipeline --plan | jq -r '.action')"
  assert_eq "$action" complete 'post-audit pipeline action'
  pipeline --cycle >"$CONTROL/complete.log" 2>&1 || fail 'complete pipeline state did not stop cleanly'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$completed_head" 'post-audit cycle commit'
  [[ ! -s "$GH_CALLS" ]] || fail 'final audit transaction invoked gh/release operations'
  tags="$(git --git-dir="$REMOTE" for-each-ref --format='%(refname)' refs/tags)"
  [[ -z "$tags" ]] || fail 'final audit transaction created a tag'
  if git --git-dir="$REMOTE" show-ref --verify --quiet refs/heads/main; then
    fail 'final audit transaction changed or created main'
  fi
  assert_synced_clean
  pass final_audit_cannot_release
}

fixture_final_audit_targets_current_planning_head() {
  local before
  create_case final_audit_targets_current_planning_head final
  before="$(git -C "$STATE" rev-parse HEAD)"
  request_final_audit
  assert_eq "$before" "$PRE_REQUEST_SHA" 'pre-request synchronized planning HEAD'
  assert_eq "$(jq -r '.final_audit.requested_product_sha' "$MANIFEST")" "$before" 'current planning HEAD audit target'
  grep -Fqx "REQUESTED_PRODUCT_SHA=$before" "$STATE/$REQUEST_REL" || fail 'request does not target current planning HEAD'
  assert_synced_clean
  pass final_audit_targets_current_planning_head
}

fixture_final_audit_checkpoint_sha_must_be_ancestor() {
  local tree unrelated tmp rc
  create_case final_audit_checkpoint_sha_must_be_ancestor final
  tree="$(git -C "$STATE" write-tree)"
  unrelated="$(printf 'fixture unrelated checkpoint\n' | git -C "$STATE" commit-tree "$tree")"
  tmp="$CONTROL/non-ancestor-manifest.json"
  jq --arg sha "$unrelated" '
    .waves |= map(
      .checkpoint.requested_end_sha=$sha |
      .checkpoint.reviewed_sha=$sha |
      if .human_gate then .human_gate.approved_reviewed_sha=$sha else . end
    )
  ' "$MANIFEST" >"$tmp"
  mv "$tmp" "$MANIFEST"
  sed -i.bak "s/^AR_W2_REVIEWED_SHA=.*/AR_W2_REVIEWED_SHA=$unrelated/" "$STATE/$APPROVAL_REL"
  rm -f "$STATE/$APPROVAL_REL.bak"
  git -C "$STATE" add "$MANIFEST_REL" "$APPROVAL_REL"
  git -C "$STATE" commit -m 'fixture non-ancestor checkpoint' >/dev/null
  git -C "$STATE" push origin planning >/dev/null
  snapshot_rejected_request
  set +e
  pipeline --cycle >"$CONTROL/non-ancestor.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'non-ancestor checkpoint SHA was accepted'
  grep -Fq 'checkpoint reviewed SHA is not an ancestor' "$CONTROL/non-ancestor.log" || fail 'non-ancestor rejection reason missing'
  assert_rejected_request_unchanged
  pass final_audit_checkpoint_sha_must_be_ancestor
}

fixture_final_audit_includes_reviewed_pipeline_changes_after_checkpoint() {
  create_case final_audit_includes_reviewed_pipeline_changes_after_checkpoint final
  git -C "$STATE" diff --name-only "$PRODUCT_SHA...$PRE_REQUEST_SHA" | grep -Fqx 'scripts/os-pipeline/fixture-reviewed-change.sh' ||
    fail 'fixture does not include a reviewed Pipeline change after checkpoint'
  request_final_audit
  assert_eq "$(jq -r '.final_audit.requested_product_sha' "$MANIFEST")" "$PRE_REQUEST_SHA" 'Pipeline-inclusive audit target'
  [[ "$PRE_REQUEST_SHA" != "$PRODUCT_SHA" ]] || fail 'Final Audit target incorrectly equals last checkpoint SHA'
  assert_synced_clean
  pass final_audit_includes_reviewed_pipeline_changes_after_checkpoint
}

fixture_final_audit_request_sha_matches_pre_request_head() {
  local before
  create_case final_audit_request_sha_matches_pre_request_head final
  before="$(git -C "$STATE" rev-parse HEAD)"
  request_final_audit
  assert_eq "$(jq -r '.final_audit.requested_product_sha' "$MANIFEST")" "$before" 'Manifest pre-request HEAD binding'
  grep -Fqx "REQUESTED_PRODUCT_SHA=$before" "$STATE/$REQUEST_REL" || fail 'request artifact pre-request HEAD binding mismatch'
  assert_synced_clean
  pass final_audit_request_sha_matches_pre_request_head
}

fixture_final_audit_request_commit_not_part_of_requested_sha() {
  local before request_commit
  create_case final_audit_request_commit_not_part_of_requested_sha final
  before="$(git -C "$STATE" rev-parse HEAD)"
  request_final_audit
  request_commit="$(git -C "$STATE" rev-parse HEAD)"
  [[ "$request_commit" != "$before" ]] || fail 'Final Audit request did not create its state commit'
  assert_eq "$(git -C "$STATE" rev-parse "$request_commit^")" "$before" 'request commit parent'
  assert_eq "$(jq -r '.final_audit.requested_product_sha' "$MANIFEST")" "$before" 'request commit exclusion from target'
  assert_synced_clean
  pass final_audit_request_commit_not_part_of_requested_sha
}

fixture_final_audit_result_must_match_requested_planning_sha() {
  local before before_manifest before_request result rc
  create_case final_audit_result_must_match_requested_planning_sha final
  request_final_audit
  before="$(git -C "$STATE" rev-parse HEAD)"
  before_manifest="$(shasum -a 256 "$MANIFEST" | awk '{print $1}')"
  before_request="$(shasum -a 256 "$STATE/$REQUEST_REL" | awk '{print $1}')"
  result="$CONTROL/checkpoint-sha-result.md"
  write_audit_result "$result" PASS "$PRODUCT_SHA"
  set +e
  pipeline --record-final-audit PASS "$result" >"$CONTROL/checkpoint-result.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'last checkpoint SHA was accepted instead of requested planning SHA'
  assert_rejected_result_unchanged "$before" "$before_manifest" "$before_request"
  pass final_audit_result_must_match_requested_planning_sha
}

fixture_final_audit_code_change_after_request_rejected() {
  local before before_manifest before_request result rc
  create_case final_audit_code_change_after_request_rejected final
  request_final_audit
  printf 'post-request code drift\n' >>"$STATE/src/fixture-product.txt"
  git -C "$STATE" add src/fixture-product.txt
  git -C "$STATE" commit -m 'fixture post-request code drift' >/dev/null
  git -C "$STATE" push origin planning >/dev/null
  before="$(git -C "$STATE" rev-parse HEAD)"
  before_manifest="$(shasum -a 256 "$MANIFEST" | awk '{print $1}')"
  before_request="$(shasum -a 256 "$STATE/$REQUEST_REL" | awk '{print $1}')"
  result="$CONTROL/post-request-drift-result.md"
  write_audit_result "$result" PASS "$PRE_REQUEST_SHA"
  set +e
  pipeline --record-final-audit PASS "$result" >"$CONTROL/post-request-drift.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'post-request code change was accepted'
  assert_rejected_result_unchanged "$before" "$before_manifest" "$before_request"
  pass final_audit_code_change_after_request_rejected
}

fixture_final_audit_request_duplicate_clean_stop_or_rejected_without_mutation() {
  local before manifest_sha request_sha
  create_case final_audit_request_duplicate_clean_stop_or_rejected_without_mutation final
  request_final_audit
  before="$(git -C "$STATE" rev-parse HEAD)"
  manifest_sha="$(shasum -a 256 "$MANIFEST" | awk '{print $1}')"
  request_sha="$(shasum -a 256 "$STATE/$REQUEST_REL" | awk '{print $1}')"
  pipeline --cycle >"$CONTROL/duplicate-request.log" 2>&1 || fail 'duplicate request did not cleanly stop'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'duplicate request HEAD'
  assert_eq "$(shasum -a 256 "$MANIFEST" | awk '{print $1}')" "$manifest_sha" 'duplicate request Manifest bytes'
  assert_eq "$(shasum -a 256 "$STATE/$REQUEST_REL" | awk '{print $1}')" "$request_sha" 'duplicate request artifact bytes'
  assert_synced_clean
  assert_no_release_side_effects
  pass final_audit_request_duplicate_clean_stop_or_rejected_without_mutation
}

fixture_final_audit_request_push_failure_rolls_back() {
  local rc
  create_case final_audit_request_push_failure_rolls_back final
  cat >"$REMOTE/hooks/pre-receive" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
  chmod +x "$REMOTE/hooks/pre-receive"
  snapshot_rejected_request
  set +e
  pipeline --cycle >"$CONTROL/push-failure.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'Final Audit request push failure was accepted'
  grep -Fq 'state push failed before remote advancement' "$CONTROL/push-failure.log" || fail 'push failure did not fail closed'
  assert_rejected_request_unchanged
  pass final_audit_request_push_failure_rolls_back
}

fixture_final_audit_request_keeps_release_gate_blocked() {
  create_case final_audit_request_keeps_release_gate_blocked final
  request_final_audit
  assert_eq "$(jq -r '.release_gate.status' "$MANIFEST")" blocked 'release gate after Final Audit request'
  assert_eq "$(jq -r '.release_gate.auto_tag' "$MANIFEST")" false 'auto tag after Final Audit request'
  assert_eq "$(jq -r '.release_gate.auto_deploy' "$MANIFEST")" false 'auto deploy after Final Audit request'
  assert_no_release_side_effects
  assert_synced_clean
  pass final_audit_request_keeps_release_gate_blocked
}

fixture_steven_ia_transaction
fixture_steven_ia_duplicate_rejected
fixture_final_audit_request_once
fixture_final_audit_running_clean_wait
fixture_final_audit_pass_persistence
fixture_final_audit_wrong_sha_rejected
fixture_final_audit_product_change_rejected
fixture_final_audit_cannot_release
fixture_final_audit_targets_current_planning_head
fixture_final_audit_checkpoint_sha_must_be_ancestor
fixture_final_audit_includes_reviewed_pipeline_changes_after_checkpoint
fixture_final_audit_request_sha_matches_pre_request_head
fixture_final_audit_request_commit_not_part_of_requested_sha
fixture_final_audit_result_must_match_requested_planning_sha
fixture_final_audit_code_change_after_request_rejected
fixture_final_audit_request_duplicate_clean_stop_or_rejected_without_mutation
fixture_final_audit_request_push_failure_rolls_back
fixture_final_audit_request_keeps_release_gate_blocked
printf 'PASS: 18 Group D governance real-Git fixtures\n'
