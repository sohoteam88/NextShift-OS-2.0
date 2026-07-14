#!/usr/bin/env bash
#
# Bounded unattended wrapper for run-pipeline.sh.
# It deliberately starts only a small number of detached single cycles each day. A failed cycle
# is never retried indefinitely: two consecutive aborts stop the loop and leave the logs intact.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_SCRIPT="$SCRIPT_DIR/run-pipeline.sh"
LOG_DIR="${LOG_DIR:-$SCRIPT_DIR/logs}"
LOCK_FILE="$SCRIPT_DIR/.loop.lock"
STOP_FILE="$LOG_DIR/STOP"
MAX_CYCLES_PER_DAY="${MAX_CYCLES_PER_DAY:-3}"
SLEEP_SECONDS="${SLEEP_SECONDS:-600}"
ABORT_BACKOFF_SECONDS="${ABORT_BACKOFF_SECONDS:-$SLEEP_SECONDS}"
NOTIFY_WEBHOOK="${NOTIFY_WEBHOOK:-}"

mkdir -p "$LOG_DIR"

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$1"; }

notify() {
  local message="$1"
  [[ -n "$NOTIFY_WEBHOOK" ]] || return 0
  if ! curl -fsS -X POST -d "$message" "$NOTIFY_WEBHOOK" >/dev/null; then
    log "WARN: notification webhook failed; continuing without retry"
  fi
}

daily_cycle_count() {
  local today="$1"
  find "$LOG_DIR" -maxdepth 1 -type f -name "${today}-*.log" -print \
    | sed -nE "\\|/${today}-[0-9]{6}\\.log$|p" \
    | wc -l \
    | tr -d '[:space:]'
}

cycle_reason() {
  local log_file="$1"
  grep 'ABORT:' "$log_file" 2>/dev/null | tail -1 | sed 's/^.*ABORT: //' || true
}

command -v flock >/dev/null 2>&1 \
  || { printf 'ABORT: flock is required for loop locking. Install it before running this script.\n' >&2; exit 1; }

exec 9>"$LOCK_FILE"
flock -n 9 || { printf 'ABORT: another pipeline loop already holds %s\n' "$LOCK_FILE" >&2; exit 1; }

consecutive_aborts=0

while true; do
  if [[ -e "$STOP_FILE" ]]; then
    log "STOP file detected at $STOP_FILE; exiting before starting another cycle."
    notify "OK pipeline loop stopped by STOP file"
    exit 0
  fi

  today="$(date +%Y%m%d)"
  cycles_today="$(daily_cycle_count "$today")"
  if (( cycles_today >= MAX_CYCLES_PER_DAY )); then
    log "Daily limit reached: $cycles_today/$MAX_CYCLES_PER_DAY cycles for $today."
    notify "OK pipeline loop stopped: daily limit ${cycles_today}/${MAX_CYCLES_PER_DAY}"
    exit 0
  fi

  run_id="$(date +%Y%m%d-%H%M%S)"
  run_log="$LOG_DIR/$run_id.log"
  exit_file="$LOG_DIR/$run_id-exit-code"
  log "Starting pipeline cycle $run_id ($((cycles_today + 1))/$MAX_CYCLES_PER_DAY today)."

  if ! RUN_ID="$run_id" LOG_DIR="$LOG_DIR" "$PIPELINE_SCRIPT"; then
    result=1
    reason="pipeline launcher failed before detached cycle started"
  else
    while [[ ! -f "$exit_file" ]]; do
      sleep 5
    done
    result="$(cat "$exit_file")"
    reason="$(cycle_reason "$run_log")"
    [[ -n "$reason" ]] || reason="cycle completed"
  fi

  if [[ "$result" == "0" ]]; then
    consecutive_aborts=0
    log "Cycle $run_id finished OK: $reason"
    notify "OK pipeline cycle $run_id: $reason"
    sleep "$SLEEP_SECONDS"
    continue
  fi

  consecutive_aborts=$((consecutive_aborts + 1))
  log "Cycle $run_id ABORT ($consecutive_aborts consecutive): $reason"
  notify "ABORT pipeline cycle $run_id: $reason"

  if (( consecutive_aborts >= 2 )); then
    log "NEEDS_HUMAN: two consecutive pipeline aborts; loop is stopping without another retry."
    notify "ABORT pipeline loop stopped: two consecutive aborts need human review"
    exit 1
  fi

  log "Backing off for $ABORT_BACKOFF_SECONDS seconds before the next cycle."
  sleep "$ABORT_BACKOFF_SECONDS"
done
