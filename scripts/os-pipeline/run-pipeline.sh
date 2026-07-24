#!/usr/bin/env bash
#
# NextShift OS — Autonomous Blueprint Pipeline
#
# Chains the triangle workflow end-to-end, unattended:
#   1. Architecture Review  (claude CLI, "architect" role)  -> picks next open item from the
#      active blueprint, writes a task brief
#   2. Execution             (codex CLI)                     -> implements it on a fresh branch,
#      opens a PR
#   3. Local verification    (pnpm)                          -> type-check / test / build / lint,
#      independent of whatever Codex self-reports
#   4. Architecture Review   (claude CLI, "reviewer" role)   -> reads the real diff, PASS/FAIL
#   5. Merge                 (gh pr merge)                   -> only if 3+4 both pass and the
#      hard safety guards below are clean
#   6. Every N merged PRs: Code-level Audit (claude CLI, "auditor" role) against the accumulated
#      diff since the last audit; only a plain PASS unblocks step 7
#   7. RC prep + merge to main + tag                          -> only after an audit PASS with no
#      open blueprint items left
#   8. VPS flag reveal + deploy verification                   -> only after a fresh tag in this
#      run; reads the blueprint for which flags this release intends to reveal, edits
#      .env.production over SSH, restarts the app container, smoke-tests, and automatically
#      rolls back the env change (not the code) if the smoke test fails
#
# This script does NOT ask you anything mid-run. It either completes a cycle or aborts loudly
# with a written reason in the log. Read the log after the fact; don't watch it run.
#
# ============================================================================
# CONFIGURATION — fill these in for your machine before first run
# ============================================================================

set -euo pipefail

# --- Repo -------------------------------------------------------------------
REPO_DIR="${REPO_DIR:-$HOME/Documents/GitHub/NextShift-OS-2.0}"
BASE_BRANCH="${BASE_BRANCH:-main}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"

# The active blueprint this run should draw tasks from. Update this pointer when you start a
# new OS version; the script does not guess which blueprint is "current".
BLUEPRINT_PATH="${BLUEPRINT_PATH:-docs/nextshift-os-3/OS_3_9_BLUEPRINT.md}"

# --- CLIs ---------------------------------------------------------------------
# Fill in the actual invocation for your setup. Both must:
#   - accept a prompt via stdin or -p/--prompt
#   - run non-interactively (no TTY prompts)
#   - exit non-zero on failure
#
# Installed locally and verified on 2026-07-13. Both commands are deliberately
# non-interactive: this pipeline has its own mechanical safety guards below.
CLAUDE_CMD="${CLAUDE_CMD:-claude -p --output-format text --permission-mode bypassPermissions}"
# Step 4 needs a machine-checkable review contract. Keep this separate from CLAUDE_CMD because
# the other Claude calls intentionally produce prose or one-line text artifacts.
CLAUDE_REVIEW_CMD="${CLAUDE_REVIEW_CMD:-claude -p --output-format json --safe-mode --no-session-persistence --permission-mode bypassPermissions}"
# Audits also produce a release gate, so they use the same structured, isolated invocation as
# Step 4 rather than relying on a free-form final line from a long-running Claude session.
CLAUDE_AUDIT_CMD="${CLAUDE_AUDIT_CMD:-claude -p --output-format json --safe-mode --no-session-persistence --permission-mode bypassPermissions}"
CODEX_CMD="${CODEX_CMD:-codex exec --dangerously-bypass-approvals-and-sandbox}"

# --- Cadence ------------------------------------------------------------------
AUDIT_EVERY_N_PRS="${AUDIT_EVERY_N_PRS:-3}"
PR_CHECKS_TIMEOUT_SECONDS="${PR_CHECKS_TIMEOUT_SECONDS:-1800}"
PR_CHECKS_REGISTRATION_TIMEOUT_SECONDS="${PR_CHECKS_REGISTRATION_TIMEOUT_SECONDS:-600}"
DISABLE_RC_TAG="${DISABLE_RC_TAG:-true}"

# Must stay in sync with .github/workflows/ci.yml pull_request.paths-ignore.
# A diff is CI-exempt only when every changed file matches one of these patterns.
CI_IGNORED_PATTERNS=(
  'docs/**'
  'audit/**'
  '**/*.md'
  'platform/status.md'
)

# --- Hard safety guards (do not weaken these without deliberately deciding to) -
# Paths that must NEVER appear in a Codex-produced diff, aside from the narrowly-scoped C0
# domain-policy exception checked explicitly in Step 3 below.
FORBIDDEN_PATH_PATTERNS=(
  '\.env'
  '^\.github/workflows/deploy\.yml$'
  'prisma/migrations/'   # migrations are reviewed manually until this pipeline has a track record
)

HUMAN_GATE_ITEMS=("G4" "G5")

# C0 is the sole approved exception to the packages/ freeze. Keep this list exact: a C0 diff
# that touches any other package file still aborts, as does any packages/ edit in another task.
C0_ALLOWED_PACKAGE_FILES=(
  'packages/domain/src/business-command-center-v1/business-command-center-v1.ts'
  'packages/domain/test/business-command-center-v1.test.ts'
)

# --- VPS deploy + flag reveal (Step 8) -----------------------------------------
# Enabled per your instruction: this is a pre-launch platform with no real users yet, so the
# "product timing" judgment that gated this in earlier discussion doesn't apply right now.
# Re-review this section once there are real users — the reasoning that made this manual
# (deliberate reveal timing, not engineering readiness) becomes relevant again then.
VPS_HOST="${VPS_HOST:-45.77.171.193}"
VPS_USER="${VPS_USER:-deploy}"
VPS_APP_DIR="${VPS_APP_DIR:-/home/deploy/nextshift}"
VPS_ENV_FILE="${VPS_ENV_FILE:-$VPS_APP_DIR/.env.production}"
VPS_COMPOSE_FILE="${VPS_COMPOSE_FILE:-docker-compose.prod.yml}"
VPS_APP_URL="${VPS_APP_URL:-https://nextshiftos.com}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10)

LOG_DIR="${LOG_DIR:-$REPO_DIR/scripts/os-pipeline/logs}"
RUN_ID="${RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
LOG_FILE="$LOG_DIR/$RUN_ID.log"
PIPELINE_PID_FILE="$LOG_DIR/$RUN_ID-pid"
PIPELINE_EXIT_FILE="$LOG_DIR/$RUN_ID-exit-code"
PIPELINE_SESSION_FILE="$LOG_DIR/$RUN_ID-tmux-session"
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"

mkdir -p "$LOG_DIR"
BLOCKED_ITEMS_FILE="$LOG_DIR/.blocked-items"

# The caller may be a desktop-app tool process whose lifetime is shorter than a full pipeline
# cycle. Re-exec once in a detached tmux session so closing that caller cannot terminate
# Claude/Codex midway. nohup alone is insufficient when the caller kills its whole process group.
# The detached child keeps the same RUN_ID and writes its pane PID and final exit code as durable
# artifacts in LOG_DIR.
if [[ "${PIPELINE_DETACHED:-0}" != "1" ]]; then
  command -v tmux >/dev/null 2>&1 \
    || { printf 'ABORT: tmux is required for detached pipeline execution. Install it with: brew install tmux\n' >&2; exit 1; }

  PIPELINE_SESSION="os-pipeline-$RUN_ID"
  export PIPELINE_DETACHED=1 RUN_ID REPO_DIR BASE_BRANCH MAIN_BRANCH BLUEPRINT_PATH DISABLE_RC_TAG
  export CLAUDE_CMD CLAUDE_REVIEW_CMD CODEX_CMD AUDIT_EVERY_N_PRS LOG_DIR PIPELINE_SESSION
  tmux new-session -d -s "$PIPELINE_SESSION" "$SCRIPT_PATH"
  PIPELINE_PID="$(tmux display-message -p -t "$PIPELINE_SESSION" '#{pane_pid}')"
  printf '%s\n' "$PIPELINE_PID" > "$PIPELINE_PID_FILE"
  printf '%s\n' "$PIPELINE_SESSION" > "$PIPELINE_SESSION_FILE"
  printf 'Pipeline started in tmux session %s (pid=%s).\nLogs: %s\n' "$PIPELINE_SESSION" "$PIPELINE_PID" "$LOG_FILE"
  exit 0
fi

exec > >(tee -a "$LOG_FILE") 2>&1

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$1"; }
abort() { log "ABORT: $1"; exit 1; }
needs_human() { log "NEEDS_HUMAN: $1"; abort "$1"; }
first_open_blueprint_item() {
  awk -F'|' '
    /^\|[[:space:]]*[A-Za-z]+[0-9]+[[:space:]]*\|/ {
      item = $2
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", item)
      if ($0 !~ /已完成|[Cc]ompleted/) {
        print item
        exit
      }
    }
  ' "$BLUEPRINT_PATH"
}

task_brief_item() {
  awk '
    /^# / && match($0, /[A-Za-z]+[0-9]+/) {
      print substr($0, RSTART, RLENGTH)
      exit
    }
    /\*\*Item:\*\*/ && match($0, /[A-Za-z]+[0-9]+/) {
      print substr($0, RSTART, RLENGTH)
      exit
    }
    /row \*\*[A-Za-z]+[0-9]+\*\*/ && match($0, /[A-Za-z]+[0-9]+/) {
      print substr($0, RSTART, RLENGTH)
      exit
    }
  ' "$TASK_BRIEF"
}

wait_for_pr_checks() {
  local pr_url="$1"
  local checks_pid
  local deadline
  local registration_deadline=$((SECONDS + PR_CHECKS_REGISTRATION_TIMEOUT_SECONDS))
  local check_count

  # A newly opened PR can take several seconds before Actions registers any check runs. Treat an
  # empty rollup as pending, but distinguish a genuinely absent suite after ten minutes.
  while true; do
    check_count="$(gh pr view "$pr_url" --json statusCheckRollup --jq '.statusCheckRollup | length')" \
      || return 1
    if (( check_count > 0 )); then
      break
    fi
    if (( SECONDS >= registration_deadline )); then
      return 125
    fi
    log "No GitHub checks reported yet; waiting for Actions to register them."
    sleep 30
  done

  deadline=$((SECONDS + PR_CHECKS_TIMEOUT_SECONDS))

  gh pr checks "$pr_url" --watch --fail-fast &
  checks_pid=$!

  while kill -0 "$checks_pid" 2>/dev/null; do
    if (( SECONDS >= deadline )); then
      kill "$checks_pid" 2>/dev/null || true
      wait "$checks_pid" 2>/dev/null || true
      return 124
    fi
    sleep 5
  done

  wait "$checks_pid"
}

matches_ci_ignored_pattern() {
  local file="$1"
  local pattern
  local root_pattern

  for pattern in "${CI_IGNORED_PATTERNS[@]}"; do
    if [[ "$file" == $pattern ]]; then
      return 0
    fi
    # GitHub's **/ also matches zero directories; Bash's conditional matcher does not.
    root_pattern="${pattern#**/}"
    if [[ "$pattern" == '**/'* && "$file" == $root_pattern ]]; then
      return 0
    fi
  done

  return 1
}

is_ci_exempt_diff() {
  local file

  [[ -n "$DIFF_FILES" ]] || return 1
  while IFS= read -r file; do
    matches_ci_ignored_pattern "$file" || return 1
  done <<< "$DIFF_FILES"
}

block_current_item() {
  local stage="$1"
  local reason="$2"
  local occurrences

  printf '%s\t%s\t%s\t%s\n' "$CURRENT_ITEM" "$stage" "$RUN_ID" "$reason" >> "$BLOCKED_ITEMS_FILE"
  occurrences="$(awk -F'\t' -v item="$CURRENT_ITEM" '$1 == item { count++ } END { print count + 0 }' "$BLOCKED_ITEMS_FILE")"
  log "Blocked $CURRENT_ITEM after $stage ($occurrences occurrence(s)): $reason"

  if (( occurrences >= 2 )); then
    needs_human "$CURRENT_ITEM has failed twice; see $BLOCKED_ITEMS_FILE and resolve manually before another cycle"
  fi
}

record_exit_code() {
  local status=$?
  printf '%s\n' "$status" > "$PIPELINE_EXIT_FILE"
}
trap record_exit_code EXIT

# ============================================================================
# Step 0 — sync check
# ============================================================================

cd "$REPO_DIR"
log "Step 0: sync check"

CURRENT_BRANCH="$(git branch --show-current)"
[[ "$CURRENT_BRANCH" == "$BASE_BRANCH" ]] || abort "on '$CURRENT_BRANCH', expected '$BASE_BRANCH' — switch manually and rerun, this script will not force-checkout"

if [[ -n "$(git status --porcelain)" ]]; then
  abort "working tree not clean — resolve manually before an unattended run touches it"
fi

git pull --ff-only || abort "git pull --ff-only failed (diverged history or lock contention) — do not force, resolve by hand"

# A PR left open by a prior abort is a human-review boundary. Do not create another pipeline PR
# until it is resolved. The --head call is kept for visibility; the JSON filter supplies reliable
# prefix matching because GitHub's head filter itself is exact rather than glob-aware.
OPEN_PIPELINE_PRS="$(gh pr list --head 'chore/pipeline-*' --state open --json url --jq '.[].url' || true)"
OPEN_PIPELINE_PRS="$OPEN_PIPELINE_PRS$(gh pr list --state open --limit 100 --json headRefName,url --jq '.[] | select(.headRefName | startswith("chore/pipeline-")) | .url')"
if [[ -n "$OPEN_PIPELINE_PRS" ]]; then
  abort "previous cycle left an open pipeline PR for manual handling: $(printf '%s' "$OPEN_PIPELINE_PRS" | tr '\n' ' ')"
fi

BLOCKED_ITEM_IDS=""
if [[ -s "$BLOCKED_ITEMS_FILE" ]]; then
  BLOCKED_ITEM_IDS="$(awk -F'\t' 'NF { print $1 }' "$BLOCKED_ITEMS_FILE" | sort -u | paste -sd ',')"
fi

# ============================================================================
# Step 1 — Architecture Review: pick next task, write brief
# ============================================================================

log "Step 1: architecture review — selecting next open blueprint item"

TASK_BRIEF="$LOG_DIR/$RUN_ID-task.md"

$CLAUDE_CMD "You are acting as the Architecture Review / orchestration role for the NextShift OS project. \
Read $BLUEPRINT_PATH in the current repo. Find the first workstream item (in any table, any \
section) that is NOT marked 已完成/completed and is not in the blocked-item list below. Do not \
select, retry, or propose a blocked item. Blocked item IDs: ${BLOCKED_ITEM_IDS:-none}. If every \
non-blocked workstream item is marked complete, output exactly \
the single line NO_OPEN_ITEMS and nothing else. \
Otherwise, write a complete, self-contained task brief for that single item, in the same style as \
the existing entries under scripts/os-pipeline/task-template.md if it exists, otherwise use this \
structure: Base branch, Work branch (propose a name), Step 0 sync checklist, background grounded \
in actual current code (grep/read the relevant files yourself, do not guess file paths), concrete \
requirements, an explicit list of forbidden actions including never touching packages/ or any \
.env file, and acceptance criteria (pnpm type-check/test/build/lint must pass). \
The brief MUST begin with a markdown heading of the exact form '# <ITEM_ID> Task Brief — ...' \
and include a separate metadata line of the exact form '**Item:** <ITEM_ID>', where <ITEM_ID> is \
the selected workstream ID such as T2 or G1. \
Because this repository uses Prisma, the task brief's setup and verification steps MUST run \
pnpm db:generate immediately after pnpm install --frozen-lockfile and before type-checking \
or testing; Prisma Client generation is a local build prerequisite, not a schema or database change. \
The Base branch field MUST be exactly '$BASE_BRANCH' — this is not a guess, it is the fixed base \
branch for this entire project's release cycle (every prior OS 3.x cycle worked this way: all \
work lands on $BASE_BRANCH, only the RC/tag stage merges it to $MAIN_BRANCH). Do not propose \
$MAIN_BRANCH or any other branch as the base, and do not ask the reader to confirm — state it as \
a fact in the brief. \
Output ONLY the task brief markdown, nothing else — no preamble, no explanation." \
  > "$TASK_BRIEF"

if grep -q '^NO_OPEN_ITEMS$' "$TASK_BRIEF"; then
  log "No open items in $BLUEPRINT_PATH — nothing to execute this cycle."
  log "If the blueprint is fully done and audited, run the RC/tag stage manually or extend this script's step 7."
  exit 0
fi

log "Task brief written to $TASK_BRIEF"

CURRENT_ITEM="$(task_brief_item)"
[[ -n "$CURRENT_ITEM" ]] \
  || abort "could not identify the selected blueprint item from $TASK_BRIEF"
if [[ -s "$BLOCKED_ITEMS_FILE" ]] && awk -F'\t' -v item="$CURRENT_ITEM" '$1 == item { found = 1 } END { exit !found }' "$BLOCKED_ITEMS_FILE"; then
  block_current_item "Step 1 selection" "architecture review selected a previously blocked item"
  abort "architecture review selected blocked item $CURRENT_ITEM; refusing to retry it"
fi
log "Selected blueprint item: $CURRENT_ITEM"

# ============================================================================
# Step 2 — Codex execution
# ============================================================================

log "Step 2: dispatching to Codex"

WORK_BRANCH="chore/pipeline-$RUN_ID"
CODEX_OUTPUT="$LOG_DIR/$RUN_ID-codex-output.log"
CODEX_FINAL="$LOG_DIR/$RUN_ID-codex-final.md"

# Codex can emit a large amount of tool and verification output. Keep both stdout and
# stderr in the run artifact rather than streaming them through this script's terminal
# tee; a full terminal pipe can otherwise make the CLI panic before it reports PR_URL.
if ! $CODEX_CMD --output-last-message "$CODEX_FINAL" "$(cat "$TASK_BRIEF")

Additionally, mechanically required for this pipeline run (not optional):
- Work on a new branch named exactly: $WORK_BRANCH
- Push the branch and open a PR against $BASE_BRANCH using the GitHub CLI (gh pr create)
- The PR must be ready for review, not a Draft: do not pass --draft; if GitHub creates it as a
  Draft anyway, run gh pr ready PR_URL before reporting the URL.
- End your output with a single line: PR_URL=<the pull request URL>" \
  > "$CODEX_OUTPUT" 2>&1; then
  abort "Codex execution failed — see $CODEX_OUTPUT"
fi

PR_URL="$(grep -h -o 'PR_URL=.*' "$CODEX_FINAL" "$CODEX_OUTPUT" 2>/dev/null | tail -1 | cut -d= -f2- || true)"
[[ -n "$PR_URL" ]] || abort "Codex did not report a PR_URL — cannot proceed automatically, check $CODEX_OUTPUT by hand"

log "Codex opened: $PR_URL"

# ============================================================================
# Step 3 — local verification (independent of Codex's self-report)
# ============================================================================

log "Step 3: local verification"

git fetch origin "$WORK_BRANCH"
DIFF_FILES="$(git diff --name-only "origin/$BASE_BRANCH...origin/$WORK_BRANCH")"

PACKAGE_FILES="$(grep '^packages/' <<< "$DIFF_FILES" || true)"
if [[ -n "$PACKAGE_FILES" ]]; then
  grep -q 'Item: \*\*C0' "$TASK_BRIEF" \
    || { block_current_item "Step 3 local verification" "diff touches packages/ outside the explicitly authorized C0 task"; abort "diff touches packages/ outside the explicitly authorized C0 task — refusing to auto-merge: $PR_URL"; }

  while IFS= read -r file; do
    allowed=false
    for allowed_file in "${C0_ALLOWED_PACKAGE_FILES[@]}"; do
      [[ "$file" == "$allowed_file" ]] && allowed=true && break
    done
    [[ "$allowed" == true ]] \
      || { block_current_item "Step 3 local verification" "C0 diff touches unauthorized package file '$file'"; abort "C0 diff touches unauthorized package file '$file' — refusing to auto-merge: $PR_URL"; }
  done <<< "$PACKAGE_FILES"
fi

for pattern in "${FORBIDDEN_PATH_PATTERNS[@]}"; do
  if echo "$DIFF_FILES" | grep -qE "$pattern"; then
    block_current_item "Step 3 local verification" "diff touches forbidden path matching '$pattern'"
    abort "diff touches a forbidden path matching '$pattern' — refusing to auto-merge, review by hand: $PR_URL"
  fi
done

git worktree add "/tmp/pipeline-verify-$RUN_ID" "origin/$WORK_BRANCH" 2>&1
if ! (
  cd "/tmp/pipeline-verify-$RUN_ID"
  pnpm install --frozen-lockfile
  pnpm db:generate
  pnpm type-check
  pnpm test
  pnpm build
  pnpm lint
); then
  git worktree remove "/tmp/pipeline-verify-$RUN_ID" --force || true
  block_current_item "Step 3 local verification" "pnpm verification command failed"
  abort "local verification failed; PR left open for manual handling: $PR_URL"
fi
git worktree remove "/tmp/pipeline-verify-$RUN_ID" --force

log "Local verification passed."

# ============================================================================
# Step 3.5 — human review gate
# ============================================================================

if [[ " ${HUMAN_GATE_ITEMS[*]} " == *" $CURRENT_ITEM "* ]]; then
  log "$CURRENT_ITEM 已通过本地验证,按人工闸门规则暂停,不进入自动 review/合并,PR 留 open 等 Fable 窗口人工复审: $PR_URL"
  abort "human review gate paused $CURRENT_ITEM; PR left open for Fable review: $PR_URL"
fi

# ============================================================================
# Step 4 — Architecture Review of the diff
# ============================================================================

log "Step 4: architecture review of the diff"

REVIEW_VERDICT="$LOG_DIR/$RUN_ID-review.log"
git diff "origin/$BASE_BRANCH...origin/$WORK_BRANCH" > "$LOG_DIR/$RUN_ID.diff"

# A non-empty exit status is not enough: Claude can occasionally return exit 0 with no text for
# a long review. Ask for schema-validated JSON, keep stdout/stderr artifacts, and retry only
# transport/format failures. A real FAIL is recorded once and is never retried into a PASS.
REVIEW_JSON="$LOG_DIR/$RUN_ID-review.json"
REVIEW_STDERR="$LOG_DIR/$RUN_ID-review.stderr.log"
REVIEW_SCHEMA='{"type":"object","properties":{"verdict":{"type":"string","enum":["PASS","FAIL"]},"reason":{"type":"string","minLength":1}},"required":["verdict","reason"],"additionalProperties":false}'
REVIEW_PROMPT="You are acting as the Architecture Review / orchestration role reviewing a PR \
produced by an execution agent for the NextShift OS project. Read the complete task brief from \
$TASK_BRIEF and the complete produced diff from $LOG_DIR/$RUN_ID.diff yourself; do not rely on a \
summary. Check whether the diff satisfies the brief, touches anything out of scope, or contains \
correctness issues visible from the diff. Return JSON matching the supplied schema. verdict must \
be PASS only when the diff is acceptable; otherwise use FAIL. reason must state the key evidence \
or blocking issue."
REVIEW_RECEIVED=false

for attempt in 1 2 3; do
  if $CLAUDE_REVIEW_CMD --json-schema "$REVIEW_SCHEMA" "$REVIEW_PROMPT" \
    > "$REVIEW_JSON" 2> "$REVIEW_STDERR"; then
    if jq -e '
      .type == "result" and
      .subtype == "success" and
      (.structured_output.verdict == "PASS" or .structured_output.verdict == "FAIL") and
      (.structured_output.reason | type == "string" and length > 0)
    ' "$REVIEW_JSON" >/dev/null; then
      jq -r '[.structured_output.reason, "VERDICT=" + .structured_output.verdict] | join("\n")' \
        "$REVIEW_JSON" > "$REVIEW_VERDICT"
      REVIEW_RECEIVED=true
      break
    fi
  fi

  if (( attempt < 3 )); then
    log "Architecture review attempt $attempt returned no valid structured verdict; retrying."
    sleep 2
  fi
done

[[ "$REVIEW_RECEIVED" == true ]] \
  || abort "architecture review returned no valid structured verdict after 3 attempts — see $REVIEW_JSON and $REVIEW_STDERR; PR left open: $PR_URL"

if ! grep -q '^VERDICT=PASS$' "$REVIEW_VERDICT"; then
  block_current_item "Step 4 architecture review" "review verdict was FAIL"
  abort "architecture review did not PASS — see $REVIEW_VERDICT, PR left open for manual handling: $PR_URL"
fi

log "Architecture review PASS."

# ============================================================================
# Step 5 — merge
# ============================================================================

log "Step 5: merging $PR_URL into $BASE_BRANCH"

if is_ci_exempt_diff; then
  log "docs-only diff, CI intentionally skipped; proceeding on local verification + review PASS"
else
  log "Waiting up to $PR_CHECKS_TIMEOUT_SECONDS seconds for GitHub checks to pass."
  if wait_for_pr_checks "$PR_URL"; then
    log "GitHub checks passed."
  else
    CHECKS_STATUS=$?
    if [[ "$CHECKS_STATUS" -eq 125 ]]; then
      abort "GitHub checks were not registered after $PR_CHECKS_REGISTRATION_TIMEOUT_SECONDS seconds; PR left open: $PR_URL"
    fi
    if [[ "$CHECKS_STATUS" -eq 124 ]]; then
      abort "GitHub checks timed out after $PR_CHECKS_TIMEOUT_SECONDS seconds; PR left open: $PR_URL"
    fi
    abort "GitHub checks failed; PR left open: $PR_URL"
  fi
fi

PR_IS_DRAFT="$(gh pr view "$PR_URL" --json isDraft --jq '.isDraft')" \
  || abort "could not determine whether PR is a draft: $PR_URL"
if [[ "$PR_IS_DRAFT" == "true" ]]; then
  log "PR is Draft — marking it ready for review before merge"
  gh pr ready "$PR_URL" || abort "could not mark PR ready for review: $PR_URL"
fi

gh pr merge "$PR_URL" --merge --delete-branch || abort "gh pr merge failed"

git pull --ff-only

# ============================================================================
# Step 5.5 — mark the merged blueprint item complete
# ============================================================================

log "Step 5.5: marking $CURRENT_ITEM complete in the blueprint"

BLUEPRINT_MARK_OUTPUT="$LOG_DIR/$RUN_ID-blueprint-mark.log"
$CLAUDE_CMD "Read the task brief at $TASK_BRIEF and the active blueprint at $BLUEPRINT_PATH. \
The just-merged workstream item is exactly $CURRENT_ITEM. Directly edit ONLY the row/list entry \
for $CURRENT_ITEM in $BLUEPRINT_PATH to mark it 已完成/completed, preserving the blueprint's \
existing table/list format and recording the shipped outcome. Do not edit any other file, do not \
mark any other item, and do not change release criteria. Output exactly BLUEPRINT_UPDATED=$CURRENT_ITEM." \
  > "$BLUEPRINT_MARK_OUTPUT"

BLUEPRINT_CHANGED_FILES="$(git diff --name-only)"
[[ "$BLUEPRINT_CHANGED_FILES" == "$BLUEPRINT_PATH" ]] \
  || abort "Blueprint marker changed an unexpected file or no file; refusing to commit: $BLUEPRINT_CHANGED_FILES"

git add "$BLUEPRINT_PATH"
git commit -m "docs(blueprint): mark $CURRENT_ITEM completed [pipeline]"

FIRST_OPEN_AFTER_MARK="$(first_open_blueprint_item)"
if [[ "$FIRST_OPEN_AFTER_MARK" == "$CURRENT_ITEM" ]] || ! grep -q "已完成\|[Cc]ompleted" <(git show "HEAD:$BLUEPRINT_PATH" | awk -v item="$CURRENT_ITEM" -F'|' '$2 ~ item { print }'); then
  abort "Blueprint completion guard failed for $CURRENT_ITEM: it is still the first open item or was not marked completed"
fi

git push origin "$BASE_BRANCH"
log "Blueprint marks $CURRENT_ITEM complete; next open item is ${FIRST_OPEN_AFTER_MARK:-none}."

# ============================================================================
# Step 6 — periodic code-level audit
# ============================================================================

MERGED_SINCE_LAST_AUDIT_FILE="$LOG_DIR/.merged-since-audit-count"
COUNT=0
[[ -f "$MERGED_SINCE_LAST_AUDIT_FILE" ]] && COUNT="$(cat "$MERGED_SINCE_LAST_AUDIT_FILE")"
COUNT=$((COUNT + 1))
echo "$COUNT" > "$MERGED_SINCE_LAST_AUDIT_FILE"

if (( COUNT >= AUDIT_EVERY_N_PRS )); then
  log "Step 6: $COUNT PRs merged since last audit (threshold $AUDIT_EVERY_N_PRS) — running code-level audit"

  AUDIT_REPORT="audit/PIPELINE_AUDIT_$RUN_ID.md"
  AUDIT_RUN_LOG="$LOG_DIR/$RUN_ID-audit-run.log"
  AUDIT_JSON="$LOG_DIR/$RUN_ID-audit.json"
  AUDIT_STDERR="$LOG_DIR/$RUN_ID-audit.stderr.log"
  AUDIT_SCHEMA='{"type":"object","properties":{"verdict":{"type":"string","enum":["PASS","PASS_WITH_CONDITION","FAIL"]},"reason":{"type":"string","minLength":1}},"required":["verdict","reason"],"additionalProperties":false}'
  AUDIT_PROMPT="You are acting as the code-level Audit Engineer role for the NextShift OS project \
(the 'Claude Code' role in this project's triangle workflow). Audit the current state of \
$BASE_BRANCH against $BLUEPRINT_PATH's stated requirements. Run real verification: type-check, \
test, build, lint, and grep-verify claims — do not take prior PR descriptions at face value. Write \
a complete audit report to $AUDIT_REPORT in this repo following the existing style of files under \
audit/ (see audit/README.md and any prior OS3*_R*_CODE_REVIEW_REPORT.md for format). Return JSON \
matching the supplied schema. verdict must be PASS, PASS_WITH_CONDITION, or FAIL; reason must state \
the key evidence or blocking issue."
  AUDIT_RECEIVED=false

  for attempt in 1 2 3; do
    if $CLAUDE_AUDIT_CMD --json-schema "$AUDIT_SCHEMA" "$AUDIT_PROMPT" \
      > "$AUDIT_JSON" 2> "$AUDIT_STDERR"; then
      if jq -e '
        .type == "result" and
        .subtype == "success" and
        (.structured_output.verdict == "PASS" or .structured_output.verdict == "PASS_WITH_CONDITION" or .structured_output.verdict == "FAIL") and
        (.structured_output.reason | type == "string" and length > 0)
      ' "$AUDIT_JSON" >/dev/null && [[ -s "$AUDIT_REPORT" ]]; then
        jq -r '[.structured_output.reason, "VERDICT=" + .structured_output.verdict] | join("\n")' \
          "$AUDIT_JSON" > "$AUDIT_RUN_LOG"
        AUDIT_RECEIVED=true
        break
      fi
    fi

    if (( attempt < 3 )); then
      log "Audit attempt $attempt returned no valid structured verdict or report; retrying."
      sleep 2
    fi
  done

  if [[ "$AUDIT_RECEIVED" != true ]]; then
    printf 'AUDIT_ERROR=No valid structured verdict and report after 3 attempts.\n' > "$AUDIT_RUN_LOG"
  fi

  if [[ "$AUDIT_RECEIVED" == true && -s "$AUDIT_REPORT" ]]; then
    git add "$AUDIT_REPORT"
    git commit -m "docs(audit): pipeline audit report $RUN_ID [pipeline]"
    git push origin "$BASE_BRANCH"
    log "Step 6: committed and pushed $AUDIT_REPORT"
  fi

  if [[ "$AUDIT_RECEIVED" == true ]] && grep -q '^VERDICT=PASS$' "$AUDIT_RUN_LOG"; then
    echo 0 > "$MERGED_SINCE_LAST_AUDIT_FILE"
    log "Audit PASS (plain, no conditions) — flagging ready for RC stage."
    touch "$LOG_DIR/.ready-for-rc"
  else
    log "Audit did not come back as a plain PASS — see $LOG_DIR/$RUN_ID-audit-run.log and $AUDIT_REPORT. \
Not proceeding to RC this cycle; the pipeline will keep executing blueprint items but will not \
attempt RC/main/tag until a plain PASS is recorded."
    rm -f "$LOG_DIR/.ready-for-rc"
  fi
else
  log "Step 6: $COUNT/$AUDIT_EVERY_N_PRS PRs merged since last audit — skipping audit this cycle."
fi

# ============================================================================
# Step 7 — RC / main / tag (only if: audit says ready AND blueprint has no open items left)
# ============================================================================

if [[ -f "$LOG_DIR/.ready-for-rc" && "$DISABLE_RC_TAG" != "true" ]]; then
  REMAINING_CHECK="$LOG_DIR/$RUN_ID-remaining.log"
  $CLAUDE_CMD "Read $BLUEPRINT_PATH in the current repo. Is every workstream item marked \
已完成/completed? Answer with exactly one line: ALL_DONE=YES or ALL_DONE=NO." > "$REMAINING_CHECK"

  if grep -q '^ALL_DONE=YES$' "$REMAINING_CHECK"; then
    log "Step 7: blueprint fully complete and last audit was a plain PASS — proceeding to RC/main/tag"

    VERSION="$($CLAUDE_CMD "Read $BLUEPRINT_PATH's title/version fields in this repo and output \
exactly the recommended release tag in the form vX.Y.Z, nothing else.")"

    git checkout "$MAIN_BRANCH"
    git pull --ff-only
    git merge --ff-only "$BASE_BRANCH" || abort "main is not a fast-forward from $BASE_BRANCH — needs manual resolution, not attempting a merge commit unattended"
    git push origin "$MAIN_BRANCH"

    git tag -a "$VERSION" -m "Automated pipeline release $VERSION"
    git push origin "$VERSION"

    rm -f "$LOG_DIR/.ready-for-rc"
    log "Tagged and pushed $VERSION. Merging main triggers the existing deploy.yml pipeline (image build). Proceeding to Step 8 for flag reveal + deploy verification."
    echo "$VERSION" > "$LOG_DIR/.fresh-tag"
  else
    log "Step 7: audit was PASS but blueprint still has open items (unlikely but checked) — continuing normal cycles."
  fi
elif [[ -f "$LOG_DIR/.ready-for-rc" ]]; then
  log "Step 7: RC/tag disabled by DISABLE_RC_TAG — cycle stops after audit."
fi

# ============================================================================
# Step 8 — VPS flag reveal + deploy verification (only after a fresh tag this run)
# ============================================================================

if [[ -f "$LOG_DIR/.fresh-tag" ]]; then
  VERSION="$(cat "$LOG_DIR/.fresh-tag")"
  log "Step 8: fresh tag $VERSION detected — proceeding with VPS flag reveal + deploy verification"

  EXPECTED_COMMIT="$(git rev-parse "$MAIN_BRANCH")"

  # --- 8a: ask Claude which flags this release intends to reveal --------------
  FLAG_PLAN="$LOG_DIR/$RUN_ID-flag-plan.log"
  $CLAUDE_CMD "Read $BLUEPRINT_PATH in the current repo (already checked out at $MAIN_BRANCH, tag \
$VERSION). Identify any NEXT_PUBLIC_ENABLE_*/PROD_NEXT_PUBLIC_ENABLE_* runtime flags this release \
is described as intending to reveal/graduate to users (look for lifecycleStatus 'graduated' \
entries in src/lib/runtime-flags.ts and cross-reference the blueprint's stated intent for this \
release). Output ONLY lines of the exact form FLAG=<NAME>=true, one per flag to reveal. If no \
flags should change this release, output exactly NO_FLAG_CHANGES and nothing else." \
    > "$FLAG_PLAN"

  # --- 8b: backup + edit .env.production over SSH, restart, smoke-test --------
  if grep -q '^NO_FLAG_CHANGES$' "$FLAG_PLAN"; then
    log "Step 8: no flag changes for this release — deploy verification only (image already updated by deploy.yml)."
    FLAG_SET_CMDS=""
  else
    FLAG_SET_CMDS="$(grep '^FLAG=' "$FLAG_PLAN" | sed 's/^FLAG=//')"
    [[ -n "$FLAG_SET_CMDS" ]] || abort "flag plan produced neither NO_FLAG_CHANGES nor any FLAG= lines — see $FLAG_PLAN, not touching the VPS"
    log "Step 8: revealing flags this release: $(echo "$FLAG_SET_CMDS" | tr '\n' ' ')"
  fi

  REMOTE_BACKUP=".env.production.bak.$RUN_ID"

  ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "cp '$VPS_ENV_FILE' '$VPS_APP_DIR/$REMOTE_BACKUP'" \
    || abort "could not back up $VPS_ENV_FILE on VPS — aborting before touching anything"
  log "Step 8: backed up remote env to $VPS_APP_DIR/$REMOTE_BACKUP"

  if [[ -n "$FLAG_SET_CMDS" ]]; then
    while IFS='=' read -r FLAG_NAME FLAG_VALUE; do
      [[ -n "$FLAG_NAME" ]] || continue
      ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" \
        "grep -q '^${FLAG_NAME}=' '$VPS_ENV_FILE' && sed -i 's|^${FLAG_NAME}=.*|${FLAG_NAME}=${FLAG_VALUE}|' '$VPS_ENV_FILE' || echo '${FLAG_NAME}=${FLAG_VALUE}' >> '$VPS_ENV_FILE'" \
        || abort "failed setting $FLAG_NAME on VPS — restore manually from $VPS_APP_DIR/$REMOTE_BACKUP"
    done <<< "$FLAG_SET_CMDS"
  fi

  log "Step 8: restarting app container"
  ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" \
    "cd '$VPS_APP_DIR' && docker compose --env-file .env.production -f '$VPS_COMPOSE_FILE' up -d --no-build app" \
    || {
      log "Step 8: container restart command failed — rolling back env file"
      ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "cp '$VPS_APP_DIR/$REMOTE_BACKUP' '$VPS_ENV_FILE' && cd '$VPS_APP_DIR' && docker compose --env-file .env.production -f '$VPS_COMPOSE_FILE' up -d --no-build app"
      abort "restart failed, env rolled back to pre-deploy state — code/tag NOT rolled back, investigate by hand"
    }

  log "Step 8: waiting for container to settle before smoke test"
  sleep 15

  # --- 8c: smoke test — health endpoint + version endpoint (cache-busted) -----
  SMOKE_OK=1
  HEALTH_STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$VPS_APP_URL/api/health" || echo 000)"
  [[ "$HEALTH_STATUS" == "200" ]] || SMOKE_OK=0

  VERSION_BODY="$(curl -s --max-time 15 "$VPS_APP_URL/api/v1/version?cb=$RUN_ID" || echo '')"
  if [[ -n "$EXPECTED_COMMIT" ]] && ! grep -q "$EXPECTED_COMMIT" <<< "$VERSION_BODY"; then
    SMOKE_OK=0
  fi

  if [[ "$SMOKE_OK" == "1" ]]; then
    log "Step 8: smoke test PASS (health=$HEALTH_STATUS, version endpoint confirms commit $EXPECTED_COMMIT). Deploy + flag reveal complete for $VERSION."
    ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "rm -f '$VPS_APP_DIR/$REMOTE_BACKUP'" || true
  else
    log "Step 8: SMOKE TEST FAILED (health=$HEALTH_STATUS) — rolling back env file only (not the code/tag) and restarting"
    ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" \
      "cp '$VPS_APP_DIR/$REMOTE_BACKUP' '$VPS_ENV_FILE' && cd '$VPS_APP_DIR' && docker compose --env-file .env.production -f '$VPS_COMPOSE_FILE' up -d --no-build app"
    abort "smoke test failed after deploying $VERSION — env rolled back to pre-reveal state, container restarted on old env, backup preserved at $VPS_APP_DIR/$REMOTE_BACKUP. Tag $VERSION and the merge to main are NOT rolled back — investigate the deploy itself by hand."
  fi

  rm -f "$LOG_DIR/.fresh-tag"
fi

log "Cycle complete."
