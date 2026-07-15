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
STATE_LOCK_OWNER=""
STATE_ARTIFACT=""
STATE_TRANSACTION_NOOP=0

usage() {
  cat <<'EOF'
Usage: run-pipeline.sh [--manifest PATH] COMMAND [arguments]

Commands:
  --plan                               Print the next manifest action (default).
  --checkpoint                          Create the next wave review request and checkpoint it.
  --record-task-start TASK_ID           Test harness only; production starts through --dispatch.
  --record-task-completed TASK_ID       Test harness only; production completes through verified PR merge.
  --record-review-result ID PASS|CHANGES_REQUESTED
  --record-steven-ia APPROVER TIMESTAMP Record the W2 human IA decision.
  --record-final-audit PASS|FAIL PATH   Record an external final independent-audit result.
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
  local expected_branch="$1" repo="${2:-$REPO_DIR}" allow_detached="${3:-0}" remote_url local_head remote_head base_branch base_head counts current_branch
  [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] && { STATE_EXPECTED_HEAD="test-head"; return; }
  git -C "$repo" fetch origin --prune || die "git fetch origin --prune failed"
  remote_url="$(git -C "$repo" remote get-url origin)"
  [[ "${PIPELINE_ALLOW_LOCAL_TEST_REMOTE:-0}" == "1" || "$remote_url" == *"${PIPELINE_EXPECTED_REPOSITORY:-sohoteam88/NextShift-OS-2.0}"* ]] || die "unexpected repository origin: $remote_url"
  current_branch="$(git -C "$repo" branch --show-current)"
  if [[ "$allow_detached" == "1" ]]; then
    [[ -z "$current_branch" || "$current_branch" == "$expected_branch" ]] || die "unexpected branch; expected $expected_branch or its exact detached HEAD"
  else
    [[ "$current_branch" == "$expected_branch" ]] || die "unexpected branch; expected $expected_branch"
  fi
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
  if [[ -n "$STATE_LOCK_OWNER" && "$(cat "$STATE_LOCK_DIR/owner" 2>/dev/null || true)" == "$STATE_LOCK_OWNER" ]]; then
    :
  elif ! mkdir "$STATE_LOCK_DIR" 2>/dev/null; then
    lock_age="$(cat "$STATE_LOCK_DIR/owner" 2>/dev/null || true)"
    die "state transition lock is held (owner: ${lock_age:-unknown}); explicit human cleanup required: $STATE_LOCK_DIR"
  fi
  if [[ -z "$STATE_LOCK_OWNER" ]]; then
    STATE_LOCK_OWNER="pid=$$ host=$(hostname) started=$(date -u +%FT%TZ) command=${PIPELINE_STATE_COMMAND:-unknown}"
    printf '%s\n' "$STATE_LOCK_OWNER" >"$STATE_LOCK_DIR/owner"
  fi
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

# Short, serialized state transaction. Callers perform Codex/PR/check work first,
# then pass only the final mutation command after re-synchronizing under this lock.
state_transaction() {
  local command_name="$1" mutate="$2" message="$3"; shift 3
  PIPELINE_STATE_COMMAND="$command_name"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then
    STATE_ARTIFACT=""; STATE_TRANSACTION_NOOP=0
    eval "$mutate"
    "$VALIDATOR" --manifest "$MANIFEST_PATH" >/dev/null
    return
  fi
  local base_branch
  base_branch="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  # Acquire first, then perform every safety check before any mutation.
  [[ -n "$STATE_LOCK_DIR" ]] || STATE_LOCK_DIR="$(git -C "$REPO_DIR" rev-parse --git-common-dir)/os-pipeline-state.lock"
  [[ "$STATE_LOCK_DIR" = /* ]] || STATE_LOCK_DIR="$REPO_DIR/$STATE_LOCK_DIR"
  mkdir "$STATE_LOCK_DIR" 2>/dev/null || die "state transition lock is held; explicit human recovery required: $STATE_LOCK_DIR"
  STATE_LOCK_OWNER="pid=$$ host=$(hostname) started=$(date -u +%FT%TZ) command=$command_name"
  printf '%s\n' "$STATE_LOCK_OWNER" >"$STATE_LOCK_DIR/owner"
  trap 'test "$(cat "$STATE_LOCK_DIR/owner" 2>/dev/null || true)" = "$STATE_LOCK_OWNER" && { rm -f "$STATE_LOCK_DIR/owner"; rmdir "$STATE_LOCK_DIR" 2>/dev/null || true; }' RETURN EXIT
  synchronization_gate "$base_branch"
  "$VALIDATOR" --manifest "$MANIFEST_PATH" >/dev/null
  STATE_ARTIFACT=""
  STATE_TRANSACTION_NOOP=0
  eval "$mutate"
  "$VALIDATOR" --manifest "$MANIFEST_PATH" >/dev/null
  if [[ "$STATE_TRANSACTION_NOOP" == "1" ]]; then
    log "clean stop: state transaction already applied ($command_name)"
    return 0
  fi
  if [[ -n "$STATE_ARTIFACT" ]]; then persist_state "$message" "$STATE_ARTIFACT" "$@"; else persist_state "$message" "$@"; fi
}

transaction_start_task() {
  local id="$1" artifact_source="$2" artifact_target="$3"
  require_selected_task "$id"
  [[ "$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == pending ]] || die "task changed before transaction: $id"
  cp "$artifact_source" "$artifact_target"
  start_task "$id"
}

transaction_complete_task() {
  local id="$1" evidence="$2"
  [[ "$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == running ]] || die "task is no longer running: $id"
  validate_evidence "$evidence"
  update_task_status "$id" running completed "$evidence"
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
safe_relative_path() {
  local path="$1"
  [[ -n "$path" && "$path" != /* && "$path" != *".."* && "$path" != *$'\n'* ]] || return 1
}
valid_approver() {
  [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9._@+-]{0,127}$ ]]
}
valid_utc_timestamp() {
  local value="$1" normalized
  [[ "$value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || return 1
  if normalized="$(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$value" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null)"; then
    [[ "$normalized" == "$value" ]]
  elif normalized="$(date -u -d "$value" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null)"; then
    [[ "$normalized" == "$value" ]]
  else
    return 1
  fi
}
external_source_path() {
  local source="$1" source_dir source_path repo_path
  [[ -f "$source" && ! -L "$source" ]] || return 1
  source_dir="$(cd "$(dirname "$source")" && pwd -P)" || return 1
  source_path="$source_dir/$(basename "$source")"
  repo_path="$(cd "$REPO_DIR" && pwd -P)" || return 1
  [[ "$source_path" != "$repo_path" && "$source_path" != "$repo_path/"* ]] || return 1
  printf '%s\n' "$source_path"
}
final_audit_prerequisites_satisfied() {
  local gate_id artifact_relative approver approved_at approved_sha checkpoint_sha artifact
  jq -e '
    all(.waves[];
      all(.tasks[]; .status == "completed" or .status == "superseded") and
      .checkpoint.status == "passed" and
      (.checkpoint.reviewed_sha | type == "string" and test("^[0-9a-f]{40}$")) and
      (if .human_gate then .human_gate.status == "approved" else true end)
    )
  ' "$MANIFEST_PATH" >/dev/null || return 1
  while IFS=$'\t' read -r gate_id artifact_relative approver approved_at approved_sha checkpoint_sha; do
    [[ -z "$gate_id" ]] && continue
    safe_relative_path "$artifact_relative" || return 1
    artifact="$(artifact_path "$artifact_relative")"
    [[ "$approved_sha" == "$checkpoint_sha" && -f "$artifact" ]] || return 1
    grep -Fqx "GATE=$gate_id" "$artifact" || return 1
    grep -Fqx 'DECISION=APPROVED' "$artifact" || return 1
    grep -Fqx "APPROVER=$approver" "$artifact" || return 1
    grep -Fqx "APPROVED_AT=$approved_at" "$artifact" || return 1
    grep -Fqx "AR_W2_REVIEWED_SHA=$approved_sha" "$artifact" || return 1
  done < <(jq -r '.waves[] | select(.human_gate != null) | [.human_gate.id,.human_gate.approval_artifact,.human_gate.approved_by,.human_gate.approved_at,.human_gate.approved_reviewed_sha,.checkpoint.reviewed_sha] | @tsv' "$MANIFEST_PATH")
}
assert_final_audit_fresh() {
  local requested_sha="$1" phase="$2" request_relative approval_relative changed
  [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] && return
  git -C "$REPO_DIR" merge-base --is-ancestor "$requested_sha" HEAD || die "final audit reviewed SHA is not an ancestor of planning HEAD"
  request_relative="$(jq -r '.final_audit.request' "$MANIFEST_PATH")"
  approval_relative="$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approval_artifact' "$MANIFEST_PATH")"
  while IFS= read -r changed; do
    [[ -z "$changed" ]] && continue
    case "$changed" in
      docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json|docs/nextshift-os-3/os-3-8/reviews/*|docs/nextshift-os-3/os-3-8/runs/*|"$approval_relative") ;;
      "$request_relative") [[ "$phase" == result ]] || die "final audit request already existed before request transaction" ;;
      *) die "final audit is stale: unauthorized product/code change after reviewed SHA ($changed)" ;;
    esac
  done < <(git -C "$REPO_DIR" diff --name-only "$requested_sha...HEAD")
}
expected_repository() {
  local repo="${1:-$REPO_DIR}" remote_url
  if [[ -n "${PIPELINE_EXPECTED_REPOSITORY:-}" ]]; then
    printf '%s\n' "$PIPELINE_EXPECTED_REPOSITORY"
    return
  fi
  remote_url="$(git -C "$repo" remote get-url origin)"
  sed -E 's#^.*github\.com[:/]##; s#\.git$##' <<<"$remote_url"
}
github_pr_metadata() {
  local pr_url="$1" owner repo number payload
  if [[ "$pr_url" =~ ^https://github\.com/([^/]+)/([^/]+)/pull/([0-9]+)$ ]]; then
    owner="${BASH_REMATCH[1]}"; repo="${BASH_REMATCH[2]}"; number="${BASH_REMATCH[3]}"
  else
    die "invalid GitHub PR URL: $pr_url"
  fi
  payload="$(gh api "repos/$owner/$repo/pulls/$number")" || die "cannot read PR metadata from GitHub API: $pr_url"
  jq -c '
    {
      state: (if .merged == true then "MERGED" elif .state == "open" then "OPEN" else "CLOSED" end),
      repository: {nameWithOwner: .base.repo.full_name},
      headRepository: {nameWithOwner: .head.repo.full_name},
      baseRefName: .base.ref,
      headRefName: .head.ref,
      headRefOid: .head.sha,
      mergeCommit: {oid: (.merge_commit_sha // "")},
      url: .html_url,
      body: (.body // "")
    }
  ' <<<"$payload"
}
remediation_artifact_from_manifest() {
  local wave="$1" relative
  relative="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.artifact // empty' "$MANIFEST_PATH")"
  safe_relative_path "$relative" || die "active remediation artifact path is invalid"
  artifact_path "$relative"
}
render_checkpoint_request() {
  local wave="$1" checkpoint="$2" end_sha="$3" request="$4" remediation_run="${5:-}" start_sha changed_files report_lines
  start_sha="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .start_sha // empty' "$MANIFEST_PATH")"
  [[ -n "$start_sha" ]] || die "wave start SHA missing: $wave"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then
    changed_files="(test fixture)"
  else
    changed_files="$(git -C "$REPO_DIR" diff --name-only "$start_sha...$end_sha")"
  fi
  report_lines="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .tasks[] | "- \(.id): PR=\(.evidence.pr_url // "missing") merge=\(.evidence.merge_sha // "missing") report=\(.evidence.implementation_report // "missing")"' "$MANIFEST_PATH")"
  mkdir -p "$(dirname "$request")"
  cat >"$request" <<EOF
# ${wave} Architecture Review Request

- Checkpoint: ${checkpoint}
- Cumulative start SHA: ${start_sha}
- Cumulative product end SHA: ${end_sha}
- Remediation run: ${remediation_run:-none}

## Completed tasks
${report_lines}

## Changed files
\`\`\`
${changed_files}
\`\`\`

Review only the cumulative product diff ending at ${end_sha}. Verify the task evidence and remediation findings without expanding scope. Record VERDICT and REVIEWED_SHA=${end_sha} in the manifest-designated result artifact.
EOF
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
        if [[ -n "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.run_id // empty' "$MANIFEST_PATH")" ]]; then
          jq -n --arg id "$checkpoint" --arg wave "$wave" '{action:"remediation_recovery",checkpoint:$id,wave:$wave}'
          return
        fi
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

    task="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .tasks[] | select(.status == "running") | .id' "$MANIFEST_PATH" | head -n1)"
    if [[ -n "$task" ]]; then
      jq -n --arg task "$task" --arg wave "$wave" '{action:"recovery", wave:$wave, task:$task}'
      return
    fi

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
  case "$audit_status" in
    pending) jq -n '{action:"final_audit"}' ;;
    running) jq -n '{action:"awaiting_final_audit"}' ;;
    pass|fail) jq -n --arg status "$audit_status" '{action:"complete", final_audit:$status}' ;;
    *) jq -n --arg status "$audit_status" '{action:"blocked", final_audit:$status}' ;;
  esac
}

recover_running_task() {
  local task="$1" artifact pr branch report state_repo
  artifact="$(artifact_path "docs/nextshift-os-3/os-3-8/runs/${task}_DISPATCH.json")"
  [[ -f "$artifact" ]] || die "running task has no dispatch artifact; human recovery required: $task"
  pr="$(jq -r '.pr_url // empty' "$artifact")"; branch="$(jq -r '.task_branch // empty' "$artifact")"; report="$(jq -r '.implementation_report // empty' "$artifact")"
  [[ -n "$pr" && -n "$branch" && -n "$report" ]] || die "dispatch artifact is ambiguous; human recovery required"
  state_repo="$REPO_DIR"
  case "$(gh pr view "$pr" --json state --jq '.state')" in
    MERGED)
      reconcile_planning_state "$(jq -r '.base_branch' "$MANIFEST_PATH")" "$state_repo"
      evidence="$(jq -n --arg pr "$pr" --arg merge_sha "$(gh pr view "$pr" --json mergeCommit --jq '.mergeCommit.oid')" --arg report "$report" '{pr_url:$pr,merge_sha:$merge_sha,implementation_report:$report,validation:{checks:"passed"},recovered:true}')"
      validate_evidence "$evidence"
      if [[ "$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == completed ]]; then log "clean stop: task already recovered"; return; fi
      state_transaction "task-recovery:$task" "transaction_complete_task '$task' '$evidence'" "chore(pipeline): recover merged OS 3.8 task $task"
      ;;
    OPEN)
      die "task PR is still open; resume exact-head verification/merge in a clean task worktree: $branch"
      ;;
    *) die "task PR state is ambiguous; human recovery required: $pr" ;;
  esac
}

# shellcheck disable=SC2329
transaction_reserve_remediation() {
  local checkpoint="$REMEDIATION_CHECKPOINT" wave attempts max reviewed_sha run_id branch artifact result_relative result
  wave="$(wave_for_id "$checkpoint")"; [[ -n "$wave" ]] || die "unknown remediation checkpoint"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.status' "$MANIFEST_PATH")" == changes_requested ]] || die "checkpoint is no longer changes_requested"
  attempts="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | (.checkpoint.remediation_attempts // 0)' "$MANIFEST_PATH")"; max="$(jq -r '.execution_policy.max_architecture_remediation_attempts' "$MANIFEST_PATH")"
  (( attempts < max )) || die "remediation limit reached; needs human"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation // empty' "$MANIFEST_PATH")" == "" ]] || die "active remediation already exists"
  reviewed_sha="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.requested_end_sha' "$MANIFEST_PATH")"
  [[ "$reviewed_sha" =~ ^[0-9a-f]{40}$ ]] || die "remediation checkpoint has no valid requested product SHA"
  result_relative="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.result_artifact' "$MANIFEST_PATH")"
  safe_relative_path "$result_relative" || die "remediation result artifact path is invalid"
  result="$(artifact_path "$result_relative")"
  [[ -f "$result" ]] || die "remediation result artifact is missing"
  grep -Fqx 'VERDICT=CHANGES_REQUESTED' "$result" || die "remediation requires a CHANGES_REQUESTED result"
  [[ "$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$result" | head -n1 | cut -d= -f2)" == "$reviewed_sha" ]] || die "remediation result no longer matches requested product SHA"
  run_id="${wave}-${checkpoint}-r$((attempts + 1))-$(date -u +%Y%m%d%H%M%S)-$$"; branch="chore/os-3.8-remediation-$(printf '%s' "$run_id" | tr '[:upper:]' '[:lower:]')"
  artifact="$(artifact_path "docs/nextshift-os-3/os-3-8/runs/${run_id}.json")"; [[ ! -e "$artifact" ]] || die "remediation run artifact already exists"
  mkdir -p "$(dirname "$artifact")"
  jq -n --arg run "$run_id" --arg checkpoint "$checkpoint" --arg sha "$reviewed_sha" --arg branch "$branch" --argjson attempt "$((attempts + 1))" --arg started "$(date -u +%FT%TZ)" '{status:"running",run_id:$run,checkpoint:$checkpoint,reviewed_product_sha:$sha,attempt:$attempt,branch:$branch,started_at:$started}' >"$artifact"
  jq --arg wave "$wave" --arg run "$run_id" --arg branch "$branch" --arg artifact "${artifact#"$REPO_DIR"/}" --argjson attempt "$((attempts + 1))" '.waves |= map(if .id == $wave then .checkpoint.active_remediation={status:"running",run_id:$run,attempt:$attempt,branch:$branch,artifact:$artifact} else . end)' "$MANIFEST_PATH" | write_manifest
  REMEDIATION_RUN_ID="$run_id"; REMEDIATION_BRANCH="$branch"; REMEDIATION_ARTIFACT="$artifact"; STATE_ARTIFACT="$artifact"
}

# shellcheck disable=SC2329
transaction_record_remediation_pr() {
  local wave active artifact existing_pr existing_report metadata pr_state remote_head
  wave="$(wave_for_id "$REMEDIATION_CHECKPOINT")"; active="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.run_id // empty' "$MANIFEST_PATH")"
  [[ "$active" == "$REMEDIATION_RUN_ID" ]] || die "active remediation changed before PR recording"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.status' "$MANIFEST_PATH")" == changes_requested ]] || die "checkpoint changed before PR recording"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.branch' "$MANIFEST_PATH")" == "$REMEDIATION_BRANCH" ]] || die "remediation branch changed before PR recording"
  [[ "$REMEDIATION_PR" =~ ^https://github\.com/.+/pull/[0-9]+$ ]] || die "remediation PR URL is invalid"
  safe_relative_path "$REMEDIATION_REPORT" || die "remediation implementation report path is invalid"
  metadata="$(github_pr_metadata "$REMEDIATION_PR")"
  validate_remediation_pr_metadata "$metadata" "$REMEDIATION_PR" "$REMEDIATION_BRANCH" || die "remediation PR repository/base/head changed before recording"
  gh pr diff "$REMEDIATION_PR" --name-only | grep -Fxq "$REMEDIATION_REPORT" || die "remediation implementation report is absent from the exact PR diff"
  pr_state="$(jq -r '.state' <<<"$metadata")"
  if [[ "$pr_state" == OPEN ]]; then
    remote_head="$(git -C "$REPO_DIR" rev-parse "origin/$REMEDIATION_BRANCH" 2>/dev/null || true)"
    [[ -n "$remote_head" && "$remote_head" == "$(jq -r '.headRefOid' <<<"$metadata")" ]] || die "remediation remote branch and PR head differ"
  fi
  artifact="$(remediation_artifact_from_manifest "$wave")"; [[ -f "$artifact" ]] || die "remediation run artifact missing"
  existing_pr="$(jq -r '.pr_url // empty' "$artifact")"; existing_report="$(jq -r '.implementation_report // empty' "$artifact")"
  if [[ "$existing_pr" == "$REMEDIATION_PR" && "$existing_report" == "$REMEDIATION_REPORT" ]]; then STATE_TRANSACTION_NOOP=1; return; fi
  [[ -z "$existing_pr" && -z "$existing_report" ]] || die "conflicting remediation PR evidence already exists"
  jq --arg pr "$REMEDIATION_PR" --arg report "$REMEDIATION_REPORT" '.pr_url=$pr | .implementation_report=$report' "$artifact" >"${artifact}.tmp" && mv "${artifact}.tmp" "$artifact"
  jq --arg wave "$wave" --arg pr "$REMEDIATION_PR" --arg report "$REMEDIATION_REPORT" '.waves |= map(if .id == $wave then .checkpoint.active_remediation.pr_url=$pr | .checkpoint.active_remediation.implementation_report=$report else . end)' "$MANIFEST_PATH" | write_manifest
  STATE_ARTIFACT="$artifact"
}

# shellcheck disable=SC2329
transaction_record_remediation_verification() {
  local wave active artifact existing existing_identity new_identity
  wave="$(wave_for_id "$REMEDIATION_CHECKPOINT")"; active="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.run_id // empty' "$MANIFEST_PATH")"
  [[ "$active" == "$REMEDIATION_RUN_ID" ]] || die "active remediation changed before verification recording"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.pr_url // empty' "$MANIFEST_PATH")" == "$REMEDIATION_PR" ]] || die "remediation PR changed before verification recording"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.implementation_report // empty' "$MANIFEST_PATH")" == "$REMEDIATION_REPORT" ]] || die "remediation report changed before verification recording"
  jq -e --arg repo "$(expected_repository)" --arg base "$(jq -r '.base_branch' "$MANIFEST_PATH")" --arg head "$REMEDIATION_BRANCH" --arg pr "$REMEDIATION_PR" --arg report "$REMEDIATION_REPORT" '
    .status == "passed" and .checks == "passed" and .repository == $repo and .base == $base and .head == $head and
    .pr_url == $pr and .implementation_report == $report and (.head_sha | test("^[0-9a-f]{40}$"))
  ' <<<"$REMEDIATION_VERIFICATION" >/dev/null || die "remediation verification evidence is invalid"
  artifact="$(remediation_artifact_from_manifest "$wave")"; [[ -f "$artifact" ]] || die "remediation run artifact missing"
  existing="$(jq -c '.verification // null' "$artifact")"
  existing_identity="$(jq -Sc 'if . == null then null else del(.verified_at) end' <<<"$existing")"
  new_identity="$(jq -Sc 'del(.verified_at)' <<<"$REMEDIATION_VERIFICATION")"
  if [[ "$existing_identity" == "$new_identity" ]]; then STATE_TRANSACTION_NOOP=1; return; fi
  [[ "$existing" == null ]] || die "conflicting remediation verification already exists"
  jq --argjson verification "$REMEDIATION_VERIFICATION" '.verification=$verification' "$artifact" >"${artifact}.tmp" && mv "${artifact}.tmp" "$artifact"
  jq --arg wave "$wave" --argjson verification "$REMEDIATION_VERIFICATION" '.waves |= map(if .id == $wave then .checkpoint.active_remediation.verification=$verification else . end)' "$MANIFEST_PATH" | write_manifest
  STATE_ARTIFACT="$artifact"
}

# shellcheck disable=SC2329
transaction_mark_remediation_needs_human() {
  local wave active artifact ended
  wave="$(wave_for_id "$REMEDIATION_CHECKPOINT")"; active="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.run_id // empty' "$MANIFEST_PATH")"
  [[ "$active" == "$REMEDIATION_RUN_ID" ]] || die "active remediation changed before needs_human transition"
  artifact="$(remediation_artifact_from_manifest "$wave")"; [[ -f "$artifact" ]] || die "remediation run artifact missing"
  ended="$(date -u +%FT%TZ)"
  jq --arg reason "$REMEDIATION_REASON" --arg ended "$ended" '.status="needs_human" | .reason=$reason | .ended_at=$ended' "$artifact" >"${artifact}.tmp" && mv "${artifact}.tmp" "$artifact"
  jq --arg wave "$wave" --arg run "$REMEDIATION_RUN_ID" --arg artifact "${artifact#"$REPO_DIR"/}" --arg reason "$REMEDIATION_REASON" '.waves |= map(if .id == $wave then .checkpoint.status="needs_human" | .checkpoint.remediation_block={run_id:$run,artifact:$artifact,reason:$reason} | .checkpoint.active_remediation=null else . end)' "$MANIFEST_PATH" | write_manifest
  STATE_ARTIFACT="$artifact"
}

# shellcheck disable=SC2329
transaction_complete_remediation() {
  local checkpoint="$REMEDIATION_CHECKPOINT" wave active branch pr report attempts max artifact verification expected_repo base pr_json merge_sha old_sha
  local request_relative result_relative request result request_archive result_archive end_sha completed
  wave="$(wave_for_id "$checkpoint")"; active="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.run_id // empty' "$MANIFEST_PATH")"
  [[ "$active" == "$REMEDIATION_RUN_ID" ]] || die "active remediation changed before completion"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.status' "$MANIFEST_PATH")" == changes_requested ]] || die "checkpoint changed before remediation completion"
  branch="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.branch' "$MANIFEST_PATH")"
  pr="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.pr_url // empty' "$MANIFEST_PATH")"
  report="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.implementation_report // empty' "$MANIFEST_PATH")"
  [[ "$branch" == "$REMEDIATION_BRANCH" && "$pr" == "$(jq -r '.pr_url' <<<"$REMEDIATION_EVIDENCE")" && "$report" == "$(jq -r '.implementation_report' <<<"$REMEDIATION_EVIDENCE")" ]] || die "remediation completion evidence does not match active run"
  validate_evidence "$REMEDIATION_EVIDENCE"
  attempts="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | (.checkpoint.remediation_attempts // 0)' "$MANIFEST_PATH")"; max="$(jq -r '.execution_policy.max_architecture_remediation_attempts' "$MANIFEST_PATH")"; (( attempts < max )) || die "remediation limit reached"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.attempt' "$MANIFEST_PATH")" == "$((attempts + 1))" ]] || die "remediation attempt sequence changed"
  artifact="$(remediation_artifact_from_manifest "$wave")"; [[ -f "$artifact" ]] || die "canonical remediation artifact missing"
  verification="$(jq -c '.verification // null' "$artifact")"
  jq -e --arg pr "$pr" --arg report "$report" --arg branch "$branch" '.status=="passed" and .checks=="passed" and .pr_url==$pr and .implementation_report==$report and .head==$branch' <<<"$verification" >/dev/null || die "remediation was not verified before merge"
  expected_repo="$(expected_repository)"; base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  pr_json="$(github_pr_metadata "$pr")"
  jq -e --arg repo "$expected_repo" --arg base "$base" --arg head "$branch" --arg url "$pr" '
    .state=="MERGED" and .repository.nameWithOwner==$repo and .headRepository.nameWithOwner==$repo and .baseRefName==$base and .headRefName==$head and .url==$url and
    (.headRefOid | test("^[0-9a-f]{40}$")) and (.mergeCommit.oid | test("^[0-9a-f]{40}$"))
  ' <<<"$pr_json" >/dev/null || die "remediation PR is not merged into the authorized planning branch"
  [[ "$(jq -r '.headRefOid' <<<"$pr_json")" == "$(jq -r '.head_sha' <<<"$verification")" ]] || die "merged remediation PR head differs from verified head"
  merge_sha="$(jq -r '.mergeCommit.oid' <<<"$pr_json")"; [[ "$merge_sha" == "$(jq -r '.merge_sha' <<<"$REMEDIATION_EVIDENCE")" ]] || die "remediation merge SHA evidence mismatch"
  git -C "$REPO_DIR" merge-base --is-ancestor "$merge_sha" HEAD || die "remediation merge SHA is not on authorized planning HEAD"
  old_sha="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.requested_end_sha' "$MANIFEST_PATH")"
  request_relative="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.request_artifact' "$MANIFEST_PATH")"; result_relative="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.result_artifact' "$MANIFEST_PATH")"
  if ! safe_relative_path "$request_relative" || ! safe_relative_path "$result_relative"; then die "checkpoint artifact path is invalid"; fi
  request="$(artifact_path "$request_relative")"; result="$(artifact_path "$result_relative")"
  [[ -f "$request" && -f "$result" ]] || die "source review request/result is missing"
  grep -Fqx 'VERDICT=CHANGES_REQUESTED' "$result" || die "source review result is not CHANGES_REQUESTED"
  [[ "$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$result" | head -n1 | cut -d= -f2)" == "$old_sha" ]] || die "source review result SHA changed"
  request_archive="$(artifact_path "docs/nextshift-os-3/os-3-8/runs/${REMEDIATION_RUN_ID}-source-review-request.md")"; result_archive="$(artifact_path "docs/nextshift-os-3/os-3-8/runs/${REMEDIATION_RUN_ID}-source-review-result.md")"
  [[ ! -e "$request_archive" && ! -e "$result_archive" ]] || die "remediation review archive already exists"
  mv "$request" "$request_archive"; mv "$result" "$result_archive"
  completed="$(date -u +%FT%TZ)"
  jq --argjson evidence "$REMEDIATION_EVIDENCE" --arg request_archive "${request_archive#"$REPO_DIR"/}" --arg result_archive "${result_archive#"$REPO_DIR"/}" --arg completed "$completed" '.status="completed" | .completion=$evidence | .source_review_request=$request_archive | .source_review_result=$result_archive | .completed_at=$completed' "$artifact" >"${artifact}.tmp" && mv "${artifact}.tmp" "$artifact"
  end_sha="$(git -C "$REPO_DIR" rev-parse HEAD)"; render_checkpoint_request "$wave" "$checkpoint" "$end_sha" "$request" "$REMEDIATION_RUN_ID"
  jq --arg wave "$wave" --arg sha "$end_sha" '.waves |= map(if .id == $wave then .checkpoint.status="awaiting_review" | .checkpoint.remediation_attempts=((.checkpoint.remediation_attempts // 0)+1) | .checkpoint.active_remediation=null | .checkpoint.requested_end_sha=$sha | .checkpoint.reviewed_sha=null else . end)' "$MANIFEST_PATH" | write_manifest
  if [[ "${PIPELINE_TEST_MODE:-0}" != "1" ]]; then git -C "$REPO_DIR" add -A -- "$artifact" "$request" "$request_archive" "$result" "$result_archive"; fi
  STATE_ARTIFACT="$artifact"
}

validate_remediation_pr_metadata() {
  local metadata="$1" pr="$2" branch="$3" expected_state="${4:-}" expected_repo base
  expected_repo="$(expected_repository)"; base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  jq -e --arg repo "$expected_repo" --arg base "$base" --arg head "$branch" --arg url "$pr" --arg state "$expected_state" '
    .repository.nameWithOwner==$repo and .headRepository.nameWithOwner==$repo and .baseRefName==$base and .headRefName==$head and .url==$url and
    (.headRefOid | test("^[0-9a-f]{40}$")) and ($state=="" or .state==$state)
  ' <<<"$metadata" >/dev/null || return 1
}

validate_open_remediation_identity() {
  local task_dir="$1" pr="$2" branch="$3" report="$4" metadata local_head remote_head
  safe_relative_path "$report" || die "remediation implementation report path is invalid"
  git -C "$task_dir" fetch origin "$branch" || die "cannot fetch remediation branch"
  metadata="$(github_pr_metadata "$pr")"
  validate_remediation_pr_metadata "$metadata" "$pr" "$branch" OPEN || die "remediation PR repository/base/head metadata is invalid"
  local_head="$(git -C "$task_dir" rev-parse HEAD)"; remote_head="$(git -C "$task_dir" rev-parse "origin/$branch")"
  [[ "$local_head" == "$remote_head" && "$local_head" == "$(jq -r '.headRefOid' <<<"$metadata")" ]] || die "remediation local, remote, and PR heads differ"
}

record_remediation_verification() {
  local checkpoint="$1" run="$2" branch="$3" pr="$4" report="$5" task_dir="$6" state_repo="$7" metadata local_head remote_head
  (REPO_DIR="$task_dir" MANIFEST_PATH="$task_dir/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" TASK_BRANCH="$branch" IMPLEMENTATION_REPORT="$report" PIPELINE_ALLOW_DETACHED_TASK_WORKTREE="${PIPELINE_ALLOW_DETACHED_TASK_WORKTREE:-0}" verify_pr "$pr" "$branch")
  git -C "$task_dir" fetch origin "$branch" || die "cannot refresh verified remediation branch"
  metadata="$(github_pr_metadata "$pr")"
  validate_remediation_pr_metadata "$metadata" "$pr" "$branch" OPEN || die "remediation PR metadata changed after verification"
  local_head="$(git -C "$task_dir" rev-parse HEAD)"; remote_head="$(git -C "$task_dir" rev-parse "origin/$branch")"
  [[ "$local_head" == "$remote_head" && "$local_head" == "$(jq -r '.headRefOid' <<<"$metadata")" ]] || die "remediation PR head changed after local/check verification"
  REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run"; REMEDIATION_BRANCH="$branch"; REMEDIATION_PR="$pr"; REMEDIATION_REPORT="$report"
  REMEDIATION_VERIFICATION="$(jq -n --arg repo "$(jq -r '.repository.nameWithOwner' <<<"$metadata")" --arg base "$(jq -r '.baseRefName' <<<"$metadata")" --arg head "$branch" --arg head_sha "$(jq -r '.headRefOid' <<<"$metadata")" --arg pr "$pr" --arg report "$report" --arg verified "$(date -u +%FT%TZ)" '{status:"passed",checks:"passed",repository:$repo,base:$base,head:$head,head_sha:$head_sha,pr_url:$pr,implementation_report:$report,verified_at:$verified}')"
  REPO_DIR="$state_repo"; MANIFEST_PATH="$state_repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
  state_transaction "remediation-verified:$run" "transaction_record_remediation_verification" "chore(pipeline): verify remediation PR $run"
}

merge_verified_remediation_pr() {
  local pr="$1" branch="$2" expected_head="$3" metadata
  [[ "${PIPELINE_ALLOW_PR_MERGE:-0}" == "1" ]] || die "remediation merge requires PIPELINE_ALLOW_PR_MERGE=1"
  metadata="$(github_pr_metadata "$pr")"
  validate_remediation_pr_metadata "$metadata" "$pr" "$branch" OPEN || die "remediation PR identity changed before merge"
  [[ "$(jq -r '.headRefOid' <<<"$metadata")" == "$expected_head" ]] || die "remediation PR head changed after verification"
  gh pr checks "$pr" >/dev/null || die "remediation checks changed after verification"
  gh pr merge "$pr" --squash --delete-branch --match-head-commit "$expected_head" || die "remediation PR merge failed"
  metadata="$(github_pr_metadata "$pr")"
  validate_remediation_pr_metadata "$metadata" "$pr" "$branch" MERGED || die "remediation PR did not reach the authorized MERGED state"
  [[ "$(jq -r '.headRefOid' <<<"$metadata")" == "$expected_head" ]] || die "merged remediation PR head differs from verified head"
}

build_merged_remediation_evidence() {
  local pr="$1" branch="$2" report="$3" artifact="$4" recovered="${5:-false}" metadata verification merge_sha
  metadata="$(github_pr_metadata "$pr")"
  validate_remediation_pr_metadata "$metadata" "$pr" "$branch" MERGED || die "merged remediation PR metadata is invalid"
  verification="$(jq -c '.verification // null' "$artifact")"
  jq -e --arg head "$(jq -r '.headRefOid' <<<"$metadata")" --arg pr "$pr" --arg report "$report" '.status=="passed" and .checks=="passed" and .head_sha==$head and .pr_url==$pr and .implementation_report==$report' <<<"$verification" >/dev/null || die "merged remediation PR lacks matching persisted verification"
  gh pr checks "$pr" >/dev/null || die "merged remediation PR checks are not all passing"
  gh pr diff "$pr" --name-only | grep -Fxq "$report" || die "remediation implementation report is not in the exact PR diff"
  merge_sha="$(jq -r '.mergeCommit.oid // empty' <<<"$metadata")"; [[ "$merge_sha" =~ ^[0-9a-f]{40}$ ]] || die "merged remediation PR has no merge SHA"
  jq -n --arg pr "$pr" --arg merge_sha "$merge_sha" --arg report "$report" --arg head_sha "$(jq -r '.headRefOid' <<<"$metadata")" --argjson recovered "$recovered" '{pr_url:$pr,merge_sha:$merge_sha,implementation_report:$report,validation:{checks:"passed",head_sha:$head_sha},recovered:$recovered}'
}

mark_remediation_needs_human() {
  local checkpoint="$1" run="$2" reason="$3"
  REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run"; REMEDIATION_REASON="$reason"
  state_transaction "remediation-needs-human:$run" "transaction_mark_remediation_needs_human" "chore(pipeline): block remediation $run for human review"
  log "clean stop: remediation needs human ($reason)"
}

run_remediation() {
  local checkpoint="$1" wave attempt result requested_sha run_id branch control brief outcome findings task_dir log_file codex_rc state_repo pr report artifact
  [[ "${PIPELINE_ALLOW_PRODUCT_DISPATCH:-0}" == "1" && -n "${CODEX_CMD:-}" ]] || die "remediation requires explicit dispatch opt-in and CODEX_CMD"
  wave="$(wave_for_id "$checkpoint")"; [[ -n "$wave" ]] || die "unknown remediation checkpoint"
  result="$(artifact_path "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.result_artifact' "$MANIFEST_PATH")")"
  [[ -f "$result" ]] || die "remediation requires the Architecture Review result artifact"
  requested_sha="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.requested_end_sha' "$MANIFEST_PATH")"
  [[ "$(grep -E '^REVIEWED_SHA=' "$result" | cut -d= -f2)" == "$requested_sha" ]] || die "remediation review SHA does not match requested product SHA"
  REMEDIATION_CHECKPOINT="$checkpoint"; state_transaction "remediation-reserve:$checkpoint" "transaction_reserve_remediation" "chore(pipeline): reserve remediation for $checkpoint"
  run_id="$REMEDIATION_RUN_ID"; branch="$REMEDIATION_BRANCH"; artifact="$REMEDIATION_ARTIFACT"; attempt="$(jq -r '.attempt' "$artifact")"
  mkdir -p "$CONTROL_ROOT"; control="$(mktemp -d "$CONTROL_ROOT/remediation.${run_id}.XXXXXX")"; brief="$control/BRIEF.md"; outcome="$control/OUTCOME.json"
  findings="$(sed -n '/^##/,$p' "$result")"
  cat >"$brief" <<EOF
# Remediation $run_id
Wave: $wave
Checkpoint: $checkpoint
Attempt: $attempt
Product start/end SHA: $(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .start_sha' "$MANIFEST_PATH") / $requested_sha
Target branch: $(jq -r '.base_branch' "$MANIFEST_PATH")

## Architecture Review findings
$findings

Fix only these findings. Do not expand product scope, execute later tasks, deploy, tag, release, or alter production. Open a PR targeting the planning branch. Put an exact \`Implementation-Report: <repository-relative-path>\` line in the PR body, and write pr_url plus implementation_report to $outcome.
EOF
  state_repo="$REPO_DIR"; task_dir="$(mktemp -d "${TMPDIR:-/tmp}/os38-remediation.XXXXXX")"; log_file="$control/codex.log"
  git -C "$state_repo" worktree add -b "$branch" "$task_dir" "origin/$(jq -r '.base_branch' "$MANIFEST_PATH")" || die "could not create remediation worktree"
  set +e
  (cd "$task_dir" && PIPELINE_TASK_ID="$run_id" PIPELINE_TASK_BRANCH="$branch" PIPELINE_TASK_BRIEF="$brief" PIPELINE_TASK_OUTCOME="$outcome" bash -lc "$CODEX_CMD") >"$log_file" 2>&1
  codex_rc=$?
  set -e
  (( codex_rc == 0 )) || die "remediation CODEX_CMD failed; reservation remains recoverable and attempts are unchanged (log: $log_file)"
  [[ -s "$outcome" ]] || die "remediation outcome missing; reservation remains recoverable and attempts are unchanged"
  pr="$(jq -r '.pr_url // empty' "$outcome")"; report="$(jq -r '.implementation_report // empty' "$outcome")"
  if [[ -z "$pr" ]] || ! safe_relative_path "$report"; then die "remediation outcome requires valid pr_url and safe implementation_report"; fi
  [[ -z "$(git -C "$task_dir" status --porcelain)" ]] || die "remediation worktree is dirty"
  validate_open_remediation_identity "$task_dir" "$pr" "$branch" "$report"
  REPO_DIR="$state_repo"; MANIFEST_PATH="$state_repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"; REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run_id"; REMEDIATION_BRANCH="$branch"; REMEDIATION_PR="$pr"; REMEDIATION_REPORT="$report"
  state_transaction "remediation-pr:$run_id" "transaction_record_remediation_pr" "chore(pipeline): record remediation PR $run_id"
  record_remediation_verification "$checkpoint" "$run_id" "$branch" "$pr" "$report" "$task_dir" "$state_repo"
  merge_verified_remediation_pr "$pr" "$branch" "$(jq -r '.verification.head_sha' "$artifact")"
  reconcile_planning_state "$(jq -r '.base_branch' "$MANIFEST_PATH")" "$state_repo"
  artifact="$(remediation_artifact_from_manifest "$wave")"; REMEDIATION_EVIDENCE="$(build_merged_remediation_evidence "$pr" "$branch" "$report" "$artifact")"
  REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run_id"; REMEDIATION_BRANCH="$branch"
  state_transaction "remediation-complete:$run_id" "transaction_complete_remediation" "chore(pipeline): complete remediation $run_id"
}

recover_active_remediation() {
  local checkpoint="$1" wave run branch pr report artifact state task_dir state_repo candidates count metadata body base repo verification
  wave="$(wave_for_id "$checkpoint")"; state_repo="$REPO_DIR"
  run="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.run_id // empty' "$MANIFEST_PATH")"
  branch="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.branch // empty' "$MANIFEST_PATH")"; pr="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.pr_url // empty' "$MANIFEST_PATH")"; report="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.implementation_report // empty' "$MANIFEST_PATH")"
  [[ -n "$run" && -n "$branch" ]] || die "active remediation is incomplete; cannot identify a safe recovery"
  artifact="$(remediation_artifact_from_manifest "$wave")"; [[ -f "$artifact" ]] || die "active remediation artifact is missing"
  if [[ -z "$pr" ]]; then
    base="$(jq -r '.base_branch' "$MANIFEST_PATH")"; repo="$(expected_repository)"
    candidates="$(gh pr list --repo "$repo" --head "$branch" --base "$base" --state all --json url,state,headRefName,headRefOid)" || die "cannot query remediation PR candidates"
    count="$(jq 'length' <<<"$candidates")"
    if [[ "$count" != 1 ]]; then mark_remediation_needs_human "$checkpoint" "$run" "expected one PR for $branch, found $count"; return; fi
    pr="$(jq -r '.[0].url' <<<"$candidates")"; metadata="$(github_pr_metadata "$pr")"
    validate_remediation_pr_metadata "$metadata" "$pr" "$branch" || { mark_remediation_needs_human "$checkpoint" "$run" "unique PR metadata does not match the reserved repository/base/head"; return; }
    if [[ -z "$report" ]]; then
      body="$(jq -r '.body // ""' <<<"$metadata")"
      # The backticks below are literal PR-body delimiters.
      # shellcheck disable=SC2016
      report="$(sed -nE 's/^Implementation-Report:[[:space:]]*`?([^`[:space:]]+)`?[[:space:]]*$/\1/p' <<<"$body" | head -n1)"
    fi
    if ! safe_relative_path "$report"; then mark_remediation_needs_human "$checkpoint" "$run" "unique PR has no safe Implementation-Report marker"; return; fi
    REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run"; REMEDIATION_BRANCH="$branch"; REMEDIATION_PR="$pr"; REMEDIATION_REPORT="$report"
    state_transaction "remediation-pr-recovery:$run" "transaction_record_remediation_pr" "chore(pipeline): recover remediation PR metadata $run"
  fi
  safe_relative_path "$report" || { mark_remediation_needs_human "$checkpoint" "$run" "recorded remediation report path is invalid"; return; }
  metadata="$(github_pr_metadata "$pr")"
  validate_remediation_pr_metadata "$metadata" "$pr" "$branch" || { mark_remediation_needs_human "$checkpoint" "$run" "recorded remediation PR metadata is ambiguous"; return; }
  state="$(jq -r '.state' <<<"$metadata")"
  if [[ "$state" == OPEN ]]; then
    git -C "$state_repo" fetch origin "$branch" || { mark_remediation_needs_human "$checkpoint" "$run" "open remediation PR branch is unavailable"; return; }
    task_dir="$(mktemp -d "${TMPDIR:-/tmp}/os38-remediation-recovery.XXXXXX")"; git -C "$state_repo" worktree add --detach "$task_dir" "origin/$branch" || die "cannot restore exact remediation worktree"
    PIPELINE_ALLOW_DETACHED_TASK_WORKTREE=1 record_remediation_verification "$checkpoint" "$run" "$branch" "$pr" "$report" "$task_dir" "$state_repo"
    artifact="$(remediation_artifact_from_manifest "$wave")"
    merge_verified_remediation_pr "$pr" "$branch" "$(jq -r '.verification.head_sha' "$artifact")"
  elif [[ "$state" == MERGED ]]; then
    verification="$(jq -c '.verification // null' "$artifact")"
    if ! jq -e --arg pr "$pr" --arg report "$report" --arg head "$(jq -r '.headRefOid' <<<"$metadata")" '.status=="passed" and .checks=="passed" and .pr_url==$pr and .implementation_report==$report and .head_sha==$head' <<<"$verification" >/dev/null; then
      mark_remediation_needs_human "$checkpoint" "$run" "merged remediation PR has no persisted pre-merge verification"
      return
    fi
    if ! gh pr checks "$pr" >/dev/null || ! gh pr diff "$pr" --name-only | grep -Fxq "$report" || [[ ! "$(jq -r '.mergeCommit.oid // empty' <<<"$metadata")" =~ ^[0-9a-f]{40}$ ]]; then
      mark_remediation_needs_human "$checkpoint" "$run" "merged remediation PR evidence no longer satisfies the verified checks/report/merge contract"
      return
    fi
  else
    mark_remediation_needs_human "$checkpoint" "$run" "remediation PR state is $state"
    return
  fi
  REPO_DIR="$state_repo"; MANIFEST_PATH="$state_repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
  reconcile_planning_state "$(jq -r '.base_branch' "$MANIFEST_PATH")" "$state_repo"
  artifact="$(remediation_artifact_from_manifest "$wave")"; REMEDIATION_EVIDENCE="$(build_merged_remediation_evidence "$pr" "$branch" "$report" "$artifact" true)"
  REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run"; REMEDIATION_BRANCH="$branch"
  state_transaction "remediation-recovery:$run" "transaction_complete_remediation" "chore(pipeline): recover remediation $run"
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

# shellcheck disable=SC2329
transaction_checkpoint() {
  local wave checkpoint action start_sha end_sha request
  action="$(select_action)"; [[ "$(jq -r '.action' <<<"$action")" == checkpoint ]] || die "checkpoint is no longer eligible"
  wave="$(jq -r '.wave' <<<"$action")"; checkpoint="$(jq -r '.checkpoint' <<<"$action")"
  [[ "$(jq -r --arg wave "$wave" '[.waves[] | select(.id == $wave) | .tasks[].status] | all(. == "completed" or . == "superseded")' "$MANIFEST_PATH")" == true ]] || die "wave tasks are not complete"
  [[ "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.status' "$MANIFEST_PATH")" == pending ]] || die "checkpoint is not pending"
  start_sha="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .start_sha // empty' "$MANIFEST_PATH")"; [[ -n "$start_sha" ]] || die "wave start SHA missing"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then end_sha="0123456789012345678901234567890123456789"; else end_sha="$(git -C "$REPO_DIR" rev-parse HEAD)"; fi
  request="$(artifact_path "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.request_artifact' "$MANIFEST_PATH")")"
  render_checkpoint_request "$wave" "$checkpoint" "$end_sha" "$request"
  STATE_ARTIFACT="$request"
  jq --arg id "$checkpoint" --arg sha "$end_sha" '.waves |= map(if .checkpoint.id == $id then .checkpoint.status="awaiting_review" | .checkpoint.requested_end_sha=$sha else . end)' "$MANIFEST_PATH" | write_manifest
}

create_checkpoint() {
  state_transaction "checkpoint-request" "transaction_checkpoint" "chore(pipeline): request architecture review"
}

# shellcheck disable=SC2329
transaction_review_result() {
  local id="$REVIEW_ID" result="$REVIEW_VERDICT" source="$REVIEW_SOURCE" wave requested_sha result_sha target attempts max existing
  [[ "$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | .checkpoint.status // empty' "$MANIFEST_PATH")" == awaiting_review ]] || die "checkpoint is no longer awaiting review"
  requested_sha="$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | .checkpoint.requested_end_sha // empty' "$MANIFEST_PATH")"
  result_sha="$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$source" | head -n1 | cut -d= -f2)"
  [[ -n "$requested_sha" && "$result_sha" == "$requested_sha" ]] || die "review result SHA no longer matches requested product SHA"
  assert_checkpoint_fresh "$requested_sha"
  wave="$(wave_for_id "$id")"; target="$(artifact_path "$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.result_artifact' "$MANIFEST_PATH")")"
  existing="$(test -f "$target" && shasum -a 256 "$target" | awk '{print $1}' || true)"
  if [[ -n "$existing" && "$existing" == "$(shasum -a 256 "$source" | awk '{print $1}')" ]]; then die "identical review result already recorded"; fi
  [[ ! -e "$target" ]] || die "different review result already exists; refusing overwrite"
  mkdir -p "$(dirname "$target")"; cp "$source" "$target"; STATE_ARTIFACT="$target"
  if [[ "$result" == PASS ]]; then
    jq --arg id "$id" --arg sha "$requested_sha" '.waves |= map(if .checkpoint.id == $id then .checkpoint.status="passed" | .checkpoint.reviewed_sha=$sha else . end)' "$MANIFEST_PATH" | write_manifest
  else
    attempts="$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | (.checkpoint.remediation_attempts // 0)' "$MANIFEST_PATH")"; max="$(jq -r '.execution_policy.max_architecture_remediation_attempts' "$MANIFEST_PATH")"
    jq --arg id "$id" --arg status "$( (( attempts >= max )) && echo needs_human || echo changes_requested )" '.waves |= map(if .checkpoint.id == $id then .checkpoint.status=$status else . end)' "$MANIFEST_PATH" | write_manifest
  fi
}

dispatch_task() {
  [[ "${PIPELINE_ALLOW_PRODUCT_DISPATCH:-0}" == "1" ]] || die "dispatch requires PIPELINE_ALLOW_PRODUCT_DISPATCH=1"
  [[ -n "${CODEX_CMD:-}" ]] || die "dispatch requires an explicit CODEX_CMD; no unsafe default is provided"
  [[ ! -e "$STOP_FILE" ]] || die "STOP file exists: $STOP_FILE"
  local base_branch action task task_branch task_dir control_dir brief outcome log_file contract execution_task dispatch_artifact control_artifact title section deps
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
  control_artifact="$control_dir/DISPATCH.json"
  jq --arg task "$task" --arg branch "$task_branch" --arg base "$base_branch" --arg dispatched_at "$(date -u +%FT%TZ)" '. + {task_id:$task, task_branch:$branch, base_branch:$base, dispatched_at:$dispatched_at}' "$outcome" >"$control_artifact"
  mkdir -p "$(dirname "$dispatch_artifact")"
  state_transaction "task-start:$task" "transaction_start_task '$task' '$control_artifact' '$dispatch_artifact'" "chore(pipeline): start OS 3.8 task $task" "$dispatch_artifact"
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
  synchronization_gate "$task_branch" "$REPO_DIR" "${PIPELINE_ALLOW_DETACHED_TASK_WORKTREE:-0}"
  expected_repo="${PIPELINE_EXPECTED_REPOSITORY:-$(git -C "$REPO_DIR" remote get-url origin | sed -E 's#^.*github\.com[:/]##; s#\.git$##')}"
  expected_base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  repo_json="$(github_pr_metadata "$pr_url")"
  [[ "$(jq -r '.repository.nameWithOwner' <<<"$repo_json")" == "$expected_repo" ]] || die "PR repository does not match origin"
  [[ "$(jq -r '.headRepository.nameWithOwner' <<<"$repo_json")" == "$expected_repo" ]] || die "PR head repository does not match origin"
  [[ "$(jq -r '.baseRefName' <<<"$repo_json")" == "$expected_base" ]] || die "PR base does not match manifest base branch"
  [[ "$(jq -r '.headRefName' <<<"$repo_json")" == "$task_branch" ]] || die "PR head branch does not match authorized task branch"
  local_head="$(git -C "$REPO_DIR" rev-parse HEAD)"; remote_head="$(git -C "$REPO_DIR" rev-parse "origin/$task_branch")"
  [[ "$local_head" == "$remote_head" && "$local_head" == "$(jq -r '.headRefOid' <<<"$repo_json")" ]] || die "local, remote task branch, and PR head SHA differ"
  if [[ -n "${IMPLEMENTATION_REPORT:-}" ]]; then
    [[ "$IMPLEMENTATION_REPORT" != /* && "$IMPLEMENTATION_REPORT" != *".."* ]] || die "implementation report must be a safe repository-relative path"
    git -C "$REPO_DIR" cat-file -e "$local_head:$IMPLEMENTATION_REPORT" || die "implementation report is absent from exact PR head"
    gh pr diff "$pr_url" --name-only | grep -Fxq "$IMPLEMENTATION_REPORT" || die "implementation report is not included in PR diff"
  fi
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
  if [[ "$task" != "__remediation__" ]]; then
    [[ "$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .status' "$state_manifest")" == "running" ]] || die "merged PR cannot be persisted because manifest is not running: $task"
  fi
  evidence="$(jq -n --arg pr "$pr_url" --arg merged_at "$(date -u +%FT%TZ)" --arg merge_sha "$(gh pr view "$pr_url" --json mergeCommit --jq '.mergeCommit.oid')" --arg report "${IMPLEMENTATION_REPORT:?IMPLEMENTATION_REPORT required}" '{pr_url:$pr, merge_sha:$merge_sha, implementation_report:$report, validation:{checks:"passed"}, merged_at:$merged_at}')"
  validate_evidence "$evidence"
  if [[ "$task" != "__remediation__" ]]; then
    state_transaction "task-complete:$task" "transaction_complete_task '$task' '$evidence'" "chore(pipeline): record merged OS 3.8 task $task"
  fi
}

# shellcheck disable=SC2329
transaction_record_steven_ia() {
  local status checkpoint_status reviewed_sha artifact_relative artifact expected approved_by approved_at approved_sha
  valid_approver "$STEVEN_IA_APPROVER" || die "invalid STEVEN-IA approver"
  valid_utc_timestamp "$STEVEN_IA_APPROVED_AT" || die "invalid STEVEN-IA approval timestamp"
  checkpoint_status="$(jq -r '.waves[] | select(.id == "W2") | .checkpoint.status' "$MANIFEST_PATH")"
  reviewed_sha="$(jq -r '.waves[] | select(.id == "W2") | .checkpoint.reviewed_sha // empty' "$MANIFEST_PATH")"
  [[ "$checkpoint_status" == passed && "$reviewed_sha" =~ ^[0-9a-f]{40}$ ]] || die "STEVEN-IA requires AR-W2 PASS with a reviewed SHA"
  status="$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.status' "$MANIFEST_PATH")"
  artifact_relative="$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approval_artifact' "$MANIFEST_PATH")"
  safe_relative_path "$artifact_relative" || die "STEVEN-IA approval artifact path is invalid"
  artifact="$(artifact_path "$artifact_relative")"
  printf -v expected 'GATE=STEVEN-IA\nDECISION=APPROVED\nAPPROVER=%s\nAPPROVED_AT=%s\nAR_W2_REVIEWED_SHA=%s' "$STEVEN_IA_APPROVER" "$STEVEN_IA_APPROVED_AT" "$reviewed_sha"
  if [[ "$status" == approved ]]; then
    approved_by="$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approved_by // empty' "$MANIFEST_PATH")"
    approved_at="$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approved_at // empty' "$MANIFEST_PATH")"
    approved_sha="$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.approved_reviewed_sha // empty' "$MANIFEST_PATH")"
    if [[ "$approved_by" == "$STEVEN_IA_APPROVER" && "$approved_at" == "$STEVEN_IA_APPROVED_AT" && "$approved_sha" == "$reviewed_sha" && -f "$artifact" && "$(cat "$artifact")" == "$expected" ]]; then
      STATE_TRANSACTION_NOOP=1
      return
    fi
    die "STEVEN-IA already has different or incomplete approval evidence"
  fi
  [[ "$status" == pending ]] || die "STEVEN-IA is not pending"
  [[ ! -e "$artifact" ]] || die "STEVEN-IA approval artifact already exists"
  mkdir -p "$(dirname "$artifact")"
  printf '%s\n' "$expected" >"$artifact"
  jq --arg approver "$STEVEN_IA_APPROVER" --arg timestamp "$STEVEN_IA_APPROVED_AT" --arg sha "$reviewed_sha" '
    .waves |= map(if .human_gate?.id == "STEVEN-IA" then
      .human_gate.status="approved" |
      .human_gate.approved_by=$approver |
      .human_gate.approved_at=$timestamp |
      .human_gate.approved_reviewed_sha=$sha
    else . end)
  ' "$MANIFEST_PATH" | write_manifest
  STATE_ARTIFACT="$artifact"
}

record_steven_ia() {
  local approver="$1" approved_at="$2"
  valid_approver "$approver" || die "approver must be a valid GitHub-style identity"
  valid_utc_timestamp "$approved_at" || die "approval timestamp must be a valid UTC RFC3339 timestamp"
  STEVEN_IA_APPROVER="$approver"; STEVEN_IA_APPROVED_AT="$approved_at"
  state_transaction "steven-ia" "transaction_record_steven_ia" "chore(pipeline): record STEVEN-IA approval"
}

# shellcheck disable=SC2329
transaction_final_audit_request() {
  local status product_sha request_relative report_relative request requested_at baseline_sha
  final_audit_prerequisites_satisfied || die "final audit prerequisites are no longer satisfied"
  status="$(jq -r '.final_audit.status' "$MANIFEST_PATH")"
  [[ "$status" == pending ]] || die "final audit request requires pending status"
  product_sha="$(jq -r '.waves[-1].checkpoint.reviewed_sha // empty' "$MANIFEST_PATH")"
  [[ "$product_sha" =~ ^[0-9a-f]{40}$ ]] || die "final reviewed product SHA is invalid"
  assert_final_audit_fresh "$product_sha" request
  request_relative="$(jq -r '.final_audit.request' "$MANIFEST_PATH")"; report_relative="$(jq -r '.final_audit.report' "$MANIFEST_PATH")"
  if ! safe_relative_path "$request_relative" || ! safe_relative_path "$report_relative"; then die "final audit artifact path is invalid"; fi
  request="$(artifact_path "$request_relative")"; [[ ! -e "$request" ]] || die "final audit request already exists"
  requested_at="$(date -u +%FT%TZ)"; baseline_sha="$(jq -r '.waves[0].start_sha // empty' "$MANIFEST_PATH")"
  [[ "$baseline_sha" =~ ^[0-9a-f]{40}$ ]] || die "final audit baseline SHA is invalid"
  mkdir -p "$(dirname "$request")"
  cat >"$request" <<EOF
# OS 3.8 Final Audit Request

AUDIT_ID=$(jq -r '.final_audit.id' "$MANIFEST_PATH")
BASELINE_SHA=$baseline_sha
REQUESTED_PRODUCT_SHA=$product_sha
REQUESTED_AT=$requested_at
REPORT_PATH=$report_relative
RELEASE_GATE=BLOCKED

Review the exact product range ending at REQUESTED_PRODUCT_SHA. Write exactly one VERDICT=PASS or VERDICT=FAIL and one REVIEWED_SHA matching that SHA. PASS_WITH_CONDITION is not PASS. Release, tag, and deploy remain blocked.
EOF
  jq --arg sha "$product_sha" --arg requested_at "$requested_at" '
    .final_audit.status="running" |
    .final_audit.requested_product_sha=$sha |
    .final_audit.requested_at=$requested_at |
    .final_audit.reviewed_sha=null |
    .final_audit.completed_at=null |
    .release_gate.status="blocked"
  ' "$MANIFEST_PATH" | write_manifest
  STATE_ARTIFACT="$request"
}

create_final_audit_request() {
  state_transaction "final-audit-request" "transaction_final_audit_request" "chore(pipeline): request OS 3.8 final audit"
  log "clean stop: final audit requested"
}

# shellcheck disable=SC2329
transaction_final_audit_result() {
  local status expected_status requested_sha request_relative report_relative request report completed_at existing_sha canonical_source source_digest verdict_count sha_count source_reviewed_sha
  canonical_source="$(external_source_path "$FINAL_AUDIT_SOURCE" || true)"
  [[ "$canonical_source" == "$FINAL_AUDIT_SOURCE" ]] || die "final audit result source must remain outside the repository"
  source_digest="$(shasum -a 256 "$canonical_source" | awk '{print $1}')"
  [[ "$source_digest" == "$FINAL_AUDIT_SOURCE_SHA256" ]] || die "final audit result source changed before the state transaction"
  verdict_count="$(awk -F= '$1 == "VERDICT" {count++} END {print count + 0}' "$canonical_source")"
  sha_count="$(awk -F= '$1 == "REVIEWED_SHA" {count++} END {print count + 0}' "$canonical_source")"
  [[ "$verdict_count" == 1 && "$sha_count" == 1 ]] || die "final audit result changed to an invalid format before the state transaction"
  grep -Fqx "VERDICT=$FINAL_AUDIT_VERDICT" "$canonical_source" || die "final audit result verdict changed before the state transaction"
  source_reviewed_sha="$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$canonical_source" | cut -d= -f2)"
  [[ "$source_reviewed_sha" == "$FINAL_AUDIT_REVIEWED_SHA" ]] || die "final audit result reviewed SHA changed before the state transaction"
  status="$(jq -r '.final_audit.status' "$MANIFEST_PATH")"; expected_status="$(tr '[:upper:]' '[:lower:]' <<<"$FINAL_AUDIT_VERDICT")"
  requested_sha="$(jq -r '.final_audit.requested_product_sha // empty' "$MANIFEST_PATH")"
  request_relative="$(jq -r '.final_audit.request' "$MANIFEST_PATH")"; report_relative="$(jq -r '.final_audit.report' "$MANIFEST_PATH")"
  if ! safe_relative_path "$request_relative" || ! safe_relative_path "$report_relative"; then die "final audit artifact path is invalid"; fi
  request="$(artifact_path "$request_relative")"; report="$(artifact_path "$report_relative")"
  if [[ "$status" == pass || "$status" == fail ]]; then
    existing_sha="$(jq -r '.final_audit.reviewed_sha // empty' "$MANIFEST_PATH")"
    if [[ "$status" == "$expected_status" && "$existing_sha" == "$FINAL_AUDIT_REVIEWED_SHA" && -f "$report" && "$(shasum -a 256 "$report" | awk '{print $1}')" == "$(shasum -a 256 "$FINAL_AUDIT_SOURCE" | awk '{print $1}')" && "$(jq -r '.release_gate.status' "$MANIFEST_PATH")" == blocked ]]; then
      STATE_TRANSACTION_NOOP=1
      return
    fi
    die "final audit already has a different or incomplete terminal result"
  fi
  [[ "$status" == running ]] || die "final audit result requires running status"
  final_audit_prerequisites_satisfied || die "final audit prerequisites are no longer satisfied"
  [[ "$requested_sha" =~ ^[0-9a-f]{40}$ && "$FINAL_AUDIT_REVIEWED_SHA" == "$requested_sha" ]] || die "final audit result SHA does not match the requested product SHA"
  [[ -f "$request" ]] || die "canonical final audit request is missing"
  grep -Fqx "REQUESTED_PRODUCT_SHA=$requested_sha" "$request" || die "final audit request SHA does not match Manifest"
  assert_final_audit_fresh "$requested_sha" result
  [[ ! -e "$report" ]] || die "canonical final audit report already exists before terminal transition"
  mkdir -p "$(dirname "$report")"; cp "$FINAL_AUDIT_SOURCE" "$report"
  completed_at="$(date -u +%FT%TZ)"
  jq --arg status "$expected_status" --arg sha "$requested_sha" --arg completed_at "$completed_at" '
    .final_audit.status=$status |
    .final_audit.reviewed_sha=$sha |
    .final_audit.completed_at=$completed_at |
    .release_gate.status="blocked"
  ' "$MANIFEST_PATH" | write_manifest
  STATE_ARTIFACT="$report"
}

record_final_audit_result() {
  local verdict="$1" source="$2" canonical_source verdict_count sha_count reviewed_sha source_digest
  [[ "$verdict" == PASS || "$verdict" == FAIL ]] || die "audit result must be exactly PASS or FAIL"
  canonical_source="$(external_source_path "$source" || true)"; [[ -n "$canonical_source" ]] || die "audit result source must be a regular file outside the repository"
  verdict_count="$(awk -F= '$1 == "VERDICT" {count++} END {print count + 0}' "$canonical_source")"
  sha_count="$(awk -F= '$1 == "REVIEWED_SHA" {count++} END {print count + 0}' "$canonical_source")"
  [[ "$verdict_count" == 1 && "$sha_count" == 1 ]] || die "audit result requires exactly one VERDICT and one REVIEWED_SHA"
  grep -Fqx "VERDICT=$verdict" "$canonical_source" || die "audit result verdict does not match command; conditional verdicts are rejected"
  reviewed_sha="$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$canonical_source" | cut -d= -f2)"
  [[ "$reviewed_sha" =~ ^[0-9a-f]{40}$ ]] || die "audit result requires a 40-character REVIEWED_SHA"
  source_digest="$(shasum -a 256 "$canonical_source" | awk '{print $1}')"
  FINAL_AUDIT_VERDICT="$verdict"; FINAL_AUDIT_SOURCE="$canonical_source"; FINAL_AUDIT_REVIEWED_SHA="$reviewed_sha"; FINAL_AUDIT_SOURCE_SHA256="$source_digest"
  state_transaction "final-audit-result" "transaction_final_audit_result" "chore(pipeline): record OS 3.8 final audit"
}

run_cycle() {
  local action kind
  action="$(select_action)"; kind="$(jq -r '.action' <<<"$action")"
  case "$kind" in
    task)
      [[ "${PIPELINE_AUTOMATE_TASK_CYCLE:-0}" == "1" ]] || die "task cycle requires PIPELINE_AUTOMATE_TASK_CYCLE=1"
      dispatch_task
      ;;
    recovery) recover_running_task "$(jq -r '.task' <<<"$action")" ;;
    checkpoint) create_checkpoint ;;
    remediation) run_remediation "$(jq -r '.checkpoint' <<<"$action")" ;;
    remediation_recovery) recover_active_remediation "$(jq -r '.checkpoint' <<<"$action")" ;;
    final_audit) create_final_audit_request ;;
    awaiting_review|awaiting_human_gate|awaiting_final_audit|needs_human|complete)
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
    [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] || die "direct task start is forbidden; use --dispatch so outcome evidence and state are committed atomically"
    id="${2:?task ID required}"; [[ "$(jq -r --arg id "$id" '[.waves[] | .tasks[] | select(.id == $id)] | length' "$MANIFEST_PATH")" == "1" ]] || die "unknown task: $id"
    [[ "$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == "pending" ]] || die "task must be pending: $id"
    require_selected_task "$id"
    start_task "$id"
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
    result_source="${4:?result artifact file required}"
    [[ -f "$result_source" ]] || die "review result artifact is missing"
    grep -Fqx "VERDICT=$result" "$result_source" || die "review result verdict does not match command"
    result_sha="$(grep -E '^REVIEWED_SHA=[0-9a-f]{40}$' "$result_source" | head -n1 | cut -d= -f2)"
    [[ -n "$result_sha" ]] || die "review result requires a 40-character REVIEWED_SHA"
    REVIEW_ID="$id" REVIEW_VERDICT="$result" REVIEW_SOURCE="$result_source" state_transaction "review-result:$id" "transaction_review_result" "chore(pipeline): record $id architecture review"
    ;;
  --record-steven-ia)
    record_steven_ia "${2:?approver required}" "${3:?timestamp required}"
    ;;
  --record-final-audit)
    record_final_audit_result "${2:?PASS or FAIL required}" "${3:?external audit result path required}"
    ;;
  --verify-pr) verify_pr "${2:?PR URL required}" ;;
  --merge-task-pr) merge_task_pr "${2:?task ID required}" "${3:?PR URL required}" ;;
  --dispatch) dispatch_task ;;
  --cycle) run_cycle ;;
  --help|-h) usage ;;
  *) usage >&2; die "unknown command: $command" ;;
esac
