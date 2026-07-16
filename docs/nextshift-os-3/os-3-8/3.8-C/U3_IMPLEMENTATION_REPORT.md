# U3 Navigation Convergence — Implementation Report

## Identity and review scope

- Task: `U3 — Navigation Convergence`
- Authorized exact baseline: `4bb5419e6761fd0ed1ecc8e721deb596a47c48f2`
- Branch: `feature/os-3.8-u3-navigation-convergence`
- Architecture Review: `4718251129`
- Reviewed implementation head: `5ded0f14f07f610c4890e31b2c1f920be1e6ce56`
- Review disposition: `CHANGES_REQUESTED` — two Blockers and three Majors, all addressed in this remediation
- Verification policy: `actual_checks_required`
- Approved IA: `docs/nextshift-os-3/os-3-8/3.8-C/U2_INFORMATION_ARCHITECTURE.md`
- Steven approval: `docs/nextshift-os-3/os-3-8/approvals/STEVEN_IA_APPROVAL.md`
- Recorded at: `2026-07-16T23:23:44Z`

No route, permission, or capability decision outside the fixed U3 review scope was introduced.

## Canonical navigation and shell contract

`src/config/canonical-routes.ts` remains the sole route authority. Desktop and mobile consume the same typed projection. Member and leader are the two member-facing roles; operator and platform admin do not receive the member mobile tab bar.

The responsive contract is continuous:

| Width | Projection |
|---|---|
| `0–1279px` | Mobile tab bar + More; desktop workspace navigation hidden |
| `1280px+` | Desktop workspace navigation; mobile tab bar and More hidden |

Executable assertions cover `1023`, `1024`, `1279`, `1280`, and `1281` pixels. The More dialog moves initial focus to its first link, traps Tab/Shift+Tab, restores trigger focus after Escape, outside pointer close, or backdrop close, and intentionally does not restore trigger focus after link navigation.

## Baseline capability, authorization, and query matrix

The reviewed Merge sources were compared against baseline `4bb5419e6761fd0ed1ecc8e721deb596a47c48f2` before redirect behavior was changed.

| Source | Baseline capability | Authorization/tenant boundary | Query/runtime state |
|---|---|---|---|
| `/analytics` | Member, leader, and operator analytics dashboards | Authenticated user; role selects dashboard; analytics APIs retain tenant/user authority | `period=7d/30d/90d` |
| `/brand-discovery` | Interactive AI interview, confidence, slot collection, DNA completion | Authenticated shell; interview hooks retain user/tenant authority | Interview/session state; voice mode link |
| `/brand-dna` | Brand DNA studio with interview prerequisite | Explicit auth; interview query constrained by `tenantId` and `userId` | Interview presence |
| `/crm-center` | CRM command dashboard | Authenticated shell; CRM API authority unchanged | Query/cache owned by CRM dashboard |
| `/leads` | Lead Engine dashboard | Authenticated shell; existing lead hooks/API authority unchanged | Lead mission/engine state |
| `/sales` | Sales Engine dashboard | Authenticated shell; existing lead and follow-up authority unchanged | Sales queue state |
| `/funnel-context` | Retail/recruitment/upgrade funnel context map | Authenticated shell; existing funnel-context API authority unchanged | Context query/cache |
| `/video-production` | Video strategy/package generation workflow | Authenticated shell; existing video API authority unchanged | Generation form and package state |
| `/admin-command` | Founder platform operations command center | Exact `platform_admin` gate before redirect and at destination | Destination-owned `view=command` |
| `/platform-admin/tenants` | Founder tenant list/health terminal view | Destination enforces exact `platform_admin` role | Destination-owned `tab=tenants` |

No Merge or Redirect weakens source role, tenant, or capability boundaries. Existing services, hooks, APIs, and tenant filters are reused rather than reimplemented.

### Required eight-route parity verdict matrix

| Source | Baseline component/capability | Source authorization | Source query/deep-link | Destination existing capability | Missing at reviewed head | Implemented destination composition | Behavioral test | Authorization test | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| `/analytics` | `MemberAnalytics` / `LeaderAnalytics` / `OperatorAnalytics` | Auth + role-selected data API | Validated `period` | `IntelligenceDashboard` | Role dashboards and period | `/analytics-center?view=role`; default intelligence view retained | Merge-capability route fixture + resolver/period tests | Role selection remains server-owned; member boundary fixture | **PARITY** |
| `/brand-discovery` | Interactive interview, confidence/progress, finish + DNA action | Authenticated user/tenant hooks | Interview session; voice link | `ProfilePageClient` | Entire discovery interaction | `/brand-builder/profile?view=discovery` renders discoverable `BrandDiscoveryExperience`; profile retained | Merge-capability route fixture; three Brand view links | Auth page + existing hook/API tenant authority | **PARITY** |
| `/brand-dna` | `BrandDNAStudio` + interview gate | Auth; Prisma `tenantId` + `userId` | Interview presence | `ProfilePageClient` | DNA studio and gate | `/brand-builder/profile?view=dna` repeats exact scoped gate and studio; profile/discovery retained | Merge-capability route fixture; DNA active view | Explicit scoped Prisma query | **PARITY** |
| `/crm-center` | `CRMDashboard` | Authenticated CRM authority | CRM query/cache | Lead Mission CRM page | CRM command dashboard | `/crm?view=dashboard`; mission/leads/sales remain discoverable | CRM view fixture | Auth shell and unchanged CRM API | **PARITY** |
| `/leads` | `LeadDashboard` | Authenticated lead authority | Lead-engine state | Lead Mission CRM page | Lead Engine surface | `/crm?view=leads`; other CRM views retained | CRM view fixture + query/history test | Auth shell and unchanged lead hooks/APIs | **PARITY** |
| `/sales` | `SalesDashboard` | Authenticated sales/CRM authority | Sales queue state | Lead Mission CRM page | Sales Engine surface | `/crm?view=sales`; other CRM views retained | CRM view fixture | Auth shell and unchanged sales/CRM hooks | **PARITY** |
| `/funnel-context` | `FunnelContextDashboard` | Authenticated funnel authority | Funnel context query/cache | `FunnelBuilderDashboard` | Context map | `/funnel?view=context`; builder retained | Funnel view fixture | Auth shell and unchanged context API | **PARITY** |
| `/video-production` | `VideoProductionDashboard` | Authenticated video authority | Form/package state | `VideoProjectsList` | Production workflow | `/video?view=production`; projects retained | Video view fixture | Auth shell and unchanged video APIs | **PARITY** |

## Destination composition and exact terminal state

All nine approved Merge routes remain terminal, but the eight product capabilities now resolve to destination-owned, discoverable views instead of losing the source UI.

| Source | Exact terminal URL | Preserved source capability | Preserved destination capability |
|---|---|---|---|
| `/analytics` | `/analytics-center?view=role` | Role analytics and validated period | Intelligence dashboard at the default view |
| `/brand-discovery` | `/brand-builder/profile?view=discovery` | Full discovery interview/confidence flow | Brand profile default view |
| `/brand-dna` | `/brand-builder/profile?view=dna` | Tenant/user-scoped interview gate + Brand DNA studio | Brand profile and discovery views |
| `/crm-center` | `/crm?view=dashboard` | CRM command dashboard | Lead Mission default view |
| `/leads` | `/crm?view=leads` | Lead Engine dashboard | CRM mission/dashboard/sales views |
| `/sales` | `/crm?view=sales` | Sales Engine dashboard | CRM mission/dashboard/leads views |
| `/funnel-context` | `/funnel?view=context` | Multi-funnel context dashboard | Funnel Builder default view |
| `/video-production` | `/video?view=production` | Video production workflow | Video Projects default view |
| `/admin-command` | `/platform-admin?view=command` | Admin Command dashboard | Founder overview and tenant terminal view |

Each destination renders an accessible capability-view navigation. Unknown view values fail closed to the destination default. The compatibility helper preserves source query values but prevents source input from replacing destination-owned `view` or `tab` state. There are no redirect chains.

`/platform-admin/tenants` now terminates at `/platform-admin?tab=tenants`. The exact query is read by the platform-admin page, which keeps the existing `platform_admin` gate and renders the existing `TenantHealthCenter` table from `platformOperatingService` data. Refresh, bookmark, browser history, and source query preservation resolve to the same tenant terminal state.

## Role and capability behavior matrix

### Role × viewport projection

| Role | `<1280px` | `>=1280px` | Privileged behavior |
|---|---|---|---|
| `member` | Member mobile tabs + More | Seven-link member desktop nav | Cannot enter Team Admin or Founder routes |
| `leader` | Member mobile tabs + More | Seven-link member desktop nav | Does not receive operator/platform privileges |
| `operator` | Admin experience; no member tab bar | Admin experience; no member primary nav | Existing tenant-admin boundaries retained |
| `platform_admin` | Platform console; no member tab bar | Platform console; no member primary nav | Exact platform-admin guards retained |

| Scenario | Expected behavior | Evidence |
|---|---|---|
| Member/leader shell | Shared member-facing desktop/mobile IA | Pure role matrix + responsive browser fixture |
| Operator/platform admin shell | No member mobile tab bar | Pure role matrix; existing dedicated admin shell unchanged |
| Member opens `/team/growth` | Rejected to dashboard before privileged `/team` | Existing browser boundary fixture |
| Member opens `/admin-command` | Rejected to dashboard | Existing browser boundary fixture |
| Platform admin opens `/admin-command` | Direct command terminal view | Browser fixture asserts URL, container, heading |
| Platform admin opens `/platform-admin/tenants` | Direct tenant terminal view | Browser fixture asserts URL, terminal container, table |
| Eight merged product sources | Direct destination-owned capability views | Browser fixture traverses all eight sources |
| More dialog close | Escape/outside/backdrop restore; link navigation does not | Browser focus lifecycle fixture |

## Review finding closure

- **B1 — PASS:** all eight Merge sources have executable, discoverable terminal capability views while each destination default remains available; the parity matrix records component, auth, query, behavior, and verdict evidence.
- **B2 — PASS:** `/platform-admin?tab=tenants` consumes the destination-owned tab, reuses `TenantHealthCenter`, requires `platform_admin`, survives refresh, and rejects source `view`/`tab` override.
- **M1 — PASS:** mobile/tablet is `<1280px`, desktop is `>=1280px`; unit/browser boundaries cover 1023/1024/1279/1280/1281 with no gap.
- **M2 — PASS:** one `isMemberFacingRole` predicate grants the same member navigation projection to `member` and `leader`, never operator/platform admin.
- **M3 — PASS:** one `closeMore` lifecycle distinguishes restore-focus closes from navigation closes; Escape, outside/backdrop, trigger toggle, and link navigation have explicit behavior.

## Tests and regression evidence

String-source assertions using `readFileSync` were removed from the redirect suite. Unit tests now execute redirect query protection, explicit capability-view resolvers, analytics-period normalization, role eligibility, workspace allowlisting, and the responsive projection boundary. Browser tests exercise actual routes and rendered view navigation.

The U3 browser suite contains eleven scenarios:

1. Retail/Recruitment share seven canonical desktop hrefs.
2. Desktop nested-route active state.
3. Mobile tabs and complete More focus lifecycle.
4. Continuous `1279/1280` responsive projection.
5. Hidden routes remain direct-link accessible.
6. Query and browser-history preservation.
7. All eight merged product capabilities render their terminal view.
8. Terminal destinations retain their original default capability.
9. Member cannot cross Team/Founder boundaries.
10. Platform tenant bookmark and refresh render the tenant terminal state.
11. Admin Command retains its founder capability.

## Changed-file scope

- Destination composition: analytics center, Brand profile, CRM, Funnel, Video, and Platform Admin pages.
- Compatibility sources: the eight reviewed product Merge pages now carry destination-owned view state.
- Shared presentation: `CapabilityViewNavigation` and explicit capability-view resolvers.
- Brand capability: `BrandDiscoveryExperience`, preserving the former interactive source behavior inside Brand profile.
- Shell behavior: `AppShell`, `MobileTabBar`, and the role/breakpoint contract.
- Tests: redirect/resolver unit tests, navigation access unit tests, and U3 Playwright behavior tests.
- Governance: this report only.

No Pipeline, Manifest, Prisma, migration, CI workflow, E3, or AR-W3 file changed.

## Validation evidence

### Local remediation head

| Gate | Result |
|---|---|
| Manifest validator | **PASS**, read-only |
| Focused resolver/navigation Vitest | **PASS** — 3 files, 18 tests |
| Full `pnpm test` | **PASS** — 101 files passed, 7 skipped; 554 tests passed, 44 skipped |
| `pnpm type-check` | **PASS** |
| `pnpm lint` | **PASS** — 0 errors; 419 repository baseline warnings |
| `pnpm lint:boundaries:check` | **PASS** |
| `pnpm build` | **PASS** — 255 pages; missing local `DATABASE_URL` emitted non-fatal static-data diagnostics |
| Playwright discovery | **PASS** — 11 U3 tests discovered |
| Local Playwright execution | **ENVIRONMENT-LIMITED** — E2E credentials are not present locally; not claimed as PASS |
| `docs:audit-authority` | **PASS** — generated outputs were restored and excluded from the task diff |
| `docs:navigation` | **PASS** — 222 existing warnings |
| `docs:links` | **BASELINE-EXISTING FAIL** — `WAVE_EXECUTION_CONTRACT.md:13` references missing `../../OS_3_8_BLUEPRINT.md`; not changed in this fixed review scope |
| `git diff --check` | **PASS** |

### GitHub checks

Reviewed head `5ded0f14f07f610c4890e31b2c1f920be1e6ce56` passed Type Check + Lint + Build, Tests, E2E Secret Check, and E2E Tests before Architecture Review `4718251129`. The remediation exact head must pass the same required jobs after push; PR body evidence is updated only from actual GitHub results.

## Governance boundary

- U3 remains in Draft PR #93 and is not merged or marked complete.
- E3A, E3B, and AR-W3 were not started.
- No deployment, tag, release, production migration, production access, or production modification occurred.
- `release_gate` remains blocked; `auto_release`, `auto_deploy`, and `auto_tag` remain disabled.
