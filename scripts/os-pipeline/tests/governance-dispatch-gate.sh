#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PIPELINE="$PIPELINE_DIR/run-pipeline.sh"
SOURCE_MANIFEST="$PIPELINE_DIR/../../docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
PLANNING_BRANCH="planning/os-3.8-product-usability"
ROOT="$(mktemp -d)"
trap 'if [[ "${KEEP_FIXTURES:-0}" == 1 ]]; then printf "fixtures retained: %s\n" "$ROOT"; else rm -rf "$ROOT"; fi' EXIT

pass_count=0
fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }
pass() { pass_count=$((pass_count + 1)); printf 'PASS: %s\n' "$1"; }
assert_eq() { [[ "$1" == "$2" ]] || fail "$3 (expected=$2 got=$1)"; }

write_fake_tools() {
  mkdir -p "$BIN"
  cat >"$BIN/gh" <<'GH'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$FAKE_GH_LOG"
if [[ "${1:-}" == api ]]; then
  endpoint="${*: -1}"
  case "$endpoint" in
    repos/*/pulls/99/reviews/9001)
      jq -cn --arg sha "$DECISION_SHA" '{commit_id:$sha,body:("VERDICT: PASS\nREVIEWED_SHA: " + $sha)}'
      ;;
    repos/*/pulls/99)
      jq -cn --arg repo "sohoteam88/NextShift-OS-2.0" --arg base "planning/os-3.8-product-usability" --arg base_sha "$BASE_SHA" --arg head "$DECISION_SHA" --arg merge "$DECISION_SHA" '{
        merged:true,state:"closed",html_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/99",changed_files:2,merge_commit_sha:$merge,
        base:{ref:$base,sha:$base_sha,repo:{full_name:$repo}},head:{ref:"docs/u3adr-decision",sha:$head,repo:{full_name:$repo}}
      }'
      ;;
    *) printf 'unknown fake gh api endpoint: %s\n' "$endpoint" >&2; exit 1 ;;
  esac
elif [[ "${1:-}" == pr && "${2:-}" == diff ]]; then
  printf '%s\n' 'docs/governance/U3ADR_DECISION.md' 'docs/governance/U3ADR_OPTION_C_PROOF.md'
  if [[ "${FAKE_MUTATE_GATE_ON_DIFF:-0}" == 1 && ! -e "$CONTROL/mutated" ]]; then
    jq '.approval_state="tampered"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"
    : >"$CONTROL/mutated"
  fi
  if [[ "${FAKE_ADVANCE_REMOTE_ON_DIFF:-0}" == 1 && ! -e "$CONTROL/advanced" ]]; then
    "$CONTROL/advance-remote.sh"
    : >"$CONTROL/advanced"
  fi
elif [[ "${1:-}" == pr && "${2:-}" == checks ]]; then
  exit 0
elif [[ "${1:-}" == pr && "${2:-}" == create ]]; then
  printf 'unexpected PR creation\n' >&2; exit 1
else
  printf 'unsupported fake gh command: %s\n' "$*" >&2; exit 1
fi
GH
  chmod +x "$BIN/gh"

  cat >"$CONTROL/fake-codex.sh" <<'CODEX'
#!/usr/bin/env bash
set -euo pipefail
printf 'codex\n' >>"$CODEX_COUNT"
printf '%s\n' '{"pr_url":"https://github.com/sohoteam88/NextShift-OS-2.0/pull/123","implementation_report":"docs/report.md"}' >"$PIPELINE_TASK_OUTCOME"
CODEX
  chmod +x "$CONTROL/fake-codex.sh"
}

write_gate() {
  local status="$1" option="$2" verdict="$3" reviewed="$4" approval="$5" authorized="$6" freshness="$7" decision="$8"
  local proof_digest
  proof_digest="$(git -C "$STATE" show "$DECISION_SHA:docs/governance/U3ADR_OPTION_C_PROOF.md" | shasum -a 256 | awk '{print $1}')"
  jq -n --arg status "$status" --arg option "$option" --arg verdict "$verdict" --arg reviewed "$reviewed" --arg approval "$approval" --arg freshness "$freshness" --arg decision "$decision" --arg proof_digest "$proof_digest" --argjson authorized "$authorized" '
    {
      schema_version:1,gate_id:"U3-AUDITLOG-ADR",task_id:"U3ADR",decision_artifact:"docs/governance/U3ADR_DECISION.md",
      status:$status,selected_option:(if $option == "null" then null else $option end),decision_sha:(if $decision == "null" then null else $decision end),
      architecture_review:{verdict:(if $verdict == "null" then null else $verdict end),reviewed_sha:(if $reviewed == "null" then null else $reviewed end),review_id:(if $verdict == "null" then null else 9001 end)},
      approval_state:$approval,
      freshness:{state:$freshness,verified_against_planning_sha:(if $decision == "null" then null else $decision end),protected_paths:["docs/governance/U3ADR_DECISION.md","docs/gates/U3_GATE.json","src/protected.txt"]},
      option_c_proof_artifact:"docs/governance/U3ADR_OPTION_C_PROOF.md",
      option_c_proof_sha256:$proof_digest,
      required_decisions:["platform_global_storage"],u3b_dispatch_authorized:$authorized,
      completion_contract:{allowed_selected_options:["A_OPTIONAL_TENANT_WITH_SCOPE","B_PLATFORM_AUDIT_LOG","C_NO_PLATFORM_GLOBAL_MUTATIONS"],required_status:"approved",required_review_verdict:"PASS",reviewed_sha_must_equal_decision_sha:true,required_approval_state:"approved",required_freshness_state:"fresh",option_c_requires_proof_artifact_at_reviewed_sha:true,u3b_dispatch_authorized_must_be_true:true}
    }
  ' >"$GATE"
}

configure_manifest() {
  local gate_digest="$1"
  jq --arg decision "$DECISION_SHA" --arg digest "$gate_digest" '
    def completed($source; $id; $report; $pr):
      $source |
      .id=$id | .title=("Fixture " + $id) | .status="completed" | .depends_on=(if $id == "U3A" then ["U3"] else ["U3A"] end) |
      .verification_policy="actual_checks_required" | .contract=$report | .execution_task=null |
      .verification=(.verification |
        .repository="sohoteam88/NextShift-OS-2.0" | .base_branch="planning/os-3.8-product-usability" |
        .task_branch=("fixture-" + $id) | .pr_url=$pr | .verified_head_sha=$decision |
        .implementation_report=$report | .dispatch_artifact=("docs/nextshift-os-3/os-3-8/runs/" + $id + "_DISPATCH.json") |
        .checks="passed" | del(.checks_evidence) | .verified_at="2026-07-17T00:00:00Z") |
      .verification as $verification |
      .evidence=(.evidence |
        .pr_url=$pr | .merge_sha=$decision | .implementation_report=$report |
        .verification=$verification | .validation={checks:"passed",head_sha:$decision} |
        .recovered=true | del(.merged_at) | .recovered_at="2026-07-17T00:00:00Z");
    .waves |= map(if .id == "W3" then
      (.tasks[] | select(.id == "U3")) as $u3 |
      (completed($u3;"U3A";"docs/governance/U3ADR_DECISION.md";"https://github.com/sohoteam88/NextShift-OS-2.0/pull/98")) as $u3a |
      (completed($u3;"U3ADR";"docs/governance/U3ADR_DECISION.md";"https://github.com/sohoteam88/NextShift-OS-2.0/pull/99") |
        .governance_gate={gate_id:"U3-AUDITLOG-ADR",artifact:"docs/gates/U3_GATE.json",required_status:"approved",required_verdict:"PASS",reviewed_sha_must_equal_decision_sha:true,required_freshness_state:"fresh",option_c_proof_required:true} |
        .evidence.governance_gate_digest=$digest) as $u3adr |
      {id:"U3B",verification_policy:"actual_checks_required",title:"Fixture U3B",blueprint_section:"fixture",contract:"docs/fixture.md",execution_task:null,depends_on:["U3ADR"],status:"pending",verification:null,evidence:null,
       dispatch_gate:{gate_id:"U3-AUDITLOG-ADR",task_id:"U3ADR",artifact:"docs/gates/U3_GATE.json",required_status:"approved",required_verdict:"PASS",reviewed_sha_must_equal_decision_sha:true,required_freshness_state:"fresh",option_c_proof_required:true,blocked_reason:"fixture"}} as $u3b |
      .tasks = ([.tasks[] | select(.id != "E3A" and .id != "E3B")] + [$u3a,$u3adr,$u3b] + [.tasks[] | select(.id == "E3A") | .depends_on=["U3B"]] + [.tasks[] | select(.id == "E3B")])
    else . end)
  ' "$SOURCE_MANIFEST" >"$MANIFEST"
}

commit_and_push() {
  local message="$1"
  git -C "$STATE" add -A
  git -C "$STATE" commit -m "$message" >/dev/null
  git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null
}

setup_case() {
  local name="$1"
  CASE_ROOT="$ROOT/$name"; ORIGIN="$CASE_ROOT/origin.git"; STATE="$CASE_ROOT/state"; CONTROL="$CASE_ROOT/control"; BIN="$CASE_ROOT/bin"
  MANIFEST="$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"; GATE="$STATE/docs/gates/U3_GATE.json"
  FAKE_GH_LOG="$CONTROL/gh.log"; CODEX_COUNT="$CONTROL/codex.count"
  mkdir -p "$CASE_ROOT" "$CONTROL"; git init --bare "$ORIGIN" >/dev/null
  git clone "$ORIGIN" "$STATE" >/dev/null 2>&1
  git -C "$STATE" config user.name fixture; git -C "$STATE" config user.email fixture@example.com
  git -C "$STATE" checkout -b "$PLANNING_BRANCH" >/dev/null
  mkdir -p "$(dirname "$MANIFEST")" "$STATE/docs/governance" "$STATE/docs/gates" "$STATE/src" "$STATE/.github/workflows"
  cp "$SOURCE_MANIFEST" "$MANIFEST"
  cp "$PIPELINE" "$STATE/run-pipeline.sh"; cp "$PIPELINE_DIR/validate-manifest.sh" "$STATE/validate-manifest.sh"
  chmod +x "$STATE/run-pipeline.sh" "$STATE/validate-manifest.sh"
  printf '%s\n' 'name: fixture' 'on:' '  pull_request:' '    paths-ignore:' "      - 'docs/**'" "      - 'audit/**'" "      - '**/*.md'" '      - platform/status.md' >"$STATE/.github/workflows/ci.yml"
  printf 'protected\n' >"$STATE/src/protected.txt"
  printf '# Fixture U3B contract\n' >"$STATE/docs/fixture.md"
  printf '# Reviewed U3ADR decision\n' >"$STATE/docs/governance/U3ADR_DECISION.md"
  printf 'No platform-global mutation paths exist in the reviewed inventory.\n' >"$STATE/docs/governance/U3ADR_OPTION_C_PROOF.md"
  git -C "$STATE" add -A; git -C "$STATE" commit -m base >/dev/null; BASE_SHA="$(git -C "$STATE" rev-parse HEAD)"
  printf 'reviewed decision\n' >>"$STATE/docs/governance/U3ADR_DECISION.md"
  printf 'Reviewed proof complete.\n' >>"$STATE/docs/governance/U3ADR_OPTION_C_PROOF.md"
  git -C "$STATE" add -A; git -C "$STATE" commit -m decision >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"
  write_gate approved A_OPTIONAL_TENANT_WITH_SCOPE PASS "$DECISION_SHA" approved true fresh "$DECISION_SHA"
  configure_manifest "$(shasum -a 256 "$GATE" | awk '{print $1}')"
  commit_and_push adoption
  write_fake_tools
  : >"$FAKE_GH_LOG"; : >"$CODEX_COUNT"
  cat >"$CONTROL/advance-remote.sh" <<ADVANCE
#!/usr/bin/env bash
set -euo pipefail
tmp="\$(mktemp -d)"
git clone "$ORIGIN" "\$tmp/repo" >/dev/null 2>&1
git -C "\$tmp/repo" config user.name fixture
git -C "\$tmp/repo" config user.email fixture@example.com
git -C "\$tmp/repo" checkout "$PLANNING_BRANCH" >/dev/null
printf 'advanced\n' >"\$tmp/repo/remote.txt"
git -C "\$tmp/repo" add remote.txt
git -C "\$tmp/repo" commit -m advanced >/dev/null
git -C "\$tmp/repo" push origin "$PLANNING_BRANCH" >/dev/null
rm -rf "\$tmp"
ADVANCE
  chmod +x "$CONTROL/advance-remote.sh"
}

pipeline() {
  local codex_cmd
  codex_cmd="\"$CONTROL/fake-codex.sh\""
  (
    export PATH="$BIN:$PATH" REPO_DIR="$STATE" MANIFEST_PATH="$MANIFEST"
    export PIPELINE_EXPECTED_REPOSITORY="sohoteam88/NextShift-OS-2.0" PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1
    export CONTROL_ROOT="$CONTROL/pipeline" LOG_DIR="$CONTROL/logs" FAKE_GH_LOG CODEX_COUNT CONTROL GATE BASE_SHA DECISION_SHA
    export PIPELINE_ALLOW_PRODUCT_DISPATCH=1 CODEX_CMD="$codex_cmd"
    "$STATE/run-pipeline.sh" "$@"
  )
}

update_gate_digest() {
  local digest
  digest="$(shasum -a 256 "$GATE" | awk '{print $1}')"
  jq --arg digest "$digest" '.waves |= map(.tasks |= map(if .id == "U3ADR" then .evidence.governance_gate_digest=$digest else . end))' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"
}

assert_no_side_effects() {
  local before_head="$1" before_manifest="$2" label="$3"
  assert_eq "$(wc -l <"$CODEX_COUNT" | tr -d ' ')" 0 "$label invoked Codex"
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before_head" "$label changed local planning HEAD"
  assert_eq "$(git --git-dir="$ORIGIN" show "$PLANNING_BRANCH:docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" | shasum -a 256 | awk '{print $1}')" "$before_manifest" "$label changed remote Manifest"
  [[ ! -e "$STATE/docs/nextshift-os-3/os-3-8/runs/U3B_DISPATCH.json" ]] || fail "$label wrote a dispatch artifact"
  [[ -z "$(git --git-dir="$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/chore/os-3.8-u3b-*')" ]] || fail "$label created a remote task branch"
  ! grep -q '^pr create' "$FAKE_GH_LOG" || fail "$label created a PR"
}

expect_dispatch_rejected() {
  local label="$1" allow_remote_advance="${2:-0}" before_head before_manifest rc
  before_head="$(git -C "$STATE" rev-parse HEAD)"
  before_manifest="$(git --git-dir="$ORIGIN" show "$PLANNING_BRANCH:docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" | shasum -a 256 | awk '{print $1}')"
  set +e; pipeline --dispatch >"$CONTROL/$label.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail "$label unexpectedly dispatched"
  assert_no_side_effects "$before_head" "$before_manifest" "$label"
  : "$allow_remote_advance"
  pass "$label"
}

make_pre_adoption_state() {
  write_gate pending null null null pending false unverified null
  jq '.waves |= map(.tasks |= map(if .id == "U3ADR" then .status="pending" | .verification=null | .evidence=null elif .id == "U3B" then .status="blocked" else . end))' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"
  commit_and_push pending-gate
}

setup_case current_pending; write_gate pending null null null pending false unverified null; update_gate_digest; commit_and_push invalid-pending; expect_dispatch_rejected u3b_current_pending_gate_rejected

setup_case missing_artifact; git -C "$STATE" rm docs/gates/U3_GATE.json >/dev/null; commit_and_push missing; expect_dispatch_rejected u3b_gate_artifact_missing_rejected

setup_case nonpass; jq '.architecture_review.verdict="FAIL"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"; update_gate_digest; commit_and_push nonpass; expect_dispatch_rejected u3b_gate_nonpass_rejected

setup_case sha_mismatch; jq '.architecture_review.reviewed_sha="1111111111111111111111111111111111111111"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"; update_gate_digest; commit_and_push mismatch; expect_dispatch_rejected u3b_reviewed_decision_sha_mismatch_rejected

setup_case stale; printf 'changed\n' >>"$STATE/src/protected.txt"; commit_and_push stale; expect_dispatch_rejected u3b_stale_protected_path_rejected

setup_case option_c; jq '.selected_option="C_NO_PLATFORM_GLOBAL_MUTATIONS" | .option_c_proof_artifact="docs/governance/MISSING_PROOF.md"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"; update_gate_digest; commit_and_push option-c; expect_dispatch_rejected u3b_option_c_missing_proof_rejected

setup_case manual_boolean; write_gate pending null null null pending true unverified null; update_gate_digest; commit_and_push manual; expect_dispatch_rejected u3b_manual_authorized_boolean_rejected

setup_case unknown_option; jq '.selected_option="UNKNOWN"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"; update_gate_digest; commit_and_push unknown; expect_dispatch_rejected u3b_unknown_option_rejected

setup_case gate_id_mismatch; jq '.waves |= map(.tasks |= map(if .id == "U3B" then .dispatch_gate.gate_id="OTHER-GATE" else . end))' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"; commit_and_push gate-id; expect_dispatch_rejected u3b_gate_id_mismatch_rejected

setup_case partial_gate; jq '.waves |= map(.tasks |= map(if .id == "U3B" then del(.dispatch_gate.required_verdict) else . end))' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"; commit_and_push partial; expect_dispatch_rejected u3b_partial_dispatch_gate_rejected

setup_case evidence_mismatch; jq '.waves |= map(.tasks |= map(if .id == "U3ADR" then .verification.verified_head_sha="1111111111111111111111111111111111111111" | .evidence.verification.verified_head_sha="1111111111111111111111111111111111111111" | .evidence.validation.head_sha="1111111111111111111111111111111111111111" else . end))' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"; commit_and_push evidence; expect_dispatch_rejected u3b_dependency_evidence_mismatch_rejected

setup_case valid; pipeline --dispatch >"$CONTROL/valid.log" 2>&1 || fail 'valid exact PASS gate did not dispatch'; assert_eq "$(wc -l <"$CODEX_COUNT" | tr -d ' ')" 1 'valid gate Codex count'; assert_eq "$(jq -r '.waves[].tasks[] | select(.id == "U3B") | .status' "$MANIFEST")" running 'valid gate task status'; [[ -f "$STATE/docs/nextshift-os-3/os-3-8/runs/U3B_DISPATCH.json" ]] || fail 'valid gate dispatch artifact missing'; pass u3b_valid_exact_pass_gate_accepted

setup_case selection_race; FAKE_MUTATE_GATE_ON_DIFF=1 pipeline --dispatch >"$CONTROL/race.log" 2>&1 && fail 'gate mutation race dispatched'; assert_no_side_effects "$(git -C "$STATE" rev-parse HEAD)" "$(git --git-dir="$ORIGIN" show "$PLANNING_BRANCH:docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" | shasum -a 256 | awk '{print $1}')" u3b_gate_changed_between_selection_and_locked_start_rejected; pass u3b_gate_changed_between_selection_and_locked_start_rejected

setup_case head_race; before_head="$(git -C "$STATE" rev-parse HEAD)"; before_manifest="$(git --git-dir="$ORIGIN" show "$PLANNING_BRANCH:docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" | shasum -a 256 | awk '{print $1}')"; set +e; FAKE_ADVANCE_REMOTE_ON_DIFF=1 pipeline --dispatch >"$CONTROL/head-race.log" 2>&1; rc=$?; set -e; (( rc != 0 )) || fail 'planning-head race dispatched'; assert_no_side_effects "$before_head" "$before_manifest" u3b_planning_head_changed_before_start_rejected; pass u3b_planning_head_changed_before_start_rejected

setup_case duplicate_adoption; cp "$GATE" "$CASE_ROOT/source.json"; before_head="$(git -C "$STATE" rev-parse HEAD)"; pipeline --adopt-governance-gate U3ADR U3B "$CASE_ROOT/source.json" https://github.com/sohoteam88/NextShift-OS-2.0/pull/99 >"$CONTROL/duplicate.log" 2>&1 || fail 'duplicate adoption was not a clean stop'; assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before_head" 'duplicate adoption created commit'; pass u3b_duplicate_adoption_clean_stop

setup_case stale_adoption; cp "$GATE" "$CASE_ROOT/source.json"; make_pre_adoption_state; printf 'changed\n' >>"$STATE/src/protected.txt"; commit_and_push stale-after-decision; before_head="$(git -C "$STATE" rev-parse HEAD)"; set +e; pipeline --adopt-governance-gate U3ADR U3B "$CASE_ROOT/source.json" https://github.com/sohoteam88/NextShift-OS-2.0/pull/99 >"$CONTROL/stale-adoption.log" 2>&1; rc=$?; set -e; (( rc != 0 )) || fail 'stale adoption succeeded'; assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before_head" 'stale adoption created commit'; pass u3b_stale_adoption_rejected

setup_case valid_adoption; cp "$GATE" "$CASE_ROOT/source.json"; make_pre_adoption_state; before_head="$(git -C "$STATE" rev-parse HEAD)"; pipeline --adopt-governance-gate U3ADR U3B "$CASE_ROOT/source.json" https://github.com/sohoteam88/NextShift-OS-2.0/pull/99 >"$CONTROL/adoption.log" 2>&1 || fail 'valid adoption failed'; [[ "$(git -C "$STATE" rev-parse HEAD)" != "$before_head" ]] || fail 'valid adoption created no transaction commit'; assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$(git --git-dir="$ORIGIN" rev-parse "$PLANNING_BRANCH")" 'valid adoption local/remote mismatch'; assert_eq "$(jq -r '.waves[].tasks[] | select(.id == "U3ADR") | .status' "$MANIFEST")" completed 'valid adoption dependency'; assert_eq "$(jq -r '.waves[].tasks[] | select(.id == "U3B") | .status' "$MANIFEST")" pending 'valid adoption consumer'; pass u3b_valid_adoption_atomic

pass u3b_no_codex_or_dispatch_on_gate_failure
printf 'PASS: %s U3ADR production gate fixtures\n' "$pass_count"
