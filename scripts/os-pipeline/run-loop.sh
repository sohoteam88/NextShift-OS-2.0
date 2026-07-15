#!/usr/bin/env bash
# Bounded operator loop for the manifest runner. Product dispatch remains opt-in.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/run-pipeline.sh"
LOG_DIR="${LOG_DIR:-$SCRIPT_DIR/logs}"
STOP_FILE="${STOP_FILE:-$LOG_DIR/STOP}"
LOCK_DIR="$LOG_DIR/.loop.lock"
MAX_CYCLES_PER_DAY="${MAX_CYCLES_PER_DAY:-3}"
SLEEP_SECONDS="${SLEEP_SECONDS:-600}"

mkdir -p "$LOG_DIR"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then echo "ABORT: another pipeline loop holds $LOCK_DIR" >&2; exit 1; fi
trap 'rmdir "$LOCK_DIR"' EXIT

notify() { [[ -n "${NOTIFY_WEBHOOK:-}" ]] && curl --fail --silent --show-error -X POST -d "$1" "$NOTIFY_WEBHOOK" >/dev/null || true; }
today="$(date +%F)"
cycles="$(find "$LOG_DIR" -maxdepth 1 -type f -name "${today}-loop-*.result" 2>/dev/null | wc -l | tr -d ' ')"
(( cycles < MAX_CYCLES_PER_DAY )) || { echo "ABORT: daily cycle limit reached" >&2; exit 1; }

aborts=0
while (( cycles < MAX_CYCLES_PER_DAY )); do
  [[ ! -e "$STOP_FILE" ]] || { echo "STOP file found; exiting gracefully"; exit 0; }
  stamp="$(date +%F)-loop-$(date +%H%M%S)"; result="$LOG_DIR/$stamp.result"
  if PIPELINE_ALLOW_PRODUCT_DISPATCH="${PIPELINE_ALLOW_PRODUCT_DISPATCH:-0}" "$RUNNER" --dispatch >"$result" 2>&1; then
    echo "OK" >>"$result"; notify "OS 3.8 pipeline loop OK: $stamp"; aborts=0
  else
    echo "ABORT" >>"$result"; notify "OS 3.8 pipeline loop ABORT: $stamp"; aborts=$((aborts + 1))
    (( aborts < 2 )) || { echo "ABORT: two consecutive failures; waiting for a human" >&2; exit 1; }
  fi
  cycles=$((cycles + 1)); (( cycles < MAX_CYCLES_PER_DAY )) && sleep "$SLEEP_SECONDS"
done
