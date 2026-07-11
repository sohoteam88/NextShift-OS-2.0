# OS 3.5 Business Discussion Release Notes

Version: 3.5 RC

Status: RC Package Prepared - Awaiting Approval

Last Updated: 2026-07-11

---

## Summary

OS 3.5 gives users their first way to talk to the Business Brain, and closes the first complete runtime flag lifecycle loop (graduate → remove legacy → record history).

The release adds a Business Discussion service and UI anchored to the current recommendation, routes all LLM traffic through the `modules/ai` router with a per-tenant daily quota, graduates the four remaining runtime flags to default ON, physically removes the Revenue and Analytics legacy fallback branches promised since OS 3.3, and adds a compile-time-enforced flag lifecycle field to the runtime flag registry.

This package prepares OS 3.5 for approval. It does not create the `v3.5.0` tag or deploy production.

---

## User-Facing Capability

### Discuss With AI

When `NEXT_PUBLIC_ENABLE_AI_DISCUSSION=true`, the Today's Recommendation card shows a "Discuss with AI" entry point. Opening it starts a Business Discussion anchored to:

- the current recommendation
- the decision context that produced it

The discussion is capped at 5 turns per session, with a visible turn counter (`第 N/5 轮`) that switches to a warning state at the limit. It is explicitly not an open-ended chat — off-topic questions are declined by design, matching the product's "Business Discussion, not ChatGPT" positioning.

Error states are distinguished in the UI:

- `quota` — daily AI quota exhausted (`今日 AI 额度已用完`)
- `turns` — turn limit reached, shows a CTA to redirect
- `generic` — fallback error message

When the flag is OFF, the discussion entry point does not render.

---

## Runtime Platform Changes

### Flag Graduation (G1)

Four runtime flags graduate to default ON:

```text
NEXT_PUBLIC_ENABLE_RUNTIME_MISSION
NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE
NEXT_PUBLIC_ENABLE_RUNTIME_CRM
NEXT_PUBLIC_ENABLE_COMMAND_CENTER
```

Explicit `false` still disables each path; any non-`'true'` value is treated as OFF. Legacy fallback remains reachable via explicit override.

### Legacy Removal (G2a, G2b)

The Revenue and Analytics runtime adapters — graduated to default ON in OS 3.4 — have their flag-controlled legacy-only code branches physically deleted:

- `src/modules/revenue-drivers/runtime/runtime-revenue-flag.ts` — removed
- `src/modules/analytics/runtime/runtime-analytics-flag.ts` — removed
- Both adapters now hard-code `isEnabled: () => true`

The only remaining fallback is the runtime-construction-failure safety net (unrelated to the flag), which is Sentry-observable via the fallback logger introduced in OS 3.4. Zero residual references were confirmed by full-repository grep.

### Flag Lifecycle Registry (G3)

`src/lib/runtime-flags.ts` records `lifecycleStatus: 'introduced' | 'graduated'` per flag, enforced by a compile-time discriminated union — a `graduated` entry without `graduatedAt`, or an `introduced` entry with `graduatedAt`, fails to compile. A runtime test closes any `as any` escape hatch.

| Flag | lifecycleStatus | graduatedAt |
|------|-----------------|-------------|
| MISSION | graduated | 2026-07-11 |
| BUSINESS_STATE | graduated | 2026-07-11 |
| CRM | graduated | 2026-07-11 |
| COMMAND_CENTER | graduated | 2026-07-11 |
| AI_DISCUSSION | introduced | — |

Removed flags (Revenue, Analytics) are not duplicated into the registry — their history lives in `docs/nextshift-os-3/runtime-standard/RUNTIME_FLAG_LIFECYCLE.md`, which the registry now points to as the retired-flag record.

### AI Router Readiness (T1)

Before the discussion feature shipped, the `modules/ai` router was audited for readiness and gained a per-tenant daily call quota:

```text
AI_DAILY_CALL_LIMIT_PER_TENANT (default 200)
```

Requests over the daily limit receive a structured `429 QUOTA_EXCEEDED` response before any router dispatch, with a UTC day-boundary reset window.

### ESLint CLI Migration (H-A)

`next lint` (and the 1771-line legacy `.eslintrc.json`) is replaced by ESLint CLI with a flat config plus an auto-generated module-boundary ruleset. The authoritative lint baseline is **409 boundary warnings + 4 hooks warnings, 0 errors** — this supersedes the previously reported 192/413 counts, which were artifacts of `next lint`'s reduced coverage rather than real regressions. A boundary generator (`scripts/generate-eslint-boundaries.ts --check`) keeps the ruleset in sync with `src/modules` and is checked in CI.

### Hygiene Batch (H-B)

- `getAuthUser` wrapped in `React.cache()` to remove duplicate per-request session queries on admin pages (with a safe no-op fallback if `React.cache` is unavailable)
- Health and version endpoints send `no-store` (closes the deployment-verification cache-confusion issue from v3.4.0)
- Obsolete `version` field removed from Docker Compose files

### Card Iteration (H-C)

The Today's Recommendation card gained a four-tier confidence display:

| Condition | Source Label | Confidence Badge |
|-----------|--------------|-------------------|
| `source === 'rule'` | 新手引导 | none |
| confidence < 0.5 | 探索性建议 | none |
| 0.5 ≤ confidence < 0.7 | AI 分析 | none |
| confidence ≥ 0.7 | AI 分析 | `{n}%` badge |

---

## Quality Summary

- Round 5 audit covers PR #38-#47 and concludes **PASS**.
- Unit tests: 417 passed, 44 skipped, 76 test files (`pnpm test`).
- `pnpm type-check`: 0 errors.
- ESLint CLI baseline: 409 boundary warnings + 4 hooks warnings, 0 errors (reproduced in GitHub Actions CI on PR #44-#47).
- E2E: 59 test cases across 8 spec files; PR #46/#47 CI both report E2E Tests PASS (7m38s, 7m50s).
- Discussion panel UI follows the shared-component / zero-arbitrary-value / zero-hex iron rules (verified by grep).
- Round 4's R-1 observability condition remains closed (carried from OS 3.4, unaffected by this release).

---

## Known Limitations

### AI_DISCUSSION Flag Default OFF

`NEXT_PUBLIC_ENABLE_AI_DISCUSSION` remains strictly default OFF. The discussion entry point appears only when explicitly enabled per environment.

### Production VPS Flags Unchanged By This Release

The production `.env.production` currently pins `NEXT_PUBLIC_ENABLE_RUNTIME_MISSION=false`, `NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE=false`, and `NEXT_PUBLIC_ENABLE_RUNTIME_CRM=false` explicitly. Because an explicit env value takes priority over the code-level default, these three modules remain OFF in production after `v3.5.0` deploys, until Steven updates that file. This is the intended final reveal switch, not a bug.

### No New Runtime Module Migration

OS 3.5 does not migrate additional modules to the runtime adapter pattern. Coverage remains 5 of 68 modules (Revenue, Analytics, Mission Engine, Business State, CRM).

### No UI Overhaul

UI changes in this release are limited to the recommendation card and its discussion panel, following the existing "no big redesign, follow the runtime migration" strategy.

### Local Audit Sandbox Limitation

The Round 5 audit's local sandbox could not run `pnpm lint`, `pnpm build`, or E2E directly due to a missing `pnpm install` step in that environment. These checks were closed using GitHub Actions CI evidence from the constituent PRs instead of being left open — see [Final Verification](FINAL_VERIFICATION.md) for detail.

---

## Release Decision

```text
OS 3.5 RC prepared, awaiting approval
```
