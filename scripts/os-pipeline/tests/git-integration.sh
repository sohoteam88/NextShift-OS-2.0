#!/usr/bin/env bash
# Real Git fixture: temporary bare origin, planning checkout, fake Codex and gh.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PIPELINE="$ROOT/scripts/os-pipeline/run-pipeline.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
REMOTE="$TMP/origin.git"; SEED="$TMP/seed"; STATE="$TMP/state"; BIN="$TMP/bin"
mkdir -p "$BIN"
git init --bare "$REMOTE" >/dev/null
git init -b planning "$SEED" >/dev/null
git -C "$SEED" config user.email fixture@example.test
git -C "$SEED" config user.name fixture
mkdir -p "$SEED/docs/nextshift-os-3/os-3-8" "$SEED/scripts/os-pipeline"
cp "$ROOT/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" "$SEED/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
jq '.base_branch="planning"' "$SEED/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" >"$SEED/manifest.json" && mv "$SEED/manifest.json" "$SEED/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json"
mkdir -p "$SEED/docs/nextshift-os-3/os-3-8/3.8-A"
cp "$ROOT/docs/nextshift-os-3/os-3-8/3.8-A/IMPLEMENTATION_CONTRACT.md" "$ROOT/docs/nextshift-os-3/os-3-8/3.8-A/EXECUTION_TASK.md" "$SEED/docs/nextshift-os-3/os-3-8/3.8-A/"
cp "$ROOT/scripts/os-pipeline/run-pipeline.sh" "$ROOT/scripts/os-pipeline/validate-manifest.sh" "$SEED/scripts/os-pipeline/"
git -C "$SEED" add . && git -C "$SEED" commit -m seed >/dev/null
git -C "$SEED" remote add origin "$REMOTE" && git -C "$SEED" push -u origin planning >/dev/null
git clone -b planning "$REMOTE" "$STATE" >/dev/null
git -C "$STATE" config user.email fixture@example.test
git -C "$STATE" config user.name fixture

cat >"$BIN/codex-fixture" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
git config user.email fixture@example.test
git config user.name fixture
mkdir -p docs/nextshift-os-3/os-3-8/reports
printf 'fixture %s\n' "$PIPELINE_TASK_ID" >"docs/nextshift-os-3/os-3-8/reports/$PIPELINE_TASK_ID.md"
git add . && git commit -m "fixture $PIPELINE_TASK_ID" >/dev/null
git push -u origin "$PIPELINE_TASK_BRANCH" >/dev/null
printf '{"pr_url":"https://github.com/sohoteam88/NextShift-OS-2.0/pull/1","implementation_report":"docs/nextshift-os-3/os-3-8/reports/%s.md"}\n' "$PIPELINE_TASK_ID" >"$PIPELINE_TASK_OUTCOME"
EOF
cat >"$BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
remote="${FIXTURE_REMOTE:?}"; base="planning"; branch="${TASK_BRANCH:-${PIPELINE_TASK_BRANCH:-}}"
if [[ "${1:-}" == "api" ]]; then
  endpoint="${2:?gh api endpoint required}"
  if [[ "$endpoint" =~ ^repos/([^/]+)/([^/]+)/pulls/([0-9]+)$ ]]; then
    pr_owner="${BASH_REMATCH[1]}"; pr_repo="${BASH_REMATCH[2]}"; pr_number="${BASH_REMATCH[3]}"
  else
    echo "unsupported gh api endpoint: $endpoint" >&2
    exit 1
  fi
  head="$(git --git-dir="$remote" rev-parse "refs/heads/$branch")"
  base_sha="$(git --git-dir="$remote" rev-parse "refs/heads/$base")"
  merged=false; merge_sha=""
  if [[ -f "${remote}.pr-${pr_number}-merged" ]]; then
    merged=true; merge_sha="$(<"${remote}.pr-${pr_number}-merged")"
  fi
  jq -n \
    --arg state "$([[ "$merged" == true ]] && printf closed || printf open)" \
    --argjson merged "$merged" \
    --arg base "$base" \
    --arg base_sha "$base_sha" \
    --arg head_ref "$branch" \
    --arg head_sha "$head" \
    --arg merge_sha "$merge_sha" \
    --arg url "https://github.com/${pr_owner}/${pr_repo}/pull/${pr_number}" \
    --arg body "Implementation-Report: ${IMPLEMENTATION_REPORT:-docs/fixture-report.md}" \
    '{state:$state,merged:$merged,base:{ref:$base,sha:$base_sha,repo:{full_name:"fixture/NextShift-OS-2.0"}},head:{ref:$head_ref,sha:$head_sha,repo:{full_name:"fixture/NextShift-OS-2.0"}},merge_commit_sha:(if $merge_sha=="" then null else $merge_sha end),html_url:$url,body:$body}'
  exit 0
fi
if [[ "$*" == *"pr view"* && "$*" == *"mergeCommit"* ]]; then
  sha="$(git --git-dir="$remote" rev-parse "refs/heads/$base")"
  if [[ "$*" == *"--jq"* ]]; then printf '%s\n' "$sha"; else printf '%s\n' "$sha" | jq -R '{mergeCommit:{oid:.}}'; fi
  exit 0
fi
if [[ "$*" == *"pr view"* ]]; then
  head="$(git --git-dir="$remote" rev-parse "refs/heads/$branch")"
  jq -n --arg head "$head" --arg branch "$branch" '{repository:{nameWithOwner:"fixture/NextShift-OS-2.0"},baseRefName:"planning",headRefName:$branch,headRefOid:$head,url:"https://github.com/fixture/NextShift-OS-2.0/pull/1"}'; exit 0
fi
if [[ "$*" == *"pr diff"* ]]; then printf '%s\n' "${IMPLEMENTATION_REPORT:?}"; exit 0; fi
if [[ "$*" == *"pr checks"* ]]; then exit 0; fi
if [[ "$*" == *"pr merge"* ]]; then
  work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
  git clone -b "$base" "$remote" "$work" >/dev/null
  git -C "$work" config user.email fixture@example.test; git -C "$work" config user.name fixture
  git -C "$work" merge --squash "origin/$branch" >/dev/null
  git -C "$work" commit -m "merge fixture $branch" >/dev/null
  git -C "$work" push origin "$base" >/dev/null
  git --git-dir="$remote" rev-parse "refs/heads/$base" >"${remote}.pr-1-merged"
  exit 0
fi
exit 1
EOF
printf '%s\n' '#!/usr/bin/env bash' 'exit 0' >"$BIN/pnpm"
chmod +x "$BIN/codex-fixture" "$BIN/gh" "$BIN/pnpm"

run_cycle() {
  PATH="$BIN:$PATH" FIXTURE_REMOTE="$REMOTE" PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 PIPELINE_EXPECTED_REPOSITORY=fixture/NextShift-OS-2.0 PIPELINE_ALLOW_PRODUCT_DISPATCH=1 PIPELINE_AUTOMATE_TASK_CYCLE=1 PIPELINE_ALLOW_PR_MERGE=1 CODEX_CMD=codex-fixture REPO_DIR="$STATE" MANIFEST_PATH="$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" CONTROL_ROOT="$TMP/control" "$PIPELINE" --cycle
}
run_cycle
[[ "$(jq -r '.waves[0].tasks[0].status' "$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json")" == completed ]]
[[ "$(PATH="$BIN:$PATH" FIXTURE_REMOTE="$REMOTE" git -C "$STATE" fetch origin >/dev/null; jq -r '.waves[0].tasks[0].status' "$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json")" == completed ]]
[[ "$(PATH="$BIN:$PATH" FIXTURE_REMOTE="$REMOTE" PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 PIPELINE_EXPECTED_REPOSITORY=fixture/NextShift-OS-2.0 REPO_DIR="$STATE" MANIFEST_PATH="$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" "$PIPELINE" --plan | jq -r .task)" == E2 ]]
run_cycle
[[ "$(jq -r '.waves[0].tasks[1].status' "$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json")" == completed ]]
PATH="$BIN:$PATH" FIXTURE_REMOTE="$REMOTE" PIPELINE_ALLOW_LOCAL_TEST_REMOTE=1 PIPELINE_EXPECTED_REPOSITORY=fixture/NextShift-OS-2.0 REPO_DIR="$STATE" MANIFEST_PATH="$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json" "$PIPELINE" --cycle >/dev/null
[[ "$(jq -r '.waves[0].checkpoint.status' "$STATE/docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json")" == awaiting_review ]]
[[ -f "$STATE/docs/nextshift-os-3/os-3-8/reviews/W1_ARCHITECTURE_REVIEW_REQUEST.md" ]]
[[ -n "$(find "$TMP/control" -name TASK_BRIEF.md -print -quit)" ]]
[[ -z "$(git -C "$STATE" status --porcelain)" ]] || { echo "fixture state worktree dirty" >&2; exit 1; }
echo "PASS: real Git fixture E1 -> E2 -> AR-W1 clean wait"
