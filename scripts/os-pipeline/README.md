# OS Pipeline — Autonomous Blueprint Execution

This is a personal orchestration script, not a NextShift product feature. It automates the
triangle workflow (Architecture Review → Codex execution → verification → review → merge →
periodic audit → RC/tag) end-to-end, unattended.

`./run-pipeline.sh` runs **one supervised cycle**: it picks the next open item from the active
blueprint, gets it built, verified, reviewed, checked by GitHub Actions, merged, and periodically
audited. `./run-loop.sh` is the bounded unattended wrapper: it starts these single cycles with a
lock, stop switch, daily ceiling, and failure backoff.

## Graduation path for autonomy

Move through these stages deliberately:

1. **Supervised single cycle** — run `./run-pipeline.sh` and inspect its artifacts.
2. **Unattended single cycle ×3–5** — allow several clean single cycles, reviewing every abort
   and merge result.
3. **Bounded loop** — run `./run-loop.sh` with the default limit of three cycles per day.
4. **Wider automation** — only raise `MAX_CYCLES_PER_DAY` after the bounded loop has a stable,
   reviewed record. Do not weaken the abort, PR-check, or audit gates to make it faster.

## Before first run

1. Open `run-pipeline.sh` and fill in `CLAUDE_CMD` and `CODEX_CMD` for your actual CLI syntax —
   the placeholders are guesses. Both must run non-interactively (no prompts) and exit non-zero
   on failure.
2. Confirm `gh` (GitHub CLI) is authenticated (`gh auth status`).
3. Confirm you're comfortable with `BASE_BRANCH` and `BLUEPRINT_PATH` at the top of the script —
   update `BLUEPRINT_PATH` whenever you start a new OS version blueprint. The script does not
   guess which blueprint is "current."
4. Do a dry run by hand first: read the task brief it produces (Step 1) before letting it reach
   Step 2 (Codex execution) for the first time on a new blueprint, just to sanity-check the task
   selection logic is picking the item you'd expect.
5. Commit this directory (`scripts/os-pipeline/`) to a branch so it isn't lost — it previously
   sat untracked and was wiped when the working environment was recycled. Keep it out of release
   branches/tags if you don't want it in the shipped product history, but it needs to live
   *somewhere* with git history.

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

This step runs automatically after a fresh tag, per your instruction — since NextShift OS has no
real users yet, the "product timing" judgment that used to gate this manually (see the OS 3.5
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

Note: as of OS 3.6, `deploy.yml` already deploys automatically on every merge to `main` (it
triggers off the `CI` workflow completing on `main`), so in practice Step 8's container-restart
call is often a no-op re-assertion of the already-deployed state — its real job is the flag
reveal and the independent smoke-test verification, not the deploy itself.

## What "full auto" actually means here

Per your instruction, this script does not pause for your approval at any step — including
merging PRs, tagging, and merging to `main`. The safety net is entirely mechanical: CI must
genuinely pass (re-verified locally, not just trusted from Codex's self-report), the diff must
avoid the forbidden paths above, the architecture-review step must return a plain PASS, and the
periodic audit must return a plain PASS (not PASS WITH CONDITION) before the RC/tag stage will
fire. If any of those checks fail, the script aborts loudly into the log — it does not retry, do
not weaken a check, and does not proceed to a following stage on a partial pass.

Because this hasn't been run end-to-end yet, treat the first real invocation as a supervised
trial: tail the log live (`tail -f logs/<run-id>.log`) rather than walking away, at least through
Step 5 (merge), before trusting it to run unattended in a loop through Steps 6-8.

Read `logs/<run-id>.log` after each run rather than watching it live once you trust it — that's
the whole point of unattended execution.

## Bounded loop mode

Run the loop from this directory:

```bash
./run-loop.sh
```

It uses `flock` on `.loop.lock`, so a second loop cannot run concurrently. Each cycle still uses
the detached `tmux` runner from `run-pipeline.sh`; the wrapper waits for that cycle's durable
`logs/<run-id>-exit-code` file before deciding whether it was `OK` or `ABORT`.

Configuration is environment-based:

```bash
MAX_CYCLES_PER_DAY=3 SLEEP_SECONDS=600 ./run-loop.sh
```

- `MAX_CYCLES_PER_DAY` defaults to `3`, counted from base cycle logs for the current day.
- `SLEEP_SECONDS` defaults to `600` (10 minutes); `ABORT_BACKOFF_SECONDS` defaults to the same
  value.
- After two consecutive aborts, the loop writes `NEEDS_HUMAN` and exits rather than retrying.
- Create `logs/STOP` to stop cleanly before the next cycle: `touch logs/STOP`. Remove it only
  after reviewing the prior run and intentionally resuming.
- `logs/.blocked-items` is append-only evidence of items that failed Step 3 verification or a
  Step 4 architecture review. Future task briefs are told to skip these items. If an item appears
  twice, the pipeline writes `NEEDS_HUMAN` and stops.

`NOTIFY_WEBHOOK` is optional. If configured, the loop sends one plain-text `OK` or `ABORT` line
per cycle. A zero-configuration ntfy.sh example (choose a private topic name) is:

```bash
NOTIFY_WEBHOOK='https://ntfy.sh/your-private-nextshift-pipeline-topic' ./run-loop.sh
```

The notification is advisory: a webhook failure is logged but never changes the pipeline result.

## Logs

Every run writes to `logs/<timestamp>.log` plus the intermediate artifacts (task brief, Codex
output, diff, review verdict, audit output) as separate files with the same run-id prefix. These
are gitignored by default — add a `.gitignore` entry for `scripts/os-pipeline/logs/` if it isn't
already covered by a broader ignore rule, since they're personal run artifacts, not project
history (the actual audit reports the pipeline produces under `audit/` are still committed as
usual).
