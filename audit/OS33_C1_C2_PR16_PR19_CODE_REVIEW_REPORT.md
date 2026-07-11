# OS 3.3 — C1 Callsites + C2 Adapter Factory Code Review Report (PR #16–#19)

| Field       | Value                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| Review Type | Code Review (not Release Audit)                                         |
| Review Date | 2026-07-09                                                              |
| Reviewer    | Claude Code (Audit Engineer)                                            |
| Repository  | sohoteam88/NextShift-OS-2.0                                             |
| Branch      | `planning/os-3.3-runtime-platform` HEAD `1168dc3` (PR #19 merge commit) |
| PRs         | #16 C1 Callsites · #17 C1.5 CI Triggers · #18 C1.6 E2E Gate · #19 C2 Adapter Factory |
| Verdict     | **PASS**                                                                |

---

## Pilot 2 Advisory Resolution

The one advisory raised in the Pilot 2 review is resolved in PR #16:

| Pilot 2 Advisory | Resolution |
| ---------------- | ---------- |
| B-001 — `analyticsService.ts` checks `retiredAnalyticsFlagHelper()` directly, leaking flag knowledge to the service layer | **RESOLVED** — PR #16 replaces direct flag check with `AnalyticsCenterRuntimeOptions.resolveRuntimeProjection` DI; service always delegates to the adapter and never imports the flag helper |

---

## Files Reviewed

**PR #16 — C1 Callsites**

| File | Type | Lines |
| ---- | ---- | ----- |
| `src/modules/revenue-drivers/services/revenue-driver-intent-service.ts` | New — revenue intent audit service | 74 |
| `src/app/api/v1/revenue-drivers/intent/route.ts` | Modified — delegates to service | 22 |
| `src/modules/analytics/analyticsService.ts` | Modified — adds runtimeOptions DI | 69 |
| `src/__tests__/services/revenue-driver-intent-callsite.test.ts` | New — revenue callsite tests | 137 |
| `src/__tests__/services/analytics-runtime-callsite.test.ts` | New — analytics callsite tests | 164 |

**PR #17 — C1.5 CI Triggers**

| File | Type |
| ---- | ---- |
| `.github/workflows/ci.yml` | Modified — adds `test` job + `pnpm -r --filter './packages/*' test` |

**PR #18 — C1.6 E2E Gate**

| File | Type |
| ---- | ---- |
| `.github/workflows/ci.yml` | Modified — adds `e2e-secrets` check job + `e2e` job (Playwright, graceful skip if secrets absent) |

**PR #19 — C2 Adapter Factory**

| File | Type | Lines |
| ---- | ---- | ----- |
| `packages/runtime/src/adapter/create-runtime-adapter.ts` | New — generic adapter factory | 337 |
| `packages/runtime/test/runtime-adapter-factory.test.ts` | New — factory unit tests | 148 |
| `src/modules/revenue-drivers/runtime/RevenueRuntimeAdapter.ts` | Refactored — now uses factory | 248 |
| `src/modules/analytics/runtime/AnalyticsRuntimeAdapter.ts` | Refactored — now uses factory | 259 |

---

## Blocking Issues

**None.**

---

## 1. Pilot 2 B-001 Resolution — `analyticsService.ts` DI Pattern

**PASS**

`analyticsService.ts` now accepts `runtimeOptions: AnalyticsCenterRuntimeOptions = {}`:

```ts
export type AnalyticsCenterRuntimeOptions = {
  onRuntimeResolved?: (runtime: AnalyticsRuntimeMetadata) => void;
  resolveRuntimeProjection?: typeof resolveAnalyticsRuntimeProjection;
};
```

The service always delegates to the adapter (via the injected function or the default):

```ts
const { projection, runtime } = await (
  runtimeOptions.resolveRuntimeProjection ?? resolveAnalyticsRuntimeProjection
)({ userId, tenantId, source: 'analytics-center', projectionType: 'analytics-center', workspaceFocus: analyticsFocus });
runtimeOptions.onRuntimeResolved?.(runtime);
```

`retiredAnalyticsFlagHelper()` is no longer imported at the service layer. Flag knowledge is fully encapsulated in the adapter. ✓

The `onRuntimeResolved` callback is fire-and-forget — it does not affect the returned `AnalyticsCenter` value. ✓

---

## 2. Revenue Callsite — `revenue-driver-intent-service.ts`

**PASS**

New service layer consolidates the previously inline audit-log logic from `route.ts`.

**Flag-OFF baseline parity** (verified against `git show 4e13568` baseline):

| Field | Baseline (`route.ts` inline) | Current (`recordRevenueDriverIntentAudit`) |
| ----- | --------------------------- | ------------------------------------------ |
| `tenantId` | `user.tenantId` | `user.tenantId` ✓ |
| `actorId` | `user.id` | `user.id` ✓ |
| `action` | `'intent.resolved'` / `'intent.invalid'` / `'intent.fallback'` | Same via `actionForStatus()` ✓ |
| `targetType` | `'revenue_driver_intent'` | `'revenue_driver_intent'` ✓ |
| `metadata.route` | `input.route` | `input.route` ✓ |
| `metadata.intent` | `input.intent ?? null` | `input.intent ?? null` ✓ |
| `metadata.resolvedTool` | `input.resolvedTool ?? null` | `input.resolvedTool ?? null` ✓ |
| `metadata.status` | `input.status` | `input.status` ✓ |
| `metadata.timestamp` | `input.timestamp ?? new Date().toISOString()` | same ✓ |
| `metadata.runtimeResolution` | absent | absent when `enabled === false` ✓ |
| Return value | `{ data: { action } }` (route-level) | `{ action }` (service returns) → `{ data }` at route ✓ |

Flag-OFF: `runtimeOutput.runtime.enabled === false` → the guard at line 52 (`if (runtimeOutput.runtime.enabled)`) prevents `runtimeResolution` from entering metadata. ✓

Flag-ON: `metadata.runtimeResolution = runtimeOutput.resolution.status` — cross-references the runtime adapter's resolution against the caller-supplied status for observability. The adapter call is synchronous (`.resolve()`), never blocking the auditLog write path. ✓

DI surface (`RevenueDriverIntentAuditOptions`): `auditLog`, `onRuntimeResolved`, `resolveRuntimeIntent` — all optional, all defaulting to production dependencies. Fully testable without database. ✓

---

## 3. API Route — `route.ts`

**PASS**

The route now delegates completely to `recordRevenueDriverIntentAudit`:

```ts
const data = await recordRevenueDriverIntentAudit(user, input);
return NextResponse.json({ data }, { status: 201 });
```

Response shape: `{ data: { action } }` — identical to baseline `NextResponse.json({ data: { action } }, { status: 201 })`. ✓

Input validation (`IntentAuditSchema`) unchanged: `route`, `intent`, `status`, `resolvedTool`, `timestamp` with same constraints. ✓

---

## 4. CI Workflow — PR #17 and PR #18

**PASS**

**PR #17 — `test` job:**
- Runs after `quality` (type-check + lint + build), enforcing gate ordering
- Spins up `postgres:17-alpine` service with health check (`pg_isready`)
- `pnpm test` (application + src integration tests)
- `pnpm -r --filter './packages/*' test` (monorepo package tests in parallel)
- `timeout-minutes: 15` ✓

**PR #18 — `e2e-secrets` + `e2e` jobs:**
- `e2e-secrets` checks all 7 required secrets; outputs `has-secrets=true/false` without failing the build
- `e2e` runs only `if: github.event_name == 'pull_request' && needs.e2e-secrets.outputs.has-secrets == 'true'`
- Graceful skip on missing secrets — summary written to `$GITHUB_STEP_SUMMARY`, exit 0 ✓
- Playwright: installs chromium only, `wait-on` health check before running suite
- Upload artifact on failure for trace inspection ✓
- `timeout-minutes: 20` ✓

Job dependency chain: `quality` → `test` → `e2e-secrets` → `e2e`. No job can pass before its upstream gates. ✓

---

## 5. Adapter Factory — `createRuntimeAdapter<>()`

**PASS**

Generic factory signature:

```ts
createRuntimeAdapter<
  TInput, TLegacyOutput, TSource, TConfidence, TWarning,
  TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>,
  TOutput, TDependencies
>(config: RuntimeAdapterConfig<...>)
```

Returns `{ resolve, resolveAsync }`.

**Required fields enforce Standard invariants at compile time:**

| Field | Required | Enforced invariant |
| ----- | -------- | ------------------ |
| `resolveLegacy` | ✓ | Legacy-first: must exist; called before isEnabled check |
| `isEnabled` | ✓ | Flag gate: must exist; omitting causes compile error |
| `createRuntimeMetadata` | ✓ | DI contract: runtime artifact builder must be provided |
| `composeOutput` | ✓ | Output composition must be explicit |
| `fallbackWarning` | ✓ | Warning taxonomy must be typed |
| `invalidOutputWarning` | ✓ | Warning taxonomy must be typed |
| `warningLogMessage` | ✓ | Log message must be provided |
| `createWarningPayload` | ✓ | Log-safety: payload builder must be implemented by adapter |
| `getFallbackConfidence` | optional | Defaults to `getConfidence` |
| `getLogger` | optional | Defaults to `console` |
| `validateRuntimeMetadata` | optional | |
| `classifyError` | optional | |

**Internal `resolveWithLegacy()` enforces behavioral order:**

```
1. resolveLegacy(input, dependencies)      ← always first
2. isEnabled() gate                         ← flag check
3. createRuntimeMetadata()                  ← runtime path only
4. catch → classifyError + warnRuntimeFallback + legacyFallback
```

This order is unconditional — adapters cannot reorder it. ✓

**`TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>`** enforces that `enabled`, `mode`, `source`, `fallback`, `confidence` fields exist in every adapter's output type. ✓

**Sync guard in `resolve()`:** throws `TypeError` if `resolveLegacy` returns a Promise in the sync path. Prevents async-in-sync adapter misuse. ✓

**Both adapters refactored to use the factory:**
- `RevenueRuntimeAdapter.ts`: 248 lines (down from 291 in Pilot 1) — factory eliminates duplicated scaffold; `resolve()` used (sync) ✓
- `AnalyticsRuntimeAdapter.ts`: 259 lines (down from 334 in Pilot 2) — `resolveAsync()` used (async) ✓

Both adapters' `createWarningPayload` implementations explicitly exclude `tenantId` / `userId`:
- Revenue: selects `{ warning, route, intent, status, source, errorKind? }` ✓
- Analytics: selects `{ warning, source, projectionType, workspaceFocus?, status, errorKind? }` ✓

---

## 6. Tests

**PASS**

**Factory tests (`packages/runtime/test/runtime-adapter-factory.test.ts`, 3 cases):**

| Test | Assertion |
| ---- | --------- |
| flag OFF | `{ enabled: false, mode: 'legacy', fallback: false }` |
| flag ON | `{ enabled: true, mode: 'runtime', fallback: false, contextId: ..., eventType: ... }` |
| runtime throws | `{ enabled: true, mode: 'legacy', fallback: true, diagnosticsStatus: 'degraded', errorKind: 'Error' }` + warn logged with payload |

**Revenue callsite tests (`src/__tests__/services/revenue-driver-intent-callsite.test.ts`, 3 cases):**

| Test | Assertion |
| ---- | --------- |
| flag OFF | `auditLog.create` receives exact baseline payload; no `runtimeResolution`; `runtimeMetadata[0].enabled === false` |
| flag ON | `runtimeMetadata[0]` contains all runtime fields; `not.toHaveProperty('tenantId')`; `not.toHaveProperty('userId')` |
| flag ON — audit metadata | `auditLog.create` receives `metadata` with `runtimeResolution: 'resolved'` |

**Analytics callsite tests (`src/__tests__/services/analytics-runtime-callsite.test.ts`, 2 cases):**

| Test | Assertion |
| ---- | --------- |
| flag OFF | `center.kpi` matches baseline values; `center` has no `runtime` property; `runtimeMetadata[0].enabled === false` |
| flag ON | `runtimeMetadata[0]` contains all runtime fields; `not.toHaveProperty('tenantId')`; `not.toHaveProperty('userId')` |

All tests use DI (`resolveRuntimeProjection`, `resolveRuntimeIntent`, `auditLog`) — no `vi.mock` of module boundaries. ✓

---

## 7. Validation Commands

All commands executed locally against HEAD `1168dc3`.

| Command | Result | Detail |
| ------- | ------ | ------ |
| `pnpm type-check` | **PASS** | 0 errors |
| `pnpm test` | **PASS** | 62 files passed \| 7 skipped; 345 tests passed \| 44 skipped |
| `pnpm -r --filter './packages/*' test` | **PASS** | runtime: 9 files / 82 tests; domain: 332; application: 248; workspace-runtime: 6; runtime-orchestrator: 6 |
| `pnpm build` | **PASS** | Clean Next.js build |
| `pnpm lint` | **PASS** | 0 errors; 4 warnings (pre-existing in `AIPromptPanel.tsx`, `AITemplateManager.tsx`; unrelated to OS 3.3) |

**ESLint baseline (as of PR #19):** 0 errors / 4 warnings.

---

## Non-Blocking Advisories

### C-001 — `isEnabled` type permits flag bypass by convention

**Area:** Factory type safety  
**Severity:** Non-blocking advisory

`isEnabled: (input, legacyOutput, dependencies) => boolean` is a required field, preventing omission. However, any boolean-returning function satisfies the type — including `() => true`. The type system enforces that a flag gate *exists*, not that it *calls the actual feature flag*.

Both current adapters use `dependencies.isEnabled?.() ?? isRuntimeXxxEnabled()` — conformant with Runtime Adapter Standard v1.0.

**Recommendation:** Include an explicit conformance check ("does `isEnabled` call `isRuntimeXxxEnabled()` or its DI-injected equivalent?") in the Pilot 3 code review contract. No code change required.

---

### C-002 — `createWarningPayload` receives full `input` containing PII fields

**Area:** Log safety architecture  
**Severity:** Non-blocking advisory

The factory passes `{ input: TInput, legacyOutput, warning, errorKind }` to `createWarningPayload`. Both current adapters correctly select only safe fields from `input`. However, no compile-time guard prevents a future adapter from spreading `input` naively (`...input`), which would log `tenantId` and `userId`.

This risk is validated by the callsite tests (`not.toHaveProperty('tenantId')`) for existing adapters, but cannot be type-enforced for future implementations.

**Recommendation:** Add a note to the Runtime Adapter Standard v1.0 development guide: "createWarningPayload must enumerate only safe fields from `input`; do not spread `input` directly." No code change required.

---

## Merge Recommendation

**Merged — no action required.** PR #16–#19 are already at HEAD `1168dc3` on `planning/os-3.3-runtime-platform`.

All checkpoints from `docs/nextshift-os-3/reviews/ARCHITECTURE_REVIEW_2026-07-09.md` (CP1–CP5) pass. Full audit conclusions are recorded in that document's Audit Result section. No blocking findings. The two advisories above are documentation-level items for the Pilot 3 development contract.
