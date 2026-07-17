# OS 3.8 U3 — Admin Space Separation Contract

Status: **STEVEN-APPROVED AMENDMENT — ARCHITECTURE REVIEW PENDING**

Authorized governance baseline: `287a0de4d08507dd142e0a862c370067f9292948` (PR #97 production gate contract merged)

Decision: Steven Amendment A, approved 2026-07-17

This document is an evidence-based migration contract. It does not implement a route, API, guard, redirect, schema, navigation, or production change.

## 1. Scope and inventory method

The inventory starts at the repository roots, not at known prefixes. It covers all 112 authenticated page routes, all API route files, page- and service-level role/capability guards, mounted and historical shells, tenant-identity inputs, redirects, mutation handlers, audit writers, direct tests, and code/document/bookmark consumers. A candidate enters the administration matrix when it mounts an administration capability, is restricted to a role above ordinary member product access, or is a compatibility/direct-link authority for such a capability. Role-specialized product projections are dispositioned separately so that a role check alone does not silently turn a member product API into an admin API.

Reproducible searches:

```bash
find 'src/app/(auth)/admin' -name page.tsx -print | sort
find 'src/app/(auth)/platform-admin' -name page.tsx -print | sort
find 'src/app/(auth)/admin-command' -name page.tsx -print | sort
find src/app/api/v1/admin src/app/api/v1/platform-admin src/app/api/v1/admin-command -name route.ts -print | sort
find 'src/app/(auth)' -name page.tsx -print | sort
find src/app/api -name route.ts -print | sort
rg -n "getAuthUser|requireRoleApi|platform_admin|operator|leader|redirect\\(" 'src/app/(auth)/admin' 'src/app/(auth)/platform-admin' 'src/app/(auth)/admin-command' src/app/api/v1/admin src/app/api/v1/platform-admin src/app/api/v1/admin-command
rg -n "platform_admin|operator|leader|requireRoleApi|requireRole|ALLOWED_ROLES|ROLE_GUARD|APPROVAL_ROLES|INVITE_ROLES|TEAM_ROLES|FORBIDDEN" 'src/app/(auth)' src/app/api src/modules
rg -n "tenantId|tenant_id|searchParams|headers\\(|request\\.json|req\\.json|params" src/app/api/v1/admin src/app/api/v1/platform-admin src/app/api/v1/admin-command src/modules/admin
rg -n "AdminSidebar|TopBar|MobileTabBar|AppShell|/platform-admin|/admin-command|/admin|/team|/workspace" src tests docs
rg -n "auditLog\\.(create|createMany)|AuditLog|audit_logs" src tests prisma docs/architecture
rg -n "export const (POST|PUT|PATCH|DELETE)" src/app/api
rg -n "fetch\\(|router\\.(push|replace)|href=|redirect\\(" src tests
```

Measured source inventory:

- **39 privileged administration page route files**: the original 34 (19 `/admin`, 14 `/platform-admin`, 1 `/admin-command`) plus `/team`, `/team/members`, `/team/growth`, `/workspace`, and `/workspace/[...path]` discovered outside those prefixes.
- **37 privileged administration API source route files**: the original 16 plus 21 repository-wide discoveries whose whole route or privileged methods administer teams, members, tenant configuration, or platform state. Shared product GET methods are split from privileged writes rather than moved wholesale.
- **30 unique privileged source write operations**, producing **33 target-namespace write capabilities** after feedback PATCH and user PATCH/DELETE are split into tenant and platform variants: 23 target `/api/v1/admin/*` and 10 target `/api/v1/superadmin/*`. Existing direct/transitive `AuditLog` coverage is 5/23 for target team-admin writes and 4/10 for target superadmin writes.
- **Role-specialized but non-administration product endpoints** were dispositioned explicitly: member/leader/operator analytics projections, ordinary CRM lead ownership operations, and member-facing product reads stay in their product namespaces.
- **6 primary shell/navigation authorities** inspected: `AppShell`, `AdminSidebar`, `TopBar`, `MobileTabBar`, `WorkspaceTopNavigation`, and the currently unmounted legacy `Sidebar`.
- **4 mounted entry/compatibility authorities** require coordinated migration: `auth-routing.ts`, authenticated `/dashboard`, `AppShell`, and `compatibility-redirect.ts`; their platform home, breadcrumb, and allowlisted redirect targets must terminate in the correct new space.
- **9 direct test authorities** inspected: admin API, RBAC, tenant isolation, audit deletion, navigation access, canonical routes, compatibility redirects, admin E2E, and navigation-convergence E2E.
- Repository consumer search found 34 files containing `/platform-admin`, 12 containing `/admin-command`, and 21 code/test/doc files with literal `/admin` route references at this baseline.

## 2. Three-space authority

| Space | Page namespace | API namespace | Allowed roles | Tenant authority | Navigation exposure | Shell identity |
| --- | --- | --- | --- | --- | --- | --- |
| Member frontend | Approved seven destinations / five-slot projection | Product APIs | `member`, `leader`, plus non-admin product use explicitly authorized for other roles | Authenticated session and resource ownership | Zero admin or superadmin links | Member/product identity only |
| Team administration | `/admin/*` | `/api/v1/admin/*` | `leader`, `operator`; individual routes may be narrower | `user.tenantId` from authenticated session only | No link from member desktop/mobile/workspace navigation; authorized direct URL only | Persistent visible `ADMIN` label and tenant context |
| Platform administration | `/superadmin/*` | `/api/v1/superadmin/*` | `platform_admin` only | Explicit target tenant for tenant-targeted operations; no fabricated tenant for global operations | Absent from member and team-admin navigation; authorized direct URL only | Persistent visible `PLATFORM` label and platform context |

`platform_admin` is not a permitted `/admin/*` role after migration. Cross-tenant capability belongs in `/superadmin/*`; team-admin handlers must not contain a privileged branch that drops tenant predicates.

## 3. Page migration matrix (39 source pages)

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
| `/team` | leader/operator/platform administration surface; member denied | `/admin/team` | Team admin leader/operator, session tenant; old GET 301 after the source role gate; platform denied |
| `/team/members` | leader/operator/platform human-team list/detail | `/admin/team/members` | Team admin leader/operator, session tenant; terminal route; old GET 301; platform denied |
| `/team/growth` | operator/platform compatibility redirect to `/team` | `/admin/team` | Team admin operator-only compatibility; old GET resolves directly to terminal `/admin/team` with no chain; platform denied |
| `/workspace` | operator/platform compatibility redirect to `/admin` | `/admin` | Team admin operator-only; old GET 301 after role check; platform denied |
| `/workspace/[...path]` | operator/platform compatibility resolver for admin suffixes | terminal `/admin/*` allowlist | Team admin operator-only; each suffix resolves directly to a terminal admin route; old GET 301; platform denied |

The original U2 112-route counts are historical and are not recalculated by this overlay. This matrix supersedes the U2 statement that privileged human-team administration remains at `/team` and `/team/members`. Those legacy paths become compatibility-only; their capabilities terminate under `/admin/*`. U3A must inventory newly created target routes before it claims a new complete route total.

## 4. API migration matrix (37 source route files)

| Current API | Methods | Current authority / finding | Target contract |
| --- | --- | --- | --- |
| `/api/v1/admin-command` | GET | platform-only | `/api/v1/superadmin/command`; platform-only |
| `/api/v1/admin/crm/recalculate-scores` | POST | operator/platform; session tenant | Keep path; operator, session tenant; platform excluded |
| `/api/v1/admin/daily-actions/defaults` | GET, PUT | operator/platform; session tenant | Keep path; operator, session tenant; platform excluded |
| `/api/v1/admin/feedback` | GET | operator/platform; **missing tenant predicate** | Team view remains at same path with session tenant; platform portfolio view becomes `/api/v1/superadmin/feedback` |
| `/api/v1/admin/feedback/:id` | PATCH | operator/platform; **update by ID without tenant predicate** | Split into admin PATCH constrained by ID + session tenant and platform-only `/api/v1/superadmin/feedback/:id` |
| `/api/v1/admin/override` | GET, POST, DELETE | platform-only; accepts target tenant from query/body | `/api/v1/superadmin/override`; explicit platform target tenant; old mutation path fails closed unless separately approved 308 parity window |
| `/api/v1/admin/settings` | GET, PATCH | operator/platform; session tenant | Keep path; operator, session tenant; platform excluded |
| `/api/v1/admin/system-health` | GET | platform-only | `/api/v1/superadmin/system-health` |
| `/api/v1/admin/training/defaults` | GET, PUT | operator/platform; session tenant | Keep path; operator, session tenant; platform excluded |
| `/api/v1/admin/users` | GET | operator/platform; `includeAllTenants` for platform | Keep team path with the cross-tenant branch removed; platform list belongs to `/api/v1/superadmin/users` if an API is required |
| `/api/v1/admin/users/:id` | PATCH, DELETE | service drops tenant predicate for platform actor | Split into team path constrained by actor + session tenant and platform-only `/api/v1/superadmin/users/:id` |
| `/api/v1/platform-admin/founder` | GET | **incorrectly permits operator** | `/api/v1/superadmin/founder`; platform-only |
| `/api/v1/platform-admin/stats` | GET | platform-only | `/api/v1/superadmin/stats`; platform-only |
| `/api/v1/platform-admin/tenants` | GET, POST | platform-only | `/api/v1/superadmin/tenants`; platform-only |
| `/api/v1/platform-admin/tenants/:id` | GET, PATCH, DELETE | platform-only; explicit target tenant | `/api/v1/superadmin/tenants/:id`; platform-only and fully audited writes |
| `/api/v1/platform-admin/usage` | POST | platform-only; literal old path schema; writes analytics only | `/api/v1/superadmin/usage`; update path allowlist and add required write audit |

Repository-wide discovery adds these 21 source route files outside the three legacy API prefixes:

| Current API | Methods | Current authority / finding | Target contract |
| --- | --- | --- | --- |
| `/api/v1/team/dashboard` | GET | service guard leader/operator/platform | `/api/v1/admin/team/dashboard`; leader/operator, session tenant; platform excluded |
| `/api/v1/team/journey-progress` | GET | explicit leader/operator/platform | `/api/v1/admin/team/journey-progress`; leader/operator, session tenant; platform excluded |
| `/api/v1/team/members` | GET | service guard leader/operator/platform | `/api/v1/admin/team/members`; leader/operator, session tenant; platform excluded |
| `/api/v1/team/summary` | GET | service guard leader/operator/platform | `/api/v1/admin/team/summary`; leader/operator, session tenant; platform excluded |
| `/api/v1/team/tree` | GET | service guard leader/operator/platform | `/api/v1/admin/team/tree`; leader/operator, session tenant; platform excluded |
| `/api/v1/member/pending` | GET | service guard leader/operator/platform; platform branch drops tenant scope | `/api/v1/admin/members/pending`; leader/operator with session tenant/sub-team scope; platform excluded |
| `/api/v1/member/:id/approve` | POST | service guard leader/operator/platform; audited | `/api/v1/admin/members/:id/approve`; leader/operator with session tenant/sub-team scope |
| `/api/v1/member/:id/reject` | POST | service guard leader/operator/platform; audited | `/api/v1/admin/members/:id/reject`; leader/operator with session tenant/sub-team scope |
| `/api/v1/member/invite` | GET, POST | service guard leader/operator/platform; session tenant | `/api/v1/admin/member-invites`; leader/operator and session tenant; platform excluded |
| `/api/v1/ai/router/stats` | GET | operator-only tenant statistics | `/api/v1/admin/ai/router/stats`; operator and session tenant |
| `/api/v1/ai/templates` | GET, POST | shared tenant read; operator-only create | Keep product GET; move POST to `/api/v1/admin/ai/templates` |
| `/api/v1/ai/templates/:id` | GET, PATCH, DELETE | shared tenant read; operator-only writes | Keep product GET; move writes to `/api/v1/admin/ai/templates/:id` |
| `/api/v1/ai/usage` | GET | user view for all; tenant view operator-only | Keep user scope; move tenant scope to `/api/v1/admin/ai/usage` |
| `/api/v1/crm/pipeline-stages` | GET, POST | shared tenant read; operator/platform write | Keep product GET; move POST to `/api/v1/admin/crm/pipeline-stages`, operator only |
| `/api/v1/crm/pipeline-stages/:id` | PATCH, DELETE | operator/platform write; service calls lack explicit tenant predicate | `/api/v1/admin/crm/pipeline-stages/:id`; operator, session tenant, ID + tenant predicate |
| `/api/v1/crm/pipeline-stages/reorder` | POST | operator/platform, session tenant | `/api/v1/admin/crm/pipeline-stages/reorder`; operator and session tenant |
| `/api/v1/crm/tags` | GET, POST | shared tenant read; leader/operator/platform create | Keep product GET; move POST to `/api/v1/admin/crm/tags`, leader/operator and session tenant |
| `/api/v1/crm/tags/:id` | PATCH, DELETE | operator/platform; service calls lack explicit tenant predicate | `/api/v1/admin/crm/tags/:id`; operator, session tenant, ID + tenant predicate |
| `/api/v1/funnel/templates` | GET, POST | shared tenant read; operator/platform create | Keep product GET; move POST to `/api/v1/admin/funnel/templates`, operator and session tenant |
| `/api/v1/funnel/templates/:id` | GET, PATCH, DELETE | shared tenant read; operator/platform writes | Keep product GET; move writes to `/api/v1/admin/funnel/templates/:id` |
| `/api/v1/auth/fix-uid` | **GET that mutates IDs** | operator/platform; multi-table write with no audit | Replace with explicit POST `/api/v1/superadmin/auth/uid-reconciliation`, platform-only and audited; old GET fails closed, never redirects |

Completeness disposition for role-signalled routes that do not enter an administration namespace:

- `/api/v1/analytics/member`, `/leader`, and `/operator` are member-frontend role projections, not configuration or administration; they remain product APIs and retain their current least-privilege view semantics.
- ordinary CRM lead/customer/activity APIs remain product APIs because members use them with ownership scoping; only configuration writes listed above move to admin.
- shared AI, CRM, and Funnel GET methods remain product reads; their privileged write or tenant-wide scope is split into `/api/v1/admin/*`.

Adjacent shared dependencies that do not expose an administration capability remain in their owning namespaces and require call-site authorization tests rather than automatic renaming: `/api/v1/health`, `/api/v1/feedback`, and `/api/v1/funnel/funnels`. U3A must generate executable page, method-level API, direct-link, redirect, and consumer manifests from all 39/37 rows; any discovered source absent from those manifests blocks U3A completion.

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
2. `/platform-admin` → `/superadmin`; `/platform-admin/<suffix>` → `/superadmin/<corresponding-suffix>`; `/admin-command` → `/superadmin/command`. After source-role authorization, `/team` and `/team/growth` resolve directly to `/admin/team`, `/team/members` resolves to `/admin/team/members`, and `/workspace` resolves to `/admin`; platform admins are denied those team-admin compatibility paths.
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

The complete repository-wide inventory contains 30 unique privileged source writes. Three source methods (feedback PATCH and user PATCH/DELETE) split into both tenant and platform variants, yielding 33 target-namespace write capabilities:

| Target namespace | Writes | Existing direct/transitive audit coverage | Amendment requirement |
| --- | ---: | ---: | --- |
| `/api/v1/admin/*` | 23 | 5/23: settings PATCH, user PATCH/DELETE, member approve/reject | Preserve existing approved audit behavior. This amendment does not silently require new audit events for the other 18 team-admin writes. |
| `/api/v1/superadmin/*` | 10 | 4/10: override POST/DELETE and the existing user PATCH/DELETE audit path | All 10/10 must emit success and failure audit evidence before U3B can complete. Analytics telemetry is not an audit event. |

The 23 target team-admin writes comprise the original seven team-scoped operations (score recalculation; daily-action PUT; feedback PATCH; settings PATCH; training PUT; user PATCH/DELETE) plus member approve/reject/invite, AI-template create/update/delete, CRM pipeline-stage create/update/delete/reorder, CRM tag create/update/delete, and Funnel-template create/update/delete. The 10 target superadmin writes are feedback PATCH, override POST/DELETE, user PATCH/DELETE, tenant POST/PATCH/DELETE, platform usage POST, and the replacement UID-reconciliation POST.

Current Prisma `AuditLog` mapping is explicit:

| Required event field | Current storage contract |
| --- | --- |
| actor ID | Dedicated nullable UUID `actorId`; null is allowed only for a proven non-user system actor and must be explained in metadata |
| actor role | `metadata.actor_role` until an independently reviewed schema decision adds a dedicated column |
| action | Dedicated `action` string |
| target type | Dedicated nullable `targetType` |
| target ID | Dedicated nullable UUID `targetId` only when the real target is a UUID; a non-UUID or global target uses `targetId=null` plus redacted `metadata.target_key` and must never fabricate a UUID |
| target tenant | Dedicated required UUID `tenantId` for tenant-targeted events and mirrored as `metadata.target_tenant_id`; platform-global handling is unresolved by the ADR gate below |
| request/correlation ID | `metadata.request_id` and/or `metadata.correlation_id` |
| success/failure | `metadata.outcome` (`success` or `failure`) plus a redacted stable failure code when applicable |
| redacted metadata | Dedicated JSON `metadata`, subject to the prohibition list above |
| timestamp | Dedicated `createdAt` |

For a successful superadmin mutation, the business write and its audit event must commit atomically. For a failed mutation, the business transaction rolls back first and the failure event is persisted through an isolated audit transaction; a failed audit persistence may never be converted into a successful business response. The durable retry/outbox or separate-sink behavior needed when the audit store itself is unavailable is an ADR decision, not an implementation guess.

For tenant-targeted superadmin writes, `AuditLog.tenantId` is the target tenant. For platform-global writes, the current required `AuditLog.tenantId` cannot represent truthfully scoped evidence. The immutable authorization policy is owned only by the synchronized planning Manifest under U3ADR's `governance_gate.policy`; the canonical runtime state is `U3_AUDITLOG_ADR_GATE.json`, and the reviewed machine-readable decision is `U3_AUDITLOG_ADR_DECISION.json`.

The reviewed decision selects **Option A — `A_OPTIONAL_TENANT_WITH_SCOPE`**:

- make `AuditLog.tenantId` nullable and add an explicit `TENANT`/`PLATFORM` scope discriminator;
- preserve the exact target tenant for tenant-targeted events and use `tenantId = null`, never a placeholder, for platform-global events;
- use `targetId` only for a real UUID target; non-UUID/global identifiers remain redacted stable metadata with `targetId = null`;
- after a failed business transaction rolls back, write failure evidence through an isolated audit transaction and a separately durable retry channel; audit persistence failure remains fail closed.

This is a governance decision for later separately reviewed implementation. It does not modify Prisma or complete U3ADR. The trusted policy continues to enumerate the two rejected alternatives so a different decision requires a new reviewed artifact and policy-consistent exact-head review:

A. make `AuditLog.tenantId` optional and add an explicit scope discriminator;
B. add a separate `PlatformAuditLog` model;
C. prove that there are no platform-global mutations and keep the existing model.

Option C additionally requires the proof artifact named by the immutable policy and bound from the reviewed decision. No arbitrary tenant, actor tenant, or placeholder tenant may be used for a platform-global event. U3B dispatch fails closed when the gate artifact is missing, pending, non-PASS, stale against the reviewed decision SHA, mismatched to the U3ADR evidence, or—under option C—missing its exact-head proof artifact.

### 9.1 U3ADR completion and U3B dispatch gate

U3ADR is a separate Manifest task after U3A. Its governance adoption must use the production runner introduced by merged PR #97 and atomically persist its completed verification/evidence and final gate JSON. Authorization is split into three layers:

1. **Immutable policy:** only synchronized planning Manifest data may define gate/task/consumer identity, allowed options, required decisions, protected paths, review/freshness rules, Option C proof requirements, canonical decision path, policy version, and canonical SHA-256.
2. **Reviewed decision:** the runner reads `git show DECISION_SHA:U3_AUDITLOG_ADR_DECISION.json`, requires the artifact in the reviewed PR diff, and validates its identity, selected option, policy/protected-path digests, all resolved decisions, and conditional Option C proof.
3. **Transport envelope:** an external source may carry only decision SHA, review ID, reviewed PR URL, canonical decision path, and decision-artifact SHA-256. It cannot define selected/allowed options, protected paths, required decisions, freshness/completion policy, or proof policy.

The exact review target SHA cannot be embedded in the commit that creates itself. It is bound without self-reference by the transport `decision_sha`, the GitHub review's exact commit anchor and `REVIEWED_SHA`, the artifact blob digest, and the reviewed PR diff. Before marking U3ADR completed, and again before changing or selecting U3B, the production runner validates all of these machine-readable assertions:

1. `status == "approved"`, `approval_state == "approved"`, and `u3b_dispatch_authorized == true`;
2. `selected_option` comes from the reviewed decision artifact and is allowed by the trusted Manifest policy;
3. `decision_sha` is a 40-character SHA, the Architecture Review verdict is exactly `PASS`, `review_id` is a positive GitHub review ID, and `architecture_review.reviewed_sha == decision_sha`;
4. the reviewed decision commit contains the canonical decision artifact, the artifact is in the reviewed PR diff, and U3ADR verification `verified_head_sha` equals `decision_sha`;
5. canonical policy and protected-path SHA-256 values equal the reviewed decision values; freshness is recomputed from Git history rather than accepted from the envelope;
6. option C's proof artifact exists at `decision_sha`, is included in the reviewed PR diff, and proves the absence of platform-global mutations;
7. U3ADR is `completed` and U3B's Manifest dependency is exactly `U3ADR`.

The committed gate intentionally remains `pending`; U3ADR and U3B remain `pending` and `blocked` respectively. Neither a PR label/body, caller input, environment variable, task outcome, nor a manually edited `u3b_dispatch_authorized` flag can replace the exact task evidence and GitHub review identity. U3B produces no dispatch artifact until a later separate exact-head PASS governance adoption passes candidate-first validation, locked revalidation, atomic Manifest/gate persistence, and byte-identical rollback protection before transitioning U3B to pending.

## 10. Test contract

U3A must turn the 39-page and 37-source-API inventory into executable expected-route, method-level API, redirect, consumer, and role-guard manifests. Completeness tests compare those manifests with repository-wide searches and fail on an unclassified addition or removal. U3B cannot dispatch until U3ADR is completed with the exact reviewed gate artifact, and cannot complete until all of the following pass:

- page access matrix for member, leader, operator, and platform admin across all three spaces;
- negative direct-link tests proving members cannot enter either backend, operators/leaders cannot enter superadmin, and platform admins cannot enter team admin;
- tenant-isolation integration tests for every admin read/mutation, including ID guessing and the current feedback/user gaps;
- API namespace/guard tests for every one of the 37 source route files, every privileged method split, and every replacement endpoint;
- GET 301 compatibility tests for every legacy page, query allowlist, terminal destination, and no chain;
- mutation tests proving no 301/302, no weaker legacy guard, and fail-closed retirement or exact 308 parity;
- navigation tests proving zero backend links in desktop, mobile, More, workspace, and utilities;
- visible ADMIN/PLATFORM shell identity and responsive/keyboard checks;
- exact audit-field, success/failure, redaction, correlation ID, and tenant/global-scope tests for every superadmin write;
- all 36 production-path governance dispatch fixtures: 18 immutable-policy/candidate/rollback cases plus 18 retained selection, exact-review, proof, evidence, TOCTOU, stale/duplicate adoption, and zero-side-effect cases;
- regression of existing `admin-api.test.ts`, `rbac.test.ts`, `user-isolation.test.ts`, `audit-delete-guard.test.ts`, `navigation-access.test.ts`, `canonical-routes.test.ts`, `compatibility-redirect.test.ts`, `admin.spec.ts`, and `navigation-convergence.spec.ts`;
- full type-check, unit/integration, lint, boundary, build, and targeted E2E gates.

## 11. Rollout and rollback

1. U3A freezes executable source/target inventories, identifies owners, and resolves every ambiguous capability before code changes.
2. U3ADR selects and receives exact-head Architecture Review PASS for the AuditLog option, schema mapping, non-UUID/global target behavior, and failure-event durability. Its governance adoption must persist the fresh gate artifact before U3B becomes eligible.
3. U3B first creates guarded target shells/routes/APIs behind no frontend links, then migrates internal callers and tests.
4. Verify authorization, tenant isolation, and auditing at exact target endpoints before enabling legacy GET redirects.
5. Migrate mutation callers before retiring old mutation endpoints. Compatibility windows are exceptional and time-bounded.
6. Roll back by disabling the new target entry points and restoring the last reviewed code commit; never weaken guards, remove audit evidence, rewrite user data, or route platform traffic into team admin.
7. No production rollout occurs in U3A/U3ADR/U3B governance. Deployment requires the later Wave review, Final Audit, and explicit Steven release approval.

## 12. Prohibited scope and stop conditions

- No product route/API/navigation implementation in this governance PR.
- No Prisma schema or migration without a separate ADR and Architecture Review.
- No U3B dispatch while U3ADR or `U3_AUDITLOG_ADR_GATE.json` is absent, pending, stale, mismatched, non-PASS, or missing required option-C proof.
- No second route registry and no change to the approved seven desktop destinations or five-slot mobile projection.
- No E3A/E3B continuation until U3B is completed and verified.
- No AR-W3 generation, merge, deploy, tag, release, or production access.
- Fail closed if inventory identity, session tenant authority, exact guard parity, audit scope, or redirect termination is ambiguous.

PR #95 remains an independent parked Draft. This contract does not alter, close, rebase, merge, or adopt its evidence.
