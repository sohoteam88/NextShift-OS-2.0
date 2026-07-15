#!/usr/bin/env bash
# Validate the OS 3.8 pipeline manifest before any state read or write.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_PATH="${MANIFEST_PATH:-$SCRIPT_DIR/../../docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json}"

if [[ "${1:-}" == "--manifest" ]]; then
  MANIFEST_PATH="${2:?--manifest requires a path}"
fi

command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required" >&2; exit 1; }
[[ -f "$MANIFEST_PATH" ]] || { echo "ERROR: manifest not found: $MANIFEST_PATH" >&2; exit 1; }
jq empty "$MANIFEST_PATH" || { echo "ERROR: invalid JSON manifest" >&2; exit 1; }

jq -e '
  .schema_version == 1 and
  (.release | type == "string" and length > 0) and
  (.base_branch | type == "string" and length > 0) and
  (.main_branch | type == "string" and length > 0) and
  (.execution_policy.auto_release == false) and
  (.execution_policy.auto_deploy == false) and
  (.execution_policy.max_architecture_remediation_attempts | type == "number" and . >= 1) and
  (.waves | type == "array" and length > 0) and
  (.final_audit.status | IN("pending", "running", "pass", "fail")) and
  (.release_gate.status == "blocked")
' "$MANIFEST_PATH" >/dev/null || {
  echo "ERROR: manifest has an invalid top-level policy or release gate" >&2
  exit 1
}

ids="$(jq -r '.waves[] | .tasks[]?.id, .checkpoint.id, .human_gate?.id // empty' "$MANIFEST_PATH" | sed '/^$/d')"
if [[ -n "$ids" ]] && [[ "$(printf '%s\n' "$ids" | sort | uniq -d)" ]]; then
  echo "ERROR: manifest contains duplicate task, checkpoint, or gate IDs" >&2
  exit 1
fi

jq -e '
  def task_status: IN("pending", "running", "completed", "blocked", "superseded");
  def checkpoint_status: IN("pending", "awaiting_review", "changes_requested", "needs_human", "passed");
  all(.waves[];
    (.tasks | type == "array") and
    all(.tasks[]; (.id | type == "string" and length > 0) and (.status | task_status)) and
    (.checkpoint.id | type == "string" and length > 0) and (.checkpoint.status | checkpoint_status) and
    (if .human_gate then (.human_gate.status | IN("pending", "approved", "rejected")) else true end)
  )
' "$MANIFEST_PATH" >/dev/null || {
  echo "ERROR: manifest contains an invalid wave state" >&2
  exit 1
}

all_ids="$(jq -r '[.waves[] | .tasks[]?.id, .checkpoint.id, .human_gate?.id] | .[]? // empty' "$MANIFEST_PATH" | sort -u)"
while IFS= read -r dependency; do
  [[ -z "$dependency" ]] && continue
  if ! grep -Fxq "$dependency" <<<"$all_ids"; then
    echo "ERROR: dependency references unknown ID: $dependency" >&2
    exit 1
  fi
done < <(jq -r '.waves[] | .tasks[]?.depends_on[]?' "$MANIFEST_PATH")

echo "manifest valid: $MANIFEST_PATH"
