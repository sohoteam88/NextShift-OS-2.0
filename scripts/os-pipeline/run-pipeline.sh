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
STATE_TRANSACTION_NOOP=0
DISPATCH_GATE_AUTHORIZED_DIGEST=""
declare -a STATE_STAGE_PATHS=()
STATE_ROLLBACK_DIR=""
declare -a STATE_OWNED_PATHS=()
declare -a STATE_OWNED_EXISTED=()

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
  --adopt-governance-gate GATE_TASK BLOCKED_TASK SOURCE PR_URL
                                        Atomically adopt an exact-head reviewed gate and unblock its consumer.
  --evaluate-pr-check-requirement TASK_ID PR_URL EXPECTED_HEAD_SHA EXPECTED_BASE_SHA
                                        Read-only exact-PR CI requirement evaluation.
  --verify-pr TASK_ID PR_URL            Run local gates and enforce the Manifest task policy.
  --merge-task-pr TASK_ID PR_URL        Verify and merge an eligible task PR (explicit opt-in).
  --recover-task TASK_ID                Resume one exact normal-task PR without redispatching Codex.
  --dispatch                            Explicitly dispatch the next eligible task (operator opt-in only).
  --cycle                               Route one restart-safe pipeline action (operator opt-in for task work).

The manifest is the sole state source. AUTO_RELEASE and AUTO_DEPLOY must remain 0.
EOF
}

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*" >&2; }
die() { log "ABORT: $*"; exit 1; }
require_jq() { command -v jq >/dev/null 2>&1 || die "jq is required"; }
write_manifest() { local tmp; tmp="$(mktemp "${MANIFEST_PATH}.XXXXXX")"; cat >"$tmp"; mv "$tmp" "$MANIFEST_PATH"; }

atomic_replace() {
  local source="$1" target="$2" tmp
  mkdir -p "$(dirname "$target")"
  [[ ! -L "$target" ]] || die "atomic state target is a symlink: $target"
  tmp="$(mktemp "$(dirname "$target")/.pipeline-write.XXXXXX")"
  cp "$source" "$tmp"
  sync
  mv "$tmp" "$target"
}

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

release_state_lock() {
  [[ -n "$STATE_LOCK_DIR" && -n "$STATE_LOCK_OWNER" ]] || return 0
  if [[ "$(cat "$STATE_LOCK_DIR/owner" 2>/dev/null || true)" == "$STATE_LOCK_OWNER" ]]; then
    rm -f "$STATE_LOCK_DIR/owner"
    rmdir "$STATE_LOCK_DIR" 2>/dev/null || true
  fi
  STATE_LOCK_OWNER=""
}

transaction_own_path() {
  local path="$1" repo_root path_root normalized relative slot
  [[ -n "$STATE_ROLLBACK_DIR" ]] || die "transaction rollback directory is not initialized"
  repo_root="$(cd "$REPO_DIR" && pwd -P)"
  if [[ "$path" == /* ]]; then
    path_root="$(cd "$(dirname "$path")" && pwd -P)"; normalized="$path_root/$(basename "$path")"
    [[ "$normalized" == "$repo_root/"* ]] || die "transaction-owned path is outside repository: $path"
    relative="${normalized#"$repo_root"/}"
  else relative="$path"; fi
  safe_relative_path "$relative" || die "transaction-owned path is unsafe: $relative"
  for slot in "${STATE_OWNED_PATHS[@]:-}"; do [[ "$slot" == "$relative" ]] && return; done
  slot="${#STATE_OWNED_PATHS[@]}"
  STATE_OWNED_PATHS+=("$relative")
  if [[ -e "$repo_root/$relative" ]]; then
    [[ -f "$repo_root/$relative" && ! -L "$repo_root/$relative" ]] || die "transaction-owned path is not a regular file: $relative"
    STATE_OWNED_EXISTED+=(1)
    cp "$repo_root/$relative" "$STATE_ROLLBACK_DIR/$slot"
  else
    STATE_OWNED_EXISTED+=(0)
  fi
}

clear_state_rollback() {
  [[ -z "$STATE_ROLLBACK_DIR" ]] || rm -rf "$STATE_ROLLBACK_DIR"
  STATE_ROLLBACK_DIR=""
  STATE_OWNED_PATHS=()
  STATE_OWNED_EXISTED=()
}

rollback_state_transaction() {
  local repo_root current remote branch index relative
  [[ -n "$STATE_ROLLBACK_DIR" && -d "$STATE_ROLLBACK_DIR" ]] || return 0
  repo_root="$(cd "$REPO_DIR" && pwd -P)"; branch="$(git -C "$REPO_DIR" branch --show-current)"
  current="$(git -C "$REPO_DIR" rev-parse HEAD 2>/dev/null || true)"
  remote="$(git -C "$REPO_DIR" rev-parse "origin/$branch" 2>/dev/null || true)"
  if [[ -n "$STATE_EXPECTED_HEAD" && "$current" != "$STATE_EXPECTED_HEAD" ]]; then
    if [[ "$remote" == "$STATE_EXPECTED_HEAD" ]]; then
      git -C "$REPO_DIR" update-ref "refs/heads/$branch" "$STATE_EXPECTED_HEAD" "$current" || true
    else
      log "ROLLBACK BLOCKED: remote state changed; explicit human recovery required"
      return 1
    fi
  fi
  for ((index=0; index<${#STATE_OWNED_PATHS[@]}; index++)); do
    relative="${STATE_OWNED_PATHS[$index]}"
    if [[ "${STATE_OWNED_EXISTED[$index]}" == 1 ]]; then
      atomic_replace "$STATE_ROLLBACK_DIR/$index" "$repo_root/$relative"
    else
      rm -f "$repo_root/$relative"
    fi
    git -C "$REPO_DIR" add -A -- "$relative" 2>/dev/null || true
  done
  if [[ -n "${GOVERNANCE_CANDIDATE_ROOT:-}" && "$GOVERNANCE_CANDIDATE_ROOT" == "$CONTROL_ROOT/"* ]]; then
    rm -rf "$GOVERNANCE_CANDIDATE_ROOT"
  fi
  clear_state_rollback
  [[ -z "$(git -C "$REPO_DIR" status --porcelain)" ]] || { log "ROLLBACK FAILED: transaction-owned state is not clean"; return 1; }
  log "ROLLBACK: restored transaction-owned files byte-for-byte"
}

transaction_stage_path() {
  local path="$1" repo_root path_root normalized_path relative existing
  [[ -n "$path" ]] || die "state artifact path is empty"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then
    STATE_STAGE_PATHS+=("$path")
    return
  fi
  repo_root="$(cd "$REPO_DIR" && pwd -P)"
  if [[ "$path" == /* ]]; then
    path_root="$(cd "$(dirname "$path")" && pwd -P)" || die "cannot resolve state artifact directory"
    normalized_path="$path_root/$(basename "$path")"
    [[ "$normalized_path" == "$repo_root/"* ]] || die "state artifact is outside the authorized repository: $path"
    relative="${normalized_path#"$repo_root"/}"
  else
    relative="$path"
  fi
  safe_relative_path "$relative" || die "state artifact path is unsafe: $relative"
  [[ ! -d "$repo_root/$relative" && ! -L "$repo_root/$relative" ]] || die "state artifact must be a non-symlink file path: $relative"
  for existing in "${STATE_STAGE_PATHS[@]:-}"; do
    [[ "$existing" == "$relative" ]] && return
  done
  STATE_STAGE_PATHS+=("$relative")
}

persist_state() {
  local message="$1"; shift
  [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] && return
  local base_branch remote_now repo_root manifest_root manifest_relative staged allowed path
  [[ -n "$STATE_LOCK_DIR" && -n "$STATE_LOCK_OWNER" ]] || die "state persistence requires an owned transaction lock"
  [[ "$(cat "$STATE_LOCK_DIR/owner" 2>/dev/null || true)" == "$STATE_LOCK_OWNER" ]] || die "state transaction lock ownership changed"
  base_branch="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  [[ "$(git -C "$REPO_DIR" branch --show-current)" == "$base_branch" ]] || die "state persistence requires authorized planning branch: $base_branch"
  [[ -n "$STATE_EXPECTED_HEAD" ]] || die "state persistence requires a synchronization gate"
  remote_now="$(git -C "$REPO_DIR" rev-parse "origin/$base_branch")"
  [[ "$remote_now" == "$STATE_EXPECTED_HEAD" ]] || die "planning branch changed after synchronization; refusing state write"
  git -C "$REPO_DIR" add -A -- "$MANIFEST_PATH" "$@"
  [[ -z "$(git -C "$REPO_DIR" diff --name-only)" && -z "$(git -C "$REPO_DIR" ls-files --others --exclude-standard)" ]] || die "state callback changed an unregistered path"
  repo_root="$(cd "$REPO_DIR" && pwd -P)"; manifest_root="$(cd "$(dirname "$MANIFEST_PATH")" && pwd -P)"
  manifest_relative="${manifest_root#"$repo_root"/}/$(basename "$MANIFEST_PATH")"
  while IFS= read -r staged; do
    [[ -n "$staged" ]] || continue
    allowed=0
    [[ "$staged" == "$manifest_relative" ]] && allowed=1
    for path in "$@"; do [[ "$staged" == "$path" ]] && allowed=1; done
    (( allowed == 1 )) || die "state callback staged an unregistered path: $staged"
  done < <(git -C "$REPO_DIR" diff --cached --name-only)
  git -C "$REPO_DIR" diff --cached --quiet && die "state transition produced no staged artifact"
  git -C "$REPO_DIR" commit -m "$message"
  if ! git -C "$REPO_DIR" push origin "$base_branch"; then
    remote_now="$(git -C "$REPO_DIR" ls-remote origin "refs/heads/$base_branch" | awk '{print $1}')"
    [[ "$remote_now" == "$(git -C "$REPO_DIR" rev-parse HEAD)" ]] || die "state push failed before remote advancement"
    log "state push transport failed after remote accepted the exact commit"
  fi
  [[ "$(git -C "$REPO_DIR" rev-parse HEAD)" == "$(git -C "$REPO_DIR" rev-parse "origin/$base_branch")" ]] || die "state commit did not reach origin"
}

# Short, serialized state transaction. The callback name and each data argument are
# passed separately; repository state is never interpreted as shell source.
state_transaction() {
  local command_name="$1" message="$2" mutation_callback="$3"; shift 3
  if [[ ! "$mutation_callback" =~ ^transaction_[A-Za-z0-9_]+$ ]] || ! declare -F "$mutation_callback" >/dev/null; then
    die "invalid state transaction callback: $mutation_callback"
  fi
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then
    STATE_STAGE_PATHS=(); STATE_TRANSACTION_NOOP=0
    "$mutation_callback" "$@"
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
  mkdir -p "$CONTROL_ROOT"
  STATE_ROLLBACK_DIR="$(mktemp -d "$CONTROL_ROOT/state-rollback.XXXXXX")"
  STATE_OWNED_PATHS=(); STATE_OWNED_EXISTED=()
  trap 'rollback_state_transaction || true; release_state_lock' EXIT
  synchronization_gate "$base_branch"
  "$VALIDATOR" --manifest "$MANIFEST_PATH" >/dev/null
  STATE_STAGE_PATHS=()
  STATE_TRANSACTION_NOOP=0
  "$mutation_callback" "$@"
  "$VALIDATOR" --manifest "$MANIFEST_PATH" >/dev/null
  if [[ "$STATE_TRANSACTION_NOOP" == "1" ]]; then
    [[ -z "$(git -C "$REPO_DIR" status --porcelain)" ]] || die "no-op state callback changed repository state"
    log "clean stop: state transaction already applied ($command_name)"
    clear_state_rollback
    release_state_lock
    trap - EXIT
    return 0
  fi
  if [[ -n "${STATE_STAGE_PATHS[*]-}" ]]; then
    persist_state "$message" "${STATE_STAGE_PATHS[@]}"
  else
    persist_state "$message"
  fi
  clear_state_rollback
  release_state_lock
  trap - EXIT
}

transaction_start_task() {
  local id="$1" artifact_source="$2" artifact_target="$3" expected_digest="$4" expected_gate_digest="${5:-}" canonical_source actual_digest actual_gate_digest
  require_selected_task "$id"
  [[ "$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == pending ]] || die "task changed before transaction: $id"
  if task_has_dispatch_gate "$id"; then
    [[ -n "$expected_gate_digest" ]] || die "locked task start has no authorized gate digest"
    validate_governance_dispatch_gate "$id" pending
    actual_gate_digest="$(governance_gate_digest "$id")"
    [[ "$actual_gate_digest" == "$expected_gate_digest" ]] || die "governance gate changed before locked task start"
  fi
  canonical_source="$(external_source_path "$artifact_source" || true)"
  [[ "$canonical_source" == "$artifact_source" ]] || die "task dispatch control artifact must be a regular file outside the repository"
  actual_digest="$(shasum -a 256 "$canonical_source" | awk '{print $1}')"
  [[ "$actual_digest" == "$expected_digest" ]] || die "task dispatch control artifact changed before state transaction"
  cp "$canonical_source" "$artifact_target"
  start_task "$id"
  transaction_stage_path "$artifact_target"
}

# shellcheck disable=SC2329
transaction_authorize_task_dispatch() {
  local id="$1" expected_digest="$2" actual_digest
  require_selected_task "$id"
  validate_governance_dispatch_gate "$id" pending
  actual_digest="$(governance_gate_digest "$id")"
  [[ "$actual_digest" == "$expected_digest" ]] || die "governance gate changed between selection and locked authorization"
  DISPATCH_GATE_AUTHORIZED_DIGEST="$actual_digest"
  STATE_TRANSACTION_NOOP=1
}

transaction_complete_task() {
  local id="$1" evidence="$2" dispatch_relative="$3" status existing
  status="$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")"
  if [[ "$status" == completed ]]; then
    existing="$(jq -Sc --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .evidence' "$MANIFEST_PATH")"
    if [[ "$existing" == "$(jq -Sc . <<<"$evidence")" ]]; then STATE_TRANSACTION_NOOP=1; return; fi
    die "task already has different completion evidence: $id"
  fi
  [[ "$status" == running ]] || die "task is no longer running: $id"
  validate_task_completion_evidence "$id" "$evidence"
  validate_persisted_task_verification "$id" "$dispatch_relative" "$(jq -c '.verification' <<<"$evidence")"
  assert_merged_task_contract "$id" "$evidence"
  update_task_status "$id" running completed "$evidence"
}

transaction_record_task_verification() {
  local id="$1" dispatch_relative="$2" verification="$3" artifact status current artifact_verification metadata remote_head
  status="$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")"
  [[ "$status" == running ]] || die "task is no longer running before verification persistence: $id"
  [[ "$dispatch_relative" == "$(task_dispatch_relative "$id")" ]] || die "task verification targets a non-canonical dispatch artifact"
  safe_relative_path "$dispatch_relative" || die "task dispatch artifact path is invalid"
  artifact="$(artifact_path "$dispatch_relative")"
  [[ -f "$artifact" && ! -L "$artifact" ]] || die "canonical task dispatch artifact is missing"
  validate_task_verification "$id" "$artifact" "$verification"
  current="$(jq -c --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .verification // null' "$MANIFEST_PATH")"
  artifact_verification="$(jq -c '.verification // null' "$artifact")"
  if [[ "$current" != null || "$artifact_verification" != null ]]; then
    if [[ "$(jq -Sc 'del(.verified_at)' <<<"$current")" == "$(jq -Sc 'del(.verified_at)' <<<"$verification")" && "$(jq -Sc 'del(.verified_at)' <<<"$artifact_verification")" == "$(jq -Sc 'del(.verified_at)' <<<"$verification")" ]]; then
      STATE_TRANSACTION_NOOP=1
      return
    fi
    die "task already has conflicting persisted verification: $id"
  fi
  metadata="$(github_pr_metadata "$(jq -r '.pr_url' <<<"$verification")")"
  validate_task_pr_metadata "$metadata" "$(jq -r '.pr_url' <<<"$verification")" "$(jq -r '.task_branch' <<<"$verification")" OPEN "$(jq -r '.verified_head_sha' <<<"$verification")" || die "task PR identity changed before verification persistence"
  remote_head="$(git -C "$REPO_DIR" rev-parse "origin/$(jq -r '.task_branch' <<<"$verification")" 2>/dev/null || true)"
  [[ "$remote_head" == "$(jq -r '.verified_head_sha' <<<"$verification")" ]] || die "remote task head changed before verification persistence"
  ensure_exact_report_at_head "$REPO_DIR" "$(jq -r '.verified_head_sha' <<<"$verification")" "$(jq -r '.implementation_report' <<<"$verification")" "$(jq -r '.pr_url' <<<"$verification")"
  gh pr diff "$(jq -r '.pr_url' <<<"$verification")" --name-only | grep -Fqx -e "$(jq -r '.implementation_report' <<<"$verification")" || die "task report changed before verification persistence"
  assert_task_check_contract "$id" "$verification"
  jq --argjson verification "$verification" '.verification=$verification' "$artifact" >"${artifact}.tmp" && mv "${artifact}.tmp" "$artifact"
  jq --arg id "$id" --argjson verification "$verification" '
    .waves |= map(.tasks |= map(if .id == $id and .status == "running" then .verification=$verification else . end))
  ' "$MANIFEST_PATH" | write_manifest
  transaction_stage_path "$artifact"
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
    (.validation | type == "object" and (.checks | IN("passed", "not_required_paths_ignored")))
  ' <<<"$evidence" >/dev/null || die "evidence must include verified PR, merge SHA, report, and an allowed checks decision"
}

validate_task_completion_evidence() {
  local id="$1" evidence="$2" policy
  policy="$(task_verification_policy "$id")"
  jq -e --arg id "$id" --arg policy "$policy" '
    . as $e |
    ($e | type == "object") and
    ($e.pr_url | type == "string" and test("^https://github\\.com/[^/]+/[^/]+/pull/[0-9]+$")) and
    ($e.merge_sha | type == "string" and test("^[0-9a-f]{40}$")) and
    ($e.implementation_report | type == "string" and length > 0) and
    ($e.recovered | type == "boolean") and
    ($e.validation | type == "object" and (.checks | IN("passed", "not_required_paths_ignored")) and (.head_sha | test("^[0-9a-f]{40}$"))) and
    ($e.verification | type == "object" and .status == "passed" and (.checks | IN("passed", "not_required_paths_ignored")) and
      .report_exists_at_exact_head == true and .report_in_pr_diff == true and
      (.verified_head_sha | test("^[0-9a-f]{40}$")) and
      .pr_url == $e.pr_url and .implementation_report == $e.implementation_report and
      .verified_head_sha == $e.validation.head_sha and .checks == $e.validation.checks and
      (if .checks == "passed" then
       ((.checks_evidence? // null) == null) and (($e.validation.checks_evidence? // null) == null)
       else
        $policy == "paths_ignored_zero_checks_allowed" and
        (.checks_evidence | type == "object" and .decision == "not_required_paths_ignored" and
          .task_id == $id and .task_verification_policy == $policy) and
        .checks_evidence == $e.validation.checks_evidence
       end))
  ' <<<"$evidence" >/dev/null || die "task completion evidence does not preserve the exact verified PR contract"
  safe_relative_path "$(jq -r '.implementation_report' <<<"$evidence")" || die "task completion report path is unsafe"
}

task_dispatch_relative() {
  local id="$1"
  [[ "$id" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$ ]] || die "task ID is unsafe for an artifact path: $id"
  printf 'docs/nextshift-os-3/os-3-8/runs/%s_DISPATCH.json\n' "$id"
}

artifact_path() {
  local relative="$1" repo_root parent_root parent_probe
  safe_relative_path "$relative" || die "artifact path is not a safe repository-relative path: $relative"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then
    printf '%s/%s\n' "$(dirname "$MANIFEST_PATH")" "$(basename "$relative")"
  else
    repo_root="$(cd "$REPO_DIR" && pwd -P)"
    [[ ! -L "$repo_root/$relative" ]] || die "artifact target must not be a symlink: $relative"
    parent_probe="$repo_root/$(dirname "$relative")"
    while [[ ! -e "$parent_probe" ]]; do parent_probe="$(dirname "$parent_probe")"; done
    [[ -d "$parent_probe" ]] || die "artifact parent is not a directory: $relative"
    parent_root="$(cd "$parent_probe" && pwd -P)"
    [[ "$parent_root" == "$repo_root" || "$parent_root" == "$repo_root/"* ]] || die "artifact path escapes through a symlink parent: $relative"
    printf '%s/%s\n' "$repo_root" "$relative"
  fi
}
safe_relative_path() {
  local path="$1"
  [[ -n "$path" && "$path" != /* && "$path" != -* && "$path" != */ && "$path" != *//* && "$path" != *\\* ]] || return 1
  [[ ! "$path" =~ (^|/)\.\.?(/|$) ]] || return 1
  [[ ! "$path" =~ (^|/)\.git(/|$) ]] || return 1
  [[ ! "$path" =~ [[:cntrl:]] ]] || return 1
}

task_manifest_json() {
  jq -c --arg id "$1" '[.waves[] | .tasks[] | select(.id == $id)] | if length == 1 then .[0] else null end' "$MANIFEST_PATH"
}

task_has_dispatch_gate() {
  [[ "$(jq -r --arg id "$1" '[.waves[] | .tasks[] | select(.id == $id) | has("dispatch_gate")] | if length == 1 then .[0] else false end' "$MANIFEST_PATH")" == true ]]
}

governance_gate_digest() {
  local task_id="$1" task gate_task_id dependency artifact_relative artifact decision_sha head
  task="$(task_manifest_json "$task_id")"; [[ "$task" != null ]] || die "unknown gated task: $task_id"
  gate_task_id="$(jq -r '.dispatch_gate.task_id // empty' <<<"$task")"; [[ -n "$gate_task_id" ]] || die "task has no dispatch gate: $task_id"
  dependency="$(task_manifest_json "$gate_task_id")"; [[ "$dependency" != null ]] || die "dispatch gate references an unknown task: $gate_task_id"
  artifact_relative="$(jq -r '.dispatch_gate.artifact // empty' <<<"$task")"
  artifact="$(artifact_path "$artifact_relative")"; [[ -f "$artifact" && ! -L "$artifact" ]] || die "governance gate artifact is missing or unsafe: $artifact_relative"
  decision_sha="$(jq -r '.decision_sha // empty' "$artifact")"; head="$(git -C "$REPO_DIR" rev-parse HEAD)"
  jq -Scn \
    --arg task_id "$task_id" --arg head "$head" --arg decision_sha "$decision_sha" \
    --arg artifact_digest "$(shasum -a 256 "$artifact" | awk '{print $1}')" \
    --argjson dispatch_gate "$(jq -c '.dispatch_gate' <<<"$task")" \
    --argjson governance_gate "$(jq -c '.governance_gate' <<<"$dependency")" \
    --argjson verification "$(jq -c '.verification' <<<"$dependency")" \
    --argjson evidence "$(jq -c '.evidence' <<<"$dependency")" \
    '{task_id:$task_id,planning_head:$head,decision_sha:$decision_sha,artifact_digest:$artifact_digest,dispatch_gate:$dispatch_gate,governance_gate:$governance_gate,verification:$verification,evidence:$evidence}' |
    shasum -a 256 | awk '{print $1}'
}

canonical_json_sha256() { jq -Sc . | shasum -a 256 | awk '{print $1}'; }

governance_policy_json() {
  local gate_task_id="$1" policy
  policy="$(jq -c --arg id "$gate_task_id" '[.waves[].tasks[] | select(.id == $id) | .governance_gate.policy] | if length == 1 then .[0] else null end' "$MANIFEST_PATH")"
  [[ "$policy" != null ]] || die "trusted governance policy is missing: $gate_task_id"
  printf '%s\n' "$policy"
}

governance_policy_sha256() { governance_policy_json "$1" | canonical_json_sha256; }
protected_paths_sha256() { jq -Sc '.protected_paths | sort' <<<"$1" | shasum -a 256 | awk '{print $1}'; }

validate_reviewed_decision() {
  local gate_task_id="$1" consumer_task_id="$2" decision_sha="$3" pr_url="$4" decision="$5" policy="$6"
  local policy_digest protected_digest selected proof proof_digest decision_artifact
  policy_digest="$(canonical_json_sha256 <<<"$policy")"; protected_digest="$(protected_paths_sha256 "$policy")"
  jq -e --arg gate "$(jq -r --arg id "$gate_task_id" '.waves[].tasks[] | select(.id == $id) | .governance_gate.gate_id' "$MANIFEST_PATH")" \
    --arg task "$gate_task_id" --arg consumer "$consumer_task_id" --arg policy_digest "$policy_digest" --arg protected_digest "$protected_digest" \
    --argjson policy "$policy" '
    . as $decision |
    ((keys_unsorted - ["schema_version","gate_id","task_id","consumer_task_id","decision_status","selected_option","policy_version","policy_sha256","protected_paths_sha256","required_decisions","option_c_proof"]) | length == 0) and
    .schema_version == 1 and .gate_id == $gate and .task_id == $task and .consumer_task_id == $consumer and
    .decision_status == "approved" and .policy_version == $policy.policy_version and .policy_sha256 == $policy_digest and
    .protected_paths_sha256 == $protected_digest and
    (.selected_option | type == "string") and ($policy.allowed_selected_options | index($decision.selected_option) != null) and
    (.required_decisions | type == "array" and length == ($policy.required_decisions | length)) and
    ([.required_decisions[].id] | sort) == ($policy.required_decisions | sort) and
    all(.required_decisions[]; .status == "resolved" and (.decision | type == "string" and length > 0)) and
    (if .selected_option == $policy.option_c.selected_option then
      $policy.option_c.proof_required == true and (.option_c_proof.path == $policy.option_c.proof_artifact) and
      (.option_c_proof.sha256 | type == "string" and test("^[0-9a-f]{64}$"))
     else .option_c_proof == null end)
  ' <<<"$decision" >/dev/null || die "reviewed decision does not match the immutable governance policy"
  decision_artifact="$(jq -r '.decision_artifact' <<<"$policy")"
  gh pr diff "$pr_url" --name-only | grep -Fqx -e "$decision_artifact" || die "reviewed decision artifact is absent from the exact PR diff"
  selected="$(jq -r '.selected_option' <<<"$decision")"
  if [[ "$selected" == "$(jq -r '.option_c.selected_option' <<<"$policy")" ]]; then
    proof="$(jq -r '.option_c_proof.path' <<<"$decision")"; proof_digest="$(jq -r '.option_c_proof.sha256' <<<"$decision")"
    safe_relative_path "$proof" || die "Option C proof path is unsafe"
    git -C "$REPO_DIR" cat-file -e "$decision_sha:$proof" 2>/dev/null || die "Option C proof is absent from reviewed decision SHA"
    [[ "$(git -C "$REPO_DIR" show "$decision_sha:$proof" | shasum -a 256 | awk '{print $1}')" == "$proof_digest" ]] || die "Option C proof digest differs from reviewed Git tree"
    gh pr diff "$pr_url" --name-only | grep -Fqx -e "$proof" || die "Option C proof is absent from reviewed PR diff"
  fi
}

# Validate a canonical gate from trusted Manifest policy and the reviewed Git
# decision. Transport envelopes never participate in authorization.
validate_governance_dispatch_gate() {
  local task_id="$1" expected_status="${2:-pending}" task gate_task_id dependency artifact_relative artifact policy policy_digest
  local decision_sha decision_artifact decision_digest decision reviewed_pr review_id review review_body current_digest protected
  local -a protected_paths=()
  task="$(task_manifest_json "$task_id")"; [[ "$task" != null ]] || die "unknown gated task: $task_id"
  task_has_dispatch_gate "$task_id" || return 0
  [[ "$(jq -r '.status' <<<"$task")" == "$expected_status" ]] || die "gated task $task_id must be $expected_status"
  gate_task_id="$(jq -r '.dispatch_gate.task_id' <<<"$task")"; dependency="$(task_manifest_json "$gate_task_id")"
  [[ "$dependency" != null && "$(jq -r '.status' <<<"$dependency")" == completed ]] || die "governance dependency is not completed: $gate_task_id"
  validate_task_completion_evidence "$gate_task_id" "$(jq -c '.evidence' <<<"$dependency")"
  policy="$(governance_policy_json "$gate_task_id")"; policy_digest="$(canonical_json_sha256 <<<"$policy")"
  artifact_relative="$(jq -r '.dispatch_gate.artifact' <<<"$task")"
  [[ "$artifact_relative" == "$(jq -r '.governance_gate.artifact' <<<"$dependency")" ]] || die "governance and dispatch gate artifacts differ"
  artifact="$(artifact_path "$artifact_relative")"; [[ -f "$artifact" && ! -L "$artifact" ]] || die "canonical governance gate is missing or unsafe"
  git -C "$REPO_DIR" cat-file -e "HEAD:$artifact_relative" 2>/dev/null || die "canonical gate is absent from planning HEAD"
  current_digest="$(shasum -a 256 "$artifact" | awk '{print $1}')"
  [[ "$current_digest" == "$(jq -r '.evidence.governance_gate_digest' <<<"$dependency")" ]] || die "canonical gate digest differs from dependency evidence"
  jq -e --arg gate_task "$gate_task_id" --arg consumer "$task_id" --arg policy_digest "$policy_digest" --argjson policy "$policy" '
    .schema_version == 1 and .gate_id == $policy.gate_id and .task_id == $gate_task and .consumer_task_id == $consumer and
    .status == "approved" and .policy == $policy and .policy_sha256 == $policy_digest and
    .architecture_review.verdict == "PASS" and .architecture_review.reviewed_sha == .decision_sha and
    .freshness.state == "fresh" and .u3b_dispatch_authorized == true
  ' "$artifact" >/dev/null || die "canonical governance gate is not policy-bound"
  decision_sha="$(jq -r '.decision_sha' "$artifact")"; decision_artifact="$(jq -r '.decision_artifact' "$artifact")"
  decision_digest="$(jq -r '.decision_artifact_sha256' "$artifact")"; safe_relative_path "$decision_artifact" || die "decision artifact path is unsafe"
  jq -e --arg sha "$decision_sha" --arg report "$decision_artifact" '
    .verification.verified_head_sha == $sha and
    .verification.implementation_report == $report and
    .evidence.verification.verified_head_sha == $sha and
    .evidence.verification.implementation_report == $report and
    .evidence.validation.head_sha == $sha and
    .evidence.implementation_report == $report
  ' <<<"$dependency" >/dev/null || die "governance dependency evidence differs from the canonical reviewed decision"
  decision="$(git -C "$REPO_DIR" show "$decision_sha:$decision_artifact" 2>/dev/null)" || die "reviewed decision artifact is missing"
  [[ "$(shasum -a 256 <<<"$decision" | awk '{print $1}')" == "$decision_digest" ]] || die "reviewed decision artifact digest mismatch"
  validate_reviewed_decision "$gate_task_id" "$task_id" "$decision_sha" "$(jq -r '.verification.pr_url' <<<"$dependency")" "$decision" "$policy"
  git -C "$REPO_DIR" merge-base --is-ancestor "$decision_sha" HEAD || die "reviewed decision is not in planning history"
  while IFS= read -r protected; do
    safe_relative_path "$protected" || die "trusted protected path is unsafe"
    [[ "$protected" == "$artifact_relative" ]] || protected_paths+=("$protected")
  done < <(jq -r '.protected_paths[]' <<<"$policy")
  if (( ${#protected_paths[@]} )); then git -C "$REPO_DIR" diff --quiet "$decision_sha..HEAD" -- "${protected_paths[@]}" || die "governance decision is stale"; fi
  reviewed_pr="$(jq -r '.verification.pr_url' <<<"$dependency")"; review_id="$(jq -r '.architecture_review.review_id' "$artifact")"
  review="$(governance_review_payload "$reviewed_pr" "$review_id")"; review_body="$(jq -r '.body // empty' <<<"$review")"
  [[ "$(jq -r '.commit_id // empty' <<<"$review")" == "$decision_sha" ]] || die "Architecture Review is not anchored to decision SHA"
  [[ "$(grep -Ec '^VERDICT[=:][[:space:]]*PASS[[:space:]]*$' <<<"$review_body")" == 1 && "$(grep -Ec '^VERDICT[=:]' <<<"$review_body")" == 1 ]] || die "Architecture Review must contain exactly one PASS"
  [[ "$(grep -Ec "^REVIEWED_SHA[=:][[:space:]]*${decision_sha}[[:space:]]*$" <<<"$review_body")" == 1 ]] || die "Architecture Review reviewed SHA mismatch"
}

governance_review_payload() {
  local pr_url="$1" review_id="$2" owner repo number
  [[ "$pr_url" =~ ^https://github\.com/([^/]+)/([^/]+)/pull/([0-9]+)$ ]] || die "invalid governance PR URL"
  owner="${BASH_REMATCH[1]}"; repo="${BASH_REMATCH[2]}"; number="${BASH_REMATCH[3]}"
  gh api "repos/$owner/$repo/pulls/$number/reviews/$review_id" || die "cannot read governance Architecture Review"
}

build_governance_adoption_bundle() {
  local gate_task_id="$1" blocked_task_id="$2" source="$3" pr_url="$4" gate_task blocked_task artifact_relative
  local metadata decision_sha review_id review review_body merge_sha check_policy checks checks_evidence verified_at expected_repo base base_sha branch source_digest verification evidence decision_artifact decision_digest decision policy policy_digest protected_digest protected canonical_gate canonical_digest
  local -a protected_paths=()
  gate_task="$(task_manifest_json "$gate_task_id")"; blocked_task="$(task_manifest_json "$blocked_task_id")"
  [[ "$gate_task" != null && "$blocked_task" != null ]] || die "governance adoption task identity is unknown"
  [[ "$(jq -r '.dispatch_gate.task_id // empty' <<<"$blocked_task")" == "$gate_task_id" ]] || die "blocked task is not bound to the governance task"
  [[ "$(jq -r '.dispatch_gate.gate_id // empty' <<<"$blocked_task")" == "$(jq -r '.governance_gate.gate_id // empty' <<<"$gate_task")" ]] || die "governance adoption gate ID differs"
  artifact_relative="$(jq -r '.governance_gate.artifact // empty' <<<"$gate_task")"
  [[ "$artifact_relative" == "$(jq -r '.dispatch_gate.artifact // empty' <<<"$blocked_task")" ]] || die "governance adoption artifact contract differs"
  safe_relative_path "$artifact_relative" || die "governance adoption artifact path is unsafe"
  [[ -f "$source" && ! -L "$source" ]] || die "governance adoption source is missing or unsafe"
  jq empty "$source" || die "governance adoption source is not JSON"
  jq -e --arg gate "$(jq -r '.governance_gate.gate_id' <<<"$gate_task")" --arg gate_task "$gate_task_id" --arg consumer "$blocked_task_id" --arg pr "$pr_url" '
    ((keys_unsorted - ["schema_version","gate_id","gate_task_id","consumer_task_id","decision_sha","review_id","reviewed_pr_url","decision_artifact","decision_artifact_sha256"]) | length == 0) and
    .schema_version == 1 and .gate_id == $gate and .gate_task_id == $gate_task and .consumer_task_id == $consumer and
    .reviewed_pr_url == $pr and (.decision_sha | test("^[0-9a-f]{40}$")) and
    (.review_id | type == "number" and . > 0 and floor == .) and
    (.decision_artifact | type == "string" and length > 0) and (.decision_artifact_sha256 | test("^[0-9a-f]{64}$"))
  ' "$source" >/dev/null || die "adoption envelope schema or identity is invalid"
  decision_sha="$(jq -r '.decision_sha' "$source")"; review_id="$(jq -r '.review_id' "$source")"
  policy="$(governance_policy_json "$gate_task_id")"; policy_digest="$(canonical_json_sha256 <<<"$policy")"; protected_digest="$(protected_paths_sha256 "$policy")"
  decision_artifact="$(jq -r '.decision_artifact' <<<"$policy")"
  [[ "$(jq -r '.decision_artifact' "$source")" == "$decision_artifact" ]] || die "envelope decision artifact differs from trusted policy"
  metadata="$(github_pr_metadata "$pr_url")"; expected_repo="$(expected_repository)"; base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  jq -e --arg repo "$expected_repo" --arg base "$base" --arg pr "$pr_url" --arg head "$decision_sha" '
    .state == "MERGED" and .repository.nameWithOwner == $repo and .headRepository.nameWithOwner == $repo and
    .baseRefName == $base and .headRefOid == $head and .url == $pr and
    (.baseRefOid | test("^[0-9a-f]{40}$")) and (.mergeCommit.oid | test("^[0-9a-f]{40}$"))
  ' <<<"$metadata" >/dev/null || die "governance PR repository/base/head/merge identity is invalid"
  merge_sha="$(jq -r '.mergeCommit.oid' <<<"$metadata")"; base_sha="$(jq -r '.baseRefOid' <<<"$metadata")"; branch="$(jq -r '.headRefName' <<<"$metadata")"
  git -C "$REPO_DIR" merge-base --is-ancestor "$decision_sha" HEAD || die "governance decision SHA is not in planning history"
  git -C "$REPO_DIR" merge-base --is-ancestor "$merge_sha" HEAD || die "governance merge SHA is not in planning history"
  while IFS= read -r protected; do
    safe_relative_path "$protected" || die "governance adoption protected path is unsafe"
    [[ "$protected" == "$artifact_relative" ]] || protected_paths+=("$protected")
  done < <(jq -r '.protected_paths[]' <<<"$policy")
  if (( ${#protected_paths[@]} > 0 )); then
    git -C "$REPO_DIR" diff --quiet "$decision_sha..HEAD" -- "${protected_paths[@]}" || die "governance adoption is stale after a protected-path change"
  fi
  safe_relative_path "$decision_artifact" || die "governance decision artifact path is unsafe"
  git -C "$REPO_DIR" cat-file -e "$decision_sha:$decision_artifact" 2>/dev/null || die "decision artifact is absent from reviewed decision SHA"
  gh pr diff "$pr_url" --name-only | grep -Fqx -e "$decision_artifact" || die "decision artifact is absent from reviewed PR diff"
  decision="$(git -C "$REPO_DIR" show "$decision_sha:$decision_artifact")"; decision_digest="$(printf '%s\n' "$decision" | shasum -a 256 | awk '{print $1}')"
  [[ "$decision_digest" == "$(jq -r '.decision_artifact_sha256' "$source")" ]] || die "envelope decision artifact digest differs from reviewed Git tree"
  validate_reviewed_decision "$gate_task_id" "$blocked_task_id" "$decision_sha" "$pr_url" "$decision" "$policy"
  source_digest="$(shasum -a 256 "$source" | awk '{print $1}')"
  review="$(governance_review_payload "$pr_url" "$review_id")"; review_body="$(jq -r '.body // empty' <<<"$review")"
  [[ "$(jq -r '.commit_id // empty' <<<"$review")" == "$decision_sha" ]] || die "Architecture Review is not anchored to the gate decision SHA"
  [[ "$(grep -Ec '^VERDICT[=:][[:space:]]*PASS[[:space:]]*$' <<<"$review_body")" == 1 && "$(grep -Ec '^VERDICT[=:]' <<<"$review_body")" == 1 ]] || die "Architecture Review must contain exactly one PASS verdict"
  [[ "$(grep -Ec "^REVIEWED_SHA[=:][[:space:]]*${decision_sha}[[:space:]]*$" <<<"$review_body")" == 1 && "$(grep -Ec '^REVIEWED_SHA[=:]' <<<"$review_body")" == 1 ]] || die "Architecture Review reviewed SHA does not match the decision"
  check_policy="$(task_verification_policy "$gate_task_id")"; checks_evidence=null; verified_at="${GOVERNANCE_ADOPT_VERIFIED_AT:-$(date -u +%FT%TZ)}"
  if gh pr checks "$pr_url" >/dev/null 2>&1; then
    checks=passed
  else
    [[ "$check_policy" == paths_ignored_zero_checks_allowed ]] || die "governance task requires passing GitHub checks"
    checks_evidence="$(evaluate_pr_check_requirement "$gate_task_id" "$pr_url" "$decision_sha" "$base_sha")" || die "governance PR has neither passing checks nor an authorized zero-check decision"
    checks_evidence="$(jq -c --arg at "$verified_at" '.verified_at=$at' <<<"$checks_evidence")"; checks=not_required_paths_ignored
  fi
  verification="$(jq -cn --arg repo "$expected_repo" --arg base "$base" --arg branch "$branch" --arg pr "$pr_url" --arg head "$decision_sha" --arg report "$decision_artifact" --arg dispatch "$(task_dispatch_relative "$gate_task_id")" --arg checks "$checks" --arg verified_at "$verified_at" --argjson checks_evidence "$checks_evidence" '
    {status:"passed",repository:$repo,base_branch:$base,task_branch:$branch,pr_url:$pr,verified_head_sha:$head,
     implementation_report:$report,dispatch_artifact:$dispatch,report_exists_at_exact_head:true,report_in_pr_diff:true,
     checks:$checks,verified_at:$verified_at} + (if $checks_evidence == null then {} else {checks_evidence:$checks_evidence} end)')"
  canonical_gate="$(jq -cn --arg gate "$(jq -r '.governance_gate.gate_id' <<<"$gate_task")" --arg gate_task "$gate_task_id" --arg consumer "$blocked_task_id" --arg decision "$decision_sha" --arg artifact "$decision_artifact" --arg artifact_digest "$decision_digest" --arg policy_digest "$policy_digest" --arg protected_digest "$protected_digest" --arg review_id "$review_id" --arg selected "$(jq -r '.selected_option' <<<"$decision")" --argjson policy "$policy" --argjson required "$(jq -c '.required_decisions' <<<"$decision")" --argjson option_c "$(jq -c '.option_c_proof' <<<"$decision")" '
    {schema_version:1,gate_id:$gate,task_id:$gate_task,consumer_task_id:$consumer,status:"approved",selected_option:$selected,
     decision_sha:$decision,decision_artifact:$artifact,decision_artifact_sha256:$artifact_digest,
     policy:$policy,policy_version:$policy.policy_version,policy_sha256:$policy_digest,protected_paths_sha256:$protected_digest,
     required_decisions:$required,option_c_proof:$option_c,
     architecture_review:{verdict:"PASS",reviewed_sha:$decision,review_id:($review_id|tonumber)},approval_state:"approved",
     freshness:{state:"fresh",verified_against_planning_sha:$decision,protected_paths_sha256:$protected_digest},u3b_dispatch_authorized:true}')"
  canonical_digest="$(canonical_json_sha256 <<<"$canonical_gate")"
  evidence="$(jq -cn --arg pr "$pr_url" --arg merge "$merge_sha" --arg report "$decision_artifact" --arg checks "$checks" --arg head "$decision_sha" --arg recovered_at "$verified_at" --arg gate_digest "$canonical_digest" --argjson verification "$verification" --argjson checks_evidence "$checks_evidence" '
    {pr_url:$pr,merge_sha:$merge,implementation_report:$report,verification:$verification,
     validation:({checks:$checks,head_sha:$head} + (if $checks_evidence == null then {} else {checks_evidence:$checks_evidence} end)),
     recovered:true,recovered_at:$recovered_at,adoption_provenance:"exact_head_governance_review",governance_gate_digest:$gate_digest}')"
  validate_task_completion_evidence "$gate_task_id" "$evidence"
  jq -Scn --argjson verification "$verification" --argjson evidence "$evidence" --argjson canonical_gate "$canonical_gate" --arg artifact "$artifact_relative" --arg source_digest "$source_digest" --arg policy_digest "$policy_digest" --arg decision_digest "$decision_digest" '{verification:$verification,evidence:$evidence,canonical_gate:$canonical_gate,artifact:$artifact,source_digest:$source_digest,policy_digest:$policy_digest,decision_digest:$decision_digest}'
}

prepare_governance_candidate() {
  local bundle="$1" gate_task_id="$2" blocked_task_id="$3" candidate_root candidate_manifest candidate_gate relative
  mkdir -p "$CONTROL_ROOT"
  candidate_root="$(mktemp -d "$CONTROL_ROOT/governance-candidate.XXXXXX")"; candidate_manifest="$candidate_root/PIPELINE_MANIFEST.json"
  relative="$(jq -r '.artifact' <<<"$bundle")"; candidate_gate="$candidate_root/$relative"
  mkdir -p "$(dirname "$candidate_gate")"; printf '%s\n' "$(jq -Sc '.canonical_gate' <<<"$bundle")" >"$candidate_gate"
  jq --arg gate "$gate_task_id" --arg blocked "$blocked_task_id" --argjson verification "$(jq -c '.verification' <<<"$bundle")" --argjson evidence "$(jq -c '.evidence' <<<"$bundle")" '
    .waves |= map(.tasks |= map(
      if .id == $gate and .status == "pending" then .status="completed" | .verification=$verification | .evidence=$evidence
      elif .id == $blocked and .status == "blocked" then .status="pending"
      else . end))
  ' "$MANIFEST_PATH" >"$candidate_manifest"
  if [[ "${PIPELINE_INJECT_CANDIDATE_INVALID:-0}" == 1 ]]; then
    jq '.schema_version = 999' "$candidate_manifest" >"$candidate_manifest.invalid"
    mv "$candidate_manifest.invalid" "$candidate_manifest"
  fi
  PIPELINE_VALIDATION_ROOT="$candidate_root" "$VALIDATOR" --manifest "$candidate_manifest" >/dev/null || { rm -rf "$candidate_root"; die "candidate Manifest/gate validation failed"; }
  GOVERNANCE_CANDIDATE_ROOT="$candidate_root"; GOVERNANCE_CANDIDATE_MANIFEST="$candidate_manifest"; GOVERNANCE_CANDIDATE_GATE="$candidate_gate"
}

# shellcheck disable=SC2329
transaction_adopt_governance_gate() {
  local gate_task_id="$GOVERNANCE_ADOPT_GATE_TASK" blocked_task_id="$GOVERNANCE_ADOPT_BLOCKED_TASK" source="$GOVERNANCE_ADOPT_SOURCE" pr_url="$GOVERNANCE_ADOPT_PR"
  local gate_status blocked_status canonical_source source_digest bundle bundle_digest target existing_digest
  canonical_source="$(external_source_path "$source" || true)"; [[ "$canonical_source" == "$source" ]] || die "governance gate source must remain outside the repository"
  source_digest="$(shasum -a 256 "$canonical_source" | awk '{print $1}')"; [[ "$source_digest" == "$GOVERNANCE_ADOPT_SOURCE_DIGEST" ]] || die "governance gate source changed before locked adoption"
  gate_status="$(jq -r --arg id "$gate_task_id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")"
  blocked_status="$(jq -r --arg id "$blocked_task_id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")"
  target="$(artifact_path "$(jq -r --arg id "$gate_task_id" '.waves[] | .tasks[] | select(.id == $id) | .governance_gate.artifact' "$MANIFEST_PATH")")"
  if [[ "$gate_status" == completed && "$blocked_status" == pending && -f "$target" ]]; then
    existing_digest="$(shasum -a 256 "$target" | awk '{print $1}')"
    [[ "$existing_digest" == "$GOVERNANCE_ADOPT_GATE_DIGEST" ]] || die "different governance gate adoption already exists"
    validate_governance_dispatch_gate "$blocked_task_id" pending
    STATE_TRANSACTION_NOOP=1
    return
  fi
  [[ "$gate_status" == pending && "$blocked_status" == blocked ]] || die "governance adoption state changed before locked transition"
  bundle="$(build_governance_adoption_bundle "$gate_task_id" "$blocked_task_id" "$canonical_source" "$pr_url")"
  [[ "$(jq -r '.source_digest' <<<"$bundle")" == "$source_digest" ]] || die "locked governance evidence differs from preflight source"
  bundle_digest="$(canonical_json_sha256 <<<"$bundle")"; [[ "$bundle_digest" == "$GOVERNANCE_ADOPT_BUNDLE_DIGEST" ]] || die "locked adoption evidence drifted after preflight"
  prepare_governance_candidate "$bundle" "$gate_task_id" "$blocked_task_id"
  transaction_own_path "$MANIFEST_PATH"; transaction_own_path "$target"
  atomic_replace "$GOVERNANCE_CANDIDATE_GATE" "$target"
  [[ "${PIPELINE_INJECT_POST_WRITE_VALIDATION_FAILURE:-0}" != 1 ]] || die "injected post-write validation failure"
  atomic_replace "$GOVERNANCE_CANDIDATE_MANIFEST" "$MANIFEST_PATH"
  rm -rf "$GOVERNANCE_CANDIDATE_ROOT"
  transaction_stage_path "$target"
}

adopt_governance_gate() {
  local gate_task_id="$1" blocked_task_id="$2" source="$3" pr_url="$4" base canonical_source bundle bundle_digest
  base="$(jq -r '.base_branch' "$MANIFEST_PATH")"; synchronization_gate "$base"
  canonical_source="$(external_source_path "$source" || true)"; [[ -n "$canonical_source" ]] || die "governance gate source must be a regular file outside the repository"
  GOVERNANCE_ADOPT_VERIFIED_AT="$(date -u +%FT%TZ)"; bundle="$(build_governance_adoption_bundle "$gate_task_id" "$blocked_task_id" "$canonical_source" "$pr_url")"
  prepare_governance_candidate "$bundle" "$gate_task_id" "$blocked_task_id"; rm -rf "$GOVERNANCE_CANDIDATE_ROOT"
  bundle_digest="$(canonical_json_sha256 <<<"$bundle")"
  if [[ "${PIPELINE_INJECT_LOCKED_SOURCE_DRIFT:-0}" == 1 ]]; then
    jq '.review_id += 1' "$canonical_source" >"$canonical_source.drift" && mv "$canonical_source.drift" "$canonical_source"
  fi
  GOVERNANCE_ADOPT_GATE_TASK="$gate_task_id" GOVERNANCE_ADOPT_BLOCKED_TASK="$blocked_task_id" GOVERNANCE_ADOPT_SOURCE="$canonical_source" GOVERNANCE_ADOPT_PR="$pr_url" GOVERNANCE_ADOPT_SOURCE_DIGEST="$(jq -r '.source_digest' <<<"$bundle")" GOVERNANCE_ADOPT_GATE_DIGEST="$(jq -r '.evidence.governance_gate_digest' <<<"$bundle")" GOVERNANCE_ADOPT_BUNDLE_DIGEST="$bundle_digest" GOVERNANCE_ADOPT_VERIFIED_AT="$GOVERNANCE_ADOPT_VERIFIED_AT" \
    state_transaction "governance-adoption:$gate_task_id" "chore(pipeline): adopt governance gate $gate_task_id" transaction_adopt_governance_gate
}

validate_task_pr_metadata() {
  local metadata="$1" pr="$2" branch="$3" expected_state="${4:-}" expected_head="${5:-}" expected_repo base
  expected_repo="$(expected_repository)"; base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  jq -e --arg repo "$expected_repo" --arg base "$base" --arg branch "$branch" --arg pr "$pr" --arg state "$expected_state" --arg head "$expected_head" '
    .repository.nameWithOwner == $repo and .headRepository.nameWithOwner == $repo and
    .baseRefName == $base and .headRefName == $branch and .url == $pr and
    (.headRefOid | test("^[0-9a-f]{40}$")) and
    ($state == "" or .state == $state) and ($head == "" or .headRefOid == $head)
  ' <<<"$metadata" >/dev/null
}

ensure_exact_report_at_head() {
  local repo="$1" head_sha="$2" report="$3" pr_url="$4" pr_number fetched_head
  safe_relative_path "$report" || die "implementation report path is unsafe"
  if ! git -C "$repo" cat-file -e "$head_sha:$report" 2>/dev/null; then
    [[ "$pr_url" =~ /pull/([0-9]+)$ ]] || die "cannot identify PR head ref for report validation"
    pr_number="${BASH_REMATCH[1]}"
    git -C "$repo" fetch origin "refs/pull/$pr_number/head" >/dev/null 2>&1 || die "cannot fetch exact PR head ref for report validation"
    fetched_head="$(git -C "$repo" rev-parse FETCH_HEAD)"
    [[ "$fetched_head" == "$head_sha" ]] || die "fetched PR head differs from persisted verified head"
  fi
  git -C "$repo" cat-file -e "$head_sha:$report" || die "implementation report is absent from exact verified PR head"
}

validate_task_verification() {
  local id="$1" artifact="$2" verification="$3" repo base branch pr report head dispatch_relative policy
  repo="$(expected_repository)"; base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  policy="$(task_verification_policy "$id")"
  branch="$(jq -r '.task_branch // empty' "$artifact")"; pr="$(jq -r '.pr_url // empty' "$artifact")"; report="$(jq -r '.implementation_report // empty' "$artifact")"
  head="$(jq -r '.verified_head_sha // empty' <<<"$verification")"; dispatch_relative="$(task_dispatch_relative "$id")"
  safe_relative_path "$report" || die "task dispatch report path is unsafe"
  jq -e --arg id "$id" --arg branch "$branch" --arg base "$base" --arg pr "$pr" --arg report "$report" '
    .task_id == $id and .task_branch == $branch and .base_branch == $base and
    .pr_url == $pr and .implementation_report == $report
  ' "$artifact" >/dev/null || die "task dispatch artifact identity is inconsistent"
  jq -e --arg id "$id" --arg policy "$policy" --arg repo "$repo" --arg base "$base" --arg branch "$branch" --arg pr "$pr" --arg report "$report" --arg dispatch "$dispatch_relative" --arg head "$head" '
    . as $verification |
    .status == "passed" and .repository == $repo and .base_branch == $base and
    .task_branch == $branch and .pr_url == $pr and .implementation_report == $report and
    .dispatch_artifact == $dispatch and (.checks | IN("passed", "not_required_paths_ignored")) and
    .report_exists_at_exact_head == true and .report_in_pr_diff == true and
    (.verified_head_sha | test("^[0-9a-f]{40}$")) and
    (.verified_at | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")) and
    (if .checks == "passed" then
     ((.checks_evidence? // null) == null)
     else
      $policy == "paths_ignored_zero_checks_allowed" and
      (.checks_evidence | type == "object" and
       .decision == "not_required_paths_ignored" and .task_id == $id and
       .task_verification_policy == $policy and .repository == $repo and
       .pr_url == $pr and .base_branch == $base and
       (.base_sha | test("^[0-9a-f]{40}$")) and .head_sha == $head and
       .workflow_path == ".github/workflows/ci.yml" and
       (.workflow_blob_sha | test("^[0-9a-f]{40}$")) and
       (.changed_files | type == "array" and length > 0 and length == (unique | length)) and
       .github_check_runs == 0 and .ignored_paths_verified == true and
       .verified_at == $verification.verified_at)
     end)
  ' <<<"$verification" >/dev/null || die "task verification metadata is invalid"
  [[ "$head" =~ ^[0-9a-f]{40}$ ]]
}

validate_persisted_task_verification() {
  local id="$1" dispatch_relative="$2" expected="$3" artifact manifest_verification artifact_verification
  [[ "$dispatch_relative" == "$(task_dispatch_relative "$id")" ]] || die "task completion references a non-canonical dispatch artifact"
  artifact="$(artifact_path "$dispatch_relative")"; [[ -f "$artifact" && ! -L "$artifact" ]] || die "canonical task dispatch artifact is missing"
  manifest_verification="$(jq -c --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .verification // null' "$MANIFEST_PATH")"
  artifact_verification="$(jq -c '.verification // null' "$artifact")"
  validate_task_verification "$id" "$artifact" "$expected"
  [[ "$(jq -Sc . <<<"$manifest_verification")" == "$(jq -Sc . <<<"$expected")" ]] || die "Manifest task verification differs from completion evidence"
  [[ "$(jq -Sc . <<<"$artifact_verification")" == "$(jq -Sc . <<<"$expected")" ]] || die "dispatch artifact verification differs from completion evidence"
}

assert_merged_task_contract() {
  local id="$1" evidence="$2" verification metadata pr branch report verified_head merge_sha
  verification="$(jq -c '.verification' <<<"$evidence")"; pr="$(jq -r '.pr_url' <<<"$evidence")"
  branch="$(jq -r '.task_branch' <<<"$verification")"; report="$(jq -r '.implementation_report' <<<"$verification")"
  verified_head="$(jq -r '.verified_head_sha' <<<"$verification")"; merge_sha="$(jq -r '.merge_sha' <<<"$evidence")"
  metadata="$(github_pr_metadata "$pr")"
  validate_task_pr_metadata "$metadata" "$pr" "$branch" MERGED "$verified_head" || die "merged task PR identity is ambiguous: $id"
  [[ "$(jq -r '.mergeCommit.oid // empty' <<<"$metadata")" == "$merge_sha" && "$merge_sha" =~ ^[0-9a-f]{40}$ ]] || die "merged task PR merge SHA is inconsistent"
  assert_task_check_contract "$id" "$verification"
  gh pr diff "$pr" --name-only | grep -Fqx -e "$report" || die "implementation report is no longer in the exact PR diff"
  ensure_exact_report_at_head "$REPO_DIR" "$verified_head" "$report" "$pr"
  git -C "$REPO_DIR" merge-base --is-ancestor "$merge_sha" HEAD || die "task merge SHA is not on the authorized planning history"
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
  local requested_sha="$1" request_relative manifest_relative repo_root manifest_root changed changed_count
  [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]] && return
  [[ "$requested_sha" =~ ^[0-9a-f]{40}$ ]] || die "final audit requested SHA is invalid"
  git -C "$REPO_DIR" merge-base --is-ancestor "$requested_sha" HEAD || die "final audit requested SHA is not an ancestor of planning HEAD"
  request_relative="$(jq -r '.final_audit.request' "$MANIFEST_PATH")"
  repo_root="$(cd "$REPO_DIR" && pwd -P)"; manifest_root="$(cd "$(dirname "$MANIFEST_PATH")" && pwd -P)"
  manifest_relative="${manifest_root#"$repo_root"/}/$(basename "$MANIFEST_PATH")"
  changed_count="$(git -C "$REPO_DIR" rev-list --count "$requested_sha..HEAD")"
  [[ "$changed_count" == 1 && "$(git -C "$REPO_DIR" rev-parse HEAD^)" == "$requested_sha" ]] ||
    die "final audit repository state changed after the canonical request commit"
  while IFS= read -r changed; do
    [[ -z "$changed" ]] && continue
    case "$changed" in
      "$manifest_relative"|"$request_relative") ;;
      *) die "final audit is stale: unauthorized product/code change after reviewed SHA ($changed)" ;;
    esac
  done < <(git -C "$REPO_DIR" diff --name-only "$requested_sha...HEAD")
  [[ "$(git -C "$REPO_DIR" diff --name-only "$requested_sha...HEAD" | LC_ALL=C sort)" == "$(printf '%s\n' "$manifest_relative" "$request_relative" | LC_ALL=C sort)" ]] ||
    die "final audit request commit does not contain exactly the canonical Manifest and request artifact"
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
      baseRefOid: .base.sha,
      headRefName: .head.ref,
      headRefOid: .head.sha,
      changedFiles: .changed_files,
      mergeCommit: {oid: (.merge_commit_sha // "")},
      url: .html_url,
      body: (.body // "")
    }
  ' <<<"$payload"
}

# This frozen policy must remain synchronized with pull_request.paths-ignore in
# .github/workflows/ci.yml. A policy change requires an explicit contract update.
expected_ci_paths_ignore_json() {
  printf '%s\n' '["docs/**","audit/**","**/*.md","platform/status.md"]'
}

task_verification_policy() {
  local id="$1" count policy
  [[ "$id" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$ ]] || die "task ID is invalid for verification policy lookup: $id"
  count="$(jq -r --arg id "$id" '[.waves[].tasks[] | select(.id == $id)] | length' "$MANIFEST_PATH")"
  [[ "$count" == "1" ]] || die "task verification policy lookup must identify exactly one Manifest task: $id"
  policy="$(jq -r --arg id "$id" '.waves[].tasks[] | select(.id == $id) | .verification_policy // empty' "$MANIFEST_PATH")"
  case "$policy" in
    actual_checks_required|paths_ignored_zero_checks_allowed) printf '%s\n' "$policy" ;;
    "") die "task verification policy is missing: $id" ;;
    *) die "task verification policy is unknown for $id: $policy" ;;
  esac
}

ci_ignored_path() {
  local changed_file="$1"
  safe_relative_path "$changed_file" || return 1
  case "$changed_file" in
    src/*|tests/*|scripts/*|prisma/*|.github/workflows/*) return 1 ;;
  esac
  case "$changed_file" in
    docs/*|audit/*|platform/status.md|*.md) return 0 ;;
  esac
  return 1
}

ci_paths_ignore_at_base() {
  local base_sha="$1" workflow_path=".github/workflows/ci.yml" workflow_content policy_lines policy_json
  [[ "$base_sha" =~ ^[0-9a-f]{40}$ ]] || return 1
  git -C "$REPO_DIR" cat-file -e "$base_sha:$workflow_path" 2>/dev/null || return 1
  workflow_content="$(git -C "$REPO_DIR" show "$base_sha:$workflow_path")" || return 1
  policy_lines="$(awk '
    $0 == "  pull_request:" { in_pr=1; next }
    in_pr && /^  [^ ]/ { exit }
    in_pr && $0 == "    paths-ignore:" { in_paths=1; found=1; next }
    in_paths && /^      - / {
      value=substr($0,9)
      first=substr(value,1,1); last=substr(value,length(value),1)
      if ((first == "\047" && last == "\047") || (first == "\"" && last == "\"")) {
        value=substr(value,2,length(value)-2)
      }
      print value
      next
    }
    in_paths { exit }
    END { if (!found) exit 2 }
  ' <<<"$workflow_content")" || return 1
  policy_json="$(printf '%s\n' "$policy_lines" | jq -Rsc 'split("\n") | map(select(length > 0))')" || return 1
  jq -e --argjson expected "$(expected_ci_paths_ignore_json)" '. == $expected' <<<"$policy_json" >/dev/null || return 1
  printf '%s\n' "$policy_json"
}

github_pr_files_payload() {
  local pr_url="$1" owner repo number raw payload
  [[ "$pr_url" =~ ^https://github\.com/([^/]+)/([^/]+)/pull/([0-9]+)$ ]] || return 1
  owner="${BASH_REMATCH[1]}"; repo="${BASH_REMATCH[2]}"; number="${BASH_REMATCH[3]}"
  raw="$(gh api --paginate "repos/$owner/$repo/pulls/$number/files?per_page=100")" || return 1
  payload="$(jq -sc 'add // []' <<<"$raw")" || return 1
  jq -e '
    type == "array" and
    all(.[];
      (.filename | type == "string" and length > 0 and (test("[\\x00-\\x1f\\x7f]") | not)) and
      (.status | IN("added", "modified", "removed"))
    )
  ' <<<"$payload" >/dev/null || return 1
  printf '%s\n' "$payload"
}

github_check_runs_payload() {
  local pr_url="$1" head_sha="$2" owner repo number raw payload expected_count actual_count
  [[ "$pr_url" =~ ^https://github\.com/([^/]+)/([^/]+)/pull/([0-9]+)$ ]] || return 1
  owner="${BASH_REMATCH[1]}"; repo="${BASH_REMATCH[2]}"; number="${BASH_REMATCH[3]}"
  [[ "$head_sha" =~ ^[0-9a-f]{40}$ ]] || return 1
  : "$number"
  raw="$(gh api --paginate -H 'Accept: application/vnd.github+json' "repos/$owner/$repo/commits/$head_sha/check-runs?per_page=100")" || return 1
  jq -se 'length > 0 and all(.[]; (.total_count | type == "number") and (.check_runs | type == "array"))' <<<"$raw" >/dev/null || return 1
  expected_count="$(jq -sr '.[0].total_count' <<<"$raw")" || return 1
  payload="$(jq -sc '[.[].check_runs[]]' <<<"$raw")" || return 1
  actual_count="$(jq -r 'length' <<<"$payload")"
  [[ "$expected_count" == "$actual_count" ]] || return 1
  printf '%s\n' "$payload"
}

evaluate_pr_check_requirement() {
  local task_id="$1" pr_url="$2" expected_head="$3" expected_base_sha="$4" task_policy expected_repo expected_base metadata refreshed files_payload changed_files check_runs policy_json workflow_blob_sha verified_at changed_file
  task_policy="$(task_verification_policy "$task_id")"
  [[ "$task_policy" == "paths_ignored_zero_checks_allowed" ]] || return 1
  [[ "$expected_head" =~ ^[0-9a-f]{40}$ && "$expected_base_sha" =~ ^[0-9a-f]{40}$ ]] || return 1
  expected_repo="$(expected_repository "$REPO_DIR")"; expected_base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  metadata="$(github_pr_metadata "$pr_url")" || return 1
  jq -e --arg repo "$expected_repo" --arg base "$expected_base" --arg pr "$pr_url" --arg head "$expected_head" --arg base_sha "$expected_base_sha" '
    .repository.nameWithOwner == $repo and .headRepository.nameWithOwner == $repo and
    .baseRefName == $base and .baseRefOid == $base_sha and .headRefOid == $head and .url == $pr and
    (.state == "OPEN" or .state == "MERGED") and (.changedFiles | type == "number" and . > 0)
  ' <<<"$metadata" >/dev/null || return 1

  files_payload="$(github_pr_files_payload "$pr_url")" || return 1
  [[ "$(jq -r 'length' <<<"$files_payload")" == "$(jq -r '.changedFiles' <<<"$metadata")" ]] || return 1
  changed_files="$(jq -c '[.[].filename]' <<<"$files_payload")"
  jq -e 'length > 0 and length == (unique | length)' <<<"$changed_files" >/dev/null || return 1
  while IFS= read -r changed_file; do
    ci_ignored_path "$changed_file" || return 1
  done < <(jq -r '.[]' <<<"$changed_files")

  policy_json="$(ci_paths_ignore_at_base "$expected_base_sha")" || return 1
  jq -e --argjson expected "$(expected_ci_paths_ignore_json)" '. == $expected' <<<"$policy_json" >/dev/null || return 1
  workflow_blob_sha="$(git -C "$REPO_DIR" rev-parse "$expected_base_sha:.github/workflows/ci.yml")" || return 1
  [[ "$workflow_blob_sha" =~ ^[0-9a-f]{40}$ ]] || return 1

  check_runs="$(github_check_runs_payload "$pr_url" "$expected_head")" || return 1
  [[ "$(jq -r 'length' <<<"$check_runs")" == 0 ]] || return 1
  refreshed="$(github_pr_metadata "$pr_url")" || return 1
  [[ "$(jq -Sc '{state,repository,headRepository,baseRefName,baseRefOid,headRefName,headRefOid,changedFiles,url}' <<<"$metadata")" == "$(jq -Sc '{state,repository,headRepository,baseRefName,baseRefOid,headRefName,headRefOid,changedFiles,url}' <<<"$refreshed")" ]] || return 1
  check_runs="$(github_check_runs_payload "$pr_url" "$expected_head")" || return 1
  [[ "$(jq -r 'length' <<<"$check_runs")" == 0 ]] || return 1

  verified_at="$(date -u +%FT%TZ)"
  jq -n --arg decision "not_required_paths_ignored" --arg task_id "$task_id" --arg task_policy "$task_policy" --arg repo "$expected_repo" --arg pr "$pr_url" \
    --arg base "$expected_base" --arg base_sha "$expected_base_sha" --arg head "$expected_head" \
    --arg workflow ".github/workflows/ci.yml" --arg workflow_blob "$workflow_blob_sha" \
    --argjson changed_files "$changed_files" --arg verified_at "$verified_at" '
    {
      decision:$decision, task_id:$task_id, task_verification_policy:$task_policy,
      repository:$repo, pr_url:$pr, base_branch:$base,
      base_sha:$base_sha, head_sha:$head, workflow_path:$workflow,
      workflow_blob_sha:$workflow_blob, changed_files:$changed_files,
      github_check_runs:0, ignored_paths_verified:true, verified_at:$verified_at
    }
  '
}

assert_task_check_contract() {
  local task_id="$1" verification="$2" task_policy decision pr head base_sha expected recomputed
  task_policy="$(task_verification_policy "$task_id")"
  decision="$(jq -r '.checks // empty' <<<"$verification")"; pr="$(jq -r '.pr_url // empty' <<<"$verification")"
  case "$decision" in
    passed)
      [[ "$(jq -r '.checks_evidence // null' <<<"$verification")" == null ]] || die "passed task checks cannot carry exemption evidence"
      gh pr checks "$pr" >/dev/null || die "task checks are not all passing"
      ;;
    not_required_paths_ignored)
      [[ "$task_policy" == "paths_ignored_zero_checks_allowed" ]] || die "task policy forbids paths-ignore zero-check evidence: $task_id"
      expected="$(jq -c '.checks_evidence // null' <<<"$verification")"; [[ "$expected" != null ]] || die "docs-only task verification lacks structured checks evidence"
      jq -e --arg task_id "$task_id" --arg policy "$task_policy" '.task_id == $task_id and .task_verification_policy == $policy' <<<"$expected" >/dev/null || die "docs-only checks evidence is bound to a different task or policy"
      head="$(jq -r '.verified_head_sha' <<<"$verification")"; base_sha="$(jq -r '.base_sha' <<<"$expected")"
      recomputed="$(evaluate_pr_check_requirement "$task_id" "$pr" "$head" "$base_sha")" || die "docs-only zero-check evidence no longer satisfies the exact task and PR policy"
      [[ "$(jq -Sc 'del(.verified_at)' <<<"$expected")" == "$(jq -Sc 'del(.verified_at)' <<<"$recomputed")" ]] || die "docs-only zero-check evidence changed"
      ;;
    *) die "invalid task checks decision: $decision" ;;
  esac
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
      # Governance adoption tasks are completed only by the policy-bound
      # --adopt-governance-gate path; they are never Codex product dispatches.
      if [[ "$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | has("governance_gate")' "$MANIFEST_PATH")" == true ]]; then
        continue
      fi
      deps_ok=1
      while IFS= read -r dep; do dependency_satisfied "$dep" || deps_ok=0; done < <(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .depends_on[]?' "$MANIFEST_PATH")
      if (( deps_ok )); then
        validate_governance_dispatch_gate "$task" pending
        jq -n --arg wave "$wave" --arg task "$task" '{action:"task", wave:$wave, task:$task}'
        return
      fi
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
  local task="$1" status dispatch_relative artifact pr branch report base state_repo metadata verification merge_sha evidence task_dir rc
  status="$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .status // empty' "$MANIFEST_PATH")"
  if [[ "$status" == completed ]]; then log "clean stop: task already recovered: $task"; return; fi
  [[ "$status" == running ]] || die "task is not in a recoverable running state: $task"
  dispatch_relative="$(task_dispatch_relative "$task")"; artifact="$(artifact_path "$dispatch_relative")"
  [[ -f "$artifact" && ! -L "$artifact" ]] || die "running task has no canonical dispatch artifact; human recovery required: $task"
  pr="$(jq -r '.pr_url // empty' "$artifact")"; branch="$(jq -r '.task_branch // empty' "$artifact")"; report="$(jq -r '.implementation_report // empty' "$artifact")"; base="$(jq -r '.base_branch // empty' "$artifact")"
  [[ "$pr" =~ ^https://github\.com/[^/]+/[^/]+/pull/[0-9]+$ && -n "$branch" ]] || die "dispatch artifact PR/branch identity is ambiguous; human recovery required"
  safe_relative_path "$report" || die "dispatch artifact report path is unsafe; human recovery required"
  [[ "$base" == "$(jq -r '.base_branch' "$MANIFEST_PATH")" && "$(jq -r '.task_id // empty' "$artifact")" == "$task" ]] || die "dispatch artifact task/base identity is ambiguous; human recovery required"
  state_repo="$REPO_DIR"; metadata="$(github_pr_metadata "$pr")"
  validate_task_pr_metadata "$metadata" "$pr" "$branch" || die "task PR repository/base/head identity is ambiguous; human recovery required"
  case "$(jq -r '.state' <<<"$metadata")" in
    MERGED)
      verification="$(jq -c '.verification // null' "$artifact")"
      [[ "$verification" != null ]] || die "merged task PR has no persisted pre-merge verification; human recovery required"
      validate_persisted_task_verification "$task" "$dispatch_relative" "$verification"
      validate_task_pr_metadata "$metadata" "$pr" "$branch" MERGED "$(jq -r '.verified_head_sha' <<<"$verification")" || die "merged task PR differs from persisted verification; human recovery required"
      [[ "$(jq -r '.implementation_report' <<<"$verification")" == "$report" ]] || die "merged task report differs from persisted verification; human recovery required"
      assert_task_check_contract "$task" "$verification"
      gh pr diff "$pr" --name-only | grep -Fqx -e "$report" || die "merged task report is absent from the exact PR diff; human recovery required"
      ensure_exact_report_at_head "$state_repo" "$(jq -r '.verified_head_sha' <<<"$verification")" "$report" "$pr"
      merge_sha="$(jq -r '.mergeCommit.oid // empty' <<<"$metadata")"; [[ "$merge_sha" =~ ^[0-9a-f]{40}$ ]] || die "merged task has no valid merge SHA; human recovery required"
      reconcile_planning_state "$base" "$state_repo"
      git -C "$state_repo" merge-base --is-ancestor "$merge_sha" HEAD || die "merged task SHA is not on authorized planning history; human recovery required"
      evidence="$(jq -n --arg pr "$pr" --arg merge_sha "$merge_sha" --arg report "$report" --arg head "$(jq -r '.verified_head_sha' <<<"$verification")" --argjson verification "$verification" --arg recovered_at "$(date -u +%FT%TZ)" '{pr_url:$pr,merge_sha:$merge_sha,implementation_report:$report,verification:$verification,validation:({checks:$verification.checks,head_sha:$head} + (if $verification.checks == "not_required_paths_ignored" then {checks_evidence:$verification.checks_evidence} else {} end)),recovered:true,recovered_at:$recovered_at}')"
      state_transaction "task-recovery:$task" "chore(pipeline): recover merged OS 3.8 task $task" transaction_complete_task "$task" "$evidence" "$dispatch_relative"
      ;;
    OPEN)
      git -C "$state_repo" fetch origin "$branch" || die "open task PR branch is unavailable; human recovery required"
      [[ "$(git -C "$state_repo" rev-parse "origin/$branch")" == "$(jq -r '.headRefOid' <<<"$metadata")" ]] || die "open task PR remote head is ambiguous; human recovery required"
      task_dir="$(mktemp -d "${TMPDIR:-/tmp}/os38-task-recovery.XXXXXX")"
      git -C "$state_repo" worktree add --detach "$task_dir" "origin/$branch" >/dev/null || die "cannot restore exact task worktree for recovery"
      set +e
      (REPO_DIR="$task_dir" MANIFEST_PATH="$task_dir/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" STATE_REPO_DIR="$state_repo" TASK_BRANCH="$branch" IMPLEMENTATION_REPORT="$report" PIPELINE_ALLOW_DETACHED_TASK_WORKTREE=1 merge_task_pr "$task" "$pr")
      rc=$?
      set -e
      git -C "$state_repo" worktree remove --force "$task_dir" >/dev/null 2>&1 || true
      (( rc == 0 )) || die "open task PR recovery failed closed; task remains running for human recovery"
      ;;
    *) die "task PR state is not OPEN or MERGED; human recovery required: $pr" ;;
  esac
}

# shellcheck disable=SC2329
transaction_reserve_remediation() {
  local checkpoint="$REMEDIATION_CHECKPOINT" wave attempts max reviewed_sha run_id branch artifact artifact_relative result_relative result
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
  artifact_relative="docs/nextshift-os-3/os-3-8/runs/${run_id}.json"
  artifact="$(artifact_path "$artifact_relative")"; [[ ! -e "$artifact" ]] || die "remediation run artifact already exists"
  mkdir -p "$(dirname "$artifact")"
  jq -n --arg run "$run_id" --arg checkpoint "$checkpoint" --arg sha "$reviewed_sha" --arg branch "$branch" --argjson attempt "$((attempts + 1))" --arg started "$(date -u +%FT%TZ)" '{status:"running",run_id:$run,checkpoint:$checkpoint,reviewed_product_sha:$sha,attempt:$attempt,branch:$branch,started_at:$started}' >"$artifact"
  jq --arg wave "$wave" --arg run "$run_id" --arg branch "$branch" --arg artifact "$artifact_relative" --argjson attempt "$((attempts + 1))" '.waves |= map(if .id == $wave then .checkpoint.active_remediation={status:"running",run_id:$run,attempt:$attempt,branch:$branch,artifact:$artifact} else . end)' "$MANIFEST_PATH" | write_manifest
  REMEDIATION_RUN_ID="$run_id"; REMEDIATION_BRANCH="$branch"; REMEDIATION_ARTIFACT="$artifact"
  transaction_stage_path "$artifact"
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
  gh pr diff "$REMEDIATION_PR" --name-only | grep -Fqx -e "$REMEDIATION_REPORT" || die "remediation implementation report is absent from the exact PR diff"
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
  transaction_stage_path "$artifact"
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
  transaction_stage_path "$artifact"
}

# shellcheck disable=SC2329
transaction_mark_remediation_needs_human() {
  local wave active artifact artifact_relative ended
  wave="$(wave_for_id "$REMEDIATION_CHECKPOINT")"; active="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.run_id // empty' "$MANIFEST_PATH")"
  [[ "$active" == "$REMEDIATION_RUN_ID" ]] || die "active remediation changed before needs_human transition"
  artifact_relative="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .checkpoint.active_remediation.artifact' "$MANIFEST_PATH")"
  safe_relative_path "$artifact_relative" || die "remediation run artifact path is invalid"
  artifact="$(artifact_path "$artifact_relative")"; [[ -f "$artifact" ]] || die "remediation run artifact missing"
  ended="$(date -u +%FT%TZ)"
  jq --arg reason "$REMEDIATION_REASON" --arg ended "$ended" '.status="needs_human" | .reason=$reason | .ended_at=$ended' "$artifact" >"${artifact}.tmp" && mv "${artifact}.tmp" "$artifact"
  jq --arg wave "$wave" --arg run "$REMEDIATION_RUN_ID" --arg artifact "$artifact_relative" --arg reason "$REMEDIATION_REASON" '.waves |= map(if .id == $wave then .checkpoint.status="needs_human" | .checkpoint.remediation_block={run_id:$run,artifact:$artifact,reason:$reason} | .checkpoint.active_remediation=null else . end)' "$MANIFEST_PATH" | write_manifest
  transaction_stage_path "$artifact"
}

# shellcheck disable=SC2329
transaction_complete_remediation() {
  local checkpoint="$REMEDIATION_CHECKPOINT" wave active branch pr report attempts max artifact verification expected_repo base pr_json merge_sha old_sha
  local request_relative result_relative request result request_archive_relative result_archive_relative request_archive result_archive end_sha completed
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
  request_archive_relative="docs/nextshift-os-3/os-3-8/runs/${REMEDIATION_RUN_ID}-source-review-request.md"
  result_archive_relative="docs/nextshift-os-3/os-3-8/runs/${REMEDIATION_RUN_ID}-source-review-result.md"
  request_archive="$(artifact_path "$request_archive_relative")"; result_archive="$(artifact_path "$result_archive_relative")"
  [[ ! -e "$request_archive" && ! -e "$result_archive" ]] || die "remediation review archive already exists"
  mv "$request" "$request_archive"; mv "$result" "$result_archive"
  completed="$(date -u +%FT%TZ)"
  jq --argjson evidence "$REMEDIATION_EVIDENCE" --arg request_archive "$request_archive_relative" --arg result_archive "$result_archive_relative" --arg completed "$completed" '.status="completed" | .completion=$evidence | .source_review_request=$request_archive | .source_review_result=$result_archive | .completed_at=$completed' "$artifact" >"${artifact}.tmp" && mv "${artifact}.tmp" "$artifact"
  end_sha="$(git -C "$REPO_DIR" rev-parse HEAD)"; render_checkpoint_request "$wave" "$checkpoint" "$end_sha" "$request" "$REMEDIATION_RUN_ID"
  jq --arg wave "$wave" --arg sha "$end_sha" '.waves |= map(if .id == $wave then .checkpoint.status="awaiting_review" | .checkpoint.remediation_attempts=((.checkpoint.remediation_attempts // 0)+1) | .checkpoint.active_remediation=null | .checkpoint.requested_end_sha=$sha | .checkpoint.reviewed_sha=null else . end)' "$MANIFEST_PATH" | write_manifest
  transaction_stage_path "$artifact"
  transaction_stage_path "$request"
  transaction_stage_path "$request_archive"
  transaction_stage_path "$result"
  transaction_stage_path "$result_archive"
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
  (REPO_DIR="$task_dir" MANIFEST_PATH="$task_dir/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" TASK_BRANCH="$branch" IMPLEMENTATION_REPORT="$report" PIPELINE_ALLOW_DETACHED_TASK_WORKTREE="${PIPELINE_ALLOW_DETACHED_TASK_WORKTREE:-0}" PIPELINE_REQUIRE_ACTUAL_CHECKS=1 verify_pr "$pr" "$branch" "$checkpoint")
  git -C "$task_dir" fetch origin "$branch" || die "cannot refresh verified remediation branch"
  metadata="$(github_pr_metadata "$pr")"
  validate_remediation_pr_metadata "$metadata" "$pr" "$branch" OPEN || die "remediation PR metadata changed after verification"
  local_head="$(git -C "$task_dir" rev-parse HEAD)"; remote_head="$(git -C "$task_dir" rev-parse "origin/$branch")"
  [[ "$local_head" == "$remote_head" && "$local_head" == "$(jq -r '.headRefOid' <<<"$metadata")" ]] || die "remediation PR head changed after local/check verification"
  REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run"; REMEDIATION_BRANCH="$branch"; REMEDIATION_PR="$pr"; REMEDIATION_REPORT="$report"
  REMEDIATION_VERIFICATION="$(jq -n --arg repo "$(jq -r '.repository.nameWithOwner' <<<"$metadata")" --arg base "$(jq -r '.baseRefName' <<<"$metadata")" --arg head "$branch" --arg head_sha "$(jq -r '.headRefOid' <<<"$metadata")" --arg pr "$pr" --arg report "$report" --arg verified "$(date -u +%FT%TZ)" '{status:"passed",checks:"passed",repository:$repo,base:$base,head:$head,head_sha:$head_sha,pr_url:$pr,implementation_report:$report,verified_at:$verified}')"
  REPO_DIR="$state_repo"; MANIFEST_PATH="$state_repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
  state_transaction "remediation-verified:$run" "chore(pipeline): verify remediation PR $run" transaction_record_remediation_verification
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
  gh pr diff "$pr" --name-only | grep -Fqx -e "$report" || die "remediation implementation report is not in the exact PR diff"
  merge_sha="$(jq -r '.mergeCommit.oid // empty' <<<"$metadata")"; [[ "$merge_sha" =~ ^[0-9a-f]{40}$ ]] || die "merged remediation PR has no merge SHA"
  jq -n --arg pr "$pr" --arg merge_sha "$merge_sha" --arg report "$report" --arg head_sha "$(jq -r '.headRefOid' <<<"$metadata")" --argjson recovered "$recovered" '{pr_url:$pr,merge_sha:$merge_sha,implementation_report:$report,validation:{checks:"passed",head_sha:$head_sha},recovered:$recovered}'
}

mark_remediation_needs_human() {
  local checkpoint="$1" run="$2" reason="$3"
  REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run"; REMEDIATION_REASON="$reason"
  state_transaction "remediation-needs-human:$run" "chore(pipeline): block remediation $run for human review" transaction_mark_remediation_needs_human
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
  REMEDIATION_CHECKPOINT="$checkpoint"; state_transaction "remediation-reserve:$checkpoint" "chore(pipeline): reserve remediation for $checkpoint" transaction_reserve_remediation
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
  state_transaction "remediation-pr:$run_id" "chore(pipeline): record remediation PR $run_id" transaction_record_remediation_pr
  record_remediation_verification "$checkpoint" "$run_id" "$branch" "$pr" "$report" "$task_dir" "$state_repo"
  merge_verified_remediation_pr "$pr" "$branch" "$(jq -r '.verification.head_sha' "$artifact")"
  reconcile_planning_state "$(jq -r '.base_branch' "$MANIFEST_PATH")" "$state_repo"
  artifact="$(remediation_artifact_from_manifest "$wave")"; REMEDIATION_EVIDENCE="$(build_merged_remediation_evidence "$pr" "$branch" "$report" "$artifact")"
  REMEDIATION_CHECKPOINT="$checkpoint"; REMEDIATION_RUN_ID="$run_id"; REMEDIATION_BRANCH="$branch"
  state_transaction "remediation-complete:$run_id" "chore(pipeline): complete remediation $run_id" transaction_complete_remediation
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
    state_transaction "remediation-pr-recovery:$run" "chore(pipeline): recover remediation PR metadata $run" transaction_record_remediation_pr
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
    if ! gh pr checks "$pr" >/dev/null || ! gh pr diff "$pr" --name-only | grep -Fqx -e "$report" || [[ ! "$(jq -r '.mergeCommit.oid // empty' <<<"$metadata")" =~ ^[0-9a-f]{40}$ ]]; then
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
  state_transaction "remediation-recovery:$run" "chore(pipeline): recover remediation $run" transaction_complete_remediation
}

update_task_status() {
  local id="$1" from="$2" to="$3" evidence="${4:-null}"
  jq --arg id "$id" --arg from "$from" --arg to "$to" --argjson evidence "$evidence" '
    .waves |= map(.tasks |= map(if .id == $id and .status == $from then
      .status = $to |
      if $evidence != null then .evidence = $evidence | .verification = ($evidence.verification // .verification) else . end
    else . end))
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
      .tasks |= map(if .id == $id and .status == "pending" then .status = "running" | .verification=null | .evidence=null else . end)
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
  transaction_stage_path "$request"
  jq --arg id "$checkpoint" --arg sha "$end_sha" '.waves |= map(if .checkpoint.id == $id then .checkpoint.status="awaiting_review" | .checkpoint.requested_end_sha=$sha else . end)' "$MANIFEST_PATH" | write_manifest
}

create_checkpoint() {
  state_transaction "checkpoint-request" "chore(pipeline): request architecture review" transaction_checkpoint
}

# shellcheck disable=SC2329
# shellcheck disable=SC2153
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
  mkdir -p "$(dirname "$target")"; cp "$source" "$target"; transaction_stage_path "$target"
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
  local base_branch action task task_branch task_dir control_dir brief outcome log_file contract execution_task dispatch_artifact control_artifact control_digest title section deps gate_digest
  base_branch="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  synchronization_gate "$base_branch"
  action="$(select_action)"; [[ "$(jq -r '.action' <<<"$action")" == "task" ]] || die "no eligible product task to dispatch"
  task="$(jq -r '.task' <<<"$action")"
  require_selected_task "$task"
  gate_digest=""
  if task_has_dispatch_gate "$task"; then
    gate_digest="$(governance_gate_digest "$task")"
    DISPATCH_GATE_AUTHORIZED_DIGEST=""
    state_transaction "task-gate-authorize:$task" "chore(pipeline): authorize gated OS 3.8 task $task" transaction_authorize_task_dispatch "$task" "$gate_digest"
    [[ -n "$DISPATCH_GATE_AUTHORIZED_DIGEST" ]] || die "locked governance gate authorization produced no digest"
    gate_digest="$DISPATCH_GATE_AUTHORIZED_DIGEST"
  fi
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
  safe_relative_path "$(jq -r '.implementation_report' "$outcome")" || die "task outcome implementation_report is not a safe repository-relative path"
  if [[ "${PIPELINE_TEST_MODE:-0}" != "1" ]]; then [[ -z "$(git -C "$task_dir" status --porcelain)" ]] || die "task worktree is dirty; control files must remain outside it"; fi
  dispatch_artifact="$(artifact_path "$(task_dispatch_relative "$task")")"
  control_artifact="$control_dir/DISPATCH.json"
  jq --arg task "$task" --arg branch "$task_branch" --arg base "$base_branch" --arg dispatched_at "$(date -u +%FT%TZ)" '. + {task_id:$task, task_branch:$branch, base_branch:$base, dispatched_at:$dispatched_at}' "$outcome" >"$control_artifact"
  control_artifact="$(external_source_path "$control_artifact")" || die "cannot canonicalize task dispatch control artifact"
  control_digest="$(shasum -a 256 "$control_artifact" | awk '{print $1}')"
  mkdir -p "$(dirname "$dispatch_artifact")"
  state_transaction "task-start:$task" "chore(pipeline): start OS 3.8 task $task" transaction_start_task "$task" "$control_artifact" "$dispatch_artifact" "$control_digest" "$gate_digest"
  if [[ "${PIPELINE_AUTOMATE_TASK_CYCLE:-0}" == "1" ]]; then
    local state_repo="$REPO_DIR"
    (REPO_DIR="$task_dir" MANIFEST_PATH="$task_dir/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" STATE_REPO_DIR="$state_repo" TASK_BRANCH="$task_branch" IMPLEMENTATION_REPORT="$(jq -r '.implementation_report' "$outcome")" PIPELINE_ALLOW_PR_MERGE="${PIPELINE_ALLOW_PR_MERGE:-0}" merge_task_pr "$task" "$(jq -r '.pr_url' "$outcome")")
  fi
  log "Task $task dispatched through CODEX_CMD on $task_branch; outcome captured at $outcome"
}

verify_pr() {
  local pr_url="$1" task_branch="${2:-${TASK_BRANCH:-}}" task_id="${3:-${PIPELINE_TASK_ID:-}}" task_policy repo_json refreshed_json expected_repo expected_base local_head remote_head initial_head initial_base_sha checks_deadline checks_rc checks_output checks_decision checks_evidence recomputed report verified_at
  command -v gh >/dev/null 2>&1 || die "gh is required for PR verification"
  [[ "$pr_url" == https://github.com/*/pull/* ]] || die "invalid PR URL"
  [[ -n "$task_branch" ]] || die "verification requires TASK_BRANCH"
  [[ -n "$task_id" ]] || die "verification requires an explicit task ID"
  synchronization_gate "$task_branch" "$REPO_DIR" "${PIPELINE_ALLOW_DETACHED_TASK_WORKTREE:-0}"
  if [[ "${PIPELINE_REQUIRE_ACTUAL_CHECKS:-0}" == "1" ]]; then
    task_policy=actual_checks_required
  else
    task_policy="$(task_verification_policy "$task_id")"
  fi
  expected_repo="$(expected_repository "$REPO_DIR")"
  expected_base="$(jq -r '.base_branch' "$MANIFEST_PATH")"
  repo_json="$(github_pr_metadata "$pr_url")"
  validate_task_pr_metadata "$repo_json" "$pr_url" "$task_branch" OPEN || die "PR repository/base/head identity is invalid"
  local_head="$(git -C "$REPO_DIR" rev-parse HEAD)"; remote_head="$(git -C "$REPO_DIR" rev-parse "origin/$task_branch")"
  initial_head="$(jq -r '.headRefOid' <<<"$repo_json")"
  initial_base_sha="$(jq -r '.baseRefOid' <<<"$repo_json")"
  [[ "$initial_base_sha" =~ ^[0-9a-f]{40}$ ]] || die "PR base SHA is invalid"
  [[ "$local_head" == "$remote_head" && "$local_head" == "$initial_head" ]] || die "local, remote task branch, and PR head SHA differ"
  report="${IMPLEMENTATION_REPORT:-}"
  if [[ -n "$report" ]]; then
    safe_relative_path "$report" || die "implementation report must be a safe repository-relative path"
    ensure_exact_report_at_head "$REPO_DIR" "$initial_head" "$report" "$pr_url"
    gh pr diff "$pr_url" --name-only | grep -Fqx -e "$report" || die "implementation report is not included in PR diff"
  fi
  if gh pr diff "$pr_url" --name-only | grep -Eq '(^|/)\.env($|\.)|^packages/|^prisma/migrations/|^\.github/workflows/deploy'; then
    die "PR changes a forbidden path"
  fi
  log "running required local verification"
  (cd "$REPO_DIR" && pnpm type-check && pnpm test && pnpm build && pnpm lint && git diff --check) || die "local verification failed"
  checks_deadline=$((SECONDS + 1800)); checks_rc=1; checks_decision=""; checks_evidence=null
  while (( SECONDS < checks_deadline )); do
    set +e; checks_output="$(gh pr checks "$pr_url" --watch --fail-fast 2>&1)"; checks_rc=$?; set -e
    if [[ "$checks_rc" == 0 ]]; then checks_decision=passed; break; fi
    if grep -q 'no checks reported' <<<"$checks_output"; then
      if [[ "$task_policy" == "paths_ignored_zero_checks_allowed" ]] && checks_evidence="$(evaluate_pr_check_requirement "$task_id" "$pr_url" "$initial_head" "$initial_base_sha")"; then
        checks_decision=not_required_paths_ignored
        break
      fi
      sleep 30
      continue
    fi
    die "GitHub checks failed"
  done
  [[ "$checks_decision" == passed || "$checks_decision" == not_required_paths_ignored ]] || die "timed out waiting for GitHub checks or exact paths-ignore evidence"
  [[ "$task_policy" != "actual_checks_required" || "$checks_decision" == passed ]] || die "Manifest task policy requires actual passing GitHub checks: $task_id"
  [[ "${PIPELINE_REQUIRE_ACTUAL_CHECKS:-0}" != "1" || "$checks_decision" == passed ]] || die "this verification path requires actual passing GitHub checks"
  git -C "$REPO_DIR" fetch origin "$task_branch" >/dev/null || die "cannot refresh verified task branch"
  refreshed_json="$(github_pr_metadata "$pr_url")"
  validate_task_pr_metadata "$refreshed_json" "$pr_url" "$task_branch" OPEN "$initial_head" || die "PR identity or head changed during verification"
  [[ "$(jq -r '.baseRefOid' <<<"$refreshed_json")" == "$initial_base_sha" ]] || die "PR base SHA changed during verification"
  local_head="$(git -C "$REPO_DIR" rev-parse HEAD)"; remote_head="$(git -C "$REPO_DIR" rev-parse "origin/$task_branch")"
  [[ "$local_head" == "$remote_head" && "$local_head" == "$initial_head" ]] || die "local, remote, or PR head changed during verification"
  if [[ -n "$report" ]]; then
    ensure_exact_report_at_head "$REPO_DIR" "$initial_head" "$report" "$pr_url"
    gh pr diff "$pr_url" --name-only | grep -Fqx -e "$report" || die "implementation report changed after checks"
  fi
  if [[ "$checks_decision" == passed ]]; then
    gh pr checks "$pr_url" >/dev/null || die "task checks changed after verification"
    verified_at="$(date -u +%FT%TZ)"
  else
    recomputed="$(evaluate_pr_check_requirement "$task_id" "$pr_url" "$initial_head" "$initial_base_sha")" || die "docs-only task policy or paths-ignore evidence changed after verification"
    [[ "$(jq -Sc 'del(.verified_at)' <<<"$checks_evidence")" == "$(jq -Sc 'del(.verified_at)' <<<"$recomputed")" ]] || die "docs-only PR diff or CI policy changed during verification"
    checks_evidence="$recomputed"
    verified_at="$(jq -r '.verified_at' <<<"$checks_evidence")"
  fi
  VERIFIED_PR_JSON="$(jq -n \
    --arg task_id "$task_id" --arg task_policy "$task_policy" --arg repo "$expected_repo" --arg base "$expected_base" --arg branch "$task_branch" \
    --arg pr "$pr_url" --arg head "$initial_head" --arg report "$report" \
    --arg dispatch "$(task_dispatch_relative "$task_id")" --arg checks "$checks_decision" --arg verified_at "$verified_at" --argjson checks_evidence "$checks_evidence" \
    '{status:"passed",task_id:$task_id,task_verification_policy:$task_policy,repository:$repo,base_branch:$base,task_branch:$branch,pr_url:$pr,verified_head_sha:$head,implementation_report:$report,dispatch_artifact:$dispatch,report_exists_at_exact_head:($report != ""),report_in_pr_diff:($report != ""),checks:$checks,verified_at:$verified_at} + (if $checks == "not_required_paths_ignored" then {checks_evidence:$checks_evidence} else {} end)')"
  log "GitHub checks decision $checks_decision verified for exact head $initial_head"
}

merge_task_pr() {
  local task="$1" pr_url="$2" evidence state_repo task_repo task_manifest base_branch dispatch_relative verification metadata verified_head merge_sha report
  [[ "${PIPELINE_ALLOW_PR_MERGE:-0}" == "1" ]] || die "merge requires PIPELINE_ALLOW_PR_MERGE=1"
  task_repo="$REPO_DIR"; task_manifest="$MANIFEST_PATH"
  PIPELINE_TASK_ID="$task"
  verify_pr "$pr_url" "${TASK_BRANCH:?TASK_BRANCH required}" "$task"
  verification="$VERIFIED_PR_JSON"; report="${IMPLEMENTATION_REPORT:?IMPLEMENTATION_REPORT required}"
  dispatch_relative="$(task_dispatch_relative "$task")"
  state_repo="${STATE_REPO_DIR:?STATE_REPO_DIR must be a clean planning-branch checkout}"
  base_branch="$(jq -r '.base_branch' "$task_manifest")"
  REPO_DIR="$state_repo"
  MANIFEST_PATH="$state_repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
  state_transaction "task-verified:$task" "chore(pipeline): persist exact verification for OS 3.8 task $task" transaction_record_task_verification "$task" "$dispatch_relative" "$verification"
  verification="$(jq -c '.verification' "$(artifact_path "$dispatch_relative")")"

  REPO_DIR="$task_repo"; MANIFEST_PATH="$task_manifest"
  synchronization_gate "${TASK_BRANCH}" "$task_repo" "${PIPELINE_ALLOW_DETACHED_TASK_WORKTREE:-0}"
  metadata="$(github_pr_metadata "$pr_url")"; verified_head="$(jq -r '.verified_head_sha' <<<"$verification")"
  validate_task_pr_metadata "$metadata" "$pr_url" "${TASK_BRANCH}" OPEN "$verified_head" || die "task PR identity changed before merge"
  assert_task_check_contract "$task" "$verification"
  ensure_exact_report_at_head "$task_repo" "$verified_head" "$report" "$pr_url"
  gh pr diff "$pr_url" --name-only | grep -Fqx -e "$report" || die "implementation report changed before merge"
  gh pr merge "$pr_url" --squash --delete-branch --match-head-commit "$verified_head" || die "PR merge failed or verified head changed"
  metadata="$(github_pr_metadata "$pr_url")"
  validate_task_pr_metadata "$metadata" "$pr_url" "${TASK_BRANCH}" MERGED "$verified_head" || die "merged task PR metadata does not match the verified identity"
  merge_sha="$(jq -r '.mergeCommit.oid // empty' <<<"$metadata")"; [[ "$merge_sha" =~ ^[0-9a-f]{40}$ ]] || die "merged task PR has no valid merge SHA"

  REPO_DIR="$state_repo"; MANIFEST_PATH="$state_repo/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
  reconcile_planning_state "$base_branch" "$state_repo"
  git -C "$state_repo" merge-base --is-ancestor "$merge_sha" HEAD || die "task merge SHA is not on authorized planning history"
  evidence="$(jq -n --arg pr "$pr_url" --arg merge_sha "$merge_sha" --arg report "$report" --arg head "$verified_head" --argjson verification "$verification" --arg merged_at "$(date -u +%FT%TZ)" '{pr_url:$pr,merge_sha:$merge_sha,implementation_report:$report,verification:$verification,validation:({checks:$verification.checks,head_sha:$head} + (if $verification.checks == "not_required_paths_ignored" then {checks_evidence:$verification.checks_evidence} else {} end)),merged_at:$merged_at,recovered:false}')"
  validate_task_completion_evidence "$task" "$evidence"
  state_transaction "task-complete:$task" "chore(pipeline): record merged OS 3.8 task $task" transaction_complete_task "$task" "$evidence" "$dispatch_relative"
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
  transaction_stage_path "$artifact"
}

record_steven_ia() {
  local approver="$1" approved_at="$2"
  valid_approver "$approver" || die "approver must be a valid GitHub-style identity"
  valid_utc_timestamp "$approved_at" || die "approval timestamp must be a valid UTC RFC3339 timestamp"
  STEVEN_IA_APPROVER="$approver"; STEVEN_IA_APPROVED_AT="$approved_at"
  state_transaction "steven-ia" "chore(pipeline): record STEVEN-IA approval" transaction_record_steven_ia
}

# shellcheck disable=SC2329
transaction_final_audit_request() {
  local status checkpoint_sha requested_product_sha request_relative report_relative request requested_at baseline_sha
  final_audit_prerequisites_satisfied || die "final audit prerequisites are no longer satisfied"
  status="$(jq -r '.final_audit.status' "$MANIFEST_PATH")"
  [[ "$status" == pending ]] || die "final audit request requires pending status"
  checkpoint_sha="$(jq -r '.waves[-1].checkpoint.reviewed_sha // empty' "$MANIFEST_PATH")"
  [[ "$checkpoint_sha" =~ ^[0-9a-f]{40}$ ]] || die "final checkpoint reviewed SHA is invalid"
  git -C "$REPO_DIR" cat-file -e "$checkpoint_sha^{commit}" 2>/dev/null || die "final checkpoint reviewed SHA is not a Git commit"
  requested_product_sha="$(git -C "$REPO_DIR" rev-parse HEAD)"
  [[ "$requested_product_sha" =~ ^[0-9a-f]{40}$ ]] || die "current synchronized planning HEAD is invalid"
  git -C "$REPO_DIR" merge-base --is-ancestor "$checkpoint_sha" "$requested_product_sha" ||
    die "final checkpoint reviewed SHA is not an ancestor of current planning HEAD"
  request_relative="$(jq -r '.final_audit.request' "$MANIFEST_PATH")"; report_relative="$(jq -r '.final_audit.report' "$MANIFEST_PATH")"
  if ! safe_relative_path "$request_relative" || ! safe_relative_path "$report_relative"; then die "final audit artifact path is invalid"; fi
  request="$(artifact_path "$request_relative")"; [[ ! -e "$request" ]] || die "final audit request already exists"
  requested_at="$(date -u +%FT%TZ)"; baseline_sha="$(jq -r '.waves[0].start_sha // empty' "$MANIFEST_PATH")"
  [[ "$baseline_sha" =~ ^[0-9a-f]{40}$ ]] || die "final audit baseline SHA is invalid"
  if [[ "${PIPELINE_TEST_MODE:-0}" != "1" ]]; then
    transaction_own_path "$MANIFEST_PATH"
    transaction_own_path "$request_relative"
  fi
  mkdir -p "$(dirname "$request")"
  cat >"$request" <<EOF
# OS 3.8 Final Audit Request

AUDIT_ID=$(jq -r '.final_audit.id' "$MANIFEST_PATH")
BASELINE_SHA=$baseline_sha
LAST_CHECKPOINT_REVIEWED_SHA=$checkpoint_sha
REQUESTED_PRODUCT_SHA=$requested_product_sha
REQUESTED_AT=$requested_at
REPORT_PATH=$report_relative
RELEASE_GATE=BLOCKED

Review the complete repository state at REQUESTED_PRODUCT_SHA. It includes product code, database changes, Pipeline code, governance documents, checkpoint results, and every reviewed change merged before this request. Write exactly one VERDICT=PASS or VERDICT=FAIL and one REVIEWED_SHA matching that SHA. PASS_WITH_CONDITION is not PASS. Release, tag, and deploy remain blocked.
EOF
  jq --arg sha "$requested_product_sha" --arg requested_at "$requested_at" '
    .final_audit.status="running" |
    .final_audit.requested_product_sha=$sha |
    .final_audit.requested_at=$requested_at |
    .final_audit.reviewed_sha=null |
    .final_audit.completed_at=null |
    .release_gate.status="blocked"
  ' "$MANIFEST_PATH" | write_manifest
  transaction_stage_path "$request"
}

create_final_audit_request() {
  state_transaction "final-audit-request" "chore(pipeline): request OS 3.8 final audit" transaction_final_audit_request
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
  assert_final_audit_fresh "$requested_sha"
  [[ ! -e "$report" ]] || die "canonical final audit report already exists before terminal transition"
  mkdir -p "$(dirname "$report")"; cp "$FINAL_AUDIT_SOURCE" "$report"
  completed_at="$(date -u +%FT%TZ)"
  jq --arg status "$expected_status" --arg sha "$requested_sha" --arg completed_at "$completed_at" '
    .final_audit.status=$status |
    .final_audit.reviewed_sha=$sha |
    .final_audit.completed_at=$completed_at |
    .release_gate.status="blocked"
  ' "$MANIFEST_PATH" | write_manifest
  transaction_stage_path "$report"
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
  state_transaction "final-audit-result" "chore(pipeline): record OS 3.8 final audit" transaction_final_audit_result
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
    REVIEW_ID="$id" REVIEW_VERDICT="$result" REVIEW_SOURCE="$result_source" state_transaction "review-result:$id" "chore(pipeline): record $id architecture review" transaction_review_result
    ;;
  --record-steven-ia)
    record_steven_ia "${2:?approver required}" "${3:?timestamp required}"
    ;;
  --record-final-audit)
    record_final_audit_result "${2:?PASS or FAIL required}" "${3:?external audit result path required}"
    ;;
  --adopt-governance-gate)
    adopt_governance_gate "${2:?governance gate task ID required}" "${3:?blocked consumer task ID required}" "${4:?external gate source required}" "${5:?reviewed PR URL required}"
    ;;
  --evaluate-pr-check-requirement)
    evaluate_pr_check_requirement "${2:?task ID required}" "${3:?PR URL required}" "${4:?expected head SHA required}" "${5:?expected base SHA required}" || die "PR does not satisfy the exact task-policy-bound paths-ignore zero-check contract"
    ;;
  --verify-pr)
    PIPELINE_TASK_ID="${2:?task ID required}"
    verify_pr "${3:?PR URL required}" "${TASK_BRANCH:-}" "$PIPELINE_TASK_ID"
    ;;
  --merge-task-pr) merge_task_pr "${2:?task ID required}" "${3:?PR URL required}" ;;
  --recover-task) recover_running_task "${2:?task ID required}" ;;
  --dispatch) dispatch_task ;;
  --cycle) run_cycle ;;
  --help|-h) usage ;;
  *) usage >&2; die "unknown command: $command" ;;
esac
