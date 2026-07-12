# OS 3.5 Business Discussion Tag Preparation

Version: 3.5 RC

Status: Prepared - Tag Not Created

Last Updated: 2026-07-11

---

## Purpose

Prepare the OS 3.5 final tag recommendation without creating or pushing a tag.

---

## Recommended Tag

```text
v3.5.0
```

---

## Why Final v3.5.0 Instead Of RC Tag

The recommended tag is `v3.5.0`, not `v3.5.0-rc1`, because the OS 3.5 release criteria are closed:

1. One audit round (Round 5) is recorded and concludes PASS with no blocking conditions.
2. All AI discussion traffic is confirmed to route exclusively through the `modules/ai` router, with a per-tenant daily quota enforced before dispatch.
3. The four remaining runtime flags (Mission, Business State, CRM, Command Center) are graduated to default ON.
4. The Revenue and Analytics legacy fallback branches — promised for removal since OS 3.3 — are physically deleted with zero residual references and behavior-equivalence test coverage.
5. The runtime flag registry gains a compile-time-enforced lifecycle field, closing the flag graduation → removal → history audit loop.
6. ESLint CLI migration is complete with a deterministic, CI-reproducible baseline (409 boundary + 4 hooks warnings, 0 errors).
7. Full validation (type-check, unit tests, lint, build, E2E) is green, verified either directly in the Round 5 audit sandbox or via GitHub Actions CI on the constituent PRs.
8. The release package follows the OS 3.3/3.4 structure and canonical status documents (`NEXT_ACTION.md`, `OS_3_5_BLUEPRINT.md`) are ready to update in one pass after approval.

---

## Tag Command To Run After Approval

Only run after Steven approves the release and the graduation merge from planning to `main` is complete:

```bash
git checkout main
git pull --ff-only
git tag -a v3.5.0 -m "OS 3.5 Business Discussion: AI-router-backed recommendation discussion, four-flag graduation, revenue/analytics legacy removal, flag lifecycle registry, ESLint CLI migration"
git push origin v3.5.0
```

---

## Not Executed In This Task

```text
No tag created.
No tag pushed.
No production deployment triggered.
No production .env.production changes made.
```

---

## Post-Tag Manual Steps (Steven)

These are not part of this package and are not automated:

1. Deploy `v3.5.0` to the VPS following the existing deploy pipeline.
2. Verify the `/api/v1/version` endpoint at the deployed commit, using a cache-buster query parameter (the endpoint sits behind a proxy cache — this tripped up v3.4.0 verification).
3. Update VPS `.env.production`:
   - Remove or flip `NEXT_PUBLIC_ENABLE_RUNTIME_MISSION=false`, `NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE=false`, `NEXT_PUBLIC_ENABLE_RUNTIME_CRM=false` to let the code-level graduated defaults take effect.
   - Decide when to flip `NEXT_PUBLIC_ENABLE_AI_DISCUSSION=true` — this is the reveal switch for the release's headline feature and should be a deliberate, separate decision.
4. `compose up` (or equivalent) to pick up the env changes — no image rebuild required, per the existing runtime flag pattern.

---

## Approval Gate

Tag creation requires explicit Steven approval after this package is reviewed.
