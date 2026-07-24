#!/usr/bin/env bash
set -euo pipefail

repository='sohoteam88/NextShift-OS-2.0'
environment='production'
expected_reviewer='sohoteam88'

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

environment_json="$(gh api "repos/$repository/environments/$environment")" || \
  fail "could not read GitHub Environment $environment"

actual_reviewers="$(jq -r '[.protection_rules[]? | select(.type == "required_reviewers") | .reviewers[]?.reviewer.login] | join(",")' <<<"$environment_json")"
actual_rules="$(jq -r '[.protection_rules[]?.type] | sort | join(",")' <<<"$environment_json")"
actual_branch_policy="$(jq -r '.deployment_branch_policy | "custom_branch_policies=\(.custom_branch_policies),protected_branches=\(.protected_branches)"' <<<"$environment_json")"

[[ ",$actual_reviewers," == *",$expected_reviewer,"* ]] || \
  fail "required reviewer mismatch: expected contains $expected_reviewer; actual=${actual_reviewers:-none}"
[[ "$actual_rules" == 'branch_policy,required_reviewers' ]] || \
  fail "protection rule mismatch: expected=branch_policy,required_reviewers actual=${actual_rules:-none}"
[[ "$actual_branch_policy" == 'custom_branch_policies=true,protected_branches=false' ]] || \
  fail "deployment branch policy mismatch: expected=custom_branch_policies=true,protected_branches=false actual=$actual_branch_policy"

verified_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
verification_id="OS38-ENV-$(date -u +%Y%m%dT%H%M%SZ)"
printf 'PASS: GitHub Environment protection matches Final Release gate expectations\n'
printf 'ENVIRONMENT_ID=%s\n' "$(jq -r '.id' <<<"$environment_json")"
printf 'ENVIRONMENT_VERIFICATION_ID=%s\n' "$verification_id"
printf 'ENVIRONMENT_VERIFIED_AT=%s\n' "$verified_at"
