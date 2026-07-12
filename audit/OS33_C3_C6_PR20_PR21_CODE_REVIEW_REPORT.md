# OS 3.3 Round 2 — C3 Legacy Package Boundary + C4-C6 Hardening Cleanup Code Review Report (PR #20–#21)

| Field       | Value                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| Review Type | Code Review (not Release Audit)                                         |
| Review Date | 2026-07-10                                                              |
| Reviewer    | Claude Code (Audit Engineer)                                            |
| Repository  | sohoteam88/NextShift-OS-2.0                                             |
| Branch      | `planning/os-3.3-runtime-platform` HEAD `888b04e` (PR #21 merge commit) |
| PRs         | #20 C3 Legacy Package Boundaries · #21 C4-C6 Hardening Cleanup         |
| Verdict     | **PASS**                                                                |

---

## Files Reviewed

**PR #20 — C3 Legacy Package Boundaries**

| File | Type |
| ---- | ---- |
| `packages/runtime-core/README.md` | New — boundary declaration |
| `packages/runtime-adapters/README.md` | New — boundary declaration |
| `packages/runtime-orchestrator/README.md` | New — boundary declaration |
| `packages/workspace-runtime/README.md` | New — boundary declaration |

**PR #21 — C4-C6 Hardening Cleanup**

| File | Type |
| ---- | ---- |
| `src/lib/runtime-flags.ts` | New — C4 flag registry |
| `src/modules/revenue-drivers/runtime/retired-revenue-flag-helper.ts` | Modified — delegates to registry |
| `src/modules/analytics/runtime/retired-analytics-flag-helper.ts` | Modified — delegates to registry |
| `next.config.mjs` | Modified — C5 tightened image remotePatterns |
| `src/app/api/v1/tenant/check-slug/route.ts` | Modified — C5 rate limiting |
| `src/app/api/v1/public/member/invite/[code]/route.ts` | Modified — C5 rate limiting |
| `.eslintrc.json` | Modified — C5 module boundary rules (1770 lines) |
| `docs/nextshift-os-3/LAYER_ROADMAP_P0.md` | New — C6 layer roadmap doc (416 lines) |
| `docs/nextshift-os-3/MASTER_INDEX.md` | Modified — entry #11 added |
| `docs/nextshift-os-3/runtime-standard/RUNTIME_ADAPTER_STANDARD.md` | Modified — C-002 resolution |

---

## Blocking Issues

**None.**

---

## CP6 (Round 1 Deferred) — Legacy Package Boundary Declarations

**PASS**

### README Accuracy vs. Actual Exports

**`@nextshift/runtime-core`** (1 source file, 100 lines; 1 test file, 2 tests)

README claims: "lightweight workflow event types, execution context types, result types, `createRuntimeEvent()` / `isRuntimeEvent()` helpers used by event-bus, runtime-adapters, runtime-orchestrator, and workspace-runtime."

Actual `src/index.ts` exports: `RuntimeEventType`, `RuntimeEventSource`, `RuntimeStatus` (union types), `RuntimeExecutionContext`, `RuntimeEvent<TPayload>`, `RuntimeResult<TOutput>` (interfaces), `createRuntimeEvent()`, `isRuntimeEvent()` (functions). ✓

Dependents confirmed via source imports in:
- `packages/runtime-adapters`: imports `createRuntimeEvent`, `RuntimeEvent` ✓
- `packages/runtime-orchestrator`: imports `createRuntimeEvent`, `RuntimeEvent`, `RuntimeExecutionContext`, `RuntimeResult` ✓
- `packages/workspace-runtime`: imports `createRuntimeEvent`, `RuntimeEvent`, `RuntimeExecutionContext` ✓

Decision "retained because it has real dependents and active package tests" — accurate. ✓

---

**`@nextshift/runtime-adapters`** (4 source files; 1 test file, 4 tests)

README claims: "workflow-facing adapter interfaces and in-memory implementations used by runtime-orchestrator and workspace-runtime, for repository health, business decisions, and CRM lead qualification."

Actual barrel export: `export * from "./repository"; export * from "./business"; export * from "./crm"`. Three sub-modules confirmed. ✓

Dependents confirmed:
- `packages/runtime-orchestrator` imports: `BusinessDecisionResult`, `BusinessRuntimeAdapter`, `CleanupCandidate`, `RepositoryRuntimeAdapter`, `ValidationResult` ✓
- `packages/workspace-runtime` imports: `BusinessDecisionResult`, `BusinessRuntimeAdapter`, `CRMLead`, `CRMRuntimeAdapter`, `CRMStatusUpdateSimulationResult`, `CRMValidationResult`, `LeadScoringRequest` ✓

Decision "retained because it has real workflow adapter logic and is depended on by runtime orchestrator and workspace runtime packages" — accurate. ✓

---

**`@nextshift/runtime-orchestrator`** (1 source file; 1 test file, 6 tests)

README claims: "legacy RuntimeOrchestrator workflow runner, approval gate behavior, repository health workflow, simulation validation, and audit trail abstractions."

Actual `src/index.ts` exports: `RuntimeOrchestrator` class (full implementation), `RuntimeApprovalGate` interface, `RuntimeWorkflow` / `RuntimeWorkflowStep` / `RuntimeWorkflowExecution` types, `RuntimeStep` interface with `execute()`. ✓

Decision "retained because it contains real orchestration logic and active tests" — accurate. ✓

---

**`@nextshift/workspace-runtime`** (1 source file; 1 test file, 6 tests)

README claims: "workspace session state, runtime task timelines, operator decision handling, business decision attachment, and CRM lead qualification workflow."

Actual `src/index.ts` exports: `WorkspaceSessionStatus`, `RuntimeTimeline` class (with `record()`, `list()`, `byEventType()`), `RuntimeTimelineEntry`, `InMemoryRuntimeEventConsole`, `OperatorContext`, `OperatorDecision`, `ConversationContext`, `ConversationMessage`. ✓

Decision "retained because it contains real workspace workflow logic and active tests" — accurate. ✓

---

### No New Code Using Legacy Packages as Adapter Platform

`grep` of entire `src/` for imports from `@nextshift/runtime-core`, `@nextshift/runtime-adapters`, `@nextshift/runtime-orchestrator`, `@nextshift/workspace-runtime`: **zero results**.

The two OS 3.3 pilot adapters import exclusively from `@nextshift/runtime` (the canonical package). ✓

All four READMEs include an explicit prohibition:
> "New Runtime Capability Adapters must use `@nextshift/runtime` and must not use this package as a second adapter platform."

**CP6: PASS ✓**

---

## 1. C4 — Flag Registry (`src/lib/runtime-flags.ts`)

**PASS**

### `=== 'true'` Semantics Preserved

Before PR #21, both flag helpers defined the comparison inline:

```ts
// Before (Pilot 1 / Pilot 2 pattern)
return env[retiredRevenueFlagConstant] === 'true';
```

After PR #21, both helpers delegate to the registry:

```ts
// retired-revenue-flag-helper.ts
export function retiredRevenueFlagHelper(env: NodeJS.ProcessEnv = process.env) {
  return isRuntimeFlagEnabled(retiredRevenueFlagConstant, env);
}

// src/lib/runtime-flags.ts
export function isRuntimeFlagEnabled(flag: RuntimeFlagName, env: NodeJS.ProcessEnv = process.env) {
  return env[flag] === 'true';
}
```

`isRuntimeFlagEnabled` is a pure delegation: same `env` parameter, same `=== 'true'` strict comparison, same flag name constant. The observable behavior is identical in every call path. ✓

`env` DI parameter preserved at both levels — test injection continues to work without changes to test setup. ✓

### Existing Adapter Tests: Zero Assertion Changes

Round 1 test files (`analytics-runtime-adapter.test.ts`, `analytics-runtime-callsite.test.ts`, `revenue-driver-intent-callsite.test.ts`) use `process.env.NEXT_PUBLIC_ENABLE_RUNTIME_*` directly and restore via `afterEach`. The registry reads from the same env vars via the same env object. No test assertions were changed. Full test suite: 345 passed (unchanged from Round 1). ✓

### Registry Structure

```ts
export const RUNTIME_FLAGS = {
  REVENUE: {
    name: 'retiredRevenueRuntimeFlag',
    module: 'revenue-drivers',
    introducedAt: '2026-07-09',
    removalCondition: 'Remove after the Revenue Runtime Adapter becomes the default path...',
  },
  ANALYTICS: {
    name: 'retiredAnalyticsRuntimeFlag',
    module: 'analytics',
    introducedAt: '2026-07-09',
    removalCondition: 'Remove after the Analytics Runtime Adapter becomes the default path...',
  },
} as const satisfies Record<string, RuntimeFlagDefinition>;
```

`as const satisfies Record<string, RuntimeFlagDefinition>` enforces the `RuntimeFlagDefinition` type at compile time while preserving literal types. The `RuntimeFlagName` union is derived from the registry entries — new flags must be added here first. ✓

**C4: PASS ✓**

---

## 2. C5 — Security Hardening

### 2a. Image Domain Allowlist

**PASS**

PR #21 replaces a wildcard `remotePatterns` with 5 specific entries in `next.config.mjs`:

| Domain | Purpose | Evidence in codebase |
| ------ | ------- | -------------------- |
| `*.supabase.co` | Uploaded content: member avatars, tenant logos, funnel images | `uploadMemberAvatar()`, `uploadTenantLogo()`, `/api/v1/funnel/upload` — all use `supabase.storage.from('public').getPublicUrl()` → returns `<SUPABASE_URL>/storage/...` ✓ |
| `lh3.googleusercontent.com` | Google OAuth profile avatar | Supabase auth returns `avatar_url` from Google OAuth user metadata ✓ |
| `avatars.githubusercontent.com` | GitHub OAuth profile avatar | Supabase auth returns `avatar_url` from GitHub OAuth user metadata ✓ |
| `secure.gravatar.com` | Gravatar avatar fallback | Defensive allowlist ✓ |
| `www.gravatar.com` | Gravatar avatar fallback | Defensive allowlist ✓ |

Full-codebase grep for hardcoded `https://` image URLs in `*.tsx`/`*.ts` found **zero** entries outside these domains.

All user-uploaded images go through `supabase.storage.from('public')` — no external image hosting service used elsewhere in the codebase. The allowlist is complete. ✓

---

### 2b. Rate Limiting — `check-slug` and `invite`

**PASS**

Both routes use `checkRateLimit(key, max, windowMs)` from `src/lib/rate-limit.ts`, which is Redis-backed in production and in-memory in dev.

**`GET /api/v1/tenant/check-slug`**

| Dimension | Implementation |
| --------- | -------------- |
| Key | `tenant-check-slug:${ip}` |
| Limit | 30 requests / hour (`60 * 60 * 1000` ms) |
| 429 body | `{ error: { code: 'RATE_LIMITED', message: 'Too many slug checks' } }` |
| Status | 429 ✓ |
| Placement | Before any DB query — rejects at the gateway ✓ |

**`GET /api/v1/public/member/invite/[code]`**

| Dimension | Implementation |
| --------- | -------------- |
| Key | `member-invite:${ip}:${code}` |
| Limit | 20 requests / hour |
| 429 body | `{ error: { code: 'RATE_LIMITED', message: 'Too many invite lookups' } }` |
| Status | 429 ✓ |
| Key includes `code` | Limits per-IP per-code — attacker cannot try 20 times per code per hour from the same IP ✓ |
| Placement | Before `inviteService.validateInvite(code)` ✓ |

**IP extraction:**

Both routes use:
```ts
const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
```

`.split(',')[0]` takes the first (leftmost) value from the `x-forwarded-for` header. This is correct for deployments where a trusted proxy (nginx, Cloudflare) controls header injection. See Advisory D-001 below.

**`checkRateLimit` implementation:** Redis (`incr` + `expire`) in production; in-memory `Map` with expiry check in dev. The in-memory fallback is single-instance only (expected for dev). ✓

---

### 2c. Advisory D-001 — `x-forwarded-for` First-Position Spoofing (Non-blocking)

`x-forwarded-for` first-position parsing (`split(',')[0]`) is only reliable when the deployment enforces that no client-supplied header reaches the application — i.e., the first upstream proxy (nginx or Cloudflare) strips or overwrites the header before appending its own value.

If running behind Cloudflare: use `cf-connecting-ip` for the authoritative real IP. If running behind a self-managed nginx reverse proxy: confirm `proxy_set_header X-Forwarded-For $remote_addr;` (not `proxy_add_x_forwarded_for`) is set to replace rather than append.

Rate limiting by spoofable IP is better than no rate limiting; this does not block merge. **Recommended before production hardening sprint:** align the IP extraction header with the specific upstream proxy in use.

---

## 3. C5 — ESLint Module Boundary Baseline

**PASS**

### Baseline Reproduced: 192 Warnings / 0 Errors

Actual `pnpm lint` output: **192 warnings, 0 errors** — matches the specification exactly. ✓

All 192 warnings are `no-restricted-imports` violations surfacing pre-existing cross-module imports. No new violations were introduced by PR #20 or PR #21. The rules are set to `"warn"` — existing code is documented (not broken), future cross-module imports in the same modules will also warn. ✓

### Override Block Coverage: 68/68 Modules

`.eslintrc.json` has exactly **68 override blocks** (`"files"` entries), covering all 68 `src/modules/*` directories. No module is missing an override. ✓

### Spot-check of 3 Override Blocks

| Override | Files glob | Allow list |
| -------- | ---------- | ---------- |
| #1 (activation) | `src/modules/activation/**/*.{ts,tsx}` | self + `ai` + `auth` (6 allowances) |
| #34 (i18n) | `src/modules/i18n/**/*.{ts,tsx}` | self + `ai` + `auth` (6 allowances) |
| #68 (workspace) | `src/modules/workspace/**/*.{ts,tsx}` | self + `ai` + `auth` (6 allowances) |

All three blocks are structurally identical: `no-restricted-imports` warn, `patterns` blocks all `@/modules/*` except self, `@/modules/ai/**`, and `@/modules/auth/**`. The error message is the same across all overrides. ✓

Glob pattern `**/*.{ts,tsx}` correctly covers both deep sub-directories and root-level files within each module. ✓

---

## 4. C6 — Layer Roadmap Documentation

**PASS**

`docs/nextshift-os-3/LAYER_ROADMAP_P0.md` created (416 lines) — Layer 1 through Layer 8+ roadmap content with ✅/🆕 status markers. ✓

`docs/nextshift-os-3/MASTER_INDEX.md` updated — entry #11 points to `LAYER_ROADMAP_P0.md`. ✓

`pnpm docs:links` validates 1011 files — **passes**. The new file and the new MASTER_INDEX entry have valid internal links. ✓

---

## 5. Audit C-001 — `isEnabled` Calls Real Flag Helper (Round 1 Commitment)

**CONFIRMED ✓**

Both pilot adapters' `isEnabled` implementations route through the real flag helpers:

**Revenue (`RevenueRuntimeAdapter.ts:90-91`):**
```ts
isEnabled: (_input, _resolution, dependencies) =>
  dependencies.isEnabled?.() ?? retiredRevenueFlagHelper(),
```
- Production path: `retiredRevenueFlagHelper()` → `isRuntimeFlagEnabled(retiredRevenueFlagConstant, env)` → `env['retiredRevenueRuntimeFlag'] === 'true'` ✓
- Test injection path: `dependencies.isEnabled()` — allows overriding without touching env ✓

**Analytics (`AnalyticsRuntimeAdapter.ts:99-100`):**
```ts
isEnabled: (_input, _projection, dependencies) =>
  dependencies.isEnabled?.() ?? retiredAnalyticsFlagHelper(),
```
- Production path: `retiredAnalyticsFlagHelper()` → `isRuntimeFlagEnabled(retiredAnalyticsFlagConstant, env)` → `env['retiredAnalyticsRuntimeFlag'] === 'true'` ✓
- Test injection path: `dependencies.isEnabled()` — no real flag check needed in tests ✓

**C-001 closed. Both adapters call the real registry-backed flag helper in the production path, with clean DI override for testing.**

---

## 6. C-002 Resolution — RUNTIME_ADAPTER_STANDARD.md

**CONFIRMED ✓**

Round 1 Advisory C-002 ("createWarningPayload receives full input; future adapters that spread input naively could leak PII") is now documented in `RUNTIME_ADAPTER_STANDARD.md`:

> "`createWarningPayload` must explicitly enumerate safe fields. It must not directly spread `input`, request objects, runtime payloads, context metadata, or dependency objects because that can leak tenantId, userId, headers, cookies, tokens, API keys, credentials, or raw runtime payloads into logs."

The checklist section also includes:
> "Fallback warnings do not include tenantId, userId, tokens, API keys, credentials, raw error messages, or stack traces."

**C-002 closed. Both current adapters comply; future adapters are now bound by documented standard.**

---

## 7. Full Validation Commands

All commands executed locally against HEAD `888b04e`.

| Command | Result | Detail |
| ------- | ------ | ------ |
| `pnpm type-check` | **PASS** | 0 errors |
| `pnpm test` | **PASS** | 62 files passed \| 7 skipped; 345 tests passed \| 44 skipped |
| `pnpm -r --filter './packages/*' test` | **PASS** | runtime: 9/82; runtime-core: 1/2; runtime-adapters: 1/4; runtime-orchestrator: 1/6; workspace-runtime: 1/6; domain: 42/332; application: 45/248; decision-brain: 7/59 |
| `pnpm build` | **PASS** | Clean Next.js build, all routes compiled |
| `pnpm lint` | **PASS** | 0 errors; **192 warnings** (baseline; all pre-existing cross-module imports) |
| `pnpm docs:links` | **PASS** | 1011 files validated |

---

## Non-Blocking Advisories

### D-001 — `x-forwarded-for` First-Position Under Multi-Proxy / CDN

**Area:** Security hardening / rate limiting  
**Severity:** Non-blocking advisory

Both `check-slug` and `invite` extract the rate-limit key IP via:

```ts
request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
```

In a typical Cloudflare-fronted deployment the header value includes both the client IP and Cloudflare's edge IP. A client that injects a spoofed `x-forwarded-for: <arbitrary-ip>` before the CDN can potentially bypass per-IP rate limits.

**Recommendation before production hardening sprint:** Check upstream proxy configuration. If using Cloudflare, prefer `request.headers.get('cf-connecting-ip')`. If using nginx without CDN, confirm `proxy_set_header X-Forwarded-For $remote_addr;` (replace mode) is active. No code change required until deployment topology is confirmed.

---

## Summary

| Checkpoint | Verdict | Key finding |
| ---------- | ------- | ----------- |
| CP6 — Legacy boundary declarations | PASS ✓ | All 4 READMEs accurate vs. exports; zero `src/` imports from legacy packages |
| C4 — Flag registry | PASS ✓ | `=== 'true'` semantics identical; 345 tests unchanged |
| C5 — Image domains | PASS ✓ | All 5 domains match real upload/OAuth paths; no unlisted domains found |
| C5 — Rate limiting | PASS ✓ | Correct key construction; 429 shape; Redis-backed in prod |
| C5 — ESLint baseline | PASS ✓ | 192 warn / 0 error reproduced; 68/68 modules covered |
| C6 — Layer roadmap docs | PASS ✓ | LAYER_ROADMAP_P0.md indexed; docs:links 1011 files pass |
| Audit C-001 (Round 1 promise) | CONFIRMED ✓ | Both pilot adapters call real registry-backed flag helpers |
| Audit C-002 (Round 1 promise) | CONFIRMED ✓ | RUNTIME_ADAPTER_STANDARD.md updated with prohibition on spreading input |
| Full validation | PASS ✓ | type-check / test / packages test / build / docs:links all green |

**Overall: PASS — no blocking findings. 1 non-blocking advisory (D-001).**
