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
sha_file() { shasum -a 256 "$1" | awk '{print $1}'; }
sha_or_missing() { [[ -e "$1" ]] && sha_file "$1" || printf 'MISSING\n'; }
canonical_sha() { jq -Sc . "$1" | shasum -a 256 | awk '{print $1}'; }

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
      jq -cn --arg repo "sohoteam88/NextShift-OS-2.0" --arg base "planning/os-3.8-product-usability" --arg base_sha "$BASE_SHA" --arg head "$DECISION_SHA" '{
        merged:true,state:"closed",html_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/99",changed_files:2,merge_commit_sha:$head,
        base:{ref:$base,sha:$base_sha,repo:{full_name:$repo}},head:{ref:"docs/u3adr-decision",sha:$head,repo:{full_name:$repo}}
      }'
      ;;
    *) printf 'unknown fake gh api endpoint: %s\n' "$endpoint" >&2; exit 1 ;;
  esac
elif [[ "${1:-}" == pr && "${2:-}" == diff ]]; then
  if [[ "${FAKE_ADVANCE_GATE_ON_DIFF:-0}" == 1 && ! -e "$CONTROL/gate-race-fired" ]]; then
    : >"$CONTROL/gate-race-fired"
    "$CONTROL/advance-gate.sh"
  elif [[ "${FAKE_ADVANCE_REMOTE_ON_DIFF:-0}" == 1 && ! -e "$CONTROL/head-race-fired" ]]; then
    : >"$CONTROL/head-race-fired"
    "$CONTROL/advance-remote.sh"
  fi
  printf '%s\n' 'docs/governance/U3ADR_DECISION.json' 'docs/governance/U3ADR_OPTION_C_PROOF.md'
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

policy_json() {
  jq -cn '{
    schema_version:1,gate_id:"U3-AUDITLOG-ADR",gate_task_id:"U3ADR",consumer_task_id:"U3B",policy_version:"2026-07-17.v3",
    decision_artifact:"docs/governance/U3ADR_DECISION.json",
    allowed_selected_options:["A_OPTIONAL_TENANT_WITH_SCOPE","B_PLATFORM_AUDIT_LOG","C_NO_PLATFORM_GLOBAL_MUTATIONS"],
    required_decisions:["platform_global_storage","target_mapping","failure_audit_durability","tenant_deletion_audit_retention","deleted_tenant_terminal_operational_state","auditlog_idempotency_authority"],
    protected_paths:["docs/governance/U3ADR_DECISION.json","docs/governance/U3ADR_OPTION_C_PROOF.md","docs/gates/U3_GATE.json","src/protected.txt"],
    review:{required_verdict:"PASS",reviewed_sha_must_equal_decision_sha:true},freshness:{reject_protected_path_changes_after_review:true},
    option_c:{selected_option:"C_NO_PLATFORM_GLOBAL_MUTATIONS",proof_required:true,proof_artifact:"docs/governance/U3ADR_OPTION_C_PROOF.md"}
  }'
}

write_pending_gate() {
  local policy="$1" policy_digest protected_digest
  policy_digest="$(jq -Sc . <<<"$policy" | shasum -a 256 | awk '{print $1}')"
  protected_digest="$(jq -Sc '.protected_paths|sort' <<<"$policy" | shasum -a 256 | awk '{print $1}')"
  jq -cn --argjson policy "$policy" --arg pd "$policy_digest" --arg pp "$protected_digest" '{
    schema_version:1,gate_id:$policy.gate_id,task_id:$policy.gate_task_id,consumer_task_id:$policy.consumer_task_id,status:"pending",
    selected_option:null,decision_sha:null,decision_artifact:$policy.decision_artifact,decision_artifact_sha256:null,
    policy:$policy,policy_version:$policy.policy_version,policy_sha256:$pd,protected_paths_sha256:$pp,required_decisions:[],option_c_proof:null,
    architecture_review:{verdict:null,reviewed_sha:null,review_id:null},approval_state:"pending",
    freshness:{state:"unverified",verified_against_planning_sha:null,protected_paths_sha256:$pp},u3b_dispatch_authorized:false
  }' >"$GATE"
}

completed_task() {
  local source="$1" id="$2" report="$3" pr="$4"
  jq -c --arg id "$id" --arg report "$report" --arg pr "$pr" '
    .id=$id | .title=("Fixture " + $id) | .status="completed" | .verification_policy="actual_checks_required" |
    .contract=$report | .execution_task=null |
    .verification={status:"passed",repository:"sohoteam88/NextShift-OS-2.0",base_branch:"planning/os-3.8-product-usability",task_branch:("fixture-"+$id),pr_url:$pr,verified_head_sha:"0123456789012345678901234567890123456789",implementation_report:$report,dispatch_artifact:("docs/nextshift-os-3/os-3-8/runs/"+$id+"_DISPATCH.json"),report_exists_at_exact_head:true,report_in_pr_diff:true,checks:"passed",verified_at:"2026-07-17T00:00:00Z"} |
    .evidence={pr_url:$pr,merge_sha:"0123456789012345678901234567890123456789",implementation_report:$report,verification:.verification,validation:{checks:"passed",head_sha:"0123456789012345678901234567890123456789"},recovered:true,recovered_at:"2026-07-17T00:00:00Z"}
  ' <<<"$source"
}

configure_manifest() {
  local policy="$1" u1b u3 u3a
  u1b="$(jq -c '.waves[]|select(.id=="W3")|.tasks[]|select(.id=="U1B")' "$SOURCE_MANIFEST")"
  u3="$(jq -c '.waves[]|select(.id=="W3")|.tasks[]|select(.id=="U3")' "$SOURCE_MANIFEST")"
  u1b="$(completed_task "$u1b" U1B docs/fixture.md https://github.com/sohoteam88/NextShift-OS-2.0/pull/97)"
  u3a="$(completed_task "$u3" U3A docs/governance/U3ADR_DECISION.json https://github.com/sohoteam88/NextShift-OS-2.0/pull/98)"
  jq --argjson policy "$policy" --argjson u1b "$u1b" --argjson u3a "$u3a" '
    .waves |= map(if .id=="W3" then
      .status="running" | .tasks=[$u1b,$u3a,
        {id:"U3ADR",verification_policy:"actual_checks_required",title:"U3 ADR",blueprint_section:"fixture",contract:$policy.decision_artifact,execution_task:null,depends_on:["U3A"],status:"pending",verification:null,evidence:null,governance_gate:{gate_id:$policy.gate_id,artifact:"docs/gates/U3_GATE.json",policy:$policy}},
        {id:"U3B",verification_policy:"actual_checks_required",title:"U3B",blueprint_section:"fixture",contract:"docs/fixture.md",execution_task:null,depends_on:["U3ADR"],status:"blocked",verification:null,evidence:null,dispatch_gate:{gate_id:$policy.gate_id,task_id:"U3ADR",artifact:"docs/gates/U3_GATE.json",required_status:"approved",required_verdict:"PASS",reviewed_sha_must_equal_decision_sha:true,required_freshness_state:"fresh",option_c_proof_required:true,blocked_reason:"fixture"}},
        (.tasks[]|select(.id=="E3A")|.depends_on=["U3B"]),(.tasks[]|select(.id=="E3B"))]
    else . end)
  ' "$SOURCE_MANIFEST" >"$MANIFEST"
}

write_decision() {
  local option="${1:-A_OPTIONAL_TENANT_WITH_SCOPE}" policy policy_digest protected_digest proof_digest
  policy="$(policy_json)"; policy_digest="$(jq -Sc . <<<"$policy" | shasum -a 256 | awk '{print $1}')"
  protected_digest="$(jq -Sc '.protected_paths|sort' <<<"$policy" | shasum -a 256 | awk '{print $1}')"; proof_digest="$(sha_file "$PROOF")"
  jq -cn --arg option "$option" --arg pd "$policy_digest" --arg pp "$protected_digest" --arg proof "$proof_digest" '{
    schema_version:1,gate_id:"U3-AUDITLOG-ADR",task_id:"U3ADR",consumer_task_id:"U3B",decision_status:"approved",selected_option:$option,
    policy_version:"2026-07-17.v3",policy_sha256:$pd,protected_paths_sha256:$pp,
    required_decisions:[
      {id:"platform_global_storage",status:"resolved",decision:"tenant nullable scope with database invariant"},
      {id:"target_mapping",status:"resolved",decision:"real UUID or redacted stable key"},
      {id:"failure_audit_durability",status:"resolved",decision:"append-only durable outbox outside rollback"},
      {id:"tenant_deletion_audit_retention",status:"resolved",decision:"platform tombstone survives delete lifecycle"},
      {id:"deleted_tenant_terminal_operational_state",status:"resolved",decision:"deleted tenant is terminal across auth and workers"},
      {id:"auditlog_idempotency_authority",status:"resolved",decision:"dedicated unique key and payload digest enforce final-event identity"}
    ],
    option_c_proof:(if $option=="C_NO_PLATFORM_GLOBAL_MUTATIONS" then {path:"docs/governance/U3ADR_OPTION_C_PROOF.md",sha256:$proof} else null end)
  }' >"$DECISION"
}

write_envelope() {
  jq -cn --arg sha "$DECISION_SHA" --arg digest "$(sha_file "$DECISION")" '{
    schema_version:1,gate_id:"U3-AUDITLOG-ADR",gate_task_id:"U3ADR",consumer_task_id:"U3B",decision_sha:$sha,review_id:9001,
    reviewed_pr_url:"https://github.com/sohoteam88/NextShift-OS-2.0/pull/99",decision_artifact:"docs/governance/U3ADR_DECISION.json",decision_artifact_sha256:$digest
  }' >"$ENVELOPE"
}

pipeline() {
  (
    export PATH="$BIN:$PATH" REPO_DIR="$STATE" MANIFEST_PATH="$MANIFEST" CONTROL_ROOT="$CONTROL/pipeline" LOG_DIR="$CONTROL/logs"
    export PIPELINE_EXPECTED_REPOSITORY="sohoteam88/NextShift-OS-2.0" PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 PIPELINE_ALLOW_PRODUCT_DISPATCH=1
    export CODEX_CMD="\"$CONTROL/fake-codex.sh\"" FAKE_GH_LOG CODEX_COUNT CONTROL GATE BASE_SHA DECISION_SHA
    export FAKE_ADVANCE_GATE_ON_DIFF="${FAKE_ADVANCE_GATE_ON_DIFF:-0}" FAKE_ADVANCE_REMOTE_ON_DIFF="${FAKE_ADVANCE_REMOTE_ON_DIFF:-0}"
    "$STATE/run-pipeline.sh" "$@"
  )
}

setup_case() {
  local name="$1" mode="${2:-pending}" policy
  CASE_ROOT="$ROOT/$name"; ORIGIN="$CASE_ROOT/origin.git"; STATE="$CASE_ROOT/state"; CONTROL="$CASE_ROOT/control"; BIN="$CASE_ROOT/bin"
  MANIFEST="$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"; GATE="$STATE/docs/gates/U3_GATE.json"
  DECISION="$STATE/docs/governance/U3ADR_DECISION.json"; PROOF="$STATE/docs/governance/U3ADR_OPTION_C_PROOF.md"; ENVELOPE="$CASE_ROOT/envelope.json"
  FAKE_GH_LOG="$CONTROL/gh.log"; CODEX_COUNT="$CONTROL/codex.count"
  mkdir -p "$CONTROL"; git init --bare "$ORIGIN" >/dev/null; git clone "$ORIGIN" "$STATE" >/dev/null 2>&1
  git -C "$STATE" config user.name fixture; git -C "$STATE" config user.email fixture@example.com; git -C "$STATE" checkout -b "$PLANNING_BRANCH" >/dev/null
  mkdir -p "$(dirname "$MANIFEST")" "$(dirname "$GATE")" "$(dirname "$DECISION")" "$STATE/src" "$STATE/.github/workflows"
  cp "$PIPELINE" "$STATE/run-pipeline.sh"; cp "$PIPELINE_DIR/validate-manifest.sh" "$STATE/validate-manifest.sh"; chmod +x "$STATE/run-pipeline.sh" "$STATE/validate-manifest.sh"
  printf '# fixture\n' >"$STATE/docs/fixture.md"; printf 'protected\n' >"$STATE/src/protected.txt"; printf 'proof inventory\n' >"$PROOF"
  printf '%s\n' 'name: fixture' 'on:' '  pull_request:' '    paths-ignore:' "      - 'docs/**'" "      - 'audit/**'" "      - '**/*.md'" '      - platform/status.md' >"$STATE/.github/workflows/ci.yml"
  policy="$(policy_json)"; configure_manifest "$policy"; write_pending_gate "$policy"
  git -C "$STATE" add -A; git -C "$STATE" commit -m base >/dev/null; BASE_SHA="$(git -C "$STATE" rev-parse HEAD)"
  printf 'reviewed proof\n' >>"$PROOF"; write_decision
  git -C "$STATE" add "$DECISION" "$PROOF"; git -C "$STATE" commit -m decision >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"; write_envelope
  git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null
  write_fake_tools; : >"$FAKE_GH_LOG"; : >"$CODEX_COUNT"
  cat >"$CONTROL/advance-remote.sh" <<ADVANCE
#!/usr/bin/env bash
set -euo pipefail
tmp="\$(mktemp -d)"; trap 'rm -rf "\$tmp"' EXIT
git clone "$ORIGIN" "\$tmp/repo" >/dev/null 2>&1
git -C "\$tmp/repo" config user.name fixture; git -C "\$tmp/repo" config user.email fixture@example.com
git -C "\$tmp/repo" checkout "$PLANNING_BRANCH" >/dev/null
printf 'advanced\n' >"\$tmp/repo/remote.txt"
git -C "\$tmp/repo" add remote.txt; git -C "\$tmp/repo" commit -m advanced >/dev/null
git -C "\$tmp/repo" push origin "$PLANNING_BRANCH" >/dev/null
ADVANCE
  cat >"$CONTROL/advance-gate.sh" <<ADVANCE
#!/usr/bin/env bash
set -euo pipefail
tmp="\$(mktemp -d)"; trap 'rm -rf "\$tmp"' EXIT
git clone "$ORIGIN" "\$tmp/repo" >/dev/null 2>&1
git -C "\$tmp/repo" config user.name fixture; git -C "\$tmp/repo" config user.email fixture@example.com
git -C "\$tmp/repo" checkout "$PLANNING_BRANCH" >/dev/null
jq '.freshness.state="tampered"' "\$tmp/repo/docs/gates/U3_GATE.json" >"\$tmp/repo/docs/gates/U3_GATE.json.tmp"
mv "\$tmp/repo/docs/gates/U3_GATE.json.tmp" "\$tmp/repo/docs/gates/U3_GATE.json"
git -C "\$tmp/repo" add docs/gates/U3_GATE.json; git -C "\$tmp/repo" commit -m gate-race >/dev/null
git -C "\$tmp/repo" push origin "$PLANNING_BRANCH" >/dev/null
ADVANCE
  chmod +x "$CONTROL/advance-remote.sh" "$CONTROL/advance-gate.sh"
  if [[ "$mode" == adopted ]]; then
    pipeline --adopt-governance-gate U3ADR U3B "$ENVELOPE" https://github.com/sohoteam88/NextShift-OS-2.0/pull/99 >"$CONTROL/setup-adopt.log" 2>&1 || { tail -80 "$CONTROL/setup-adopt.log"; fail "fixture adoption failed: $name"; }
    : >"$FAKE_GH_LOG"; : >"$CODEX_COUNT"
  fi
}

snapshot() {
  BEFORE_HEAD="$(git -C "$STATE" rev-parse HEAD)"; BEFORE_REMOTE="$(git --git-dir="$ORIGIN" rev-parse "$PLANNING_BRANCH")"
  BEFORE_MANIFEST="$(sha_file "$MANIFEST")"; BEFORE_GATE="$(sha_or_missing "$GATE")"
}

assert_zero_side_effects() {
  local label="$1"
  assert_eq "$(wc -l <"$CODEX_COUNT" | tr -d ' ')" 0 "$label invoked Codex"
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$BEFORE_HEAD" "$label changed local HEAD"
  assert_eq "$(git --git-dir="$ORIGIN" rev-parse "$PLANNING_BRANCH")" "$BEFORE_REMOTE" "$label changed remote HEAD"
  assert_eq "$(sha_file "$MANIFEST")" "$BEFORE_MANIFEST" "$label changed Manifest bytes"
  assert_eq "$(sha_or_missing "$GATE")" "$BEFORE_GATE" "$label changed gate bytes"
  [[ -z "$(git -C "$STATE" status --short)" ]] || fail "$label left dirty worktree"
  [[ -z "$(git -C "$STATE" ls-files --others --exclude-standard)" ]] || fail "$label left untracked files"
  [[ ! -e "$(git -C "$STATE" rev-parse --git-common-dir)/os-pipeline-state.lock" ]] || fail "$label left state lock"
  [[ ! -e "$STATE/docs/nextshift-os-3/os-3-8/runs/U3B_DISPATCH.json" ]] || fail "$label wrote dispatch artifact"
  [[ -z "$(git --git-dir="$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/chore/*')" ]] || fail "$label created task branch"
  ! grep -q '^pr create' "$FAKE_GH_LOG" || fail "$label created PR"
}

assert_local_zero_side_effects() {
  local label="$1"
  assert_eq "$(wc -l <"$CODEX_COUNT" | tr -d ' ')" 0 "$label invoked Codex"
  assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$BEFORE_HEAD" "$label changed local HEAD"
  assert_eq "$(sha_file "$MANIFEST")" "$BEFORE_MANIFEST" "$label changed Manifest bytes"
  assert_eq "$(sha_or_missing "$GATE")" "$BEFORE_GATE" "$label changed gate bytes"
  [[ -z "$(git -C "$STATE" status --short)" ]] || fail "$label left dirty worktree"
  [[ ! -e "$(git -C "$STATE" rev-parse --git-common-dir)/os-pipeline-state.lock" ]] || fail "$label left state lock"
  [[ ! -e "$STATE/docs/nextshift-os-3/os-3-8/runs/U3B_DISPATCH.json" ]] || fail "$label wrote dispatch artifact"
  [[ -z "$(git --git-dir="$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/chore/*')" ]] || fail "$label created task branch"
  ! grep -q '^pr create' "$FAKE_GH_LOG" || fail "$label created PR"
}

expect_adoption_rejected() {
  local label="$1"; shift; snapshot; set +e; "$@" >"$CONTROL/$label.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail "$label unexpectedly succeeded"; assert_zero_side_effects "$label"; pass "$label"
}

expect_dispatch_rejected() {
  local label="$1"; snapshot; set +e; pipeline --dispatch >"$CONTROL/$label.log" 2>&1; rc=$?; set -e
  (( rc != 0 )) || fail "$label unexpectedly dispatched"; assert_zero_side_effects "$label"; pass "$label"
}

adopt_cmd() { pipeline --adopt-governance-gate U3ADR U3B "$ENVELOPE" https://github.com/sohoteam88/NextShift-OS-2.0/pull/99; }

# Round 2 policy-binding and transaction rollback fixtures.
setup_case option_allowlist; jq '.selected_option="B_PLATFORM_AUDIT_LOG" | .allowed_selected_options=["B_PLATFORM_AUDIT_LOG"]' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected selected_option_and_allowlist_changed_together_rejected adopt_cmd
setup_case arbitrary; jq '.selected_option="ATTACKER_OPTION" | .allowed_selected_options=["ATTACKER_OPTION"]' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected arbitrary_option_self_added_rejected adopt_cmd
setup_case removed_path; jq '.protected_paths=["docs/governance/U3ADR_DECISION.json"]' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected critical_protected_path_removed_rejected adopt_cmd
setup_case replaced_paths; jq '.protected_paths=["docs/harmless.md"]' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected protected_path_set_replaced_rejected adopt_cmd
setup_case option_mismatch; jq '.selected_option="B_PLATFORM_AUDIT_LOG"' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected reviewed_artifact_option_a_envelope_option_b_rejected adopt_cmd
setup_case policy_mismatch; jq '.policy_sha256="1111111111111111111111111111111111111111111111111111111111111111"' "$DECISION" >"$DECISION.tmp" && mv "$DECISION.tmp" "$DECISION"; git -C "$STATE" add "$DECISION"; git -C "$STATE" commit -m mismatch >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"; write_envelope; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_adoption_rejected reviewed_policy_digest_mismatch_rejected adopt_cmd
setup_case legacy_without_tenant_delete; jq '.required_decisions |= map(select(.id != "tenant_deletion_audit_retention"))' "$DECISION" >"$DECISION.tmp" && mv "$DECISION.tmp" "$DECISION"; git -C "$STATE" add "$DECISION"; git -C "$STATE" commit -m legacy-decision >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"; write_envelope; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_adoption_rejected legacy_decision_without_tenant_deletion_rejected adopt_cmd
setup_case legacy_without_terminal_state; jq '.required_decisions |= map(select(.id != "deleted_tenant_terminal_operational_state"))' "$DECISION" >"$DECISION.tmp" && mv "$DECISION.tmp" "$DECISION"; git -C "$STATE" add "$DECISION"; git -C "$STATE" commit -m legacy-terminal-decision >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"; write_envelope; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_adoption_rejected legacy_decision_without_deleted_tenant_terminal_state_rejected adopt_cmd
setup_case legacy_without_auditlog_idempotency; jq '.required_decisions |= map(select(.id != "auditlog_idempotency_authority"))' "$DECISION" >"$DECISION.tmp" && mv "$DECISION.tmp" "$DECISION"; git -C "$STATE" add "$DECISION"; git -C "$STATE" commit -m legacy-auditlog-idempotency-decision >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"; write_envelope; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_adoption_rejected legacy_decision_without_auditlog_idempotency_authority_rejected adopt_cmd
setup_case auditlog_idempotency_mismatch; jq '(.required_decisions[] | select(.id == "auditlog_idempotency_authority") | .id) = "auditlog_idempotency_authority_v0"' "$DECISION" >"$DECISION.tmp" && mv "$DECISION.tmp" "$DECISION"; git -C "$STATE" add "$DECISION"; git -C "$STATE" commit -m mismatched-auditlog-idempotency-decision >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"; write_envelope; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_adoption_rejected auditlog_idempotency_decision_id_mismatch_rejected adopt_cmd
setup_case missing_artifact; git -C "$STATE" rm "$DECISION" >/dev/null; git -C "$STATE" commit -m missing >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"; jq --arg sha "$DECISION_SHA" '.decision_sha=$sha' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_adoption_rejected reviewed_decision_artifact_missing_rejected adopt_cmd
setup_case digest_mismatch; jq '.decision_artifact_sha256="2222222222222222222222222222222222222222222222222222222222222222"' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected reviewed_decision_artifact_digest_mismatch_rejected adopt_cmd
setup_case freshness; printf 'stale\n' >>"$STATE/src/protected.txt"; git -C "$STATE" add src/protected.txt; git -C "$STATE" commit -m stale >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; jq '.freshness="fresh"' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected external_freshness_claim_ignored adopt_cmd
setup_case wrong_task; jq '.gate_task_id="OTHER"' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected adoption_source_wrong_task_id_rejected adopt_cmd
setup_case wrong_consumer; jq '.consumer_task_id="OTHER"' "$ENVELOPE" >"$ENVELOPE.tmp" && mv "$ENVELOPE.tmp" "$ENVELOPE"; expect_adoption_rejected adoption_source_wrong_consumer_id_rejected adopt_cmd
setup_case candidate_invalid_real; snapshot; set +e; PIPELINE_INJECT_CANDIDATE_INVALID=1 adopt_cmd >"$CONTROL/candidate_manifest_invalid_no_repo_mutation.log" 2>&1; rc=$?; set -e; (( rc != 0 )) || fail 'candidate invalid succeeded'; assert_zero_side_effects candidate_manifest_invalid_no_repo_mutation; pass candidate_manifest_invalid_no_repo_mutation
setup_case locked_drift; snapshot; set +e; PIPELINE_INJECT_LOCKED_SOURCE_DRIFT=1 adopt_cmd >"$CONTROL/post_candidate_locked_drift_rejected.log" 2>&1; rc=$?; set -e; (( rc != 0 )) || fail 'locked drift succeeded'; assert_zero_side_effects post_candidate_locked_drift_rejected; pass post_candidate_locked_drift_rejected
setup_case post_write; snapshot; set +e; PIPELINE_INJECT_POST_WRITE_VALIDATION_FAILURE=1 adopt_cmd >"$CONTROL/post_write_validation_failure_rolls_back.log" 2>&1; rc=$?; set -e; (( rc != 0 )) || fail 'post-write injection succeeded'; assert_zero_side_effects post_write_validation_failure_rolls_back; pass post_write_validation_failure_rolls_back
setup_case push_failure; printf '#!/usr/bin/env bash\nexit 1\n' >"$ORIGIN/hooks/pre-receive"; chmod +x "$ORIGIN/hooks/pre-receive"; expect_adoption_rejected push_failure_restores_clean_worktree adopt_cmd
setup_case valid_atomic; before="$(git -C "$STATE" rev-parse HEAD)"; adopt_cmd >"$CONTROL/valid.log" 2>&1 || { tail -80 "$CONTROL/valid.log"; fail 'valid policy-bound adoption failed'; }; [[ "$(git -C "$STATE" rev-parse HEAD)" != "$before" ]] || fail 'valid adoption created no commit'; assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$(git --git-dir="$ORIGIN" rev-parse "$PLANNING_BRANCH")" 'valid adoption local/remote mismatch'; assert_eq "$(jq -r '.waves[].tasks[]|select(.id=="U3B")|.status' "$MANIFEST")" pending 'consumer not pending'; pass valid_policy_bound_adoption_atomic
setup_case duplicate adopted; before="$(git -C "$STATE" rev-parse HEAD)"; adopt_cmd >"$CONTROL/duplicate.log" 2>&1 || fail 'duplicate adoption failed'; assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'duplicate adoption committed'; [[ -z "$(git -C "$STATE" status --short)" ]] || fail 'duplicate adoption dirty'; pass duplicate_policy_bound_adoption_clean_stop

# Existing production dispatch-gate regressions, now using policy-bound gates.
setup_case current_pending; expect_dispatch_rejected u3b_current_pending_gate_rejected
setup_case adopted_missing adopted; rm -f "$GATE"; git -C "$STATE" add -A; git -C "$STATE" commit -m missing >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_gate_artifact_missing_rejected
setup_case adopted_nonpass adopted; jq '.architecture_review.verdict="FAIL"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"; git -C "$STATE" add "$GATE"; git -C "$STATE" commit -m nonpass >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_gate_nonpass_rejected
setup_case adopted_sha adopted; jq '.architecture_review.reviewed_sha="1111111111111111111111111111111111111111"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"; git -C "$STATE" add "$GATE"; git -C "$STATE" commit -m mismatch >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_reviewed_decision_sha_mismatch_rejected
setup_case adopted_stale adopted; printf 'stale\n' >>"$STATE/src/protected.txt"; git -C "$STATE" add src/protected.txt; git -C "$STATE" commit -m stale >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_stale_protected_path_rejected
setup_case option_c_missing; write_decision C_NO_PLATFORM_GLOBAL_MUTATIONS; jq '.option_c_proof.path="docs/governance/MISSING.md"' "$DECISION" >"$DECISION.tmp" && mv "$DECISION.tmp" "$DECISION"; git -C "$STATE" add "$DECISION"; git -C "$STATE" commit -m option-c >/dev/null; DECISION_SHA="$(git -C "$STATE" rev-parse HEAD)"; write_envelope; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_adoption_rejected u3b_option_c_missing_proof_rejected adopt_cmd
setup_case manual adopted; jq '.u3b_dispatch_authorized=true | .architecture_review.verdict="FAIL"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"; git -C "$STATE" add "$GATE"; git -C "$STATE" commit -m manual >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_manual_authorized_boolean_rejected
setup_case unknown adopted; jq '.selected_option="UNKNOWN"' "$GATE" >"$GATE.tmp" && mv "$GATE.tmp" "$GATE"; git -C "$STATE" add "$GATE"; git -C "$STATE" commit -m unknown >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_unknown_option_rejected
setup_case gate_id adopted; jq '.waves |= map(.tasks |= map(if .id=="U3B" then .dispatch_gate.gate_id="OTHER" else . end))' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"; git -C "$STATE" add "$MANIFEST"; git -C "$STATE" commit -m id >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_gate_id_mismatch_rejected
setup_case partial adopted; jq '.waves |= map(.tasks |= map(if .id=="U3B" then del(.dispatch_gate.required_verdict) else . end))' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"; git -C "$STATE" add "$MANIFEST"; git -C "$STATE" commit -m partial >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_partial_dispatch_gate_rejected
setup_case evidence adopted; jq '.waves |= map(.tasks |= map(if .id=="U3ADR" then .verification.verified_head_sha="1111111111111111111111111111111111111111"|.evidence.verification.verified_head_sha="1111111111111111111111111111111111111111"|.evidence.validation.head_sha="1111111111111111111111111111111111111111" else . end))' "$MANIFEST" >"$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"; git -C "$STATE" add "$MANIFEST"; git -C "$STATE" commit -m evidence >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_dispatch_rejected u3b_dependency_evidence_mismatch_rejected
setup_case valid_dispatch adopted; pipeline --dispatch >"$CONTROL/dispatch.log" 2>&1 || fail 'valid dispatch failed'; assert_eq "$(wc -l <"$CODEX_COUNT"|tr -d ' ')" 1 'valid dispatch Codex count'; assert_eq "$(jq -r '.waves[].tasks[]|select(.id=="U3B")|.status' "$MANIFEST")" running 'valid dispatch status'; pass u3b_valid_exact_pass_gate_accepted
setup_case selection_race adopted; snapshot; set +e; FAKE_ADVANCE_GATE_ON_DIFF=1 pipeline --dispatch >"$CONTROL/selection-race.log" 2>&1; rc=$?; set -e; (( rc != 0 )) || fail 'gate selection race dispatched'; assert_local_zero_side_effects u3b_gate_changed_between_selection_and_locked_start_rejected; pass u3b_gate_changed_between_selection_and_locked_start_rejected
setup_case head_race adopted; snapshot; set +e; FAKE_ADVANCE_REMOTE_ON_DIFF=1 pipeline --dispatch >"$CONTROL/head-race.log" 2>&1; rc=$?; set -e; (( rc != 0 )) || fail 'planning-head race dispatched'; assert_local_zero_side_effects u3b_planning_head_changed_before_start_rejected; pass u3b_planning_head_changed_before_start_rejected
setup_case duplicate_legacy adopted; before="$(git -C "$STATE" rev-parse HEAD)"; adopt_cmd >"$CONTROL/duplicate-legacy.log" 2>&1 || fail 'legacy duplicate adoption failed'; assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$before" 'legacy duplicate adoption committed'; pass u3b_duplicate_adoption_clean_stop
setup_case stale_legacy; printf 'stale\n' >>"$STATE/src/protected.txt"; git -C "$STATE" add src/protected.txt; git -C "$STATE" commit -m stale >/dev/null; git -C "$STATE" push origin "$PLANNING_BRANCH" >/dev/null; expect_adoption_rejected u3b_stale_adoption_rejected adopt_cmd
setup_case valid_legacy; before="$(git -C "$STATE" rev-parse HEAD)"; adopt_cmd >"$CONTROL/valid-legacy.log" 2>&1 || fail 'legacy valid adoption failed'; [[ "$(git -C "$STATE" rev-parse HEAD)" != "$before" ]] || fail 'legacy valid adoption created no commit'; assert_eq "$(git -C "$STATE" rev-parse HEAD)" "$(git --git-dir="$ORIGIN" rev-parse "$PLANNING_BRANCH")" 'legacy valid adoption local/remote mismatch'; pass u3b_valid_adoption_atomic
setup_case no_codex; expect_dispatch_rejected u3b_no_codex_or_dispatch_on_gate_failure

printf 'PASS: %s policy-bound governance dispatch fixtures\n' "$pass_count"
