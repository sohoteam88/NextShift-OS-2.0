# OS 3.8 U2 — One-page Information Architecture

Status: **APPROVED BY STEVEN — pending governance PR merge**

Authorized baseline: `3a53527c9fe2096e14cce3849c275e6725883916`

Approval planning base: `f2f77709596fc74099d57dfe54bc009183c70c03`

Task: U2 only
Decision authority after review: `src/config/canonical-routes.ts` remains the single code authority.

Canonical IA authority: `docs/nextshift-os-3/os-3-8/3.8-C/U2_INFORMATION_ARCHITECTURE.md`. No other document may carry an independent OS 3.8 route map.

## Executive decision

Adopt one shared member information architecture for Retail and Recruitment. The workspace changes labels, examples, metrics, and task emphasis—not route identity or navigation structure.

Steven approved all five previously unresolved routes as Hide. `/automation`, `/blueprints`, `/franchise`, `/localization`, and `/saas` remain direct/deep-link accessible, receive no redirect or deletion authority, and may return to navigation only after separate product-positioning approval. This approval does not validate or expand their product capabilities.

| Destination | Canonical entry | User job | Desktop and mobile rule |
| --- | --- | --- | --- |
| Today | `/dashboard` | See the highest-leverage action and current operating state | Always first |
| Journey | `/journey` | Understand progress and resume the next mission | Shared route; workspace-specific copy |
| Brand | `/brand-builder/profile` | Build and maintain the business identity used by AI | Wizard steps stay contextual |
| Content | `/content-engine` | Generate, edit, save, and reopen canonical Content | Content Engine and Content Library stay in this same product area |
| Growth | `/revenue-drivers` | Choose and operate lead magnet, funnel, traffic, webinar, and conversion work | Child engines stay deep-linkable |
| Relationships | `/crm` | Manage leads/customers, pipeline, follow-up, and sales outcomes | Retail says customers; Recruitment says prospects/candidates |
| Team | `/ai-workforce` | Coordinate member-facing AI workforce execution | Recruitment emphasis; Retail remains compatible |

`/settings`, `/billing`, and `/help` are utilities, not primary destinations. Tenant administration (`/admin`) and Founder Console (`/platform-admin`) remain role-scoped experiences outside the seven member destinations.

“Team” is not one authorization domain. At the original reviewed U2 SHA, privileged human-team administration stayed at `/team` and `/team/members`; Amendment A below now supersedes that placement. The member destination remains `/ai-workforce`, team administration terminates under `/admin/*`, and platform operations terminate under `/superadmin/*`.

This corrects, but does not adopt, the preserved PR #87 hypothesis. In particular, the repository has no current authenticated pages at `/content`, `/library`, `/tools`, or `/learn`; U2 therefore does not create a second registry or approve speculative routes. The preserved `U2_IA_ONE_PAGER.md`, roadmap v1.2, and UI Constitution remain non-authoritative design inputs.

## Amendment A overlay — Three-Space Administration Isolation

Steven approved this overlay on 2026-07-17. The original 112-route map below remains the historical record of the approved U2 decision at its reviewed SHA; Amendment A supersedes only its administration-space rows, destinations, landing language, and implementation sequencing. It does not recalculate or claim a new complete authenticated-route count before U3A performs the new-space inventory.

- The member frontend keeps the approved seven desktop destinations and five-slot mobile projection. All member-facing navigation surfaces contain zero administration links; an administration space is entered only through an authorized direct URL.
- `/admin/*` is tenant administration. Only `leader` and `operator` may enter, with narrower route-level permissions preserved. Every read and mutation uses the authenticated session's tenant; query, path, body, or header `tenantId` is never authority. The shell displays a clear **ADMIN** identity.
- `/superadmin/*` is platform administration. Only `platform_admin` may enter. Every capability currently under `/platform-admin/*` or `/admin-command` migrates here. The shell displays a clear **PLATFORM** identity and is never included in member or team-admin navigation.
- `/platform-admin`, `/platform-admin/*`, and `/admin-command` become legacy compatibility GET paths. They use one-hop `301` redirects to `/superadmin`, the corresponding `/superadmin/*` path, or `/superadmin/command`, preserving only allowlisted query/bookmark state. They never redirect into `/admin/*` and never form chains.
- Team administration APIs use `/api/v1/admin/*`; platform administration APIs use `/api/v1/superadmin/*`. Their guards mirror the page space. Admin tenant identity is session-only. Superadmin target-tenant selection is explicit resource targeting, not a substitute for the platform role guard.
- API mutations never rely on `301`/`302`. The preferred migration is caller cutover followed by fail-closed retirement of the old mutation route. Any separately approved compatibility endpoint must use method-preserving `308` and identical guards, validation, auditing, and tenant semantics.
- Every superadmin write must emit a redacted `AuditLog` event. The U3ADR reviewed-decision proposal selects nullable `AuditLog.tenantId` plus an explicit tenant/platform scope for platform-global writes; it remains non-executable until exact-head PASS and separate production-runner adoption, and this governance overlay authorizes no Prisma change.

The following original matrix decisions are specifically superseded: `/team` becomes a compatibility GET to terminal `/admin/team`; `/team/members` becomes a compatibility GET to terminal `/admin/team/members`; `/team/growth` resolves directly to `/admin/team` without a redirect chain; `/workspace` and `/workspace/[...path]` are also team-admin compatibility paths. Leader/operator authorization and session-tenant scope are preserved or narrowed, while `platform_admin` is excluded from those legacy team routes.

The full implementation inventory and security contract is `U3_ADMIN_SPACE_SEPARATION_CONTRACT.md`. W3 inserts U3A, the U3ADR exact-head AuditLog decision gate, and U3B after the completed historical U3 task and before E3A. U3B remains blocked until a fresh PASS gate is adopted; E3A/E3B remain paused until U3B completes and is verified.

## Evidence and method

The inventory was generated from the exact baseline with reproducible searches:

```bash
find 'src/app/(auth)' -name page.tsx -print
rg -n "redirect\\(|href:|route:" 'src/app/(auth)' src/components/layouts src/modules/workspace src/modules/mission next.config.mjs
rg -n "CANONICAL_ROUTES|canonical-routes" src tests docs
rg -n "MobileTabBar|WorkspaceTopNavigation|AdminSidebar|Sidebar" src
rg -n "/content-engine|ContentCommandCenter|ContentLibrary" src tests docs
```

Measured coverage:

- 112 authenticated `page.tsx` routes.
- 18 entries in `CANONICAL_ROUTES`; all 18 resolve to real authenticated pages.
- 94 authenticated pages are not registered in `CANONICAL_ROUTES`.
- 0 registry entries lack a page.
- 59 routes are referenced by a currently mounted navigation surface or an active workspace navigation model.
- 35 non-alias routes are deep-link/context-only rather than navigation-visible.
- 6 dynamic authenticated routes.
- 23 routes are runtime redirects or compatibility aliases; the decision matrix assigns Redirect to 22 of them and keeps `/brand-builder` as the guarded activation entry because its destination depends on onboarding state.
- 0 routes remain unconfirmed.
- Current runtime member navigation is split: `WorkspaceTopNavigation` renders at most five filtered workspace entries on desktop; `MobileTabBar` renders five activation or growth tabs; the large legacy `Sidebar` is not mounted by `AppShell`.
- Founder Console has its own `AdminSidebar`.
- `/content-engine` mounts both `ContentCommandCenter` and `ContentLibrary`; no separate Library route is required.

## Decision semantics

- **Keep**: keep the route and capability. It may be primary, utility, admin, or contextual.
- **Merge**: consolidate the user job under the stated destination only after parity is proven; preserve the old deep link.
- **Hide**: remove only from future navigation. Do not delete code or data; direct/contextual access remains.
- **Redirect**: retain backward compatibility through an explicit, tested redirect.
- **Steven Decision Required**: no implementation until Steven resolves the listed product-authority question.

No Merge or Redirect may weaken the source route’s role, tenant, or capability boundary. A destination must preserve or strengthen every source authorization requirement before consolidation is allowed.

Every approved Merge or Redirect destination must resolve directly to a Keep route. Query-preserving destinations are normalized to their route path for this check. A destination must not target another Merge or Redirect decision.

Counts: **Keep 55 · Merge 9 · Hide 26 · Redirect 22 · Steven Decision Required 0 = 112 routes**.

## Complete authenticated route map

Retail and Recruitment use the same route identity. Separate applicability columns below make differences in emphasis or role scope explicit. Shared route identity is a navigation-layer constraint only; it does not merge or weaken mode-specific data, semantics, pipelines, or transitions.

| Canonical/current route | Page/module | User job | Current entry | Retail | Recruitment | Runtime authority | Decision | Destination | Deep-link strategy | Owner | Implementation slice | Dependency | Rationale / risk | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin-command` | Founder Console / Platform Operations | Operate the platform command dashboard | Founder direct/context | Founder-only | Founder-only | platform-admin role gate + `AdminCommandDashboard` | **Merge** | `/platform-admin` | Preserve the bookmark only after Founder Console exposes equivalent platform-command capability. | Platform / Founder Console | U3 IA consolidation | AR-W2 + STEVEN-IA; capability-parity and role-boundary check | Both routes are platform-admin privilege domain; never place this capability in Tenant Admin navigation or lose platform operations parity. | `admin-command/page.tsx` role guard + dashboard import |
| `/admin/ai-templates` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | redirect page | **Redirect** | `/admin/templates` | Preserve old URL with server redirect; query/path mapping must be tested. | Admin | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/admin/approvals` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/approvals` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/beta` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/beta` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/billing` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/billing` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/content` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/content` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/daily-actions` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/daily-actions` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/feedback` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/feedback` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/funnels` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/funnels` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/journey` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/journey` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/launch-readiness` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/launch-readiness` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/members` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/members` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/operations` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/operations` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/plan` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/plan` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/settings` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/settings` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/team` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/team` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/templates` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/templates` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/training` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/training` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/admin/users` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | role-gated admin page | **Keep** | `/admin/users` | Retain route; primary placement follows the target IA and role gates. | Admin | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + role guard |
| `/ai` | AI assistance | Get guided analysis or creation support | Contextual CTA | Yes | Yes | redirect page | **Redirect** | `/content-engine` | Preserve old URL with server redirect; query/path mapping must be tested. | AI | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/ai-workforce` | Member AI Workforce | Coordinate member-facing AI workforce execution | Primary Team destination | Yes | Yes (emphasis) | `WorkforceDashboard`; no equivalent operator/platform-admin gate | **Keep** | `/ai-workforce` | Retain the member-facing route; do not treat it as privileged human-team administration. | AI Workforce / Member Execution | U3 navigation only | AR-W2 + STEVEN-IA | Keep capability and authorization separate from `/team`, `/team/members`, and `/admin/team`. | canonical route + `ai-workforce/page.tsx` |
| `/ai/brand-builder` | AI assistance | Get guided analysis or creation support | Contextual CTA | Yes | Yes | redirect page | **Redirect** | `/brand-builder` | Preserve old URL with server redirect; query/path mapping must be tested. | AI | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/ai/coach` | AI assistance | Get guided analysis or creation support | Contextual CTA | Yes | Yes | authenticated page | **Keep** | `/ai/coach` | Retain route; primary placement follows the target IA and role gates. | AI | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/ai/content-plan` | Content | Create, edit, and reuse canonical content | Content context | Yes | Yes | redirect page | **Redirect** | `/content-engine` | Preserve old URL with server redirect; query/path mapping must be tested. | Content | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/ai/funnel-builder` | AI assistance | Get guided analysis or creation support | Contextual CTA | Yes | Yes | redirect page | **Redirect** | `/funnel` | Preserve old URL with server redirect; query/path mapping must be tested. | AI | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/ai/image` | AI assistance | Get guided analysis or creation support | Contextual CTA | Yes | Yes | authenticated page | **Keep** | `/ai/image` | Retain route; primary placement follows the target IA and role gates. | AI | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/ai/workforce` | AI assistance | Get guided analysis or creation support | Contextual CTA | Yes | Yes | redirect page | **Redirect** | `/ai-workforce` | Preserve old URL with server redirect; query/path mapping must be tested. | AI | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/analytics` | Insights | Review performance and next actions | Workspace/context | Yes | Yes | authenticated page | **Merge** | `/analytics-center` | Preserve bookmark with redirect or stable sub-route after destination reaches parity. | Insights | U3 IA consolidation | AR-W2 + STEVEN-IA; parity check | Destination must preserve capability and permissions. | auth route + consumer search |
| `/analytics-center` | Insights | Review performance and next actions | Workspace/context | Yes | Yes | authenticated page | **Keep** | `/analytics-center` | Retain route; primary placement follows the target IA and role gates. | Insights | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/automation` | Extended capability | Use a specialized business capability | Direct/legacy | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Hide from primary/mobile navigation; retain the current direct/deep link; no redirect, code/data deletion, or capability expansion is authorized. | Extended | U3 navigation only | AR-W2 + STEVEN-IA; separate product-positioning approval before navigation re-entry | Current capability is not validated or expanded by this approval. | auth route + consumer search |
| `/billing` | Account & support | Manage account or recover from access issues | Utility/direct | Yes | Yes | authenticated page | **Keep** | `/billing` | Retain route; primary placement follows the target IA and role gates. | Account | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/blueprints` | Extended capability | Use a specialized business capability | Direct/legacy | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Hide from primary/mobile navigation; retain the current direct/deep link; no redirect, code/data deletion, or capability expansion is authorized. | Extended | U3 navigation only | AR-W2 + STEVEN-IA; separate product-positioning approval before navigation re-entry | Current capability is not validated or expanded by this approval. | auth route + consumer search |
| `/brand-builder` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Keep** | `/brand-builder` | Retain route; primary placement follows the target IA and role gates. | Brand | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/brand-builder/calendar` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/brand-builder/guides` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/brand-builder/insights` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/brand-builder/intelligence` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/brand-builder/profile` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | canonical registry + page | **Keep** | `/brand-builder/profile` | Retain route; primary placement follows the target IA and role gates. | Brand | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/brand-builder/step/accounts` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/brand-builder/step/calendar` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/content-engine` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/brand-builder/step/complete` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/brand-builder/step/guides` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/brand-builder/step/interview` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | canonical registry + page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | canonical-routes + route page |
| `/brand-builder/step/profile` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | canonical registry + page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Brand | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | canonical-routes + route page |
| `/brand-builder/step/strategy` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/content-engine` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/brand-builder/video-script` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/video` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/brand-discovery` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Merge** | `/brand-builder/profile` | Preserve bookmark with redirect or stable sub-route after destination reaches parity. | Brand | U3 IA consolidation | AR-W2 + STEVEN-IA; parity check | Destination must preserve capability and permissions. | auth route + consumer search |
| `/brand-dna` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Merge** | `/brand-builder/profile` | Preserve bookmark with redirect or stable sub-route after destination reaches parity. | Brand | U3 IA consolidation | AR-W2 + STEVEN-IA; parity check | Destination must preserve capability and permissions. | auth route + consumer search |
| `/ceo-mode` | AI assistance | Get guided analysis or creation support | Contextual CTA | Yes | Yes | canonical registry + page | **Keep** | `/ceo-mode` | Retain route; primary placement follows the target IA and role gates. | AI | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/content-engine` | Content | Create, edit, and reuse canonical content | Content context | Yes | Yes | canonical registry + page | **Keep** | `/content-engine` | Retain route; primary placement follows the target IA and role gates. | Content | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/crm` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | canonical registry + page | **Keep** | `/crm` | Retain route; primary placement follows the target IA and role gates. | Relationships | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/crm-center` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | authenticated page | **Merge** | `/crm` | Preserve bookmark with redirect or stable sub-route after destination reaches parity. | Relationships | U3 IA consolidation | AR-W2 + STEVEN-IA; parity check | Destination must preserve capability and permissions. | auth route + consumer search |
| `/crm/[id]` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | dynamic page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Relationships | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/crm/customers` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Relationships | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/crm/pipeline` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Relationships | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/customers` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | redirect page | **Redirect** | `/crm` | Preserve old URL with server redirect; query/path mapping must be tested. | Relationships | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/dashboard` | Today & Journey | Understand priority and execute the next mission | Primary/context | Yes | Yes | canonical registry + page | **Keep** | `/dashboard` | Retain route; primary placement follows the target IA and role gates. | Today | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/franchise` | Extended capability | Use a specialized business capability | Direct/legacy | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Hide from primary/mobile navigation; retain the current direct/deep link; no redirect, code/data deletion, or capability expansion is authorized. | Extended | U3 navigation only | AR-W2 + STEVEN-IA; separate product-positioning approval before navigation re-entry | Current capability is not validated or expanded by this approval. | auth route + consumer search |
| `/funnel` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | canonical registry + page | **Keep** | `/funnel` | Retain route; primary placement follows the target IA and role gates. | Growth | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/funnel-builder` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | redirect page | **Redirect** | `/funnel` | Preserve old URL with server redirect; query/path mapping must be tested. | Growth | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/funnel-context` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | authenticated page | **Merge** | `/funnel` | Preserve bookmark with redirect or stable sub-route after destination reaches parity. | Growth | U3 IA consolidation | AR-W2 + STEVEN-IA; parity check | Destination must preserve capability and permissions. | auth route + consumer search |
| `/funnel/[id]/analytics` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | dynamic page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Growth | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/funnel/[id]/edit` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | dynamic page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Growth | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/help` | Account & support | Manage account or recover from access issues | Utility/direct | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Account | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/journey` | Today & Journey | Understand priority and execute the next mission | Primary/context | Yes | Yes | canonical registry + page | **Keep** | `/journey` | Retain route; primary placement follows the target IA and role gates. | Today | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/lead-magnet` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | canonical registry + page | **Keep** | `/lead-magnet` | Retain route; primary placement follows the target IA and role gates. | Growth | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/leads` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | canonical registry + page | **Merge** | `/crm` | Preserve bookmark with redirect or stable sub-route after destination reaches parity. | Relationships | U3 IA consolidation | AR-W2 + STEVEN-IA; parity check | Destination must preserve capability and permissions. | canonical-routes + route page |
| `/localization` | Extended capability | Use a specialized business capability | Direct/legacy | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Hide from primary/mobile navigation; retain the current direct/deep link; no redirect, code/data deletion, or capability expansion is authorized. | Extended | U3 navigation only | AR-W2 + STEVEN-IA; separate product-positioning approval before navigation re-entry | Current capability is not validated or expanded by this approval. | auth route + consumer search |
| `/member` | Team | Coordinate human and AI execution | Team/context | Yes | Yes (emphasis) | authenticated page | **Keep** | `/member` | Retain route; primary placement follows the target IA and role gates. | Team | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/member/daily-actions` | Team | Coordinate human and AI execution | Team/context | Yes | Yes (emphasis) | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Team | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/member/voice` | Team | Coordinate human and AI execution | Team/context | Yes | Yes (emphasis) | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Team | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/mission/[missionId]` | Today & Journey | Understand priority and execute the next mission | Primary/context | Yes | Yes | dynamic page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Today | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/onboarding` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | authenticated page | **Keep** | `/onboarding` | Retain route; primary placement follows the target IA and role gates. | Brand | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/onboarding/brand` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/brand-builder` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/onboarding/complete` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/dashboard` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/onboarding/first-content` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/content-engine` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/onboarding/first-funnel` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/funnel` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/onboarding/goals` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/brand-builder` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/onboarding/profile` | Brand & activation | Build or maintain business identity | Journey/context | Yes | Yes | redirect page | **Redirect** | `/brand-builder` | Preserve old URL with server redirect; query/path mapping must be tested. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/platform-admin` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/ai-profitability` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/ai-profitability` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/ai-usage` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/ai-usage` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/audit-logs` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/audit-logs` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/beta` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/beta` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/billing` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/billing` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/founder` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/founder` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/funnels` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/funnels` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/growth` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/growth` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/health` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/health` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/revenue` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/revenue` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/tenant-health` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/tenant-health` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/platform-admin/tenants` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | redirect page | **Redirect** | `/platform-admin?tab=tenants` | Preserve old URL with server redirect; query/path mapping must be tested. | Platform | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/platform-admin/users` | Founder Console | Operate the platform across tenants | Founder nav | Founder-only | Founder-only | platform-admin page | **Keep** | `/platform-admin/users` | Retain route; primary placement follows the target IA and role gates. | Platform | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | AdminSidebar + route page |
| `/revenue-drivers` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | authenticated page | **Keep** | `/revenue-drivers` | Retain route; primary placement follows the target IA and role gates. | Growth | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/saas` | Extended capability | Use a specialized business capability | Direct/legacy | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Hide from primary/mobile navigation; retain the current direct/deep link; no redirect, code/data deletion, or capability expansion is authorized. | Extended | U3 navigation only | AR-W2 + STEVEN-IA; separate product-positioning approval before navigation re-entry | Current capability is not validated or expanded by this approval. | auth route + consumer search |
| `/sales` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | canonical registry + page | **Merge** | `/crm` | Preserve bookmark with redirect or stable sub-route after destination reaches parity. | Relationships | U3 IA consolidation | AR-W2 + STEVEN-IA; parity check | Destination must preserve capability and permissions. | canonical-routes + route page |
| `/settings` | Account & support | Manage account or recover from access issues | Utility/direct | Yes | Yes | authenticated page | **Keep** | `/settings` | Retain route; primary placement follows the target IA and role gates. | Account | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/social-setup` | Brand & activation | Resume social-account setup | Journey/context | Yes | Yes | redirect page | **Redirect** | `/brand-builder` | Preserve social-setup intent through the guarded activation entry; U3 must not chain through a hidden step route. | Brand | U3 redirect verification | AR-W2 + STEVEN-IA; activation-flow check | Terminal destination is Keep; preserve the account-setup next step without a redirect chain. | `social-setup/page.tsx` + guarded `brand-builder/page.tsx` |
| `/team` | Human Team Administration | Manage the human-team hierarchy and member details | Privileged direct/context | Operator/platform-admin only | Operator/platform-admin only | role-gated `TeamOverviewDashboard` tree view | **Keep** | `/team` | Retain the privileged route and its member-to-dashboard denial. | Tenant Admin / Team Administration | U3 navigation/role-boundary only | AR-W2 + STEVEN-IA | Must not merge into member-facing `/ai-workforce`; preserve operator/platform-admin authorization. | `team/page.tsx` role guard + tree view |
| `/team/growth` | Human Team Administration alias | Enter privileged human-team administration through the legacy growth URL | Privileged compatibility alias | Operator/platform-admin only | Operator/platform-admin only | redirect to role-gated `/team` | **Redirect** | `/team` | Keep a single hop to terminal Keep route `/team`; the destination enforces the operator/platform-admin boundary. | Tenant Admin / Team Administration | U3 redirect verification | AR-W2 + STEVEN-IA; role-boundary check | Member access must still terminate at `/dashboard`; the redirect cannot confer access to `TeamOverviewDashboard`. | `team/growth/page.tsx` + `team/page.tsx` role guard |
| `/team/members` | Human Team Administration | Manage the human-team member list and selected member details | Privileged direct/context | Operator/platform-admin only | Operator/platform-admin only | role-gated `TeamOverviewDashboard` list view | **Keep** | `/team/members` | Retain the privileged list route and its member-to-dashboard denial. | Tenant Admin / Team Administration | U3 navigation/role-boundary only | AR-W2 + STEVEN-IA | Must not merge into member-facing `/ai-workforce`; preserve operator/platform-admin authorization. | `team/members/page.tsx` role guard + list view |
| `/traffic-engine` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | canonical registry + page | **Keep** | `/traffic-engine` | Retain route; primary placement follows the target IA and role gates. | Growth | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/unauthorized` | Account & support | Manage account or recover from access issues | Utility/direct | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Account | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/video` | Content | Create, edit, and reuse canonical content | Content context | Yes | Yes | authenticated page | **Keep** | `/video` | Retain route; primary placement follows the target IA and role gates. | Content | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | auth route + consumer search |
| `/video-production` | Content | Create, edit, and reuse canonical content | Content context | Yes | Yes | authenticated page | **Merge** | `/video` | Preserve bookmark with redirect or stable sub-route after destination reaches parity. | Content | U3 IA consolidation | AR-W2 + STEVEN-IA; parity check | Destination must preserve capability and permissions. | auth route + consumer search |
| `/video/[id]` | Content | Create, edit, and reuse canonical content | Content context | Yes | Yes | dynamic page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Content | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/video/new` | Content | Create, edit, and reuse canonical content | Content context | Yes | Yes | authenticated page | **Hide** | `Contextual/deep-link only` | Remove from future primary nav only; retain direct URL and back/forward behavior. | Content | U3 navigation only | AR-W2 + STEVEN-IA; parity check | Do not confuse hide with deletion. | auth route + consumer search |
| `/webinar-center` | Growth | Build and operate acquisition paths | Growth/context | Yes | Yes | canonical registry + page | **Keep** | `/webinar-center` | Retain route; primary placement follows the target IA and role gates. | Growth | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/whatsapp-ai` | Relationships | Capture, follow up, and convert relationships | Growth/context | Yes | Yes | canonical registry + page | **Keep** | `/whatsapp-ai` | Retain route; primary placement follows the target IA and role gates. | Relationships | U3 navigation only | AR-W2 + STEVEN-IA | Avoid duplicate nav entries. | canonical-routes + route page |
| `/workspace` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | redirect page | **Redirect** | `/admin` | Preserve old URL with server redirect; query/path mapping must be tested. | Admin | U3 redirect verification | AR-W2 + STEVEN-IA; parity check | Avoid chains and preserve parameters. | route page/next redirect |
| `/workspace/[...path]` | Tenant administration | Operate members, content, billing, and launch | Admin context | Role-scoped | Role-scoped | redirect page | **Redirect** | `/admin` | Resolve each legacy suffix only to a verified terminal Keep admin route; otherwise use `/admin`. | Admin | U3 redirect verification | AR-W2 + STEVEN-IA; suffix and role-boundary check | Matrix destination is terminal Keep; preserve a suffix only when the exact target is also Keep and role-equivalent. | route page/next redirect |

## Navigation model

### Desktop

Desktop member navigation exposes the seven approved destinations in order: Today, Journey, Brand, Content, Growth, Relationships, Team. Workspace presentation changes labels and job emphasis only. Account utilities remain in the profile/settings affordance. Operator and platform-admin users continue to land in their role-specific consoles.

### Mobile

Mobile uses the same seven-destination tree, projected into five persistent slots rather than a competing IA:

1. Today
2. Content
3. Growth
4. Relationships
5. More

“More” exposes Journey, Brand, Team, Settings, Billing, and Help. Activation may temporarily promote Journey and Brand tasks, but those links must resolve to the same canonical destinations. U3 must replace the current unrelated activation/growth arrays with one approved projection and test Retail and Recruitment variants.

### Starting-account guidance and learning ownership

The canonical navigation home for starting-account guidance and staged learning is **Journey — `/journey`**.

- Starting-account guidance, staged learning, the next task, and progress resumption all belong to Journey.
- Educational content in Brand, Content, and Growth is contextual guidance or a deep link, not a second learning center.
- Do not create `/learn`, `/academy`, or another learning destination.
- Journey owns the canonical order for “what should I do now?” and “what comes next?”.
- Brand owns brand assets and configuration tasks.
- Content owns generation, editing, saving, and reopening work.
- Growth owns acquisition, funnel, traffic, Webinar, and related execution work.
- On mobile, Journey remains under More; Today may elevate the current Journey next step as the single primary CTA.
- U3 must ensure that users never see multiple competing “next steps”.

This approval adopts only Roadmap v1.2 B5's navigation-ownership constraint. It does not approve any other Roadmap v1.2 Stage B or Stage C capability expansion.

### Retail and Recruitment mode-data invariant

Shared route identity is a navigation-layer constraint only.

- Retail and Recruitment share route paths, the navigation tree, and destination identity.
- Shared navigation must not merge or weaken mode data isolation; `mode` remains a first-class data field.
- CRM and relationship pipelines retain distinct Retail and Recruitment business semantics and data boundaries. Sharing `/crm` must not turn the dual pipelines into one mixed pipeline.
- Content, calendars, funnels, objection libraries, and Business Score continue to expose the correct mode-specific semantics and data isolation.
- The graduation bridge remains an explicit, auditable state transition; shared route identity must never move data across modes implicitly.
- U3 may unify navigation only. It may not refactor or merge the mode data model as a side effect.
- If current code cannot prove this isolation, U3 must fail closed and create a separate architecture task rather than guessing an implementation.

### Landing, naming, and direct access

- Authenticated members land on `/dashboard`; operators land on `/admin`; platform admins land on `/platform-admin`.
- A valid contextual deep link remains valid after login and must not be replaced by a generic landing unless role or tenant policy forbids access.
- Page titles and navigation labels use the destination names above. Workspace-specific wording may qualify a label (for example, Customer Relationships versus Opportunity Relationships) without changing its route identity.
- Hidden routes stay direct-access/contextual routes. They are not listed in primary navigation, but breadcrumbs, in-product CTAs, refresh, and browser history remain supported.
- Redirects preserve practical bookmarks and relevant query/path parameters, avoid redirect chains, and are covered by explicit compatibility tests before U3 closes.
- Content Library remains a discoverable mode inside the Content area at `/content-engine`, alongside Content Engine generation/editor work.

## Steven approval record

Steven's approval explicitly accepts every group below, subject to the authorization boundaries in `STEVEN_IA_APPROVAL.md`.

### Target primary navigation

- Seven desktop destinations: Today, Journey, Brand, Content, Growth, Relationships, Team.
- Five-slot mobile projection: Today, Content, Growth, Relationships, More; More contains Journey, Brand, Team, and account utilities.
- Retail and Recruitment share route identity only at the navigation layer; `mode`, dual pipelines, and the auditable graduation bridge remain isolated.
- Journey `/journey` owns starting-account guidance, staged learning, the canonical next task, and progress resumption; no `/learn`, `/academy`, or second learning center is approved.
- Tenant Admin and Founder Console remain separate role-scoped navigation systems.
- Historical reviewed-map statement (superseded by Amendment A): member Team meant `/ai-workforce`, privileged human-team administration used `/team` and `/team/members`, tenant command used `/admin/team`, and platform operations used `/admin-command` and `/platform-admin`.

### Merge decisions (9)

- `/admin-command` → `/platform-admin`, only after platform-admin role and `AdminCommandDashboard` capability parity are verified
- `/analytics` → `/analytics-center`
- `/brand-discovery` → `/brand-builder/profile`
- `/brand-dna` → `/brand-builder/profile`
- `/crm-center` → `/crm`
- `/funnel-context` → `/funnel`
- `/leads` → `/crm`
- `/sales` → `/crm`
- `/video-production` → `/video`

### Hide decisions (26)

- Brand context: `/brand-builder/calendar`, `/brand-builder/guides`, `/brand-builder/insights`, `/brand-builder/intelligence`, `/brand-builder/step/accounts`, `/brand-builder/step/complete`, `/brand-builder/step/guides`, `/brand-builder/step/interview`, `/brand-builder/step/profile`.
- Relationship detail: `/crm/[id]`, `/crm/customers`, `/crm/pipeline`.
- Funnel detail: `/funnel/[id]/analytics`, `/funnel/[id]/edit`.
- Context/support: `/help`, `/member/daily-actions`, `/member/voice`, `/mission/[missionId]`, `/unauthorized`.
- Video detail: `/video/[id]`, `/video/new`.
- Extended direct-access capabilities: `/automation`, `/blueprints`, `/franchise`, `/localization`, `/saas`. Hide each from primary/mobile navigation, preserve its current direct/deep link, create no redirect, and grant no deletion or capability-expansion authority. Re-entry into navigation requires separate product-positioning approval.

### Redirect decisions (22)

- Admin compatibility: `/admin/ai-templates` → `/admin/templates`; `/workspace` → `/admin`; `/workspace/[...path]` → terminal `/admin` or an exact role-equivalent Keep child.
- AI aliases: `/ai` → `/content-engine`; `/ai/brand-builder` → `/brand-builder`; `/ai/content-plan` → `/content-engine`; `/ai/funnel-builder` → `/funnel`; `/ai/workforce` → `/ai-workforce`.
- Brand aliases: `/brand-builder/step/calendar` and `/brand-builder/step/strategy` → `/content-engine`; `/brand-builder/video-script` → `/video`; `/social-setup` → guarded terminal `/brand-builder`.
- Historical reviewed-map aliases (Amendment A supersedes the team entry): `/customers` → `/crm`; `/funnel-builder` → `/funnel`; `/team/growth` formerly targeted `/team` and now resolves directly to terminal `/admin/team`.
- Onboarding aliases: `/onboarding/brand`, `/onboarding/goals`, and `/onboarding/profile` → `/brand-builder`; `/onboarding/complete` → `/dashboard`; `/onboarding/first-content` → `/content-engine`; `/onboarding/first-funnel` → `/funnel`.
- Founder compatibility: `/platform-admin/tenants` → `/platform-admin?tab=tenants`.

### Steven Decision Required (0)

Steven resolved all five items as Hide: `/automation`, `/blueprints`, `/franchise`, `/localization`, and `/saas`. This resolution affects navigation visibility only and does not validate capability, authorize redirect/deletion, or approve future navigation placement.

### Policies and implementation boundary

- Approve the deep-link/redirect policy and the rule that Hide never means deletion.
- Approve the role-boundary invariant: no Merge or Redirect may weaken source role, tenant, or capability requirements.
- Approve the terminal-destination invariant: every Merge/Redirect resolves directly to Keep after query normalization; no destination may target another Merge or Redirect.
- Approve Content Engine + Content Library as one Content product area.
- Approve U1B remaining blocked by AR-W2 plus STEVEN-IA; U2 does not authorize removal.
- Approve U3 as the later implementation slice for navigation projection, naming, redirects, and tests. No U3 code is authorized by merely opening this Draft PR.


## Navigation convergence rules for U3

1. Desktop and mobile must consume one approved IA projection. Do not maintain unrelated hard-coded destination sets.
2. `CANONICAL_ROUTES` remains the code authority; any registry expansion is a reviewed U3 code change, not a second registry.
3. Workspace configuration may change labels and ordering emphasis, but must point to the same route identities.
4. Content Engine and Content Library remain discoverable together at `/content-engine`.
5. Every Merge or Redirect keeps the old URL until deep-link, query, bookmark, role, and back-button tests pass.
6. Hide never authorizes deletion. U1A `ORPHAN_CANDIDATE` and `UNCERTAIN` findings remain subject to separate U1B authority.
7. Admin and Founder navigation stay role-gated and do not consume member mobile slots.
8. Existing `Sidebar.tsx` is not a runtime navigation authority unless U3 deliberately remounts it; its entries are evidence of historical intent only.
9. No Merge or Redirect may weaken the source route’s role, tenant, or capability boundary; the destination must preserve or strengthen it.
10. Every Merge or Redirect destination must normalize directly to a Keep route. It cannot target another Merge or Redirect.
11. Historical reviewed-map decision, superseded only for placement by Amendment A: `/team`, `/team/members`, and `/team/growth` held privileged human-team administration; their capability now moves to `/admin/*`, platform access is removed, and `/ai-workforce` remains the separate member-facing AI workforce destination.
12. `/admin-command` remains Founder/platform-admin-only and never enters Tenant Admin navigation; any merge requires platform-command capability parity.

## Final Steven decision summary

Steven approved the seven desktop destinations, five-slot mobile projection, complete 112-route map, and all governance invariants in this document. The five formerly unresolved routes are Hide, leaving zero Steven Decision Required routes. This approval also fixes B5 learning ownership at Journey `/journey`, limits shared Retail/Recruitment route identity to the navigation layer, and preserves mode as a first-class field, dual pipelines, and the explicit graduation bridge.

## Deferred governance and U1A cross-reference

- U1A’s inactive Content dashboards remain inventory evidence only. U2 does not authorize deletion.
- `ContentEngineDashboard` is not promoted to runtime authority; the current `/content-engine` composition is authoritative.
- PR #87 is archival Draft input only. No commit was merged or cherry-picked.
- Roadmap v1.2 B5 is adopted only for Journey navigation ownership, and §1.6 is adopted only as the mode-data isolation invariant stated above. The remaining Roadmap v1.2 and UI Constitution proposals require independent approval.
- This approval does not approve any other Stage B/C capability expansion in the preserved roadmap proposal.

## Explicit non-actions

This governance revision changes only the approved IA documentation, STEVEN-IA artifact, and Manifest gate status. It changes no product code, route, navigation implementation, redirect, test, Prisma, Pipeline, U1B/U3 task state, deployment, tag, release, or production state. Approval unlocks only later controlled W3 task selection after this governance PR is reviewed and merged.
