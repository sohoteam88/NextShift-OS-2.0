#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PIPELINE="$PIPELINE_DIR/run-pipeline.sh"
VALIDATOR="$PIPELINE_DIR/validate-manifest.sh"
SOURCE_MANIFEST="$PIPELINE_DIR/../../docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
TMP_DIR="$(mktemp -d)"
REPO="$TMP_DIR/repo"
BIN="$TMP_DIR/bin"
MANIFEST="$REPO/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
META="$TMP_DIR/meta.json"
FILES="$TMP_DIR/files.json"
CHECKS="$TMP_DIR/checks.json"
PR_URL="https://github.com/sohoteam88/NextShift-OS-2.0/pull/84"
EXPECTED_REPO="sohoteam88/NextShift-OS-2.0"
pass=0
trap 'rm -rf "$TMP_DIR"' EXIT

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
pass_fixture() { pass=$((pass + 1)); printf 'PASS: %s\n' "$1"; }

mkdir -p "$REPO/.github/workflows" "$REPO/docs/nextshift-os-3/os-3-8" "$BIN"
cp "$SOURCE_MANIFEST" "$MANIFEST"
jq '
  .waves |= map(if .id == "W3" then
    .tasks |= map(select(.id != "U3A" and .id != "U3ADR" and .id != "U3B")) |
    .tasks |= map(if .id == "E3A" then .depends_on = ["U3"] else . end)
  else . end)
' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"
cat >"$REPO/.github/workflows/ci.yml" <<'EOF'
name: CI
on:
  pull_request:
    branches: [main, 'planning/**']
    paths-ignore:
      - 'docs/**'
      - 'audit/**'
      - '**/*.md'
      - 'platform/status.md'
  push:
    branches: [main]
EOF
git -C "$REPO" init -q
git -C "$REPO" config user.name fixture
git -C "$REPO" config user.email fixture@example.com
git -C "$REPO" add .
git -C "$REPO" commit -qm base
BASE_SHA="$(git -C "$REPO" rev-parse HEAD)"
printf 'head\n' >"$REPO/README.md"
git -C "$REPO" add README.md
git -C "$REPO" commit -qm head
HEAD_SHA="$(git -C "$REPO" rev-parse HEAD)"

cat >"$BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
[[ "${1:-}" == api ]] || { echo "unsupported fake gh command: $*" >&2; exit 2; }
endpoint="${!#}"
case "$endpoint" in
  repos/*/pulls/84/files\?per_page=100) cat "${FIXTURE_FILES:?}" ;;
  repos/*/commits/*/check-runs\?per_page=100) cat "${FIXTURE_CHECKS:?}" ;;
  repos/*/pulls/84)
    if [[ "${FIXTURE_MUTATE_POLICY_ON_METADATA:-0}" == "1" ]]; then
      jq '(.waves[].tasks[] | select(.id == "U1A") | .verification_policy)="actual_checks_required"' \
        "${FIXTURE_MANIFEST:?}" >"${FIXTURE_MANIFEST:?}.tmp"
      mv "${FIXTURE_MANIFEST:?}.tmp" "${FIXTURE_MANIFEST:?}"
    fi
    cat "${FIXTURE_META:?}"
    ;;
  *) echo "unsupported fake gh endpoint: $endpoint" >&2; exit 2 ;;
esac
EOF
chmod +x "$BIN/gh"

write_meta() {
  local repo="$1" base_ref="$2" base_sha="$3" head_sha="$4" changed_count="$5"
  jq -n --arg repo "$repo" --arg base "$base_ref" --arg base_sha "$base_sha" --arg head "$head_sha" --argjson count "$changed_count" --arg url "$PR_URL" '{
    state:"open",merged:false,html_url:$url,changed_files:$count,merge_commit_sha:null,
    base:{ref:$base,sha:$base_sha,repo:{full_name:$repo}},
    head:{ref:"docs/u1a",sha:$head,repo:{full_name:$repo}},body:"fixture"
  }' >"$META"
}

write_files() {
  local files_json="$1"
  jq -n --argjson files "$files_json" '$files | map({filename:.,status:"modified"})' >"$FILES"
}

write_checks() {
  local runs_json="$1"
  jq -n --argjson runs "$runs_json" '{total_count:($runs|length),check_runs:$runs}' >"$CHECKS"
}

reset_fixture() {
  write_meta "$EXPECTED_REPO" planning/os-3.8-product-usability "$BASE_SHA" "$HEAD_SHA" 1
  write_files '["docs/fixture.md"]'
  write_checks '[]'
}

evaluate() {
  local task_id="${1:-U1A}" expected_head="${2:-$HEAD_SHA}" expected_base="${3:-$BASE_SHA}" manifest_path="${4:-$MANIFEST}"
  PATH="$BIN:$PATH" FIXTURE_META="$META" FIXTURE_FILES="$FILES" FIXTURE_CHECKS="$CHECKS" \
    PIPELINE_EXPECTED_REPOSITORY="$EXPECTED_REPO" REPO_DIR="$REPO" MANIFEST_PATH="$manifest_path" \
    "$PIPELINE" --evaluate-pr-check-requirement "$task_id" "$PR_URL" "$expected_head" "$expected_base"
}

expect_accept() {
  local name="$1" files_json="$2" output expected_blob
  reset_fixture
  write_files "$files_json"
  write_meta "$EXPECTED_REPO" planning/os-3.8-product-usability "$BASE_SHA" "$HEAD_SHA" "$(jq -r 'length' <<<"$files_json")"
  output="$(evaluate U1A)" || fail "$name was rejected"
  expected_blob="$(git -C "$REPO" rev-parse "$BASE_SHA:.github/workflows/ci.yml")"
  jq -e --arg repo "$EXPECTED_REPO" --arg pr "$PR_URL" --arg base "$BASE_SHA" --arg head "$HEAD_SHA" --arg blob "$expected_blob" --argjson files "$files_json" '
    .decision == "not_required_paths_ignored" and .task_id == "U1A" and
    .task_verification_policy == "paths_ignored_zero_checks_allowed" and
    .repository == $repo and .pr_url == $pr and
    .base_branch == "planning/os-3.8-product-usability" and .base_sha == $base and .head_sha == $head and
    .workflow_path == ".github/workflows/ci.yml" and .workflow_blob_sha == $blob and
    .changed_files == $files and .github_check_runs == 0 and .ignored_paths_verified == true
  ' <<<"$output" >/dev/null || fail "$name evidence is incomplete"
  pass_fixture "$name"
}

expect_reject() {
  local name="$1"
  if evaluate U1A >/dev/null 2>&1; then fail "$name was accepted"; fi
  pass_fixture "$name"
}

expect_task_accept() {
  local name="$1" task_id="$2" output
  reset_fixture
  output="$(evaluate "$task_id")" || fail "$name was rejected"
  jq -e --arg task_id "$task_id" '.task_id == $task_id and .task_verification_policy == "paths_ignored_zero_checks_allowed"' <<<"$output" >/dev/null || fail "$name evidence is not task-bound"
  pass_fixture "$name"
}

expect_task_reject() {
  local name="$1" task_id="$2"
  reset_fixture
  if evaluate "$task_id" >/dev/null 2>&1; then fail "$name was accepted"; fi
  pass_fixture "$name"
}

expect_accept docs_only_zero_checks_accepted '["docs/guide.txt"]'
expect_accept audit_only_zero_checks_accepted '["audit/round.json"]'
expect_accept root_markdown_zero_checks_accepted '["README.md"]'
expect_accept platform_status_zero_checks_accepted '["platform/status.md"]'

reset_fixture
write_files '["src/app/page.tsx"]'
expect_reject source_file_zero_checks_rejected

reset_fixture
write_files '["docs/guide.md","src/app/page.tsx"]'
write_meta "$EXPECTED_REPO" planning/os-3.8-product-usability "$BASE_SHA" "$HEAD_SHA" 2
expect_reject mixed_docs_and_source_zero_checks_rejected

awk '{ print; if ($0 == "      - '\''platform/status.md'\''") print "      - '\''extra/**'\''" }' \
  "$REPO/.github/workflows/ci.yml" >"$TMP_DIR/ci-drift.yml"
mv "$TMP_DIR/ci-drift.yml" "$REPO/.github/workflows/ci.yml"
git -C "$REPO" add .github/workflows/ci.yml
git -C "$REPO" commit -qm policy-drift
DRIFT_BASE="$(git -C "$REPO" rev-parse HEAD)"
reset_fixture
write_meta "$EXPECTED_REPO" planning/os-3.8-product-usability "$DRIFT_BASE" "$HEAD_SHA" 1
if evaluate U1A "$HEAD_SHA" "$DRIFT_BASE" >/dev/null 2>&1; then fail "zero_checks_workflow_policy_drift_rejected was accepted"; fi
pass_fixture zero_checks_workflow_policy_drift_rejected

reset_fixture
write_meta other/Repository planning/os-3.8-product-usability "$BASE_SHA" "$HEAD_SHA" 1
expect_reject zero_checks_wrong_repository_rejected

reset_fixture
write_meta "$EXPECTED_REPO" main "$BASE_SHA" "$HEAD_SHA" 1
expect_reject zero_checks_wrong_base_rejected

reset_fixture
if evaluate U1A 0123456789012345678901234567890123456789 "$BASE_SHA" >/dev/null 2>&1; then fail "zero_checks_wrong_head_rejected was accepted"; fi
pass_fixture zero_checks_wrong_head_rejected

reset_fixture
write_files '[]'
write_meta "$EXPECTED_REPO" planning/os-3.8-product-usability "$BASE_SHA" "$HEAD_SHA" 0
expect_reject zero_checks_empty_diff_rejected

reset_fixture
write_checks '[{"id":1,"status":"completed","conclusion":"failure"}]'
expect_reject existing_failed_check_cannot_use_exemption

reset_fixture
write_checks '[{"id":2,"status":"in_progress","conclusion":null}]'
expect_reject existing_pending_check_cannot_use_exemption

reset_fixture
write_files '["src/untrusted.ts"]'
PIPELINE_CHANGED_FILES_JSON="$(jq -cn '$ARGS.positional' --args 'docs/caller-lie.md')"
export PIPELINE_CHANGED_FILES_JSON
expect_reject caller_supplied_changed_files_not_trusted
unset PIPELINE_CHANGED_FILES_JSON

reset_fixture
MARKER="$TMP_DIR/injection-marker"
malicious="docs/\$(touch $MARKER);quote'proof.md"
write_files "$(jq -cn --arg path "$malicious" '[$path]')"
output="$(evaluate U1A)" || fail "path_metacharacter_no_execution rejected safely quoted data"
[[ ! -e "$MARKER" ]] || fail "path_metacharacter_no_execution created a marker"
jq -e --arg path "$malicious" '.changed_files == [$path]' <<<"$output" >/dev/null || fail "path_metacharacter_no_execution corrupted the path"
pass_fixture path_metacharacter_no_execution

reset_fixture
VALID_EVIDENCE="$(evaluate U1A)" || fail "cannot create validator fixture evidence"
VALID_VERIFICATION="$(jq -n --argjson checks "$VALID_EVIDENCE" --arg repo "$EXPECTED_REPO" --arg pr "$PR_URL" --arg head "$HEAD_SHA" '{
  status:"passed",task_id:"U1A",task_verification_policy:"paths_ignored_zero_checks_allowed",
  repository:$repo,base_branch:"planning/os-3.8-product-usability",task_branch:"docs/u1a",pr_url:$pr,
  verified_head_sha:$head,implementation_report:"docs/report.md",dispatch_artifact:"docs/nextshift-os-3/os-3-8/runs/U1A_DISPATCH.json",
  report_exists_at_exact_head:true,report_in_pr_diff:true,checks:"not_required_paths_ignored",
  checks_evidence:$checks,verified_at:$checks.verified_at
}')"
VALID_COMPLETION="$(jq -n --argjson verification "$VALID_VERIFICATION" --arg pr "$PR_URL" --arg head "$HEAD_SHA" '{
  pr_url:$pr,merge_sha:"0123456789012345678901234567890123456789",implementation_report:"docs/report.md",
  verification:$verification,validation:{checks:"not_required_paths_ignored",head_sha:$head,checks_evidence:$verification.checks_evidence},
  recovered:false,merged_at:"2026-07-16T03:00:00Z"
}')"
jq --argjson verification "$VALID_VERIFICATION" --argjson evidence "$VALID_COMPLETION" --arg start "$BASE_SHA" '
  .waves |= map(if .id == "W2" then
    .status="running" | .start_sha=$start |
    .tasks |= map(if .id == "U1A" then .status="completed" | .verification=$verification | .evidence=$evidence else . end)
  else . end)
' "$MANIFEST" >"$TMP_DIR/valid-zero-check-manifest.json"
"$VALIDATOR" --manifest "$TMP_DIR/valid-zero-check-manifest.json" >/dev/null || fail "valid structured exemption was rejected"

jq 'del(.waves[] | .tasks[] | select(.id == "U1A") | .verification.checks_evidence)' "$TMP_DIR/valid-zero-check-manifest.json" >"$TMP_DIR/missing-evidence.json"
if "$VALIDATOR" --manifest "$TMP_DIR/missing-evidence.json" >/dev/null 2>&1; then fail "validator_missing_checks_evidence_rejected was accepted"; fi
pass_fixture validator_missing_checks_evidence_rejected

jq '.waves[] | .tasks[] | select(.id == "U1A") | .evidence.validation.checks_evidence.head_sha="ffffffffffffffffffffffffffffffffffffffff"' "$TMP_DIR/valid-zero-check-manifest.json" >"$TMP_DIR/mismatched-evidence.json"
if "$VALIDATOR" --manifest "$TMP_DIR/mismatched-evidence.json" >/dev/null 2>&1; then fail "validator_mismatched_verification_evidence_rejected was accepted"; fi
pass_fixture validator_mismatched_verification_evidence_rejected

expect_accept exact_PR84_style_docs_only_evidence_accepted '["docs/nextshift-os-3/os-3-8/3.8-C/IMPLEMENTATION_REPORT.md","docs/nextshift-os-3/os-3-8/3.8-C/U1A_DEAD_CODE_INVENTORY.md"]'

expect_task_accept u1a_docs_only_policy_accepted U1A
expect_task_accept u2_docs_only_policy_accepted U2
expect_task_reject e1_docs_only_policy_rejected E1
expect_task_reject e2_docs_only_policy_rejected E2
expect_task_reject u1b_docs_only_policy_rejected U1B
expect_task_reject u3_docs_only_policy_rejected U3
expect_task_reject e3a_docs_only_policy_rejected E3A
expect_task_reject e3b_docs_only_policy_rejected E3B

jq 'del(.waves[].tasks[] | select(.id == "U1A") | .verification_policy)' "$MANIFEST" >"$TMP_DIR/missing-policy-manifest.json"
reset_fixture
if evaluate U1A "$HEAD_SHA" "$BASE_SHA" "$TMP_DIR/missing-policy-manifest.json" >/dev/null 2>&1; then fail "missing_task_policy_rejected was accepted"; fi
pass_fixture missing_task_policy_rejected

jq '(.waves[].tasks[] | select(.id == "U1A") | .verification_policy)="docs_only"' "$MANIFEST" >"$TMP_DIR/unknown-policy-manifest.json"
reset_fixture
if evaluate U1A "$HEAD_SHA" "$BASE_SHA" "$TMP_DIR/unknown-policy-manifest.json" >/dev/null 2>&1; then fail "unknown_task_policy_rejected was accepted"; fi
pass_fixture unknown_task_policy_rejected

jq '
  (.waves[].tasks[] | select(.id == "U1A") | .verification.checks_evidence.task_id)="U2" |
  (.waves[].tasks[] | select(.id == "U1A") | .evidence.validation.checks_evidence.task_id)="U2"
' "$TMP_DIR/valid-zero-check-manifest.json" >"$TMP_DIR/forged-task-id.json"
if "$VALIDATOR" --manifest "$TMP_DIR/forged-task-id.json" >/dev/null 2>&1; then fail "forged_task_id_rejected was accepted"; fi
pass_fixture forged_task_id_rejected

jq '
  (.waves[].tasks[] | select(.id == "U1A") | .verification.checks_evidence.task_verification_policy)="actual_checks_required" |
  (.waves[].tasks[] | select(.id == "U1A") | .evidence.validation.checks_evidence.task_verification_policy)="actual_checks_required"
' "$TMP_DIR/valid-zero-check-manifest.json" >"$TMP_DIR/mismatched-task-policy.json"
if "$VALIDATOR" --manifest "$TMP_DIR/mismatched-task-policy.json" >/dev/null 2>&1; then fail "mismatched_task_policy_rejected was accepted"; fi
pass_fixture mismatched_task_policy_rejected

jq --argjson verification "$VALID_VERIFICATION" --argjson evidence "$VALID_COMPLETION" '
  .waves |= map(if .id == "W2" then
    .tasks |= map(if .id == "U2" then .status="completed" | .verification=$verification | .evidence=$evidence else . end)
  else . end)
' "$TMP_DIR/valid-zero-check-manifest.json" >"$TMP_DIR/cross-task-evidence.json"
if "$VALIDATOR" --manifest "$TMP_DIR/cross-task-evidence.json" >/dev/null 2>&1; then fail "cross_task_evidence_rejected was accepted"; fi
pass_fixture cross_task_evidence_rejected

reset_fixture
export PIPELINE_ALLOW_PATHS_IGNORED_ZERO_CHECKS=1
if evaluate E1 >/dev/null 2>&1; then fail "caller_cannot_enable_exemption was accepted"; fi
unset PIPELINE_ALLOW_PATHS_IGNORED_ZERO_CHECKS
pass_fixture caller_cannot_enable_exemption

RECOVERY_MANIFEST="$TMP_DIR/recovery-manifest.json"
RECOVERY_DISPATCH="$REPO/docs/nextshift-os-3/os-3-8/runs/U1A_DISPATCH.json"
mkdir -p "$(dirname "$RECOVERY_DISPATCH")"
jq --argjson verification "$VALID_VERIFICATION" '
  .waves |= map(if .id == "W2" then
    .status="running" |
    .tasks |= map(if .id == "U1A" then .status="running" | .verification=$verification | .evidence=null else . end)
  else . end)
' "$TMP_DIR/valid-zero-check-manifest.json" >"$RECOVERY_MANIFEST"
jq -n --argjson verification "$VALID_VERIFICATION" --arg pr "$PR_URL" '{
  task_id:"U1A",task_branch:"docs/u1a",base_branch:"planning/os-3.8-product-usability",
  pr_url:$pr,implementation_report:"docs/report.md",verification:$verification
}' >"$RECOVERY_DISPATCH"
reset_fixture
jq '.state="closed" | .merged=true | .merge_commit_sha="0123456789012345678901234567890123456789"' "$META" >"$META.tmp" && mv "$META.tmp" "$META"
if PATH="$BIN:$PATH" FIXTURE_META="$META" FIXTURE_FILES="$FILES" FIXTURE_CHECKS="$CHECKS" \
  FIXTURE_MUTATE_POLICY_ON_METADATA=1 FIXTURE_MANIFEST="$RECOVERY_MANIFEST" \
  PIPELINE_EXPECTED_REPOSITORY="$EXPECTED_REPO" REPO_DIR="$REPO" MANIFEST_PATH="$RECOVERY_MANIFEST" \
  "$PIPELINE" --recover-task U1A >/dev/null 2>&1; then
  fail "recovery_revalidates_task_policy completed after policy changed"
fi
jq -e '.waves[].tasks[] | select(.id == "U1A") | .status == "running" and .evidence == null' "$RECOVERY_MANIFEST" >/dev/null || fail "recovery_revalidates_task_policy mutated completion state"
pass_fixture recovery_revalidates_task_policy

reset_fixture
PR84_FILES='["docs/nextshift-os-3/os-3-8/3.8-C/IMPLEMENTATION_REPORT.md","docs/nextshift-os-3/os-3-8/3.8-C/U1A_DEAD_CODE_INVENTORY.md"]'
write_files "$PR84_FILES"
write_meta "$EXPECTED_REPO" planning/os-3.8-product-usability "$BASE_SHA" "$HEAD_SHA" 2
PR84_EVIDENCE="$(evaluate U1A)" || fail "exact_PR84_U1A_evidence_accepted was rejected"
jq -e --argjson files "$PR84_FILES" '.task_id == "U1A" and .task_verification_policy == "paths_ignored_zero_checks_allowed" and .changed_files == $files' <<<"$PR84_EVIDENCE" >/dev/null || fail "exact_PR84_U1A_evidence_accepted evidence mismatch"
pass_fixture exact_PR84_U1A_evidence_accepted

[[ "$pass" == 34 ]] || fail "expected 34 named fixtures, got $pass"
printf 'docs-only CI policy integration: %s/34 fixtures passed\n' "$pass"
