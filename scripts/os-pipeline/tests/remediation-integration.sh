#!/usr/bin/env bash
# Group C real-Git fixture: remediation reservation, failure recovery, and completion.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PIPELINE="$ROOT/scripts/os-pipeline/run-pipeline.sh"
SOURCE_MANIFEST="$ROOT/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
MANIFEST_REL="docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
REQUEST_REL="docs/nextshift-os-3/os-3-8/reviews/W1_ARCHITECTURE_REVIEW_REQUEST.md"
RESULT_REL="docs/nextshift-os-3/os-3-8/reviews/W1_ARCHITECTURE_REVIEW_RESULT.md"
EXPECTED_REPOSITORY="fixture/NextShift-OS-2.0"
PR_URL="https://github.com/sohoteam88/NextShift-OS-2.0/pull/91"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass() { printf 'PASS: %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "$3 (expected $2, got $1)"; }

write_fake_tools() {
  cat >"$BIN/codex-fixture" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "${PIPELINE_TASK_ID:?}" >>"${FIXTURE_CODEX_CALLS:?}"
call_count="$(wc -l <"$FIXTURE_CODEX_CALLS" | tr -d ' ')"
[[ "${FAKE_CODEX_MODE:-success}" != failure ]] || exit 42

git config user.email fixture@example.test
git config user.name fixture
report="docs/nextshift-os-3/os-3-8/reports/${PIPELINE_TASK_ID}.md"
mkdir -p "$(dirname "$report")"
printf '# Remediation implementation report\n\nRun: %s\n' "$PIPELINE_TASK_ID" >"$report"
git add -- "$report"
git commit -m "fixture remediation $PIPELINE_TASK_ID" >/dev/null
git push -u origin "$PIPELINE_TASK_BRANCH" >/dev/null
head_sha="$(git rev-parse HEAD)"
body="Implementation-Report: $report"
pr_url="${FIXTURE_PR_URL%/*}/$((90 + call_count))"
jq -n \
  --arg state OPEN \
  --arg repo "${PIPELINE_EXPECTED_REPOSITORY:?}" \
  --arg base planning \
  --arg head "$PIPELINE_TASK_BRANCH" \
  --arg oid "$head_sha" \
  --arg url "$pr_url" \
  --arg body "$body" \
  --arg report "$report" \
  '{state:$state,repository:{nameWithOwner:$repo},baseRefName:$base,headRefName:$head,headRefOid:$oid,mergeCommit:null,url:$url,body:$body,report:$report}' \
  >"${FIXTURE_PR_FILE:?}"
jq -n --arg pr "$pr_url" --arg report "$report" \
  '{pr_url:$pr,implementation_report:$report}' >"${PIPELINE_TASK_OUTCOME:?}"
EOF

  cat >"$BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
command_name="${1:-}:${2:-}"
shift 2 || true

case "$command_name" in
  api:*)
    [[ -f "${FIXTURE_PR_FILE:?}" ]] || exit 1
    if [[ -n "${FIXTURE_API_FAIL_ONCE_FILE:-}" && -e "$FIXTURE_API_FAIL_ONCE_FILE" ]]; then
      rm -f "$FIXTURE_API_FAIL_ONCE_FILE"
      exit 87
    fi
    base_sha="$(git --git-dir="${FIXTURE_REMOTE:?}" rev-parse refs/heads/planning)"
    jq --arg base_sha "$base_sha" '
      {
        merged: (.state == "MERGED"),
        state: (if .state == "OPEN" then "open" else "closed" end),
        changed_files: 1,
        base: {
          ref: .baseRefName,
          sha: $base_sha,
          repo: {full_name: .repository.nameWithOwner}
        },
        head: {
          ref: .headRefName,
          sha: .headRefOid,
          repo: {full_name: .repository.nameWithOwner}
        },
        merge_commit_sha: (.mergeCommit.oid // null),
        html_url: .url,
        body: (.body // "")
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
    if [[ -n "$jq_filter" ]]; then
      jq -r "$jq_filter" "$FIXTURE_PR_FILE"
    else
      jq . "$FIXTURE_PR_FILE"
    fi
    ;;
  pr:diff)
    jq -r '.report' "${FIXTURE_PR_FILE:?}"
    ;;
  pr:checks)
    exit 0
    ;;
  pr:list)
    if [[ -f "${FIXTURE_PR_FILE:?}" ]]; then jq '[.]' "$FIXTURE_PR_FILE"; else printf '[]\n'; fi
    ;;
  pr:merge)
    [[ -f "${FIXTURE_PR_FILE:?}" ]] || exit 1
    if [[ -n "${FIXTURE_MERGE_FAIL_ONCE_FILE:-}" && -e "$FIXTURE_MERGE_FAIL_ONCE_FILE" ]]; then
      rm -f "$FIXTURE_MERGE_FAIL_ONCE_FILE"
      exit 86
    fi
    branch="$(jq -r '.headRefName' "$FIXTURE_PR_FILE")"
    merge_work="$(mktemp -d "${FIXTURE_CASE_DIR:?}/merge.XXXXXX")"
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
    if [[ -n "${FIXTURE_API_FAIL_AFTER_MERGE_ARM:-}" && -e "$FIXTURE_API_FAIL_AFTER_MERGE_ARM" ]]; then
      rm -f "$FIXTURE_API_FAIL_AFTER_MERGE_ARM"
      : >"${FIXTURE_API_FAIL_ONCE_FILE:?}"
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
branch="$(git branch --show-current)"
printf '%s\n' "${branch:-DETACHED}" >>"${FIXTURE_PNPM_BRANCHES:?}"
exit 0
EOF
  chmod +x "$BIN/codex-fixture" "$BIN/gh" "$BIN/pnpm"
}

create_fixture() {
  local name="$1" product_sha manifest_tmp
  CASE_DIR="$TMP/$name"
  REMOTE="$CASE_DIR/origin.git"
  SEED="$CASE_DIR/seed"
  STATE="$CASE_DIR/state"
  BIN="$CASE_DIR/bin"
  CONTROL="$CASE_DIR/control"
  PR_FILE="$CASE_DIR/pr.json"
  CODEX_CALLS="$CASE_DIR/codex-calls.log"
  PNPM_BRANCHES="$CASE_DIR/pnpm-branches.log"
  MERGE_FAIL_ONCE_FILE="$CASE_DIR/merge-fail-once"
  API_FAIL_ONCE_FILE="$CASE_DIR/api-fail-once"
  API_FAIL_AFTER_MERGE_ARM="$CASE_DIR/api-fail-after-merge-arm"
  MANIFEST="$STATE/$MANIFEST_REL"
  mkdir -p "$CASE_DIR" "$BIN" "$CONTROL"
  : >"$CODEX_CALLS"
  : >"$PNPM_BRANCHES"

  git init --bare "$REMOTE" >/dev/null
  git init -b planning "$SEED" >/dev/null
  git -C "$SEED" config user.email fixture@example.test
  git -C "$SEED" config user.name fixture
  mkdir -p "$SEED/$(dirname "$MANIFEST_REL")"
  cp "$SOURCE_MANIFEST" "$SEED/$MANIFEST_REL"
  jq '
    .base_branch="planning" |
    .waves |= to_entries | .waves |= map(
      if .key == 0 then .value
      else
        .value |
        .status="pending" | .start_sha=null |
        .tasks |= map(if .status == "blocked" then .verification=null | .evidence=null else .status="pending" | .verification=null | .evidence=null end) |
        .checkpoint.status="pending" | .checkpoint.requested_end_sha=null | .checkpoint.reviewed_sha=null |
        .checkpoint.remediation_attempts=0 | .checkpoint.active_remediation=null | .checkpoint.remediation_block=null |
        if .human_gate then .human_gate.status="pending" | .human_gate.approved_by=null | .human_gate.approved_at=null | .human_gate.approved_reviewed_sha=null else . end
      end
    )
  ' "$SEED/$MANIFEST_REL" >"$SEED/manifest.tmp"
  mv "$SEED/manifest.tmp" "$SEED/$MANIFEST_REL"
  git -C "$SEED" add .
  git -C "$SEED" commit -m 'fixture product baseline' >/dev/null
  product_sha="$(git -C "$SEED" rev-parse HEAD)"

  manifest_tmp="$SEED/manifest.tmp"
  jq --arg sha "$product_sha" '
    .waves[0].status="running" |
    .waves[0].start_sha=$sha |
    .waves[0].tasks |= map(
      .status="completed" |
      .verification={
        status:"passed",repository:"fixture/NextShift-OS-2.0",base_branch:"planning",
        task_branch:("fixture-" + .id),pr_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/1",
        verified_head_sha:$sha,implementation_report:"docs/fixture-task-report.md",
        dispatch_artifact:("docs/nextshift-os-3/os-3-8/runs/" + .id + "_DISPATCH.json"),
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
    .waves[0].checkpoint.status="changes_requested" |
    .waves[0].checkpoint.requested_end_sha=$sha |
    .waves[0].checkpoint.reviewed_sha=null |
    .waves[0].checkpoint.remediation_attempts=0 |
    del(.waves[0].checkpoint.active_remediation) |
    del(.waves[0].checkpoint.remediation_block)
  ' "$SEED/$MANIFEST_REL" >"$manifest_tmp"
  mv "$manifest_tmp" "$SEED/$MANIFEST_REL"
  mkdir -p "$SEED/$(dirname "$REQUEST_REL")"
  printf '# W1 Architecture Review Request\n\n- Cumulative product end SHA: %s\n' \
    "$product_sha" >"$SEED/$REQUEST_REL"
  printf 'VERDICT=CHANGES_REQUESTED\nREVIEWED_SHA=%s\n\n## Findings\n- Fix the bounded fixture defect.\n' \
    "$product_sha" >"$SEED/$RESULT_REL"
  git -C "$SEED" add .
  git -C "$SEED" commit -m 'fixture architecture review changes requested' >/dev/null
  git -C "$SEED" remote add origin "$REMOTE"
  git -C "$SEED" push -u origin planning >/dev/null

  git clone -b planning "$REMOTE" "$STATE" >/dev/null
  git -C "$STATE" config user.email fixture@example.test
  git -C "$STATE" config user.name fixture
  write_fake_tools
}

run_cycle() {
  local codex_mode="$1"
  PATH="$BIN:$PATH" \
  FIXTURE_CASE_DIR="$CASE_DIR" \
  FIXTURE_REMOTE="$REMOTE" \
  FIXTURE_PR_FILE="$PR_FILE" \
  FIXTURE_PR_URL="$PR_URL" \
  FIXTURE_CODEX_CALLS="$CODEX_CALLS" \
  FIXTURE_PNPM_BRANCHES="$PNPM_BRANCHES" \
  FIXTURE_MERGE_FAIL_ONCE_FILE="$MERGE_FAIL_ONCE_FILE" \
  FIXTURE_API_FAIL_ONCE_FILE="$API_FAIL_ONCE_FILE" \
  FIXTURE_API_FAIL_AFTER_MERGE_ARM="$API_FAIL_AFTER_MERGE_ARM" \
  FAKE_CODEX_MODE="$codex_mode" \
  PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 \
  PIPELINE_EXPECTED_REPOSITORY="$EXPECTED_REPOSITORY" \
  PIPELINE_ALLOW_PRODUCT_DISPATCH=1 \
  PIPELINE_ALLOW_PR_MERGE=1 \
  CODEX_CMD="$BIN/codex-fixture" \
  REPO_DIR="$STATE" \
  MANIFEST_PATH="$MANIFEST" \
  CONTROL_ROOT="$CONTROL" \
  "$PIPELINE" --cycle
}

plan_action() {
  PATH="$BIN:$PATH" \
  PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 \
  PIPELINE_EXPECTED_REPOSITORY="$EXPECTED_REPOSITORY" \
  REPO_DIR="$STATE" \
  MANIFEST_PATH="$MANIFEST" \
  "$PIPELINE" --plan | jq -r '.action'
}

record_changes_requested() {
  local source="$1" reviewed_sha="$2"
  printf 'VERDICT=CHANGES_REQUESTED\nREVIEWED_SHA=%s\n\n## Findings\n- The reviewed remediation still needs bounded correction.\n' \
    "$reviewed_sha" >"$source"
  PATH="$BIN:$PATH" \
  PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 \
  PIPELINE_EXPECTED_REPOSITORY="$EXPECTED_REPOSITORY" \
  REPO_DIR="$STATE" \
  MANIFEST_PATH="$MANIFEST" \
  "$PIPELINE" --record-review-result AR-W1 CHANGES_REQUESTED "$source"
}

reservation_commit() {
  git -C "$STATE" log --format='%H' \
    --grep='^chore(pipeline): reserve remediation for AR-W1$' -1
}

assert_atomic_reservation() {
  local commit artifact files count
  commit="$(reservation_commit)"
  if [[ ! "$commit" =~ ^[0-9a-f]{40}$ ]]; then
    [[ ! -f "$CASE_DIR/cycle.log" ]] || sed -n '1,240p' "$CASE_DIR/cycle.log" >&2
    [[ ! -f "$MANIFEST" ]] || jq '.waves[0].checkpoint' "$MANIFEST" >&2
    git -C "$STATE" status --short >&2 || true
    fail 'reservation commit is missing'
  fi
  artifact="$(git -C "$STATE" show "$commit:$MANIFEST_REL" | jq -r '.waves[0].checkpoint.active_remediation.artifact')"
  [[ -n "$artifact" && "$artifact" != null ]] || fail 'reservation artifact is absent from committed Manifest'
  files="$(git -C "$STATE" diff-tree --no-commit-id --name-only -r "$commit")"
  count="$(wc -l <<<"$files" | tr -d ' ')"
  assert_eq "$count" 2 'reservation commit must contain exactly Manifest and run artifact'
  grep -Fxq "$MANIFEST_REL" <<<"$files" || fail 'reservation commit omits Manifest'
  grep -Fxq "$artifact" <<<"$files" || fail 'reservation commit omits canonical run artifact'
  assert_eq "$(git -C "$STATE" show "$commit:$artifact" | jq -r '.status')" running \
    'reservation artifact status'
  git --git-dir="$REMOTE" merge-base --is-ancestor "$commit" refs/heads/planning || \
    fail 'reservation commit was not pushed to planning'
  RESERVATION_ARTIFACT="$artifact"
}

fixture_codex_failure_is_recoverable() {
  local rc attempts active action
  create_fixture failure
  set +e
  run_cycle failure >"$CASE_DIR/cycle.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'failing Codex unexpectedly completed remediation'
  assert_atomic_reservation
  pass 'remediation_reservation_atomic_persistence'

  attempts="$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")"
  active="$(jq -r '.waves[0].checkpoint.active_remediation.run_id // empty' "$MANIFEST")"
  action="$(plan_action)"
  assert_eq "$attempts" 0 'Codex failure must not increment remediation attempts'
  [[ -n "$active" ]] || fail 'Codex failure lost active remediation reservation'
  assert_eq "$action" remediation_recovery 'restart must select active remediation recovery'
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" 1 'Codex invocation count after failure'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'failure fixture left planning worktree dirty'
  pass 'codex_failure_attempts_unchanged_active_recovery'
}

fixture_successful_remediation_cycle() {
  local run artifact pr_state merge_sha requested_sha request archive_request archive_result
  create_fixture success
  if ! run_cycle success >"$CASE_DIR/cycle.log" 2>&1; then
    sed -n '1,240p' "$CASE_DIR/cycle.log" >&2
    fail 'successful remediation cycle failed'
  fi
  assert_atomic_reservation

  run="$(git -C "$STATE" show "$(reservation_commit):$MANIFEST_REL" | jq -r '.waves[0].checkpoint.active_remediation.run_id')"
  artifact="$RESERVATION_ARTIFACT"
  pr_state="$(jq -r '.state' "$PR_FILE")"
  merge_sha="$(jq -r '.mergeCommit.oid' "$PR_FILE")"
  assert_eq "$pr_state" MERGED 'remediation PR final state'
  assert_eq "$(jq -r '.verification.status' "$STATE/$artifact")" passed 'persisted remediation verification status'
  assert_eq "$(jq -r '.verification.checks' "$STATE/$artifact")" passed 'persisted remediation checks status'
  assert_eq "$(jq -r '.completion.merge_sha' "$STATE/$artifact")" "$merge_sha" 'completion merge SHA'
  pass 'remediation_pr_verify_merge_completion'

  requested_sha="$(jq -r '.waves[0].checkpoint.requested_end_sha' "$MANIFEST")"
  request="$STATE/$REQUEST_REL"
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" awaiting_review \
    'remediation completion checkpoint status'
  assert_eq "$requested_sha" "$merge_sha" 'regenerated checkpoint product SHA'
  grep -Fq "Cumulative product end SHA: $merge_sha" "$request" || \
    fail 'regenerated checkpoint request has wrong end SHA'
  grep -Fq "Remediation run: $run" "$request" || \
    fail 'regenerated checkpoint request omits remediation run'
  pass 'remediation_regenerates_checkpoint_awaiting_review'

  archive_request="$(jq -r '.source_review_request' "$STATE/$artifact")"
  archive_result="$(jq -r '.source_review_result' "$STATE/$artifact")"
  [[ ! -e "$STATE/$RESULT_REL" ]] || fail 'old canonical review result was not removed'
  [[ -f "$STATE/$archive_request" && -f "$STATE/$archive_result" ]] || \
    fail 'source review request/result archives are missing'
  grep -Fqx 'VERDICT=CHANGES_REQUESTED' "$STATE/$archive_result" || \
    fail 'archived result lost its CHANGES_REQUESTED verdict'
  pass 'source_review_result_archived_before_new_review'

  assert_eq "$(jq -r '.waves[0].checkpoint.active_remediation // null' "$MANIFEST")" null \
    'active remediation after completion'
  pass 'active_remediation_cleared'

  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 1 \
    'successful remediation attempt count'
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" 1 'successful Codex invocation count'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'success fixture left planning worktree dirty'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$(git -C "$STATE" rev-parse origin/planning)" \
    'success fixture local/remote planning synchronization'
  pass 'remediation_attempt_incremented_once'
}

fixture_verified_open_restart_recovery() {
  local rc action artifact verification_before verification_after
  create_fixture verified_open_restart
  : >"$MERGE_FAIL_ONCE_FILE"

  set +e
  run_cycle success >"$CASE_DIR/first-cycle.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'first restart fixture merge did not fail as requested'
  [[ ! -e "$MERGE_FAIL_ONCE_FILE" ]] || fail 'fake gh did not consume its one-shot merge failure'

  artifact="$(jq -r '.waves[0].checkpoint.active_remediation.artifact // empty' "$MANIFEST")"
  [[ -n "$artifact" && -f "$STATE/$artifact" ]] || fail 'verified/open restart lost active artifact'
  verification_before="$(jq -Sc '.verification' "$STATE/$artifact")"
  jq -e '
    .status == "passed" and
    .checks == "passed" and
    (.head_sha | test("^[0-9a-f]{40}$"))
  ' <<<"$verification_before" >/dev/null || fail 'pre-restart verification was not persisted'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 0 \
    'failed merge must not increment remediation attempts'
  [[ -n "$(jq -r '.waves[0].checkpoint.active_remediation.run_id // empty' "$MANIFEST")" ]] || \
    fail 'failed merge cleared active remediation'
  assert_eq "$(jq -r '.state' "$PR_FILE")" OPEN 'PR state after one-shot merge failure'
  action="$(plan_action)"
  assert_eq "$action" remediation_recovery 'verified/open restart action'
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" 1 'Codex invocation count before recovery'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'failed merge left planning worktree dirty'
  pass 'verified_open_merge_failure_preserves_active_verification'

  if ! run_cycle success >"$CASE_DIR/recovery-cycle.log" 2>&1; then
    sed -n '1,260p' "$CASE_DIR/recovery-cycle.log" >&2
    fail 'verified/open remediation recovery failed'
  fi
  verification_after="$(jq -Sc '.verification' "$STATE/$artifact")"
  assert_eq "$verification_after" "$verification_before" \
    'semantic verification idempotency must preserve original timestamped evidence'
  grep -Fxq DETACHED "$PNPM_BRANCHES" || fail 'recovery verification did not run from exact detached head'
  assert_eq "$(jq -r '.state' "$PR_FILE")" MERGED 'recovered PR final state'
  assert_eq "$(jq -r '.completion.recovered' "$STATE/$artifact")" true 'recovery evidence marker'
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" awaiting_review \
    'recovered remediation checkpoint status'
  assert_eq "$(jq -r '.waves[0].checkpoint.active_remediation // null' "$MANIFEST")" null \
    'active remediation after restart completion'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 1 \
    'restart completion attempt count'
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" 1 \
    'restart must not invoke Codex again'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'recovery left planning worktree dirty'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$(git -C "$STATE" rev-parse origin/planning)" \
    'restart fixture local/remote planning synchronization'
  pass 'verified_open_restart_exact_head_idempotent_recovery'
}

fixture_branch_only_unique_pr_recovery() {
  local rc action artifact
  create_fixture branch_only_unique_pr
  : >"$API_FAIL_ONCE_FILE"

  set +e
  run_cycle success >"$CASE_DIR/first-cycle.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'branch-only fixture did not stop before PR metadata persistence'
  [[ ! -e "$API_FAIL_ONCE_FILE" ]] || fail 'fake gh did not consume its one-shot API failure'
  [[ -f "$PR_FILE" ]] || fail 'Codex did not create the recoverable PR registry'
  artifact="$(jq -r '.waves[0].checkpoint.active_remediation.artifact // empty' "$MANIFEST")"
  [[ -n "$artifact" && -f "$STATE/$artifact" ]] || fail 'branch-only recovery lost active artifact'
  assert_eq "$(jq -r '.waves[0].checkpoint.active_remediation.pr_url // empty' "$MANIFEST")" "" \
    'branch-only fixture unexpectedly persisted PR URL'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 0 \
    'branch-only interruption attempt count'
  action="$(plan_action)"
  assert_eq "$action" remediation_recovery 'branch-only restart action'
  pass 'branch_only_active_run_queries_unique_pr'

  if ! run_cycle success >"$CASE_DIR/recovery-cycle.log" 2>&1; then
    sed -n '1,280p' "$CASE_DIR/recovery-cycle.log" >&2
    fail 'branch-only unique PR recovery failed'
  fi
  assert_eq "$(jq -r '.state' "$PR_FILE")" MERGED 'branch-only recovered PR state'
  assert_eq "$(jq -r '.completion.recovered' "$STATE/$artifact")" true \
    'branch-only recovery evidence marker'
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" awaiting_review \
    'branch-only recovery checkpoint status'
  assert_eq "$(jq -r '.waves[0].checkpoint.active_remediation // null' "$MANIFEST")" null \
    'branch-only active remediation after completion'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 1 \
    'branch-only recovery attempt count'
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" 1 \
    'branch-only recovery must not invoke Codex again'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'branch-only recovery left planning worktree dirty'
  pass 'branch_only_unique_pr_recovery_completed'
}

fixture_two_reviewed_failures_need_human() {
  local first_sha second_sha first_result second_result artifact_count codex_before_third
  create_fixture two_reviewed_failures

  if ! run_cycle success >"$CASE_DIR/attempt-1.log" 2>&1; then
    sed -n '1,280p' "$CASE_DIR/attempt-1.log" >&2
    fail 'first remediation attempt failed'
  fi
  first_sha="$(jq -r '.waves[0].checkpoint.requested_end_sha' "$MANIFEST")"
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" awaiting_review \
    'attempt 1 checkpoint status'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 1 \
    'attempt 1 count'
  pass 'two_failure_attempt_1_completed'

  first_result="$CONTROL/review-after-attempt-1.md"
  record_changes_requested "$first_result" "$first_sha" >"$CASE_DIR/review-1.log" 2>&1
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" changes_requested \
    'review after attempt 1 status'
  assert_eq "$(plan_action)" remediation 'review after attempt 1 action'
  pass 'second_changes_requested_selects_real_attempt_2'

  if ! run_cycle success >"$CASE_DIR/attempt-2.log" 2>&1; then
    sed -n '1,320p' "$CASE_DIR/attempt-2.log" >&2
    fail 'second remediation attempt failed'
  fi
  second_sha="$(jq -r '.waves[0].checkpoint.requested_end_sha' "$MANIFEST")"
  [[ "$second_sha" != "$first_sha" ]] || fail 'attempt 2 did not produce a new requested product SHA'
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" awaiting_review \
    'attempt 2 checkpoint status'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 2 \
    'attempt 2 count'
  artifact_count="$(find "$STATE/docs/nextshift-os-3/os-3-8/runs" -type f -name 'W1-AR-W1-r*.json' | wc -l | tr -d ' ')"
  assert_eq "$artifact_count" 2 'two real remediation run artifacts'
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" 2 'Codex count after attempt 2'
  pass 'real_remediation_attempt_2_completed'

  second_result="$CONTROL/review-after-attempt-2.md"
  record_changes_requested "$second_result" "$second_sha" >"$CASE_DIR/review-2.log" 2>&1
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" needs_human \
    'second reviewed remediation failure status'
  assert_eq "$(plan_action)" needs_human 'second reviewed remediation failure action'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 2 \
    'needs_human attempt count'
  [[ -f "$STATE/$RESULT_REL" ]] || fail 'canonical second failure review result is missing'
  grep -Fqx 'VERDICT=CHANGES_REQUESTED' "$STATE/$RESULT_REL" || \
    fail 'canonical second failure result has wrong verdict'
  grep -Fqx "REVIEWED_SHA=$second_sha" "$STATE/$RESULT_REL" || \
    fail 'canonical second failure result has wrong reviewed SHA'
  pass 'two_reviewed_failures_transition_needs_human'

  codex_before_third="$(wc -l <"$CODEX_CALLS" | tr -d ' ')"
  run_cycle success >"$CASE_DIR/third-cycle.log" 2>&1
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" "$codex_before_third" \
    'needs_human must not start a third remediation'
  assert_eq "$codex_before_third" 2 'final Codex invocation count'
  assert_eq "$(find "$STATE/docs/nextshift-os-3/os-3-8/runs" -type f -name 'W1-AR-W1-r*.json' | wc -l | tr -d ' ')" 2 \
    'needs_human must not reserve a third remediation artifact'
  pass 'third_remediation_forbidden_after_two_failures'
}

fixture_merged_before_completion_recovery() {
  local rc artifact action
  create_fixture merged_before_completion
  : >"$API_FAIL_AFTER_MERGE_ARM"

  set +e
  run_cycle success >"$CASE_DIR/first-cycle.log" 2>&1
  rc=$?
  set -e
  (( rc != 0 )) || fail 'merged-before-completion fixture did not stop after merge'
  [[ ! -e "$API_FAIL_AFTER_MERGE_ARM" && ! -e "$API_FAIL_ONCE_FILE" ]] || \
    fail 'post-merge API failure was not consumed exactly once'
  artifact="$(jq -r '.waves[0].checkpoint.active_remediation.artifact // empty' "$MANIFEST")"
  [[ -n "$artifact" && -f "$STATE/$artifact" ]] || fail 'post-merge interruption lost active artifact'
  assert_eq "$(jq -r '.state' "$PR_FILE")" MERGED 'PR state at post-merge interruption'
  assert_eq "$(jq -r '.verification.status' "$STATE/$artifact")" passed \
    'post-merge interruption verification status'
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" changes_requested \
    'post-merge interruption checkpoint status'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 0 \
    'post-merge interruption attempt count'
  [[ -n "$(jq -r '.waves[0].checkpoint.active_remediation.run_id // empty' "$MANIFEST")" ]] || \
    fail 'post-merge interruption cleared active remediation'
  action="$(plan_action)"
  assert_eq "$action" remediation_recovery 'post-merge interruption restart action'
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" 1 \
    'post-merge interruption Codex count'
  pass 'merged_before_completion_state_is_recoverable'

  if ! run_cycle success >"$CASE_DIR/recovery-cycle.log" 2>&1; then
    sed -n '1,300p' "$CASE_DIR/recovery-cycle.log" >&2
    fail 'merged-before-completion recovery failed'
  fi
  assert_eq "$(jq -r '.completion.recovered' "$STATE/$artifact")" true \
    'merged recovery evidence marker'
  assert_eq "$(jq -r '.waves[0].checkpoint.status' "$MANIFEST")" awaiting_review \
    'merged recovery checkpoint status'
  assert_eq "$(jq -r '.waves[0].checkpoint.active_remediation // null' "$MANIFEST")" null \
    'merged recovery active remediation'
  assert_eq "$(jq -r '.waves[0].checkpoint.remediation_attempts' "$MANIFEST")" 1 \
    'merged recovery attempt count'
  assert_eq "$(wc -l <"$CODEX_CALLS" | tr -d ' ')" 1 \
    'merged recovery must not invoke Codex again'
  [[ -z "$(git -C "$STATE" status --porcelain)" ]] || fail 'merged recovery left planning worktree dirty'
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$(git -C "$STATE" rev-parse origin/planning)" \
    'merged recovery local/remote planning synchronization'
  pass 'merged_before_completion_restart_completed_without_codex'
}

fixture_codex_failure_is_recoverable
fixture_successful_remediation_cycle
fixture_verified_open_restart_recovery
fixture_branch_only_unique_pr_recovery
fixture_two_reviewed_failures_need_human
fixture_merged_before_completion_recovery
printf 'PASS: Group C remediation real-Git integration fixtures\n'
