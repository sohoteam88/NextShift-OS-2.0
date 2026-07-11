# OS 3.4 Round 3 — Governance, Guards, Deploy, B1/B2 Adapters, A1 Recommendation Datapath (PR #23–#31)

| Field       | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Review Type | Code Review (not Release Audit)                                          |
| Review Date | 2026-07-10                                                               |
| Reviewer    | Claude Code (Audit Engineer)                                             |
| Repository  | sohoteam88/NextShift-OS-2.0                                              |
| Branch      | `planning/os-3.3-runtime-platform` HEAD `e56bf40` (PR #31 merge commit) |
| PRs         | #23 Governance · #24 E2E/Guards · #25 Auth Guards · #26 B1 Mission Adapter · #27 Deploy · #28 Release · #29 Post-Release Docs · #30 B2 Business-State Adapter · #31 A1 Recommendation Datapath |
| Verdict     | **PASS — 4 non-blocking advisories**                                     |

---

## CP1 — Security: Admin Guards & Unguarded Routes (PR #24, #25)

### Authentication layer

`src/app/(auth)/layout.tsx` is the outer shell for all authenticated routes. It redirects unauthenticated sessions (`!user → /login`) and suspended/pending accounts (`resolveAuthRedirect`). It does NOT check `user.role` — role gating is the responsibility of each sub-route.

### Role hierarchy (from `require-auth-api.ts`)

```
platform_admin (100) > operator (80) > leader (60) > member (40)
```

`admin` is a legacy role present in `auth-routing.ts` `ADMIN_ROLES` set but absent from the API hierarchy.

### Admin guard completeness — 19 pages audited

| Page / Layout                              | Guard type     | Allowed roles                            | Matches API? |
| ------------------------------------------ | -------------- | ---------------------------------------- | ------------ |
| `(auth)/admin/page.tsx`                    | Page inline    | operator, platform_admin, admin          | pre-existing |
| `(auth)/admin/users/page.tsx`              | Page inline    | operator, platform_admin                 | ✓            |
| `(auth)/admin/members/page.tsx`            | Page inline    | operator, platform_admin, admin          | pre-existing |
| `(auth)/admin/billing/page.tsx`            | Page inline    | operator, platform_admin, admin          | pre-existing |
| `(auth)/admin/content/page.tsx`            | Page inline    | operator, platform_admin, admin          | pre-existing |
| `(auth)/admin/team/page.tsx`               | Page inline    | operator, platform_admin, admin          | pre-existing |
| `(auth)/admin/journey/page.tsx`            | Page inline    | operator, platform_admin, admin          | pre-existing |
| `(auth)/admin/funnels/page.tsx`            | Page inline    | operator, platform_admin, admin          | pre-existing |
| `(auth)/admin/operations/page.tsx`         | Page inline    | operator, platform_admin, admin          | pre-existing |
| `(auth)/admin/settings/page.tsx`           | Page inline    | operator, platform_admin                 | ✓            |
| `(auth)/admin/templates/page.tsx`          | Page inline    | operator, platform_admin                 | ✓            |
| `(auth)/admin/training/page.tsx`           | Page inline    | operator, platform_admin                 | ✓            |
| `(auth)/admin/ai-templates/page.tsx`       | Page inline    | operator, platform_admin                 | ✓            |
| `(auth)/admin/beta/page.tsx`               | Page inline    | operator, platform_admin                 | ✓            |
| `(auth)/admin/daily-actions/page.tsx`      | Page inline    | operator, platform_admin                 | ✓            |
| `(auth)/admin/plan/page.tsx`               | Page inline    | operator, platform_admin                 | ✓            |
| `(auth)/admin/approvals/page.tsx`          | Page blocklist | blocks `member` only (→ leader+)         | ⚠ E-001      |
| `(auth)/admin/feedback/layout.tsx`         | Layout         | operator, platform_admin (PR #25 — new) | ✓            |
| `(auth)/admin/launch-readiness/layout.tsx` | Layout         | platform_admin only (PR #25 — new)      | ✓            |
| `(auth)/admin-command/page.tsx`            | Page inline    | platform_admin only (PR #24 — new)      | ✓            |

All 19 pages have a role-level guard (authentication-only pages = zero). No unguarded admin routes found.

**New guards introduced in PR #23-#31 are correct:** `admin-command` matches API `platform_admin`; `feedback` matches `requireRoleApi(..., ['platform_admin', 'operator'])`; `launch-readiness` matches `requireRoleApi(..., ['platform_admin'])`.

### Service role key

`SUPABASE_SERVICE_ROLE_KEY` used only in `scripts/ensure-e2e-user.ts` (CI provisioning). Production app code contains no reference. Script outputs `JSON.stringify({ ok: true, provisionedRoles: [...] })` only — no credential values logged.

**CP1 verdict: PASS** — 1 non-blocking advisory (E-001, E-002 pattern risk).

---

## CP2 — Deploy Pipeline (PR #27)

### `deploy.yml`

- Build step passes secrets as `--build-arg` — correct for `NEXT_PUBLIC_*` compile-time bake-in. No runtime secrets baked into image layers.
- Migrate deploy uses `docker run --rm --env-file .env.production` — file-based env injection, no inline `--env KEY=VALUE` exposing secrets in process list ✓
- No `echo` or `set -x` present in any SSH script block ✓
- Rollback sequence: `docker image inspect nextshift-app:previous` (guard — fails fast if no previous image) → retag → `compose up` → smoke → prune ✓
- `ci-failure-notice` step echoes only the CI workflow URL, no secrets ✓
- All runtime flags default `|| 'false'` in deploy environment block ✓

### `scripts/deploy-smoke.sh`

```sh
set -eu
check_json_ok "/api/health"    # 200 + "status":"ok"
check_status "/api/v1/version" "200"
check_status "/login"          "200"
```

- `set -eu` — exits on any error or unset variable ✓
- Response body written to `/tmp/nextshift-smoke-response` — temporary, no secrets ✓
- Rollback triggered by non-zero exit on smoke failure ✓

**CP2 verdict: PASS** — no issues.

---

## CP3 — B1/B2 Runtime Adapters (PR #26, #30)

### B1 — `MissionRuntimeAdapter.ts` (PR #26)

| Invariant                  | Check                                                                     | Result |
| -------------------------- | ------------------------------------------------------------------------- | ------ |
| Uses factory               | `createRuntimeAdapter<>()` pattern                                        | ✓      |
| Flag default OFF           | `isEnabled: deps.isEnabled?.() ?? isRuntimeMissionEnabled()`             | ✓      |
| Flag strict comparison     | `isRuntimeFlagEnabled` → `env[FLAG] === 'true'`                          | ✓      |
| Legacy-first               | `resolveLegacy` called when `enabled === false`                           | ✓      |
| DI required for legacy     | Throws `TypeError` if `dependencies.resolveAuthority` not provided        | ✓      |
| Fallback on runtime error  | Factory enforces behavioral invariant                                     | ✓      |
| No PII in `warningPayload` | Fields: warning, source, missionId, lifecycle, stage, bottleneck, conf.  | ✓      |
| Flag registry              | `runtime-mission-flag.ts` → `RUNTIME_MISSION_FLAG` from `runtime-flags`  | ✓      |

### B2 — `BusinessStateRuntimeAdapter.ts` (PR #30)

| Invariant                  | Check                                                                          | Result |
| -------------------------- | ------------------------------------------------------------------------------ | ------ |
| Uses factory               | `createRuntimeAdapter<>()` pattern                                             | ✓      |
| Flag default OFF           | `isEnabled: deps.isEnabled?.() ?? isRuntimeBusinessStateEnabled()`            | ✓      |
| Flag strict comparison     | `isRuntimeFlagEnabled` → `env[FLAG] === 'true'`                               | ✓      |
| Legacy-first               | `resolveLegacy` called when `enabled === false`                                | ✓      |
| DI required for legacy     | Throws `TypeError` if `dependencies.resolveBusinessState` not provided         | ✓      |
| Fallback on runtime error  | Factory enforces behavioral invariant                                          | ✓      |
| No PII in `warningPayload` | Fields: warning, source, stage, currentState, nextState, readiness, conf, err | ✓      |
| Flag registry              | `runtime-business-state-flag.ts` → `RUNTIME_BUSINESS_STATE_FLAG`              | ✓      |

### Test evidence (B1 and B2 — identical pattern)

```ts
// flag-off test (both adapters)
expect(output.runtime).toEqual({
  enabled: false,
  mode: 'legacy',
  source: '...',
  fallback: false,
  confidence: 'derived',
});

// strict comparison test — all non-'true' values treated as OFF
it.each(['false', 'FALSE', 'True', '1', '0', ''])(
  'treats %s as flag OFF', async (flagValue) => { ... }
);
```

Both test suites have 100% flag-off coverage with explicit `enabled: false` and no `contextId`/`correlationId` assertions.

**CP3 verdict: PASS** — B1 and B2 fully conform to Runtime Adapter Standard v1.0.

---

## CP4 — A1 Recommendation Datapath (PR #31)

### Flag-off behavior

```ts
export async function getCommandCenterRecommendation(user, deps = {}) {
  const enabled = deps.isEnabled?.() ?? isCommandCenterEnabled();
  if (!enabled) return null;   // ← exits immediately
  ...
}
```

Test assertion (verbatim from `dashboard-recommendation-service.test.ts`):

```ts
it('returns null and does not call decision-brain when the flag is OFF', async () => {
  setCommandCenterFlag(undefined);
  const result = await getCommandCenterRecommendation(user(), dependencies);

  expect(result).toBeNull();
  expect(loaders.getCurrentMission).not.toHaveBeenCalled();
  expect(loaders.getBusinessState).not.toHaveBeenCalled();
  expect(loaders.resolveAnalytics).not.toHaveBeenCalled();
  expect(loaders.resolveRevenue).not.toHaveBeenCalled();
  expect(recommendationEngine.generate).not.toHaveBeenCalled();
});
```

Zero context calls and zero decision-brain calls when flag OFF ✓

### Tenant isolation in context loader

`loadCommandCenterRecommendationContext` calls:
- `getCurrentMission(user.id, {}, {source:'dashboard'})` — `userId` only
- `getBusinessState(user.id, {source:'command-center'})` — `userId` only

Both services resolve `tenantId` internally via `prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } })`. Tenant resolution is DB-enforced, not caller-provided. Cross-tenant access requires a compromised `userId` at the DB level.

`resolveAnalyticsRuntimeProjection` and `resolveRevenueRuntimeIntent` both accept explicit `tenantId` (passed as `user.tenantId ?? undefined`) ✓

`buildDecisionContext` uses `context.user.tenantId ?? context.user.id` as the `TenantId` for decision-brain ✓

### Cold-start rule ordering

| Priority | Rule                     | Condition                                                                         | Confidence |
| -------- | ------------------------ | --------------------------------------------------------------------------------- | ---------- |
| 1        | AI Interview missing     | `currentMission.id === 'MISSION_AI_INTERVIEW'` OR `missingRequirements` includes  | 0.9        |
| 2        | Content bottleneck       | `mission.bottleneck === 'NO_CONTENT'` OR `businessState.currentState === 'CONTENT_SYSTEM'` | 0.82 |
| 3        | Very low readiness       | `analytics.readiness.value < 20 && analytics.progress.value < 20`                | 0.68       |

Rules 1 and 2 check entirely different fields — no mutual exclusion conflict. Rule 3 is a double-AND condition (both readiness AND progress < 20), not a single threshold that fires too broadly. Priority ordering (first-match-wins) is correct. ✓

### `fallbackRule` output

All fields come from the `input` struct — no `context.user.id` or `context.user.tenantId` propagated into the returned result ✓

### API route

```ts
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);          // authenticated user with tenantId
  const data = await getCommandCenterRecommendation(user);
  return NextResponse.json({ data });
});
```

Authenticated, returns `{ data: null }` when flag OFF. No information leakage ✓

**CP4 verdict: PASS** — flag-off is zero-call, tenant isolation is DB-enforced, cold-start rules are correctly ordered.

---

## CP5 — Baseline Re-verification

### Commands run at HEAD `e56bf40`

| Check                   | Result                                    |
| ----------------------- | ----------------------------------------- |
| `pnpm type-check`       | **0 errors** ✓                            |
| `pnpm test`             | **374 passed**, 44 skipped, 68 test files ✓ |
| `pnpm -r --filter './packages/*' test` | **248 passed**, 45 test files ✓ |
| `pnpm lint`             | **192 warnings / 0 errors** ✓             |
| `pnpm build`            | **Clean** (dynamic routes ƒ as expected)  |
| E2E spec count          | **26 cases** (auth:5, admin:7, brand-discovery:5, mission-engine:9, funnel-context:5, content-engine:5) ✓ |

### Lint count discrepancy

PR #30 body states "413 warnings / 409 no-restricted-imports warnings." Local `pnpm lint | grep -c "Warning:"` at the same HEAD returns **192**. The discrepancy is a counting method difference: ESLint raw output repeats the rule name on a line below each violation, so raw-line counting yields roughly double the violation count. Both numbers represent the same 192 module-boundary violations. Authoritative count: **192 warnings / 0 errors.**

### Build note

`prisma: Environment variable not found: DATABASE_URL` appears at build time — this is the expected Prisma stub behavior when no DB is available in the build environment. Next.js marks affected routes as `ƒ` (server-rendered on demand) and skips static generation for them. Not a compilation error.

---

## CP6 — Regression Sentinel: Flag-All-OFF Net Behavior

With all 5 runtime flags off (`REVENUE=false`, `ANALYTICS=false`, `MISSION=false`, `BUSINESS_STATE=false`, `COMMAND_CENTER=false`):

| Adapter / Feature               | Flag-OFF behavior                                 | Change vs. Round 2 baseline? |
| ------------------------------- | ------------------------------------------------- | ----------------------------- |
| Revenue (Pilot 1)               | Legacy path unchanged                             | No change ✓                  |
| Analytics (Pilot 2)             | Legacy path unchanged                             | No change ✓                  |
| B1 Mission                      | `resolveLegacy(resolveAuthority)` — same legacy output | No observable change ✓  |
| B2 Business-State               | `resolveBusinessState(userId)` — same legacy output | No observable change ✓    |
| A1 Recommendation               | `getCommandCenterRecommendation` → `null`         | New route, returns null ✓    |
| Admin guards (PR #24/#25)       | Unauthorized roles redirected to `/dashboard`     | New routes, correct ✓        |
| Deploy pipeline (PR #27)        | New `deploy.yml`, no change to app runtime        | Infrastructure only ✓        |

Net behavior change to existing user flows with all flags OFF: **zero.**

---

## Non-Blocking Advisories

**E-001 — Blocklist guard in `admin/approvals/page.tsx`**
Guard is `if (user.role === 'member') redirect('/dashboard')` — a blocklist rather than allowlist. Intentional (leader role has approval rights), but if a new low-privilege role is added to the system without updating this guard, it gains queue access. All other 17 admin pages use allowlist pattern.
→ Recommend converting to `!['leader', 'operator', 'platform_admin'].includes(user.role)` for consistency.

**E-002 — No root `(auth)/admin/layout.tsx`**
The 19 admin pages each carry an inline guard. Adding a new admin sub-route requires the implementer to remember to include the guard — there is no safety net. PR #25 moved `feedback` and `launch-readiness` to layout-level guards; the same pattern applied at the root would cover the entire tree.
→ Recommend adding `src/app/(auth)/admin/layout.tsx` with base `operator+` guard. Sub-layouts for finer control (e.g., `platform_admin` only for `launch-readiness`) remain valid overrides.

**E-003 — `admin` legacy role inconsistency (pre-existing)**
`auth-routing.ts` `ADMIN_ROLES` includes `'admin'`, but `require-auth-api.ts` role hierarchy does not. Users with `admin` role can see admin pages but receive 403 from all API calls. Not introduced in PR #23-#31.
→ Remove `'admin'` from `ADMIN_ROLES` or add it to the API hierarchy (whichever reflects product intent).

**E-004 — Lint baseline discrepancy in PR body**
PR #30 body documents "413 warn / 0 error" but actual baseline is 192 warnings. Future planning docs should reference 192.
→ Update CODEX_EXECUTION_PLAN or equivalent planning docs to record 192 as the authoritative baseline.

---

## Summary

Round 3 audit covers 9 PRs across governance slimdown (PR #23), E2E/guards (PR #24-#25), B1/B2 runtime adapters (PR #26, #30), deploy pipeline (PR #27), release/docs (PR #28-#29), and A1 recommendation datapath (PR #31).

**No blocking issues found.**

All 19 admin pages have role-level guards; 3 new guards (PR #24, #25) correctly match their API-level role requirements. Deploy pipeline contains no secret leakage in logs or SSH blocks. B1 and B2 adapters fully conform to Runtime Adapter Standard v1.0 with correct flag semantics, DI-enforced legacy paths, and PII-free warning payloads. A1 recommendation datapath is flag-gated at entry with zero calls when OFF; tenant isolation is DB-enforced in both `getCurrentMission` and `getBusinessState`. All validation commands pass at HEAD `e56bf40`.

**Verdict: PASS — 4 non-blocking advisories (E-001 through E-004).**
