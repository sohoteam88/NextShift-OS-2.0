#!/usr/bin/env bash
# Round 5 real-Git safety fixtures: normal-task recovery, sync gates, locks, and injection safety.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PIPELINE="$ROOT/scripts/os-pipeline/run-pipeline.sh"
SOURCE_MANIFEST="$ROOT/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
MANIFEST_REL="docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
REQUEST_REL="docs/nextshift-os-3/os-3-8/reviews/W1_ARCHITECTURE_REVIEW_REQUEST.md"
RESULT_REL="docs/nextshift-os-3/os-3-8/reviews/W1_ARCHITECTURE_REVIEW_RESULT.md"
EXPECTED_REPOSITORY="fixture/NextShift-OS-2.0"
PR_URL="https://github.com/sohoteam88/NextShift-OS-2.0/pull/1"
REAL_GIT="$(command -v git)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass_count=0
pass() { printf 'PASS: %s\n' "$1"; pass_count=$((pass_count + 1)); }
fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "$3 (expected: $2; got: $1)"; }
assert_file_absent() { [[ ! -e "$1" ]] || fail "$2"; }

reset_manifest() {
  local source="$1" target="$2"
  jq '
    .base_branch="planning" |
    .main_branch="main" |
    .waves |= map(
      .status="pending" |
      .start_sha=null |
      .tasks |= map(.status="pending" | .evidence=null | .verification=null) |
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

seed_checkpoint_ready() {
  local tmp_manifest="$SEED/manifest.tmp"
  mkdir -p "$SEED/docs/fixture"
  printf 'fixture implementation report\n' >"$SEED/docs/fixture/task-report.md"
  jq --arg sha "$BASELINE_SHA" '
    .waves[0].status="completed" |
    .waves[0].start_sha=$sha |
    .waves[0].tasks |= to_entries | .waves[0].tasks |= map(
      .key as $index | .value |
      .id as $id |
      ("https://github.com/sohoteam88/NextShift-OS-2.0/pull/" + (($index + 10) | tostring)) as $pr |
      ("docs/nextshift-os-3/os-3-8/runs/" + $id + "_DISPATCH.json") as $dispatch |
      {
        id:.id,
        title:.title,
        blueprint_section:.blueprint_section,
        contract:.contract,
        execution_task:.execution_task,
        depends_on:.depends_on,
        status:"completed",
        verification:{
          status:"passed",repository:"fixture/NextShift-OS-2.0",base_branch:"planning",
          task_branch:("fixture-" + ($id | ascii_downcase)),pr_url:$pr,
          verified_head_sha:$sha,implementation_report:"docs/fixture/task-report.md",
          dispatch_artifact:$dispatch,report_exists_at_exact_head:true,
          report_in_pr_diff:true,checks:"passed",verified_at:"2026-07-15T12:00:00Z"
        }
      } |
      .evidence={
        pr_url:.verification.pr_url,merge_sha:$sha,
        implementation_report:.verification.implementation_report,
        verification:.verification,validation:{checks:"passed",head_sha:$sha},
        recovered:false,merged_at:"2026-07-15T12:01:00Z"
      }
    ) |
    .waves[0].checkpoint.status="pending" |
    .waves[0].checkpoint.reviewed_sha=null |
    del(
      .waves[0].checkpoint.requested_end_sha,
      .waves[0].checkpoint.remediation_attempts,
      .waves[0].checkpoint.active_remediation,
      .waves[0].checkpoint.remediation_block
    )
  ' "$SEED/$MANIFEST_REL" >"$tmp_manifest"
  mv "$tmp_manifest" "$SEED/$MANIFEST_REL"
}

write_fake_tools() {
  cat >"$BIN/codex-fixture" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "${PIPELINE_TASK_ID:?}" >>"${FIXTURE_CODEX_CALLS:?}"
git config user.email fixture@example.test
git config user.name fixture
report="${FIXTURE_REPORT_PATH:-docs/nextshift-os-3/os-3-8/reports/${PIPELINE_TASK_ID}.md}"
mkdir -p "$(dirname "$report")"
printf 'fixture implementation report for %s\n' "$PIPELINE_TASK_ID" >"$report"
git add -- "$report"
git commit -m "fixture task $PIPELINE_TASK_ID" >/dev/null
git push -u origin "$PIPELINE_TASK_BRANCH" >/dev/null
head_sha="$(git rev-parse HEAD)"
git --git-dir="${FIXTURE_REMOTE:?}" update-ref refs/pull/1/head "$head_sha"
jq -n \
  --arg state OPEN \
  --arg repo "${PIPELINE_EXPECTED_REPOSITORY:?}" \
  --arg base planning \
  --arg head "$PIPELINE_TASK_BRANCH" \
  --arg oid "$head_sha" \
  --arg url "${FIXTURE_PR_URL:?}" \
  --arg report "$report" \
  '{state:$state,repository:$repo,baseRefName:$base,headRefName:$head,headRefOid:$oid,
    mergeCommit:{oid:""},url:$url,body:("Implementation-Report: " + $report),
    report:$report,changed_files:[$report],checks:"passed"}' >"${FIXTURE_PR_FILE:?}"
jq -n --arg pr "${FIXTURE_PR_URL:?}" --arg report "$report" \
  '{pr_url:$pr,implementation_report:$report}' >"${PIPELINE_TASK_OUTCOME:?}"
EOF

  cat >"$BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"${FIXTURE_GH_CALLS:?}"
command_name="${1:-}:${2:-}"
shift 2 || true

case "$command_name" in
  api:*)
    [[ -f "${FIXTURE_PR_FILE:?}" ]] || exit 1
    jq '
      {
        merged:(.state == "MERGED"),
        state:(if .state == "OPEN" then "open" else "closed" end),
        base:{ref:.baseRefName,repo:{full_name:.repository}},
        head:{ref:.headRefName,sha:.headRefOid,repo:{full_name:.repository}},
        merge_commit_sha:(if .mergeCommit.oid == "" then null else .mergeCommit.oid end),
        html_url:.url,
        body:(.body // "")
      }
    ' "$FIXTURE_PR_FILE"
    ;;
  pr:view)
    [[ -f "${FIXTURE_PR_FILE:?}" ]] || exit 1
    jq_filter=""
    while (( $# > 0 )); do
      if [[ "$1" == --jq ]]; then jq_filter="${2:?}"; break; fi
      shift
    done
    if [[ -n "$jq_filter" ]]; then jq -r "$jq_filter" "$FIXTURE_PR_FILE"; else jq . "$FIXTURE_PR_FILE"; fi
    ;;
  pr:diff)
    jq -r '.changed_files[]' "${FIXTURE_PR_FILE:?}"
    ;;
  pr:checks)
    [[ "$(jq -r '.checks' "${FIXTURE_PR_FILE:?}")" == passed ]]
    ;;
  pr:merge)
    printf 'merge\n' >>"${FIXTURE_MERGE_CALLS:?}"
    match_head=""
    delete_branch=0
    while (( $# > 0 )); do
      case "$1" in
        --match-head-commit) match_head="${2:?}"; shift 2 ;;
        --delete-branch) delete_branch=1; shift ;;
        *) shift ;;
      esac
    done
    branch="$(jq -r '.headRefName' "${FIXTURE_PR_FILE:?}")"
    if [[ -e "${FIXTURE_RACE_ARM:?}" ]]; then
      rm -f "$FIXTURE_RACE_ARM"
      race_work="$(mktemp -d "${FIXTURE_CASE_DIR:?}/race.XXXXXX")"
      git clone -b "$branch" "${FIXTURE_REMOTE:?}" "$race_work" >/dev/null
      git -C "$race_work" config user.email fixture@example.test
      git -C "$race_work" config user.name fixture
      mkdir -p "$race_work/src"
      printf 'unverified race change\n' >"$race_work/src/race-change.txt"
      git -C "$race_work" add src/race-change.txt
      git -C "$race_work" commit -m 'fixture race head' >/dev/null
      git -C "$race_work" push origin "$branch" >/dev/null
      raced_head="$(git -C "$race_work" rev-parse HEAD)"
      git --git-dir="${FIXTURE_REMOTE:?}" update-ref refs/pull/1/head "$raced_head"
      jq --arg sha "$raced_head" '.headRefOid=$sha | .changed_files += ["src/race-change.txt"]' \
        "$FIXTURE_PR_FILE" >"${FIXTURE_PR_FILE}.tmp"
      mv "${FIXTURE_PR_FILE}.tmp" "$FIXTURE_PR_FILE"
      rm -rf "$race_work"
    fi
    current_head="$(jq -r '.headRefOid' "$FIXTURE_PR_FILE")"
    [[ -n "$match_head" && "$match_head" == "$current_head" ]] || exit 17
    merge_work="$(mktemp -d "${FIXTURE_CASE_DIR:?}/merge.XXXXXX")"
    trap 'rm -rf "$merge_work"' EXIT
    git clone -b planning "${FIXTURE_REMOTE:?}" "$merge_work" >/dev/null
    git -C "$merge_work" config user.email fixture@example.test
    git -C "$merge_work" config user.name fixture
    git -C "$merge_work" fetch origin "$branch" >/dev/null
    git -C "$merge_work" merge --squash "origin/$branch" >/dev/null
    git -C "$merge_work" commit -m "merge fixture $branch" >/dev/null
    merge_sha="$(git -C "$merge_work" rev-parse HEAD)"
    git -C "$merge_work" push origin planning >/dev/null
    jq --arg sha "$merge_sha" '.state="MERGED" | .mergeCommit={oid:$sha}' \
      "$FIXTURE_PR_FILE" >"${FIXTURE_PR_FILE}.tmp"
    mv "${FIXTURE_PR_FILE}.tmp" "$FIXTURE_PR_FILE"
    if (( delete_branch )); then git --git-dir="$FIXTURE_REMOTE" update-ref -d "refs/heads/$branch"; fi
    if [[ -e "${FIXTURE_CRASH_AFTER_MERGE_ARM:?}" ]]; then
      rm -f "$FIXTURE_CRASH_AFTER_MERGE_ARM"
      exit 86
    fi
    ;;
  *)
    printf 'unsupported fake gh command: %s\n' "$command_name" >&2
    exit 1
    ;;
esac
EOF

  cat >"$BIN/pnpm" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$(git branch --show-current)" >>"${FIXTURE_PNPM_BRANCHES:?}"
exit 0
EOF
  chmod +x "$BIN/codex-fixture" "$BIN/gh" "$BIN/pnpm"
}

create_case() {
  local name="$1" stage="${2:-task}" tmp_manifest
  CASE_DIR="$TMP/$name"
  REMOTE="$CASE_DIR/origin.git"
  SEED="$CASE_DIR/seed"
  STATE="$CASE_DIR/state"
  BIN="$CASE_DIR/bin"
  CONTROL="$CASE_DIR/control"
  PR_FILE="$CASE_DIR/pr.json"
  GH_CALLS="$CASE_DIR/gh-calls.log"
  CODEX_CALLS="$CASE_DIR/codex-calls.log"
  MERGE_CALLS="$CASE_DIR/merge-calls.log"
  PNPM_BRANCHES="$CASE_DIR/pnpm-branches.log"
  RACE_ARM="$CASE_DIR/race-arm"
  CRASH_AFTER_MERGE_ARM="$CASE_DIR/crash-after-merge-arm"
  MANIFEST="$STATE/$MANIFEST_REL"
  mkdir -p "$CASE_DIR" "$BIN" "$CONTROL"
  : >"$GH_CALLS"; : >"$CODEX_CALLS"; : >"$MERGE_CALLS"; : >"$PNPM_BRANCHES"

  git init --bare "$REMOTE" >/dev/null
  git init -b planning "$SEED" >/dev/null
  git -C "$SEED" config user.email fixture@example.test
  git -C "$SEED" config user.name fixture
  mkdir -p "$SEED/$(dirname "$MANIFEST_REL")" "$SEED/src" \
    "$SEED/docs/nextshift-os-3/os-3-8/3.8-A"
  reset_manifest "$SOURCE_MANIFEST" "$SEED/$MANIFEST_REL"
  cp "$ROOT/docs/nextshift-os-3/os-3-8/3.8-A/IMPLEMENTATION_CONTRACT.md" \
    "$ROOT/docs/nextshift-os-3/os-3-8/3.8-A/EXECUTION_TASK.md" \
    "$SEED/docs/nextshift-os-3/os-3-8/3.8-A/"
  printf 'fixture product baseline\n' >"$SEED/src/product.txt"
  git -C "$SEED" add .
  git -C "$SEED" commit -m 'fixture product baseline' >/dev/null
  BASELINE_SHA="$(git -C "$SEED" rev-parse HEAD)"

  if [[ "$stage" == checkpoint ]]; then
    seed_checkpoint_ready
    git -C "$SEED" add .
    git -C "$SEED" commit -m 'fixture checkpoint ready' >/dev/null
  elif [[ "$stage" != task ]]; then
    fail "unknown fixture stage: $stage"
  fi
  tmp_manifest="$SEED/manifest.tmp"
  "$ROOT/scripts/os-pipeline/validate-manifest.sh" --manifest "$SEED/$MANIFEST_REL" >/dev/null
  [[ ! -e "$tmp_manifest" ]] || fail 'fixture left a manifest temporary file'
  git -C "$SEED" remote add origin "$REMOTE"
  git -C "$SEED" push -u origin planning >/dev/null
  git clone -b planning "$REMOTE" "$STATE" >/dev/null
  git -C "$STATE" config user.email fixture@example.test
  git -C "$STATE" config user.name fixture
  write_fake_tools
}

pipeline() {
  PATH="$BIN:$PATH" \
  FIXTURE_CASE_DIR="$CASE_DIR" \
  FIXTURE_REMOTE="$REMOTE" \
  FIXTURE_PR_FILE="$PR_FILE" \
  FIXTURE_PR_URL="$PR_URL" \
  FIXTURE_GH_CALLS="$GH_CALLS" \
  FIXTURE_CODEX_CALLS="$CODEX_CALLS" \
  FIXTURE_MERGE_CALLS="$MERGE_CALLS" \
  FIXTURE_PNPM_BRANCHES="$PNPM_BRANCHES" \
  FIXTURE_RACE_ARM="$RACE_ARM" \
  FIXTURE_CRASH_AFTER_MERGE_ARM="$CRASH_AFTER_MERGE_ARM" \
  FIXTURE_REPORT_PATH="${FIXTURE_REPORT_PATH:-}" \
  PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 \
  PIPELINE_EXPECTED_REPOSITORY="$EXPECTED_REPOSITORY" \
  PIPELINE_ALLOW_PRODUCT_DISPATCH=1 \
  PIPELINE_AUTOMATE_TASK_CYCLE=1 \
  PIPELINE_ALLOW_PR_MERGE=1 \
  CODEX_CMD="$BIN/codex-fixture" \
  REPO_DIR="$STATE" \
  MANIFEST_PATH="$MANIFEST" \
  CONTROL_ROOT="$CONTROL" \
  "$PIPELINE" "$@"
}

run_verify() {
  local worktree="$1" branch="$2" report="$3"
  PATH="$BIN:$PATH" \
  FIXTURE_CASE_DIR="$CASE_DIR" \
  FIXTURE_REMOTE="$REMOTE" \
  FIXTURE_PR_FILE="$PR_FILE" \
  FIXTURE_PR_URL="$PR_URL" \
  FIXTURE_GH_CALLS="$GH_CALLS" \
  FIXTURE_CODEX_CALLS="$CODEX_CALLS" \
  FIXTURE_MERGE_CALLS="$MERGE_CALLS" \
  FIXTURE_PNPM_BRANCHES="$PNPM_BRANCHES" \
  FIXTURE_RACE_ARM="$RACE_ARM" \
  FIXTURE_CRASH_AFTER_MERGE_ARM="$CRASH_AFTER_MERGE_ARM" \
  PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 \
  PIPELINE_EXPECTED_REPOSITORY="$EXPECTED_REPOSITORY" \
  PIPELINE_TASK_ID=E1 \
  TASK_BRANCH="$branch" \
  IMPLEMENTATION_REPORT="$report" \
  REPO_DIR="$worktree" \
  MANIFEST_PATH="$worktree/$MANIFEST_REL" \
  "$PIPELINE" --verify-pr "$PR_URL"
}

lock_path() {
  local common
  common="$(git -C "$STATE" rev-parse --git-common-dir)"
  if [[ "$common" == /* ]]; then printf '%s/os-pipeline-state.lock\n' "$common"; else printf '%s/%s/os-pipeline-state.lock\n' "$STATE" "$common"; fi
}

assert_lock_absent() { [[ ! -e "$(lock_path)" ]] || fail 'state transaction lock was not released'; }

assert_synced_clean() {
  local local_head tracking_head bare_head counts
  git -C "$STATE" fetch origin planning >/dev/null
  local_head="$(git -C "$STATE" rev-parse HEAD)"
  tracking_head="$(git -C "$STATE" rev-parse origin/planning)"
  bare_head="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  counts="$(git -C "$STATE" rev-list --left-right --count 'origin/planning...HEAD')"
  assert_eq "$local_head" "$tracking_head" 'local/tracking planning synchronization'
  assert_eq "$local_head" "$bare_head" 'local/bare planning synchronization'
  assert_eq "$counts" $'0\t0' 'planning ahead/behind'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'fixture state worktree is dirty'
  assert_lock_absent
}

assert_atomic_commit() {
  local before="$1" label="$2" actual expected
  shift 2
  assert_eq "$(git -C "$STATE" rev-parse HEAD^)" "$before" "$label parent"
  actual="$(git -C "$STATE" diff-tree --no-commit-id --name-only -r HEAD | LC_ALL=C sort)"
  expected="$(printf '%s\n' "$@" | LC_ALL=C sort)"
  assert_eq "$actual" "$expected" "$label paths"
}

task_status() { jq -r --arg id "${1:-E1}" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST"; }
task_artifact() { printf '%s/docs/nextshift-os-3/os-3-8/runs/%s_DISPATCH.json\n' "$STATE" "${1:-E1}"; }
count_lines() { wc -l <"$1" | tr -d ' '; }

remove_non_state_worktrees() {
  local path
  while IFS= read -r path; do
    [[ -z "$path" || "$path" == "$STATE" ]] && continue
    git -C "$STATE" worktree remove --force "$path" >/dev/null 2>&1 || true
  done < <(git -C "$STATE" worktree list --porcelain | sed -n 's/^worktree //p')
  git -C "$STATE" worktree prune
}

write_review_result() {
  local target="$1" verdict="$2" sha="$3"
  printf 'VERDICT=%s\nREVIEWED_SHA=%s\n' "$verdict" "$sha" >"$target"
}

prepare_manual_pr() {
  local branch="$1" report="$2" include_report_in_diff="$3" add_report="$4" task_worktree="$CASE_DIR/manual-task"
  if [[ "$add_report" == base ]]; then
    mkdir -p "$STATE/$(dirname "$report")"
    printf 'base report\n' >"$STATE/$report"
    git -C "$STATE" add -- "$report"
    git -C "$STATE" commit -m 'fixture base report' >/dev/null
    git -C "$STATE" push origin planning >/dev/null
  fi
  git -C "$STATE" worktree add -b "$branch" "$task_worktree" origin/planning >/dev/null
  git -C "$task_worktree" config user.email fixture@example.test
  git -C "$task_worktree" config user.name fixture
  printf 'fixture task change\n' >"$task_worktree/src/manual-change.txt"
  if [[ "$add_report" == branch ]]; then
    mkdir -p "$task_worktree/$(dirname "$report")"
    printf 'branch report\n' >"$task_worktree/$report"
  fi
  git -C "$task_worktree" add .
  git -C "$task_worktree" commit -m 'fixture manual task' >/dev/null
  git -C "$task_worktree" push -u origin "$branch" >/dev/null
  local head changed
  head="$(git -C "$task_worktree" rev-parse HEAD)"
  changed='["src/manual-change.txt"]'
  if [[ "$include_report_in_diff" == yes ]]; then changed="$(jq -n --arg report "$report" '["src/manual-change.txt",$report]')"; fi
  git --git-dir="$REMOTE" update-ref refs/pull/1/head "$head"
  jq -n --arg repo "$EXPECTED_REPOSITORY" --arg branch "$branch" --arg head "$head" --arg report "$report" --arg url "$PR_URL" --argjson changed "$changed" \
    '{state:"OPEN",repository:$repo,baseRefName:"planning",headRefName:$branch,headRefOid:$head,
      mergeCommit:{oid:""},url:$url,body:("Implementation-Report: " + $report),report:$report,
      changed_files:$changed,checks:"passed"}' >"$PR_FILE"
  MANUAL_TASK_WORKTREE="$task_worktree"
}

fixture_normal_task_merged_running_recovery() {
  local rc artifact verified_head merge_sha before_idempotent report
  create_case normal_task_merged_running_recovery task
  : >"$CRASH_AFTER_MERGE_ARM"
  set +e
  pipeline --cycle >"$CONTROL/first-cycle.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'post-merge crash fixture unexpectedly completed'
  assert_eq "$(jq -r '.state' "$PR_FILE")" MERGED 'PR state after injected crash'
  assert_eq "$(task_status E1)" running 'task state after injected crash'
  artifact="$(task_artifact E1)"
  jq -e '.verification.status == "passed" and .verification.checks == "passed" and .verification.report_exists_at_exact_head == true and .verification.report_in_pr_diff == true' "$artifact" >/dev/null || fail 'exact verification was not persisted before merge'
  verified_head="$(jq -r '.verification.verified_head_sha' "$artifact")"
  [[ "$verified_head" =~ ^[0-9a-f]{40}$ ]] || fail 'persisted verified head is invalid'
  if "$REAL_GIT" --git-dir="$REMOTE" show-ref --verify --quiet "refs/heads/$(jq -r '.task_branch' "$artifact")"; then
    fail 'task branch was not deleted by merge'
  fi
  assert_eq "$(count_lines "$CODEX_CALLS")" 1 'Codex calls before recovery'
  assert_eq "$(count_lines "$MERGE_CALLS")" 1 'merge calls before recovery'
  remove_non_state_worktrees
  pipeline --cycle >"$CONTROL/recovery.log" 2>&1 || { sed -n '1,240p' "$CONTROL/recovery.log" >&2; fail 'normal task recovery failed'; }
  assert_eq "$(task_status E1)" completed 'recovered task status'
  assert_eq "$(jq -r '.waves[0].tasks[0].evidence.pr_url' "$MANIFEST")" "$PR_URL" 'recovery evidence PR'
  assert_eq "$(jq -r '.waves[0].tasks[0].evidence.recovered' "$MANIFEST")" true 'recovery evidence marker'
  assert_eq "$(jq -r '.waves[0].tasks[0].evidence.validation.head_sha' "$MANIFEST")" "$verified_head" 'recovered verified head'
  merge_sha="$(jq -r '.mergeCommit.oid' "$PR_FILE")"
  assert_eq "$(jq -r '.waves[0].tasks[0].evidence.merge_sha' "$MANIFEST")" "$merge_sha" 'recovery evidence merge SHA'
  report="$(jq -r '.implementation_report' "$artifact")"
  assert_eq "$(jq -r '.waves[0].tasks[0].evidence.implementation_report' "$MANIFEST")" "$report" 'recovery evidence report'
  assert_eq "$(jq -r '.waves[0].tasks[0].evidence.validation.checks' "$MANIFEST")" passed 'recovery evidence checks'
  git -C "$STATE" merge-base --is-ancestor "$merge_sha" HEAD || fail 'recovered merge SHA is not on planning history'
  assert_eq "$(count_lines "$CODEX_CALLS")" 1 'recovery Codex calls'
  assert_eq "$(count_lines "$MERGE_CALLS")" 1 'recovery merge calls'
  before_idempotent="$(git -C "$STATE" rev-parse HEAD)"
  pipeline --recover-task E1 >"$CONTROL/idempotent-recovery.log" 2>&1 || fail 'completed recovery did not clean-stop idempotently'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before_idempotent" 'idempotent recovery state commit'
  assert_eq "$(count_lines "$CODEX_CALLS")" 1 'idempotent recovery Codex calls'
  assert_eq "$(count_lines "$MERGE_CALLS")" 1 'idempotent recovery merge calls'
  assert_synced_clean
  pass normal_task_merged_running_recovery
}

fixture_normal_task_recovery_ambiguous_identity_rejected() {
  local rc before mismatch
  for mismatch in repository base head merge report checks; do
    create_case "normal_task_recovery_ambiguous_${mismatch}" task
    : >"$CRASH_AFTER_MERGE_ARM"
    set +e; pipeline --cycle >"$CONTROL/first-cycle.log" 2>&1; rc=$?; set -e
    (( rc != 0 )) || fail "ambiguous $mismatch recovery setup did not stop after merge"
    before="$(git -C "$STATE" rev-parse HEAD)"
    case "$mismatch" in
      repository) jq '.repository="fixture/Other-Repo"' "$PR_FILE" >"${PR_FILE}.tmp" ;;
      base) jq '.baseRefName="unauthorized-base"' "$PR_FILE" >"${PR_FILE}.tmp" ;;
      head) jq '.headRefOid="1111111111111111111111111111111111111111"' "$PR_FILE" >"${PR_FILE}.tmp" ;;
      merge) jq '.mergeCommit.oid="2222222222222222222222222222222222222222"' "$PR_FILE" >"${PR_FILE}.tmp" ;;
      report) jq '.changed_files=[]' "$PR_FILE" >"${PR_FILE}.tmp" ;;
      checks) jq '.checks="failed"' "$PR_FILE" >"${PR_FILE}.tmp" ;;
    esac
    mv "${PR_FILE}.tmp" "$PR_FILE"
    set +e; pipeline --cycle >"$CONTROL/recovery.log" 2>&1; rc=$?; set -e
    (( rc != 0 )) || fail "ambiguous merged PR $mismatch identity was accepted"
    if [[ "$mismatch" == merge ]]; then
      assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" 'ambiguous merge recovery clean fast-forward'
    else
      assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" "ambiguous $mismatch recovery local state commit"
    fi
    assert_eq "$(task_status E1)" running "ambiguous $mismatch recovery task state"
    assert_eq "$(count_lines "$CODEX_CALLS")" 1 "ambiguous $mismatch recovery Codex calls"
    assert_eq "$(count_lines "$MERGE_CALLS")" 1 "ambiguous $mismatch recovery merge calls"
    assert_lock_absent
  done
  pass normal_task_recovery_ambiguous_identity_rejected
}

fixture_normal_task_exact_head_race_rejected() {
  local rc artifact verified_head current_head planning_head
  create_case normal_task_exact_head_race_rejected task
  : >"$RACE_ARM"
  set +e; pipeline --cycle >"$CONTROL/race.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'PR head race was accepted'
  artifact="$(task_artifact E1)"
  verified_head="$(jq -r '.verification.verified_head_sha' "$artifact")"
  current_head="$(jq -r '.headRefOid' "$PR_FILE")"
  if [[ "$verified_head" == "$current_head" ]]; then
    sed -n '1,260p' "$CONTROL/race.log" >&2
    sed -n '1,200p' "$GH_CALLS" >&2
    fail 'race did not advance the PR head'
  fi
  if ! grep -Fq -- "--match-head-commit $verified_head" "$GH_CALLS"; then
    sed -n '1,200p' "$GH_CALLS" >&2
    fail 'normal merge omitted the exact verified-head guard'
  fi
  assert_eq "$(jq -r '.state' "$PR_FILE")" OPEN 'race PR state'
  assert_eq "$(task_status E1)" running 'race task state'
  planning_head="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$planning_head" 'race planning state synchronization'
  git --git-dir="$REMOTE" merge-base --is-ancestor "$current_head" refs/heads/planning && fail 'unverified race head reached planning'
  assert_eq "$(count_lines "$MERGE_CALLS")" 1 'race merge calls'
  assert_lock_absent
  pass normal_task_exact_head_race_rejected
}

fixture_checkpoint_pass_atomic_persistence() {
  local before requested_head request_commit result_source result_before
  create_case checkpoint_pass_atomic_persistence checkpoint
  before="$(git -C "$STATE" rev-parse HEAD)"
  pipeline --cycle >"$CONTROL/request.log" 2>&1 || fail 'checkpoint request failed'
  requested_head="$(jq -r '.waves[0].checkpoint.requested_end_sha' "$MANIFEST")"
  assert_eq "$requested_head" "$before" 'checkpoint requested product SHA'
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" awaiting_review 'checkpoint request status'
  grep -Fq "Cumulative product end SHA: $requested_head" "$STATE/$REQUEST_REL" || fail 'checkpoint request has the wrong product SHA'
  request_commit="$(git -C "$STATE" rev-parse HEAD)"
  assert_atomic_commit "$before" 'checkpoint request transaction' "$MANIFEST_REL" "$REQUEST_REL"
  result_source="$CONTROL/review-pass.md"
  write_review_result "$result_source" PASS "$requested_head"
  result_before="$request_commit"
  pipeline --record-review-result AR-W1 PASS "$result_source" >"$CONTROL/result.log" 2>&1 || fail 'checkpoint PASS persistence failed'
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" passed 'checkpoint PASS status'
  assert_eq "$(jq -r '.waves[0].checkpoint.reviewed_sha' "$MANIFEST")" "$requested_head" 'checkpoint reviewed SHA'
  assert_atomic_commit "$result_before" 'checkpoint PASS transaction' "$MANIFEST_REL" "$RESULT_REL"
  assert_eq "$(pipeline --plan | jq -r '.task')" U1A 'checkpoint PASS next task'
  assert_synced_clean
  pass checkpoint_pass_atomic_persistence
}

fixture_checkpoint_stale_product_change_rejected() {
  local requested_head product_commit before_attempt result_source rc
  create_case checkpoint_stale_product_change_rejected checkpoint
  pipeline --cycle >/dev/null 2>&1 || fail 'stale fixture checkpoint request failed'
  requested_head="$(jq -r '.waves[0].checkpoint.requested_end_sha' "$MANIFEST")"
  printf 'post-checkpoint product change\n' >"$STATE/src/post-checkpoint-change.txt"
  git -C "$STATE" add src/post-checkpoint-change.txt
  git -C "$STATE" commit -m 'fixture post-checkpoint product change' >/dev/null
  git -C "$STATE" push origin planning >/dev/null
  product_commit="$(git -C "$STATE" rev-parse HEAD)"
  result_source="$CONTROL/stale-pass.md"
  write_review_result "$result_source" PASS "$requested_head"
  before_attempt="$product_commit"
  set +e; pipeline --record-review-result AR-W1 PASS "$result_source" >"$CONTROL/stale.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'stale checkpoint review was accepted'
  grep -Fq 'stale review: product/code changed' "$CONTROL/stale.log" || fail 'stale checkpoint rejection reason missing'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before_attempt" 'stale review state commit'
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" awaiting_review 'stale review checkpoint status'
  assert_file_absent "$STATE/$RESULT_REL" 'stale review created a canonical result'
  assert_synced_clean
  pass checkpoint_stale_product_change_rejected
}

fixture_synchronization_dirty_tracked_rejected() {
  local before remote_before rc
  create_case synchronization_dirty_tracked_rejected checkpoint
  before="$(git -C "$STATE" rev-parse HEAD)"; remote_before="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  printf 'dirty user change\n' >>"$STATE/src/product.txt"
  set +e; pipeline --cycle >"$CONTROL/dirty.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'tracked dirty worktree was accepted'
  grep -Fq 'dirty worktree' "$CONTROL/dirty.log" || fail 'tracked dirty rejection reason missing'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'tracked dirty local HEAD'
  assert_eq "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" "$remote_before" 'tracked dirty remote HEAD'
  grep -Fq 'dirty user change' "$STATE/src/product.txt" || fail 'tracked user change was overwritten'
  assert_file_absent "$STATE/$REQUEST_REL" 'tracked dirty gate wrote a request'
  assert_lock_absent
  pass synchronization_dirty_tracked_rejected
}

fixture_synchronization_untracked_rejected() {
  local before remote_before rc
  create_case synchronization_untracked_rejected checkpoint
  before="$(git -C "$STATE" rev-parse HEAD)"; remote_before="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  printf 'untracked user file\n' >"$STATE/USER_UNTRACKED.txt"
  set +e; pipeline --cycle >"$CONTROL/untracked.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'untracked worktree was accepted'
  grep -Fq 'dirty worktree' "$CONTROL/untracked.log" || fail 'untracked rejection reason missing'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'untracked local HEAD'
  assert_eq "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" "$remote_before" 'untracked remote HEAD'
  [[ -f "$STATE/USER_UNTRACKED.txt" ]] || fail 'untracked user file was deleted'
  assert_file_absent "$STATE/$REQUEST_REL" 'untracked gate wrote a request'
  assert_lock_absent
  pass synchronization_untracked_rejected
}

fixture_synchronization_local_ahead_rejected() {
  local local_head remote_head rc
  create_case synchronization_local_ahead_rejected checkpoint
  printf 'local-only\n' >"$STATE/src/local-ahead.txt"
  git -C "$STATE" add src/local-ahead.txt
  git -C "$STATE" commit -m 'fixture local ahead' >/dev/null
  local_head="$(git -C "$STATE" rev-parse HEAD)"; remote_head="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  set +e; pipeline --cycle >"$CONTROL/local-ahead.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'local-ahead state was accepted'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$local_head" 'local-ahead HEAD preservation'
  assert_eq "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" "$remote_head" 'local-ahead remote preservation'
  assert_file_absent "$STATE/$REQUEST_REL" 'local-ahead gate wrote a request'
  assert_lock_absent
  pass synchronization_local_ahead_rejected
}

advance_remote_from_sibling() {
  local label="$1" sibling
  sibling="$CASE_DIR/sibling-$label"
  git clone -b planning "$REMOTE" "$sibling" >/dev/null
  git -C "$sibling" config user.email fixture@example.test
  git -C "$sibling" config user.name fixture
  printf 'remote %s\n' "$label" >"$sibling/src/remote-$label.txt"
  git -C "$sibling" add "src/remote-$label.txt"
  git -C "$sibling" commit -m "fixture remote $label" >/dev/null
  git -C "$sibling" push origin planning >/dev/null
}

fixture_synchronization_remote_advanced_rejected() {
  local local_head remote_head rc
  create_case synchronization_remote_advanced_rejected checkpoint
  local_head="$(git -C "$STATE" rev-parse HEAD)"
  advance_remote_from_sibling advanced
  remote_head="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  set +e; pipeline --cycle >"$CONTROL/remote-advanced.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'remote-advanced state was accepted'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$local_head" 'remote-advanced local HEAD preservation'
  assert_eq "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" "$remote_head" 'remote-advanced remote HEAD preservation'
  assert_file_absent "$STATE/$REQUEST_REL" 'remote-advanced gate wrote a request'
  assert_lock_absent
  pass synchronization_remote_advanced_rejected
}

fixture_synchronization_diverged_rejected() {
  local local_head remote_head rc
  create_case synchronization_diverged_rejected checkpoint
  advance_remote_from_sibling diverged
  printf 'local diverged\n' >"$STATE/src/local-diverged.txt"
  git -C "$STATE" add src/local-diverged.txt
  git -C "$STATE" commit -m 'fixture local diverged' >/dev/null
  local_head="$(git -C "$STATE" rev-parse HEAD)"; remote_head="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  set +e; pipeline --cycle >"$CONTROL/diverged.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'diverged state was accepted'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$local_head" 'diverged local HEAD preservation'
  assert_eq "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" "$remote_head" 'diverged remote HEAD preservation'
  assert_file_absent "$STATE/$REQUEST_REL" 'diverged gate wrote a request'
  assert_lock_absent
  pass synchronization_diverged_rejected
}

install_holding_git_wrapper() {
  cat >"$BIN/git" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [[ "\${FIXTURE_HOLD_FETCH:-0}" == 1 && "\$*" == *"-C \${FIXTURE_HOLD_REPO:?} fetch origin --prune"* && ! -e "\${FIXTURE_HOLD_USED:?}" ]]; then
  : >"\$FIXTURE_HOLD_USED"
  : >"\${FIXTURE_HOLD_ENTERED:?}"
  while [[ ! -e "\${FIXTURE_HOLD_RELEASE:?}" ]]; do sleep 0.05; done
fi
exec "$REAL_GIT" "\$@"
EOF
  chmod +x "$BIN/git"
}

fixture_state_lock_live_contention_owner_and_release() {
  local entered release used first_rc second_rc lock owner before first_pid attempts
  create_case state_lock_live_contention_owner_and_release checkpoint
  entered="$CASE_DIR/hold-entered"; release="$CASE_DIR/hold-release"; used="$CASE_DIR/hold-used"
  first_rc="$CASE_DIR/first.rc"; second_rc="$CASE_DIR/second.rc"
  install_holding_git_wrapper
  before="$(git -C "$STATE" rev-parse HEAD)"
  set +e
  (
    FIXTURE_HOLD_FETCH=1 FIXTURE_HOLD_REPO="$STATE" FIXTURE_HOLD_USED="$used" \
      FIXTURE_HOLD_ENTERED="$entered" FIXTURE_HOLD_RELEASE="$release" \
      pipeline --cycle >"$CONTROL/first.log" 2>&1
    printf '%s\n' "$?" >"$first_rc"
  ) &
  first_pid=$!
  set -e
  attempts=0
  while [[ ! -e "$entered" && "$attempts" -lt 200 ]]; do sleep 0.05; attempts=$((attempts + 1)); done
  [[ -e "$entered" ]] || fail 'first transaction did not reach the held fetch'
  lock="$(lock_path)"; [[ -d "$lock" && -f "$lock/owner" ]] || fail 'common-dir lock/owner was not created'
  owner="$(cat "$lock/owner")"
  [[ "$owner" =~ ^pid=[0-9]+\ host=.+\ started=[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z\ command=checkpoint-request$ ]] || fail 'lock owner metadata is incomplete'
  set +e
  pipeline --cycle >"$CONTROL/second.log" 2>&1
  printf '%s\n' "$?" >"$second_rc"
  set -e
  [[ "$(cat "$second_rc")" != 0 ]] || fail 'concurrent transaction acquired an owned lock'
  assert_eq "$(cat "$lock/owner")" "$owner" 'contended lock owner preservation'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'contended transaction state mutation'
  assert_file_absent "$STATE/$REQUEST_REL" 'contended transaction wrote a request'
  : >"$release"
  wait "$first_pid"
  assert_eq "$(cat "$first_rc")" 0 'first held transaction result'
  [[ ! -e "$lock" ]] || fail 'owned lock was not released after success'
  [[ -f "$STATE/$REQUEST_REL" ]] || fail 'first transaction did not resume after contention'
  assert_synced_clean
  pass state_lock_live_contention_owner_and_release
}

fixture_state_lock_stale_owner_preserved_no_mutation() {
  local lock owner before remote_before manifest_hash rc
  create_case state_lock_stale_owner_preserved_no_mutation checkpoint
  lock="$(lock_path)"; mkdir "$lock"
  owner='pid=999999 host=stale-fixture started=2000-01-01T00:00:00Z command=checkpoint-request'
  printf '%s\n' "$owner" >"$lock/owner"
  before="$(git -C "$STATE" rev-parse HEAD)"; remote_before="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  manifest_hash="$(shasum -a 256 "$MANIFEST" | awk '{print $1}')"
  set +e; pipeline --cycle >"$CONTROL/stale-lock.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'stale lock was automatically removed'
  assert_eq "$(cat "$lock/owner")" "$owner" 'stale lock owner preservation'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'stale lock local mutation'
  assert_eq "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" "$remote_before" 'stale lock remote mutation'
  assert_eq "$(shasum -a 256 "$MANIFEST" | awk '{print $1}')" "$manifest_hash" 'stale lock Manifest mutation'
  assert_file_absent "$STATE/$REQUEST_REL" 'stale lock wrote a request'
  rm -f "$lock/owner"; rmdir "$lock"
  pass state_lock_stale_owner_preserved_no_mutation
}

fixture_transaction_argument_injection_no_execution() {
  local payload marker_dollar marker_semi victim before remote_before rc
  create_case transaction_argument_injection_no_execution task
  marker_dollar="$CASE_DIR/PWNED_DOLLAR"; marker_semi="$CASE_DIR/PWNED_SEMI"
  payload="docs/nextshift-os-3/os-3-8/reports/quote'\$(touch PWNED_DOLLAR;touch PWNED_SEMI)'tail.md"
  FIXTURE_REPORT_PATH="$payload"
  export FIXTURE_REPORT_PATH
  (cd "$CASE_DIR" && pipeline --cycle >"$CONTROL/injection.log" 2>&1) || { sed -n '1,260p' "$CONTROL/injection.log" >&2; fail 'quoted/metacharacter report path did not complete safely'; }
  unset FIXTURE_REPORT_PATH
  assert_file_absent "$marker_dollar" 'dollar-command substitution executed from outcome data'
  assert_file_absent "$marker_semi" 'semicolon command executed from outcome data'
  assert_eq "$(task_status E1)" completed 'injection fixture task status'
  assert_eq "$(jq -r '.waves[0].tasks[0].evidence.implementation_report' "$MANIFEST")" "$payload" 'literal injection path preservation'
  jq empty "$(task_artifact E1)" || fail 'injection payload corrupted dispatch JSON'
  assert_synced_clean

  create_case transaction_artifact_symlink_rejected checkpoint
  victim="$CASE_DIR/external-victim"
  printf 'ORIGINAL\n' >"$victim"
  mkdir -p "$STATE/$(dirname "$REQUEST_REL")"
  ln -s "$victim" "$STATE/$REQUEST_REL"
  git -C "$STATE" add -- "$REQUEST_REL"
  git -C "$STATE" commit -m 'fixture tracked final-component symlink' >/dev/null
  git -C "$STATE" push origin planning >/dev/null
  before="$(git -C "$STATE" rev-parse HEAD)"
  remote_before="$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)"
  set +e; pipeline --cycle >"$CONTROL/symlink.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail 'final-component artifact symlink was accepted'
  grep -Fq 'artifact target must not be a symlink' "$CONTROL/symlink.log" || fail 'symlink rejection did not occur before artifact write'
  assert_eq "$(cat "$victim")" ORIGINAL 'artifact symlink external target content'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'artifact symlink local state commit'
  assert_eq "$(git --git-dir="$REMOTE" rev-parse refs/heads/planning)" "$remote_before" 'artifact symlink remote state commit'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'artifact symlink fixture changed the clean state checkout'
  assert_lock_absent
  pass transaction_argument_injection_no_execution
}

verify_rejected_without_merge() {
  local report="$1" rc
  set +e; run_verify "$MANUAL_TASK_WORKTREE" fixture-report-branch "$report" >"$CONTROL/verify-reject.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail "implementation report case was accepted: $report"
  assert_eq "$(count_lines "$MERGE_CALLS")" 0 'report rejection merge calls'
}

fixture_implementation_report_invalid_missing_out_of_pr_rejected() {
  create_case implementation_report_invalid task
  prepare_manual_pr fixture-report-branch docs/valid-report.md yes branch
  verify_rejected_without_merge '../escape-report.md'
  verify_rejected_without_merge '/absolute/escape-report.md'
  verify_rejected_without_merge $'docs/newline\nreport.md'
  verify_rejected_without_merge $'docs/carriage\rreport.md'
  verify_rejected_without_merge $'docs/control\treport.md'

  create_case implementation_report_missing task
  prepare_manual_pr fixture-report-branch docs/valid-report.md yes branch
  verify_rejected_without_merge 'docs/missing-report.md'

  create_case implementation_report_out_of_pr task
  prepare_manual_pr fixture-report-branch docs/base-report.md no base
  verify_rejected_without_merge 'docs/base-report.md'
  pass implementation_report_invalid_missing_out_of_pr_rejected
}

fixture_normal_task_merged_running_recovery
fixture_normal_task_recovery_ambiguous_identity_rejected
fixture_normal_task_exact_head_race_rejected
fixture_checkpoint_pass_atomic_persistence
fixture_checkpoint_stale_product_change_rejected
fixture_synchronization_dirty_tracked_rejected
fixture_synchronization_untracked_rejected
fixture_synchronization_local_ahead_rejected
fixture_synchronization_remote_advanced_rejected
fixture_synchronization_diverged_rejected
fixture_state_lock_live_contention_owner_and_release
fixture_state_lock_stale_owner_preserved_no_mutation
fixture_transaction_argument_injection_no_execution
fixture_implementation_report_invalid_missing_out_of_pr_rejected

assert_eq "$pass_count" 14 'Round 5 named fixture count'
printf 'PASS: %s Round 5 safety real-Git fixtures\n' "$pass_count"
