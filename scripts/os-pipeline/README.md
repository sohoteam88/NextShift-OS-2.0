# OS Pipeline — Autonomous Blueprint Execution

This is a personal orchestration script, not a NextShift product feature. It automates the
triangle workflow (Architecture Review → Codex execution → verification → review → merge →
periodic audit → RC/tag) end-to-end, unattended.

Run it with `./run-pipeline.sh`. Each invocation does **one cycle**: picks the next open item
from the active blueprint, gets it built, verified, reviewed, and merged — and, every
`AUDIT_EVERY_N_PRS` merges, runs a code-level audit. Run it in a loop (cron, or a `while true`
wrapper with a sleep) if you want it to keep going until the blueprint is empty.

## Before first run

1. Open `run-pipeline.sh` and fill in `CLAUDE_CMD` and `CODEX_CMD` for your actual CLI syntax —
   the placeholders are guesses. Both must run non-interactively (no prompts) and exit non-zero
   on failure.
2. Confirm `gh` (GitHub CLI) is authenticated (`gh auth status`).
3. Confirm you're comfortable with `BASE_BRANCH` and `BLUEPRINT_PATH` at the top of the script —
   update `BLUEPRINT_PATH` whenever you start a new OS version blueprint. The script will not
   guess which blueprint is "current."
4. Do a dry run by hand first: read the task brief it produces (Step 1) before letting it reach
   Step 2 (Codex execution) for the first time on a new blueprint, just to sanity-check the task
   selection logic is picking the item you'd expect.

## What it will never do, even in full-auto mode

- Touch `packages/**` (the frozen Core Runtime packages — see
  `docs/nextshift-os-3/RUNTIME_STATUS.md`)
- Let a Codex-produced PR touch any `.env*` file or `.github/workflows/deploy.yml` directly (the
  script itself edits the VPS's `.env.production` in Step 8, but only that one file, only via the
  guarded flow described below — never as part of a merged PR diff)
- Touch `prisma/migrations/**` (until this pipeline has a track record, migrations stay manual)

These are hardcoded guards in the script (`FORBIDDEN_PATH_PATTERNS`), not suggestions — if a
Codex-produced diff touches one of these paths, the script aborts and leaves the PR open rather
than merging it.

## Step 8: VPS flag reveal + deploy verification

This step now runs automatically after a fresh tag, per your instruction — since NextShift OS has
no real users yet, the "product timing" judgment that used to gate this manually (see the OS 3.5
`AI_DISCUSSION` rollout) doesn't apply. Revisit this once there are real users.

What it does, only when a fresh tag was just created in the same run:

1. Asks Claude to read the blueprint and `src/lib/runtime-flags.ts` to decide which
   `NEXT_PUBLIC_ENABLE_*` / `PROD_NEXT_PUBLIC_ENABLE_*` flags this release intends to reveal.
2. SSHes into the VPS (`VPS_HOST`/`VPS_USER`/`SSH_KEY` — set these before first use) and backs up
   `.env.production` to a timestamped file before touching anything.
3. Applies only the flag lines identified in step 1 (or none, if the release ships no flag
   change), then restarts the `app` container via the same command used in manual deploys:
   `docker compose --env-file .env.production -f docker-compose.prod.yml up -d --no-build app`.
4. Smoke-tests `/api/health` (expects 200) and `/api/v1/version` with a cache-busting query param
   (expects the new commit SHA — proxy caching bit us once before, hence the cache-buster).
5. If the smoke test fails, it automatically restores the backed-up `.env.production` and restarts
   the container again — rolling back only the env/flag change, never the git tag or the merge to
   `main`. It then aborts loudly so you investigate the actual deploy by hand. A failed smoke test
   is never silently retried or auto-fixed further than that one rollback.

Set `VPS_HOST`, `VPS_USER`, `VPS_APP_DIR`, `VPS_APP_URL`, and `SSH_KEY` as env vars (or edit the
defaults at the top of the script) before the first run that could reach Step 8.

## What "full auto" actually means here

Per your instruction, this script does not pause for your approval at any step — including
merging PRs, tagging, and merging to `main`. The safety net is entirely mechanical: CI must
genuinely pass (re-verified locally, not just trusted from Codex's self-report), the diff must
avoid the forbidden paths above, the architecture-review step must return a plain PASS, and the
periodic audit must return a plain PASS (not PASS WITH CONDITION) before the RC/tag stage will
fire. If any of those checks fail, the script aborts loudly into the log — it does not retry, do
not weaken a check, and does not proceed to a following stage on a partial pass.

Read `logs/<run-id>.log` after each run rather than watching it live — that's the whole point of
unattended execution.

## Logs

Every run writes to `logs/<timestamp>.log` plus the intermediate artifacts (task brief, Codex
output, diff, review verdict, audit output) as separate files with the same run-id prefix. These
are gitignored by default — add a `.gitignore` entry for `scripts/os-pipeline/logs/` if it isn't
already covered by a broader ignore rule, since they're personal run artifacts, not project
history (the actual audit reports the pipeline produces under `audit/` are still committed as
usual).
