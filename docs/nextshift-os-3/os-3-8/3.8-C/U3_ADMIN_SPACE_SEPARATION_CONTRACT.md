# OS 3.8 U3 — Admin Space Separation Contract

Status: **APPROVED GOVERNANCE CONTRACT — implementation pending U3A/U3B**

Authorized baseline: `3976a57f32014eb303bd66078f310fcf6913a9c1`

Decision: Steven Amendment A, approved 2026-07-17

This document is an evidence-based migration contract. It does not implement a route, API, guard, redirect, schema, navigation, or production change.

## 1. Scope and inventory method

The inventory covers every authenticated page under `src/app/(auth)/admin`, `src/app/(auth)/platform-admin`, and `src/app/(auth)/admin-command`; every API under `src/app/api/v1/admin`, `src/app/api/v1/platform-admin`, and `src/app/api/v1/admin-command`; mounted and historical shells; role guards; tenant-identity inputs; mutation handlers; audit writers; direct tests; and code/document/bookmark consumers.

Reproducible searches:

```bash
find 'src/app/(auth)/admin' -name page.tsx -print | sort
find 'src/app/(auth)/platform-admin' -name page.tsx -print | sort
find 'src/app/(auth)/admin-command' -name page.tsx -print | sort
find src/app/api/v1/admin src/app/api/v1/platform-admin src/app/api/v1/admin-command -name route.ts -print | sort
rg -n "getAuthUser|requireRoleApi|platform_admin|operator|leader|redirect\\(" 'src/app/(auth)/admin' 'src/app/(auth)/platform-admin' 'src/app/(auth)/admin-command' src/app/api/v1/admin src/app/api/v1/platform-admin src/app/api/v1/admin-command
rg -n "tenantId|tenant_id|searchParams|headers\\(|request\\.json|req\\.json|params" src/app/api/v1/admin src/app/api/v1/platform-admin src/app/api/v1/admin-command src/modules/admin
rg -n "AdminSidebar|TopBar|MobileTabBar|AppShell|/platform-admin|/admin-command|/admin" src tests docs
rg -n "auditLog\\.(create|createMany)|AuditLog|audit_logs" src tests prisma docs/architecture
rg -n "export const (POST|PUT|PATCH|DELETE)" src/app/api/v1/admin src/app/api/v1/platform-admin src/app/api/v1/admin-command
```

Measured source inventory:

- **34 administration pages**: 19 `/admin` pages, 14 `/platform-admin` pages, and 1 `/admin-command` page.
- **16 administration API route files**: 10 `/api/v1/admin/*`, 5 `/api/v1/platform-admin/*`, and 1 `/api/v1/admin-command`.
- **13 mutation handlers** across those route files; 5 currently reach an `AuditLog` writer and 8 do not.
- **5 adjacent API dependencies** called by administration components but owned by other product namespaces.
- **6 primary shell/navigation authorities** inspected: `AppShell`, `AdminSidebar`, `TopBar`, `MobileTabBar`, `WorkspaceTopNavigation`, and the currently unmounted legacy `Sidebar`.
- **9 direct test authorities** inspected: admin API, RBAC, tenant isolation, audit deletion, navigation access, canonical routes, compatibility redirects, admin E2E, and navigation-convergence E2E.
- Repository consumer search found 34 files containing `/platform-admin`, 12 containing `/admin-command`, and 21 code/test/doc files with literal `/admin` route references at this baseline.

## 2. Three-space authority

| Space | Page namespace | API namespace | Allowed roles | Tenant authority | Navigation exposure | Shell identity |
| --- | --- | --- | --- | --- | --- | --- |
| Member frontend | Approved seven destinations / five-slot projection | Product APIs | `member`, `leader`, plus non-admin product use explicitly authorized for other roles | Authenticated session and resource ownership | Zero admin or superadmin links | Member/product identity only |
| Team administration | `/admin/*` | `/api/v1/admin/*` | `leader`, `operator`; individual routes may be narrower | `user.tenantId` from authenticated session only | No link from member desktop/mobile/workspace navigation; authorized direct URL only | Persistent visible `ADMIN` label and tenant context |
| Platform administration | `/superadmin/*` | `/api/v1/superadmin/*` | `platform_admin` only | Explicit target tenant for tenant-targeted operations; no fabricated tenant for global operations | Absent from member and team-admin navigation; authorized direct URL only | Persistent visible `PLATFORM` label and platform context |

`platform_admin` is not a permitted `/admin/*` role after migration. Cross-tenant capability belongs in `/superadmin/*`; team-admin handlers must not contain a privileged branch that drops tenant predicates.

## 3. Page migration matrix (34 source pages)

| Current page | Current authority | Target | Target authority / action |
| --- | --- | --- | --- |
| `/admin` | layout allows leader/operator/platform; page allows operator/platform | `/admin` | Team admin; operator unless U3A explicitly proves a leader-safe overview; platform excluded |
| `/admin/ai-templates` | operator/platform redirect alias | `/admin/templates` | Team admin operator; one-hop 301 compatibility |
| `/admin/approvals` | leader/operator/platform | `/admin/approvals` | Team admin leader/operator, session tenant |
| `/admin/beta` | operator/platform | `/admin/beta` | Team admin operator, session tenant |
| `/admin/billing` | operator/platform | `/admin/billing` | Team admin operator, session tenant |
| `/admin/content` | operator/platform | `/admin/content` | Team admin operator, session tenant |
| `/admin/daily-actions` | operator/platform | `/admin/daily-actions` | Team admin operator, session tenant |
| `/admin/feedback` | operator/platform; API is currently cross-tenant | `/admin/feedback`; platform portfolio view to `/superadmin/feedback` | Split capability; admin must be session-tenant scoped, superadmin platform-only |
| `/admin/funnels` | operator/platform | `/admin/funnels` | Team admin operator, session tenant |
| `/admin/journey` | operator/platform | `/admin/journey` | Team admin operator, session tenant |
| `/admin/launch-readiness` | platform-only nested layout | `/superadmin/launch-readiness` | Platform-only; legacy GET becomes 301, never `/admin/*` |
| `/admin/members` | operator/platform | `/admin/members` | Team admin operator, session tenant |
| `/admin/operations` | operator/platform | `/admin/operations` | Team admin operator, session tenant |
| `/admin/plan` | operator/platform | `/admin/plan` | Team admin operator, session tenant |
| `/admin/settings` | operator/platform | `/admin/settings` | Team admin operator, session tenant |
| `/admin/team` | operator/platform | `/admin/team` | Team admin operator, session tenant |
| `/admin/templates` | operator/platform | `/admin/templates` | Team admin operator, session tenant |
| `/admin/training` | operator/platform | `/admin/training` | Team admin operator, session tenant |
| `/admin/users` | operator/platform; platform path can cross tenant | `/admin/users` | Team admin operator and session tenant only; platform portfolio remains `/superadmin/users` |
| `/platform-admin` | platform-only page guard | `/superadmin` | Platform-only; old GET 301 with allowlisted `tab`/`view` |
| `/platform-admin/ai-profitability` | platform-only | `/superadmin/ai-profitability` | Platform-only; old GET 301 |
| `/platform-admin/ai-usage` | platform-only | `/superadmin/ai-usage` | Platform-only; old GET 301 |
| `/platform-admin/audit-logs` | platform-only | `/superadmin/audit-logs` | Platform-only; old GET 301 |
| `/platform-admin/beta` | platform-only | `/superadmin/beta` | Platform-only; old GET 301 |
| `/platform-admin/billing` | platform-only | `/superadmin/billing` | Platform-only; old GET 301 |
| `/platform-admin/founder` | **no page-level role guard; authenticated group only** | `/superadmin/founder` | Platform-only guard required before data access; old GET 301 |
| `/platform-admin/funnels` | platform-only | `/superadmin/funnels` | Platform-only; old GET 301 |
| `/platform-admin/growth` | platform-only | `/superadmin/growth` | Platform-only; old GET 301 |
| `/platform-admin/health` | platform-only | `/superadmin/health` | Platform-only; old GET 301 |
| `/platform-admin/revenue` | platform-only | `/superadmin/revenue` | Platform-only; old GET 301 |
| `/platform-admin/tenant-health` | platform-only | `/superadmin/tenant-health` | Platform-only; old GET 301 |
| `/platform-admin/tenants` | current redirect to root `tab=tenants` | `/superadmin/tenants` | Platform-only terminal route; old GET 301; allowlisted query preserved without chain |
| `/platform-admin/users` | platform-only | `/superadmin/users` | Platform-only; old GET 301 |
| `/admin-command` | platform-only redirect to platform root `view=command` | `/superadmin/command` | Platform-only terminal route; old GET 301; no chain |

The original U2 112-route counts are historical and are not recalculated by this overlay. U3A must inventory newly created target routes before it claims a new complete route total.

## 4. API migration matrix (16 source route files)

| Current API | Methods | Current authority / finding | Target contract |
| --- | --- | --- | --- |
| `/api/v1/admin-command` | GET | platform-only | `/api/v1/superadmin/command`; platform-only |
| `/api/v1/admin/crm/recalculate-scores` | POST | operator/platform; session tenant | Keep path; operator, session tenant; platform excluded |
| `/api/v1/admin/daily-actions/defaults` | GET, PUT | operator/platform; session tenant | Keep path; operator, session tenant; platform excluded |
| `/api/v1/admin/feedback` | GET | operator/platform; **missing tenant predicate** | Team view remains at same path with session tenant; platform portfolio view becomes `/api/v1/superadmin/feedback` |
| `/api/v1/admin/feedback/:id` | PATCH | operator/platform; **update by ID without tenant predicate** | Same split; admin mutation must constrain ID + session tenant |
| `/api/v1/admin/override` | GET, POST, DELETE | platform-only; accepts target tenant from query/body | `/api/v1/superadmin/override`; explicit platform target tenant; old mutation path fails closed unless separately approved 308 parity window |
| `/api/v1/admin/settings` | GET, PATCH | operator/platform; session tenant | Keep path; operator, session tenant; platform excluded |
| `/api/v1/admin/system-health` | GET | platform-only | `/api/v1/superadmin/system-health` |
| `/api/v1/admin/training/defaults` | GET, PUT | operator/platform; session tenant | Keep path; operator, session tenant; platform excluded |
| `/api/v1/admin/users` | GET | operator/platform; `includeAllTenants` for platform | Keep team path with the cross-tenant branch removed; platform list belongs to `/api/v1/superadmin/users` if an API is required |
| `/api/v1/admin/users/:id` | PATCH, DELETE | service drops tenant predicate for platform actor | Keep team path constrained by actor + session tenant; platform mutation moves to `/api/v1/superadmin/users/:id` |
| `/api/v1/platform-admin/founder` | GET | **incorrectly permits operator** | `/api/v1/superadmin/founder`; platform-only |
| `/api/v1/platform-admin/stats` | GET | platform-only | `/api/v1/superadmin/stats`; platform-only |
| `/api/v1/platform-admin/tenants` | GET, POST | platform-only | `/api/v1/superadmin/tenants`; platform-only |
| `/api/v1/platform-admin/tenants/:id` | GET, PATCH, DELETE | platform-only; explicit target tenant | `/api/v1/superadmin/tenants/:id`; platform-only and fully audited writes |
| `/api/v1/platform-admin/usage` | POST | platform-only; literal old path schema; writes analytics only | `/api/v1/superadmin/usage`; update path allowlist and add required write audit |

Adjacent component dependencies remain in their owning namespaces and require call-site authorization tests rather than automatic renaming: `/api/v1/health`, `/api/v1/feedback`, `/api/v1/funnel/templates`, `/api/v1/funnel/funnels`, and `/api/v1/ai/router/stats`. U3A must prove whether each call belongs in team administration or is merely a shared product API before U3B changes it.

## 5. Role matrix

| Capability | Member | Leader | Operator | Platform admin |
| --- | ---: | ---: | ---: | ---: |
| Member frontend | Yes | Yes | Only explicitly authorized product flows | Only explicitly authorized product flows |
| `/admin/*` shell | No | Yes | Yes | **No** |
| Team-admin route with operator-only current authority | No | No unless separately approved | Yes | No |
| `/admin/approvals` | No | Yes, within approved sub-team/tenant policy | Yes | No |
| `/superadmin/*` shell | No | No | No | Yes |
| `/api/v1/admin/*` | No | Only endpoint-specific allowlist | Endpoint-specific allowlist | **No** |
| `/api/v1/superadmin/*` | No | No | No | Yes |

There is no numeric role inheritance shortcut between team and platform spaces. Every route and handler names its allowed roles explicitly.

## 6. Tenant boundary matrix

| Context | Permitted tenant source | Prohibited source | Required enforcement |
| --- | --- | --- | --- |
| Team-admin page/service | `getAuthUser().tenantId` | query, path, form/body, header, local storage | Add `tenantId` to every Prisma predicate and service boundary |
| Team-admin API | `requireAuthApi(request).tenantId` | query, path, JSON body, custom tenant header | Guard before parsing target data; ID lookups use `id + tenantId` |
| Team-admin storage key | server-derived session tenant | browser-provided tenant ID | Replace current client-built logo path with authorized server-issued path/upload |
| Superadmin tenant-targeted action | Explicit target ID after platform role guard and resource validation | Target ID as proof of permission | Validate target exists; audit against that tenant |
| Superadmin platform-global action | No tenant is naturally applicable | arbitrary/default/actor tenant placeholder | Block until AuditLog ADR is approved |

Baseline gaps that U3A/U3B must close fail closed:

- Admin feedback list and update omit tenant predicates.
- Admin user list/mutation has a `platform_admin` branch that removes tenant scope.
- `uploadTenantLogo()` constructs a storage path from client-held `tenantId`.
- `/api/v1/platform-admin/founder` permits `operator`.
- `/platform-admin/founder` reads cross-tenant services without a page-level role check.
- `/api/v1/admin/system-health` calls auth with a fabricated empty request; the replacement must use the real request.

## 7. Navigation visibility and shell identity

| Surface | Member links | Admin links | Superadmin links | Contract |
| --- | --- | --- | --- | --- |
| `WorkspaceTopNavigation` | Approved member destinations | 0 | 0 | Remains member-only |
| `MobileTabBar` / More | Approved five-slot projection and utilities | 0 | 0 | No backend links at any viewport |
| `TopBar` | Member/product navigation when applicable | 0 | 0 | No switch-to-admin shortcut |
| Team-admin shell | 0 member destinations except an explicit exit control | `/admin/*` only | 0 | Persistent `ADMIN` mark + tenant name; leader/operator only |
| Platform shell / `AdminSidebar` successor | 0 member destinations except an explicit exit control | 0 | `/superadmin/*` only | Persistent `PLATFORM` mark; platform-only |
| Legacy `Sidebar` | Not mounted by current `AppShell` | Historical evidence only | Historical evidence only | Must not become a second authority |

The current `AppShell` only provides a dedicated shell for `platform_admin` on `/platform-admin`; team admin currently reuses the ordinary shell. U3B must introduce a distinct team-admin shell and retarget the platform shell without exposing backend links in frontend navigation.

## 8. Redirect and compatibility rules

1. Legacy page compatibility is GET-only, one-hop, status `301`, and terminal.
2. `/platform-admin` → `/superadmin`; `/platform-admin/<suffix>` → `/superadmin/<corresponding-suffix>`; `/admin-command` → `/superadmin/command`.
3. Only a documented allowlist of non-sensitive query keys may survive. At minimum, revalidate existing `tab=tenants`, `view=command`, and `source=bookmark`; unknown keys are dropped.
4. A platform legacy path never targets `/admin/*`. A target may not be another compatibility route.
5. Non-GET APIs never use `301`/`302`. Prefer migrated callers plus a fail-closed old endpoint.
6. A temporary mutation compatibility route requires separate approval, method-preserving `308`, an expiry/removal date, and identical guard, validation, audit, and response semantics.
7. Redirect tests assert status, method behavior, query allowlist, back button/bookmark behavior, role denial, and absence of chains.

## 9. AuditLog contract

Every superadmin write records:

- `actorId` and `actorRole`;
- `action`;
- `targetType` and `targetId`;
- `targetTenantId` when applicable;
- request/correlation ID;
- success or failure;
- redacted metadata;
- timestamp.

Never record tokens, secrets, passwords, authentication cookies, complete request bodies, or complete sensitive payloads.

The 13 current administration mutation handlers are: admin score recalculation; daily-action PUT; feedback PATCH; override POST/DELETE; settings PATCH; training PUT; user PATCH/DELETE; platform tenant POST/PATCH/DELETE; and platform usage POST. Current direct/transitive audit coverage exists for override POST/DELETE, settings PATCH, and user PATCH/DELETE (**5/13**). The other **8/13** require explicit audit acceptance in U3B. Analytics telemetry is not a substitute for an administration audit event.

For tenant-targeted superadmin writes, `AuditLog.tenantId` is the target tenant. For platform-global writes, the current required `AuditLog.tenantId` cannot represent truthfully scoped evidence. U3B is blocked from a schema change until a separate ADR receives Architecture Review and chooses one minimum option:

A. make `AuditLog.tenantId` optional and add an explicit scope discriminator;
B. add a separate `PlatformAuditLog` model;
C. prove that there are no platform-global mutations and keep the existing model.

No arbitrary tenant, actor tenant, or placeholder tenant may be used for a platform-global event.

## 10. Test contract

U3A must turn the inventory into executable expected-route/API manifests. U3B cannot complete until all of the following pass:

- page access matrix for member, leader, operator, and platform admin across all three spaces;
- negative direct-link tests proving members cannot enter either backend, operators/leaders cannot enter superadmin, and platform admins cannot enter team admin;
- tenant-isolation integration tests for every admin read/mutation, including ID guessing and the current feedback/user gaps;
- API namespace/guard tests for every one of the 16 source endpoints and every replacement endpoint;
- GET 301 compatibility tests for every legacy page, query allowlist, terminal destination, and no chain;
- mutation tests proving no 301/302, no weaker legacy guard, and fail-closed retirement or exact 308 parity;
- navigation tests proving zero backend links in desktop, mobile, More, workspace, and utilities;
- visible ADMIN/PLATFORM shell identity and responsive/keyboard checks;
- exact audit-field, success/failure, redaction, correlation ID, and tenant/global-scope tests for every superadmin write;
- regression of existing `admin-api.test.ts`, `rbac.test.ts`, `user-isolation.test.ts`, `audit-delete-guard.test.ts`, `navigation-access.test.ts`, `canonical-routes.test.ts`, `compatibility-redirect.test.ts`, `admin.spec.ts`, and `navigation-convergence.spec.ts`;
- full type-check, unit/integration, lint, boundary, build, and targeted E2E gates.

## 11. Rollout and rollback

1. U3A freezes source/target inventories, identifies owners, and resolves every ambiguous capability before code changes.
2. U3B first creates guarded target shells/routes/APIs behind no frontend links, then migrates internal callers and tests.
3. Verify authorization, tenant isolation, and auditing at exact target endpoints before enabling legacy GET redirects.
4. Migrate mutation callers before retiring old mutation endpoints. Compatibility windows are exceptional and time-bounded.
5. Roll back by disabling the new target entry points and restoring the last reviewed code commit; never weaken guards, remove audit evidence, rewrite user data, or route platform traffic into team admin.
6. No production rollout occurs in U3A/U3B governance. Deployment requires the later Wave review, Final Audit, and explicit Steven release approval.

## 12. Prohibited scope and stop conditions

- No product route/API/navigation implementation in this governance PR.
- No Prisma schema or migration without a separate ADR and Architecture Review.
- No second route registry and no change to the approved seven desktop destinations or five-slot mobile projection.
- No E3A/E3B continuation until U3B is completed and verified.
- No AR-W3 generation, merge, deploy, tag, release, or production access.
- Fail closed if inventory identity, session tenant authority, exact guard parity, audit scope, or redirect termination is ambiguous.

PR #95 remains an independent parked Draft. This contract does not alter, close, rebase, merge, or adopt its evidence.
