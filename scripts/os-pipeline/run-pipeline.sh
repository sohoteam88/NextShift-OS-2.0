#!/usr/bin/env bash
# OS 3.8 manifest-driven pipeline runner. It never releases or deploys.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
MANIFEST_PATH="${MANIFEST_PATH:-$REPO_DIR/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json}"
LOG_DIR="${LOG_DIR:-$SCRIPT_DIR/logs}"
STOP_FILE="${STOP_FILE:-$LOG_DIR/STOP}"
CONTROL_ROOT="${CONTROL_ROOT:-${TMPDIR:-/tmp}/nextshift-os-pipeline-control}"
STATE_LOCK_DIR="${STATE_LOCK_DIR:-}"
VALIDATOR="$SCRIPT_DIR/validate-manifest.sh"
AUTO_RELEASE="${AUTO_RELEASE:-0}"
AUTO_DEPLOY="${AUTO_DEPLOY:-0}"
STATE_EXPECTED_HEAD=""

usage() {
  cat <<'EOF'
Usage: run-pipeline.sh [--manifest PATH] COMMAND [arguments]

Commands:
  --plan                               Print the next manifest action (default).
  --checkpoint                          Create the next wave review request and checkpoint it.
  --record-task-start TASK_ID           Transition a pending task to running.
  --record-task-completed TASK_ID       Transition a running task to completed (requires TASK_EVIDENCE_JSON).
  --record-review-result ID PASS|CHANGES_REQUESTED
  --record-remediation-result ID PASS|FAIL
  --record-steven-ia APPROVER TIMESTAMP Record the W2 human IA decision.
  --record-final-audit PASS|FAIL        Record only the final independent audit.
  --verify-pr PR_URL                    Run local gates and wait for required GitHub checks.
  --merge-task-pr TASK_ID PR_URL        Verify and merge an eligible task PR (explicit opt-in).
  --dispatch                            Explicitly dispatch the next eligible task (operator opt-in only).
  --cycle                               Route one restart-safe pipeline action (operator opt-in for task work).

The manifest is the sole state source. AUTO_RELEASE and AUTO_DEPLOY must remain 0.
EOF
}

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*" >&2; }
die() { log "ABORT: $*"; exit 1; }
require_jq() { command -v jq >/dev/null 2>&1 || die "jq is required"; }
write_manifest() { local tmp; tmp="$(mktemp "${MANIFEST_PATH}.XXXXXX")"; cat >"$tmp"; mv "$tmp" "$MANIFEST_PATH"; }

# Mandatory GitHub/local synchronization gate. It never repairs a divergent checkout.
synchronization_gate() {
  local expected_branch="$1" repo="${2:-$REPO_DIR}" remote_url local_head remote_head base_branch base_head counts
  [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] && { STATE_EXPECTED_HEAD="test-head"; return; }
  git -C "$repo" fetch origin --prune || die "git fetch origin --prune failed"
  remote_url="$(git -C "$repo" remote get-url origin)"
  [[ "${PIPELINE_ALLOW_LOCAL_TEST_REMOTE:-0}" == "1" || "$remote_url" == *"${PIPELINE_EXPECTED_REPOSITORY:-sohoteam88/NextShift-OS-2.0}"* ]] || die "unexpected repository origin: $remote_url"
  [[ "$(git -C "$repo" branch --show-current)" == "$expected_branch" ]] || die "unexpected branch; expected $expected_branch"
  [[ -z "$(git -C "$repo" status --porcelain)" ]] || die "dirty worktree (including untracked files)"
  local_head="$(git -C "$repo" rev-parse HEAD)"
  remote_head="$(git -C "$repo" rev-parse "origin/$expected_branch")" || die "missing remote branch: $expected_branch"
  [[ "$local_head" == "$remote_head" ]] || die "local HEAD does not equal origin/$expected_branch"
  counts="$(git -C "$repo" rev-list --left-right --count "origin/$expected_branch...HEAD")"
  [[ "$counts" == $'0\t0' ]] || die "branch ahead/behind is not 0/0: $counts"
  base_branch="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  base_head="$(git -C "$repo" rev-parse "origin/$base_branch")" || die "missing manifest base branch: $base_branch"
  [[ -n "$base_head" ]] || die "base branch has no HEAD"
  STATE_EXPECTED_HEAD="$local_head"
  log "SYNC repository=$remote_url branch=$expected_branch local=$local_head remote=$remote_head base=$base_branch@$base_head ahead_behind=$counts"
}

persist_state() {
  local message="$1"; shift
  [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] && return
  local base_branch remote_now lock_age
  [[ -n "$STATE_LOCK_DIR" ]] || STATE_LOCK_DIR="$(git -C "$REPO_DIR" rev-parse --git-common-dir)/os-pipeline-state.lock"
  [[ "$STATE_LOCK_DIR" = /* ]] || STATE_LOCK_DIR="$REPO_DIR/$STATE_LOCK_DIR"
  mkdir -p "$(dirname "$STATE_LOCK_DIR")"
  if ! mkdir "$STATE_LOCK_DIR" 2>/dev/null; then
    lock_age="$(cat "$STATE_LOCK_DIR/owner" 2>/dev/null || true)"
    die "state transition lock is held (owner: ${lock_age:-unknown}); explicit human cleanup required: $STATE_LOCK_DIR"
  fi
  printf 'pid=%s started=%s repo=%s\n' "$$" "$(date -u +%FT%TZ)" "$REPO_DIR" >"$STATE_LOCK_DIR/owner"
  trap 'rm -f "$STATE_LOCK_DIR/owner"; rmdir "$STATE_LOCK_DIR" 2>/dev/null || true' RETURN
  base_branch="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  [[ "$(git -C "$REPO_DIR" branch --show-current)" == "$base_branch" ]] || die "state persistence requires authorized planning branch: $base_branch"
  [[ -n "$STATE_EXPECTED_HEAD" ]] || die "state persistence requires a synchronization gate"
  remote_now="$(git -C "$REPO_DIR" rev-parse "origin/$base_branch")"
  [[ "$remote_now" == "$STATE_EXPECTED_HEAD" ]] || die "planning branch changed after synchronization; refusing state write"
  git -C "$REPO_DIR" add -- "$MANIFEST_PATH" "$@"
  git -C "$REPO_DIR" diff --cached --quiet && die "state transition produced no staged artifact"
  git -C "$REPO_DIR" commit -m "$message"
  git -C "$REPO_DIR" push origin "$base_branch" || die "state push failed; do not retry without a new synchronization gate"
  [[ "$(git -C "$REPO_DIR" rev-parse HEAD)" == "$(git -C "$REPO_DIR" rev-parse "origin/$base_branch")" ]] || die "state commit did not reach origin"
  rm -f "$STATE_LOCK_DIR/owner"; rmdir "$STATE_LOCK_DIR" 2>/dev/null || true
  trap - RETURN
}

reconcile_planning_state() {
  local base_branch="$1" repo="$2"
  [[ -z "$(git -C "$repo" status --porcelain)" ]] || die "cannot reconcile a dirty planning checkout"
  git -C "$repo" fetch origin --prune || die "planning fetch failed"
  git -C "$repo" pull --ff-only origin "$base_branch" || die "planning reconciliation is not fast-forward; human resolution required"
  synchronization_gate "$base_branch" "$repo"
}

require_selected_task() {
  local id="$1" action
  action="$(select_action)"
  [[ "$(jq -r '.action' <<<"$action")" == "task" && "$(jq -r '.task' <<<"$action")" == "$id" ]] || die "task is not the selected eligible action: $id"
}

validate_evidence() {
  local evidence="$1"
  jq -e '
    type == "object" and
    (.pr_url | type == "string" and test("^https://github\\.com/sohoteam88/NextShift-OS-2\\.0/pull/[0-9]+$")) and
    (.merge_sha | type == "string" and test("^[0-9a-f]{40}$")) and
    (.implementation_report | type == "string" and length > 0) and
    (.validation | type == "object" and (.checks == "passed"))
  ' <<<"$evidence" >/dev/null || die "evidence must include verified PR, merge SHA, report, and passed validation"
}
artifact_path() {
  local relative="$1"
  if [[ "$relative" == /* ]]; then printf '%s\n' "$relative"; elif [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then printf '%s/%s\n' "$(dirname "$MANIFEST_PATH")" "$(basename "$relative")"; else printf '%s/%s\n' "$REPO_DIR" "$relative"; fi
}
assert_checkpoint_fresh() {
  local requested_sha="$1" changed
  [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] && return
  changed="$(git -C "$REPO_DIR" diff --name-only "$requested_sha...HEAD")"
  if grep -Ev '^(docs/nextshift-os-3/os-3-8/(reviews|runs)/|docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST\.json$)' <<<"$changed" | grep -q .; then
    die "stale review: product/code changed after checkpoint request"
  fi
}

manifest_ids() { jq -r '[.waves[] | .tasks[]?.id, .checkpoint.id, .human_gate?.id] | .[]? // empty' "$MANIFEST_PATH"; }
wave_for_id() { jq -r --arg id "$1" '.waves[] | select((.tasks[]?.id == $id) or .checkpoint.id == $id or .human_gate?.id == $id) | .id' "$MANIFEST_PATH" | head -n1; }

dependency_satisfied() {
  local dep="$1" status
  status="$(jq -r --arg id "$dep" '
    [(.waves[] | .tasks[]? | select(.id == $id) | .status),
     (.waves[] | select(.checkpoint.id == $id) | .checkpoint.status),
     (.waves[] | select(.human_gate?.id == $id) | .human_gate.status)] | .[]? // empty
  ' "$MANIFEST_PATH" | head -n1)"
  [[ "$status" == "completed" || "$status" == "passed" || "$status" == "approved" ]]
}

select_action() {
  local wave checkpoint cp_status task gate gate_status deps_ok
  while IFS= read -r wave; do
    checkpoint="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.id' "$MANIFEST_PATH")"
    cp_status="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.status' "$MANIFEST_PATH")"
    case "$cp_status" in
      needs_human) jq -n --arg id "$checkpoint" '{action:"needs_human", checkpoint:$id}'; return ;;
      awaiting_review) jq -n --arg id "$checkpoint" '{action:"awaiting_review", checkpoint:$id}'; return ;;
      changes_requested)
        local attempts max
        attempts="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | (.checkpoint.remediation_attempts // 0)' "$MANIFEST_PATH")"
        max="$(jq -r '.execution_policy.max_architecture_remediation_attempts' "$MANIFEST_PATH")"
        if (( attempts >= max )); then
          jq -n --arg id "$checkpoint" --argjson attempts "$attempts" '{action:"needs_human", checkpoint:$id, remediation_attempts:$attempts}'
        else
          jq -n --arg id "$checkpoint" --argjson attempt "$((attempts + 1))" '{action:"remediation", checkpoint:$id, attempt:$attempt}'
        fi
        return
        ;;
    esac

    # A passed wave may still require its explicit human gate before the next wave.
    if [[ "$cp_status" == "passed" ]]; then
      gate="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .human_gate?.id // empty' "$MANIFEST_PATH")"
      if [[ -n "$gate" ]]; then
        gate_status="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .human_gate.status' "$MANIFEST_PATH")"
        [[ "$gate_status" == "approved" ]] || { jq -n --arg id "$gate" '{action:"awaiting_human_gate", gate:$id}'; return; }
      fi
      continue
    fi

    while IFS= read -r task; do
      [[ -z "$task" ]] && continue
      deps_ok=1
      while IFS= read -r dep; do dependency_satisfied "$dep" || deps_ok=0; done < <(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .depends_on[]?' "$MANIFEST_PATH")
      if (( deps_ok )); then jq -n --arg wave "$wave" --arg task "$task" '{action:"task", wave:$wave, task:$task}'; return; fi
    done < <(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .tasks[] | select(.status == "pending") | .id' "$MANIFEST_PATH")

    if [[ "$(jq -r --arg wave "$wave" '[.waves[] | select(.id == $wave) | .tasks[].status] | all(. == "completed" or . == "superseded")' "$MANIFEST_PATH")" == "true" ]]; then
      jq -n --arg wave "$wave" --arg id "$checkpoint" '{action:"checkpoint", wave:$wave, checkpoint:$id}'; return
    fi
    jq -n --arg wave "$wave" '{action:"blocked", wave:$wave}'; return
  done < <(jq -r '.waves[].id' "$MANIFEST_PATH")

  local audit_status
  audit_status="$(jq -r '.final_audit.status' "$MANIFEST_PATH")"
  if [[ "$audit_status" == "pending" ]]; then jq -n '{action:"final_audit"}'; else jq -n --arg status "$audit_status" '{action:"complete", final_audit:$status}'; fi
}

update_task_status() {
  local id="$1" from="$2" to="$3" evidence="${4:-null}"
  jq --arg id "$id" --arg from "$from" --arg to "$to" --argjson evidence "$evidence" '
    .waves |= map(.tasks |= map(if .id == $id and .status == $from then .status = $to | if $evidence != null then .evidence = $evidence else . end else . end))
  ' "$MANIFEST_PATH" | write_manifest
}

start_task() {
  local id="$1" wave sha
  wave="$(wave_for_id "$id")"; [[ -n "$wave" ]] || die "unknown task: $id"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then sha="test-start-sha"; else sha="$(git -C "$REPO_DIR" rev-parse HEAD)"; fi
  jq --arg id "$id" --arg wave "$wave" --arg sha "$sha" '
    .waves |= map(if .id == $wave then
      .status = "running" |
      if .start_sha == null then .start_sha = $sha else . end |
      .tasks |= map(if .id == $id and .status == "pending" then .status = "running" else . end)
    else . end)
  ' "$MANIFEST_PATH" | write_manifest
}

record_checkpoint() {
  local id="$1" result="$2" attempts="${3:-}"
  if [[ -n "$attempts" ]]; then
    jq --arg id "$id" --arg status "$result" --argjson attempts "$attempts" '
      .waves |= map(if .checkpoint.id == $id then .checkpoint.status = $status | .checkpoint.remediation_attempts = $attempts else . end)
    ' "$MANIFEST_PATH" | write_manifest
  else
    jq --arg id "$id" --arg status "$result" '
      .waves |= map(if .checkpoint.id == $id then .checkpoint.status = $status else . end)
    ' "$MANIFEST_PATH" | write_manifest
  fi
}

create_checkpoint() {
  local action wave checkpoint base_sha end_sha request report_lines changed_files
  action="$(select_action)"
  [[ "$(jq -r '.action' <<<"$action")" == "checkpoint" ]] || die "no wave checkpoint is eligible"
  wave="$(jq -r '.wave' <<<"$action")"; checkpoint="$(jq -r '.checkpoint' <<<"$action")"
  synchronization_gate "$(jq -r '.base_branch' "$MANIFEST_PATH")"
  base_sha="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .start_sha // empty' "$MANIFEST_PATH")"
  [[ -n "$base_sha" ]] || die "wave $wave has no start_sha evidence"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then end_sha="0123456789012345678901234567890123456789"; else end_sha="$(git -C "$REPO_DIR" rev-parse HEAD)"; fi
  request="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.request_artifact' "$MANIFEST_PATH")"
  request="$(artifact_path "$request")"
  mkdir -p "$(dirname "$request")"
  if [[ "${PIPELINE_TEST_MODE:-0}" != "1" ]]; then
    changed_files="$(git -C "$REPO_DIR" diff --name-only "$base_sha...$end_sha" || true)"
    report_lines="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .tasks[] | "- \(.id): PR=\(.evidence.pr_url // "missing") merge=\(.evidence.merge_sha // "missing") report=\(.evidence.implementation_report // "missing") validation=\(.evidence.validation.checks // "missing")"' "$MANIFEST_PATH")"
    cat >"$request" <<EOF
# ${wave} Architecture Review Request

- Checkpoint: \`${checkpoint}\`
- Cumulative start SHA: \`${base_sha}\`
- Cumulative end SHA: \`${end_sha}\`
- Manifest: \`docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json\`

## Completed tasks

${report_lines}

## Changed files

\`\`\`
${changed_files}
\`\`\`

## Review instructions

Review \`git diff ${base_sha}...${end_sha}\`, task reports, validation evidence, and known limitations recorded in each task report. Save a result artifact at the manifest-designated result path with \`VERDICT=PASS\` or \`VERDICT=CHANGES_REQUESTED\`, the reviewed SHA, findings, and remediation requirements. The pipeline cannot approve this checkpoint itself.
EOF
  else
    printf '# %s Architecture Review Request\nCheckpoint: %s\nCumulative start SHA: %s\nCumulative end SHA: %s\n' "$wave" "$checkpoint" "$base_sha" "$end_sha" >"$request"
  fi
  jq --arg id "$checkpoint" --arg end_sha "$end_sha" '.waves |= map(if .checkpoint.id == $id then .checkpoint.status="awaiting_review" | .checkpoint.requested_end_sha=$end_sha else . end)' "$MANIFEST_PATH" | write_manifest
  persist_state "chore(pipeline): request ${checkpoint} architecture review" "$request"
  log "${checkpoint} is awaiting independent Architecture Review: $request"
}

dispatch_task() {
  [[ "${PIPELINE_ALLOW_PRODUCT_DISPATCH:-0}" == "1" ]] || die "dispatch requires PIPELINE_ALLOW_PRODUCT_DISPATCH=1"
  [[ -n "${CODEX_CMD:-}" ]] || die "dispatch requires an explicit CODEX_CMD; no unsafe default is provided"
  [[ ! -e "$STOP_FILE" ]] || die "STOP file exists: $STOP_FILE"
  local base_branch action task task_branch task_dir control_dir brief outcome log_file contract execution_task dispatch_artifact title section deps
  base_branch="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  synchronization_gate "$base_branch"
  action="$(select_action)"; [[ "$(jq -r '.action' <<<"$action")" == "task" ]] || die "no eligible product task to dispatch"
  task="$(jq -r '.task' <<<"$action")"
  require_selected_task "$task"
  task_branch="chore/os-3.8-$(printf '%s' "$task" | tr '[:upper:]' '[:lower:]')-$(date -u +%Y%m%d%H%M%S)"
  task_dir="$(mktemp -d "${TMPDIR:-/tmp}/os38-${task}.XXXXXX")"
  mkdir -p "$CONTROL_ROOT"; control_dir="$(mktemp -d "$CONTROL_ROOT/${task}.XXXXXX")"
  brief="$control_dir/TASK_BRIEF.md"; outcome="$control_dir/TASK_OUTCOME.json"; log_file="$control_dir/codex.log"
  contract="$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .contract // empty' "$MANIFEST_PATH")"
  execution_task="$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .execution_task // empty' "$MANIFEST_PATH")"
  title="$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .title' "$MANIFEST_PATH")"
  section="$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .blueprint_section' "$MANIFEST_PATH")"
  deps="$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | (.depends_on | join(", "))' "$MANIFEST_PATH")"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then
    task_branch="test-os38-${task}"
  else
    git -C "$REPO_DIR" worktree add -b "$task_branch" "$task_dir" "origin/$base_branch" || die "could not create fresh task branch"
    if [[ -n "$contract" ]]; then [[ -f "$task_dir/$contract" ]] || die "committed task contract missing: $contract"; fi
  fi
  cat >"$brief" <<EOF
# Bounded OS 3.8 task: $task

Title: $title
Base branch: $base_branch
Task branch: $task_branch
Blueprint: $(jq -r '.blueprint' "$MANIFEST_PATH") section $section
Dependencies already satisfied: ${deps:-none}
Contract: ${contract:-none; generate a bounded brief from the manifest task only}
Execution task: ${execution_task:-none}

Read the Blueprint and current repository evidence before implementation. Implement only this selected task. Do not execute later OS 3.8 tasks, deploy, tag, release, or modify production. Open a PR targeting $base_branch. Write $outcome as JSON containing pr_url and implementation_report when complete.
EOF
  set +e
  (cd "$task_dir" && PIPELINE_TASK_ID="$task" PIPELINE_TASK_BRANCH="$task_branch" PIPELINE_TASK_BRIEF="$brief" PIPELINE_TASK_OUTCOME="$outcome" bash -lc "$CODEX_CMD") >"$log_file" 2>&1
  local codex_rc=$?
  set -e
  (( codex_rc == 0 )) || die "CODEX_CMD failed for $task; manifest remains pending (log: $log_file)"
  [[ -s "$outcome" ]] || die "CODEX_CMD produced no required task outcome; manifest remains pending (expected $outcome)"
  jq -e '(.pr_url | type == "string" and test("^https://github\\.com/sohoteam88/NextShift-OS-2\\.0/pull/[0-9]+$")) and (.implementation_report | type == "string" and length > 0)' "$outcome" >/dev/null || die "task outcome requires valid pr_url and implementation_report"
  if [[ "${PIPELINE_TEST_MODE:-0}" != "1" ]]; then [[ -z "$(git -C "$task_dir" status --porcelain)" ]] || die "task worktree is dirty; control files must remain outside it"; fi
  dispatch_artifact="$(artifact_path "docs/nextshift-os-3/os-3-8/runs/${task}_DISPATCH.json")"
  mkdir -p "$(dirname "$dispatch_artifact")"
  jq --arg task "$task" --arg branch "$task_branch" --arg base "$base_branch" --arg dispatched_at "$(date -u +%FT%TZ)" '. + {task_id:$task, task_branch:$branch, base_branch:$base, dispatched_at:$dispatched_at}' "$outcome" >"$dispatch_artifact"
  start_task "$task"
  persist_state "chore(pipeline): start OS 3.8 task $task" "$dispatch_artifact"
  if [[ "${PIPELINE_AUTOMATE_TASK_CYCLE:-0}" == "1" ]]; then
    local state_repo="$REPO_DIR"
    (REPO_DIR="$task_dir" MANIFEST_PATH="$task_dir/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" STATE_REPO_DIR="$state_repo" TASK_BRANCH="$task_branch" IMPLEMENTATION_REPORT="$(jq -r '.implementation_report' "$outcome")" PIPELINE_ALLOW_PR_MERGE="${PIPELINE_ALLOW_PR_MERGE:-0}" merge_task_pr "$task" "$(jq -r '.pr_url' "$outcome")")
  fi
  log "Task $task dispatched through CODEX_CMD on $task_branch; outcome captured at $outcome"
}

verify_pr() {
  local pr_url="$1" task_branch="${2:-${TASK_BRANCH:-}}" repo_json expected_repo expected_base local_head remote_head checks_deadline checks_rc
  command -v gh >/dev/null 2>&1 || die "gh is required for PR verification"
  [[ "$pr_url" == https://github.com/*/pull/* ]] || die "invalid PR URL"
  [[ -n "$task_branch" ]] || die "verification requires TASK_BRANCH"
  synchronization_gate "$task_branch"
  expected_repo="${PIPELINE_EXPECTED_REPOSITORY:-$(git -C "$REPO_DIR" remote get-url origin | sed -E 's#^.*github\.com[:/]##; s#\.git$##')}"
  expected_base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  repo_json="$(gh pr view "$pr_url" --json repository,baseRefName,headRefName,headRefOid,url)"
  [[ "$(jq -r '.repository.nameWithOwner' <<<"$repo_json")" == "$expected_repo" ]] || die "PR repository does not match origin"
  [[ "$(jq -r '.baseRefName' <<<"$repo_json")" == "$expected_base" ]] || die "PR base does not match manifest base branch"
  [[ "$(jq -r '.headRefName' <<<"$repo_json")" == "$task_branch" ]] || die "PR head branch does not match authorized task branch"
  local_head="$(git -C "$REPO_DIR" rev-parse HEAD)"; remote_head="$(git -C "$REPO_DIR" rev-parse "origin/$task_branch")"
  [[ "$local_head" == "$remote_head" && "$local_head" == "$(jq -r '.headRefOid' <<<"$repo_json")" ]] || die "local, remote task branch, and PR head SHA differ"
  if gh pr diff "$pr_url" --name-only | grep -Eq '(^|/)\.env($|\.)|^packages/|^prisma/migrations/|^\.github/workflows/deploy'; then
    die "PR changes a forbidden path"
  fi
  log "running required local verification"
  (cd "$REPO_DIR" && pnpm type-check && pnpm test && pnpm build && pnpm lint && git diff --check) || die "local verification failed"
  checks_deadline=$((SECONDS + 1800))
  while (( SECONDS < checks_deadline )); do
    set +e; gh pr checks "$pr_url" --watch --fail-fast; checks_rc=$?; set -e
    [[ "$checks_rc" == 0 ]] && { log "required GitHub checks passed"; return; }
    # GitHub can return before a newly-created workflow registers; retry only then.
    if gh pr checks "$pr_url" 2>&1 | grep -q 'no checks reported'; then sleep 30; continue; fi
    die "GitHub checks failed"
  done
  die "timed out waiting for GitHub checks"
}

merge_task_pr() {
  local task="$1" pr_url="$2" evidence state_repo state_manifest base_branch tmp
  [[ "${PIPELINE_ALLOW_PR_MERGE:-0}" == "1" ]] || die "merge requires PIPELINE_ALLOW_PR_MERGE=1"
  verify_pr "$pr_url" "${TASK_BRANCH:?TASK_BRANCH required}"
  gh pr merge "$pr_url" --squash --delete-branch || die "PR merge failed"
  state_repo="${STATE_REPO_DIR:?STATE_REPO_DIR must be a clean planning-branch checkout}"
  base_branch="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  REPO_DIR="$state_repo"
  MANIFEST_PATH="$state_repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
  reconcile_planning_state "$base_branch" "$state_repo"
  state_manifest="$MANIFEST_PATH"
  [[ "$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .status' "$state_manifest")" == "running" ]] || die "merged PR cannot be persisted because manifest is not running: $task"
  evidence="$(jq -n --arg pr "$pr_url" --arg merged_at "$(date -u +%FT%TZ)" --arg merge_sha "$(gh pr view "$pr_url" --json mergeCommit --jq '.mergeCommit.oid')" --arg report "${IMPLEMENTATION_REPORT:?IMPLEMENTATION_REPORT required}" '{pr_url:$pr, merge_sha:$merge_sha, implementation_report:$report, validation:{checks:"passed"}, merged_at:$merged_at}')"
  validate_evidence "$evidence"
  tmp="$(mktemp "${state_manifest}.XXXXXX")"
  jq --arg id "$task" --argjson evidence "$evidence" '.waves |= map(.tasks |= map(if .id == $id and .status == "running" then .status="completed" | .evidence=$evidence else . end))' "$state_manifest" >"$tmp" && mv "$tmp" "$state_manifest"
  persist_state "chore(pipeline): record merged OS 3.8 task $task"
}

create_final_audit_request() {
  local action request
  action="$(select_action)"; [[ "$(jq -r '.action' <<<"$action")" == "final_audit" ]] || die "final audit is not eligible"
  synchronization_gate "$(jq -r '.base_branch' "$MANIFEST_PATH")"
  request="$(artifact_path "audit/OS38_FINAL_CODE_REVIEW_REQUEST.md")"
  mkdir -p "$(dirname "$request")"
  cat >"$request" <<EOF
# OS 3.8 Final Audit Request

- Reviewed product SHA: $(jq -r '.waves[-1].checkpoint.reviewed_sha' "$MANIFEST_PATH")
- Manifest: docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json

Write the configured final audit report with VERDICT and REVIEWED_SHA. Release remains blocked.
EOF
  jq '.final_audit.status="running" | .release_gate.status="blocked"' "$MANIFEST_PATH" | write_manifest
  persist_state "chore(pipeline): request OS 3.8 final audit" "$request"
  log "clean stop: final audit requested"
}

run_cycle() {
  local action kind
  action="$(select_action)"; kind="$(jq -r '.action' <<<"$action")"
  case "$kind" in
    task)
      [[ "${PIPELINE_AUTOMATE_TASK_CYCLE:-0}" == "1" ]] || die "task cycle requires PIPELINE_AUTOMATE_TASK_CYCLE=1"
      dispatch_task
      ;;
    checkpoint) create_checkpoint ;;
    remediation) die "remediation requires --remediate CHECKPOINT with an explicit review result artifact" ;;
    final_audit) create_final_audit_request ;;
    awaiting_review|awaiting_human_gate|needs_human|complete)
      log "clean stop: $kind"; return 0 ;;
    *) die "cycle cannot proceed: $kind" ;;
  esac
}

require_jq
while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest) MANIFEST_PATH="${2:?--manifest requires a path}"; shift 2 ;;
    *) break ;;
  esac
done
"$VALIDATOR" --manifest "$MANIFEST_PATH" >/dev/null
[[ "$AUTO_RELEASE" == "0" && "$AUTO_DEPLOY" == "0" ]] || die "AUTO_RELEASE and AUTO_DEPLOY are permanently disabled by this runner"
command="${1:---plan}"

case "$command" in
  --plan|--select) select_action ;;
  --checkpoint) create_checkpoint ;;
  --record-task-start)
    id="${2:?task ID required}"; [[ "$(jq -r --arg id "$id" '[.waves[] | .tasks[] | select(.id == $id)] | length' "$MANIFEST_PATH")" == "1" ]] || die "unknown task: $id"
    [[ "$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == "pending" ]] || die "task must be pending: $id"
    synchronization_gate "$(jq -r '.base_branch' "$MANIFEST_PATH")"
    require_selected_task "$id"
    start_task "$id"
    persist_state "chore(pipeline): start OS 3.8 task $id"
    ;;
  --record-task-completed)
    [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] || die "direct completion is forbidden; use --merge-task-pr after verified PR merge"
    id="${2:?task ID required}"; evidence="${TASK_EVIDENCE_JSON:-}"
    [[ -n "$evidence" ]] || die "TASK_EVIDENCE_JSON is required"
    validate_evidence "$evidence"
    [[ "$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == "running" ]] || die "task must be running: $id"
    update_task_status "$id" running completed "$evidence"
    ;;
  --record-review-result)
    id="${2:?checkpoint ID required}"; result="${3:?PASS or CHANGES_REQUESTED required}"
    [[ "$result" == PASS || "$result" == CHANGES_REQUESTED ]] || die "review result must be PASS or CHANGES_REQUESTED"
    [[ "$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | .checkpoint.status' "$MANIFEST_PATH")" == "awaiting_review" ]] || die "checkpoint is not awaiting review: $id"
    result_source="${4:?result artifact file required}"
    [[ -f "$result_source" ]] || die "review result artifact is missing"
    grep -Fqx "VERDICT=$result" "$result_source" || die "review result verdict does not match command"
    synchronization_gate "$(jq -r '.base_branch' "$MANIFEST_PATH")"
    requested_sha="$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | .checkpoint.requested_end_sha // empty' "$MANIFEST_PATH")"
    result_sha="$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$result_source" | head -n1 | cut -d= -f2)"
    [[ -n "$requested_sha" && "$result_sha" == "$requested_sha" ]] || die "review result SHA must equal checkpoint requested product SHA"
    assert_checkpoint_fresh "$requested_sha"
    wave="$(wave_for_id "$id")"; result_target="$(artifact_path "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.result_artifact' "$MANIFEST_PATH")")"
    mkdir -p "$(dirname "$result_target")"; cp "$result_source" "$result_target"
    if [[ "$result" == PASS ]]; then
      reviewed_sha="$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$result_source" | head -n1 | cut -d= -f2)"
      [[ -n "$reviewed_sha" ]] || die "PASS result must include REVIEWED_SHA"
      jq --arg id "$id" --arg sha "$reviewed_sha" '.waves |= map(if .checkpoint.id == $id then .checkpoint.status="passed" | .checkpoint.reviewed_sha=$sha else . end)' "$MANIFEST_PATH" | write_manifest
    else record_checkpoint "$id" changes_requested; fi
    persist_state "chore(pipeline): record $id architecture review" "$result_target"
    ;;
  --record-remediation-result)
    id="${2:?checkpoint ID required}"; result="${3:?PASS or FAIL required}"
    [[ "$result" == PASS || "$result" == FAIL ]] || die "remediation result must be PASS or FAIL"
    status="$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | .checkpoint.status' "$MANIFEST_PATH")"
    [[ "$status" == changes_requested ]] || die "checkpoint is not in remediation: $id"
    synchronization_gate "$(jq -r '.base_branch' "$MANIFEST_PATH")"
    attempts="$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | (.checkpoint.remediation_attempts // 0)' "$MANIFEST_PATH")"
    if [[ "$result" == PASS ]]; then
      record_checkpoint "$id" awaiting_review "$attempts"
    else
      attempts=$((attempts + 1)); max="$(jq -r '.execution_policy.max_architecture_remediation_attempts' "$MANIFEST_PATH")"
      if (( attempts >= max )); then record_checkpoint "$id" needs_human "$attempts"; else record_checkpoint "$id" changes_requested "$attempts"; fi
    fi
    persist_state "chore(pipeline): record $id remediation result"
    ;;
  --record-steven-ia)
    approver="${2:?approver required}"; timestamp="${3:?timestamp required}"
    [[ "$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.status' "$MANIFEST_PATH")" == pending ]] || die "STEVEN-IA is not pending"
    [[ "$(jq -r '.waves[] | select(.id == "W2") | .checkpoint.status' "$MANIFEST_PATH")" == passed ]] || die "STEVEN-IA requires AR-W2 PASS"
    synchronization_gate "$(jq -r '.base_branch' "$MANIFEST_PATH")"
    jq --arg approver "$approver" --arg timestamp "$timestamp" '.waves |= map(if .human_gate?.id == "STEVEN-IA" then .human_gate.status="approved" | .human_gate.approved_by=$approver | .human_gate.approved_at=$timestamp else . end)' "$MANIFEST_PATH" | write_manifest
    persist_state "chore(pipeline): record STEVEN-IA approval"
    ;;
  --record-final-audit)
    result="${2:?PASS or FAIL required}"; [[ "$result" == PASS || "$result" == FAIL ]] || die "audit result must be PASS or FAIL"
    [[ "$(jq '[.waves[].checkpoint.status] | all(. == "passed")' "$MANIFEST_PATH")" == true ]] || die "final audit requires all wave checkpoints to pass"
    [[ "$(jq '[.waves[] | select(.human_gate != null) | .human_gate.status] | all(. == "approved")' "$MANIFEST_PATH")" == true ]] || die "final audit requires all human gates"
    audit_report="$(artifact_path "$(jq -r '.final_audit.report' "$MANIFEST_PATH")")"
    [[ -f "$audit_report" ]] || die "final audit report is missing: $audit_report"
    grep -Fqx "VERDICT=$result" "$audit_report" || die "final audit report verdict does not match"
    reviewed_sha="$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$audit_report" | head -n1 | cut -d= -f2)"
    [[ -n "$reviewed_sha" ]] || die "final audit report must include REVIEWED_SHA"
    expected_sha="$(jq -r '[.waves[].checkpoint.reviewed_sha] | last' "$MANIFEST_PATH")"
    [[ "$reviewed_sha" == "$expected_sha" ]] || die "final audit report SHA does not match final reviewed wave SHA"
    synchronization_gate "$(jq -r '.base_branch' "$MANIFEST_PATH")"
    jq --arg status "$(tr '[:upper:]' '[:lower:]' <<<"$result")" '.final_audit.status=$status | .release_gate.status="blocked"' "$MANIFEST_PATH" | write_manifest
    persist_state "chore(pipeline): record OS 3.8 final audit" "$audit_report"
    ;;
  --verify-pr) verify_pr "${2:?PR URL required}" ;;
  --merge-task-pr) merge_task_pr "${2:?task ID required}" "${3:?PR URL required}" ;;
  --dispatch) dispatch_task ;;
  --cycle) run_cycle ;;
  --help|-h) usage ;;
  *) usage >&2; die "unknown command: $command" ;;
esac
