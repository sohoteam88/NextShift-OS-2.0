#!/usr/bin/env bash
# OS 3.8 manifest-driven pipeline runner. It never releases or deploys.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
MANIFEST_PATH="${MANIFEST_PATH:-$REPO_DIR/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json}"
LOG_DIR="${LOG_DIR:-$SCRIPT_DIR/logs}"
STOP_FILE="${STOP_FILE:-$LOG_DIR/STOP}"
VALIDATOR="$SCRIPT_DIR/validate-manifest.sh"
AUTO_RELEASE="${AUTO_RELEASE:-0}"
AUTO_DEPLOY="${AUTO_DEPLOY:-0}"

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

The manifest is the sole state source. AUTO_RELEASE and AUTO_DEPLOY must remain 0.
EOF
}

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*" >&2; }
die() { log "ABORT: $*"; exit 1; }
require_jq() { command -v jq >/dev/null 2>&1 || die "jq is required"; }
write_manifest() { local tmp; tmp="$(mktemp "${MANIFEST_PATH}.XXXXXX")"; cat >"$tmp"; mv "$tmp" "$MANIFEST_PATH"; }

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
  local action wave checkpoint base_sha end_sha request_dir request
  action="$(select_action)"
  [[ "$(jq -r '.action' <<<"$action")" == "checkpoint" ]] || die "no wave checkpoint is eligible"
  wave="$(jq -r '.wave' <<<"$action")"; checkpoint="$(jq -r '.checkpoint' <<<"$action")"
  base_sha="$(jq -r --arg wave "$wave" '.waves[] | select(.id == $wave) | .start_sha // empty' "$MANIFEST_PATH")"
  [[ -n "$base_sha" ]] || die "wave $wave has no start_sha evidence"
  if [[ "${PIPELINE_TEST_MODE:-0}" == "1" ]]; then end_sha="test-end-sha"; else end_sha="$(git -C "$REPO_DIR" rev-parse HEAD)"; fi
  request_dir="$REPO_DIR/docs/nextshift-os-3/os-3-8/reviews"
  request="$request_dir/${wave}_ARCHITECTURE_REVIEW_REQUEST.md"
  if [[ "${PIPELINE_TEST_MODE:-0}" != "1" ]]; then
    mkdir -p "$request_dir"
    cat >"$request" <<EOF
# ${wave} Architecture Review Request

- Checkpoint: \`${checkpoint}\`
- Cumulative start SHA: \`${base_sha}\`
- Cumulative end SHA: \`${end_sha}\`
- Manifest: \`docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json\`

Review the cumulative change set with \`git diff ${base_sha}...${end_sha}\` and record PASS or CHANGES_REQUESTED through the operator command. The pipeline cannot approve this checkpoint itself.
EOF
  fi
  record_checkpoint "$checkpoint" "awaiting_review"
  log "${checkpoint} is awaiting independent Architecture Review: $request"
}

dispatch_task() {
  [[ "${PIPELINE_ALLOW_PRODUCT_DISPATCH:-0}" == "1" ]] || die "dispatch requires PIPELINE_ALLOW_PRODUCT_DISPATCH=1"
  [[ -n "${CODEX_CMD:-}" ]] || die "dispatch requires an explicit CODEX_CMD; no unsafe default is provided"
  [[ ! -e "$STOP_FILE" ]] || die "STOP file exists: $STOP_FILE"
  if ! git -C "$REPO_DIR" diff --quiet || ! git -C "$REPO_DIR" diff --cached --quiet; then
    die "working tree must be clean"
  fi
  git -C "$REPO_DIR" show-ref --verify --quiet "refs/remotes/origin/$(jq -r '.base_branch' "$MANIFEST_PATH")" || die "required base branch is unavailable"
  local action task
  action="$(select_action)"; [[ "$(jq -r '.action' <<<"$action")" == "task" ]] || die "no eligible product task to dispatch"
  task="$(jq -r '.task' <<<"$action")"
  log "dispatch is intentionally operator-driven for $task; recording start only"
  start_task "$task"
  log "Task $task marked running. Run the explicit operator command and record evidence before completion."
}

verify_pr() {
  local pr_url="$1" checks_deadline checks_rc
  command -v gh >/dev/null 2>&1 || die "gh is required for PR verification"
  [[ "$pr_url" == https://github.com/*/pull/* ]] || die "invalid PR URL"
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
  local task="$1" pr_url="$2" evidence
  [[ "${PIPELINE_ALLOW_PR_MERGE:-0}" == "1" ]] || die "merge requires PIPELINE_ALLOW_PR_MERGE=1"
  [[ "$(jq -r --arg id "$task" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == "running" ]] || die "task must be running before merge: $task"
  verify_pr "$pr_url"
  gh pr merge "$pr_url" --squash --delete-branch || die "PR merge failed"
  evidence="$(jq -n --arg pr "$pr_url" --arg merged_at "$(date -u +%FT%TZ)" '{pr:$pr, checks:"passed", merged_at:$merged_at}')"
  update_task_status "$task" running completed "$evidence"
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
    start_task "$id"
    ;;
  --record-task-completed)
    id="${2:?task ID required}"; evidence="${TASK_EVIDENCE_JSON:-}"
    [[ -n "$evidence" ]] || die "TASK_EVIDENCE_JSON is required"
    jq empty <<<"$evidence" || die "TASK_EVIDENCE_JSON must be JSON"
    [[ "$(jq -r --arg id "$id" '.waves[] | .tasks[] | select(.id == $id) | .status' "$MANIFEST_PATH")" == "running" ]] || die "task must be running: $id"
    update_task_status "$id" running completed "$evidence"
    ;;
  --record-review-result)
    id="${2:?checkpoint ID required}"; result="${3:?PASS or CHANGES_REQUESTED required}"
    [[ "$result" == PASS || "$result" == CHANGES_REQUESTED ]] || die "review result must be PASS or CHANGES_REQUESTED"
    [[ "$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | .checkpoint.status' "$MANIFEST_PATH")" == "awaiting_review" ]] || die "checkpoint is not awaiting review: $id"
    if [[ "$result" == PASS ]]; then record_checkpoint "$id" passed; else record_checkpoint "$id" changes_requested; fi
    ;;
  --record-remediation-result)
    id="${2:?checkpoint ID required}"; result="${3:?PASS or FAIL required}"
    [[ "$result" == PASS || "$result" == FAIL ]] || die "remediation result must be PASS or FAIL"
    status="$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | .checkpoint.status' "$MANIFEST_PATH")"
    [[ "$status" == changes_requested ]] || die "checkpoint is not in remediation: $id"
    attempts="$(jq -r --arg id "$id" '.waves[] | select(.checkpoint.id == $id) | (.checkpoint.remediation_attempts // 0)' "$MANIFEST_PATH")"
    if [[ "$result" == PASS ]]; then
      record_checkpoint "$id" awaiting_review "$attempts"
    else
      attempts=$((attempts + 1)); max="$(jq -r '.execution_policy.max_architecture_remediation_attempts' "$MANIFEST_PATH")"
      if (( attempts >= max )); then record_checkpoint "$id" needs_human "$attempts"; else record_checkpoint "$id" changes_requested "$attempts"; fi
    fi
    ;;
  --record-steven-ia)
    approver="${2:?approver required}"; timestamp="${3:?timestamp required}"
    [[ "$(jq -r '.waves[] | select(.human_gate?.id == "STEVEN-IA") | .human_gate.status' "$MANIFEST_PATH")" == pending ]] || die "STEVEN-IA is not pending"
    [[ "$(jq -r '.waves[] | select(.id == "W2") | .checkpoint.status' "$MANIFEST_PATH")" == passed ]] || die "STEVEN-IA requires AR-W2 PASS"
    jq --arg approver "$approver" --arg timestamp "$timestamp" '.waves |= map(if .human_gate?.id == "STEVEN-IA" then .human_gate.status="approved" | .human_gate.approved_by=$approver | .human_gate.approved_at=$timestamp else . end)' "$MANIFEST_PATH" | write_manifest
    ;;
  --record-final-audit)
    result="${2:?PASS or FAIL required}"; [[ "$result" == PASS || "$result" == FAIL ]] || die "audit result must be PASS or FAIL"
    [[ "$(jq '[.waves[].checkpoint.status] | all(. == "passed")' "$MANIFEST_PATH")" == true ]] || die "final audit requires all wave checkpoints to pass"
    [[ "$(jq '[.waves[] | select(.human_gate != null) | .human_gate.status] | all(. == "approved")' "$MANIFEST_PATH")" == true ]] || die "final audit requires all human gates"
    jq --arg status "$(tr '[:upper:]' '[:lower:]' <<<"$result")" '.final_audit.status=$status | .release_gate.status="blocked"' "$MANIFEST_PATH" | write_manifest
    ;;
  --verify-pr) verify_pr "${2:?PR URL required}" ;;
  --merge-task-pr) merge_task_pr "${2:?task ID required}" "${3:?PR URL required}" ;;
  --dispatch) dispatch_task ;;
  --help|-h) usage ;;
  *) usage >&2; die "unknown command: $command" ;;
esac
