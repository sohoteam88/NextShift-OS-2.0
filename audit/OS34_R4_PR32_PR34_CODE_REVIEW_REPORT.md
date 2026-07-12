# OS 3.4 Round 4 — A2 Card · B3 CRM · A3 Graduation (PR #32–#34)
**Pre-release Final Audit**

| Field       | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Review Type | Code Review (not Release Audit)                                          |
| Review Date | 2026-07-11                                                               |
| Reviewer    | Claude Code (Audit Engineer)                                             |
| Repository  | sohoteam88/NextShift-OS-2.0                                              |
| Branch      | `planning/os-3.3-runtime-platform` HEAD `9e45d5b` (PR #34 merge commit) |
| PRs         | #32 A2 Recommendation Card · #33 B3 CRM Adapter · #34 A3 Graduation     |
| Verdict     | **PASS WITH CONDITION — 1 blocking advisory, 4 informational**           |

---

## CP1 — A2 Recommendation Card: UI Iron Rules, Flag-OFF DOM, Admin Guard Coverage (PR #32)

### UI 铁律

`TodayRecommendationCard.tsx` (170 lines, `'use client'`):

| Rule | Result | Evidence |
| --- | --- | --- |
| Zero arbitrary values | ✓ | No `[...]` pattern anywhere in the file |
| Zero hex colors | ✓ | No `#xxx` anywhere |
| Only shared components | ✓ | `Badge`, `Button`, `cn`, `lucide-react` icons only |
| Design token classes | ✓ | `rounded-lg border-border bg-white p-5 shadow-sm text-primary text-foreground text-muted text-xl text-sm font-semibold` — all scale tokens |

DashboardHome.tsx has pre-existing arbitrary values (`h-[360px]`, `rounded-[var(--radius-lg)]`) which are NOT introduced in PR #32 — the diff shows only 2 lines added to that file (import + `<TodayRecommendationCard />` at line 107).

### Flag-OFF zero-DOM evidence

The card is added **unconditionally** to `DashboardHome`. Flag-off suppression is achieved via the API-null chain:

```
COMMAND_CENTER flag OFF
  → API returns { data: null }
  → useQuery data = null
  → TodayRecommendationCardView returns null (no DOM)
```

Unit test coverage:

```ts
it('renders no markup while loading', ...)
  → expect(html).toBe('') ✓

it('renders no markup when recommendation is null', ...)
  → expect(html).toBe('') ✓
```

E2E coverage (`tests/e2e/command-center.spec.ts`):

```ts
test('flag off: dashboard does not render the recommendation card', ...) {
  const body = await response.json();
  expect(body).toMatchObject({ data: null });                              // API null ✓
  await expect(page.getByTestId('today-recommendation-card')).toHaveCount(0); // zero DOM ✓
}
```

CI two-instance approach (PR #32 addition to `ci.yml`): port 3001 runs with `NEXT_PUBLIC_ENABLE_COMMAND_CENTER=false`, port 3000 with `true`, `trap stop_apps EXIT` cleanup. Works because `NEXT_PUBLIC_*` variables are read from `process.env` at server runtime; flag-off API behavior is confirmed by `{ data: null }` response; the client renders nothing when data is null. ✓

### Admin guard coverage matrix

**E-002 fix (root layout):** `src/app/(auth)/admin/layout.tsx` added in PR #32:

```ts
const ADMIN_BASE_ROLES = ['leader', 'operator', 'platform_admin'];

export default async function AdminLayout({ children }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (!ADMIN_BASE_ROLES.includes(user.role)) redirect('/dashboard');
  return children;
}
```

All 19 admin pages now have a root layout net beneath them. `member` and the legacy `admin` role are blocked at the root. Sub-layouts (`feedback`, `launch-readiness`) and per-page guards remain as finer overrides. ✓

**E-001 fix (approvals allowlist):** `admin/approvals/page.tsx` converted from blocklist to allowlist:

```ts
const APPROVAL_ROLES = ['leader', 'operator', 'platform_admin'];
if (!APPROVAL_ROLES.includes(user.role)) redirect('/dashboard');
```

Consistent with all other admin pages. ✓

**CP1 verdict: PASS** — 1 informational advisory (F-001, double `getAuthUser()` per request).

---

## CP2 — B3 CRM Runtime Adapter: Standard Checklist & PII Exclusion (PR #33)

### Standard invariants

| Invariant | Check | Result |
| --- | --- | --- |
| Uses factory | `createRuntimeAdapter<ResolveCrmRuntimeInput, CRMCommandCenter, ...>()` | ✓ |
| Flag semantics | `isRuntimeCrmEnabled()` → `isRuntimeFlagEnabled` (strict, NOT `byDefault`) — CRM not graduated | ✓ |
| `isEnabled` DI | `deps.isEnabled?.() ?? isRuntimeCrmEnabled()` | ✓ |
| Legacy-first | `resolveLegacy` called when `enabled === false` | ✓ |
| DI required for legacy | `if (!dependencies.resolveCommandCenter) throw new TypeError(...)` | ✓ |
| Factory fallback | `fallbackWarning: 'runtime-crm-adapter-fallback'`, `fallback: true` on error | ✓ |
| Flag registry | `runtime-crm-flag.ts` → `RUNTIME_CRM_FLAG` → `RUNTIME_FLAGS.CRM.name` | ✓ |

### `createWarningPayload` — CRM-specific PII field audit

CRM data is high-sensitivity (customer names, emails, notes, lead IDs). Each field verified:

| Field in payload | PII? | Notes |
| --- | --- | --- |
| `warning` | No | String enum |
| `source` | No | Enum value |
| `totalLeadCount` | No | Aggregate count |
| `hotLeadCount` | No | Aggregate count |
| `opportunityCount` | No | Aggregate count |
| `overdueFollowupCount` | No | Aggregate count |
| `todayFollowupCount` | No | Aggregate count |
| `revenueConfidenceScore` | No | Numeric score |
| `errorKind` | No | Error class name only |

No names, emails, phone numbers, customer IDs, lead notes, or opportunity dollar values in the payload. ✓

### Test evidence for PII exclusion

The test fixture deliberately includes realistic PII to verify it does not leak:

```ts
hotLeads: [{ name: 'Ada Prospect', score: 88, ... }]
opportunities: [{ leadName: 'Ada Prospect', notes: 'Private buying notes', value: 2000, ... }]
createRuntimeArtifacts: () => {
  throw new Error('runtime unavailable for tenant_1 ada@example.com')
}
```

Then asserts:

```ts
expect(warningPayload).not.toHaveProperty('tenantId')          ✓
expect(warningPayload).not.toHaveProperty('userId')             ✓
expect(warningPayload).not.toHaveProperty('message')            ✓  // error.message blocked
expect(warningPayload).not.toHaveProperty('stack')              ✓  // error.stack blocked
expect(JSON.stringify(warningPayload)).not.toContain('Ada Prospect')        ✓
expect(JSON.stringify(warningPayload)).not.toContain('ada@example.com')     ✓
expect(JSON.stringify(warningPayload)).not.toContain('Private buying notes') ✓
```

A separate test validates runtime metadata key names against `/secret|password|token|api[-_]?key|credential|email|phone|name/i` — zero matches. ✓

### `safeRuntimeMetadata`

Contains `tenantId` and `userId` conditionally for internal runtime artifact creation (event, capability) only. These do NOT surface in `output.runtime`. Pattern matches B1/B2. ✓

**CP2 verdict: PASS** — PII exclusion is the most rigorous of all four adapters to date; test coverage with realistic fixtures is exemplary.

---

## CP3 — A3 Graduation: Semantic Tests, 4-Flag Integrity, Production Observability (PR #34)

### `isRuntimeFlagEnabledByDefault` semantics

```ts
export function isRuntimeFlagEnabledByDefault(
  flag: RuntimeFlagName,
  env: NodeJS.ProcessEnv = process.env,
) {
  return env[flag] === undefined ? true : env[flag] === 'true';
}
```

| Input | Output | Semantic |
| --- | --- | --- |
| `undefined` (key absent) | `true` | Default ON after graduation |
| `'true'` | `true` | Explicit ON |
| `'false'` | `false` | Explicit OFF |
| `'FALSE'`, `'True'`, `'1'`, `'0'`, `''` | `false` | Non-`'true'` → OFF |

### Graduated flags vs. strict flags

| Flag | Function | Default after PR #34 |
| --- | --- | --- |
| `retiredRevenueFlagConstant` | `isRuntimeFlagEnabledByDefault` | **ON** (graduated) |
| `retiredAnalyticsFlagConstant` | `isRuntimeFlagEnabledByDefault` | **ON** (graduated) |
| `RUNTIME_MISSION_FLAG` | `isRuntimeFlagEnabled` | OFF (strict) |
| `RUNTIME_BUSINESS_STATE_FLAG` | `isRuntimeFlagEnabled` | OFF (strict) |
| `RUNTIME_CRM_FLAG` | `isRuntimeFlagEnabled` | OFF (strict) |
| `COMMAND_CENTER_FLAG` | `isRuntimeFlagEnabled` | OFF (strict) |

Graduation is limited to the two most mature adapters (Pilot 1 and Pilot 2, with callsite tests and full adapter reviews since Round 1). ✓

### Test evidence for graduation semantics

Revenue (`revenue-runtime-adapter.test.ts`):

```ts
it('uses the runtime path when the runtime revenue flag is missing after graduation', () => {
  setRuntimeRevenueFlag(undefined);
  ...
  expect(output.runtime).toMatchObject({ enabled: true, mode: 'runtime', fallback: false })
  expect(output.runtime.contextId).toEqual(expect.any(String))
  expect(output.runtime.correlationId).toEqual(expect.any(String))
}); ✓
```

Analytics (`analytics-runtime-adapter.test.ts`): identical pattern. ✓

Both test files also retain the full `it.each(['false', 'FALSE', 'True', '1', '0', ''])` suite confirming these still return `enabled: false`. ✓

### ⚠ Production impact assessment — Fallback Observability

With REVENUE and ANALYTICS flags now defaulting ON, real user traffic will hit the runtime path for the first time after deployment.

**The fallback path emits a `console.warn` only:**

```ts
// In createRuntimeAdapter factory (factory-level, not adapter-level):
warningLogMessage: '[revenue-runtime-adapter] falling back to legacy...',
getLogger: (dependencies) => dependencies.logger,  // defaults to console
```

**Sentry is installed** (`@sentry/nextjs ^10.60.0`) and active via `SENTRY_DSN`, with `captureException` in `global-error.tsx`. However:

- Sentry does **not** capture `console.warn` by default — only unhandled exceptions
- No `Sentry.captureMessage()` call exists in the adapter fallback path
- `src/lib/telemetry/tracker.ts` covers PostHog event tracking only

**Risk:** If the revenue or analytics runtime construction throws on first production request (e.g., `@nextshift/runtime` throws inside `createRuntimeCapability`), the adapter falls back to legacy silently with a `console.warn`. The warning will appear in server logs only — invisible in Sentry, invisible to the oncall alert chain.

This is the only finding that affects the go/no-go decision for v3.4.0.

**Mitigation options (one must be confirmed before tagging):**

Option A — Inject a Sentry-aware logger at the callsite (minimal change):

```ts
// In revenue/analytics callsite files
import * as Sentry from '@sentry/nextjs';
const sentryLogger = {
  warn: (msg: string, payload: Record<string, unknown>) => {
    console.warn(msg, payload);
    Sentry.captureMessage(msg, { level: 'warning', extra: payload });
  },
};
// Pass as dependencies.logger
```

Option B — Enable Sentry's console integration globally (broader change, captures all `console.warn`).

Option C — Confirm with Steven that `.env.production` explicitly sets both flags to `'true'`, and that the deploy smoke test (`/api/health`, `/api/v1/version`, `/login`) is sufficient to detect a broken runtime path before switching traffic. Document this decision.

**CP3 verdict: PASS WITH CONDITION** — graduation logic and test coverage are correct; the condition is that fallback observability is confirmed or addressed before tagging.

---

## CP4 — Full Validation (HEAD `9e45d5b`)

| Check | Result |
| --- | --- |
| `pnpm type-check` | **0 errors** ✓ |
| `pnpm test` | **391 passed**, 44 skipped, 71 test files ✓ |
| `pnpm -r --filter './packages/*' test` | **248+ passed**, 45 test files ✓ |
| `pnpm lint` | **192 warnings / 0 errors** ✓ |
| `pnpm build` | **Clean** (Prisma DATABASE_URL stub errors at build time — expected) ✓ |
| E2E spec count | **31 cases** (spec projected 30; one test added in PR #34 graduation suite) ✓ |

**Lint count note:** A cold lint run returned 383 via `grep -c "Warning:"` due to ESLint's two-pass output format. Capturing the output once and grepping it confirms **192** — consistent with the Round 3 baseline. No new lint violations introduced in PR #32-#34.

**Test progression vs. Round 3:** 374 → 391 (+17 tests across CRM adapter, CRM callsite, TodayRecommendationCard, and graduation semantic tests).

---

## Non-Blocking Advisories

**F-001 — Double `getAuthUser()` per admin page request**
`(auth)/layout.tsx` and `(auth)/admin/layout.tsx` both call `getAuthUser()`. `getAuthUser()` is not memoized with `React.cache()`. Admin requests make 2 Supabase session lookups (plus a 3rd for pages with inline guards). Minor latency impact, no security concern.
→ Wrap `getAuthUser` in `React.cache()` in a future cleanup; not blocking v3.4.0.

**F-002 — E2E count vs. spec (31 actual, 30 projected)**
PR #34 added one extra test vs. the audit spec projection. All 31 pass.
→ Update planning doc baseline from 30 to 31.

**F-003 — Carry-forward: D-001 (rate-limit IP trust)**
`x-forwarded-for` IP extraction still unresolved pending production topology decision (Cloudflare vs. self-managed nginx). Not blocking v3.4.0.

**F-004 — Legacy `admin` role now blocked at root layout**
`ADMIN_BASE_ROLES = ['leader', 'operator', 'platform_admin']` — the legacy `admin` role is NOT in the list and will be rejected by the new root layout. Some per-page guards previously included `'admin'` in their allowlists. If any users have `role = 'admin'` in production, they lose admin access after this deployment.
→ Run a Supabase query to confirm zero `admin`-role users before deploying. If any exist, decide: migrate to `operator` or add `admin` to `ADMIN_BASE_ROLES`. See release risk checklist R-4.

---

## v3.4.0 Release Risk Checklist

| # | Item | Status |
| --- | --- | --- |
| R-1 | **[MUST RESOLVE]** Revenue/analytics adapter fallback path must produce a Sentry-observable signal. Confirm Sentry captures fallback warnings (Option A/B) OR confirm `.env.production` is audited + deploy smoke test catches a broken runtime path (Option C). | ⛔ Open |
| R-2 | **[MUST CONFIRM]** `.env.production` key audit: verify `retiredRevenueRuntimeFlag` and `retiredAnalyticsRuntimeFlag` status. Absent → runtime path active (graduation intended). `'false'` → explicit legacy override. Either is valid — must be documented. | ⚠ Confirm |
| R-3 | **[MUST CONFIRM]** `NEXT_PUBLIC_ENABLE_COMMAND_CENTER` in `.env.production` must be absent or `'false'` unless Command Center is intentionally live for users. Flag is still strict OFF-by-default. | ⚠ Confirm |
| R-4 | **[MUST CONFIRM]** No active users with `role = 'admin'` in production. A Supabase query (`SELECT id FROM users WHERE role = 'admin'`) is sufficient. | ⚠ Confirm |
| R-5 | **[OK]** E2E count 31 (spec said 30). All pass. Not blocking. | ✅ |
| R-6 | **[BACKLOG]** D-001 rate-limit IP trust — production topology decision pending. Not blocking v3.4.0. | 📋 |

---

## Summary

Round 4 covers 3 PRs: A2 recommendation card, B3 CRM adapter, A3 graduation. All code-level invariants pass.

- **A2** card uses only design tokens and shared components. Flag-off zero-DOM is tested at unit and E2E level. Admin guard matrix is now complete with a root layout closing the E-001 and E-002 advisories from Round 3.
- **B3** CRM adapter fully conforms to Runtime Adapter Standard v1.0 with the strongest PII-exclusion test coverage of any adapter to date (fixtures include real names and email addresses to prove they don't leak).
- **A3** graduation semantics are correct and tested (`undefined → true`, non-`'true'` → `false`). MISSION / BUSINESS_STATE / CRM / COMMAND_CENTER confirmed to remain strict OFF-by-default.
- All 391 unit tests and 248+ package tests pass. Lint: 192 warnings / 0 errors. Build clean. E2E: 31 cases.

**One blocking advisory (R-1):** Revenue/analytics adapter fallbacks emit `console.warn` only, which Sentry does not capture by default. This must be resolved — either by injecting a Sentry-aware logger at the callsite, or by confirming an equivalent production monitoring arrangement — before the v3.4.0 tag is cut.

**Verdict: PASS WITH CONDITION** — R-1 must be confirmed. R-2, R-3, R-4 require human confirmation and are not expected to block if the confirmation checks pass.
